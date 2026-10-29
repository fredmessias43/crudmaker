import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { run } from "../src/cli";
import { generate } from "../src/generate";
import { GENERATED_MARKER } from "../src/targets/types";

// Ticket 19: testes Pest gerados por entidade em tests/Feature/Crudmaker/<Entidade>Test.php. Os snapshots completos
// ficam em __snapshots__/<fixture>/tests/Feature/Crudmaker (rodados em generate.test.ts, apiOptions.test.ts...);
// aqui ficam as asserções de comportamento.

const fixturesDir = path.join(__dirname, "fixtures");
const now = new Date(2025, 0, 2, 3, 4, 5);

const loadManifest = (name: string) => JSON.parse(fs.readFileSync(path.join(fixturesDir, name, "manifest.json"), "utf8"));
const manifestOf = (entities: object, defaults?: object) => ({ system: { code: "s" }, pkg: { code: "p", ...(defaults && { defaults }), entities } }) as any;

function generated(manifest: unknown, options: object = {}) {
  const result = generate(manifest as any, { now, existingMigrations: [], ...options });
  const files = new Map(result.files.map((file) => [file.path, file]));
  const test = (entity: string) => files.get(`tests/Feature/Crudmaker/${entity}Test.php`)?.content;
  return { ...result, files, test };
}

describe("api-options: autenticação, actions restritas e rotas aninhadas", () => {
  const { files, test } = generated(loadManifest("api-options"));

  it("gera um arquivo por entidade, na camada gerada (overwrite, com o cabeçalho de gerado)", () => {
    for (const entity of ["Client", "Address", "Alert", "Tag"]) {
      const file = files.get(`tests/Feature/Crudmaker/${entity}Test.php`)!;
      expect(file.policy).toBe("overwrite");
      expect(file.content).toContain(GENERATED_MARKER);
      expect(file.content).toContain("uses(RefreshDatabase::class);");
    }
  });

  it("actions desabilitadas não ganham teste (client sem destroy; tag só index e show)", () => {
    const client = test("Client")!;
    expect(client).toContain("test('index:");
    expect(client).toContain("test('store:");
    expect(client).toContain("test('show:");
    expect(client).toContain("test('update:");
    expect(client).not.toContain("test('destroy:");
    expect(client).not.toContain("deleteJson");

    const tag = test("Tag")!;
    expect(tag).toContain("test('index:");
    expect(tag).toContain("test('show:");
    for (const action of ["store", "update", "destroy"]) expect(tag).not.toContain(`test('${action}:`);
    expect(tag).not.toMatch(/postJson|putJson|deleteJson/);
  });

  it("auth:sanctum autentica com actingAs no guard sanctum (sem exigir HasApiTokens) e testa o 401; sem middleware não há autenticação", () => {
    const client = test("Client")!;
    expect(client).not.toContain("Sanctum::");
    expect(client).toContain("use App\\Models\\User;");
    expect(client).toContain("test()->actingAs($user, 'sanctum');");
    expect(client).toContain("test('exige autenticação'");
    expect(client).toContain("$this->getJson(route('clients.index'))->assertUnauthorized();");
    expect(client).toContain("clientSignIn();");
    // verified e throttle não exigem tratamento: o usuário da factory é verificado
    expect(client).not.toContain("ATENÇÃO");
    expect(test("Alert")).not.toContain("ATENÇÃO");

    const tag = test("Tag")!;
    expect(tag).not.toContain("Sanctum");
    expect(tag).not.toContain("SignIn");
    expect(tag).not.toContain("assertUnauthorized");
  });

  it("monta o payload com enum pelo valor e confere o per_page do manifest", () => {
    const client = test("Client")!;
    expect(client).toContain("'status' => $model->status?->value,");
    expect(client).toContain("->assertJsonPath('meta.per_page', 20);");
    expect(test("Alert")).toContain("->assertJsonPath('meta.per_page', 25);");
    expect(client).toContain("->assertJsonValidationErrors(['name', 'email', 'status', 'vip']);");
    // campo unique: teste de duplicidade
    expect(client).toContain("test('store: rejeita email já usado com 422'");
  });

  it("rotas aninhadas: o teste fica no arquivo do filho, com a rota nomeada do pai", () => {
    const address = test("Address")!;
    expect(address).toContain("route('clients.address.show', $parent)");
    expect(address).toContain("route('clients.address.store', $parent)");
    expect(address).toContain("devolve 409");
    expect(address).toContain("use Illuminate\\Support\\Arr;");
    expect(address).toContain("Arr::except(addressPayload(), ['client_id'])");

    const alert = test("Alert")!;
    expect(alert).toContain("route('clients.alerts.index', $parent)");
    expect(alert).toContain("route('clients.alerts.store', $parent)");
    expect(alert).toContain("->assertJsonPath('meta.total', 2);");
    // o pai não ganha teste das rotas do filho
    expect(test("Client")).not.toContain("clients.alerts");
  });
});

