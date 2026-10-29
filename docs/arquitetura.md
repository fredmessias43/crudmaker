# Arquitetura

O crudmaker é uma CLI TypeScript (`crudmaker`, compilada para `dist/` ou rodada com `tsx`) que transforma um manifest JSON em arquivos PHP de uma API Laravel.

## Fluxo

```
crudmaker generate <manifest> --out <dir> [--dry-run]     src/bin.ts → src/cli.ts
    │  readManifest(caminho)      lê e faz o parse do JSON
    ▼
generate(manifest, { now, existingMigrations })     função pura, sem acesso ao disco
    │  Manifest        valida e normaliza campos e relacionamentos
    │  Entity          (uma por entidade) nome + casings + nome da tabela
    │  geradores       (PhpFile) Model, Resource, Collection, Controller, Request, Migration
    ▼
lista de arquivos { path, content, policy }         path relativo à raiz do projeto Laravel
    │  planWrites(files, out)     classifica: criado / sobrescrito / sem mudança / preservado
    │  applyPlan(plan)            só sem --dry-run
    ▼
<out>/manifest-lock.json, <out>/app/...  e  <out>/database/migrations/...
    │
    ▼
resumo no stdout
```

### CLI

A CLI é uma casca fina em volta de `generate` (sem lógica de geração):

- `src/bin.ts`: entrada do binário (shebang `#!/usr/bin/env node`); passa `process.argv` para `run` e usa o retorno como exit code.
- `src/cli.ts`: `run(argv, io)` interpreta os argumentos (`node:util` `parseArgs`, sem dependência externa), executa `generate` ou `init` e devolve o exit code. `io` (stdout, stderr, cwd, relógio) é injetável, o que permite testar sem subprocesso. Para `generate`, lê os nomes em `<out>/database/migrations` (lista vazia se a pasta não existe), chama `generate` com a data atual, monta o plano de escrita e, sem `--dry-run`, o aplica; depois imprime o resumo.
- `src/readManifest.ts`: único ponto de leitura do manifest (hoje só JSON). Erros esperados viram `UserError`; a CLI imprime `Erro: <mensagem>` no stderr e sai com código 1, sem stack trace (defina `CRUDMAKER_DEBUG=1` para vê-lo).
- `src/initTemplate.ts`: conteúdo do manifest criado por `crudmaker init`.

O `npx`/`npm link` usam o campo `bin` do `package.json` (`dist/bin.js`), gerado por `npm run build` (`tsconfig.build.json`, que compila só `src/`).

### `generate` e a camada de escrita

`generate` (`src/generate.ts`) não lê nem escreve em disco. Tudo o que seria "ambiente" entra por `options`:

- `now`: data/hora do prefixo das migrations novas (`yyyy_MM_dd_HHmmss`);
- `existingMigrations`: nomes de arquivo das migrations que já existem no destino. Se algum termina com `_create_<tabela>_table.php`, o nome é reaproveitado em vez de gerar um novo.

Cada arquivo devolvido tem `path`, `content` e `policy` (`overwrite` ou `create-once`). Hoje tudo sai como `overwrite`; `create-once` ainda não é usado pelos geradores. O primeiro item da lista é sempre o `manifest-lock.json`.

`src/writeFiles.ts` tem a camada de escrita, em dois passos:

- `planWrites(files, baseDir)` só lê o disco e classifica cada arquivo: `created` (não existia), `overwritten` (existia, política `overwrite`, conteúdo diferente), `unchanged` (existia, `overwrite`, conteúdo idêntico) ou `preserved` (existia e a política é `create-once`);
- `applyPlan(plan)` grava os `created` e `overwritten`, criando as pastas. Não imprime nada.

O `--dry-run` e a escrita real usam o mesmo plano, então nunca divergem. `writeFiles(files, baseDir)` é o atalho que faz os dois passos.

## Módulos

### `models/Manifest`
Recebe o objeto cru do manifest e produz `entities` normalizadas:

- campo na forma curta (`"name": "string"`) vira `{ type, name, required: true, unique: false, enumItems: [] }`;
- aliases são resolvidos (`int` → `integer`, `displayName` → campo `display_name` do tipo `string`);
- cada relacionamento vira `{ entity, field, required, relationship }`;
- `belongsTo` adiciona o campo de FK (`uuid`, com `relationship: true`) aos `fields`;
- `owned`/`morphed` adicionam `owner_id` e `owner_class`.

`manifestToString()` serializa o resultado normalizado; `generate` o devolve como o arquivo `manifest-lock.json`.

### `models/Entity`
Envolve uma entidade normalizada. `getEntityName(casing)` devolve o nome em qualquer formato do `change-case` (`pascalCase`, `snakeCase`...), e `getTableName()` devolve o snake_case no plural.

### `fileCreators/PhpFile`
Classe base abstrata de todos os geradores. Monta a casca de um arquivo PHP (`<?php`, namespace, `use`, declaração da classe, traits). Não escreve no disco: `mountFile()` devolve o conteúdo e `getRelativePath()` o caminho.

Cada subclasse:

1. no construtor, define `namespace`, `imports`, `extendsClauses`, `traits` e `className`, e preenche arrays de linhas (`fillXxxFunction()`);
2. sobrescreve `getContentLine()` para juntar essas linhas no corpo da classe.

O caminho relativo é o namespace convertido em pasta (`App\Http\Requests` → `app/Http/Requests/<arquivo>`). `getFileName()` pode ser sobrescrito; a `MigrationFile` faz isso para montar o nome com a data recebida ou reaproveitar o de uma migration já existente (ambos recebidos no construtor).

O PHP é montado concatenando strings linha a linha, com `\t` como indentação.

### Geradores usados hoje

| Classe | Gera |
|---|---|
| `ModelFile` | Model com UUID, SoftDeletes, `$casts`, `$fillable` e métodos de relacionamento |
| `MigrationFile` | Migration anônima de criação da tabela, com FKs, timestamps, soft deletes e índices únicos |
| `RequestFile` | FormRequest com `prepareForValidation` (completa campos ausentes a partir da model da rota) e `rules` |
| `ResourceFile` / `CollectionFile` | JsonResource e ResourceCollection com os campos e as datas formatadas |
| `ControllerFile` | Controller de API com `index`, `store`, `show`, `update` e `destroy` |

## Dependências

| Pacote | Uso |
|---|---|
| `change-case` | casings dos nomes |
| `pluralize` | nome das tabelas e dos métodos `hasMany` |
| `lodash` | `snakeCase`, `uniq` |
| `date-fns` | timestamp do nome da migration |

## Testes

`tests/cli.test.ts` cobre a CLI: chama `run(argv, io)` em diretórios temporários (criação, regeração, `--dry-run`, `init`, erros, ajuda) e tem um teste que roda o binário em subprocesso.

`tests/generate.test.ts` chama `generate` para os três manifests de `tests/fixtures/` com data fixa e sem migrations existentes. O conteúdo de cada arquivo é comparado com um snapshot em `tests/__snapshots__/<fixture>/<path>`, e a lista de caminhos com `_paths.txt`. Os snapshots registram a saída atual, inclusive bugs conhecidos.

## Próximos passos

A reestruturação (CLI, YAML, schema, templates, separação entre código gerado e customizado, testes) está descrita em [specs/crudmaker-v2.md](specs/crudmaker-v2.md).
