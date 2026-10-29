import { EntityFileType } from "../fileType";
import { BASE_NAMESPACE, entityNames } from "../names";
import { classHeader, classPath } from "./classHeader";

const namespace = `${BASE_NAMESPACE}\\Http\\Controllers\\Api`;

export const controllerFile: EntityFileType = {
  template: "controller",
  build(entity) {
    const { pascal } = entityNames(entity);
    const className = `${pascal}Controller`;

    return {
      path: classPath(namespace, className),
      view: classHeader(entity, {
        namespace,
        imports: [
          `${BASE_NAMESPACE}\\Http\\Controllers\\Controller`,
          `${BASE_NAMESPACE}\\Models\\${pascal}`,
          `${BASE_NAMESPACE}\\Http\\Requests\\${pascal}Request`,
          `${BASE_NAMESPACE}\\Http\\Resources\\${pascal}Collection`,
          `${BASE_NAMESPACE}\\Http\\Resources\\${pascal}Resource`,
          "Illuminate\\Http\\JsonResponse",
          "Illuminate\\Http\\Response",
        ],
        className,
        extends: "Controller",
      }),
    };
  },
};
