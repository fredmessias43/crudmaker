/** Nó de um grafo de dependências: `dependsOn` lista os `id` que precisam vir antes. */
export type DependencyNode = { id: string; dependsOn: string[] };

/** Dependências que contam: só entre nós existentes e fora a auto-referência (que não é ciclo). */
function relevantDeps(node: DependencyNode, ids: Set<string>): string[] {
  return node.dependsOn.filter((dep) => dep !== node.id && ids.has(dep));
}

/**
 * Ordenação topológica estável: a cada passo escolhe o primeiro nó (na ordem recebida) cujas
 * dependências já foram colocadas, então o empate é sempre a ordem original.
 * Nós presos em ciclo ficam fora de `order` e voltam em `cyclic`, na ordem original.
 */
export function orderByDependency(nodes: DependencyNode[]): { order: string[]; cyclic: string[] } {
  const ids = new Set(nodes.map((node) => node.id));
  const placed = new Set<string>();
  const order: string[] = [];
  let remaining = nodes;

  while (remaining.length > 0) {
    const next = remaining.find((node) => relevantDeps(node, ids).every((dep) => placed.has(dep)));
    if (next === undefined) break;
    placed.add(next.id);
    order.push(next.id);
    remaining = remaining.filter((node) => node !== next);
  }

  return { order, cyclic: remaining.map((node) => node.id) };
}

/**
 * Ciclos do grafo (A → B → A), cada um como a lista de `id` na ordem do caminho, sem repetir o primeiro.
 * Auto-referência não é ciclo. Um mesmo conjunto de nós é reportado uma vez só.
 */
export function findCycles(nodes: DependencyNode[]): string[][] {
  const ids = new Set(nodes.map((node) => node.id));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const done = new Set<string>();
  const seen = new Set<string>();
  const cycles: string[][] = [];

  const visit = (id: string, stack: string[]): void => {
    const at = stack.indexOf(id);
    if (at !== -1) {
      const cycle = stack.slice(at);
      const key = [...cycle].sort().join("\0");
      if (!seen.has(key)) {
        seen.add(key);
        cycles.push(cycle);
      }
      return;
    }
    if (done.has(id)) return;

    for (const dep of relevantDeps(byId.get(id)!, ids)) visit(dep, [...stack, id]);
    done.add(id);
  };

  for (const node of nodes) visit(node.id, []);
  return cycles;
}
