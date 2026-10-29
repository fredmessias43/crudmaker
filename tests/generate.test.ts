import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { generate } from "../src/generate";

const fixturesDir = path.join(__dirname, "fixtures");
const snapshotsDir = path.join(__dirname, "__snapshots__");

// 2025-01-02 03:04:05 (hora local, como o `format` do date-fns usa no nome da migration)
const now = new Date(2025, 0, 2, 3, 4, 5);

function loadManifest(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name, "manifest.json"), "utf8"));
}

describe.each(["bingo", "curso", "vende-que-vende-api"])("generate (%s)", (name) => {
  const manifest = loadManifest(name);
  const files = generate(manifest, { now, existingMigrations: [] });

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

describe("migrations", () => {
  const manifest = loadManifest("curso");
  const migrationPaths = (existingMigrations: string[]) =>
    generate(manifest, { now, existingMigrations })
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
  const byPath = (files: ReturnType<typeof generate>, p: string) => files.find((f) => f.path === p);

  it("gera uma apiResource por entidade, em kebab-case plural", () => {
    const routes = byPath(generate(manifest, { now, existingMigrations: [] }), "routes/crudmaker.php")!;

    expect(routes.policy).toBe("overwrite");
    expect(routes.content).toContain("ARQUIVO GERADO PELO CRUDMAKER");
    const resources = routes.content.match(/Route::apiResource/g) ?? [];
    expect(resources.length).toBe(Object.keys(manifest.pkg.entities).length);
  });

  it("usa o nome de recurso que casa com $this->route() da request (class_lesson)", () => {
    const m = { ...manifest, pkg: { ...manifest.pkg, entities: { classLesson: { fields: { id: "uuid" } } } } };
    const files = generate(m, { now, existingMigrations: [] });

    expect(byPath(files, "routes/crudmaker.php")!.content)
      .toContain("Route::apiResource('class-lessons', ClassLessonController::class);");
    expect(byPath(files, "app/Http/Requests/ClassLessonRequest.php")!.content).toContain("$this->route('class_lesson')");
  });

  it("não gera routes/api.php quando ele não existe", () => {
    for (const existingApiRoutes of [undefined, null]) {
      const files = generate(manifest, { now, existingMigrations: [], existingApiRoutes });
      expect(byPath(files, "routes/api.php")).toBeUndefined();
    }
  });

  it("acrescenta o include ao final e deixa o resto igual", () => {
    const files = generate(manifest, { now, existingMigrations: [], existingApiRoutes: laravelApiRoutes });
    const api = byPath(files, "routes/api.php")!;

    expect(api.content.startsWith(laravelApiRoutes)).toBe(true);
    expect(api.content.slice(laravelApiRoutes.length)).toBe(
      "\n// Rotas geradas pelo crudmaker (routes/crudmaker.php).\nrequire __DIR__ . '/crudmaker.php';\n",
    );
  });

  it("não duplica o include ao regerar", () => {
    const once = byPath(generate(manifest, { now, existingMigrations: [], existingApiRoutes: laravelApiRoutes }), "routes/api.php")!.content;
    const twice = byPath(generate(manifest, { now, existingMigrations: [], existingApiRoutes: once }), "routes/api.php")!.content;

    expect(twice).toBe(once);
    expect(twice.match(/crudmaker\.php';/g)?.length).toBe(1);
  });

  it.each([
    `require __DIR__.'/crudmaker.php';`,
    `require_once  __DIR__ . "/crudmaker.php" ;`,
    `include(__DIR__ . '/crudmaker.php');`,
  ])("reconhece o include já existente: %s", (line) => {
    const current = laravelApiRoutes + "\n" + line + "\n";
    const api = byPath(generate(manifest, { now, existingMigrations: [], existingApiRoutes: current }), "routes/api.php")!;

    expect(api.content).toBe(current);
  });

  it("completa o fim do arquivo sem quebra de linha final", () => {
    const api = byPath(generate(manifest, { now, existingMigrations: [], existingApiRoutes: "<?php" }), "routes/api.php")!;

    expect(api.content).toBe("<?php\n\n// Rotas geradas pelo crudmaker (routes/crudmaker.php).\nrequire __DIR__ . '/crudmaker.php';\n");
  });
});
