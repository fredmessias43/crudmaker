import { addSeconds, format } from "date-fns";
import { Entity } from "../../models/Entity";
import { LockMigration } from "../../types";
import { TargetVersion } from "../../targetVersion";
import { GeneratedFile, ObsoleteFile } from "../types";
import { capabilitiesFor } from "./capabilities";
import { entitiesByDependency } from "./entityOrder";
import { EntityFileType } from "./fileType";
import { renderTemplate, Stubs } from "./render";
import { collectionBaseFile, collectionFinalFile } from "./viewModels/collection";
import { controllerBaseFile, controllerFinalFile } from "./viewModels/controller";
import { enumFiles } from "./viewModels/enum";
import { factoryBaseFile, factoryFinalFile } from "./viewModels/factory";
import { existingMigration, migrationFile } from "./viewModels/migration";
import { alterView, alterWarnings, diffEntity, lockChanges } from "./viewModels/migrationAlter";
import { modelBaseFile, modelFinalFile } from "./viewModels/model";
import { nestedControllerBase, nestedControllerFinal, nestedControllerPaths, nestedRoutes } from "./viewModels/nestedController";
import { crudmakerSeeder, CRUDMAKER_SEEDER, entitySeeder } from "./viewModels/seeder";
import { requestBaseFile, requestFinalFile } from "./viewModels/request";
import { resourceBaseFile, resourceFinalFile } from "./viewModels/resource";
import { ensureRoutesInclude, routesPath, routesView } from "./viewModels/routes";
import { createMigrationOf, isUserEntity, SKELETON_COLUMNS, USERS_TABLE } from "./viewModels/skeleton";
import { Field } from "../../types";

/** Entrada do target: o modelo normalizado de entidades mais o "ambiente" da geração. */
export type LaravelApiInput = {
  entities: Entity[];
  /** Data/hora do prefixo das migrations novas. */
  now: Date;
  /** Nomes de arquivo (sem pasta) das migrations que já existem no destino. */
  existingMigrations: string[];
  /**
   * Subconjunto de `existingMigrations` que NÃO é do crudmaker: sem cabeçalho de gerado e fora do `manifest-lock.json`
   * (o esqueleto do Laravel, migrations escritas à mão). Uma migration de criação dessas nunca é reescrita nem
   * reaproveitada; a tabela é tratada como já existente. Omitido, todas valem como do crudmaker.
   */
  foreignMigrations?: string[];
  /** Conteúdo atual do `routes/api.php` do destino, ou `null`/omitido se ele não existe. */
  existingApiRoutes?: string | null;
  /** Entidades do `manifest-lock.json` anterior do destino, para detectar as que saíram do manifest. */
  previousEntities?: Entity[];
  /** Migrations registradas no `manifest-lock.json` anterior (vazio para lock antigo ou ausente). */
  previousMigrations?: LockMigration[];
  /** Stubs do projeto já validados (nome do template → conteúdo), com prioridade sobre os embutidos. */
  stubs?: Stubs;
  /** Gera também os seeders (um por entidade e o `CrudmakerSeeder`); sem a flag, nenhum seeder sai. */
  seeders?: boolean;
  /** Conteúdo atual do `database/seeders/DatabaseSeeder.php` do destino, ou `null`/omitido se ele não existe (só para o aviso de como chamar o `CrudmakerSeeder`). */
  existingDatabaseSeeder?: string | null;
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
  factoryBaseFile,
  factoryFinalFile,
  migrationFile,
];

/** Política de cada camada: a gerada e a migration são sempre regravadas; a de customização, só criada. */
const policyByLayer = { generated: "overwrite", migration: "overwrite", custom: "create-once" } as const;

/**
 * Data de cada migration nova: `now` + 1 segundo por posição na ordem de dependência das FKs
 * (a tabela referenciada vem antes; empate = ordem do manifest), então a saída é determinística.
 */
function migrationDates(entities: Entity[], now: Date): Map<Entity, Date> {
  return new Map(entitiesByDependency(entities).map((entity, position) => [entity, addSeconds(now, position)]));
}

/**
 * Arquivos das entidades do lock anterior que não fazem mais parte da saída atual (`currentPaths`):
 * entidade removida do manifest (ou renomeada, o que muda os caminhos). Só calcula caminhos *possíveis*,
 * a partir do mesmo código que gera os arquivos; quem grava confere o que existe no disco.
 * Migrations só entram se já existe no destino uma com o nome da tabela.
 */
