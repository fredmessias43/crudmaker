# crudmaker: guia para IA

O crudmaker gera a API Laravel (model, migration, controller, request, resource, factory, rotas, testes Pest) a partir do `manifest.yaml`, que é 15–30x menor que o PHP. **Altere o manifest e rode o gerador; não escreva CRUD em PHP.** PHP à mão só para regra de negócio.

## Fluxo

1. Edite `manifest.yaml`.
2. `crudmaker generate manifest.yaml --dry-run` (não escreve nada; lista o que muda e os avisos).
3. `crudmaker generate manifest.yaml` (`--out <projeto>` se o Laravel não está no diretório atual).
4. `php artisan migrate`. Mudança de schema vira uma migration `alter` sozinha.

## Manifest

```yaml
system: { code: loja }
pkg:
  code: loja
  entities:                       # entidade: singular, camelCase
    client:
      fields:                     # campo: snake_case; sempre `id: uuid`
        id: uuid
        name: { type: string, rules: ["max:120"] }
        email: { type: string, unique: true }
        notes: { type: text, required: false }
        status: { type: enum, enumItems: [active, blocked], default: active }
        password: { type: string, hidden: true }
      relationships:
        hasMany: [order]
      api:                        # tudo opcional
        actions: [index, show, store, update]
        middleware: [auth:sanctum]
        filters: [status]
        search: [name, email]
        sort: [name]
        defaultSort: -created_at
        with: [orders]
        perPage: 20
    order:
      fields: { id: uuid, total: double, paid: boolean }   # forma curta: só o tipo
      relationships:
        belongsTo: [client]       # declare os dois lados; cria client_id
```

Tipos: uuid, string, text, integer, double, boolean, date, datetime, json, enum. Referência completa de chaves e opções: `schema/manifest.schema.json` (no pacote crudmaker).

## Onde escrever código

Nas classes finais, criadas uma vez e nunca sobrescritas (`app/Models/Client.php`, `app/Http/Controllers/Api/ClientController.php`, `ClientRequest`, `ClientResource`, `database/factories/ClientFactory.php`). Ordem: 1) manifest; 2) hooks; 3) stubs (`crudmaker stubs:publish`), só para mudar o padrão de todos os arquivos de um tipo.

Hooks (assinatura idêntica à da base): controller `indexQuery`, `beforeStore`, `afterStore`, `beforeUpdate`, `afterUpdate`, `beforeDestroy`, `afterDestroy`; request `extraRules()`, `authorize()`; resource `extra()`; model: Eloquent normal (scopes, accessors, `booted()`).

## Nunca edite

`app/Generated/`, `routes/crudmaker.php`, `tests/Feature/Crudmaker/` e `manifest-lock.json` são regravados a cada geração; migrations já emitidas não mudam (para alterar a tabela, mude o manifest).

## Avisos e erros

- Erro de validação traz o caminho no manifest (`pkg.entities.client.fields.email`): corrija e rode de novo; nada foi escrito.
- Aviso de normalização (`awards → award`): adote o nome novo no manifest.
- `ATENÇÃO` de remoção + adição de campo: o crudmaker não detecta renomeação e perderia os dados da coluna. Antes do `migrate`, troque `dropColumn`/`addColumn` por `renameColumn` na migration `alter` gerada.
- Entidade removida do manifest: só as bases geradas são apagadas; finais e migrations ficam órfãs.
