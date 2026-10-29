# 02 — CLI `crudmaker generate`

**Fase:** Fase 1 — Deixar usável de novo

**O que construir:** O desenvolvedor gera uma API com `crudmaker generate <manifest> --out <dir>`, sem editar código. `--out` usa o diretório atual por padrão. `--dry-run` lista o que seria criado, sobrescrito ou mantido sem escrever nada. No fim, um resumo mostra criados, sobrescritos e preservados. O pacote declara o binário para uso via `npx`, e `crudmaker init` cria um manifest de exemplo comentado. O caminho fixo no código deixa de existir.

**Bloqueado por:**

- [01 — Núcleo `generate()` puro e testes de snapshot](../fase-1-usavel/01-nucleo-generate-e-snapshots.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] `crudmaker generate manifest.json --out <dir>` escreve os arquivos no diretório informado.
- [ ] `--dry-run` não escreve nada e lista o que aconteceria com cada arquivo.
- [ ] O resumo final mostra as contagens de criados, sobrescritos e preservados.
- [ ] `crudmaker init` cria um manifest de exemplo válido.
- [ ] Teste de integração da CLI num diretório temporário.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
