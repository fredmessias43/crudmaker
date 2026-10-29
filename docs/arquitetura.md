# Arquitetura

O crudmaker é uma CLI TypeScript (`crudmaker`, compilada para `dist/` ou rodada com `tsx`) que transforma um manifest YAML ou JSON em arquivos PHP de uma API Laravel.

## Fluxo

```
crudmaker generate <manifest> --out <dir> [--dry-run] [--[no-]normalize-names]     src/bin.ts → src/cli.ts
    │  readManifest(caminho)      lê e faz o parse (YAML ou JSON, pela extensão)
    ▼
generate(manifest, { now, existingMigrations, ... })     função pura, sem acesso ao disco
    │  Manifest        schema (zod) → normalização de nomes → validação entre entidades → normalização
    │  Entity          (uma por entidade) nome + casings + nome da tabela
    │  target laravel-api   view model (TS) → template (Eta) → arquivo: Model, Resource, Collection, Controller, Request, Migration, rotas
    ▼
{ files, warnings }      files: { path, content, policy }, path relativo à raiz do projeto Laravel
    │  planWrites(files, out)     classifica: criado / sobrescrito / sem mudança / preservado
    │  applyPlan(plan)            só sem --dry-run
    ▼
<out>/manifest-lock.json, <out>/app/...  e  <out>/database/migrations/...
    │
    ▼
resumo e avisos de nomes no stdout
```

### CLI

A CLI é uma casca fina em volta de `generate` (sem lógica de geração):

- `src/bin.ts`: entrada do binário (shebang `#!/usr/bin/env node`); passa `process.argv` para `run` e usa o retorno como exit code.
- `src/cli.ts`: `run(argv, io)` interpreta os argumentos (`node:util` `parseArgs`, sem dependência externa), executa `generate` ou `init` e devolve o exit code. `io` (stdout, stderr, cwd, relógio) é injetável, o que permite testar sem subprocesso. Para `generate`, lê os nomes em `<out>/database/migrations` (lista vazia se a pasta não existe), resolve `--normalize-names` / `--no-normalize-names` (sem flag, `undefined`: vale o manifest), chama `generate` com a data atual, monta o plano de escrita e, sem `--dry-run`, o aplica; depois imprime o resumo e, se houver, a seção `Avisos` (no stdout, como o aviso do `routes/api.php`; o stderr fica para erros).
- `src/readManifest.ts`: único ponto de leitura do manifest: escolhe o parser pela extensão (`.yaml`/`.yml` → YAML 1.2 via lib `yaml`, um documento só e mapa na raiz; `.json` → `JSON.parse`; outra extensão é erro). Erros esperados viram `UserError`; a CLI imprime `Erro: <mensagem>` no stderr e sai com código 1, sem stack trace (defina `CRUDMAKER_DEBUG=1` para vê-lo).
- `src/initTemplate.ts`: conteúdo do manifest criado por `crudmaker init`.

O `npx`/`npm link` usam o campo `bin` do `package.json` (`dist/bin.js`), gerado por `npm run build` (`tsconfig.build.json`, que compila só `src/`).

### `generate` e a camada de escrita

`generate` (`src/generate.ts`) não lê nem escreve em disco. Tudo o que seria "ambiente" entra por `options`:

- `now`: data/hora do prefixo das migrations novas (`yyyy_MM_dd_HHmmss`);
- `existingMigrations`: nomes de arquivo das migrations que já existem no destino. Se algum termina com `_create_<tabela>_table.php`, o nome é reaproveitado em vez de gerar um novo;
- `existingApiRoutes`: conteúdo do `routes/api.php` do destino (ou `null`);
- `normalizeNames` (opcional): liga/desliga a normalização de nomes; quando definida, vale mais que `pkg.normalizeNames` do manifest.

O retorno é `{ files, warnings }`. Os avisos (`string[]`, um por nome alterado ou fora da convenção) vêm junto com os arquivos, em vez de serem impressos, para `generate` continuar pura e quem chama (CLI, scripts, testes) decidir o que mostrar.

Cada arquivo de `files` tem `path`, `content` e `policy` (`overwrite` ou `create-once`). Hoje tudo sai como `overwrite`; `create-once` ainda não é usado pelos geradores. O primeiro item da lista é sempre o `manifest-lock.json`.

`src/writeFiles.ts` tem a camada de escrita, em dois passos:

