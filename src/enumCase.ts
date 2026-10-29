import { pascalCase } from "change-case";

/** Identificador válido de `case` do PHP: letra ou `_` no começo, depois letras, dígitos e `_` (letras Unicode valem). */
const CASE_IDENTIFIER = /^[\p{L}_][\p{L}\p{N}_]*$/u;

/**
 * Nome do `case` PHP de um item do enum: o item em PascalCase (`in_progress` → `InProgress`, `em análise` → `EmAnálise`).
 * Devolve `undefined` se o resultado não é um identificador válido (`2fa`, texto só de símbolos) ou é `Class`,
 * que o PHP não aceita como nome de case.
 */
export function enumCaseName(item: string): string | undefined {
  const name = pascalCase(item);
  if (!CASE_IDENTIFIER.test(name) || name.toLowerCase() === "class") return undefined;
  return name;
}
