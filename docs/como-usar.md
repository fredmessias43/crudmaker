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
| preservados | existe e é da camada de customização (`create-once`: as classes finais); nunca é tocado. Nenhuma opção da CLI sobrescreve esses arquivos (não existe `--force`) |
| removidos | arquivo da camada gerada (`app/Generated/...`) de uma entidade que saiu do manifest; será apagado (veja [Remover uma entidade](#remover-uma-entidade)) |

Quando uma entidade saiu do manifest, o resumo também traz a seção `Órfãos`: arquivos seus (classes finais e migration) que não são apagados.

## 4. Gerar

```bash
crudmaker generate manifest.yaml --out ../minha-api
```

`--out` é a raiz do projeto Laravel e, se omitido, vale o diretório atual. No fim a CLI imprime o resumo: a lista de arquivos por classificação e as contagens (`Total: 25 arquivos (24 criados, 1 sobrescritos, 0 sem mudança, 0 preservados, 0 removidos)`). Se algum nome do manifest estiver fora da convenção (`awards`, `drawn_numbers`, `alertDate`), o resumo termina com a seção `Avisos (N)`, uma linha por nome alterado ou por final antiga que não estende a base (também no `--dry-run`; vão para o stdout e não bloqueiam a geração). Veja [Normalização de nomes](manifest.md#normalização-de-nomes). Para ligar ou desligar a normalização sem editar o manifest, use `--normalize-names` / `--no-normalize-names` (a flag vence `pkg.normalizeNames`). Se dois nomes colidirem depois de normalizados, nada é gerado e o erro mostra o caminho dos dois. Erros (manifest inexistente, extensão não suportada, JSON ou YAML inválido, manifest inválido) vão para o stderr com exit code 1.

Para cada entidade (`Client`, no exemplo) são escritos dois arquivos por classe, uma **base gerada** e uma **classe final** sua (veja [Duas camadas](#duas-camadas-onde-escrever-código)), mais a migration:

| Classe | Base gerada (`overwrite`, não edite) | Classe final (`create-once`, é sua) |
|---|---|---|
| Model | `app/Generated/Models/BaseClient.php` | `app/Models/Client.php` |
| Controller | `app/Generated/Http/Controllers/Api/BaseClientController.php` | `app/Http/Controllers/Api/ClientController.php` |
| Request | `app/Generated/Http/Requests/BaseClientRequest.php` | `app/Http/Requests/ClientRequest.php` |
| Resource | `app/Generated/Http/Resources/BaseClientResource.php` | `app/Http/Resources/ClientResource.php` |
| Collection | `app/Generated/Http/Resources/BaseClientCollection.php` | `app/Http/Resources/ClientCollection.php` |

| Arquivo | Pasta | Política |
|---|---|---|
| `<data>_create_<tabela>_table.php` | `database/migrations/` | `overwrite`, arquivo único (sem base nem final) |

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

Como o arquivo é carregado de dentro do `routes/api.php`, as rotas ganham o prefixo `/api` e os middlewares do grupo `api` do Laravel. Rotas próprias ficam no `routes/api.php`, fora do arquivo gerado.

**Middleware e actions pelo manifest.** Não é preciso mais envolver o `require` à mão num grupo para proteger as rotas: o `api.middleware` (por entidade ou em `pkg.defaults.api`) vira `->middleware([...])` em cada `apiResource`, e o `api.actions` vira `->only([...])`. Por exemplo, com `middleware: [auth:sanctum]` no padrão e `actions: [index, show]` em `tag`:

```php
Route::apiResource('clients', ClientController::class)->middleware(['auth:sanctum']);
Route::apiResource('tags', TagController::class)->only(['index', 'show'])->middleware(['auth:sanctum']);
```

Um grupo no `routes/api.php` em volta do `require` continua funcionando e soma com o middleware das rotas. Veja [Opções da API](manifest.md#opções-da-api-api).

**Requisito:** o projeto Laravel (11+) precisa do `routes/api.php`, criado por `php artisan install:api`, que também o registra em `bootstrap/app.php`. Se o arquivo não existir, o `generate` não o cria (criar o arquivo sozinho não o faria ser carregado), grava `routes/crudmaker.php` e imprime um aviso. Rode `install:api` e gere de novo. O `--dry-run` mostra o `routes/api.php` como sobrescrito quando o include vai ser acrescentado.

## 5. Terminar à mão

O gerador não roda o `migrate`. Rode `php artisan migrate`: as migrations já saem ordenadas por dependência de FK (a tabela referenciada vem antes), com timestamps consecutivos (`now` + 1 segundo por migration), então não há ordem para acertar à mão.

## Duas camadas: onde escrever código

Para model, controller, request, resource e collection, cada classe existe em duas camadas:

- **Base gerada**, em `app/Generated/...` (namespace `App\Generated\...`, nome `Base<Classe>`). É sobrescrita a cada `generate`, é `abstract` e tem no topo o aviso `ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE`.
- **Classe final**, no namespace normal (`App\Models\Client`), que **estende a base**. É criada **uma única vez** (política `create-once`), nasce vazia, só com um comentário listando o que dá para sobrescrever, e nunca mais é tocada pelo crudmaker: nenhuma opção da CLI a sobrescreve (`--dry-run`, `--normalize-names`, mudança de manifest...). Se você apagar o arquivo, o próximo `generate` o recria vazio.

As rotas (`routes/crudmaker.php`) e as referências entre classes usam **sempre as classes finais**: o controller base recebe `ClientRequest` e `Client` (as finais) e devolve `ClientResource`/`ClientCollection` (as finais), e os relacionamentos da model base apontam para as models finais das outras entidades. Assim uma customização vale em todo lugar, inclusive no route model binding e na validação.

Ordem de preferência para customizar: (1) o manifest, para o que é declarativo; (2) os hooks e as sobrescritas nas classes finais, para regra de negócio; (3) os stubs (templates), para mudar o padrão de um tipo de arquivo inteiro (ainda não implementados).

### Hooks do controller

Todos são `protected`, estão declarados na base sem efeito (devolvem a entrada) e a classe final sobrescreve só os que precisar. As assinaturas precisam ficar idênticas às da base: se não ficarem, o PHP acusa na hora que a classe é carregada.

| Hook | Quando roda | Entrada → saída |
|---|---|---|
| `indexQuery(Builder $query, Request $request): Builder` | no `index`, depois dos filtros, da busca e da ordenação declarados no manifest ([`api`](manifest.md#opções-da-api-api)), antes de paginar | query → query |
| `beforeStore(array $data, Request $request): array` | antes de criar | dados validados → dados a gravar |
| `afterStore(Client $model, Request $request): void` | depois de criar | registro gravado |
| `beforeUpdate(Client $model, array $data, Request $request): array` | antes de atualizar | registro e dados validados → dados a gravar |
| `afterUpdate(Client $model, Request $request): void` | depois de atualizar | registro |
| `beforeDestroy(Client $model, Request $request): void` | antes de remover | registro |
| `afterDestroy(Client $model, Request $request): void` | depois de remover | registro |

Se o manifest restringe `api.actions`, a base só tem os hooks das actions mantidas (sem `destroy`, não existem `beforeDestroy` nem `afterDestroy`).

`Builder` é `Illuminate\Database\Eloquent\Builder`, `Request` é `Illuminate\Http\Request` e o tipo do registro é a model final da entidade. `store`, `update` e `destroy` rodam a gravação e os hooks `before*`/`after*` **dentro da mesma `DB::transaction`**: se um hook lançar uma exceção (ou chamar `abort()`), nada é gravado e o Laravel responde com o status da exceção. A resposta só é montada depois do commit.

Exemplo: o cliente pertence ao usuário logado (o manifest declara o `belongsTo` de `user`, que cria o campo `user_id`; só campos do manifest entram na gravação, e para o cliente da API não precisar mandar o `user_id` a FK deve ser opcional: `belongsTo: [{ entity: user, required: false }]`):

```php
<?php

namespace App\Http\Controllers\Api;

use App\Generated\Http\Controllers\Api\BaseClientController;
use App\Mail\ClientWelcome;
use App\Models\Client;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class ClientController extends BaseClientController
{
	// A listagem só mostra os clientes do usuário logado.
	protected function indexQuery(Builder $query, Request $request): Builder
	{
		return $query->where('user_id', $request->user()->id);
	}

	// O cliente criado passa a ser do usuário logado.
	protected function beforeStore(array $data, Request $request): array
	{
		$data['user_id'] = $request->user()->id;

		return $data;
	}

	// Depois de gravar, manda o e-mail de boas-vindas. O hook roda dentro da transação:
	// com `DB::afterCommit()` o envio só acontece se ela for confirmada.
	protected function afterStore(Client $model, Request $request): void
	{
		DB::afterCommit(fn () => Mail::to($model->email)->send(new ClientWelcome($model)));
	}

	// Barra a remoção de quem ainda tem alertas: 409 Conflict, e nada é apagado.
	protected function beforeDestroy(Client $model, Request $request): void
	{
		abort_if($model->alerts()->exists(), 409, 'O cliente ainda tem alertas.');
	}
}
```

### Request, resource, collection e model

- **Request** (`ClientRequest`): o `rules()` da base junta as regras geradas com o retorno de `protected function extraRules(): array`; a mesma chave de campo troca a regra gerada, uma chave nova acrescenta. O `authorize()` pode ser sobrescrito (`public function authorize(): bool`); a base libera tudo. Exemplo: `protected function extraRules(): array { return ['email' => ['bail', 'required', 'email']]; }`.
- **Resource** (`ClientResource`): o `toArray()` da base junta os campos gerados com o retorno de `protected function extra(Request $request): array` (campos calculados; chave repetida substitui a gerada). Exemplo: `return ['display_name' => strtoupper($this->name)];`.
- **Collection** (`ClientCollection`): não tem hook. Cada item da lista sai pela `ClientResource` final, então o `extra()` da resource vale na listagem também. Ajustes só da coleção (`with()`, `paginationInformation()`) vão direto na classe final.
- **Model** (`Client`): não tem hook; use os recursos do Eloquent na classe final: scopes (inclusive globais), accessors, `$hidden`/`$appends`, relacionamentos extras e eventos em `booted()`. Redeclarar `$casts` ou `$fillable` na final **substitui** os gerados; para somar, use `$this->mergeCasts([...])` e `$this->mergeFillable([...])` num `__construct(array $attributes = [])` que chame `parent::__construct($attributes)`.

## Regerar

- **Camada gerada**: as bases em `app/Generated/`, as migrations, `routes/crudmaker.php` e o `manifest-lock.json` são sobrescritos (veja o `--dry-run`). Não edite as bases: a edição se perde. Exceção no nome das migrations: se já existe uma terminada em `_create_<tabela>_table.php`, o mesmo arquivo é reaproveitado (e o conteúdo é reescrito). Tabelas novas ganham o timestamp novo, na ordem de dependência.
- **Camada de customização**: as classes finais existentes são **preservadas** sempre e só são criadas se faltarem. Hooks e código seu sobrevivem a qualquer regeração.
- Mudanças de schema não viram migration de alteração; a migration de criação é reescrita. Num banco que já rodou a migration, você precisa criar a alteração à mão ou usar `migrate:fresh`.
- O Laravel carrega `app/Generated/` pelo autoload PSR-4 padrão (`App\` → `app/`); não precisa configurar nada.

### Remover uma entidade

Se uma entidade sai do manifest, o `generate` usa o `manifest-lock.json` da geração anterior para saber o que existia e:

- **apaga** as bases dela em `app/Generated/` (aparecem em `removidos`). Só apaga arquivo que tem o cabeçalho de gerado e está em `app/Generated/`; qualquer outro arquivo nunca é apagado;
- **lista como órfãos**, sem apagar, as classes finais (`app/Models/Note.php`...) e a migration de criação da tabela (o crudmaker nunca apaga migration: crie à mão uma que remova a tabela, se for o caso);
- deixa de citar o controller dela em `routes/crudmaker.php`. As finais órfãs ficam sem uso (e sem a base não carregam): apague-as à mão quando quiser.

Os órfãos são listados só na execução que remove a entidade, porque é nela que o lock deixa de citá-la. Rode com `--dry-run` antes para ver os `removidos` e os `Órfãos`. Sem `manifest-lock.json` no destino, nada é removido; se ele estiver ilegível, a CLI avisa e também não remove nada.

### Migrar um projeto gerado pela versão antiga

Antes dos hooks, o crudmaker escrevia `app/Models/Client.php`, `ClientController.php` etc. completos, sempre sobrescritos. Num destino assim, o primeiro `generate` novo:

1. cria as bases em `app/Generated/` (que ficam sem uso);
2. **preserva** os arquivos antigos (agora são da camada de customização, `create-once`), que continuam funcionando como antes: as rotas apontam para as mesmas classes;
3. avisa, na seção `Avisos`, um por arquivo que não estende a base: `app/Models/Client.php: não estende a base gerada BaseClient; ... Migre: ...`. O aviso se repete a cada `generate` até a migração.

Para migrar cada arquivo avisado:

1. Confira no `git` do projeto Laravel que não há nada sem commit e mova o arquivo antigo para fora de `app/` (por exemplo, `mv app/Models/Client.php /tmp/Client.php.antigo`).
2. Rode `crudmaker generate ... --out <projeto>` de novo: a classe final nova é criada vazia, estendendo a base.
3. Copie para a classe nova só o que foi escrito à mão: métodos, scopes, relacionamentos extras, regras de negócio dentro de `store`/`update` (que agora viram os hooks `beforeStore`, `afterStore`...). O que era gerado (traits, `$fillable`, `$casts`, relacionamentos do manifest, regras de validação, campos da resource) já está na base: não copie.
4. Rode os testes da aplicação. O aviso some quando a final estende a base.

Migre as cinco classes da entidade (model, controller, request, resource, collection): misturar finais novas e antigas funciona, mas as antigas continuam sem receber as atualizações do gerador. O aviso é uma checagem de texto: procura `extends ...Base<Classe>` no arquivo.

## Comportamento da API gerada

| Action | Rota | Resposta |
|---|---|---|
| `index` | `GET /api/clients` | 200, paginado (15 por página, ou o `api.perPage`) |
| `store` | `POST /api/clients` | 201, registro criado |
| `show` | `GET /api/clients/{client}` | 200 |
| `update` | `PUT /api/clients/{client}` | 200, registro atualizado |
| `destroy` | `DELETE /api/clients/{client}` | 204, sem corpo (`response()->noContent()`) |

Formato das respostas com corpo:

- `store`, `show` e `update`: `{ "status": 201|200, "message": ..., "data": { ... } }`. O `message` só existe nas escritas (`store` e `update`).
- `index`: formato nativo de paginação do Laravel, `{ "data": [ ... ], "links": { ... }, "meta": { ... } }`. Não leva `status` nem `message`: o envelope `data` é o mesmo das demais respostas, e `links`/`meta` (página atual, total, URLs) são acrescentados pelo Laravel. A página vem de `?page=N`; o tamanho é 15, ou o `api.perPage` do manifest. Com as opções `api.filters`, `api.search` e `api.sort`, o `index` aceita também `?status=active`, `?search=ana` e `?sort=-name`, por exemplo `GET /api/clients?status=active&search=ana&sort=-name&page=2` (veja [Opções da API](manifest.md#opções-da-api-api)). Com `api.with`, `index` e `show` carregam os relacionamentos e a resource os devolve aninhados, pelo nome do método (`"address": { ... }`, `"alerts": [ ... ]`).
- `destroy`: corpo vazio.

Os controllers não têm try/catch: erros chegam ao handler do Laravel e saem com o status certo. Registro inexistente na rota dá 404, validação falha com 422 (`{ "message": ..., "errors": { ... } }`), autorização negada dá 403, e só exceções não tratadas viram 500. Os registros usam soft delete, e a resource devolve `created_at`/`updated_at` como `{ timestamp, description }`.

## Problemas conhecidos

Os bugs do código gerado e as limitações do manifest estão listados em [manifest.md](manifest.md#limitações-conhecidas) e na spec da v2. Os principais:

- a model usa `HasFactory`, mas nenhuma factory é gerada;
