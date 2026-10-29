import { orderByDependency } from "../../dependencyOrder";
import { Entity } from "../../models/Entity";
import { foreignKeyTable } from "./viewModels/migration";

/**
 * Entidades na ordem de dependência das FKs (`belongsTo`): a referenciada vem antes; empate = ordem do manifest.
 * Serve às datas das migrations e à ordem dos seeders. Ciclos já são recusados na validação; o fallback
 * (os presos em ciclo, no fim, na ordem original) mantém a função total.
 */
export function entitiesByDependency(entities: Entity[]): Entity[] {
  // Os nós são as posições no manifest (e não a tabela), para duas entidades com a mesma tabela não se confundirem.
  const indexByTable = new Map<string, number>();
  entities.forEach((entity, index) => {
    if (!indexByTable.has(entity.getTableName())) indexByTable.set(entity.getTableName(), index);
  });

  const { order, cyclic } = orderByDependency(
    entities.map((entity, index) => ({
      id: String(index),
      dependsOn: (entity.relationships?.belongsTo ?? [])
        .map((relationship) => indexByTable.get(foreignKeyTable(relationship)))
        .filter((target) => target !== undefined)
        .map(String),
    })),
  );

  return [...order, ...cyclic].map((id) => entities[Number(id)]);
}
