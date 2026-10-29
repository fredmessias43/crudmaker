import { camelCase, pascalCase } from "change-case";
import { snakeCase } from "lodash";
import { Entity } from "../../../models/Entity";
import { childHasInverse, nestedForeignKey, relationName } from "../../../relationNames";
import { RelationshipValue } from "../../../types";
import { entityApi, phpString } from "../entityApi";
import { BASE_NAMESPACE, entityNames } from "../names";
import { classHeader, ClassPair, classPair } from "./classHeader";
import { indexView } from "./controller";

const namespace = `${BASE_NAMESPACE}\\Http\\Controllers\\Api\\Relationships`;

/** Uma rota aninhada: o par pai/filho de um `hasMany`/`hasOne`, com tudo o que rotas, controller e request precisam. */
export type NestedRoute = {
  parent: Entity;
  child: Entity;
  /** `many` (hasMany: lista e cria) ou `one` (hasOne: mostra e cria um). */
  kind: "many" | "one";
  /** Nome do método do relacionamento na model do pai (`alerts`, `address`, `postsByAuthor`). */
  relation: string;
  /** Coluna de FK na tabela do filho que aponta para o pai. */
  foreignKey: string;
  /** Segmento da URL depois do pai (`alerts`, `address`, `posts-by-author`). */
  segment: string;
  /** Nome do parâmetro do pai na rota (`client`); `parent_<entidade>` na auto-referência. */
  param: string;
  /** O mesmo parâmetro como variável PHP (`client`, `parentClassLessonComment`), sem o `$`. */
  paramVariable: string;
  /** O filho expõe a leitura (`index` no hasMany, `show` no hasOne) e a criação (`store`). */
  actions: { read: boolean; store: boolean };
  pair: ClassPair;
};

/** `snake_case` ou `kebab-case` de um nome para usar na URL. */
const kebab = (name: string) => snakeCase(name).replaceAll("_", "-");

/** O relacionamento `relation` do pai entra nas rotas aninhadas? (`nested` do bloco `api` do pai) */
function isEnabled(nested: boolean | string[], relation: string): boolean {
  return Array.isArray(nested) ? nested.includes(relation) : nested;
}

/**
 * Rotas aninhadas das entidades, na ordem do manifest (pai, depois a ordem dos relacionamentos).
 *
 * Entra todo `hasMany`/`hasOne` que `api.nested` do pai não desligou e cujo filho declara o `belongsTo` de volta
 * com a mesma FK (sem ele a coluna não existe). O filho precisa manter a action de leitura (`index` no hasMany,
 * `show` no hasOne) ou `store`: as que ele não mantém não ganham rota.
 */
export function nestedRoutes(entities: Entity[]): NestedRoute[] {
  const byName = new Map(entities.map((entity) => [entity.entityName, entity]));
  const routes: NestedRoute[] = [];
  const classNames = new Set<string>();

  for (const parent of entities) {
    const nested = entityApi(parent).nested;
    const { pascal: parentPascal, snake: parentSnake } = entityNames(parent);

    for (const relationship of Object.values(parent.relationships).flat() as RelationshipValue[]) {
      if (relationship.relationship !== "hasMany" && relationship.relationship !== "hasOne") continue;

      const relation = relationName(relationship);
      const child = byName.get(camelCase(relationship.entity));
      if (child === undefined || !isEnabled(nested, relation)) continue;

      const foreignKey = nestedForeignKey(parent.entityName, relationship);
      if (!childHasInverse(parent.entityName, foreignKey, child.relationships.belongsTo ?? [])) continue;

      const kind = relationship.relationship === "hasMany" ? "many" : "one";
      const childActions = entityApi(child).actions;
      const actions = { read: childActions.includes(kind === "many" ? "index" : "show"), store: childActions.includes("store") };
      if (!actions.read && !actions.store) continue;

      // Com a FK no nome padrão o nome é `<Pai><Filho>`; com FK customizada, o nome do método distingue os relacionamentos do mesmo par.
      const defaultField = relationship.field === `${snakeCase(relationship.entity)}_id`;
      const childPascal = entityNames(child).pascal;
      const className = `${parentPascal}${defaultField ? childPascal : pascalCase(relation)}Controller`;
      if (classNames.has(className)) continue;
      classNames.add(className);

      // Na auto-referência o pai e o filho são a mesma entidade, e o parâmetro `{class_lesson_comment}` seria
      // confundido com o da rota de atualização na request: o pai ganha o prefixo `parent_`.
      const param = parent === child ? `parent_${parentSnake}` : parentSnake;

      routes.push({
        parent,
        child,
        kind,
        relation,
        foreignKey,
        segment: defaultField ? (kind === "many" ? child.getTableName() : entityNames(child).snake).replaceAll("_", "-") : kebab(relation),
        param,
        paramVariable: camelCase(param),
        actions,
        pair: classPair(namespace, className),
      });
    }
  }

  return routes;
}

