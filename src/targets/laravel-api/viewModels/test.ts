import { Entity } from "../../../models/Entity";
import { Field } from "../../../types";
import { entityApi } from "../entityApi";
import { EntityFileType } from "../fileType";
import { BASE_NAMESPACE, entityNames } from "../names";
import { NestedRoute } from "./nestedController";
import { resourceName } from "./routes";
import { isUserEntity } from "./skeleton";

/** Pasta dos testes gerados, relativa à raiz do projeto Laravel. Fica fora de `tests/Feature` solto para o usuário não confundir com os dele. */
export const TESTS_FOLDER = "tests/Feature/Crudmaker";

const modelNamespace = `${BASE_NAMESPACE}\\Models`;

/** Caminho do arquivo de testes da entidade. */
export function testPath(entity: Entity): string {
  return `${TESTS_FOLDER}/${entityNames(entity).pascal}Test.php`;
}

/** Como o teste autentica o usuário, a partir do `api.middleware` da entidade: `actingAs($user, <guard>)`, sem guard em `auth` puro. */
export type TestAuth = { guard?: string };

/**
 * Autenticação que o middleware da entidade pede: `auth` → `actingAs($user)`; `auth:<guard>` (inclusive `auth:sanctum`) →
 * `actingAs($user, <guard>)`. Nem o `Sanctum::actingAs` é usado: ele exige a trait `HasApiTokens` no `User`, que o esqueleto do
 * Laravel 11+ não traz, e o `actingAs` com o guard `sanctum` basta para o middleware `auth:sanctum`.
 * `verified` e `throttle` passam sem tratamento (o usuário da factory tem `email_verified_at`);
 * qualquer outro middleware (`can:`, `role:`...) o gerador não sabe satisfazer e vai em `unhandled`, para o cabeçalho avisar.
 */
export function authOf(middleware: string[]): { auth: TestAuth | undefined; unhandled: string[] } {
  let auth: TestAuth | undefined;
  const unhandled: string[] = [];

  for (const item of middleware) {
    const match = /^auth(?::(.+))?$/.exec(item);
    if (match) {
      if (auth !== undefined) continue;
      const guard = match[1]?.split(",")[0].trim();
      auth = guard ? { guard } : {};
    } else if (!/^(verified|throttle)(:|$)/.test(item)) {
      unhandled.push(item);
    }
  }

  return { auth, unhandled };
}

/** Tipos cujo valor do payload dá para conferir no banco com igualdade simples (data, json, boolean e decimal variam por driver). */
const comparableTypes = ["uuid", "string", "text", "integer", "enum"];

/**
 * Expressão PHP do valor do campo no corpo da requisição, lido do model da factory (`$model`, de `make()`).
 * Segue o que as regras da request aceitam: data e datetime nos formatos `date_format` dela, enum pelo valor
 * (e não pelo objeto do cast) e json como array (o `required` do Laravel recusa `[]`, então um array vazio ganha um item).
 */
function payloadExpression(field: Field): string {
  const access = `$model->${field.name}`;
  if (field.type === "date") return `${access}?->format('Y-m-d')`;
  if (field.type === "datetime") return `${access}?->format('Y-m-d H:i')`;
  if (field.type === "enum") return `${access}?->value`;
  if (field.type === "json") return `${access} ?: ['crudmaker' => true]`;
  return access;
}

/** Linha de uma requisição sem autenticação a uma action, para o teste de 401. */
function unauthenticatedRequest(actions: string[], names: { [action: string]: string }, idExample: string): string {
  const action = actions[0];
  if (action === "index") return `$this->getJson(route('${names.index}'))`;
  if (action === "store") return `$this->postJson(route('${names.store}'), [])`;
  if (action === "show") return `$this->getJson(route('${names.show}', [${idExample}]))`;
  if (action === "update") return `$this->putJson(route('${names.update}', [${idExample}]), [])`;
  return `$this->deleteJson(route('${names.destroy}', [${idExample}]))`;
}

