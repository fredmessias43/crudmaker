# Arquitetura

O crudmaker é um script TypeScript (rodado com `ts-node`) que transforma um manifest JSON em arquivos PHP de uma API Laravel.

## Fluxo

```
manifest.json
    │  JSON.parse
    ▼
Manifest           valida as chaves obrigatórias e normaliza campos e relacionamentos
    │  lockManifest()  → generated/<pkg>/manifest-lock.json
    ▼
Entity (uma por entidade)   nome + casings + nome da tabela
    │
    ▼
geradores (PhpFile)         Model, Resource, Collection, Controller, Request, Migration
    │  mountAndWriteFile()
    ▼
generated/<pkg>/app/...  e  generated/<pkg>/database/migrations/...
```

Tudo é orquestrado em `src/main.ts`: lê o manifest, grava o lock e, para cada entidade, instancia os seis geradores e chama `mountAndWriteFile()` em cada um.

## Módulos

### `models/Manifest`
Recebe o objeto cru do manifest e produz `entities` normalizadas:

- campo na forma curta (`"name": "string"`) vira `{ type, name, required: true, unique: false, enumItems: [] }`;
- aliases são resolvidos (`int` → `integer`, `displayName` → campo `display_name` do tipo `string`);
- cada relacionamento vira `{ entity, field, required, relationship }`;
- `belongsTo` adiciona o campo de FK (`uuid`, com `relationship: true`) aos `fields`;
- `owned`/`morphed` adicionam `owner_id` e `owner_class`.

`lockManifest()` grava o resultado normalizado em `manifest-lock.json`.

### `models/Entity`
Envolve uma entidade normalizada. `getEntityName(casing)` devolve o nome em qualquer formato do `change-case` (`pascalCase`, `snakeCase`...), e `getTableName()` devolve o snake_case no plural.

### `fileCreators/PhpFile`
Classe base abstrata de todos os geradores. Monta a casca de um arquivo PHP (`<?php`, namespace, `use`, declaração da classe, traits) e grava no disco.

Cada subclasse:

1. no construtor, define `namespace`, `imports`, `extendsClauses`, `traits` e `className`, e preenche arrays de linhas (`fillXxxFunction()`);
2. sobrescreve `getContentLine()` para juntar essas linhas no corpo da classe.

O caminho de saída é `generated/<pkgCode>/` + o namespace convertido em pasta (`App\Http\Requests` → `app/Http/Requests`). `getFileName()` pode ser sobrescrito; a `MigrationFile` faz isso para reaproveitar o nome de uma migration já existente.

O PHP é montado concatenando strings linha a linha, com `\t` como indentação.

### Geradores usados hoje

| Classe | Gera |
|---|---|
| `ModelFile` | Model com UUID, SoftDeletes, `$casts`, `$fillable` e métodos de relacionamento |
| `MigrationFile` | Migration anônima de criação da tabela, com FKs, timestamps, soft deletes e índices únicos |
| `RequestFile` | FormRequest com `prepareForValidation` (completa campos ausentes a partir da model da rota) e `rules` |
| `ResourceFile` / `CollectionFile` | JsonResource e ResourceCollection com os campos e as datas formatadas |
| `ControllerFile` | Controller de API com `index`, `store`, `show`, `update` e `destroy` |

### Código não usado
- `ApiControllerFile` e `InertiaControllerFile`: variantes de controller que o `main.ts` não usa.
- `ObserverFile`: o uso está comentado no `main.ts`.
- `api/controllerRelationship/*`: arquivos vazios.
- `services/FileWriter`: não é usado (a escrita está no `PhpFile`).

## Dependências

| Pacote | Uso |
|---|---|
| `change-case` | casings dos nomes |
| `pluralize` | nome das tabelas e dos métodos `hasMany` |
| `lodash` | `snakeCase`, `uniq` |
| `date-fns` | timestamp do nome da migration |

## Próximos passos

A reestruturação (CLI, YAML, schema, templates, separação entre código gerado e customizado, testes) está descrita em [specs/crudmaker-v2.md](specs/crudmaker-v2.md).
