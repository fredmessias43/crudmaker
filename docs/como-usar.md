# Como usar

Este guia descreve o fluxo atual do crudmaker, pela CLI `crudmaker`. O manifest pode ser YAML ou JSON. As demais melhorias estão planejadas em [specs/crudmaker-v2.md](specs/crudmaker-v2.md).

## Pré-requisitos

- Node.js e npm.
- Um projeto Laravel com a API instalada (`php artisan install:api`), se você quiser rodar o resultado.

```bash
npm install
npm run build        # compila para dist/ (necessário para o binário `crudmaker`)
npm link             # opcional: instala o comando `crudmaker` no seu PATH
```

Sem build, dá para rodar direto do código-fonte: `npm run cli -- <comando> ...` (equivale a `crudmaker <comando> ...`). Os exemplos abaixo usam `crudmaker`.

## 1. Escrever o manifest

```bash
crudmaker init                # cria manifest.yaml de exemplo, comentado (recusa se já existir)
crudmaker init outro.yaml     # ou com outro nome (.yaml ou .yml)
crudmaker init manifest.json  # a extensão escolhe o formato: .json cria o exemplo em JSON
```

Edite o arquivo conforme o formato descrito em [manifest.md](manifest.md). YAML é o formato recomendado (aceita comentários); JSON continua funcionando. O formato é detectado pela extensão (`.yaml`, `.yml` ou `.json`); qualquer outra dá erro. Para ter autocomplete no VS Code, veja [Autocomplete no editor](manifest.md#autocomplete-no-editor-json-schema).

## 2. Ter o projeto Laravel de destino

```bash
composer create-project laravel/laravel minha-api
cd minha-api && php artisan install:api
```

O destino é a raiz desse projeto. Os arquivos gerados caem direto em `app/` e `database/migrations/`.

## 3. Conferir com `--dry-run`

```bash
crudmaker generate manifest.yaml --out ../minha-api --dry-run
```

Não escreve nada. Lista cada arquivo com o que aconteceria:

| Classificação | Significado |
|---|---|
| criados | o arquivo não existe e será criado |
| sobrescritos | existe, o conteúdo é diferente e será reescrito (edições à mão se perdem) |
| sem mudança | existe com conteúdo idêntico ao que seria gerado; nada é gravado |
| preservados | existe e é de código que o usuário mantém (`create-once`); não é tocado (os geradores atuais ainda não produzem esse tipo) |

## 4. Gerar

```bash
crudmaker generate manifest.yaml --out ../minha-api
```

`--out` é a raiz do projeto Laravel e, se omitido, vale o diretório atual. No fim a CLI imprime o resumo: a lista de arquivos por classificação e as contagens (`Total: 13 arquivos (13 criados, 0 sobrescritos, 0 sem mudança, 0 preservados)`). Se algum nome do manifest estiver fora da convenção (`awards`, `drawn_numbers`, `alertDate`), o resumo termina com a seção `Avisos (N)`, uma linha por nome alterado (também no `--dry-run`; vão para o stdout e não bloqueiam a geração). Veja [Normalização de nomes](manifest.md#normalização-de-nomes). Para ligar ou desligar a normalização sem editar o manifest, use `--normalize-names` / `--no-normalize-names` (a flag vence `pkg.normalizeNames`). Se dois nomes colidirem depois de normalizados, nada é gerado e o erro mostra o caminho dos dois. Erros (manifest inexistente, extensão não suportada, JSON ou YAML inválido, manifest inválido) vão para o stderr com exit code 1.

Para cada entidade são escritos:

| Arquivo | Pasta |
|---|---|
| `<Entidade>.php` (Model) | `app/Models/` |
| `<Entidade>Controller.php` | `app/Http/Controllers/Api/` |
| `<Entidade>Request.php` | `app/Http/Requests/` |
| `<Entidade>Resource.php` e `<Entidade>Collection.php` | `app/Http/Resources/` |
| `<data>_create_<tabela>_table.php` | `database/migrations/` |

Além disso, são gravados na raiz do destino:

| Arquivo | O que é |
|---|---|
| `manifest-lock.json` | o manifest já normalizado, para conferir o que o gerador entendeu |
| `routes/crudmaker.php` | uma `Route::apiResource` por entidade (veja abaixo) |
| `routes/api.php` | só ganha o include de `routes/crudmaker.php`, uma única vez; o resto fica intacto |

### Rotas

`routes/crudmaker.php` tem um cabeçalho avisando que é gerado e é sobrescrito a cada execução. O recurso na URL é o plural da tabela em kebab-case: a entidade `classLesson` vira `Route::apiResource('class-lessons', ClassLessonController::class);`. O Laravel deriva daí o parâmetro `{class_lesson}`, o mesmo nome que a Request lê com `$this->route('class_lesson')`, então o route model binding funciona sem configuração extra.

O `generate` acrescenta ao fim do `routes/api.php` (só se ainda não houver um `require`/`include` de `crudmaker.php`):

```php
// Rotas geradas pelo crudmaker (routes/crudmaker.php).
require __DIR__ . '/crudmaker.php';
```

Como o arquivo é carregado de dentro do `routes/api.php`, as rotas ganham o prefixo `/api` e os middlewares do grupo `api` do Laravel. Rotas próprias e middlewares (por exemplo `auth:sanctum`) ficam no `routes/api.php`, fora do arquivo gerado.

**Requisito:** o projeto Laravel (11+) precisa do `routes/api.php`, criado por `php artisan install:api`, que também o registra em `bootstrap/app.php`. Se o arquivo não existir, o `generate` não o cria (criar o arquivo sozinho não o faria ser carregado), grava `routes/crudmaker.php` e imprime um aviso. Rode `install:api` e gere de novo. O `--dry-run` mostra o `routes/api.php` como sobrescrito quando o include vai ser acrescentado.

## 5. Terminar à mão

O gerador não roda o `migrate`. Rode `php artisan migrate`: as migrations já saem ordenadas por dependência de FK (a tabela referenciada vem antes), com timestamps consecutivos (`now` + 1 segundo por migration), então não há ordem para acertar à mão.

## Regerar

- **Tudo é sobrescrito** (veja o `--dry-run`), exceto o nome das migrations: se já existe uma migration terminada em `_create_<tabela>_table.php`, o mesmo arquivo é reaproveitado (e o conteúdo é reescrito). Tabelas novas ganham o timestamp novo, na ordem de dependência. Qualquer edição feita à mão nos arquivos gerados se perde. Use git no projeto Laravel para recuperar o que precisar.
- Mudanças de schema não viram migration de alteração; a migration de criação é reescrita. Num banco que já rodou a migration, você precisa criar a alteração à mão ou usar `migrate:fresh`.

## Comportamento da API gerada

| Action | Rota | Resposta |
|---|---|---|
| `index` | `GET /api/clients` | 200, paginado (`paginate(15)`) |
| `store` | `POST /api/clients` | 201, registro criado |
| `show` | `GET /api/clients/{client}` | 200 |
| `update` | `PUT /api/clients/{client}` | 200, registro atualizado |
| `destroy` | `DELETE /api/clients/{client}` | 204, sem corpo (`response()->noContent()`) |

Formato das respostas com corpo:

- `store`, `show` e `update`: `{ "status": 201|200, "message": ..., "data": { ... } }`. O `message` só existe nas escritas (`store` e `update`).
- `index`: formato nativo de paginação do Laravel, `{ "data": [ ... ], "links": { ... }, "meta": { ... } }`. Não leva `status` nem `message`: o envelope `data` é o mesmo das demais respostas, e `links`/`meta` (página atual, total, URLs) são acrescentados pelo Laravel. A página vem de `?page=N`; o tamanho fixo é 15 (as opções do manifest virão no ticket 11).
- `destroy`: corpo vazio.

Os controllers não têm try/catch: erros chegam ao handler do Laravel e saem com o status certo. Registro inexistente na rota dá 404, validação falha com 422 (`{ "message": ..., "errors": { ... } }`), autorização negada dá 403, e só exceções não tratadas viram 500. Os registros usam soft delete, e a resource devolve `created_at`/`updated_at` como `{ timestamp, description }`.

## Problemas conhecidos

Os bugs do código gerado e as limitações do manifest estão listados em [manifest.md](manifest.md#limitações-conhecidas) e na spec da v2. Os principais:

- a model usa `HasFactory`, mas nenhuma factory é gerada;
- a regra de validação `double` não existe no Laravel (use `numeric` à mão se precisar);
- a model de uma FK com nome customizado (`field: "author_id"`) passa as chaves de `belongsTo`/`hasMany` na ordem trocada.
