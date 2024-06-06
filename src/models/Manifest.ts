import path from "path";
import { camelCase } from "change-case";
import { Field, ManifestEntities, ManifestEntity, RelationshipKeys, RelationshipValue, Relationships } from "../types";
import fs from "fs";
import { snakeCase, uniqBy } from "lodash";

export class Manifest {
  public systemCode: string;
  public pkgCode: string;
  public entities: ManifestEntities = {};

  constructor(obj: { [key: string]: any }) {
    if (!Object.prototype.hasOwnProperty.call(obj, "system"))
      throw new Error("Manifest must have 'system' key");

    if (!Object.prototype.hasOwnProperty.call(obj.system, "code"))
      throw new Error("Manifest must have 'system.code' key");

    if (!Object.prototype.hasOwnProperty.call(obj, "pkg"))
      throw new Error("Manifest must have 'pkg' key");

    if (!Object.prototype.hasOwnProperty.call(obj.pkg, "code"))
      throw new Error("Manifest must have 'pkg.code' key");

    if (!Object.prototype.hasOwnProperty.call(obj.pkg, "entities"))
      throw new Error("Manifest must have 'pkg.entities' key");

    this.systemCode = obj.system.code;
    this.pkgCode = obj.pkg.code;

    for (const entityKey in obj.pkg.entities) {
      const entityValue = obj.pkg.entities[entityKey];

      let newEntity: ManifestEntity = {
        fields: {},
        relationships: {},
      }

      /**
       * Fields
       */
      for (let fieldKey in entityValue.fields) {
        const fieldValue = entityValue.fields[fieldKey];
        let newField = {
          type: "",
          name: "",
          required: true,
          unique: false,
          enumItems: []
        };

        if (typeof fieldValue === "string") {
          newField = {
            type: fieldValue,
            name: fieldKey,
            required: true,
            unique: false,
            enumItems: []
          }
        }
        if (fieldValue instanceof Object) {
          newField = {
            type: fieldValue.type,
            name: fieldValue.hasOwnProperty("name") ? fieldValue.name : fieldKey,
            required: fieldValue.hasOwnProperty("required") ? fieldValue.required : true,
            unique: fieldValue.hasOwnProperty("unique") ? fieldValue.unique : false,
            enumItems: fieldValue.hasOwnProperty("enumItems") ? fieldValue.enumItems : []
          }
        }

        if (newField.type === "displayName") {
          fieldKey = "display_name";
          newField.type = "string";
        }

        newEntity.fields[fieldKey] = newField as Field;
      }

      /**
       * Relationship
       */
      if (Object.prototype.hasOwnProperty.call(entityValue, "relationships")) {
        let newRelationships: Relationships = {};

        if (
          Object.prototype.hasOwnProperty.call(entityValue.relationships, "owned") && entityValue.relationships.owned ||
          Object.prototype.hasOwnProperty.call(entityValue.relationships, "morphed") && entityValue.relationships.morphed
        ) {
          newEntity.fields["owner_id"] = {
            type: 'uuid',
            name: 'owner_id',
            required: true,
            unique: false,
            enumItems: []
          }

          newEntity.fields["owner_class"] = {
            type: 'string',
            name: 'owner_class',
            required: true,
            unique: false,
            enumItems: []
          }
        }

        const relations: Partial<RelationshipKeys>[] = ["hasOne", "hasMany", "ownOne", "ownMany", "morphOne", "morphMany", "belongsTo", "morphTo"];

        relations
          .forEach((relation) => {
            if (!entityValue.relationships.hasOwnProperty(relation)) return;
            const relationships = entityValue.relationships[relation];

            for (let i = 0; i < relationships.length; i++) {
              const element = relationships[i];
              let newRelation: RelationshipValue;

              if (typeof element === "string" || element instanceof String) {
                newRelation = {
                  entity: element.toString(),
                  field: element.toString() + "_id",
                  relationship: relation,
                };
              }
              /* (element instanceof Object)  */
              else {
                const targetEntity = element.hasOwnProperty("entity") ? element.entity : element;
                newRelation = {
                  entity: targetEntity,
                  field: element.hasOwnProperty("field") ? element.field : snakeCase(element.toString()) + "_id",
                  relationship: element.hasOwnProperty("relationship") ? element.relationship : relation,
                };
              }

              if (!newRelationships.hasOwnProperty(relation)) newRelationships[relation] = [];
              newRelationships[relation]!.push(newRelation);
            }
          });

        /* 
        // Inverse relationships
        // hasOne => belongsTo
        // hasMany => belongsTo
        // ownOne/morphOne => morphTo
        // ownMany/morphMany => morphTo
        relations
        .forEach((relation) => {
          if (!newRelationships.hasOwnProperty(relation)) return;
          const relationships = newRelationships[relation];

          console.log("relation", relation, "relationships", relationships);
          
        }); */

        // fill fields
        relations
          .forEach(relation => {
            if (relation !== 'belongsTo') return;
            if (!newRelationships.hasOwnProperty(relation)) return;
            const relationships: RelationshipValue[] | undefined = newRelationships[relation];

            relationships?.forEach(relation => {
              const newField = {
                type: "uuid" as "uuid",
                name: relation.field,
                required: true,
                unique: false,
                enumItems: [],
                relationship: true
              }
              newEntity.fields[relation.field] = newField;
            });
          });

        newEntity.relationships = newRelationships;
      }


      /**
       * Indexes
      */
      if (Object.prototype.hasOwnProperty.call(entityValue, "indexes")) {
        let newIndexes = entityValue.indexes;
        // newEntity.indexes = newIndexes;
      }


      this.entities[entityKey] = newEntity;
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

  public lockManifest() {
    const basePath = path.join(__dirname, "../../generated/" + this.pkgCode).replaceAll("\\", "/");

    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    const fileName = `${basePath}/manifest-lock.json`;
    fs.writeFileSync(fileName, this.manifestToString());
  }
}