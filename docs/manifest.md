# Referência do manifest

O manifest é um JSON que descreve as entidades da API. O crudmaker o valida, normaliza (formas curtas viram formas completas, campos de FK são derivados dos relacionamentos) e gera o PHP a partir do resultado.

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
| `$schema` | não | Caminho do JSON Schema, para autocomplete no editor. Ignorado pelo crudmaker. |
| `pkg.code` | sim | Nome da pasta de saída: os arquivos vão para `generated/<pkg.code>/`. |
| `pkg.entities` | sim | Mapa `nomeDaEntidade → definição`. |

Antes de gerar, o manifest é validado (veja [Validação](#validação-e-json-schema)). Se houver qualquer problema, nada é gerado.

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
- `indexes` (por entidade) e `pkg.enums` são aceitos no manifest, mas ignorados.

## Validação e JSON Schema

O manifest passa por três etapas antes de gerar qualquer arquivo: **estrutura** (schema zod: chaves obrigatórias, tipos de valor, tipo de campo conhecido), **consistência entre entidades** e **normalização**. Todos os problemas de uma etapa são reportados de uma vez, com o caminho real no arquivo. Se a estrutura estiver errada, a consistência entre entidades só é checada depois que ela for corrigida.

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
| `entidade "x" não existe em pkg.entities (entidades: ...)` | relacionamento de qualquer tipo de lista (`owned`/`morphed` não contam) apontando para entidade inexistente |

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

Para manifests em YAML, a associação ao schema será feita pela extensão YAML do VS Code (comentário `# yaml-language-server: $schema=...`); isso entra junto com o suporte a YAML (ticket 03).

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

O arquivo `manifest.example.json` na raiz do repositório mostra todos os tipos de campo e de relacionamento aceitos pelo parser (é um catálogo de formas, mas é um manifest válido: a entidade `entity`, usada nos relacionamentos, está declarada nele).
