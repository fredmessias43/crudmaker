import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { generate } from "../src/generate";
import { readManifest } from "../src/readManifest";
import { ManifestValidationError } from "../src/validateManifest";

// Ticket 11: opções `api` por entidade e `pkg.defaults.api`.

const fixturesDir = path.join(__dirname, "fixtures");
const snapshotsDir = path.join(__dirname, "__snapshots__");
const now = new Date(2025, 0, 2, 3, 4, 5);

const manifest = readManifest(path.join(fixturesDir, "api-options/manifest.yaml"));
const result = generate(manifest, { now, existingMigrations: [] });
const files = new Map(result.files.map((file) => [file.path, file.content]));

function content(filePath: string): string {
  const text = files.get(filePath);
  if (text === undefined) throw new Error(`arquivo não gerado: ${filePath}`);
  return text;
}

const controller = (name: string) => content(`app/Generated/Http/Controllers/Api/Base${name}Controller.php`);

/** Pedaço do texto entre dois marcadores (para afirmar a ordem dos passos do index). */
function indexOfAll(text: string, markers: string[]): number[] {
  return markers.map((marker) => {
    const position = text.indexOf(marker);
    expect(position, `marcador ausente: ${marker}`).toBeGreaterThan(-1);
    return position;
  });
}

describe("fixture api-options (snapshot)", () => {
  it("devolve a lista de caminhos esperada", async () => {
    await expect(result.files.map((file) => file.path).join("\n") + "\n").toMatchFileSnapshot(path.join(snapshotsDir, "api-options", "_paths.txt"));
  });

  it("gera o conteúdo esperado de cada arquivo", async () => {
    for (const file of result.files) {
      await expect(file.content).toMatchFileSnapshot(path.join(snapshotsDir, "api-options", file.path));
    }
  });

  it("o JSON da fixture é equivalente ao YAML", () => {
    expect(readManifest(path.join(fixturesDir, "api-options/manifest.json"))).toEqual(manifest);
  });

  it("não gera avisos de nome", () => {
    expect(result.warnings).toEqual([]);
  });
});

describe("rotas", () => {
  const routes = content("routes/crudmaker.php");

  it("actions restritas viram ->only, na ordem das rotas", () => {
    expect(routes).toContain("Route::apiResource('clients', ClientController::class)->only(['index', 'store', 'show', 'update'])->middleware(['auth:sanctum', 'verified']);");
    expect(routes).toContain("Route::apiResource('tags', TagController::class)->only(['index', 'show']);");
  });

  it("sem restrição não há ->only, e o middleware do pacote vale para quem não declara", () => {
    expect(routes).toContain("Route::apiResource('addresses', AddressController::class)->middleware(['auth:sanctum']);");
  });

  it("o middleware da entidade substitui o padrão (não soma) e escapa o texto", () => {
    expect(routes).toContain("Route::apiResource('alerts', AlertController::class)->middleware(['auth:sanctum', 'throttle:60,1']);");
    expect(routes).not.toMatch(/clients.*'auth:sanctum'.*'auth:sanctum'/);
  });

  it("middleware: [] na entidade desliga o padrão", () => {
    expect(routes).toMatch(/Route::apiResource\('tags', TagController::class\)->only\(\['index', 'show'\]\);/);
    expect(routes).not.toMatch(/tags.*middleware/);
  });
});

