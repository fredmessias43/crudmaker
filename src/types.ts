export type RelationshipKeys = "belongsTo" | "hasMany" | "hasOne" | "morphTo" |"ownOne" | "ownMany" | "owned" | "morphOne" | "morphMany" | "morphed";
export type RelationshipValue = {
  entity: string,
  field: string,
  required: boolean,
  relationship: RelationshipKeys
};
export type Relationships = {
  [key in RelationshipKeys]?: RelationshipValue[];
};

export type Field = {
  type: "uuid" | "string" | "text" | "date" | "datetime" | "double" | "integer" | "boolean" | "json" | "enum",
  name: string,
  required: boolean,
  unique: boolean,
  enumItems: string[],
  relationship?: boolean
};

export type Fields = {
  [key: string]: Field
}

export type ManifestEntity = {
  fields: Fields,
  relationships: Relationships,
  /** Presente só se o manifest declara `api` na entidade ou em `pkg.defaults.api`. */
  api?: ApiOptions,
}

export type ManifestEntities = {
  [key: string]: ManifestEntity
}

export type ApiAction = "index" | "show" | "store" | "update" | "destroy";

/**
 * Opções do bloco `api` já resolvidas (padrões do pacote + entidade, chave a chave) e com os nomes normalizados.
 * Só tem as chaves declaradas; o que falta usa o padrão do gerador (todas as actions, sem middleware, 15 por página).
 */
export type ApiOptions = {
  actions?: ApiAction[],
  middleware?: string[],
  perPage?: number,
  filters?: string[],
  search?: string[],
  sort?: string[],
  /** Coluna, com `-` na frente para decrescente. */
  defaultSort?: string,
  /** Nomes de método de relacionamento da model. */
  with?: string[],
}
