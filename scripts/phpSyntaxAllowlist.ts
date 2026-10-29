/**
 * Falhas conhecidas do `php -l` na saída gerada das fixtures (`npm run lint:php`).
 *
 * Cada entrada é um problema REAL do gerador que ainda não foi corrigido: a checagem continua
 * detectando o erro (e o mostra como "conhecido"), mas não quebra a checagem. Regras:
 * - `file`: caminho `<fixture>/<caminho relativo do arquivo gerado>`;
 * - `reason`: o que é e qual ticket corrige;
 * - quando o ticket corrigir, REMOVA a entrada: a checagem falha se uma entrada deixar de falhar.
 * Não acrescente entradas para esconder um erro novo; corrija o gerador.
 */
export const phpSyntaxAllowlist: { file: string; reason: string }[] = [
  {
    file: "curso/app/Models/Class.php",
    reason:
      "A entidade `class` da fixture `curso` gera `class Class extends Model`; `class` é palavra reservada do PHP. Corrigir com a validação de palavras reservadas no ticket 09 (corrigir schema, migrations e validação).",
  },
  {
    file: "curso/app/Http/Controllers/Api/ClassController.php",
    reason:
      "`Class::all()` e `instanceof Class` pela entidade `class` (palavra reservada do PHP). Mesma causa e mesmo ticket 09 do `Class.php`.",
  },
  {
    file: "curso/app/Http/Requests/ClassRequest.php",
    reason:
      "`instanceof Class` pela entidade `class` (palavra reservada do PHP). Mesma causa e mesmo ticket 09 do `Class.php`.",
  },
  {
    file: "curso/app/Models/ClassLesson.php",
    reason:
      "Usa `Class::class` por causa da entidade `class` da fixture `curso` (palavra reservada do PHP). Mesma causa e mesmo ticket 09 do `Class.php`.",
  },
  {
    file: "curso/app/Models/Student.php",
    reason:
      "Usa `Class::class` por causa da entidade `class` da fixture `curso` (palavra reservada do PHP). Mesma causa e mesmo ticket 09 do `Class.php`.",
  },
];
