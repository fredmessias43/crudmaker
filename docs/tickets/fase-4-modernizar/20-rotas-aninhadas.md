# 20 — Rotas e controllers aninhados

**Fase:** Fase 4 — Modernizar e ampliar

**O que construir:** Relacionamentos `hasMany`/`hasOne` geram rotas e controllers aninhados (ex.: `GET /clients/{client}/alerts` e `POST /clients/{client}/alerts`), na mesma estrutura de base gerada + classe final com hooks.

**Bloqueado por:**

- [06 — Gerar as rotas](../fase-1-usavel/06-gerar-rotas.md)
- [10 — Camada gerada × customizada com hooks](../fase-3-arquitetura/10-camada-gerada-e-hooks.md)

**Status:** done

## Critérios de aceite

- [x] Snapshot das rotas e dos controllers aninhados.
- [x] A criação aninhada preenche a FK do pai automaticamente.
- [x] Os TODOs de relacionamento do README saem.
- [x] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
