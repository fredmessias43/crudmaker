# crudmaker

## TODO

### feito
- [x] ler manifesto do arquivo
- [x] mudar o nome do ManifestObject pra manifestEntity
- [x] processar o manifest e deixar no padrão
- [x] ler code do manifest e colocar no namespace
- [x] gerar manifest-lock.json
- [x] criar observer
  - [x] arranjar um jeito de registrar os observer
- [x] PhpFile usar o trait e escrever nos arquivos
- [x] arranjar um jeito da classe da migration ser diferente

### não previsto
- [ ] poder ler manifesto do open api
  - [ ] ou gerar um manifesto open api
- [ ] gerar versões levando em conta o manifest-lock
  - [ ] gerando alter_table
- [ ] ver se é melhor mudar o write file pra uma classe
  - [x] pensar se é possivel instanciar dinamicamente por essa classe
  - [ ] criar factory para os criadores de arquivos para receber serviços especificos de criador, validador ...
- [ ] colocar cada um em uma pasta especifica

### imediato
- [ ] arquivo de rotas
- [ ] levar em conta o relationship
  - [ ] talvez alterar o modo ou sendo `belongsTo.0.model` ou `model.type.belongsTo`
  - [ ] não precisar colocar o campo _id
  - [ ] poder ser nullable
  - [ ] criar funcoes de relacionamento na model
  - [ ] criar rotas de relacionamento
  - [ ] criar controller de relactionamento
- [ ] quando for enum criar um arquivo de enum e validar na request