# 22 — Normalizar nomes fora da convenção

**Fase:** Fase 2 — Templates e correção de bugs

**O que construir:** O gerador corrige sozinho nomes fora da convenção, e o desenvolvedor pode desligar isso. Nomes de entidade (chaves e referências em relacionamentos) viram singular camelCase: `awards` → `award`, `drawn_numbers` → `drawnNumber`, `PlayerInvite` → `playerInvite`. Nomes de campo viram snake_case: `alertDate` → `alert_date`. Um campo de FK declarado à mão e também derivado de um `belongsTo` (ex.: `game_id` + `belongsTo: [game]`) é unificado. Cada nome alterado gera um aviso no resumo da CLI (`pkg.entities.awards → award`), e nomes que colidem depois de normalizados dão erro de validação. A normalização fica ligada por padrão. Ela é desligada por `pkg.normalizeNames: false` no manifest e controlada pela flag `--normalize-names` / `--no-normalize-names` da CLI, que tem prioridade. `generate` continua pura e passa a devolver os avisos junto com os arquivos.

**Bloqueado por:**

- [04 — Schema e validação do manifest](../fase-1-usavel/04-schema-e-validacao.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Fixture de teste com o manifest do `bingo-2` (entidades no plural e FKs declaradas à mão): gera `Award`, `Card`, `DrawnNumber` etc., com as tabelas e FKs corretas, e um snapshot.
- [ ] Referências em relacionamentos são normalizadas junto, e a validação de entidade inexistente usa os nomes normalizados.
- [ ] Os avisos aparecem no resumo da CLI e no `--dry-run`, um por nome alterado, com o caminho original.
- [ ] Colisões (`card` + `cards`, `alertDate` + `alert_date`) dão erro com o caminho dos dois nomes.
- [ ] `pkg.normalizeNames: false` gera exatamente a saída de hoje (os snapshots atuais continuam valendo com a normalização desligada).
- [ ] A flag da CLI tem prioridade sobre o manifest, nos dois sentidos.
- [ ] As mudanças intencionais nos snapshots das fixtures existentes (ex.: `alertDate` → `alert_date` no `vende-que-vende-api`) foram revisadas.
- [ ] `pkg.normalizeNames` aparece no JSON Schema (`npm run schema`) e no `docs/manifest.md`, com a tabela de regras.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
