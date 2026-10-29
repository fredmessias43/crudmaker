import { pascalCase } from "change-case";
import { enumCaseName } from "./enumCase";
import { findCycles } from "./dependencyOrder";
import { entityColumns, IMPLICIT_SORT_COLUMNS, nestedCandidates, withableRelations } from "./apiOptions";
import { ENTITY_ONLY_API_KEYS, INPUT_FIELD_TYPES, manifestSchema, ManifestInput, RelationItemInput } from "./manifestSchema";
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
  int: "número inteiro",
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
      // `default` aceita texto, número ou booleano; fora disso o erro é do próprio valor, não da forma curta/longa do campo.
      if (basePath.length > 0 && issue.path.length === 1 && issue.path[0] === "default") {
        out.push({ path: formatPath(path), message: `deve ser texto, número ou verdadeiro/falso (true/false), recebido ${describeValue(issue.input)}` });
        continue;
      }
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

/**
 * Cada item do enum vira um `case` do PHP enum (`enumCaseName`). Erro para item que não vira identificador
 * válido (`2fa`, só símbolos, `class`) e para itens que dão o mesmo nome (`in-progress` e `in_progress`).
 */
function enumCaseProblems(path: string, items: string[]): ManifestProblem[] {
  const problems: ManifestProblem[] = [];
  const seen = new Map<string, string>();

  items.forEach((item, index) => {
    const name = enumCaseName(item);
    if (name === undefined) {
      problems.push({
        path: `${path}[${index}]`,
        message: `o item ${JSON.stringify(item)} não vira um nome de case válido no PHP enum (use letras, números e _ ou -, sem começar por número, e não use "class")`,
      });
      return;
    }

    const first = seen.get(name);
    if (first === undefined) seen.set(name, item);
    else {
      problems.push({
        path: `${path}[${index}]`,
        message: `o item ${JSON.stringify(item)} gera o mesmo case "${name}" que ${JSON.stringify(first)}; deixe os itens diferentes depois da conversão para PascalCase`,
      });
    }
  });

  return problems;
}

/** Duas entidades/campos que geram o mesmo nome de PHP enum (`orderItem.status` e `order.itemStatus` → `OrderItemStatus`). Roda com os nomes normalizados. */
function validateEnumClassNames(manifest: ManifestInput, originalEntityKeys: { [normalized: string]: string }): ManifestProblem[] {
  const problems: ManifestProblem[] = [];
  const seen = new Map<string, string>();

  for (const [entityName, entity] of Object.entries(manifest.pkg.entities)) {
    const base = `pkg.entities.${originalEntityKeys[entityName] ?? entityName}`;

    for (const [fieldKey, field] of Object.entries(entity.fields ?? {})) {
      if (typeof field === "string" || field.type !== "enum") continue;

      const className = `${pascalCase(entityName)}${pascalCase(field.name ?? fieldKey)}`;
      const path = `${base}.fields.${fieldKey}`;
      const first = seen.get(className);
      if (first === undefined) seen.set(className, path);
      else problems.push({ path, message: `gera o PHP enum ${className}, o mesmo de ${first}; renomeie a entidade ou o campo` });
    }
  }

  return problems;
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
      if (items && items.length > 0) {
        problems.push(...enumCaseProblems(`${base}.fields.${fieldKey}.enumItems`, items));
        continue;
      }

      problems.push(
        typeof field === "string"
          ? { path: `${base}.fields.${fieldKey}`, message: `campo enum precisa de enumItems; use a forma { "type": "enum", "enumItems": [...] }` }
          : { path: `${base}.fields.${fieldKey}.enumItems`, message: items ? "campo enum precisa de ao menos um item" : "campo enum precisa de enumItems" },
      );
    }
  }

  return problems;
}

const DATE_FORMATS = {
  date: { regex: /^\d{4}-\d{2}-\d{2}$/, label: "Y-m-d", example: "2025-01-31" },
  datetime: { regex: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, label: "Y-m-d H:i:s", example: "2025-01-31 08:30:00" },
} as const;

