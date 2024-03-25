import { camelCase, pascalCase } from "change-case";
import { Entity } from "../models/Entity";
import fs from "fs";
import path from "path";

export abstract class PhpFile {
  protected tab = "\t";
  protected lineBreak = "\n";
  public entity: Entity;
  public systemCode: string;
  public pkgCode: string;

  protected baseNamespace: string = "App";
  protected namespace: string = "";
  protected imports: string[] = [];
  public className: string = "";
  protected implementClauses: string[] = [];
  protected extendsClauses: string[] = [];

  public fileMounted: string = "";

  constructor(entity: Entity) {
    this.entity = entity;
    this.systemCode = "generated";
    this.pkgCode = "fredmessias";
    this.className = this.entity.getEntityName("pascalCase");
    // this.baseNamespace = pascalCase(this.systemCode) + "\\" + pascalCase(this.pkgCode);
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

  protected getFileName() : string
  {
    return this.className + ".php";
  }

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

    this.fileMounted = result.join(this.lineBreak)
    return this.fileMounted;
  }

  public writeFile(): string {
    const basePath = path.join(__dirname, "../../generated/", camelCase(this.pkgCode), this.namespace ).replaceAll("\\", "/");

    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    const fileName = `${basePath}/${this.getFileName()}`;
    fs.writeFileSync(fileName, this.fileMounted);

    // console.log("File Created: " + `${this.namespace}\\${this.className}.php`);
    return fileName;
  }

  public mountAndWriteFile(): void {
    this.mountFile();
    this.writeFile();
  }
}