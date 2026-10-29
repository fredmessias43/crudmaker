import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { generate } from "../src/generate";
import { TargetVersion } from "../src/targetVersion";
import { phpSyntaxAllowlist } from "./phpSyntaxAllowlist";

/**
 * Imagem oficial do PHP usada no `php -l`. Fixada na versão mínima que a spec v2 promete suportar
 * (PHP 8.1+): se o código gerado parseia no 8.1, parseia nas versões mais novas. Pode ser trocada
 * pela variável de ambiente `CRUDMAKER_PHP_IMAGE` (ex.: `php:8.3-cli`) para investigar.
 */
export const phpImage = process.env.CRUDMAKER_PHP_IMAGE || "php:8.1-cli";

const fixturesDir = path.join(__dirname, "../tests/fixtures");

/** Data fixa: a saída (e o nome das migrations) não depende do dia em que a checagem roda. */
const now = new Date(2025, 0, 2, 3, 4, 5);

export type PhpFailure = { file: string; message: string };
export type PhpCheckResult = { total: number; failures: PhpFailure[] };

/**
 * Roda no container, dentro de `/work` (somente leitura). Um único `sh` percorre todos os `.php`
 * e imprime `FAIL<TAB>arquivo<TAB>mensagem` para cada falha e `TOTAL<TAB>n` no fim.
 * `display_errors=0` + `log_errors=1` deixam só uma linha "PHP Parse error: ..." (no stderr).
 */
const containerScript = [
  "total=0",
  "while IFS= read -r f; do",
  "  total=$((total+1))",
  '  if ! out=$(php -d display_errors=0 -d log_errors=1 -l "$f" 2>&1); then',
  '    msg=$(printf "%s" "$out" | head -n 1 | tr "\\t" " ")',
  '    printf "FAIL\\t%s\\t%s\\n" "${f#./}" "$msg"',
  "  fi",
  "done <<EOF_LIST",
  "$(find . -name '*.php' | sort)",
  "EOF_LIST",
  'printf "TOTAL\\t%s\\n" "$total"',
].join("\n");

export function dockerAvailable(): boolean {
  return spawnSync("docker", ["info"], { stdio: "ignore" }).status === 0;
}

/** Roda `php -l` em todos os `.php` de `dir`, num único container. */
export function checkPhpDir(dir: string): PhpCheckResult {
  const args = ["run", "--rm", "-v", `${path.resolve(dir)}:/work:ro`, "-w", "/work"];
  // mesmo UID/GID do host: o container nunca roda como root nem deixa arquivos dele para trás
  if (process.getuid && process.getgid) args.push("--user", `${process.getuid()}:${process.getgid()}`);
  args.push(phpImage, "sh", "-c", containerScript);

  const run = spawnSync("docker", args, { encoding: "utf8" });
  if (run.status !== 0) {
    throw new Error(`Falha ao rodar o container ${phpImage}:\n${run.stderr || run.stdout}`);
  }

  const failures: PhpFailure[] = [];
  let total = 0;
  for (const line of run.stdout.split("\n")) {
    const [kind, a, b] = line.split("\t");
    if (kind === "FAIL") failures.push({ file: a, message: b });
    if (kind === "TOTAL") total = Number(a);
  }
  return { total, failures };
}

/**
 * Versões alvo checadas. O padrão (Laravel 12) fica em `<fixture>/`; as demais em `<pasta>/<fixture>/`, onde o
 * Laravel 10 (o mais diferente: `$casts` como propriedade, comentário do doctrine/dbal) é checado com o PHP mínimo.
 * O Laravel 11 gera a mesma saída do 12 e não precisa de passada própria.
 */
export const lintTargets: { dir: string; target: TargetVersion }[] = [
  { dir: "", target: { laravel: 12, php: "8.2" } },
  { dir: "laravel-10", target: { laravel: 10, php: "8.1" } },
];

