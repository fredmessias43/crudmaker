import { EntityFileType } from "../fileType";
import { BASE_NAMESPACE, entityNames } from "../names";
import { classHeader, classPath } from "./classHeader";

const namespace = `${BASE_NAMESPACE}\\Http\\Resources`;

export const collectionFile: EntityFileType = {
  template: "collection",
  build(entity) {
    const className = `${entityNames(entity).pascal}Collection`;

    return {
      path: classPath(namespace, className),
      view: {
        ...classHeader(entity, {
          namespace,
          imports: ["Illuminate\\Http\\Resources\\Json\\ResourceCollection", "Illuminate\\Support\\Facades\\App"],
          className,
          extends: "ResourceCollection",
        }),
        fields: Object.keys(entity.fields).map((key) => ({ key })),
      },
    };
  },
};
