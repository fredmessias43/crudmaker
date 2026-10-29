import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CliIo, run } from "../src/cli";
import { generate, GeneratedFile } from "../src/generate";

// Ticket 14: o lock é a fonte de verdade do schema emitido. Migration de criação imutável depois de emitida e
// migrations `alter` pelo diff entre o lock anterior e o manifest atual.

const fixturesDir = path.join(__dirname, "fixtures");
const snapshotsDir = path.join(__dirname, "__snapshots__");
const now = new Date(2025, 0, 2, 3, 4, 5);

const loadFixture = (name: string) => JSON.parse(fs.readFileSync(path.join(fixturesDir, "alter", name), "utf8"));

type Field = string | { [key: string]: unknown };

/** Manifest mínimo: `client` com os campos dados (mais o `id`) e as relações opcionais. */
function manifest(fields: { [name: string]: Field } = {}, extra: { [entity: string]: { fields?: { [name: string]: Field }; relationships?: object } } = {}) {
  return {
    system: { title: "Loja", code: "loja" },
    pkg: {
      code: "loja",
      entities: {
        client: { fields: { id: "uuid", name: "string", ...fields } },
        ...Object.fromEntries(Object.entries(extra).map(([name, entity]) => [name, { fields: { id: "uuid", ...entity.fields }, relationships: entity.relationships }])),
      },
    },
  };
}

const migrationNames = (files: GeneratedFile[]) => files.filter((file) => file.path.startsWith("database/migrations/")).map((file) => path.basename(file.path));
const alters = (files: GeneratedFile[]) => files.filter((file) => file.path.includes("_alter_"));
const lockOf = (files: GeneratedFile[]) => JSON.parse(files.find((file) => file.path === "manifest-lock.json")!.content);

/**
 * Duas gerações em sequência, como a CLI faz: a segunda recebe as migrations que a primeira deixou no "disco"
 * (os nomes) e o lock dela. Devolve o resultado da segunda.
 */
function regenerate(before: object, after: object, at = now) {
  const first = generate(before, { now, existingMigrations: [] });
  const second = generate(after, {
    now: at,
    existingMigrations: migrationNames(first.files),
    previousLock: lockOf(first.files),
  });
  return { first, second };
}

const alterOf = (before: object, after: object) => {
  const { second } = regenerate(before, after);
  const files = alters(second.files);
  return { files, content: files[0]?.content ?? "", second };
};

describe("regerar sem mudança", () => {
  it("não cria migration nenhuma e o lock não muda", () => {
    const { first, second } = regenerate(loadFixture("manifest.json"), loadFixture("manifest.json"));

    expect(alters(second.files)).toEqual([]);
    expect(second.files.find((file) => file.path.includes("migrations/"))).toBeDefined();
    // as de criação continuam na lista, mas como create-once: nunca são reescritas
    for (const file of second.files.filter((file) => file.path.includes("_create_"))) expect(file.policy).toBe("create-once");
    expect(second.files[0].content).toBe(first.files[0].content);
    expect(second.warnings).toEqual([]);
  });

  it("mudar só o que não vai para o banco (hidden, rules, api) também não cria migration", () => {
    const before = manifest({ secret: "string" });
    const after = manifest({ secret: { type: "string", hidden: true, rules: ["min:3"] } });
    (after.pkg.entities.client as any).api = { perPage: 50 };

    expect(alters(regenerate(before, after).second.files)).toEqual([]);
  });
});

