# Arquitetura de dados atual

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

Conforme [DOMAIN.md](./DOMAIN.md#data-001a--contrato-operacional-da-ci), fotografias finalizadas preservam o estado diário registrado; bloqueio e execução podem coexistir; retirada confirmada atinge somente preparação. Não foi decidida substituição por bloqueio global com intervalo de vigência. Modelagem futura e históricos antigos permanecem pendentes. Este registro não propõe schema nem afirma proteção implementada.


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
