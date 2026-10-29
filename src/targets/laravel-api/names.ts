import { Entity } from "../../models/Entity";

/** Namespace base de tudo o que o target gera (a pasta de saída deriva dele: `App\Http` → `app/Http`). */
export const BASE_NAMESPACE = "App";

/** Namespace da camada gerada (classes base): espelha o namespace normal (`App\Models` → `App\Generated\Models`). */
export const GENERATED_NAMESPACE = `${BASE_NAMESPACE}\\Generated`;

/** `App\Http\Requests` → `App\Generated\Http\Requests`. */
export function generatedNamespace(namespace: string): string {
  return GENERATED_NAMESPACE + namespace.slice(BASE_NAMESPACE.length);
}

/** Nomes da entidade em cada casing usado nos templates. */
export type EntityNames = {
  pascal: string;
  camel: string;
  snake: string;
  /** Nome da tabela: snake_case no plural. */
  table: string;
};

export function entityNames(entity: Entity): EntityNames {
  return {
    pascal: entity.getEntityName("pascalCase"),
    camel: entity.getEntityName("camelCase"),
    snake: entity.getEntityName("snakeCase"),
    table: entity.getTableName(),
  };
}

/** `App\Http\Requests` → `app/Http/Requests`; `database\migrations` → `database/migrations`. */
export function namespaceToFolder(namespace: string): string {
  return namespace.replace("App", "app").replaceAll("\\", "/");
}
