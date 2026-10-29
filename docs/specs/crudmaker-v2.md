---
status: done
---

# crudmaker v2 — gerador de API Laravel a partir de manifest

## Problem Statement

O crudmaker gera uma API Laravel (Model, Migration, Controller, Request, Resource, Collection) a partir de um manifest que descreve entidades, campos e relacionamentos. A ideia é boa — o manifest é 15–30x menor que o PHP que ele gera, o que economiza muito tempo e tokens quando uma IA participa do desenvolvimento — mas o projeto parou num estado em que não dá para usar no dia a dia:

- O caminho do manifest está fixo no código; para gerar outro projeto é preciso editar o fonte.
- A saída vai sempre para uma pasta dentro do próprio crudmaker, não para o projeto Laravel de verdade.
- Não gera rotas, então a API gerada não funciona sem trabalho manual.
- O manifest é validado com checagens manuais que dão mensagens pobres, e não existe um formato formal que um editor ou uma IA possam usar como referência.
- O código gerado tem bugs (status HTTP errados, regra `unique` que nunca falha na edição, foreign keys com nome de tabela errado, ordem de migrations não determinística, casts incompletos, factory referenciada mas não gerada, erros mascarados como 500, listagem sem paginação).
- Regerar sobrescreve qualquer customização feita à mão nos arquivos gerados.
- Os geradores montam PHP concatenando strings linha a linha, o que torna o código gerado difícil de ler, ajustar e customizar.
- Não há nenhum teste: qualquer mudança no gerador pode quebrar a saída sem ninguém perceber.
- O PHP gerado segue convenções antigas do Laravel (sem tipos de retorno, `$casts` como propriedade, enum como lista de strings) e não leva em conta a versão do Laravel/PHP do projeto de destino. Entre versões mudam a estrutura do esqueleto (ex.: `bootstrap/app.php` e `routes/api.php` opcional no Laravel 11+), a forma de declarar casts e os recursos de PHP disponíveis.
- O gerador só escreve os arquivos das entidades. O projeto Laravel em volta (composer.json, vendor, `.env`, instalação da API) precisa ser criado e configurado à mão antes.

## Solution

Uma CLI `crudmaker` que lê um manifest em YAML ou JSON, valida contra um schema formal e escreve uma API Laravel funcional direto no projeto de destino — incluindo rotas, enums, factories e testes — no padrão da versão de Laravel/PHP daquele projeto, de forma que seja seguro regerar a qualquer momento sem perder código escrito à mão. Se o projeto ainda não existe, a CLI cria o esqueleto Laravel rodando o ferramental oficial (composer e artisan) dentro de containers Docker, sem exigir PHP nem composer instalados na máquina, e já entrega o projeto pronto para subir com Docker.

O fluxo do ponto de vista do desenvolvedor:

1. Escreve (ou pede para a IA escrever) um `manifest.yaml` com as entidades.
2. Roda `crudmaker new minha-api manifest.yaml` para um projeto novo, ou `crudmaker generate manifest.yaml --out ~/projetos/minha-api` para um projeto existente.
3. Recebe o projeto Laravel instalado (num projeto novo) e migrations, models, enums, requests, resources, controllers, rotas, factories e testes no padrão da versão do projeto.
4. Escreve regra de negócio nas classes finais (que o gerador nunca sobrescreve).
5. Quando o manifest muda, regera; a camada gerada é atualizada, as customizações ficam intactas e as mudanças de schema viram migrations de alteração.

## User Stories

### CLI e entrada

1. Como desenvolvedor, quero rodar `crudmaker generate <manifest>`, para não precisar editar o código do gerador a cada projeto.
2. Como desenvolvedor, quero informar o diretório de saída com `--out`, para gerar direto dentro do meu projeto Laravel.
3. Como desenvolvedor, quero que o diretório de saída padrão seja o diretório atual, para rodar o comando de dentro do projeto sem argumentos extras.
4. Como desenvolvedor, quero escrever o manifest em YAML, para ter um arquivo mais enxuto, com comentários e sem erros de vírgula/aspas.
5. Como desenvolvedor, quero continuar podendo usar JSON, para não precisar converter os manifests antigos.
6. Como desenvolvedor, quero que o formato seja detectado pela extensão do arquivo, para não precisar passar flag de formato.
7. Como desenvolvedor, quero um modo `--dry-run` que lista os arquivos que seriam criados, alterados ou mantidos sem escrever nada, para revisar antes de aplicar.
8. Como desenvolvedor, quero ver no fim da execução um resumo (criados / sobrescritos / preservados), para saber exatamente o que mudou.
9. Como desenvolvedor, quero instalar e rodar o crudmaker via `npx`, para usar em qualquer máquina sem clonar o repositório.
10. Como desenvolvedor, quero um comando `crudmaker init` que cria um manifest de exemplo comentado, para começar um projeto novo rápido.

