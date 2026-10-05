---
name: soltura-operations
description: >-
  Utilize esta skill quando o usuário solicitar desenvolvimento, correção ou regras
  de negócio relacionadas à Soltura de Veículos, Prancheta Digital, Carros Pendurados na CI,
  Substituição de Linha/Carro/Motorista ou Cartões de Pista.
---
# Procedimentos Operacionais do Módulo Soltura

Ao desenvolver ou alterar componentes de Soltura (`apps/web/src/pages/soltura/`):

## 1. Regras de domínio e grau de confiança

- Consulte [docs/DOMAIN.md](../../../docs/DOMAIN.md) antes de tomar decisões sobre CI, bloqueio, liberação, reserva, disponibilidade ou troca de veículo.
- Leia também [regras-ci-cartao.md](./references/regras-ci-cartao.md), tratando-o como contexto da implementação observada, não como fonte de regras operacionais formalmente confirmadas.
- Use as categorias de confiança de `docs/DOMAIN.md`: **CONFIRMADO** somente após validação formal; **ATUAL/OBSERVADO** para entendimento observado; **PLANEJADO** para intenção futura; e **PENDENTE DE VALIDAÇÃO** quando a regra ainda não estiver definida.
- Não transforme comportamento observado no código ou na interface em regra permanente da empresa. Não invente critérios de disponibilidade, bloqueio, liberação, reserva ou substituição.
- CI e Controle de Manutenção são conceitos distintos. No comportamento desejado atual, marcar um veículo como “em manutenção” ou “liberado” no Controle de Manutenção não deve alterar automaticamente a CI.
- Os critérios definitivos de disponibilidade e as regras completas de reserva ainda precisam de validação operacional.

## 2. Layout da prancheta digital

- Preserve o layout atual em duas colunas da prancheta de despacho quando a alteração afetar essa apresentação.
- Ao alterar listagens impressas, preserve o suporte A4 e os estilos `@media print` já existentes, conforme aplicável.
- Não reorganize a tela fora do escopo necessário.

## 3. Estado local, API e uso offline

- No fluxo de despacho observado, a interface atualiza o estado e grava um cache local em `localStorage` antes de enviar o registro à API.
- A implementação consultada não demonstra uma fila offline de despachos em `offline-db.ts` nem garante sincronização posterior desses registros. Não afirme persistência offline garantida nem implemente esse comportamento por suposição.
- Mudanças no fluxo offline exigem verificar o código vigente e validar explicitamente o comportamento pretendido.