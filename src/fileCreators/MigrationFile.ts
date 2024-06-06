import { format } from "date-fns";
import { Entity } from "../models/Entity";
import { PhpFile } from "./PhpFile";
import fs from "fs";
import path from "path";

export class MigrationFile extends PhpFile {
  protected upFunction: string[];
  protected downFunction: string[];

  constructor(entity: Entity, pkgCode: string, systemCode: string) {
    super(entity, pkgCode, systemCode);

    this.namespace = "database\\migrations";
    this.imports = [
      "Illuminate\\Database\\Migrations\\Migration",
      "Illuminate\\Database\\Schema\\Blueprint",
      "Illuminate\\Support\\Facades\\Schema",
    ];
    this.extendsClauses = [
      "Migration"
    ];
    this.anonymousClass = true;
    //
    
    this.className = "Create" + this.entity.getEntityName("pascalCase") + "Table";

    this.upFunction = this.fillUpFunction();
    this.downFunction = this.fillDownFunction();
  }

  protected getFileName() : string
  {
    const basePath = path.join(__dirname, "../../generated/", this.pkgCode, "laravel",this.namespace.replace("App", "app")).replaceAll("\\", "/");
    const fileName = "_create_" + this.entity.getTableName() + "_table" + ".php";

    const files = fs.readdirSync(basePath);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.endsWith(fileName)) {
        return file;
      }
    }

    const date = format(new Date(), "yyyy_MM_dd_HHmmss");

    return date +  fileName;
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

    const entityFieldArray = Object.values(this.entity.fields);
    for (const field of entityFieldArray) {
      let line = this.tab + this.tab + "$table->" + field.type + "('" + field.name + "')";
      if (!field.required) {
        line += "->nullable()";
      }
      line += ";";
      result.push(line);
    }

    result.push(this.tab + this.tab + "$table->timestamps();");
    result.push(this.tab + this.tab + "$table->softDeletes();");

    for (const field of entityFieldArray) {
      if (field.unique) {
        result.push(this.tab + this.tab + "$table->unique('" + field.name + "');");
      }
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