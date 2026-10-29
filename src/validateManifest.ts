import { pascalCase } from "change-case";
import { findCycles } from "./dependencyOrder";
import { INPUT_FIELD_TYPES, manifestSchema, ManifestInput, RelationItemInput } from "./manifestSchema";
import { normalizeNames } from "./normalizeNames";
import { UserError } from "./readManifest";

export type ManifestProblem = {
  /** Caminho real no arquivo, ex.: `pkg.entities.client.fields.email.type`. */
  path: string;
  message: string;
};

/** Manifest inválido: carrega TODOS os problemas encontrados, não só o primeiro. */
export class ManifestValidationError extends UserError {
  constructor(public readonly problems: ManifestProblem[]) {
    super(
      `manifest inválido (${problems.length} ${problems.length === 1 ? "problema" : "problemas"}):\n` +
      problems.map(formatProblem).map((line) => `  ${line}`).join("\n"),
    );
  }
}

export function formatProblem(problem: ManifestProblem): string {
  return problem.path ? `${problem.path}: ${problem.message}` : problem.message;
}

/** `["pkg", "entities", "a", "relationships", "hasMany", 0]` → `pkg.entities.a.relationships.hasMany[0]`. */
function formatPath(segments: PropertyKey[]): string {
  return segments.reduce<string>((acc, segment) => {
    if (typeof segment === "number") return `${acc}[${segment}]`;
    return acc === "" ? String(segment) : `${acc}.${String(segment)}`;
  }, "");
}

function describeValue(value: unknown): string {
  if (value === null) return "nulo";
  if (Array.isArray(value)) return "lista";
  switch (typeof value) {
    case "string": return "texto";
    case "number": return "número";
    case "boolean": return "booleano";
    case "object": return "objeto";
    default: return typeof value;
  }
}

const expectedLabels: { [key: string]: string } = {
  string: "texto",
  boolean: "verdadeiro/falso (true/false)",
  object: "objeto",
  array: "lista",
  number: "número",
};

/** Mensagens do zod em português, com o valor recebido. */
function messageFor(issue: any): string {
  switch (issue.code) {
    case "invalid_type":
      if (issue.input === undefined) return "campo obrigatório ausente";
      return `deve ser ${expectedLabels[issue.expected] ?? issue.expected}, recebido ${describeValue(issue.input)}`;
    case "too_small":
      if (issue.origin === "string") return "não pode ser vazio";
      return issue.message;
    case "invalid_value":
      // Só há dois enums no schema: tipos de campo e tipos de relacionamento.
      if ((issue.values as unknown[]).includes("uuid")) {
        return `tipo ${JSON.stringify(issue.input)} desconhecido (use um de: ${INPUT_FIELD_TYPES.join(", ")})`;
      }
      return `valor ${JSON.stringify(issue.input)} inválido (use um de: ${(issue.values as unknown[]).join(", ")})`;
    default:
      return issue.message;
  }
}

/**
 * Converte as issues do zod em problemas. Nos `union` (forma curta | forma longa) escolhe o ramo
 * pelo tipo do valor recebido, para o erro apontar para o lugar certo.
 */
function collectIssues(issues: any[], basePath: PropertyKey[], out: ManifestProblem[]): void {
  for (const issue of issues) {
    const path = [...basePath, ...issue.path];

    if (issue.code === "invalid_union") {
      const branches: any[][] = issue.errors;
      if (typeof issue.input === "string") {
        collectIssues(branches[0], path, out);
      } else if (issue.input !== null && typeof issue.input === "object" && !Array.isArray(issue.input) && branches[1]) {
        collectIssues(branches[1], path, out);
      } else if (issue.input === undefined) {
        out.push({ path: formatPath(path), message: "campo obrigatório ausente" });
      } else {
        out.push({ path: formatPath(path), message: `deve ser um texto ou um objeto, recebido ${describeValue(issue.input)}` });
      }
      continue;
    }

    out.push({ path: formatPath(path), message: messageFor(issue) });
  }
}

function relationTarget(item: RelationItemInput): string {
  return typeof item === "string" ? item : item.entity;
}

