import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { generate, GeneratedFile } from "../src/generate";

const fixturesDir = path.join(__dirname, "fixtures");
const snapshotsDir = path.join(__dirname, "__snapshots__");

// 2025-01-02 03:04:05 (hora local, como o `format` do date-fns usa no nome da migration)
const now = new Date(2025, 0, 2, 3, 4, 5);

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

  it("usa a política overwrite e caminhos relativos", () => {
    for (const file of files) {
      expect(file.policy).toBe("overwrite");
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
    expect(files.find((file) => file.path === "app/Http/Requests/DrawnNumberRequest.php")!.content).toContain("$this->route('drawn_number')");
    expect(files.find((file) => file.path === "app/Http/Requests/PlayerInviteRequest.php")!.content).toContain("$this->route('player_invite')");
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
      expect(path.basename(p)).toMatch(/^2025_01_02_030405_create_\w+_table\.php$/);
    }
  });

  it("reaproveita o nome de uma migration que já existe", () => {
    const existing = "2020_05_06_070809_create_students_table.php";
    const paths = migrationPaths([existing]);

    expect(paths).toContain(`database/migrations/${existing}`);
    expect(paths).not.toContain("database/migrations/2025_01_02_030405_create_students_table.php");
    // as demais continuam com o nome novo
    expect(paths).toContain("database/migrations/2025_01_02_030405_create_courses_table.php");
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
    expect(byPath(files, "app/Http/Requests/ClassLessonRequest.php")!.content).toContain("$this->route('class_lesson')");
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
