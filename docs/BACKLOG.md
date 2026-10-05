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