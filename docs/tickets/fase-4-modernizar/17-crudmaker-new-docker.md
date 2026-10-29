# 17 — `crudmaker new` via Docker + Sail

**Fase:** Fase 4 — Modernizar e ampliar

**O que construir:** O desenvolvedor cria um projeto do zero com `crudmaker new <dir> <manifest>`, sem PHP nem composer na máquina. Tudo roda em containers efêmeros (imagem `laravelsail/phpXX-composer` escolhida pela versão de PHP), com o diretório montado e o UID/GID do usuário: `composer create-project laravel/laravel:<versão>` → `install:api` (11+) → `composer require --dev` do Pest → `sail:install --with=<banco>` (MySQL por padrão) → geração. A saída dos comandos aparece em tempo real. Diretório existente e não vazio é recusado sem tocar em nada, e a ausência do Docker dá erro claro.

**Bloqueado por:**

- [15 — Versão alvo do Laravel/PHP](../fase-4-modernizar/15-versao-alvo.md)
- [06 — Gerar as rotas](../fase-1-usavel/06-gerar-rotas.md)

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes com executor de comandos falso: imagem por versão de PHP, versão do Laravel, UID/GID, volume, passos por versão, banco do Sail.
- [ ] Testes da recusa em diretório não vazio e do erro sem Docker.
- [ ] Teste de ponta a ponta opcional, com Docker de verdade, fora do CI padrão.
- [ ] Em execução manual, `sail up` e `sail artisan migrate` funcionam e os endpoints respondem.
- [ ] Os `docs/` afetados (e o `CLAUDE.md`, se mudar comando ou estrutura) estão atualizados.
