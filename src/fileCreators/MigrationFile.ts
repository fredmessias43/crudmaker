import { format } from "date-fns";
import { Entity } from "../models/Entity";
import { PhpFile } from "./PhpFile";

export class MigrationFile extends PhpFile {
  protected upFunction: string[];
  protected downFunction: string[];

  constructor(entity: Entity) {
    super(entity);

    this.namespace = "database\\migrations";
    this.imports = [
      "Illuminate\\Database\\Migrations\\Migration;",
      "Illuminate\\Database\\Schema\\Blueprint;",
      "Illuminate\\Support\\Facades\\Schema;",
    ];
    this.extendsClauses = [
      "Migration"
    ];
    
    //
    
    this.className = "Create" + this.entity.getEntityName("pascalCase") + "Table";

    this.upFunction = this.fillUpFunction();
    this.downFunction = this.fillDownFunction();
  }

  protected getFileName() : string
  {
    const date = format(new Date(), "yyyy_MM_dd_HHmmss");

    return date +  "_create_" +  this.entity.getTableName() + "_table" + ".php";
  }

  fillUpFunction() {
    let result: string[] = [];
    result.push("/**");
    result.push(" * Run the migrations.");
    result.push(" *");
    result.push(" * @return void");
    result.push(" */");
    result.push("public function up()");
    result.push("{");
    result.push(this.tab + "Schema::create('" + this.entity.getTableName() + "', function (Blueprint $table) {");
    result.push(this.tab + this.tab + "$table->id();");

    const entityFieldArray = Object.values(this.entity.fields);
    for (const field of entityFieldArray) {
      result.push(this.tab + this.tab + "$table->" + field.type + "('" + field.name + "');");
    }

    result.push(this.tab + "});");
    result.push("}");
    return result;
  }

  fillDownFunction() {
    let result: string[] = [];
    result.push("/**");
    result.push(" * Reverse the migrations.");
    result.push(" *");
    result.push(" * @return void");
    result.push(" */");
    result.push("public function down(): void");
    result.push("{");
    result.push(this.tab + "Schema::dropIfExists('" + this.entity.getTableName() + "');");
    result.push("}");
    return result;
  }

  protected getUpFunction() {
    return this.upFunction.reduce((previous, current, index, array) => previous + this.tab + current + this.lineBreak, "");
  }
  
  protected getDownFunction() {
    return this.downFunction.reduce((previous, current, index, array) => previous + this.tab + current + this.lineBreak, "");
  }

  protected getContentLine() {
    let result: string[] = [];
    result.push(this.getUpFunction());
    result.push("");
    result.push(this.getDownFunction());
    return result.join(this.lineBreak);
  }
}