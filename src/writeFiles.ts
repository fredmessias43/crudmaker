import fs from "fs";
import path from "path";
import { GeneratedFile } from "./generate";

/**
 * Camada de escrita: grava no disco os arquivos devolvidos por `generate`,
 * criando as pastas necessárias. Arquivos `create-once` que já existem são mantidos.
 */
export function writeFiles(files: GeneratedFile[], baseDir: string): void {
  for (const file of files) {
    const fullPath = path.join(baseDir, file.path);

    if (file.policy === "create-once" && fs.existsSync(fullPath)) {
      console.log("File Skipped: " + fullPath);
      continue;
    }

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, file.content);

    console.log("File Created: " + fullPath);
  }
}
