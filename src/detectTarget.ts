import fs from "fs";
import path from "path";
import { DetectedTarget, PhpVersion } from "./targetVersion";

/** Resultado da detecção: o que foi achado e avisos (arquivo ilegível, restrição que não deu para interpretar). */
export type Detection = { detected: DetectedTarget; warnings: string[] };

/**
 * Menor versão citada numa restrição do Composer (`^11.0`, `~8.2.0`, `>=8.1 <8.4`, `^10.0 || ^11.0`).
 * Alternativas só com limite superior (`<9`, `!=...`) são ignoradas. Devolve `[major, minor]` (minor 0 se
 * a restrição só tem o major) ou `null` se não há número (`*`, `dev-main`).
 */
export function lowestOfConstraint(constraint: string): [number, number] | null {
  const lowest = constraint
    .split("|")
    .map((alternative) => alternative.trim())
    .filter((alternative) => alternative !== "" && !/^(<|!=)/.test(alternative))
    .map((alternative) => /(\d+)(?:\.(\d+))?/.exec(alternative))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match): [number, number] => [Number(match[1]), Number(match[2] ?? 0)])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  return lowest[0] ?? null;
}

function readJson(file: string, label: string, warnings: string[]): { [key: string]: any } | null {
  if (!fs.existsSync(file)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    warnings.push(`${label} ilegível (JSON inválido): ignorado na detecção da versão.`);
    return null;
  }
}

const asPhp = (major: number, minor: number): PhpVersion => `${major}.${minor}`;

/** `config.platform.php` / `platform-overrides.php`: versão fixada (texto como "8.2.0"; `false` desliga). */
function fixedPhp(value: unknown): PhpVersion | undefined {
  if (typeof value !== "string") return undefined;
  const match = /^(\d+)\.(\d+)/.exec(value.trim());
  return match ? asPhp(Number(match[1]), Number(match[2])) : undefined;
}

/**
 * Detecta a versão do Laravel e do PHP no projeto de destino (`outDir`), lendo `composer.lock` e `composer.json`.
 *
 * Laravel: versão instalada de `laravel/framework` no `composer.lock`; sem ela, a restrição
 * `require.laravel/framework` do `composer.json` (o menor major citado: `^10.0 || ^11.0` → 10).
 *
 * PHP, a primeira que existir: `config.platform.php` do `composer.json` (versão fixada) →
 * `platform-overrides.php` do `composer.lock` → restrição `require.php` do `composer.json` →
 * `platform.php` do `composer.lock` (cópia do `require.php` na época do `composer update`).
 * Só a parte encontrada vem no resultado; sem arquivos, `detected` fica vazio.
 */
export function detectTarget(outDir: string): Detection {
  const warnings: string[] = [];
  const lock = readJson(path.join(outDir, "composer.lock"), "composer.lock", warnings);
  const manifest = readJson(path.join(outDir, "composer.json"), "composer.json", warnings);
  const detected: DetectedTarget = {};

  // Laravel
  const installed = [...(lock?.packages ?? []), ...(lock?.["packages-dev"] ?? [])].find((pkg: any) => pkg?.name === "laravel/framework");
  const installedMajor = typeof installed?.version === "string" ? /^v?(\d+)\./.exec(installed.version) : null;
  if (installedMajor) {
    detected.laravel = { value: Number(installedMajor[1]), source: "composer.lock", exact: true };
  } else {
    const constraint = manifest?.require?.["laravel/framework"];
    const lowest = typeof constraint === "string" ? lowestOfConstraint(constraint) : null;
    if (lowest) {
      detected.laravel = { value: lowest[0], source: "composer.json", exact: false };
    } else if (constraint !== undefined) {
      warnings.push(`composer.json: não deu para interpretar a restrição de laravel/framework (${JSON.stringify(constraint)}); versão do Laravel não detectada.`);
    }
  }

  // PHP
  const requirePhp = manifest?.require?.php;
  const requireLowest = typeof requirePhp === "string" ? lowestOfConstraint(requirePhp) : null;
  const lockPlatform = lock?.platform?.php;
  const lockPlatformLowest = typeof lockPlatform === "string" ? lowestOfConstraint(lockPlatform) : null;

  const platformJson = fixedPhp(manifest?.config?.platform?.php);
  const platformLock = fixedPhp(lock?.["platform-overrides"]?.php);
  if (platformJson) {
    detected.php = { value: platformJson, source: "composer.json", exact: true };
  } else if (platformLock) {
    detected.php = { value: platformLock, source: "composer.lock", exact: true };
  } else if (requireLowest) {
    detected.php = { value: asPhp(...requireLowest), source: "composer.json", exact: false };
  } else if (lockPlatformLowest) {
    detected.php = { value: asPhp(...lockPlatformLowest), source: "composer.lock", exact: false };
  }

  return { detected, warnings };
}
