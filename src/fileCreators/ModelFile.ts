import { Entity } from "../models/Entity";
import { PhpFile } from "./PhpFile";
import { pascalCase } from "change-case";

export class ModelFile extends PhpFile {
  protected relationShipFunctions: Array<Array<string>>;
  protected propertiesLines: string[];

  constructor(entity: Entity) {
    super(entity);

    this.namespace =  this.baseNamespace + "\\Models";
    this.imports = [
      "Illuminate\\Database\\Eloquent\\Factories\\HasFactory",
      "Illuminate\\Database\\Eloquent\\Model"
    ];
    this.extendsClauses = ["Model"];

    //
    this.propertiesLines = [
      "protected $connection = \"tenant\";",
      "protected $keyType = \"string\";",
      "public $incrementing = false;",
    ];
    this.relationShipFunctions = this.fillRelationShipFunctions();
  }

  protected fillRelationShipFunctions()
  {
    let result: Array<Array<string>> = [];

    // this.entity.relationships;

    return result;
  }
  
  protected getPropertiesLines()
  {
    let result = "";

    for (let i = 0; i < this.propertiesLines.length; i++)
    {
      const importLine = this.propertiesLines[i];
      result += this.tab + importLine;
      if ( this.propertiesLines.length - 1 !== i ) result += "\n"
    }
    return result;
  }

  protected getRelationShipFunctions()
  {
    let result = "";

    for (let i = 0; i < this.relationShipFunctions.length; i++)
    {
      const importLine = this.relationShipFunctions[i];
      result += this.tab + importLine;
      if ( this.relationShipFunctions.length - 1 !== i ) result += "\n"
    }
    return result;
  }

  protected getContentLine()
  {
    let result: string[] = [];
    result.push(this.getPropertiesLines());
    result.push(this.getRelationShipFunctions());
    return result.join(this.lineBreak);
  }
}