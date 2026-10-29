import fs from "fs";
import path from "path";
import vm from "vm";
import { Eta } from "eta";

/**
 * Pasta dos templates embutidos. Fica na raiz do pacote (`templates/laravel-api`), e o caminho
 * relativo vale tanto para o código-fonte (`src/targets/laravel-api`) quanto para o compilado
 * (`dist/targets/laravel-api`), já que `dist/` espelha `src/`.
 */
export const templatesDir = path.resolve(__dirname, "../../../templates/laravel-api");

/** Extensão dos arquivos de template (e de stub). */
export const templateExtension = ".php.eta";

/**
 * Motor de templates. Configuração pensada para a saída ser byte a byte previsível:
 * - `autoTrim: false`: nenhum espaço ou quebra de linha é removido implicitamente;
 * - `autoEscape: false`: o que se imprime é PHP, não HTML;
 * - cada tag de controle fica sozinha na linha e termina em `-%>`, que remove só a quebra de linha
 *   que a segue. Tags de saída (`<%~ ... %>`) ficam no meio da linha e não mexem em nada.
 */
const eta = new Eta({ views: templatesDir, autoTrim: false, autoEscape: false, cache: true });

/** Stubs do projeto: nome do template (ex.: `controller.base`) → conteúdo. Têm prioridade sobre os embutidos. */
export type Stubs = { [templateName: string]: string };

/** Conteúdo do template embutido `<name>.php.eta`. */
export function embeddedTemplate(name: string): string {
  return fs.readFileSync(path.join(templatesDir, `${name}${templateExtension}`), "utf8");
}

/** Linha (1-based) do template em que está o código que o V8 recusou, ou `null` se não der para achar. */
function failingLine(template: string): number | null {
  try {
    const compiled = eta.compileToString(template);
    new vm.Script(`(function (it) {${compiled}\n})`, { filename: "stub" });
  } catch (e: any) {
    const unclosed = /at line (\d+)/.exec(String(e?.message));
    if (unclosed) return Number(unclosed[1]);

    // O V8 mostra a linha do código compilado; o código de uma tag aparece igual (sem espaços nas pontas) no template.
    const codeLine = String(e?.stack ?? "").split("\n")[1]?.trim();
    if (codeLine) {
      const index = template.split("\n").findIndex((line) => line.includes(codeLine));
      if (index >= 0) return index + 1;
    }
  }
  return null;
}

/** Motivo curto de um erro do Eta: a mensagem do V8 em "Bad template syntax", ou a primeira linha. */
function reasonOf(e: any): string {
  const lines = String(e?.message ?? e).split("\n").map((line) => line.trim());
  if (lines[0] === "Bad template syntax") return lines.find((line, i) => i > 0 && line !== "") ?? lines[0];
  return lines[0].replace(/:$/, "");
}

/** Erro de template em uma linha, com o nome do stub e (na sintaxe) a linha; sem stack trace. */
function templateError(name: string, template: string, e: any, phase: "sintaxe" | "execução"): Error {
  const label = `Stub "${name}${templateExtension}"`;
  if (phase === "execução") {
    return new Error(`${label}: erro ao renderizar: ${reasonOf(e)}. Confira as variáveis (it.*) disponíveis em docs/como-usar.md.`);
  }
  const line = failingLine(template);
  return new Error(`${label}: erro de sintaxe${line ? ` na linha ${line}` : ""}: ${reasonOf(e)}`);
}

/** Confere a sintaxe de um stub sem renderizá-lo; lança erro claro (nome e linha) se estiver inválido. */
export function validateStub(name: string, content: string): void {
  try {
    eta.compile(content);
  } catch (e: any) {
    throw templateError(name, content, e, "sintaxe");
  }
}

/**
 * Renderiza o template `<name>` com `data` disponível como `it`. Se `stubs` tem um stub com esse nome,
 * ele é usado no lugar do template embutido (prioridade arquivo a arquivo).
 */
export function renderTemplate(name: string, data: object, stubs: Stubs = {}): string {
  const stub = stubs[name];
  if (stub === undefined) return eta.render(`${name}${templateExtension}`, data);

  try {
    return eta.renderString(stub, data);
  } catch (e: any) {
    throw templateError(name, stub, e, "execução");
  }
}
