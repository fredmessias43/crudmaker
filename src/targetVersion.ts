import { UserError } from "./readManifest";

/**
 * Versão alvo da geração: a versão do Laravel e do PHP do projeto de destino.
 *
 * Este módulo é puro (não toca o disco): define os tipos, as versões suportadas, a validação e a
 * resolução por prioridade (flag → manifest → detecção no destino → padrão). A leitura do
 * `composer.json`/`composer.lock` fica em `detectTarget.ts`.
 */

/** Majors do Laravel suportados. */
export const SUPPORTED_LARAVEL = [10, 11, 12] as const;
export type LaravelMajor = (typeof SUPPORTED_LARAVEL)[number];

/** Versão do PHP no formato `major.minor` (ex.: `"8.2"`). Suportado: 8.1 em diante (série 8). */
export type PhpVersion = `${number}.${number}`;

/** Menor PHP suportado pelo crudmaker (o mínimo do Laravel 10). */
export const MIN_PHP: PhpVersion = "8.1";

/** PHP mínimo que cada major do Laravel exige. */
export const MIN_PHP_BY_LARAVEL: { [key in LaravelMajor]: PhpVersion } = { 10: "8.1", 11: "8.2", 12: "8.2" };

export type TargetVersion = { laravel: LaravelMajor; php: PhpVersion };

/** Padrão quando nada é informado nem detectado: o Laravel mais recente suportado e o PHP mínimo dele. */
export const DEFAULT_TARGET: TargetVersion = { laravel: 12, php: "8.2" };

/** De onde veio cada parte da versão. */
export type TargetSource = "flag" | "manifest" | "composer.lock" | "composer.json" | "padrão";

/** Erro de versão (inválida, não suportada ou incompatível); a CLI mostra só a mensagem. */
export class TargetVersionError extends UserError {}

const supportedLaravelText = SUPPORTED_LARAVEL.join(", ");

/** Compara duas versões `major.minor` (negativo se `a` < `b`). */
export function comparePhp(a: string, b: string): number {
  const [aMajor, aMinor] = a.split(".").map(Number);
  const [bMajor, bMinor] = b.split(".").map(Number);
  return aMajor - bMajor || aMinor - bMinor;
}

/**
 * Lê o major do Laravel de um número ou texto (`11`, `"11"`, `"11.x"`, `"v11.4.0"`).
 * Não confere se é suportado: use `assertSupported`.
 */
export function parseLaravel(raw: unknown, where: string): number {
  const text = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw.trim() : "";
  const match = /^v?(\d+)(?:\.(?:x|\*|\d+)){0,2}$/.exec(text);
  if (!match) {
    throw new TargetVersionError(`Versão do Laravel inválida em ${where}: ${JSON.stringify(raw)}. Use o número do major, ex.: ${supportedLaravelText}.`);
  }
  return Number(match[1]);
}

/**
 * Lê o `major.minor` do PHP de um número ou texto (`8.2`, `"8.2"`, `"8.2.12"`).
 * Em YAML, `php: 8.2` chega como número; `8.10` chegaria como `8.1`, então escreva `"8.10"` entre aspas.
 */
export function parsePhp(raw: unknown, where: string): PhpVersion {
  const text = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw.trim() : "";
  const match = /^v?(\d+)\.(\d+)(?:\.(?:x|\*|\d+))?$/.exec(text);
  if (!match) {
    throw new TargetVersionError(`Versão do PHP inválida em ${where}: ${JSON.stringify(raw)}. Use major.minor, ex.: 8.2.`);
  }
  return `${Number(match[1])}.${Number(match[2])}`;
}

/** Erro claro se o Laravel não é um major suportado. `where` diz de onde veio (para a mensagem). */
function assertLaravel(laravel: number, where: string): asserts laravel is LaravelMajor {
  if (!(SUPPORTED_LARAVEL as readonly number[]).includes(laravel)) {
    throw new TargetVersionError(
      `Laravel ${laravel} (${where}) não é suportado. O crudmaker gera código para o Laravel ${supportedLaravelText}.`,
    );
  }
}

/** Erro claro se o PHP está fora do suportado ou abaixo do mínimo do Laravel escolhido. */
function assertPhp(php: PhpVersion, laravel: LaravelMajor, where: string): void {
  if (comparePhp(php, MIN_PHP) < 0 || php.split(".")[0] !== MIN_PHP.split(".")[0]) {
    throw new TargetVersionError(`PHP ${php} (${where}) não é suportado. O crudmaker gera código para o PHP ${MIN_PHP} ou superior (série 8).`);
  }
  if (comparePhp(php, MIN_PHP_BY_LARAVEL[laravel]) < 0) {
    throw new TargetVersionError(
      `PHP ${php} (${where}) é anterior ao mínimo do Laravel ${laravel} (PHP ${MIN_PHP_BY_LARAVEL[laravel]}). ` +
        `Informe um PHP ${MIN_PHP_BY_LARAVEL[laravel]} ou superior, ou escolha um Laravel mais antigo.`,
    );
  }
}

/**
 * Confere uma versão alvo completa (usada por `generate` para recusar entradas inválidas, mesmo sem a CLI).
 * Lança `TargetVersionError` se o Laravel ou o PHP não são suportados ou são incompatíveis entre si.
 */
