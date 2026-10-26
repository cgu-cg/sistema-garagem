# Arquitetura de dados atual

## CI: regularizacao sequencial - 26/10/2026

Script: `scripts/sql/ci-regularizacao-provisionamento.sql`. Parametros
obrigatorios: ServidorEsperado, BancoEsperado e Aplicar (0 para precheck,
1 para aplicar); executa somente no destino correspondente. DDL aditivo,
transacional e repetivel, sem atualizar ou copiar registros operacionais.

Aplicado em 26/10/2026 no destino explicitamente tratado nesta tarefa,
SRV-BD02 / garagem. Precheck aprovado; tres colunas opcionais, duas FKs e
dois CHECKs confirmados ativos e confiaveis em sys.columns/foreign_keys/
check_constraints. Consulta dos campos/relacoes pelo Prisma Client validada
sem gravar dados. Nao houve backfill, copia ou finalizacao de CIs reais.

Adiciona a dbo.folha_ci tres colunas opcionais:
- regularizacao_iniciada_em datetime2(3): instante real da entrada no modo;
- regularizacao_iniciada_por_id int: FK users(id), autor preservado;
- finalizada_por_id int: FK users(id), autor da finalizacao atual.

CHECK exige instante/autor juntos e finalizador nas regularizacoes finalizadas.
Os status/origens existentes nao mudam. ReferenciaOrigem continua livre para
sua finalidade anterior, sem codificar auditoria em texto. Registros antigos
permanecem NULL, sem backfill ou atribuicao artificial de responsabilidade.
FinalizadaEm/inicializadaEm continuam sendo os instantes reais existentes;
em folha ja aberta, inicializadaEm permanece original e o novo instante
indica quando a regularizacao comecou. O frontend exibe nomes por relacoes
limitadas a id/name; nao retorna emails, senhas ou outros dados de usuario.

Aplicar o SQL antes de disponibilizar o backend com o novo Prisma Client.
Gerar o client e validar schema sao operacoes locais e nao aplicam migrations.
Ver docs/DOMAIN.md para permissoes, sequencia e isolamento da manutencao.

## DATA-001/C4 — Evolução operacional local e ativação manual

### Correção de nulabilidade antes da carga histórica — preparada, não aplicada

`ItemFolhaCI.consorciada` passa a String? / NVARCHAR(10) NULL. O CHECK aceita
NULL nas categorias não bloqueadas e exige VSF/VCG/JTU/VCM em BLOQUEADO;
valores informados nas demais categorias também devem pertencer ao enum.
O teste explícito IS NOT NULL impede aceitação de BLOQUEADO nulo pela lógica
de três valores do SQL Server 2012. EstadoManutencao mantém consorciada obrigatória.

As quatro tabelas foram provisionadas manualmente, conforme informado pelo
responsável; não foram consultadas nesta correção. Para esse baseline, revisar
`scripts/sql/data-001c4-ajuste-item-consorciada-nullable.sql`, SEM reaplicar o
provisionamento: o delta recusa transação externa/IMPLICIT_TRANSACTIONS,
verifica as 23 colunas e o CHECK antigo, bloqueia a tabela, valida dados e
dependências antes de alterar somente coluna/CHECK de consorciada. Não saneia
nem apaga registros; falha desfaz a transação própria. Baseline já atualizado
também é recusado. Após execução separadamente autorizada, rodar a validação
administrativa atualizada e revisar eventuais diferenças textuais de CHECKs.
Nenhum delta foi executado, nenhuma importação foi gerada e C4 não foi ativado.

Motivo/gravidade/status e outros opcionais preservam NULL em API, cópia 03:00
e save/load. Motivo já era nullable no banco; não há contrato confirmado de
obrigatoriedade universal para BLOQUEADO. Consorciada/data do bloqueado e
tipo/ordem do reforço continuam obrigatórios condicionalmente. String vazia
usada em inputs é somente apresentação; não preenche dado histórico ausente.

O baseline da fase 2 abaixo foi evoluído para runtime opt-in. Nenhum banco
foi acessado/provisionado nesta entrega. Schema/script continuam administrativos;
não há migrations nem DDL no startup/controllers. C4 reutiliza CicloOperacional,
FolhaCI, ItemFolhaCI e EstadoManutencao, sem arquitetura paralela.

ItemFolhaCI recebe `dataBloqueio` → `data_bloqueio DATE NULL`, distinto de
FolhaCI.dataFolha. CHECK exige data não nula para BLOQUEADO; no uso normal,
domínio valida data civil válida e não posterior ao dia operacional D, pois
o bloqueio é vigente também no Controle D. Importação histórica normaliza
somente os casos autorizados para 01/10/2026. Consorciada VCM é válida em
folha VCG; nenhuma conversão por prefixo/garagem física. Instantes continuam
DATETIME2(3) UTC e datas civis DATE, sem AT TIME ZONE. Prisma 6.10 não aceita
precisão no atributo DateTime2; o SQL mantém escala 3.

Provisionamento/validação existentes agora descrevem 60 colunas e 18 CHECKs,
com os mesmos 16 índices e sete FKs. Preservados índices filtrados de bloqueio
único por folha/prefixo e posição única de reforço. Script não adapta estrutura
parcial/antiga automaticamente. Se qualquer tabela existir, parar e revisar
metadados/delta administrativo; não reaplicar CREATE nem remover dados.

### Passos posteriores, sujeitos a autorização

1. Manter `CI_NOVO_FLUXO_GARAGENS` vazia e parar escritores/scheduler antes
   de intervenção. Confirmar servidor/banco, versão, permissões e backup.
2. Administrador revisa/executa `scripts/sql/data-001c4-provisionamento.sql`
   somente se as quatro tabelas não existirem. Sessão sem transação externa
   e sem IMPLICIT_TRANSACTIONS; guardas preservam transação do chamador.