### Versão do Laravel/PHP

11. Como desenvolvedor, quero que o gerador detecte a versão do Laravel e do PHP pelo `composer.json` (e `composer.lock`, se existir) do projeto de destino, para o código gerado bater com o projeto sem eu configurar nada.
12. Como desenvolvedor, quero poder fixar a versão no manifest ou por flag (`--laravel 11 --php 8.2`), para gerar para um projeto que ainda não existe ou forçar uma versão.
13. Como desenvolvedor, quero que a versão informada explicitamente tenha prioridade sobre a detectada, e que um aviso apareça quando as duas divergem.
14. Como desenvolvedor, quero um erro claro quando a versão do projeto não é suportada, em vez de um código gerado que não funciona.
15. Como desenvolvedor, quero que os recursos de PHP usados no código gerado respeitem a versão de PHP do projeto (ex.: backed enums só com PHP 8.1+), para o código sempre rodar.
16. Como desenvolvedor, quero que a estrutura do projeto siga a versão (ex.: registro de rotas de API e `bootstrap/app.php` no Laravel 11+, `RouteServiceProvider` no Laravel 10), para o gerador integrar as rotas no lugar certo.
17. Como desenvolvedor, quero ver no resumo da execução qual versão foi usada e de onde ela veio (detectada, manifest ou flag).

### Scaffold do projeto

18. Como desenvolvedor, quero rodar `crudmaker new <diretório> <manifest>` para criar um projeto Laravel do zero já com as entidades geradas.
19. Como desenvolvedor, quero que o scaffold rode o `composer create-project laravel/laravel` dentro de um container Docker com a versão de PHP alvo, para não precisar de PHP nem composer na máquina e para o projeto ser criado com o PHP certo.
20. Como desenvolvedor, quero que o scaffold instale a versão do Laravel pedida no manifest ou por flag, e que a imagem de PHP usada seja compatível com ela, para poder criar projetos em versões diferentes.
21. Como desenvolvedor, quero que os comandos artisan do scaffold (ex.: `php artisan install:api` no Laravel 11+) também rodem no container, para as rotas de API funcionarem logo.
22. Como desenvolvedor, quero que pacotes de que o código gerado depende (ex.: Pest, para os testes gerados) sejam instalados pelo composer durante o scaffold, para a suíte rodar sem passos extras.
23. Como desenvolvedor, quero que `crudmaker new` falhe sem tocar em nada se o diretório já existir e não estiver vazio, para não estragar um projeto existente.
24. Como desenvolvedor, quero um erro claro quando o Docker não estiver instalado ou o daemon não estiver rodando.
25. Como desenvolvedor, quero ver a saída dos comandos rodados nos containers durante o scaffold, para acompanhar e entender falhas.
26. Como desenvolvedor, quero que os arquivos criados pelo container pertençam ao meu usuário, e não ao root, para editar o projeto sem `sudo`.
27. Como desenvolvedor, quero que o projeto criado já venha com o Laravel Sail configurado (com o banco escolhido por flag, MySQL por padrão), para subir a API com `sail up`, rodar `sail artisan migrate` e testar os endpoints gerados na hora.
28. Como desenvolvedor, quero uma flag para pular o scaffold e só gerar (o `generate` normal), para usar em projetos que já existem.

### Validação e schema do manifest

29. Como desenvolvedor, quero que o manifest seja validado contra um schema antes de gerar qualquer coisa, para nunca obter uma saída parcial ou quebrada.
30. Como desenvolvedor, quero mensagens de erro com o caminho exato do problema (ex.: `entities.client.fields.email.type`), para corrigir rápido.
31. Como desenvolvedor, quero um erro quando um relacionamento aponta para uma entidade que não existe, para pegar erros de digitação.
32. Como desenvolvedor, quero um erro quando um enum não tem itens, para não gerar uma coluna inválida.
33. Como desenvolvedor, quero que o JSON Schema do manifest seja publicado junto com a ferramenta, para ter autocomplete e validação no VS Code tanto em YAML quanto em JSON.
34. Como desenvolvedor usando IA, quero poder entregar o schema e um exemplo para a IA, para ela escrever manifests válidos gastando poucos tokens.
35. Como desenvolvedor, quero continuar usando a forma curta de campo (`name: string`) e a forma longa (`{ type, required, unique, ... }`), para escrever só o necessário.
36. Como desenvolvedor, quero continuar usando os aliases existentes (`int`, `displayName`), para não quebrar manifests antigos.

### Normalização de nomes

