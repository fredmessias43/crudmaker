import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { generate, GeneratedFile } from "../src/generate";

const fixturesDir = path.join(__dirname, "fixtures");
const snapshotsDir = path.join(__dirname, "__snapshots__");

// 2025-01-02 03:04:05 (hora local, como o `format` do date-fns usa no nome da migration)
const now = new Date(2025, 0, 2, 3, 4, 5);

/** Camada de customização: classes finais (fora de `app/Generated`) e as factories finais (`database/factories`) são `create-once`. */
function isCustomLayer(p: string): boolean {
  return (p.startsWith("app/") && !p.startsWith("app/Generated/")) || p.startsWith("database/factories/");
}

function loadManifest(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name, "manifest.json"), "utf8"));
}

describe.each(["bingo", "curso", "vende-que-vende-api"])("generate (%s)", (name) => {
  const manifest = loadManifest(name);
  // Os snapshots são a saída anterior à normalização de nomes: valem com ela desligada.
  const files = generate(manifest, { now, existingMigrations: [], normalizeNames: false }).files;

  it("devolve a lista de caminhos esperada", async () => {
    const paths = files.map((file) => file.path).join("\n") + "\n";

    await expect(paths).toMatchFileSnapshot(path.join(snapshotsDir, name, "_paths.txt"));
  });

  it("gera o conteúdo esperado de cada arquivo", async () => {
    for (const file of files) {
      await expect(file.content).toMatchFileSnapshot(path.join(snapshotsDir, name, file.path));
    }
  });

  it("usa a política da camada (final = create-once, o resto = overwrite) e caminhos relativos", () => {
    for (const file of files) {
      expect(file.policy).toBe(isCustomLayer(file.path) ? "create-once" : "overwrite");
      expect(path.isAbsolute(file.path)).toBe(false);
      expect(file.path).not.toContain("\\");
    }
  });
});

// bingo-2: entidades no plural e FKs declaradas à mão. Normalização ligada (o padrão): o snapshot é a saída normalizada.
describe("generate (bingo-2, normalização de nomes ligada)", () => {
  const { files, warnings } = generate(loadManifest("bingo-2"), { now, existingMigrations: [] });

  it("devolve a lista de caminhos esperada", async () => {
    await expect(files.map((file) => file.path).join("\n") + "\n").toMatchFileSnapshot(path.join(snapshotsDir, "bingo-2", "_paths.txt"));
  });

  it("gera o conteúdo esperado de cada arquivo", async () => {
    for (const file of files) {
      await expect(file.content).toMatchFileSnapshot(path.join(snapshotsDir, "bingo-2", file.path));
    }
  });

  it("gera as classes e tabelas normalizadas", () => {
    const paths = files.map((file) => file.path);

    for (const model of ["Award", "Card", "DrawnNumber", "Game", "Player", "PlayerInvite"]) {
      expect(paths).toContain(`app/Models/${model}.php`);
    }
    for (const table of ["awards", "cards", "drawn_numbers", "games", "players", "player_invites"]) {
      expect(paths.some((p) => p.endsWith(`_create_${table}_table.php`))).toBe(true);
    }
    expect(paths.some((p) => /Awards|Cards|DrawnNumbers/.test(p))).toBe(false);
  });

  it("não duplica a FK declarada à mão e derivada do belongsTo", () => {
    const lock = JSON.parse(files.find((file) => file.path === "manifest-lock.json")!.content);
    expect(Object.keys(lock.entities.playerInvite.fields)).toEqual(["id", "player_id", "game_id", "status"]);
    expect(lock.entities.award.fields.game_id.relationship).toBe(true);

    const migration = files.find((file) => file.path.endsWith("_create_player_invites_table.php"))!.content;
    expect(migration.match(/uuid\('game_id'\)/g)).toHaveLength(1);
    expect(migration).toContain("->foreign('game_id')->references('id')->on('games')");
    expect(migration).toContain("->foreign('player_id')->references('id')->on('players')");
  });

  it("avisa um por nome alterado, com o caminho original", () => {
    expect(warnings).toEqual([
      "pkg.entities.game.relationships.hasMany[0]: awards → award",
      "pkg.entities.game.relationships.hasMany[1]: player_invite → playerInvite",
      "pkg.entities.game.relationships.hasMany[2]: cards → card",
      "pkg.entities.game.relationships.hasMany[3]: drawn_numbers → drawnNumber",
      "pkg.entities.awards → award",
      "pkg.entities.player.relationships.hasMany[0]: player_invite → playerInvite",
      "pkg.entities.player.relationships.hasMany[1]: cards → card",
      "pkg.entities.player_invite → playerInvite",
      "pkg.entities.cards → card",
      "pkg.entities.drawn_numbers → drawnNumber",
    ]);
  });

  it("rotas e $this->route() usam o mesmo nome de parâmetro", () => {
    const routes = files.find((file) => file.path === "routes/crudmaker.php")!.content;
    expect(routes).toContain("Route::apiResource('player-invites', PlayerInviteController::class);");
    expect(routes).toContain("Route::apiResource('drawn-numbers', DrawnNumberController::class);");
    expect(files.find((file) => file.path === "app/Generated/Http/Requests/BaseDrawnNumberRequest.php")!.content).toContain("$this->route('drawn_number')");
    expect(files.find((file) => file.path === "app/Generated/Http/Requests/BasePlayerInviteRequest.php")!.content).toContain("$this->route('player_invite')");
  });
});

