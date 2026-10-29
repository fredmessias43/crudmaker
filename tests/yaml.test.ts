import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CliIo, run } from "../src/cli";
import { generate } from "../src/generate";
import { exampleManifest } from "../src/initTemplate";
import { readManifest } from "../src/readManifest";

const fixturesDir = path.join(__dirname, "fixtures");
const opts = { now: new Date(2025, 0, 2, 3, 4, 5), existingMigrations: [] };

let tmp: string;
let out: string;
let stdout: string;
let stderr: string;

const io = (): CliIo => ({
  stdout: (t) => (stdout += t),
  stderr: (t) => (stderr += t),
  cwd: tmp,
  now: () => opts.now,
});

const write = (name: string, content: string) => {
  const file = path.join(tmp, name);
  fs.writeFileSync(file, content);
  return file;
};

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-yaml-"));
  out = path.join(tmp, "projeto");
  stdout = "";
  stderr = "";
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe.each(["bingo", "curso", "vende-que-vende-api", "api-options", "field-options"])("YAML equivalente ao JSON (%s)", (name) => {
  it("lê o mesmo objeto e gera exatamente a mesma saída", () => {
    const json = readManifest(path.join(fixturesDir, name, "manifest.json"));
    const yaml = readManifest(path.join(fixturesDir, name, "manifest.yaml"));

    expect(yaml).toEqual(json);
    expect(generate(yaml, opts)).toEqual(generate(json, opts));
  });
});

describe("readManifest: formato pela extensão", () => {
  it("aceita .yml e extensão em maiúsculas", () => {
    const yaml = fs.readFileSync(path.join(fixturesDir, "curso/manifest.yaml"), "utf8");
    const expected = readManifest(path.join(fixturesDir, "curso/manifest.json"));

    expect(readManifest(write("a.yml", yaml))).toEqual(expected);
    expect(readManifest(write("b.YAML", yaml))).toEqual(expected);
  });

  it("YAML 1.2: no/yes/on/off continuam texto e 01 vira número", () => {
    const obj = readManifest(write("t.yaml", "a: no\nb: yes\nc: on\nd: 01\ne: '01'\n"));
    expect(obj).toEqual({ a: "no", b: "yes", c: "on", d: 1, e: "01" });
  });
});

describe("crudmaker generate com YAML: erros", () => {
  it("extensão desconhecida lista as aceitas", () => {
    const file = write("manifest.toml", "x = 1");
    expect(run(["generate", file, "--out", out], io())).toBe(1);
    expect(stderr).toContain('Extensão ".toml" não suportada');
    expect(stderr).toContain(".yaml, .yml, .json");
    expect(fs.existsSync(out)).toBe(false);
  });

  it("arquivo sem extensão também é recusado", () => {
    expect(run(["generate", write("manifest", "{}"), "--out", out], io())).toBe(1);
    expect(stderr).toContain("(nenhuma)");
  });

  it("sintaxe inválida informa arquivo, linha e coluna", () => {
    const file = write("ruim.yaml", "system:\n  code: s\npkg: [a, b\n  code: x\n");
    expect(run(["generate", file, "--out", out], io())).toBe(1);
    expect(stderr).toMatch(new RegExp(`^Erro: YAML inválido em ${file.replace(/[.]/g, "\\.")}:\\d+:\\d+: `));
    expect(fs.existsSync(out)).toBe(false);
  });

  it("chave duplicada é erro", () => {
    expect(run(["generate", write("dup.yaml", "a: 1\na: 2\n"), "--out", out], io())).toBe(1);
    expect(stderr).toContain("YAML inválido");
    expect(stderr).toMatch(/:2:1/);
  });

  it("arquivo vazio (ou só comentários) é erro claro", () => {
    expect(run(["generate", write("vazio.yaml", ""), "--out", out], io())).toBe(1);
    expect(stderr).toContain("está vazio");

    stderr = "";
    expect(run(["generate", write("comentario.yaml", "# nada\n"), "--out", out], io())).toBe(1);
    expect(stderr).toContain("está vazio");
  });

  it("lista ou valor simples na raiz é erro claro", () => {
    expect(run(["generate", write("lista.yaml", "- a\n- b\n"), "--out", out], io())).toBe(1);
    expect(stderr).toContain("deve ser um mapa");
    expect(stderr).toContain("uma lista");

    stderr = "";
    expect(run(["generate", write("texto.yaml", "so texto\n"), "--out", out], io())).toBe(1);
    expect(stderr).toContain("um valor simples");
  });

  it("vários documentos (---) é erro claro", () => {
    expect(run(["generate", write("multi.yaml", "a: 1\n---\nb: 2\n"), "--out", out], io())).toBe(1);
    expect(stderr).toContain("2 documentos YAML");
    expect(fs.existsSync(out)).toBe(false);
  });

  it("YAML inválido pelo schema usa os mesmos caminhos da validação", () => {
    const file = write("invalido.yaml", [
      "system:",
      "  code: s",
      "pkg:",
      "  code: p",
      "  entities:",
      "    client:",
      "      fields:",
      "        id: uuid",
      "        email: strng",
      "",
    ].join("\n"));

    expect(run(["generate", file, "--out", out], io())).toBe(1);
    expect(stdout).toBe("");
    expect(stderr.split("\n")).toEqual([
      "Erro: manifest inválido (1 problema):",
      expect.stringMatching(/^  pkg\.entities\.client\.fields\.email: tipo "strng" desconhecido \(use um de: uuid, string, /),
      "",
    ]);
  });
});

describe("crudmaker init com formato", () => {
  it("sem argumento cria manifest.yaml, comentado e com o modeline do schema", () => {
    expect(run(["init"], io())).toBe(0);
    const text = fs.readFileSync(path.join(tmp, "manifest.yaml"), "utf8");

    expect(text.startsWith("# yaml-language-server: $schema=./node_modules/crudmaker/schema/manifest.schema.json\n")).toBe(true);
    expect(text).toContain("# Forma curta");
    expect(fs.existsSync(path.join(tmp, "manifest.json"))).toBe(false);
    expect(stdout).toContain("crudmaker generate manifest.yaml");
  });

  it("manifest.yaml, .yml e .json são aceitos pelo generate e dão o mesmo objeto", () => {
    for (const name of ["manifest.yaml", "m.yml", "manifest.json"]) {
      expect(run(["init", name], io())).toBe(0);
      expect(run(["generate", name, "--out", path.join(out, name)], io())).toBe(0);
    }
    expect(stderr).toBe("");

    const json = readManifest(path.join(tmp, "manifest.json"));
    expect(json).toEqual(exampleManifest);
    expect(readManifest(path.join(tmp, "manifest.yaml"))).toEqual(json);
    expect(readManifest(path.join(tmp, "m.yml"))).toEqual(json);
  });

  it("extensão desconhecida falha sem criar o arquivo", () => {
    expect(run(["init", "manifest.txt"], io())).toBe(1);
    expect(stderr).toContain(".yaml, .yml, .json");
    expect(fs.existsSync(path.join(tmp, "manifest.txt"))).toBe(false);
  });
});
