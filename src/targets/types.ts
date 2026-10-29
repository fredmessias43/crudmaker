/**
 * Política de escrita de um arquivo gerado:
 * - `overwrite`: o arquivo é sempre regravado (camada gerada);
 * - `create-once`: só é criado se ainda não existir (camada de customização: código que passa a ser do usuário).
 *   Nenhuma opção da CLI sobrescreve um arquivo `create-once` que já existe.
 */
export type FilePolicy = "overwrite" | "create-once";

/** Trecho que todo arquivo da camada gerada carrega no cabeçalho; o apagamento de órfãos só age em arquivos que o têm. */
export const GENERATED_MARKER = "ARQUIVO GERADO PELO CRUDMAKER";

export type GeneratedFile = {
  /** Caminho relativo à raiz do projeto Laravel de destino (separador `/`). */
  path: string;
  content: string;
  policy: FilePolicy;
  /**
   * Só nos arquivos `create-once` que estendem uma classe base gerada: a base que a classe deve estender.
   * Serve para avisar quando um arquivo preservado (de uma versão antiga do crudmaker) não a estende.
   */
  generatedBase?: { fqcn: string; path: string };
};

/**
 * Arquivo de uma entidade que saiu do manifest (derivado do `manifest-lock.json` anterior):
 * - `generated`: camada gerada (base), que o crudmaker pode apagar;
 * - `custom`: camada de customização (classe final), que é do usuário e só é listada;
 * - `migration`: migration de criação da tabela, que nunca é apagada.
 *
 * É só uma lista de caminhos *possíveis*: quem grava confere o que existe no disco.
 */
export type ObsoleteFile = {
  path: string;
  kind: "generated" | "custom" | "migration";
};
