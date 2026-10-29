import fs from "fs";
import path from "path";
import { generate } from "./generate";
import { writeFiles } from "./writeFiles";

const manifestObj = JSON.parse(
  fs.readFileSync("./generated/curso/manifest.json", { encoding: "utf8" }),
);

const outputDir = path.join(__dirname, "../generated/", manifestObj.pkg.code);

const migrationsDir = path.join(outputDir, "database/migrations");
const existingMigrations = fs.existsSync(migrationsDir) ? fs.readdirSync(migrationsDir) : [];

const files = generate(manifestObj, {
  now: new Date(),
  existingMigrations,
});

writeFiles(files, outputDir);
