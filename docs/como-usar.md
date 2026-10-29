# Como usar

Este guia descreve o fluxo **atual** do crudmaker. A CLI de verdade (`crudmaker generate`, YAML, `--out`) ainda não existe; ela está planejada em [specs/crudmaker-v2.md](specs/crudmaker-v2.md).

## Pré-requisitos

- Node.js e npm.
- Um projeto Laravel com a API instalada (`php artisan install:api`), se você quiser rodar o resultado.

```bash
npm install
```

## 1. Preparar a pasta do projeto

A saída vai sempre para `generated/<pkg.code>/`, onde `pkg.code` vem do manifest. A pasta `generated/` está no `.gitignore` do crudmaker, então o jeito mais prático é criar o projeto Laravel ali dentro, com o mesmo nome:

```bash
cd generated
composer create-project laravel/laravel minha-api
cd minha-api && php artisan install:api
```

Os arquivos gerados caem direto em `app/` e `database/migrations/` desse projeto.

## 2. Escrever o manifest

Crie `generated/minha-api/manifest.json` com `"pkg": { "code": "minha-api", ... }`. O formato está em [manifest.md](manifest.md).

## 3. Apontar o gerador para o manifest

O caminho do manifest está fixo no `src/main.ts`. Troque para o seu:

```ts
const manifestObj = JSON.parse(
  fs.readFileSync("./generated/minha-api/manifest.json", { encoding: "utf8" }),
);
```

## 4. Gerar

```bash
npm run dev
```

Para cada entidade são escritos:

| Arquivo | Pasta |
|---|---|
| `<Entidade>.php` (Model) | `app/Models/` |
| `<Entidade>Controller.php` | `app/Http/Controllers/Api/` |
| `<Entidade>Request.php` | `app/Http/Requests/` |
| `<Entidade>Resource.php` e `<Entidade>Collection.php` | `app/Http/Resources/` |
| `<data>_create_<tabela>_table.php` | `database/migrations/` |

Além disso, `manifest-lock.json` é gravado na raiz da pasta, com o manifest já normalizado. Ele serve para conferir o que o gerador entendeu do manifest.

## 5. Terminar à mão

O gerador ainda não faz estes passos:

1. **Rotas.** Registre em `routes/api.php`:
   ```php
   Route::apiResource('clients', ClientController::class);
   ```
2. **Ordem das migrations.** Todas são criadas no mesmo segundo. Se uma tabela com FK for criada antes da tabela que ela referencia, o `migrate` falha; renomeie o timestamp da migration para corrigir a ordem.
3. **Rodar:** `php artisan migrate`.

## Regerar

- **Tudo é sobrescrito**, exceto o nome das migrations: se já existe uma migration terminada em `_create_<tabela>_table.php`, o mesmo arquivo é reaproveitado (e o conteúdo é reescrito). Qualquer edição feita à mão nos arquivos gerados se perde. Use git no projeto Laravel para recuperar o que precisar.
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
