# 11 — Opções `api` da entidade no manifest

**Fase:** Fase 3 — Arquitetura de customização

**O que construir:** O desenvolvedor customiza a API sem PHP, num bloco `api` por entidade e em `pkg.defaults.api`: `actions`, `middleware`, `perPage`, `filters` (igualdade), `search` (texto), `sort`/`defaultSort` e `with` (eager loading + resource aninhada). As opções afetam a camada gerada, e filtros, busca e ordenação são aplicados antes do hook `indexQuery`. Um manifest sem esses blocos gera o mesmo CRUD de antes.

**Bloqueado por:**

- [04 — Schema e validação do manifest](../fase-1-usavel/04-schema-e-validacao.md)
- [06 — Gerar as rotas](../fase-1-usavel/06-gerar-rotas.md)
- [10 — Camada gerada × customizada com hooks](../fase-3-arquitetura/10-camada-gerada-e-hooks.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Fixture com todas as opções, com snapshot.
- [ ] Actions restritas também restringem as rotas.
- [ ] Validação: nomes em `filters`/`search`/`sort`/`with` que não existem falham com caminho claro.
- [ ] As opções aparecem no JSON Schema e no `docs/manifest.md`.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
