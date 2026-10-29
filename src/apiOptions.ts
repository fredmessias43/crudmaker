import { snakeCase, uniq } from "lodash";
import { ApiInput, ManifestInput, OWNER_KEYS, RELATION_KEYS } from "./manifestSchema";
import { relationName, WITH_RELATIONSHIP_TYPES } from "./relationNames";
import { ApiOptions } from "./types";

type EntityInput = ManifestInput["pkg"]["entities"][string];

/** Colunas que toda tabela gerada tem e que `sort`/`defaultSort` aceitam mesmo sem estarem em `fields`. */
export const IMPLICIT_SORT_COLUMNS = ["id", "created_at", "updated_at"] as const;

/**
 * Nomes de coluna da entidade (com os nomes já normalizados): o `name` de cada campo (a chave, na forma curta),
 * as FKs que os `belongsTo` acrescentam e `owner_id`/`owner_class` das entidades `owned`/`morphed`.
 * Segue as mesmas regras de `normalizeEntity`, que roda depois da validação.
 */
export function entityColumns(entity: EntityInput): string[] {
  const columns = Object.entries(entity.fields ?? {}).map(([key, field]) => (typeof field === "string" ? key : field.name ?? key));
  const relationships = entity.relationships ?? {};

  for (const item of relationships.belongsTo ?? []) {
    columns.push(typeof item === "string" ? `${snakeCase(item)}_id` : item.field ?? `${snakeCase(item.entity)}_id`);
  }
  if (OWNER_KEYS.some((key) => relationships[key])) columns.push("owner_id", "owner_class");

  return uniq(columns);
}

/**
 * Nomes de método dos relacionamentos que `api.with` aceita (belongsTo, hasOne, hasMany), com o tipo efetivo
 * de cada um (o `relationship` do item pode sobrescrever o tipo da lista).
 */
export function withableRelations(entity: EntityInput): Map<string, string> {
  const result = new Map<string, string>();

  for (const relation of RELATION_KEYS) {
    for (const item of entity.relationships?.[relation] ?? []) {
      const target = typeof item === "string" ? item : item.entity;
      const field = typeof item === "string" ? undefined : item.field;
      const type = typeof item === "string" ? relation : item.relationship ?? relation;
      if (!(WITH_RELATIONSHIP_TYPES as readonly string[]).includes(type)) continue;

      result.set(relationName({ entity: target, field: field ?? `${snakeCase(target)}_id`, relationship: type }), type);
    }
  }

  return result;
}

/**
 * Resolve o bloco `api` da entidade: `pkg.defaults.api` por baixo, o `api` da entidade por cima, chave a chave
 * (uma lista da entidade substitui a do padrão por inteiro; não soma). Listas sem repetição.
 * Devolve `undefined` se nenhum dos dois declara nada, para a entidade seguir sem `api` (e o lock não mudar).
 */
export function resolveApi(defaults: ApiInput | undefined, own: ApiInput | undefined): ApiOptions | undefined {
  const merged: { [key: string]: unknown } = {};

  for (const source of [defaults, own]) {
    for (const [key, value] of Object.entries(source ?? {})) {
      if (value !== undefined) merged[key] = Array.isArray(value) ? uniq(value) : value;
    }
  }

  return Object.keys(merged).length > 0 ? (merged as ApiOptions) : undefined;
}
