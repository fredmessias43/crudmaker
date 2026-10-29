# Como usar

Este guia descreve o fluxo atual do crudmaker, pela CLI `crudmaker`. YAML e as demais melhorias estão planejados em [specs/crudmaker-v2.md](specs/crudmaker-v2.md).

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
crudmaker init                # cria manifest.json de exemplo (recusa se já existir)
crudmaker init outro.json     # ou com outro nome
```

Edite o arquivo conforme o formato descrito em [manifest.md](manifest.md).

## 2. Ter o projeto Laravel de destino

```bash
composer create-project laravel/laravel minha-api
cd minha-api && php artisan install:api
```

O destino é a raiz desse projeto. Os arquivos gerados caem direto em `app/` e `database/migrations/`.

## 3. Conferir com `--dry-run`

```bash
crudmaker generate manifest.json --out ../minha-api --dry-run
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
crudmaker generate manifest.json --out ../minha-api
```

`--out` é a raiz do projeto Laravel e, se omitido, vale o diretório atual. No fim a CLI imprime o resumo: a lista de arquivos por classificação e as contagens (`Total: 13 arquivos (13 criados, 0 sobrescritos, 0 sem mudança, 0 preservados)`). Erros (manifest inexistente, JSON inválido, manifest inválido) vão para o stderr com exit code 1.

Para cada entidade são escritos:

| Arquivo | Pasta |
|---|---|
| `<Entidade>.php` (Model) | `app/Models/` |
| `<Entidade>Controller.php` | `app/Http/Controllers/Api/` |
| `<Entidade>Request.php` | `app/Http/Requests/` |
| `<Entidade>Resource.php` e `<Entidade>Collection.php` | `app/Http/Resources/` |
| `<data>_create_<tabela>_table.php` | `database/migrations/` |

Além disso, `manifest-lock.json` é gravado na raiz do destino, com o manifest já normalizado. Ele serve para conferir o que o gerador entendeu do manifest.

## 5. Terminar à mão

O gerador ainda não faz estes passos:

1. **Rotas.** Registre em `routes/api.php`:
   ```php
   Route::apiResource('clients', ClientController::class);
   ```
2. **Ordem das migrations.** Todas são criadas no mesmo segundo. Se uma tabela com FK for criada antes da tabela que ela referencia, o `migrate` falha; renomeie o timestamp da migration para corrigir a ordem.
3. **Rodar:** `php artisan migrate`.

## Regerar

- **Tudo é sobrescrito** (veja o `--dry-run`), exceto o nome das migrations: se já existe uma migration terminada em `_create_<tabela>_table.php`, o mesmo arquivo é reaproveitado (e o conteúdo é reescrito). Qualquer edição feita à mão nos arquivos gerados se perde. Use git no projeto Laravel para recuperar o que precisar.
- Mudanças de schema não viram migration de alteração; a migration de criação é reescrita. Num banco que já rodou a migration, você precisa criar a alteração à mão ou usar `migrate:fresh`.

## Comportamento da API gerada

| Action | Rota | Resposta |
|---|---|---|
| `index` | `GET /clients` | 200, todos os registros (sem paginação) |
| `store` | `POST /clients` | 201, registro criado |
| `show` | `GET /clients/{client}` | 200 |
| `update` | `PUT /clients/{client}` | 201 (deveria ser 200) |
| `destroy` | `DELETE /clients/{client}` | 204 (o corpo é descartado) |

Respostas têm o formato `{ "status": ..., "message": ..., "data": ... }`. Qualquer exceção dentro de uma action é relançada como erro 500. Os registros usam soft delete, e a resource devolve `created_at`/`updated_at` como `{ timestamp, description }`.

## Problemas conhecidos

Os bugs do código gerado e as limitações do manifest estão listados em [manifest.md](manifest.md#limitações-conhecidas) e na spec da v2. Os principais:

- a regra `unique` não barra duplicatas na edição;
- `update` responde 201;
- a FK aponta para a tabela errada em entidades camelCase;
- a model usa `HasFactory`, mas nenhuma factory é gerada.
