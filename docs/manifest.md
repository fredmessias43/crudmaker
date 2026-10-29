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
| `unique` | `false` | Cria índice único na migration e regra `Rule::unique` na request. |
| `enumItems` | `[]` | Valores permitidos quando `type` é `enum`. |

> **Declare sempre `"id": "uuid"`.** A model usa `HasUuids` e chave do tipo string, e a migration só marca como `primary()` a coluna chamada `id`. Sem esse campo a tabela fica sem chave primária.

### Tipos

| Tipo | Migration | Validação na request | Cast na model |
|---|---|---|---|
| `uuid` | `uuid()` | `uuid` | — |
| `string` | `string()` | `string` | — |
| `text` | `text()` | `string` | — |
| `integer` (alias `int`) | `integer()` | `integer` | — |
| `double` | `double()` | `double` | — |
| `boolean` | `boolean()` | `boolean` | `boolean` |
| `date` | `date()` | `date_format:Y-m-d` | — |
| `datetime` | `datetime()` | `date_format:Y-m-d H:i` | — |
| `json` | `json()` | `array` | `array` |
| `enum` | `enum(..., [itens])` com default no primeiro item | `Rule::in([itens])` | — |

O tipo especial `displayName` vira um campo `string` chamado `display_name`, seja qual for a chave usada.

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

Quando `field` é diferente de `<entidade>_id`, o método da model recebe o nome do campo sem o `_id` (`author_id` → `author()`) e a FK é passada explicitamente.

**Declare os dois lados.** O gerador não cria o relacionamento inverso: se `client` tem `hasMany: ["alert"]`, `alert` precisa de `belongsTo: ["client"]` para a coluna `client_id` existir.

### Limitações conhecidas

- Com a [normalização de nomes](#normalização-de-nomes) **desligada**, na forma curta (string) a FK é `<nome>_id` **sem** converter para snake_case: `"belongsTo": ["orderItem"]` gera `orderItem_id`. Ligada (o padrão), vira `order_item_id`. A FK da migration (`->on('order_items')`) usa o snake_case plural nos dois casos.
- `owned` e `morphed` adicionam os campos `owner_id` e `owner_class`, mas `ownOne`, `ownMany`, `morphOne`, `morphMany` e `morphTo` ainda **não** geram métodos válidos na model. Não use.
- `indexes` (por entidade) e `pkg.enums` são aceitos no manifest, mas ignorados.

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

O manifest passa por quatro etapas antes de gerar qualquer arquivo: **estrutura** (schema zod: chaves obrigatórias, tipos de valor, tipo de campo conhecido), **normalização de nomes** (e as colisões que ela detecta), **consistência entre entidades** (já com os nomes normalizados) e **normalização** das formas curtas. Todos os problemas de uma etapa são reportados de uma vez, com o caminho real no arquivo. Se a estrutura estiver errada, a consistência entre entidades só é checada depois que ela for corrigida.

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

O caminho usa `.` para chaves e `[n]` para posições de lista, por exemplo `pkg.entities.alert.relationships.belongsTo[0]`. A ausência do campo `id` ainda não é validada.

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
