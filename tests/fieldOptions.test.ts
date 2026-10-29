import path from "path";
import { describe, expect, it } from "vitest";
import { generate } from "../src/generate";
import { readManifest } from "../src/readManifest";
import { Manifest } from "../src/models/Manifest";
import { ManifestValidationError } from "../src/validateManifest";

// Ticket 12: opções de campo `hidden`, `rules` e `default`.

const fixturesDir = path.join(__dirname, "fixtures");
const snapshotsDir = path.join(__dirname, "__snapshots__");
const now = new Date(2025, 0, 2, 3, 4, 5);

const manifest = readManifest(path.join(fixturesDir, "field-options/manifest.yaml"));
const result = generate(manifest, { now, existingMigrations: [] });
const files = new Map(result.files.map((file) => [file.path, file.content]));

function content(filePath: string): string {
  const text = files.get(filePath);
  if (text === undefined) throw new Error(`arquivo não gerado: ${filePath}`);
  return text;
}

const migration = content("database/migrations/2025_01_02_030405_create_accounts_table.php");
const resource = content("app/Generated/Http/Resources/BaseAccountResource.php");
const model = content("app/Generated/Models/BaseAccount.php");
const request = content("app/Generated/Http/Requests/BaseAccountRequest.php");

describe("fixture field-options (snapshot)", () => {
  it("devolve a lista de caminhos esperada", async () => {
    await expect(result.files.map((file) => file.path).join("\n") + "\n").toMatchFileSnapshot(path.join(snapshotsDir, "field-options", "_paths.txt"));
  });

  it("gera o conteúdo esperado de cada arquivo", async () => {
    for (const file of result.files) {
      await expect(file.content).toMatchFileSnapshot(path.join(snapshotsDir, "field-options", file.path));
    }
  });

  it("o JSON da fixture é equivalente ao YAML", () => {
    expect(readManifest(path.join(fixturesDir, "field-options/manifest.json"))).toEqual(manifest);
  });
});

describe("hidden", () => {
  it("tira o campo da resource e mantém os demais", () => {
    expect(resource).not.toContain("'password'");
    expect(resource).toContain("'email' => $this->email,");
  });

  it("entra em $hidden da model, que também continua com ele no $fillable", () => {
    const hidden = model.slice(model.indexOf("$hidden"));
    expect(hidden).toContain("'password',");
    expect(hidden.slice(0, hidden.indexOf("];"))).not.toContain("'email'");
    expect(model.slice(model.indexOf("$fillable"), model.indexOf("$hidden"))).toContain("'password',");
  });

  it("segue na validação", () => {
    expect(request).toContain("'password' => array(");
  });

  it("a model sem campos ocultos não ganha $hidden", () => {
    const other = generate(readManifest(path.join(fixturesDir, "api-options/manifest.yaml")), { now, existingMigrations: [] });
    expect(other.files.some((file) => file.path.includes("/Generated/Models/") && file.content.includes("$hidden"))).toBe(false);
  });
});

describe("rules", () => {
  const rulesOf = (name: string) => {
    const start = request.indexOf(`'${name}' => array(`);
    return request.slice(start, request.indexOf("\n\t\t\t\t),", start)).split("\n").slice(1).map((line) => line.trim()).filter((line) => line !== "");
  };

  it("somam depois das derivadas, na ordem declarada e sem duplicar", () => {
    expect(rulesOf("email")).toEqual([
      "'bail',",
      "'required',",
      "'string',",
      "Rule::unique('accounts', 'email')->ignore($this->route('account')),",
      "'email',",
      "'max:120',",
    ]);
  });

  it("valem também em campo sem outras regras além das do tipo", () => {
    expect(rulesOf("password")).toEqual(["'bail',", "'required',", "'string',", "'min:8',"]);
  });
});

describe("default", () => {
  const column = (line: string) => {
    expect(migration, `coluna ausente: ${line}`).toContain(`\t\t\t${line}\n`);
  };

  it("vira ->default(...) na migration em cada tipo suportado", () => {
    column("$table->text('bio')->default('sem bio');");
    column("$table->uuid('owner_ref')->default('00000000-0000-0000-0000-000000000000');");
    column("$table->integer('age')->default(18);");
    column("$table->double('credit')->default(12.5);");
    column("$table->integer('score')->default(0);");
    column("$table->boolean('active')->default(true);");
    column("$table->boolean('newsletter')->default(false);");
    column("$table->date('birthday')->default('2000-01-31');");
    column("$table->datetime('last_seen')->default('2025-01-02 03:04:05');");
  });

  it("escapa aspas e barras", () => {
    column("$table->string('nickname')->default('O\\'Brien \\\\ Co')->nullable();");
  });

  it("em enum substitui o primeiro item", () => {
    column("$table->enum('status', ['pending','active','blocked'])->default('active');");
  });

  it("em enum sem default continua valendo o primeiro item", () => {
    column("$table->enum('plan', ['free','pro'])->default('free');");
  });

  it("não cria default em json nem em campo sem default", () => {
    column("$table->json('settings');");
    column("$table->string('email');");
  });

  it("fica guardado no modelo normalizado (para a factory) e só nos campos que declaram", () => {
    const { fields } = new Manifest(manifest).entities.account;
    expect(fields.age.default).toBe(18);
    expect(fields.status.default).toBe("active");
    expect(fields.score.default).toBe(0);
    expect(fields.newsletter.default).toBe(false);
    expect("default" in fields.email).toBe(false);
    expect(fields.password.rules).toEqual(["min:8"]);
    expect(fields.password.hidden).toBe(true);
  });

  it("não torna o campo opcional na request", () => {
    expect(request).toContain("'age' => array(\n\t\t\t\t\t'bail',\n\t\t\t\t\t'required',");
  });
});

