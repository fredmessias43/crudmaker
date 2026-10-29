# Tickets da v2

Tickets da [spec da v2](../specs/crudmaker-v2.md), divididos em fases. Cada ticket é uma fatia vertical que pode ser verificada sozinha. Todos estão entregues (`done`), exceto o 04, que tem um critério em aberto (veja [Em aberto](#em-aberto)).

Desde o ticket 15 (versão alvo), o código gerado segue a versão do Laravel (10, 11 ou 12) e do PHP do projeto de destino.

## Fase 1 — Deixar usável de novo

| # | Ticket | Bloqueado por | Status |
|---|---|---|---|
| 01 | [Núcleo `generate()` puro e testes de snapshot](fase-1-usavel/01-nucleo-generate-e-snapshots.md) | — | done |
| 02 | [CLI `crudmaker generate`](fase-1-usavel/02-cli-generate.md) | 01 | done |
| 03 | [Manifest em YAML](fase-1-usavel/03-manifest-yaml.md) | 02 | done |
| 04 | [Schema e validação do manifest](fase-1-usavel/04-schema-e-validacao.md) | 01 | aberto (1 critério) |
| 05 | [Checagem de sintaxe do PHP gerado](fase-1-usavel/05-ci-sintaxe-php.md) | 01 | done |
| 06 | [Gerar as rotas](fase-1-usavel/06-gerar-rotas.md) | 02 | done |

## Fase 2 — Templates e correção de bugs

| # | Ticket | Bloqueado por | Status |
|---|---|---|---|
| 07 | [Migrar os geradores para templates](fase-2-bugs/07-migrar-para-templates.md) | 01 | done |
| 08 | [Corrigir o comportamento dos controllers](fase-2-bugs/08-corrigir-controllers.md) | 07 | done |
| 09 | [Corrigir schema, migrations e validação](fase-2-bugs/09-corrigir-schema-e-validacao.md) | 07, 04 | done |
| 22 | [Normalizar nomes fora da convenção](fase-2-bugs/22-normalizar-nomes.md) | 04 | done |
| 23 | [Regra `double` e FK customizada na model](fase-2-bugs/23-regra-double-e-fk-customizada.md) | 09 | done |

## Fase 3 — Arquitetura de customização

| # | Ticket | Bloqueado por | Status |
|---|---|---|---|
| 10 | [Camada gerada × customizada com hooks](fase-3-arquitetura/10-camada-gerada-e-hooks.md) | 02, 08 | done |
| 11 | [Opções `api` da entidade no manifest](fase-3-arquitetura/11-opcoes-api-da-entidade.md) | 04, 06, 10 | done |
| 12 | [Opções de campo no manifest](fase-3-arquitetura/12-opcoes-de-campo.md) | 04, 10 | done |
| 13 | [Stubs customizáveis](fase-3-arquitetura/13-stubs-customizaveis.md) | 07, 10 | done |
| 14 | [Migrations de alteração pelo lock](fase-3-arquitetura/14-migrations-de-alteracao.md) | 09, 10 | done |

## Fase 4 — Modernizar e ampliar

| # | Ticket | Bloqueado por | Status |
|---|---|---|---|
| 15 | [Versão alvo do Laravel/PHP](fase-4-modernizar/15-versao-alvo.md) | 02, 07, 06 | done |
| 16 | [Enums PHP e FKs validadas](fase-4-modernizar/16-enums-e-fks-validadas.md) | 09, 15 | done |
| 17 | [`crudmaker new` via Docker + Sail](fase-4-modernizar/17-crudmaker-new-docker.md) | 15, 06 | done |
| 18 | [Factories e seeders](fase-4-modernizar/18-factories-e-seeders.md) | 16, 10, 12, 24 | done |
| 19 | [Testes Pest gerados](fase-4-modernizar/19-testes-pest-gerados.md) | 17, 18 | done |
| 20 | [Rotas e controllers aninhados](fase-4-modernizar/20-rotas-aninhadas.md) | 06, 10 | done |
| 21 | [Documento para IA e docs da v2](fase-4-modernizar/21-doc-para-ia.md) | 11, 12 | done |
| 24 | [Não sobrescrever arquivos do esqueleto do Laravel (entidade `user`)](fase-4-modernizar/24-arquivos-do-esqueleto.md) | 17 | done |

## Em aberto

- **04 — Schema e validação**: falta conferir num editor real (VS Code) que um manifest YAML e um JSON que referenciam o schema têm autocomplete e mostram os erros. O JSON Schema é gerado, versionado e publicado, e o `crudmaker init` grava o modeline/`$schema` que o referencia; só essa verificação manual não foi feita. O ticket continua `ready-for-agent`.
