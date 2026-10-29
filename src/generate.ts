import {
  ModelFile,
  ResourceFile,
  CollectionFile,
  ControllerFile,
  RequestFile,
  MigrationFile,
} from "./fileCreators";
import { Entity } from "./models/Entity";
import { Manifest } from "./models/Manifest";

/**
 * Política de escrita de um arquivo gerado:
 * - `overwrite`: o arquivo é sempre regravado;
 * - `create-once`: só é criado se ainda não existir (código que passa a ser do usuário).
 */
export type FilePolicy = "overwrite" | "create-once";

export type GeneratedFile = {
  /** Caminho relativo à raiz do projeto Laravel de destino (separador `/`). */
  path: string;
  content: string;
  policy: FilePolicy;
};

export type GenerateOptions = {
  /** Data/hora usada no prefixo do nome das migrations novas. */
  now: Date;
  /** Nomes de arquivo (sem pasta) das migrations que já existem no destino. */
  existingMigrations: string[];
};

/**
 * Função pura: não lê nem escreve em disco.
 * Recebe o manifest cru (já parseado) e devolve os arquivos a gravar.
 */
export function generate(manifestObj: { [key: string]: any }, options: GenerateOptions): GeneratedFile[] {
  const manifest = new Manifest(manifestObj);
  const files: GeneratedFile[] = [];

  files.push({
    path: "manifest-lock.json",
    content: manifest.manifestToString(),
    policy: "overwrite",
  });

  for (const key in manifest.entities) {
    const entity = new Entity(key, manifest.entities[key]);

    const phpFiles = [
      new ModelFile(entity, manifest.pkgCode, manifest.systemCode),
      new ResourceFile(entity, manifest.pkgCode, manifest.systemCode),
      new CollectionFile(entity, manifest.pkgCode, manifest.systemCode),
      new ControllerFile(entity, manifest.pkgCode, manifest.systemCode),
      new RequestFile(entity, manifest.pkgCode, manifest.systemCode),
      new MigrationFile(entity, manifest.pkgCode, manifest.systemCode, options.now, options.existingMigrations),
    ];

    for (const phpFile of phpFiles) {
      files.push({
        path: phpFile.getRelativePath(),
        content: phpFile.mountFile(),
        policy: "overwrite",
      });
    }
  }

  return files;
}