/** Data/hora no formato esperado e existente no calendário (`2025-02-30` não passa). */
function isValidDate(value: string, type: keyof typeof DATE_FORMATS): boolean {
  if (!DATE_FORMATS[type].regex.test(value)) return false;

  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  const [hour, minute, second] = type === "datetime" ? value.slice(11).split(":").map(Number) : [0, 0, 0];
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    && hour < 24 && minute < 60 && second < 60;
}

/** Mensagem de erro se o `default` não combina com o tipo; `undefined` se combina. */
function defaultProblem(type: string, value: string | number | boolean, enumItems: string[]): string | undefined {
  const got = `recebido ${describeValue(value)} ${JSON.stringify(value)}`;

  switch (type) {
    case "uuid":
    case "string":
    case "text":
      return typeof value === "string" ? undefined : `default de campo ${type} deve ser texto, ${got}`;
    case "date":
    case "datetime": {
      const { label, example } = DATE_FORMATS[type];
      if (typeof value === "string" && isValidDate(value, type)) return undefined;
      return `default de campo ${type} deve ser uma data no formato ${label} (ex.: ${JSON.stringify(example)}), ${got}`;
    }
    case "integer":
      return typeof value === "number" && Number.isInteger(value) ? undefined : `default de campo integer deve ser um número inteiro, ${got}`;
    case "double":
      return typeof value === "number" && Number.isFinite(value) ? undefined : `default de campo double deve ser um número, ${got}`;
    case "boolean":
      return typeof value === "boolean" ? undefined : `default de campo boolean deve ser true ou false, ${got}`;
    case "enum":
      if (typeof value === "string" && enumItems.includes(value)) return undefined;
      return `default de campo enum deve ser um dos enumItems (${enumItems.map((item) => JSON.stringify(item)).join(", ")}), ${got}`;
    default:
      return `default não é suportado em campo ${type}; remova o default ou use outro tipo`;
  }
}

/** `default` de cada campo contra o tipo. Roda com os nomes originais, para os caminhos baterem com o arquivo. */
function validateFieldDefaults(manifest: ManifestInput): ManifestProblem[] {
  const problems: ManifestProblem[] = [];

  for (const [entityName, entity] of Object.entries(manifest.pkg.entities)) {
    for (const [fieldKey, field] of Object.entries(entity.fields ?? {})) {
      if (typeof field === "string" || field.default === undefined) continue;

      const type = field.type === "int" ? "integer" : field.type === "displayName" ? "string" : field.type;
      const message = defaultProblem(type, field.default, field.enumItems ?? []);
      if (message !== undefined) problems.push({ path: `pkg.entities.${entityName}.fields.${fieldKey}.default`, message });
    }
  }

  return problems;
}

/**
 * Opções de `api` que dependem dos campos de cada entidade não valem em `pkg.defaults.api`. Com o zod elas
 * seriam descartadas em silêncio (chaves desconhecidas são toleradas), então o erro sai daqui, no objeto cru.
 */
function validateDefaultsApi(raw: unknown): ManifestProblem[] {
  const api = (raw as any)?.pkg?.defaults?.api;
  if (api === null || typeof api !== "object" || Array.isArray(api)) return [];

  return ENTITY_ONLY_API_KEYS.filter((key) => key in api).map((key) => ({
    path: `pkg.defaults.api.${key}`,
    message: `"${key}" depende dos campos de cada entidade e não vale como padrão; declare no bloco api da entidade (em pkg.defaults.api só valem actions, middleware, perPage e nested)`,
  }));
}

/**
 * Nomes do bloco `api` das entidades (`filters`, `search`, `sort`, `defaultSort`, `with`) contra os campos
 * e relacionamentos da própria entidade. Roda com os nomes já normalizados; o caminho usa a chave original.
 * `pkg.defaults.api` não tem nomes a conferir (só actions, middleware e perPage, já validados pelo schema).
 */
