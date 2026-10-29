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
