import { Entity } from "../models/Entity";
import { PhpFile } from "./PhpFile";
import { pascalCase } from "change-case";

export class ControllerFile extends PhpFile {
  protected indexFunction: string[];
  protected storeFunction: string[];
  protected showFunction: string[];
  protected updateFunction: string[];
  protected destroyFunction: string[];

  constructor(entity: Entity) {
    super(entity);

    this.namespace = this.baseNamespace + "\\Http\\Controllers\\Api";
    this.imports = [
      "App\\Http\\Controllers\\Controller",
      this.baseNamespace + "\\Models\\" + this.entity.getEntityName("pascalCase") + "",
      this.baseNamespace + "\\Http\\Requests\\" + this.entity.getEntityName("pascalCase") + "Request",
      this.baseNamespace + "\\Http\\Resources\\" + this.entity.getEntityName("pascalCase") + "Collection",
      this.baseNamespace + "\\Http\\Resources\\" + this.entity.getEntityName("pascalCase") + " as " + this.entity.getEntityName("pascalCase") + "Resource",
      // this.baseNamespace + "\\Exceptions\\Exception",
    ];
    this.extendsClauses = ["Controller"];
    this.className = this.entity.getEntityName("pascalCase") + "Controller";

    //
    this.indexFunction = this.fillIndexFunction();
    this.storeFunction = this.fillStoreFunction();
    this.showFunction = this.fillShowFunction();
    this.updateFunction = this.fillUpdateFunction();
    this.destroyFunction = this.fillDestroyFunction();
  }
  
