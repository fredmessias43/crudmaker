# 19 — Testes Pest gerados

**Fase:** Fase 4 — Modernizar e ampliar

**O que construir:** Cada entidade ganha testes Pest para os endpoints CRUD (listar paginado, criar, mostrar, atualizar, remover e validação 422), usando as factories. O desenvolvedor sabe na hora se a API gerada funciona no projeto dele.

**Bloqueado por:**

- [17 — `crudmaker new` via Docker + Sail](../fase-4-modernizar/17-crudmaker-new-docker.md)
- [18 — Factories e seeders](../fase-4-modernizar/18-factories-e-seeders.md)

**Status:** done

## Critérios de aceite

- [x] Snapshot dos testes gerados.
- [x] Em execução manual, num projeto criado por `crudmaker new`, `sail test` passa com os testes gerados. (Conferido com `php artisan test` e `php vendor/bin/pest` no container `laravelsail/php82-composer` (é o que o `sail test` executa por baixo); o Sail com `up` não foi subido. Laravel 10, 11 e 12 com sqlite.)
- [x] Actions desabilitadas no manifest não ganham teste.
- [x] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
