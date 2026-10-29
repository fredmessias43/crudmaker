/** Manifest de exemplo criado por `crudmaker init` (formato descrito em docs/manifest.md). O YAML abaixo deve gerar o mesmo objeto. */
export const exampleManifest = {
  system: { title: "Minha API", code: "minha-api" },
  pkg: {
    code: "minha-api",
    entities: {
      client: {
        fields: {
          id: "uuid",
          name: "string",
          email: { type: "string", unique: true },
          notes: { type: "text", required: false },
          status: { type: "enum", enumItems: ["active", "blocked"] },
        },
        relationships: {
          hasMany: ["order"],
        },
      },
      order: {
        fields: {
          id: "uuid",
          total: "double",
          paid: "boolean",
        },
        relationships: {
          belongsTo: ["client"],
        },
      },
    },
  },
};

export const exampleManifestJsonText = JSON.stringify(exampleManifest, null, 2) + "\n";

/** Mesmo manifest em YAML, comentado. O modeline liga o arquivo ao JSON Schema (extensão YAML da Red Hat no VS Code). */
export const exampleManifestYamlText = `# yaml-language-server: $schema=./node_modules/crudmaker/schema/manifest.schema.json
# Manifest do crudmaker. Referência completa: docs/manifest.md

system:
  title: Minha API
  code: minha-api

pkg:
  code: minha-api
  entities:
    # O nome da entidade fica no singular; a tabela vira "clients".
    client:
      fields:
        # Forma curta: só o tipo. Declare sempre o "id" como uuid.
        id: uuid
        name: string
        # Forma completa: permite unique, required, enumItems...
        email:
          type: string
          unique: true
        # Todo campo é obrigatório por padrão; required: false deixa a coluna nullable.
        notes:
          type: text
          required: false
        # Campo enum: os valores permitidos vão em enumItems.
        status:
          type: enum
          enumItems: [active, blocked]
      relationships:
        # hasMany: o lado "um" do relacionamento (métodos na model; a FK fica no outro lado).
        hasMany:
          - order

    order:
      fields:
        id: uuid
        total: double
        paid: boolean
      relationships:
        # belongsTo: cria a coluna client_id (FK) nesta entidade.
        # Declare os dois lados do relacionamento.
        belongsTo:
          - client
`;

/** Formato do exemplo escolhido pela extensão do arquivo; o JSON é o de qualquer extensão que não seja .yaml/.yml. */
export function exampleManifestText(format: "yaml" | "json"): string {
  return format === "yaml" ? exampleManifestYamlText : exampleManifestJsonText;
}
