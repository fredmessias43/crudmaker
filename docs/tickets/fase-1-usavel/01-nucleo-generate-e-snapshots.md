# 01 — Núcleo `generate()` puro e testes de snapshot

**Fase:** Fase 1 — Deixar usável de novo

**O que construir:** Preparação para o resto. A geração passa a ser uma função pura que recebe o manifest e devolve a lista de arquivos (caminho relativo, conteúdo e política de escrita), sem tocar o disco. A escrita fica numa camada separada. A execução troca `ts-node` por `tsx`, e o vitest é configurado com snapshots da saída atual, usando como fixtures os três manifests de `generated/` (copiados para fixtures de teste). O código morto sai: FileWriter, ObserverFile, controller Inertia, ApiControllerFile e os arquivos vazios de relacionamento. A saída PHP não muda.

**Bloqueado por:**

Nenhum — pode começar imediatamente.

**Status:** done

## Critérios de aceite

- [x] `generate` recebe o manifest e devolve os arquivos sem nenhuma escrita em disco.
- [x] Os snapshots dos três manifests de exemplo passam e representam a saída de hoje, byte a byte.
- [x] `npm test` roda a suíte, e `npx tsc --noEmit` passa sem erros.
- [x] O código morto listado foi removido.
- [x] Rodar a geração pelo script atual produz os mesmos arquivos de antes.
- [x] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
