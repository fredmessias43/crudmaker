# crudmaker

Gerador de API Laravel a partir de um manifest YAML ou JSON: lê entidades, campos e relacionamentos e escreve Model, Migration, Controller, Request, Resource e Collection. Escrito em TypeScript, roda com `tsx`.

## Comandos

- `npm install`
- `npm run cli -- generate <manifest> --out <dir> [--dry-run]`: roda a CLI pelo código-fonte (`tsx`). `init [arquivo]` cria um manifest de exemplo (padrão `manifest.yaml`; o formato vem da extensão). Não existe mais caminho fixo nem `npm run dev`.
- `npm run build`: compila para `dist/` (o `bin` `crudmaker` aponta para `dist/bin.js`; `npm link` ou `npx .` o expõem).
- `npm test`: roda a suíte (vitest): snapshots de `generate` e testes da CLI em diretório temporário. Os snapshots ficam em `tests/__snapshots__/` (completos no Laravel 12; o Laravel 10 tem só as diferenças em `laravel-10/`, e o 11 é comparado com o 12 em `tests/targetVersion.test.ts`) e as fixtures em `tests/fixtures/`. Se uma mudança de saída for intencional, revise o diff e atualize com `npx vitest run -u`.
- `npm run schema`: regenera `schema/manifest.schema.json` a partir do schema zod. **Depois de mudar `src/manifestSchema.ts`, rode `npm run schema`** e versione o resultado (um teste falha se o arquivo estiver desatualizado).
- `npm run lint:php`: gera a saída das fixtures num diretório temporário (data fixa, nada em `generated/`), para o Laravel 12 e para o Laravel 10 (`laravel-10/`), e roda `php -l` em todos os `.php` num único container Docker `php:8.1-cli` (a versão mínima da spec; só precisa de Docker, não de PHP no host). Falha se algum arquivo tiver erro de sintaxe, exceto os listados em `scripts/phpSyntaxAllowlist.ts`.
- Não há CI no GitHub (decisão do projeto). O hook `.githooks/pre-commit` roda `npx tsc --noEmit`, `npm test` e `npm run lint:php` a cada commit e bloqueia se algo falhar (sem Docker, a checagem PHP é pulada com aviso). O `npm install` ativa o hook pelo script `prepare` (`core.hooksPath`). Não use `--no-verify` para contornar uma falha: corrija.
- **Allowlist do `lint:php`** (`scripts/phpSyntaxAllowlist.ts`): falhas conhecidas do gerador, cada uma com arquivo, motivo e ticket que corrige (hoje vazia: o ticket 09 removeu as últimas entradas). Só mexa nela para remover uma entrada quando o ticket corrigir (a checagem falha se uma entrada deixar de falhar). Nunca acrescente entradas para esconder um erro novo: corrija o gerador.
- `crudmaker stubs:publish [tipo...] [--out <dir>]` (`npm run cli -- stubs:publish ...`): copia os templates embutidos da camada gerada para `stubs/crudmaker/laravel-api/` do projeto de destino; esses stubs têm prioridade, arquivo a arquivo, no `generate`. Em tests, use sempre `--out` num diretório temporário (nunca em `generated/`).
- `npx tsc --noEmit`: checagem de tipos. Passa sem erros. Ainda não há lint.

## Onde está cada coisa