describe("migration de criação imutável", () => {
  it("com a entidade no lock e o arquivo no destino: create-once, mesmo nome, mesmo com o schema mudado", () => {
    const { first, second } = regenerate(manifest(), manifest({ phone: "string" }), new Date(2030, 0, 1));
    const created = first.files.find((file) => file.path.includes("_create_clients_table"))!;
    const kept = second.files.find((file) => file.path.includes("_create_clients_table"))!;

    expect(kept.path).toBe(created.path);
    expect(kept.policy).toBe("create-once");
  });

  it("sem lock anterior (projeto antigo) vale o comportamento antigo: reaproveita o nome e reescreve (overwrite)", () => {
    const first = generate(manifest(), { now, existingMigrations: [] });
    const second = generate(manifest({ phone: "string" }), { now, existingMigrations: migrationNames(first.files) });
    const kept = second.files.find((file) => file.path.includes("_create_clients_table"))!;

    expect(kept.path).toBe(first.files.find((file) => file.path.includes("_create_clients_table"))!.path);
    expect(kept.policy).toBe("overwrite");
    expect(kept.content).toContain("'phone'");
    expect(alters(second.files)).toEqual([]);
  });

  it("entidade no lock mas sem a migration no destino: gera uma de criação nova (overwrite), avisa e não gera alter", () => {
    const first = generate(manifest(), { now, existingMigrations: [] });
    const second = generate(manifest({ phone: "string" }), { now, existingMigrations: [], previousLock: lockOf(first.files) });
    const created = second.files.find((file) => file.path.includes("_create_clients_table"))!;

    expect(created.policy).toBe("overwrite");
    expect(created.content).toContain("'phone'");
    expect(alters(second.files)).toEqual([]);
    expect(second.warnings.join("\n")).toMatch(/migration de criação da tabela clients não existe/);
  });

  it("entidade nova (não estava no lock) ganha migration de criação normal (overwrite), sem alter", () => {
    const { second } = regenerate(manifest(), manifest({}, { note: { fields: { body: "text" } } }));
    const created = second.files.find((file) => file.path.includes("_create_notes_table"))!;

    expect(created.policy).toBe("overwrite");
    expect(alters(second.files)).toEqual([]);
  });
});

