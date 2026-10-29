import { camelCase, pascalCase } from "change-case";
import { relationName } from "../../../relationNames";
import { snakeCase, uniq } from "lodash";
import { EntityFileType } from "../fileType";
import { BASE_NAMESPACE, entityNames } from "../names";
import { enumClass } from "./enum";
import { classHeader, classPair, finalClassFile } from "./classHeader";
import { isUserEntity } from "./skeleton";

const namespace = `${BASE_NAMESPACE}\\Models`;

/** Cast do Eloquent por tipo de campo. Tipos fora da lista (uuid, string, text) não precisam de cast; enum tem cast próprio, para o PHP enum gerado. */
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
  build(entity, { skeletonUsers }) {
    const names = entityNames(entity);
    // `user` sobre a tabela `users` do esqueleto: autenticável, com o id bigint do esqueleto (sem uuid) e sem soft delete.
    const authenticatable = skeletonUsers && isUserEntity(entity);
    // O id bigint é do banco: fora do `$fillable`.
    const fields = Object.entries(entity.fields).filter(([, field]) => !(authenticatable && field.name === "id"));
    const imports = authenticatable
      ? [
          "Illuminate\\Database\\Eloquent\\Factories\\HasFactory",
          "Illuminate\\Foundation\\Auth\\User as Authenticatable",
          "Illuminate\\Notifications\\Notifiable",
        ]
      : [
          "Illuminate\\Database\\Eloquent\\Factories\\HasFactory",
          "Illuminate\\Database\\Eloquent\\SoftDeletes",
          "Illuminate\\Database\\Eloquent\\Model",
          "Illuminate\\Support\\Str",
          "Illuminate\\Database\\Eloquent\\Concerns\\HasUuids",
        ];

    // `cast` já é a expressão PHP: texto entre aspas ('boolean') ou a classe do enum (ClientStatus::class).
    const casts: { name: string; cast: string }[] = [];
    for (const [, field] of fields) {
      if (field.type === "enum") {
        const enumRef = enumClass(entity, field);
        imports.push(enumRef.fqcn);
        casts.push({ name: field.name, cast: `${enumRef.className}::class` });
        continue;
      }
      const cast = castTypes[field.type];
      if (cast !== undefined) casts.push({ name: field.name, cast: `'${cast}'` });
    }

    // Colunas de autenticação do esqueleto: o cast `hashed` (cifra a senha ao atribuir) e a data de verificação.
    if (authenticatable) {
      for (const [name, cast] of [["email_verified_at", "'datetime'"], ["password", "'hashed'"]]) {
        if (!casts.some((item) => item.name === name)) casts.push({ name, cast });
      }
    }

    const relations = Object.values(entity.relationships)
      .flat()
      .map((relationship) => {
        imports.push(`Illuminate\\Database\\Eloquent\\Relations\\${pascalCase(relationship.relationship)}`);

        imports.push(`${namespace}\\${pascalCase(relationship.entity)}`);
        const related = `${pascalCase(relationship.entity)}::class`;
        // Com a FK no nome padrão (`<entidade>_id`) o Eloquent deduz as chaves; com outro nome, elas são explícitas.
        // O nome do método segue `relationName` (a mesma regra de `api.with`).
        const defaultField = relationship.field === `${snakeCase(relationship.entity)}_id`;
        const name = relationName(relationship);

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
        ...classHeader(entity, pair, { imports, extends: authenticatable ? "Authenticatable" : "Model", layer: "base" }),
        uuidKey: !authenticatable,
        traits: authenticatable ? ["HasFactory", "Notifiable"] : ["HasFactory", "SoftDeletes", "HasUuids"],
        casts,
        fillable: fields.map(([key]) => key),
        // `hidden` também esconde o campo de `toArray()`/`toJson()` da model, para não vazar fora da resource.
        hidden: uniq([
          ...fields.filter(([, field]) => field.hidden).map(([, field]) => field.name),
          ...(authenticatable ? ["password", "remember_token"] : []),
        ]),
        relations,
      },
    };
  },
};

export const modelFinalFile = finalClassFile("model.final", namespace, ({ pascal }) => pascal);
