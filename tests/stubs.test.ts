import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CliIo, run } from "../src/cli";
import { generate } from "../src/generate";
import { embeddedTemplate } from "../src/targets/laravel-api/render";
import { embeddedHash, replaceableTemplates, stubsFolder, stubsLockPath } from "../src/targets/laravel-api/stubs";

// Ticket 13: stubs do projeto (prioridade arquivo a arquivo sobre os templates embutidos),
// `stubs:publish`, aviso de stub desatualizado e erro de sintaxe.

const fixturesDir = path.join(__dirname, "fixtures");
const now = new Date(2025, 0, 2, 3, 4, 5);
const manifest = () => JSON.parse(fs.readFileSync(path.join(fixturesDir, "vende-que-vende-api", "manifest.json"), "utf8"));

describe("stubs em generate", () => {
  const baseline = generate(manifest(), { now, existingMigrations: [] });
  const envelope = embeddedTemplate("controller.base").includes("'data'");

  it("o stub do controller muda só os controllers gerados", () => {
    const stub = embeddedTemplate("controller.base").replace(/'data'/g, "'resultado'");
    const result = generate(manifest(), { now, existingMigrations: [], stubs: { "controller.base": stub } });

    expect(envelope).toBe(true);
    expect(result.files.map((f) => f.path)).toEqual(baseline.files.map((f) => f.path));

    const changed = result.files.filter((f, i) => f.content !== baseline.files[i].content).map((f) => f.path);
    expect(changed.length).toBeGreaterThan(0);
    expect(changed.every((p) => /^app\/Generated\/Http\/Controllers\/Api\/Base\w+Controller\.php$/.test(p))).toBe(true);
    expect(result.files.find((f) => f.path === changed[0])!.content).toContain("'resultado'");
    expect(result.warnings).toEqual(baseline.warnings);
  });

  it("sem stubs a saída é idêntica à embutida", () => {
    expect(generate(manifest(), { now, existingMigrations: [], stubs: {} })).toEqual(baseline);
  });

  it("stub de classe final é ignorado com aviso (a camada de customização não é afetada)", () => {
    const result = generate(manifest(), { now, existingMigrations: [], stubs: { "controller.final": "<?php // x" } });

    expect(result.files).toEqual(baseline.files);
    expect(result.warnings.join("\n")).toMatch(/stub controller\.final: ignorado.*camada gerada.*hooks/);
  });

  it("avisa quando o hash do embutido mudou desde a publicação", () => {
    const stubs = { "controller.base": embeddedTemplate("controller.base"), "routes": embeddedTemplate("routes") };
    const result = generate(manifest(), {
      now,
      existingMigrations: [],
      stubs,
      stubHashes: { "controller.base": "hash-antigo", routes: embeddedHash("routes") },
    });

    const warnings = result.warnings.filter((w) => w.startsWith("stub "));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("stub controller.base: foi publicado a partir de uma versão anterior do template embutido");
    expect(warnings[0]).toContain("stubs:publish controller.base");
  });

  it("não avisa sem hash registrado nem com o hash igual", () => {
    const stubs = { "controller.base": embeddedTemplate("controller.base") };
    const semHash = generate(manifest(), { now, existingMigrations: [], stubs });
    const igual = generate(manifest(), { now, existingMigrations: [], stubs, stubHashes: { "controller.base": embeddedHash("controller.base") } });

    expect(semHash.warnings).toEqual(baseline.warnings);
    expect(igual.warnings).toEqual(baseline.warnings);
  });

  it("erro de sintaxe no stub dá mensagem com nome e linha, sem stack trace", () => {
    const stub = "<?php\n\n<% for (const x of it.items { -%>\nx\n<% } -%>\n";
    let error: Error | undefined;
    try {
      generate(manifest(), { now, existingMigrations: [], stubs: { "model.base": stub } });
    } catch (e: any) {
      error = e;
    }

    expect(error?.message).toBe('Stub "model.base.php.eta": erro de sintaxe na linha 3: Unexpected token \'{\'');
  });

  it("tag sem fechamento também informa a linha", () => {
    expect(() => generate(manifest(), { now, existingMigrations: [], stubs: { routes: "<?php\n<%~ it.x\n" } })).toThrow(
      /Stub "routes\.php\.eta": erro de sintaxe na linha 2/,
    );
  });

  it("erro ao renderizar (variável inexistente) cita o stub", () => {
    expect(() => generate(manifest(), { now, existingMigrations: [], stubs: { routes: "<%~ it.nao.existe %>" } })).toThrow(
      /Stub "routes\.php\.eta": erro ao renderizar/,
    );
  });
});

