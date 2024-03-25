import * as changeCase from "change-case";
import { Fields, Relationships, ManifestEntity } from "../types";

export class Entity {
  public entityName: string;
  public fields: Fields;
  public relationships: Relationships;

  constructor(entityName: string, manifestEntity: ManifestEntity)
  {
    this.entityName = changeCase.camelCase(entityName);

    this.fields = manifestEntity.fields;
    this.relationships = manifestEntity.relationships;
  }

  public getEntityName(casing: keyof typeof changeCase, options?: changeCase.Options & number )
  {
    const changeCaseFn = changeCase[casing];

    if (changeCaseFn instanceof Function) return changeCaseFn(this.entityName, options ?? 1);

    return this.entityName;
  }

  public getTableName()
  {
    return this.getEntityName("snakeCase");
  }
}