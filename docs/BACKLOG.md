# Backlog do Projeto

## Pendências identificadas na consolidação 5173 — 09/10/2026

- **DATA-003 — Origem da frota:** pendente de validação da fonte antes de
  alterar filtros. Os dois worktrees têm as mesmas listas de 464 prefixos:
  168 iniciados por 1 e 296 restantes. Isso explica uma possível contagem por
  filtro, sem certificar a frota real. C4 seleciona garagemFonte=1; o legado
  normaliza valor 1 como VCM e mantém fallback por prefixo/2002. Contexto de
  folha, garagem física e consorciada são distintos. Conferir a fonte com o
  responsável; não inferir empresa nem corrigir históricos. Sem consulta ao banco.
- **SEC-004 — Históricos e reservas:** revisão antes de disponibilizar a
  várias garagens. A nova consulta de Escala e escrita de Soltura validam
  vínculo de garagem. Endpoints preexistentes de histórico de Soltura e
  reservas ainda aceitam filtros/IDs sem a mesma validação contextual no
  controller. Revisar permissões, inclusive exclusão de reserva por ID.
  A exclusão após Soltura confirmada é outra requisição: uma falha pode
  deixar reserva pendente. Não há atomicidade entre essas operações.
- **OPS-002 — Programação e fontes de Soltura:** pendente de validação antes
  de certificar publicação. A API de Escala preserva viagens distintas com
  o mesmo carro; a interface impede algumas inclusões/edições repetidas.
  Validar antes de unificar. CI em preparação, madrugada antes das 03h, VCM
  e legado permanecem impedidos no escritor recente; não relaxar contenção
  sem fonte oficial definida. Escalas locais anteriores exigem revisão e
  publicação explícita; não são importadas automaticamente.

Origem e detalhes: [relatório da consolidação](CONSOLIDACAO-5173.md).

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

**Status:** Implementação operacional C4 local em revisão, sem commit/provisionamento/ativação; DATA-001A concluída em 0093c69; DATA-001B1/B2 concluídas; C1 concluída em 8931629; C3 em 2c39fd1; C4 fase 2 em 3531b88. DATA-001 não encerrada: rollout e validação real pendentes.
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

### Riscos históricos confirmados estaticamente (baseline anterior ao MVP/C4)

- Após B2, não há provisionamento estrutural nos controllers de CI/manutenção; GET /api/manutencao ainda materializa, atualiza, exclui e reconcilia registros funcionalmente.
- Reconciliação com o estado atual e herança visual podem modificar/completar históricos.
- Exclusões por prefixo podem atingir registros de diferentes datas.
- Propagação para datas posteriores não verifica finalização; caches mantêm sincronização adicional.
- Não foi identificado estado persistido de preparação/finalização ou identidade de folha vazia.

São riscos/capacidades do baseline auditado, não afirmações sobre os GETs
atuais. MVP já removeu mutações nas consultas; C4 local persiste folha/ciclo e
proteções, habilitados explicitamente. Validação operacional real permanece pendente.

### Divisão proposta

| Etapa | Escopo | Situação / dependência |
|---|---|---|
| DATA-001A | Registrar contrato, comportamento observado e pendências | Concluída no commit 0093c69 — docs(domain): documenta ciclo operacional da CI |
| DATA-001B | Separar inicialização e saneamento dos caminhos HTTP | B1/B2 concluídas; DATA-001 permanece pendente |
| DATA-001C | Identidade/ciclo diário, folha vazia e cópia inicial | C4 operacional implementada localmente; provisionamento, carga, revisão e ativação pendentes |
| DATA-001D | GETs somente leitura e histórico sem reconstrução | Implementado localmente no C4; validação real/rollout pendentes |
| DATA-001E | Retirada confirmada somente na CI em preparação | Implementado localmente, transação CI/Controle e confirmação; validação real pendente |
| DATA-001F | Sincronização limitada e coexistência/histórico | Implementado localmente por garagem/ciclo/folha; concorrência SQL real/rollout pendentes |

### C4 operacional — candidato local de 07/10/2026