function validateApiNames(manifest: ManifestInput, originalEntityKeys: { [normalized: string]: string }): ManifestProblem[] {
  const problems: ManifestProblem[] = [];

  for (const [entityName, entity] of Object.entries(manifest.pkg.entities)) {
    const api = entity.api;
    if (api === undefined) continue;

    const base = `pkg.entities.${originalEntityKeys[entityName] ?? entityName}.api`;
    const columns = entityColumns(entity);
    const sortable = [...columns, ...IMPLICIT_SORT_COLUMNS.filter((column) => !columns.includes(column))];

    const unknownColumn = (path: string, name: string, allowed: string[]) => ({
      path,
      message: `campo ${JSON.stringify(name)} não existe na entidade ${JSON.stringify(entityName)} (campos: ${allowed.join(", ")})`,
    });

    for (const key of ["filters", "search"] as const) {
      (api[key] ?? []).forEach((name, index) => {
        if (!columns.includes(name)) problems.push(unknownColumn(`${base}.${key}[${index}]`, name, columns));
      });
    }

    (api.sort ?? []).forEach((name, index) => {
      if (!sortable.includes(name)) problems.push(unknownColumn(`${base}.sort[${index}]`, name, sortable));
    });

    if (api.defaultSort !== undefined) {
      const name = api.defaultSort.startsWith("-") ? api.defaultSort.slice(1) : api.defaultSort;
      if (!sortable.includes(name)) problems.push(unknownColumn(`${base}.defaultSort`, name, sortable));
    }

    const relations = withableRelations(entity);
    (api.with ?? []).forEach((name, index) => {
      if (relations.has(name)) return;

      const available = [...relations.keys()];
      problems.push({
        path: `${base}.with[${index}]`,
        message:
          `relacionamento ${JSON.stringify(name)} não existe na entidade ${JSON.stringify(entityName)} ` +
          (available.length > 0
            ? `(use o nome do método na model: ${available.join(", ")})`
            : `(a entidade não tem relacionamentos belongsTo, hasOne ou hasMany)`),
      });
    });

    if (Array.isArray(api.nested)) {
      const candidates = nestedCandidates(entityName, manifest.pkg.entities);

      api.nested.forEach((name, index) => {
        const candidate = candidates.get(name);
        const path = `${base}.nested[${index}]`;

        if (candidate === undefined) {
          const available = [...candidates.keys()];
          problems.push({
            path,
            message:
              `relacionamento ${JSON.stringify(name)} não existe na entidade ${JSON.stringify(entityName)} ` +
              (available.length > 0
                ? `(use o nome do método de um hasOne/hasMany na model: ${available.join(", ")})`
                : `(a entidade não tem relacionamentos hasOne ou hasMany)`),
          });
        } else if (!candidate.hasInverse) {
          problems.push({
            path,
            message:
              `a entidade ${JSON.stringify(candidate.child)} precisa declarar o belongsTo de ${JSON.stringify(entityName)} ` +
              `com a FK ${JSON.stringify(candidate.foreignKey)} para ter rota aninhada em ${JSON.stringify(name)}`,
          });
        }
      });
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
  const problems = [...validateEnums(result.data), ...validateFieldDefaults(result.data), ...validateDefaultsApi(obj)];

  const normalized = normalizeNames(result.data, enabled);
  problems.push(...normalized.problems);
  // Com colisão as entidades se misturam, então a checagem dos alvos só roda sem elas.
  if (normalized.problems.length === 0) {
    const targetProblems = validateRelationshipTargets(normalized.manifest, normalized.originalEntityKeys);
    problems.push(...targetProblems);
    problems.push(...validateEntities(normalized.manifest, normalized.originalEntityKeys));
    problems.push(...validateApiNames(normalized.manifest, normalized.originalEntityKeys));
    problems.push(...validateEnumClassNames(normalized.manifest, normalized.originalEntityKeys));
    // Alvos inexistentes já são erro; o ciclo só faz sentido num grafo completo.
    if (targetProblems.length === 0) {
      problems.push(...validateForeignKeyCycles(normalized.manifest, normalized.originalEntityKeys));
    }
  }
  if (problems.length > 0) throw new ManifestValidationError(problems);

  return { input: normalized.manifest, warnings: normalized.warnings, normalizeNames: enabled };
}
