import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { generate } from "../src/generate";
import { readManifest } from "../src/readManifest";
import { ManifestValidationError } from "../src/validateManifest";

// Ticket 20: rotas e controllers aninhados para hasMany/hasOne (GET e POST /clients/{client}/alerts).
// Os snapshots das fixtures guardam o texto completo; aqui ficam as asserções de comportamento.

const fixturesDir = path.join(__dirname, "fixtures");
const now = new Date(2025, 0, 2, 3, 4, 5);

const loadJson = (name: string) => JSON.parse(fs.readFileSync(path.join(fixturesDir, name, "manifest.json"), "utf8"));
const loadYaml = (name: string) => readManifest(path.join(fixturesDir, name, "manifest.yaml"));

function generated(manifest: unknown, options: object = {}) {
  const result = generate(manifest as any, { now, existingMigrations: [], ...options });
  const files = new Map(result.files.map((file) => [file.path, file]));
  const content = (filePath: string) => {
    const file = files.get(filePath);
    if (file === undefined) throw new Error(`arquivo não gerado: ${filePath}`);
    return file.content;
  };
  return { ...result, files, content, routes: content("routes/crudmaker.php") };
}

const nestedBase = (name: string) => `app/Generated/Http/Controllers/Api/Relationships/Base${name}Controller.php`;
const nestedFinal = (name: string) => `app/Http/Controllers/Api/Relationships/${name}Controller.php`;
const nestedPaths = (files: Map<string, unknown>) => [...files.keys()].filter((p) => p.includes("/Relationships/"));

