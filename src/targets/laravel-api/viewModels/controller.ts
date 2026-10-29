import { EntityFileType } from "../fileType";
import { BASE_NAMESPACE, entityNames } from "../names";
import { classHeader, classPair, finalClassFile } from "./classHeader";

const namespace = `${BASE_NAMESPACE}\\Http\\Controllers\\Api`;

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

    return {
      path: pair.base.path,
      view: classHeader(entity, pair, {
        imports: [
          `${BASE_NAMESPACE}\\Http\\Controllers\\Controller`,
          `${BASE_NAMESPACE}\\Models\\${pascal}`,
          `${BASE_NAMESPACE}\\Http\\Requests\\${pascal}Request`,
          `${BASE_NAMESPACE}\\Http\\Resources\\${pascal}Collection`,
          `${BASE_NAMESPACE}\\Http\\Resources\\${pascal}Resource`,
          "Illuminate\\Database\\Eloquent\\Builder",
          "Illuminate\\Http\\JsonResponse",
          "Illuminate\\Http\\Request",
          "Illuminate\\Http\\Response",
          "Illuminate\\Support\\Facades\\DB",
        ],
        extends: "Controller",
        layer: "base",
      }),
    };
  },
};

export const controllerFinalFile = finalClassFile("controller.final", namespace, ({ pascal }) => `${pascal}Controller`);
