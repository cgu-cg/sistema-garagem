---
name: soltura-operations
description: >-
  Utilize esta skill quando o usuário solicitar desenvolvimento, correção ou regras
  de negócio relacionadas à Soltura de Veículos, Prancheta Digital, Carros Pendurados na CI,
  Substituição de Linha/Carro/Motorista ou Cartões de Pista.
---
# Procedimentos Operacionais do Módulo Soltura
Ao desenvolver ou alterar componentes de Soltura (`apps/web/src/pages/soltura/`), siga os passos:
## 1. Regras de Negócio e Glossário
Consulte a documentação de apoio antes de implementar regras complexas:
- Leia o arquivo [regras-ci-cartao.md](./references/regras-ci-cartao.md) para entender os cálculos de status e fluxos de pendência.
## 2. Layout da Prancheta Digital
- A prancheta deve manter a visualização em **2 colunas** na tela de despacho.
- Qualquer alteração na listagem deve garantir suporte a impressão A4 com a classe `@media print`.
## 3. Persistência Offline e Optimistic UI
- Operações de saída de veículo no pátio devem atualizar a interface imediatamente (*Optimistic UI*) e persistir localmente via `offline-db.ts` antes de confirmar com a API.