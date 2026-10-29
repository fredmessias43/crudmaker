import { Entity } from "../models/Entity";

/**
 * Gera o arquivo de rotas (`routes/crudmaker.php`) com uma `apiResource` por entidade.
 *
 * Não estende `PhpFile`: aquela classe monta a casca de uma classe PHP (namespace, `class`, `{ }`),
 * e um arquivo de rotas é só uma lista de `use` e chamadas `Route::...`.
 *
 * O recurso da URL é o plural da tabela em kebab-case (`class_lessons` → `class-lessons`).
 * O Laravel singulariza o último segmento e troca `-` por `_` no parâmetro da rota
 * (`/class-lessons/{class_lesson}`), que é exatamente o nome que a `RequestFile` lê com
 * `$this->route('class_lesson')` e que o route model binding casa com `$classLesson` no controller.
 */
export class RoutesFile {
  protected tab = "\t";
  protected lineBreak = "\n";
  protected controllerNamespace = "App\\Http\\Controllers\\Api";

  /** Caminho relativo à raiz do projeto Laravel. */
  public static readonly relativePath = "routes/crudmaker.php";

  /** Linha de include que o `routes/api.php` precisa ter para carregar este arquivo. */
  public static readonly includeLine = "require __DIR__ . '/crudmaker.php';";

  constructor(protected entities: Entity[]) {}

  public getRelativePath(): string {
    return RoutesFile.relativePath;
  }

  /** Nome do recurso na URL: plural da tabela em kebab-case. */
  public static getResourceName(entity: Entity): string {
    return entity.getTableName().replaceAll("_", "-");
  }

  public mountFile(): string {
    const result: string[] = [];

    result.push("<?php");
    result.push("");
    result.push("// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.");
    result.push("// Rotas próprias ou ajustes ficam em routes/api.php (fora deste arquivo).");
    result.push("");

    const controllers = this.entities
      .map((entity) => `${this.controllerNamespace}\\${entity.getEntityName("pascalCase")}Controller`)
      .sort();
    for (const controller of controllers) result.push(`use ${controller};`);
    result.push("use Illuminate\\Support\\Facades\\Route;");
    result.push("");

    for (const entity of this.entities) {
      const resource = RoutesFile.getResourceName(entity);
      result.push(`Route::apiResource('${resource}', ${entity.getEntityName("pascalCase")}Controller::class);`);
    }
    result.push("");

    return result.join(this.lineBreak);
  }
}

/** Reconhece um `require`/`include` do arquivo gerado, tolerando espaços e aspas simples ou duplas. */
const includePattern = /\b(?:require|include)(?:_once)?\b[^;\n]*['"][^'"\n]*crudmaker\.php['"]/;

/**
 * Devolve o conteúdo do `routes/api.php` garantindo o include do arquivo gerado uma única vez.
 * Se já existe, devolve o texto idêntico; se falta, acrescenta ao final sem mexer no resto.
 */
export function ensureRoutesInclude(apiRoutes: string): string {
  if (includePattern.test(apiRoutes)) return apiRoutes;

  const base = apiRoutes.endsWith("\n") ? apiRoutes : apiRoutes + "\n";

  return base + "\n// Rotas geradas pelo crudmaker (routes/crudmaker.php).\n" + RoutesFile.includeLine + "\n";
}
