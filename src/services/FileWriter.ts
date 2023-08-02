import { PhpFile } from "../fileCreators/PhpFile";
import { Entity } from "../models/Entity";
import { writeFileSync } from "fs";

class FileWriter {
  constructor(file: PhpFile, entity: Entity)
  {
    const fileStr = file.mountFile();

    writeFileSync(`./generated/${file.className}.php`, fileStr);
  }
}