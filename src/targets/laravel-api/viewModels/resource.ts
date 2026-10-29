import { EntityFileType } from "../fileType";
import { BASE_NAMESPACE, entityNames } from "../names";
import { classHeader, classPath } from "./classHeader";

const namespace = `${BASE_NAMESPACE}\\Http\\Resources`;

export const resourceFile: EntityFileType = {
  template: "resource",
  build(entity) {
    const className = `${entityNames(entity).pascal}Resource`;

    return {
      path: classPath(namespace, className),
      view: {
        ...classHeader(entity, {
          namespace,
          imports: ["Illuminate\\Http\\Resources\\Json\\JsonResource", "Illuminate\\Support\\Facades\\App"],
          className,
          extends: "JsonResource",
        }),
        fields: Object.keys(entity.fields).map((key) => ({ key })),
      },
    };
  },
};
