import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import { run } from "../src/cli";

/**
 * Teste de ponta a ponta com Docker de verdade: baixa imagens e pacotes e leva alguns minutos na primeira vez.
 * Fica fora do `npm test`; rode com:
 *
 *   CRUDMAKER_E2E=1 npx vitest run tests/new.e2e.test.ts
 *
 * Usa Laravel 12 + sqlite (sem subir MySQL). Deixa o projeto em CRUDMAKER_E2E_KEEP=<dir> se quiser inspecioná-lo.
 */
const enabled = process.env.CRUDMAKER_E2E === "1";
const manifest = path.join(__dirname, "e2e/blog.json");

let tmp = "";
afterAll(() => {
  if (tmp && !process.env.CRUDMAKER_E2E_KEEP) fs.rmSync(tmp, { recursive: true, force: true });
});

/** Roda um comando no projeto, num container da mesma imagem do scaffold. */
function inProject(dir: string, command: string[]): string {
  const result = spawnSync(
    "docker",
    ["run", "--rm", "--user", `${process.getuid!()}:${process.getgid!()}`, "-v", `${dir}:/var/www/html`, "-w", "/var/www/html", "laravelsail/php82-composer:latest", ...command],
    { encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error(`${command.join(" ")} falhou:\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

describe.skipIf(!enabled)("crudmaker new (Docker de verdade)", () => {
  it("cria um Laravel 12 com sqlite, gera a API e as rotas e migrations funcionam", { timeout: 900_000 }, () => {
    tmp = process.env.CRUDMAKER_E2E_KEEP || fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-e2e-"));
    const dir = path.join(tmp, "blog");
    let stdout = "";
    let stderr = "";

    const code = run(["new", dir, manifest, "--laravel", "12", "--php", "8.2", "--db", "sqlite"], {
      stdout: (t) => (stdout += t),
      stderr: (t) => (stderr += t),
      cwd: tmp,
      now: () => new Date(),
    });
    expect(stderr).toBe("");
    expect(code).toBe(0);

    // o projeto e os arquivos do crudmaker estão lá, e os arquivos são do usuário (não do root)
    expect(fs.existsSync(path.join(dir, "artisan"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "compose.yaml"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "tests/Pest.php"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "app/Models/Post.php"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "routes/crudmaker.php"))).toBe(true);
    expect(fs.statSync(path.join(dir, "composer.json")).uid).toBe(process.getuid!());

    const routes = inProject(dir, ["php", "artisan", "route:list", "--path=api"]);
    expect(routes).toContain("api/authors");
    expect(routes).toContain("api/posts/{post}");

    const migrate = inProject(dir, ["php", "artisan", "migrate", "--force"]);
    expect(migrate).toContain("create_posts_table");
  });
});