// order-item (ticket 09): entidade camelCase, FK customizada e entidade referenciada declarada depois. Normalização ligada.
describe("generate (order-item)", () => {
  const files = generate(loadManifest("order-item"), { now, existingMigrations: [] }).files;
  const content = (p: string) => files.find((file) => file.path === p)!.content;

  it("devolve a lista de caminhos esperada", async () => {
    await expect(files.map((file) => file.path).join("\n") + "\n").toMatchFileSnapshot(path.join(snapshotsDir, "order-item", "_paths.txt"));
  });

  it("gera o conteúdo esperado de cada arquivo", async () => {
    for (const file of files) {
      await expect(file.content).toMatchFileSnapshot(path.join(snapshotsDir, "order-item", file.path));
    }
  });

  it("a FK da forma curta aponta para a tabela em snake_case plural, e a customizada mantém o nome", () => {
    const migration = content("database/migrations/2025_01_02_030407_create_order_items_table.php");

    expect(migration).toContain("$table->uuid('order_id');");
    expect(migration).toContain("$table->foreign('order_id')->references('id')->on('orders');");
    expect(migration).toContain("$table->uuid('author_id');");
    expect(migration).toContain("$table->foreign('author_id')->references('id')->on('users');");
  });

  it("migrations na ordem das FKs, com timestamps consecutivos (user e order vêm antes de orderItem, declarado primeiro)", () => {
    // A ordem de execução do Laravel é a do nome do arquivo; os arquivos saem na ordem das entidades do manifest.
    const migrations = files.map((file) => file.path).filter((p) => p.startsWith("database/migrations/"));

    expect(migrations).toEqual([
      "database/migrations/2025_01_02_030407_create_order_items_table.php",
      "database/migrations/2025_01_02_030406_create_orders_table.php",
      "database/migrations/2025_01_02_030405_create_users_table.php",
    ]);
    expect([...migrations].sort().map((p) => path.basename(p).replace(/^[\d_]+_create_|_table\.php$/g, ""))).toEqual(["users", "orders", "order_items"]);
  });

  it("gera o PHP enum do campo, com cases em PascalCase e o valor string", () => {
    const text = content("app/Generated/Enums/OrderItemStatus.php");

    expect(text).toContain("namespace App\\Generated\\Enums;");
    expect(text).toContain("enum OrderItemStatus: string");
    expect(text).toContain("\tcase Pending = 'pending';");
    expect(text).toContain("\tcase Shipped = 'shipped';");
    expect(files.find((file) => file.path === "app/Generated/Enums/OrderItemStatus.php")!.policy).toBe("overwrite");
    // Enum é dado puro: não tem classe final.
    expect(files.some((file) => file.path.startsWith("app/Enums/"))).toBe(false);
  });

  it("a model importa o enum e a request usa Rule::enum, Rule::exists na tabela certa e o valor no prepareForValidation", () => {
    expect(content("app/Generated/Models/BaseOrderItem.php")).toContain("use App\\Generated\\Enums\\OrderItemStatus;");
    const request = content("app/Generated/Http/Requests/BaseOrderItemRequest.php");

    expect(request).toContain("use App\\Generated\\Enums\\OrderItemStatus;");
    expect(request).toContain("use Illuminate\\Validation\\Rule;");
    expect(request).not.toContain("Rule::in(");
    // O cast devolve o objeto enum; o merge precisa do valor.
    expect(request).toContain("$this->merge(['status' => $orderItem->status?->value]);");
    // Uma FK só entra com `exists` se o belongsTo existe: `order.user_id` -> users.
    expect(content("app/Generated/Http/Requests/BaseOrderRequest.php")).toContain("Rule::exists('users', 'id')");
    expect(content("app/Generated/Http/Requests/BaseUserRequest.php")).not.toContain("exists");
  });

  it("a resource devolve o valor string do enum", () => {
    const resource = content("app/Generated/Http/Resources/BaseOrderItemResource.php");

    expect(resource).toContain("'status' => $this->status?->value,");
    expect(resource).toContain("'sku' => $this->sku,");
  });

  it("a migration continua com enum(...) de strings", () => {
    expect(content("database/migrations/2025_01_02_030407_create_order_items_table.php")).toContain("$table->enum('status', ['pending','shipped'])");
  });

  it("a regra unique ignora o registro da rota, não o id do corpo", () => {
    const request = content("app/Generated/Http/Requests/BaseOrderItemRequest.php");

    expect(request).toContain("Rule::unique('order_items', 'sku')->ignore($this->route('order_item'))");
    expect(request).not.toContain("$this->input(");
    expect(content("app/Generated/Http/Requests/BaseOrderRequest.php")).toContain("Rule::unique('orders', 'number')->ignore($this->route('order'))");
  });

  it("devolve datas ao formato da regra no prepareForValidation (o cast vira Carbon)", () => {
    const request = content("app/Generated/Http/Requests/BaseOrderItemRequest.php");

    expect(request).toContain("$this->merge(['shipped_on' => $orderItem->shipped_on?->format('Y-m-d')]);");
    expect(request).toContain("$this->merge(['packed_at' => $orderItem->packed_at?->format('Y-m-d H:i')]);");
    expect(request).toContain("$this->merge(['quantity' => $orderItem->quantity]);");
  });

  // Regras que existem no Laravel 10–12 e que a request gerada pode usar (sem os parâmetros, ex.: `date_format:...`).
  const validRules = ["bail", "required", "nullable", "uuid", "string", "numeric", "integer", "boolean", "array", "date_format"];

  /** Itens do `array(...)` de regras de cada campo na request (um item por linha, sem a vírgula final). */
  function allRules(request: string): { [field: string]: string[] } {
    const result: { [field: string]: string[] } = {};
    for (const match of request.matchAll(/^\s*'(\w+)' => array\(\n([\s\S]*?)\n\s*\),$/gm)) {
      result[match[1]] = match[2].split("\n").map((line) => line.trim().replace(/,$/, ""));
    }
    return result;
  }

  it("cada tipo de campo gera a regra de validação certa", () => {
    const request = content("app/Generated/Http/Requests/BaseOrderItemRequest.php");
    const expected: { [field: string]: string[] } = {
      sku: ["'bail'", "'required'", "'string'", "Rule::unique('order_items', 'sku')->ignore($this->route('order_item'))"],
      quantity: ["'bail'", "'required'", "'integer'"],
      price: ["'bail'", "'required'", "'numeric'"],
      gift: ["'bail'", "'required'", "'boolean'"],
      options: ["'bail'", "'nullable'", "'array'"],
      shipped_on: ["'bail'", "'nullable'", "'date_format:Y-m-d'"],
      packed_at: ["'bail'", "'nullable'", "'date_format:Y-m-d H:i'"],
      status: ["'bail'", "'required'", "Rule::enum(OrderItemStatus::class)"],
      order_id: ["'bail'", "'required'", "'uuid'", "Rule::exists('orders', 'id')"],
      author_id: ["'bail'", "'required'", "'uuid'", "Rule::exists('users', 'id')"],
    };

    const rules = allRules(request);
    for (const [field, items] of Object.entries(expected)) {
      expect(rules[field], field).toEqual(items);
    }
  });

  it("nenhuma request usa regra inexistente no Laravel (nem `double`)", () => {
    for (const file of files.filter((f) => f.path.startsWith("app/Generated/Http/Requests/"))) {
      expect(file.content).not.toContain("'double'");
      const rules = Object.values(allRules(file.content)).flat();
      expect(rules.length).toBeGreaterThan(0);
      for (const rule of rules) {
        if (rule.startsWith("Rule::")) continue;
        const name = rule.replace(/^'|'$/g, "").split(":")[0];
        expect(validRules, `${file.path}: ${rule}`).toContain(name);
      }
    }
  });

  it("belongsTo com FK customizada passa só a FK (foreignKey) e o método leva o nome da FK sem _id", () => {
    const model = content("app/Generated/Models/BaseOrderItem.php");

    expect(model).toContain("public function author(): BelongsTo");
    expect(model).toContain("return $this->belongsTo(User::class, 'author_id');");
    expect(model).not.toContain("'id', 'author_id'");
    expect(model).toContain("return $this->belongsTo(Order::class);");
  });

  it("hasMany e hasOne com FK customizada apontam para a coluna do filho", () => {
    const user = content("app/Generated/Models/BaseUser.php");

    expect(user).toContain("public function orderItemsByAuthor(): HasMany");
    expect(user).toContain("return $this->hasMany(OrderItem::class, 'author_id');");
    expect(user).toContain("public function orderByUser(): HasOne");
    expect(user).toContain("return $this->hasOne(Order::class, 'user_id');");
    // com a FK padrão, o Eloquent deduz tudo
    expect(user).toContain("return $this->hasMany(Order::class);");
    expect(user).not.toContain("'id', 'author_id'");
  });

  it("a model tem um cast por tipo que precisa dele", () => {
    const model = content("app/Generated/Models/BaseOrderItem.php");

    for (const cast of [
      "'quantity' => 'integer',",
      "'price' => 'double',",
      "'gift' => 'boolean',",
      "'options' => 'array',",
      "'shipped_on' => 'date',",
      "'packed_at' => 'datetime',",
      "'status' => OrderItemStatus::class,",
    ]) {
      expect(model).toContain(cast);
    }
    // uuid e string não têm cast (enum tem o do PHP enum, acima)
    for (const name of ["id", "sku", "author_id"]) {
      expect(model).not.toContain(`'${name}' =>`);
    }
  });
});