- `src/bin.ts`: entrada do binário (shebang); chama `run` de `src/cli.ts`.
- `src/cli.ts`: `run(argv, io)` devolve o exit code; comandos `generate` e `init`, ajuda e versão. Casca fina em volta de `generate`.
- `src/readManifest.ts`: único ponto de leitura do manifest (caminho → objeto; YAML ou JSON pela extensão) e `UserError`.
- `src/writeFiles.ts`: `planWrites` classifica cada arquivo (criado/sobrescrito/sem mudança/preservado) sem escrever; `applyPlan` grava (nunca um `create-once` existente). `planRemovals`/`applyRemovals` tratam as entidades que saíram do manifest (apagam só bases de `app/Generated/` com cabeçalho de gerado; o resto vira órfão) e `legacyFinalWarnings` avisa finais antigas que não estendem a base. O `--dry-run` e a escrita real usam o mesmo plano.
- `src/initTemplate.ts`: manifest de exemplo do `init` (YAML comentado e JSON; devem gerar o mesmo objeto).
- `src/generate.ts`: `generate(manifest, { now, existingMigrations, target, ... })`, função pura (sem disco) que devolve `{ files, warnings, obsolete }`: `files` é a lista `{ path, content, policy }` (`path` relativo à raiz do projeto Laravel), `warnings` os avisos de nomes alterados e `obsolete` os caminhos de entidades que saíram do manifest (calculados com `previousLock`, o lock anterior que a CLI lê). A opção `normalizeNames` vence `pkg.normalizeNames`.
- `src/targetVersion.ts` e `src/detectTarget.ts`: versão alvo (Laravel 10–12, PHP 8.1+): tipos, validação, `resolveTarget` (flag `--laravel`/`--php` → `pkg.target` → `composer.lock`/`composer.json` do destino → padrão Laravel 12/PHP 8.2) e a leitura do composer. `generate` recebe o resultado em `options.target`.
- `src/targets/laravel-api/capabilities.ts`: traduz a versão alvo em flags de recurso (`it.capabilities.castsMethod`, `nativeColumnChange`...). **É o único lugar que compara números de versão**: templates e view models só consultam as flags. Diferença nova entre versões = flag nova + teste em `tests/targetVersion.test.ts`.
- `src/manifestSchema.ts`: schema zod do manifest (fonte do JSON Schema em `schema/manifest.schema.json`, publicado no pacote).
- `src/normalizeNames.ts`: normalização de nomes (entidade singular camelCase, campo snake_case), avisos e colisões; roda entre a validação estrutural e a validação entre entidades.
- `src/dependencyOrder.ts`: ordenação topológica estável e detecção de ciclos (ordem das migrations por FK e erro de ciclo).
- `src/validateManifest.ts`: pipeline de validação (schema → normalização de nomes → entre entidades: alvos, campo `id`, nomes reservados do PHP, ciclos de FK) e `ManifestValidationError` com `{ path, message }` por problema.
- `src/models/Manifest.ts`: valida via `validateManifest` e normaliza (formas curtas, aliases, campos de FK, unificação de FK declarada + derivada).
- `src/models/Entity.ts`: nome da entidade em vários casings e nome da tabela.
- `src/targets/types.ts`: `GeneratedFile` (`{ path, content, policy, generatedBase? }`), `FilePolicy`, `ObsoleteFile` e `GENERATED_MARKER` (o cabeçalho que marca arquivo gerado).
- `src/targets/laravel-api/`: o target que transforma o modelo normalizado em arquivos Laravel. `index.ts` (`generateLaravelApi`, lista `entityFileTypes`), `render.ts` (motor Eta), `names.ts`, `fileType.ts` e `viewModels/<tipo>.ts` (variáveis de cada template, caminho do arquivo; também `routes.ts` com `ensureRoutesInclude`).
- `src/stubFiles.ts` e `src/targets/laravel-api/stubs.ts`: leitura/publicação dos stubs do projeto e lista dos templates substituíveis (só a camada gerada; as finais não têm stub).
- `templates/laravel-api/`: os templates do PHP gerado: `<tipo>.base.php.eta` (camada gerada) e `<tipo>.final.php.eta` (camada de customização) para model, request, resource, collection e controller, mais `migration.php.eta` e `routes.php.eta`. Vão no pacote publicado (`files` do `package.json`).
- `generated/<pkg.code>/`: saída. Está no `.gitignore` e costuma conter projetos Laravel reais (com código escrito à mão).

## Documentação

- `docs/como-usar.md`: fluxo atual de uso e passos manuais.
- `docs/manifest.md`: referência do formato do manifest e limitações conhecidas.
- `docs/arquitetura.md`: módulos e fluxo interno.
- `docs/specs/crudmaker-v2.md`: spec da reestruturação planejada (CLI, YAML, schema, templates, testes). Siga a ordem de implementação que está nela.

Atualize os docs quando mudar o comportamento do gerador ou o formato do manifest.

## Camadas gerada × customização

Model, controller, request, resource e collection saem em duas classes: a **base** (`App\Generated\...`, pasta `app/Generated/`, `abstract Base<Classe>`, política `overwrite`, cabeçalho "ARQUIVO GERADO") e a **final** (namespace normal, estende a base, nasce vazia com os hooks em comentário, política `create-once`). Regras ao mexer nisso:

- Rotas, type hints dos controllers e relacionamentos da model usam **sempre as classes finais** (o route model binding e o container instanciam o tipo declarado). Nunca tipe uma base num parâmetro de action.
- Um arquivo `create-once` existente nunca é sobrescrito, por nenhuma opção. Não crie `--force`. Se mudar o conteúdo de uma final, só vale para projetos novos.
- Mudar a assinatura de um hook é mudança que quebra o código dos usuários (o PHP acusa assinatura incompatível): registre no changelog.
- O crudmaker só apaga bases de `app/Generated/` com o cabeçalho de gerado, e só de entidades do lock anterior. Finais e migrations nunca são apagadas (viram órfãs na saída).

## Convenções

- O PHP gerado vem de templates Eta em `templates/laravel-api/`, alimentados por view models em `src/targets/laravel-api/viewModels/` (a lógica fica no TS; o template só imprime). Mantenha a saída byte a byte: tabs, linhas só com `\t` e a linha final importam, e as tags de controle ficam sozinhas na linha, em coluna 0, terminando em `-%>`. Detalhes e passo a passo para um novo tipo de arquivo em `docs/arquitetura.md`.
- O namespace base é sempre `App`, e a pasta de saída é derivada do namespace (`App\Http\...` → `app/Http/...`).
- Os nomes de entidade no manifest ficam no singular; tabela = snake_case plural.
- Documentação e comunicação em português.

## Cuidados

- **`crudmaker generate --out <dir>` sobrescreve a camada gerada (`app/Generated/`, migrations, rotas, lock) em `<dir>` sem perguntar**, inclusive edições feitas à mão nesses arquivos, e apaga as bases de entidades que saíram do manifest. As classes finais (`create-once`) são preservadas. Antes de rodar, use `--dry-run` e confira se o destino tem código que não pode ser perdido. Nos testes e experimentos, use sempre diretórios temporários, nunca `generated/`.
- O `manifest-lock.json` é a fonte de verdade do schema emitido (formato em `docs/arquitetura.md`, seção "Lock e migrations"). Mudou o schema de uma entidade já gerada, o `generate` cria uma migration `alter` e não reescreve a de criação; não mexa nesse comportamento sem atualizar os testes de `tests/alterMigrations.test.ts`.
- Não apague nem limpe `generated/`. Ela não está versionada aqui, então não dá para recuperar.
