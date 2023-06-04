import { Entity } from "../models/Entity";
import { PhpFile } from "./PhpFile";

export class ControllerFile extends PhpFile {
  protected indexFunction: string[];
  protected storeFunction: string[];
  protected showFunction: string[];
  protected updateFunction: string[];
  protected destroyFunction: string[];

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
    this.storeFunction = this.fillStoreFunction();
    this.showFunction = this.fillShowFunction();
    this.updateFunction = this.fillUpdateFunction();
    this.destroyFunction = this.fillDestroyFunction();
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

  protected fillStoreFunction()
  {
    const camelCase = this.entity.getEntityName("camelCase");
    const pascalCase = this.entity.getEntityName("pascalCase");
    let result: string[] = [];
    result.push("/**");
    result.push(" * Store a newly created resource in storage.");
    result.push(" *");
    result.push(" * @param  \\Brasidata\\Homefy\\Http\\Requests\\" + pascalCase + "Request $request");
    result.push(" *");
    result.push(" * @return \\Illuminate\\Http\\Response");
    result.push(" */");
    result.push("public function store(" + pascalCase + "Request $request)");
    result.push("{");
    result.push(this.tab + "try");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "$" + camelCase + " = new " + pascalCase + ";");

    const entityFieldArray = Object.entries(this.entity.fields);
    for (let i = 0; i < entityFieldArray.length; i++)
    {
      const [name, type] = entityFieldArray[i];

      result.push(this.tab + this.tab + "$" + camelCase + "->" + name + " = $request->input('" + name + "');");
    }

    result.push(this.tab + this.tab + "$" + camelCase + "->save();");
    result.push("");
    result.push(this.tab + this.tab + "return response()->json([");
    result.push(this.tab + this.tab + this.tab + "'status' => 201,");
    result.push(this.tab + this.tab + this.tab + "'message' => trans('" + pascalCase + " created successfully.'),");
    result.push(this.tab + this.tab + this.tab + "'data' => new " + pascalCase + "Resource($" + camelCase + "),");
    result.push(this.tab + this.tab + "], 201);");
    result.push(this.tab + "}");
    result.push(this.tab + "catch (Throwable $th)");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "throw new FatalSystemControllerError($th, '" + pascalCase + " can not be created.');");
    result.push(this.tab + "}");
    result.push("}");
    return result;
  }

  protected fillShowFunction()
  {
    const camelCase = this.entity.getEntityName("camelCase");
    const pascalCase = this.entity.getEntityName("pascalCase");
    let result: string[] = [];
    result.push("/**");
    result.push(" * Display the specified resource.");
    result.push(" *");
    result.push(" * @param  \\Brasidata\\Homefy\\Models\\"+pascalCase+" $"+camelCase+"");
    result.push(" *");
    result.push(" * @return \\Illuminate\\Http\\Response");
    result.push(" */");
    result.push("public function show("+pascalCase+" $"+camelCase+")");
    result.push("{");
    result.push(this.tab + "try");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "return response()->json([");
    result.push(this.tab + this.tab + this.tab + "'status' => 200,");
    result.push(this.tab + this.tab + this.tab + "'data' => new "+pascalCase+"Resource($"+camelCase+"),");
    result.push(this.tab + this.tab + "], 200);");
    result.push(this.tab + "}");
    result.push(this.tab + "catch(Throwable $th)");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "throw new FatalSystemControllerError($th, '"+pascalCase+" can not be shown.');");
    result.push(this.tab + "}");
    result.push("}");
    return result;
  }

  protected fillUpdateFunction()
  {
    const camelCase = this.entity.getEntityName("camelCase");
    const pascalCase = this.entity.getEntityName("pascalCase");
    let result: string[] = [];
    result.push("/**");
    result.push(" * Update the specified resource in storage.");
    result.push(" *");
    result.push(" * @param  \\Brasidata\\Homefy\\Http\\Requests\\" + pascalCase + "Request $request");
    result.push(" *");
    result.push(" * @return \\Illuminate\\Http\\Response");
    result.push(" */");
    result.push("public function update("+pascalCase+"Request $request, "+pascalCase+" $"+camelCase+")");
    result.push("{");
    result.push(this.tab + "try");
    result.push(this.tab + "{");

    const entityFieldArray = Object.entries(this.entity.fields);
    for (let i = 0; i < entityFieldArray.length; i++)
    {
      const [name, type] = entityFieldArray[i];

      result.push(this.tab + this.tab + "$" + camelCase + "->" + name + " = $request->input('" + name + "');");
    }

    result.push(this.tab + this.tab + "$" + camelCase + "->save();");
    result.push("");
    result.push(this.tab + this.tab + "return response()->json([");
    result.push(this.tab + this.tab + this.tab + "'status' => 201,");
    result.push(this.tab + this.tab + this.tab + "'message' => trans('" + pascalCase + " updated successfully.'),");
    result.push(this.tab + this.tab + this.tab + "'data' => new " + pascalCase + "Resource($" + camelCase + "),");
    result.push(this.tab + this.tab + "], 201);");
    result.push(this.tab + "}");
    result.push(this.tab + "catch (Throwable $th)");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "throw new FatalSystemControllerError($th, '" + pascalCase + " can not be updated.');");
    result.push(this.tab + "}");
    result.push("}");
    return result;
  }

  protected fillDestroyFunction()
  {
    const camelCase = this.entity.getEntityName("camelCase");
    const pascalCase = this.entity.getEntityName("pascalCase");
    let result: string[] = [];
    result.push("/**");
    result.push(" * Remove the specified resource from storage.");
    result.push(" *");
    result.push(" * @param  \\Brasidata\\Homefy\\Models\\"+pascalCase+" $"+camelCase+"");
    result.push(" *");
    result.push(" * @return \\Illuminate\\Http\\Response");
    result.push(" */");
    result.push("public function destroy("+pascalCase+" $"+camelCase+")");
    result.push("{");
    result.push(this.tab + "try");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "$"+camelCase+"->delete();");
    result.push("");
    result.push(this.tab + this.tab + "return response()->json([");
    result.push(this.tab + this.tab + this.tab + "'status' => 204,");
    result.push(this.tab + this.tab + this.tab + "'message' => trans('"+pascalCase+" deleted successfully.'),");
    result.push(this.tab + this.tab + this.tab + "'data' => new "+pascalCase+"Resource($"+camelCase+"),");
    result.push(this.tab + this.tab + "], 204);");
    result.push(this.tab + "}");
    result.push(this.tab + "catch(Throwable $th)");
    result.push(this.tab + "{");
    result.push(this.tab + this.tab + "throw new FatalSystemControllerError($th, '"+pascalCase+" can not be deleted.');");
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