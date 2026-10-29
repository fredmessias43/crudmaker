import { Entity } from "../../models/Entity";
import { GeneratedFile } from "../types";
import { EntityFileType } from "./fileType";
import { renderTemplate } from "./render";
import { collectionFile } from "./viewModels/collection";
import { controllerFile } from "./viewModels/controller";
import { migrationFile } from "./viewModels/migration";
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
 * Target `laravel-api`: recebe o modelo normalizado e devolve os arquivos (sem tocar o disco).
 * Cada arquivo = view model (TS) + template (`templates/laravel-api`).
 */
export function generateLaravelApi(input: LaravelApiInput): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  for (const entity of input.entities) {
    for (const fileType of entityFileTypes) {
      const { path, view } = fileType.build(entity, input);
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
