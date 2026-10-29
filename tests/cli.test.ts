import { execFileSync, spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CliIo, run } from "../src/cli";

const fixture = path.join(__dirname, "fixtures/curso/manifest.json");
const projectRoot = path.join(__dirname, "..");

let tmp: string;
let out: string;
let stdout: string;
let stderr: string;

const io = (): CliIo => ({
  stdout: (t) => (stdout += t),
  stderr: (t) => (stderr += t),
  cwd: tmp,
  now: () => new Date(2025, 0, 2, 3, 4, 5),
});

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => path.join(e.parentPath, e.name));
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-cli-"));
  out = path.join(tmp, "projeto");
  stdout = "";
  stderr = "";
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("crudmaker generate", () => {
  it("cria os arquivos em --out e mostra o resumo", () => {
    expect(run(["generate", fixture, "--out", out], io())).toBe(0);

    expect(fs.existsSync(path.join(out, "manifest-lock.json"))).toBe(true);
    expect(listFiles(path.join(out, "app")).length).toBeGreaterThan(0);
    expect(stdout).toMatch(/criados \(\d+\)/);
    expect(stdout).toMatch(/Total: \d+ arquivos \(\d+ criados, 0 sobrescritos, 0 sem mudança, 0 preservados\)/);
    expect(stderr).toBe("");
  });

  it("ao rodar de novo reaproveita a migration e não cria nada novo", () => {
    run(["generate", fixture, "--out", out], io());
    const before = fs.readdirSync(path.join(out, "database/migrations")).sort();

    stdout = "";
    // data diferente: se o nome não fosse reaproveitado, nasceria uma segunda migration
    const later = { ...io(), now: () => new Date(2030, 5, 6, 7, 8, 9) };
    expect(run(["generate", fixture, "--out", out], later)).toBe(0);

    expect(fs.readdirSync(path.join(out, "database/migrations")).sort()).toEqual(before);
    expect(stdout).toMatch(/\(0 criados, 0 sobrescritos, \d+ sem mudança, 0 preservados\)/);
  });

  it("classifica como sobrescrito o arquivo que foi editado à mão", () => {
    run(["generate", fixture, "--out", out], io());
    fs.writeFileSync(path.join(out, "manifest-lock.json"), "editado");

    stdout = "";
    run(["generate", fixture, "--out", out], io());

    expect(stdout).toMatch(/sobrescritos \(1\):\n {2}manifest-lock\.json/);
    expect(fs.readFileSync(path.join(out, "manifest-lock.json"), "utf8")).not.toBe("editado");
  });

  it("--dry-run não escreve nada, mas lista os arquivos", () => {
    expect(run(["generate", fixture, "--out", out, "--dry-run"], io())).toBe(0);

    expect(fs.existsSync(out)).toBe(false);
    expect(stdout).toContain("nada foi escrito");
    expect(stdout).toContain("manifest-lock.json");
  });

  it("--dry-run mostra o mesmo plano da escrita real", () => {
    run(["generate", fixture, "--out", out, "--dry-run"], io());
    const dry = stdout.replace(/^.*\n/, "");

    stdout = "";
    run(["generate", fixture, "--out", out], io());
    expect(stdout.replace(/^.*\n/, "")).toBe(dry);
  });

  it("usa o diretório atual quando --out não é informado", () => {
    expect(run(["generate", fixture], io())).toBe(0);
    expect(fs.existsSync(path.join(tmp, "manifest-lock.json"))).toBe(true);
  });

  it("falha com mensagem clara se o manifest não existe", () => {
    expect(run(["generate", path.join(tmp, "nao-existe.json"), "--out", out], io())).not.toBe(0);
    expect(stderr).toContain("Manifest não encontrado");
    expect(stderr).not.toContain("at ");
    expect(fs.existsSync(out)).toBe(false);
  });

  it("falha com mensagem clara se o JSON é inválido", () => {
    const bad = path.join(tmp, "ruim.json");
    fs.writeFileSync(bad, "{ nao e json");

    expect(run(["generate", bad, "--out", out], io())).not.toBe(0);
    expect(stderr).toContain("JSON inválido");
  });

  it("lista cada problema do manifest inválido numa linha e não escreve nada", () => {
    const bad = path.join(tmp, "invalido.json");
    fs.writeFileSync(bad, JSON.stringify({
      system: { code: "s" },
      pkg: {
        entities: {
          client: { fields: { id: "uuid", email: "strng" } },
        },
      },
    }));

    expect(run(["generate", bad, "--out", out], io())).toBe(1);
    expect(stdout).toBe("");
    expect(stderr.split("\n")).toEqual([
      "Erro: manifest inválido (2 problemas):",
      "  pkg.code: campo obrigatório ausente",
      expect.stringMatching(/^  pkg\.entities\.client\.fields\.email: tipo "strng" desconhecido \(use um de: uuid, string, /),
      "",
    ]);
    expect(fs.existsSync(out)).toBe(false);
  });

  it("falha sem o argumento do manifest e com opção desconhecida", () => {
    expect(run(["generate"], io())).not.toBe(0);
    expect(stderr).toContain("Informe o caminho do manifest");

    stderr = "";
    expect(run(["generate", fixture, "--nao-existe"], io())).not.toBe(0);
    expect(stderr).toContain("Erro:");
  });
});

describe("rotas e routes/api.php", () => {
  const apiRoutes = `<?php

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
`;
  const apiPath = () => path.join(out, "routes/api.php");
  const writeApi = (content = apiRoutes) => {
    fs.mkdirSync(path.join(out, "routes"), { recursive: true });
    fs.writeFileSync(apiPath(), content);
  };

  it("gera routes/crudmaker.php e inclui no routes/api.php existente", () => {
    writeApi();
    expect(run(["generate", fixture, "--out", out], io())).toBe(0);

    expect(fs.readFileSync(path.join(out, "routes/crudmaker.php"), "utf8")).toContain("Route::apiResource('courses'");
    const api = fs.readFileSync(apiPath(), "utf8");
    expect(api.startsWith(apiRoutes)).toBe(true);
    expect(api.match(/crudmaker\.php/g)?.length).toBe(2); // comentário + require
    expect(stdout).toMatch(/sobrescritos \(1\):\n {2}routes\/api\.php/);
    expect(stdout).toMatch(/criados \(\d+\):[\s\S]*routes\/crudmaker\.php/);
    expect(stdout).not.toContain("Aviso");
  });

  it("regerar não duplica o include e classifica o api.php como sem mudança", () => {
    writeApi();
    run(["generate", fixture, "--out", out], io());
    const after = fs.readFileSync(apiPath(), "utf8");

    stdout = "";
    run(["generate", fixture, "--out", out], io());

    expect(fs.readFileSync(apiPath(), "utf8")).toBe(after);
    expect(stdout).toMatch(/sem mudança \(\d+\):[\s\S]*routes\/api\.php/);
    expect(stdout).toContain("0 sobrescritos");
  });

  it("--dry-run mostra o api.php como sobrescrito sem alterá-lo", () => {
    writeApi();
    expect(run(["generate", fixture, "--out", out, "--dry-run"], io())).toBe(0);

    expect(fs.readFileSync(apiPath(), "utf8")).toBe(apiRoutes);
    expect(fs.existsSync(path.join(out, "routes/crudmaker.php"))).toBe(false);
    expect(stdout).toMatch(/sobrescritos \(1\):\n {2}routes\/api\.php/);

    const dry = stdout.replace(/^.*\n/, "");
    stdout = "";
    run(["generate", fixture, "--out", out], io());
    expect(stdout.replace(/^.*\n/, "")).toBe(dry);
  });

  it("sem routes/api.php não cria o arquivo e avisa para rodar install:api", () => {
    expect(run(["generate", fixture, "--out", out], io())).toBe(0);

    expect(fs.existsSync(apiPath())).toBe(false);
    expect(fs.existsSync(path.join(out, "routes/crudmaker.php"))).toBe(true);
    expect(stdout).toContain("php artisan install:api");
    expect(stdout).toContain("Aviso");
  });
});

describe("crudmaker init", () => {
  it("cria um manifest que o generate aceita", () => {
    expect(run(["init", "manifest.json"], io())).toBe(0);
    expect(fs.existsSync(path.join(tmp, "manifest.json"))).toBe(true);

    expect(run(["generate", "manifest.json", "--out", out], io())).toBe(0);
    expect(stderr).toBe("");
    expect(fs.existsSync(path.join(out, "app/Models/Client.php"))).toBe(true);
  });

  it("aceita um nome de arquivo e recusa se ele já existir", () => {
    expect(run(["init", "meu.json"], io())).toBe(0);
    const content = fs.readFileSync(path.join(tmp, "meu.json"), "utf8");
    fs.writeFileSync(path.join(tmp, "meu.json"), content + " ");

    expect(run(["init", "meu.json"], io())).not.toBe(0);
    expect(stderr).toContain("já existe");
    expect(fs.readFileSync(path.join(tmp, "meu.json"), "utf8")).toBe(content + " ");
  });
});

describe("ajuda e versão", () => {
  it("mostra a ajuda geral e a de cada comando", () => {
    expect(run(["--help"], io())).toBe(0);
    expect(stdout).toContain("generate <manifest>");

    stdout = "";
    expect(run(["generate", "--help"], io())).toBe(0);
    expect(stdout).toContain("--dry-run");

    stdout = "";
    expect(run(["init", "--help"], io())).toBe(0);
    expect(stdout).toContain("crudmaker init");
  });

  it("mostra a versão do package.json", () => {
    const version = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")).version;
    expect(run(["--version"], io())).toBe(0);
    expect(stdout.trim()).toBe(version);
  });

  it("comando desconhecido falha", () => {
    expect(run(["xyz"], io())).not.toBe(0);
    expect(stderr).toContain("Comando desconhecido");
  });
});

describe("binário (subprocesso)", () => {
  it("roda via tsx, grava no --out e devolve exit code 1 em erro", () => {
    const tsx = path.join(projectRoot, "node_modules/.bin/tsx");
    const bin = path.join(projectRoot, "src/bin.ts");

    const output = execFileSync(tsx, [bin, "generate", fixture, "--out", out], { cwd: tmp, encoding: "utf8" });
    expect(output).toContain("Total:");
    expect(fs.existsSync(path.join(out, "manifest-lock.json"))).toBe(true);

    const failed = spawnSync(tsx, [bin, "generate", "nao-existe.json"], { cwd: tmp, encoding: "utf8" });
    expect(failed.status).toBe(1);
    expect(failed.stderr).toContain("Manifest não encontrado");
  }, 30000);
});
