# crudmaker

Gerador de API Laravel a partir de um manifest. Você descreve as entidades, os campos e os relacionamentos num arquivo YAML (ou JSON) e o crudmaker escreve o resto: migrations, models, enums, requests, resources, controllers, rotas, factories e testes Pest, no padrão do Laravel 10, 11 ou 12 do seu projeto.

O manifest é 15–30x menor que o PHP gerado, e a geração é determinística: serve para escrever uma API mais rápido e, com uma IA, gastar muito menos tokens (ela edita o manifest e roda o gerador em vez de escrever o CRUD). É seguro regerar a qualquer momento: o código gerado fica em `app/Generated/` (sempre regravado) e a sua regra de negócio vai nas classes finais, que o crudmaker cria uma vez e nunca sobrescreve. Mudanças de schema viram migrations `alter`.

## Instalação

Precisa de Node.js e npm. Para criar um projeto Laravel do zero, só o Docker (sem PHP nem composer na máquina).

```bash
git clone <este repositório> && cd crudmaker
npm install
npm run build        # compila para dist/
npm link             # opcional: instala o comando `crudmaker` no PATH
```

Sem build, `npm run cli -- <comando>` roda direto do código-fonte.

## Uso

```bash
crudmaker init                                   # cria manifest.yaml de exemplo (--ai: também o guia para IA)
crudmaker new minha-api manifest.yaml            # cria um projeto Laravel novo (Docker + Sail) já com a API
crudmaker generate manifest.yaml --out minha-api # gera/atualiza a API num projeto Laravel existente
```

Confira antes com `--dry-run` (não escreve nada) e rode `php artisan migrate` depois. Um manifest mínimo:

```yaml
system: { code: minha-api }
pkg:
  code: minha-api
  entities:
    client:
      fields:
        id: uuid
        name: string
        email: { type: string, unique: true }
      relationships:
        hasMany: [order]
    order:
      fields: { id: uuid, total: double }
      relationships:
        belongsTo: [client]
```

Outros comandos: `crudmaker stubs:publish` (copia os templates para você mudar o padrão de um tipo de arquivo) e `crudmaker --help` (ajuda de cada comando).

## Documentação

Ordem de leitura:

1. [docs/como-usar.md](docs/como-usar.md): uso de ponta a ponta (projeto novo ou existente, `--dry-run`, hooks, factories, testes gerados, stubs, regeração).
2. [docs/manifest.md](docs/manifest.md): referência do formato do manifest, opções de campo e da API, limitações conhecidas. O JSON Schema está em [schema/manifest.schema.json](schema/manifest.schema.json).
3. [docs/arquitetura.md](docs/arquitetura.md): módulos e fluxo interno, para quem vai mexer no gerador.
4. [docs/specs/crudmaker-v2.md](docs/specs/crudmaker-v2.md) e [docs/tickets/](docs/tickets/README.md): decisões da v2 e o status de cada ticket.

**Usando uma IA?** [docs/guia-ia.md](docs/guia-ia.md) é um guia de cerca de 800 tokens (formato do manifest, fluxo, onde escrever PHP e o que não editar). `crudmaker init --ai` o grava como `CRUDMAKER.md` no seu projeto; referencie-o no `CLAUDE.md` ou `AGENTS.md`. Exemplos de manifest: o do `crudmaker init` e [manifest.example.json](manifest.example.json) (catálogo de todas as formas).

## Desenvolvimento

`npm test` (vitest), `npx tsc --noEmit` e `npm run lint:php` (sintaxe do PHP gerado, via Docker) rodam no hook de pre-commit. Detalhes e convenções em [CLAUDE.md](CLAUDE.md).

## Ideias futuras

Itens que não estão em nenhum ticket da v2 (a v3 e o que ficou fora do escopo estão na [spec](docs/specs/crudmaker-v2.md#out-of-scope)):

- Ler um manifest a partir de um OpenAPI, ou gerar um OpenAPI a partir do manifest (o JSON Schema do manifest facilita).
- Novos targets sobre o mesmo manifest (v3): Inertia, Filament e Next.js, provavelmente com metadados de UI no manifest.
- Relacionamentos que hoje não geram código válido: `ownOne`/`ownMany`, polimórficos (`morph*`) e muitos-para-muitos com tabela pivô.
- Observers (a v1 tinha; ficaram fora da v2).
- Rodar o scaffold sem Docker (PHP e composer locais) como alternativa ao `crudmaker new`.
- Outra sintaxe para declarar relacionamentos no manifest (a v1 cogitava `belongsTo.0.model` ou `model.type.belongsTo`).
- Autocomplete do JSON Schema conferido em editor real (VS Code), pendente do ticket 04.
