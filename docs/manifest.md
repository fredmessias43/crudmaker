# Referência do manifest

O manifest descreve as entidades da API. Pode ser escrito em **YAML** (`.yaml`/`.yml`, formato recomendado: aceita comentários) ou em **JSON** (`.json`); o formato é detectado pela extensão e os dois são equivalentes (o mesmo conteúdo gera exatamente a mesma saída). Qualquer outra extensão é recusada com um erro. `crudmaker init` cria um exemplo comentado.

O crudmaker valida o manifest, normaliza (formas curtas viram formas completas, campos de FK são derivados dos relacionamentos, nomes fora da convenção são corrigidos) e gera o PHP a partir do resultado.

## Estrutura

```yaml
system:
  title: Crudmaker
  code: crudmaker
pkg:
  code: minha-api
  entities:
    client:
      fields: { ... }
      relationships: { ... }
```

Em JSON:

```json
{
  "system": { "title": "Crudmaker", "code": "crudmaker" },
  "pkg": {
    "code": "minha-api",
    "entities": {
      "client": {
        "fields": { ... },
        "relationships": { ... }
      }
    }
  }
}
```

Os demais exemplos deste documento estão em JSON; a tradução para YAML é direta (`"chave": valor` vira `chave: valor`, listas viram `- item` ou `[a, b]`).

