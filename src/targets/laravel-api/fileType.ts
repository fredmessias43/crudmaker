import { Entity } from "../../models/Entity";

/** Dados de ambiente que os tipos de arquivo por entidade podem precisar. */
export type EntityFileContext = {
  /** Data/hora usada no prefixo do nome das migrations novas. */
  now: Date;
  /** Nomes de arquivo (sem pasta) das migrations que já existem no destino. */
  existingMigrations: string[];
  /** Data/hora de cada entidade nas migrations novas: `now` + posição na ordem de dependência das FKs. */
  migrationDates: Map<Entity, Date>;
};

/**
 * Camada a que o arquivo pertence:
 * - `generated`: classe base em `App\Generated\...`, sempre sobrescrita (política `overwrite`);
 * - `custom`: classe final no namespace normal, criada uma única vez (política `create-once`);
 * - `migration`: arquivo único, sem base nem final (política `overwrite`, como antes).
 */
export type EntityFileLayer = "generated" | "custom" | "migration";

/**
 * Um tipo de arquivo gerado uma vez por entidade (base do model, final do controller...).
 * `build` é o view model: transforma a entidade normalizada nas variáveis do template
 * (`it.*`) e diz onde o arquivo vai. O template só imprime, sem decidir nada.
 */
export type EntityFileType = {
  /** Nome do template em `templates/laravel-api/<template>.php.eta` (sem a extensão). */
  template: string;
  layer: EntityFileLayer;
  build(
    entity: Entity,
    context: EntityFileContext,
  ): {
    path: string;
    view: object;
    /** Só na camada `custom`: a base gerada que a classe estende (veja `GeneratedFile.generatedBase`). */
    generatedBase?: { fqcn: string; path: string };
  };
};
