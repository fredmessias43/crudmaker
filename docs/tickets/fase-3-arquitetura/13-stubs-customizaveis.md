# 13 — Stubs customizáveis

**Fase:** Fase 3 — Arquitetura de customização

**O que construir:** O desenvolvedor muda o padrão de um tipo de arquivo inteiro sem fork. `crudmaker stubs:publish [tipo...]` copia os templates embutidos para uma pasta de stubs no projeto, e os stubs do projeto têm prioridade arquivo a arquivo. O lock guarda o hash do stub embutido na hora da publicação, e a geração avisa quando o embutido mudou desde então.

**Bloqueado por:**

- [07 — Migrar os geradores para templates](../fase-2-bugs/07-migrar-para-templates.md)
- [10 — Camada gerada × customizada com hooks](../fase-3-arquitetura/10-camada-gerada-e-hooks.md)

**Status:** done

## Critérios de aceite

- [x] Publicar só o stub do controller muda só os controllers gerados.
- [x] Teste do aviso quando o hash do embutido muda.
- [x] Os stubs afetam só a camada gerada.
- [x] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