describe("diff de schema → migration alter", () => {
  it("campo adicionado: coluna com nullable, default e unique", () => {
    const { files, content } = alterOf(manifest(), manifest({ phone: { type: "string", required: false, unique: true }, level: { type: "integer", default: 1 } }));

    expect(files).toHaveLength(1);
    expect(files[0].path).toMatch(/^database\/migrations\/\d{4}_\d{2}_\d{2}_\d{6}_alter_clients_table\.php$/);
    expect(files[0].policy).toBe("create-once");
    expect(content).toContain("Schema::table('clients'");
    expect(content).toContain("$table->string('phone')->nullable();");
    expect(content).toContain("$table->integer('level')->default(1);");
    expect(content).toContain("$table->unique('phone');");
    // down: desfaz na ordem inversa
    const down = content.slice(content.indexOf("function down"));
    expect(down).toContain("$table->dropUnique(['phone']);");
    expect(down).toContain("$table->dropColumn('phone');");
    expect(down).toContain("$table->dropColumn('level');");
    expect(down.indexOf("dropUnique")).toBeLessThan(down.indexOf("dropColumn('phone')"));
  });

  it("campo removido: dropColumn no up e a coluna recriada (sem os dados) no down", () => {
    const { content } = alterOf(manifest({ nickname: { type: "string", required: false } }), manifest());
    const [up, down] = content.split("function down");

    expect(up).toContain("$table->dropColumn('nickname');");
    expect(down).toContain("$table->string('nickname')->nullable();");
    expect(down).toContain("não recupera os dados");
    expect(up).not.toContain("não recupera");
  });

  it("campo removido que era unique: dropUnique antes do dropColumn, e unique de volta no down", () => {
    const { content } = alterOf(manifest({ code: { type: "string", unique: true } }), manifest());
    const [up, down] = content.split("function down");

    expect(up.indexOf("dropUnique(['code'])")).toBeGreaterThan(-1);
    expect(up.indexOf("dropUnique(['code'])")).toBeLessThan(up.indexOf("dropColumn('code')"));
    expect(down.indexOf("string('code')")).toBeLessThan(down.indexOf("unique('code')"));
  });

  describe.each([
    ["tipo", { age: "integer" }, { age: "double" }, "$table->double('age')->change();", "$table->integer('age')->change();"],
    ["required", { age: "integer" }, { age: { type: "integer", required: false } }, "$table->integer('age')->nullable()->change();", "$table->integer('age')->change();"],
    ["default", { age: "integer" }, { age: { type: "integer", default: 18 } }, "$table->integer('age')->default(18)->change();", "$table->integer('age')->change();"],
    [
      "itens do enum",
      { kind: { type: "enum", enumItems: ["a", "b"] } },
      { kind: { type: "enum", enumItems: ["a", "b", "c"] } },
      "$table->enum('kind', ['a','b','c'])->default('a')->change();",
      "$table->enum('kind', ['a','b'])->default('a')->change();",
    ],
  ])("campo alterado: %s", (_label, from, to, upLine, downLine) => {
    const { content } = alterOf(manifest(from as any), manifest(to as any));
    const [up, down] = content.split("function down");

    it("->change() no up e a definição anterior no down", () => {
      expect(up).toContain(upLine);
      expect(down).toContain(downLine);
      expect(up).toContain("doctrine/dbal");
    });
  });

  it("unique ligado/desligado: só unique()/dropUnique(), sem ->change()", () => {
    const on = alterOf(manifest({ email: "string" }), manifest({ email: { type: "string", unique: true } })).content;
    const off = alterOf(manifest({ email: { type: "string", unique: true } }), manifest({ email: "string" })).content;

    expect(on).toContain("$table->unique('email');");
    expect(on.split("function down")[1]).toContain("$table->dropUnique(['email']);");
    expect(off).toContain("$table->dropUnique(['email']);");
    expect(off.split("function down")[1]).toContain("$table->unique('email');");
    expect(on).not.toContain("change()");
    expect(off).not.toContain("change()");
  });

  it("belongsTo adicionado: coluna + foreign (e dropForeign antes do dropColumn no down)", () => {
    const before = manifest({}, { order: { fields: { total: "double" } } });
    const after = manifest({}, { order: { fields: { total: "double" }, relationships: { belongsTo: [{ entity: "client", required: false }] } } });
    const { files, content } = alterOf(before, after);
    const [up, down] = content.split("function down");

    expect(files[0].path).toContain("_alter_orders_table.php");
    expect(up).toContain("$table->uuid('client_id')->nullable();");
    expect(up).toContain("$table->foreign('client_id')->references('id')->on('clients');");
    expect(up.indexOf("uuid('client_id')")).toBeLessThan(up.indexOf("foreign('client_id')"));
    expect(down.indexOf("dropForeign(['client_id'])")).toBeLessThan(down.indexOf("dropColumn('client_id')"));
  });

  it("belongsTo removido: dropForeign antes do dropColumn; no down, coluna e foreign de volta", () => {
    const before = manifest({}, { order: { fields: { total: "double" }, relationships: { belongsTo: ["client"] } } });
    const after = manifest({}, { order: { fields: { total: "double" } } });
    const [up, down] = alterOf(before, after).content.split("function down");

    expect(up.indexOf("dropForeign(['client_id'])")).toBeGreaterThan(-1);
    expect(up.indexOf("dropForeign(['client_id'])")).toBeLessThan(up.indexOf("dropColumn('client_id')"));
    expect(down.indexOf("uuid('client_id')")).toBeLessThan(down.indexOf("foreign('client_id')"));
  });

  it("uma migration alter por entidade alterada, depois das de criação, com nomes distintos", () => {
    const before = manifest({}, { note: { fields: { body: "text" } } });
    const after = manifest({ phone: "string" }, { note: { fields: { body: "text", title: "string" } }, tag: { fields: { label: "string" } } });
    const { second } = regenerate(before, after);
    const names = migrationNames(second.files);
    const created = names.filter((name) => name.includes("_create_"));
    const altered = names.filter((name) => name.includes("_alter_"));

    expect(altered.map((name) => name.replace(/^\d+_\d+_\d+_\d+_/, "")).sort()).toEqual(["alter_clients_table.php", "alter_notes_table.php"]);
    expect(new Set(altered).size).toBe(2);
    expect(altered.sort()[0] > created.sort()[created.length - 1]).toBe(true);
  });

  it("renomear campo vira remover + adicionar e gera um aviso destacado", () => {
    const { content, second } = alterOf(manifest({ nickname: "string" }), manifest({ alias: "string" }));

    expect(content).toContain("$table->dropColumn('nickname');");
    expect(content).toContain("$table->string('alias');");
    const warning = second.warnings.find((text) => text.startsWith("ATENÇÃO"))!;
    expect(warning).toMatch(/removidos \(nickname\) e adicionados \(alias\)/);
    expect(warning).toContain("renameColumn");
    expect(warning).toContain("_alter_clients_table.php");
  });

  it("coluna nova obrigatória e sem default avisa que falha em tabela com dados", () => {
    const { second } = alterOf(manifest(), manifest({ phone: "string" }));
    expect(second.warnings.join("\n")).toMatch(/"phone" é obrigatório e não tem default/);

    const ok = alterOf(manifest(), manifest({ phone: { type: "string", required: false }, level: { type: "integer", default: 1 } })).second;
    expect(ok.warnings).toEqual([]);
  });
});