describe("vende-que-vende-api: datas, hidden e soft delete", () => {
  it("sem middleware, todas as actions, soft delete e 404 com uuid", () => {
    const client = generated(loadManifest("vende-que-vende-api")).test("Client")!;

    expect(client).not.toContain("SignIn");
    for (const action of ["index", "store", "show", "update", "destroy"]) expect(client).toContain(`test('${action}:`);
    expect(client).toContain("$this->assertSoftDeleted($record);");
    expect(client).toContain("route('clients.show', [(string) Str::uuid()])");
  });
});

describe("payload válido para a request", () => {
  const manifest = manifestOf({
    thing: {
      fields: {
        id: "uuid",
        name: "string",
        secret: { type: "string", hidden: true },
        kind: { type: "enum", enumItems: ["a", "b"] },
        day: "date",
        at: "datetime",
        options: "json",
        score: "double",
        active: "boolean",
      },
    },
  });

  it("data e datetime nos formatos da request, enum pelo valor, json nunca vazio, hidden fora do JSON e do banco", () => {
    const thing = generated(manifest).test("Thing")!;

    expect(thing).toContain("'day' => $model->day?->format('Y-m-d'),");
    expect(thing).toContain("'at' => $model->at?->format('Y-m-d H:i'),");
    expect(thing).toContain("'kind' => $model->kind?->value,");
    expect(thing).toContain("'options' => $model->options ?: ['crudmaker' => true],");
    // o hidden entra no corpo (a request exige), mas não é conferido no banco e não pode aparecer na resposta
    expect(thing).toContain("'secret' => $model->secret,");
    expect(thing).toContain("->assertJsonMissingPath('data.secret')");
    expect(thing).not.toContain("'secret' => $payload['secret']");
    // data, json, boolean e decimal variam por driver: não entram no assertDatabaseHas
    expect(thing).toContain("'name' => $payload['name'],");
    expect(thing).toContain("'kind' => $payload['kind'],");
    expect(thing).not.toContain("$payload['day']");
    expect(thing).not.toContain("$payload['options']");
    expect(thing).not.toContain("$payload['score']");
    expect(thing).not.toContain("$payload['active']");
  });
});

describe("middlewares", () => {
  const withMiddleware = (middleware: string[]) =>
    generated(manifestOf({ thing: { fields: { id: "uuid", name: "string" }, api: { middleware } } })).test("Thing")!;

  it("auth (sem guard) usa actingAs; auth:<guard> passa o guard", () => {
    expect(withMiddleware(["auth"])).toContain("test()->actingAs($user);");
    expect(withMiddleware(["auth:api"])).toContain("test()->actingAs($user, 'api');");
    expect(withMiddleware(["auth"])).not.toContain("'sanctum'");
  });

  it("middlewares que o gerador não sabe satisfazer são avisados no cabeçalho", () => {
    const content = withMiddleware(["auth:sanctum", "can:manage", "throttle:60,1"]);
    expect(content).toContain("ATENÇÃO: estes middlewares não são tratados pelo gerador e podem barrar os testes: can:manage.");
  });

  it("sem auth, middlewares como throttle não geram autenticação", () => {
    const content = withMiddleware(["throttle:60,1"]);
    expect(content).not.toContain("SignIn");
    expect(content).not.toContain("ATENÇÃO");
  });
});