describe("vende-que-vende-api: client -> alerts / address / note", () => {
  const { routes, content, files } = generated(loadJson("vende-que-vende-api"));

  it("hasMany: GET e POST na URL do pai, com rotas nomeadas, depois das apiResource", () => {
    expect(routes).toContain("Route::get('clients/{client}/alerts', [ClientAlertController::class, 'nestedIndex'])->name('clients.alerts.index');");
    expect(routes).toContain("Route::post('clients/{client}/alerts', [ClientAlertController::class, 'nestedStore'])->name('clients.alerts.store');");
    expect(routes.indexOf("Route::apiResource('addresses'")).toBeLessThan(routes.indexOf("clients/{client}/alerts"));
  });

  it("hasOne: URL no singular, GET mostra e POST cria", () => {
    expect(routes).toContain("Route::get('clients/{client}/address', [ClientAddressController::class, 'nestedShow'])->name('clients.address.show');");
    expect(routes).toContain("Route::post('clients/{client}/address', [ClientAddressController::class, 'nestedStore'])->name('clients.address.store');");
  });

  it("só index/store aninhados: nada de show, update ou destroy do filho na URL do pai", () => {
    expect(routes).not.toMatch(/\{client\}\/alerts\/\{/);
    expect(routes).not.toMatch(/'(nestedShow|nestedUpdate|nestedDestroy)'\]\)->name\('clients\.alerts/);
  });

  it("cada relacionamento tem base (overwrite) e final (create-once) que estende a base", () => {
    const base = files.get(nestedBase("ClientAlert"))!;
    const final = files.get(nestedFinal("ClientAlert"))!;

    expect(base.policy).toBe("overwrite");
    expect(base.content).toContain("abstract class BaseClientAlertController extends AlertController");
    expect(final.policy).toBe("create-once");
    expect(final.content).toContain("class ClientAlertController extends BaseClientAlertController");
    expect(final.content).not.toContain("ARQUIVO GERADO PELO CRUDMAKER");
    expect(final.generatedBase).toEqual({ fqcn: "App\\Generated\\Http\\Controllers\\Api\\Relationships\\BaseClientAlertController", path: nestedBase("ClientAlert") });
  });

  it("a criação aninhada grava a FK do pai da URL depois dos hooks, na transação", () => {
    const base = content(nestedBase("ClientAlert"));

    expect(base).toContain("public function nestedStore(AlertRequest $request, Client $client): JsonResponse");
    expect(base).toContain("DB::transaction(function () use ($request, $client) {");
    expect(base.indexOf("$this->nestedBeforeStore(")).toBeLessThan(base.indexOf("$data['client_id'] = $client->getKey();"));
    expect(base.indexOf("$data['client_id'] = $client->getKey();")).toBeLessThan(base.indexOf("Alert::create($data)"));
    expect(base).toContain("], 201);");
  });

  it("a request do filho recebe a FK da URL antes de validar, então o corpo não precisa dela", () => {
    const request = content("app/Generated/Http/Requests/BaseAlertRequest.php");

    expect(request).toContain("use App\\Models\\Client;");
    expect(request).toContain("$client = $this->route('client');");
    expect(request).toContain("if ($client instanceof Client)");
    expect(request).toContain("$this->merge(['client_id' => $client->getKey()]);");
    // a regra continua `required`: o valor da URL a satisfaz e sobrescreve o do corpo
    expect(request).toMatch(/'client_id' => array\(\n\t\t\t\t\t'bail',\n\t\t\t\t\t'required',/);
  });

  it("a request do pai não ganha nada (ele não é filho de ninguém)", () => {
    expect(content("app/Generated/Http/Requests/BaseClientRequest.php")).not.toContain("Rota aninhada");
  });

  it("os hooks do filho valem no aninhado e os do aninhado recebem o pai", () => {
    const base = content(nestedBase("ClientAlert"));

    expect(base).toContain("$query = $this->indexQuery($query, $request);");
    expect(base).toContain("$query = $this->nestedIndexQuery($query, $request, $client);");
    expect(base).toContain("$data = $this->beforeStore($request->validated(), $request);");
    expect(base).toContain("$this->afterStore($model, $request);");
    expect(base).toContain("protected function nestedIndexQuery(Builder $query, Request $request, Client $client): Builder");
    expect(base).toContain("protected function nestedBeforeStore(array $data, Request $request, Client $client): array");
    expect(base).toContain("protected function nestedAfterStore(Alert $model, Request $request, Client $client): void");
    expect(content(nestedFinal("ClientAlert"))).toContain("protected function nestedBeforeStore(array $data, Request $request, Client $client): array;");
  });

  it("hasOne: show 404 sem registro (firstOrFail) e store 409 se o pai já tem um", () => {
    const base = content(nestedBase("ClientAddress"));

    expect(base).toContain("public function nestedShow(Request $request, Client $client): JsonResponse");
    expect(base).toContain("Address::query()->where('client_id', $client->getKey())");
    expect(base).toContain("$query->firstOrFail()");
    expect(base).toContain("if ($client->address()->exists()) {");
    expect(base).toContain("], 409);");
    expect(base).toContain("protected function nestedShowQuery(Builder $query, Request $request, Client $client): Builder");
    expect(base).not.toContain("nestedIndex");
  });

  it("hasMany não tem o 409 nem o show", () => {
    const base = content(nestedBase("ClientAlert"));

    expect(base).not.toContain("409");
    expect(base).not.toContain("nestedShow");
  });

  it("sem lock os nomes dos arquivos aninhados entram na lista de caminhos", () => {
    expect(nestedPaths(files).sort()).toEqual(
      [
        ...["ClientAddress", "ClientAlert", "ClientNote"].flatMap((name) => [nestedBase(name), nestedFinal(name)]),
      ].sort(),
    );
  });
});

describe("api-options: filtros, busca, ordenação, middleware e perPage do filho", () => {
  const { routes, content } = generated(loadYaml("api-options"));
  const alerts = content(nestedBase("ClientAlert"));

  it("a listagem aninhada aplica o que o filho declara, depois de filtrar pelo pai", () => {
    const positions = [
      "Alert::query()->where('client_id', $client->getKey())",
      "$query->with(['client']);",
      "$request->query('client_id')",
      "in_array($sortColumn, ['title'], true)",
      "$this->indexQuery($query, $request)",
      "$this->nestedIndexQuery($query, $request, $client)",
      "->paginate(25)",
    ].map((marker) => {
      const position = alerts.indexOf(marker);
      expect(position, marker).toBeGreaterThan(-1);
      return position;
    });
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("usa o middleware do filho, não o do pai", () => {
    expect(routes).toContain("->name('clients.alerts.index')->middleware(['auth:sanctum', 'throttle:60,1']);");
    expect(routes).toContain("->name('clients.alerts.store')->middleware(['auth:sanctum', 'throttle:60,1']);");
    // o address herda o middleware do pacote (o do client tem 'verified')
    expect(routes).toContain("->name('clients.address.show')->middleware(['auth:sanctum']);");
    expect(routes).not.toContain("clients.alerts.index')->middleware(['auth:sanctum', 'verified'])");
  });

  it("as actions do pai (client não tem destroy) não limitam as rotas aninhadas", () => {
    expect(routes).toContain("Route::apiResource('clients', ClientController::class)->only(['index', 'store', 'show', 'update'])");
    expect(routes).toContain("clients.alerts.store");
  });
});

describe("opção nested", () => {
  const withNested = (nested: unknown, own: unknown = "client") => {
    const manifest = loadJson("vende-que-vende-api");
    manifest.pkg.entities[own as string].api = { nested };
    return manifest;
  };

  it("nested: false não gera nenhum controller nem rota aninhada do pai, e a request do filho volta ao normal", () => {
    const { routes, files, content } = generated(withNested(false));

    expect(nestedPaths(files)).toEqual([]);
    expect(routes).not.toContain("Rotas aninhadas");
    expect(routes).not.toContain("Relationships");
    expect(content("app/Generated/Http/Requests/BaseAlertRequest.php")).not.toContain("Rota aninhada");
  });

  it("nested: [alerts] gera só os listados", () => {
    const { routes, files } = generated(withNested(["alerts"]));

    expect(nestedPaths(files).map((p) => p.split("/").pop())).toEqual(["BaseClientAlertController.php", "ClientAlertController.php"]);
    expect(routes).toContain("clients.alerts.index");
    expect(routes).not.toContain("clients.address");
  });

  it("nested: false em pkg.defaults.api vale para todos, e a entidade pode religar", () => {
    const manifest = loadJson("vende-que-vende-api");
    manifest.pkg.defaults = { api: { nested: false } };
    expect(nestedPaths(generated(manifest).files)).toEqual([]);

    manifest.pkg.entities.client.api = { nested: true };
    expect(nestedPaths(generated(manifest).files)).toHaveLength(6);
  });

  it("o nested fica no lock e o manifest sem ele não ganha a chave", () => {
    const lock = JSON.parse(generated(withNested(["alerts"])).content("manifest-lock.json"));
    expect(lock.entities.client.api).toEqual({ nested: ["alerts"] });

    const clean = JSON.parse(generated(loadJson("vende-que-vende-api")).content("manifest-lock.json"));
    expect(clean.entities.client.api).toBeUndefined();
  });

  it("o JSON Schema publicado conhece a opção", () => {
    const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "../schema/manifest.schema.json"), "utf8"));
    expect(JSON.stringify(schema)).toContain('"nested"');
  });
});

describe("validação de nested", () => {
  const problems = (manifest: unknown) => {
    try {
      generate(manifest as any, { now, existingMigrations: [] });
    } catch (e) {
      expect(e).toBeInstanceOf(ManifestValidationError);
      return (e as ManifestValidationError).problems;
    }
    throw new Error("o manifest deveria ser inválido");
  };

  it("nome que não é hasOne/hasMany da entidade, listando os válidos", () => {
    const manifest = loadJson("vende-que-vende-api");
    manifest.pkg.entities.client.api = { nested: ["alert"] };

    expect(problems(manifest)).toEqual([
      expect.objectContaining({
        path: "pkg.entities.client.api.nested[0]",
        message: expect.stringContaining("use o nome do método de um hasOne/hasMany na model: note, address, alerts"),
      }),
    ]);
  });

  it("hasMany sem o belongsTo de volta no filho", () => {
    const manifest = loadJson("vende-que-vende-api");
    delete manifest.pkg.entities.alert.relationships;
    manifest.pkg.entities.client.api = { nested: ["alerts"] };

    const [problem] = problems(manifest);
    expect(problem.path).toBe("pkg.entities.client.api.nested[0]");
    expect(problem.message).toContain('a entidade "alert" precisa declarar o belongsTo de "client" com a FK "client_id"');
  });

  it("sem a lista explícita, o hasMany sem belongsTo de volta é ignorado em silêncio", () => {
    const manifest = loadJson("vende-que-vende-api");
    delete manifest.pkg.entities.alert.relationships;

    const { files } = generated(manifest);
    expect(nestedPaths(files).some((p) => p.includes("ClientAlert"))).toBe(false);
    expect(nestedPaths(files).some((p) => p.includes("ClientNote"))).toBe(true);
  });

  it("lista em pkg.defaults.api é recusada (só o booleano vale como padrão)", () => {
    const manifest = loadJson("vende-que-vende-api");
    manifest.pkg.defaults = { api: { nested: ["alerts"] } };

    expect(problems(manifest)[0].path).toBe("pkg.defaults.api.nested");
  });

  it("nested com tipo errado", () => {
    const manifest = loadJson("vende-que-vende-api");
    manifest.pkg.entities.client.api = { nested: "alerts" };

    expect(problems(manifest)[0].path).toBe("pkg.entities.client.api.nested");
  });
});

describe("actions do filho", () => {
  const withAlertActions = (actions: string[]) => {
    const manifest = loadJson("vende-que-vende-api");
    manifest.pkg.entities.alert.api = { actions };
    return generated(manifest);
  };

  it("sem index no filho não há GET aninhado, mas o POST continua", () => {
    const { routes, content } = withAlertActions(["store", "show"]);

    expect(routes).not.toContain("clients.alerts.index");
    expect(routes).toContain("clients.alerts.store");
    const base = content(nestedBase("ClientAlert"));
    expect(base).not.toContain("nestedIndex");
    expect(base).not.toContain("AlertCollection");
    expect(base).toContain("nestedStore");
  });

  it("sem store no filho não há POST aninhado nem hooks de criação", () => {
    const { routes, content } = withAlertActions(["index"]);

    expect(routes).toContain("clients.alerts.index");
    expect(routes).not.toContain("clients.alerts.store");
    const base = content(nestedBase("ClientAlert"));
    expect(base).not.toContain("nestedStore");
    expect(base).not.toContain("nestedBeforeStore");
    expect(base).not.toContain("Facades\\DB");
    // sem rota de criação a request do filho não precisa da FK da URL
    expect(content("app/Generated/Http/Requests/BaseAlertRequest.php")).not.toContain("Rota aninhada");
  });

  it("sem index nem store (só show/update/destroy) o relacionamento não gera nada", () => {
    const { routes, files } = withAlertActions(["show", "update", "destroy"]);

    expect(routes).not.toContain("clients.alerts");
    expect(nestedPaths(files).some((p) => p.includes("ClientAlert"))).toBe(false);
  });

  it("hasOne usa show (e não index) como a leitura do filho", () => {
    const manifest = loadJson("vende-que-vende-api");
    manifest.pkg.entities.address.api = { actions: ["index", "store"] };
    const { routes } = generated(manifest);

    expect(routes).not.toContain("clients.address.show");
    expect(routes).toContain("clients.address.store");
  });
});

describe("FK customizada (order-item: user -> orderItemsByAuthor)", () => {
  const { routes, content, files } = generated(loadJson("order-item"));

  it("a URL e o controller levam o nome do relacionamento, sem colidir com o hasMany padrão", () => {
    expect(routes).toContain("Route::get('users/{user}/order-items-by-author', [UserOrderItemsByAuthorController::class, 'nestedIndex'])->name('users.order-items-by-author.index');");
    expect(routes).toContain("Route::get('users/{user}/orders', [UserOrderController::class, 'nestedIndex'])->name('users.orders.index');");
    expect(routes).toContain("Route::get('orders/{order}/order-items', [OrderOrderItemController::class, 'nestedIndex'])");
    expect(files.has(nestedBase("UserOrderItemsByAuthor"))).toBe(true);
  });

  it("a FK gravada e filtrada é a customizada (author_id), não user_id", () => {
    const base = content(nestedBase("UserOrderItemsByAuthor"));

    expect(base).toContain("OrderItem::query()->where('author_id', $user->getKey())");
    expect(base).toContain("$data['author_id'] = $user->getKey();");
    expect(content("app/Generated/Http/Requests/BaseOrderItemRequest.php")).toContain("$this->merge(['author_id' => $user->getKey()]);");
    // o order-item também é filho de order (order_id): as duas FKs vêm de rotas diferentes
    expect(content("app/Generated/Http/Requests/BaseOrderItemRequest.php")).toContain("$this->merge(['order_id' => $order->getKey()]);");
  });

  it("hasOne com FK customizada (orderByUser)", () => {
    const base = content(nestedBase("UserOrderByUser"));

    expect(base).toContain("Order::query()->where('user_id', $user->getKey())");
    expect(base).toContain("$user->orderByUser()->exists()");
  });

  it("um hasMany que o filho não declara de volta fica de fora (curso: class_lesson_comment -> ele mesmo)", () => {
    const curso = generated(loadJson("curso"));

    expect(nestedPaths(curso.files).some((p) => p.includes("ClassLessonCommentClassLessonComment"))).toBe(false);
    expect(curso.routes).toContain("class-lessons/{class_lesson}/class-lesson-comments");
  });
});

describe("auto-referência", () => {
  const selfReference = () => ({
    system: { code: "s" },
    pkg: {
      code: "p",
      entities: {
        comment: {
          fields: { id: "uuid", body: "text" },
          relationships: {
            belongsTo: [{ entity: "comment", field: "parent_id", required: false }],
            hasMany: [{ entity: "comment", field: "parent_id" }],
          },
        },
      },
    },
  });

  it("o pai da URL ganha o prefixo parent_ para não ser confundido com o registro da própria rota", () => {
    const { routes, content } = generated(selfReference());

    expect(routes).toContain("Route::get('comments/{parent_comment}/comments-by-parent', [CommentCommentsByParentController::class, 'nestedIndex'])->name('comments.comments-by-parent.index');");
    const base = content(nestedBase("CommentCommentsByParent"));
    expect(base).toContain("public function nestedIndex(Request $request, Comment $parentComment): JsonResponse");
    expect(base).toContain("Comment::query()->where('parent_id', $parentComment->getKey())");
    expect(base).toContain("$data['parent_id'] = $parentComment->getKey();");

    const request = content("app/Generated/Http/Requests/BaseCommentRequest.php");
    expect(request).toContain("$parentComment = $this->route('parent_comment');");
    expect(request).toContain("$this->merge(['parent_id' => $parentComment->getKey()]);");
    // a lógica de atualização continua olhando o parâmetro `comment`
    expect(request).toContain("$this->route('comment')");
  });
});

describe("entidade user do esqueleto (id bigint)", () => {
  const skeleton = "0001_01_01_000000_create_users_table.php";
  const { routes, content } = generated(loadJson("skeleton"), { existingMigrations: [skeleton], unmarkedMigrations: [skeleton] });

  it("a rota e a FK funcionam com o id inteiro do user", () => {
    expect(routes).toContain("Route::post('users/{user}/posts', [UserPostController::class, 'nestedStore'])->name('users.posts.store');");
    expect(content(nestedBase("UserPost"))).toContain("$data['user_id'] = $user->getKey();");

    const request = content("app/Generated/Http/Requests/BasePostRequest.php");
    expect(request).toContain("$this->merge(['user_id' => $user->getKey()]);");
    expect(request).toMatch(/'user_id' => array\(\n\t\t\t\t\t'bail',\n\t\t\t\t\t'required',\n\t\t\t\t\t'integer',/);
  });
});

describe("arquivos obsoletos", () => {
  const lockOf = (manifest: unknown) => JSON.parse(generate(manifest as any, { now, existingMigrations: [] }).files[0].content);

  it("desligar o nested torna a base e a final antigas obsoletas (a base some, a final só é listada)", () => {
    const manifest = loadJson("vende-que-vende-api");
    const previousLock = lockOf(manifest);
    manifest.pkg.entities.client.api = { nested: ["alerts"] };

    const { obsolete } = generate(manifest, { now, existingMigrations: [], previousLock });
    expect(obsolete).toContainEqual({ path: nestedBase("ClientAddress"), kind: "generated" });
    expect(obsolete).toContainEqual({ path: nestedFinal("ClientAddress"), kind: "custom" });
    expect(obsolete.some((o) => o.path.includes("ClientAlert"))).toBe(false);
  });

  it("o mesmo manifest não deixa nada obsoleto", () => {
    const manifest = loadJson("vende-que-vende-api");
    expect(generate(manifest, { now, existingMigrations: [], previousLock: lockOf(manifest) }).obsolete).toEqual([]);
  });
});

describe("stubs", () => {
  it("o template do controller aninhado é substituível por stub; a final não", () => {
    const result = generated(loadJson("vende-que-vende-api"), { stubs: { "nested-controller.base": "<?php // stub <%~ it.className %>\n" } });
    expect(result.content(nestedBase("ClientAlert"))).toBe("<?php // stub BaseClientAlertController\n");

    const ignored = generated(loadJson("vende-que-vende-api"), { stubs: { "nested-controller.final": "<?php // x" } });
    expect(ignored.warnings.join("\n")).toMatch(/stub nested-controller\.final: ignorado/);
  });
});