describe("nomes e timestamps", () => {
  it("o mesmo alter em duas execuções distintas nunca colide: o prefixo é sempre depois das migrations existentes", () => {
    const g1 = generate(manifest(), { now, existingMigrations: [] });
    const g2 = generate(manifest({ a: { type: "string", required: false } }), { now, existingMigrations: migrationNames(g1.files), previousLock: lockOf(g1.files) });
    const g3 = generate(manifest({ a: { type: "string", required: false }, b: { type: "string", required: false } }), {
      now, // mesmo relógio da geração anterior
      existingMigrations: [...migrationNames(g1.files), ...migrationNames(alters(g2.files))],
      previousLock: lockOf(g2.files),
    });

    const [n2] = migrationNames(alters(g2.files));
    const [n3] = migrationNames(alters(g3.files));
    expect(n2).toMatch(/_alter_clients_table\.php$/);
    expect(n3).toMatch(/_alter_clients_table\.php$/);
    expect(n3).not.toBe(n2);
    expect(n3 > n2).toBe(true);
    expect(migrationNames(g1.files).every((name) => n2 > name)).toBe(true);
  });

  it("um relógio antigo (ou o lock com migrations que não estão mais no destino) não gera prefixo anterior ao já emitido", () => {
    const g1 = generate(manifest(), { now: new Date(2030, 0, 1), existingMigrations: [] });
    const g2 = generate(manifest({ a: { type: "string", required: false } }), { now, existingMigrations: [], previousLock: lockOf(g1.files) });
    const g3 = generate(manifest({ a: { type: "string", required: false } }), { now, existingMigrations: migrationNames(g1.files), previousLock: lockOf(g1.files) });

    // g2: a migration de criação não existe no destino; o lock ainda conta o prefixo dela
    expect(migrationNames(g2.files).every((name) => name > "2030_01_01_000000")).toBe(true);
    expect(migrationNames(alters(g3.files))[0] > migrationNames(g1.files)[0]).toBe(true);
  });
});

