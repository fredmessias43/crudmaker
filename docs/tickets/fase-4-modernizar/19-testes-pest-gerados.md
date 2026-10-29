# 19 — Testes Pest gerados

**Fase:** Fase 4 — Modernizar e ampliar

**O que construir:** Cada entidade ganha testes Pest para os endpoints CRUD (listar paginado, criar, mostrar, atualizar, remover e validação 422), usando as factories. O desenvolvedor sabe na hora se a API gerada funciona no projeto dele.

**Bloqueado por:**

- [17 — `crudmaker new` via Docker + Sail](../fase-4-modernizar/17-crudmaker-new-docker.md)
- [18 — Factories e seeders](../fase-4-modernizar/18-factories-e-seeders.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Snapshot dos testes gerados.
- [ ] Em execução manual, num projeto criado por `crudmaker new`, `sail test` passa com os testes gerados.
- [ ] Actions desabilitadas no manifest não ganham teste.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
