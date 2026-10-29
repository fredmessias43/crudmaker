import { Entity } from "../../../models/Entity";
import { Field, LockMigrationChange } from "../../../types";
import { column, foreignKeyTable } from "./migration";

/**
 * Operação de schema de uma migration `alter`. Cada uma sabe se desfazer (`invertOperation`),
 * então o `down()` é o `up()` invertido e na ordem contrária.
 */
export type SchemaOperation =
  | { op: "dropForeign"; column: string; table: string }
  | { op: "addForeign"; column: string; table: string }
  | { op: "dropUnique"; column: string }
  | { op: "addUnique"; column: string }
  | { op: "dropColumn"; column: string; field: Field }
  | { op: "addColumn"; column: string; field: Field }
  | { op: "changeColumn"; column: string; from: Field; to: Field };

const inverseOf = {
  dropForeign: "addForeign",
  addForeign: "dropForeign",
  dropUnique: "addUnique",
  addUnique: "dropUnique",
  dropColumn: "addColumn",
  addColumn: "dropColumn",
} as const;

/** A operação que desfaz `operation` (ex.: `addColumn` → `dropColumn` da mesma coluna). */
export function invertOperation(operation: SchemaOperation): SchemaOperation {
  if (operation.op === "changeColumn") return { ...operation, from: operation.to, to: operation.from };
  return { ...operation, op: inverseOf[operation.op] } as SchemaOperation;
}

/** Colunas da entidade por nome de coluna (o `name` do campo, que é o que a migration usa). */
function columnsOf(entity: Entity): Map<string, Field> {
  return new Map(Object.values(entity.fields).map((field) => [field.name, field]));
}

/** Tabela referenciada por cada coluna de FK (`belongsTo`) da entidade. */
function foreignKeysOf(entity: Entity): Map<string, string> {
  return new Map((entity.relationships?.belongsTo ?? []).map((relationship) => [relationship.field, foreignKeyTable(relationship)]));
}

/** Valor padrão efetivo na migration: o declarado ou, em enum, o primeiro item (o mesmo critério de `column`). */
function effectiveDefault(field: Field): string | number | boolean | undefined {
  return field.default ?? (field.type === "enum" ? field.enumItems[0] : undefined);
}

/** O que, na coluna, exige um `->change()`: tipo, obrigatoriedade, default e itens do enum. `unique` tem operação própria. */
function columnSignature(field: Field): string {
  return JSON.stringify([field.type, field.required, effectiveDefault(field) ?? null, field.type === "enum" ? field.enumItems : []]);
}

/**
 * Operações para levar o schema de `previous` a `current` (a mesma tabela), na ordem em que rodam no `up()`:
 * remover FKs e índices únicos, remover colunas, adicionar colunas, alterar colunas, criar índices únicos e FKs.
 * Lista vazia = nada mudou no banco (hidden, rules, api... não contam).
 */
export function diffEntity(previous: Entity, current: Entity): SchemaOperation[] {
  const before = columnsOf(previous);
  const after = columnsOf(current);
  const beforeKeys = foreignKeysOf(previous);
  const afterKeys = foreignKeysOf(current);

  const removed = [...before.values()].filter((field) => !after.has(field.name));
  const added = [...after.values()].filter((field) => !before.has(field.name));
  const kept = [...after.values()].filter((field) => before.has(field.name));
  const changed = kept.filter((field) => columnSignature(before.get(field.name)!) !== columnSignature(field));

  const operations: SchemaOperation[] = [];

  for (const [name, table] of beforeKeys) {
    if (afterKeys.get(name) !== table) operations.push({ op: "dropForeign", column: name, table });
  }
  for (const field of removed.filter((field) => field.unique)) operations.push({ op: "dropUnique", column: field.name });
  for (const field of kept.filter((field) => before.get(field.name)!.unique && !field.unique)) {
    operations.push({ op: "dropUnique", column: field.name });
  }
  for (const field of removed) operations.push({ op: "dropColumn", column: field.name, field });
  for (const field of added) operations.push({ op: "addColumn", column: field.name, field });
  for (const field of changed) operations.push({ op: "changeColumn", column: field.name, from: before.get(field.name)!, to: field });
  for (const field of [...added, ...kept].filter((field) => field.unique && !before.get(field.name)?.unique)) {
    operations.push({ op: "addUnique", column: field.name });
  }
  for (const [name, table] of afterKeys) {
    if (beforeKeys.get(name) !== table) operations.push({ op: "addForeign", column: name, table });
  }

  return operations;
}

