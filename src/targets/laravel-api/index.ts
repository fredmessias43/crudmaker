import { addSeconds } from "date-fns";
import { orderByDependency } from "../../dependencyOrder";
import { Entity } from "../../models/Entity";
import { GeneratedFile } from "../types";
import { EntityFileType } from "./fileType";
import { renderTemplate } from "./render";
import { collectionFile } from "./viewModels/collection";
import { controllerFile } from "./viewModels/controller";
import { foreignKeyTable, migrationFile } from "./viewModels/migration";
import { modelFile } from "./viewModels/model";
import { requestFile } from "./viewModels/request";
import { resourceFile } from "./viewModels/resource";
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
};

/** Tipos de arquivo gerados por entidade, na ordem em que saem. Para um novo tipo, acrescente aqui. */
const entityFileTypes: EntityFileType[] = [modelFile, resourceFile, collectionFile, controllerFile, requestFile, migrationFile];

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
 * Target `laravel-api`: recebe o modelo normalizado e devolve os arquivos (sem tocar o disco).
 * Cada arquivo = view model (TS) + template (`templates/laravel-api`).
 */
export function generateLaravelApi(input: LaravelApiInput): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const context = { ...input, migrationDates: migrationDates(input.entities, input.now) };

  for (const entity of input.entities) {
    for (const fileType of entityFileTypes) {
      const { path, view } = fileType.build(entity, context);
      files.push({ path, content: renderTemplate(fileType.template, view), policy: "overwrite" });
    }
  }

  files.push({ path: routesPath, content: renderTemplate("routes", routesView(input.entities)), policy: "overwrite" });

  // O include é calculado a partir do conteúdo recebido; quem grava continua sendo `planWrites`,
  // que classifica o arquivo como sobrescrito (include novo) ou sem mudança (já incluído).
  if (input.existingApiRoutes != null) {
    files.push({ path: "routes/api.php", content: ensureRoutesInclude(input.existingApiRoutes), policy: "overwrite" });
  }

  return files;
}
