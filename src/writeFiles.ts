import fs from "fs";
import path from "path";
import { GeneratedFile, ObsoleteFile } from "./generate";
import { GENERATED_MARKER } from "./targets/types";

/**
 * O que acontece com um arquivo ao gravar:
 * - `created`: não existia, será criado;
 * - `overwritten`: existia, a política é `overwrite` e o conteúdo muda;
 * - `unchanged`: existia, a política é `overwrite` e o conteúdo já é idêntico (nada a gravar);
 * - `preserved`: existia e a política é `create-once`, então é mantido como está (nunca é sobrescrito,
 *   por nenhuma opção: `applyPlan` só grava `created` e `overwritten`).
 */
export type WriteAction = "created" | "overwritten" | "unchanged" | "preserved";

export type PlannedWrite = {
  file: GeneratedFile;
  /** Caminho absoluto (ou relativo ao cwd, se `baseDir` for relativo) do destino. */
  fullPath: string;
  action: WriteAction;
};

/**
 * Plano de escrita: só lê o disco, nunca escreve. É a única fonte da classificação,
 * usada tanto pelo `--dry-run` quanto pela escrita real, para as duas nunca divergirem.
 */
export function planWrites(files: GeneratedFile[], baseDir: string): PlannedWrite[] {
  return files.map((file) => {
    const fullPath = path.join(baseDir, file.path);
    let action: WriteAction;

    if (!fs.existsSync(fullPath)) {
      action = "created";
    } else if (file.policy === "create-once") {
      action = "preserved";
    } else if (fs.readFileSync(fullPath, "utf8") === file.content) {
      action = "unchanged";
    } else {
      action = "overwritten";
    }

    return { file, fullPath, action };
  });
}

/**
 * Camada de escrita: executa o plano, criando as pastas necessárias.
 * Só grava `created` e `overwritten`. Não imprime nada; quem chama decide o que mostrar.
 */
export function applyPlan(plan: PlannedWrite[]): void {
  for (const item of plan) {
    if (item.action !== "created" && item.action !== "overwritten") continue;

    fs.mkdirSync(path.dirname(item.fullPath), { recursive: true });
    fs.writeFileSync(item.fullPath, item.file.content);
  }
}

/** Atalho: planeja e grava, devolvendo o plano executado. */
export function writeFiles(files: GeneratedFile[], baseDir: string): PlannedWrite[] {
  const plan = planWrites(files, baseDir);
  applyPlan(plan);
  return plan;
}

/**
 * Avisos dos arquivos `create-once` preservados que deveriam estender uma base gerada e não estendem:
 * o projeto foi gerado por uma versão antiga do crudmaker (a final existente é o model/controller
 * completo de antes), então a base nova fica sem uso e os hooks não valem para ele.
 * Só lê o disco. A checagem é textual: procura `extends ...Base<Classe>` no arquivo.
 */