- `planWrites(files, baseDir)` só lê o disco e classifica cada arquivo: `created` (não existia), `overwritten` (existia, política `overwrite`, conteúdo diferente), `unchanged` (existia, `overwrite`, conteúdo idêntico) ou `preserved` (existia e a política é `create-once`);
- `applyPlan(plan)` grava os `created` e `overwritten`, criando as pastas. Não imprime nada.

O `--dry-run` e a escrita real usam o mesmo plano, então nunca divergem. `writeFiles(files, baseDir)` é o atalho que faz os dois passos.

## Módulos

### `models/Manifest`
Recebe o objeto cru do manifest (e a opção `normalizeNames`) e produz `entities` normalizadas e `warnings`, em quatro etapas:

1. **Schema** (`src/manifestSchema.ts`, zod): estrutura do manifest de entrada (formas curta e longa, aliases `int`/`displayName`, tipos conhecidos, chaves obrigatórias). É a fonte do JSON Schema publicado em `schema/manifest.schema.json` (`npm run schema`, via `z.toJSONSchema` do zod 4 com `io: "input"`, que descreve o que se escreve no manifest e não o resultado das transformações). Chaves desconhecidas são toleradas e descartadas.
2. **Normalização de nomes** (`src/normalizeNames.ts`), só com a estrutura válida e antes da validação entre entidades. Entidades (chaves de `pkg.entities` e referências nos relacionamentos) viram singular camelCase; campos (chaves, `name` explícito e `field` explícito de relacionamento) viram snake_case. Devolve um aviso por nome alterado e as colisões como problemas de validação. Desligada (`pkg.normalizeNames: false` ou a opção/flag), não altera nada, mas ainda avisa o que está fora da convenção. Não altera a entrada (função pura).
3. **Validação entre entidades** (`src/validateManifest.ts`): relacionamento para entidade inexistente (com os nomes já normalizados e o caminho original no arquivo) e `enum` sem itens (checado antes, com os nomes originais). `validateManifest` orquestra as etapas 1 a 3 e devolve `{ input, warnings, normalizeNames }`. As issues do zod são convertidas em `{ path, message }` em português, com o caminho real no arquivo; qualquer falha lança `ManifestValidationError` (subclasse de `UserError`) com todos os problemas da etapa. A CLI a imprime com um problema por linha.
4. **Normalização** (`normalizeEntity` em `src/models/Manifest.ts`), só com a entrada já válida:
   - campo na forma curta (`"name": "string"`) vira `{ type, name, required: true, unique: false, enumItems: [] }`;
   - aliases são resolvidos (`int` → `integer`, `displayName` → campo `display_name` do tipo `string`);
   - cada relacionamento vira `{ entity, field, required, relationship }`;
   - `belongsTo` adiciona o campo de FK (`uuid`, com `relationship: true`) aos `fields`; com a normalização de nomes ligada, a FK da forma curta passa por snake_case (`courseContent` → `course_content_id`) e uma FK já declarada à mão com o mesmo nome é unificada (vale a declaração explícita, completada com `relationship: true`);
   - `owned`/`morphed` adicionam `owner_id` e `owner_class`.

`manifestToString()` serializa o resultado normalizado; `generate` o devolve como o arquivo `manifest-lock.json`. Os tipos do modelo normalizado continuam em `src/types.ts`.

### `models/Entity`
Envolve uma entidade normalizada. `getEntityName(casing)` devolve o nome em qualquer formato do `change-case` (`pascalCase`, `snakeCase`...), e `getTableName()` devolve o snake_case no plural.

### Targets e templates

A saída é organizada em *targets*: um target recebe o modelo normalizado de entidades (mais o ambiente da geração) e devolve arquivos, sem tocar o disco. Hoje existe um só, o `laravel-api`, em `src/targets/laravel-api/`. O modelo normalizado não tem nada específico de PHP/Laravel; tudo o que é Laravel fica dentro do target.

Cada arquivo gerado passa por três etapas:

```
modelo normalizado (Entity)  →  view model (TS)  →  template (Eta)  →  { path, content, policy }
```

