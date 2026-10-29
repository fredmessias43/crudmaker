import fs from "fs";
import path from "path";
import { embeddedTemplate, Stubs, templateExtension } from "./targets/laravel-api/render";
import { embeddedHash, replaceableTemplates, resolveStubNames, stubsFolder, stubsLockPath } from "./targets/laravel-api/stubs";

/** Hashes dos templates embutidos na hora da publicação de cada stub (nome → hash). */
type StubHashes = { [templateName: string]: string };

/**
 * Lê os stubs do projeto (`stubs/crudmaker/laravel-api/*.php.eta`) e o `stubs-lock.json`.
 * Pasta ou lock ausentes dão listas vazias; lock ilegível vira aviso (os stubs continuam valendo).
 */
export function readStubs(outDir: string): { stubs: Stubs; hashes: StubHashes; warnings: string[] } {
  const stubs: Stubs = {};
  const warnings: string[] = [];
  const folder = path.join(outDir, stubsFolder);

  if (fs.existsSync(folder)) {
    for (const file of fs.readdirSync(folder).sort()) {
      if (!file.endsWith(templateExtension)) continue;
      stubs[file.slice(0, -templateExtension.length)] = fs.readFileSync(path.join(folder, file), "utf8");
    }
  }

  return { stubs, hashes: readLock(outDir, warnings), warnings };
}

function readLock(outDir: string, warnings: string[]): StubHashes {
  const lockPath = path.join(outDir, stubsLockPath);
  if (!fs.existsSync(lockPath)) return {};

  try {
    const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    if (typeof lock?.stubs === "object" && lock.stubs !== null) return lock.stubs;
  } catch {
    // cai no aviso abaixo
  }
  warnings.push(`${stubsLockPath} ilegível: o aviso de stub desatualizado não foi verificado. Apague o arquivo ou rode "crudmaker stubs:publish --refresh-lock".`);
  return {};
}

function writeLock(outDir: string, hashes: StubHashes): void {
  const lockPath = path.join(outDir, stubsLockPath);
  const sorted = Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b)));
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  fs.writeFileSync(lockPath, JSON.stringify({ version: 1, stubs: sorted }, null, 2) + "\n");
}

export type PublishResult = {
  /** Stubs criados (ou, com `force`, recriados). */
  copied: string[];
  /** Stubs que já existiam e não foram tocados. */
  skipped: string[];
  /** Stubs que o `--refresh-lock` atualizou no lock. */
  refreshed: string[];
};

/**
 * Copia os templates embutidos pedidos (todos, se `requested` é vazio) para a pasta de stubs de `outDir`
 * e registra no lock o hash do embutido. Um stub que já existe é pulado, a não ser com `force`
 * (só vale para stubs: nada fora da pasta de stubs é tocado).
 * Com `refreshLock`, não copia nada: só grava o hash atual do embutido para os stubs que existem
 * (use depois de incorporar a mudança do embutido no seu stub).
 */
export function publishStubs(outDir: string, requested: string[], options: { force?: boolean; refreshLock?: boolean } = {}): PublishResult {
  const names = requested.length > 0 ? resolveStubNames(requested) : replaceableTemplates;
  const folder = path.join(outDir, stubsFolder);
  const warnings: string[] = [];
  const hashes = readLock(outDir, warnings);
  const result: PublishResult = { copied: [], skipped: [], refreshed: [] };

  for (const name of names) {
    const target = path.join(folder, `${name}${templateExtension}`);
    const exists = fs.existsSync(target);

    if (options.refreshLock) {
      if (!exists) continue;
      hashes[name] = embeddedHash(name);
      result.refreshed.push(name);
    } else if (exists && !options.force) {
      result.skipped.push(name);
    } else {
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(target, embeddedTemplate(name));
      hashes[name] = embeddedHash(name);
      result.copied.push(name);
    }
  }

  if (result.copied.length > 0 || result.refreshed.length > 0) writeLock(outDir, hashes);
  return result;
}
