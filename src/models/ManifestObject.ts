import path from "path";
import { camelCase } from "change-case";
import { Field, ManifestEntities, ManifestEntity } from "../types";
import fs from "fs";

export class Manifest {
  public systemCode: string;
  public pkgCode: string;
  public entities: ManifestEntities = {};

  constructor(obj: {[key: string]: any}) {
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
          enumItems: []
        };
        
        if (typeof fieldValue === "string") {
          newField = {
            type: fieldValue,
            name: fieldKey,
            required: true,
            enumItems: []
          }
        }
        if (fieldValue instanceof Object) {
          newField = {
            type: fieldValue.type,
            name: fieldValue.hasOwnProperty("name") ? fieldValue.name : fieldKey,
            required: fieldValue.hasOwnProperty("required") ? fieldValue.required : true,
            enumItems: fieldValue.hasOwnProperty("enumItems") ? fieldValue.enumItems : []
          }
        }

        if (newField.type === "displayName")
        {
          fieldKey = "display_name";
          newField.type = "string";
        }

        newEntity.fields[fieldKey] = newField as Field;
      }

      /**
       * Relationship
       */
      if (Object.prototype.hasOwnProperty.call(entityValue, "relationships")) {
        let newRelationships = entityValue.relationships;

        if (Object.prototype.hasOwnProperty.call(newRelationships, "owned") && newRelationships.owned) {
          newEntity.fields["owner_id"] = {
            type: 'uuid',
            name: 'owner_id',
            required: true,
            enumItems: []
          }

          newEntity.fields["owner_class"] = {
            type: 'string',
            name: 'owner_class',
            required: true,
            enumItems: []
          }
        }

        const relations = ["belongsTo", "hasMany", "hasOne", "ownOne", "ownMany"];

        relations
        .forEach((relKey) => {
          if (!newRelationships.hasOwnProperty(relKey)) return;
          const relValue = newRelationships[relKey];


          for (let i = 0; i < relValue.length; i++) {
            const element = relValue[i];
            
            if (typeof element === "string" || element instanceof String) {
              newRelationships[relKey][i] = {
                entity: element,
                type: relKey,
              }
            }
            if (element instanceof Object) {
              newRelationships[relKey][i] = {
                entity: element.hasOwnProperty("entity") ? element.entity : element,
                type: element.hasOwnProperty("type") ? element.type : relKey,
              }
            }
          }


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
  public manifestToString() : string {
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