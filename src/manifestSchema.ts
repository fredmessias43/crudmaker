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
}).partial({ name: true, required: true, unique: true, enumItems: true });

const fieldSchema = z.union([
  fieldTypeSchema,
  fieldObjectSchema,
]).describe(`Campo: forma curta (só o tipo, ex.: "string") ou objeto com type, name, required, unique e enumItems.`);

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

const entitySchema = z.object({
  fields: z.record(z.string(), fieldSchema).describe(`Campos da entidade (chave = nome do campo). Declare sempre "id": "uuid".`),
  relationships: relationshipsSchema.describe("Relacionamentos com outras entidades, agrupados por tipo."),
  indexes: z.unknown().describe("Aceito, mas ignorado."),
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
    enums: z.unknown().describe("Reservado; aceito, mas ignorado.").optional(),
  }).describe("Pacote a gerar."),
}).describe("Manifest do crudmaker: descreve as entidades de uma API Laravel.");

/** Entrada já validada estruturalmente (formas curtas e aliases ainda não resolvidos). */
export type ManifestInput = z.output<typeof manifestSchema>;
export type FieldInput = z.output<typeof fieldSchema>;
export type RelationItemInput = z.output<typeof relationItemSchema>;

/** JSON Schema do formato de entrada (o que se escreve no manifest). */
export function buildJsonSchema(): object {
  const schema = z.toJSONSchema(manifestSchema, { io: "input" }) as Record<string, any>;
  return {
    ...schema,
    title: "Manifest do crudmaker",
  };
}