describe("controller base", () => {
  const client = controller("Client");
  const tag = controller("Tag");

  it("remove as actions fora de `actions` e os hooks delas", () => {
    expect(client).toContain("public function index(");
    expect(client).toContain("public function update(");
    expect(client).not.toContain("public function destroy(");
    expect(client).not.toContain("beforeDestroy");
    expect(client).not.toContain("afterDestroy");
    expect(client).not.toContain("use Illuminate\\Http\\Response;");

    expect(tag).toContain("public function show(");
    for (const removed of ["store(", "update(", "destroy(", "beforeStore", "afterStore", "beforeUpdate", "afterUpdate", "beforeDestroy", "afterDestroy"]) {
      expect(tag, removed).not.toContain(removed);
    }
    // Sem actions de escrita, a base também não importa o que só elas usam.
    expect(tag).not.toContain("Facades\\DB");
    expect(tag).not.toContain("TagRequest");
  });

  it("a final lista só os hooks que existem na base", () => {
    const final = content("app/Http/Controllers/Api/TagController.php");
    expect(final).toContain("As actions geradas (index, show)");
    expect(final).toContain("protected function indexQuery");
    expect(final).not.toContain("beforeStore");
  });

  it("perPage: o da entidade, o do pacote ou 15", () => {
    expect(client).toContain("->paginate(20)");
    expect(tag).toContain("->paginate(25)");
    expect(controller("Address")).toContain("->paginate(25)");
  });

  it("with no index e no show", () => {
    expect(client).toContain("$query->with(['address', 'alerts']);");
    expect(client).toContain("$client->load(['address', 'alerts']);");
    expect(controller("Alert")).toContain("$query->with(['client']);");
    expect(tag).not.toContain("->with(");
    expect(tag).not.toContain("->load(");
  });

  it("ordem do index: with, filtros, busca, ordenação e só então o hook indexQuery, antes de paginar", () => {
    const positions = indexOfAll(client, [
      "Client::query()",
      "->with([",
      "$request->filled('status')",
      "$request->filled('vip')",
      "$request->filled('search')",
      "$sort = $request->query('sort')",
      "$this->indexQuery($query, $request)",
      "->paginate(20)",
    ]);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("filtros: enum só filtra com valor permitido, boolean converte, os demais exigem texto", () => {
    expect(client).toContain("$request->filled('status') && in_array($request->query('status'), ['active', 'blocked'], true),");
    expect(client).toContain("fn ($query) => $query->where('status', $request->query('status')),");
    expect(client).toContain("fn ($query) => $query->where('vip', $request->boolean('vip')),");
    expect(controller("Alert")).toContain("$request->filled('client_id') && is_string($request->query('client_id')),");
  });

  it("busca: where agrupado com like %termo% em OR entre os campos", () => {
    expect(client).toContain("$term = '%' . $request->query('search') . '%';");
    expect(client).toContain("$query->where(function ($query) use ($term) {");
    expect(client).toContain("foreach (['name', 'email'] as $column) {");
    expect(client).toContain("$query->orWhere($column, 'like', $term);");
  });

  it("ordenação: só colunas da lista, `-` é decrescente, e defaultSort cobre o resto", () => {
    expect(client).toContain("if (in_array($sortColumn, ['name', 'created_at'], true)) {");
    expect(client).toContain("$query->orderBy($sortColumn, str_starts_with($sort, '-') ? 'desc' : 'asc');");
    expect(client).toContain("$query->orderBy('created_at', 'desc');");
    // Sem defaultSort: só a ordenação pedida, sem `else`.
    const alert = controller("Alert");
    expect(alert).toContain("if (in_array($sortColumn, ['title'], true)) {");
    expect(alert).not.toContain("} else {");
  });

  it("sem opções de consulta o index é o de sempre", () => {
    expect(controller("Address")).toContain("$query = $this->indexQuery(Address::query(), $request);");
  });
});

describe("resource base", () => {
  it("inclui os relacionamentos de `with` com whenLoaded e a resource da entidade relacionada", () => {
    const resource = content("app/Generated/Http/Resources/BaseClientResource.php");
    expect(resource).toContain("use App\\Http\\Resources\\AddressResource;");
    expect(resource).toContain("use App\\Http\\Resources\\AlertResource;");
    expect(resource).toContain("'address' => new AddressResource($this->whenLoaded('address')),");
    expect(resource).toContain("'alerts' => AlertResource::collection($this->whenLoaded('alerts')),");
    expect(resource.indexOf("'updated_at'")).toBeLessThan(resource.indexOf("'address'"));
    expect(resource.indexOf("'alerts'")).toBeLessThan(resource.indexOf("$this->extra($request)"));

    expect(content("app/Generated/Http/Resources/BaseAlertResource.php")).toContain("'client' => new ClientResource($this->whenLoaded('client')),");
  });

  it("sem `with` a resource não muda", () => {
    expect(content("app/Generated/Http/Resources/BaseTagResource.php")).not.toContain("whenLoaded");
  });
});

describe("lock", () => {
  it("guarda o bloco api já mesclado com os padrões (só nas entidades que têm)", () => {
    const lock = JSON.parse(content("manifest-lock.json"));
    expect(lock.entities.address.api).toEqual({ middleware: ["auth:sanctum"], perPage: 25 });
    expect(lock.entities.tag.api).toEqual({ middleware: [], perPage: 25, actions: ["index", "show"] });
  });

  it("manifest sem api não ganha a chave", () => {
    const m = base();
    const lock = JSON.parse(generate(m, { now, existingMigrations: [] }).files[0].content);
    expect(lock.entities.client).not.toHaveProperty("api");
  });
});

/** Manifest mínimo; os testes de erro alteram uma cópia. */
function base(): any {
  return {
    system: { code: "s" },
    pkg: {
      code: "p",
      entities: {
        client: {
          fields: { id: "uuid", name: "string", created_by: "string", status: { type: "enum", enumItems: ["a", "b"] } },
          relationships: { hasMany: ["order"] },
        },
        order: { fields: { id: "uuid" }, relationships: { belongsTo: ["client"] } },
      },
    },
  };
}

function problemsOf(m: unknown, normalizeNames?: boolean) {
  try {
    generate(m as any, { now, existingMigrations: [], normalizeNames });
  } catch (e) {
    expect(e).toBeInstanceOf(ManifestValidationError);
    return (e as ManifestValidationError).problems;
  }
  throw new Error("o manifest deveria ser inválido");
}

function withApi(api: any, defaults?: any) {
  const m = base();
  m.pkg.entities.client.api = api;
  if (defaults !== undefined) m.pkg.defaults = { api: defaults };
  return m;
}

describe("validação", () => {
  it("aceita um manifest válido com todas as opções", () => {
    const m = withApi({ actions: ["index"], middleware: [], perPage: 1, filters: ["status"], search: ["name"], sort: ["id", "updated_at"], defaultSort: "-created_at", with: [] });
    expect(() => generate(m, { now, existingMigrations: [] })).not.toThrow();
  });

  it("nomes que não são campos da entidade em filters/search/sort/defaultSort, com o caminho exato", () => {
    const problems = problemsOf(withApi({ filters: ["name", "nope"], search: ["zzz"], sort: ["name", "deleted_at"], defaultSort: "-ghost" }));

    expect(problems.map((p) => p.path)).toEqual([
      "pkg.entities.client.api.filters[1]",
      "pkg.entities.client.api.search[0]",
      "pkg.entities.client.api.sort[1]",
      "pkg.entities.client.api.defaultSort",
    ]);
    expect(problems[0].message).toBe(`campo "nope" não existe na entidade "client" (campos: id, name, created_by, status)`);
    expect(problems[2].message).toContain("status, created_at, updated_at");
    expect(problems[3].message).toContain(`campo "ghost" não existe`);
  });

  it("created_at, updated_at e id valem em sort/defaultSort, mas não em filters/search", () => {
    expect(() => generate(withApi({ sort: ["created_at"], defaultSort: "-updated_at" }), { now, existingMigrations: [] })).not.toThrow();
    expect(problemsOf(withApi({ filters: ["created_at"] })).map((p) => p.path)).toEqual(["pkg.entities.client.api.filters[0]"]);
  });

  it("a FK derivada do belongsTo vale como campo", () => {
    const m = base();
    m.pkg.entities.order.api = { filters: ["client_id"], search: ["client_id"] };
    expect(() => generate(m, { now, existingMigrations: [] })).not.toThrow();
  });

  it("with que não é relacionamento da entidade, listando os nomes válidos", () => {
    const problems = problemsOf(withApi({ with: ["orders", "order", "client"] }));

    expect(problems.map((p) => p.path)).toEqual(["pkg.entities.client.api.with[1]", "pkg.entities.client.api.with[2]"]);
    expect(problems[0].message).toBe(`relacionamento "order" não existe na entidade "client" (use o nome do método na model: orders)`);
  });

  it("with em entidade sem relacionamentos", () => {
    const m = base();
    m.pkg.entities.order = { fields: { id: "uuid" }, api: { with: ["client"] } };
    expect(problemsOf(m)[0].message).toContain("não tem relacionamentos belongsTo, hasOne ou hasMany");
  });

  it("with aceita o nome do método de FK customizada (postsByAuthor)", () => {
    const m = base();
    m.pkg.entities.client.relationships = { hasMany: [{ entity: "order", field: "author_id" }] };
    m.pkg.entities.order.relationships = { belongsTo: [{ entity: "client", field: "author_id" }] };
    m.pkg.entities.client.api = { with: ["ordersByAuthor"] };
    m.pkg.entities.order.api = { with: ["author"] };
    expect(() => generate(m, { now, existingMigrations: [] })).not.toThrow();
  });

  it("action desconhecida", () => {
    const problems = problemsOf(withApi({ actions: ["index", "list"] }));
    expect(problems).toEqual([
      { path: "pkg.entities.client.api.actions[1]", message: `valor "list" inválido (use um de: index, show, store, update, destroy)` },
    ]);
  });

  it("actions vazia (na entidade e no padrão)", () => {
    const entity = problemsOf(withApi({ actions: [] }));
    expect(entity[0].path).toBe("pkg.entities.client.api.actions");
    expect(entity[0].message).toContain("não pode ser vazia");

    expect(problemsOf(withApi({}, { actions: [] }))[0].path).toBe("pkg.defaults.api.actions");
  });

  it.each([
    [0, "deve ser maior que zero"],
    [-5, "deve ser maior que zero"],
    [1.5, "deve ser número inteiro, recebido número"],
    ["20", "deve ser número, recebido texto"],
  ])("perPage inválido (%s)", (perPage, message) => {
    expect(problemsOf(withApi({ perPage }))).toEqual([{ path: "pkg.entities.client.api.perPage", message }]);
  });

  it("perPage inválido no padrão do pacote", () => {
    expect(problemsOf(withApi({}, { perPage: 0 }))[0].path).toBe("pkg.defaults.api.perPage");
  });

  it("tipos errados em middleware e filters", () => {
    const problems = problemsOf(withApi({ middleware: "auth", filters: [1] }));
    expect(problems.map((p) => p.path)).toEqual(["pkg.entities.client.api.middleware", "pkg.entities.client.api.filters[0]"]);
  });

  it("filters/search/sort/defaultSort/with não valem em pkg.defaults.api", () => {
    const problems = problemsOf(withApi({}, { filters: ["name"], defaultSort: "-name", perPage: 10 }));

    expect(problems.map((p) => p.path)).toEqual(["pkg.defaults.api.filters", "pkg.defaults.api.defaultSort"]);
    expect(problems[0].message).toContain("não vale como padrão");
  });

  it("mostra todos os erros de uma vez, com o caminho original da entidade", () => {
    const m = base();
    m.pkg.entities.order_items = m.pkg.entities.order;
    delete m.pkg.entities.order;
    m.pkg.entities.client.relationships = {};
    m.pkg.entities.order_items.relationships = {};
    m.pkg.entities.order_items.api = { filters: ["x"] };
    m.pkg.entities.client.api = { with: ["y"], sort: ["z"] };

    expect(problemsOf(m).map((p) => p.path).sort()).toEqual([
      "pkg.entities.client.api.sort[0]",
      "pkg.entities.client.api.with[0]",
      "pkg.entities.order_items.api.filters[0]",
    ]);
  });
});

describe("normalização de nomes no bloco api", () => {
  const camel = () => {
    const m = base();
    m.pkg.entities.client.fields = { id: "uuid", createdBy: "string", alertDate: "date" };
    m.pkg.entities.client.api = {
      filters: ["createdBy"],
      search: ["createdBy"],
      sort: ["alertDate", "createdAt"],
      defaultSort: "-createdAt",
      with: ["Orders"],
    };
    return m;
  };

  it("campos viram snake_case e o relacionamento, camelCase, com um aviso por nome", () => {
    const { files: out, warnings } = generate(camel(), { now, existingMigrations: [] });

    expect(warnings).toEqual([
      "pkg.entities.client.fields.createdBy → created_by",
      "pkg.entities.client.fields.alertDate → alert_date",
      "pkg.entities.client.api.filters[0]: createdBy → created_by",
      "pkg.entities.client.api.search[0]: createdBy → created_by",
      "pkg.entities.client.api.sort[0]: alertDate → alert_date",
      "pkg.entities.client.api.sort[1]: createdAt → created_at",
      "pkg.entities.client.api.with[0]: Orders → orders",
      "pkg.entities.client.api.defaultSort: -createdAt → -created_at",
    ]);

    const controllerText = out.find((file) => file.path.endsWith("BaseClientController.php"))!.content;
    expect(controllerText).toContain("$query->where('created_by', $request->query('created_by'))");
    expect(controllerText).toContain("in_array($sortColumn, ['alert_date', 'created_at'], true)");
    expect(controllerText).toContain("$query->orderBy('created_at', 'desc');");
    expect(controllerText).toContain("$query->with(['orders']);");
  });

  it("desligada: mantém os nomes, avisa e a validação recusa o que não bate", () => {
    const problems = problemsOf(camel(), false);

    expect(problems.map((p) => p.path)).toContain("pkg.entities.client.api.sort[1]");
    expect(problems.map((p) => p.path)).toContain("pkg.entities.client.api.with[0]");
  });

  it("desligada com nomes que já batem: gera sem alterá-los", () => {
    const m = base();
    m.pkg.entities.client.api = { filters: ["created_by"], sort: ["name"] };
    expect(() => generate(m, { now, existingMigrations: [], normalizeNames: false })).not.toThrow();
  });
});

describe("compatibilidade", () => {
  it("fixture sem api gera o mesmo com e sem `defaults: {}`", () => {
    const withEmpty = base();
    withEmpty.pkg.defaults = { api: {} };
    const a = generate(base(), { now, existingMigrations: [] }).files;
    const b = generate(withEmpty, { now, existingMigrations: [] }).files;
    expect(b).toEqual(a);
  });

  it("os snapshots antigos continuam intactos (existem fixtures sem api com o index original)", () => {
    const text = fs.readFileSync(path.join(snapshotsDir, "curso/app/Generated/Http/Controllers/Api/BaseCourseController.php"), "utf8");
    expect(text).toContain("->paginate(15)");
  });
});