/** Campos enum sem `enumItems`. Roda com os nomes originais, para os caminhos baterem com o arquivo. */
function validateEnums(manifest: ManifestInput): ManifestProblem[] {
  const problems: ManifestProblem[] = [];

  for (const [entityName, entity] of Object.entries(manifest.pkg.entities)) {
    const base = `pkg.entities.${entityName}`;

    for (const [fieldKey, field] of Object.entries(entity.fields ?? {})) {
      const type = typeof field === "string" ? field : field.type;
      if (type !== "enum") continue;

      const items = typeof field === "string" ? undefined : field.enumItems;
      if (items && items.length > 0) continue;

      problems.push(
        typeof field === "string"
          ? { path: `${base}.fields.${fieldKey}`, message: `campo enum precisa de enumItems; use a forma { "type": "enum", "enumItems": [...] }` }
          : { path: `${base}.fields.${fieldKey}.enumItems`, message: items ? "campo enum precisa de ao menos um item" : "campo enum precisa de enumItems" },
      );
    }
  }

  return problems;
}

/**
 * Relacionamento apontando para entidade inexistente. Roda com os nomes já normalizados;
 * `originalEntityKeys` devolve o caminho real da entidade no arquivo.
 */
function validateRelationshipTargets(manifest: ManifestInput, originalEntityKeys: { [normalized: string]: string }): ManifestProblem[] {
  const problems: ManifestProblem[] = [];
  const entities = manifest.pkg.entities;
  const entityNames = Object.keys(entities);

  for (const [entityName, entity] of Object.entries(entities)) {
    const base = `pkg.entities.${originalEntityKeys[entityName] ?? entityName}`;

    // `owned` e `morphed` só marcam a entidade (não geram relacionamento).
    for (const [relation, list] of Object.entries(entity.relationships ?? {})) {
      if (relation === "owned" || relation === "morphed" || !Array.isArray(list)) continue;

      list.forEach((item, index) => {
        const target = relationTarget(item);
        if (entityNames.includes(target)) return;

        problems.push({
          path: `${base}.relationships.${relation}[${index}]${typeof item === "string" ? "" : ".entity"}`,
          message: `entidade ${JSON.stringify(target)} não existe em pkg.entities (entidades: ${entityNames.join(", ")})`,
        });
      });
    }
  }

  return problems;
}

/**
 * Palavras reservadas do PHP 8 (https://www.php.net/manual/pt_BR/reserved.keywords.php) e nomes de
 * classe reservados (https://www.php.net/manual/pt_BR/reserved.classes.php e tipos nativos). Em minúsculas:
 * o PHP não diferencia maiúsculas nessas palavras, então `Class` também é inválido como nome de classe.
 */
const PHP_RESERVED_WORDS = new Set([
  "__halt_compiler", "abstract", "and", "array", "as", "break", "callable", "case", "catch", "class", "clone",
  "const", "continue", "declare", "default", "die", "do", "echo", "else", "elseif", "empty", "enddeclare",
  "endfor", "endforeach", "endif", "endswitch", "endwhile", "eval", "exit", "extends", "final", "finally",
  "fn", "for", "foreach", "function", "global", "goto", "if", "implements", "include", "include_once",
  "instanceof", "insteadof", "interface", "isset", "list", "match", "namespace", "new", "or", "print",
  "private", "protected", "public", "readonly", "require", "require_once", "return", "static", "switch",
  "throw", "trait", "try", "unset", "use", "var", "while", "xor", "yield",
  // nomes de classe reservados (tipos nativos e especiais)
  "bool", "false", "float", "int", "iterable", "mixed", "never", "null", "object", "parent", "self", "string",
  "true", "void",
]);

/**
 * Regras por entidade, com os nomes já normalizados: precisa de um campo `id` (a model usa chave string
 * e a migration só marca `primary()` a coluna chamada `id`) e o nome não pode gerar uma classe com
 * palavra reservada do PHP (`class` → `class Class`).
 */
