# crudmaker

Gerador de API Laravel a partir de um manifest JSON: lê entidades, campos e relacionamentos e escreve Model, Migration, Controller, Request, Resource e Collection. Escrito em TypeScript, roda com `ts-node`.

## Comandos

- `npm install`
- `npm run dev`: gera os arquivos. O caminho do manifest está fixo em `src/main.ts`.
- `npx tsc --noEmit`: checagem de tipos. Hoje acusa 2 erros, ambos no `InertiaControllerFile`, que não é usado. Ainda não há testes nem lint.

## Onde está cada coisa

- `src/main.ts`: orquestra a geração (manifest → lock → geradores por entidade).
- `src/models/Manifest.ts`: validação e normalização do manifest.
- `src/models/Entity.ts`: nome da entidade em vários casings e nome da tabela.
- `src/fileCreators/PhpFile.ts`: classe base dos geradores (casca do arquivo PHP e escrita no disco).
- `src/fileCreators/*File.ts`: um gerador por tipo de arquivo PHP.
- `generated/<pkg.code>/`: saída. Está no `.gitignore` e costuma conter projetos Laravel reais (com código escrito à mão).

## Documentação

- `docs/como-usar.md`: fluxo atual de uso e passos manuais.
- `docs/manifest.md`: referência do formato do manifest e limitações conhecidas.
- `docs/arquitetura.md`: módulos e fluxo interno.
- `docs/specs/crudmaker-v2.md`: spec da reestruturação planejada (CLI, YAML, schema, templates, testes). Siga a ordem de implementação que está nela.

Atualize os docs quando mudar o comportamento do gerador ou o formato do manifest.

## Convenções

- Os geradores montam PHP como arrays de linhas (`result.push(...)`), indentados com `this.tab` (`\t`) e unidos por `this.lineBreak`. Siga esse padrão até a migração para templates prevista na spec.
- O namespace base é sempre `App`, e a pasta de saída é derivada do namespace (`App\Http\...` → `app/Http/...`).
- Os nomes de entidade no manifest ficam no singular; tabela = snake_case plural.
- Documentação e comunicação em português.

## Cuidados

- **`npm run dev` sobrescreve arquivos em `generated/<pkg>/` sem perguntar**, inclusive edições feitas à mão. Antes de rodar, confira qual manifest o `main.ts` aponta e se a pasta de destino tem código que não pode ser perdido.
- Não apague nem limpe `generated/`. Ela não está versionada aqui, então não dá para recuperar.
