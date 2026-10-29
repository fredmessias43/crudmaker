import { EntityFileType } from "../fileType";
import { BASE_NAMESPACE, entityNames } from "../names";
import { classHeader, classPair, finalClassFile } from "./classHeader";

const namespace = `${BASE_NAMESPACE}\\Http\\Resources`;

export const resourceBaseFile: EntityFileType = {
  template: "resource.base",
  layer: "generated",
  build(entity) {
    const pair = classPair(namespace, `${entityNames(entity).pascal}Resource`);

    return {
      path: pair.base.path,
      view: {
        ...classHeader(entity, pair, {
          imports: ["Illuminate\\Http\\Request", "Illuminate\\Http\\Resources\\Json\\JsonResource", "Illuminate\\Support\\Facades\\App"],
          extends: "JsonResource",
          layer: "base",
        }),
        fields: Object.keys(entity.fields).map((key) => ({ key })),
      },
    };
  },
};

export const resourceFinalFile = finalClassFile("resource.final", namespace, ({ pascal }) => `${pascal}Resource`);