  protected fillIndexFunction()
  {
    const camelCaseEntity = this.entity.getEntityName("camelCase");
    const pascalCaseEntity = this.entity.getEntityName("pascalCase");
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
    result.push(this.tab + this.tab + "$" + camelCaseEntity + " = " + pascalCaseEntity + "::all();");
    result.push("");
    result.push(this.tab + this.tab + "return response()->json([");
    result.push(this.tab + this.tab + this.tab + "'status' => 200,");
    result.push(this.tab + this.tab + this.tab + "'data' => new " + pascalCaseEntity + "Collection($" + camelCaseEntity + "),");
    result.push(this.tab + this.tab + "], 200);");
    result.push(this.tab + "}");
    result.push(this.tab + "catch(\\Throwable $th)");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "throw new Exception(" + pascalCaseEntity + " can not be listed.', 500);");
    result.push(this.tab + "}");
    result.push("}");
    return result;
  }

  protected fillStoreFunction()
  {
    const camelCaseEntity = this.entity.getEntityName("camelCase");
    const pascalCaseEntity = this.entity.getEntityName("pascalCase");
    let result: string[] = [];
    result.push("/**");
    result.push(" * Store a newly created resource in storage.");
    result.push(" *");
    result.push(" * @param  \\" + this.baseNamespace + "\\Http\\Requests\\" + pascalCaseEntity + "Request $request");
    result.push(" *");
    result.push(" * @return \\Illuminate\\Http\\Response");
    result.push(" */");
    result.push("public function store(" + pascalCaseEntity + "Request $request)");
    result.push("{");
    result.push(this.tab + "try");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "$" + camelCaseEntity + " = new " + pascalCaseEntity + ";");

    const entityFieldArray = Object.entries(this.entity.fields);
    for (const element of entityFieldArray)
    {
      const [name, type] = element;

      result.push(this.tab + this.tab + "$" + camelCaseEntity + "->" + name + " = $request->input('" + name + "');");
    }

    result.push(this.tab + this.tab + "$" + camelCaseEntity + "->save();");
    result.push("");
    result.push(this.tab + this.tab + "return response()->json([");
    result.push(this.tab + this.tab + this.tab + "'status' => 201,");
    result.push(this.tab + this.tab + this.tab + "'message' => trans('" + pascalCaseEntity + " created successfully.'),");
    result.push(this.tab + this.tab + this.tab + "'data' => new " + pascalCaseEntity + "Resource($" + camelCaseEntity + "),");
    result.push(this.tab + this.tab + "], 201);");
    result.push(this.tab + "}");
    result.push(this.tab + "catch (Throwable $th)");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "throw new Exception(" + pascalCaseEntity + " can not be created.', 500);");
    result.push(this.tab + "}");
    result.push("}");
    return result;
  }

  protected fillShowFunction()
  {
    const camelCaseEntity = this.entity.getEntityName("camelCase");
    const pascalCaseEntity = this.entity.getEntityName("pascalCase");
    let result: string[] = [];
    result.push("/**");
    result.push(" * Display the specified resource.");
    result.push(" *");
    result.push(" * @param  \\" + this.baseNamespace + "\\Models\\"+pascalCaseEntity+" $"+camelCaseEntity+"");
    result.push(" *");
    result.push(" * @return \\Illuminate\\Http\\Response");
    result.push(" */");
    result.push("public function show("+pascalCaseEntity+" $"+camelCaseEntity+")");
    result.push("{");
    result.push(this.tab + "try");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "return response()->json([");
    result.push(this.tab + this.tab + this.tab + "'status' => 200,");
    result.push(this.tab + this.tab + this.tab + "'data' => new "+pascalCaseEntity+"Resource($"+camelCaseEntity+"),");
    result.push(this.tab + this.tab + "], 200);");
    result.push(this.tab + "}");
    result.push(this.tab + "catch(\\Throwable $th)");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "throw new Exception("+pascalCaseEntity+" can not be shown.', 500);");
    result.push(this.tab + "}");
    result.push("}");
    return result;
  }

  protected fillUpdateFunction()
  {
    const camelCaseEntity = this.entity.getEntityName("camelCase");
    const pascalCaseEntity = this.entity.getEntityName("pascalCase");
    let result: string[] = [];
    result.push("/**");
    result.push(" * Update the specified resource in storage.");
    result.push(" *");
    result.push(" * @param  \\" + this.baseNamespace + "\\Http\\Requests\\" + pascalCaseEntity + "Request $request");
    result.push(" *");
    result.push(" * @return \\Illuminate\\Http\\Response");
    result.push(" */");
    result.push("public function update("+pascalCaseEntity+"Request $request, "+pascalCaseEntity+" $"+camelCaseEntity+")");
    result.push("{");
    result.push(this.tab + "try");
    result.push(this.tab + "{");

    const entityFieldArray = Object.entries(this.entity.fields);
    for (const entity of entityFieldArray)
    {
      const [name, type] = entity;

      result.push(this.tab + this.tab + "$" + camelCaseEntity + "->" + name + " = $request->input('" + name + "');");
    }

    result.push(this.tab + this.tab + "$" + camelCaseEntity + "->save();");
    result.push("");
    result.push(this.tab + this.tab + "return response()->json([");
    result.push(this.tab + this.tab + this.tab + "'status' => 201,");
    result.push(this.tab + this.tab + this.tab + "'message' => trans('" + pascalCaseEntity + " updated successfully.'),");
    result.push(this.tab + this.tab + this.tab + "'data' => new " + pascalCaseEntity + "Resource($" + camelCaseEntity + "),");
    result.push(this.tab + this.tab + "], 201);");
    result.push(this.tab + "}");
    result.push(this.tab + "catch (Throwable $th)");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "throw new Exception(" + pascalCaseEntity + " can not be updated.', 500);");
    result.push(this.tab + "}");
    result.push("}");
    return result;
  }

  protected fillDestroyFunction()
  {
    const camelCaseEntity = this.entity.getEntityName("camelCase");
    const pascalCaseEntity = this.entity.getEntityName("pascalCase");
    let result: string[] = [];
    result.push("/**");
    result.push(" * Remove the specified resource from storage.");
    result.push(" *");
    result.push(" * @param  \\" + this.baseNamespace + "\\Models\\"+pascalCaseEntity+" $"+camelCaseEntity+"");
    result.push(" *");
    result.push(" * @return \\Illuminate\\Http\\Response");
    result.push(" */");
    result.push("public function destroy("+pascalCaseEntity+" $"+camelCaseEntity+")");
    result.push("{");
    result.push(this.tab + "try");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "$"+camelCaseEntity+"->delete();");
    result.push("");
    result.push(this.tab + this.tab + "return response()->json([");
    result.push(this.tab + this.tab + this.tab + "'status' => 204,");
    result.push(this.tab + this.tab + this.tab + "'message' => trans('"+pascalCaseEntity+" deleted successfully.'),");
    result.push(this.tab + this.tab + this.tab + "'data' => new "+pascalCaseEntity+"Resource($"+camelCaseEntity+"),");
    result.push(this.tab + this.tab + "], 204);");
    result.push(this.tab + "}");
    result.push(this.tab + "catch(\\Throwable $th)");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "throw new Exception("+pascalCaseEntity+" can not be deleted.', 500);");
    result.push(this.tab + "}");
    result.push("}");
    return result;
  }

  protected getIndexFunction()
  {
    return this.indexFunction.reduce( (previous, current, index, array) => previous + this.tab + current + this.lineBreak , "");
  }

  protected getStoreFunction()
  {
    return this.storeFunction.reduce( (previous, current, index, array) => previous + this.tab + current + this.lineBreak , "");
  }

  protected getShowFunction()
  {
    return this.showFunction.reduce( (previous, current, index, array) => previous + this.tab + current + this.lineBreak , "");
  }

  protected getUpdateFunction()
  {
    return this.updateFunction.reduce( (previous, current, index, array) => previous + this.tab + current + this.lineBreak , "");
  }

  protected getDestroyFunction()
  {
    return this.destroyFunction.reduce( (previous, current, index, array) => previous + this.tab + current + this.lineBreak , "");
  }

  protected getContentLine()
  {
    let result: string[] = [];
    result.push(this.getIndexFunction());
    result.push("");
    result.push(this.getStoreFunction());
    result.push("");
    result.push(this.getShowFunction());
    result.push("");
    result.push(this.getUpdateFunction());
    result.push("");
    result.push(this.getDestroyFunction());
    return result.join(this.lineBreak);
  }
}