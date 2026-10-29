import { addSeconds } from "date-fns";
import { orderByDependency } from "../../dependencyOrder";
import { Entity } from "../../models/Entity";
import { GeneratedFile, ObsoleteFile } from "../types";
import { EntityFileType } from "./fileType";
import { renderTemplate, Stubs } from "./render";
import { collectionBaseFile, collectionFinalFile } from "./viewModels/collection";
import { controllerBaseFile, controllerFinalFile } from "./viewModels/controller";
import { existingMigration, foreignKeyTable, migrationFile } from "./viewModels/migration";
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
  /** Stubs do projeto já validados (nome do template → conteúdo), com prioridade sobre os embutidos. */
  stubs?: Stubs;
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
  const context = { ...input, migrationDates: migrationDates(previous, input.now) };
  const obsolete: ObsoleteFile[] = [];

  for (const entity of previous) {
    for (const fileType of entityFileTypes) {
      const { path } = fileType.build(entity, context);
      if (currentPaths.has(path)) continue;

      // Sem migration existente, o caminho calculado seria só um nome novo: não há o que avisar.
      if (fileType.layer === "migration" && !existingMigration(entity.getTableName(), input.existingMigrations)) continue;

      obsolete.push({ path, kind: fileType.layer });
    }
  }

  return obsolete;
}

export type LaravelApiOutput = { files: GeneratedFile[]; obsolete: ObsoleteFile[] };

/**
 * Target `laravel-api`: recebe o modelo normalizado e devolve os arquivos (sem tocar o disco).
 * Cada arquivo = view model (TS) + template (`templates/laravel-api`).
 */
export function generateLaravelApi(input: LaravelApiInput): LaravelApiOutput {
  const files: GeneratedFile[] = [];
  const context = { ...input, migrationDates: migrationDates(input.entities, input.now) };

  for (const entity of input.entities) {
    for (const fileType of entityFileTypes) {
      const { path, view, generatedBase } = fileType.build(entity, context);
      files.push({
        path,
        content: renderTemplate(fileType.template, view, input.stubs),
        policy: policyByLayer[fileType.layer],
        ...(generatedBase && { generatedBase }),
      });
    }
  }

  files.push({ path: routesPath, content: renderTemplate("routes", routesView(input.entities), input.stubs), policy: "overwrite" });

  // O include é calculado a partir do conteúdo recebido; quem grava continua sendo `planWrites`,
  // que classifica o arquivo como sobrescrito (include novo) ou sem mudança (já incluído).
  if (input.existingApiRoutes != null) {
    files.push({ path: "routes/api.php", content: ensureRoutesInclude(input.existingApiRoutes), policy: "overwrite" });
  }

  const currentPaths = new Set(files.map((file) => file.path));
  const obsolete = obsoleteFiles(input.previousEntities ?? [], currentPaths, input);

  return { files, obsolete };
}
