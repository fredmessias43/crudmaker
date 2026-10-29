import { z } from "zod";

/**
 * Schema estrutural do manifest (formato de ENTRADA, antes da normalização).
 *
 * É a fonte única do formato: dele saem a validação, os tipos de entrada e o JSON Schema publicado
 * em `schema/manifest.schema.json` (rode `npm run schema` depois de mexer aqui).
 * Chaves desconhecidas são toleradas (e descartadas), como sempre foram.
 */

export const FIELD_TYPES = ["uuid", "string", "text", "date", "datetime", "double", "integer", "boolean", "json", "enum"] as const;
/** Aliases aceitos na entrada; viram `integer` e `string` (campo `display_name`) na normalização. */
export const FIELD_TYPE_ALIASES = ["int", "displayName"] as const;
export const INPUT_FIELD_TYPES = [...FIELD_TYPES, ...FIELD_TYPE_ALIASES] as const;

/** Tipos de relacionamento que geram `relationships` normalizados, na ordem em que são processados. */
export const RELATION_KEYS = ["hasOne", "hasMany", "ownOne", "ownMany", "morphOne", "morphMany", "belongsTo", "morphTo"] as const;
/** Marcadores que só adicionam os campos `owner_id` e `owner_class`. */
export const OWNER_KEYS = ["owned", "morphed"] as const;

const fieldTypeSchema = z.enum(INPUT_FIELD_TYPES).describe(
  `Tipo do campo. Aliases: "int" vira "integer"; "displayName" vira um campo string chamado display_name.`,
);

const fieldObjectSchema = z.object({
  type: fieldTypeSchema,
  name: z.string().describe("Nome da coluna. Padrão: a chave do campo."),
  required: z.boolean().describe("false deixa a coluna nullable. Padrão: true."),
  unique: z.boolean().describe("true cria índice único e a regra Rule::unique. Padrão: false."),
  enumItems: z.array(z.string()).describe(`Valores permitidos quando type é "enum" (ao menos um). Padrão: [].`),
  hidden: z.boolean().describe("true tira o campo da resource (e o põe em $hidden da model); continua no $fillable e na validação. Padrão: false."),
  rules: z.array(z.string().min(1)).describe(
    `Regras extras de validação do Laravel (ex.: ["max:120", "email"]), somadas às derivadas do tipo, depois delas e sem repetir. ` +
    `O crudmaker não confere se a regra existe; o hook extraRules() da request final pode substituir tudo.`,
  ),
  default: z.union([z.string(), z.number(), z.boolean()]).describe(
    `Valor padrão da coluna (->default(...) na migration). Deve combinar com o tipo: texto para string, text, uuid, date ("Y-m-d"), ` +
    `datetime ("Y-m-d H:i:s") e enum (um dos enumItems; substitui o padrão, que é o primeiro item); inteiro para integer; número para double; ` +
    `true/false para boolean. Não vale para json.`,
  ),
}).partial({ name: true, required: true, unique: true, enumItems: true, hidden: true, rules: true, default: true });

const fieldSchema = z.union([
  fieldTypeSchema,
  fieldObjectSchema,
]).describe(`Campo: forma curta (só o tipo, ex.: "string") ou objeto com type, name, required, unique, enumItems, hidden, rules e default.`);

const relationKeySchema = z.enum([...RELATION_KEYS, ...OWNER_KEYS]);

const relationObjectSchema = z.object({
  entity: z.string().min(1).describe("Nome da entidade relacionada (chave em pkg.entities)."),
  field: z.string().describe("Nome da coluna de FK. Padrão: <entity>_id."),
  required: z.boolean().describe("false deixa a FK nullable. Padrão: true."),
  relationship: relationKeySchema.describe("Sobrescreve o tipo do relacionamento. Padrão: o tipo da lista em que o item está."),
}).partial({ field: true, required: true, relationship: true });

const relationItemSchema = z.union([
  z.string().min(1),
  relationObjectSchema,
]).describe(`Relacionamento: nome da entidade (ex.: "client") ou objeto com entity, field, required e relationship.`);

const relationListSchema = (description: string) => z.array(relationItemSchema).describe(description);

const relationshipsSchema = z.object({
  belongsTo: relationListSchema("Esta entidade pertence a outra: cria o campo uuid de FK (<entity>_id) e o método belongsTo."),
  hasOne: relationListSchema("Esta entidade tem um registro relacionado (a FK fica do outro lado, em belongsTo)."),
  hasMany: relationListSchema("Esta entidade tem vários registros relacionados (a FK fica do outro lado, em belongsTo)."),
  ownOne: relationListSchema("Ainda não gera código válido na model."),
  ownMany: relationListSchema("Ainda não gera código válido na model."),
  morphOne: relationListSchema("Ainda não gera código válido na model."),
  morphMany: relationListSchema("Ainda não gera código válido na model."),
  morphTo: relationListSchema("Ainda não gera código válido na model."),
  owned: z.union([z.boolean(), z.array(relationItemSchema)]).describe("Se presente e verdadeiro, adiciona os campos owner_id e owner_class."),
  morphed: z.union([z.boolean(), z.array(relationItemSchema)]).describe("Se presente e verdadeiro, adiciona os campos owner_id e owner_class."),
}).partial();

/** Actions do controller que o bloco `api` pode manter (padrão: todas). */
export const API_ACTIONS = ["index", "show", "store", "update", "destroy"] as const;

const nameListSchema = (description: string) => z.array(z.string().min(1)).describe(description);

