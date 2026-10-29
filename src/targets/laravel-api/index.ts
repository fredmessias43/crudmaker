import { addSeconds, format } from "date-fns";
import { orderByDependency } from "../../dependencyOrder";
import { Entity } from "../../models/Entity";
import { LockMigration } from "../../types";
import { TargetVersion } from "../../targetVersion";
import { GeneratedFile, ObsoleteFile } from "../types";
import { capabilitiesFor } from "./capabilities";
import { EntityFileType } from "./fileType";
import { renderTemplate, Stubs } from "./render";
import { collectionBaseFile, collectionFinalFile } from "./viewModels/collection";
import { controllerBaseFile, controllerFinalFile } from "./viewModels/controller";
import { enumFiles } from "./viewModels/enum";
import { existingMigration, foreignKeyTable, migrationFile } from "./viewModels/migration";
import { alterView, alterWarnings, diffEntity, lockChanges } from "./viewModels/migrationAlter";
import { modelBaseFile, modelFinalFile } from "./viewModels/model";
import { requestBaseFile, requestFinalFile } from "./viewModels/request";
import { resourceBaseFile, resourceFinalFile } from "./viewModels/resource";
import { ensureRoutesInclude, routesPath, routesView } from "./viewModels/routes";

/** Entrada do target: o modelo normalizado de entidades mais o "ambiente" da geração. */
export type LaravelApiInput = {
  entities: Entity[];
  /** Data/hora do prefixo das migrations novas. */
  now: Date;
  /** Nomes de arquivo (sem pasta) das migrations que já existem no destino. */
  existingMigrations: string[];
  /** Conteúdo atual do `routes/api.php` do destino, ou `null`/omitido se ele não existe. */
  existingApiRoutes?: string | null;
  /** Entidades do `manifest-lock.json` anterior do destino, para detectar as que saíram do manifest. */
  previousEntities?: Entity[];
  /** Migrations registradas no `manifest-lock.json` anterior (vazio para lock antigo ou ausente). */
  previousMigrations?: LockMigration[];
  /** Stubs do projeto já validados (nome do template → conteúdo), com prioridade sobre os embutidos. */
  stubs?: Stubs;
  /** Versão do Laravel/PHP de destino; vira as capacidades (`it.capabilities`) dos templates. */
  target: TargetVersion;
};

/** Tipos de arquivo gerados por entidade, na ordem em que saem. Para um novo tipo, acrescente aqui. */
const entityFileTypes: EntityFileType[] = [
  modelBaseFile,
  modelFinalFile,
  resourceBaseFile,
  resourceFinalFile,
  collectionBaseFile,
  collectionFinalFile,
  controllerBaseFile,
  controllerFinalFile,
  requestBaseFile,
  requestFinalFile,
  migrationFile,
];

/** Política de cada camada: a gerada e a migration são sempre regravadas; a de customização, só criada. */
const policyByLayer = { generated: "overwrite", migration: "overwrite", custom: "create-once" } as const;

/**
 * Data de cada migration nova: `now` + 1 segundo por posição na ordem de dependência das FKs
 * (a tabela referenciada vem antes; empate = ordem do manifest), então a saída é determinística.
 */
function migrationDates(entities: Entity[], now: Date): Map<Entity, Date> {
  // Os nós são as posições no manifest (e não a tabela), para duas entidades com a mesma tabela não se confundirem.
  const indexByTable = new Map<string, number>();
  entities.forEach((entity, index) => {
    if (!indexByTable.has(entity.getTableName())) indexByTable.set(entity.getTableName(), index);
  });

  const { order, cyclic } = orderByDependency(
    entities.map((entity, index) => ({
      id: String(index),
      dependsOn: (entity.relationships?.belongsTo ?? [])
        .map((relationship) => indexByTable.get(foreignKeyTable(relationship)))
        .filter((target) => target !== undefined)
        .map(String),
    })),
  );

  // Ciclos já são recusados na validação; o fallback mantém a função total.
  return new Map([...order, ...cyclic].map((id, position) => [entities[Number(id)], addSeconds(now, position)]));
}

/**
 * Arquivos das entidades do lock anterior que não fazem mais parte da saída atual (`currentPaths`):
 * entidade removida do manifest (ou renomeada, o que muda os caminhos). Só calcula caminhos *possíveis*,
 * a partir do mesmo código que gera os arquivos; quem grava confere o que existe no disco.
 * Migrations só entram se já existe no destino uma com o nome da tabela.
 */
function obsoleteFiles(previous: Entity[], currentPaths: Set<string>, input: LaravelApiInput): ObsoleteFile[] {
  const context = { ...input, migrationDates: migrationDates(previous, input.now), previousTables: new Set<string>() };
  const obsolete: ObsoleteFile[] = [];

  for (const entity of previous) {
    for (const fileType of entityFileTypes) {
      const { path } = fileType.build(entity, context);
      if (currentPaths.has(path)) continue;

      // Sem migration existente, o caminho calculado seria só um nome novo: não há o que avisar.
      if (fileType.layer === "migration" && !existingMigration(entity.getTableName(), input.existingMigrations)) continue;

      obsolete.push({ path, kind: fileType.layer });
    }

    // Enums de campos enum: camada gerada. Campo que deixou de ser enum também deixa o arquivo obsoleto.
    for (const { path } of enumFiles(entity)) {
      if (!currentPaths.has(path)) obsolete.push({ path, kind: "generated" });
    }
  }

  return obsolete;
}