describe("api.tests: false", () => {
  it("desliga o arquivo da entidade; em pkg.defaults.api, de todas; a entidade pode religar", () => {
    const entities = { a: { fields: { id: "uuid", n: "string" } }, b: { fields: { id: "uuid", n: "string" }, api: { tests: true } }, c: { fields: { id: "uuid", n: "string" }, api: { tests: false } } };

    const normal = generated(manifestOf(entities)).files;
    expect([...normal.keys()].filter((p) => p.startsWith("tests/"))).toEqual(["tests/Feature/Crudmaker/ATest.php", "tests/Feature/Crudmaker/BTest.php"]);

    const off = generated(manifestOf(entities, { api: { tests: false } })).files;
    expect([...off.keys()].filter((p) => p.startsWith("tests/"))).toEqual(["tests/Feature/Crudmaker/BTest.php"]);
  });

  it("o arquivo de testes que deixou de ser gerado vira obsoleto (generated)", () => {
    const on = manifestOf({ a: { fields: { id: "uuid", n: "string" } } });
    const off = manifestOf({ a: { fields: { id: "uuid", n: "string" }, api: { tests: false } } });
    const lock = JSON.parse(generated(on).files.get("manifest-lock.json")!.content);

    const { obsolete } = generated(off, { previousLock: lock });
    expect(obsolete).toContainEqual({ path: "tests/Feature/Crudmaker/ATest.php", kind: "generated" });
  });

  it("valida: tests precisa ser booleano", () => {
    expect(() => generate(manifestOf({ a: { fields: { id: "uuid" }, api: { tests: "no" } } }), { now, existingMigrations: [] })).toThrow(/tests/);
  });
});

describe("entidade user do esqueleto (id bigint, sem soft delete)", () => {
  const skeleton = path.join(fixturesDir, "skeleton/laravel-11/database/migrations");
  const existing = fs.readdirSync(skeleton);
  const user = generated(JSON.parse(fs.readFileSync(path.join(fixturesDir, "skeleton/manifest.json"), "utf8")), { existingMigrations: existing, unmarkedMigrations: existing }).test("User")!;

  it("destroy confere a remoção definitiva e o 404 usa um id numérico", () => {
    expect(user).toContain("$this->assertModelMissing($record);");
    expect(user).not.toContain("assertSoftDeleted");
    expect(user).toContain("route('users.show', [999999])");
    expect(user).not.toContain("Str::uuid");
  });

  it("o campo hidden (password) vai no corpo mas não na resposta; o id não entra no payload", () => {
    expect(user).toContain("'password' => $model->password,");
    expect(user).toContain("->assertJsonMissingPath('data.password')");
    expect(user).not.toContain("'id' => $model->id");
  });
});

describe("CLI: api.tests false remove o arquivo gerado antes (e só ele)", () => {
  let tmp: string;
  beforeEach(() => void (tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-pest-"))));
  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

  const cli = (args: string[]) => {
    let stdout = "";
    const code = run(args, { stdout: (t) => (stdout += t), stderr: () => {}, cwd: tmp, now: () => now });
    return { code, stdout };
  };

  it("apaga o teste gerado quando a entidade desliga, mantém os arquivos do usuário na mesma pasta", () => {
    const out = path.join(tmp, "projeto");
    const manifest = path.join(tmp, "manifest.json");
    const write = (tests: boolean) => fs.writeFileSync(manifest, JSON.stringify(manifestOf({ a: { fields: { id: "uuid", n: "string" }, api: { tests } } })));

    write(true);
    expect(cli(["generate", manifest, "--out", out]).code).toBe(0);
    expect(fs.existsSync(path.join(out, "tests/Feature/Crudmaker/ATest.php"))).toBe(true);

    write(false);
    const result = cli(["generate", manifest, "--out", out]);
    expect(result.code).toBe(0);
    expect(fs.existsSync(path.join(out, "tests/Feature/Crudmaker/ATest.php"))).toBe(false);

    // arquivo do usuário na mesma pasta (sem o cabeçalho de gerado) nunca é apagado
    write(true);
    cli(["generate", manifest, "--out", out]);
    fs.writeFileSync(path.join(out, "tests/Feature/Crudmaker/BTest.php"), "<?php // meu\n");
    fs.writeFileSync(path.join(out, "tests/Feature/Crudmaker/ATest.php"), "<?php // troquei pelo meu\n");
    write(false);
    cli(["generate", manifest, "--out", out]);
    expect(fs.readFileSync(path.join(out, "tests/Feature/Crudmaker/BTest.php"), "utf8")).toBe("<?php // meu\n");
    expect(fs.readFileSync(path.join(out, "tests/Feature/Crudmaker/ATest.php"), "utf8")).toBe("<?php // troquei pelo meu\n");
  });
});
