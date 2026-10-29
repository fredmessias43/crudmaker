import fs from "fs";
import path from "path";
import { GeneratedFile } from "./generate";

/**
 * O que acontece com um arquivo ao gravar:
 * - `created`: não existia, será criado;
 * - `overwritten`: existia, a política é `overwrite` e o conteúdo muda;
 * - `unchanged`: existia, a política é `overwrite` e o conteúdo já é idêntico (nada a gravar);
 * - `preserved`: existia e a política é `create-once`, então é mantido como está.
 */
export type WriteAction = "created" | "overwritten" | "unchanged" | "preserved";

export type PlannedWrite = {
  file: GeneratedFile;
  /** Caminho absoluto (ou relativo ao cwd, se `baseDir` for relativo) do destino. */
  fullPath: string;
  action: WriteAction;
};

/**
 * Plano de escrita: só lê o disco, nunca escreve. É a única fonte da classificação,
 * usada tanto pelo `--dry-run` quanto pela escrita real, para as duas nunca divergirem.
 */
export function planWrites(files: GeneratedFile[], baseDir: string): PlannedWrite[] {
  return files.map((file) => {
    const fullPath = path.join(baseDir, file.path);
    let action: WriteAction;

    if (!fs.existsSync(fullPath)) {
      action = "created";
    } else if (file.policy === "create-once") {
      action = "preserved";
    } else if (fs.readFileSync(fullPath, "utf8") === file.content) {
      action = "unchanged";
    } else {
      action = "overwritten";
    }

    return { file, fullPath, action };
  });
}

/**
 * Camada de escrita: executa o plano, criando as pastas necessárias.
 * Só grava `created` e `overwritten`. Não imprime nada; quem chama decide o que mostrar.
 */
export function applyPlan(plan: PlannedWrite[]): void {
  for (const item of plan) {
    if (item.action !== "created" && item.action !== "overwritten") continue;

    fs.mkdirSync(path.dirname(item.fullPath), { recursive: true });
    fs.writeFileSync(item.fullPath, item.file.content);
  }
}

/** Atalho: planeja e grava, devolvendo o plano executado. */
export function writeFiles(files: GeneratedFile[], baseDir: string): PlannedWrite[] {
  const plan = planWrites(files, baseDir);
  applyPlan(plan);
  return plan;
}
