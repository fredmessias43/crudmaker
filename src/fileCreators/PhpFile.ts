import { Entity } from "../models/Entity";

export abstract class PhpFile {
  protected tab = "  ";
  protected lineBreak = "\n";
  public entity: Entity;

  protected namespace: string = "";
  protected imports: string[] = [];
  public className: string = "";
  protected implementClauses: string[] = [];
  protected extendsClauses: string[] = [];

  constructor(entity: Entity) {
    this.entity = entity;
    this.className = this.entity.getEntityName("pascalCase");
  }

  protected getClassNameLine(): string {
    let result = ""; 
    result = `class ${this.className}`;
    
    if ( this.implementClauses.length > 0 )
    {
      result += " implements " + this.implementClauses.join();
    }

    if ( this.extendsClauses.length > 0 )
    {
      result += " extends " + this.extendsClauses.join();
    }

    return result;
  };
  protected getNamespaceLine(): string { return `namespace ${this.namespace};` };
  protected getImportLines(): string {
    let result = "";

    for (let i = 0; i < this.imports.length; i++) {
      const importLine = `use ${this.imports[i]};`;
      result += importLine;
      if (this.imports.length - 1 !== i) result += "\n"
    }
    return result;
  };

  protected getContentLine()
  {
    return this.tab + "//";
  }

  public mountFile(): string {
    let result: string[] = [];

    result.push("<?php");
    result.push("");
    result.push(this.getNamespaceLine());
    result.push("");
    result.push(this.getImportLines());
    result.push("");
    result.push("");
    result.push(this.getClassNameLine());
    result.push("{");
    result.push(this.getContentLine());
    result.push("}");
    result.push("");

    return result.join(this.lineBreak);
  }
}