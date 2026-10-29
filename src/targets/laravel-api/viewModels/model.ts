import { camelCase, pascalCase } from "change-case";
import { snakeCase } from "lodash";
import { plural } from "pluralize";
import { EntityFileType } from "../fileType";
import { BASE_NAMESPACE, entityNames } from "../names";
import { classHeader, classPath } from "./classHeader";

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

export const modelFile: EntityFileType = {
  template: "model",
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

        const related = `${pascalCase(relationship.entity)}::class`;
        // FK com o nome padrão (`<entidade>_id`): o método leva o nome da entidade (plural no hasMany)
        // e o Eloquent deduz as chaves. Com outro nome, o método leva o nome da FK e as chaves são explícitas.
        const defaultField = relationship.field === `${snakeCase(relationship.entity)}_id`;

        return {
          name: defaultField
            ? camelCase(relationship.relationship === "hasMany" ? plural(relationship.entity) : relationship.entity)
            : camelCase(relationship.field.replace("_id", "")),
          returnType: pascalCase(relationship.relationship),
          method: camelCase(relationship.relationship),
          arguments: defaultField ? related : `${related}, 'id', '${relationship.field}'`,
        };
      });

    const className = names.pascal;

    return {
      path: classPath(namespace, className),
      view: {
        ...classHeader(entity, { namespace, imports, className, extends: "Model" }),
        traits: ["HasFactory", "SoftDeletes", "HasUuids"],
        casts,
        fillable: fields.map(([key]) => key),
        relations,
      },
    };
  },
};
