# 04 — Schema e validação do manifest

**Fase:** Fase 1 — Deixar usável de novo

**O que construir:** Antes de gerar, o manifest é validado contra um schema definido em zod. Os erros mostram o caminho exato (ex.: `entities.client.fields.email.type`) e nada é gerado quando o manifest é inválido. Há também validação entre entidades: relacionamento apontando para entidade inexistente e enum sem itens. A normalização (forma curta → forma longa e aliases `int`/`displayName`) vira parte do schema. O JSON Schema derivado é publicado com a ferramenta, para dar autocomplete no editor e servir de referência para a IA.

**Bloqueado por:**

- [01 — Núcleo `generate()` puro e testes de snapshot](../fase-1-usavel/01-nucleo-generate-e-snapshots.md)

**Status:** ready-for-agent

## Critérios de aceite

- [x] Os manifests de exemplo continuam válidos e os snapshots não mudam.
- [x] Manifests inválidos (tipo desconhecido, chave obrigatória ausente, relacionamento para entidade inexistente, enum vazio) falham com a mensagem e o caminho certos.
- [x] O JSON Schema é gerado a partir do schema zod e publicado no pacote.
- [ ] O VS Code valida um manifest YAML/JSON que referencia o schema.
- [x] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.

> **Pendente:** o critério do VS Code ainda não foi conferido num editor real. O JSON Schema é gerado, versionado e publicado no pacote, e o `crudmaker init` grava a chave `$schema`/modeline que o referencia, mas falta abrir um manifest YAML e um JSON no VS Code e confirmar o autocomplete e os erros. Por isso o status continua `ready-for-agent`.
