# Arquitetura

O crudmaker é uma CLI TypeScript (`crudmaker`, compilada para `dist/` ou rodada com `tsx`) que transforma um manifest YAML ou JSON em arquivos PHP de uma API Laravel.

Este documento explica os módulos e o fluxo interno, para quem vai mexer no gerador. Leia antes [como-usar.md](como-usar.md) (o comportamento visto de fora) e [manifest.md](manifest.md) (o formato); as decisões de projeto estão em [specs/crudmaker-v2.md](specs/crudmaker-v2.md).

## Fluxo

```
crudmaker generate <manifest> --out <dir> [--dry-run] [--[no-]normalize-names]     src/bin.ts → src/cli.ts
    │  readManifest(caminho)      lê e faz o parse (YAML ou JSON, pela extensão)
    ▼
generate(manifest, { now, existingMigrations, ... })     função pura, sem acesso ao disco
    │  Manifest        schema (zod) → normalização de nomes → validação entre entidades → normalização
    │  Entity          (uma por entidade) nome + casings + nome da tabela
    │  target laravel-api   view model (TS) → template (Eta) → arquivo: base e final de Model, Resource, Collection, Controller, Request e Factory; controllers aninhados; enums; Migration; teste Pest; rotas; seeders (opcionais)
    ▼
{ files, warnings, obsolete }   files: { path, content, policy }, path relativo à raiz do projeto Laravel; obsolete: arquivos de entidades removidas
    │  planWrites(files, out)     classifica: criado / sobrescrito / sem mudança / preservado
    │  planRemovals(obsolete, out)   classifica o que existe: removido (camada gerada) / órfão
    │  applyPlan(plan), applyRemovals(removals)   só sem --dry-run
    ▼
<out>/manifest-lock.json, <out>/app/Generated/... (bases), <out>/app/... (finais)  e  <out>/database/migrations/...
    │
    ▼
resumo, órfãos e avisos (nomes, finais antigas) no stdout
```

### CLI

A CLI é uma casca fina em volta de `generate` (sem lógica de geração):

