# 24 — Não sobrescrever arquivos do esqueleto do Laravel (entidade `user`)

**Fase:** Fase 4 — Modernizar e ampliar

**O que construir:** Uma entidade que coincide com algo do esqueleto oficial do Laravel, como `user` (tabela `users`, model `App\Models\User`, `UserFactory`), não pode estragar o projeto. Hoje o reaproveitamento de migration por sufixo encontra `0001_01_01_000000_create_users_table.php` do esqueleto e o reescreve, e com isso somem `password`, `remember_token`, `email_verified_at` e as tabelas `password_reset_tokens`/`sessions`. Regra geral: o crudmaker só sobrescreve arquivos que ele mesmo gerou, reconhecidos pelo lock ou pelo cabeçalho de gerado. Uma migration de criação existente que não é dele nunca é reescrita. A tabela é tratada como "já existente", e as colunas do manifest que faltam vão para uma migration `alter`. Para descobrir as colunas existentes, use as colunas conhecidas do esqueleto para `users` e documente a limitação para outras tabelas. Para a entidade `user`, a model base estende `Illuminate\Foundation\Auth\User` (Authenticatable), com `Notifiable`, preservando `password`/`remember_token` em `$hidden` e o cast `hashed` de `password`. Assim o `App\Models\User` do esqueleto pode passar a estender a base, e há instrução de migração para isso. Arquivos do esqueleto que o crudmaker geraria (model final, factory do ticket 18) seguem `create-once` e só recebem aviso.

**Bloqueado por:**

- [17 — `crudmaker new` via Docker + Sail](17-crudmaker-new-docker.md)

**Status:** done

## Critérios de aceite

- [x] Gerar num projeto com o esqueleto padrão (Laravel 10, 11 e 12) e uma entidade `user` não altera nenhuma migration do esqueleto. As colunas extras do manifest saem numa migration `alter_users_table`.
- [x] Uma migration de criação existente sem cabeçalho de gerado e fora do lock nunca é reescrita, para qualquer tabela, com aviso.
- [x] A model base de `user` estende Authenticatable, e a final do esqueleto recebe instrução de migração no aviso.
- [x] Teste de ponta a ponta opcional (`CRUDMAKER_E2E=1`) com `crudmaker new` e um manifest com `user`: o `migrate` roda e o login padrão do esqueleto continua possível (colunas de auth intactas).
- [x] Docs atualizados (`docs/como-usar.md`, "Solução de problemas" e entidade `user`).