/** Gera a saída de cada fixture em `<outDir>/<fixture>/` (só em memória + diretório temporário). */
export function writeFixtureOutputs(outDir: string, target?: TargetVersion): void {
  for (const name of fs.readdirSync(fixturesDir).sort()) {
    const manifestPath = path.join(fixturesDir, name, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    // Fixture com `laravel-11/database/migrations`: o destino já tem as migrations do esqueleto (que não são do crudmaker).
    const skeletonDir = path.join(fixturesDir, name, "laravel-11/database/migrations");
    const skeleton = fs.existsSync(skeletonDir) ? fs.readdirSync(skeletonDir) : [];
    const first = generate(manifest, { now, existingMigrations: skeleton, unmarkedMigrations: skeleton, seeders: true, target }).files;
    for (const file of first) {
      const target = path.join(outDir, name, file.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, file.content);
    }

    // Fixture com `manifest.after.json`: segunda geração sobre a primeira, para checar também as migrations `alter`.
    const afterPath = path.join(fixturesDir, name, "manifest.after.json");
    if (!fs.existsSync(afterPath)) continue;
    const second = generate(JSON.parse(fs.readFileSync(afterPath, "utf8")), {
      now,
      existingMigrations: first.filter((file) => file.path.startsWith("database/migrations/")).map((file) => path.basename(file.path)),
      previousLock: JSON.parse(first.find((file) => file.path === "manifest-lock.json")!.content),
      target,
    }).files;
    for (const file of second.filter((file) => file.path.includes("_alter_"))) {
      fs.writeFileSync(path.join(outDir, name, file.path), file.content);
    }
  }
}

export type Classified = { unexpected: PhpFailure[]; known: (PhpFailure & { reason: string })[]; staleAllowlist: string[] };

/** Separa as falhas entre inesperadas e conhecidas (allowlist) e acusa entradas da allowlist que não falham mais. */
export function classifyFailures(failures: PhpFailure[], allowlist = phpSyntaxAllowlist): Classified {
  const unexpected: PhpFailure[] = [];
  const known: Classified["known"] = [];
  for (const failure of failures) {
    const entry = allowlist.find((item) => item.file === failure.file);
    if (entry) known.push({ ...failure, reason: entry.reason });
    else unexpected.push(failure);
  }
  const failed = new Set(failures.map((failure) => failure.file));
  const staleAllowlist = allowlist.map((item) => item.file).filter((file) => !failed.has(file));
  return { unexpected, known, staleAllowlist };
}

function main(): number {
  if (!dockerAvailable()) {
    console.error("Docker não está disponível (o `docker info` falhou). A checagem de sintaxe PHP roda `php -l` num container; instale/inicie o Docker.");
    return 2;
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-php-"));
  try {
    for (const { dir, target } of lintTargets) writeFixtureOutputs(path.join(tmp, dir), target);

    // Só para provar que a checagem falha: injeta um PHP inválido (usado no teste e na verificação manual).
    if (process.env.CRUDMAKER_INJECT_INVALID_PHP) {
      const bad = path.join(tmp, "__invalido__/Quebrado.php");
      fs.mkdirSync(path.dirname(bad), { recursive: true });
      fs.writeFileSync(bad, "<?php\n\nclass Quebrado {\n\tpublic function x( {\n}\n");
    }

    console.log(`Rodando php -l em ${phpImage} (fixtures: ${fs.readdirSync(tmp).filter((n) => n !== "__invalido__" && !lintTargets.some((item) => item.dir === n)).join(", ")}; versões: ${lintTargets.map((item) => `Laravel ${item.target.laravel}`).join(", ")})...`);
    const { total, failures } = checkPhpDir(tmp);
    const { unexpected, known, staleAllowlist } = classifyFailures(failures);

    console.log(`${total} arquivos PHP verificados, ${total - failures.length} sem erro.`);
    for (const item of known) console.log(`  [conhecido] ${item.file}: ${item.message}\n              motivo: ${item.reason}`);
    for (const item of unexpected) console.error(`  [FALHOU]    ${item.file}: ${item.message}`);
    for (const file of staleAllowlist) {
      console.error(`  [allowlist obsoleta] ${file} não falha mais: remova a entrada de scripts/phpSyntaxAllowlist.ts.`);
    }

    if (unexpected.length > 0 || staleAllowlist.length > 0) return 1;
    console.log("OK");
    return 0;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

if (require.main === module) process.exit(main());