37. Como desenvolvedor, quero que nomes de entidade fora da convenção sejam normalizados automaticamente para o singular em camelCase (ex.: `awards` → `award`, `drawn_numbers` → `drawnNumber`, `PlayerInvite` → `playerInvite`), para gerar `Award`/`awards` em vez de `Awards`/`awards` sem precisar reescrever o manifest.
38. Como desenvolvedor, quero que as referências a entidades nos relacionamentos sejam normalizadas do mesmo jeito, para `hasMany: [awards]` continuar apontando para a entidade `award`.
39. Como desenvolvedor, quero que nomes de campo sejam normalizados para snake_case (ex.: `alertDate` → `alert_date`), para as colunas seguirem a convenção do Laravel.
40. Como desenvolvedor, quero que campos de FK declarados à mão e também derivados de um `belongsTo` (ex.: `game_id` + `belongsTo: [game]`) sejam unificados sem aviso de conflito, para manifests antigos continuarem funcionando.
41. Como desenvolvedor, quero ver um aviso para cada nome alterado (`pkg.entities.awards → award`), para saber o que o gerador mudou e poder corrigir o manifest se quiser.
42. Como desenvolvedor, quero um erro quando duas entidades ou dois campos viram o mesmo nome depois de normalizados (ex.: `card` e `cards`), em vez de um sobrescrever o outro.
43. Como desenvolvedor, quero desligar a normalização no manifest (`pkg.normalizeNames: false`), para que todo mundo que gera a partir do mesmo manifest obtenha a mesma saída.
44. Como desenvolvedor, quero poder ligar ou desligar a normalização por flag na CLI (`--normalize-names` / `--no-normalize-names`), com prioridade sobre o manifest, para testar os dois jeitos sem editar o arquivo.
45. Como desenvolvedor, quero que o manifest-lock registre os nomes já normalizados, para ver exatamente o que foi gerado.

### Migrations

46. Como desenvolvedor, quero uma migration de criação por entidade, com os tipos de coluna correspondentes aos tipos do manifest.
47. Como desenvolvedor, quero que as migrations sejam ordenadas pela dependência de foreign keys, para o `migrate` não falhar porque a tabela referenciada ainda não existe.
48. Como desenvolvedor, quero que o nome da tabela referenciada pela foreign key esteja sempre em snake_case plural (ex.: `orderItem` → `order_items`), para a FK apontar para a tabela certa.
49. Como desenvolvedor, quero que regerar sem mudanças no schema não crie migrations novas nem renomeie as existentes.
50. Como desenvolvedor, quero que adicionar, remover ou alterar um campo num manifest já gerado crie uma migration de alteração, para não precisar recriar a tabela nem perder dados.
51. Como desenvolvedor, quero que o manifest-lock registre o estado do schema da última geração, para o gerador conseguir calcular a diferença.
52. Como desenvolvedor, quero que campos enum usem a primeira opção como default, como já acontece hoje (ou um `default` explícito, se informado).

### Models e enums

53. Como desenvolvedor, quero uma Model por entidade, com UUID, soft deletes e `$fillable` corretos.
54. Como desenvolvedor, quero casts para todos os tipos que precisam (boolean, json, date, datetime, double, enum), usando o método `casts()` do Laravel moderno.
55. Como desenvolvedor, quero que cada campo enum gere um PHP backed enum próprio, para ter tipagem e reutilizar os valores no código.
56. Como desenvolvedor, quero que a model faça cast do campo enum para o enum gerado.
57. Como desenvolvedor, quero métodos de relacionamento (belongsTo, hasOne, hasMany) com tipos de retorno, inclusive quando o nome da FK difere do nome da entidade.

### Requests

58. Como desenvolvedor, quero uma FormRequest por entidade com regras derivadas dos tipos e da obrigatoriedade dos campos.
59. Como desenvolvedor, quero que a regra `unique` ignore o próprio registro pelo `id` na edição, para a validação falhar de verdade quando existe duplicata em outro registro.
60. Como desenvolvedor, quero que campos enum sejam validados com `Rule::enum()` usando o enum gerado.
61. Como desenvolvedor, quero que FKs de belongsTo sejam validadas com `exists` na tabela referenciada.

### Resources e controllers

62. Como desenvolvedor, quero Resource e Collection por entidade.
63. Como desenvolvedor, quero que o `index` seja paginado, para a API não carregar a tabela inteira.
64. Como desenvolvedor, quero que o `update` responda 200, para seguir a semântica HTTP.
65. Como desenvolvedor, quero que o `destroy` responda 204 sem corpo, para seguir a semântica HTTP.
66. Como desenvolvedor, quero que os controllers não envolvam tudo em try/catch que relança como 500, para que 404, 422 e 403 cheguem ao cliente com o status certo via handler do Laravel.
67. Como desenvolvedor, quero manter um formato de resposta consistente entre as actions (envelope com `data`, e `message` nas escritas).

