import { entityApi } from "../entityApi";
import { EntityFileType } from "../fileType";
import { BASE_NAMESPACE, entityNames } from "../names";
import { classHeader, classPair, finalClassFile } from "./classHeader";

const namespace = `${BASE_NAMESPACE}\\Http\\Resources`;

export const resourceBaseFile: EntityFileType = {
  template: "resource.base",
  layer: "generated",
  build(entity) {
    const pair = classPair(namespace, `${entityNames(entity).pascal}Resource`);
    const { with: relations } = entityApi(entity);

    return {
      path: pair.base.path,
      view: {
        ...classHeader(entity, pair, {
          imports: [
            "Illuminate\\Http\\Request",
            "Illuminate\\Http\\Resources\\Json\\JsonResource",
            "Illuminate\\Support\\Facades\\App",
            // Relacionamentos de `api.with` usam a resource final da entidade relacionada.
            ...relations.map((relation) => relation.resourceFqcn),
          ],
          extends: "JsonResource",
          layer: "base",
        }),
        fields: Object.keys(entity.fields).map((key) => ({ key })),
        /** Relacionamentos de `api.with`: entram só se carregados (`whenLoaded`), com o nome do método como chave. */
        relations,
      },
    };
  },
};

export const resourceFinalFile = finalClassFile("resource.final", namespace, ({ pascal }) => `${pascal}Resource`);
