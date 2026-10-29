import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CliIo, run } from "../src/cli";
import { generate, GeneratedFile } from "../src/generate";
import { GENERATED_MARKER } from "../src/targets/types";
import { applyRemovals, legacyFinalWarnings, planRemovals, planWrites } from "../src/writeFiles";

// Ticket 10: camada gerada (bases em App\Generated, sempre sobrescritas) × camada de customização
// (classes finais, criadas uma única vez) e os hooks. Os snapshots em __snapshots__ guardam o texto
// completo; aqui ficam as asserções de comportamento.

const fixturesDir = path.join(__dirname, "fixtures");
const now = new Date(2025, 0, 2, 3, 4, 5);

function loadManifest(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name, "manifest.json"), "utf8"));
}

describe("camadas gerada e de customização (vende-que-vende-api)", () => {
  const { files } = generate(loadManifest("vende-que-vende-api"), { now, existingMigrations: [] });
  const content = (p: string) => files.find((file) => file.path === p)!.content;
  const file = (p: string) => files.find((f) => f.path === p)!;

  const bases = {
    model: "app/Generated/Models/BaseClient.php",
    controller: "app/Generated/Http/Controllers/Api/BaseClientController.php",
    request: "app/Generated/Http/Requests/BaseClientRequest.php",
    resource: "app/Generated/Http/Resources/BaseClientResource.php",
    collection: "app/Generated/Http/Resources/BaseClientCollection.php",
  };
  const finals = {
    model: "app/Models/Client.php",
    controller: "app/Http/Controllers/Api/ClientController.php",
    request: "app/Http/Requests/ClientRequest.php",
    resource: "app/Http/Resources/ClientResource.php",
    collection: "app/Http/Resources/ClientCollection.php",
  };

  /** Corpo de uma action: do `public function <nome>(` até a próxima função. */
  function action(source: string, name: string): string {
    const start = source.lastIndexOf("\n", source.indexOf(`function ${name}(`)) + 1;
    const next = source.slice(start + 1).search(/\n\t(?:\/\*|public function|protected function)/);
    return source.slice(start, next === -1 ? undefined : start + 1 + next);
  }

  it("cada classe tem base (overwrite, com cabeçalho de gerado) e final (create-once, sem cabeçalho)", () => {
    for (const p of Object.values(bases)) {
      expect(file(p).policy, p).toBe("overwrite");
      expect(file(p).content, p).toContain(GENERATED_MARKER);
      expect(file(p).content, p).toMatch(/^abstract class Base\w+ extends /m);
      expect(file(p).generatedBase).toBeUndefined();
    }
    for (const [type, p] of Object.entries(finals)) {
      expect(file(p).policy, p).toBe("create-once");
      expect(file(p).content, p).not.toContain(GENERATED_MARKER);
      expect(file(p).generatedBase!.path, p).toBe(bases[type as keyof typeof bases]);
    }
  });

  it("migration, rotas e lock não têm base nem final (continuam overwrite)", () => {
    for (const p of ["manifest-lock.json", "routes/crudmaker.php", "database/migrations/2025_01_02_030405_create_clients_table.php"]) {
      expect(file(p).policy, p).toBe("overwrite");
    }
    expect(files.filter((f) => f.path.includes("Base") && f.path.includes("migrations"))).toEqual([]);
  });

  it("as finais estendem as bases e nascem vazias, só com o comentário dos hooks", () => {
    const expected: { [type: string]: string } = {
      model: "class Client extends BaseClient\n",
      controller: "class ClientController extends BaseClientController\n",
      request: "class ClientRequest extends BaseClientRequest\n",
      resource: "class ClientResource extends BaseClientResource\n",
      collection: "class ClientCollection extends BaseClientCollection\n",
    };

    for (const [type, p] of Object.entries(finals)) {
      const source = content(p);
      expect(source, p).toContain(expected[type]);
      expect(source, p).toContain(`use ${file(bases[type as keyof typeof bases]).path.replace(/^app\//, "App/").replace(/\.php$/, "").replaceAll("/", "\\")};`);
      // sem código: tirando os comentários, o corpo da classe é só `{ }`
      const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
      expect(withoutComments, p).toMatch(/\{\s*\}\s*$/);
      expect(withoutComments, p).not.toContain("function");
    }
  });

  it("a final do controller lista os 7 hooks com assinatura (e a da request e da resource, os seus)", () => {
    const controller = content(finals.controller);
    for (const signature of [
      "indexQuery(Builder $query, Request $request): Builder",
      "beforeStore(array $data, Request $request): array",
      "afterStore(Client $model, Request $request): void",
      "beforeUpdate(Client $model, array $data, Request $request): array",
      "afterUpdate(Client $model, Request $request): void",
      "beforeDestroy(Client $model, Request $request): void",
      "afterDestroy(Client $model, Request $request): void",
    ]) {
      expect(controller).toContain(`protected function ${signature}`);
    }
    expect(content(finals.request)).toContain("extraRules(): array");
    expect(content(finals.request)).toContain("authorize(): bool");
    expect(content(finals.resource)).toContain("extra(Request $request): array");
  });

  describe("controller base", () => {
    const base = content(bases.controller);

    it("declara os 7 hooks como protected, sem efeito (devolvem a entrada)", () => {
      expect(action(base, "indexQuery")).toMatch(/protected function indexQuery\(Builder \$query, Request \$request\): Builder\n\t\{\n\t\treturn \$query;/);
      expect(action(base, "beforeStore")).toMatch(/protected function beforeStore\(array \$data, Request \$request\): array\n\t\{\n\t\treturn \$data;/);
      expect(action(base, "beforeUpdate")).toMatch(/beforeUpdate\(Client \$model, array \$data, Request \$request\): array\n\t\{\n\t\treturn \$data;/);
      for (const name of ["afterStore", "afterUpdate", "beforeDestroy", "afterDestroy"]) {
        expect(action(base, name)).toMatch(new RegExp(`protected function ${name}\\(Client \\$model, Request \\$request\\): void\\n\\t\\{\\n\\t\\}`));
      }
    });

    it("index: monta a query, passa pelo indexQuery e só depois pagina (sem transação)", () => {
      const index = action(base, "index");

      expect(index.indexOf("$this->indexQuery(Client::query(), $request)")).toBeGreaterThan(-1);
      expect(index.indexOf("indexQuery")).toBeLessThan(index.indexOf("->paginate(15)"));
      expect(index).not.toContain("DB::transaction");
    });

    it("store: beforeStore → create → afterStore, tudo dentro de DB::transaction", () => {
      const store = action(base, "store");
      const order = ["DB::transaction(", "$this->beforeStore($request->validated(), $request)", "Client::create($data)", "$this->afterStore($model, $request)"];

      expect(order.map((s) => store.indexOf(s)).every((i) => i > -1)).toBe(true);
      expect(order.map((s) => store.indexOf(s))).toEqual([...order.map((s) => store.indexOf(s))].sort((a, b) => a - b));
      // a resposta é montada depois de fechar a transação
      expect(store.indexOf("});")).toBeLessThan(store.indexOf("return response()->json"));
    });

    it("update: beforeUpdate → update → afterUpdate, tudo dentro de DB::transaction", () => {
      const update = action(base, "update");
      const order = ["DB::transaction(", "$this->beforeUpdate($client, $request->validated(), $request)", "$client->update($data)", "$this->afterUpdate($client, $request)"];

      expect(order.map((s) => update.indexOf(s))).toEqual([...order.map((s) => update.indexOf(s))].sort((a, b) => a - b));
      expect(order.every((s) => update.includes(s))).toBe(true);
      expect(update.indexOf("});")).toBeLessThan(update.indexOf("return response()->json"));
    });

    it("destroy: beforeDestroy → delete → afterDestroy, tudo dentro de DB::transaction", () => {
      const destroy = action(base, "destroy");
      const order = ["DB::transaction(", "$this->beforeDestroy($client, $request)", "$client->delete()", "$this->afterDestroy($client, $request)"];

      expect(order.every((s) => destroy.includes(s))).toBe(true);
      expect(order.map((s) => destroy.indexOf(s))).toEqual([...order.map((s) => destroy.indexOf(s))].sort((a, b) => a - b));
      expect(destroy.indexOf("});")).toBeLessThan(destroy.indexOf("return response()->noContent()"));
    });

    it("show não usa hook nem transação", () => {
      const show = action(base, "show");

      expect(show).not.toContain("DB::transaction");
      expect(show).not.toMatch(/\$this->(?:index|before|after)/);
    });

    it("tipa as classes finais (model, request, resource, collection), nunca as bases", () => {
      expect(base).toContain("use App\\Models\\Client;");
      expect(base).toContain("use App\\Http\\Requests\\ClientRequest;");
      expect(base).toContain("use App\\Http\\Resources\\ClientCollection;");
      expect(base).toContain("use App\\Http\\Resources\\ClientResource;");
      expect(base).toContain("public function store(ClientRequest $request)");
      expect(base).toContain("public function update(ClientRequest $request, Client $client)");
      expect(base).toContain("public function show(Client $client)");
      expect(base).not.toMatch(/\bBase(?:Client|ClientRequest|ClientResource|ClientCollection)\b(?!Controller)/);
      expect(base).not.toContain("App\\Generated\\Models");
    });
  });

  it("a base da request junta as regras geradas com extraRules(), e o authorize() fica na base (sobrescrevível)", () => {
    const base = content(bases.request);

    expect(base).toContain("return array_merge($this->generatedRules(), $this->extraRules());");
    expect(base).toMatch(/protected function extraRules\(\): array\n\t\{\n\t\treturn \[\];/);
    expect(base).toContain("public function authorize()");
    // a instanceof do prepareForValidation usa a model final, a que o route model binding entrega
    expect(base).toContain("use App\\Models\\Client;");
    expect(base).toContain("$client instanceof Client");
  });

  it("a base da resource junta os campos gerados com extra()", () => {
    const base = content(bases.resource);

    expect(base).toContain("return array_merge([");
    expect(base).toContain("], $this->extra($request));");
    expect(base).toMatch(/protected function extra\(Request \$request\): array\n\t\{\n\t\treturn \[\];/);
  });

  it("a base da collection usa a resource final por item e não tem hook", () => {
    const base = content(bases.collection);

    expect(base).toContain("use App\\Http\\Resources\\ClientResource;");
    expect(base).toContain("public $collects = ClientResource::class;");
    expect(base).not.toContain("protected function");
  });

  it("rotas e relacionamentos usam sempre as classes finais", () => {
    const routes = content("routes/crudmaker.php");
    expect(routes).toContain("use App\\Http\\Controllers\\Api\\ClientController;");
    expect(routes).not.toContain("Generated");
    expect(routes).not.toContain("Base");

    const model = content(bases.model);
    expect(model).toContain("use App\\Models\\Note;");
    expect(model).toContain("use App\\Models\\Address;");
    expect(model).toContain("return $this->hasOne(Note::class);");
    expect(model).toMatch(/^abstract class BaseClient extends Model$/m);
    // a base nunca cita a final da própria entidade: o Eloquent deduz tabela e FKs de `static`
    expect(model).not.toContain("use App\\Models\\Client;");
  });

  it("relacionamento da entidade para ela mesma importa a final", () => {
    const m = { system: { code: "s" }, pkg: { code: "p", entities: { node: { fields: { id: "uuid" }, relationships: { belongsTo: ["node"] } } } } };
    const model = generate(m, { now, existingMigrations: [] }).files.find((f) => f.path === "app/Generated/Models/BaseNode.php")!.content;

    expect(model).toContain("use App\\Models\\Node;");
    expect(model).toContain("$this->belongsTo(Node::class)");
  });

  it("as bases ficam em app/Generated e as finais fora dele", () => {
    for (const f of files.filter((f) => f.path.startsWith("app/"))) {
      expect(f.policy).toBe(f.path.startsWith("app/Generated/") ? "overwrite" : "create-once");
    }
  });
});

/** Duas entidades: `note` pertence a `client`, então `note` pode sair do manifest sozinha. */
function smallManifest(entities: string[] = ["client", "note"]) {
  const all: { [name: string]: object } = {
    client: { fields: { id: "uuid", name: "string", email: "string" } },
    note: { fields: { id: "uuid", body: "text" }, relationships: { belongsTo: ["client"] } },
  };
  return { system: { code: "s" }, pkg: { code: "p", entities: Object.fromEntries(entities.map((name) => [name, all[name]])) } } as any;
}

describe("arquivos obsoletos (entidade que saiu do manifest)", () => {
  const manifest = smallManifest();
  const lockOf = (m: object) => JSON.parse(generate(m, { now, existingMigrations: [] }).files[0].content);
  const without = (entity: string) => smallManifest(Object.keys(manifest.pkg.entities).filter((name) => name !== entity));

  it("sem lock anterior, ou com o mesmo manifest, não há nada obsoleto", () => {
    expect(generate(manifest, { now, existingMigrations: [] }).obsolete).toEqual([]);
    expect(generate(manifest, { now, existingMigrations: [], previousLock: null }).obsolete).toEqual([]);
    expect(generate(manifest, { now, existingMigrations: [], previousLock: lockOf(manifest) }).obsolete).toEqual([]);
  });

  it("entidade removida: a camada gerada vira 'generated', as finais 'custom'", () => {
    const { obsolete } = generate(without("note"), { now, existingMigrations: [], previousLock: lockOf(manifest) });

    expect(obsolete.filter((o) => o.kind === "generated").map((o) => o.path)).toEqual([
      "app/Generated/Models/BaseNote.php",
      "app/Generated/Http/Resources/BaseNoteResource.php",
      "app/Generated/Http/Resources/BaseNoteCollection.php",
      "app/Generated/Http/Controllers/Api/BaseNoteController.php",
      "app/Generated/Http/Requests/BaseNoteRequest.php",
      "app/Generated/Factories/BaseNoteFactory.php",
    ]);
    expect(obsolete.filter((o) => o.kind === "custom").map((o) => o.path)).toEqual([
      "app/Models/Note.php",
      "app/Http/Resources/NoteResource.php",
      "app/Http/Resources/NoteCollection.php",
      "app/Http/Controllers/Api/NoteController.php",
      "app/Http/Requests/NoteRequest.php",
      "database/factories/NoteFactory.php",
    ]);
    // sem migration existente no destino, não há migration a avisar
    expect(obsolete.some((o) => o.kind === "migration")).toBe(false);
  });

  it("migration da entidade removida só aparece se já existe no destino", () => {
    const existing = ["2024_01_01_000000_create_notes_table.php", "2024_01_01_000001_create_clients_table.php"];
    const { obsolete } = generate(without("note"), { now, existingMigrations: existing, previousLock: lockOf(manifest) });

    expect(obsolete.filter((o) => o.kind === "migration")).toEqual([
      { path: "database/migrations/2024_01_01_000000_create_notes_table.php", kind: "migration" },
    ]);
  });

  it("ignora um lock que não tem o formato esperado", () => {
    for (const previousLock of [{}, { entities: null }, { entities: { x: 1 } }, { entities: { x: { fields: null } } }] as any[]) {
      expect(generate(manifest, { now, existingMigrations: [], previousLock }).obsolete).toEqual([]);
    }
  });

  it("não considera obsoleto um arquivo que a geração atual também produz (entidade renomeada para o mesmo nome)", () => {
    const renamed = { ...manifest, pkg: { ...manifest.pkg, entities: { ...manifest.pkg.entities } } };
    const lock = lockOf(manifest);
    // chave diferente no lock anterior, mesma classe (client → Client)
    lock.entities.Client = lock.entities.client;
    delete lock.entities.client;

    expect(generate(renamed, { now, existingMigrations: [], previousLock: lock }).obsolete).toEqual([]);
  });
});

describe("planRemovals / applyRemovals (segurança)", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-rm-"));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const write = (p: string, text: string) => {
    fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true });
    fs.writeFileSync(path.join(dir, p), text);
  };

  it("só apaga base dentro de app/Generated que tem o cabeçalho de gerado", () => {
    write("app/Generated/Models/BaseNote.php", `<?php\n// ${GENERATED_MARKER}\n`);
    write("app/Generated/Models/BaseOther.php", "<?php\n// código do usuário\n");
    write("app/Models/Note.php", "<?php\n// minha model\n");
    write("outside.txt", "fora");
    write("database/migrations/2024_create_notes_table.php", "<?php");

    const removals = planRemovals(
      [
        { path: "app/Generated/Models/BaseNote.php", kind: "generated" },
        { path: "app/Generated/Models/BaseOther.php", kind: "generated" },
        { path: "app/Generated/Models/BaseMissing.php", kind: "generated" },
        { path: "app/Generated/../../outside.txt", kind: "generated" },
        { path: "app/Models/Note.php", kind: "custom" },
        { path: "database/migrations/2024_create_notes_table.php", kind: "migration" },
        // mesmo marcado como 'generated', fora de app/Generated nada é apagado
        { path: "app/Models/Note.php", kind: "generated" },
      ],
      dir,
    );
    expect(removals.map((r) => [r.path, r.action])).toEqual([
      ["app/Generated/Models/BaseNote.php", "removed"],
      ["app/Generated/Models/BaseOther.php", "orphaned"],
      ["app/Generated/../../outside.txt", "orphaned"],
      ["app/Models/Note.php", "orphaned"],
      ["database/migrations/2024_create_notes_table.php", "orphaned"],
      ["app/Models/Note.php", "orphaned"],
    ]);

    applyRemovals(removals, dir);

    expect(fs.existsSync(path.join(dir, "app/Generated/Models/BaseNote.php"))).toBe(false);
    for (const kept of ["app/Generated/Models/BaseOther.php", "app/Models/Note.php", "outside.txt", "database/migrations/2024_create_notes_table.php"]) {
      expect(fs.existsSync(path.join(dir, kept)), kept).toBe(true);
    }
  });

  it("apaga as pastas vazias de app/Generated, mas não o app/Generated em si", () => {
    write("app/Generated/Http/Controllers/Api/BaseNoteController.php", `<?php\n// ${GENERATED_MARKER}\n`);

    applyRemovals(planRemovals([{ path: "app/Generated/Http/Controllers/Api/BaseNoteController.php", kind: "generated" }], dir), dir);

    expect(fs.existsSync(path.join(dir, "app/Generated/Http"))).toBe(false);
    expect(fs.existsSync(path.join(dir, "app/Generated"))).toBe(true);
  });

  it("applyPlan nunca sobrescreve um create-once existente", () => {
    write("app/Models/Client.php", "do usuário");
    const file: GeneratedFile = { path: "app/Models/Client.php", content: "novo", policy: "create-once" };

    expect(planWrites([file], dir)[0].action).toBe("preserved");
  });

  it("legacyFinalWarnings: avisa a final que existe e não estende a base; aceita nome curto, completo e com alias", () => {
    const generatedBase = { fqcn: "App\\Generated\\Models\\BaseClient", path: "app/Generated/Models/BaseClient.php" };
    const cases: [string, string, boolean][] = [
      ["app/Models/A.php", "class Client extends Model {}", true],
      ["app/Models/B.php", "class Client extends BaseClient {}", false],
      ["app/Models/C.php", "class Client extends \\App\\Generated\\Models\\BaseClient {}", false],
      ["app/Models/D.php", "class Client extends  Base\\BaseClient\n{}", false],
      ["app/Models/E.php", "// extends BaseClientX\nclass Client extends BaseClientX {}", true],
    ];
    for (const [p, text] of cases) write(p, text);
    const files: GeneratedFile[] = cases.map(([p]) => ({ path: p, content: "", policy: "create-once", generatedBase }));

    const warnings = legacyFinalWarnings(planWrites(files, dir));

    expect(warnings.map((w) => w.split(":")[0])).toEqual(cases.filter(([, , legacy]) => legacy).map(([p]) => p));
    expect(warnings[0]).toContain("não estende a base gerada BaseClient");
    expect(warnings[0]).toContain("Migre:");
  });
});

describe("CLI: regerar com segurança", () => {
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
  const writeManifest = (entities: string[], name = "manifest.json") => {
    const file = path.join(tmp, name);
    fs.writeFileSync(file, JSON.stringify(smallManifest(entities)));
    return file;
  };
  const read = (p: string) => fs.readFileSync(path.join(out, p), "utf8");
  const exists = (p: string) => fs.existsSync(path.join(out, p));
  const section = (title: string) => stdout.match(new RegExp(`${title} \\(\\d+\\)[^\\n]*:\\n((?:  .*\\n)+)`))?.[1].split("\n").map((l) => l.trim()).filter(Boolean) ?? [];

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-layers-"));
    out = path.join(tmp, "projeto");
    stdout = "";
    stderr = "";
  });
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  const hook = `
	protected function beforeStore(array $data, \\Illuminate\\Http\\Request $request): array
	{
		$data['name'] = strtoupper($data['name']);
		return $data;
	}
`;

  it("implementa um hook na final, regera e a edição sobrevive; a base é atualizada", () => {
    const manifest = writeManifest(["client", "note"]);
    expect(run(["generate", manifest, "--out", out], io())).toBe(0);
    expect(exists("app/Generated/Http/Controllers/Api/BaseClientController.php")).toBe(true);
    expect(exists("app/Http/Controllers/Api/ClientController.php")).toBe(true);

    // edita a final (hook) e a base (que seria perdida) e muda o manifest (campo novo em client)
    const finalPath = path.join(out, "app/Http/Controllers/Api/ClientController.php");
    const edited = fs.readFileSync(finalPath, "utf8").replace(/\n}\s*$/, `${hook}}\n`);
    fs.writeFileSync(finalPath, edited);
    fs.writeFileSync(path.join(out, "app/Generated/Models/BaseClient.php"), "editado na base");
    const changed = smallManifest();
    changed.pkg.entities.client.fields.nickname = "string";
    fs.writeFileSync(manifest, JSON.stringify(changed));

    stdout = "";
    expect(run(["generate", manifest, "--out", out], io())).toBe(0);

    expect(fs.readFileSync(finalPath, "utf8")).toBe(edited);
    expect(read("app/Generated/Models/BaseClient.php")).toContain("'nickname',");
    expect(read("app/Generated/Http/Requests/BaseClientRequest.php")).toContain("'nickname' => array(");
    expect(read("app/Http/Requests/ClientRequest.php")).not.toContain("nickname");
    expect(stdout).toMatch(/sobrescritos \(\d+\):[\s\S]*app\/Generated\/Models\/BaseClient\.php/);
    expect(section("preservados")).toContain("app/Http/Controllers/Api/ClientController.php");
    // as 12 finais (5 classes + factory por entidade) e as 2 migrations de criação (imutáveis depois de emitidas); o campo novo de client vira uma migration alter
    expect(section("preservados")).toHaveLength(14);
    expect(section("criados")).toHaveLength(1);
    expect(section("criados")[0]).toMatch(/_alter_clients_table\.php$/);
    expect(stdout).not.toContain("não estende a base");
  });

  it.each([
    [[]],
    [["--dry-run"]],
    [["--normalize-names"]],
    [["--no-normalize-names"]],
    [["--dry-run", "--no-normalize-names"]],
    [["-n", "-o", "ignorado"]],
  ])("nenhuma combinação de opções sobrescreve uma classe final: %j", (flags) => {
    const manifest = writeManifest(["client", "note"]);
    run(["generate", manifest, "--out", out], io());

    // todas as finais passam a ter conteúdo do usuário
    const finalPaths = [
      "app/Models/Client.php", "app/Http/Controllers/Api/ClientController.php", "app/Http/Requests/ClientRequest.php",
      "app/Http/Resources/ClientResource.php", "app/Http/Resources/ClientCollection.php",
      "app/Models/Note.php", "app/Http/Controllers/Api/NoteController.php", "app/Http/Requests/NoteRequest.php",
      "app/Http/Resources/NoteResource.php", "app/Http/Resources/NoteCollection.php",
    ];
    for (const p of finalPaths) fs.writeFileSync(path.join(out, p), `<?php // meu ${p} extends BaseX\n`);

    const args = flags.includes("-o") ? ["generate", manifest, "--out", out, ...flags.filter((f) => f !== "-o" && f !== "ignorado")] : ["generate", manifest, "--out", out, ...flags];
    expect(run(args, io())).toBe(0);

    for (const p of finalPaths) expect(read(p), p).toBe(`<?php // meu ${p} extends BaseX\n`);
  });

  it("a final apagada é recriada (create-once = criar se não existe)", () => {
    const manifest = writeManifest(["client"]);
    run(["generate", manifest, "--out", out], io());
    fs.rmSync(path.join(out, "app/Models/Client.php"));

    stdout = "";
    run(["generate", manifest, "--out", out], io());

    expect(section("criados")).toEqual(["app/Models/Client.php"]);
  });

  it("remove uma entidade: apaga as bases, lista as finais e a migration como órfãs e mantém tudo o que é seu", () => {
    const manifest = writeManifest(["client", "note"]);
    run(["generate", manifest, "--out", out], io());
    const noteMigration = fs.readdirSync(path.join(out, "database/migrations")).find((f) => f.endsWith("_create_notes_table.php"))!;
    fs.writeFileSync(path.join(out, "app/Models/Note.php"), "<?php // regra de negócio minha\n");

    writeManifest(["client"]);
    stdout = "";
    expect(run(["generate", manifest, "--out", out, "--dry-run"], io())).toBe(0);

    // dry-run: mostra o plano e não toca em nada
    expect(stdout).toContain("nada foi escrito");
    expect(section("removidos")).toEqual([
      "app/Generated/Models/BaseNote.php",
      "app/Generated/Http/Resources/BaseNoteResource.php",
      "app/Generated/Http/Resources/BaseNoteCollection.php",
      "app/Generated/Http/Controllers/Api/BaseNoteController.php",
      "app/Generated/Http/Requests/BaseNoteRequest.php",
      "app/Generated/Factories/BaseNoteFactory.php",
    ]);
    expect(exists("app/Generated/Models/BaseNote.php")).toBe(true);
    const dry = stdout.replace(/^.*\n/, "");

    stdout = "";
    expect(run(["generate", manifest, "--out", out], io())).toBe(0);

    expect(stdout.replace(/^.*\n/, "")).toBe(dry);
    expect(stdout).toContain("(0 criados, 2 sobrescritos, 6 sem mudança, 7 preservados, 6 removidos)");
    expect(stdout).toMatch(/Total: \d+ arquivos \(.*, 6 removidos\)/);
    for (const p of ["Models/BaseNote", "Http/Resources/BaseNoteResource", "Http/Resources/BaseNoteCollection", "Http/Controllers/Api/BaseNoteController", "Http/Requests/BaseNoteRequest", "Factories/BaseNoteFactory"]) {
      expect(exists(`app/Generated/${p}.php`), p).toBe(false);
    }
    // a camada de customização e a migration ficam, e são listadas
    expect(read("app/Models/Note.php")).toBe("<?php // regra de negócio minha\n");
    for (const p of ["app/Http/Controllers/Api/NoteController.php", "app/Http/Requests/NoteRequest.php", "app/Http/Resources/NoteResource.php", "app/Http/Resources/NoteCollection.php", "database/factories/NoteFactory.php", `database/migrations/${noteMigration}`]) {
      expect(exists(p), p).toBe(true);
    }
    expect(stdout).toContain("Órfãos (7)");
    expect(section("Órfãos")).toEqual([
      "app/Models/Note.php",
      "app/Http/Resources/NoteResource.php",
      "app/Http/Resources/NoteCollection.php",
      "app/Http/Controllers/Api/NoteController.php",
      "app/Http/Requests/NoteRequest.php",
      "database/factories/NoteFactory.php",
      `database/migrations/${noteMigration}  (migration: crie à mão uma migration que remova a tabela, se for o caso)`,
    ]);
    // a entidade que ficou não é tocada, e as rotas deixam de citar a removida
    expect(exists("app/Generated/Models/BaseClient.php")).toBe(true);
    expect(read("routes/crudmaker.php")).not.toContain("NoteController");
    expect(read("manifest-lock.json")).not.toContain('"note"');
  });

  it("um arquivo sem o cabeçalho de gerado em app/Generated não é apagado: vira órfão", () => {
    const manifest = writeManifest(["client", "note"]);
    run(["generate", manifest, "--out", out], io());
    fs.writeFileSync(path.join(out, "app/Generated/Models/BaseNote.php"), "<?php // troquei por código meu\n");

    writeManifest(["client"]);
    stdout = "";
    run(["generate", manifest, "--out", out], io());

    expect(read("app/Generated/Models/BaseNote.php")).toContain("troquei");
    expect(section("Órfãos")).toContain("app/Generated/Models/BaseNote.php");
  });

  it("sem lock anterior (ou com lock ilegível) nada é removido", () => {
    const manifest = writeManifest(["client"]);
    fs.mkdirSync(out, { recursive: true });
    fs.mkdirSync(path.join(out, "app/Generated/Models"), { recursive: true });
    fs.writeFileSync(path.join(out, "app/Generated/Models/BaseNote.php"), `<?php // ${GENERATED_MARKER}\n`);

    expect(run(["generate", manifest, "--out", out], io())).toBe(0);
    expect(exists("app/Generated/Models/BaseNote.php")).toBe(true);

    fs.writeFileSync(path.join(out, "manifest-lock.json"), "{ ilegível");
    stdout = "";
    expect(run(["generate", manifest, "--out", out], io())).toBe(0);
    expect(exists("app/Generated/Models/BaseNote.php")).toBe(true);
    expect(stdout).toContain("manifest-lock.json anterior ilegível");
  });

  it("projeto gerado pela versão antiga: a final completa é preservada e cada uma gera um aviso com a migração", () => {
    const manifest = writeManifest(["client"]);
    fs.mkdirSync(path.join(out, "app/Models"), { recursive: true });
    fs.mkdirSync(path.join(out, "app/Http/Controllers/Api"), { recursive: true });
    const oldModel = "<?php\n\nnamespace App\\Models;\n\nclass Client extends Model\n{\n\t// model completa da versão antiga\n}\n";
    const oldController = "<?php\n\nnamespace App\\Http\\Controllers\\Api;\n\nclass ClientController extends Controller\n{\n}\n";
    fs.writeFileSync(path.join(out, "app/Models/Client.php"), oldModel);
    fs.writeFileSync(path.join(out, "app/Http/Controllers/Api/ClientController.php"), oldController);

    expect(run(["generate", manifest, "--out", out], io())).toBe(0);

    expect(read("app/Models/Client.php")).toBe(oldModel);
    expect(read("app/Http/Controllers/Api/ClientController.php")).toBe(oldController);
    const avisos = stdout.slice(stdout.indexOf("Avisos ("));
    expect(avisos).toMatch(/app\/Models\/Client\.php: não estende a base gerada BaseClient;.*app\/Generated\/Models\/BaseClient\.php fica sem uso.*Migre:/);
    expect(avisos).toMatch(/app\/Http\/Controllers\/Api\/ClientController\.php: não estende a base gerada BaseClientController;/);
    expect(avisos).toContain("docs/como-usar.md");
    // só os dois arquivos antigos: as demais finais foram criadas agora e estendem a base
    expect(avisos.match(/não estende a base gerada/g)).toHaveLength(2);

    // regerar de novo continua avisando; depois da migração o aviso some
    stdout = "";
    run(["generate", manifest, "--out", out], io());
    expect(stdout.match(/não estende a base gerada/g)).toHaveLength(2);

    fs.rmSync(path.join(out, "app/Models/Client.php"));
    fs.rmSync(path.join(out, "app/Http/Controllers/Api/ClientController.php"));
    run(["generate", manifest, "--out", out], io());
    stdout = "";
    run(["generate", manifest, "--out", out], io());
    expect(stdout).not.toContain("não estende a base");
  });

  it("projeto novo: nenhuma final gera aviso de base", () => {
    run(["generate", writeManifest(["client", "note"]), "--out", out], io());
    expect(stdout).not.toContain("não estende a base");
  });

  it("a ajuda explica as duas camadas", () => {
    run(["generate", "--help"], io());
    expect(stdout).toContain("app/Generated/");
    expect(stdout).toContain("nunca sobrescrita");
    expect(stdout).not.toContain("--force");
  });
});