### Rotas e relacionamentos

68. Como desenvolvedor, quero que as rotas `apiResource` de todas as entidades sejam geradas, para a API funcionar logo após `migrate`.
69. Como desenvolvedor, quero que as rotas geradas fiquem num arquivo próprio incluído pelo `routes/api.php`, para o gerador nunca mexer nas rotas que eu escrevi.
70. Como desenvolvedor, quero rotas e controllers aninhados para relacionamentos hasMany/hasOne (ex.: `GET /clients/{client}/alerts`), para consultar filhos sem filtro manual.

### Factories, seeders e testes gerados

71. Como desenvolvedor, quero uma Factory por entidade, com valores fake coerentes com o tipo de cada campo, para o `HasFactory` funcionar.
72. Como desenvolvedor, quero que a factory crie automaticamente os registros pais de belongsTo.
73. Como desenvolvedor, quero um Seeder por entidade (opcional via flag), para popular o banco de desenvolvimento.
74. Como desenvolvedor, quero testes Pest gerados para cada endpoint CRUD, para saber logo de cara se a API gerada funciona no meu projeto.

### Customização: três camadas

75. Como desenvolvedor, quero que a customização siga uma ordem clara — primeiro o manifest, depois os hooks em PHP e, por último, os stubs —, para saber onde colocar cada mudança.

### Customização declarativa no manifest

76. Como desenvolvedor, quero escolher quais actions cada entidade expõe (ex.: só `index` e `show`), para não gerar endpoints que não devem existir.
77. Como desenvolvedor, quero declarar middleware por entidade (ex.: `auth:sanctum`) e um padrão global, para proteger as rotas sem editar PHP.
78. Como desenvolvedor, quero declarar filtros por igualdade no `index` (`?status=active`), para listar com filtro sem escrever query.
79. Como desenvolvedor, quero declarar campos de busca textual (`?search=...`), para ter busca simples gerada.
80. Como desenvolvedor, quero declarar campos ordenáveis e a ordenação padrão (`?sort=-created_at`), para ordenar a listagem pela URL.
81. Como desenvolvedor, quero declarar o tamanho de página padrão do `index`, para controlar a paginação por entidade.
82. Como desenvolvedor, quero declarar relacionamentos carregados por padrão (eager loading) e quais deles aparecem na resource, para evitar N+1 e devolver os dados aninhados.
83. Como desenvolvedor, quero marcar campos como ocultos na resource (ex.: `document`), para não expor dados sensíveis.
84. Como desenvolvedor, quero acrescentar regras de validação por campo (ex.: `max:120`, `email`), além das derivadas do tipo, para validar sem editar a request.
85. Como desenvolvedor, quero declarar valor default por campo, para ele valer na migration e na factory.
86. Como desenvolvedor, quero que o JSON Schema documente todas essas opções, para a IA e o editor saberem o que existe.

### Customização por hooks

87. Como desenvolvedor, quero que cada controller gerado chame hooks em pontos fixos do fluxo (montagem da query do `index`, antes/depois de criar, atualizar e remover), para mudar só o trecho que importa sem reescrever a action inteira.
88. Como desenvolvedor, quero que os hooks `before*` recebam e devolvam os dados validados, para transformar dados (ex.: preencher `user_id` com o usuário logado) antes de gravar.
89. Como desenvolvedor, quero que os hooks `after*` recebam o registro gravado, para disparar efeitos colaterais (e-mail, evento, log) depois de gravar.
90. Como desenvolvedor, quero que a escrita e os hooks em volta dela rodem na mesma transação, para um erro num hook desfazer a gravação.
91. Como desenvolvedor, quero poder barrar uma operação num hook lançando exceção ou usando `abort()`, e ter o status certo na resposta.
92. Como desenvolvedor, quero um hook na request para acrescentar ou trocar regras de validação, e poder sobrescrever o `authorize()`, para ter validação e autorização específicas.
93. Como desenvolvedor, quero um hook na resource para acrescentar campos calculados à resposta.
94. Como desenvolvedor, quero escrever scopes, accessors, eventos de model e relacionamentos extras na model final, para estender a model sem perder o que é gerado.
95. Como desenvolvedor, quero que a classe final venha criada com os hooks disponíveis listados em comentário, para descobrir os hooks sem abrir a classe base.
96. Como desenvolvedor, quero que, se um hook mudar de assinatura numa versão nova do crudmaker, o erro apareça na hora (o PHP acusa a assinatura incompatível) e o changelog explique a mudança.

### Regerar com segurança