/** Data/hora do prefixo de um nome de migration (`yyyy_MM_dd_HHmmss`), ou `null` se o nome não segue o padrão. */
function migrationTimestamp(file: string): Date | null {
  const match = /^(\d{4})_(\d{2})_(\d{2})_(\d{2})(\d{2})(\d{2})_/.exec(file);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Base dos prefixos das migrations novas: `now`, ou 1 segundo depois da migration mais recente que já existe
 * (no destino ou no lock), o que vier por último. Assim as novas rodam sempre depois das antigas e um nome nunca colide.
 */
function migrationBase(input: LaravelApiInput): Date {
  const known = [...input.existingMigrations, ...(input.previousMigrations ?? []).map((migration) => migration.file)];
  const latest = known.map(migrationTimestamp).filter((date): date is Date => date !== null).reduce<Date | null>((a, b) => (a === null || b > a ? b : a), null);

  return latest !== null && latest >= input.now ? addSeconds(latest, 1) : input.now;
}

export type LaravelApiOutput = {
  files: GeneratedFile[];
  obsolete: ObsoleteFile[];
  /** Avisos do schema (renomeação provável, coluna obrigatória sem default...). */
  warnings: string[];
  /**
   * Migrations desta geração para o lock: a de criação de cada tabela (do manifest e, se ainda existir no destino,
   * das entidades removidas) e as `alter` novas. `generate` as junta às que o lock anterior já tinha.
   */
  migrations: LockMigration[];
};

/**
 * Target `laravel-api`: recebe o modelo normalizado e devolve os arquivos (sem tocar o disco).
 * Cada arquivo = view model (TS) + template (`templates/laravel-api`).
 */
export function generateLaravelApi(input: LaravelApiInput): LaravelApiOutput {
  const files: GeneratedFile[] = [];
  const warnings: string[] = [];
  const migrations: LockMigration[] = [];
  const previous = input.previousEntities ?? [];
  const previousByTable = new Map(previous.map((entity) => [entity.getTableName(), entity]));
  const base = migrationBase(input);
  const context = {
    ...input,
    now: base,
    migrationDates: migrationDates(input.entities, base),
    previousTables: new Set(previousByTable.keys()),
  };
  const capabilities = capabilitiesFor(input.target);
  // Além das variáveis do view model, todo template recebe as capacidades e a versão alvo.
  const render = (template: string, view: object) => renderTemplate(template, { ...view, capabilities, target: input.target }, input.stubs);
  const baseName = (path: string) => path.slice(path.lastIndexOf("/") + 1);

  for (const entity of input.entities) {
    for (const fileType of entityFileTypes) {
      const { path, view, generatedBase, policy } = fileType.build(entity, context);
      files.push({
        path,
        content: render(fileType.template, view),
        policy: policy ?? policyByLayer[fileType.layer],
        ...(generatedBase && { generatedBase }),
      });
      if (fileType.layer === "migration") migrations.push({ file: baseName(path), table: entity.getTableName(), type: "create" });
    }

    // Um PHP enum por campo enum: dado puro derivado do manifest, arquivo único sempre regravado (sem camada final).
    for (const { path, view } of enumFiles(entity)) {
      files.push({ path, content: render("enum", view), policy: "overwrite" });
    }
  }

  // Migrations de alteração: só para tabelas que o lock anterior já tinha e cuja migration de criação existe no destino.
  // Se ela sumiu, a geração acima criou uma nova com o schema atual (e não há o que alterar).
  // Cada tabela alterada ganha uma migration, depois de todas as de criação desta geração, na ordem de dependência.
  const dates = context.migrationDates;
  const ordered = [...input.entities].sort((a, b) => dates.get(a)!.getTime() - dates.get(b)!.getTime());
  let alterIndex = 0;

  for (const entity of ordered) {
    const table = entity.getTableName();
    const before = previousByTable.get(table);
    if (before === undefined) continue;

    if (existingMigration(table, input.existingMigrations) === undefined) {
      warnings.push(
        `A migration de criação da tabela ${table} não existe em database/migrations; foi gerada uma nova com o schema atual, ` +
          `sem migration de alteração. Se o banco já tem a tabela, apague essa migration nova.`,
      );
      continue;
    }

    const operations = diffEntity(before, entity);
    if (operations.length === 0) continue;

    const date = addSeconds(base, input.entities.length + alterIndex++);
    const file = `${format(date, "yyyy_MM_dd_HHmmss")}_alter_${table}_table.php`;
    files.push({
      path: `database/migrations/${file}`,
      content: render("migration.alter", alterView(table, operations, capabilities)),
      // Imutável depois de emitida, como a de criação; o nome é novo a cada geração, então na prática sempre é criada.
      policy: "create-once",
    });
    migrations.push({ file, table, type: "alter", changes: lockChanges(operations) });
    warnings.push(...alterWarnings(entity, operations, file));
  }

  // Entidades removidas do manifest: a migration de criação delas, se ainda existe, continua registrada no lock.
  const currentTables = new Set(input.entities.map((entity) => entity.getTableName()));
  for (const [table] of previousByTable) {
    const file = existingMigration(table, input.existingMigrations);
    if (!currentTables.has(table) && file !== undefined) migrations.push({ file, table, type: "create" });
  }

  files.push({ path: routesPath, content: render("routes", routesView(input.entities)), policy: "overwrite" });

  // O include é calculado a partir do conteúdo recebido; quem grava continua sendo `planWrites`,
  // que classifica o arquivo como sobrescrito (include novo) ou sem mudança (já incluído).
  if (input.existingApiRoutes != null) {
    files.push({ path: "routes/api.php", content: ensureRoutesInclude(input.existingApiRoutes), policy: "overwrite" });
  }

  const currentPaths = new Set(files.map((file) => file.path));
  const obsolete = obsoleteFiles(previous, currentPaths, input);

  return { files, obsolete, warnings, migrations };
}
