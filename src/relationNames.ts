import { camelCase, pascalCase } from "change-case";
import { snakeCase } from "lodash";
import { plural } from "pluralize";

/** O que define o nome do método de um relacionamento (um `RelationshipValue` do modelo normalizado). */
export type RelationNameInput = { entity: string; field: string; relationship: string };

/**
 * Nome do método do relacionamento na model (`client`, `alerts`, `postsByAuthor`).
 * É também o nome usado em `api.with`, então a model e a validação do manifest partilham esta regra.
 *
 * - FK com o nome padrão (`<entidade>_id`): o nome da entidade (no plural em `hasMany`);
 * - `belongsTo` com outra FK: o nome da FK sem `_id` (`author_id` → `author`);
 * - `hasOne`/`hasMany` com outra FK: a FK está no filho, então ela descreve o pai
 *   (`author_id` em user → `postsByAuthor`, e não `author`).
 */
export function relationName(relationship: RelationNameInput): string {
  const defaultField = relationship.field === `${snakeCase(relationship.entity)}_id`;
  const fieldName = camelCase(relationship.field.replace(/_id$/, ""));

  if (defaultField) {
    return camelCase(relationship.relationship === "hasMany" ? plural(relationship.entity) : relationship.entity);
  }
  if (relationship.relationship === "belongsTo") return fieldName;

  const base = relationship.relationship === "hasMany" ? plural(relationship.entity) : relationship.entity;
  return `${camelCase(base)}By${pascalCase(fieldName)}`;
}

/** Tipos de relacionamento que a model sabe gerar e que `api.with` aceita. */
export const WITH_RELATIONSHIP_TYPES = ["belongsTo", "hasOne", "hasMany"] as const;

/** Relacionamento como aparece no manifest: a forma curta já virou `{ entity }`; `field` pode faltar na entrada crua. */
export type RelationRef = { entity: string; field?: string };

/**
 * Coluna de FK, na tabela do filho, de um `hasMany`/`hasOne` do pai `parent` (rotas aninhadas).
 * O `field` padrão do `hasMany`/`hasOne` é `<filho>_id` e só indica que o Eloquent deduz a FK, que então é
 * `<pai>_id`; qualquer outro `field` é a coluna de FK declarada no `belongsTo` do filho.
 */
export function nestedForeignKey(parent: string, relation: RelationRef): string {
  const defaultField = `${snakeCase(relation.entity)}_id`;
  if (relation.field === undefined || relation.field === defaultField) return `${snakeCase(parent)}_id`;
  return relation.field;
}

/** O filho declara o `belongsTo` de volta ao pai com essa FK? (sem ele a coluna não existe e a rota aninhada não faz sentido) */
export function childHasInverse(parent: string, foreignKey: string, childBelongsTo: (string | RelationRef)[]): boolean {
  return childBelongsTo.some((item) => {
    const entity = typeof item === "string" ? item : item.entity;
    const field = typeof item === "string" ? undefined : item.field;
    return camelCase(entity) === camelCase(parent) && (field ?? `${snakeCase(entity)}_id`) === foreignKey;
  });
}
