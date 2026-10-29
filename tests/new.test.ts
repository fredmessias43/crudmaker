import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CliIo, run } from "../src/cli";
import { CommandRunner, RunOptions, RunResult } from "../src/commandRunner";
import { composerImage, dockerRunArgs, scaffoldSteps } from "../src/scaffold";

const fixture = path.join(__dirname, "fixtures/curso/manifest.json");

type Call = { command: string; args: string[]; options?: RunOptions };

/** Executor falso: registra as chamadas e não roda nada. `fail` decide o resultado de cada chamada. */
class FakeRunner implements CommandRunner {
  calls: Call[] = [];
  constructor(private fail: (call: Call) => Partial<RunResult> | undefined = () => undefined) {}

  run(command: string, args: string[], options?: RunOptions): RunResult {
    const call = { command, args, options };
    this.calls.push(call);
    return { status: 0, stdout: "", stderr: "", ...this.fail(call) };
  }

  /** Chamadas de `docker run` (os passos do scaffold), sem o `docker info`. */
  get steps(): Call[] {
    return this.calls.filter((call) => call.args[0] === "run");
  }

  /** O comando rodado dentro do container: tudo depois da imagem. */
  inner(call: Call): string[] {
    return call.args.slice(call.args.findIndex((arg) => arg.startsWith("laravelsail/")) + 1);
  }
}

let tmp: string;
let stdout: string;
let stderr: string;

const io = (runner: CommandRunner): CliIo => ({
  stdout: (t) => (stdout += t),
  stderr: (t) => (stderr += t),
  cwd: tmp,
  now: () => new Date(2025, 0, 2, 3, 4, 5),
  runner,
  composerHome: path.join(tmp, "composer-home"),
  user: { uid: 1234, gid: 5678 },
});

