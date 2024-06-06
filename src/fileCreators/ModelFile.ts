import { Entity } from "../models/Entity";
import { PhpFile } from "./PhpFile";
import { camelCase, pascalCase } from "change-case";

export class ModelFile extends PhpFile {
  protected relationShipFunctions: Array<string>;
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
    const entityFieldArray = Object.entries(this.entity.fields);

    // result.push("protected $connection = \"tenant\";");
    result.push("protected $keyType = \"string\";");
    result.push("public $incrementing = false;");
    result.push("");
    
    result.push("/**");
    result.push(" * The attributes that should be cast.");
    result.push(" *");
    result.push(" * @var array");
    result.push(" */");
    result.push("protected $casts = [");
    for (const entity of entityFieldArray) {
      const [name, field] = entity;
      if (field.type === "boolean") {
        result.push(this.tab + "'" + field.name + "' => '" + field.type +  "',");
      }
      if (field.type === "json") {
        result.push(this.tab + "'" + field.name + "' => 'array',");
      }
    }
    result.push("];");
    result.push("");

    result.push("/**");
    result.push(" * The attributes that are mass assignable.");
    result.push(" *");
    result.push(" * @var array");
    result.push(" */");
    result.push("protected $fillable = [");
    for (const entity of entityFieldArray) {
      const [name, field] = entity;
      result.push(this.tab + "'" + name + "',");
    }
    result.push("];");

    return result;
  }

  protected fillRelationShipFunctions()
  {
    let result: Array<string> = [];

    for (const relationship of Object.values(this.entity.relationships).flat()) {
      this.imports.push("Illuminate\\Database\\Eloquent\\Relations\\"+pascalCase(relationship.relationship));
      result.push("public function " + camelCase(relationship.entity) + "(): "+pascalCase(relationship.relationship)+"");
      result.push("{");
      result.push(this.tab + "return $this->"+camelCase(relationship.relationship)+"(" + pascalCase(relationship.entity) + "::class);");
      result.push("}");
    }

    return result;
  }
  
  protected getPropertiesLines()
  {
    return this.propertiesLines.reduce((previous, current, index, array) => previous + this.tab + current + this.lineBreak, "");
  }

  protected getRelationShipFunctions()
  {
    return this.relationShipFunctions.reduce((previous, current, index, array) => previous + this.tab + current + this.lineBreak, "");
  }

  protected getContentLine()
  {
    let result: string[] = [];
    result.push(this.getPropertiesLines());
    result.push(this.getRelationShipFunctions());
    return result.join(this.lineBreak);
  }
}