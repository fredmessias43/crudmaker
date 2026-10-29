import fs from "fs";
import path from "path";
import { buildJsonSchema } from "../src/manifestSchema";

const target = path.join(__dirname, "../schema/manifest.schema.json");
fs.writeFileSync(target, JSON.stringify(buildJsonSchema(), null, 2) + "\n");
console.log(`JSON Schema gravado em ${target}`);
