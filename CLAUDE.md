# crudmaker

Gerador de API Laravel a partir de um manifest YAML ou JSON: lê entidades, campos e relacionamentos e escreve Model, Migration, Controller, Request, Resource e Collection. Escrito em TypeScript, roda com `tsx`.

## Comandos

- `npm install`
- `npm run cli -- generate <manifest> --out <dir> [--dry-run]`: roda a CLI pelo código-fonte (`tsx`). `init [arquivo]` cria um manifest de exemplo (padrão `manifest.yaml`; o formato vem da extensão). Não existe mais caminho fixo nem `npm run dev`.
- `npm run build`: compila para `dist/` (o `bin` `crudmaker` aponta para `dist/bin.js`; `npm link` ou `npx .` o expõem).
- `npm test`: roda a suíte (vitest): snapshots de `generate` e testes da CLI em diretório temporário. Os snapshots ficam em `tests/__snapshots__/` e as fixtures em `tests/fixtures/`. Se uma mudança de saída for intencional, revise o diff e atualize com `npx vitest run -u`.
- `npm run schema`: regenera `schema/manifest.schema.json` a partir do schema zod. **Depois de mudar `src/manifestSchema.ts`, rode `npm run schema`** e versione o resultado (um teste falha se o arquivo estiver desatualizado).
- `npm run lint:php`: gera a saída das 3 fixtures num diretório temporário (data fixa, nada em `generated/`) e roda `php -l` em todos os `.php` num único container Docker `php:8.1-cli` (a versão mínima da spec; só precisa de Docker, não de PHP no host). Falha se algum arquivo tiver erro de sintaxe, exceto os listados em `scripts/phpSyntaxAllowlist.ts`.
- Não há CI no GitHub (decisão do projeto). Antes de commitar, rode localmente `npx tsc --noEmit`, `npm test` e `npm run lint:php`.
- **Allowlist do `lint:php`** (`scripts/phpSyntaxAllowlist.ts`): falhas conhecidas do gerador, cada uma com arquivo, motivo e ticket que corrige (hoje: a entidade `class` do fixture `curso`, palavra reservada do PHP). Só mexa nela para remover uma entrada quando o ticket corrigir (a checagem falha se uma entrada deixar de falhar). Nunca acrescente entradas para esconder um erro novo: corrija o gerador.
- `npx tsc --noEmit`: checagem de tipos. Passa sem erros. Ainda não há lint.

## Onde está cada coisa

- `src/bin.ts`: entrada do binário (shebang); chama `run` de `src/cli.ts`.
- `src/cli.ts`: `run(argv, io)` devolve o exit code; comandos `generate` e `init`, ajuda e versão. Casca fina em volta de `generate`.
- `src/readManifest.ts`: único ponto de leitura do manifest (caminho → objeto; YAML ou JSON pela extensão) e `UserError`.
- `src/writeFiles.ts`: `planWrites` classifica cada arquivo (criado/sobrescrito/sem mudança/preservado) sem escrever; `applyPlan` grava. O `--dry-run` e a escrita real usam o mesmo plano.
- `src/initTemplate.ts`: manifest de exemplo do `init` (YAML comentado e JSON; devem gerar o mesmo objeto).
- `src/generate.ts`: `generate(manifest, { now, existingMigrations })`, função pura (sem disco) que devolve a lista de arquivos `{ path, content, policy }`, com `path` relativo à raiz do projeto Laravel.
- `src/manifestSchema.ts`: schema zod do manifest (fonte do JSON Schema em `schema/manifest.schema.json`, publicado no pacote).
- `src/validateManifest.ts`: validação (schema + entre entidades) e `ManifestValidationError` com `{ path, message }` por problema.
- `src/models/Manifest.ts`: valida via `validateManifest` e normaliza (formas curtas, aliases, campos de FK).
- `src/models/Entity.ts`: nome da entidade em vários casings e nome da tabela.
- `src/fileCreators/PhpFile.ts`: classe base dos geradores (casca do arquivo PHP e caminho relativo; não escreve no disco).
- `src/fileCreators/*File.ts`: um gerador por tipo de arquivo PHP. `RoutesFile.ts` gera `routes/crudmaker.php` e o include no `routes/api.php` (não estende `PhpFile`).
- `generated/<pkg.code>/`: saída. Está no `.gitignore` e costuma conter projetos Laravel reais (com código escrito à mão).

## Documentação

- `docs/como-usar.md`: fluxo atual de uso e passos manuais.
- `docs/manifest.md`: referência do formato do manifest e limitações conhecidas.
- `docs/arquitetura.md`: módulos e fluxo interno.
- `docs/specs/crudmaker-v2.md`: spec da reestruturação planejada (CLI, YAML, schema, templates, testes). Siga a ordem de implementação que está nela.

Atualize os docs quando mudar o comportamento do gerador ou o formato do manifest.

## Convenções

- Os geradores montam PHP como arrays de linhas (`result.push(...)`), indentados com `this.tab` (`\t`) e unidos por `this.lineBreak`. Siga esse padrão até a migração para templates prevista na spec.
- O namespace base é sempre `App`, e a pasta de saída é derivada do namespace (`App\Http\...` → `app/Http/...`).
- Os nomes de entidade no manifest ficam no singular; tabela = snake_case plural.
- Documentação e comunicação em português.

## Cuidados

- **`crudmaker generate --out <dir>` sobrescreve arquivos em `<dir>` sem perguntar**, inclusive edições feitas à mão. Antes de rodar, use `--dry-run` e confira se o destino tem código que não pode ser perdido. Nos testes e experimentos, use sempre diretórios temporários, nunca `generated/`.
- Não apague nem limpe `generated/`. Ela não está versionada aqui, então não dá para recuperar.