const actionsSchema = z.array(z.enum(API_ACTIONS))
  .min(1, `a lista de actions não pode ser vazia (use um ou mais de: ${API_ACTIONS.join(", ")}); para não expor a entidade, tire-a do manifest`)
  .describe(`Actions mantidas (subconjunto de ${API_ACTIONS.join(", ")}). Padrão: todas. Restringe as rotas (->only) e remove do controller base as actions e os hooks que não são usados.`);

const middlewareSchema = z.array(z.string().min(1)).describe(
  `Middlewares aplicados às rotas da entidade (ex.: ["auth:sanctum"]). Na entidade, SUBSTITUI a lista de pkg.defaults.api (não soma). Padrão: nenhum.`,
);

const perPageSchema = z.number()
  .int()
  .positive("deve ser maior que zero")
  .describe("Itens por página no index (inteiro positivo). Padrão: 15.");

/** Valores que valem para todas as entidades; só as opções que não dependem dos campos de cada uma. */
const defaultsApiSchema = z.object({
  actions: actionsSchema,
  middleware: middlewareSchema,
  perPage: perPageSchema,
}).partial().describe(
  "Valores padrão do bloco api de todas as entidades. A entidade substitui cada chave que declarar (chave a chave). Só aceita actions, middleware e perPage: filters, search, sort, defaultSort e with dependem dos campos de cada entidade e ficam no bloco api dela.",
);

/** Chaves do bloco `api` que dependem dos campos/relacionamentos da entidade (não valem em `pkg.defaults.api`). */
export const ENTITY_ONLY_API_KEYS = ["filters", "search", "sort", "defaultSort", "with"] as const;

const apiSchema = z.object({
  actions: actionsSchema,
  middleware: middlewareSchema,
  perPage: perPageSchema,
  filters: nameListSchema(
    `Campos com filtro por igualdade na query string (?status=active). Use o nome da coluna. Campo enum só filtra se o valor for um dos enumItems; campo boolean lê ?ativo=true/false/1/0.`,
  ),
  search: nameListSchema(
    `Campos da busca textual (?search=ana): where agrupado com like %termo% e OR entre os campos. Os curingas % e _ do termo não são escapados.`,
  ),
  sort: nameListSchema(
    `Campos ordenáveis (?sort=name ou ?sort=-name para decrescente). Valores fora da lista são ignorados. id, created_at e updated_at sempre podem ser usados, mesmo sem estar em fields.`,
  ),
  defaultSort: z.string().min(1).describe(
    `Ordenação quando ?sort não vem ou não é válido. Um campo, com "-" na frente para decrescente (ex.: "-created_at"). Pode ser id, created_at, updated_at ou um campo da entidade.`,
  ),
  with: nameListSchema(
    `Relacionamentos (pelo nome do método da model, ex.: "address", "alerts", "postsByAuthor") carregados no index e no show; a resource inclui cada um aninhado, com whenLoaded, usando a resource da entidade relacionada e o nome do método como chave. Só belongsTo, hasOne e hasMany.`,
  ),
}).partial().describe(
  "Opções da API da entidade (rotas, middleware, paginação, filtros, busca, ordenação e eager loading). Cada chave declarada aqui substitui a de pkg.defaults.api. Filtros, busca e ordenação são aplicados antes do hook indexQuery.",
);

const entitySchema = z.object({
  fields: z.record(z.string(), fieldSchema).describe(`Campos da entidade (chave = nome do campo). Declare sempre "id": "uuid".`),
  relationships: relationshipsSchema.describe("Relacionamentos com outras entidades, agrupados por tipo."),
  indexes: z.unknown().describe("Aceito, mas ignorado."),
  api: apiSchema,
}).partial().describe("Definição de uma entidade.");

export const manifestSchema = z.object({
  $schema: z.string().describe("Caminho ou URL do JSON Schema, para autocomplete no editor. Ignorado pelo crudmaker.").optional(),
  system: z.object({
    code: z.string().min(1).describe("Código do sistema. Lido e guardado, mas não afeta a saída."),
    title: z.string().describe("Título do sistema. Não usado.").optional(),
  }).describe("Dados do sistema."),
  pkg: z.object({
    code: z.string().min(1).describe("Código do pacote (nome do projeto)."),
    entities: z.record(z.string(), entitySchema).describe("Mapa nomeDaEntidade → definição. O nome fica no singular, de preferência em camelCase (client, orderItem)."),
    normalizeNames: z.boolean().describe(
      "Normaliza nomes fora da convenção: entidades viram singular camelCase (awards → award, drawn_numbers → drawnNumber) e campos viram snake_case (alertDate → alert_date), com um aviso por nome alterado. Padrão: true. false mantém os nomes como estão (só avisa). A flag --normalize-names / --no-normalize-names da CLI tem prioridade.",
    ).optional(),
    defaults: z.object({ api: defaultsApiSchema }).partial().describe("Valores padrão para todas as entidades.").optional(),
    enums: z.unknown().describe("Reservado; aceito, mas ignorado.").optional(),
  }).describe("Pacote a gerar."),
}).describe("Manifest do crudmaker: descreve as entidades de uma API Laravel.");

/** Entrada já validada estruturalmente (formas curtas e aliases ainda não resolvidos). */
export type ManifestInput = z.output<typeof manifestSchema>;
export type FieldInput = z.output<typeof fieldSchema>;
export type ApiInput = z.output<typeof apiSchema>;
export type RelationItemInput = z.output<typeof relationItemSchema>;

/** JSON Schema do formato de entrada (o que se escreve no manifest). */
export function buildJsonSchema(): object {
  const schema = z.toJSONSchema(manifestSchema, { io: "input" }) as Record<string, any>;
  return {
    ...schema,
    title: "Manifest do crudmaker",
  };
}
