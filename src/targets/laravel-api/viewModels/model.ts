import { camelCase, pascalCase } from "change-case";
import { snakeCase } from "lodash";
import { plural } from "pluralize";
import { EntityFileType } from "../fileType";
import { BASE_NAMESPACE, entityNames } from "../names";
import { classHeader, classPair, finalClassFile } from "./classHeader";

const namespace = `${BASE_NAMESPACE}\\Models`;

/** Cast do Eloquent por tipo de campo. Tipos fora da lista (uuid, string, text, enum) não precisam de cast. */
const castTypes: { [type: string]: string } = {
  boolean: "boolean",
  json: "array",
  date: "date",
  datetime: "datetime",
  double: "double",
  integer: "integer",
};

/**
 * Base da model. Os relacionamentos apontam para as models *finais* das outras entidades (importadas de
 * `App\Models`), então scopes, accessors e `booted()` do usuário valem também quando se navega pelas
 * relações. A base nunca cita a final da própria entidade: o Eloquent deduz tabela e chaves estrangeiras
 * a partir da classe em uso (`static`), que é a final (`Client` → `clients`, `client_id`).
 */
export const modelBaseFile: EntityFileType = {
  template: "model.base",
  layer: "generated",
  build(entity) {
    const names = entityNames(entity);
    const fields = Object.entries(entity.fields);
    const imports = [
      "Illuminate\\Database\\Eloquent\\Factories\\HasFactory",
      "Illuminate\\Database\\Eloquent\\SoftDeletes",
      "Illuminate\\Database\\Eloquent\\Model",
      "Illuminate\\Support\\Str",
      "Illuminate\\Database\\Eloquent\\Concerns\\HasUuids",
    ];

    const casts: { name: string; cast: string }[] = [];
    for (const [, field] of fields) {
      const cast = castTypes[field.type];
      if (cast !== undefined) casts.push({ name: field.name, cast });
    }

    const relations = Object.values(entity.relationships)
      .flat()
      .map((relationship) => {
        imports.push(`Illuminate\\Database\\Eloquent\\Relations\\${pascalCase(relationship.relationship)}`);

        imports.push(`${namespace}\\${pascalCase(relationship.entity)}`);
        const related = `${pascalCase(relationship.entity)}::class`;
        // FK com o nome padrão (`<entidade>_id`): o método leva o nome da entidade (plural no hasMany)
        // e o Eloquent deduz as chaves. Com outro nome, as chaves são explícitas.
        const defaultField = relationship.field === `${snakeCase(relationship.entity)}_id`;
        const isBelongsTo = relationship.relationship === "belongsTo";
        const fieldName = camelCase(relationship.field.replace(/_id$/, ""));
        const pascalField = pascalCase(fieldName);

        let name: string;
        if (defaultField) {
          name = camelCase(relationship.relationship === "hasMany" ? plural(relationship.entity) : relationship.entity);
        } else if (isBelongsTo) {
          // belongsTo: o método leva o nome da FK sem `_id` (`author_id` → `author()`).
          name = fieldName;
        } else {
          // hasOne/hasMany: a FK está no filho, então o nome da FK descreve o pai, não o relacionado
          // (`author_id` em user → `postsByAuthor()`, não `author()`).
          const base = relationship.relationship === "hasMany" ? plural(relationship.entity) : relationship.entity;
          name = `${camelCase(base)}By${pascalField}`;
        }

        // Assinaturas: belongsTo($related, $foreignKey, $ownerKey); hasOne/hasMany($related, $foreignKey, $localKey).
        // Em todos a FK é a coluna do filho; a chave do pai é `id` (o padrão), então basta o segundo argumento.
        return {
          name,
          returnType: pascalCase(relationship.relationship),
          method: camelCase(relationship.relationship),
          arguments: defaultField ? related : `${related}, '${relationship.field}'`,
        };
      });

    const pair = classPair(namespace, names.pascal);

    return {
      path: pair.base.path,
      view: {
        ...classHeader(entity, pair, { imports, extends: "Model", layer: "base" }),
        traits: ["HasFactory", "SoftDeletes", "HasUuids"],
        casts,
        fillable: fields.map(([key]) => key),
        relations,
      },
    };
  },
};

export const modelFinalFile = finalClassFile("model.final", namespace, ({ pascal }) => pascal);
