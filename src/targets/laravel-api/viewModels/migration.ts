import { snakeCase } from "change-case";
import { format } from "date-fns";
import { plural } from "pluralize";
import { Field, RelationshipValue } from "../../../types";
import { EntityFileType } from "../fileType";
import { phpString } from "../entityApi";
import { entityNames } from "../names";

/** Tabela referenciada por um `belongsTo`: snake_case plural da entidade (a mesma de `Entity.getTableName`). */
export function foreignKeyTable(relationship: RelationshipValue): string {
  return plural(snakeCase(relationship.entity));
}

/** Valor escalar como literal PHP: texto entre aspas simples (com `\` e `'` escapados), número e booleano crus. */
function phpLiteral(value: string | number | boolean): string {
  return typeof value === "string" ? phpString(value) : String(value);
}

/**
 * Declaração de uma coluna no Blueprint, com o `;` final. Com `change`, é a redeclaração completa de uma
 * coluna existente (termina em `->change()`, e a chave primária não é repetida).
 */
export function column(field: Field, change = false): string {
  let line = `$table->${field.type}('${field.name}')`;

  if (field.name === "id" && !change) line += "->primary()";

  if (field.type === "enum") {
    line = line.substring(0, line.length - 1);
    line += `, [${field.enumItems.map(phpString).join(",")}])`;
  }

  // Enum sem `default` declarado usa o primeiro item; os demais tipos só têm default se declarado.
  const defaultValue = field.default ?? (field.type === "enum" ? field.enumItems[0] : undefined);
  if (defaultValue !== undefined) line += `->default(${phpLiteral(defaultValue)})`;

  if (!field.required) line += "->nullable()";

  return `${line}${change ? "->change()" : ""};`;
}

/**
 * Nome do arquivo: reaproveita o de uma migration existente (mesmo sufixo `_create_<tabela>_table.php`)
 * ou cria um novo com o prefixo de data/hora (o da posição da migration na ordem de dependência).
 * Regerar nunca renomeia: migrations existentes mantêm o nome; só as novas usam `date`.
 */
function fileName(table: string, date: Date, existingMigrations: string[]): string {
  return existingMigration(table, existingMigrations) ?? format(date, "yyyy_MM_dd_HHmmss") + `_create_${table}_table.php`;
}

/** Nome da migration de criação da tabela que já existe no destino, se houver. */
export function existingMigration(table: string, existingMigrations: string[]): string | undefined {
  const suffix = `_create_${table}_table.php`;

  return existingMigrations.find((file) => file.endsWith(suffix));
}

export const migrationFile: EntityFileType = {
  template: "migration",
  layer: "migration",
  build(entity, { migrationDates, existingMigrations, previousTables }) {
    const { table } = entityNames(entity);
    const fields = Object.values(entity.fields);
    const belongsTo = entity.relationships?.belongsTo ?? [];

    // Migration de criação é imutável depois de emitida: se o lock anterior já tem a tabela e o arquivo existe,
    // ele é preservado (create-once). Sem lock (projeto antigo) ou sem o arquivo, vale o comportamento antigo.
    const emitted = previousTables.has(table) && existingMigration(table, existingMigrations) !== undefined;

    return {
      ...(emitted && { policy: "create-once" as const }),
      path: `database/migrations/${fileName(table, migrationDates.get(entity)!, existingMigrations)}`,
      view: {
        imports: [
          "Illuminate\\Database\\Migrations\\Migration",
          "Illuminate\\Database\\Schema\\Blueprint",
          "Illuminate\\Support\\Facades\\Schema",
        ],
        table,
        columns: fields.map((field) => column(field)),
        foreignKeys: belongsTo.map((relationship) => ({
          field: relationship.field,
          table: foreignKeyTable(relationship),
        })),
        uniques: fields.filter((field) => field.unique).map((field) => field.name),
      },
    };
  },
};
