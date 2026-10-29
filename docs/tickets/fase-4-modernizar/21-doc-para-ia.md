# 21 — Documento para IA e docs da v2

**Fase:** Fase 4 — Modernizar e ampliar

**O que construir:** Um guia curto (formato do manifest, exemplo, comando e onde ficam os hooks) para colocar no contexto da IA. Assim ela altera o manifest e roda o gerador, em vez de escrever o CRUD em PHP. Os `docs/` e o `CLAUDE.md` passam a descrever a v2, e o TODO antigo sai do README.

**Bloqueado por:**

- [11 — Opções `api` da entidade no manifest](../fase-3-arquitetura/11-opcoes-api-da-entidade.md)
- [12 — Opções de campo no manifest](../fase-3-arquitetura/12-opcoes-de-campo.md)

**Status:** done

## Critérios de aceite

- [x] O guia cabe em poucas centenas de tokens e aponta para o JSON Schema.
- [x] `docs/como-usar.md`, `docs/manifest.md`, `docs/arquitetura.md` e `CLAUDE.md` descrevem a v2.
- [x] O README tem uma introdução curta e aponta para os docs.
- [x] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.

> **Entregue:** [`docs/guia-ia.md`](../../guia-ia.md) (≈ 800 tokens: o que é, fluxo, manifest de exemplo, JSON Schema, hooks, o que nunca editar, avisos), incluído no pacote publicado (`files` do `package.json`) e gravado por `crudmaker init --ai` como `CRUDMAKER.md`. O exemplo do `init` e o `manifest.example.json` mostram `api`, `hidden`, `rules` e `default`. `docs/`, `CLAUDE.md` e `README.md` foram revisados para descrever a v2 de ponta a ponta. `tests/aiGuide.test.ts` protege o tamanho, o exemplo e os hooks do guia.