export function legacyFinalWarnings(plan: PlannedWrite[]): string[] {
  const warnings: string[] = [];

  for (const { file, fullPath, action } of plan) {
    if (action !== "preserved" || !file.generatedBase) continue;

    const baseName = file.generatedBase.fqcn.split("\\").pop()!;
    const extendsBase = new RegExp(`\\bextends\\s+\\\\?(?:[\\w\\\\]*\\\\)?${baseName}\\b`);
    const content = fs.readFileSync(fullPath, "utf8");
    if (extendsBase.test(content)) continue;

    // Model `User` do esqueleto do Laravel: estende Authenticatable direto, não é código de versão antiga do crudmaker.
    if (/\bextends\s+(?:\\?Illuminate\\Foundation\\Auth\\)?(?:Authenticatable|User)\b/.test(content)) {
      warnings.push(
        `${file.path}: é o model do esqueleto do Laravel e estende Authenticatable direto, não a base gerada ${baseName}; o arquivo foi preservado, ` +
          `mas ${file.generatedBase.path} (campos, casts, $hidden e relacionamentos do manifest) fica sem uso. ` +
          `Migre: troque "extends Authenticatable" por "extends \\${file.generatedBase.fqcn}", remova o "use Illuminate\\Foundation\\Auth\\User as Authenticatable;" ` +
          `e mantenha só o que é seu (traits como HasApiTokens, métodos). Apague $fillable, $hidden e $casts/casts() repetidos: redeclarados aqui, ` +
          `substituem os da base (veja "A entidade user" em docs/como-usar.md).`,
      );
      continue;
    }

    // UserFactory do esqueleto do Laravel: estende Factory direto, não é código de versão antiga do crudmaker.
    if (file.path === "database/factories/UserFactory.php" && /\bextends\s+Factory\b/.test(content)) {
      warnings.push(
        `${file.path}: é a factory do esqueleto do Laravel e estende Factory direto, não a base gerada ${baseName}; o arquivo foi preservado, ` +
          `mas ${file.generatedBase.path} (valores dos campos do manifest, como as colunas extras de users) fica sem uso, e User::factory() não preenche os campos novos. ` +
          `Migre: troque "extends Factory" por "extends \\${file.generatedBase.fqcn}", remova o "use Illuminate\\Database\\Eloquent\\Factories\\Factory;", ` +
          `a propriedade $password e a definition() (a base já preenche name, email, email_verified_at, password e remember_token), ` +
          `e mantenha só o que é seu, como o estado unverified() (veja "A entidade user" em docs/como-usar.md).`,
      );
      continue;
    }

    warnings.push(
      `${file.path}: não estende a base gerada ${baseName}; o arquivo foi preservado, mas ${file.generatedBase.path} fica sem uso ` +
        `e os hooks e as customizações da camada gerada não valem para ele. ` +
        `Migre: mova este arquivo para fora do projeto, gere de novo (cria a classe nova, vazia) e copie para ela só o código escrito à mão ` +
        `(veja "Migrar um projeto gerado pela versão antiga" em docs/como-usar.md).`,
    );
  }

  return warnings;
}

/**
 * O que acontece com um arquivo de entidade que saiu do manifest:
 * - `removed`: arquivo da camada gerada (base), que o crudmaker apaga;
 * - `orphaned`: arquivo que é do usuário (classe final ou migration) e fica onde está; só é listado.
 */
export type RemovalAction = "removed" | "orphaned";

export type PlannedRemoval = {
  path: string;
  fullPath: string;
  action: RemovalAction;
  kind: ObsoleteFile["kind"];
};

/** Só estes arquivos podem ser apagados: a pasta da camada gerada, dentro do destino. */
const deletableFolder = "app/Generated/";

/**
 * Plano de remoção: só lê o disco. Considera apenas os caminhos que existem. Apaga (`removed`) somente
 * arquivos da camada gerada que o crudmaker escreveu: caminho derivado do lock anterior, dentro de
 * `app/Generated/` do destino e com o cabeçalho de arquivo gerado (um arquivo sem ele foi trocado por
 * código do usuário e vira órfão). Finais e migrations nunca são apagadas.
 */
export function planRemovals(obsolete: ObsoleteFile[], baseDir: string): PlannedRemoval[] {
  const root = path.resolve(baseDir);
  const removals: PlannedRemoval[] = [];

  for (const { path: relativePath, kind } of obsolete) {
    const fullPath = path.join(baseDir, relativePath);
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) continue;

    const insideGeneratedFolder = path.resolve(fullPath).startsWith(path.join(root, deletableFolder));
    const isGenerated =
      kind === "generated" && relativePath.startsWith(deletableFolder) && insideGeneratedFolder && fs.readFileSync(fullPath, "utf8").includes(GENERATED_MARKER);

    removals.push({ path: relativePath, fullPath, action: isGenerated ? "removed" : "orphaned", kind });
  }

  return removals;
}

/** Apaga os `removed` (e as pastas de `app/Generated` que ficarem vazias). Os `orphaned` não são tocados. */
export function applyRemovals(removals: PlannedRemoval[], baseDir: string): void {
  const generatedRoot = path.join(path.resolve(baseDir), deletableFolder);

  for (const item of removals) {
    if (item.action !== "removed") continue;

    fs.rmSync(item.fullPath);

    for (let dir = path.dirname(path.resolve(item.fullPath)); dir.startsWith(generatedRoot); dir = path.dirname(dir)) {
      if (fs.readdirSync(dir).length > 0) break;
      fs.rmdirSync(dir);
    }
  }
}