/** Caminhos dos dois arquivos de uma rota aninhada (base gerada e final), para calcular os obsoletos. */
export function nestedControllerPaths(route: NestedRoute): { path: string; kind: "generated" | "custom" }[] {
  return [
    { path: route.pair.base.path, kind: "generated" },
    { path: route.pair.final.path, kind: "custom" },
  ];
}

/** Hooks e flags comuns à base e à final. */
function flags(route: NestedRoute) {
  return {
    kind: route.kind,
    hasRead: route.actions.read,
    hasStore: route.actions.store,
    parent: { ...entityNames(route.parent), variable: route.paramVariable },
    relation: route.relation,
    foreignKey: phpString(route.foreignKey),
    childController: `${BASE_NAMESPACE}\\Http\\Controllers\\Api\\${entityNames(route.child).pascal}Controller`,
  };
}

/**
 * Base do controller aninhado. Estende o controller *final* do filho: os hooks dele (`indexQuery`, `beforeStore`,
 * `afterStore`) valem também aqui (escopo por usuário, por exemplo, não pode ser pulado pela rota aninhada). Os
 * hooks `nested...` somam o pai à assinatura. As actions se chamam `nestedIndex`/`nestedShow`/`nestedStore` para
 * não colidir com as herdadas.
 */
export function nestedControllerBase(route: NestedRoute) {
  const { child, parent } = route;
  const { pascal } = entityNames(child);
  const parentPascal = entityNames(parent).pascal;
  const read = route.actions.read;
  const store = route.actions.store;
  const childApi = entityApi(child);

  const imports = [
    `${BASE_NAMESPACE}\\Http\\Controllers\\Api\\${pascal}Controller`,
    `${BASE_NAMESPACE}\\Models\\${parentPascal}`,
    `${BASE_NAMESPACE}\\Models\\${pascal}`,
    ...(store ? [`${BASE_NAMESPACE}\\Http\\Requests\\${pascal}Request`] : []),
    ...(read && route.kind === "many" ? [`${BASE_NAMESPACE}\\Http\\Resources\\${pascal}Collection`] : []),
    ...(store || (read && route.kind === "one") ? [`${BASE_NAMESPACE}\\Http\\Resources\\${pascal}Resource`] : []),
    ...(read ? ["Illuminate\\Database\\Eloquent\\Builder"] : []),
    "Illuminate\\Http\\JsonResponse",
    "Illuminate\\Http\\Request",
    ...(store ? ["Illuminate\\Support\\Facades\\DB"] : []),
  ];

  return {
    path: route.pair.base.path,
    view: {
      ...classHeader(child, route.pair, { imports, extends: `${pascal}Controller`, layer: "base" }),
      ...flags(route),
      index: indexView(childApi),
      withShow: indexView(childApi).with,
    },
  };
}

/** Final do controller aninhado: estende a base, nasce vazia e só lista os hooks no comentário. */
export function nestedControllerFinal(route: NestedRoute) {
  return {
    path: route.pair.final.path,
    view: {
      ...classHeader(route.child, route.pair, { imports: [route.pair.base.fqcn], extends: route.pair.base.className, layer: "final" }),
      ...flags(route),
    },
    generatedBase: { fqcn: route.pair.base.fqcn, path: route.pair.base.path },
  };
}
