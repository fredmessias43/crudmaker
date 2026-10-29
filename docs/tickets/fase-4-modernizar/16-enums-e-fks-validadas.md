# 16 — Enums PHP e FKs validadas

**Fase:** Fase 4 — Modernizar e ampliar

**O que construir:** Campos enum geram um PHP backed enum próprio, usado no cast da model e validado com `Rule::enum`. FKs de `belongsTo` são validadas com `exists` na tabela referenciada. Com PHP abaixo de 8.1 não há geração (já fora das versões suportadas).

**Bloqueado por:**

- [09 — Corrigir schema, migrations e validação](../fase-2-bugs/09-corrigir-schema-e-validacao.md)
- [15 — Versão alvo do Laravel/PHP](../fase-4-modernizar/15-versao-alvo.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Snapshot com o arquivo de enum, o cast e a regra.
- [ ] A regra `exists` aponta para a tabela certa em entidades camelCase.
- [ ] O TODO de enum do README sai.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