function obsoleteFiles(previous: Entity[], currentPaths: Set<string>, input: LaravelApiInput): ObsoleteFile[] {
  const context = {
    ...input,
    existingMigrations: ownedMigrations(input),
    migrationDates: migrationDates(previous, input.now),
    previousTables: new Set<string>(),
    foreignTables: new Set<string>(),
    skeletonUsers: false,
    nestedRoutes: nestedRoutes(previous),
  };
  const obsolete: ObsoleteFile[] = [];

  for (const entity of previous) {
    for (const fileType of entityFileTypes) {
      const { path } = fileType.build(entity, context);
      if (currentPaths.has(path)) continue;

      // Sem migration existente, o caminho calculado seria só um nome novo: não há o que avisar.
      if (fileType.layer === "migration" && !existingMigration(entity.getTableName(), context.existingMigrations)) continue;

      obsolete.push({ path, kind: fileType.layer });
    }

    if (input.seeders) {
      const { path } = entitySeeder(entity);
      if (!currentPaths.has(path)) obsolete.push({ path, kind: "custom" });
    }

    // Enums de campos enum: camada gerada. Campo que deixou de ser enum também deixa o arquivo obsoleto.
    for (const { path } of enumFiles(entity)) {
      if (!currentPaths.has(path)) obsolete.push({ path, kind: "generated" });
    }
  }

  // Controllers aninhados (base e final) das relações do lock anterior que não geram mais os mesmos caminhos.
  for (const route of context.nestedRoutes) {
    for (const { path, kind } of nestedControllerPaths(route)) {
      if (!currentPaths.has(path)) obsolete.push({ path, kind });
    }
  }

  return obsolete;
}

/** Migrations existentes que são do crudmaker (as que `foreignMigrations` não lista). */
function ownedMigrations(input: LaravelApiInput): string[] {
  const foreign = new Set(input.foreignMigrations ?? []);
  return input.existingMigrations.filter((file) => !foreign.has(file));
}

/**
 * Colunas que o diff não pode tocar numa tabela que já existe e não é do crudmaker: as do esqueleto (quando
 * conhecidas) e sempre o `id`. O crudmaker só acrescenta colunas nelas, nunca altera ou remove o que já era do esqueleto.
 */
function protectedColumns(table: string): Set<string> {
  return new Set(["id", ...(SKELETON_COLUMNS[table] ?? [])]);
}

/**
 * Estado anterior de uma tabela que já existe e não é do crudmaker: as colunas do esqueleto (se conhecidas) mais o que o
 * lock anterior registrou. Os tipos das colunas do esqueleto não importam (o diff delas é descartado), só os nomes.
 */
