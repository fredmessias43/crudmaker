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
  protected traits: string[] = [];
  protected classDecorator: string = "";
  public className: string = "";
  protected implementClauses: string[] = [];
  protected extendsClauses: string[] = [];
  protected anonymousClass: boolean  = false;
  public fileMounted: string = "";

  constructor(entity: Entity, pkgCode: string, systemCode: string) {
    this.entity = entity;
    this.systemCode = systemCode;
    this.pkgCode = pkgCode;
    this.className = this.entity.getEntityName("pascalCase");
    // this.baseNamespace = pascalCase(this.systemCode) + "\\" + pascalCase(this.pkgCode);
  }

  protected getNamespaceLine(): string {
    return this.anonymousClass ? "" : `namespace ${this.namespace};${this.lineBreak}`
  };

  protected getImportLines(): string {
    let result = "";

    for (let i = 0; i < this.imports.length; i++) {
      const importLine = `use ${this.imports[i]};`;
      result += importLine;
      if (this.imports.length - 1 !== i) result += this.lineBreak;
    }
    return result ? result + this.lineBreak : result;
  };

  protected getClassDecorator(): string {
    return this.classDecorator;
  }

  protected getClassNameLine(): string {
    let result = `class ${this.className}`;

    if (this.anonymousClass) {
      result = "return new class";
    }
    
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

  protected getTraitLines(): string {
    let result = "";

    for (let i = 0; i < this.traits.length; i++) {
      const traitLine = this.tab + `use ${this.traits[i]};`;
      result += traitLine;
      if (this.traits.length - 1 !== i) result += this.lineBreak;
    }
    return result ? result + this.lineBreak : result;
  }

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
    result.push(this.getImportLines());
    result.push(this.getClassDecorator());
    result.push(this.getClassNameLine());
    result.push("{");
    result.push(this.getTraitLines());
    result.push(this.getContentLine());
    result.push("};");
    result.push("");

    this.fileMounted = result.join(this.lineBreak)
    return this.fileMounted;
  }

  public writeFile(): string {
    const basePath = path.join(__dirname, "../../generated/", this.pkgCode, this.namespace.replace("App", "app") ).replaceAll("\\", "/");

    console.log("File Created: " + `${basePath}\\${this.className}.php`);
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    const fileName = `${basePath}/${this.getFileName()}`;
    fs.writeFileSync(fileName, this.fileMounted);

    return fileName;
  }

  public mountAndWriteFile(): void {
    this.mountFile();
    this.writeFile();
  }
}