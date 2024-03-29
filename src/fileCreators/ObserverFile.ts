import { Entity } from "../models/Entity";
import { PhpFile } from "./PhpFile";

export class ObserverFile extends PhpFile {
  protected creatingFunction: string[];

  constructor(entity: Entity, pkgCode: string, systemCode: string) {
    super(entity, pkgCode, systemCode);

    this.namespace = this.baseNamespace + "\\Observers";
    this.imports = [
      "Illuminate\\Support\\Str;",
      "App\\Models\\" + entity.getEntityName("pascalCase"),
    ];
    this.className = entity.getEntityName("pascalCase") + "Observer";

    //
    this.creatingFunction = this.fillCreatingFunction();
  }

  protected fillCreatingFunction()
  {
    const camelCase = this.entity.getEntityName("camelCase");
    const pascalCase = this.entity.getEntityName("pascalCase");
    let result: string[] = [];
    
    result.push("/**");
    result.push(" * Handle the " + pascalCase + " \"creating\" event.");
    result.push(" *");
    result.push(" * @param  App\\Models\\" + pascalCase + " $" + camelCase + "");
    result.push(" * @return void");
    result.push(" */");
    result.push("public function creating(" + pascalCase + " $" + camelCase + ") {");
    result.push("  if (!Str:: isUuid($" + camelCase + " -> id)) {");
    result.push("    $" + camelCase + " -> id = (string) Str:: uuid();");
    result.push("  }");
    result.push("}");
    
    return result;
  }

  protected getCreatingFunction()
  {
    return this.creatingFunction.reduce((previous, current, index, array) => previous + this.tab + current + this.lineBreak, "");
  }

  protected getContentLine() {
    let result: string[] = [];
    result.push(this.getCreatingFunction());
    return result.join(this.lineBreak);
  }
}