/** Linha de código (com o `;`) de uma operação no Blueprint. */
function renderOperation(operation: SchemaOperation): string {
  switch (operation.op) {
    case "dropForeign":
      return `$table->dropForeign(['${operation.column}']);`;
    case "addForeign":
      return `$table->foreign('${operation.column}')->references('id')->on('${operation.table}');`;
    case "dropUnique":
      return `$table->dropUnique(['${operation.column}']);`;
    case "addUnique":
      return `$table->unique('${operation.column}');`;
    case "dropColumn":
      return `$table->dropColumn('${operation.column}');`;
    case "addColumn":
      return column(operation.field);
    case "changeColumn":
      return column(operation.to, true);
  }
}

/** Variáveis do template `migration.alter`: `up` na ordem do diff, `down` as inversas na ordem contrária. */
export function alterView(table: string, operations: SchemaOperation[]) {
  const notes: string[] = [];
  if (operations.some((operation) => operation.op === "changeColumn")) {
    notes.push("->change() nativo no Laravel 11+; no Laravel 10 ou anterior exige o pacote doctrine/dbal (composer require doctrine/dbal).");
  }

  const downNotes: string[] = [];
  if (operations.some((operation) => operation.op === "dropColumn")) {
    downNotes.push("A coluna removida no up() volta vazia: o dropColumn não recupera os dados dela.");
  }

  return {
    imports: [
      "Illuminate\\Database\\Migrations\\Migration",
      "Illuminate\\Database\\Schema\\Blueprint",
      "Illuminate\\Support\\Facades\\Schema",
    ],
    table,
    notes,
    downNotes,
    up: operations.map(renderOperation),
    down: [...operations].reverse().map(invertOperation).map(renderOperation),
  };
}

/** Resumo das operações para o `manifest-lock.json`. */
export function lockChanges(operations: SchemaOperation[]): LockMigrationChange[] {
  return operations.map(({ op, column }) => ({ op, column }));
}

/** Avisos de uma entidade alterada: possível renomeação, coluna obrigatória sem default e mudança de enum. */
export function alterWarnings(entity: Entity, operations: SchemaOperation[], file: string): string[] {
  const names = (op: SchemaOperation["op"]) => operations.filter((operation) => operation.op === op).map((operation) => operation.column);
  const warnings: string[] = [];
  const dropped = names("dropColumn");
  const added = names("addColumn");

  if (dropped.length > 0 && added.length > 0) {
    warnings.push(
      `ATENÇÃO: "${entity.entityName}" teve campos removidos (${dropped.join(", ")}) e adicionados (${added.join(", ")}). ` +
        `O crudmaker não detecta renomeação: se foi uma, a migration ${file} apaga a coluna antiga e os dados dela. ` +
        `Edite essa migration e troque o par dropColumn/addColumn por $table->renameColumn('antigo', 'novo') (up e down) antes de rodar o migrate.`,
    );
  }

  for (const operation of operations) {
    if (operation.op === "addColumn" && operation.field.required && effectiveDefault(operation.field) === undefined) {
      warnings.push(
        `"${entity.entityName}": o campo novo "${operation.column}" é obrigatório e não tem default; a migration ${file} falha se a tabela já tiver linhas. ` +
          `Declare "default" ou "required: false" no manifest (e regere) ou ajuste a migration.`,
      );
    }
    if (operation.op === "changeColumn" && operation.to.type === "enum") {
      warnings.push(
        `"${entity.entityName}": a coluna enum "${operation.column}" mudou; o ->change() de enum depende do banco e pode não atualizar a lista de valores. Confira a migration ${file}.`,
      );
    }
  }

  return warnings;
}
