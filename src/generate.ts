import {
  ModelFile,
  ResourceFile,
  CollectionFile,
  ControllerFile,
  RequestFile,
  MigrationFile,
  RoutesFile,
} from "./fileCreators";
import { ensureRoutesInclude } from "./fileCreators/RoutesFile";
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
  /**
   * Conteúdo atual do `routes/api.php` do destino, ou `null` se o arquivo não existe.
   * Quando há conteúdo, `generate` devolve o `routes/api.php` com o include das rotas geradas
   * (acrescentado só se faltar). Quando é `null`/omitido, o arquivo não é gerado: criá-lo sozinho
   * não adiantaria, pois no Laravel 11+ ele só é carregado se registrado em `bootstrap/app.php`
   * (o `php artisan install:api` faz as duas coisas).
   */
  existingApiRoutes?: string | null;
};

/**
 * Função pura: não lê nem escreve em disco.
 * Recebe o manifest cru (já parseado) e devolve os arquivos a gravar.
 */
export function generate(manifestObj: { [key: string]: any }, options: GenerateOptions): GeneratedFile[] {
  const manifest = new Manifest(manifestObj);
  const files: GeneratedFile[] = [];
  const entities: Entity[] = [];

  files.push({
    path: "manifest-lock.json",
    content: manifest.manifestToString(),
    policy: "overwrite",
  });

  for (const key in manifest.entities) {
    const entity = new Entity(key, manifest.entities[key]);
    entities.push(entity);

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

  const routesFile = new RoutesFile(entities);
  files.push({
    path: routesFile.getRelativePath(),
    content: routesFile.mountFile(),
    policy: "overwrite",
  });

  // O include é calculado aqui, a partir do conteúdo recebido; quem grava continua sendo `planWrites`,
  // que classifica o arquivo como sobrescrito (include novo) ou sem mudança (já incluído).
  if (options.existingApiRoutes != null) {
    files.push({
      path: "routes/api.php",
      content: ensureRoutesInclude(options.existingApiRoutes),
      policy: "overwrite",
    });
  }

  return files;
}
