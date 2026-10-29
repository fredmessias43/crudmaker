# 08 — Corrigir o comportamento dos controllers

**Fase:** Fase 2 — Templates e correção de bugs

**O que construir:** A API gerada segue a semântica HTTP: `store` responde 201, `show` e `update` respondem 200, e `destroy` responde 204 sem corpo. O `index` é paginado. O try/catch que transformava tudo em 500 sai, então 404, 422 e 403 chegam ao cliente com o status certo. O envelope `data`/`message` é mantido nas respostas com corpo.

**Bloqueado por:**

- [07 — Migrar os geradores para templates](../fase-2-bugs/07-migrar-para-templates.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] O snapshot do controller muda só nesses pontos, de forma intencional.
- [ ] Asserções explícitas sobre os status, a paginação e a ausência de try/catch genérico.
- [ ] A seção "Comportamento da API gerada" do `docs/como-usar.md` está atualizada.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
