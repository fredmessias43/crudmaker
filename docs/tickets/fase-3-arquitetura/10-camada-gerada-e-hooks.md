# 10 — Camada gerada × customizada com hooks

**Fase:** Fase 3 — Arquitetura de customização

**O que construir:** O desenvolvedor pode regerar sem perder regra de negócio. Para model, controller, request e resource, o gerador escreve uma classe base em `App\Generated\...`, sempre sobrescrita e com cabeçalho de arquivo gerado, e uma classe final no namespace normal, que estende a base, nasce vazia com os hooks listados em comentário e é criada uma única vez. O controller base chama os 7 hooks (`indexQuery`, `beforeStore`, `afterStore`, `beforeUpdate`, `afterUpdate`, `beforeDestroy`, `afterDestroy`), com a escrita e os hooks na mesma transação. A request junta `extraRules()` às regras geradas e a resource junta `extra()` aos campos. Rotas e referências usam sempre as classes finais. Arquivos da camada customizada nunca são sobrescritos, nem com `--force`. Ao remover uma entidade, a camada gerada dela é apagada e os arquivos customizados aparecem como órfãos.

**Bloqueado por:**

- [02 — CLI `crudmaker generate`](../fase-1-usavel/02-cli-generate.md)
- [08 — Corrigir o comportamento dos controllers](../fase-2-bugs/08-corrigir-controllers.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Snapshots da classe base (chamadas dos hooks e transação) e da classe final inicial.
- [ ] Teste da CLI: implementar um hook, regerar, conferir que o hook sobreviveu e que a base foi atualizada.
- [ ] Teste de remoção de entidade (gerados apagados, customizados listados como órfãos).
- [ ] Um hook que lança exceção desfaz a gravação.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
