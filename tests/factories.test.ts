import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CliIo, run } from "../src/cli";
import { generate } from "../src/generate";
import { GENERATED_MARKER } from "../src/targets/types";

// Ticket 18: factories (base gerada + final create-once) e seeders opcionais. Os snapshots completos das factories
// ficam em __snapshots__/<fixture>/{app/Generated/Factories,database/factories} (rodados em generate.test.ts);
// aqui ficam o comportamento, os seeders (com snapshot próprio em __snapshots__/seeders) e o modo esqueleto.

const fixturesDir = path.join(__dirname, "fixtures");
const snapshotsDir = path.join(__dirname, "__snapshots__");
const now = new Date(2025, 0, 2, 3, 4, 5);

const loadManifest = (name: string) => JSON.parse(fs.readFileSync(path.join(fixturesDir, name, "manifest.json"), "utf8"));
const manifestOf = (entities: object) => ({ system: { code: "s" }, pkg: { code: "p", entities } }) as any;

describe("factory (order-item: todos os tipos e belongsTo)", () => {
  const { files } = generate(loadManifest("order-item"), { now, existingMigrations: [] });
  const file = (p: string) => files.find((f) => f.path === p)!;

  it("tem base (overwrite, com cabeçalho de gerado) e final (create-once, sem cabeçalho) por entidade", () => {
    for (const name of ["Order", "OrderItem"]) {
      const base = file(`app/Generated/Factories/Base${name}Factory.php`);
      const final = file(`database/factories/${name}Factory.php`);

      expect(base.policy).toBe("overwrite");
      expect(base.content).toContain(GENERATED_MARKER);
      expect(base.content).toContain("namespace App\\Generated\\Factories;");
      expect(base.content).toContain(`protected $model = ${name}::class;`);
      expect(final.policy).toBe("create-once");
      expect(final.content).not.toContain(GENERATED_MARKER);
      expect(final.content).toContain("namespace Database\\Factories;");
      expect(final.content).toContain(`class ${name}Factory extends Base${name}Factory`);
      expect(final.generatedBase).toEqual({ fqcn: `App\\Generated\\Factories\\Base${name}Factory`, path: `app/Generated/Factories/Base${name}Factory.php` });
    }
  });

  it("gera um valor fake por tipo, o enum sorteia os casos e a FK cria o pai", () => {
    const base = file("app/Generated/Factories/BaseOrderItemFactory.php").content;

    expect(base).toContain("'sku' => fake()->unique()->words(3, true),");
    expect(base).toContain("'quantity' => fake()->numberBetween(1, 1000),");
    expect(base).toContain("'price' => fake()->randomFloat(2, 0, 1000),");
    expect(base).toContain("'gift' => fake()->boolean(),");
    expect(base).toContain("'options' => [],");
    expect(base).toContain("'shipped_on' => fake()->date(),");
    expect(base).toContain("'packed_at' => fake()->dateTime(),");
    expect(base).toContain("'status' => fake()->randomElement(OrderItemStatus::cases()),");
    expect(base).toContain("use App\\Generated\\Enums\\OrderItemStatus;");
    // FK de belongsTo: o pai é criado junto; o id nunca entra (o HasUuids gera)
    expect(base).toContain("'order_id' => Order::factory(),");
    expect(base).toContain("'author_id' => User::factory(),");
    expect(base).toContain("use App\\Models\\Order;");
    expect(base).not.toContain("'id' =>");
  });

  it("a model base usa HasFactory e o $model da factory é a model final, que o Laravel resolve pelo nome", () => {
    expect(file("app/Generated/Models/BaseOrderItem.php").content).toContain("use HasFactory;");
    expect(file("app/Generated/Factories/BaseOrderItemFactory.php").content).toContain("use App\\Models\\OrderItem;");
    // Model::factory() procura Database\Factories\<Model>Factory: é a final, que estende a base
    expect(file("database/factories/OrderItemFactory.php").path).toBe("database/factories/OrderItemFactory.php");
  });

  it("não gera seeder sem a flag", () => {
    expect(files.some((f) => f.path.startsWith("database/seeders/"))).toBe(false);
  });
});

