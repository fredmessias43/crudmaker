import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CliIo, run } from "../src/cli";

// Ticket 24: o crudmaker só reescreve migrations que são dele. Uma entidade `user` num projeto criado pelo esqueleto
// oficial do Laravel (10, 11 ou 12) não pode estragar as migrations e o model do esqueleto.

const fixtures = path.join(__dirname, "fixtures/skeleton");
const manifestPath = path.join(fixtures, "manifest.json");

let tmp: string;
let out: string;
let stdout: string;
let stderr: string;

const io = (at = new Date(2025, 0, 2, 3, 4, 5)): CliIo => ({
  stdout: (t) => (stdout += t),
  stderr: (t) => (stderr += t),
  cwd: tmp,
  now: () => at,
});

const read = (file: string) => fs.readFileSync(path.join(out, file), "utf8");
const migrations = () => fs.readdirSync(path.join(out, "database/migrations")).sort();
const migrationOf = (suffix: string) => migrations().find((file) => file.endsWith(suffix))!;

/** Monta o destino como o esqueleto da versão: copia os fixtures e devolve o conteúdo original de cada arquivo. */
function installSkeleton(version: "laravel-10" | "laravel-11"): Map<string, string> {
  fs.cpSync(path.join(fixtures, version), out, { recursive: true });
  const originals = new Map<string, string>();
  for (const file of fs.readdirSync(out, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile())) {
    const full = path.join(file.parentPath, file.name);
    originals.set(path.relative(out, full), fs.readFileSync(full, "utf8"));
  }
  return originals;
}

const generate = (laravel: string, manifest = manifestPath, at?: Date) => run(["generate", manifest, "--out", out, "--laravel", laravel, "--php", "8.2"], io(at));

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-skeleton-"));
  out = path.join(tmp, "projeto");
  stdout = "";
  stderr = "";
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe.each([
  ["laravel-10", "10", "2014_10_12_000000_create_users_table.php"],
  ["laravel-11", "11", "0001_01_01_000000_create_users_table.php"],
] as const)("entidade user sobre o esqueleto do %s", (version, laravel, usersMigration) => {
  it("não altera nenhuma migration nem o User.php do esqueleto", () => {
    const originals = installSkeleton(version);

    expect(generate(laravel)).toBe(0);
    expect(stderr).toBe("");

    for (const [file, content] of originals) expect(read(file), file).toBe(content);
    // a migration de criação de users não foi duplicada nem renomeada
    expect(migrations().filter((file) => file.endsWith("_create_users_table.php"))).toEqual([usersMigration]);
  });

  it("gera alter_users_table só com as colunas que o esqueleto não tem", () => {
    installSkeleton(version);
    generate(laravel);

    const alter = read(`database/migrations/${migrationOf("_alter_users_table.php")}`);
    expect(alter).toContain("Schema::table('users'");
    expect(alter).toContain("$table->string('phone')->nullable();");
    // o que o esqueleto já tem nunca é redeclarado
    for (const column of ["'id'", "'name'", "'email'", "'password'", "'email_verified_at'", "remember_token"]) expect(alter).not.toContain(column);
    expect(alter).toContain("$table->dropColumn('phone');");
    expect(alter).toContain("ARQUIVO GERADO PELO CRUDMAKER");

    const lock = JSON.parse(read("manifest-lock.json"));
    expect(lock.migrations.map((m: any) => [m.table, m.type])).toContainEqual(["users", "alter"]);
    // a migration de criação do esqueleto não é registrada: não é do crudmaker
    expect(lock.migrations.map((m: any) => m.file)).not.toContain(usersMigration);
  });

  it("regerar não cria outra alter nem mexe no esqueleto; coluna nova entra numa alter nova", () => {
    const originals = installSkeleton(version);
    generate(laravel);
    const first = migrations();

    expect(generate(laravel, manifestPath, new Date(2030, 0, 1))).toBe(0);
    expect(migrations()).toEqual(first);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.pkg.entities.user.fields.nickname = { type: "string", required: false };
    delete manifest.pkg.entities.user.fields.name; // coluna do esqueleto removida do manifest: nunca vira dropColumn
    const changed = path.join(tmp, "changed.json");
    fs.writeFileSync(changed, JSON.stringify(manifest));
    expect(generate(laravel, changed, new Date(2030, 0, 2))).toBe(0);

    const alters = migrations().filter((file) => file.includes("_alter_users_table"));
    expect(alters).toHaveLength(2);
    const second = read(`database/migrations/${alters.find((file) => !first.includes(file))!}`);
    expect(second).toContain("$table->string('nickname')->nullable();");
    expect(second).not.toContain("dropColumn('name')");
    for (const [file, content] of originals) expect(read(file), file).toBe(content);
  });

  it("usa FK bigint para users e a regra integer nas requests de quem aponta para ele", () => {
    installSkeleton(version);
    generate(laravel);

    const post = read(`database/migrations/${migrationOf("_create_posts_table.php")}`);
    expect(post).toContain("$table->unsignedBigInteger('user_id');");
    expect(post).not.toContain("uuid('user_id')");
    expect(post).toContain("$table->foreign('user_id')->references('id')->on('users');");

    const request = read("app/Generated/Http/Requests/BasePostRequest.php");
    expect(request).toMatch(/'user_id' => array\([^)]*'integer'[^)]*Rule::exists\('users', 'id'\)/s);
    expect(request).not.toMatch(/'user_id' => array\([^)]*'uuid'/s);
  });

  it("gera a model base de user autenticável, com id bigint e sem SoftDeletes", () => {
    installSkeleton(version);
    generate(laravel);

    const base = read("app/Generated/Models/BaseUser.php");
    expect(base).toContain("use Illuminate\\Foundation\\Auth\\User as Authenticatable;");
    expect(base).toContain("use Illuminate\\Notifications\\Notifiable;");
    expect(base).toContain("abstract class BaseUser extends Authenticatable");
    expect(base).toContain("use HasFactory;");
    expect(base).toContain("use Notifiable;");
    expect(base).not.toMatch(/HasUuids|SoftDeletes|\$keyType|\$incrementing/);
    expect(base).toContain("'password' => 'hashed',");
    expect(base).toContain("'email_verified_at' => 'datetime',");
    const hidden = base.slice(base.indexOf("$hidden"));
    expect(hidden).toContain("'password',");
    expect(hidden).toContain("'remember_token',");
    // o id é do banco: fora do $fillable
    expect(base.slice(base.indexOf("$fillable"), base.indexOf("$hidden"))).not.toContain("'id'");

    // a model de quem aponta para user continua uuid
    expect(read("app/Generated/Models/BasePost.php")).toContain("HasUuids");
  });

  it("avisa como migrar o User.php do esqueleto para a base", () => {
    installSkeleton(version);
    generate(laravel);

    expect(stdout).toContain("app/Models/User.php: é o model do esqueleto do Laravel");
    expect(stdout).toContain('extends \\App\\Generated\\Models\\BaseUser');
    expect(stdout).toContain(`A tabela users já existe (${usersMigration}`);
  });
});

