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
- **Controle de Manutenção:** representa o próprio dia. A DATA-001C1 confirma sincronização dos BLOQUEADOS com a próxima CI em preparação; colocar em manutenção preserva o bloqueio, e liberação de bloqueado exige confirmação prévia. Consulte o domínio para o contrato completo.
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

## CI — contrato confirmado e lacunas da DATA-001A

**CONFIRMADO:** consulte o [contrato e pendências em DOMAIN.md](../../../../docs/DOMAIN.md#data-001a--contrato-operacional-da-ci). A CI é fotografia diária preparada antecipadamente, preservada após finalização. Bloqueio e execução podem coexistir. Retirada confirmada deve atingir preparação, sem inferir esse estado só pela data.

**ATUAL/OBSERVADO:** interface restringe edição a amanhã, calcula clones e algumas ações persistem cópias. Não há preparação/finalização ou versão persistida identificada. GETs podem escrever; exclusões por prefixo podem atingir várias datas. Isso não constitui regra nem garantia de histórico. A especificação detalhada permanece no domínio; o baseline não implementa a arquitetura proposta na C3.


## DATA-001C1 — Complemento operacional confirmado

Consulte [DOMAIN.md](../../../../docs/DOMAIN.md#data-001c1--ciclos-operacionais-e-continuidade-dos-bloqueados), fonte principal: ciclos distintos com sincronização bidirecional dos bloqueados entre manutenção atual e CI correspondente em preparação; continuidade dos bloqueios vigentes; execução/liberados não atravessam como estado inicial; confirmação antes de liberar bloqueado e cancelamento sem efeitos. Isso não autoriza alterar fotografias finalizadas nem comprova implementação técnica. C3 complementa as decisões operacionais; endpoints, transações e schema continuam sem implementação, e data_folha sem finalidade comprovada.


## DATA-001C3 — Contrato consolidado e proposta

[DOMAIN.md](../../../../docs/DOMAIN.md#data-001c3--contrato-consolidado-do-ciclo-e-da-fotografia-ci) é a fonte principal; [DATABASE.md](../../../../docs/DATABASE.md#data-001c3--proposta-de-schema-nao-implementada) contém schema proposto, não implementado. Folha e ciclo distintos, ADMIN e garagens isoladas; eventos diários 03:00/18:30 em America/Campo_Grande. Cópia integral inclui slots e título variável de reforço; só Bloqueados sincronizam. Título EM MANUTENÇÃO da CI não é estado do Controle. Consulta após fechamento, sem mutações noturnas/reabertura; confirmação anterior à liberação, cancelamento sem efeitos e concorrência protegida no backend.

Recuperação mesma data executa evento pendente com timestamp real; vários dias criam estruturas vazias identificadas sem reconstrução. Excel oficial gera fotografias independentes IMPORTACAO via procedimento externo/manual futuro. Piloto VCG; VCM não habilitada automaticamente. Fonte oficial futura persistida, cache sem autoridade. Esses requisitos não descrevem o runtime atual: GET de manutenção ainda escreve e proteções/modelos novos permanecem pendentes.