- **View model** (`src/targets/laravel-api/viewModels/<tipo>.ts`): converte a entidade nas variáveis do template (`it.*`): nomes em cada casing, `use`s sem repetição, linhas de `$casts`, métodos de relacionamento, regras de validação, colunas da migration. Também decide o caminho do arquivo. É aqui que fica a lógica; o template só imprime.
- **Template** (`templates/laravel-api/<tipo>.php.eta`, na raiz do pacote e listado em `files` do `package.json`): texto parecido com o PHP final, com tags do [Eta](https://eta.js.org) só para interpolar variáveis e repetir blocos. Cada template é autocontido (sem partials), para facilitar a futura cópia como stub do projeto.
- **Motor** (`src/targets/laravel-api/render.ts`): configura o Eta com `autoTrim: false` e `autoEscape: false`. O resultado precisa bater byte a byte com os snapshots, então nada de espaço é removido ou normalizado implicitamente.

Convenções de whitespace dos templates (para a saída ser previsível):

- indentação com tabs (`\t`); linhas só com um tab existem de propósito (os snapshots as registram) e não devem ser "limpas" pelo editor;
- tags de controle (`<% for ... { -%>`, `<% } -%>`) ficam sozinhas na linha, em coluna 0, e terminam em `-%>`, que remove só a quebra de linha seguinte;
- tags de saída (`<%~ it.x %>`, sem escape) ficam no meio da linha e não alteram nada em volta;
- o arquivo termina com uma única quebra de linha após o `};` ou a última linha.

Módulos do target:

| Arquivo | Papel |
|---|---|
| `index.ts` | `generateLaravelApi(input)`: percorre as entidades, aplica cada tipo de arquivo (`entityFileTypes`) e acrescenta as rotas e o `routes/api.php` |
| `fileType.ts` | tipos `EntityFileType` (template + `build(entity, ctx)` que devolve `{ path, view }`) e `EntityFileContext` |
| `render.ts` | motor Eta e `renderTemplate(nome, dados)`; ponto único de resolução de template |
| `names.ts` | `BASE_NAMESPACE` (`App`), nomes da entidade em cada casing e `namespaceToFolder` (`App\Http\Requests` → `app/Http/Requests`) |
| `viewModels/classHeader.ts` | parte comum dos templates de classe (namespace, `use`s deduplicados na ordem de declaração, classe e `extends`) e `classPath` |
| `viewModels/{model,resource,collection,controller,request,migration}.ts` | um view model por tipo de arquivo por entidade |
| `viewModels/routes.ts` | view model de `routes/crudmaker.php` (uma `apiResource` por entidade, recurso = tabela em kebab-case) e `ensureRoutesInclude`, que acrescenta o `require` ao `routes/api.php` se faltar |

| Tipo | Gera |
|---|---|
| `model` | Model com UUID, SoftDeletes, `$casts`, `$fillable` e métodos de relacionamento |
| `migration` | Migration anônima de criação da tabela, com FKs, timestamps, soft deletes e índices únicos. Reaproveita o nome de uma migration já existente |
| `request` | FormRequest com `prepareForValidation` (completa campos ausentes a partir da model da rota) e `rules` |
| `resource` / `collection` | JsonResource e ResourceCollection com os campos e as datas formatadas |
| `controller` | Controller de API com `index`, `store`, `show`, `update` e `destroy` |
| `routes` | `routes/crudmaker.php`, gerado uma vez por projeto (não por entidade) |

#### Como adicionar um tipo de arquivo

1. Crie `templates/laravel-api/<tipo>.php.eta`.
2. Crie `src/targets/laravel-api/viewModels/<tipo>.ts` exportando um `EntityFileType` (`template: "<tipo>"` e `build` devolvendo `{ path, view }`; use `classHeader` e `classPath` para classes).
3. Registre-o em `entityFileTypes` (`src/targets/laravel-api/index.ts`); a ordem da lista é a ordem dos arquivos na saída.
4. Gere os snapshots (revisando o diff) e rode `npm run lint:php`.

Um arquivo por projeto (como as rotas) não passa por `entityFileTypes`: renderize-o direto em `generateLaravelApi`.

O `generate` continua puro: a CLI lê o `routes/api.php` do destino (ou `null` se não existe) e passa o texto em `options.existingApiRoutes`. Com texto, o `generate` devolve o `routes/api.php` com o include (idêntico ao atual se já estiver lá), e o `planWrites` o classifica como qualquer outro arquivo (sobrescrito ou sem mudança), o que mantém o `--dry-run` fiel. Com `null`, o arquivo não é gerado e a CLI imprime o aviso sobre `php artisan install:api`.

Ainda não existem stubs do projeto (prioridade arquivo a arquivo sobre os templates embutidos) nem variantes por versão do Laravel; `renderTemplate` é o ponto onde a resolução do template passará a considerar essas camadas.

## Dependências

| Pacote | Uso |
|---|---|
| `change-case` | casings dos nomes |
| `pluralize` | nome das tabelas e dos métodos `hasMany` |
| `lodash` | `snakeCase`, `uniq` |
| `eta` | motor dos templates do PHP gerado (`templates/`) |
| `date-fns` | timestamp do nome da migration |
| `yaml` | parse do manifest em YAML 1.2 (modo padrão, sem tags customizadas; erros com linha e coluna) |
| `zod` | schema e validação do manifest, e o JSON Schema publicado |

## Testes

`tests/cli.test.ts` cobre a CLI: chama `run(argv, io)` em diretórios temporários (criação, regeração, `--dry-run`, `init`, erros, ajuda) e tem um teste que roda o binário em subprocesso.

`tests/validate.test.ts` cobre a validação (fixtures válidos, manifests inválidos com caminho e mensagem, vários erros de uma vez) e confere que `schema/manifest.schema.json` está em dia com o schema zod.

`tests/normalizeNames.test.ts` cobre a normalização de nomes (regras, avisos, colisões, FK declarada + derivada, precedência opção × manifest, as fixtures antigas ligadas × desligadas e o JSON Schema).

`tests/yaml.test.ts` cobre o YAML: cada fixture tem um `manifest.yaml` que precisa ler o mesmo objeto e gerar a mesma saída do JSON, os erros de sintaxe/vazio/multi-documento/extensão, e o `init` em cada formato (o exemplo YAML tem de ser igual ao JSON).

`tests/generate.test.ts` também cobre as rotas (nome do recurso, include, idempotência, detecção por variações de espaço e aspas). Ele chama `generate` para os manifests de `tests/fixtures/` com data fixa e sem migrations existentes. Os snapshots de `bingo`, `curso` e `vende-que-vende-api` são a saída de antes da normalização de nomes e valem com ela **desligada** (`normalizeNames: false`); `bingo-2` (entidades no plural, FKs declaradas à mão) tem snapshot com a normalização ligada, o padrão. O conteúdo de cada arquivo é comparado com um snapshot em `tests/__snapshots__/<fixture>/<path>`, e a lista de caminhos com `_paths.txt`. Os snapshots registram a saída atual, inclusive bugs conhecidos. Foram eles que provaram que a migração para templates (ticket 07) não mudou a saída.

### Sintaxe do PHP gerado

`npm run lint:php` (`scripts/checkPhpSyntax.ts`) valida que o PHP gerado é sintaticamente válido. Ele chama `generate` (normalização no padrão, ligada) para as fixtures de `tests/fixtures/` com data fixa, grava a saída num diretório temporário do sistema (nunca em `generated/` nem no repositório) e monta esse diretório como volume somente leitura num único `docker run --rm` da imagem oficial `php:8.1-cli`, com o UID/GID do usuário, que roda `php -l` em cada `.php`. O script lista os arquivos com erro, sai com código diferente de zero se houver falha inesperada (ou 2 se o Docker não estiver disponível) e apaga o diretório temporário no fim. A versão 8.1 é a mínima prometida pela spec: se parseia nela, parseia nas mais novas.

A checagem olha a saída de `generate`, e não os snapshots, para não depender deles: um snapshot pode ser atualizado com `-u` sem que ninguém perceba que o PHP ficou inválido, e a checagem continua valendo mesmo que a forma de guardar os snapshots mude.

`scripts/phpSyntaxAllowlist.ts` lista as falhas conhecidas (arquivo, motivo e ticket que corrige). Elas aparecem como "conhecido" e não quebram a checagem; uma entrada que deixa de falhar também quebra a checagem, para a lista não apodrecer. `tests/phpSyntax.test.ts` testa a classificação sem Docker e, com `PHP_DOCKER_TESTS=1`, prova com Docker que um PHP inválido reprova (a variável `CRUDMAKER_INJECT_INVALID_PHP=1` faz o script injetar um arquivo inválido).

Não há CI no GitHub: o hook versionado `.githooks/pre-commit` roda `npx tsc --noEmit`, `npm test` e `npm run lint:php` a cada commit (cerca de 5 s) e bloqueia o commit se algo falhar. Sem Docker (o script sai com 2), a checagem PHP é pulada com aviso. O script `prepare` do `package.json` ativa o hook com `git config core.hooksPath .githooks`.

## Próximos passos

A reestruturação (CLI, YAML, schema, templates, separação entre código gerado e customizado, testes) está descrita em [specs/crudmaker-v2.md](specs/crudmaker-v2.md).
