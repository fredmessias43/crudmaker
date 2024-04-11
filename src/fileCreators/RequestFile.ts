import { Entity } from "../models/Entity";
import { Field } from "../types";
import { PhpFile } from "./PhpFile";
import { pascalCase } from "change-case";

export class RequestFile extends PhpFile {
  protected authorizeFunction: string[];
  protected prepareForValidationFunction: string[];
  protected rulesFunction: string[];

  constructor(entity: Entity, pkgCode: string, systemCode: string) {
    super(entity, pkgCode, systemCode);

    this.namespace =  this.baseNamespace + "\\Http\\Requests";
    this.imports = [
      "Illuminate\\Foundation\\Http\\FormRequest",
       this.baseNamespace + "\\Models\\" + this.entity.getEntityName("pascalCase") + "",
    ];
    this.extendsClauses = ["FormRequest"];
    this.className = this.entity.getEntityName("pascalCase") + "Request";

    //
    this.authorizeFunction = this.fillAuthorizeFunction();
    this.prepareForValidationFunction = this.fillPrepareForValidationFunction();
    this.rulesFunction = this.fillRulesFunction();
  }

  fillAuthorizeFunction()
  {
    let result: string[] = [];
    result.push("/**");
    result.push(" * Determine if the user is authorized to make this request.");
    result.push(" *");
    result.push(" * @return bool");
    result.push(" */");
    result.push("public function authorize()");
    result.push("{");
    result.push(this.tab + "return true;");
    result.push("}");
    return result;
  }

  fillPrepareForValidationFunction()
  {
    const camelCase = this.entity.getEntityName("camelCase");
    const pascalCase = this.entity.getEntityName("pascalCase");

    let result: string[] = [];
    result.push("/**");
    result.push(" * Prepare the data for validation.");
    result.push(" *");
    result.push(" * @return void");
    result.push(" */");
    result.push("protected function prepareForValidation()");
    result.push("{");
    result.push(this.tab + this.tab + "$" + camelCase + " = $this->route('" + camelCase + "');");
    result.push("");
    result.push(this.tab + this.tab + "if ($" + camelCase + " instanceof " + pascalCase + ")");
    result.push(this.tab + this.tab + "{");
    result.push(this.tab + this.tab + this.tab + this.tab + "$this->merge(['id' => $" + camelCase + "->id]);");
    result.push("");

    const entityFieldArray = Object.entries(this.entity.fields);
    for (let i = 0; i < entityFieldArray.length; i++)
    {
      const [name, type] = entityFieldArray[i];
      result.push(this.tab + this.tab + this.tab + this.tab + "if ( ! $this->has('" + name + "'))");
      result.push(this.tab + this.tab + this.tab + this.tab + "{");
      result.push(this.tab + this.tab + this.tab + this.tab + this.tab + this.tab + "$this->merge(['" + name + "' => $" + camelCase + "->" + name + "]);");
      result.push(this.tab + this.tab + this.tab + this.tab + "}");
      result.push("");
    }
    
    result.push(this.tab + this.tab + "}");
    result.push(this.tab + this.tab + "else");
    result.push(this.tab + this.tab + "{");
    result.push(this.tab + this.tab + this.tab + this.tab + "//");
    result.push(this.tab + this.tab + "}");
    result.push("}");
    return result;
  }

  fillRulesFunction()
  {
    let result: string[] = [];
    result.push("/**");
    result.push(" * Get the validation rules that apply to the request.");
    result.push(" *");
    result.push(" * @return array");
    result.push("*/");
    result.push("public function rules()");
    result.push("{");
    result.push(this.tab + this.tab + "return [");
    const entityFieldArray = Object.entries(this.entity.fields);
    for (let i = 0; i < entityFieldArray.length; i++)
    {
      const [fieldKey, fieldValue] = entityFieldArray[i];
      if (fieldValue.name === "id") continue;
      const ruleResult = this.fillRuleForField(fieldValue);
      result = result.concat(ruleResult.map(e => this.tab + this.tab + this.tab + e));
    }
    result.push(this.tab + this.tab + "];");
    result.push("}");
    return result;
  }

  fillRuleForField(field: Field)
  {
    let result: string[] = [];
    result.push("'" + field.name + "' => array(");
    result.push(this.tab + "'bail',");
    result.push(this.tab + "'" + (field.required ? "required" : "nullable") + "',");

    if (["uuid", "string", "text", "double", "integer", "boolean"].includes(field.type.toString()))
    {
      result.push(this.tab + "'"+field.type+"',");
    }
    else if (field.type.toString() === "json")
    {
      result.push(this.tab + "'array'");
    }
    else if (field.type.toString() === "date")
    {
      result.push(this.tab + "'date_format:Y-m-d'");
    }
    else if (field.type.toString() === "datetime")
    {
      result.push(this.tab + "'date_format:Y-m-d H:i'");
    }
    else if (field.type.toString() === "enum")
    {
      this.imports.push("Illuminate\\Validation\\Rule");
      result.push(this.tab + "Rule::in(array(" + field.enumItems.map(e => `'${e}'`).join() + "))");
    }

    result.push("),");
    return result;
  }

  getAuthorizeFunction()
  {
    return this.authorizeFunction.reduce( (previous, current, index, array) => previous + this.tab + current + this.lineBreak , "");
  }

  getPrepareForValidationFunction()
  {
    return this.prepareForValidationFunction.reduce( (previous, current, index, array) => previous + this.tab + current + this.lineBreak , "");
  }

  getRulesFunction()
  {
    return this.rulesFunction.reduce( (previous, current, index, array) => previous + this.tab + current + this.lineBreak , "");
  }

  protected getContentLine()
  {
    let result: string[] = [];
    result.push(this.getAuthorizeFunction());
    result.push(this.getPrepareForValidationFunction());
    result.push(this.getRulesFunction());
    return result.join(this.lineBreak);
  }
}