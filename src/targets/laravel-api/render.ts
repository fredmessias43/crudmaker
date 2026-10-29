import path from "path";
import { Eta } from "eta";

/**
 * Pasta dos templates embutidos. Fica na raiz do pacote (`templates/laravel-api`), e o caminho
 * relativo vale tanto para o código-fonte (`src/targets/laravel-api`) quanto para o compilado
 * (`dist/targets/laravel-api`), já que `dist/` espelha `src/`.
 */
export const templatesDir = path.resolve(__dirname, "../../../templates/laravel-api");

/**
 * Motor de templates. Configuração pensada para a saída ser byte a byte previsível:
 * - `autoTrim: false`: nenhum espaço ou quebra de linha é removido implicitamente;
 * - `autoEscape: false`: o que se imprime é PHP, não HTML;
 * - cada tag de controle fica sozinha na linha e termina em `-%>`, que remove só a quebra de linha
 *   que a segue. Tags de saída (`<%~ ... %>`) ficam no meio da linha e não mexem em nada.
 */
const eta = new Eta({ views: templatesDir, autoTrim: false, autoEscape: false, cache: true });

/** Renderiza `templates/laravel-api/<name>.php.eta` com `data` disponível como `it`. */
export function renderTemplate(name: string, data: object): string {
  return eta.render(`${name}.php.eta`, data);
}
