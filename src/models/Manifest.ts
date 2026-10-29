import { snakeCase } from "lodash";
import { FieldInput, ManifestInput, RELATION_KEYS, OWNER_KEYS } from "../manifestSchema";
import { Field, ManifestEntities, ManifestEntity, RelationshipValue, Relationships } from "../types";
import { validateManifest } from "../validateManifest";

function normalizeField(fieldKey: string, fieldValue: FieldInput): [string, Field] {
  const newField = typeof fieldValue === "string"
    ? { type: fieldValue, name: fieldKey, required: true, unique: false, enumItems: [] as string[] }
    : {
      type: fieldValue.type,
      name: fieldValue.name ?? fieldKey,
      required: fieldValue.required ?? true,
      unique: fieldValue.unique ?? false,
      enumItems: fieldValue.enumItems ?? [],
    };

  // Aliases. O `name` do displayName permanece o original; só a chave vira `display_name`.
  if (newField.type === "displayName") {
    fieldKey = "display_name";
    newField.type = "string";
  }
  if (newField.type === "int") {
    newField.type = "integer";
  }

  return [fieldKey, newField as Field];
}

function normalizeEntity(entityValue: ManifestInput["pkg"]["entities"][string]): ManifestEntity {
  const newEntity: ManifestEntity = {
    fields: {},
    relationships: {},
  };

  /**
   * Fields
   */
  for (const [fieldKey, fieldValue] of Object.entries(entityValue.fields ?? {})) {
    const [key, field] = normalizeField(fieldKey, fieldValue);
    newEntity.fields[key] = field;
  }

  /**
   * Relationship
   */
  const relationshipsValue = entityValue.relationships;
  if (relationshipsValue === undefined) return newEntity;

  const newRelationships: Relationships = {};

  if (OWNER_KEYS.some((key) => relationshipsValue[key])) {
    newEntity.fields["owner_id"] = { type: "uuid", name: "owner_id", required: true, unique: false, enumItems: [] };
    newEntity.fields["owner_class"] = { type: "string", name: "owner_class", required: true, unique: false, enumItems: [] };
  }

  for (const relation of RELATION_KEYS) {
    const list = relationshipsValue[relation];
    if (list === undefined) continue;

    // Mesmo com a lista vazia a chave aparece no lock.
    newRelationships[relation] = list.map((element): RelationshipValue => {
      // Forma curta: a FK é `<nome>_id` sem snake_case (comportamento atual, a corrigir em outro ticket).
      if (typeof element === "string") {
        return { entity: element, field: element + "_id", required: true, relationship: relation };
      }
      return {
        entity: element.entity,
        field: element.field ?? snakeCase(element.entity) + "_id",
        required: element.required ?? true,
        relationship: element.relationship ?? relation,
      };
    });
  }

  // Campos de FK dos belongsTo
  newRelationships.belongsTo?.forEach((relation) => {
    newEntity.fields[relation.field] = {
      type: "uuid",
      name: relation.field,
      required: relation.required,
      unique: false,
      enumItems: [],
      relationship: true,
    };
  });

  newEntity.relationships = newRelationships;
  return newEntity;
}

/**
 * Manifest = schema (estrutura) + validação entre entidades + normalização.
 * O construtor lança `ManifestValidationError` se o manifest for inválido.
 */
export class Manifest {
  public systemCode: string;
  public pkgCode: string;
  public entities: ManifestEntities = {};

  constructor(obj: unknown) {
    const input = validateManifest(obj);

    this.systemCode = input.system.code;
    this.pkgCode = input.pkg.code;

    for (const [entityKey, entityValue] of Object.entries(input.pkg.entities)) {
      this.entities[entityKey] = normalizeEntity(entityValue);
    }
  }

  /**
   * manifestToString
   */
  public manifestToString(): string {
    return JSON.stringify(
      {
        code: this.pkgCode,
        version: "0.1.0",
        entities: this.entities
      },
      null,
      2
    )
  }
}