97. Como desenvolvedor, quero que o gerador separe uma camada gerada (sempre sobrescrita) de uma camada de customização (criada uma única vez), para poder regerar sem perder regra de negócio.
98. Como desenvolvedor, quero que arquivos da camada de customização nunca sejam sobrescritos, mesmo com `--force`.
99. Como desenvolvedor, quero que os arquivos da camada gerada tenham um cabeçalho avisando que são gerados e não devem ser editados.
100. Como desenvolvedor, quero que remover uma entidade do manifest apague só a camada gerada dela e me avise sobre os arquivos da camada de customização que ficaram órfãos, sem apagá-los.

### Stubs

101. Como mantenedor do crudmaker, quero que cada arquivo gerado venha de um template legível, parecido com o PHP final, para ajustar a saída sem decifrar concatenação de strings.
102. Como desenvolvedor, quero rodar `crudmaker stubs:publish` para copiar os templates embutidos para o meu projeto, para ter um ponto de partida ao customizar o estilo.
103. Como desenvolvedor, quero poder publicar só os stubs que vou mudar (ex.: só o do controller), para continuar recebendo melhorias nos outros.
104. Como desenvolvedor, quero que os stubs do projeto tenham prioridade sobre os embutidos, para mudar o padrão de todos os arquivos de um tipo de uma vez (ex.: o formato da resposta).
105. Como desenvolvedor, quero ser avisado quando um stub embutido mudou desde que eu publiquei o meu, para decidir se incorporo a mudança.

### Qualidade e IA

106. Como mantenedor, quero testes de snapshot da saída a partir de manifests de exemplo, para qualquer mudança no PHP gerado aparecer no diff do teste.
107. Como mantenedor, quero um comando local que valide a sintaxe de todo PHP gerado, para nunca publicar uma versão que gera código que não compila.
108. Como desenvolvedor usando IA, quero um documento curto (formato do manifest + exemplo + comando) para colocar no contexto da IA, para ela alterar o manifest e rodar o gerador em vez de escrever o CRUD em PHP.

## Implementation Decisions

- **Seam único: `generate(manifest) → arquivos`.** O núcleo vira uma função pura que recebe o manifest já parseado (mais o estado do lock anterior, quando existir) e devolve a lista de arquivos a escrever — cada um com caminho relativo, conteúdo e política de escrita (`overwrite` para a camada gerada, `create-once` para a camada de customização). Nenhum gerador toca o disco. A CLI é uma casca fina: lê o arquivo, faz o parse de YAML/JSON, valida, chama `generate`, aplica as políticas de escrita no diretório de saída e imprime o resumo.
- **Pipeline:** parse (YAML/JSON) → validação pelo schema → normalização (formas curtas viram formas longas, aliases são resolvidos, campos de FK e de owner são derivados dos relacionamentos) → modelo normalizado de entidades → renderização por template → lista de arquivos.
- **Schema do manifest** definido uma única vez com zod; o JSON Schema publicado é derivado dele. A normalização que hoje está espalhada no construtor do Manifest passa a ser transformação do schema/normalizador. As regras entre entidades (relacionamento apontando para entidade inexistente) são validadas depois do schema estrutural.
- **Normalização de nomes** é uma etapa do normalizador, depois da validação estrutural e antes da validação entre entidades. Ela fica ligada por padrão. Nomes de entidade (chaves de `pkg.entities` e referências em relacionamentos) viram singular camelCase, usando o mesmo `pluralize`/`change-case` que já define classe e tabela. Nomes de campo viram snake_case, e o `name` explícito de um campo também é normalizado. Cada alteração vira um aviso que `generate` devolve junto com os arquivos (`{ files, warnings }`), e a CLI imprime os avisos no resumo. A função continua pura. Colisões depois da normalização são erro de validação, com o caminho dos dois nomes. Um campo declarado com o mesmo nome da FK derivada de um `belongsTo` é unificado: vale a declaração explícita, completada com `relationship: true`. A normalização é controlada por `pkg.normalizeNames` (padrão `true`) e pela flag da CLI, que tem prioridade. Com ela desligada, os nomes passam como estão, mas os avisos de convenção continuam aparecendo.
- **Compatibilidade do manifest:** a estrutura atual (`system`, `pkg.code`, `pkg.entities`, `fields`, `relationships`) continua aceita, então os manifests de `generated/` servem como fixtures. Campo novo opcional: `default` em enums.
- **Três camadas de customização, em ordem de preferência:** (1) manifest, para o que é declarativo e comum; (2) hooks em PHP nas classes finais, para regra de negócio; (3) stubs, para mudar o padrão de um tipo de arquivo inteiro. Uma customização que der para expressar numa camada anterior não deve exigir a seguinte.
- **Opções declarativas no manifest.** Cada entidade ganha um bloco opcional `api` e os campos ganham propriedades opcionais. Também existe um bloco `pkg.defaults.api`, com os valores que valem para todas as entidades. Tudo é opcional, e um manifest sem esses blocos gera o mesmo CRUD completo de hoje:

  ```yaml
  pkg:
    defaults:
      api:
        middleware: [auth:sanctum]
        perPage: 15
    entities:
      client:
        fields:
          id: uuid
          name: { type: string, rules: [max:120] }
          email: { type: string, unique: true, rules: [email] }
          document: { type: string, hidden: true }
          status: { type: enum, enumItems: [active, blocked], default: active }
        relationships:
          hasMany: [alert]
          hasOne: [address]
        api:
          actions: [index, show, store, update]  # padrão: todas
          middleware: [auth:sanctum, verified]   # substitui o padrão
          perPage: 20
          filters: [status]                      # ?status=active
          search: [name, email]                  # ?search=ana
          sort: [name, created_at]               # ?sort=-name
          defaultSort: -created_at
          with: [address]                        # eager loading + resource aninhada
  ```

  As opções afetam só a camada gerada. Filtros, busca e ordenação são aplicados na query do `index` antes do hook de query. Os nomes em `filters`, `search`, `sort` e `with` são validados contra os campos e relacionamentos da entidade.
