# Vigência dos modelos de Escala e Soltura

## Solicitação de 03/11/2026

Alterações de modelos devem valer a partir da data da alteração, sem mudar
folhas já feitas ou datas passadas. Folhas iniciadas, inclusive futuras,
continuam usando sua fotografia original. Exceções por data mantêm prioridade.

## Situação observada

Escala diária guarda `programacao` ao iniciar; Soltura guarda suas viagens na
folha. Essas fotografias já prevalecem sobre o modelo atual. Registros antigos
sem fotografia conservam o tratamento de compatibilidade existente.

`trafego_modelo`, entretanto, mantém apenas a última versão por contexto.
Uma consulta sem folha salva pode aplicar essa versão a uma data anterior.
É necessário resolver o modelo vigente na data consultada, preservando versões.

## Schema aprovado pelo usuário e implementado — 03/11/2026

Adicionar `TrafegoModeloVersao`, tabela `trafego_modelo_versao`, sem remover
ou alterar a chave de `trafego_modelo`:

| Campo | Tipo / finalidade |
| --- | --- |
| id | INT IDENTITY, chave primária |
| modelo_id | INT, referência ao modelo recorrente |
| revisao | INT, revisão original do modelo |
| vigente_desde | NVARCHAR(10), data civil AAAA-MM-DD em America/Campo_Grande |
| nome | NVARCHAR(150), nome nessa revisão |
| conteudo | NVARCHAR(MAX), cópia integral das linhas em JSON |
| responsavel_id | INT, autor da revisão |
| created_at | DATETIME2, instante UTC da gravação |

Unicidade por modelo/revisão; índice por modelo/vigente_desde/revisão.
Salvar o modelo atual e sua versão na mesma transação, com concorrência por
revisão. Preservar todas as revisões, inclusive várias no mesmo dia. Para uma
data sem folha, escolher a maior vigência não posterior à data consultada e,
em empate, a maior revisão. Alterações do mesmo dia afetam apenas folhas ainda
não iniciadas. Datas sem versão aplicável usam o padrão JSON de compatibilidade.

Na primeira gravação após implantação, preservar também o modelo preexistente,
caso ainda não tenha versão, com a data de seu `updated_at` no fuso operacional.
Não atribuir sua versão atual a datas anteriores à última gravação conhecida.
Versões sobrescritas antes deste recurso não podem ser recuperadas a partir
de `trafego_modelo`; fotografias existentes não devem ser reconstruídas.

## Implementação

1. Preparar Prisma e SQL da nova tabela, sem executar SQL nem acessar banco.
2. Implementar gravação transacional das versões e resolução por vigência.
3. Manter fotografias e exceções existentes; registrar a vigência no editor.
4. Testar datas anteriores/atuais/futuras, múltiplas revisões, concorrência e
   preservação de folhas iniciadas, com persistência simulada e sem rede.

Implementados o schema, o histórico transacional e a resolução por vigência.
SQL preparado em `../sql/2026-11-03-trafego-modelo-versao.sql`, sem execução.
Aplicar após `trafego_modelo`, antes de publicar a API; gerar o cliente Prisma
no build. Não publicar somente o frontend: a vigência é garantida no backend.
Datas são calculadas pelo servidor, sem aceitar vigência retroativa do cliente.
Uma virada de data durante a transação cancela integralmente a gravação.
Falha na gravação do histórico também desfaz a atualização do modelo.

Consultas não criam versões nem alteram folhas. A versão preexistente é
preservada apenas no primeiro comando de edição. A tabela não tem exclusão
em cascata. Fotos antigas sem programação continuam com a compatibilidade
anterior, sem reconstrução artificial. Essa limitação também vale para versões
de modelos já sobrescritas antes da implantação.

## Validação local

113 testes passaram nas suítes de programação/editor/bases, edição de linhas,
Escala diária, programação e ciclo da Soltura e Soltura independente, com rede
bloqueada e persistência simulada. Cobrem vigência, desempate por revisão,
preservação do modelo anterior, fuso horário, rollback e fotografias finalizadas.
Build TypeScript da API e typecheck do frontend passaram. Cliente Prisma
gerado localmente, sem migrations ou consultas ao banco. O SQL não foi executado
nem validado contra SQL Server; implantação continua pendente no ambiente alvo.
