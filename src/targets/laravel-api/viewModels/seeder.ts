import { pascalCase } from "change-case";
import { Entity } from "../../../models/Entity";
import { BASE_NAMESPACE, entityNames } from "../names";
import { entitiesByDependency } from "../entityOrder";
import { foreignKeyTable } from "./migration";

const namespace = "Database\\Seeders";
const folder = "database/seeders";
const modelNamespace = `${BASE_NAMESPACE}\\Models`;

/** Quantos registros cada seeder cria (o usuário muda no próprio arquivo, que é `create-once`). */
export const SEEDER_COUNT = 10;

/** Nome do seeder que chama os demais, e que o `DatabaseSeeder` do projeto deve chamar. */
export const CRUDMAKER_SEEDER = "CrudmakerSeeder";
export const crudmakerSeederPath = `${folder}/${CRUDMAKER_SEEDER}.php`;

const seederClass = (entity: Entity) => `${entityNames(entity).pascal}Seeder`;

/** Um seeder por entidade (`create-once`: o usuário ajusta a quantidade e os estados). */
export function entitySeeder(entity: Entity): { path: string; view: object } {
  const { pascal } = entityNames(entity);
  const imports = [`${modelNamespace}\\${pascal}`, "Illuminate\\Database\\Seeder"];

  // FKs de `belongsTo` (menos a auto-referência): reaproveitam um pai já semeado; sem nenhum, a factory cria um.
  const parents = (entity.relationships?.belongsTo ?? [])
    .filter((relationship) => foreignKeyTable(relationship) !== entity.getTableName())
    .map((relationship) => {
      imports.push(`${modelNamespace}\\${pascalCase(relationship.entity)}`);
      return { field: relationship.field, model: pascalCase(relationship.entity) };
    });

  return {
    path: `${folder}/${seederClass(entity)}.php`,
    view: { namespace, imports: [...new Set(imports)], className: seederClass(entity), model: pascal, count: SEEDER_COUNT, parents },
  };
}

/** O `CrudmakerSeeder` (sempre regravado): chama os seeders das entidades na ordem de dependência das FKs. */
export function crudmakerSeeder(entities: Entity[]): { path: string; view: object } {
  return {
    path: crudmakerSeederPath,
    view: { namespace, className: CRUDMAKER_SEEDER, seeders: entitiesByDependency(entities).map(seederClass) },
  };
}