3. Executar separadamente `scripts/sql/data-001c4-validacao.sql`; conferir
   todas as colunas, CHECKs, índices filtrados, FKs, defaults e triggers.
   Divergência não autoriza reparo automático. Validar também configuração
   ANSI exigida pelos índices filtrados nas conexões que realizarão DML.
4. Revisar SQL de carga independente das CIs 01–07/10/2026 a partir dos
   Excels oficiais. Cada folha FINALIZADA/IMPORTACAO, sem inferir ciclo anterior;
   registrar origem/responsável, título, posições/horários e data do bloqueio.
   Aplicar fallback histórico autorizado apenas nessa carga. Não inferir
   consorciada do prefixo; preservar 3083/VCM. Essa carga ainda não foi preparada
   com dados oficiais nem executada. Não apagar dados legados automaticamente.
5. Gerar cliente Prisma a partir do schema versionado e construir API/web.
   Na validação local o engine Windows estava bloqueado; cliente foi gerado
   em diretório temporário e copiado preservando DLL de hash idêntico. O deploy
   deve usar a geração normal já existente no Dockerfile, sem esse workaround.
6. Após revisão/carga, configurar **somente** `CI_NOVO_FLUXO_GARAGENS=VCG`
   no ambiente de execução e reiniciar a API. Nenhum .env foi alterado aqui.
   Bootstrap prepara só D/D+1 e recupera evento de hoje; após 18:30 ambos ficam
   somente leitura. Sem folha D finalizada, cria RECUPERACAO vazia: inspecionar
   antes de autorizar operação. VCM permanece desativada salvo configuração.
7. Validar GETs/UX somente leitura e depois testes mutantes controlados
   autorizados: sincronização, liberação, concorrência, limites de horário e
   jobs duplicados contra SQL Server 2012. Testes locais não substituem isso.

Rollback: desabilitar flag/parar API preserva as tabelas C4; retornar ao legado
exige avaliar dados divergentes, pois não existe dual-write. O novo script
`data-001c4-rollback-vazio.sql` só remove estrutura se as quatro tabelas estiverem
vazias, em transação própria e com locks; recusa dados/estrutura parcial e não
apaga registros. Nunca executá-lo automaticamente ou após uso operacional.

Este documento descreve a arquitetura de dados observada no código atual do projeto, com foco em entidades, modelos Prisma, banco principal e integração separada com SQL Server legado.

## Visão geral

O sistema usa o Prisma como camada principal de dados, e o datasource atual do schema observado no código é SQL Server.

Arquivo principal:

- `apps/api/prisma/schema.prisma`

## Datasource principal

No schema observado no código atual, o datasource principal é definido como SQL Server:

```prisma
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}
```

Isso confirma, no código atual analisado, que o banco principal do sistema é SQL Server no datasource do Prisma; não foi identificado no repositório qualquer datasource principal alternativo em produção.

## Modelos principais observados

### User

Modelo `User`:

- `id` (PK)
- `name`
- `email` (único)
- `password`
- `role` com valor padrão `COLABORADOR`
- `garagem` opcional
- `createdAt`, `updatedAt`

Relacionamentos relevantes:

- `abastecimentos`
- `solturas`
- `controlesOperacionais`
- `abastecimentoCarroSessions`
- `groups`
- `reservasTerminais`
- `ciBloqueios`
- `manutencaoCarros`

Observação: o modelo observado no código atual é mais amplo do que a documentação antiga e inclui módulos operacionais e de manutenção.

### Group

Modelo `Group`:

- `id`
- `name` (único)
- `description`
- `permissions` (string JSON)
- `createdAt`, `updatedAt`
- `users`

No código atual, as permissões são armazenadas como JSON em string e a interface interpreta esse array para controlar acesso.

### Bus

Modelo `Bus`:

- `id`
- `plate` (`placa`) único
- `prefix`
- `model`
- `createdAt`, `updatedAt`

Relacionamentos:

- `solturasRealizadas`
- `solturasProgramadas`

### Abastecimento

Modelo `Abastecimento`:

- `id`
- `litersT1`, `fotoT1`
- `litersT2`, `fotoT2`
- `litersT3` opcional, `fotoT3` opcional
- `garagem` opcional
- `userId`
- `createdAt`

A análise estática indica que a estrutura atual registra medições de tanques com suporte a até 3 tanques, em contraste com a documentação mais antiga que menciona apenas T1/T2.

### Soltura

Modelo `Soltura`:

- `id`
- `busId`, `programmedBusId`
- `scheduleId`
- `carroProgramado`, `carroRealizado`
- `linha`, `tabela`
- `driverCode`, `driverName`
- `saidaGaragem`, `inicioLinha`, `horaLiberacao`
- `garagem`, `turno`, `escalaTipo`, `dataOperacao`
- `substituido`, `historicoTrocas`, `status`
- `notes`
- `userId`, `createdAt`

Esse modelo mostra que a operação de soltura inclui variáveis de escala, substituição, histórico e status operacional.

### ControleOperacional

Modelo `ControleOperacional`:

- `id`
- `carro`
- `linha`
- `garagem`
- `foto1` e fotos opcionais
- `dataInsercao`
- `userId`

### AbastecimentoCarroSession

Modelo `AbastecimentoCarroSession`:

- `id`
- `matricula`
- `dthIniAbastec`, `dthFimAbastec`
- `status` (`EM_ANDAMENTO` ou `FINALIZADO`)
- `garagem`
- leituras iniciais e finais das bombas B1-B6
- `userId`
- `createdAt`

Relacionamento:

- `items` (`AbastecimentoCarroItem[]`)

### AbastecimentoCarroItem

Modelo `AbastecimentoCarroItem`:

- `id`
- `sessionId`
- `carro`
- `liters`
- `bomba`
- `foto`
- `matricula`
- `garagem`
- `dataHora`

