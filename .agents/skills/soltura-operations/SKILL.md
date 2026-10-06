---
name: soltura-operations
description: >-
  Utilize esta skill quando o usuário solicitar desenvolvimento, correção ou regras
  de negócio relacionadas à Soltura de Veículos, Prancheta Digital, Carros Pendurados na CI,
  Substituição de Linha/Carro/Motorista ou Cartões de Pista.
---
# Procedimentos Operacionais do Módulo Soltura

Ao analisar ou alterar fluxos de Soltura, CI e Controle de Manutenção, incluindo frontend e backend:

## 1. Regras de domínio e grau de confiança

- Consulte [docs/DOMAIN.md](../../../docs/DOMAIN.md) antes de tomar decisões sobre CI, bloqueio, liberação, reserva, disponibilidade ou troca de veículo.
- Leia também [regras-ci-cartao.md](./references/regras-ci-cartao.md), distinguindo o contrato confirmado da DATA-001A, a implementação observada e as decisões pendentes.
- Use as categorias de confiança de `docs/DOMAIN.md`: **CONFIRMADO** somente após validação formal; **ATUAL/OBSERVADO** para entendimento observado; **PLANEJADO** para intenção futura; e **PENDENTE DE VALIDAÇÃO** quando a regra ainda não estiver definida.
- Não transforme comportamento observado no código ou na interface em regra permanente da empresa. Não invente critérios de disponibilidade, bloqueio, liberação, reserva ou substituição.
- CI e Controle de Manutenção têm ciclos distintos, com sincronização dos BLOQUEADOS confirmada na DATA-001C1. Consulte o domínio: execução preserva bloqueio; liberação de bloqueado exige confirmação prévia e cancelamento sem alterações. Não generalize independência como ausência de sincronização.
- Os critérios definitivos de disponibilidade e as regras completas de reserva ainda precisam de validação operacional.

## 2. Layout da prancheta digital

- Preserve o layout atual em duas colunas da prancheta de despacho quando a alteração afetar essa apresentação.
- Ao alterar listagens impressas, preserve o suporte A4 e os estilos `@media print` já existentes, conforme aplicável.
- Não reorganize a tela fora do escopo necessário.

## 3. Estado local, API e uso offline

- No fluxo de despacho observado, a interface atualiza o estado e grava um cache local em `localStorage` antes de enviar o registro à API.
- A implementação consultada não demonstra uma fila offline de despachos em `offline-db.ts` nem garante sincronização posterior desses registros. Não afirme persistência offline garantida nem implemente esse comportamento por suposição.
- Mudanças no fluxo offline exigem verificar o código vigente e validar explicitamente o comportamento pretendido.

## Contrato temporal da CI — DATA-001A / DATA-001C1

- Antes de alterar fluxos temporais no frontend/backend, consulte obrigatoriamente o [contrato operacional em DOMAIN.md](../../../docs/DOMAIN.md#data-001a--contrato-operacional-da-ci). Confirmação não significa implementação.
- Preserve fotografias finalizadas: não reconciliar, completar ou reconstruir históricos com o presente; GET somente leitura.
- Distinga CI de Controle de Manutenção e preserve coexistência de bloqueio e execução.
- Não retire bloqueio automaticamente ao liberar na manutenção; retirada confirmada deve atingir somente a CI em preparação.
- Não assuma data futura como preparação, não invente finalização/modelagem nem substitua fotografias por bloqueio global por inferência.
- Consulte as decisões pendentes no domínio. Esta seção registra regras confirmadas; a referência distingue contrato de implementação observada.


## Orientação para DATA-001C1

- Leia o [contrato operacional complementar](../../../docs/DOMAIN.md#data-001c1--ciclos-operacionais-e-continuidade-dos-bloqueados); DOMAIN.md é a especificação principal, esta skill orienta a leitura.
- Respeite a correspondência manutenção do dia / próxima CI em preparação e continuidade dos bloqueios, sem transportar execução/liberados ou alterar finalizadas.
- Não invente mecanismos de ciclo, endpoints, transações ou schema, nem atribua finalidade a data_folha. As regras confirmadas ainda precisam de implementação; GET continua mutável.