describe("migration de criação de fora do crudmaker", () => {
  const strange = "2020_01_01_000000_create_posts_table.php";
  const strangeContent = "<?php\n// migration escrita à mão\nSchema::create('posts', fn ($t) => $t->id());\n";

  it("de uma tabela que não é a users nunca é reescrita: nada é gerado e há aviso", () => {
    fs.mkdirSync(path.join(out, "database/migrations"), { recursive: true });
    fs.writeFileSync(path.join(out, "database/migrations", strange), strangeContent);

    expect(generate("12")).toBe(0);

    expect(read(`database/migrations/${strange}`)).toBe(strangeContent);
    expect(migrations().filter((file) => file.includes("posts"))).toEqual([strange]);
    expect(stdout).toContain("A tabela posts já existe");
    expect(stdout).toContain("que não é do crudmaker");
    // sem a users do esqueleto, a entidade user segue o comportamento de sempre (uuid)
    expect(read("app/Generated/Models/BaseUser.php")).toContain("HasUuids");
    expect(read(`database/migrations/${migrationOf("_create_users_table.php")}`)).toContain("uuid('user_id')".replace("user_id", "id"));
  });

  it("com o cabeçalho de gerado volta a ser do crudmaker", () => {
    run(["generate", manifestPath, "--out", out, "--laravel", "12", "--php", "8.2"], io());
    const file = migrationOf("_create_posts_table.php");
    expect(read(`database/migrations/${file}`)).toContain("ARQUIVO GERADO PELO CRUDMAKER");
    fs.rmSync(path.join(out, "manifest-lock.json"));

    stdout = "";
    expect(generate("12", manifestPath, new Date(2030, 0, 1))).toBe(0);
    expect(migrations().filter((name) => name.includes("_posts_table"))).toEqual([file]);
    expect(stdout).not.toContain("A tabela posts já existe");
  });

  it("registrada no lock (gerada por versão sem cabeçalho) continua sendo do crudmaker", () => {
    run(["generate", manifestPath, "--out", out, "--laravel", "12", "--php", "8.2"], io());
    const file = migrationOf("_create_posts_table.php");
    const full = path.join(out, "database/migrations", file);
    fs.writeFileSync(full, fs.readFileSync(full, "utf8").replace(/^\/\/ .*\n/gm, ""));

    stdout = "";
    expect(generate("12", manifestPath, new Date(2030, 0, 1))).toBe(0);
    expect(stdout).not.toContain("A tabela posts já existe");
    expect(migrations().filter((name) => name.includes("_posts_table"))).toEqual([file]);
  });
});
