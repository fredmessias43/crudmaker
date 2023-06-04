import { Entity } from "../models/Entity";
import { PhpFile } from "./PhpFile";

export class ControllerFile extends PhpFile {
  protected indexFunction: string[];

  constructor(entity: Entity) {
    super(entity);

    this.namespace = "Brasidata\\" + "Homefy" + "\\Http\\Controllers\\Api";
    this.imports = [
      "App\\Http\\Controllers\\Controller",
      "Brasidata\\Homefy\\Models\\" + this.entity.getEntityName("pascalCase") + "",
      "Brasidata\\Homefy\\Http\\Requests\\" + this.entity.getEntityName("pascalCase") + "Request",
      "Brasidata\\Homefy\\Http\\Resources\\" + this.entity.getEntityName("pascalCase") + "Collection",
      "Brasidata\\Homefy\\Http\\Resources\\" + this.entity.getEntityName("pascalCase") + " as " + this.entity.getEntityName("pascalCase") + "Resource",
      "Brasidata\\Base\\Exceptions\\FatalSystemControllerError",
    ];
    this.extendsClauses = ["Controller"];
    this.className = this.entity.getEntityName("pascalCase") + "Controller";

    //
    this.indexFunction = this.fillIndexFunction();
  }
  
  protected fillIndexFunction()
  {
    const camelCase = this.entity.getEntityName("camelCase");
    const pascalCase = this.entity.getEntityName("pascalCase");
    let result: string[] = [];
    result.push("/**");
    result.push(" * Display a listing of the resource.");
    result.push(" *");
    result.push(" * @return \\Illuminate\\Http\\Response");
    result.push(" */");
    result.push("public function index()");
    result.push("{");
    result.push(this.tab + "try");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "$" + camelCase + " = " + pascalCase + "::all();");
    result.push("");
    result.push(this.tab + this.tab + "return response()->json([");
    result.push(this.tab + this.tab + this.tab + "'status' => 200,");
    result.push(this.tab + this.tab + this.tab + "'data' => new " + pascalCase + "Collection($" + camelCase + "),");
    result.push(this.tab + this.tab + "], 200);");
    result.push(this.tab + "}");
    result.push(this.tab + "catch(Throwable $th)");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "throw new FatalSystemControllerError($th, '" + pascalCase + " can not be listed.');");
    result.push(this.tab + "}");
    result.push("}");
    return result;
  }

  protected getIndexFunction()
  {
    return this.indexFunction.reduce( (previous, current, index, array) => previous + this.tab + current + this.lineBreak , "");
  }

  protected getContentLine()
  {
    let result: string[] = [];
    result.push(this.getIndexFunction());
    return result.join(this.lineBreak);
  }
}