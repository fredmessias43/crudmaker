import { INPUT_FIELD_TYPES, manifestSchema, ManifestInput, RelationItemInput } from "./manifestSchema";
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

/** Validações que precisam enxergar mais de uma parte do manifest. Só roda com a estrutura válida. */
function crossValidate(manifest: ManifestInput): ManifestProblem[] {
  const problems: ManifestProblem[] = [];
  const entities = manifest.pkg.entities;
  const entityNames = Object.keys(entities);

  for (const [entityName, entity] of Object.entries(entities)) {
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
 * Valida o manifest cru (estrutura e depois consistência entre entidades) e devolve a entrada tipada.
 * Lança `ManifestValidationError` com todos os problemas da etapa que falhou.
 */
export function validateManifest(obj: unknown): ManifestInput {
  const result = manifestSchema.safeParse(obj, { reportInput: true });

  if (!result.success) {
    const problems: ManifestProblem[] = [];
    collectIssues(result.error.issues, [], problems);
    throw new ManifestValidationError(problems);
  }

  const problems = crossValidate(result.data);
  if (problems.length > 0) throw new ManifestValidationError(problems);

  return result.data;
}
