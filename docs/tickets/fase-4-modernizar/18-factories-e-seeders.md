# 18 — Factories e seeders

**Fase:** Fase 4 — Modernizar e ampliar

**O que construir:** Cada entidade ganha uma factory com valores fake coerentes com o tipo (enum sorteia entre os itens; `default` é respeitado) que cria automaticamente os pais de `belongsTo`. O `HasFactory` passa a funcionar. Um seeder por entidade é gerado opcionalmente via flag.

**Bloqueado por:**

- [16 — Enums PHP e FKs validadas](../fase-4-modernizar/16-enums-e-fks-validadas.md)
- [10 — Camada gerada × customizada com hooks](../fase-3-arquitetura/10-camada-gerada-e-hooks.md)
- [12 — Opções de campo no manifest](../fase-3-arquitetura/12-opcoes-de-campo.md)
- [24 — Não sobrescrever arquivos do esqueleto do Laravel](../fase-4-modernizar/24-arquivos-do-esqueleto.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Snapshot de factory com todos os tipos de campo e com `belongsTo`.
- [ ] O seeder só é gerado com a flag.
- [ ] As factories seguem a política `create-once`.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
