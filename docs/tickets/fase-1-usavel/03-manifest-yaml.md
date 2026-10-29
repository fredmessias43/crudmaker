# 03 — Manifest em YAML

**Fase:** Fase 1 — Deixar usável de novo

**O que construir:** O desenvolvedor pode escrever o manifest em YAML (`.yaml`/`.yml`), com comentários, e continuar usando JSON. O formato é detectado pela extensão.

**Bloqueado por:**

- [02 — CLI `crudmaker generate`](../fase-1-usavel/02-cli-generate.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Um manifest YAML equivalente a um JSON gera exatamente a mesma saída (teste de snapshot).
- [ ] Os manifests JSON existentes continuam funcionando.
- [ ] Uma extensão desconhecida dá um erro claro.
- [ ] `crudmaker init` aceita escolher o formato.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
