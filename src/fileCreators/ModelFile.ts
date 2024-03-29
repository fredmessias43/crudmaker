import { Entity } from "../models/Entity";
import { PhpFile } from "./PhpFile";
import { pascalCase } from "change-case";

export class ModelFile extends PhpFile {
  protected relationShipFunctions: Array<Array<string>>;
  protected propertiesLines: string[];

  constructor(entity: Entity, pkgCode: string, systemCode: string) {
    super(entity, pkgCode, systemCode);

    this.namespace =  this.baseNamespace + "\\Models";
    this.imports = [
      "Illuminate\\Database\\Eloquent\\Factories\\HasFactory",
      "Illuminate\\Database\\Eloquent\\SoftDeletes",
      "Illuminate\\Database\\Eloquent\\Model",
      "Illuminate\\Database\\Eloquent\\Attributes\\ObservedBy",
      "App\\Observers\\" + entity.getEntityName("pascalCase") + "Observer"
    ];
    this.extendsClauses = ["Model"];
    this.traits = ["HasFactory", "SoftDeletes"];
    this.classDecorator = "#[ObservedBy([" + entity.getEntityName("pascalCase") + "Observer::class])]";
    //
    this.propertiesLines = this.fillPropertiesLines();
    this.relationShipFunctions = this.fillRelationShipFunctions();
  }

  protected fillPropertiesLines()
  {
    let result: Array<string> = [];

    // result.push("protected $connection = \"tenant\";");
    result.push("protected $keyType = \"string\";");
    result.push("public $incrementing = false;");
    result.push("");
    result.push("/**");
    result.push(" * The attributes that are mass assignable.");
    result.push(" *");
    result.push(" * @var array");
    result.push(" */");
    result.push("protected $fillable = [");

    const entityFieldArray = Object.entries(this.entity.fields);
    for (const entity of entityFieldArray) {
      const [name, type] = entity;
      result.push(this.tab + "'" + name + "',");
    }

    result.push("];");

    return result;
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