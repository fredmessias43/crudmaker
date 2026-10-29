import { Entity } from "../../models/Entity";

/** Dados de ambiente que os tipos de arquivo por entidade podem precisar. */
export type EntityFileContext = {
  /** Data/hora usada no prefixo do nome das migrations novas. */
  now: Date;
  /** Nomes de arquivo (sem pasta) das migrations que já existem no destino. */
  existingMigrations: string[];
};

/**
 * Um tipo de arquivo gerado uma vez por entidade (model, controller...).
 * `build` é o view model: transforma a entidade normalizada nas variáveis do template
 * (`it.*`) e diz onde o arquivo vai. O template só imprime, sem decidir nada.
 */
export type EntityFileType = {
  /** Nome do template em `templates/laravel-api/<template>.php.eta`. */
  template: string;
  build(entity: Entity, context: EntityFileContext): { path: string; view: object };
};