### ReservaTerminal

Modelo `ReservaTerminal`:

- `id`
- `carro`
- `tipo`
- `terminal`
- `dataHora`
- `garagem`
- `userId`
- `createdAt`

### CiBloqueio

Modelo `CiBloqueio`:

- campos com `@db.NVarChar(...)` e `@map`
- inclui `prefixo`, `garagem`, `consorciada`, `categoria`, `subTipo`, `motivo`, `status`, `dataLiberacao`, etc.

Esse modelo indica que o sistema tem suporte explícito a registro de bloqueios e manutenção operacional.

## Convenções observadas

O schema mostra várias convenções importantes:

- campos mapeados com `@map(...)` para nomes físicos em banco;
- campos de data com `@default(now())`;
- `updatedAt` com `@updatedAt`;
- index em `ReservaTerminal` por `garagem` e `terminal`;
- `@@map` para nomes de tabela no banco;
- uso de valores de status em string, como `LIBERADO`, `EM_ANDAMENTO`, `FINALIZADO`.

## Banco principal e banco legado

O projeto observável no código atual possui dois fluxos distintos de acesso a dados:

### 1) Banco principal do sistema

- `apps/api/prisma/schema.prisma`
- uso de Prisma + SQL Server
- entidades de operação e autenticação

### 2) Banco legado SQL Server

- integração direta via `mssql` observada no código
- ficheiro `apps/api/src/services/mssql.ts`
- `.agents/skills/legacy-telemetry/references/dicionario-dados-legado.md`

A separação observada no repositório é importante: o banco principal do sistema e o banco legado não devem ser tratados como a mesma fonte de dados. A documentação legada correspondente foi observada apenas no código e nos artefatos de apoio, não foi validada em banco real.

## Observações sobre schema e documentação antiga

Divergências relevantes:

1. Documentação antiga faz menção a PostgreSQL. A implementação atual usa SQL Server como datasource do Prisma.
2. A documentação antiga menciona modelos mais simples e não representa alguns modelos atuais, como `Group`, `AbastecimentoCarroSession`, `ReservaTerminal`, `CiBloqueio` e `ManutencaoCarro`.
3. O esquema atual inclui múltiplos módulos operacionais que não aparecem ou não são detalhados de maneira equivalente em documentação antiga.
4. A integração com SQL Server legado é explicitamente separada da base principal e requer documentação específica para evitar confusão entre os dois contextos.

## Limitações da evidência

- Este documento foi construído a partir do schema Prisma e do código de integração observados no repositório. Ele não substitui a validação do banco em execução.
- A existência de tabelas adicionais fora do schema Prisma e de views/procedures específicas em SQL Server legado não foi confirmada neste escopo; a análise estática indica presença de integração e documentações de apoio, mas não garante o estado real do banco em produção.
- As seções iniciais foram produzidas por análise estática. A inspeção anterior de metadados de CI/manutenção está resumida abaixo; não houve leitura de registros operacionais.

## CI e manutenção — DATA-001A

### Modelagem atual: ATUAL/OBSERVADO

- CiBloqueio mapeia ci_bloqueios: prefixo, categoria, garagem, dataBloqueio, status e campos de liberação. A interface organiza registros por data e persiste algumas cópias; outros fluxos consultam bloqueios ativos por prefixo.
- ManutencaoCarro mapeia manutencao_carros: prefixo, consorciada, observação, data, bloqueado, emExecucao, liberado e timestamps. Guarda estados operacionais da oficina e cópias diárias de bloqueados.
- Não há relação direta entre as tabelas no schema; a aplicação associa principalmente por prefixo.
- Não há unicidade data/prefixo nem exclusividade declarada entre booleanos. O veículo pode ter registros separados de bloqueio e oficina.
- Não foi identificado estado persistido de preparação/finalização, data de finalização, versão ou identidade própria da folha, inclusive vazia.
- Status do registro, dataLiberacao e timestamps não representam finalização nem versões. Datas não garantem histórico imutável: handlers/GETs podem modificar registros.

Fonte: schema Prisma e controllers, sem consulta ao banco.

### Contrato operacional: CONFIRMADO, ainda não garantido pelo banco

