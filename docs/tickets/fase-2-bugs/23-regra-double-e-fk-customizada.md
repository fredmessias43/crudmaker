# 23 — Regra de validação `double` e FK customizada na model

**Fase:** Fase 2 — Templates e correção de bugs

**O que construir:** Dois bugs encontrados no ticket 09 deixam de existir no PHP gerado. (1) A request gerava a regra `'double'`, que não existe no Laravel e quebra em runtime; campos `double` passam a ser validados com `numeric`. Revise as regras dos outros tipos contra as regras que existem de fato no Laravel 10–12, e corrija qualquer outra regra inexistente. (2) Relacionamentos com FK customizada (`{ entity: user, field: author_id }`) geravam `belongsTo(User::class, 'id', 'author_id')`, com foreignKey e ownerKey trocadas. Agora geram `belongsTo(User::class, 'author_id')` (ou a assinatura completa na ordem certa). O mesmo vale para `hasOne`/`hasMany` com `field` customizado, que deve apontar para a FK no lado filho.

**Bloqueado por:**

- [09 — Corrigir schema, migrations e validação](09-corrigir-schema-e-validacao.md)

**Status:** done

## Critérios de aceite

- [x] Nenhuma regra gerada é inexistente no Laravel (há asserção por tipo de campo).
- [x] `belongsTo`, `hasOne` e `hasMany` com FK customizada geram os argumentos na ordem certa (asserção explícita e snapshot do `order-item`).
- [x] Os snapshots mudam só nas requests (regra de `double`) e nas models com FK customizada.
- [x] Os avisos correspondentes saem de `docs/como-usar.md`.
- [x] Os `docs/` afetados estão atualizados.