function foreignBefore(entity: Entity, before: Entity | undefined): Entity {
  const placeholder = (name: string): Field => ({ type: "string", name, required: true, unique: false, enumItems: [] });
  const fields: { [key: string]: Field } = {};
  for (const name of SKELETON_COLUMNS[entity.getTableName()] ?? []) fields[name] = placeholder(name);
  Object.assign(fields, before?.fields ?? {});

  return new Entity(entity.entityName, { fields, relationships: before?.relationships ?? {} });
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
  const nested = nestedRoutes(input.entities);
  // Só as migrations do crudmaker contam para reaproveitar o nome e preservar a de criação; as de fora (esqueleto) ficam intocadas.
  const owned = ownedMigrations(input);
  const foreign = input.foreignMigrations ?? [];
  const foreignTables = new Set(
    input.entities
      .map((entity) => entity.getTableName())
      .filter((table) => existingMigration(table, owned) === undefined && createMigrationOf(table, foreign) !== undefined),
  );
  // `users` do esqueleto: id bigint auto-incremento (o crudmaker usaria uuid), então a model e as FKs para ela mudam.
  const skeletonUsers = input.entities.some(isUserEntity) && foreignTables.has(USERS_TABLE);
  const context = {
    ...input,
    existingMigrations: owned,
    now: base,
    migrationDates: migrationDates(input.entities, base),
    previousTables: new Set(previousByTable.keys()),
    foreignTables,
    skeletonUsers,
    nestedRoutes: nested,
  };
  const capabilities = capabilitiesFor(input.target);
  // Além das variáveis do view model, todo template recebe as capacidades e a versão alvo.
  const render = (template: string, view: object) => renderTemplate(template, { ...view, capabilities, target: input.target }, input.stubs);
  const baseName = (path: string) => path.slice(path.lastIndexOf("/") + 1);

  for (const entity of input.entities) {
    for (const fileType of entityFileTypes) {
      // Tabela que já existe por migration de fora: não há migration de criação (as colunas que faltam vão numa `alter`, abaixo).
      if (fileType.layer === "migration" && foreignTables.has(entity.getTableName())) continue;

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

  // Controllers das rotas aninhadas (hasMany/hasOne): um par base × final por relacionamento.
  for (const route of nested) {
    const baseFile = nestedControllerBase(route);
    files.push({ path: baseFile.path, content: render("nested-controller.base", baseFile.view), policy: "overwrite" });

    const finalFile = nestedControllerFinal(route);
    files.push({
      path: finalFile.path,
      content: render("nested-controller.final", finalFile.view),
      policy: "create-once",
      generatedBase: finalFile.generatedBase,
    });
  }

  // Migrations de alteração: só para tabelas que o lock anterior já tinha e cuja migration de criação existe no destino.
  // Se ela sumiu, a geração acima criou uma nova com o schema atual (e não há o que alterar).
  // Cada tabela alterada ganha uma migration, depois de todas as de criação desta geração, na ordem de dependência.
  const dates = context.migrationDates;
  if (skeletonUsers) {
    warnings.push(
      `A tabela users já existe (${createMigrationOf(USERS_TABLE, foreign)}, do esqueleto do Laravel): o crudmaker não a recria nem a reescreve; ` +
        `as colunas do manifest que faltam vão numa migration alter_users_table. A entidade user mantém o id bigint do esqueleto ` +
        `("id: uuid" do manifest é ignorado): sua model base estende Authenticatable (sem HasUuids e sem SoftDeletes) e as FKs que apontam para users ` +
        `são geradas como unsignedBigInteger (regra "integer" nas requests). O App\\Models\\User do esqueleto precisa estender App\\Generated\\Models\\BaseUser (veja docs/como-usar.md).`,
    );
  }

  const ordered = [...input.entities].sort((a, b) => dates.get(a)!.getTime() - dates.get(b)!.getTime());
  let alterIndex = 0;

  for (const entity of ordered) {
    const table = entity.getTableName();
    const before = previousByTable.get(table);
    const isForeign = foreignTables.has(table);

    // Tabela que já existe por migration de fora e de que não se conhecem as colunas (não é a `users`): sem lock anterior
    // não há base para o diff, e uma alter "com tudo" falharia no que já existe. Fica por conta do usuário.
    if (isForeign && before === undefined && SKELETON_COLUMNS[table] === undefined) {
      const columns = Object.values(entity.fields).map((field) => field.name).filter((name) => name !== "id");
      warnings.push(
        `A tabela ${table} já existe (${createMigrationOf(table, foreign)}, que não é do crudmaker) e as colunas dela são desconhecidas: ` +
          `nenhuma migration foi gerada e a migration existente não foi tocada. Confira se a tabela tem as colunas do manifest (${columns.join(", ") || "nenhuma além do id"}) ` +
          `e crie à mão a migration alter do que faltar. A model gerada assume id uuid e soft delete (deleted_at). ` +
          `Para o crudmaker assumir a tabela, remova a migration existente ou acrescente a ela o cabeçalho de arquivo gerado.`,
      );
      continue;
    }
    if (before === undefined && !isForeign) continue;

    if (!isForeign && existingMigration(table, owned) === undefined) {
      warnings.push(
        `A migration de criação da tabela ${table} não existe em database/migrations; foi gerada uma nova com o schema atual, ` +
          `sem migration de alteração. Se o banco já tem a tabela, apague essa migration nova.`,
      );
      continue;
    }

    const operations = isForeign
      ? diffEntity(foreignBefore(entity, before), entity, skeletonUsers).filter((operation) => !protectedColumns(table).has(operation.column))
      : diffEntity(before!, entity, skeletonUsers);
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
    const file = existingMigration(table, owned);
    if (!currentTables.has(table) && file !== undefined) migrations.push({ file, table, type: "create" });
  }

  if (input.seeders) {
    for (const entity of input.entities) {
      const { path, view } = entitySeeder(entity);
      files.push({ path, content: render("seeder", view), policy: "create-once" });
    }
    const { path, view } = crudmakerSeeder(input.entities);
    files.push({ path, content: render("crudmaker-seeder", view), policy: "overwrite" });

    if (!(input.existingDatabaseSeeder ?? "").includes(CRUDMAKER_SEEDER)) {
      warnings.push(
        `Seeders gerados. Para usá-los, chame o ${CRUDMAKER_SEEDER} no database/seeders/DatabaseSeeder.php (dentro de run()): ` +
          `$this->call(\\Database\\Seeders\\${CRUDMAKER_SEEDER}::class); ou rode: php artisan db:seed --class=${CRUDMAKER_SEEDER}.`,
      );
    }
  }

  files.push({ path: routesPath, content: render("routes", routesView(input.entities, nested)), policy: "overwrite" });

  // O include é calculado a partir do conteúdo recebido; quem grava continua sendo `planWrites`,
  // que classifica o arquivo como sobrescrito (include novo) ou sem mudança (já incluído).
  if (input.existingApiRoutes != null) {
    files.push({ path: "routes/api.php", content: ensureRoutesInclude(input.existingApiRoutes), policy: "overwrite" });
  }

  const currentPaths = new Set(files.map((file) => file.path));
  const obsolete = obsoleteFiles(previous, currentPaths, input);

  return { files, obsolete, warnings, migrations };
}
