# 09 — Corrigir schema, migrations e validação

**Fase:** Fase 2 — Templates e correção de bugs

**O que construir:** O código gerado fica correto para entidades em camelCase e com FKs. A FK aponta para a tabela em snake_case plural, inclusive na forma curta do `belongsTo` (que passa a gerar `order_item_id`). As migrations são ordenadas por dependência de FK, com timestamps determinísticos. A regra `unique` ignora o próprio registro pelo `id` na edição. Os casts cobrem boolean, json, date, datetime e double. Falta de campo `id` vira erro de validação.

**Bloqueado por:**

- [07 — Migrar os geradores para templates](../fase-2-bugs/07-migrar-para-templates.md)
- [04 — Schema e validação do manifest](../fase-1-usavel/04-schema-e-validacao.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Fixture com entidade camelCase (`orderItem`) e FK customizada, com snapshot.
- [ ] Asserções explícitas: nome da tabela da FK, ordem das migrations, `ignore` por id e casts presentes.
- [ ] Regerar não renomeia migrations existentes.
- [ ] As "Limitações conhecidas" resolvidas saem do `docs/manifest.md`.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