/** View model do arquivo de testes Pest de uma entidade (veja `templates/laravel-api/test.php.eta`). */
export function testView(entity: Entity, skeletonUsers: boolean, nestedRoutes: NestedRoute[]) {
  const names = entityNames(entity);
  const api = entityApi(entity);
  const skeletonUser = skeletonUsers && isUserEntity(entity);
  const { auth, unhandled } = authOf(api.middleware);
  const resource = resourceName(entity);

  const fields = Object.values(entity.fields).filter((field) => field.name !== "id");
  const payload = fields.map((field) => ({ name: field.name, expression: payloadExpression(field) }));
  const comparable = (field: Field) => comparableTypes.includes(field.type) && !field.hidden;
  const comparables = fields.filter(comparable).map((field) => field.name);
  const uniqueField = fields.find((field) => field.unique && comparable(field) && field.type !== "enum");

  // `id` uuid: o 404 usa um uuid que não existe; o id bigint do `users` do esqueleto, um número alto.
  const uuidId = !skeletonUser && (entity.fields.id?.type ?? "uuid") === "uuid";
  const idExample = uuidId ? "(string) Str::uuid()" : "999999";
  const routeNames = Object.fromEntries(["index", "store", "show", "update", "destroy"].map((action) => [action, `${resource}.${action}`]));

  // Rotas aninhadas em que a entidade é o filho: o teste vive no arquivo do filho, que conhece o payload e o middleware (o do filho).
  const nested = nestedRoutes
    .filter((route) => route.child === entity)
    .map((route) => {
      const prefix = resourceName(route.parent);
      const parentPascal = entityNames(route.parent).pascal;
      return {
        parent: parentPascal,
        kind: route.kind,
        relation: route.relation,
        foreignKey: route.foreignKey,
        uri: `${prefix}/{${route.param}}/${route.segment}`,
        read: route.actions.read,
        store: route.actions.store,
        readRoute: `${prefix}.${route.segment}.${route.kind === "many" ? "index" : "show"}`,
        storeRoute: `${prefix}.${route.segment}.store`,
      };
    });

  const imports = [
    `${modelNamespace}\\${names.pascal}`,
    "Illuminate\\Foundation\\Testing\\RefreshDatabase",
    ...(uuidId ? ["Illuminate\\Support\\Str"] : []),
    ...(auth ? [`${modelNamespace}\\User`] : []),
    ...(nested.some((route) => route.store) ? ["Illuminate\\Support\\Arr"] : []),
    ...nested.map((route) => `${modelNamespace}\\${route.parent}`),
  ];

  return {
    entity: names,
    imports: [...new Set(imports)].sort(),
    has: Object.fromEntries(["index", "store", "show", "update", "destroy"].map((action) => [action, api.actions.includes(action as never)])),
    routes: routeNames,
    perPage: api.perPage,
    payload,
    comparables,
    required: fields.filter((field) => field.required).map((field) => field.name),
    hidden: fields.filter((field) => field.hidden).map((field) => field.name),
    unique: uniqueField?.name,
    hasId: entity.fields.id !== undefined,
    idExample,
    softDeletes: !skeletonUser,
    middleware: api.middleware,
    auth,
    unhandled,
    unauthenticated: auth ? unauthenticatedRequest(api.actions, routeNames, idExample) : "",
    nested,
  };
}

/**
 * Arquivo de testes Pest da entidade: um por entidade, na camada gerada (sempre regravado). Pest usa closures e não
 * classes, então não há par base × final; os testes do usuário ficam em outros arquivos. Desliga com `api.tests: false`.
 */
export const testFile: EntityFileType = {
  template: "test",
  layer: "generated",
  enabled: (entity) => entityApi(entity).tests,
  build(entity, { skeletonUsers, nestedRoutes }) {
    return { path: testPath(entity), view: testView(entity, skeletonUsers, nestedRoutes) };
  },
};
