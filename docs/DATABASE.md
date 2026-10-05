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
- Não houve acesso ao banco para validar colunas reais, índices em produção nem dados presentes em ambiente concreto.

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