/** O passo `generate` escreve em disco: o executor falso não cria o projeto, então o dir fica só com o que o generate gerar. */
function runNew(args: string[], runner: CommandRunner): number {
  return run(["new", ...args], io(runner));
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-new-"));
  stdout = "";
  stderr = "";
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("crudmaker new: sequência de comandos", () => {
  it("usa o padrão (Laravel 12, PHP 8.2, MySQL) e roda os 5 passos em ordem, com a geração no fim", () => {
    const runner = new FakeRunner();
    const dir = path.join(tmp, "api");
    expect(runNew([dir, fixture], runner)).toBe(0);

    expect(runner.calls[0]).toMatchObject({ command: "docker", args: ["info"] });
    expect(runner.steps.map((call) => runner.inner(call))).toEqual([
      ["composer", "create-project", "laravel/laravel:^12.0", ".", "--no-interaction", "--prefer-dist"],
      ["php", "artisan", "install:api", "--no-interaction", "--without-migration-prompt"],
      ["composer", "require", "--dev", "pestphp/pest", "pestphp/pest-plugin-laravel", "--with-all-dependencies", "--no-interaction"],
      ["php", "vendor/bin/pest", "--init", "--no-interaction"],
      ["php", "artisan", "sail:install", "--with=mysql", "--php=8.2", "--no-interaction"],
    ]);
    // a geração rodou no mesmo processo (sem container) e escreveu no diretório
    expect(fs.existsSync(path.join(dir, "manifest-lock.json"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "routes/crudmaker.php"))).toBe(true);
    expect(stdout).toContain("Versão usada: Laravel 12 (padrão), PHP 8.2 (padrão)");
    expect(stdout).toContain("./vendor/bin/sail up -d");
    expect(stdout).toContain("./vendor/bin/sail artisan migrate");
    expect(stderr).toBe("");
  });

  it("passa os passos de stdio herdado, para a saída aparecer em tempo real", () => {
    const runner = new FakeRunner();
    runNew([path.join(tmp, "api"), fixture], runner);
    expect(runner.steps.every((call) => call.options?.stdio === "inherit")).toBe(true);
  });

  it.each([
    ["8.1", "laravelsail/php81-composer:latest"],
    ["8.2", "laravelsail/php82-composer:latest"],
    ["8.3", "laravelsail/php83-composer:latest"],
    ["8.4", "laravelsail/php84-composer:latest"],
  ])("escolhe a imagem pelo PHP alvo: %s", (php, image) => {
    expect(composerImage(php as "8.1")).toBe(image);
  });

  it("erra com mensagem clara quando não existe imagem para o PHP", () => {
    const runner = new FakeRunner();
    expect(runNew([path.join(tmp, "api"), fixture, "--php", "8.5"], runner)).toBe(1);
    expect(stderr).toContain("laravelsail/php85-composer");
    expect(stderr).toContain("8.1, 8.2, 8.3, 8.4");
    expect(runner.calls).toEqual([]);
    expect(fs.existsSync(path.join(tmp, "api"))).toBe(false);
  });

  it("--php escolhe a imagem usada em todos os passos", () => {
    const runner = new FakeRunner();
    runNew([path.join(tmp, "api"), fixture, "--php", "8.4"], runner);
    expect(runner.steps).toHaveLength(5);
    for (const call of runner.steps) expect(call.args).toContain("laravelsail/php84-composer:latest");
    expect(stdout).toContain("PHP 8.4 (flag)");
    expect(runner.inner(runner.steps[4])).toContain("--php=8.4");
  });

  it("passa a versão do Laravel ao composer (^N.0)", () => {
    const runner = new FakeRunner();
    runNew([path.join(tmp, "api"), fixture, "--laravel", "11"], runner);
    expect(runner.inner(runner.steps[0])).toContain("laravel/laravel:^11.0");
    expect(stdout).toContain("Laravel 11 (flag)");
  });

  it("Laravel 10 não roda install:api e pode usar PHP 8.1", () => {
    const runner = new FakeRunner();
    runNew([path.join(tmp, "api"), fixture, "--laravel", "10", "--php", "8.1"], runner);
    const inner = runner.steps.map((call) => runner.inner(call));
    expect(inner.some((command) => command.includes("install:api"))).toBe(false);
    expect(inner).toHaveLength(4);
    expect(runner.steps[0].args).toContain("laravelsail/php81-composer:latest");
    expect(inner[0]).toContain("laravel/laravel:^10.0");
  });

  it("Laravel 11 e 12 rodam install:api sem a pergunta das migrations", () => {
    for (const laravel of ["11", "12"]) {
      const runner = new FakeRunner();
      runNew([path.join(tmp, `api${laravel}`), fixture, "--laravel", laravel, "--skip-generate"], runner);
      expect(runner.steps.map((call) => runner.inner(call))).toContainEqual(["php", "artisan", "install:api", "--no-interaction", "--without-migration-prompt"]);
    }
  });

  it("a versão vem do pkg.target do manifest quando não há flag, e a flag vence", () => {
    const manifest = path.join(tmp, "m.json");
    const obj = JSON.parse(fs.readFileSync(fixture, "utf8"));
    obj.pkg.target = { laravel: 11, php: "8.3" };
    fs.writeFileSync(manifest, JSON.stringify(obj));

    const fromManifest = new FakeRunner();
    runNew([path.join(tmp, "a"), manifest, "--skip-generate"], fromManifest);
    expect(fromManifest.inner(fromManifest.steps[0])).toContain("laravel/laravel:^11.0");
    expect(fromManifest.steps[0].args).toContain("laravelsail/php83-composer:latest");
    expect(stdout).toContain("Laravel 11 (manifest), PHP 8.3 (manifest)");

    const flagWins = new FakeRunner();
    runNew([path.join(tmp, "b"), manifest, "--laravel", "12", "--skip-generate"], flagWins);
    expect(flagWins.inner(flagWins.steps[0])).toContain("laravel/laravel:^12.0");
    expect(flagWins.steps[0].args).toContain("laravelsail/php83-composer:latest");
  });

  it("respeita o PHP mínimo do Laravel e não toca em nada", () => {
    const runner = new FakeRunner();
    expect(runNew([path.join(tmp, "api"), fixture, "--laravel", "12", "--php", "8.1"], runner)).toBe(1);
    expect(stderr).toContain("mínimo do Laravel 12");
    expect(runner.calls).toEqual([]);
    expect(fs.existsSync(path.join(tmp, "api"))).toBe(false);
  });
});

describe("crudmaker new: docker run", () => {
  it("monta o diretório como volume, usa o UID/GID do host, COMPOSER_HOME gravável e remove o container", () => {
    const runner = new FakeRunner();
    const dir = path.join(tmp, "api");
    runNew([dir, fixture, "--skip-generate"], runner);

    for (const call of runner.steps) {
      expect(call.command).toBe("docker");
      expect(call.args.slice(0, 2)).toEqual(["run", "--rm"]);
      expect(call.args).toEqual(expect.arrayContaining(["--user", "1234:5678"]));
      expect(call.args).toEqual(expect.arrayContaining(["-v", `${dir}:/var/www/html`, "-w", "/var/www/html"]));
      expect(call.args).toEqual(expect.arrayContaining(["-v", `${path.join(tmp, "composer-home")}:/composer`, "-e", "COMPOSER_HOME=/composer"]));
    }
    // o diretório de cache existe no host (criado pelo usuário, não pelo Docker como root)
    expect(fs.existsSync(path.join(tmp, "composer-home"))).toBe(true);
  });

  it("sem UID/GID disponíveis, não passa --user", () => {
    const step = scaffoldSteps({ dir: "/x", laravel: 12, php: "8.2", database: "mysql", sail: false, composerHome: "/c" })[0];
    const args = dockerRunArgs({ dir: "/x", laravel: 12, php: "8.2", database: "mysql", sail: false, composerHome: "/c" }, step);
    expect(args).not.toContain("--user");
  });
});

describe("crudmaker new: Sail e geração", () => {
  it.each([
    ["mysql", "--with=mysql"],
    ["pgsql", "--with=pgsql"],
    ["mariadb", "--with=mariadb"],
    ["sqlite", "--with=none"],
  ])("--db %s vira %s no sail:install", (db, expected) => {
    const runner = new FakeRunner();
    runNew([path.join(tmp, "api"), fixture, "--db", db, "--skip-generate"], runner);
    const sail = runner.inner(runner.steps[runner.steps.length - 1]);
    expect(sail.slice(0, 3)).toEqual(["php", "artisan", "sail:install"]);
    expect(sail).toContain(expected);
    expect(sail).toContain("--no-interaction");
  });

  it("recusa banco desconhecido", () => {
    const runner = new FakeRunner();
    expect(runNew([path.join(tmp, "api"), fixture, "--db", "oracle"], runner)).toBe(1);
    expect(stderr).toContain("--db");
    expect(runner.calls).toEqual([]);
  });

  it("--no-sail não roda o sail:install e mostra o caminho via Docker nos próximos passos", () => {
    const runner = new FakeRunner();
    expect(runNew([path.join(tmp, "api"), fixture, "--no-sail", "--skip-generate"], runner)).toBe(0);
    expect(runner.steps.map((call) => runner.inner(call).join(" ")).some((command) => command.includes("sail:install"))).toBe(false);
    expect(runner.steps).toHaveLength(4);
    expect(stdout).toContain("Sail: não instalado");
    expect(stdout).not.toContain("./vendor/bin/sail");
    expect(stdout).toContain("php artisan serve");
  });

  it("--no-sail não combina com --db", () => {
    const runner = new FakeRunner();
    expect(runNew([path.join(tmp, "api"), fixture, "--no-sail", "--db", "pgsql"], runner)).toBe(1);
    expect(stderr).toContain("--no-sail");
    expect(runner.calls).toEqual([]);
  });

  it("--skip-generate cria só o projeto: nada é gerado e o resumo diz como gerar depois", () => {
    const runner = new FakeRunner();
    const dir = path.join(tmp, "api");
    expect(runNew([dir, fixture, "--skip-generate"], runner)).toBe(0);
    expect(fs.existsSync(path.join(dir, "manifest-lock.json"))).toBe(false);
    expect(stdout).toContain("API gerada: não (--skip-generate)");
    expect(stdout).toContain("crudmaker generate");
  });
});

describe("crudmaker new: pré-checagens", () => {
  it("recusa diretório existente e não vazio, sem rodar nada nem tocar nele", () => {
    const dir = path.join(tmp, "api");
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, ".hidden"), "meu");
    const runner = new FakeRunner();

    expect(runNew([dir, fixture], runner)).toBe(1);
    expect(stderr).toContain("não está vazio");
    expect(runner.calls).toEqual([]);
    expect(fs.readdirSync(dir)).toEqual([".hidden"]);
    expect(fs.readFileSync(path.join(dir, ".hidden"), "utf8")).toBe("meu");
  });

  it("aceita diretório existente e vazio", () => {
    const dir = path.join(tmp, "api");
    fs.mkdirSync(dir);
    expect(runNew([dir, fixture, "--skip-generate"], new FakeRunner())).toBe(0);
  });

  it("recusa quando o destino é um arquivo", () => {
    const file = path.join(tmp, "api");
    fs.writeFileSync(file, "x");
    const runner = new FakeRunner();
    expect(runNew([file, fixture], runner)).toBe(1);
    expect(stderr).toContain("não é um diretório");
    expect(runner.calls).toEqual([]);
  });

  it("erro claro quando o Docker não está instalado", () => {
    const runner = new FakeRunner(() => ({ status: null, error: Object.assign(new Error("spawn docker ENOENT"), { code: "ENOENT" }) }));
    expect(runNew([path.join(tmp, "api"), fixture], runner)).toBe(1);
    expect(stderr).toContain("Docker não encontrado");
    expect(runner.calls).toHaveLength(1);
    expect(fs.existsSync(path.join(tmp, "api"))).toBe(false);
  });

  it("erro claro quando o daemon não responde", () => {
    const runner = new FakeRunner(() => ({ status: 1, stderr: "Cannot connect to the Docker daemon at unix:///var/run/docker.sock.\n" }));
    expect(runNew([path.join(tmp, "api"), fixture], runner)).toBe(1);
    expect(stderr).toContain("daemon não respondeu");
    expect(stderr).toContain("Cannot connect to the Docker daemon");
    expect(runner.steps).toEqual([]);
    expect(fs.existsSync(path.join(tmp, "api"))).toBe(false);
  });

  it("manifest inválido falha antes de qualquer container e sem criar o diretório", () => {
    const manifest = path.join(tmp, "ruim.json");
    fs.writeFileSync(manifest, JSON.stringify({ system: { title: "x", code: "x" }, pkg: { code: "x", entities: { a: { fields: { id: "uuid", b_id: "uuid" }, relationships: { belongsTo: ["nao_existe"] } } } } }));
    const runner = new FakeRunner();

    expect(runNew([path.join(tmp, "api"), manifest], runner)).toBe(1);
    expect(stderr).toContain("naoExiste");
    expect(runner.calls).toEqual([]);
    expect(fs.existsSync(path.join(tmp, "api"))).toBe(false);
  });

  it("manifest inexistente falha antes de qualquer container", () => {
    const runner = new FakeRunner();
    expect(runNew([path.join(tmp, "api"), path.join(tmp, "nao-existe.json")], runner)).toBe(1);
    expect(stderr).toContain("Manifest não encontrado");
    expect(runner.calls).toEqual([]);
  });

  it("exige o diretório e o manifest", () => {
    const runner = new FakeRunner();
    expect(runNew([path.join(tmp, "api")], runner)).toBe(1);
    expect(stderr).toContain("crudmaker new <dir> <manifest>");
  });
});

