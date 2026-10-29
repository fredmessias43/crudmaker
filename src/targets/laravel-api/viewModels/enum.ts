import { pascalCase } from "change-case";
import { enumCaseName } from "../../../enumCase";
import { Entity } from "../../../models/Entity";
import { Field } from "../../../types";
import { phpString } from "../entityApi";
import { BASE_NAMESPACE, entityNames, generatedNamespace } from "../names";
import { ClassRef, classRef } from "./classHeader";

const namespace = generatedNamespace(`${BASE_NAMESPACE}\\Enums`);

/** Classe do enum gerado para um campo: `<Entidade><Campo>` em PascalCase (`orderItem.status` → `OrderItemStatus`). */
export function enumClass(entity: Entity, field: Field): ClassRef {
  return classRef(namespace, `${entityNames(entity).pascal}${pascalCase(field.name)}`);
}

/** Um arquivo de enum por campo `enum` da entidade (`id` nunca é enum). */
export function enumFiles(entity: Entity): { path: string; view: object }[] {
  return Object.values(entity.fields)
    .filter((field) => field.type === "enum")
    .map((field) => {
      const ref = enumClass(entity, field);
      return {
        path: ref.path,
        view: {
          namespace: ref.namespace,
          className: ref.className,
          entity: entityNames(entity),
          field: field.name,
          cases: field.enumItems.map((item) => ({ name: enumCaseName(item) ?? pascalCase(item), value: phpString(item) })),
        },
      };
    });
}
