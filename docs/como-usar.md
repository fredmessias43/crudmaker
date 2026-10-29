# Como usar

Este guia descreve o fluxo atual do crudmaker, pela CLI `crudmaker`. O manifest pode ser YAML ou JSON. As demais melhorias estão planejadas em [specs/crudmaker-v2.md](specs/crudmaker-v2.md).

## Pré-requisitos

- Node.js e npm.
- Para criar um projeto do zero com `crudmaker new`: só o **Docker** (instalado e com o daemon rodando; o seu usuário precisa poder usá-lo, grupo `docker`). Não é preciso PHP nem composer na máquina. Veja [Criar um projeto do zero](#criar-um-projeto-do-zero-crudmaker-new).
- Para gerar num projeto que já existe: um projeto Laravel 10, 11 ou 12 (PHP 8.1 ou superior) com a API instalada (no 11 e no 12, `php artisan install:api`). Veja [Versão do Laravel e do PHP](#versão-do-laravel-e-do-php).

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

## Criar um projeto do zero: `crudmaker new`

```bash
crudmaker new minha-api manifest.yaml                      # Laravel 12, PHP 8.2, Sail com MySQL
crudmaker new minha-api manifest.yaml --laravel 11 --php 8.3 --db pgsql
crudmaker new minha-api manifest.yaml --db sqlite          # Sail só com a aplicação; o banco é o sqlite do Laravel 11+
crudmaker new minha-api manifest.yaml --no-sail            # sem Sail
crudmaker new minha-api manifest.yaml --skip-generate      # cria o projeto, sem gerar a API
```

Cria o projeto Laravel em `minha-api/` e gera nele a API do manifest. Tudo roda em containers efêmeros (`docker run --rm`): você não precisa de PHP nem de composer na máquina. A saída do composer e do artisan aparece em tempo real.

| Flag | Efeito |
|---|---|
| `--laravel <10\|11\|12>` | major do Laravel (padrão: `pkg.target.laravel` do manifest, senão 12) |
| `--php <x.y>` | PHP da imagem: 8.1, 8.2, 8.3 ou 8.4 (padrão: `pkg.target.php`, senão 8.2). Mínimo do Laravel 10: 8.1; do 11 e do 12: 8.2 |
| `--db <banco>` | banco configurado no Sail: `mysql` (padrão), `pgsql`, `mariadb` ou `sqlite`. Não combina com `--no-sail` |
| `--no-sail` | não instala o Sail |
| `--skip-generate` | não roda o `generate` no fim (depois: `crudmaker generate manifest.yaml --out minha-api`) |
| `--seeders` | o `generate` do fim também gera os seeders (veja [Factories e seeders](#factories-e-seeders)) |

A versão segue a mesma prioridade do `generate` (flag, `pkg.target` do manifest, padrão), menos a detecção pelo composer, porque o destino ainda não existe. O resumo mostra a versão usada e de onde veio.

### Antes de tocar em qualquer coisa

O comando confere, nesta ordem, e para no primeiro problema sem criar nada: argumentos e flags; o manifest (lido e **validado**, como no `generate`, para não criar um projeto e só depois falhar); a versão (PHP compatível com o Laravel e com imagem disponível); o diretório (se existe e tem qualquer arquivo, inclusive oculto, é recusado; vazio ou inexistente passa); e o Docker (`docker info`: sem o Docker instalado ou com o daemon parado, a mensagem diz o que fazer).

### O que acontece em cada passo

Cada passo é um `docker run --rm --user UID:GID -v <dir>:/var/www/html -w /var/www/html -v <cache>:/composer -e COMPOSER_HOME=/composer laravelsail/phpXX-composer:latest <comando>`, com `XX` = PHP sem o ponto (`php82`, `php83`...). Os arquivos criados pertencem ao seu usuário.

1. `composer create-project laravel/laravel:^<N>.0 .`
2. Laravel 11 e 12: `php artisan install:api --no-interaction --without-migration-prompt` (cria `routes/api.php`, registra-o em `bootstrap/app.php` e instala o Sanctum; não roda as migrations). No Laravel 10 não há o que fazer: o `routes/api.php` já vem no esqueleto.
3. `composer require --dev pestphp/pest pestphp/pest-plugin-laravel --with-all-dependencies` (o composer escolhe o Pest compatível com o PHP: com o PHP 8.2 sai o Pest 3). Prepara o terreno para os testes gerados.
4. `php vendor/bin/pest --init --no-interaction` (cria `tests/Pest.php` e `tests/TestCase.php`; o plugin do Laravel não tem um `artisan pest:install`).
5. Sem `--no-sail`: `php artisan sail:install --with=<banco> --php=<PHP> --no-interaction` (o `laravel/sail` já vem no esqueleto; com `--db sqlite` usa `--with=none`, porque sqlite não é um serviço do Sail). Cria o `compose.yaml` e ajusta o `.env` para o serviço.
6. Sem `--skip-generate`: o mesmo fluxo do `crudmaker generate` (versão detectada no `composer.lock` do projeto novo), no próprio processo.

O `COMPOSER_HOME` é uma pasta do host, `~/.cache/crudmaker/composer` (ou `$XDG_CACHE_HOME/crudmaker/composer`), montada em `/composer`: o composer precisa de um diretório gravável para o usuário sem nome que o `--user` cria, e o cache de pacotes fica entre execuções (a segunda criação de projeto é bem mais rápida). Apagar essa pasta é seguro.

### Se um passo falhar

O comando para, diz qual passo falhou (`O passo 3/5 falhou (composer require ...)`) e imprime o `docker run` equivalente para você repetir à mão. **O diretório parcial é mantido**, nunca apagado: pode ter coisa útil, e apagar automaticamente é o tipo de ação difícil de desfazer. Para recomeçar, apague o diretório e rode o `crudmaker new` de novo; para continuar, rode o passo que falhou e os seguintes à mão e depois `crudmaker generate manifest.yaml --out minha-api`.

### Próximos passos (o resumo final repete)

Com o Sail:

```bash
cd minha-api
./vendor/bin/sail up -d            # sobe a aplicação e o banco (a primeira vez constrói a imagem do Sail: leva alguns minutos)
./vendor/bin/sail artisan migrate
# a API responde em http://localhost/api  (rotas: ./vendor/bin/sail artisan route:list)
./vendor/bin/sail down             # para tudo (sail down -v também apaga o volume do banco)
```

Se as portas 80 ou 3306 já estão em uso, defina antes `APP_PORT=8080 FORWARD_DB_PORT=3307` (variáveis do Sail).

Com `--no-sail` (ou `--skip-generate` sem Sail), sem PHP local, pelo Docker:

```bash
cd minha-api
alias artisan='docker run --rm --user $(id -u):$(id -g) -v "$PWD":/var/www/html -w /var/www/html laravelsail/php82-composer:latest php artisan'
artisan migrate        # usa o banco do .env: no Laravel 11+ é sqlite; no 10 é MySQL em 127.0.0.1, que você precisa configurar
docker run --rm --user $(id -u):$(id -g) -v "$PWD":/var/www/html -w /var/www/html -p 8000:8000 laravelsail/php82-composer:latest php artisan serve --host=0.0.0.0
```

### Solução de problemas

- **"Docker não encontrado" / "o daemon não respondeu"**: instale o Docker ou inicie o serviço (`sudo systemctl start docker`); se for permissão, coloque o usuário no grupo `docker` e abra um novo terminal.
- **"não está vazio"**: escolha outro diretório. Para gerar num projeto que já existe, use `crudmaker generate`.
- **"Não existe a imagem laravelsail/phpXX-composer"**: só há imagens para o PHP 8.1 a 8.4; use `--php` (ou `pkg.target.php`) com um desses.
- **Falha no `composer require` do Pest**: geralmente rede ou conflito de versões; repita o `docker run` impresso na mensagem para ver o erro completo.
- **Entidade chamada `user` no manifest**: é tratada de forma especial, sem estragar o esqueleto do Laravel. Veja [A entidade `user`](#a-entidade-user).
- **`php artisan migrate` falha com "table already exists" ou "duplicate column"**: a migration de criação da tabela não é do crudmaker e a tabela já tem colunas do manifest. Veja [Tabelas que já existem](#tabelas-que-já-existem-migrations-que-não-são-do-crudmaker).
- **Aviso "A tabela X já existe ... as colunas dela são desconhecidas"**: o crudmaker não gerou migration para ela. Crie à mão a `alter` do que faltar, ou faça o crudmaker assumir a tabela (veja a seção acima).
- **`sail up` falha por porta ocupada**: veja `APP_PORT`/`FORWARD_DB_PORT` acima.

## 2. Ter o projeto Laravel de destino

Se você criou o projeto com `crudmaker new`, pule para o passo 3.

```bash
composer create-project laravel/laravel minha-api
cd minha-api && php artisan install:api
```

O destino é a raiz desse projeto. Os arquivos gerados caem direto em `app/` e `database/migrations/`.

## Versão do Laravel e do PHP

O código gerado segue a versão do projeto de destino. **Suportados: Laravel 10, 11 e 12; PHP 8.1 ou superior** (mínimo de cada Laravel: 10 → PHP 8.1; 11 e 12 → PHP 8.2). Outra versão dá erro, e nada é escrito.

Cada parte (Laravel e PHP) é resolvida **de forma independente**, na primeira fonte que existir:

| Prioridade | Fonte | Como informar |
|---|---|---|
| 1 | flag | `--laravel 11` e/ou `--php 8.2` |
| 2 | manifest | `pkg.target.laravel` e/ou `pkg.target.php` (veja [manifest.md](manifest.md#versão-alvo-target)) |
| 3 | `composer.lock` / `composer.json` do destino (`--out`) | automático |
| 4 | padrão | Laravel 12, PHP 8.2 |

Detecção no destino:

- **Laravel**: a versão instalada de `laravel/framework` no `composer.lock` (`v11.38.1` → 11); sem lock, a restrição `require.laravel/framework` do `composer.json` (`^11.0` → 11). Com mais de uma alternativa (`^10.0 || ^11.0`), vale a menor.
- **PHP**: `config.platform.php` do `composer.json`, depois `platform-overrides.php` do `composer.lock` (versões fixadas), depois a restrição `require.php` do `composer.json` (`^8.2` → 8.2; com alternativas, a menor) e, por fim, `platform.php` do `composer.lock`.
- Arquivo ilegível ou restrição que não dá para interpretar (`dev-master`) gera um aviso e é ignorado.

Quando a versão vem de flag ou manifest e **diverge da detectada**, vale a explícita e o resumo traz um aviso. Para o PHP, uma restrição (`^8.2`) só dá o mínimo: um PHP explícito igual ou maior não avisa.

O resumo mostra a versão usada e a origem de cada parte (`flag`, `manifest`, `composer.lock`, `composer.json` ou `padrão`), e o `manifest-lock.json` registra o `target`. Se a versão mudar entre duas gerações, aparece um aviso lembrando que a camada gerada foi regravada (classes finais, migrations já emitidas e stubs são seus e não mudam).

Exemplos (saídas reais, trechos):

```text
$ crudmaker generate manifest.yaml --out ../minha-api --dry-run      # projeto com composer.lock do Laravel 11
Simulação (nada foi escrito) em /home/eu/minha-api
Versão alvo: Laravel 11 (composer.lock), PHP 8.2 (composer.json)

$ crudmaker generate manifest.yaml --out ../minha-api --laravel 10 --php 8.1
Versão alvo: Laravel 10 (flag), PHP 8.1 (flag)
...
Avisos (2):
  Laravel 10 (flag) diverge do instalado no destino: Laravel 11 (composer.lock). Vale o explícito; confira se é isso mesmo.
  PHP 8.1 (flag) diverge do mínimo declarado no destino: PHP 8.2 (composer.json). Vale o explícito; confira se é isso mesmo.

$ crudmaker generate manifest.yaml --laravel 9
Erro: Laravel 9 (flag) não é suportado. O crudmaker gera código para o Laravel 10, 11, 12.

$ crudmaker generate manifest.yaml --laravel 12 --php 8.1
Erro: PHP 8.1 (flag) é anterior ao mínimo do Laravel 12 (PHP 8.2). Informe um PHP 8.2 ou superior, ou escolha um Laravel mais antigo.
```

O que muda na saída por versão (as [capacidades](arquitetura.md#versão-alvo-e-capacidades)):

| Capacidade | Laravel 10 | Laravel 11 e 12 |
|---|---|---|
| Casts da model base | propriedade `protected $casts = [...]` | método `protected function casts(): array` |
| `routes/api.php` | já existe no esqueleto; o `RouteServiceProvider` o carrega | criado e registrado em `bootstrap/app.php` por `php artisan install:api` |
| `->change()` nas migrations `alter` | comentário lembrando o `doctrine/dbal` | nativo; sem comentário |

O resto da saída é igual nas três versões. O padrão é o Laravel 12, então `--laravel` só é necessário para gerar para um projeto que ainda não existe (ou que não tem `composer.json` em `--out`) em outra versão.

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
| Factory | `app/Generated/Factories/BaseClientFactory.php` | `database/factories/ClientFactory.php` |
| Controller aninhado (um por `hasMany`/`hasOne`) | `app/Generated/Http/Controllers/Api/Relationships/BaseClientAlertController.php` | `app/Http/Controllers/Api/Relationships/ClientAlertController.php` |

Cada campo `enum` ainda gera um PHP enum em `app/Generated/Enums/<Entidade><Campo>.php` (`ClientStatus.php`): arquivo único `overwrite`, sem classe final, usado no cast da model e na regra da request (veja [Enums](manifest.md#enums)).

| Arquivo | Pasta | Política |
|---|---|---|
| `<data>_create_<tabela>_table.php` | `database/migrations/` | `overwrite` na primeira geração; depois de emitida (a tabela consta no lock) vira `create-once`. Arquivo único, sem base nem final |
| `<data>_alter_<tabela>_table.php` | `database/migrations/` | `create-once`; gerada quando o schema de uma tabela já emitida muda (veja [Regerar](#regerar)) |

Além disso, são gravados na raiz do destino:

| Arquivo | O que é |
|---|---|
| `manifest-lock.json` | o manifest já normalizado, para conferir o que o gerador entendeu |
| `routes/crudmaker.php` | uma `Route::apiResource` por entidade e as [rotas aninhadas](#rotas-aninhadas-hasmany-e-hasone) (veja abaixo) |
| `routes/api.php` | só ganha o include de `routes/crudmaker.php`, uma única vez; o resto fica intacto |
| `database/seeders/*` | só com `--seeders` (veja [Factories e seeders](#factories-e-seeders)) |

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

#### Rotas aninhadas (`hasMany` e `hasOne`)

Depois das `apiResource`, o arquivo ganha rotas aninhadas para cada `hasMany`/`hasOne` cujo filho declara o `belongsTo` de volta (a FK é conhecida, inclusive FK customizada). Com `client` `hasMany` `alert` (e `hasOne` `address`):

```php
Route::get('clients/{client}/alerts', [ClientAlertController::class, 'nestedIndex'])->name('clients.alerts.index');
Route::post('clients/{client}/alerts', [ClientAlertController::class, 'nestedStore'])->name('clients.alerts.store');
Route::get('clients/{client}/address', [ClientAddressController::class, 'nestedShow'])->name('clients.address.show');
Route::post('clients/{client}/address', [ClientAddressController::class, 'nestedStore'])->name('clients.address.store');
```

| Relacionamento | Rotas | Resposta |
|---|---|---|
| `hasMany` | `GET /api/clients/{client}/alerts` | lista paginada dos alertas do cliente, com os **mesmos** filtros, busca, ordenação, `with` e `perPage` do `index` de `alert` |
| `hasMany` | `POST /api/clients/{client}/alerts` | cria o alerta com `client_id` do cliente da URL: 201 como o `store` de `alert` |
| `hasOne` | `GET /api/clients/{client}/address` | mostra o endereço do cliente (404 se não houver) |
| `hasOne` | `POST /api/clients/{client}/address` | cria o endereço do cliente; **409** se o cliente já tem um (veja abaixo) |

- **Só `index`/`store` (hasMany) e `show`/`store` (hasOne) são aninhados.** Mostrar, atualizar e remover um registro continuam nas rotas raiz (`GET|PUT|DELETE /api/alerts/{alert}`): o id do filho já o identifica.
- **A FK vem sempre da URL.** A request do filho (`AlertRequest`) mescla o `client_id` do cliente da rota antes de validar, então o corpo não precisa dele e um `client_id` mandado no corpo é ignorado (o valor da URL vence; os hooks também não conseguem trocá-lo). O cliente inexistente responde 404 pelo route model binding. Nas rotas raiz nada muda: `POST /api/alerts` continua exigindo `client_id`.
- **O parâmetro do pai** se chama como a entidade em snake_case (`{client}`, `{class_lesson}`), o que casa com o route model binding. Na auto-referência (entidade que tem `hasMany` de si mesma) o parâmetro é `{parent_<entidade>}`, para a request não confundir o pai da URL com o registro da própria rota.
- **URL do filho.** `hasMany`: plural em kebab-case (`/alerts`, `/order-items`); `hasOne`: singular (`/address`). Com **FK customizada** a URL e o nome do controller seguem o nome do método da model (`user hasMany orderItem` com `field: author_id` → `/users/{user}/order-items-by-author`, `UserOrderItemsByAuthorController`), o que evita colisão com outro relacionamento do mesmo par. As rotas são nomeadas `<pai plural>.<segmento>.<action>` (`clients.alerts.index`, `clients.address.show`, `users.order-items-by-author.store`).
- **Actions e middleware são os do filho.** O `GET` só existe se o filho mantém `index` (`hasMany`) ou `show` (`hasOne`), e o `POST` só se mantém `store` (`api.actions` do filho); sem nenhuma das duas o relacionamento não gera nada. O `api.middleware` do **filho** vai nas rotas aninhadas (elas expõem o recurso dele); o middleware e as actions do pai não entram.
- **`hasOne` e o `POST`.** O `POST` existe, mas recusa com 409 `{ "status": 409, "message": "... already exists ..." }` se o pai já tem um registro (`$client->address()->exists()`). A checagem não é atômica; para garantir de fato no banco, declare a FK com `unique: true` no filho.
- **Quando não gera.** Se o filho não declara o `belongsTo` de volta com a mesma FK, o relacionamento é ignorado em silêncio (a coluna não existe); `curso.class_lesson_comment hasMany class_lesson_comment` sem o `belongsTo` correspondente é um exemplo. Uma auto-referência que funciona declara os dois lados com a mesma FK: `belongsTo: [{ entity: comment, field: parent_id, required: false }]` e `hasMany: [{ entity: comment, field: parent_id }]`.
- **Desligar.** No bloco `api` do pai: `nested: false` (nenhuma rota aninhada dele), `nested: [alerts]` (só os relacionamentos listados, pelo nome do método da model: `alerts`, `address`, `postsByAuthor`) ou, em `pkg.defaults.api`, `nested: false` para o projeto inteiro (a entidade pode religar com `nested: true`). Uma lista com nome que não é `hasOne`/`hasMany` da entidade, ou sem o `belongsTo` de volta, é erro de validação. Veja [Opções da API](manifest.md#opções-da-api-api).
- **Entidade `user` do esqueleto.** Funciona como qualquer pai: `/users/{user}/posts` usa o id bigint do usuário (FK `unsignedBigInteger`, regra `integer`).

**Requisito:** o projeto precisa do `routes/api.php`. No Laravel 11 e 12 ele é criado por `php artisan install:api`, que também o registra em `bootstrap/app.php`; no Laravel 10 ele já vem no esqueleto e é carregado pelo `RouteServiceProvider`. Se o arquivo não existir, o `generate` não o cria (no 11+ criar o arquivo sozinho não o faria ser carregado), grava `routes/crudmaker.php` e imprime um aviso conforme a versão: no 11+, para rodar `install:api`; no 10, para conferir o `--out` ou restaurar o arquivo. Depois gere de novo. O `--dry-run` mostra o `routes/api.php` como sobrescrito quando o include vai ser acrescentado.

## 5. Terminar à mão

O gerador não roda o `migrate`. Rode `php artisan migrate`: as migrations já saem ordenadas por dependência de FK (a tabela referenciada vem antes), com timestamps consecutivos (`now` + 1 segundo por migration), então não há ordem para acertar à mão.

## Duas camadas: onde escrever código

Para model, controller, request, resource, collection e factory, cada classe existe em duas camadas:

- **Base gerada**, em `app/Generated/...` (namespace `App\Generated\...`, nome `Base<Classe>`). É sobrescrita a cada `generate`, é `abstract` e tem no topo o aviso `ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE`.
- **Classe final**, no namespace normal (`App\Models\Client`), que **estende a base**. É criada **uma única vez** (política `create-once`), nasce vazia, só com um comentário listando o que dá para sobrescrever, e nunca mais é tocada pelo crudmaker: nenhuma opção da CLI a sobrescreve (`--dry-run`, `--normalize-names`, mudança de manifest...). Se você apagar o arquivo, o próximo `generate` o recria vazio.

As rotas (`routes/crudmaker.php`) e as referências entre classes usam **sempre as classes finais**: o controller base recebe `ClientRequest` e `Client` (as finais) e devolve `ClientResource`/`ClientCollection` (as finais), e os relacionamentos da model base apontam para as models finais das outras entidades. Assim uma customização vale em todo lugar, inclusive no route model binding e na validação.

Ordem de preferência para customizar: (1) o manifest, para o que é declarativo; (2) os hooks e as sobrescritas nas classes finais, para regra de negócio; (3) os [stubs](#stubs-mudar-o-padrão-de-um-tipo-de-arquivo), para mudar o padrão de um tipo de arquivo inteiro.

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

### Controllers aninhados e seus hooks

Cada relacionamento aninhado gera um par base × final em `Relationships/`, com o nome `<Pai><Filho>Controller`: `App\Generated\Http\Controllers\Api\Relationships\BaseClientAlertController` (sobrescrita) e `App\Http\Controllers\Api\Relationships\ClientAlertController` (`create-once`, a que as rotas usam). As actions se chamam `nestedIndex`, `nestedShow` e `nestedStore` (para não colidir com as herdadas).

A base **estende o controller final do filho** (`AlertController`), então os hooks dele (`indexQuery`, `beforeStore`, `afterStore`) valem também na rota aninhada: um escopo por usuário no `indexQuery` do filho não pode ser contornado pela URL do pai. Além deles, o controller aninhado tem hooks próprios, com o pai (a model final, no parâmetro) somado à assinatura:

| Hook | Quando roda | Entrada → saída |
|---|---|---|
| `nestedIndexQuery(Builder $query, Request $request, Client $client): Builder` | no `nestedIndex` (`hasMany`), depois do `indexQuery` do filho, antes de paginar | query (já filtrada pelo pai) → query |
| `nestedShowQuery(Builder $query, Request $request, Client $client): Builder` | no `nestedShow` (`hasOne`), antes de buscar | query → query |
| `nestedBeforeStore(array $data, Request $request, Client $client): array` | no `nestedStore`, depois do `beforeStore` do filho | dados validados → dados a gravar |
| `nestedAfterStore(Alert $model, Request $request, Client $client): void` | depois do `afterStore` do filho | registro gravado |

Ordem do `nestedStore` (na mesma `DB::transaction`): `beforeStore` do filho, `nestedBeforeStore`, gravação da FK do pai (por último, não dá para trocá-la), `create`, `afterStore` do filho, `nestedAfterStore`. Exemplo:

```php
class ClientAlertController extends BaseClientAlertController
{
	// Só os alertas não resolvidos do cliente.
	protected function nestedIndexQuery(Builder $query, Request $request, Client $client): Builder
	{
		return $query->where('resolved', false);
	}

	// Cliente bloqueado não recebe alertas novos.
	protected function nestedBeforeStore(array $data, Request $request, Client $client): array
	{
		abort_if($client->status === 'blocked', 403, 'Cliente bloqueado.');

		return $data;
	}
}
```

A base é substituível por stub (`nested-controller.base`, veja [Stubs](#stubs-mudar-o-padrão-de-um-tipo-de-arquivo)); a final não.

### Request, resource, collection e model

- **Request** (`ClientRequest`): o `rules()` da base junta as regras geradas com o retorno de `protected function extraRules(): array`; a mesma chave de campo troca a regra gerada, uma chave nova acrescenta. O `authorize()` pode ser sobrescrito (`public function authorize(): bool`); a base libera tudo. Exemplo: `protected function extraRules(): array { return ['email' => ['bail', 'required', 'email']]; }`.
- **Resource** (`ClientResource`): o `toArray()` da base junta os campos gerados com o retorno de `protected function extra(Request $request): array` (campos calculados; chave repetida substitui a gerada). Exemplo: `return ['display_name' => strtoupper($this->name)];`.
- **Collection** (`ClientCollection`): não tem hook. Cada item da lista sai pela `ClientResource` final, então o `extra()` da resource vale na listagem também. Ajustes só da coleção (`with()`, `paginationInformation()`) vão direto na classe final.
- **Model** (`Client`): não tem hook; use os recursos do Eloquent na classe final: scopes (inclusive globais), accessors, `$hidden`/`$appends`, relacionamentos extras e eventos em `booted()`. Redeclarar `$casts` ou `$fillable` na final **substitui** os gerados; para somar, use `$this->mergeCasts([...])` e `$this->mergeFillable([...])` num `__construct(array $attributes = [])` que chame `parent::__construct($attributes)`.

## Factories e seeders

Toda entidade ganha uma **factory** (sempre, sem flag). O `HasFactory` da model base já a encontra: `Client::factory()` resolve `Database\Factories\ClientFactory`, a classe final, que estende `App\Generated\Factories\BaseClientFactory`. A base fica em `app/Generated/` (como as outras bases) e traz a `definition()` gerada; a final nasce vazia e é sua (`create-once`), é onde vão os **estados**:

```php
// database/factories/ClientFactory.php
class ClientFactory extends BaseClientFactory
{
    public function blocked(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'blocked']);
    }
}

Client::factory()->count(3)->blocked()->create();
```

Para trocar um valor padrão, sobrescreva a `definition()` partindo da base: `return array_merge(parent::definition(), ['name' => 'Fixo']);`.

### Valores gerados

O `id` não entra (o `HasUuids` gera o uuid; no `users` do esqueleto o id é do banco). Os demais campos:

| Campo | Valor |
|---|---|
| `string` | `fake()->words(3, true)`, ou pelo nome (tabela abaixo) |
| `text` | `fake()->paragraph()` |
| `integer` | `fake()->numberBetween(1, 1000)` |
| `double` | `fake()->randomFloat(2, 0, 1000)` |
| `boolean` | `fake()->boolean()` |
| `date` / `datetime` | `fake()->date()` / `fake()->dateTime()` |
| `json` | `[]` |
| `uuid` (fora o `id`) | `fake()->uuid()` |
| `enum` | `fake()->randomElement(ClientStatus::cases())`, usando o PHP enum gerado |
| FK de `belongsTo` | `Pai::factory()`: o pai é criado junto, em cadeia (`Post::factory()->create()` cria o autor) |

Regras:

- **`default` declarado** no manifest vale para qualquer tipo, enum incluso (o enum sem `default` sorteia, apesar de a migration usar o primeiro item). Quer variar um campo com `default`? Use um estado ou `->state([...])`.
- **`unique: true`** usa `fake()->unique()` (em `string`, `text`, `integer`, `double`, `date`, `datetime` e `uuid`; em `boolean` e `enum` o conjunto de valores é pequeno demais e o `unique()` do Faker esgotaria).
- **FK opcional** (`required: false`) também cria o pai; para um filho sem pai, use `Post::factory()->state(['author_id' => null])`. **Auto-referência** (`parent_id` apontando para a própria tabela) fica `null`, senão a factory se chamaria para sempre.
- Campo opcional (`required: false`) recebe valor como os demais.

Heurísticas por nome, só em campos `string` (nome exato, minúsculas):

| Nome | Faker |
|---|---|
| `email`, `*_email` | `safeEmail()` |
| `name`, `full_name` | `name()` |
| `first_name`, `last_name`, `username` | `firstName()`, `lastName()`, `userName()` |
| `phone`, `telephone`, `mobile`, `cellphone`, `*_phone` | `phoneNumber()` |
| `url`, `website`, `*_url` | `url()` |
| `city`, `state`, `country` | `city()`, `state()`, `country()` |
| `zip`, `zip_code`, `postal_code` | `postcode()` |
| `address`, `street` | `streetAddress()` |
| `slug`, `color`, `company`, `currency` | `slug()`, `hexColor()`, `company()`, `currencyCode()` |
| `title`, `description` | `sentence(3)`, `sentence()` |
| `password` | `static::$password ??= Hash::make('password')` |

Qualquer outro nome cai em `words(3, true)`. Os campos `text` não usam a tabela.

### Seeders (`--seeders`)

```bash
crudmaker generate manifest.yaml --out ../minha-api --seeders   # também vale para `crudmaker new`
```

Sem a flag, nenhum seeder é gerado. Com ela:

- `database/seeders/<Entidade>Seeder.php`: **`create-once`** (é seu: mude a quantidade, chame estados da factory, escreva registros fixos). Cria 10 registros com `Client::factory()->count(10)`; em entidade com `belongsTo`, cada registro reaproveita um pai já semeado (`Author::query()->inRandomOrder()->value('id') ?? Author::factory()`), e cria um pela factory se não há nenhum;
- `database/seeders/CrudmakerSeeder.php`: **`overwrite`** (gerado), chama todos os seeders na ordem de dependência das FKs (o pai antes do filho). Entidades novas entram nele a cada `generate --seeders`.

O crudmaker **não edita o `DatabaseSeeder`** (ele é do projeto e muda entre versões do Laravel). Chame o `CrudmakerSeeder` você mesmo, uma vez, em `database/seeders/DatabaseSeeder.php`:

```php
public function run(): void
{
    $this->call(\Database\Seeders\CrudmakerSeeder::class);
}
```

ou rode `php artisan db:seed --class=CrudmakerSeeder`. Enquanto o `DatabaseSeeder` não citar o `CrudmakerSeeder`, o `generate --seeders` imprime um aviso com essa instrução. A flag não fica registrada no lock: sem ela numa regeração, os seeders existentes ficam onde estão, sem atualizar o `CrudmakerSeeder`.

## Stubs: mudar o padrão de um tipo de arquivo

Cada arquivo gerado vem de um template (`templates/laravel-api/*.php.eta`, parecido com o PHP final). Um **stub** é uma cópia de um desses templates dentro do seu projeto, que tem prioridade sobre o embutido. Serve para mudar o padrão de **todos** os arquivos de um tipo de uma vez (ex.: o envelope de resposta de todos os controllers).

### Manifest × hooks × stubs

Use a camada mais simples que resolve, nesta ordem:

1. **Manifest**: o que é declarativo e comum (actions, middleware, filtros, `hidden`, regras...).
2. **Hooks** nas classes finais: regra de negócio de uma entidade (`beforeStore`, `extraRules()`, `extra()`...).
3. **Stubs**: o formato de um tipo de arquivo para todas as entidades (envelope `data`/`message`, transação, estilo do código gerado).

Stubs só mudam a **camada gerada** (bases, migration e rotas). Também não existe stub da migration de alteração (`migration.alter`): só a de criação (`migration`) é substituível. Não existe stub das classes finais: elas são `create-once` e são do usuário, então mudar o comportamento delas é papel dos hooks (um stub só valeria para classes novas e deixaria o projeto com finais de padrões diferentes). Um `controller.final.php.eta` na pasta de stubs é ignorado, com aviso.

### Publicar, editar e atualizar

```bash
crudmaker stubs:publish --out <projeto>               # todos os stubs
crudmaker stubs:publish controller --out <projeto>    # só o do controller
```

Copia os templates embutidos para `stubs/crudmaker/laravel-api/` do projeto (`--out` é a raiz do projeto, padrão: diretório atual) e lista o que copiou. Publique **só os que vai mudar**: o que não estiver na pasta continua vindo do embutido e recebe as melhorias das novas versões do crudmaker.

- **Nomes**: `model`, `resource`, `collection`, `controller`, `request`, `factory` e `nested-controller` são a **base** (`controller` = `controller.base`; o sufixo `.base` também é aceito), mais `migration` e `routes`. Não há `*.final`.
- **Não sobrescreve**: se o stub já existe, o comando avisa e pula (suas edições ficam). `--force` sobrescreve, mas só stubs (nada fora da pasta de stubs é tocado) e perde suas edições neles.
- **Editar**: mude o arquivo em `stubs/crudmaker/laravel-api/<nome>.php.eta` e rode `crudmaker generate` (o `--dry-run` mostra o efeito). Versione a pasta `stubs/` junto com o projeto.
- **Atualizar**: ao publicar, o hash do template embutido vai para `stubs/crudmaker/stubs-lock.json`. Se uma versão nova do crudmaker mudar o embutido, o `generate` mostra na seção `Avisos`: `stub controller.base: foi publicado a partir de uma versão anterior do template embutido...`. Para comparar, publique o embutido atual numa pasta temporária e use o `diff`:

  ```bash
  crudmaker stubs:publish controller --out /tmp/novo
  diff -u /tmp/novo/stubs/crudmaker/laravel-api/controller.base.php.eta stubs/crudmaker/laravel-api/controller.base.php.eta
  ```

  Incorpore o que interessar no seu stub e rode `crudmaker stubs:publish controller --refresh-lock`: ele não copia nada, só registra o hash atual do embutido para o stub, e o aviso some.
- **Erros**: um stub com erro de sintaxe (ou que referencia uma variável inexistente) para o `generate` antes de escrever qualquer arquivo, com `Erro: Stub "controller.base.php.eta": erro de sintaxe na linha 12: ...`. A linha vem de uma busca textual da linha de código que o JavaScript recusou; se não for achada, a mensagem sai sem linha.
- **Seus stubs não são checados contra o PHP**: confira a saída com `--dry-run` e rode `php -l`/os testes do projeto.

### Variáveis (`it`) de cada template

Os templates usam [Eta](https://eta.js.org): `<%~ it.x %>` imprime sem escape, e as tags de controle (`<% for (...) { -%>`) ficam sozinhas na linha. Mantenha os tabs e a linha final. Quem calcula as variáveis é o código TypeScript (`src/targets/laravel-api/viewModels/`); o template só imprime. Todos os templates recebem `capabilities` (flags de recurso da [versão alvo](#versão-do-laravel-e-do-php), veja a lista abaixo) e `target` (`{ laravel, php }`; só informativo, prefira as capacidades). Todos os templates de classe recebem também `entity` (nomes da entidade em cada casing), `namespace`, `imports` (os `use`, sem repetição), `className`, `extends`, e `base`/`final` (as duas classes do par, com `className`, `namespace`, `fqcn` e `path`).

| Stub | Variáveis específicas |
|---|---|
| `model.base` | `fillable`, `hidden`, `casts` (`name` e `cast`, este já como expressão PHP: `'boolean'` ou `ClientStatus::class`), `traits`, `relations` (métodos de relacionamento) |
| `request.base` | `fields`, `rules` (regras de validação por campo) |
| `resource.base` | `fields` (`key` e `enum`), `relations` (relacionamentos de `api.with`) |
| `enum` | `namespace`, `className`, `entity`, `field`, `cases` (`name` e `value`, este já como literal PHP); não tem as variáveis de classe (`imports`, `extends`...) |
| `factory.base` | `model`, `attributes` (`name` e `expression`, esta já como código PHP), `usesPassword` |
| `collection.base` | `resourceClass` |
| `controller.base` | `has` (quais actions existem), `hooks` (hooks mantidos), `index` (`with`, filtros, busca, ordenação, `perPage`), `withShow` |
| `migration` | `table`, `columns`, `foreignKeys`, `uniques`, `imports` |
| `nested-controller.base` | `kind` (`many`/`one`), `hasRead`, `hasStore`, `parent` (nomes do pai e `variable`, o parâmetro como variável PHP), `relation` (método da model), `foreignKey` (já como literal PHP), `childController`, `index` e `withShow` (os do filho) |
| `routes` | `imports`, `routes` (um item por entidade: `resource`, `controller`, `modifiers`), `nestedRoutes` (um item por rota aninhada: `method`, `uri`, `controller`, `action`, `name`, `modifiers`) |

Capacidades (`it.capabilities.<flag>`, booleanas): `castsMethod` (model com `casts()` em vez de `$casts`), `apiRoutesViaBootstrap`, `nativeColumnChange`, `backedEnums`, `readonlyClasses` e `typedClassConstants`. Exemplo num stub: `<% if (it.capabilities.castsMethod) { -%> ... <% } else { -%> ... <% } -%>`. Se você publicou o stub `model.base` antes do ticket 15, ele continua gerando `$casts` (válido em todas as versões); o aviso de hash indica que o embutido mudou.

A referência exata é o próprio template embutido (`crudmaker stubs:publish <tipo> --out <pasta>` e leia o arquivo) e o view model correspondente.

## Regerar

- **Camada gerada**: as bases em `app/Generated/`, `routes/crudmaker.php` e o `manifest-lock.json` são sobrescritos (veja o `--dry-run`). Não edite as bases: a edição se perde. Tabelas novas ganham a migration de criação com o timestamp novo, na ordem de dependência.
- **Camada de customização**: as classes finais existentes são **preservadas** sempre e só são criadas se faltarem. Hooks e código seu sobrevivem a qualquer regeração.
- **Migrations**: veja [Mudanças de schema](#mudanças-de-schema-migrations-de-alteração).
- O Laravel carrega `app/Generated/` pelo autoload PSR-4 padrão (`App\` → `app/`); não precisa configurar nada.

### Mudanças de schema: migrations de alteração

O `manifest-lock.json` guarda o schema e as migrations já emitidas. Com ele:

- **a migration de criação nunca é reescrita** depois de emitida: se a tabela está no lock e o arquivo existe em `database/migrations`, ele aparece como `preservados`. (Projeto gerado sem lock, por uma versão antiga: sem lock e sem o cabeçalho de gerado a migration de criação não é do crudmaker e não é tocada (veja [Tabelas que já existem](#tabelas-que-já-existem-migrations-que-não-são-do-crudmaker)); com o cabeçalho, ainda é reescrita, porque não há como saber o que o banco já rodou. Na primeira geração com a versão nova o lock passa a existir, e dali em diante vale a regra acima. Um lock antigo, sem `lockVersion`, vale como "o schema são as `entities` dele".)
- **o que mudou vira uma migration `alter`**, uma por tabela, `<data>_alter_<tabela>_table.php`, com data depois das migrations existentes (e depois das criações da mesma geração):

| Mudança no manifest | No `up()` |
|---|---|
| campo adicionado | `$table->tipo('campo')...` com `nullable`/`default`; `unique` vira `$table->unique('campo')` |
| `belongsTo` adicionado | coluna da FK + `$table->foreign(...)` |
| campo removido | `$table->dropColumn('campo')` (antes, `dropUnique` se era único) |
| `belongsTo` removido | `$table->dropForeign(['campo_id'])` e `dropColumn` |
| tipo, `required`, `default` ou itens do enum alterados | a coluna redeclarada com `->change()` |
| `unique` ligado ou desligado | `$table->unique('campo')` / `$table->dropUnique(['campo'])` |

O `down()` desfaz na ordem inversa, o melhor possível. `hidden`, `rules` e `api` não mudam o banco e não geram migration. **Regerar sem mudanças não cria migration nenhuma.** O `--dry-run` lista as `alter` que seriam criadas (em `criados`). Entidade nova ganha a migration de criação normal.

Cuidados:

- **Renomear um campo não é detectável**: vira remover + adicionar, e a coluna antiga perde os dados. O resumo traz um aviso `ATENÇÃO` quando uma tabela tem remoção e adição ao mesmo tempo. Edite a migration `alter` gerada (antes do `migrate`) trocando o par `dropColumn`/`addColumn` por `$table->renameColumn('antigo', 'novo');` no `up()` e a inversa no `down()`.
- **`->change()`**: nativo no Laravel 11+. No Laravel 10 precisa de `composer require doctrine/dbal` (para a versão alvo 10, a migration gerada traz um comentário lembrando; nas outras, não). `->change()` redeclara a coluna inteira; mudar a lista de um `enum` depende do banco (em alguns não atualiza os valores permitidos): o crudmaker avisa, confira a migration.
- **Campo novo obrigatório** (`required` padrão) sem `default` falha no `migrate` se a tabela já tem linhas: o crudmaker avisa. Declare `default` ou `required: false`.
- **`down()` não recupera dados**: desfazer um `dropColumn` recria a coluna vazia (e, se era obrigatória, falha em tabela com linhas).
- **Entidade removida**: continua só o aviso de órfãos; nenhum `drop table` é gerado.
- O arquivo de uma `alter` já emitida é seu: se editá-lo, ele não é reescrito. Se apagar uma migration de criação que está no lock, a próxima geração cria uma nova de criação com o schema atual (e avisa).
- O diff é calculado contra o lock, não contra o banco: se você rodou `generate` e depois descartou as migrations geradas, o lock já registrou a mudança e ela não será gerada de novo. Restaure o lock anterior (git) para refazê-la.

### Tabelas que já existem (migrations que não são do crudmaker)

O crudmaker só reescreve ou reaproveita uma migration de criação que **é dele**: uma que o `manifest-lock.json` registra em `migrations`, ou que carrega o cabeçalho `ARQUIVO GERADO PELO CRUDMAKER` (as migrations geradas por esta versão o têm, tanto as de criação quanto as `alter`). Qualquer outra migration `*_create_<tabela>_table.php` (do esqueleto do Laravel, escrita à mão, de um pacote) **nunca é reescrita**, e a tabela é tratada como já existente:

- **`users`**: o crudmaker conhece as colunas do esqueleto (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`; é o mesmo no Laravel 10, 11 e 12). As colunas do manifest que faltam saem numa migration `alter_users_table`; as do esqueleto nunca são redeclaradas, alteradas nem removidas (mesmo que saiam do manifest).
- **Qualquer outra tabela**: as colunas existentes são desconhecidas. **Nenhuma migration é gerada** e o resumo traz um aviso com as colunas do manifest, para você conferir e criar à mão a `alter` do que faltar. (Gerar uma `alter` com tudo falharia no `migrate` se a tabela já tem aquelas colunas.) A model gerada assume `id` uuid e soft delete (`deleted_at`). Depois do primeiro `generate`, mudanças de schema no manifest viram `alter` normalmente (o diff é contra o lock).
- Para o crudmaker **assumir** uma tabela que existe: apague a migration antiga (se o banco ainda não a rodou) ou acrescente o cabeçalho `// ARQUIVO GERADO PELO CRUDMAKER` logo depois do `<?php`. Sem lock, uma migration sem cabeçalho nunca é tocada.
- Projeto gerado por versão anterior, sem o cabeçalho nas migrations: se o lock as registra (`lockVersion: 2`), ou é um lock antigo (formato 1) que cita a tabela, elas continuam valendo como do crudmaker.

### A entidade `user`

Uma entidade `user` (tabela `users`) num projeto criado pelo esqueleto oficial (com `crudmaker new` ou `laravel new`) convive com o que o Laravel já trouxe:

- a migration `create_users_table` do esqueleto **não é tocada** (no Laravel 11+ ela também cria `password_reset_tokens` e `sessions`). Os campos extras do manifest saem em `alter_users_table`;
- **o `id` fica bigint auto-incremento do esqueleto**: o `id: uuid` do manifest é ignorado para `user` (o resumo avisa). Por isso:
  - a **model base** (`app/Generated/Models/BaseUser.php`) estende `Illuminate\Foundation\Auth\User as Authenticatable`, usa `HasFactory` e `Notifiable`, **sem** `HasUuids` e **sem** `SoftDeletes` (a tabela do esqueleto não tem `deleted_at`, então `destroy` apaga de verdade), mantém `password` e `remember_token` em `$hidden` e os casts `password => hashed` e `email_verified_at => datetime`. O `id` fica fora do `$fillable`;
  - as colunas de **FK que apontam para `users`** (`user_id`, `author_id`...) são geradas como `unsignedBigInteger`, e as requests validam com `integer` (em vez de `uuid`), mais o `exists:users,id`. Isso vale também para as `alter`;
- **Sanctum**: `HasApiTokens` não vai na base (o pacote só existe se instalado: já vem no Laravel 10 e no `install:api` do 11+). Se usa tokens, deixe `use HasApiTokens;` na sua classe final `User`;
- **o `app/Models/User.php` do esqueleto é preservado** (`create-once`), com um aviso por `generate` até migrá-lo. Como ele estende `Authenticatable` direto, a base fica sem uso. Para usá-la:
  1. troque `extends Authenticatable` por `extends \App\Generated\Models\BaseUser` e remova o `use Illuminate\Foundation\Auth\User as Authenticatable;`;
  2. mantenha só o que é seu (traits como `HasApiTokens`, métodos);
  3. apague `$fillable`, `$hidden` e `$casts`/`casts()` repetidos: redeclarados na final, **substituem** os da base (e o `$fillable` do esqueleto não inclui os campos novos do manifest);
  4. o mesmo vale para `database/factories/UserFactory.php`: é a final `create-once` da factory e o esqueleto já a criou (estendendo `Factory` direto), então é preservada, com um aviso por `generate`. Para usar a base (`app/Generated/Factories/BaseUserFactory.php`, que preenche os campos do manifest, como `phone`, e `email_verified_at`, `password` e `remember_token` como o esqueleto), troque `extends Factory` por `extends \App\Generated\Factories\BaseUserFactory`, remova o `use ...\Factory;`, a propriedade `$password` e a `definition()`, e mantenha o estado `unverified()` e o que for seu. Enquanto não migrar, `User::factory()` usa a factory do esqueleto (que não conhece as colunas novas);
- declare `password` no manifest com `hidden: true` (`"password": { "type": "string", "hidden": true }`) para a API aceitar a senha sem devolvê-la; o cast `hashed` a cifra ao salvar. Sem esse campo a API não cria usuários com senha. No Laravel 10, o cast `hashed` exige a versão 10.14 ou mais nova;
- o login padrão do esqueleto (colunas `password`, `remember_token`, `email_verified_at`) continua funcionando.

Esse modo só vale quando a tabela `users` vem de uma migration de fora do crudmaker. Se não há nenhuma migration `create_users_table` no destino (ou se ela é do crudmaker), `user` é uma entidade comum, com id uuid, como qualquer outra.

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

As rotas aninhadas respondem como as do filho: `nestedIndex` como o `index`, `nestedStore` como o `store` (201) e `nestedShow` como o `show` (404 se o pai não tem o registro). O `POST` do `hasOne` responde 409 se já existe um.

Formato das respostas com corpo:

- `store`, `show` e `update`: `{ "status": 201|200, "message": ..., "data": { ... } }`. O `message` só existe nas escritas (`store` e `update`).
- `index`: formato nativo de paginação do Laravel, `{ "data": [ ... ], "links": { ... }, "meta": { ... } }`. Não leva `status` nem `message`: o envelope `data` é o mesmo das demais respostas, e `links`/`meta` (página atual, total, URLs) são acrescentados pelo Laravel. A página vem de `?page=N`; o tamanho é 15, ou o `api.perPage` do manifest. Com as opções `api.filters`, `api.search` e `api.sort`, o `index` aceita também `?status=active`, `?search=ana` e `?sort=-name`, por exemplo `GET /api/clients?status=active&search=ana&sort=-name&page=2` (veja [Opções da API](manifest.md#opções-da-api-api)). Com `api.with`, `index` e `show` carregam os relacionamentos e a resource os devolve aninhados, pelo nome do método (`"address": { ... }`, `"alerts": [ ... ]`).
- `destroy`: corpo vazio.

Os controllers não têm try/catch: erros chegam ao handler do Laravel e saem com o status certo. Registro inexistente na rota dá 404, validação falha com 422 (`{ "message": ..., "errors": { ... } }`), autorização negada dá 403, e só exceções não tratadas viram 500. Os registros usam soft delete, e a resource devolve `created_at`/`updated_at` como `{ timestamp, description }`.

## Problemas conhecidos

Os bugs do código gerado e as limitações do manifest estão listados em [manifest.md](manifest.md#limitações-conhecidas) e na spec da v2. Os principais:

