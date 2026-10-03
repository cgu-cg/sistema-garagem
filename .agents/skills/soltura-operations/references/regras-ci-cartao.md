# Soltura: conceitos e comportamento observado

Este material apoia a leitura do módulo, mas não substitui validação formal
com a operação. Consulte [docs/DOMAIN.md](../../../../docs/DOMAIN.md) antes de
definir ou alterar regras de negócio. O grau de confiança das afirmações segue
as categorias usadas nesse documento.

## Conceitos atuais/observados

- **Soltura:** etapa operacional de liberação de veículo para execução de um
  serviço. Os critérios completos para determinar a liberação ainda estão
  pendentes de validação.
- **CI Manutenção:** no entendimento operacional atual, registra veículos
  solicitados pela oficina ou bloqueados/pendurados. É um conceito distinto do
  Controle de Manutenção.
- **Controle de Manutenção:** permite acompanhar situações como “em
  manutenção” e “liberado”. No comportamento desejado atual, alterar esses
  estados não deve alterar automaticamente a CI.
- **Carro programado e realizado:** o domínio atual observado distingue o
  veículo planejado para a tabela daquele que efetivamente executa a soltura.
  A diferenciação formal para todos os turnos permanece pendente de validação.
- **Cartão de Pista** e **carro reserva:** são termos usados no contexto
  operacional do módulo; seus critérios e conteúdo completos não estão
  formalizados aqui como regras confirmadas.

## Troca de veículo

### Comportamento observado na implementação

O modelo `Soltura` contém campos para `carroProgramado`, `carroRealizado`,
`substituido` e `historicoTrocas`. A API serializa o conteúdo de
`historicoTrocas` no campo do registro de soltura e o interpreta ao listar os
registros. O schema atual não define um modelo Prisma separado chamado
`SolturaHistorico`; não se deve documentar esse nome como estrutura vigente.

Isso descreve armazenamento e fluxo técnico observados, não confirma uma
auditoria imutável nem a regra operacional da troca.

### Pendente de validação operacional

- Quando uma troca deve ocorrer e quais motivos são válidos.
- Se e em que condições o carro original fica disponível novamente.
- Se o veículo substituto deve ser uma reserva e quais condições definem uma
  reserva elegível.
- Como uma CI ou o estado do Controle de Manutenção afeta uma troca ou
  liberação.

Não assumir que selecionar uma tabela, informar um motivo ou escolher um
reserva produz automaticamente uma sequência operacional aprovada.

## Disponibilidade e reserva

Os critérios definitivos de disponibilidade do veículo e as regras completas
de reserva ainda precisam de validação. A disponibilidade pode envolver
informações operacionais externas ao sistema; não a reduza a um booleano nem
crie regras automáticas de bloqueio ou liberação sem validação formal.

## Layout e estado local

O código atual contém uma prancheta de despacho com apresentação em duas
colunas e estilos de impressão. Preserve-os quando a tarefa afetar essas áreas,
sem transformar detalhes de apresentação em regras de domínio.

No despacho observado, a interface atualiza o estado e grava cache local em
`localStorage` antes de enviar o registro à API. A evidência consultada não
mostra uma fila de despachos pendentes em `offline-db.ts` nem garante
sincronização posterior offline. Trate a resiliência offline do despacho como
limitação, não como garantia.
