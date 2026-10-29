import fs from "fs";
import path from "path";
import { parseAllDocuments } from "yaml";

/** Erro esperado (entrada inválida do usuário): a CLI mostra só a mensagem, sem stack trace. */
export class UserError extends Error {}

/** Extensões aceitas para o manifest, por formato. */
export const manifestExtensions = { yaml: [".yaml", ".yml"], json: [".json"] };

export const acceptedExtensionsText = [...manifestExtensions.yaml, ...manifestExtensions.json].join(", ");

/** Formato do manifest segundo a extensão do arquivo (ou `undefined` se não for suportada). */
export function manifestFormat(filePath: string): "yaml" | "json" | undefined {
  const ext = path.extname(filePath).toLowerCase();
  if (manifestExtensions.yaml.includes(ext)) return "yaml";
  if (manifestExtensions.json.includes(ext)) return "json";
  return undefined;
}

function parseJson(text: string, filePath: string): { [key: string]: any } {
  try {
    return JSON.parse(text);
  } catch (e: any) {
    throw new UserError(`JSON inválido em ${filePath}: ${e.message}`);
  }
}

/**
 * Faz o parse de YAML 1.2 (schema core, sem tags customizadas). Aceita um único documento
 * e exige um mapa no topo; o restante (estrutura, tipos) fica por conta da validação do manifest.
 */
function parseYaml(text: string, filePath: string): { [key: string]: any } {
  const docs = parseAllDocuments(text);

  for (const doc of docs) {
    const error = doc.errors[0];
    if (error) {
      const pos = error.linePos?.[0];
      const where = pos ? `${filePath}:${pos.line}:${pos.col}` : filePath;
      // a lib já anexa " at line L, column C:" à mensagem; a posição vai no prefixo
      const reason = error.message.split("\n")[0].replace(/ at line \d+, column \d+:?$/, "");
      throw new UserError(`YAML inválido em ${where}: ${reason}`);
    }
  }

  if (docs.length > 1) {
    throw new UserError(`${filePath} tem ${docs.length} documentos YAML (separados por "---"); o manifest deve ter um só.`);
  }

  const value = docs.length === 1 ? docs[0].toJS() : null;

  if (value === null || value === undefined) {
    throw new UserError(`O manifest ${filePath} está vazio.`);
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    const found = Array.isArray(value) ? "uma lista" : "um valor simples";
    throw new UserError(`O manifest ${filePath} deve ser um mapa (system, pkg...) na raiz, mas é ${found}.`);
  }
  return value;
}

/**
 * Ponto único de leitura do manifest: recebe o caminho e devolve o objeto cru.
 * O formato (YAML ou JSON) vem da extensão do arquivo.
 */
export function readManifest(filePath: string): { [key: string]: any } {
  const format = manifestFormat(filePath);
  if (!format) {
    const ext = path.extname(filePath);
    throw new UserError(
      `Extensão ${ext ? `"${ext}"` : "(nenhuma)"} não suportada em ${filePath}. Use um destes: ${acceptedExtensionsText}.`,
    );
  }

  let text: string;
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch (e: any) {
    if (e.code === "ENOENT") throw new UserError(`Manifest não encontrado: ${filePath}`);
    throw new UserError(`Não foi possível ler o manifest ${filePath}: ${e.message}`);
  }

  return format === "yaml" ? parseYaml(text, filePath) : parseJson(text, filePath);
}
