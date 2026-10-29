import { uniq } from "lodash";
import { Entity } from "../../../models/Entity";
import { EntityNames, entityNames, namespaceToFolder } from "../names";

/** Parte comum aos templates de classe: namespace, `use`s e declaração da classe. */
export type ClassHeaderView = {
  entity: EntityNames;
  namespace: string;
  /** Sem repetição, na ordem em que foram declarados. */
  imports: string[];
  className: string;
  extends: string;
};

export function classHeader(
  entity: Entity,
  header: { namespace: string; imports: string[]; className: string; extends: string },
): ClassHeaderView {
  return {
    entity: entityNames(entity),
    namespace: header.namespace,
    imports: uniq(header.imports),
    className: header.className,
    extends: header.extends,
  };
}

/** Caminho do arquivo da classe: pasta do namespace + `<Classe>.php`. */
export function classPath(namespace: string, className: string): string {
  return `${namespaceToFolder(namespace)}/${className}.php`;
}

