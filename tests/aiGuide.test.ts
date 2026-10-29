import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import YAML from "yaml";
import { CliIo, run } from "../src/cli";
import { generate } from "../src/generate";
import { readManifest } from "../src/readManifest";

const root = path.join(__dirname, "..");
const guidePath = path.join(root, "docs/guia-ia.md");
const opts = { now: new Date(2025, 0, 2, 3, 4, 5), existingMigrations: [] };

let tmp: string;
let stdout: string;
let stderr: string;

const io = (): CliIo => ({
  stdout: (t) => (stdout += t),
  stderr: (t) => (stderr += t),
  cwd: tmp,
  now: () => opts.now,
});

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-ai-"));
  stdout = "";
  stderr = "";
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("guia para IA (docs/guia-ia.md)", () => {
  const guide = fs.readFileSync(guidePath, "utf8");

  it("é curto: cerca de 800 tokens (caracteres / 4) no máximo", () => {
    expect([...guide].length / 4).toBeLessThanOrEqual(850);
  });

  it("o exemplo de manifest é válido e o gerador o aceita", () => {
    const yamlBlock = guide.match(/```yaml\n([\s\S]*?)```/);
    expect(yamlBlock).not.toBeNull();
    const manifest = YAML.parse(yamlBlock![1]);

    const result = generate(manifest, opts);
    expect(result.files.map((f) => f.path)).toContain("app/Http/Controllers/Api/ClientController.php");
    expect(result.warnings).toEqual([]);
  });

  it("aponta o JSON Schema, que existe no pacote, e os hooks que o gerador realmente cria", () => {
    expect(guide).toContain("schema/manifest.schema.json");
    expect(fs.existsSync(path.join(root, "schema/manifest.schema.json"))).toBe(true);

    const controller = fs.readFileSync(path.join(root, "templates/laravel-api/controller.base.php.eta"), "utf8");
    for (const hook of ["indexQuery", "beforeStore", "afterStore", "beforeUpdate", "afterUpdate", "beforeDestroy", "afterDestroy"]) {
      expect(guide).toContain(hook);
      expect(controller).toContain(hook);
    }
    expect(guide).toContain("extraRules()");
    expect(guide).toContain("extra()");
  });

  it("vai no pacote publicado (files do package.json)", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    expect(pkg.files).toContain("docs/guia-ia.md");
  });
});

describe("crudmaker init --ai", () => {
  it("grava o manifest e o CRUDMAKER.md com o conteúdo do guia", () => {
    expect(run(["init", "--ai"], io())).toBe(0);
    expect(stderr).toBe("");
    expect(fs.existsSync(path.join(tmp, "manifest.yaml"))).toBe(true);
    expect(fs.readFileSync(path.join(tmp, "CRUDMAKER.md"), "utf8")).toBe(fs.readFileSync(guidePath, "utf8"));
    expect(stdout).toContain("CRUDMAKER.md");
    expect(stdout).toContain("crudmaker generate manifest.yaml");
  });

  it("sem --ai não grava o guia", () => {
    expect(run(["init"], io())).toBe(0);
    expect(fs.existsSync(path.join(tmp, "CRUDMAKER.md"))).toBe(false);
  });

  it("com o manifest já existente, mantém o manifest e grava só o guia", () => {
    fs.writeFileSync(path.join(tmp, "manifest.yaml"), "meu: manifest\n");
    expect(run(["init", "--ai"], io())).toBe(0);
    expect(fs.readFileSync(path.join(tmp, "manifest.yaml"), "utf8")).toBe("meu: manifest\n");
    expect(fs.existsSync(path.join(tmp, "CRUDMAKER.md"))).toBe(true);
    expect(stdout).toContain("mantido");
  });

  it("recusa se o CRUDMAKER.md já existe, sem escrever nada", () => {
    fs.writeFileSync(path.join(tmp, "CRUDMAKER.md"), "meu guia\n");
    expect(run(["init", "--ai"], io())).toBe(1);
    expect(stderr).toContain("CRUDMAKER.md já existe");
    expect(fs.readFileSync(path.join(tmp, "CRUDMAKER.md"), "utf8")).toBe("meu guia\n");
    expect(fs.existsSync(path.join(tmp, "manifest.yaml"))).toBe(false);
  });

  it("o guia vai para a pasta do manifest escolhido", () => {
    expect(run(["init", "api/manifest.json", "--ai"], io())).toBe(0);
    expect(fs.existsSync(path.join(tmp, "api/CRUDMAKER.md"))).toBe(true);
  });

  it("a ajuda documenta a flag", () => {
    expect(run(["init", "--help"], io())).toBe(0);
    expect(stdout).toContain("--ai");
  });
});

describe("manifest.example.json", () => {
  it("é um manifest válido que o gerador aceita", () => {
    const manifest = readManifest(path.join(root, "manifest.example.json"));
    expect(() => generate(manifest, opts)).not.toThrow();
  });
});