describe("crudmaker new: falha de um passo", () => {
  it("para no passo que falhou, diz qual foi, mantém o diretório e não gera a API", () => {
    const runner = new FakeRunner((call) => (call.args.includes("require") ? { status: 2 } : undefined));
    const dir = path.join(tmp, "api");

    expect(runNew([dir, fixture], runner)).toBe(1);
    expect(stderr).toContain("O passo 3/5 falhou");
    expect(stderr).toContain("composer require --dev pestphp/pest");
    expect(stderr).toContain("código de saída 2");
    expect(stderr).toContain("foi mantido");
    expect(stderr).toContain("docker run --rm");
    // os passos seguintes não rodaram, o diretório parcial continua lá e nada foi gerado
    expect(runner.steps).toHaveLength(3);
    expect(fs.existsSync(dir)).toBe(true);
    expect(fs.existsSync(path.join(dir, "manifest-lock.json"))).toBe(false);
    expect(stdout).not.toContain("Projeto criado");
  });

  it("falha ao iniciar o docker num passo também aponta o passo", () => {
    const runner = new FakeRunner((call) => (call.args[0] === "run" ? { status: null, error: new Error("spawn docker EACCES") } : undefined));
    expect(runNew([path.join(tmp, "api"), fixture], runner)).toBe(1);
    expect(stderr).toContain("O passo 1/5 falhou (composer create-project laravel/laravel:^12.0)");
    expect(stderr).toContain("EACCES");
  });
});

describe("crudmaker new: ajuda", () => {
  it("--help mostra o uso sem rodar nada", () => {
    const runner = new FakeRunner();
    expect(run(["new", "--help"], io(runner))).toBe(0);
    expect(stdout).toContain("crudmaker new <dir> <manifest>");
    expect(runner.calls).toEqual([]);
  });
});
