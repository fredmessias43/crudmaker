import { Field } from "../../../types";
import { EntityFileType } from "../fileType";
import { BASE_NAMESPACE, entityNames } from "../names";
import { classHeader, classPath } from "./classHeader";

const namespace = `${BASE_NAMESPACE}\\Http\\Requests`;

/** Regras de validação de um campo, cada item já como expressão PHP (`'bail'`, `Rule::in(...)`...). */
function ruleItems(field: Field, table: string, routeParam: string): string[] {
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
    // `ignore` recebe o parâmetro da rota, não o `id` do corpo: o corpo é do cliente (um `id` de outro
    // registro desligaria a checagem). O Laravel aceita model (route model binding), id cru ou `null`
    // (criação, sem parâmetro na rota: nada é ignorado) e usa a chave primária `id`.
    items.push(`Rule::unique('${table}', '${field.name}')->ignore($this->route('${routeParam}'))`);
  }

  return items;
}

/**
 * Valor que o `prepareForValidation` devolve ao request quando o campo não veio na atualização.
 * Os casts de data viram Carbon, que não passa no `date_format`; por isso voltam ao formato da regra.
 */
function currentValue(field: Field, variable: string): string {
  const access = `${variable}->${field.name}`;
  if (field.type === "date") return `${access}?->format('Y-m-d')`;
  if (field.type === "datetime") return `${access}?->format('Y-m-d H:i')`;
  return access;
}

export const requestFile: EntityFileType = {
  template: "request",
  build(entity) {
    const { pascal, camel, snake, table } = entityNames(entity);
    const className = `${pascal}Request`;
    const modelClass = `${BASE_NAMESPACE}\\Models\\${pascal}`;

    // A chave do campo no manifest (`key`) alimenta o `prepareForValidation`; o `name` do campo, as regras.
    const fields = Object.entries(entity.fields);
    const rules = fields
      .filter(([, field]) => field.name !== "id")
      .map(([, field]) => ({ name: field.name, items: ruleItems(field, table, snake) }));
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
        fields: fields.map(([key, field]) => ({ key, value: currentValue({ ...field, name: key }, `$${camel}`) })),
        rules,
      },
    };
  },
};