describe("migrations", () => {
  const manifest = loadManifest("curso");
  const migrationPaths = (existingMigrations: string[]) =>
    generate(manifest, { now, existingMigrations }).files
      .map((file) => file.path)
      .filter((p) => p.startsWith("database/migrations/"));

  it("usa a data informada no nome das migrations novas", () => {
    const paths = migrationPaths([]);

    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      expect(path.basename(p)).toMatch(/^2025_01_02_0304\d\d_create_\w+_table\.php$/);
    }
  });

  it("ordena por dependência de FK (empate = ordem do manifest) e soma 1 segundo por migration", () => {
    expect(migrationPaths([]).map((p) => path.basename(p))).toEqual([
      "2025_01_02_030405_create_courses_table.php",
      "2025_01_02_030406_create_course_contents_table.php",
      "2025_01_02_030407_create_users_table.php",
      "2025_01_02_030408_create_user_courses_table.php",
      "2025_01_02_030409_create_classrooms_table.php",
      "2025_01_02_030410_create_class_lessons_table.php",
      "2025_01_02_030411_create_class_lesson_comments_table.php",
      "2025_01_02_030412_create_class_lesson_attendees_table.php",
      "2025_01_02_030413_create_students_table.php",
    ]);
  });

  it("auto-referência (class_lesson_comment hasMany class_lesson_comment) não é ciclo", () => {
    const m = { ...manifest, pkg: { ...manifest.pkg, entities: { node: { fields: { id: "uuid" }, relationships: { belongsTo: ["node"] } } } } };
    expect(() => generate(m, { now, existingMigrations: [] })).not.toThrow();
  });

  it("a ordem não depende da ordem de declaração no manifest", () => {
    const entities = manifest.pkg.entities;
    const reversed = Object.fromEntries(Object.entries(entities).reverse());
    const m = { ...manifest, pkg: { ...manifest.pkg, entities: reversed } };
    const names = generate(m, { now, existingMigrations: [] }).files
      .map((file) => path.basename(file.path))
      .filter((name) => name.includes("_create_"))
      .sort();
    const position = (table: string) => names.findIndex((name) => name.endsWith(`_create_${table}_table.php`));

    expect(position("courses")).toBeLessThan(position("course_contents"));
    expect(position("classrooms")).toBeLessThan(position("class_lessons"));
    expect(position("class_lessons")).toBeLessThan(position("class_lesson_comments"));
    expect(position("users")).toBeLessThan(position("students"));
  });

  it("reaproveita o nome de uma migration que já existe", () => {
    const existing = "2020_05_06_070809_create_students_table.php";
    const paths = migrationPaths([existing]);

    expect(paths).toContain(`database/migrations/${existing}`);
    expect(paths.filter((p) => p.endsWith("_create_students_table.php"))).toEqual([`database/migrations/${existing}`]);
    // as demais continuam com o nome novo, sem renomear nem colidir com a existente
    expect(paths).toContain("database/migrations/2025_01_02_030405_create_courses_table.php");
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("regerar com as migrations da primeira geração não renomeia nada, mesmo com outro `now`", () => {
    const first = migrationPaths([]).map((p) => path.basename(p));
    const later = generate(manifest, { now: new Date(2026, 5, 7, 8, 9, 10), existingMigrations: first }).files
      .map((file) => file.path)
      .filter((p) => p.startsWith("database/migrations/"));

    expect(later.map((p) => path.basename(p))).toEqual(first);
  });

  it("entidade nova ao regerar recebe timestamp novo e as existentes ficam como estão", () => {
    const first = migrationPaths([]).map((p) => path.basename(p));
    const withNew = {
      ...manifest,
      pkg: { ...manifest.pkg, entities: { ...manifest.pkg.entities, badge: { fields: { id: "uuid" }, relationships: { belongsTo: ["user"] } } } },
    };
    const later = generate(withNew, { now: new Date(2026, 5, 7, 8, 9, 10), existingMigrations: first }).files
      .map((file) => path.basename(file.path))
      .filter((name) => name.includes("_create_"));

    expect(later.filter((name) => first.includes(name))).toEqual(first);
    expect(later.filter((name) => !first.includes(name))).toHaveLength(1);
    expect(later.find((name) => name.endsWith("_create_badges_table.php"))).toMatch(/^2026_06_07_0809\d\d_create_badges_table\.php$/);
  });
});

const laravelApiRoutes = `<?php

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
`;

describe("rotas", () => {
  const manifest = loadManifest("curso");
  const byPath = (files: GeneratedFile[], p: string) => files.find((f) => f.path === p);

  it("gera uma apiResource por entidade, em kebab-case plural", () => {
    const routes = byPath(generate(manifest, { now, existingMigrations: [] }).files, "routes/crudmaker.php")!;

    expect(routes.policy).toBe("overwrite");
    expect(routes.content).toContain("ARQUIVO GERADO PELO CRUDMAKER");
    const resources = routes.content.match(/Route::apiResource/g) ?? [];
    expect(resources.length).toBe(Object.keys(manifest.pkg.entities).length);
  });

  it("usa o nome de recurso que casa com $this->route() da request (class_lesson)", () => {
    const m = { ...manifest, pkg: { ...manifest.pkg, entities: { classLesson: { fields: { id: "uuid" } } } } };
    const files = generate(m, { now, existingMigrations: [] }).files;

    expect(byPath(files, "routes/crudmaker.php")!.content)
      .toContain("Route::apiResource('class-lessons', ClassLessonController::class);");
    expect(byPath(files, "app/Generated/Http/Requests/BaseClassLessonRequest.php")!.content).toContain("$this->route('class_lesson')");
  });

  it("não gera routes/api.php quando ele não existe", () => {
    for (const existingApiRoutes of [undefined, null]) {
      const files = generate(manifest, { now, existingMigrations: [], existingApiRoutes }).files;
      expect(byPath(files, "routes/api.php")).toBeUndefined();
    }
  });

  it("acrescenta o include ao final e deixa o resto igual", () => {
    const files = generate(manifest, { now, existingMigrations: [], existingApiRoutes: laravelApiRoutes }).files;
    const api = byPath(files, "routes/api.php")!;

    expect(api.content.startsWith(laravelApiRoutes)).toBe(true);
    expect(api.content.slice(laravelApiRoutes.length)).toBe(
      "\n// Rotas geradas pelo crudmaker (routes/crudmaker.php).\nrequire __DIR__ . '/crudmaker.php';\n",
    );
  });

  it("não duplica o include ao regerar", () => {
    const once = byPath(generate(manifest, { now, existingMigrations: [], existingApiRoutes: laravelApiRoutes }).files, "routes/api.php")!.content;
    const twice = byPath(generate(manifest, { now, existingMigrations: [], existingApiRoutes: once }).files, "routes/api.php")!.content;

    expect(twice).toBe(once);
    expect(twice.match(/crudmaker\.php';/g)?.length).toBe(1);
  });

  it.each([
    `require __DIR__.'/crudmaker.php';`,
    `require_once  __DIR__ . "/crudmaker.php" ;`,
    `include(__DIR__ . '/crudmaker.php');`,
  ])("reconhece o include já existente: %s", (line) => {
    const current = laravelApiRoutes + "\n" + line + "\n";
    const api = byPath(generate(manifest, { now, existingMigrations: [], existingApiRoutes: current }).files, "routes/api.php")!;

    expect(api.content).toBe(current);
  });

  it("completa o fim do arquivo sem quebra de linha final", () => {
    const api = byPath(generate(manifest, { now, existingMigrations: [], existingApiRoutes: "<?php" }).files, "routes/api.php")!;

    expect(api.content).toBe("<?php\n\n// Rotas geradas pelo crudmaker (routes/crudmaker.php).\nrequire __DIR__ . '/crudmaker.php';\n");
  });
});

// Semântica HTTP dos controllers (ticket 08), sem depender de snapshot.
describe("controllers gerados (semântica HTTP)", () => {
  const { files } = generate(loadManifest("vende-que-vende-api"), { now, existingMigrations: [] });
  const controllers = files.filter((file) => /^app\/Generated\/Http\/Controllers\/Api\/[^/]+\.php$/.test(file.path));

  function action(content: string, name: string): string {
    const start = content.indexOf(`public function ${name}(`);
    const next = content.indexOf("public function ", start + 1);
    return content.slice(start, next === -1 ? undefined : next);
  }

  it("gera um controller por entidade", () => {
    expect(controllers.length).toBeGreaterThan(0);
  });

  it("responde com o status certo em cada action", () => {
    for (const { content } of controllers) {
      expect(action(content, "index")).toContain("->paginate(15)");
      expect(action(content, "store")).toContain("], 201);");
      expect(action(content, "show")).toContain("], 200);");
      expect(action(content, "update")).toContain("], 200);");
      expect(action(content, "update")).not.toContain("201");
      expect(action(content, "destroy")).toContain("response()->noContent()");
      expect(action(content, "destroy")).not.toContain("response()->json");
    }
  });

  it("declara tipos de retorno nas actions", () => {
    for (const { content } of controllers) {
      expect(content).toContain("use Illuminate\\Http\\JsonResponse;");
      expect(content).toContain("use Illuminate\\Http\\Response;");
      for (const name of ["index", "store", "show", "update"]) {
        expect(action(content, name)).toMatch(/\): JsonResponse\n/);
      }
      expect(action(content, "destroy")).toMatch(/\): Response\n/);
    }
  });

  it("não tem try/catch genérico nem relança como 500", () => {
    for (const { content } of controllers) {
      expect(content).not.toContain("catch(\\Throwable");
      expect(content).not.toContain("catch (\\Throwable");
      expect(content).not.toContain("throw new \\Exception");
      expect(content).not.toContain("try");
    }
  });
});
