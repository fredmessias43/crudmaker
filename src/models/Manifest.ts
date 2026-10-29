import { snakeCase } from "lodash";
import { resolveApi } from "../apiOptions";
import { ApiInput, FieldInput, ManifestInput, RELATION_KEYS, OWNER_KEYS } from "../manifestSchema";
import { Field, ManifestEntities, ManifestEntity, RelationshipValue, Relationships } from "../types";
import { validateManifest, ValidateOptions } from "../validateManifest";

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

function normalizeEntity(entityValue: ManifestInput["pkg"]["entities"][string], normalizeNames: boolean, defaultsApi?: ApiInput): ManifestEntity {
  const newEntity: ManifestEntity = {
    fields: {},
    relationships: {},
  };

  const api = resolveApi(defaultsApi, entityValue.api);
  if (api !== undefined) newEntity.api = api;

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
      // Forma curta: a FK é sempre `<entidade em snake_case>_id` (`courseContent` → `course_content_id`),
      // com ou sem normalização de nomes: é a mesma regra da forma longa e do `->on('<tabela>')` da migration.
      if (typeof element === "string") {
        const field = snakeCase(element) + "_id";
        return { entity: element, field, required: true, relationship: relation };
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
    const declared = newEntity.fields[relation.field];

    // FK declarada à mão e também derivada: com a normalização ligada vale a declaração explícita
    // (posição, required, unique...), completada com `relationship: true`. Desligada, o derivado sobrescreve.
    if (normalizeNames && declared !== undefined) {
      newEntity.fields[relation.field] = { ...declared, relationship: true };
      return;
    }

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
  /** Avisos de nomes alterados (ou fora da convenção, se a normalização estiver desligada). */
  public warnings: string[];

  constructor(obj: unknown, options: ValidateOptions = {}) {
    const { input, warnings, normalizeNames } = validateManifest(obj, options);

    this.warnings = warnings;
    this.systemCode = input.system.code;
    this.pkgCode = input.pkg.code;

    for (const [entityKey, entityValue] of Object.entries(input.pkg.entities)) {
      this.entities[entityKey] = normalizeEntity(entityValue, normalizeNames, input.pkg.defaults?.api);
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