export function assertSupported(target: { laravel: number; php: string }): asserts target is TargetVersion {
  assertLaravel(target.laravel, "target.laravel");
  assertPhp(parsePhp(target.php, "target.php"), target.laravel, "target.php");
}

/**
 * O que a detecção no destino encontrou. `exact` é verdadeiro quando a versão é a instalada/fixada
 * (composer.lock, `config.platform`) e falso quando vem de uma restrição (`^11.0`), de onde só se tira o mínimo.
 */
export type DetectedValue<T> = { value: T; source: "composer.lock" | "composer.json"; exact: boolean };
export type DetectedTarget = { laravel?: DetectedValue<number>; php?: DetectedValue<PhpVersion> };

export type ResolveInput = {
  /** Valores crus das flags `--laravel` e `--php` (texto), se vieram. */
  flags?: { laravel?: string; php?: string };
  /** O `pkg.target` do manifest cru (qualquer coisa; é validado aqui), se existe. */
  manifest?: unknown;
  /** O que a detecção achou no destino. */
  detected?: DetectedTarget;
};

export type ResolvedTarget = {
  target: TargetVersion;
  sources: { laravel: TargetSource; php: TargetSource };
  warnings: string[];
};

/**
 * Resolve a versão alvo. Cada parte (Laravel e PHP) resolve de forma independente, na ordem:
 * flag → `pkg.target` do manifest → detecção no destino → padrão.
 * Lança `TargetVersionError` para versão inválida, não suportada ou PHP abaixo do mínimo do Laravel escolhido.
 * Avisa quando a versão explícita (flag/manifest) diverge da detectada.
 */
export function resolveTarget(input: ResolveInput): ResolvedTarget {
  const flags = input.flags ?? {};
  const detected = input.detected ?? {};
  const manifest = input.manifest;
  if (manifest !== undefined && (typeof manifest !== "object" || manifest === null || Array.isArray(manifest))) {
    throw new TargetVersionError(`pkg.target do manifest deve ser um objeto com laravel e/ou php, ex.: target: { laravel: 11, php: "8.2" }.`);
  }
  const fromManifest = (manifest ?? {}) as { laravel?: unknown; php?: unknown };
  const warnings: string[] = [];

  // Laravel
  let laravel: number;
  let laravelSource: TargetSource;
  if (flags.laravel !== undefined) {
    laravel = parseLaravel(flags.laravel, "--laravel");
    laravelSource = "flag";
  } else if (fromManifest.laravel !== undefined) {
    laravel = parseLaravel(fromManifest.laravel, "pkg.target.laravel do manifest");
    laravelSource = "manifest";
  } else if (detected.laravel !== undefined) {
    laravel = detected.laravel.value;
    laravelSource = detected.laravel.source;
  } else {
    laravel = DEFAULT_TARGET.laravel;
    laravelSource = "padrão";
  }
  assertLaravel(laravel, laravelSource);

  if ((laravelSource === "flag" || laravelSource === "manifest") && detected.laravel !== undefined && detected.laravel.value !== laravel) {
    warnings.push(
      `Laravel ${laravel} (${laravelSource}) diverge do ${detected.laravel.exact ? "instalado" : "declarado"} no destino: ` +
        `Laravel ${detected.laravel.value} (${detected.laravel.source}). Vale o explícito; confira se é isso mesmo.`,
    );
  }

  // PHP
  let php: PhpVersion;
  let phpSource: TargetSource;
  if (flags.php !== undefined) {
    php = parsePhp(flags.php, "--php");
    phpSource = "flag";
  } else if (fromManifest.php !== undefined) {
    php = parsePhp(fromManifest.php, "pkg.target.php do manifest");
    phpSource = "manifest";
  } else if (detected.php !== undefined) {
    php = detected.php.value;
    phpSource = detected.php.source;
  } else {
    php = DEFAULT_TARGET.php;
    phpSource = "padrão";
  }
  assertPhp(php, laravel, phpSource);

  // Restrição (`^8.2`) só dá o mínimo: um PHP explícito igual ou maior é compatível; só avisa se for menor.
  if ((phpSource === "flag" || phpSource === "manifest") && detected.php !== undefined) {
    const diff = comparePhp(php, detected.php.value);
    if (detected.php.exact ? diff !== 0 : diff < 0) {
      warnings.push(
        `PHP ${php} (${phpSource}) diverge do ${detected.php.exact ? "fixado" : "mínimo declarado"} no destino: ` +
          `PHP ${detected.php.value} (${detected.php.source}). Vale o explícito; confira se é isso mesmo.`,
      );
    }
  }

  return { target: { laravel, php }, sources: { laravel: laravelSource, php: phpSource }, warnings };
}

/** Linha de resumo da CLI: `Laravel 11 (composer.lock), PHP 8.2 (padrão)`. */
export function describeTarget(resolved: Pick<ResolvedTarget, "target" | "sources">): string {
  return `Laravel ${resolved.target.laravel} (${resolved.sources.laravel}), PHP ${resolved.target.php} (${resolved.sources.php})`;
}
