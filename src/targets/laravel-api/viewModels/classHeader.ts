import { uniq } from "lodash";
import { Entity } from "../../../models/Entity";
import { EntityFileType } from "../fileType";
import { EntityNames, entityNames, generatedNamespace, namespaceToFolder } from "../names";

/** Uma classe PHP gerada: onde mora e como se chama. */
export type ClassRef = {
  namespace: string;
  className: string;
  /** Nome completo, sem a barra inicial (`App\Models\Client`). */
  fqcn: string;
  /** Caminho do arquivo, relativo à raiz do projeto Laravel. */
  path: string;
};

/**
 * Par base × final de uma classe da entidade. A final mora no namespace normal (`App\Models\Client`)
 * e é a que o resto do código referencia; a base mora em `App\Generated\...` e se chama `Base<Final>`.
 */
export type ClassPair = { base: ClassRef; final: ClassRef };

/** Parte comum aos templates de classe: namespace, `use`s e declaração da classe. */
export type ClassHeaderView = {
  entity: EntityNames;
  namespace: string;
  /** Sem repetição, na ordem em que foram declarados. */
  imports: string[];
  className: string;
  extends: string;
  /** A classe final e a base do par (os templates citam uma na outra, nos comentários). */
  final: ClassRef;
  base: ClassRef;
};

export function classRef(namespace: string, className: string): ClassRef {
  return { namespace, className, fqcn: `${namespace}\\${className}`, path: classPath(namespace, className) };
}

/** Par base × final da classe `className` do namespace normal `namespace` (ex.: `App\Models`, `Client`). */
export function classPair(namespace: string, className: string): ClassPair {
  return {
    final: classRef(namespace, className),
    base: classRef(generatedNamespace(namespace), `Base${className}`),
  };
}

export function classHeader(
  entity: Entity,
  pair: ClassPair,
  header: { imports: string[]; extends: string; layer: "base" | "final" },
): ClassHeaderView {
  const self = pair[header.layer];

  return {
    entity: entityNames(entity),
    namespace: self.namespace,
    imports: uniq(header.imports),
    className: self.className,
    extends: header.extends,
    final: pair.final,
    base: pair.base,
  };
}

/** Caminho do arquivo da classe: pasta do namespace + `<Classe>.php`. */
export function classPath(namespace: string, className: string): string {
  return `${namespaceToFolder(namespace)}/${className}.php`;
}

/**
 * Tipo de arquivo da camada de customização (classe final): estende a base gerada, nasce vazia
 * e é criada uma única vez (`create-once`). Todas as finais têm a mesma forma; só o template
 * (que lista os hooks do tipo em comentário) muda.
 */
export function finalClassFile(template: string, namespace: string, classNameOf: (names: EntityNames) => string): EntityFileType {
  return {
    template,
    layer: "custom",
    build(entity) {
      const pair = classPair(namespace, classNameOf(entityNames(entity)));

      return {
        path: pair.final.path,
        view: classHeader(entity, pair, { imports: [pair.base.fqcn], extends: pair.base.className, layer: "final" }),
        generatedBase: { fqcn: pair.base.fqcn, path: pair.base.path },
      };
    },
  };
}