Conforme [DOMAIN.md](./DOMAIN.md#data-001a--contrato-operacional-da-ci), fotografias finalizadas preservam o estado diário registrado; bloqueio e execução podem coexistir; retirada confirmada atinge somente preparação. Não foi decidida substituição por bloqueio global com intervalo de vigência. Modelagem futura e históricos antigos permanecem pendentes. Esta seção descreve o baseline; a proposta C3 abaixo não implementa schema/proteção.


## DATA-001B2 — Provisionamento separado do runtime HTTP

B2 concluída no commit 8857e02: os controllers de CI/manutenção não criam tabelas, PKs ou índices e não executam helpers estruturais por requisição. Não há validação de schema por request, middleware global ou bootstrap automático. Ausência ou incompatibilidade estrutural não bloqueia o startup por validação global: cada operação mantém seu tratamento de falhas existente. GET de CI ainda pode retornar [] ao capturar falha; contrato preservado nesta etapa.

### Procedimentos administrativos separados

- [Validação somente leitura](../scripts/sql/data-001b2-validacao.sql): somente SELECTs de metadados, sem registros operacionais. Reporta existência em dbo, colunas mapeadas, tipos/capacidades, nullable, defaults, PK em id, índices e FKs. OBRIGATORIO indica incompatibilidade; AVISO exige avaliação, nunca reparo. Não certifica dados ou todas as dependências.
- [Provisionamento explícito](../scripts/sql/data-001b2-provisionamento.sql): criação deliberada das duas tabelas em instalação nova, compatível com SQL Server 2012. Requer ambas ausentes e execução fora de transação existente; qualquer objeto alvo existente interrompe antes da criação. Tabelas e índices são criados em transação com rollback em erro; não completa estrutura parcial.

Scripts não rodam automaticamente em HTTP, startup, Docker ou npm. Não foram executados nesta implementação. Antes de execução administrativa, confirmar banco alvo, autorização, visibilidade dos metadados e permissões: invisibilidade pode aparentar ausência. Instalação nova também exige users e demais pré-requisitos do sistema, fora destes scripts.

Para banco existente, executar somente validação separadamente autorizada e revisar resultados; não usar criação como reparo. Para instalação nova, revisar/autorizar criação, provisionar antes do serviço e validar posteriormente. Não há migrations, db push ou alinhamento automático ao Prisma.

### Referência e divergências preservadas

A referência é o DDL operacional retirado dos controllers, com dbo e nulabilidade explícitos. Campos antes sem NOT NULL permanecem NULL, conforme a estrutura operacional inspecionada. Mantidos datetime, defaults, PKs e índices operacionais; não são criadas FKs para users.

A inspeção anterior encontrou dbo.ci_bloqueios, dbo.manutencao_carros e dbo.users no SQL Server 2012 do banco garagem; _prisma_migrations não apareceu no catálogo visível. data_folha nvarchar(20) NULL, sem default, existe na CI real e não foi encontrada no repositório/histórico disponível. Preservar em banco existente; não criar nem exigir em instalação nova nesta B2. Origem/finalidade desconhecidas, sem inferir identidade ou ciclo de folha.

Diferenças de nullable, datetime/datetime2 e FKs não são corrigidas automaticamente. Capacidade textual maior e nomes físicos diferentes de índices/PK são compatíveis; datetime e datetime2 são aceitos em B2. Índices ausentes geram aviso. Defaults são exibidos para revisão administrativa, sem comparação textual rígida de expressões equivalentes. A validação não lê valores NULL nem verifica qualidade dos dados.

### Carga inicial e efeitos funcionais restantes

Removida deliberadamente a carga da manutenção a partir da CI vinculada à ausência da tabela. Não ganhou novo acionamento em startup, endpoint, reset, seed, script ou migration. Instalações novas começam com essas tabelas vazias: mudança deliberada da inicialização anterior.

GET /api/manutencao ainda materializa herança, cria/upserta bloqueios, reconcilia e exclui registros funcionalmente. Reset, sync, propagação, create/update/remove e liberação permanecem intactos. B2 não torna esse GET somente leitura nem implementa proteção temporal. O contrato de negócio permanece em DOMAIN.md.


## DATA-001C1 — Contrato operacional sem modelagem implementada

Consulte [DOMAIN.md](./DOMAIN.md#data-001c1--ciclos-operacionais-e-continuidade-dos-bloqueados): manutenção do próprio dia e CI antecipada possuem ciclos distintos; BLOQUEADOS sincronizam com a CI em preparação correspondente e continuam entre dias, sem carregar execução/liberados. Confirmação prévia da liberação de bloqueado e preservação de finalizadas são regras confirmadas, não garantias do banco atual.

Esta etapa não cria identidade/estado persistido de ciclo, preparação/finalização, endpoints ou transações. data_folha permanece preservada com finalidade desconhecida. Nullable, tipos, FKs, scripts e schema não foram alterados; decisões técnicas continuam pendentes. GET de manutenção permanece mutável na implementação.


## DATA-001C3 — Proposta de schema não implementada

Contrato em [DOMAIN.md](./DOMAIN.md#data-001c3--contrato-consolidado-do-ciclo-e-da-fotografia-ci). A C3 foi concluída documentalmente em 2c39fd1 — docs(domain): consolida ciclo operacional da CI. A seção abaixo registra a proposta daquela etapa, sem execução no banco. A C4 fase 2 materializa o candidato e suas diferenças técnicas na seção seguinte; ela prevalece para os artefatos atuais, sem modificar o contrato de DOMAIN.md. Prisma 6.10.0 atual; SQL Server 2012. Não usar enums Prisma para este conector, JSON nativo ou tabelas temporais: códigos String limitados e constraints convencionais propostas. Date armazena data civil do domínio; DateTime2(3) armazena instantes UTC, convertidos por America/Campo_Grande, sem offset fixo. Tamanhos textuais refletem limites atuais ou códigos propostos e precisam de revisão contra os Excels antes da carga.

### A. CicloOperacional — proposta ciclo_operacional

| Campo | Tipo proposto / nulabilidade | Finalidade |
|---|---|---|
| id | Int identity, PK | Identidade estável independente da folha |
| garagem | String NVarChar(10), obrigatório | VCG ou VCM |
| dataOperacional | DateTime @db.Date, obrigatório | Data D do ciclo |
| origem | String NVarChar(20), obrigatório | NORMAL ou RECUPERACAO; não criar ciclo fictício por Excel |
| inicializacaoPrevistaEm | DateTime @db.DateTime2(3), obrigatório | Instante das 03:00 D no timezone aprovado, armazenado UTC |
| inicializadoEm | DateTime @db.DateTime2(3), obrigatório | Horário real da conclusão |
| createdAt / updatedAt | DateTime @db.DateTime2(3), obrigatórios | Auditoria técnica |

UNIQUE(garagem, dataOperacional), UNIQUE(id, garagem) como alvo de FK composta. Sem status: existência comprometida significa inicialização completa, mesmo sem veículos. Preparação relacionada por FolhaCI.cicloPreparacaoId; não duplicar pointer mutável no ciclo. Um ciclo normal tem uma folha preparada, que deixa de ser editável às 18:30. Consultar ciclo atual por data operacional/garagem e existência, não apenas maior ID/data.

### B. FolhaCI — proposta folha_ci

| Campo | Tipo proposto / nulabilidade | Finalidade |
|---|---|---|
| id | Int identity, PK | Identidade da fotografia, inclusive vazia |
| garagem | String NVarChar(10), obrigatório | Âmbito independente |
| dataFolha | DateTime @db.Date, obrigatório | Data destinatária D+1 |
| status | String NVarChar(20), obrigatório | EM_PREPARACAO ou FINALIZADA; distinto de status do item |
| origem | String NVarChar(20), obrigatório | NORMAL, IMPORTACAO ou RECUPERACAO |
| cicloPreparacaoId | Int, opcional | FK ao ciclo que prepara; nullable para Excel histórico sem ciclo comprovado |
| folhaOrigemId | Int, opcional | FK à fotografia copiada; NORMAL exige origem finalizada; importação/recuperação vazia não inventam linhagem |
| tituloColunaAdicional | String NVarChar(30), opcional | Uma das seis opções confirmadas, mesmo com zero itens; NULL explicita informação desconhecida em origem administrativa, sem inventar título |
| inicializacaoPrevistaEm | DateTime @db.DateTime2(3), opcional | Previsto do evento normal/recuperação; nulo quando não comprovado em importação |
| inicializadaEm | DateTime @db.DateTime2(3), opcional | Execução real da inicialização; importação não é evento operacional |
| finalizacaoPrevistaEm | DateTime @db.DateTime2(3), opcional | Previsto das 18:30 no ciclo preparador; não inventar execução histórica |
| finalizadaEm | DateTime @db.DateTime2(3), opcional | Execução real de finalização; Excel pode ser FINALIZADA sem horário histórico conhecido |
| registradaEm | DateTime @db.DateTime2(3), obrigatório | Inserção real, inclusive importação/recuperação |
| referenciaOrigem | String NVarChar(255), opcional | Nome/referência do Excel ou motivo da recuperação, sem arquivo/credencial |
| responsavelRegistroId | Int, opcional | User existente em ação administrativa; nulo para automação |
| updatedAt | DateTime @db.DateTime2(3), obrigatório | Auditoria técnica |

UNIQUE(garagem, dataFolha); UNIQUE(id, garagem). FKs compostas (cicloPreparacaoId, garagem)→Ciclo(id, garagem) e (folhaOrigemId, garagem)→Folha(id, garagem), NO ACTION; impedir autoreferência. No fluxo normal dataFolha=dataOperacional+1, origem da mesma garagem com dataFolha anterior e FINALIZADA. Validar esses invariantes entre registros no serviço, não fingir que CHECK simples lê outras tabelas.

Uma folha por ciclo de preparação: índice UNIQUE filtrado em cicloPreparacaoId IS NOT NULL, proposto para futuro provisionamento administrativo SQL Server 2012. Não usar UNIQUE simples em coluna nullable (limitaria importações sem ciclo). Prisma 6.10 não representa esse filtro no schema: manter a restrição física explicitamente documentada/validada e não prometer que @@unique produz o mesmo efeito. Sem cascatas de exclusão.

Não persistir versão/reabertura agora. Folha importada é fotografia independente FINALIZADA; origem e registradaEm não comprovam horário operacional de preparação/finalização. Folha de recuperação vazia é FINALIZADA quando histórica e EM_PREPARACAO quando atual e dentro da janela; após o prazo, regularizar finalização sem permitir mutação. Título desconhecido em recuperação/importação é NULL e uma pendência de qualidade, sem inferir valor do cache/default. Cópia preserva esse desconhecimento; preenchimento de preparação atual pode definir uma das opções confirmadas, mesmo sem itens. Folha vazia não equivale a falta de identidade.

### C. ItemFolhaCI — proposta item_folha_ci

Recomenda-se tabela nova para o fluxo oficial, conservando ci_bloqueios intacta durante transição. Evita misturar bloqueio global legado e fotografia nova ou associar automaticamente linhas ambíguas. Mais uma tabela é justificada pela preservação do legado; não haverá dupla escrita automática.

| Campo | Tipo proposto / nulabilidade | Finalidade |
|---|---|---|
| id | Int identity, PK | Novo em cada cópia |
| folhaId | Int, obrigatório | FK FolhaCI, NO ACTION |
| chaveItem | String NVarChar(100), obrigatório | Chave lógica dentro da folha, preservada na cópia |
| prefixo | String NVarChar(10), obrigatório | Veículo |
| consorciada | String? NVarChar(10), condicional | Obrigatória em BLOQUEADO; NULL quando desconhecida nas demais categorias (correção C4 acima) |
| categoria | String NVarChar(20), obrigatório | PREVENTIVA / OFICINA / REFORCO / BLOQUEADO |
| subTipo | String NVarChar(50), opcional | Subtipo de preventiva/setor oficina |
| horarioReforco | String NVarChar(20), opcional | Valor persistido do horário ou serviço atual |
| motivo | String NVarChar(255), opcional | Conteúdo existente |
| observacoes | String NVarChar(255), opcional | Campo exposto como os |
| horaBloqueio | String NVarChar(10), opcional | Conteúdo existente; não representa timestamp de criação da cópia |
| gravidade | String NVarChar(10), opcional | Conteúdo existente |
| responsavel | String NVarChar(100), opcional | Responsável textual do conteúdo |
| statusItem | String NVarChar(20), opcional | Compatibilidade com status legado, sem confundir com status da folha |
| dataLiberacao | String NVarChar(50), opcional | Compatibilidade com campo atual |
| motivoLiberacao | String NVarChar(255), opcional | Compatibilidade |
| responsavelLiberacao | String NVarChar(100), opcional | Compatibilidade |
| responsavelRegistroId | Int, opcional | Auditoria do novo registro; não atribuir cópia automática ao autor original |
| createdAt / updatedAt | DateTime @db.DateTime2(3), obrigatórios | Instantes da nova linha |

Data e garagem da participação derivam da folha: não duplicar data_bloqueio como data da folha nem reutilizar data_folha desconhecida. Vínculo de User opcional, NO ACTION; FK ao item/folha é identidade oficial. UNIQUE(folhaId, chaveItem), índice(folhaId, categoria), índice(folhaId, prefixo). Não UNIQUE(folhaId,prefixo): mesmo veículo pode participar de diferentes seções/posições.

Posições de REFORCO: o contrato confirmado exige 12 posições fixas, horários possivelmente repetidos e identidade lógica estável para cada posição; existem também posições da coluna adicional. A cópia preserva identidade lógica e ordem da posição, gerando novas PKs e nova associação à folha. ref-1..ref-12 e ref-extra-1..ref-extra-6 são apenas identificadores observados na implementação atual, não contrato definitivo de domínio. A C4 decidirá a representação física mais simples, como chave lógica, tipo+ordem ou equivalente, incluindo a constraint que impeça ocupação duplicada da mesma posição por folha. chaveItem nesta proposta é uma possibilidade técnica para revisão, não imposição de representação. Para demais seções, chave opaca estável por item (por exemplo UUID textual) permanece proposta, sem dedupe por prefixo. Slot vazio é posição do layout sem item.

Título variável pertence a FolhaCI e não aos itens. Copiar tituloColunaAdicional mesmo sem itens; copiar os itens extras com suas chaves de posição. Não preencher Controle EM MANUTENÇÃO por causa de título/categoria da CI. Configuração visual compartilhada não é rascunho; não transportar reforco_drafts. Proposta dispensa tabela específica de reforço porque item + chave + título de cabeçalho preservam o conteúdo confirmado.

Remoção de Bloqueado em preparação apaga apenas sua participação BLOQUEADO na folha destinatária e reflete no Controle. Não exige criar item LIBERADO. Campos legados e statusItem permanecem para compatibilidade até análise posterior, sem remover coluna/código agora.

### D. EstadoManutencao — proposta estado_manutencao_ciclo

Proposta de tabela oficial nova, conservando manutencao_carros para legado. Uma linha por veículo/ciclo elimina a dependência dos IDs globais manut-ci-<prefixo> e permite coexistência por flags sem fundir silenciosamente registros antigos. Associação é com Ciclo, não Folha.

| Campo | Tipo proposto / nulabilidade | Finalidade |
|---|---|---|
| id | Int identity, PK | Identidade diária |
| cicloId | Int, obrigatório | FK Ciclo, NO ACTION; garagem/data derivadas dele |
| prefixo / consorciada | String NVarChar(10), obrigatórios | Valores atuais |
| bloqueado / emExecucao / liberado | Boolean bit, obrigatórios | Flags; inicialização true/false/false só para bloqueados copiados |
| observacaoBloqueio | String NVarChar(255), opcional | Observação do bloqueio, hoje em registro separado/CI |
| observacaoOficina | String NVarChar(255), opcional | Observação diária de oficina/liberação, preservando responsabilidade distinta |
| responsavelRegistroId | Int, opcional | User, NO ACTION |
| createdAt / updatedAt | DateTime @db.DateTime2(3), obrigatórios | Auditoria mínima |

UNIQUE(cicloId,prefixo) é uma decisão estrutural proposta para o NOVO modelo, aceitável para revisão: um veículo possui um EstadoManutencao por CicloOperacional. Esse estado pode representar simultaneamente BLOQUEADO e EM MANUTENÇÃO; bloqueado=true e emExecucao=true é válido. LIBERADO obedece ao fluxo confirmado de liberação, sem resultado LIBERADO+BLOQUEADO por operação parcial. O legado manutencao_carros pode representar esses conceitos em registros separados; a transição para um registro por veículo/ciclo não é simples equivalência do legado e não autoriza migração/agregação automática. Atualizar oficina preserva bloqueio; retirada preserva oficina; liberação confirmada atualiza flags e retira item BLOQUEADO da preparação na mesma transação. Contagens/quadros passam a projetar flags independentemente. Nenhuma constraint é implementada nesta etapa; a C4 deverá validar as invariantes exatas das flags, sem impor exclusividade que elimine BLOQUEADO+EM MANUTENÇÃO.

### E. Garagem, origem, constraints e auditoria

Sem modelo Garagem existente encontrado. Proposta mínima: garagem como String limitada a VCG/VCM em Ciclo/Folha; configuração central explícita de garagens habilitadas no backend, compartilhada por agendador/comandos. Padrão nenhuma; rollout habilita VCG; VCM não habilitada. Habilitação é configuração operacional, não RBAC/associação de User. ADMIN consulta ambos os contextos; dados nunca se misturam.

CHECKs propostos: códigos de garagem, status/origem de folha, categorias e títulos confirmados quando não NULL. Auditoria mínima é origem NORMAL/IMPORTACAO/RECUPERACAO, referência e instantes reais; não criar log genérico. Constraints físicas não suportadas diretamente pelo Prisma (CHECK/índice filtrado) exigirão plano administrativo separado, não migrate/db push automático. UNIQUE/FKs convencionais podem ser mapeados no Prisma; validação estática do schema candidato fica para C4, não executada aqui.

FKs entre cabeçalhos incluem garagem para impedir vínculo cruzado. Itens/estado diário derivam âmbito do pai. O serviço sempre resolve/valida garagem+pai+item sob transação; IDs ou prefixos fornecidos isoladamente não autorizam operação. Origem NORMAL requer ciclo/origem finalizada; IMPORTACAO não inventa ciclo; RECUPERACAO vazia não inventa origem copiada. Idempotência usa UNIQUE de garagem/data e finalização que não altera novamente instantes reais. UNIQUE de sucessora pela origem não é necessário agora: data/garagem única e validação da predecessoridade sustentam o fluxo normal.

### F. Convivência, cópia e recuperação

Nenhuma alteração/descarte de ci_bloqueios, manutencao_carros, status/data_liberacao ou data_folha nesta etapa. Não reinterpretar dados antigos nem backfill automático. Fonte oficial nova será adotada por garagem no rollout; legado continua identificado, sem união automática em GET, fallback reconstrutivo ou dual-write. Como nova manutenção diária parte da CI oficial, não depende de consolidar registros legados ambíguos. Todos os consumidores de soltura/CI/manutenção precisam ser adaptados antes da ativação.

Histórico VCG: cada Excel gera uma folha IMPORTACAO FINALIZADA e seus itens, sem ciclo/linhagem inventados. SQL será preparado externamente e executado manualmente após revisão; nenhum importador de aplicação ou SQL produzido aqui. Preservar data/garagem únicas; definir conflito entre folha importada e placeholder de recuperação antes da carga, sem sobrescrever FINALIZADA via endpoint. Não existe comprovação de Prisma Migrate gerenciando esse banco; introdução estrutural requer plano explícito aprovado.

03:00 normal copia integralmente itens, chaves e título da folha D FINALIZADA para D+1; gera IDs/auditoria novos, preserva dados operacionais e origem. Cria ciclo/manutenção juntos; extrai apenas categoria BLOQUEADO efetiva, sem transportar oficina/liberados. Cópia é diferente de sincronização. Origem ausente não autoriza cópia arbitrária: distinguir bootstrap/recuperação. Inicialização atômica torna a existência prova de conclusão, mesmo com zero itens.

Recuperação mesmo dia usa operação idempotente com previsto/efetivo; vários dias criam estruturas ausentes vazias e origem RECUPERACAO, sem copiar antiga repetidamente. Folhas históricas vazias ficam FINALIZADAS; preparação atual vazia é criada quando ainda dentro da janela, com manutenção vazia. Depois de 18:30 também regularizar fechamento. Não apagar estruturas já existentes nem dados lançados após inicialização. Preenchimento/correção administrativa posterior não está implementado e não revoga bloqueio operacional de FINALIZADA. GET nunca recupera eventos.

### G. Revisão e decisões remanescentes

Os novos conceitos, garagens, timezone, horários, acesso e cópia estão aprovados. O desenho foi aprovado na C4 fase 1; a fase 2 materializa quatro models candidatos e scripts administrativos, ainda sem provisionamento ou comportamento operacional. Títulos desconhecidos/valores de Excel e duplicidades precisam de validação administrativa antes da carga; procedimento de correção e conflitos IMPORTACAO/RECUPERACAO ficam para etapa administrativa, sem suporte noturno/reabertura agora. Avaliar limites reais dos Excels e aprovar rollout/folha inicial. Serviços/frontend atuais continuam incompatíveis e não foram alterados.


## DATA-001C4 — Fase 2: schema candidato e provisionamento administrativo

**Estado:** artefatos materializados para revisão, não executados. DATA-001 não concluída. O runtime continua usando o legado; o novo fluxo não foi habilitado. Nenhuma migration, carga, cliente Prisma gerado, scheduler, serviço, endpoint ou frontend foi implementado nesta fase.

### Fontes técnicas sincronizadas

- [Schema candidato](../apps/api/prisma/schema.prisma): CicloOperacional → dbo.ciclo_operacional; FolhaCI → dbo.folha_ci; ItemFolhaCI → dbo.item_folha_ci; EstadoManutencao → dbo.estado_manutencao_ciclo.
- [Provisionamento administrativo](../scripts/sql/data-001c4-provisionamento.sql): criação exclusiva das quatro tabelas novas, constraints, índices e defaults. Não integra npm, HTTP, startup ou Docker.
- [Validação estrutural somente leitura](../scripts/sql/data-001c4-validacao.sql): SELECTs de identificação e catálogos; nenhuma leitura de dados operacionais. Esperados explícitos devem acompanhar qualquer alteração aprovada no schema/DDL.

As definições de campos, tipos, nulabilidade e nomes físicos estão no schema/DDL. Todas as FKs usam NO ACTION em atualização/exclusão. User recebe somente relações inversas; CiBloqueio e ManutencaoCarro permanecem intactos. A FK opcional de responsável utiliza users.id INT/PK, comprovado pelo schema atual; o script exige esse pré-requisito por metadados antes de criar qualquer tabela, sem alterar users.

### Refinamentos aprovados em relação à proposta C3

| Ponto | Candidato C4 |
|---|---|
| Ciclo | Sem status; UNIQUE(garagem,dataOperacional); referência opcional da recuperação; existência só provará conclusão quando o futuro serviço inicializar tudo em uma transação |
| Folha | UNIQUE(garagem,dataFolha); status/origem obrigatórios sem defaults implícitos; vínculo opcional ao ciclo/origem; título nullable sem valor inventado |
| Registro técnico | createdAt substitui registradaEm; importação registra persistência real sem fabricar timestamps operacionais |
| Identidade do item | chaveItem String @db.UniqueIdentifier, UUID explícito sem default; preservado na cópia, PK identity nova |
| Reforço | tipoPosicao + ordemPosicao; FIXO 1..12, EXTRA > 0; posições não são identificadas por horário/prefixo/IDs atuais da UI |
| Bloqueados | No máximo um item BLOQUEADO por folha/prefixo, independentemente do motivo; tentativa adicional deve ser rejeitada, sem dedupe silencioso |
| Manutenção | UNIQUE(cicloId,prefixo); bits NOT NULL default false; 000/100/010/110/001 válidos; liberado exige bloqueado=false e emExecucao=false |
| Datas | DATE para dataOperacional/dataFolha; DATETIME2(3) UTC para instantes; conversão America/Campo_Grande no futuro serviço, sem AT TIME ZONE/offset fixo |

O Prisma 6.10 **não aceita precisão em @db.DateTime2** (validado localmente); o schema usa @db.DateTime2 e a precisão 3 é garantida exclusivamente pelo DDL e verificada pelo script administrativo. Não usar SQL gerado automaticamente pelo Prisma como substituto do provisionamento aprovado. Defaults de createdAt/updatedAt são SYSUTCDATETIME(); @updatedAt atua no escritor Prisma, sem trigger. Escritores SQL futuros devem atualizar updated_at explicitamente. Não há default para códigos de garagem/status/origem, datas de negócio, UUID, prefixo ou consorciada.

### Constraints complementares exclusivamente administrativas

Prisma representa PKs identity, UNIQUEs convencionais, índices comuns e FKs, inclusive compostas. Não representa sozinho os 17 CHECKs e estes três índices UNIQUE filtrados no baseline 6.10:

- UQ_folha_ci_ciclo_preparacao: (ciclo_preparacao_id) WHERE ciclo_preparacao_id IS NOT NULL. Várias folhas importadas sem ciclo continuam permitidas.
- UQ_item_folha_ci_bloqueado_prefixo: (folha_id,prefixo) WHERE categoria = N'BLOQUEADO'. Não usar UNIQUE geral de folha/prefixo; demais categorias mantêm multiplicidade.
- UQ_item_folha_ci_reforco_posicao: (folha_id,tipo_posicao,ordem_posicao) WHERE categoria = N'REFORCO'. Título fica no cabeçalho mesmo sem itens.

CHECKs: garagem VCG/VCM em ciclo/folha; origens e status aprovados; não autorreferência; título NULL ou uma das seis opções confirmadas; relações/timestamps obrigatórios por origem/estado; categorias; posição condicional com testes explícitos de NULL; prefixo não vazio; consorciada do item condicional conforme a correção C4 acima e consorciada do estado não vazia; liberação incompatível com bloqueio/execução. statusItem e campos de liberação são nullable para compatibilidade, sem controlar finalização e sem CHECK baseado somente em enum observado.

UNIQUE(id,garagem) em ciclo/folha permite FKs compostas que impedem vínculo entre garagens diferentes: folha → ciclo e folha → origem. Itens/estado derivam contexto do pai. Igualdade dataFolha=dataOperacional+1, predecessor FINALIZADA, cópia, sincronização, confirmação, janela 03:00–18:30, imutabilidade e locks continuam responsabilidades de serviços futuros. Este schema não implementa essas proteções operacionais nem torna GET read-only.

### Comportamento administrativo e limites da validação

Provisionamento exige execução fora de transação existente, VIEW DEFINITION no banco e users.id compatível. Se qualquer objeto alvo já existir, falha explicitamente antes da criação: não repara, completa, altera, apaga ou recria. Criação em transação com XACT_ABORT/TRY/CATCH e rollback; erro concorrente também interrompe sem completar parcialmente. SETs necessários aos índices filtrados são explícitos. Nenhum DML/carga, alteração de users ou tabelas legadas.

Validação reporta 59 colunas (ordem, tipo, capacidade textual, nullable, identity 1/1, escala datetime2=3), 16 índices/PKs/UNIQUEs (chaves ordenadas, filtros, unicidade, disabled, ignore_dup_key), sete FKs (colunas ordenadas, destino dbo, NO ACTION, enabled/trusted), 17 CHECKs, defaults esperados e ausência de defaults adicionais, além de objetos adicionais/triggers para revisão. Sem VIEW DEFINITION, ausência aparente não certifica estrutura. CHECKs e filtros têm comparação textual conservadora, preservando parênteses/literais: diferenças de normalização do SQL Server podem produzir REVISAR_DEFINICAO e exigem comparação manual com o DDL. Não tratar esse resultado como aprovação automática ou como autorização de reparo.

SQL Server alvo é 2012; scripts não usam recursos posteriores. A matriz oficial Prisma v6 não lista essa versão: ressalva documentada, **não blocker da modelagem**, conforme decisão do responsável. Não atualizar ORM/dependências. Compatibilidade de leitura/gravação/transações deve ser validada controladamente antes do rollout, em etapa autorizada. Nenhum Prisma Migrate identificado no banco é motivo para manter provisionamento administrativo, não para introduzir baseline/migrations automaticamente.

### Próximas etapas e legado

Provisionar apenas após revisão/autorização específica e confirmação do banco alvo; validar metadados em execução separada também autorizada. Depois implementar domínio/serviços e adaptar todos os consumidores antes de carga/corte VCG. Sem dupla escrita prolongada, fallback reconstrutivo ou interpretação de data_folha. Excel, conflitos IMPORTACAO/RECUPERACAO, folha inicial e data de ativação continuam pendentes antes da carga/rollout. VCM não é habilitada automaticamente; existência da garagem não é feature flag nem RBAC.

## Consolidação 5173 — Escala compartilhada (proposta não executada)

Integra os modelos candidatos `EscalaCarros` e `ItemEscalaCarros` do trabalho
local original. Programação recorrente separada de Soltura, FolhaCI e Ciclo:
chave única garagem/tipo/turno, revisão otimista e identificação do responsável.
Itens possuem chave e ordem únicas por escala, com programação validada por
Zod em NVARCHAR(MAX), sem funções JSON posteriores ao SQL Server 2012.

O candidato `scripts/sql/escala-carros-provisionamento.sql` cria somente as
duas tabelas, recusa destino existente e não migra cache ou dados legados.
Não foi executado. Nenhuma migration foi criada ou executada. A aplicação
não cria essas tabelas; sem provisionamento, o endpoint retorna 503.
Revisar schema, precisão de timestamps, constraints, índices, permissões e
backup antes de autorizar execução. Testes locais não certificam o banco real.
Consulte o [relatório da consolidação](CONSOLIDACAO-5173.md).
