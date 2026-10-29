/**
 * Falhas conhecidas do `php -l` na saída gerada das fixtures (`npm run lint:php`).
 *
 * Cada entrada é um problema REAL do gerador que ainda não foi corrigido: a checagem continua
 * detectando o erro (e o mostra como "conhecido"), mas não quebra a checagem. Regras:
 * - `file`: caminho `<fixture>/<caminho relativo do arquivo gerado>`;
 * - `reason`: o que é e qual ticket corrige;
 * - quando o ticket corrigir, REMOVA a entrada: a checagem falha se uma entrada deixar de falhar.
 * Não acrescente entradas para esconder um erro novo; corrija o gerador.
 *
 * Hoje a lista está vazia: o ticket 09 corrigiu o último problema conhecido (a entidade `class` da
 * fixture `curso`, que gerava `class Class`; agora a validação recusa nomes reservados e a fixture usa
 * `classroom`). O mecanismo continua aqui para falhas futuras.
 */
export const phpSyntaxAllowlist: { file: string; reason: string }[] = [];
