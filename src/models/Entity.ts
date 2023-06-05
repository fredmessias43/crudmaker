import * as changeCase from "change-case";
import { Field, Relationship, ManifestObject } from "../types";

export class Entity {
  public entityName: string;
  public fields: Field;
  public relationships: Relationship;

  constructor(entityName: string, manifestObject: Object)
  {
    this.entityName = changeCase.camelCase(entityName);

    if ("fields" in manifestObject) {
      this.fields = manifestObject.fields as Field;
    }
    else
    {
      throw new Error("");
    }
    if ("relationship" in manifestObject) {
      this.relationships = manifestObject.relationship as Relationship;
    }
    else
    {
      throw new Error("");
    }
  }

  public getEntityName(casing: keyof typeof changeCase, options?: changeCase.Options & number )
  {
    const changeCaseFn = changeCase[casing];

    if (changeCaseFn instanceof Function) return changeCaseFn(this.entityName, options || 1);

    return this.entityName;
  }
}