Serviços persistidos de início 03:00/finalização 18:30, timezone Campo Grande,
scheduler sem dependência nova, recovery somente do dia atual e bloqueios
atômicos CI/Controle implementados para revisão. Flag vazia mantém MVP legado;
`CI_NOVO_FLUXO_GARAGENS=VCG` corta leituras/escritas daquele contexto para C4,
sem dual-write/fallback. VCM não é ativada automaticamente.

Regra confirmada atual: garagem da folha != consorciada. CI VCG aceita VCM,
incluindo veículos fisicamente VCM; quatro grupos de bloqueados e seleção da
Garagem 1 via Veiculos. A proteção conservadora permanece somente no legado.
Título/posições/data original são persistidos, não inferidos do cache.

Pendentes: revisão final, provisionamento/validação administrativa, sete
importações históricas independentes e testes reais autorizados antes de
rollout. Nenhuma limpeza/SQL/migration executada; dados legados preservados.
SEC-006 permanece separada. Procedimento de ativação/rollback em DATABASE.md.

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

### MVP VCG — exceção temporal transitória e implementação para revisão

**CONFIRMADO pelo responsável:** enquanto C4 não estiver ativa, D é a data em
America/Campo_Grande; somente Controle D e CI D+1 podem receber operações,
entre 03:00:00 inclusive e 18:30:00 exclusive. Antes/depois, somente consulta.
Esta inferência é exclusiva do MVP legado; não muda o contrato definitivo de
DOMAIN.md, que será garantido por FolhaCI/CicloOperacional persistidos.

**Estado desta tarefa:** implementação candidata, não commitada e não validada
no SQL Server ou por teste manual. GETs de CI/Controle não materializam dados.
Comandos de snapshot exigem ADMIN, VCG, data exata e versão lida; transações
Serializable coordenam os dois lados e revalidam a janela. Contratos antigos
sem contexto/versão recusam gravação. A preparação é explícita na interface:
valida uma preparação D+1 existente sem modificá-la. No legado, destino vazio
não prova primeira preparação: cópia inicial e recópia automática estão
indisponíveis; a operação começa por inclusões manuais explícitas. Não há scheduler, importação, provisionamento ou ativação C4.

**Correções da revisão adversarial (candidatas):** retirada de BLOQUEADOS exige
lista nominal removeBlocked; ausência no snapshot não autoriza exclusão.
Sincronização limita-se aos bloqueios alterados e preserva divergências
não mencionadas, sem saneamento silencioso. Registros existentes inconsistentes
ou classificados VCM são rejeitados antes das escritas. Pending compartilhado
e refresh-required impedem comandos simultâneos e novas mutações após refresh
falho; POST confirmado é distinguido de falha de consulta.

**Resíduos para o rollout definitivo:** identidade de folha vazia e estado de
finalização continuam ausentes no legado; título adicional e rascunhos seguem
em localStorage e precisam de persistência oficial em C4. A preparação vazia
não possui marcador persistido; o backend rejeita recópia ambígua, inclusive
na primeira tentativa, sem restaurar itens removidos nem apagar Liberados. Não reconstruir consultas nem tratar cache como verdade.
Distribuição real dos registros legados, compatibilidade transacional no SQL
Server 2012 e concorrência com escritores externos precisam de teste controlado
separadamente autorizado antes da disponibilização. DATA-001D/E/F e SEC-006
permanecem abertas; esta tarefa não executa SQL nem modifica o schema.

### Pendências reais

Autorização separada do provisionamento dos artefatos candidatos C4 fase 2 já revisados e commitados; validação controlada Prisma 6.10/SQL Server 2012 antes do rollout, sem blocker da modelagem; procedimento administrativo posterior para preencher/corrigir recuperação sem mutação operacional de FINALIZADA; fornecer Excels oficiais, folha inicial e data de rollout. data_folha desconhecida e preservada. Horários, timezone, cópia integral, âmbito por garagem e ADMIN já decididos: não voltar a listá-los como dúvidas de negócio.

No baseline commitado anterior ao MVP acima, GET /api/manutencao continua mutável. C4 fase 2 alterou somente schema candidato, scripts administrativos e documentação, sem implementar regras C3 nem alterar frontend/controllers. A implementação candidata do MVP acima remove a mutação das consultas e altera frontend/controllers, sem ativar C4. Nenhuma migration foi criada/executada. Mover reconciliação para POST mantendo alteração histórica não satisfaz o contrato. SEC-006 segue separada.

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