- **Hooks.** A classe base gerada declara cada hook como método `protected` que não faz nada (devolve a entrada sem mudança), e as actions o chamam em pontos fixos. A classe final sobrescreve só os hooks de que precisa. Hooks do controller:

  | Hook | Quando roda | Entrada → saída |
  |---|---|---|
  | `indexQuery` | depois dos filtros/busca/ordenação declarados, antes de paginar | `Builder`, `Request` → `Builder` |
  | `beforeStore` | antes de criar | dados validados, `Request` → dados |
  | `afterStore` | depois de criar | model, `Request` → nada |
  | `beforeUpdate` | antes de atualizar | model, dados validados, `Request` → dados |
  | `afterUpdate` | depois de atualizar | model, `Request` → nada |
  | `beforeDestroy` | antes de remover | model, `Request` → nada |
  | `afterDestroy` | depois de remover | model, `Request` → nada |

  `store`, `update` e `destroy` rodam a escrita e os hooks `before*`/`after*` dentro de uma transação. Para barrar a operação, o hook lança exceção ou chama `abort()`, que o handler do Laravel converte no status certo. Na request, `rules()` da base junta as regras geradas com o retorno do hook `extraRules()`, e o `authorize()` pode ser sobrescrito na classe final. Na resource, `toArray()` da base junta os campos gerados com o retorno do hook `extra()`. Na model, não há hooks: a model final usa os mecanismos nativos do Eloquent (scopes, accessors, `booted()`, relacionamentos extras).