describe("factory: valores por nome, unique, default e auto-referência", () => {
  const manifest = manifestOf({
    category: {
      fields: {
        id: "uuid",
        parent_id: { type: "uuid", required: false },
        name: "string",
        slug: { type: "string", unique: true },
        contact_email: "string",
        billing_phone: "string",
        avatar_url: "string",
        city: "string",
        label: "string",
        mood: { type: "enum", enumItems: ["happy", "sad"], default: "sad" },
        score: { type: "integer", default: 7 },
        pinned: { type: "boolean", unique: true },
      },
      relationships: { belongsTo: [{ entity: "category", field: "parent_id" }] },
    },
  });
  const { files } = generate(manifest, { now, existingMigrations: [] });
  const base = files.find((f) => f.path === "app/Generated/Factories/BaseCategoryFactory.php")!.content;

  it("aplica a tabela de heurísticas só aos campos string", () => {
    expect(base).toContain("'name' => fake()->name(),");
    expect(base).toContain("'contact_email' => fake()->safeEmail(),");
    expect(base).toContain("'billing_phone' => fake()->phoneNumber(),");
    expect(base).toContain("'avatar_url' => fake()->url(),");
    expect(base).toContain("'city' => fake()->city(),");
    expect(base).toContain("'label' => fake()->words(3, true),");
  });

  it("unique: true usa fake()->unique() (menos em boolean e enum)", () => {
    expect(base).toContain("'slug' => fake()->unique()->slug(),");
    expect(base).toContain("'pinned' => fake()->boolean(),");
  });

  it("default declarado vale para qualquer tipo, enum incluso", () => {
    expect(base).toContain("'mood' => 'sad',");
    expect(base).toContain("'score' => 7,");
    expect(base).not.toContain("CategoryMood");
  });

  it("FK para a própria tabela vira null (a factory não pode chamar a si mesma)", () => {
    expect(base).toContain("'parent_id' => null,");
    expect(base).not.toContain("=> Category::factory()");
  });
});

// Seeders (flag) --------------------------------------------------------------

describe("seeders (order-item, com a flag)", () => {
  const { files, warnings } = generate(loadManifest("order-item"), { now, existingMigrations: [], seeders: true });
  const file = (p: string) => files.find((f) => f.path === p)!;
  const seederPaths = files.map((f) => f.path).filter((p) => p.startsWith("database/seeders/"));

  it("gera um seeder por entidade (create-once) e o CrudmakerSeeder (overwrite)", () => {
    expect(seederPaths.sort()).toEqual([
      "database/seeders/CrudmakerSeeder.php",
      "database/seeders/OrderItemSeeder.php",
      "database/seeders/OrderSeeder.php",
      "database/seeders/UserSeeder.php",
    ]);
    expect(file("database/seeders/OrderSeeder.php").policy).toBe("create-once");
    expect(file("database/seeders/OrderSeeder.php").content).not.toContain(GENERATED_MARKER);
    expect(file("database/seeders/CrudmakerSeeder.php").policy).toBe("overwrite");
    expect(file("database/seeders/CrudmakerSeeder.php").content).toContain(GENERATED_MARKER);
  });

  it("o CrudmakerSeeder chama os pais antes dos filhos, mesmo declarados depois", () => {
    const calls = [...file("database/seeders/CrudmakerSeeder.php").content.matchAll(/\t\t\t(\w+)::class,/g)].map((m) => m[1]);

    expect(calls.indexOf("UserSeeder")).toBeLessThan(calls.indexOf("OrderSeeder"));
    expect(calls.indexOf("OrderSeeder")).toBeLessThan(calls.indexOf("OrderItemSeeder"));
    expect(calls).toHaveLength(3);
  });

  it("o seeder reaproveita um pai já semeado, ou cria um pela factory", () => {
    const seeder = file("database/seeders/OrderItemSeeder.php").content;

    expect(seeder).toContain("OrderItem::factory()");
    expect(seeder).toContain("->count(10)");
    expect(seeder).toContain("'order_id' => Order::query()->inRandomOrder()->value('id') ?? Order::factory(),");
  });

  it("avisa como chamar o CrudmakerSeeder, a não ser que o DatabaseSeeder já o chame", () => {
    expect(warnings.some((w) => w.includes("CrudmakerSeeder") && w.includes("DatabaseSeeder"))).toBe(true);

    const already = generate(loadManifest("order-item"), {
      now,
      existingMigrations: [],
      seeders: true,
      existingDatabaseSeeder: "<?php $this->call(\\Database\\Seeders\\CrudmakerSeeder::class);",
    });
    expect(already.warnings.some((w) => w.includes("CrudmakerSeeder"))).toBe(false);
  });

  it("tem o conteúdo esperado (snapshot)", async () => {
    for (const p of seederPaths) await expect(file(p).content).toMatchFileSnapshot(path.join(snapshotsDir, "seeders", p));
  });
});

