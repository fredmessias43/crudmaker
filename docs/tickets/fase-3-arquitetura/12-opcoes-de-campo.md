# 12 — Opções de campo no manifest

**Fase:** Fase 3 — Arquitetura de customização

**O que construir:** Campos ganham `hidden` (sai da resource), `rules` (regras extras de validação somadas às derivadas do tipo) e `default` (vale na migration e, depois, na factory; em enums, substitui o default do primeiro item).

**Bloqueado por:**

- [04 — Schema e validação do manifest](../fase-1-usavel/04-schema-e-validacao.md)
- [10 — Camada gerada × customizada com hooks](../fase-3-arquitetura/10-camada-gerada-e-hooks.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Fixture e snapshot cobrindo as três propriedades.
- [ ] `default` incompatível com o tipo (ex.: item fora do enum) falha na validação.
- [ ] As opções aparecem no JSON Schema e no `docs/manifest.md`.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
