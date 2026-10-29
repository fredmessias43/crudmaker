import { Entity } from "../../models/Entity";
import { FilePolicy } from "../types";
import { NestedRoute } from "./viewModels/nestedController";

/** Dados de ambiente que os tipos de arquivo por entidade podem precisar. */
export type EntityFileContext = {
  /** Data/hora usada no prefixo do nome das migrations novas. */
  now: Date;
  /** Nomes de arquivo (sem pasta) das migrations que já existem no destino. */
  existingMigrations: string[];
  /** Data/hora de cada entidade nas migrations novas: `now` + posição na ordem de dependência das FKs. */
  migrationDates: Map<Entity, Date>;
  /** Tabelas das entidades do `manifest-lock.json` anterior (a migration delas já foi emitida em alguma geração). */
  previousTables: Set<string>;
  /**
   * Tabelas que já existem no destino por uma migration de criação que não é do crudmaker (esqueleto do Laravel,
   * escrita à mão): nunca são recriadas nem reescritas (veja `foreignMigrations` em `LaravelApiInput`).
   */
  foreignTables: Set<string>;
  /** A tabela `users` veio do esqueleto do Laravel: id bigint (não uuid), model Authenticatable e FKs para ela em bigint. */
  skeletonUsers: boolean;
  /** Rotas aninhadas do projeto: a request do filho recebe a FK do pai que vem da URL. */
  nestedRoutes: NestedRoute[];
};

/**
 * Camada a que o arquivo pertence:
 * - `generated`: classe base em `App\Generated\...`, sempre sobrescrita (política `overwrite`);
 * - `custom`: classe final no namespace normal, criada uma única vez (política `create-once`);
 * - `migration`: arquivo único, sem base nem final (política `overwrite`, como antes).
 * (Os testes Pest gerados usam `generated`: sempre regravados, mas ficam em `tests/`, fora de `app/Generated`.)
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
  /** Tipos opcionais por entidade (os testes Pest, com `api.tests: false`): `false` pula o arquivo. Omitido, sempre sai. */
  enabled?(entity: Entity): boolean;
  build(
    entity: Entity,
    context: EntityFileContext,
  ): {
    path: string;
    view: object;
    /** Substitui a política da camada (a migration de criação já emitida vira `create-once`). */
    policy?: FilePolicy;
    /** Só na camada `custom`: a base gerada que a classe estende (veja `GeneratedFile.generatedBase`). */
    generatedBase?: { fqcn: string; path: string };
  };
};
