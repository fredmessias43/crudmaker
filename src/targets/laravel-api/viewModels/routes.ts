import { Entity } from "../../../models/Entity";
import { entityApi, phpString } from "../entityApi";
import { BASE_NAMESPACE, entityNames } from "../names";

/** Caminho do arquivo de rotas gerado, relativo à raiz do projeto Laravel. */
export const routesPath = "routes/crudmaker.php";

/** Linha de include que o `routes/api.php` precisa ter para carregar o arquivo gerado. */
export const routesIncludeLine = "require __DIR__ . '/crudmaker.php';";

const controllerNamespace = `${BASE_NAMESPACE}\\Http\\Controllers\\Api`;

/**
 * Nome do recurso na URL: plural da tabela em kebab-case (`class_lessons` → `class-lessons`).
 * O Laravel singulariza o último segmento e troca `-` por `_` no parâmetro da rota
 * (`/class-lessons/{class_lesson}`), que é o nome que a request lê com `$this->route('class_lesson')`
 * e que o route model binding casa com `$classLesson` no controller.
 */
function resourceName(entity: Entity): string {
  return entity.getTableName().replaceAll("_", "-");
}

/** Trechos encadeados na `apiResource`: `->only([...])` (só se restringe) e `->middleware([...])` (só se há). */
function routeModifiers(entity: Entity): string {
  const api = entityApi(entity);
  const list = (items: string[]) => `[${items.map(phpString).join(", ")}]`;

  return (api.allActions ? "" : `->only(${list(api.actions)})`) + (api.middleware.length > 0 ? `->middleware(${list(api.middleware)})` : "");
}

/** View model do `routes/crudmaker.php`: um `apiResource` por entidade. */
export function routesView(entities: Entity[]) {
  const controllers = entities.map((entity) => `${controllerNamespace}\\${entityNames(entity).pascal}Controller`).sort();

  return {
    imports: [...controllers, "Illuminate\\Support\\Facades\\Route"],
    routes: entities.map((entity) => ({
      resource: resourceName(entity),
      controller: `${entityNames(entity).pascal}Controller`,
      modifiers: routeModifiers(entity),
    })),
  };
}

/** Reconhece um `require`/`include` do arquivo gerado, tolerando espaços e aspas simples ou duplas. */
const includePattern = /\b(?:require|include)(?:_once)?\b[^;\n]*['"][^'"\n]*crudmaker\.php['"]/;

/**
 * Devolve o conteúdo do `routes/api.php` garantindo o include do arquivo gerado uma única vez.
 * Se já existe, devolve o texto idêntico; se falta, acrescenta ao final sem mexer no resto.
 */
export function ensureRoutesInclude(apiRoutes: string): string {
  if (includePattern.test(apiRoutes)) return apiRoutes;

  const base = apiRoutes.endsWith("\n") ? apiRoutes : apiRoutes + "\n";

  return base + "\n// Rotas geradas pelo crudmaker (routes/crudmaker.php).\n" + routesIncludeLine + "\n";
}
