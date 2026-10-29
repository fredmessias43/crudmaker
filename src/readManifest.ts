import fs from "fs";

/** Erro esperado (entrada inválida do usuário): a CLI mostra só a mensagem, sem stack trace. */
export class UserError extends Error {}

/**
 * Ponto único de leitura do manifest: recebe o caminho e devolve o objeto cru.
 * Hoje só aceita JSON; o suporte a YAML entra aqui.
 */
export function readManifest(filePath: string): { [key: string]: any } {
  let text: string;
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch (e: any) {
    if (e.code === "ENOENT") throw new UserError(`Manifest não encontrado: ${filePath}`);
    throw new UserError(`Não foi possível ler o manifest ${filePath}: ${e.message}`);
  }

  try {
    return JSON.parse(text);
  } catch (e: any) {
    throw new UserError(`JSON inválido em ${filePath}: ${e.message}`);
  }
}