- **Camada gerada × camada de customização:** para models, controllers, requests e resources, o gerador escreve uma classe base num namespace dedicado (ex.: `App\Generated\...`), sempre sobrescrita, e uma classe final no namespace normal, que estende a base e é criada só se não existir. A classe final nasce vazia, com um comentário listando os hooks disponíveis. Rotas, controllers, factories e testes referenciam sempre a classe final, para as customizações valerem em todo lugar. Migrations, enums, factories e testes são arquivos únicos, de política `create-once`, exceto quando o lock indica mudança de schema. Quando uma entidade sai do manifest, os arquivos gerados dela são removidos, e os da camada de customização são só listados como órfãos.
- **Templates e stubs:** cada tipo de arquivo vira um template (Eta ou equivalente) com variáveis vindas do modelo normalizado. As classes geradoras atuais (que concatenam strings) são substituídas, não adaptadas. Os templates embutidos ficam na ferramenta, e uma pasta de stubs no projeto de destino tem prioridade arquivo a arquivo, inclusive para variantes por versão. `crudmaker stubs:publish [tipo...]` copia os embutidos para essa pasta. O lock guarda o hash do stub embutido no momento em que ele foi publicado, e a geração avisa quando o embutido mudou desde então. Stubs só mudam a camada gerada; os hooks continuam sendo o lugar da regra de negócio.
- **Rotas:** um arquivo de rotas gerado, sempre sobrescrito, incluído uma única vez pelo `routes/api.php` (o gerador adiciona o include se ainda não existir, sem alterar o resto do arquivo).
- **Migrations:** a ordem segue um sort topológico pelas FKs de belongsTo; o timestamp de cada migration é base + índice, de forma determinística. Uma migration existente é reconhecida pelo sufixo do nome do arquivo (como já acontece hoje) e nunca é reescrita. Mudanças de schema em relação ao manifest-lock geram migrations `alter`.
- **manifest-lock** passa a ser a fonte de verdade do último schema gerado (versão do formato, entidades normalizadas e nomes das migrations já emitidas). É entrada de `generate`, para manter a função pura.
- **Versão alvo como entrada de `generate`.** A versão de Laravel e de PHP faz parte da entrada da função (`{ laravel, php }`), junto com o manifest e o lock, para `generate` continuar pura e testável por versão. A resolução da versão fica na CLI, nesta ordem de prioridade: flag → campo opcional `target` no manifest (`target.laravel`, `target.php`) → detecção pelo `composer.json`/`composer.lock` do destino → versão padrão mais recente suportada. A detecção usa a versão instalada do `laravel/framework` no `composer.lock` quando existe, e a restrição do `composer.json` quando não existe.
- **Versões suportadas:** Laravel 10, 11 e 12; PHP 8.1+. Versões fora disso dão erro. A decisão de mudar algo entre versões é por recurso (ex.: "casts como método", "rotas de API via `bootstrap/app.php`"), não por número espalhado nos templates: um módulo único de capacidades traduz `{ laravel, php }` em flags de recurso, e os templates só consultam essas flags. Quando a diferença entre versões for grande demais para uma flag, o template pode ter uma variante por major, com fallback para a variante padrão.
- **Scaffold via Docker.** O crudmaker não guarda cópia do esqueleto Laravel nem exige PHP/composer no host. `crudmaker new` roda tudo em containers efêmeros (`docker run --rm`) com o diretório de destino montado como volume e com o UID/GID do usuário do host, para os arquivos não ficarem com o root como dono. A imagem é escolhida pela versão de PHP alvo, usando as imagens PHP + composer que o próprio Sail usa (`laravelsail/phpXX-composer`), e o PHP é limitado ao intervalo que a versão de Laravel aceita. Sequência: `composer create-project laravel/laravel:<versão>` → passos de instalação da versão (`php artisan install:api` no 11+) → `composer require --dev` das dependências do código gerado (Pest) → `php artisan sail:install --with=<banco>` → fluxo normal do `generate`. A CLI só fala com Docker por um executor de comandos injetável, para testar a sequência e os argumentos dos comandos sem rodar container nenhum.
- **Estilo do PHP gerado:** tipos de retorno, `casts()` no Laravel 11+ (propriedade `$casts` no 10), backed enums e `Rule::enum`. Testes gerados usam Pest.
- **Controllers:** sem try/catch genérico; `index` paginado; `store` 201; `show` 200; `update` 200; `destroy` 204 sem corpo. O envelope de resposta atual (`data` / `message`) é mantido nas respostas com corpo.
- **Runtime da ferramenta:** `tsx` no lugar de `ts-node`; binário `crudmaker` declarado no package.json para uso via `npx`.
- **Targets plugáveis, pensando na v3.** A saída é organizada como um "target" (`laravel-api` é o único na v2). Um target recebe o modelo normalizado de entidades e a versão alvo e devolve arquivos. O modelo normalizado não pode conter nada específico de PHP/Laravel, para que a v3 adicione targets (Inertia, Filament, Next.js) sem mexer no parse, na validação nem na normalização.
- **Remoção de código morto:** o FileWriter não usado, o ObserverFile, os arquivos vazios de controller de relacionamento e o controller Inertia saem; observers e Inertia ficam fora do escopo (ver abaixo).

## Testing Decisions

