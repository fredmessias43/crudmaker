/** Manifest de exemplo criado por `crudmaker init` (formato descrito em docs/manifest.md). O YAML abaixo deve gerar o mesmo objeto. */
export const exampleManifest = {
  system: { title: "Minha API", code: "minha-api" },
  pkg: {
    code: "minha-api",
    defaults: {
      api: { middleware: ["auth:sanctum"], perPage: 20 },
    },
    entities: {
      client: {
        fields: {
          id: "uuid",
          name: { type: "string", rules: ["max:120"] },
          email: { type: "string", unique: true },
          notes: { type: "text", required: false },
          status: { type: "enum", enumItems: ["active", "blocked"], default: "active" },
          document: { type: "string", required: false, hidden: true },
        },
        relationships: {
          hasMany: ["order"],
        },
        api: {
          actions: ["index", "show", "store", "update"],
          filters: ["status"],
          search: ["name", "email"],
          sort: ["name"],
          defaultSort: "-created_at",
          with: ["orders"],
        },
      },
      order: {
        fields: {
          id: "uuid",
          total: "double",
          paid: { type: "boolean", default: false },
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
# Manifest do crudmaker. Referência completa: docs/manifest.md (e o JSON Schema acima).
# Fluxo: edite este arquivo, rode "crudmaker generate manifest.yaml --dry-run" e depois sem o --dry-run.

system:
  title: Minha API
  code: minha-api

pkg:
  code: minha-api
  # Versão alvo (opcional; sem isto vale a do composer.lock do projeto, ou Laravel 12 / PHP 8.2):
  # target: { laravel: 12, php: "8.2" }
  defaults:
    # Valores de "api" para todas as entidades (cada entidade pode sobrescrever).
    api:
      middleware: [auth:sanctum]
      perPage: 20
  entities:
    # O nome da entidade fica no singular; a tabela vira "clients".
    client:
      fields:
        # Forma curta: só o tipo. Declare sempre o "id" como uuid.
        id: uuid
        # Forma completa. "rules": regras extras do Laravel, somadas às derivadas do tipo.
        name:
          type: string
          rules: ["max:120"]
        email:
          type: string
          unique: true
        # Todo campo é obrigatório por padrão; required: false deixa a coluna nullable.
        notes:
          type: text
          required: false
        # Campo enum: os valores permitidos vão em enumItems; "default" vale na migration e na factory.
        status:
          type: enum
          enumItems: [active, blocked]
          default: active
        # "hidden": o campo é gravado normalmente, mas não aparece no JSON da API.
        document:
          type: string
          required: false
          hidden: true
      relationships:
        # hasMany: o lado "um" do relacionamento (métodos na model e rotas /clients/{client}/orders).
        hasMany:
          - order
      # Opções da API desta entidade (todas opcionais).
      api:
        actions: [index, show, store, update]   # sem destroy
        filters: [status]                       # GET /api/clients?status=active
        search: [name, email]                   # ?search=ana
        sort: [name]                            # ?sort=-name
        defaultSort: -created_at
        with: [orders]                          # carrega e devolve os pedidos junto

    order:
      fields:
        id: uuid
        total: double
        paid:
          type: boolean
          default: false
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