// CLI -------------------------------------------------------------------------

describe("CLI: --seeders", () => {
  let tmp: string;
  let out: string;
  let stdout: string;
  const io = (): CliIo => ({ stdout: (t) => (stdout += t), stderr: () => {}, cwd: tmp, now: () => now });
  const manifest = () => path.join(fixturesDir, "order-item/manifest.json");
  const exists = (p: string) => fs.existsSync(path.join(out, p));

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-factories-"));
    out = path.join(tmp, "projeto");
    stdout = "";
  });
  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it("sem a flag, nenhum seeder; com ela, seeders e aviso do DatabaseSeeder", () => {
    expect(run(["generate", manifest(), "--out", out], io())).toBe(0);
    expect(exists("database/seeders")).toBe(false);
    expect(exists("database/factories/OrderFactory.php")).toBe(true);

    expect(run(["generate", manifest(), "--out", out, "--seeders"], io())).toBe(0);
    expect(exists("database/seeders/CrudmakerSeeder.php")).toBe(true);
    expect(exists("database/seeders/OrderSeeder.php")).toBe(true);
    expect(stdout).toContain("chame o CrudmakerSeeder no database/seeders/DatabaseSeeder.php");
  });

  it("a final da factory e o seeder editados sobrevivem; a base e o CrudmakerSeeder são regravados", () => {
    run(["generate", manifest(), "--out", out, "--seeders"], io());
    const finalFactory = path.join(out, "database/factories/OrderFactory.php");
    const seeder = path.join(out, "database/seeders/OrderSeeder.php");
    fs.writeFileSync(finalFactory, "<?php // meu estado\n");
    fs.writeFileSync(seeder, "<?php // meu seeder\n");
    fs.writeFileSync(path.join(out, "app/Generated/Factories/BaseOrderFactory.php"), "editado na base");
    fs.writeFileSync(path.join(out, "database/seeders/CrudmakerSeeder.php"), "editado");

    stdout = "";
    expect(run(["generate", manifest(), "--out", out, "--seeders"], io())).toBe(0);

    expect(fs.readFileSync(finalFactory, "utf8")).toBe("<?php // meu estado\n");
    expect(fs.readFileSync(seeder, "utf8")).toBe("<?php // meu seeder\n");
    expect(fs.readFileSync(path.join(out, "app/Generated/Factories/BaseOrderFactory.php"), "utf8")).toContain("abstract class BaseOrderFactory");
    expect(fs.readFileSync(path.join(out, "database/seeders/CrudmakerSeeder.php"), "utf8")).toContain("OrderSeeder::class");
    // a final editada à mão não estende a base: o aviso de arquivo antigo aparece
    expect(stdout).toContain("database/factories/OrderFactory.php: não estende a base gerada BaseOrderFactory");
  });

  it("o --help documenta a flag", () => {
    run(["generate", "--help"], io());
    expect(stdout).toContain("--seeders");
  });
});

// Modo esqueleto --------------------------------------------------------------

