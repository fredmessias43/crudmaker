# 05 — Checagem de sintaxe do PHP gerado

**Fase:** Fase 1 — Deixar usável de novo

**O que construir:** Um comando local roda `php -l` (via Docker) em todos os arquivos PHP gerados a partir das fixtures. Uma mudança que gere PHP inválido faz a checagem falhar. Não há CI no GitHub: a checagem roda localmente.

**Bloqueado por:**

- [01 — Núcleo `generate()` puro e testes de snapshot](../fase-1-usavel/01-nucleo-generate-e-snapshots.md)

**Status:** done

## Critérios de aceite

- [x] A checagem roda localmente com um comando npm, usando só o Docker.
- [x] Um PHP propositalmente inválido faz a checagem falhar.
- [x] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.

> **Sem CI no GitHub, por decisão do usuário:** a verificação é local. Antes de commitar, rode `npx tsc --noEmit`, `npm test` e `npm run lint:php`. A checagem (`npm run lint:php`) roda `php -l` na saída de `generate` para as fixtures e tem uma allowlist de falhas conhecidas em `scripts/phpSyntaxAllowlist.ts` (entidade `class` do fixture `curso`, a ser corrigida pela validação de palavras reservadas, ticket 09).
