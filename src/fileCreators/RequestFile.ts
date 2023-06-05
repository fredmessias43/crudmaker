import { Entity } from "../models/Entity";
import { FieldName, FieldType, isObjectType } from "../types";
import { PhpFile } from "./PhpFile";

export class RequestFile extends PhpFile {
  protected authorizeFunction: string[];
  protected prepareForValidationFunction: string[];
  protected rulesFunction: string[];

  constructor(entity: Entity) {
    super(entity);

    this.namespace = "Brasidata\\Homefy\\Http\\Requests";
    this.imports = [
      "Illuminate\\Foundation\\Http\\FormRequest",
      "Brasidata\\Homefy\\Models\\" + this.entity.getEntityName("pascalCase") + "",
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
      result.push(this.tab + this.tab + this.tab + this.tab + this.tab + this.tab + "$this->merge(['" + name + "' => $address->" + name + "]);");
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
      const [name, type] = entityFieldArray[i];
      const ruleResult = this.fillRuleForField(name, type);
      result = result.concat(ruleResult.map(e => this.tab + this.tab + this.tab + e));
    }
    result.push(this.tab + this.tab + "];");
    result.push("}");
    return result;
  }

  fillRuleForField(fieldName: FieldName, fieldType: FieldType)
  {
    let result: string[] = [];
    if (["uuid", "string", "date", "double", "integer"].includes(fieldType.toString()))
    {
      result.push("'"+fieldName+"' => array(");
      result.push(this.tab + "'bail',");
      result.push(this.tab + "'required',");
      result.push(this.tab + "'"+fieldType+"',");
      result.push("),");
    }
    else if (isObjectType(fieldType) && fieldType.type === "enum")
    {
      this.imports.push("Illuminate\\Validation\\Rule");

      result.push("'"+fieldName+"' => array(");
      result.push(this.tab + "'bail',");
      result.push(this.tab + "'required',");
      result.push(this.tab + "Rule::in(array(" + fieldType.enumItems?.map(e => `'${e}'`).join() + "))");
      result.push("),");
    }
    else if (isObjectType(fieldType))
    {
      result.push("'"+fieldName+"' => array(");
      result.push(this.tab + "'bail',");
      result.push(this.tab + "'" + (fieldType.required ? "required" : "nullable") + "',");
      result.push(this.tab + "'"+fieldType.type+"',");
      result.push("),");
    }
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