describe.each([
  ["laravel-10", "10"],
  ["laravel-11", "11"],
] as const)("entidade user sobre o esqueleto do %s", (version, laravel) => {
  let tmp: string;
  let out: string;
  let stdout: string;
  const io = (): CliIo => ({ stdout: (t) => (stdout += t), stderr: () => {}, cwd: tmp, now: () => now });
  const read = (p: string) => fs.readFileSync(path.join(out, p), "utf8");

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-factories-"));
    out = path.join(tmp, "projeto");
    stdout = "";
    fs.cpSync(path.join(fixturesDir, "skeleton", version), out, { recursive: true });
  });
  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

  const generateIt = (extra: string[] = []) =>
    run(["generate", path.join(fixturesDir, "skeleton/manifest.json"), "--out", out, "--laravel", laravel, "--php", "8.2", ...extra], io());

  it("preserva a UserFactory do esqueleto e avisa como migrar para a base", () => {
    const original = read("database/factories/UserFactory.php");
    expect(generateIt()).toBe(0);

    expect(read("database/factories/UserFactory.php")).toBe(original);
    expect(stdout).toContain("database/factories/UserFactory.php: é a factory do esqueleto do Laravel");
    expect(stdout).toContain("extends \\App\\Generated\\Factories\\BaseUserFactory");
    expect(stdout).not.toContain("UserFactory.php: não estende a base gerada");
  });

  it("gera a BaseUserFactory com os valores de autenticação do esqueleto", () => {
    generateIt();
    const base = read("app/Generated/Factories/BaseUserFactory.php");

    expect(base).toContain("use Illuminate\\Support\\Facades\\Hash;");
    expect(base).toContain("protected static ?string $password = null;");
    expect(base).toContain("'password' => static::$password ??= Hash::make('password'),");
    expect(base).toContain("'email_verified_at' => now(),");
    expect(base).toContain("'remember_token' => Str::random(10),");
    expect(base).toContain("'email' => fake()->unique()->safeEmail(),");
    expect(base).toContain("'phone' => fake()->phoneNumber(),");
    expect(base).not.toContain("'id' =>");
    // quem aponta para user usa User::factory() (a do esqueleto enquanto a final não for migrada)
    expect(read("app/Generated/Factories/BasePostFactory.php")).toContain("'user_id' => User::factory(),");
    // a final nova não existe (a UserFactory do esqueleto ocupa o lugar) e nada do esqueleto foi tocado
    expect(read("database/factories/UserFactory.php")).toContain("function unverified()");
  });

  it("depois da migração da UserFactory para a base, o aviso some", () => {
    generateIt();
    fs.writeFileSync(
      path.join(out, "database/factories/UserFactory.php"),
      "<?php\n\nnamespace Database\\Factories;\n\nclass UserFactory extends \\App\\Generated\\Factories\\BaseUserFactory\n{\n}\n",
    );

    stdout = "";
    generateIt();
    expect(stdout).not.toContain("UserFactory.php:");
  });
});

describe("modo esqueleto: user sem name/email no manifest (ticket 19)", () => {
  const existing = fs.readdirSync(path.join(fixturesDir, "skeleton/laravel-11/database/migrations"));
  const manifest = manifestOf({ user: { fields: { id: "uuid", nickname: "string" } } });
  const result = generate(manifest, { now, existingMigrations: existing, unmarkedMigrations: existing });

  it("a factory preenche name e email (NOT NULL no esqueleto), para User::factory() criar o usuário", () => {
    const base = result.files.find((f) => f.path === "app/Generated/Factories/BaseUserFactory.php")!.content;
    expect(base).toContain("'name' => fake()->name(),");
    expect(base).toContain("'email' => fake()->unique()->safeEmail(),");
    expect(base.indexOf("'name' =>")).toBeLessThan(base.indexOf("'email' =>"));
  });

  it("avisa que a API não consegue criar usuários sem esses campos", () => {
    expect(result.warnings.some((w) => w.includes("A entidade user não declara name e email"))).toBe(true);
  });

  it("não avisa quando o manifest declara name e email", () => {
    const ok = generate(manifestOf({ user: { fields: { id: "uuid", name: "string", email: "string" } } }), { now, existingMigrations: existing, unmarkedMigrations: existing });
    expect(ok.warnings.some((w) => w.includes("A entidade user não declara"))).toBe(false);
  });
});
