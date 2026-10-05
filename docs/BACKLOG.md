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

**Status:** Pendente
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

Revisar com o domínio quais efeitos são intencionais e separar DDL e
mutações dos handlers de leitura quando apropriado.

Não alterar comportamento nesta tarefa.

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