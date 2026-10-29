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
  relationship?: boolean,
  /** Só presente se declarado. Sai da resource e entra em `$hidden` da model. */
  hidden?: boolean,
  /** Só presente se declarado. Regras extras do Laravel, em texto, somadas às derivadas do tipo. */
  rules?: string[],
  /** Só presente se declarado. Vale na migration e na factory (ticket 18); em enum substitui o primeiro item. */
  default?: string | number | boolean,
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

/** Formato atual do `manifest-lock.json` (veja `docs/arquitetura.md`). Locks sem `lockVersion` são o formato 1. */
export const LOCK_VERSION = 2;

/** Operação de schema que uma migration `alter` faz; o suficiente para recalcular o estado do banco. */
export type LockMigrationChange = {
  op: "addColumn" | "dropColumn" | "changeColumn" | "addUnique" | "dropUnique" | "addForeign" | "dropForeign",
  column: string,
};

/** Migration já emitida, registrada no lock. `create` cria a tabela; `alter` altera o que mudou no schema. */
export type LockMigration = {
  /** Nome do arquivo, sem pasta. */
  file: string,
  table: string,
  type: "create" | "alter",
  /** Só nas `alter`. */
  changes?: LockMigrationChange[],
};

/** O que `generate` lê do lock anterior (já parseado). Tudo é opcional: lock antigo ou malformado é tolerado. */
export type PreviousLock = {
  lockVersion?: number,
  entities?: ManifestEntities,
  migrations?: unknown,
  /** Versão alvo da geração anterior (lock sem ela = geração anterior ao ticket 15). */
  target?: { laravel?: unknown, php?: unknown },
};