function validateEntities(manifest: ManifestInput, originalEntityKeys: { [normalized: string]: string }): ManifestProblem[] {
  const problems: ManifestProblem[] = [];

  for (const [entityName, entity] of Object.entries(manifest.pkg.entities)) {
    const base = `pkg.entities.${originalEntityKeys[entityName] ?? entityName}`;

    const hasId = Object.entries(entity.fields ?? {}).some(([key, field]) => (typeof field === "string" ? key : field.name ?? key) === "id");
    if (!hasId) {
      problems.push({
        path: entity.fields === undefined ? base : `${base}.fields`,
        message: `a entidade ${JSON.stringify(entityName)} não tem o campo "id"; declare "id": "uuid" (a model usa chave uuid e a migration só cria a chave primária nesse campo)`,
      });
    }

    const className = pascalCase(entityName);
    if (PHP_RESERVED_WORDS.has(className.toLowerCase())) {
      problems.push({
        path: base,
        message: `o nome gera a classe "${className}", que é palavra reservada do PHP; renomeie a entidade (ex.: "${entityName}Item")`,
      });
    }
  }

  return problems;
}

/**
 * Ciclo de FK (A belongsTo B e B belongsTo A): nenhuma ordem de migrations cria as duas tabelas
 * com as FKs já apontando para uma tabela existente. Auto-referência não conta.
 * Roda com os nomes já normalizados.
 */
function validateForeignKeyCycles(manifest: ManifestInput, originalEntityKeys: { [normalized: string]: string }): ManifestProblem[] {
  const entities = manifest.pkg.entities;
  const belongsTo = (name: string) => entities[name].relationships?.belongsTo ?? [];
  const cycles = findCycles(
    Object.keys(entities).map((name) => ({ id: name, dependsOn: belongsTo(name).map(relationTarget) })),
  );

  return cycles.map((cycle) => {
    // Aponta para o belongsTo que sai da primeira entidade do ciclo, rumo à próxima.
    const from = cycle[0];
    const to = cycle[1 % cycle.length];
    const index = belongsTo(from).findIndex((item) => relationTarget(item) === to);
    const item = belongsTo(from)[index];

    return {
      path: `pkg.entities.${originalEntityKeys[from] ?? from}.relationships.belongsTo[${index}]${typeof item === "string" ? "" : ".entity"}`,
      message:
        `dependência circular entre FKs (${[...cycle, cycle[0]].join(" → ")}): não há ordem de migrations que crie essas tabelas; ` +
        `remova um dos belongsTo do ciclo (por exemplo, deixe só o hasMany no lado "um")`,
    };
  });
}

export type ValidateOptions = {
  /** Quando definida, vale mais que `pkg.normalizeNames` do manifest. */
  normalizeNames?: boolean;
};

export type ValidatedManifest = {
  /** Entrada validada, com os nomes já normalizados (se a normalização estiver ligada). */
  input: ManifestInput;
  warnings: string[];
  /** Se a normalização de nomes valeu (opção > manifest > padrão `true`). */
  normalizeNames: boolean;
};

/**
 * Pipeline de validação: estrutura (zod) → normalização de nomes → consistência entre entidades.
 * Lança `ManifestValidationError` com todos os problemas da etapa que falhou.
 */
export function validateManifest(obj: unknown, options: ValidateOptions = {}): ValidatedManifest {
  const result = manifestSchema.safeParse(obj, { reportInput: true });

  if (!result.success) {
    const problems: ManifestProblem[] = [];
    collectIssues(result.error.issues, [], problems);
    throw new ManifestValidationError(problems);
  }

  const enabled = options.normalizeNames ?? result.data.pkg.normalizeNames ?? true;
  const problems = validateEnums(result.data);

  const normalized = normalizeNames(result.data, enabled);
  problems.push(...normalized.problems);
  // Com colisão as entidades se misturam, então a checagem dos alvos só roda sem elas.
  if (normalized.problems.length === 0) {
    const targetProblems = validateRelationshipTargets(normalized.manifest, normalized.originalEntityKeys);
    problems.push(...targetProblems);
    problems.push(...validateEntities(normalized.manifest, normalized.originalEntityKeys));
    // Alvos inexistentes já são erro; o ciclo só faz sentido num grafo completo.
    if (targetProblems.length === 0) {
      problems.push(...validateForeignKeyCycles(normalized.manifest, normalized.originalEntityKeys));
    }
  }
  if (problems.length > 0) throw new ManifestValidationError(problems);

  return { input: normalized.manifest, warnings: normalized.warnings, normalizeNames: enabled };
}
