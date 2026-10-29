import { Entity } from "./models/Entity";
import { Manifest } from "./models/Manifest";
import { generateLaravelApi } from "./targets/laravel-api";
import { FilePolicy, GeneratedFile, ObsoleteFile } from "./targets/types";
import { Stubs } from "./targets/laravel-api/render";
import { prepareStubs } from "./targets/laravel-api/stubs";
import { assertSupported, DEFAULT_TARGET, TargetVersion } from "./targetVersion";
import { LockMigration, PreviousLock } from "./types";

export { FilePolicy, GeneratedFile, ObsoleteFile };

export type GenerateOptions = {
  /** Data/hora usada no prefixo do nome das migrations novas. */
  now: Date;
  /** Nomes de arquivo (sem pasta) das migrations que já existem no destino. */
  existingMigrations: string[];
  /**
   * Subconjunto de `existingMigrations` sem o cabeçalho de arquivo gerado pelo crudmaker (a CLI lê o início de cada arquivo).
   * Uma migration dessas só é do crudmaker se o `previousLock` a registra em `migrations`; senão é de fora (esqueleto do Laravel,
   * escrita à mão) e nunca é reescrita nem reaproveitada: a tabela dela vira "já existente" e as colunas que faltam saem numa
   * migration `alter`. Omitido, todas valem como do crudmaker (o comportamento de antes). Num lock antigo, sem `migrations`,
   * as migrations de criação das tabelas do lock também valem como do crudmaker.
   */
  unmarkedMigrations?: string[];
  /**
   * Conteúdo atual do `routes/api.php` do destino, ou `null` se o arquivo não existe.
   * Quando há conteúdo, `generate` devolve o `routes/api.php` com o include das rotas geradas
   * (acrescentado só se faltar). Quando é `null`/omitido, o arquivo não é gerado: criá-lo sozinho
   * não adiantaria, pois no Laravel 11+ ele só é carregado se registrado em `bootstrap/app.php`
   * (o `php artisan install:api` faz as duas coisas).
   */
  existingApiRoutes?: string | null;
  /**
   * Gera também os seeders (`database/seeders/<Entidade>Seeder.php`, `create-once`, e o `CrudmakerSeeder`, regravado).
   * Sem isto, nenhum seeder é produzido (as factories saem sempre). Não fica registrado no lock: passe a flag a cada geração.
   */
  seeders?: boolean;
  /** Conteúdo atual do `database/seeders/DatabaseSeeder.php` do destino, ou `null` se não existe; só decide se o aviso de como chamar o `CrudmakerSeeder` aparece. */
  existingDatabaseSeeder?: string | null;
  /**
   * Liga ou desliga a normalização de nomes. Quando definida, vale mais que `pkg.normalizeNames`
   * do manifest; omitida, vale o manifest (padrão: ligada).
   */
  normalizeNames?: boolean;
  /**
   * Conteúdo (já parseado) do `manifest-lock.json` anterior do destino, ou `null`/omitido se não existe.
   * Serve para saber o que a geração anterior produziu: as entidades que estavam nele e saíram do manifest
   * viram `obsolete` no resultado. Um lock sem `entities` válidas é ignorado.
   *
   * O lock é também a fonte de verdade do schema já emitido: para as tabelas que estavam nele e cuja migration de
   * criação existe no destino, a migration de criação é preservada (`create-once`) e as diferenças de schema viram
   * migrations `alter`. Sem lock, tudo é tratado como novo (a migration de criação é reescrita, como antes).
   * Lock antigo (sem `lockVersion`/`migrations`) vale como "schema = `entities`".
   */
  previousLock?: PreviousLock | null;
  /**
   * Stubs do projeto: nome do template (ex.: `controller.base`, `migration`, `routes`) → conteúdo do arquivo.
   * Cada um substitui o template embutido de mesmo nome. Só a camada gerada pode ser substituída; nomes
   * de outros templates (como `*.final`) são ignorados com aviso. Um stub com erro de sintaxe lança erro
   * (com o nome e a linha) antes de qualquer arquivo ser produzido.
   */
  stubs?: Stubs;
  /**
   * Hash do template embutido no momento em que cada stub foi publicado (nome → hash; o `stubs-lock.json`).
   * Se o embutido atual tem outro hash, `warnings` traz o aviso de stub desatualizado.
   */
  stubHashes?: { [templateName: string]: string };
  /**
   * Versão do Laravel/PHP de destino (`{ laravel: 10 | 11 | 12, php: "8.1" ... }`). Define as capacidades que os
   * templates consultam (casts como método, `->change()` nativo...) e fica registrada no lock. A resolução (flag,
   * manifest, composer) é da CLI; aqui só entra o resultado. Omitida, vale `DEFAULT_TARGET` (Laravel 12, PHP 8.2).
   * Versão não suportada, ou PHP abaixo do mínimo do Laravel, lança `TargetVersionError`.
   */
  target?: TargetVersion;
};