| Chave | Obrigatória | Uso |
|---|---|---|
| `system.code` | sim | Lido e guardado, mas hoje não afeta a saída (o namespace é sempre `App`). |
| `system.title` | não | Não usado. |
| `$schema` | não | Caminho do JSON Schema, para autocomplete no editor. Ignorado pelo crudmaker. |
| `pkg.code` | sim | Nome da pasta de saída: os arquivos vão para `generated/<pkg.code>/`. |
| `pkg.entities` | sim | Mapa `nomeDaEntidade → definição`. |
| `pkg.normalizeNames` | não | `true` (padrão) ou `false`. Liga/desliga a [normalização de nomes](#normalização-de-nomes). |
| `pkg.defaults.api` | não | Valores padrão do bloco [`api`](#opções-da-api-api) de todas as entidades (só `actions`, `middleware` e `perPage`). |
| `pkg.entities.<nome>.api` | não | [Opções da API](#opções-da-api-api) da entidade: actions, middleware, paginação, filtros, busca, ordenação e eager loading. |

Antes de gerar, o manifest é validado (veja [Validação](#validação-e-json-schema)). Se houver qualquer problema, nada é gerado.

### Nome da entidade

A chave em `pkg.entities` é o nome da entidade no singular, em camelCase (`client`, `orderItem`). Nomes fora disso (`awards`, `drawn_numbers`, `PlayerInvite`) são corrigidos pela [normalização de nomes](#normalização-de-nomes). Dele saem:

| Derivado | Exemplo para `orderItem` |
|---|---|
| Classes (Model, Controller...) | `OrderItem`, `OrderItemController` |
| Tabela | `order_items` (snake_case + plural) |
| Variáveis | `$orderItem` |

## Campos (`fields`)

Cada campo pode ser escrito na forma curta (só o tipo) ou na forma completa.

```json
"fields": {
  "id": "uuid",
  "name": "string",
  "email": { "type": "string", "unique": true },
  "notes": { "type": "text", "required": false },
  "status": { "type": "enum", "enumItems": ["active", "blocked"] }
}
```

Propriedades da forma completa:

| Propriedade | Padrão | Efeito |
|---|---|---|
| `type` | — | Tipo do campo (tabela abaixo). |
| `name` | a chave | Nome da coluna. |
| `required` | `true` | `false` deixa a coluna `nullable` e a regra de validação `nullable`. |
| `unique` | `false` | Cria índice único na migration e regra `Rule::unique` na request, que ignora o próprio registro na edição (veja [Regra `unique` na edição](#regra-unique-na-edição)). |
| `enumItems` | `[]` | Valores permitidos quando `type` é `enum`. |

> **Declare sempre `"id": "uuid"`.** A model usa `HasUuids` e chave do tipo string, e a migration só marca como `primary()` a coluna chamada `id`. Entidade sem campo `id` (a chave ou o `name` do campo) é erro de validação.

### Tipos

| Tipo | Migration | Validação na request | Cast na model |
|---|---|---|---|
| `uuid` | `uuid()` | `uuid` | — |
| `string` | `string()` | `string` | — |
| `text` | `text()` | `string` | — |
| `integer` (alias `int`) | `integer()` | `integer` | `integer` |
| `double` | `double()` | `numeric` | `double` |
| `boolean` | `boolean()` | `boolean` | `boolean` |
| `date` | `date()` | `date_format:Y-m-d` | `date` |
| `datetime` | `datetime()` | `date_format:Y-m-d H:i` | `datetime` |
| `json` | `json()` | `array` | `array` |
| `enum` | `enum(..., [itens])` com default no primeiro item | `Rule::in([itens])` | — |

Todas as regras geradas existem no Laravel 10–12 (`bail`, `required`, `nullable`, `uuid`, `string`, `numeric`, `integer`, `boolean`, `array`, `date_format`, `Rule::in`, `Rule::unique`). O `json` usa `array` (e não a regra `json` do Laravel, que valida uma string JSON) porque o corpo chega já decodificado e o cast da model é `array`.

O tipo especial `displayName` vira um campo `string` chamado `display_name`, seja qual for a chave usada.

Os casts ficam no `$casts` da model. Como `date` e `datetime` viram `Carbon` na leitura, o `prepareForValidation` da request devolve esses campos ao formato da regra (`->format('Y-m-d')` / `->format('Y-m-d H:i')`) ao completar os campos ausentes numa atualização; e a resource passa a devolvê-los serializados pelo Laravel (ISO 8601), não mais como texto cru do banco.

### Regra `unique` na edição

A request gera `Rule::unique('<tabela>', '<campo>')->ignore($this->route('<entidade>'))`. O parâmetro da rota é o registro sendo editado (model, via route model binding) e o Laravel usa a chave `id` dele; na criação a rota não tem parâmetro, e nada é ignorado. O `id` do corpo da requisição não é usado, porque vem do cliente. Registros com soft delete continuam contando para a unicidade, como no índice único do banco.

## Relacionamentos (`relationships`)

```json
"relationships": {
  "belongsTo": ["client"],
  "hasMany": ["alert"],
  "hasOne": ["note"]
}
```

Cada item pode ser só o nome da entidade ou um objeto:

```json
"belongsTo": [
  { "entity": "user", "field": "author_id", "required": false }
]
```

| Propriedade | Padrão | Efeito |
|---|---|---|
| `entity` | — | Entidade relacionada. |
| `field` | `<entity>_id` em snake_case (`orderItem` → `order_item_id`) | Nome da coluna de FK. |
| `required` | `true` | `false` deixa a FK `nullable`. |
| `relationship` | o tipo da lista | Sobrescreve o tipo do relacionamento. |

O que cada tipo gera:

| Tipo | Na entidade que declara |
|---|---|
| `belongsTo` | Campo `uuid` de FK, `foreign()` na migration e método `belongsTo` na model. |
| `hasOne` | Método `hasOne` na model (a FK fica do outro lado, declarada com `belongsTo`). |
| `hasMany` | Método `hasMany` na model, com nome no plural (`alerts()`). |

### FK customizada (`field`)

Em todos os tipos, `field` é a coluna de FK **no lado filho** (a entidade que tem o `belongsTo`). Quando é diferente de `<entidade>_id`, a model passa a FK explicitamente (`$foreignKey`); a chave do pai continua `id`:

| Declaração | Método gerado |
|---|---|
| `orderItem`: `belongsTo: [{ entity: user, field: author_id }]` | `author(): BelongsTo` → `belongsTo(User::class, 'author_id')` |
| `user`: `hasMany: [{ entity: orderItem, field: author_id }]` | `orderItemsByAuthor(): HasMany` → `hasMany(OrderItem::class, 'author_id')` |
| `user`: `hasOne: [{ entity: profile, field: author_id }]` | `profileByAuthor(): HasOne` → `hasOne(Profile::class, 'author_id')` |

- No `belongsTo`, o método leva o nome do campo sem o `_id` (`author_id` → `author()`).
- No `hasOne`/`hasMany`, `field` deve ser o mesmo nome declarado no `belongsTo` do filho (o gerador não confere isso). O método leva `<entidade relacionada (plural no hasMany)>By<Campo>` (`orderItemsByAuthor`), para não colidir com `author()` do outro lado nem entre dois relacionamentos com o mesmo filho.
- Com a FK padrão, o método leva só o nome da entidade (`orders()`) e o Eloquent deduz as chaves.
- No `hasOne`/`hasMany` o `field` não cria coluna: a coluna vem do `belongsTo` do filho. Sem `field`, o valor padrão (`<filho>_id`) só indica que o Eloquent deve deduzir a FK.

Na forma curta a FK é sempre `<entidade em snake_case>_id` (`"belongsTo": ["orderItem"]` gera `order_item_id`), com a [normalização de nomes](#normalização-de-nomes) ligada ou desligada; a FK da migration (`->on('order_items')`) aponta para a tabela em snake_case plural.

**Declare os dois lados.** O gerador não cria o relacionamento inverso: se `client` tem `hasMany: ["alert"]`, `alert` precisa de `belongsTo: ["client"]` para a coluna `client_id` existir.

### Ordem das migrations

As migrations são ordenadas por dependência de FK: a tabela referenciada por um `belongsTo` é criada antes da que a referencia, mesmo que a entidade seja declarada depois no manifest. Entre entidades sem dependência entre si vale a ordem do manifest. Cada migration nova recebe o timestamp `now` + 1 segundo por posição (a primeira em `now`, a seguinte em `now + 1s`...), então a saída é determinística e a ordem de execução do Laravel é a de dependência. Auto-referência (`belongsTo` para a própria entidade) não conta como dependência.

Regerar não renomeia migrations existentes: se já há um arquivo terminado em `_create_<tabela>_table.php` no destino, ele é reaproveitado; só as tabelas novas ganham um nome novo.

**Ciclos de FK** (`a` `belongsTo` `b` e `b` `belongsTo` `a`, direto ou por mais entidades) são erro de validação: nenhuma ordem cria as duas tabelas com a FK já apontando para uma tabela existente. Para resolver, remova um dos `belongsTo` do ciclo (por exemplo, deixe só o `hasMany` no lado "um").

### Limitações conhecidas

- `owned` e `morphed` adicionam os campos `owner_id` e `owner_class`, mas `ownOne`, `ownMany`, `morphOne`, `morphMany` e `morphTo` ainda **não** geram métodos válidos na model. Não use.
- `indexes` (por entidade) e `pkg.enums` são aceitos no manifest, mas ignorados.

## Opções da API (`api`)

Cada entidade pode ter um bloco `api`, e o pacote pode ter `pkg.defaults.api` com os valores que valem para todas. Tudo é opcional: **sem esses blocos a saída é a de sempre** (as cinco actions, sem middleware, 15 por página). As opções mexem só na camada gerada (a base do controller, a resource base e `routes/crudmaker.php`); a regra de negócio continua nos [hooks](como-usar.md#hooks-do-controller).

```yaml
pkg:
  defaults:
    api:
      middleware: [auth:sanctum]
      perPage: 15
  entities:
    client:
      fields:
        id: uuid
        name: string
        email: { type: string, unique: true }
        status: { type: enum, enumItems: [active, blocked] }
      relationships:
        hasMany: [alert]
        hasOne: [address]
      api:
        actions: [index, show, store, update]   # sem destroy
        middleware: [auth:sanctum, verified]    # substitui o padrão
        perPage: 20
        filters: [status]                       # ?status=active
        search: [name, email]                   # ?search=ana
        sort: [name, created_at]                # ?sort=-name
        defaultSort: -created_at
        with: [address, alerts]                 # eager loading + resource aninhada
```

Com isso, `GET /api/clients?status=active&search=ana&sort=-name&page=2` lista os clientes ativos cujo nome ou e-mail contém "ana", do nome Z ao A, na segunda página de 20.

| Opção | Tipo | Padrão | Efeito |
|---|---|---|---|
| `actions` | lista, subconjunto de `index`, `show`, `store`, `update`, `destroy` | todas | Restringe as rotas (`->only([...])`) e remove do controller base as actions que saem **e os hooks delas** (veja abaixo). Lista vazia é erro. |
| `middleware` | lista de textos | nenhum | Vira `->middleware([...])` na `apiResource` da entidade em `routes/crudmaker.php`. |
| `perPage` | inteiro positivo | `15` | Tamanho da página do `index` (`paginate(N)`). |
| `filters` | lista de campos | nenhum | Filtro por igualdade pela query string, com o nome da coluna: `?status=active`. Só entra na query se o parâmetro vier preenchido. |
| `search` | lista de campos | nenhum | Busca textual em `?search=termo`: um `where` agrupado com `like %termo%` em OR entre os campos. |
| `sort` | lista de campos | nenhum | Campos ordenáveis por `?sort=name` (crescente) ou `?sort=-name` (decrescente). Valores fora da lista são ignorados. |
| `defaultSort` | campo, com `-` na frente para decrescente | nenhum | Ordenação usada quando `?sort` não vem ou não vale (ex.: `-created_at`). |
| `with` | lista de relacionamentos | nenhum | Eager loading no `index` (`with([...])`) e no `show` (`load([...])`); a resource inclui cada um aninhado. |

### Precedência: padrão do pacote × entidade

O bloco da entidade vale **chave a chave** sobre `pkg.defaults.api`: cada chave que a entidade declara substitui a do padrão, e as que ela não declara herdam o padrão. Listas **substituem por inteiro, não somam**: com `middleware: [auth:sanctum]` no padrão, uma entidade com `middleware: [verified]` fica só com `verified`, e `middleware: []` desliga o middleware do padrão para ela. No exemplo, `client` fica com `perPage: 20` e `middleware: [auth:sanctum, verified]`, e uma entidade sem bloco `api` herda `perPage: 15` e `auth:sanctum`.

`pkg.defaults.api` só aceita `actions`, `middleware` e `perPage`. `filters`, `search`, `sort`, `defaultSort` e `with` dependem dos campos de cada entidade, então declará-los no padrão é erro de validação. O `manifest-lock.json` guarda o bloco já resolvido de cada entidade que tem algum valor (padrão ou próprio).

### Consulta do `index`: filtros, busca, ordenação e `with`

A ordem dos passos no `index` é fixa: `with`, filtros, busca, ordenação, o hook `indexQuery` e só então `paginate`. O hook sempre vê a query já filtrada e ordenada e pode refiná-la ou acrescentar mais `orderBy`.

- **Nomes de campo.** Em `filters`, `search`, `sort` e `defaultSort` vale o nome da coluna (o `name` do campo, depois da [normalização](#normalização-de-nomes)). Também valem as colunas de FK criadas pelos `belongsTo` (`client_id`), úteis em filtros (`?client_id=...`).
- **`sort` e `defaultSort` aceitam `id`, `created_at` e `updated_at`** mesmo sem estarem em `fields`, porque toda tabela gerada tem essas colunas. Em `filters` e `search` valem só os campos da entidade.
- **Filtros** são `where coluna = valor`. Campos `enum` só filtram se o valor for um dos `enumItems` (valor desconhecido é ignorado, e a listagem sai sem o filtro); campos `boolean` leem `true`/`false`/`1`/`0`; parâmetros que chegam como lista (`?status[]=a`) são ignorados.
- **Busca**: o termo vai entre `%` sem escapar os curingas (`%` e `_` do termo funcionam como curingas). Se o `like` diferencia maiúsculas ou não depende do banco (MySQL: não, PostgreSQL: sim).
- **Ordenação**: `?sort=name` ordena por `name`; `?sort=-name`, decrescente. Um valor fora de `sort` é ignorado e, havendo `defaultSort`, vale a ordenação padrão. Sem `defaultSort`, não há `orderBy` (a ordem fica por conta do banco, como antes). Só uma coluna por vez.
- **`with`** usa o **nome do método do relacionamento na model** (`address`, `alerts`, `postsByAuthor`; veja a tabela de [FK customizada](#fk-customizada-field)), não o nome da entidade: um `hasMany` de `alert` é `alerts`. Só valem `belongsTo`, `hasOne` e `hasMany`. A resource base da entidade ganha, depois de `updated_at`, uma chave por relacionamento com `whenLoaded`, usando a resource **final** da entidade relacionada e o nome do método como chave no JSON: `"address": new AddressResource($this->whenLoaded('address'))` (`hasMany`: `AlertResource::collection(...)`). Sem o relacionamento carregado a chave não aparece. Se a entidade relacionada também usa `with` para voltar (ex.: `client` ↔ `alert`), cada lado só inclui o outro quando ele foi carregado, então não há laço.

### Actions removidas e hooks

Quando `actions` não inclui uma action, a base do controller **não tem a action nem os hooks dela** (`store` → `beforeStore`/`afterStore`; `update` → `beforeUpdate`/`afterUpdate`; `destroy` → `beforeDestroy`/`afterDestroy`; `index` → `indexQuery`; `show` não tem hook), e os `use` que só elas precisavam também saem. A razão: um hook declarado sem a action que o chama seria código morto e daria a impressão de que sobrescrevê-lo faz algo. A classe final (`create-once`) lista no comentário só os hooks da base na primeira geração; se a final já existe e depois você remove uma action, o comentário antigo fica como está e um método que você tenha escrito para o hook removido continua compilando, mas nunca é chamado. As rotas também só existem para as actions mantidas (`->only(...)`).

### Validação das opções

Os erros usam o caminho exato (`pkg.entities.client.api.filters[1]`) e saem todos de uma vez junto com os demais da etapa:

| Mensagem | Quando |
|---|---|
| `campo "x" não existe na entidade "client" (campos: ...)` | nome em `filters`, `search`, `sort` ou `defaultSort` que não é campo da entidade (em `sort`/`defaultSort` a lista inclui `created_at` etc.) |
| `relacionamento "x" não existe na entidade "client" (use o nome do método na model: ...)` | item de `with` que não é o método de um `belongsTo`/`hasOne`/`hasMany` da entidade |
| `valor "x" inválido (use um de: index, show, store, update, destroy)` | action desconhecida |
| `a lista de actions não pode ser vazia ...` | `actions: []` |
| `deve ser maior que zero` / `deve ser número inteiro, recebido número` | `perPage` zero, negativo ou fracionário |
| `"filters" depende dos campos de cada entidade e não vale como padrão ...` | `filters`, `search`, `sort`, `defaultSort` ou `with` em `pkg.defaults.api` |

Os nomes são conferidos **depois** da [normalização de nomes](#normalização-de-nomes): campos citados em `filters`, `search`, `sort` e `defaultSort` viram snake_case (`createdAt` → `created_at`; o `-` de `defaultSort` é preservado) e os de `with` viram camelCase (`Orders` → `orders`), cada um com seu aviso (`pkg.entities.client.api.sort[1]: createdAt → created_at`). Com a normalização desligada os nomes ficam como estão, o aviso diz o que viraria e a validação recusa o que não bate com os campos.

Chaves desconhecidas dentro de `api` (como um `perpage` com erro de digitação) são ignoradas, como em qualquer outro lugar do manifest; o JSON Schema as aponta no editor.

## Normalização de nomes

Por padrão o crudmaker corrige sozinho nomes fora da convenção, para gerar `Award`/`awards` em vez de `Awards`/`awards` sem reescrever o manifest. Cada nome alterado gera um aviso.

| O que | Regra | Exemplos |
|---|---|---|
| Chave de `pkg.entities` | singular + camelCase | `awards` → `award`, `drawn_numbers` → `drawnNumber`, `player_invite` → `playerInvite`, `PlayerInvite` → `playerInvite`, `client` → `client` (sem aviso) |
| Referência a entidade nos relacionamentos (string ou `entity`) | a mesma regra | `hasMany: [awards]` → `award` |
| Chave de `fields`, `name` explícito do campo e `field` explícito do relacionamento | snake_case | `alertDate` → `alert_date` |
| FK derivada de um `belongsTo` | `<entidade em snake_case>_id` | `belongsTo: [course_content]` → entidade `courseContent`, FK `course_content_id`, tabela `course_contents` |

A regra de entidade usa o mesmo `pluralize`/`change-case` que define a classe e a tabela. Palavras que o `pluralize` considera plurais irregulares também mudam (ex.: `data` → `datum`); se não for o que você quer, desligue a normalização.

### Avisos

Um aviso por nome alterado, com o caminho original no manifest. Os avisos aparecem no resumo da CLI e no `--dry-run`, e não bloqueiam a geração:

```
Avisos (3):
  pkg.entities.awards → award
  pkg.entities.alert.fields.alertDate → alert_date
  pkg.entities.game.relationships.hasMany[0]: awards → award
```

Nomes de entidade e de campo mostram `caminho → novo nome`; referências mostram `caminho: antigo → novo`. O `manifest-lock.json` registra os nomes já normalizados.

### FK declarada à mão e derivada

Um campo declarado com o mesmo nome da FK de um `belongsTo` (ex.: `game_id: uuid` com `belongsTo: [game]`) é **unificado** num campo só, sem aviso: vale a declaração explícita (posição, `required`, `unique`...), completada com `relationship: true`. Com a normalização desligada, o campo derivado sobrescreve o declarado (`required: true`, `unique: false`).

### Colisões

Se dois nomes viram o mesmo depois de normalizados, é erro de validação (nada é gerado), com o caminho dos dois:

```
Erro: manifest inválido (2 problemas):
  pkg.entities.cards: o nome vira "card", o mesmo de pkg.entities.card; renomeie uma das entidades
  pkg.entities.alert.fields.alert_date: o nome vira "alert_date", o mesmo de pkg.entities.alert.fields.alertDate; renomeie um dos campos
```

### Desligar

- No manifest: `pkg.normalizeNames: false`. Todos que geram a partir do mesmo manifest obtêm a mesma saída.
- Na CLI: `--normalize-names` ou `--no-normalize-names`, com prioridade sobre o manifest nos dois sentidos (as duas juntas são erro).

Desligada, os nomes passam como estão (a saída é a de antes da normalização) e os avisos de convenção continuam aparecendo, no formato `pkg.entities.awards: fora da convenção (normalização desligada), viraria award`.

## Escrevendo em YAML

YAML 1.2, um único documento, com um mapa na raiz (`system`, `pkg`...). Vantagens sobre o JSON: comentários (`#`), sem aspas e sem vírgulas. O `crudmaker init` gera um exemplo comentado que cobre a forma curta × longa, `required`, `unique`, `enum`, `belongsTo` e `hasMany`.

```yaml
fields:
  id: uuid                      # forma curta: só o tipo
  email:                        # forma completa
    type: string
    unique: true
  status: { type: enum, enumItems: [active, blocked] }
```

Erros específicos de YAML (todos com exit code 1, sem gerar nada):

| Situação | Mensagem |
|---|---|
| Sintaxe inválida | `YAML inválido em <arquivo>:<linha>:<coluna>: <motivo>` (também para chave duplicada) |
| Arquivo vazio ou só com comentários | `O manifest <arquivo> está vazio.` |
| Lista ou texto na raiz | `O manifest <arquivo> deve ser um mapa (system, pkg...) na raiz, mas é uma lista.` |
| Mais de um documento (`---`) | `<arquivo> tem 2 documentos YAML (separados por "---"); o manifest deve ter um só.` |
| Extensão diferente de `.yaml`, `.yml`, `.json` | `Extensão ".toml" não suportada em <arquivo>. Use um destes: .yaml, .yml, .json.` |

Depois do parse, o YAML passa pela mesma validação do JSON, com as mesmas mensagens e caminhos.

### Pegadinhas do YAML

- **Indentação com espaços**, nunca tabs. Uma indentação errada muda a estrutura (um campo vira filho de outro) e costuma aparecer como erro de validação, não de sintaxe.
- **`no`, `yes`, `on`, `off` são texto**, não booleano (YAML 1.2). Só `true` e `false` são booleanos, então `required: false` funciona como esperado. Para o nome de uma entidade ou campo, prefira não usar essas palavras mesmo assim, para o arquivo continuar legível em outras ferramentas (YAML 1.1).
- **Números**: `01` vira o número 1 e `1.0` vira 1. Os valores do manifest são nomes de tipo e flags, então isso não afeta o formato atual; se um dia precisar do texto literal, use aspas (`"01"`).
- **Texto com `:` ou `#`** precisa de aspas (`label: "a: b"`).
- **Chaves duplicadas** no mesmo mapa são erro, não "vale a última".
- **Âncoras e aliases** (`&a`, `*a`) funcionam, mas tags customizadas (`!!js/...`) não são interpretadas: nada no manifest executa código.

## Validação e JSON Schema

O manifest passa por quatro etapas antes de gerar qualquer arquivo: **estrutura** (schema zod: chaves obrigatórias, tipos de valor, tipo de campo conhecido), **normalização de nomes** (e as colisões que ela detecta), **consistência entre entidades** (já com os nomes normalizados: alvos dos relacionamentos, campo `id`, nomes reservados do PHP e ciclos de FK) e **normalização** das formas curtas. Todos os problemas de uma etapa são reportados de uma vez, com o caminho real no arquivo. Se a estrutura estiver errada, a consistência entre entidades só é checada depois que ela for corrigida.

```
$ crudmaker generate manifest.json --out ../api
Erro: manifest inválido (3 problemas):
  pkg.code: campo obrigatório ausente
  pkg.entities.client.fields.email: tipo "strng" desconhecido (use um de: uuid, string, text, date, datetime, double, integer, boolean, json, enum, int, displayName)
  pkg.entities.client.fields.age.required: deve ser verdadeiro/falso (true/false), recebido texto
```

O comando sai com código 1 e nenhum arquivo é escrito.

### Erros possíveis

| Mensagem | Quando |
|---|---|
| `campo obrigatório ausente` | falta `system`, `system.code`, `pkg`, `pkg.code`, `pkg.entities`, `type` de um campo ou `entity` de um relacionamento |
| `não pode ser vazio` | `system.code`, `pkg.code` ou o nome da entidade relacionada é `""` |
| `deve ser <tipo>, recebido <tipo>` | valor do tipo errado (ex.: `required: "sim"`, `relationships.hasMany: "alert"`, entidade que não é objeto) |
| `deve ser um texto ou um objeto, recebido ...` | campo ou item de relacionamento que não é string nem objeto |
| `tipo "x" desconhecido (use um de: ...)` | `type` do campo fora da lista de tipos (na forma curta o caminho é o próprio campo) |
| `valor "x" inválido (use um de: ...)` | `relationship` de um item com tipo de relacionamento desconhecido |
| `campo enum precisa de enumItems` / `... de ao menos um item` | campo `enum` sem `enumItems` ou com lista vazia (na forma curta, use a forma completa) |
| `entidade "x" não existe em pkg.entities (entidades: ...)` | relacionamento de qualquer tipo de lista (`owned`/`morphed` não contam) apontando para entidade inexistente. Nome e lista de entidades já normalizados; o caminho é o do arquivo |
| `o nome vira "x", o mesmo de ...` | duas entidades (ou dois campos da mesma entidade) com o mesmo nome depois da normalização |
| `a entidade "x" não tem o campo "id"; declare "id": "uuid" ...` | entidade sem campo `id` (pela chave ou pelo `name`). O caminho é `pkg.entities.x.fields` (ou a própria entidade, se não tem `fields`) |
| `o nome gera a classe "X", que é palavra reservada do PHP; renomeie a entidade ...` | o nome da entidade (já normalizado) gera uma classe com palavra reservada do PHP, sem diferenciar maiúsculas: `class` → `Class`. Vale a lista oficial de palavras reservadas do PHP 8 mais os nomes de classe reservados (`self`, `parent`, `int`, `string`, `null`...). Nomes que só *contêm* a palavra (`classroom`, `listing`) são válidos |
| (opções de `api`) | veja [Validação das opções](#validação-das-opções) |
| `dependência circular entre FKs (a → b → a) ...` | ciclo de `belongsTo` entre entidades (veja [Ordem das migrations](#ordem-das-migrations)); o caminho aponta para o `belongsTo` que sai da primeira entidade do ciclo |

O caminho usa `.` para chaves e `[n]` para posições de lista, por exemplo `pkg.entities.alert.relationships.belongsTo[0]`.

### Autocomplete no editor (JSON Schema)

O formato é descrito por `schema/manifest.schema.json`, gerado a partir do schema zod (`npm run schema`) e incluído no pacote npm. Ele descreve o formato de entrada, com `description` em cada campo. Para ter autocomplete e validação no VS Code, aponte `$schema` para ele no próprio manifest:

```json
{
  "$schema": "./node_modules/crudmaker/schema/manifest.schema.json",
  "system": { "code": "crudmaker" },
  "pkg": { "code": "minha-api", "entities": {} }
}
```

Também funciona por configuração, sem mexer no manifest (`.vscode/settings.json`):

```json
{ "json.schemas": [{ "fileMatch": ["manifest.json"], "url": "./node_modules/crudmaker/schema/manifest.schema.json" }] }
```

#### Em YAML

Instale a extensão **YAML** da Red Hat. Ela lê um comentário no topo do arquivo (é o que o `crudmaker init` escreve):

```yaml
# yaml-language-server: $schema=./node_modules/crudmaker/schema/manifest.schema.json
system:
  code: minha-api
```

O caminho é relativo ao arquivo do manifest e supõe o crudmaker instalado em `node_modules` ao lado dele (como no exemplo JSON acima). Se o manifest estiver em outra pasta, ou o crudmaker estiver instalado de outra forma, ajuste o caminho (pode ser absoluto ou uma URL). Também funciona por configuração, sem mexer no manifest (`.vscode/settings.json`):

```json
{ "yaml.schemas": { "./node_modules/crudmaker/schema/manifest.schema.json": ["manifest.yaml", "manifest.yml"] } }
```

O crudmaker ignora esse comentário (e a chave `$schema` no JSON).

## Exemplo completo

```yaml
system:
  title: Crudmaker
  code: crudmaker
pkg:
  code: vende-que-vende-api
  entities:
    client:
      fields:
        id: uuid
        name: string
        email: { type: string, unique: true }
        phone: string
      relationships:
        hasOne: [address]
        hasMany: [alert]
    alert:
      fields:
        id: uuid
        message: string
        alertDate: datetime   # vira alert_date (com aviso)
      relationships:
        belongsTo: [client]
    address:
      fields:
        id: uuid
        street: string
        city: string
      relationships:
        belongsTo: [client]
```

O mesmo manifest em JSON:

```json
{
  "system": { "title": "Crudmaker", "code": "crudmaker" },
  "pkg": {
    "code": "vende-que-vende-api",
    "entities": {
      "client": {
        "fields": {
          "id": "uuid",
          "name": "string",
          "email": { "type": "string", "unique": true },
          "phone": "string"
        },
        "relationships": {
          "hasOne": ["address"],
          "hasMany": ["alert"]
        }
      },
      "alert": {
        "fields": {
          "id": "uuid",
          "message": "string",
          "alertDate": "datetime"
        },
        "relationships": { "belongsTo": ["client"] }
      },
      "address": {
        "fields": {
          "id": "uuid",
          "street": "string",
          "city": "string"
        },
        "relationships": { "belongsTo": ["client"] }
      }
    }
  }
}
```

O arquivo `manifest.example.json` na raiz do repositório mostra todos os tipos de campo e de relacionamento aceitos pelo parser (é um catálogo de formas, mas é um manifest válido: a entidade `entity`, usada nos relacionamentos, está declarada nele).
