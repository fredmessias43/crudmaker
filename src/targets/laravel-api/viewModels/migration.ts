import { snakeCase } from "change-case";
import { format } from "date-fns";
import { plural } from "pluralize";
import { Field } from "../../../types";
import { EntityFileType } from "../fileType";
import { entityNames } from "../names";

/** Declaração de uma coluna no Blueprint, com o `;` final. */
function column(field: Field): string {
  let line = `$table->${field.type}('${field.name}')`;

  if (field.name === "id") line += "->primary()";

  if (field.type === "enum") {
    line = line.substring(0, line.length - 1);
    line += `, ${JSON.stringify(field.enumItems).replaceAll('"', "'")})`;
    line += `->default('${field.enumItems[0]}')`;
  }

  if (!field.required) line += "->nullable()";

  return `${line};`;
}

/**
 * Nome do arquivo: reaproveita o de uma migration existente (mesmo sufixo `_create_<tabela>_table.php`)
 * ou cria um novo com o prefixo de data/hora.
 */
function fileName(table: string, now: Date, existingMigrations: string[]): string {
  const suffix = `_create_${table}_table.php`;
  const existing = existingMigrations.find((file) => file.endsWith(suffix));

  return existing ?? format(now, "yyyy_MM_dd_HHmmss") + suffix;
}

export const migrationFile: EntityFileType = {
  template: "migration",
  build(entity, { now, existingMigrations }) {
    const { table } = entityNames(entity);
    const fields = Object.values(entity.fields);
    const belongsTo = entity.relationships?.belongsTo ?? [];

    return {
      path: `database/migrations/${fileName(table, now, existingMigrations)}`,
      view: {
        imports: [
          "Illuminate\\Database\\Migrations\\Migration",
          "Illuminate\\Database\\Schema\\Blueprint",
          "Illuminate\\Support\\Facades\\Schema",
        ],
        table,
        columns: fields.map(column),
        foreignKeys: belongsTo.map((relationship) => ({
          field: relationship.field,
          table: plural(snakeCase(relationship.entity)),
        })),
        uniques: fields.filter((field) => field.unique).map((field) => field.name),
      },
    };
  },
};
