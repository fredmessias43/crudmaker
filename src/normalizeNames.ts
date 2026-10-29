import { camelCase, snakeCase } from "change-case";
import pluralize from "pluralize";
import { ManifestInput, RELATION_KEYS } from "./manifestSchema";
import { ManifestProblem } from "./validateManifest";

/** Entidade: singular + camelCase (`drawn_numbers` → `drawnNumber`), coerente com classe e tabela de `Entity`. */
export function normalizeEntityName(name: string): string {
  return camelCase(pluralize.singular(snakeCase(name)));
}

/** Campo: snake_case (`alertDate` → `alert_date`). */
export function normalizeFieldName(name: string): string {
  return snakeCase(name);
}

export type NameNormalization = {
  manifest: ManifestInput;
  /** Um aviso por nome alterado (ligada) ou fora da convenção (desligada). */
  warnings: string[];
  /** Colisões de nomes depois de normalizados. Só existem com a normalização ligada. */
  problems: ManifestProblem[];
  /** Nome normalizado da entidade → chave original em `pkg.entities` (para montar caminhos reais). */
  originalEntityKeys: { [normalized: string]: string };
};

/**
 * Etapa de normalização de nomes: roda depois da validação estrutural e antes da validação entre entidades.
 * Função pura: não altera a entrada. Com `enabled = false` devolve os nomes como estão, mas ainda
 * avisa o que está fora da convenção.
 */
export function normalizeNames(input: ManifestInput, enabled: boolean): NameNormalization {
  const warnings: string[] = [];
  const problems: ManifestProblem[] = [];
  const originalEntityKeys: { [normalized: string]: string } = {};

  /** Nome do próprio item (chave de entidade ou de campo, `name`): o caminho já termina no nome original. */
  const warnName = (path: string, to: string) => {
    warnings.push(enabled ? `${path} → ${to}` : `${path}: fora da convenção (normalização desligada), viraria ${to}`);
  };
  /** Referência (valor): mostra de qual nome para qual. */
  const warnValue = (path: string, from: string, to: string) => {
    warnings.push(enabled ? `${path}: ${from} → ${to}` : `${path}: ${from} fora da convenção (normalização desligada), viraria ${to}`);
  };

  const entities: ManifestInput["pkg"]["entities"] = {};

  for (const [entityKey, entity] of Object.entries(input.pkg.entities)) {
    const base = `pkg.entities.${entityKey}`;

    const entityTarget = normalizeEntityName(entityKey);
    if (entityTarget !== entityKey) warnName(base, entityTarget);
    const newEntityKey = enabled ? entityTarget : entityKey;

    if (newEntityKey in originalEntityKeys) {
      const other = originalEntityKeys[newEntityKey];
      problems.push({
        path: base,
        message: `o nome vira ${JSON.stringify(newEntityKey)}, o mesmo de pkg.entities.${other}; renomeie uma das entidades`,
      });
    }
    originalEntityKeys[newEntityKey] = originalEntityKeys[newEntityKey] ?? entityKey;

    const newEntity = { ...entity };

    /**
     * Campos
     */
    if (entity.fields !== undefined) {
      const fields: NonNullable<typeof entity.fields> = {};
      const originalFieldKeys: { [normalized: string]: string } = {};

      for (const [fieldKey, field] of Object.entries(entity.fields)) {
        const fieldPath = `${base}.fields.${fieldKey}`;
        const fieldTarget = normalizeFieldName(fieldKey);
        if (fieldTarget !== fieldKey) warnName(fieldPath, fieldTarget);
        const newFieldKey = enabled ? fieldTarget : fieldKey;

        if (newFieldKey in originalFieldKeys) {
          problems.push({
            path: fieldPath,
            message: `o nome vira ${JSON.stringify(newFieldKey)}, o mesmo de ${base}.fields.${originalFieldKeys[newFieldKey]}; renomeie um dos campos`,
          });
          continue;
        }
        originalFieldKeys[newFieldKey] = fieldKey;

        if (typeof field !== "string" && field.name !== undefined) {
          const nameTarget = normalizeFieldName(field.name);
          if (nameTarget !== field.name) warnName(`${fieldPath}.name`, nameTarget);
          fields[newFieldKey] = enabled ? { ...field, name: nameTarget } : field;
        } else {
          fields[newFieldKey] = field;
        }
      }
      newEntity.fields = fields;
    }

    /**
     * Relacionamentos: referências a entidades e o `field` explícito
     */
    if (entity.relationships !== undefined) {
      const relationships = { ...entity.relationships };

      for (const relation of RELATION_KEYS) {
        const list = entity.relationships[relation];
        if (list === undefined) continue;

        relationships[relation] = list.map((item, index) => {
          const itemPath = `${base}.relationships.${relation}[${index}]`;

          if (typeof item === "string") {
            const target = normalizeEntityName(item);
            if (target !== item) warnValue(itemPath, item, target);
            return enabled ? target : item;
          }

          const result = { ...item };
          const target = normalizeEntityName(item.entity);
          if (target !== item.entity) warnValue(`${itemPath}.entity`, item.entity, target);
          if (enabled) result.entity = target;

          if (item.field !== undefined) {
            const fieldTarget = normalizeFieldName(item.field);
            if (fieldTarget !== item.field) warnValue(`${itemPath}.field`, item.field, fieldTarget);
            if (enabled) result.field = fieldTarget;
          }
          return result;
        });
      }
      newEntity.relationships = relationships;
    }

    // Em colisão a primeira entidade permanece; a segunda só gera o problema acima.
    if (!(newEntityKey in entities)) entities[newEntityKey] = newEntity;
  }

  return {
    manifest: { ...input, pkg: { ...input.pkg, entities } },
    warnings,
    problems,
    originalEntityKeys,
  };
}
