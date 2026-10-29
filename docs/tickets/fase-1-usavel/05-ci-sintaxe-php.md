# 05 — CI com checagem de sintaxe do PHP gerado

**Fase:** Fase 1 — Deixar usável de novo

**O que construir:** Todo push roda a suíte de testes e um `php -l` (via Docker) em todos os arquivos PHP gerados a partir das fixtures. Uma mudança que gere PHP inválido quebra o CI.

**Bloqueado por:**

- [01 — Núcleo `generate()` puro e testes de snapshot](../fase-1-usavel/01-nucleo-generate-e-snapshots.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Workflow de CI rodando `npm test` e a checagem de sintaxe.
- [ ] A checagem roda localmente com um comando npm, usando só o Docker.
- [ ] Um PHP propositalmente inválido faz a checagem falhar.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
