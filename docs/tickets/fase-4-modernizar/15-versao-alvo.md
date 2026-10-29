# 15 — Versão alvo do Laravel/PHP

**Fase:** Fase 4 — Modernizar e ampliar

**O que construir:** O código gerado segue a versão do projeto de destino. A versão é resolvida nesta ordem: flag (`--laravel`, `--php`) → `target` no manifest → `composer.lock`/`composer.json` do destino → padrão mais recente. Um aviso aparece quando a versão explícita e a detectada divergem, e uma versão não suportada dá erro (Laravel 10, 11 e 12, PHP 8.1+). A versão entra como parâmetro de `generate`. Um módulo de capacidades traduz a versão em flags de recurso (ex.: casts como método, rotas de API no `bootstrap/app.php`) consultadas pelos templates. O resumo mostra a versão usada e de onde ela veio.

**Bloqueado por:**

- [02 — CLI `crudmaker generate`](../fase-1-usavel/02-cli-generate.md)
- [07 — Migrar os geradores para templates](../fase-2-bugs/07-migrar-para-templates.md)
- [06 — Gerar as rotas](../fase-1-usavel/06-gerar-rotas.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Snapshots rodando para Laravel 10, 11 e 12.
- [ ] Testes da resolução de versão com `composer.json`/`composer.lock` de exemplo.
- [ ] Inclusão das rotas no lugar certo para cada versão.
- [ ] Versão não suportada falha com mensagem clara.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
