# Backlog do Projeto

Este documento registra pendências técnicas, operacionais, de segurança
e de experiência do usuário identificadas durante o desenvolvimento que
não precisam ser resolvidas imediatamente.

O objetivo é evitar aumentar o escopo das tarefas em andamento sem perder
problemas ou decisões importantes descobertos durante a implementação.

Itens deste backlog não representam automaticamente regras de negócio
confirmadas. Decisões operacionais devem ser validadas antes da implementação.

## Convenção

Utilizar os seguintes prefixos:

- SEC — segurança
- DATA — integridade/arquitetura de dados
- FUNC — comportamento funcional/contratos
- OPS — decisão/regra operacional
- TECH — dívida ou melhoria técnica
- UX — experiência/interface do usuário

Cada item deve possuir, quando aplicável:

- Status
- Prioridade
- Tipo
- Contexto
- Módulos afetados
- Decisão ou trabalho pendente
- Observações
- Origem

Não criar tarefas fictícias apenas para preencher o documento.

## DATA-001 — Listagens de manutenção executam alterações no banco

**Status:** Pendente de correção; DATA-001A concluída em 0093c69; DATA-001B1 concluída; DATA-001B2 concluída; DATA-001C1 concluída em 8931629; DATA-001C3 documentação concluída em 2c39fd1; DATA-001C4 fase 2 materializada em 3531b88, sem execução no banco
**Prioridade:** Antes da produção
**Tipo:** Integridade / arquitetura de dados

### Contexto

Foi identificado que fluxos GET relacionados a Manutenção e CI podem executar operações que não são somente leitura, incluindo inicialização de estrutura, reconciliação, criação e exclusão de registros.

A auditoria encontrou comportamento como:

- criação/verificação de tabela ou índices;
- `DELETE`/`deleteMany`;
- criação/upsert durante reconciliação.

### Risco

Uma operação apresentada como leitura pode provocar alterações de
estrutura ou dados.

### Pendência

