import { Field } from "../../../types";
import { EntityFileType } from "../fileType";
import { BASE_NAMESPACE, entityNames } from "../names";
import { classHeader, classPath } from "./classHeader";

const namespace = `${BASE_NAMESPACE}\\Http\\Requests`;

/** Regras de validação de um campo, cada item já como expressão PHP (`'bail'`, `Rule::in(...)`...). */
function ruleItems(field: Field, modelClass: string): string[] {
  const items = ["'bail'", `'${field.required ? "required" : "nullable"}'`];

  if (["uuid", "string", "double", "integer", "boolean"].includes(field.type)) {
    items.push(`'${field.type}'`);
  } else if (field.type === "text") {
    items.push("'string'");
  } else if (field.type === "json") {
    items.push("'array'");
  } else if (field.type === "date") {
    items.push("'date_format:Y-m-d'");
  } else if (field.type === "datetime") {
    items.push("'date_format:Y-m-d H:i'");
  } else if (field.type === "enum") {
    items.push(`Rule::in(array(${field.enumItems.map((item) => `'${item}'`).join()}))`);
  }

  if (field.unique) {
    items.push(
      `Rule::unique('${modelClass}', '${field.name}')->ignore($this->input('id') ? $this->input('${field.name}') : '', '${field.name}')`,
    );
  }

  return items;
}

export const requestFile: EntityFileType = {
  template: "request",
  build(entity) {
    const { pascal } = entityNames(entity);
    const className = `${pascal}Request`;
    const modelClass = `${BASE_NAMESPACE}\\Models\\${pascal}`;

    // A chave do campo no manifest (`key`) alimenta o `prepareForValidation`; o `name` do campo, as regras.
    const fields = Object.entries(entity.fields);
    const rules = fields
      .filter(([, field]) => field.name !== "id")
      .map(([, field]) => ({ name: field.name, items: ruleItems(field, modelClass) }));
    const usesRule = fields.some(([, field]) => field.name !== "id" && (field.type === "enum" || field.unique));

    return {
      path: classPath(namespace, className),
      view: {
        ...classHeader(entity, {
          namespace,
          imports: [
            "Illuminate\\Foundation\\Http\\FormRequest",
            modelClass,
            ...(usesRule ? ["Illuminate\\Validation\\Rule"] : []),
          ],
          className,
          extends: "FormRequest",
        }),
        fields: fields.map(([key]) => ({ key })),
        rules,
      },
    };
  },
};
