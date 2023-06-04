import * as changeCase from "change-case";
import { FieldType, RelationshipType, ManifestObject } from "../types";

export class Entity {
  public entityName: string;
  public fields: FieldType;
  public relationships: RelationshipType;

  constructor(entityName: string, manifestObject: ManifestObject)
  {
    this.entityName = changeCase.camelCase(entityName);

    this.fields = manifestObject.fields;
    this.relationships = manifestObject.relationship;
  }

  public getEntityName(casing: keyof typeof changeCase, options?: changeCase.Options & number )
  {
    const changeCaseFn = changeCase[casing];

    if (changeCaseFn instanceof Function) return changeCaseFn(this.entityName, options || 1);

    return this.entityName;
  }
}