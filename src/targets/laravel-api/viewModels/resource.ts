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
        // Campos `hidden` não saem no JSON. Campo enum vira objeto enum pelo cast da model; o JSON leva o valor (`?->value`).
        fields: Object.entries(entity.fields).filter(([, field]) => !field.hidden).map(([key, field]) => ({ key, enum: field.type === "enum" })),
        /** Relacionamentos de `api.with`: entram só se carregados (`whenLoaded`), com o nome do método como chave. */
        relations,
      },
    };
  },
};

export const resourceFinalFile = finalClassFile("resource.final", namespace, ({ pascal }) => `${pascal}Resource`);