describe("formato do lock", () => {
  it("lockVersion 2, schema em entities e as migrations emitidas (criação e alter, com o que fazem)", () => {
    const { first, second } = regenerate(loadFixture("manifest.json"), loadFixture("manifest.after.json"));
    const lock = lockOf(second.files);

    expect(lockOf(first.files).lockVersion).toBe(2);
    expect(Object.keys(lock)).toEqual(["lockVersion", "code", "version", "entities", "migrations"]);
    expect(lock.migrations.map((m: any) => [m.type, m.table])).toEqual([
      ["create", "clients"], ["create", "orders"], ["create", "invoices"], ["alter", "clients"], ["alter", "orders"],
    ]);
    const alter = lock.migrations.find((m: any) => m.type === "alter" && m.table === "orders");
    expect(alter.changes).toEqual([
      { op: "dropForeign", column: "client_id" },
      { op: "dropColumn", column: "client_id" },
      { op: "addColumn", column: "invoice_id" },
      { op: "addForeign", column: "invoice_id" },
    ]);
  });

  it("o histórico acumula entre gerações e não repete arquivo", () => {
    const g1 = generate(manifest(), { now, existingMigrations: [] });
    const g2 = generate(manifest({ a: { type: "string", required: false } }), { now, existingMigrations: migrationNames(g1.files), previousLock: lockOf(g1.files) });
    const g3 = generate(manifest({ a: { type: "string", required: false } }), { now, existingMigrations: [...migrationNames(g2.files)], previousLock: lockOf(g2.files) });

    expect(lockOf(g2.files).migrations).toHaveLength(2);
    expect(lockOf(g3.files)).toEqual(lockOf(g2.files));
  });

  it("lock antigo (sem lockVersion e sem migrations): schema = entities; as migrations de criação do destino valem como emitidas", () => {
    const g1 = generate(manifest(), { now, existingMigrations: [] });
    const { lockVersion, migrations, ...legacy } = lockOf(g1.files);
    expect(lockVersion).toBe(2);
    expect(migrations).toHaveLength(1);

    // sem mudança: nada novo, e o lock é regravado no formato novo
    const same = generate(manifest(), { now, existingMigrations: migrationNames(g1.files), previousLock: legacy });
    expect(alters(same.files)).toEqual([]);
    expect(same.files.find((file) => file.path.includes("_create_clients_table"))!.policy).toBe("create-once");
    expect(lockOf(same.files)).toEqual(lockOf(g1.files));

    // com mudança: alter pelo diff contra o schema do lock antigo
    const changed = generate(manifest({ phone: { type: "string", required: false } }), { now, existingMigrations: migrationNames(g1.files), previousLock: legacy });
    expect(alters(changed.files)).toHaveLength(1);
    expect(lockOf(changed.files).migrations.map((m: any) => m.type)).toEqual(["create", "alter"]);
  });

  it("migrations malformadas no lock são ignoradas", () => {
    const g1 = generate(manifest(), { now, existingMigrations: [] });
    const lock = { ...lockOf(g1.files), migrations: [null, 3, { file: 1 }, { file: "x.php", table: "t", type: "drop" }] };
    const g2 = generate(manifest(), { now, existingMigrations: migrationNames(g1.files), previousLock: lock });

    expect(lockOf(g2.files).migrations).toEqual(lockOf(g1.files).migrations);
  });
});

describe("entidade removida", () => {
  it("segue só avisando (obsolete): nenhum drop table, e a migration de criação continua no lock", () => {
    const before = manifest({}, { note: { fields: { body: "text" } } });
    const g1 = generate(before, { now, existingMigrations: [] });
    const g2 = generate(manifest(), { now, existingMigrations: migrationNames(g1.files), previousLock: lockOf(g1.files) });

    expect(alters(g2.files)).toEqual([]);
    expect(g2.files.some((file) => file.content.includes("dropIfExists('notes')") && file.path.includes("notes"))).toBe(false);
    expect(g2.obsolete.some((item) => item.kind === "migration" && item.path.endsWith("_create_notes_table.php"))).toBe(true);
    expect(lockOf(g2.files).migrations.map((m: any) => m.table)).toEqual(["clients", "notes"]);
    expect(lockOf(g2.files).entities.note).toBeUndefined();
  });
});

describe("snapshot da fixture alter", () => {
  const { second } = regenerate(loadFixture("manifest.json"), loadFixture("manifest.after.json"));

  it("migrations alter e lock", async () => {
    for (const file of [...alters(second.files), second.files[0]]) {
      await expect(file.content).toMatchFileSnapshot(path.join(snapshotsDir, "alter", file.path));
    }
  });
});