export type GenerateResult = {
  files: GeneratedFile[];
  /** Um aviso por nome alterado (ou fora da convenção, com a normalização desligada). Não bloqueiam a geração. */
  warnings: string[];
  /**
   * Arquivos de entidades que saíram do manifest (veja `ObsoleteFile`). São caminhos *possíveis*: o plano
   * de escrita confere o que existe no disco e só apaga a camada gerada.
   */
  obsolete: ObsoleteFile[];
};

/** Entidades do lock anterior; entradas que não têm o formato esperado são descartadas. */
function previousEntities(lock: GenerateOptions["previousLock"]): Entity[] {
  const entities = lock?.entities;
  if (typeof entities !== "object" || entities === null) return [];

  return Object.entries(entities)
    .filter(([, entity]) => typeof entity?.fields === "object" && entity.fields !== null)
    .map(([key, entity]) => new Entity(key, { fields: entity.fields, relationships: entity.relationships ?? {} }));
}

/** Migrations registradas no lock anterior; entradas sem o formato esperado são descartadas (lock antigo = nenhuma). */
function previousMigrations(lock: GenerateOptions["previousLock"]): LockMigration[] {
  const list = lock?.migrations;
  if (!Array.isArray(list)) return [];

  return list.filter(
    (item): item is LockMigration =>
      typeof item?.file === "string" && typeof item?.table === "string" && (item.type === "create" || item.type === "alter"),
  );
}

/** Aviso quando o lock anterior foi gerado para outra versão (Laravel/PHP): o código já emitido pode estar no estilo antigo. */
function targetChangeWarnings(lock: GenerateOptions["previousLock"], target: TargetVersion): string[] {
  const before = lock?.target;
  if (typeof before?.laravel !== "number" || typeof before?.php !== "string") return [];
  if (before.laravel === target.laravel && before.php === target.php) return [];

  return [
    `A versão alvo mudou desde a última geração (Laravel ${before.laravel}, PHP ${before.php} → Laravel ${target.laravel}, PHP ${target.php}). ` +
      `A camada gerada foi regravada para a nova versão; confira as classes finais, as migrations já emitidas e os stubs do projeto.`,
  ];
}

/**
 * Função pura: não lê nem escreve em disco.
 * Recebe o manifest cru (já parseado) e devolve os arquivos a gravar e os avisos.
 */
export function generate(manifestObj: { [key: string]: any }, options: GenerateOptions): GenerateResult {
  const target = options.target ?? DEFAULT_TARGET;
  assertSupported(target);
  const stubs = prepareStubs(options.stubs ?? {}, options.stubHashes ?? {});
  const manifest = new Manifest(manifestObj, { normalizeNames: options.normalizeNames });
  const entities = Object.keys(manifest.entities).map((key) => new Entity(key, manifest.entities[key]));

  const lockedMigrations = previousMigrations(options.previousLock);
  const previousTables = previousEntities(options.previousLock).map((entity) => entity.getTableName());
  const legacyLock = !Array.isArray(options.previousLock?.migrations);
  const locked = new Set(lockedMigrations.map((migration) => migration.file));
  const foreignMigrations = (options.unmarkedMigrations ?? []).filter(
    (file) => !locked.has(file) && !(legacyLock && previousTables.some((table) => file.endsWith(`_create_${table}_table.php`))),
  );

  const api = generateLaravelApi({
    entities,
    now: options.now,
    existingMigrations: options.existingMigrations,
    foreignMigrations,
    existingApiRoutes: options.existingApiRoutes,
    seeders: options.seeders,
    existingDatabaseSeeder: options.existingDatabaseSeeder,
    previousEntities: previousEntities(options.previousLock),
    previousMigrations: lockedMigrations,
    stubs: stubs.stubs,
    target,
  });

  // Histórico do lock: o que já estava registrado mais o que esta geração acrescenta (sem repetir arquivo).
  const known = new Set(lockedMigrations.map((migration) => migration.file));
  const migrations = [...lockedMigrations, ...api.migrations.filter((migration) => !known.has(migration.file))];

  const files: GeneratedFile[] = [
    {
      path: "manifest-lock.json",
      content: manifest.manifestToString(migrations, target),
      policy: "overwrite",
    },
    ...api.files,
  ];

  return { files, warnings: [...manifest.warnings, ...targetChangeWarnings(options.previousLock, target), ...api.warnings, ...stubs.warnings], obsolete: api.obsolete };
}
