import { ApiAction } from "../../../types";
import { ACTION_ORDER, entityApi, EntityApi, phpString } from "../entityApi";
import { EntityFileType } from "../fileType";
import { BASE_NAMESPACE, entityNames } from "../names";
import { classHeader, classPair, finalClassFile } from "./classHeader";

const namespace = `${BASE_NAMESPACE}\\Http\\Controllers\\Api`;

/** Flags `has.<action>` dos templates: a action existe no controller (e os hooks dela com ela). */
export function actionFlags(api: EntityApi): { [action in ApiAction]: boolean } {
  return Object.fromEntries(ACTION_ORDER.map((action) => [action, api.actions.includes(action)])) as { [action in ApiAction]: boolean };
}

/** Lista PHP (`['a', 'b']`, sem os colchetes) de strings. */
const phpList = (items: string[]) => items.map(phpString).join(", ");

/**
 * Passos do `index` declarados no manifest, na ordem em que rodam (e antes do hook `indexQuery`):
 * eager loading, filtros, busca e ordenação. Cada filtro já traz a condição e o valor em PHP.
 */
function indexView(api: EntityApi) {
  const filters = api.filters.map(({ column, field }) => {
    const param = phpString(column);
    const query = `$request->query(${param})`;

    if (field?.type === "enum") {
      return { column: param, condition: `$request->filled(${param}) && in_array(${query}, [${phpList(field.enumItems)}], true)`, value: query };
    }
    if (field?.type === "boolean") {
      return { column: param, condition: `$request->filled(${param})`, value: `$request->boolean(${param})` };
    }
    return { column: param, condition: `$request->filled(${param}) && is_string(${query})`, value: query };
  });

  return {
    perPage: api.perPage,
    with: phpList(api.with.map((relation) => relation.name)),
    filters,
    search: phpList(api.search),
    sort: phpList(api.sort),
    defaultSort: api.defaultSort && { column: phpString(api.defaultSort.column), direction: phpString(api.defaultSort.direction) },
    /** Sem nenhum passo declarado, o index é o de sempre. */
    declarative: api.with.length > 0 || filters.length > 0 || api.search.length > 0 || api.sort.length > 0 || api.defaultSort !== undefined,
  };
}

/**
 * Base do controller. Os tipos que ela usa (model, request, resource, collection) são sempre os das
 * classes *finais*: o route model binding resolve o tipo declarado no parâmetro (um `BaseClient` nunca
 * seria instanciado com a tabela certa e sem as customizações) e o container resolve a request pelo
 * tipo (a `ClientRequest` final é a que tem o `extraRules()` do usuário).
 */
export const controllerBaseFile: EntityFileType = {
  template: "controller.base",
  layer: "generated",
  build(entity) {
    const { pascal } = entityNames(entity);
    const pair = classPair(namespace, `${pascal}Controller`);
    const api = entityApi(entity);
    const has = actionFlags(api);
    const writes = has.store || has.update || has.destroy;

    // Só importa o que as actions mantidas usam (com todas as actions, a lista é a de sempre).
    const imports = [
      `${BASE_NAMESPACE}\\Http\\Controllers\\Controller`,
      `${BASE_NAMESPACE}\\Models\\${pascal}`,
      ...(has.store || has.update ? [`${BASE_NAMESPACE}\\Http\\Requests\\${pascal}Request`] : []),
      ...(has.index ? [`${BASE_NAMESPACE}\\Http\\Resources\\${pascal}Collection`] : []),
      ...(has.store || has.show || has.update ? [`${BASE_NAMESPACE}\\Http\\Resources\\${pascal}Resource`] : []),
      ...(has.index ? ["Illuminate\\Database\\Eloquent\\Builder"] : []),
      "Illuminate\\Http\\JsonResponse",
      ...(has.index || writes ? ["Illuminate\\Http\\Request"] : []),
      ...(has.destroy ? ["Illuminate\\Http\\Response"] : []),
      ...(writes ? ["Illuminate\\Support\\Facades\\DB"] : []),
    ];

    return {
      path: pair.base.path,
      view: {
        ...classHeader(entity, pair, { imports, extends: "Controller", layer: "base" }),
        has,
        hooks: has.index || has.store || has.update || has.destroy,
        index: indexView(api),
        withShow: phpList(api.with.map((relation) => relation.name)),
      },
    };
  },
};

/** A final lista só os hooks das actions que a base tem. */
export const controllerFinalFile: EntityFileType = (() => {
  const base = finalClassFile("controller.final", namespace, ({ pascal }) => `${pascal}Controller`);

  return {
    ...base,
    build(entity, context) {
      const result = base.build(entity, context);
      const has = actionFlags(entityApi(entity));

      return { ...result, view: { ...result.view, has, actions: ACTION_ORDER.filter((action) => has[action]).join(", ") } };
    },
  };
})();