- `src/bin.ts`: entrada do binário (shebang `#!/usr/bin/env node`); passa `process.argv` para `run` e usa o retorno como exit code.
- `src/cli.ts`: `run(argv, io)` interpreta os argumentos (`node:util` `parseArgs`, sem dependência externa), executa `generate`, `new`, `init` ou `stubs:publish` e devolve o exit code. `io` (stdout, stderr, cwd, relógio e, para o `new`, o executor de comandos, o `COMPOSER_HOME` e o UID/GID) é injetável, o que permite testar sem subprocesso. Para `generate`, lê os nomes em `<out>/database/migrations` (lista vazia se a pasta não existe) e o `manifest-lock.json` anterior (`previousLock`; `null` se não existe, com aviso se estiver ilegível), resolve `--normalize-names` / `--no-normalize-names` (sem flag, `undefined`: vale o manifest), chama `generate` com a data atual, monta o plano de escrita e o de remoção e, sem `--dry-run`, aplica os dois; depois imprime o resumo (com `removidos`, o total e a seção `Órfãos`) e, se houver, a seção `Avisos` (nomes alterados e finais antigas que não estendem a base) (no stdout, como o aviso do `routes/api.php`; o stderr fica para erros).
- `src/targetVersion.ts` e `src/detectTarget.ts`: a versão alvo (veja [Versão alvo e capacidades](#versão-alvo-e-capacidades)). Na CLI: lê as flags `--laravel`/`--php` e o `pkg.target` do manifest cru, chama `detectTarget(outDir)` (lê `composer.lock`/`composer.json`), resolve com `resolveTarget` (erros e avisos de divergência), passa o resultado em `options.target` e imprime `Versão alvo: ...` no topo do resumo.
- `src/commandRunner.ts` e `src/scaffold.ts`: o `crudmaker new` (veja [Scaffold via Docker](#scaffold-via-docker)).
- `src/stubFiles.ts`: leitura dos stubs do projeto e `stubs:publish` (veja [Stubs do projeto](#stubs-do-projeto)). O `generate` lê `stubs/crudmaker/laravel-api/*.php.eta` e o `stubs-lock.json` do destino e os passa a `generate`; avisos de stub (ignorado, desatualizado, lock ilegível) saem na seção `Avisos`.
- `src/readManifest.ts`: único ponto de leitura do manifest: escolhe o parser pela extensão (`.yaml`/`.yml` → YAML 1.2 via lib `yaml`, um documento só e mapa na raiz; `.json` → `JSON.parse`; outra extensão é erro). Erros esperados viram `UserError`; a CLI imprime `Erro: <mensagem>` no stderr e sai com código 1, sem stack trace (defina `CRUDMAKER_DEBUG=1` para vê-lo).
- `src/initTemplate.ts`: conteúdo do manifest criado por `crudmaker init`. Com `--ai`, o `init` também copia `docs/guia-ia.md` (publicado no pacote, no `files` do `package.json`) para `CRUDMAKER.md` ao lado do manifest; o arquivo existente nunca é sobrescrito.

O `npx`/`npm link` usam o campo `bin` do `package.json` (`dist/bin.js`), gerado por `npm run build` (`tsconfig.build.json`, que compila só `src/`).

### Scaffold via Docker

`crudmaker new <dir> <manifest>` não guarda cópia do esqueleto Laravel nem exige PHP/composer no host: cria o projeto com o composer oficial, em containers efêmeros.

- `src/commandRunner.ts`: a interface `CommandRunner.run(command, args, { cwd, stdio })` é o **único** ponto por onde o scaffold executa programas externos (só o `docker`). A implementação real (`spawnRunner`) usa `spawnSync` com `stdio: "inherit"` nos passos, então a saída do composer/artisan aparece em tempo real (bloqueando a CLI, que é síncrona), e `pipe` no `docker info`. Os testes injetam um executor falso (`io.runner`) que só registra as chamadas.
- `src/scaffold.ts`: puro, salvo `runScaffold` e `assertEmptyTarget`. `composerImage(php)` escolhe `laravelsail/phpXX-composer:latest` (existem php81 a php84; outro PHP é erro claro); `scaffoldSteps(options)` devolve os passos pela versão (`install:api` só no Laravel 11+; `sail:install` só sem `--no-sail`, com `--with=<banco>`, ou `--with=none` para sqlite); `dockerRunArgs` monta o `docker run --rm --user UID:GID -v <dir>:/var/www/html -w /var/www/html -v <COMPOSER_HOME>:/composer -e COMPOSER_HOME=/composer <imagem> <comando>`; `assertDockerAvailable` roda `docker info` (não instalado × daemon parado); `runScaffold` roda os passos em ordem e, se um falha, lança `UserError` dizendo o passo e o `docker run` equivalente, **sem apagar** o diretório parcial.
- `runNew` em `src/cli.ts` orquestra: parse das flags → leitura do manifest → `resolveTarget` (flag, `pkg.target`, padrão; não há composer no destino ainda) → validação do manifest chamando `generate` (função pura; erro antes de qualquer container) → imagem → diretório vazio → Docker → `runScaffold` → o mesmo `generateProject` do `generate` (extraído de `runGenerate`; a versão é então detectada no `composer.lock` do projeto novo) → resumo com os próximos passos.

O `COMPOSER_HOME` é `~/.cache/crudmaker/composer` (ou `$XDG_CACHE_HOME/...`), criado pelo usuário no host antes do Docker (para não ficar com dono root) e montado em `/composer`: dá ao `--user` arbitrário um diretório gravável e mantém o cache de pacotes entre execuções.

Testes: `tests/new.test.ts` (no `npm test`, executor falso: imagem por PHP, versão do Laravel, UID/GID e volumes, passos por versão, banco do Sail, `--no-sail`, `--skip-generate`, pré-checagens, falha de passo). `tests/new.e2e.test.ts` usa Docker de verdade e só roda com `CRUDMAKER_E2E=1 npx vitest run tests/new.e2e.test.ts` (Laravel 12 + sqlite, manifest `tests/e2e/blog.json`; confere o projeto, `route:list` e `migrate`, e sobe `php artisan serve` num container descartável para chamar `POST` e `GET /api/authors/{author}/posts` e conferir 201/200, o `author_id` da URL e os 422/404).

### `generate` e a camada de escrita

`generate` (`src/generate.ts`) não lê nem escreve em disco. Tudo o que seria "ambiente" entra por `options`:

- `now`: base do prefixo das migrations novas (`yyyy_MM_dd_HHmmss`). A migration na posição *n* da ordem de dependência de FK usa `now` + *n* segundos;
- `existingMigrations`: nomes de arquivo das migrations que já existem no destino. Se algum termina com `_create_<tabela>_table.php`, o nome é reaproveitado em vez de gerar um novo (regerar nunca renomeia). O prefixo das migrations novas nunca é anterior à migration mais recente que já existe (no destino ou no lock): a base é `max(now, mais recente + 1 s)`;
- `existingApiRoutes`: conteúdo do `routes/api.php` do destino (ou `null`);
- `normalizeNames` (opcional): liga/desliga a normalização de nomes; quando definida, vale mais que `pkg.normalizeNames` do manifest;
- `target` (opcional): a versão alvo `{ laravel: 10 | 11 | 12, php: "8.1" ... }` (padrão: Laravel 12, PHP 8.2). Vira as capacidades dos templates e é registrada no lock. A resolução (flag, manifest, composer) é da CLI; `generate` só valida (`assertSupported`: lança `TargetVersionError` para versão não suportada ou PHP abaixo do mínimo do Laravel) e avisa se o `target` do lock anterior é outro;
- `previousLock` (opcional): o `manifest-lock.json` anterior do destino, já parseado (ou `null`). As entidades que estavam nele e não geram mais os mesmos caminhos viram `obsolete`; é também a fonte de verdade do schema já emitido, de onde saem as migrations `alter` (veja [Lock e migrations](#lock-e-migrations)).

O retorno é `{ files, warnings, obsolete }`. Os avisos (`string[]`, um por nome alterado ou fora da convenção) vêm junto com os arquivos, em vez de serem impressos, para `generate` continuar pura e quem chama (CLI, scripts, testes) decidir o que mostrar.

Cada arquivo de `files` tem `path`, `content` e `policy` (`overwrite` ou `create-once`) e, nas classes finais, `generatedBase` (a base que ela deve estender). A política vem da camada: bases gerada, rotas e lock são `overwrite`; as classes finais são `create-once`. As migrations dependem do lock: a de criação de uma tabela que o lock anterior já tinha (e cujo arquivo existe no destino) e toda `alter` são `create-once`; a de criação de tabela nova, ou sem lock anterior, é `overwrite`. O primeiro item da lista é sempre o `manifest-lock.json`.

`obsolete` é uma lista `{ path, kind }` de caminhos *possíveis* de entidades que saíram do manifest: `generated` (bases, que o crudmaker pode apagar), `custom` (finais, que só são listadas) e `migration` (só se já existe uma migration da tabela no destino; nunca é apagada). É calculada refazendo, para as entidades do lock anterior, os caminhos dos mesmos tipos de arquivo e tirando os que a geração atual também produz; nenhum conteúdo é renderizado. Como `generate` não olha o disco, quem decide o que existe é o plano de remoção.

`src/writeFiles.ts` tem a camada de escrita, em dois passos:

- `planWrites(files, baseDir)` só lê o disco e classifica cada arquivo: `created` (não existia), `overwritten` (existia, política `overwrite`, conteúdo diferente), `unchanged` (existia, `overwrite`, conteúdo idêntico) ou `preserved` (existia e a política é `create-once`);
- `applyPlan(plan)` grava os `created` e `overwritten`, criando as pastas. Não imprime nada. **Garantia do `create-once`**: `preserved` não é gravado, e não existe nenhuma opção (nem `--force`) que mude isso; é a única porta de escrita de arquivos gerados.

O `--dry-run` e a escrita real usam o mesmo plano, então nunca divergem. `writeFiles(files, baseDir)` é o atalho que faz os dois passos.

Mais três funções, também em `src/writeFiles.ts`:

- `legacyFinalWarnings(plan)` lê os arquivos `preserved` que têm `generatedBase` e avisa os que não contêm `extends ...Base<Classe>`: são classes completas de uma versão antiga do crudmaker, que a base nova não alcança. A checagem é textual;
- `planRemovals(obsolete, baseDir)` olha só os caminhos de `obsolete` que existem no disco. Um arquivo de `kind: "generated"` vira `removed` somente se o caminho está em `app/Generated/` dentro do destino (sem escapar por `..`) e o arquivo tem o cabeçalho `ARQUIVO GERADO PELO CRUDMAKER`; tudo o mais (finais, migrations, uma base sem cabeçalho) vira `orphaned`;
- `applyRemovals(removals, baseDir)` apaga os `removed` e as pastas vazias que sobrarem dentro de `app/Generated/`.

### Lock e migrations

O `manifest-lock.json` é o registro do que foi emitido: o schema normalizado e as migrations já geradas. Formato (`lockVersion: 2`):

```json
{
  "lockVersion": 2,
  "code": "alter",
  "version": "0.1.0",
  "target": { "laravel": 12, "php": "8.2" },
  "entities": { "client": { "fields": { "id": { "type": "uuid", "name": "id", "required": true, "unique": false, "enumItems": [] } }, "relationships": {} } },
  "migrations": [
    { "file": "2025_01_02_030405_create_clients_table.php", "table": "clients", "type": "create" },
    {
      "file": "2025_01_02_030410_alter_clients_table.php",
      "table": "clients",
      "type": "alter",
      "changes": [ { "op": "dropColumn", "column": "nickname" }, { "op": "addColumn", "column": "phone" } ]
    }
  ]
}
```

- `target`: a versão alvo usada na geração; um lock sem ela (de uma versão antiga) não dispara o aviso de mudança de versão;
- `entities`: o manifest normalizado (o mesmo do lock de formato 1), o schema que a geração anterior emitiu;
- `migrations`: histórico acumulado, em ordem de emissão. `type` é `create` ou `alter`; `changes` (só nas `alter`) lista as operações (`addColumn`, `dropColumn`, `changeColumn`, `addUnique`, `dropUnique`, `addForeign`, `dropForeign`) e a coluna de cada uma. Entradas sem esse formato são ignoradas ao ler;
- **Compatibilidade**: um lock sem `lockVersion` (formato 1) tem só `code`, `version` e `entities`. É lido como "schema = `entities` do lock; migrations = as de criação que existirem no destino": `generate` não precisa de `migrations` para decidir nada, usa o nome das migrations de `existingMigrations`. O lock regravado já sai no formato 2, com as de criação registradas.

Regras de `generate` por tabela (a entidade é achada no lock pela tabela):

| Situação | Migration de criação | Migration `alter` |
|---|---|---|
| Sem lock anterior, ou a tabela não estava no lock | gerada; se já há uma do crudmaker (com cabeçalho) com o sufixo `_create_<tabela>_table.php`, o nome é reaproveitado e o conteúdo é reescrito (`overwrite`, comportamento de antes do lock); se a que existe não é do crudmaker, nada é gerado (veja abaixo) | nenhuma |
| Estava no lock e a migration de criação existe no destino | `create-once`: nunca reescrita | uma, se o schema mudou |
| Estava no lock mas a migration de criação não existe no destino | gerada nova com o schema atual (`overwrite`) e um aviso | nenhuma |
| Estava no lock e saiu do manifest | continua no destino (órfã, listada no resumo) | nenhuma: não há `drop table` automático |

#### Propriedade das migrations

Só uma migration "do crudmaker" é reaproveitada, preservada ou reescrita. É do crudmaker a que o lock registra em `migrations` ou que tem o cabeçalho `ARQUIVO GERADO PELO CRUDMAKER` (os templates `migration` e `migration.alter` o trazem, com a mesma constante `GENERATED_MARKER` dos arquivos de `app/Generated`). A CLI lê o início de cada arquivo de `database/migrations` e passa a `generate` a lista `unmarkedMigrations` (os sem cabeçalho); `generate` tira dela as registradas no lock (e, com lock formato 1, as de criação das tabelas do lock) e passa o resto ao target como `foreignMigrations`. Sem `unmarkedMigrations` (chamadas diretas a `generate`, testes), tudo vale como do crudmaker.

No target, `existingMigrations` do contexto passa a conter só as do crudmaker. Uma entidade cuja tabela tem uma migration de criação "de fora" e nenhuma do crudmaker entra em `foreignTables`: o tipo de arquivo `migration` é pulado e o fluxo das `alter` trata a tabela:

- `users` (`SKELETON_COLUMNS`, em `viewModels/skeleton.ts`): o estado anterior é as colunas do esqueleto mais as do lock, e o diff descarta qualquer operação sobre uma coluna do esqueleto (só se acrescenta);
- outra tabela, sem entrada no lock: nada é gerado, só um aviso (as colunas existentes são desconhecidas). Com entrada no lock, o diff contra o lock vale (sem tocar o `id`);
- nenhuma migration "de fora" entra no `migrations` do lock.

`skeletonUsers` (contexto): `users` é uma tabela de fora e há uma entidade `user`. Liga o modo do esqueleto: model base `Authenticatable` sem `HasUuids`/`SoftDeletes`, FKs para `users` como `unsignedBigInteger` (`columnField`, em `viewModels/migration.ts`, usado pela migration, pelo diff e pela `alter`) e regra `integer` nas requests. O aviso de migração do `User.php` do esqueleto (que estende `Authenticatable`) está em `legacyFinalWarnings`, em `writeFiles.ts`.

O diff (`diffEntity`, em `viewModels/migrationAlter.ts`) compara as colunas pelo `name` e as FKs pelos `belongsTo`. Só entra no banco o que muda tipo, `required`, `default` efetivo (em enum, o primeiro item conta), itens do enum, `unique` e FK; `hidden`, `rules` e `api` não geram migration. Cada operação sabe se inverter, e o `down()` é o `up()` invertido na ordem contrária. O `up()` roda: `dropForeign`, `dropUnique`, `dropColumn`, `addColumn`, `changeColumn` (`->change()`), `addUnique`, `addForeign`.

Nome e data: `<yyyy_MM_dd_HHmmss>_alter_<tabela>_table.php`, um por tabela alterada por execução. O prefixo é `base + (nº de entidades) + posição`, na ordem de dependência de FK, onde `base = max(now, migration mais recente conhecida + 1 s)` (conhecida = no destino ou no lock). Assim as `alter` rodam depois de todas as criações da mesma geração, e dois `alter` da mesma tabela em execuções diferentes nunca têm o mesmo nome, mesmo que o relógio seja o mesmo. O template é `templates/laravel-api/migration.alter.php.eta` e não é substituível por stub.

## Módulos

### `models/Manifest`
Recebe o objeto cru do manifest (e a opção `normalizeNames`) e produz `entities` normalizadas e `warnings`, em quatro etapas:

1. **Schema** (`src/manifestSchema.ts`, zod): estrutura do manifest de entrada (formas curta e longa, aliases `int`/`displayName`, tipos conhecidos, chaves obrigatórias). É a fonte do JSON Schema publicado em `schema/manifest.schema.json` (`npm run schema`, via `z.toJSONSchema` do zod 4 com `io: "input"`, que descreve o que se escreve no manifest e não o resultado das transformações). Chaves desconhecidas são toleradas e descartadas.
2. **Normalização de nomes** (`src/normalizeNames.ts`), só com a estrutura válida e antes da validação entre entidades. Entidades (chaves de `pkg.entities` e referências nos relacionamentos) viram singular camelCase; campos (chaves, `name` explícito e `field` explícito de relacionamento) viram snake_case; no bloco `api`, os campos de `filters`/`search`/`sort`/`defaultSort` (o `-` da frente é preservado) viram snake_case e os de `with`, camelCase. Devolve um aviso por nome alterado e as colisões como problemas de validação. Desligada (`pkg.normalizeNames: false` ou a opção/flag), não altera nada, mas ainda avisa o que está fora da convenção. Não altera a entrada (função pura).
3. **Validação entre entidades** (`src/validateManifest.ts`): relacionamento para entidade inexistente, entidade sem campo `id`, nome de entidade que gera classe com palavra reservada do PHP e ciclo de FK entre `belongsTo` (tudo com os nomes já normalizados e o caminho original no arquivo; o ciclo só é checado se os alvos existem), e `enum` sem itens (checado antes, com os nomes originais). Também confere os nomes do bloco `api` (campos em `filters`/`search`/`sort`/`defaultSort`, relacionamentos em `with`) contra a entidade, usando `src/apiOptions.ts` (colunas da entidade, inclusive FKs derivadas, e os nomes de método dos relacionamentos) e `src/relationNames.ts` (a regra do nome do método, partilhada com a model), e recusa `filters`/`search`/`sort`/`defaultSort`/`with` em `pkg.defaults.api`. A detecção de ciclos usa `src/dependencyOrder.ts`, o mesmo módulo que ordena as migrations. `validateManifest` orquestra as etapas 1 a 3 e devolve `{ input, warnings, normalizeNames }`. As issues do zod são convertidas em `{ path, message }` em português, com o caminho real no arquivo; qualquer falha lança `ManifestValidationError` (subclasse de `UserError`) com todos os problemas da etapa. A CLI a imprime com um problema por linha.
4. **Normalização** (`normalizeEntity` em `src/models/Manifest.ts`), só com a entrada já válida:
   - campo na forma curta (`"name": "string"`) vira `{ type, name, required: true, unique: false, enumItems: [] }`;
   - `hidden`, `rules` e `default` só entram no campo normalizado se declarados (o lock das fixtures antigas não muda); `hidden` alimenta a resource base e o `$hidden` da model, `rules` a request base (depois das regras do tipo, sem duplicar) e `default` a migration e a factory. A compatibilidade do `default` com o tipo é checada em `validateFieldDefaults` (`src/validateManifest.ts`), com os nomes originais;
   - aliases são resolvidos (`int` → `integer`, `displayName` → campo `display_name` do tipo `string`);
   - cada relacionamento vira `{ entity, field, required, relationship }`;
   - `pkg.defaults.api` e o `api` da entidade são mesclados chave a chave (`resolveApi` em `src/apiOptions.ts`; a lista da entidade substitui a do padrão) e guardados em `entity.api`, só se algum dos dois declara algo (sem eles o lock não muda);
   - `belongsTo` adiciona o campo de FK (`uuid`, com `relationship: true`) aos `fields`; a FK da forma curta é sempre `<entidade em snake_case>_id` (`courseContent` → `course_content_id`), com ou sem normalização de nomes; com a normalização ligada, uma FK já declarada à mão com o mesmo nome é unificada (vale a declaração explícita, completada com `relationship: true`);
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

#### Camadas: base gerada × classe final

Model, controller, request, resource, collection e factory geram dois arquivos cada, via dois tipos em `entityFileTypes` (um `EntityFileLayer` em `fileType.ts`):

- `generated` (`<tipo>.base.php.eta`): classe `abstract Base<Classe>` em `App\Generated\<namespace normal>`, pasta `app/Generated/...`, política `overwrite`, com o cabeçalho `ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE`;
- `custom` (`<tipo>.final.php.eta`): a classe no namespace normal, que estende a base, nasce vazia com um comentário dos hooks e tem política `create-once`. Todas as finais são criadas pelo mesmo `finalClassFile(...)` de `classHeader.ts`; só o template muda;
- `migration`: arquivo único, sem base nem final.

A **factory** foge do padrão de pastas: a final fica onde o Laravel a procura pelo nome da model (`Database\Factories\ClientFactory`, `database/factories/`), mas a base mora em `app/Generated/Factories/` (`App\Generated\Factories\BaseClientFactory`), para continuar na pasta que o crudmaker pode apagar quando a entidade sai do manifest e que o `HasFactory` e o autoload (`App\` → `app/`) já alcançam; `factoryPair` (em `viewModels/factory.ts`) monta o par. A base declara `protected $model` com a model final.

`classPair(namespace, classe)` (em `classHeader.ts`) devolve `{ base, final }` com namespace, nome, `fqcn` e caminho de cada uma; o view model da base e o da final usam o mesmo par, então os nomes não divergem.

Tipos que as bases usam (decisão): **sempre as classes finais**. A base do controller tipa `ClientRequest` e `Client` nos parâmetros porque o container (request) e o route model binding (model) instanciam o tipo *declarado*: com `BaseClientRequest` o `extraRules()` do usuário nunca rodaria, e com uma base abstrata o binding nem conseguiria criar o objeto (nem teria a tabela certa). Pelo mesmo motivo a base da request faz `instanceof` na model final, a collection usa `$collects = ClientResource::class` (a resource final por item) e os relacionamentos da model base apontam para as models finais das outras entidades (import de `App\Models\...`). A model base nunca cita a final da própria entidade: o Eloquent deduz tabela e chaves estrangeiras da classe em uso (`static`), que é a final. As rotas continuam apontando para os controllers finais.

Hooks, nas bases:

| Classe | Hooks (`protected`, sem efeito na base) |
|---|---|
| Controller | `indexQuery(Builder, Request): Builder`, `beforeStore(array, Request): array`, `afterStore(Model, Request): void`, `beforeUpdate(Model, array, Request): array`, `afterUpdate(Model, Request): void`, `beforeDestroy(Model, Request): void`, `afterDestroy(Model, Request): void` (`Model` = a model final da entidade). `store`, `update` e `destroy` rodam a escrita e os hooks em `DB::transaction`; a resposta é montada depois dela |
| Request | `extraRules(): array` (o `rules()` faz `array_merge(regras geradas, extraRules())`); `authorize()` é público na base e pode ser sobrescrito |
| Resource | `extra(Request): array` (o `toArray()` faz `array_merge(campos gerados, extra())`) |
| Collection, Model | nenhum (decisão: a collection delega à resource; a model usa os recursos do Eloquent) |

Módulos do target:

| Arquivo | Papel |
|---|---|
| `index.ts` | `generateLaravelApi(input)`: calcula a data de cada migration (ordem topológica pelos `belongsTo`, empate = ordem do manifest, `now` + 1 segundo por posição), percorre as entidades, aplica cada tipo de arquivo (`entityFileTypes`) e acrescenta as rotas e o `routes/api.php` |
| `fileType.ts` | tipos `EntityFileType` (template + camada + `build(entity, ctx)` que devolve `{ path, view, generatedBase? }`) e `EntityFileContext` (inclui `migrationDates`) |
| `render.ts` | motor Eta e `renderTemplate(nome, dados)`; ponto único de resolução de template |
| `names.ts` | `BASE_NAMESPACE` (`App`), `generatedNamespace` (`App\Models` → `App\Generated\Models`), nomes da entidade em cada casing e `namespaceToFolder` (`App\Http\Requests` → `app/Http/Requests`) |
| `viewModels/classHeader.ts` | parte comum dos templates de classe (namespace, `use`s deduplicados na ordem de declaração, classe e `extends`), `classPair` (base × final), `finalClassFile` (tipo das finais) e `classPath` |
| `entityApi.ts` | `entityApi(entity)`: o `entity.api` com os padrões do gerador aplicados (todas as actions, 15 por página, `with` resolvido para método, tipo e resource relacionada). Usado pelos view models do controller, da resource e das rotas; também tem `phpString` (literal PHP entre aspas simples) |
| `viewModels/{model,resource,collection,controller,request}.ts` | os view models da base e da final de cada classe |
| `viewModels/factory.ts` | a factory: `definition()` por tipo de campo (`fakeExpression`, com a tabela de heurísticas por nome), FK de `belongsTo` → `Pai::factory()` (auto-referência → `null`), valores de autenticação no `user` do esqueleto |
| `viewModels/seeder.ts` + `entityOrder.ts` | seeders, só com `options.seeders` (não passam por `entityFileTypes`): um por entidade (`create-once`) e o `CrudmakerSeeder` (`overwrite`), na ordem de `entitiesByDependency`, a mesma ordem topológica das datas das migrations |
| `viewModels/migration.ts` | view model da migration de criação por entidade; a criação já emitida (tabela no lock e arquivo no destino) sai como `create-once` |
| `viewModels/migrationAlter.ts` | diff de schema entre duas versões da entidade (`diffEntity`), as operações e suas inversas, o view model da migration `alter` (`migration.alter.php.eta`) e os avisos (renomeação provável, coluna obrigatória sem default, enum) |
| `viewModels/routes.ts` | view model de `routes/crudmaker.php` (uma `apiResource` por entidade, recurso = tabela em kebab-case, com `->only(...)` e `->middleware(...)` vindos de `api`; depois, as rotas aninhadas de `nestedRoutes`) e `ensureRoutesInclude`, que acrescenta o `require` ao `routes/api.php` se faltar |
| `viewModels/nestedController.ts` | rotas e controllers aninhados. `nestedRoutes(entities)` percorre os `hasMany`/`hasOne` (respeitando `api.nested` do pai) e devolve um `NestedRoute` por par pai/filho com FK conhecida (o filho tem o `belongsTo` de volta), com FK, segmento da URL, parâmetro, actions disponíveis (as do **filho**) e o par de classes. `nestedControllerBase/Final` montam os view models dos templates `nested-controller.base` e `.final`. Não é um `EntityFileType` (o arquivo é por relacionamento, não por entidade): `generateLaravelApi` os percorre à parte, e o contexto dos tipos por entidade recebe `nestedRoutes` para a request do filho mesclar a FK da URL |

| Tipo | Gera |
|---|---|
| `model` | Base: Model com UUID, SoftDeletes, `$casts`, `$fillable` e métodos de relacionamento. Final: vazia |
| `migration` | Migration anônima de criação da tabela, com FKs, timestamps, soft deletes e índices únicos. Reaproveita o nome de uma migration já existente; depois de emitida (tabela no lock) não é mais reescrita |
| `migration.alter` | Migration anônima de alteração (`Schema::table`) gerada pelo diff entre o lock anterior e o manifest atual; não é um tipo por entidade em `entityFileTypes`, `generateLaravelApi` a emite depois do laço das entidades |
| `enum` | Um por campo `enum` (não por entidade em `entityFileTypes`: `generateLaravelApi` o emite depois dos arquivos da entidade, via `enumFiles` em `viewModels/enum.ts`). Arquivo único `overwrite` em `app/Generated/Enums/<Entidade><Campo>.php`, sem final; é dado puro do manifest. O nome do case vem de `enumCaseName` (`src/enumCase.ts`), validado no manifest. A model faz cast para ele, a request usa `Rule::enum` e a resource `?->value` |
| `request` | Base: FormRequest com `prepareForValidation` (completa campos ausentes a partir da model da rota; datas voltam ao formato da regra e enums ao `->value`), `rules` (com `Rule::enum` e `Rule::exists` nas FKs de `belongsTo`) e o hook `extraRules`. Final: vazia |
| `resource` / `collection` | Base: JsonResource (campos, datas formatadas, os relacionamentos de `api.with` com `whenLoaded` e o hook `extra`) e ResourceCollection (usa a resource final). Finais: vazias |
| `controller` | Base: controller de API com `index`, `store`, `show`, `update`, `destroy` e os 7 hooks (só as actions e os hooks mantidos em `api.actions`; o `index` aplica `with`, filtros, busca e ordenação de `api` antes do `indexQuery`). Final: vazia |
| `factory` | Base: `abstract class` com `$model` (a model final) e `definition()` com um valor fake por campo (o `default` declarado vale; enum sorteia os casos; FK de `belongsTo` cria o pai). Final: vazia, com exemplos de estados |
| `seeder` / `crudmaker-seeder` | Só com a flag `seeders` (fora de `entityFileTypes`). `seeder`: um por entidade, `create-once`, `count(10)` reaproveitando pais já semeados. `crudmaker-seeder`: `CrudmakerSeeder`, `overwrite`, chama os seeders na ordem das FKs; o `DatabaseSeeder` do projeto não é tocado (a CLI só lê o arquivo para decidir se avisa) |
| `routes` | `routes/crudmaker.php`, gerado uma vez por projeto (não por entidade) |

#### Versão alvo e capacidades

A versão do Laravel/PHP entra em `generate` como `options.target`; quem a descobre é a CLI.

- `src/targetVersion.ts` (puro): tipos (`TargetVersion`), constantes (`SUPPORTED_LARAVEL`, `MIN_PHP_BY_LARAVEL`, `DEFAULT_TARGET`), `resolveTarget` (flag → `pkg.target` → detecção → padrão, parte a parte, com origem e avisos de divergência) e as validações, que lançam `TargetVersionError` (uma `UserError`, então a CLI mostra só a mensagem).
- `src/detectTarget.ts`: lê `composer.lock` e `composer.json` do destino. `lowestOfConstraint` tira a menor versão de uma restrição do Composer.
- `src/targets/laravel-api/capabilities.ts`: **o único lugar que compara números de versão**. `capabilitiesFor({ laravel, php })` devolve flags de recurso. `generateLaravelApi` injeta `capabilities` (e `target`) em todo `it` dos templates, e os view models que precisam (hoje `alterView`) recebem as capacidades por parâmetro. Templates e view models nunca comparam `it.target.laravel`.

| Capacidade | Condição | Efeito na saída |
|---|---|---|
| `castsMethod` | Laravel 11+ | `model.base`: `protected function casts(): array` em vez de `protected $casts = [...]` |
| `apiRoutesViaBootstrap` | Laravel 11+ | mensagem da CLI quando falta o `routes/api.php`: `install:api` (11+) × esqueleto + `RouteServiceProvider` (10) |
| `nativeColumnChange` | Laravel 11+ | `migration.alter`: sem ela (Laravel 10) a migration traz o comentário sobre o `doctrine/dbal` |
| `backedEnums` | PHP 8.1+ | sempre verdadeira hoje (8.1 é o mínimo); a geração de enums não tem alternativa para PHP anterior. `Rule::enum` existe desde o Laravel 9 |
| `readonlyClasses` | PHP 8.2+ | ainda sem uso |
| `typedClassConstants` | PHP 8.3+ | ainda sem uso |

Variantes de template por major (ex.: `model.base.l10.php.eta`) **não foram necessárias**: todas as diferenças atuais cabem num `if` sobre uma capacidade. Se uma diferença futura não couber, a resolução em `renderTemplate` é o lugar de acrescentar a variante, com fallback para o template padrão. Para uma diferença nova entre versões: acrescente a flag em `capabilities.ts`, use-a no template (ou no view model) e cubra no `tests/targetVersion.test.ts`.

#### Como adicionar um tipo de arquivo

1. Crie `templates/laravel-api/<tipo>.php.eta` (para uma classe com camadas, `<tipo>.base.php.eta` e `<tipo>.final.php.eta`).
2. Crie `src/targets/laravel-api/viewModels/<tipo>.ts` exportando um `EntityFileType` (`template`, `layer` e `build` devolvendo `{ path, view }`; para classes use `classPair` e `classHeader`, e `finalClassFile` para a final).
3. Registre-o em `entityFileTypes` (`src/targets/laravel-api/index.ts`); a ordem da lista é a ordem dos arquivos na saída. A camada define a política (`custom` = `create-once`) e também o que é apagado ou listado como órfão quando a entidade sai do manifest.
4. Gere os snapshots (revisando o diff) e rode `npm run lint:php`.

Os testes Pest usam o mesmo mecanismo (`viewModels/test.ts` + `templates/laravel-api/test.php.eta`), com duas diferenças: o tipo é **opcional** (`EntityFileType.enabled`, que lê `api.tests`; com `false` o arquivo não sai e, se já existia, vira obsoleto) e mora na camada `generated` (`overwrite`) mas **fora de `app/Generated`** (`tests/Feature/Crudmaker/<Entidade>Test.php`). Pest usa closures, então não há par base × final. `planRemovals` trata `tests/Feature/Crudmaker/` como pasta deletável, como `app/Generated/`, e só apaga arquivo com o cabeçalho de gerado. As rotas aninhadas são testadas no arquivo do **filho** (que conhece o payload e o middleware que a rota usa).

Os controllers aninhados também ficam fora de `entityFileTypes`, porque saem por relacionamento. A base (`overwrite`) estende o controller **final** do filho para herdar os hooks dele e declara as actions `nestedIndex`/`nestedShow`/`nestedStore` e os hooks `nested*` com o pai na assinatura; a final é `create-once`. `src/relationNames.ts` guarda a regra da FK de um `hasMany`/`hasOne` (`nestedForeignKey`) e a checagem do `belongsTo` de volta (`childHasInverse`), partilhadas entre a validação do manifest (`nestedCandidates`, em `apiOptions.ts`, sobre o manifest cru) e o target. Os caminhos das rotas aninhadas do lock anterior entram em `obsolete` como os de qualquer entidade removida.

Um arquivo por projeto (como as rotas) não passa por `entityFileTypes`: renderize-o direto em `generateLaravelApi`.

O `generate` continua puro: a CLI lê o `routes/api.php` do destino (ou `null` se não existe) e passa o texto em `options.existingApiRoutes`. Com texto, o `generate` devolve o `routes/api.php` com o include (idêntico ao atual se já estiver lá), e o `planWrites` o classifica como qualquer outro arquivo (sobrescrito ou sem mudança), o que mantém o `--dry-run` fiel. Com `null`, o arquivo não é gerado e a CLI imprime o aviso sobre `php artisan install:api`.

#### Stubs do projeto

`renderTemplate(name, data, stubs)` (`render.ts`) é o ponto único de resolução: se `stubs[name]` existe, o Eta renderiza essa string (`renderString`); senão, usa o embutido de `templates/laravel-api`. As diferenças por versão do Laravel/PHP não são variantes de arquivo: o template consulta `it.capabilities` (veja [Versão alvo e capacidades](#versão-alvo-e-capacidades)), e os stubs do projeto também recebem `it.capabilities` e `it.target`.

- `generate` continua puro: recebe `options.stubs` (nome do template → conteúdo) e `options.stubHashes` (o `stubs-lock.json`, nome → hash do embutido na publicação) e devolve os avisos em `warnings`. Quem lê a pasta é a CLI (`src/stubFiles.ts`: `readStubs`, `publishStubs`).
- `src/targets/laravel-api/stubs.ts` define `replaceableTemplates` (as bases, incluindo `factory.base`, `nested-controller.base`, `enum`, `migration` e `routes`; os seeders e as finais ficam de fora; **sem** `*.final`, por serem `create-once` e do usuário), os caminhos (`stubs/crudmaker/laravel-api/`, `stubs/crudmaker/stubs-lock.json`), o hash (sha256 do arquivo embutido) e `prepareStubs`, que ignora com aviso os nomes não substituíveis, valida a sintaxe de cada stub (`validateStub`, que traduz o erro do Eta em `Stub "<nome>.php.eta": erro de sintaxe na linha N: ...`, sem stack trace, antes de qualquer arquivo ser produzido) e gera o aviso de stub desatualizado.
- O hash fica num arquivo próprio ao lado dos stubs, e não no `manifest-lock.json`: o lock do manifest é uma saída que o `generate` reescreve a cada execução a partir do manifest, enquanto o hash é estado do projeto que nasce na publicação e deve ser versionado junto com os stubs (um `generate` não pode apagá-lo nem precisa conhecê-lo para gerar o lock).
- `stubs:publish` copia os embutidos pedidos (nome curto = base), pula os existentes (`--force` só para stubs) e grava o hash; `--refresh-lock` só atualiza o hash dos stubs existentes.

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

`tests/layers.test.ts` cobre a política e o cabeçalho de cada camada, as finais vazias que estendem as bases, a ordem dos 7 hooks e a `DB::transaction` no controller base, o `extraRules()`/`extra()`, as rotas e relacionamentos com as classes finais, os caminhos obsoletos de `generate`, a segurança de `planRemovals`/`applyRemovals`, e a CLI em diretório temporário (hook implementado sobrevive à regeração e a base é atualizada, nenhuma combinação de opções sobrescreve uma final, remoção de entidade com `--dry-run`, aviso de final antiga).

`tests/stubs.test.ts` cobre o stub do controller muda só os controllers gerados, stub de classe final ignorado, aviso de hash, erros de sintaxe e de execução, e `stubs:publish` na CLI (todos, só um, não sobrescreve, `--force`, `--refresh-lock`, generate com stub e erro sem escrever nada).

`tests/validate.test.ts` cobre a validação (fixtures válidos, manifests inválidos com caminho e mensagem, vários erros de uma vez) e confere que `schema/manifest.schema.json` está em dia com o schema zod.

`tests/normalizeNames.test.ts` cobre a normalização de nomes (regras, avisos, colisões, FK declarada + derivada, precedência opção × manifest, as fixtures antigas ligadas × desligadas e o JSON Schema).

`tests/apiOptions.test.ts` cobre a fixture `api-options` (snapshot completo, com `pkg.defaults.api` e entidades que herdam, sobrescrevem e restringem actions), asserções explícitas das rotas (`only`, `middleware`), das actions e hooks removidos, de `perPage`, da ordem `with` → filtros → busca → ordenação → `indexQuery` → `paginate`, do `with` no `index`/`show`, da resource com `whenLoaded`, a validação de cada erro e a normalização de nomes no bloco `api`.

`tests/nested.test.ts` cobre as rotas (nomes, ordem, só `index`/`store`/`show` aninhados), a FK do pai gravada depois dos hooks e mesclada na request do filho, os hooks herdados e `nested*`, o `hasOne` (404 e 409), os filtros, o `perPage` e o middleware do filho (fixture `api-options`), a opção `nested` (`false`, lista, padrão do pacote, lock, JSON Schema), a validação, as `actions` do filho, a FK customizada (`order-item`), a auto-referência, a entidade `user` do esqueleto, os arquivos obsoletos e o stub. Os snapshots das fixtures com `hasMany`/`hasOne` ganharam as rotas, os controllers aninhados e a FK nas requests dos filhos.

`tests/pestTests.test.ts` cobre um arquivo de testes por entidade (`overwrite`, com o cabeçalho de gerado), actions desabilitadas sem teste, autenticação por `auth:sanctum`/`auth`/`auth:<guard>` e o aviso de middleware não tratado, o payload (enum pelo valor, data e datetime nos formatos da request, `hidden`, json, o que entra no `assertDatabaseHas`), as rotas aninhadas no arquivo do filho, a entidade `user` do esqueleto (`assertModelMissing`, id numérico), `api.tests: false` (entidade e `pkg.defaults.api`), o arquivo obsoleto e a CLI apagando só o arquivo gerado. Os snapshots completos dos testes ficam em `__snapshots__/<fixture>/tests/Feature/Crudmaker/` (todas as fixtures passam por `generate.test.ts`). O e2e `CRUDMAKER_E2E=1` roda `php vendor/bin/pest` de verdade nos projetos criados por `crudmaker new` a partir de `tests/e2e/blog.json` e `tests/e2e/shop.json` (enum, datas, `unique`, `hidden`, `auth:sanctum`, actions restritas, `user` do esqueleto, rotas aninhadas); `CRUDMAKER_E2E_LARAVEL=10,11,12` repete em outras versões.

`tests/alterMigrations.test.ts` cobre regerar sem mudança (nenhuma migration, lock idêntico), criação imutável (`create-once`, projeto sem lock, migration ausente, entidade nova), campo adicionado, removido e alterado (tipo, `required`, `default`, itens do enum, `unique`), FK adicionada e removida, o `down()`, o aviso de renomeação, nomes e timestamps sem colisão, o formato do lock (e o lock antigo e o malformado), entidade removida sem `drop table`, o snapshot da fixture `alter` (`manifest.json` → `manifest.after.json`) e a CLI em três gerações seguidas.

`tests/targetVersion.test.ts` cobre a menor versão de uma restrição do Composer, a detecção com `composer.json`/`composer.lock` de exemplo (`tests/fixtures/composer/`), a resolução (prioridade flag > manifest > composer > padrão, partes independentes, aviso de divergência, erros de versão não suportada, PHP abaixo do mínimo e valores mal formados), as capacidades por versão, `generate` por versão e a CLI (resumo com origem, aviso, erro, mensagem de `routes/api.php` ausente por versão). **Saída por versão:** os snapshots completos de todas as fixtures rodam no padrão (Laravel 12). Para não triplicar, o Laravel 11 é comparado byte a byte com o 12 (a saída é idêntica, salvo o `target` do lock), e o Laravel 10 é comparado com o 12 aceitando só a diferença do cast da model base, que ganha snapshot próprio em `tests/__snapshots__/laravel-10/<fixture>/` (mais o da migration `alter` com o comentário do `doctrine/dbal`). Uma diferença nova entre versões quebra essas comparações e obriga a decidir e registrar.

`tests/skeleton.test.ts` cobre a entidade `user` e as migrations de fora com fixtures do esqueleto do Laravel 10 e 11 (`tests/fixtures/skeleton/`): nenhuma migration nem o `User.php` do esqueleto muda, `alter_users_table` só com as colunas extras (e idempotente), FKs para `users` em bigint, model base autenticável, aviso de migração do `User.php`, e migrations de fora de outras tabelas nunca reescritas (com cabeçalho ou registro no lock voltam a ser do crudmaker). O e2e `CRUDMAKER_E2E=1` tem um caso com `user` (`tests/e2e/blog-user.json`).

`tests/factories.test.ts` cobre as políticas da factory (base `overwrite`, final `create-once`), um valor por tipo e a FK `belongsTo` (fixture `order-item`), heurísticas de nome, `unique`, `default`, auto-referência, os seeders com e sem a flag (snapshots em `tests/__snapshots__/seeders/`, ordem das FKs, aviso do `DatabaseSeeder`), a CLI (`--seeders`, final e seeder editados sobrevivem) e o modo esqueleto (`UserFactory` do esqueleto preservada com aviso, `BaseUserFactory` com `password`/`remember_token`). Os snapshots das factories de todas as fixtures estão em `__snapshots__/<fixture>/{app/Generated/Factories,database/factories}`; a saída é igual nas três versões do Laravel (confirmado por `targetVersion.test.ts`). O e2e `CRUDMAKER_E2E=1` tem um caso com `--seeders` (`Post::factory()->count(5)->create()` cria também os autores e `db:seed --class=CrudmakerSeeder` popula o banco).

`tests/aiGuide.test.ts` cobre o guia para IA: tamanho (≈ 800 tokens), o exemplo YAML do guia gerando sem avisos, os hooks citados existindo no template do controller, `init --ai` e o `manifest.example.json` válido.

`tests/yaml.test.ts` cobre o YAML: cada fixture tem um `manifest.yaml` que precisa ler o mesmo objeto e gerar a mesma saída do JSON, os erros de sintaxe/vazio/multi-documento/extensão, e o `init` em cada formato (o exemplo YAML tem de ser igual ao JSON).

`tests/generate.test.ts` também cobre a ordem e os timestamps das migrations, a regeração sem renomear, as FKs, o `ignore` do `unique` e os casts, com asserções explícitas (a fixture `order-item`, com entidade camelCase e FK customizada, roda com a normalização ligada e tem snapshot próprio), e as rotas (nome do recurso, include, idempotência, detecção por variações de espaço e aspas). Ele chama `generate` para os manifests de `tests/fixtures/` com data fixa e sem migrations existentes. Os snapshots de `bingo`, `curso` e `vende-que-vende-api` são a saída de antes da normalização de nomes e valem com ela **desligada** (`normalizeNames: false`); `bingo-2` (entidades no plural, FKs declaradas à mão) tem snapshot com a normalização ligada, o padrão. O conteúdo de cada arquivo é comparado com um snapshot em `tests/__snapshots__/<fixture>/<path>`, e a lista de caminhos com `_paths.txt`. Os snapshots registram a saída atual (bases em `app/Generated/` e finais iniciais), inclusive bugs conhecidos. Foram eles que provaram que a migração para templates não mudou a saída.

### Sintaxe do PHP gerado

`npm run lint:php` (`scripts/checkPhpSyntax.ts`) valida que o PHP gerado é sintaticamente válido. Ele chama `generate` (normalização no padrão, ligada) para as fixtures de `tests/fixtures/` com data fixa, em duas passadas: Laravel 12 (padrão) e Laravel 10 (em `laravel-10/<fixture>/`, com PHP 8.1; o 11 gera a mesma saída do 12) (e, nas que têm `manifest.after.json`, faz uma segunda geração sobre a primeira para também validar as migrations `alter`), grava a saída num diretório temporário do sistema (nunca em `generated/` nem no repositório) e monta esse diretório como volume somente leitura num único `docker run --rm` da imagem oficial `php:8.1-cli`, com o UID/GID do usuário, que roda `php -l` em cada `.php`. O script lista os arquivos com erro, sai com código diferente de zero se houver falha inesperada (ou 2 se o Docker não estiver disponível) e apaga o diretório temporário no fim. A versão 8.1 é a mínima prometida pela spec: se parseia nela, parseia nas mais novas.

A checagem olha a saída de `generate`, e não os snapshots, para não depender deles: um snapshot pode ser atualizado com `-u` sem que ninguém perceba que o PHP ficou inválido, e a checagem continua valendo mesmo que a forma de guardar os snapshots mude.

O `php -l` só olha a sintaxe. A herança e as assinaturas dos hooks (uma final que sobrescreve com assinatura incompatível é erro fatal do PHP) foram conferidas à parte, uma vez, carregando a saída num `php:8.3-cli` com stubs mínimos do Illuminate e exercitando as actions; esse script não faz parte do repositório.

`scripts/phpSyntaxAllowlist.ts` lista as falhas conhecidas (arquivo, motivo e o que corrige); hoje está vazia. Elas aparecem como "conhecido" e não quebram a checagem; uma entrada que deixa de falhar também quebra a checagem, para a lista não apodrecer. `tests/phpSyntax.test.ts` testa a classificação sem Docker e, com `PHP_DOCKER_TESTS=1`, prova com Docker que um PHP inválido reprova (a variável `CRUDMAKER_INJECT_INVALID_PHP=1` faz o script injetar um arquivo inválido).

Não há CI no GitHub: o hook versionado `.githooks/pre-commit` roda `npx tsc --noEmit`, `npm test` e `npm run lint:php` a cada commit (cerca de 5 s) e bloqueia o commit se algo falhar. Sem Docker (o script sai com 2), a checagem PHP é pulada com aviso. O script `prepare` do `package.json` ativa o hook com `git config core.hooksPath .githooks`.

## Spec e tickets

A spec da v2 ([specs/crudmaker-v2.md](specs/crudmaker-v2.md)) guarda as decisões e o que ficou fora do escopo (v3: Inertia, Filament, Next.js). Os tickets em [tickets/](tickets/README.md) registram como cada parte foi entregue e o que ficou em aberto.
