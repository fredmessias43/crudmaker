import { Entity } from "./models/Entity";
import { Manifest } from "./models/Manifest";
import { generateLaravelApi } from "./targets/laravel-api";
import { FilePolicy, GeneratedFile } from "./targets/types";

export { FilePolicy, GeneratedFile };

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
  /**
   * Liga ou desliga a normalização de nomes. Quando definida, vale mais que `pkg.normalizeNames`
   * do manifest; omitida, vale o manifest (padrão: ligada).
   */
  normalizeNames?: boolean;
};

export type GenerateResult = {
  files: GeneratedFile[];
  /** Um aviso por nome alterado (ou fora da convenção, com a normalização desligada). Não bloqueiam a geração. */
  warnings: string[];
};

/**
 * Função pura: não lê nem escreve em disco.
 * Recebe o manifest cru (já parseado) e devolve os arquivos a gravar e os avisos.
 */
export function generate(manifestObj: { [key: string]: any }, options: GenerateOptions): GenerateResult {
  const manifest = new Manifest(manifestObj, { normalizeNames: options.normalizeNames });
  const entities = Object.keys(manifest.entities).map((key) => new Entity(key, manifest.entities[key]));

  const files: GeneratedFile[] = [
    {
      path: "manifest-lock.json",
      content: manifest.manifestToString(),
      policy: "overwrite",
    },
    ...generateLaravelApi({
      entities,
      now: options.now,
      existingMigrations: options.existingMigrations,
      existingApiRoutes: options.existingApiRoutes,
    }),
  ];

  return { files, warnings: manifest.warnings };
}
