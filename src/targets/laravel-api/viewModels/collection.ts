import { EntityFileType } from "../fileType";
import { BASE_NAMESPACE, entityNames } from "../names";
import { classHeader, classPair, finalClassFile } from "./classHeader";

const namespace = `${BASE_NAMESPACE}\\Http\\Resources`;

/**
 * Base da collection: não tem hook. Cada item sai pela resource final (`$collects`), então o `extra()`
 * da resource vale na listagem também; ajustes só da collection (`with()`, `paginationInformation()`)
 * vão direto na classe final.
 */
export const collectionBaseFile: EntityFileType = {
  template: "collection.base",
  layer: "generated",
  build(entity) {
    const { pascal } = entityNames(entity);
    const pair = classPair(namespace, `${pascal}Collection`);

    return {
      path: pair.base.path,
      view: {
        ...classHeader(entity, pair, {
          imports: ["Illuminate\\Http\\Resources\\Json\\ResourceCollection", `${namespace}\\${pascal}Resource`],
          extends: "ResourceCollection",
          layer: "base",
        }),
        resourceClass: `${pascal}Resource`,
      },
    };
  },
};

export const collectionFinalFile = finalClassFile("collection.final", namespace, ({ pascal }) => `${pascal}Collection`);
