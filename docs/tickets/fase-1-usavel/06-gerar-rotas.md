# 06 — Gerar as rotas

**Fase:** Fase 1 — Deixar usável de novo

**O que construir:** As rotas `apiResource` de todas as entidades são geradas num arquivo próprio, sempre sobrescrito, e o `routes/api.php` ganha uma única vez o include desse arquivo, sem alterar o resto. A API responde logo depois do `migrate`. O alvo é o layout do Laravel 11+ (o suporte por versão vem no ticket de versão alvo).

**Bloqueado por:**

- [02 — CLI `crudmaker generate`](../fase-1-usavel/02-cli-generate.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] O arquivo de rotas gerado contém uma `apiResource` por entidade.
- [ ] O include é adicionado ao `routes/api.php` só se ainda não existir, e o resto do arquivo fica intacto.
- [ ] Regerar não duplica o include.
- [ ] Snapshot do arquivo de rotas e teste da CLI do include num `routes/api.php` de exemplo.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