describe("crudmaker stubs:publish e generate com stubs", () => {
  let tmp: string;
  let out: string;
  let stdout: string;
  let stderr: string;
  const io = (): CliIo => ({ stdout: (t) => (stdout += t), stderr: (t) => (stderr += t), cwd: tmp, now: () => now });
  const fixture = path.join(fixturesDir, "curso", "manifest.json");
  const stubDir = () => path.join(out, stubsFolder);

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-stubs-"));
    out = path.join(tmp, "projeto");
    stdout = "";
    stderr = "";
  });
  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it("sem argumentos publica todos os stubs substituíveis e registra os hashes", () => {
    expect(run(["stubs:publish", "--out", out], io())).toBe(0);

    expect(fs.readdirSync(stubDir()).sort()).toEqual(replaceableTemplates.map((n) => `${n}.php.eta`).sort());
    expect(fs.readFileSync(path.join(stubDir(), "controller.base.php.eta"), "utf8")).toBe(embeddedTemplate("controller.base"));
    const lock = JSON.parse(fs.readFileSync(path.join(out, stubsLockPath), "utf8"));
    expect(lock.stubs["controller.base"]).toBe(embeddedHash("controller.base"));
    expect(Object.keys(lock.stubs).sort()).toEqual([...replaceableTemplates].sort());
    expect(stdout).toContain(`copiados para ${stubDir()} (${replaceableTemplates.length})`);
  });

  it("com argumentos publica só os pedidos (nome curto = base)", () => {
    expect(run(["stubs:publish", "controller", "migration", "--out", out], io())).toBe(0);

    expect(fs.readdirSync(stubDir()).sort()).toEqual(["controller.base.php.eta", "migration.php.eta"]);
    expect(Object.keys(JSON.parse(fs.readFileSync(path.join(out, stubsLockPath), "utf8")).stubs).sort()).toEqual(["controller.base", "migration"]);
  });

  it("recusa nome desconhecido e classe final, sem escrever nada", () => {
    expect(run(["stubs:publish", "controller.final", "--out", out], io())).toBe(1);
    expect(stderr).toMatch(/Stub desconhecido: controller\.final\..*não têm stub.*Disponíveis/);
    expect(run(["stubs:publish", "banana", "--out", out], io())).toBe(1);
    expect(fs.existsSync(out)).toBe(false);
  });

  it("não sobrescreve stub existente (avisa e pula); --force sobrescreve", () => {
    run(["stubs:publish", "controller", "--out", out], io());
    const file = path.join(stubDir(), "controller.base.php.eta");
    fs.writeFileSync(file, "editado");

    stdout = "";
    expect(run(["stubs:publish", "controller", "model", "--out", out], io())).toBe(0);
    expect(fs.readFileSync(file, "utf8")).toBe("editado");
    expect(stdout).toContain("model.base.php.eta");
    expect(stdout).toMatch(/Aviso: já existem e foram mantidos \(1\).*\n {2}controller\.base\.php\.eta/);

    stdout = "";
    expect(run(["stubs:publish", "controller", "--force", "--out", out], io())).toBe(0);
    expect(fs.readFileSync(file, "utf8")).toBe(embeddedTemplate("controller.base"));
  });

  it("generate usa o stub do projeto e escreve só a camada gerada do controller de forma diferente", () => {
    const plain = path.join(tmp, "plain");
    run(["generate", fixture, "--out", plain], io());

    run(["stubs:publish", "controller", "--out", out], io());
    const file = path.join(stubDir(), "controller.base.php.eta");
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/'data'/g, "'resultado'"));
    stdout = "";
    expect(run(["generate", fixture, "--out", out], io())).toBe(0);
    expect(stdout).not.toContain("stub controller.base:");

    const generated = (root: string) => fs.readdirSync(root, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => path.join(e.parentPath, e.name));
    const rel = (root: string) => generated(root).filter((p) => !p.includes("/stubs/")).map((p) => path.relative(root, p)).sort();
    expect(rel(out)).toEqual(rel(plain));

    const different = rel(out).filter((p) => fs.readFileSync(path.join(out, p), "utf8") !== fs.readFileSync(path.join(plain, p), "utf8"));
    expect(different.length).toBeGreaterThan(0);
    expect(different.every((p) => p.includes("Generated/Http/Controllers/Api/Base"))).toBe(true);
  });

  it("generate avisa de stub desatualizado e --refresh-lock apaga o aviso", () => {
    run(["stubs:publish", "controller", "--out", out], io());
    const lockPath = path.join(out, stubsLockPath);
    fs.writeFileSync(lockPath, JSON.stringify({ version: 1, stubs: { "controller.base": "hash-antigo" } }));

    run(["generate", fixture, "--out", out], io());
    expect(stdout).toMatch(/\n {2}stub controller\.base: foi publicado a partir de uma versão anterior do template embutido/);

    stdout = "";
    expect(run(["stubs:publish", "controller", "--refresh-lock", "--out", out], io())).toBe(0);
    expect(JSON.parse(fs.readFileSync(lockPath, "utf8")).stubs["controller.base"]).toBe(embeddedHash("controller.base"));

    stdout = "";
    run(["generate", fixture, "--out", out], io());
    expect(stdout).not.toContain("stub controller.base:");
  });

  it("stub com erro de sintaxe: erro claro, exit 1 e nada escrito", () => {
    fs.mkdirSync(stubDir(), { recursive: true });
    fs.writeFileSync(path.join(stubDir(), "controller.base.php.eta"), "<?php\n<% if (it.x { %>\n");

    expect(run(["generate", fixture, "--out", out], io())).toBe(1);

    expect(stderr).toMatch(/^Erro: Stub "controller\.base\.php\.eta": erro de sintaxe na linha 2: /);
    expect(stderr).not.toContain("at ");
    expect(fs.existsSync(path.join(out, "manifest-lock.json"))).toBe(false);
    expect(fs.existsSync(path.join(out, "app"))).toBe(false);
  });
});
