/**
 * Política de escrita de um arquivo gerado:
 * - `overwrite`: o arquivo é sempre regravado;
 * - `create-once`: só é criado se ainda não existir (código que passa a ser do usuário).
 */
export type FilePolicy = "overwrite" | "create-once";

export type GeneratedFile = {
  /** Caminho relativo à raiz do projeto Laravel de destino (separador `/`). */
  path: string;
  content: string;
  policy: FilePolicy;
};
