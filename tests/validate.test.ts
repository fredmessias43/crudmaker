import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { generate } from "../src/generate";
import { buildJsonSchema } from "../src/manifestSchema";
import { ManifestValidationError, validateManifest } from "../src/validateManifest";

const root = path.join(__dirname, "..");
const now = new Date(2025, 0, 2, 3, 4, 5);

/** Manifest mínimo válido; os testes alteram uma cópia. */
function base(): any {
  return {
    system: { code: "s" },
    pkg: {
      code: "p",
      entities: {
        client: { fields: { id: "uuid", email: "string" } },
        alert: { fields: { id: "uuid" }, relationships: { belongsTo: ["client"] } },
      },
    },
  };
}

function problemsOf(manifest: unknown) {
  try {
    generate(manifest as any, { now, existingMigrations: [] });
  } catch (e) {
    expect(e).toBeInstanceOf(ManifestValidationError);
    return (e as ManifestValidationError).problems;
  }
  throw new Error("o manifest deveria ser inválido");
}

describe("manifests válidos", () => {
  it.each(["bingo", "curso", "vende-que-vende-api"])("fixture %s", (name) => {
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", name, "manifest.json"), "utf8"));
    expect(() => validateManifest(manifest)).not.toThrow();
  });

  it("manifest.example.json (catálogo de formas) e a chave $schema", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.example.json"), "utf8"));
    expect(manifest.$schema).toBeDefined();
    expect(() => generate(manifest, { now, existingMigrations: [] })).not.toThrow();
  });
});

describe("manifests inválidos", () => {
  it("tipo de campo desconhecido (forma longa)", () => {
    const m = base();
    m.pkg.entities.client.fields.email = { type: "strng" };

    expect(problemsOf(m)).toEqual([{
      path: "pkg.entities.client.fields.email.type",
      message: expect.stringMatching(/^tipo "strng" desconhecido \(use um de: uuid, string, text, .*, int, displayName\)$/),
    }]);
  });

  it("tipo de campo desconhecido (forma curta) aponta para o campo", () => {
    const m = base();
    m.pkg.entities.client.fields.email = "strng";

    expect(problemsOf(m).map((p) => p.path)).toEqual(["pkg.entities.client.fields.email"]);
  });

  it("pkg.code ausente", () => {
    const m = base();
    delete m.pkg.code;

    expect(problemsOf(m)).toEqual([{ path: "pkg.code", message: "campo obrigatório ausente" }]);
  });

  it("system ausente e code vazio", () => {
    const m = base();
    delete m.system;
    m.pkg.code = "";

    expect(problemsOf(m)).toEqual([
      { path: "system", message: "campo obrigatório ausente" },
      { path: "pkg.code", message: "não pode ser vazio" },
    ]);
  });

  it("tipo errado em propriedade", () => {
    const m = base();
    m.pkg.entities.client.fields.email = { type: "string", required: "sim" };

    expect(problemsOf(m)).toEqual([{
      path: "pkg.entities.client.fields.email.required",
      message: "deve ser verdadeiro/falso (true/false), recebido texto",
    }]);
  });

  it("relacionamento para entidade inexistente (forma curta e objeto)", () => {
    const m = base();
    m.pkg.entities.alert.relationships.belongsTo = ["clinet", { entity: "user", field: "author_id" }];

    expect(problemsOf(m)).toEqual([
      {
        path: "pkg.entities.alert.relationships.belongsTo[0]",
        message: 'entidade "clinet" não existe em pkg.entities (entidades: client, alert)',
      },
      {
        path: "pkg.entities.alert.relationships.belongsTo[1].entity",
        message: 'entidade "user" não existe em pkg.entities (entidades: client, alert)',
      },
    ]);
  });

  it("hasOne e hasMany para entidade inexistente", () => {
    const m = base();
    m.pkg.entities.client.relationships = { hasOne: ["teacher"], hasMany: ["ghost"] };

    expect(problemsOf(m).map((p) => p.path)).toEqual([
      "pkg.entities.client.relationships.hasOne[0]",
      "pkg.entities.client.relationships.hasMany[0]",
    ]);
  });

  it("enum sem itens, com lista vazia e na forma curta", () => {
    const m = base();
    m.pkg.entities.client.fields.a = { type: "enum" };
    m.pkg.entities.client.fields.b = { type: "enum", enumItems: [] };
    m.pkg.entities.client.fields.c = "enum";

    const problems = problemsOf(m);
    expect(problems.map((p) => p.path)).toEqual([
      "pkg.entities.client.fields.a.enumItems",
      "pkg.entities.client.fields.b.enumItems",
      "pkg.entities.client.fields.c",
    ]);
    expect(problems[1].message).toBe("campo enum precisa de ao menos um item");
  });

  it("reporta todos os erros de uma vez (estruturais)", () => {
    const m = base();
    delete m.pkg.code;
    m.pkg.entities.client.fields.email = { type: "strng" };

    expect(problemsOf(m).map((p) => p.path)).toEqual(["pkg.code", "pkg.entities.client.fields.email.type"]);
  });

  it("reporta todos os erros de uma vez (entre entidades)", () => {
    const m = base();
    m.pkg.entities.client.fields.status = { type: "enum", enumItems: [] };
    m.pkg.entities.alert.relationships.belongsTo = ["ghost"];

    expect(problemsOf(m).map((p) => p.path)).toEqual([
      "pkg.entities.client.fields.status.enumItems",
      "pkg.entities.alert.relationships.belongsTo[0]",
    ]);
  });

  it("não gera nada: generate lança antes de produzir arquivos", () => {
    const m = base();
    delete m.pkg.code;

    expect(() => generate(m, { now, existingMigrations: [] })).toThrow(ManifestValidationError);
  });
});

describe("JSON Schema publicado", () => {
  it("schema/manifest.schema.json está em dia (rode `npm run schema`)", () => {
    const published = fs.readFileSync(path.join(root, "schema/manifest.schema.json"), "utf8");

    expect(published).toBe(JSON.stringify(buildJsonSchema(), null, 2) + "\n");
  });
});
