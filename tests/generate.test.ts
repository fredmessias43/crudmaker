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
