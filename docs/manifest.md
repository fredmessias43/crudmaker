# Referência do manifest

O manifest é um JSON que descreve as entidades da API. O crudmaker o lê, normaliza (formas curtas viram formas completas, campos de FK são derivados dos relacionamentos) e gera o PHP a partir do resultado.

## Estrutura

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

| Chave | Obrigatória | Uso |
|---|---|---|
| `system.code` | sim | Lido e guardado, mas hoje não afeta a saída (o namespace é sempre `App`). |
| `system.title` | não | Não usado. |
| `pkg.code` | sim | Nome da pasta de saída: os arquivos vão para `generated/<pkg.code>/`. |
| `pkg.entities` | sim | Mapa `nomeDaEntidade → definição`. |

Se faltar alguma chave obrigatória, a geração para com um erro do tipo `Manifest must have 'pkg.code' key`.

### Nome da entidade

A chave em `pkg.entities` é o nome da entidade no singular, de preferência em camelCase (`client`, `orderItem`). Dele saem:

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
| `field` | `<entity>_id` | Nome da coluna de FK. |
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

- Na forma curta (string), a FK é `<nome>_id` **sem** converter para snake_case: `"belongsTo": ["orderItem"]` gera `orderItem_id`. Use a forma de objeto com `field` para entidades em camelCase.
- A FK da migration aponta para o plural do nome da entidade sem snake_case (`orderItems` em vez de `order_items`). Para entidades de uma palavra só funciona.
- `owned` e `morphed` adicionam os campos `owner_id` e `owner_class`, mas `ownOne`, `ownMany`, `morphOne`, `morphMany` e `morphTo` ainda **não** geram métodos válidos na model. Não use.
- `indexes` é aceito no manifest, mas ignorado.

## Exemplo completo

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

O arquivo `manifest.example.json` na raiz do repositório mostra todos os tipos de campo e de relacionamento aceitos pelo parser.