describe("validação", () => {
  function problemsOf(field: unknown, extraFields: object = {}) {
    const input = {
      system: { code: "s" },
      pkg: { code: "p", entities: { client: { fields: { id: "uuid", ...extraFields, x: field } } } },
    };
    try {
      generate(input as any, { now, existingMigrations: [] });
    } catch (e) {
      expect(e).toBeInstanceOf(ManifestValidationError);
      return (e as ManifestValidationError).problems;
    }
    return [];
  }

  const path_ = "pkg.entities.client.fields.x";

  it.each([
    ["string", "texto", 5, "default de campo string deve ser texto, recebido número 5"],
    ["uuid", "texto", true, "default de campo uuid deve ser texto"],
    ["integer", "inteiro", "10", "default de campo integer deve ser um número inteiro, recebido texto \"10\""],
    ["integer", "inteiro", 1.5, "default de campo integer deve ser um número inteiro"],
    ["double", "número", "1.5", "default de campo double deve ser um número"],
    ["boolean", "booleano", "true", "default de campo boolean deve ser true ou false"],
    ["date", "data", "31/01/2000", "default de campo date deve ser uma data no formato Y-m-d"],
    ["date", "data", "2025-02-30", "default de campo date deve ser uma data no formato Y-m-d"],
    ["datetime", "data/hora", "2025-01-02", "default de campo datetime deve ser uma data no formato Y-m-d H:i:s"],
    ["datetime", "data/hora", "2025-01-02 25:00:00", "default de campo datetime deve ser uma data no formato Y-m-d H:i:s"],
    ["json", "json", "{}", "default não é suportado em campo json"],
  ])("default incompatível com %s (%s): %j", (type, _label, value, message) => {
    const problems = problemsOf({ type, default: value });
    expect(problems).toHaveLength(1);
    expect(problems[0].path).toBe(`${path_}.default`);
    expect(problems[0].message).toContain(message);
  });

  it("default fora do enum", () => {
    expect(problemsOf({ type: "enum", enumItems: ["a", "b"], default: "c" })).toEqual([
      { path: `${path_}.default`, message: 'default de campo enum deve ser um dos enumItems ("a", "b"), recebido texto "c"' },
    ]);
  });

  it("aceita os tipos alias (int) e valores válidos", () => {
    expect(problemsOf({ type: "int", default: 3 })).toEqual([]);
    expect(problemsOf({ type: "double", default: 3 })).toEqual([]);
  });

  it("default que não é texto, número nem booleano", () => {
    expect(problemsOf({ type: "string", default: ["a"] })).toEqual([
      { path: `${path_}.default`, message: "deve ser texto, número ou verdadeiro/falso (true/false), recebido lista" },
    ]);
    expect(problemsOf({ type: "string", default: null })[0].message).toContain("recebido nulo");
  });

  it("rules com item vazio", () => {
    expect(problemsOf({ type: "string", rules: ["email", ""] })).toEqual([
      { path: `${path_}.rules[1]`, message: "não pode ser vazio" },
    ]);
  });

  it("rules com item que não é texto", () => {
    expect(problemsOf({ type: "string", rules: ["email", 5] })).toEqual([
      { path: `${path_}.rules[1]`, message: "deve ser texto, recebido número" },
    ]);
  });

  it("rules que não é lista", () => {
    expect(problemsOf({ type: "string", rules: "email" })).toEqual([
      { path: `${path_}.rules`, message: "deve ser lista, recebido texto" },
    ]);
  });

  it("hidden não booleano", () => {
    expect(problemsOf({ type: "string", hidden: "sim" })).toEqual([
      { path: `${path_}.hidden`, message: "deve ser verdadeiro/falso (true/false), recebido texto" },
    ]);
  });

  it("acumula os problemas de tipo de campos diferentes", () => {
    const problems = problemsOf({ type: "integer", default: "x" }, { y: { type: "boolean", default: 1 } });
    expect(problems.map((p) => p.path)).toEqual(["pkg.entities.client.fields.y.default", `${path_}.default`]);
  });

  it("o caminho usa a chave original, também com a normalização de nomes", () => {
    const problems = problemsOf({ type: "string" }, { UserName: { type: "integer", default: "a" } });
    expect(problems.map((p) => p.path)).toEqual(["pkg.entities.client.fields.UserName.default"]);
  });

  it("a normalização de nomes não mexe nas opções", () => {
    const input = {
      system: { code: "s" },
      pkg: { code: "p", entities: { client: { fields: { id: "uuid", UserName: { type: "string", hidden: true, rules: ["Max:5"], default: "Aa Bb" } } } } },
    };
    const field = new Manifest(input).entities.client.fields.user_name;
    expect(field).toMatchObject({ hidden: true, rules: ["Max:5"], default: "Aa Bb" });
  });
});
