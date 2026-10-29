# 07 — Migrar os geradores para templates

**Fase:** Fase 2 — Templates e correção de bugs

**O que construir:** Cada tipo de arquivo (model, migration, request, resource, collection e controller) passa a vir de um template legível (Eta ou equivalente) alimentado pelo modelo normalizado, no lugar da concatenação de strings. As classes geradoras antigas são removidas. A saída continua idêntica, e os snapshots são a prova disso.

**Bloqueado por:**

- [01 — Núcleo `generate()` puro e testes de snapshot](../fase-1-usavel/01-nucleo-generate-e-snapshots.md)

**Status:** done

## Critérios de aceite

- [x] Todos os tipos de arquivo saem de templates.
- [x] Os snapshots dos três manifests de exemplo continuam idênticos.
- [x] As classes que concatenavam strings foram removidas.
- [x] A convenção de arrays de linhas sai do `CLAUDE.md`, que passa a apontar para os templates.
- [x] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
