# 14 — Migrations de alteração pelo lock

**Fase:** Fase 3 — Arquitetura de customização

**O que construir:** Quando um campo é adicionado, removido ou alterado num manifest já gerado, a geração cria uma migration `alter` em vez de reescrever a de criação. O manifest-lock passa a guardar o schema normalizado e as migrations já emitidas, e entra como parâmetro de `generate`. Regerar sem mudanças não cria migration nenhuma.

**Bloqueado por:**

- [09 — Corrigir schema, migrations e validação](../fase-2-bugs/09-corrigir-schema-e-validacao.md)
- [10 — Camada gerada × customizada com hooks](../fase-3-arquitetura/10-camada-gerada-e-hooks.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Teste com lock anterior e sem mudança: nenhuma migration nova.
- [ ] Testes de campo adicionado, removido e alterado gerando a migration `alter` esperada.
- [ ] As migrations de criação existentes nunca são reescritas.
- [ ] O formato do lock está documentado.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