O [contrato confirmado da DATA-001A](./DOMAIN.md#data-001a--contrato-operacional-da-ci) esclarece fotografia diária, preparação antecipada, imutabilidade após finalização, GET somente leitura, coexistência bloqueio/execução e retirada explicitamente confirmada dirigida à CI em preparação. Esses pontos deixaram de ser dúvidas. Não foi decidida substituição por bloqueio global com intervalo de vigência.

### Riscos confirmados estaticamente

- Após B2, não há provisionamento estrutural nos controllers de CI/manutenção; GET /api/manutencao ainda materializa, atualiza, exclui e reconcilia registros funcionalmente.
- Reconciliação com o estado atual e herança visual podem modificar/completar históricos.
- Exclusões por prefixo podem atingir registros de diferentes datas.
- Propagação para datas posteriores não verifica finalização; caches mantêm sincronização adicional.
- Não foi identificado estado persistido de preparação/finalização ou identidade de folha vazia.

São riscos/capacidades confirmados no código, sem consulta ao banco ou confirmação de dados reais afetados.

### Divisão proposta

| Etapa | Escopo | Situação / dependência |
|---|---|---|
| DATA-001A | Registrar contrato, comportamento observado e pendências | Concluída no commit 0093c69 — docs(domain): documenta ciclo operacional da CI |
| DATA-001B | Separar inicialização e saneamento dos caminhos HTTP | B1/B2 concluídas; DATA-001 permanece pendente |
| DATA-001C | Definir identidade/ciclo diário, folha vazia e cópia inicial | C1 concluída em 8931629; C3 concluída em 2c39fd1; C4 fase 2 materializada em 3531b88; provisionamento e implementação operacional pendentes |
| DATA-001D | GETs somente leitura e histórico sem reconstrução na interface | Proposta; identificar fotografias e disponibilizar preparação explícita |
| DATA-001E | Retirada confirmada somente na CI em preparação | Proposta; depende de ciclo e destino |
| DATA-001F | Limitar propagação/sincronização e preservar coexistência/histórico | Proposta; depende das etapas anteriores e regras de propagação |

### DATA-001B1 — Remover saneamentos automáticos do runtime

**Status:** Concluída no commit 639cab2; avanço parcial da DATA-001.

Removidos dos helpers HTTP os três saneamentos históricos: exclusão de CI por `id LIKE 'ci-doc-%'`, limpeza da manutenção por categorias `OFICINA`/`PREVENTIVA`/`REFORCO` e limpeza por variações de "Liberado pela CI" na observação. A intenção atual desses registros não foi comprovada; esta etapa não executa saneamento nem recupera dados anteriormente excluídos.

Ao concluir B1, DDL, verificações, flags e carga inicial ainda permaneciam no runtime; B2 remove esses pontos conforme seção abaixo. GET /api/manutencao ainda NÃO é somente leitura: herança, criação/upserts e reconciliação, incluindo exclusões funcionais, permanecem. Operações explícitas, propagação, frontend e caches não foram alterados.

DATA-001B2 trata provisionamento estrutural e retirada deliberada da carga inicial. DATA-001C/D/E/F permanecem pendentes. O contrato da DATA-001A não foi alterado.

### DATA-001B2 — Retirar provisionamento estrutural do HTTP

**Status:** Concluída no commit 8857e02; scripts não executados; DATA-001 ainda não concluída.

Removidos helpers estruturais, flags e chamadas de todos os endpoints dos dois controllers. Removida deliberadamente a carga inicial acoplada à criação, sem novo acionamento. Scripts administrativos separados de validação por metadados e criação explícita em instalação nova; criação recusa objetos alvo existentes, sem reparos. Banco existente, data_folha, Prisma e regras funcionais preservados.

GET /api/manutencao continua mutável por herança, materialização, upserts e exclusões funcionais. GET de CI mantém o catch que pode retornar []. Ver procedimento em [DATABASE.md](./DATABASE.md#data-001b2--provisionamento-separado-do-runtime-http). DATA-001C/D/E/F permanecem pendentes; não há DATA-001B3 definida na organização atual.

### DATA-001C1 — Regras operacionais esclarecidas

**Status:** Documentação concluída no commit 8931629; nenhuma implementação de C/D/E/F concluída.

[DOMAIN.md](./DOMAIN.md#data-001c1--ciclos-operacionais-e-continuidade-dos-bloqueados) confirma manutenção do próprio dia, sincronização bidirecional de BLOQUEADOS com a próxima CI em preparação, coexistência BLOQUEADO + EM MANUTENÇÃO e continuidade apenas dos bloqueios vigentes. Estados de oficina/liberados não atravessam como estado inicial. Retirada direta reflete na preparação; liberação de bloqueado exige confirmação antes de qualquer alteração e cancelamento sem efeitos.

GET ainda é mutável. Identidade/ciclo, inicialização explícita, proteção de CI finalizada, sincronização restrita e retirada/liberação confirmada precisam ser implementados/corrigidos. C/D/E/F permanecem pendentes; não escolher endpoints, transações, schema ou fonte global por inferência.

### DATA-001C3 — Consolidação documental e proposta de schema

**Status:** Documentação concluída em 2c39fd1 — docs(domain): consolida ciclo operacional da CI; nenhuma implementação operacional concluída pela C3.

Contrato central em DOMAIN.md: FolhaCI/Ciclo distintos por garagem, ADMIN, America/Campo_Grande, eventos diários 03:00/18:30, cópia integral incluindo slots/título de reforço, integração exclusiva de Bloqueados, consulta noturna, concorrência e recuperação simples. Histórico VCG por Excel externo/manual IMPORTACAO; VCM não habilitada automaticamente. Proposta C3 em DATABASE.md; artefatos candidatos materializados na C4 fase 2, sem execução no banco ou implementação operacional.

### DATA-001C4 / D / E / F — Próximos passos propostos

C4 fase 1 aprovada; fase 2 materializou models candidatos e scripts administrativos no commit 3531b88, sem execução no banco. Provisionamento exige autorização separada; identidade/cópia/fechamento, transações, agendamento/recuperação e adoção continuam por implementar. D: GETs/consumidores somente leitura sem clones/reconciliação histórica; E: retirada/liberação atômica e confirmada no destino; F: sincronização apenas de Bloqueados com isolamento e preservação de estados. C/D/E/F de implementação continuam pendentes. B1/B2 permanecem concluídas; DATA-001 NÃO concluída.

### DATA-001C4 — Fase 2: materialização do schema candidato

**Status:** Materializada no commit 3531b88 — feat(data): materializa schema candidato do ciclo operacional; schema novo não provisionado e scripts SQL C4 não executados; DATA-001 continua aberta.

schema.prisma recebe CicloOperacional, FolhaCI, ItemFolhaCI e EstadoManutencao, preservando models legados. Novos scripts scripts/sql/data-001c4-provisionamento.sql e data-001c4-validacao.sql complementam CHECKs/UNIQUEs filtrados e precisão DATETIME2(3), não representados integralmente pelo Prisma 6.10. Provisionamento falha se qualquer objeto alvo existe, sem reparar/completar; validação lê somente metadados. Nenhum script B2 alterado.

Desenho aprovado: único BLOQUEADO por folha/prefixo com filtro de categoria (sem dedupe silencioso ou unicidade geral); posições de reforço tipo+ordem; manutenção uma linha por ciclo/prefixo, com coexistência bloqueio/execução e liberação 001. Sem banco, migration, generate, seed, carga Excel, scheduler, serviços, frontend ou habilitação. Contrato de negócio preservado; detalhamento em DATABASE.md.

### MVP operacional VCG — estratégia transitória sobre o legado

**Status:** Estratégia registrada; implementação e disponibilização pendentes.
**Prioridade:** Corrigir blockers operacionais antes da disponibilização na VCG.
**Tipo:** Operação / transição arquitetural.

Objetivo: permitir uso de CI + Controle de Manutenção na VCG sobre o fluxo
legado atual antes da conclusão da arquitetura definitiva. O MVP é uma etapa
transitória antes do rollout definitivo; não substitui a DATA-001C4, não cancela
CicloOperacional/FolhaCI e não torna o legado a arquitetura definitiva.
DOMAIN.md permanece a fonte principal das regras de negócio confirmadas.

Prioridades obrigatórias:

- Preservar CI histórica/finalizada e impedir alteração indevida de folhas passadas.
- Evitar operações amplas/perigosas somente por prefixo.
- Garantir que remoção/liberação atinja a CI correta em preparação.
- Preservar BLOQUEADO + EM MANUTENÇÃO quando aplicável.
- Garantir que cancelar confirmação não altere estado.
- Manter a integração operacional dos BLOQUEADOS entre CI em preparação e
  Controle de Manutenção do dia operacional correspondente.
- Corrigir blockers operacionais antes da disponibilização.

Implementações legadas, reconstruções existentes, localStorage, duplicação,
arquitetura não ideal e dívidas separáveis podem permanecer temporariamente
somente se não representarem risco de dados e respeitarem as prioridades
acima. Reconstrução que altere histórico/finalizada não é exceção permitida.
Essas pendências continuam rastreadas na DATA-001D/E/F e em itens separados
quando necessário, para substituição pelo novo modelo; não estão concluídas.

Baseline: C4 fase 2 materializada em 3531b88; schema novo NÃO provisionado,
scripts SQL C4 NÃO executados e novo fluxo NÃO habilitado. O fluxo legado
continua operacionalmente ativo e GET /api/manutencao continua mutável;
GET somente leitura é o estado desejado, ainda pendente na DATA-001D.
CicloOperacional/FolhaCI permanecem a arquitetura definitiva planejada.
DATA-001 permanece aberta; não há data de rollout definida. SEC-006 permanece
separada. Este registro não autoriza provisionamento ou execução de SQL.

### Pendências reais

Autorização separada do provisionamento dos artefatos candidatos C4 fase 2 já revisados e commitados; validação controlada Prisma 6.10/SQL Server 2012 antes do rollout, sem blocker da modelagem; procedimento administrativo posterior para preencher/corrigir recuperação sem mutação operacional de FINALIZADA; fornecer Excels oficiais, folha inicial e data de rollout. data_folha desconhecida e preservada. Horários, timezone, cópia integral, âmbito por garagem e ADMIN já decididos: não voltar a listá-los como dúvidas de negócio.

GET /api/manutencao continua mutável. Nenhuma regra operacional C3 foi implementada; C4 fase 2 alterou somente schema candidato, scripts administrativos e documentação. Nenhuma migration foi criada/executada; frontend/controllers permanecem intactos. Mover reconciliação para POST mantendo alteração histórica não satisfaz o contrato. SEC-006 segue separada.

## DATA-002 — Regra de unicidade da vistoria operacional

**Status:** Pendente
**Prioridade:** Antes do uso operacional definitivo
**Tipo:** Regra de domínio / integridade

### Contexto

O fluxo de criação de Controle Operacional aparentemente verifica
duplicidade somente pelo veículo, enquanto listagem/interface e skill
tratam a vistoria como registro diário.

### Risco

Uma vistoria anterior pode impedir o registro do mesmo veículo em outro
dia.

### Pendência

Validar com a operação qual é a chave/regra correta de unicidade antes
de alterar código ou banco.

Não assumir automaticamente que a solução é veículo + data.

## OPS-001 — Política de fallback da frota

**Status:** Pendente
**Prioridade:** Antes da produção
**Tipo:** Decisão operacional

### Contexto

Durante a SEC-002B foi identificado que, quando a integração com o
SQL Server legado está indisponível, alguns módulos podem continuar
utilizando uma lista local de veículos como contingência.

A interface atualmente informa quando dados mock, integração indisponível
ou fallback local estão sendo utilizados.

### Módulos afetados

- CI Manutenção
- Abastecimento por Carro

### Decisão pendente

Validar operacionalmente, separadamente para cada módulo, qual deve ser
o comportamento quando a frota estiver sendo obtida por fallback local:

1. permitir a operação exibindo aviso;
2. exigir confirmação adicional do usuário;
3. bloquear a operação até a integração ser restabelecida.

Não assumir que os dois módulos precisam utilizar a mesma política.

### Observações

O comportamento atual deve permanecer inalterado até que exista uma
decisão operacional validada.

Não transformar esta pendência em implementação nesta tarefa.

### Origem

Pendência identificada durante a implementação e revisão da SEC-002B.

## TECH-001 — Origem do fallback local da frota em Catracas

**Status:** Pendente
**Prioridade:** Antes de decisões operacionais baseadas em fora da frota
**Tipo:** Observabilidade / confiabilidade

### Contexto

A consulta "fora da frota" pode utilizar uma lista estática/local quando
a obtenção da frota falha.

A origem informada atualmente pode representar a consulta legada sem
deixar explícito que a lista de frota veio de fallback.

### Risco

O usuário pode interpretar o resultado como totalmente baseado em dados
reais quando parte da comparação utilizou fallback.

### Pendência

Definir se a origem da frota deve ser exposta separadamente ou se a
operação deve falhar quando a frota real não puder ser obtida.

Não confundir esta pendência com OPS-001.

## FUNC-001 — Papéis do formulário de usuários e schemas divergentes

**Status:** Pendente
**Prioridade:** Antes de depender do cadastro administrativo desses perfis
**Tipo:** Funcional / contrato frontend-backend

### Contexto

A interface oferece papéis como `tanque`, `abastecimento`, `soltura` e
`operacional`. A auditoria encontrou schemas backend ainda aceitando
nomenclaturas legadas `COLABORADOR_*` em alguns fluxos.

### Risco

Criação ou edição de usuários pode falhar na validação ou produzir
contratos inconsistentes.

### Pendência

Mapear os papéis efetivamente válidos e alinhar frontend, schemas e
compatibilidade com usuários existentes.

## TECH-002 — SQL Server legado não tenta reconectar após falha inicial

**Status:** Pendente
**Prioridade:** Antes de exigir alta disponibilidade
**Tipo:** Resiliência

### Contexto

Após falha inicial de conexão, o estado interno da integração pode
impedir novas tentativas durante a vida do processo.

### Risco

Uma indisponibilidade transitória do SQL Server pode manter a integração
indisponível mesmo após o banco voltar, exigindo reinício da API.

### Pendência

Avaliar estratégia controlada de retry/backoff e observabilidade da
conexão.

## SEC-005 — Papel do usuário permanece no JWT até expiração

**Status:** Pendente
**Prioridade:** Avaliar antes da produção
**Tipo:** Segurança / sessão

### Contexto

O JWT contém `id` e `role`, e a autorização utiliza o papel presente no token.

A auditoria da SEC-003A observou que alteração posterior do papel do
usuário não invalida automaticamente tokens já emitidos.

O prazo padrão identificado foi de 365 dias, configurável por
`JWT_EXPIRES_IN`.

### Risco

Um token emitido antes de uma mudança de papel pode continuar
representando o papel anterior até expirar ou deixar de ser utilizado.

### Pendência

Definir política de duração, renovação e/ou invalidação de sessão.

Não alterar `JWT_EXPIRES_IN` nem a autenticação nesta tarefa.

## SEC-006 — Credenciais literais em scripts e senha fixa no seed

**Status:** Pendente
**Tipo:** Segurança

**Problema:** scratch/test-db.js e apps/api/test-conn.js contêm credenciais SQL literais versionadas; apps/api/prisma/seed.ts utiliza senha fixa para provisionar contas.

**Risco:** exposição no código/histórico e uso indevido se credenciais ou contas permanecerem válidas. Validade não testada.

**Escopo futuro:** avaliar exposição, rotação aplicável, configuração externa e política de credenciais do seed.

**Limite:** DATA-001B2 não testa credenciais, altera secrets, corrige scripts ou modifica contas/seed. Nenhum segredo deve ser reproduzido.