- **O que é um bom teste aqui:** só comportamento externo — dado um manifest (e, opcionalmente, um lock), quais arquivos saem e com qual conteúdo. Nada de testar métodos internos de normalização ou de renderização; se a saída está certa, o interior está certo.
- **Seam principal — `generate`:** testes de snapshot com vitest. Fixtures: os três manifests que já existem em `generated/` (bingo, curso, vende-que-vende-api) mais manifests pequenos focados em um caso cada (enum, FK com nome customizado, entidade camelCase, owned/morphed, hasMany aninhado). Os snapshots cobrem a lista de caminhos e o conteúdo de cada arquivo.
- **Testes de asserção explícita sobre `generate`** para os bugs corrigidos, para não depender só de alguém ler o diff de snapshot: status do `update`/`destroy`, `ignore` por id na regra `unique`, nome da tabela da FK em snake_case, ordem das migrations, casts presentes, factory gerada.
- **Opções do manifest:** fixtures com o bloco `api` e as propriedades novas de campo, e snapshots cobrindo actions restritas, middleware, filtros/busca/ordenação, `with`, `hidden`, `rules` e `default`. Manifests inválidos (filtro em campo inexistente, `with` em relacionamento inexistente) entram nos testes de validação.
- **Hooks e stubs:** snapshots da classe base (chamadas dos hooks, transação) e da classe final inicial. Teste de que um stub do projeto substitui o embutido só para o tipo publicado e de que o aviso aparece quando o hash do embutido muda.
- **Versões:** os snapshots principais rodam para cada versão suportada (Laravel 10, 11 e 12), passando a versão como entrada de `generate`. Assim, a diferença entre versões aparece no próprio snapshot. Há testes da resolução de versão (prioridade entre flag, manifest e composer, além do aviso de divergência) com `composer.json`/`composer.lock` de exemplo.
- **Scaffold:** testes da CLI com o executor de comandos falso, conferindo a imagem escolhida por versão de PHP, a versão de Laravel passada ao composer, o UID/GID e o volume, os passos pós-instalação por versão, o `sail:install` com o banco certo, a recusa em diretório não vazio e o erro quando o Docker não está disponível. Um teste de ponta a ponta com Docker de verdade fica opcional, fora do `npm test` padrão.
- **Validação:** testes chamando `generate` (ou a etapa de validação exposta pela mesma entrada) com manifests inválidos, conferindo a mensagem e o caminho do erro.
- **Regeração:** testes passando um lock anterior para `generate` e verificando que nenhuma migration nova sai quando nada mudou e que uma migration `alter` sai quando um campo muda.
- **CLI:** um ou dois testes de integração num diretório temporário: gera uma vez, implementa um hook na classe final, gera de novo e confere que a edição sobreviveu e que a camada gerada foi atualizada. Também confere que remover uma entidade apaga só a camada gerada dela.
- **Sintaxe:** além dos testes, um comando local roda `php -l` em todos os arquivos gerados a partir das fixtures. Não há CI no GitHub.
- **Prior art:** o projeto não tem testes hoje; esta spec estabelece o padrão.

## Out of Scope

- Importar ou exportar OpenAPI (fica como evolução futura; o schema do manifest facilita isso depois).
- Inertia, Filament, Next.js e qualquer geração de frontend ou painel: ficam para a v3 (ver Further Notes). A v2 só prepara a arquitetura de targets.
- Laravel anterior ao 10 e PHP anterior ao 8.1.
- Manter uma cópia própria do esqueleto Laravel (o scaffold é sempre delegado ao composer oficial, rodando em Docker).
- Rodar o scaffold sem Docker (PHP e composer locais). Pode entrar depois como fallback, se fizer falta.
- O Docker de produção. O Sail é para o ambiente de desenvolvimento.
- Observers.
- Autenticação, policies e autorização (o `authorize()` gerado continua liberando tudo; a customização fica na camada do usuário).
- Multi-tenancy (conexão `tenant` comentada hoje na model).
- Relacionamentos many-to-many com tabela pivô e relacionamentos polimórficos além do que o normalizador já deriva (`owner_id`/`owner_class`).
- CI no GitHub. Toda verificação é local, inclusive subir um Laravel real para rodar `migrate` e os testes Pest gerados.

## Further Notes

- **Ordem sugerida de implementação:** (1) seam `generate` + CLI + YAML + schema + testes de snapshot com as fixtures atuais, capturando a saída de hoje; (2) migração para templates, mantendo os snapshots iguais; (3) versão alvo como entrada + módulo de capacidades + detecção pelo composer; (4) correção dos bugs, com os snapshots mudando de forma intencional; (5) rotas, enums e casts, já respeitando a versão; (6) `crudmaker new` com scaffold via Docker + Sail; (7) camada gerada × customização com hooks, e depois as opções declarativas do manifest e os stubs publicáveis; (8) migrations de alteração via lock; (9) factories, seeders, testes Pest e rotas aninhadas; (10) documento para IA.
- **v3 (fora desta spec):** novos targets sobre o mesmo manifest. Inertia, com páginas de CRUD sobre os controllers gerados; Filament, com Resources de painel admin a partir das entidades; Next.js, com um front separado consumindo a API gerada (cliente tipado, páginas de listagem e formulário). Cada um vira uma spec própria quando a v2 estiver pronta. O manifest provavelmente vai precisar de metadados de UI (rótulos, campo de exibição, ordem, visibilidade em listagem e formulário); a v2 não os define, mas o schema deve aceitar extensões futuras sem quebrar manifests existentes.
- Capturar os snapshots antes da migração para templates garante que a troca de implementação não muda a saída sem intenção.
- Motivação de custo: nos projetos existentes o manifest tem 1,8–3,4 KB e o PHP gerado tem 47–73 KB. Escrever o manifest em vez do PHP sai cerca de 15–30x mais barato em tokens, e a geração é determinística.
- O TODO antigo do README saiu; as ideias que não viraram ticket estão na seção "Ideias futuras" do README.