describe("CLI: três gerações seguidas", () => {
  let tmp: string;
  let out: string;
  let stdout: string;
  let stderr: string;
  let clock: Date;

  const io = (): CliIo => ({ stdout: (t) => (stdout += t), stderr: (t) => (stderr += t), cwd: tmp, now: () => clock });
  const migrations = () => fs.readdirSync(path.join(out, "database/migrations")).sort();
  const manifestPath = () => path.join(tmp, "manifest.json");

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-alter-"));
    out = path.join(tmp, "projeto");
    stdout = "";
    stderr = "";
    clock = new Date(2025, 0, 2, 3, 4, 5);
  });
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("criar → mudar o manifest (alter) → regerar sem mudança (nenhuma migration nova), sem reescrever as de criação", () => {
    fs.writeFileSync(manifestPath(), JSON.stringify(loadFixture("manifest.json")));
    expect(run(["generate", manifestPath(), "--out", out], io())).toBe(0);
    const created = migrations();
    expect(created.map((name) => name.replace(/^[\d_]+/, ""))).toEqual(["create_clients_table.php", "create_orders_table.php"]);
    const createdContent = created.map((name) => fs.readFileSync(path.join(out, "database/migrations", name), "utf8"));

    // 2ª: o manifest muda (e o relógio anda)
    fs.writeFileSync(manifestPath(), JSON.stringify(loadFixture("manifest.after.json")));
    clock = new Date(2025, 5, 1, 10, 0, 0);
    stdout = "";
    const dry = run(["generate", manifestPath(), "--out", out, "--dry-run"], io());
    expect(dry).toBe(0);
    expect(stdout).toMatch(/criados \(\d+\):[\s\S]*_alter_clients_table\.php[\s\S]*_alter_orders_table\.php/);
    expect(migrations()).toEqual(created); // o dry-run não escreve

    stdout = "";
    expect(run(["generate", manifestPath(), "--out", out], io())).toBe(0);
    const afterChange = migrations();
    expect(afterChange).toHaveLength(created.length + 3); // invoice (criação) + 2 alter
    expect(afterChange.filter((name) => name.includes("_alter_")).map((name) => name.replace(/^[\d_]+/, ""))).toEqual(["alter_clients_table.php", "alter_orders_table.php"]);
    created.forEach((name, i) => expect(fs.readFileSync(path.join(out, "database/migrations", name), "utf8")).toBe(createdContent[i]));
    expect(stdout).toContain("Avisos");
    expect(stdout).toContain("ATENÇÃO");
    expect(stdout).toMatch(/preservados \(\d+\):[\s\S]*_create_clients_table\.php/);
    const lock = JSON.parse(fs.readFileSync(path.join(out, "manifest-lock.json"), "utf8"));
    expect(lock.lockVersion).toBe(2);
    expect(lock.migrations.map((m: any) => m.type)).toEqual(["create", "create", "create", "alter", "alter"]);

    // 3ª: sem mudança, mesmo com o relógio andando
    const snapshot = Object.fromEntries(afterChange.map((name) => [name, fs.readFileSync(path.join(out, "database/migrations", name), "utf8")]));
    const lockText = fs.readFileSync(path.join(out, "manifest-lock.json"), "utf8");
    clock = new Date(2026, 0, 1);
    stdout = "";
    expect(run(["generate", manifestPath(), "--out", out], io())).toBe(0);

    expect(migrations()).toEqual(afterChange);
    for (const [name, content] of Object.entries(snapshot)) expect(fs.readFileSync(path.join(out, "database/migrations", name), "utf8")).toBe(content);
    expect(fs.readFileSync(path.join(out, "manifest-lock.json"), "utf8")).toBe(lockText);
    expect(stdout).not.toContain("criados (");
    expect(stdout).not.toContain("ATENÇÃO");
    expect(stderr).toBe("");
  });

  it("projeto com lock antigo (sem lockVersion): regera normalmente e migra o lock para o formato novo", () => {
    fs.writeFileSync(manifestPath(), JSON.stringify(loadFixture("manifest.json")));
    run(["generate", manifestPath(), "--out", out], io());
    const lockPath = path.join(out, "manifest-lock.json");
    const { lockVersion, migrations: _ignored, ...legacy } = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    expect(lockVersion).toBe(2);
    fs.writeFileSync(lockPath, JSON.stringify(legacy, null, 2));
    const before = migrations();

    stdout = "";
    expect(run(["generate", manifestPath(), "--out", out], io())).toBe(0);

    expect(migrations()).toEqual(before);
    expect(JSON.parse(fs.readFileSync(lockPath, "utf8")).lockVersion).toBe(2);
  });
});
