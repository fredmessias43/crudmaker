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

  it("com a entidade user, mantém as migrations do esqueleto e o login padrão continua possível", { timeout: 900_000 }, () => {
    tmp = process.env.CRUDMAKER_E2E_KEEP || fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-e2e-"));
    const dir = path.join(tmp, "blog-user");
    let stdout = "";
    let stderr = "";

    const code = run(["new", dir, path.join(__dirname, "e2e/blog-user.json"), "--laravel", "12", "--php", "8.2", "--db", "sqlite"], {
      stdout: (t) => (stdout += t),
      stderr: (t) => (stderr += t),
      cwd: tmp,
      now: () => new Date(),
    });
    expect(stderr).toBe("");
    expect(code).toBe(0);

    // a migration do esqueleto segue intacta (com as tabelas de auth) e as colunas extras saem numa alter
    const migrationsDir = path.join(dir, "database/migrations");
    const skeleton = fs.readFileSync(path.join(migrationsDir, "0001_01_01_000000_create_users_table.php"), "utf8");
    expect(skeleton).toContain("rememberToken()");
    expect(skeleton).toContain("password_reset_tokens");
    expect(skeleton).not.toContain("ARQUIVO GERADO PELO CRUDMAKER");
    expect(fs.readdirSync(migrationsDir).some((file) => file.endsWith("_alter_users_table.php"))).toBe(true);
    expect(stdout).toContain("app/Models/User.php: é o model do esqueleto do Laravel");

    // migração do User.php para a base gerada, como a instrução do aviso
    fs.writeFileSync(
      path.join(dir, "app/Models/User.php"),
      "<?php\n\nnamespace App\\Models;\n\nclass User extends \\App\\Generated\\Models\\BaseUser\n{\n}\n",
    );
    inProject(dir, ["php", "artisan", "migrate", "--force"]);

    // Script PHP que sobe a aplicação (o tinker precisa gravar no HOME, que o usuário do container não tem).
    const php = (body: string[]) => {
      fs.writeFileSync(
        path.join(dir, "crudmaker-e2e.php"),
        ["<?php", "require __DIR__ . '/vendor/autoload.php';", "$app = require __DIR__ . '/bootstrap/app.php';", "$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();", ...body].join("\n"),
      );
      return inProject(dir, ["php", "crudmaker-e2e.php"]);
    };

    const columns = php(["echo implode(',', Illuminate\\Support\\Facades\\Schema::getColumnListing('users'));"]);
    for (const column of ["password", "remember_token", "email_verified_at", "phone"]) expect(columns).toContain(column);

    // cria o usuário (a senha é cifrada pelo cast hashed), valida o login e cria um post apontando para ele (FK bigint)
    const output = php([
      "$u = App\\Models\\User::create(['name' => 'Ana', 'email' => 'ana@example.com', 'password' => 'secret-123', 'phone' => '1199']);",
      "echo 'hash=' . (Illuminate\\Support\\Facades\\Hash::isHashed($u->password) ? 'ok' : 'no') . PHP_EOL;",
      "echo 'login=' . (Illuminate\\Support\\Facades\\Auth::guard('web')->validate(['email' => 'ana@example.com', 'password' => 'secret-123']) ? 'ok' : 'falhou') . PHP_EOL;",
      "echo 'senha-errada=' . (Illuminate\\Support\\Facades\\Auth::guard('web')->validate(['email' => 'ana@example.com', 'password' => 'x']) ? 'aceita' : 'recusada') . PHP_EOL;",
      "echo 'hidden=' . (array_key_exists('password', $u->toArray()) ? 'vazou' : 'ok') . PHP_EOL;",
      "$p = App\\Models\\Post::create(['user_id' => $u->id, 'title' => 'Oi']);",
      "echo 'post-user=' . $p->user->email . PHP_EOL;",
    ]);
    expect(output).toContain("hash=ok");
    expect(output).toContain("login=ok");
    expect(output).toContain("senha-errada=recusada");
    expect(output).toContain("hidden=ok");
    expect(output).toContain("post-user=ana@example.com");
  });

  it("com --seeders, Post::factory() cria também o autor e o CrudmakerSeeder popula o banco na ordem das FKs", { timeout: 900_000 }, () => {
    tmp = process.env.CRUDMAKER_E2E_KEEP || fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-e2e-"));
    const dir = path.join(tmp, "blog-seeders");
    let stdout = "";
    let stderr = "";

    const code = run(["new", dir, manifest, "--laravel", "12", "--php", "8.2", "--db", "sqlite", "--seeders"], {
      stdout: (t) => (stdout += t),
      stderr: (t) => (stderr += t),
      cwd: tmp,
      now: () => new Date(),
    });
    expect(stderr).toBe("");
    expect(code).toBe(0);
    expect(fs.existsSync(path.join(dir, "database/factories/PostFactory.php"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "app/Generated/Factories/BasePostFactory.php"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "database/seeders/CrudmakerSeeder.php"))).toBe(true);
    expect(stdout).toContain("chame o CrudmakerSeeder");

    inProject(dir, ["php", "artisan", "migrate", "--force"]);

    const php = (body: string[]) => {
      fs.writeFileSync(
        path.join(dir, "crudmaker-e2e.php"),
        ["<?php", "require __DIR__ . '/vendor/autoload.php';", "$app = require __DIR__ . '/bootstrap/app.php';", "$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();", ...body].join("\n"),
      );
      return inProject(dir, ["php", "crudmaker-e2e.php"]);
    };

    // factory: 5 posts, cada um com o autor criado junto; o enum vira o PHP enum e o e-mail único não repete
    const factory = php([
      "$posts = App\\Models\\Post::factory()->count(5)->create();",
      "echo 'posts=' . App\\Models\\Post::count() . PHP_EOL;",
      "echo 'authors=' . App\\Models\\Author::count() . PHP_EOL;",
      "echo 'pai=' . ($posts[0]->author instanceof App\\Models\\Author ? 'ok' : 'no') . PHP_EOL;",
      "echo 'enum=' . ($posts[0]->status instanceof App\\Generated\\Enums\\PostStatus ? 'ok' : 'no') . PHP_EOL;",
    ]);
    expect(factory).toContain("posts=5");
    expect(factory).toContain("authors=5");
    expect(factory).toContain("pai=ok");
    expect(factory).toContain("enum=ok");

    // seeder: db:seed --class=CrudmakerSeeder acrescenta 10 autores e 10 posts, os posts reaproveitando os autores semeados
    inProject(dir, ["php", "artisan", "db:seed", "--class=CrudmakerSeeder", "--force"]);
    const seeded = php([
      "echo 'posts=' . App\\Models\\Post::count() . PHP_EOL;",
      "echo 'authors=' . App\\Models\\Author::count() . PHP_EOL;",
    ]);
    expect(seeded).toContain("posts=15");
    expect(seeded).toContain("authors=15");
  });
});
