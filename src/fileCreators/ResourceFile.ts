import { Entity } from "../models/Entity";
import { PhpFile } from "./PhpFile";
import { pascalCase } from "change-case";

export class ResourceFile extends PhpFile {
  protected toArrayFnLine: string[];

  constructor(entity: Entity) {
    super(entity);

    this.namespace =  this.baseNamespace + "\\Http\\Resources";
    this.imports = [
      "Illuminate\\Http\\Resources\\Json\\JsonResource",
      "App"
    ];
    this.extendsClauses = ["JsonResource"];

    //
    this.toArrayFnLine = this.fillToArrayFn();
  }

  protected fillToArrayFn()
  {
    let result: string[] = [];
    result.push("/**");
    result.push(" * Transform the resource into an array.");
    result.push(" *");
    result.push(" * @param  \\Illuminate\\Http\\Request  $request");
    result.push(" * @return array|\\Illuminate\\Contracts\\Support\\Arrayable|\\JsonSerializable");
    result.push(" */");
    result.push("public function toArray($request)");
    result.push("{");
    result.push(this.tab + "$createdAt = $this->created_at->locale(App::getLocale());");
    result.push(this.tab + "$updatedAt = $this->updated_at->locale(App::getLocale());");
    result.push("");
    result.push(this.tab + "return [");

    const entityFieldArray = Object.entries(this.entity.fields);
    for (let i = 0; i < entityFieldArray.length; i++)
    {
      const [name, type] = entityFieldArray[i];
      
      result.push(this.tab + this.tab + `'${name}' => $this->${name},`,);
    }

    result.push(this.tab + this.tab + "'created_at' => array(")
    result.push(this.tab + this.tab + this.tab + "'timestamp' => $createdAt->timestamp,")
    result.push(this.tab + this.tab + this.tab + "'description' => $createdAt->diffForHumans(),")
    result.push(this.tab + this.tab + "),")
    result.push(this.tab + this.tab + "'updated_at' => array(")
    result.push(this.tab + this.tab + this.tab + "'timestamp' => $updatedAt->timestamp,")
    result.push(this.tab + this.tab + this.tab + "'description' => $updatedAt->diffForHumans(),")
    result.push(this.tab + this.tab + "),")

    result.push(this.tab + "];");
    result.push("}");
    return result;
  }

  protected getToArrayFn()
  {
    let result = "";
    for (let i = 0; i < this.toArrayFnLine.length; i++)
    {
      const element = this.toArrayFnLine[i];
      result += this.tab + element + this.lineBreak;
    }
    return result;
  }

  public getContentLine()
  {
    let result: string[] = [];
    result.push(this.getToArrayFn());
    return result.join(this.lineBreak);
  }
}