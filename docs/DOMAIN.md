# Domain model e entendimento operacional atual

## Consolidação em 09/10/2026 — precedência vigente

O C4 abre às 03:00 inclusivo e fecha às 20:00 exclusivo, em
America/Campo_Grande. A seleção inicial da CI usa hoje antes das 03h e
amanhã a partir das 03h; sua data é independente da Soltura e do Histórico.
ADMIN pode escrever nos contextos habilitados; manutencao vinculada
explicitamente a VCG pode escrever apenas VCG. Leituras C4 e de Escala e
gravações de Soltura verificam a garagem do usuário no backend; ADMIN pode
consultar todos os contextos. Publicação de Escala exige ADMIN.

As referências históricas abaixo a 18:30/ADMIN exclusivo foram substituídas
pelo [horário vigente](DATA-001-C4-HORARIO-20H.md) e pelas
[permissões vigentes](DATA-001-C4-PERMISSOES.md). O legado mantém 18:30.
As restrições recentes de Soltura estão em
[SOLTURA-ESCALA-SEGURANCA.md](SOLTURA-ESCALA-SEGURANCA.md).
A integração não certifica dados nem autoriza publicação; consulte o
[relatório da consolidação](CONSOLIDACAO-5173.md).

## DATA-001/C4 — Contrato operacional confirmado em 07/10/2026

Esta seção atualiza os baselines históricos A/C1/C3 abaixo. A implementação
local C4 é opt-in e ainda requer provisionamento, carga inicial e validação
operacional autorizados; este documento não afirma implantação no banco.

- Garagem da FolhaCI/CicloOperacional é contexto, não consorciada nem garagem
  física inferida pelo prefixo. Folha VCG admite VSF, VCG, JTU **e VCM** nos
  bloqueados, inclusive 3083/VCM e veículos fisicamente VCM. Não converter
  consorciada nem corrigir históricos silenciosamente. VCG/VCM continuam
  contextos separados; cópia somente dentro da mesma garagem.
- ItemFolhaCI exige consorciada VSF/VCG/JTU/VCM somente em BLOQUEADO.
  Nas demais categorias, ausência no documento é NULL; informação explicitamente
  conhecida pode ser preservada. Nunca inferir pelo prefixo, garagem física,
  garagem da folha ou participação do mesmo veículo em outra categoria.
  Os sete Excel oficiais de 01–07/10/2026 identificam consorciada explicitamente
  somente nos grupos BLOQUEADOS. Prefixo 23/Bilhetagem permanece "23", sem zeros
  adicionais e sem atribuir consorciada ausente.
- Campos opcionais ausentes permanecem NULL na consulta, cópia e persistência
  C4; não fabricar motivo, gravidade ALTA ou status BLOQUEADO. Motivo permanece
  nullable, inclusive em BLOQUEADO: os documentos não estabelecem obrigatoriedade
  universal desse campo e o contrato anterior aceitava ausência. Isso não
  flexibiliza consorciada/data obrigatórias dos bloqueados nem posições do reforço.
- Em `America/Campo_Grande`, todos os dias, às 03:00 inicia-se o ciclo D e
  copia-se integralmente a folha D finalizada para D+1 em EM_PREPARACAO.
  Novas PKs preservam chave lógica dos itens, categorias/subtipos/setores,
  horários, posição FIXO/EXTRA, datas/motivos e título da coluna adicional.
  Controle D inicia somente com bloqueados; execução/liberados ficam vazios.
- Mutações exigem ADMIN, contexto explícito, ciclo atual ligado à folha em
  preparação e janela `03:00:00 <= hora < 18:30:00`. Às 18:30, D+1 é
  FINALIZADA e imutável. Folha vazia possui identidade e estado persistidos.
- Bloqueios são sincronizados atomicamente apenas Controle D ↔ CI D+1 em
  preparação. Uma linha de EstadoManutencao por veículo/ciclo pode representar
  bloqueado e emExecucao simultaneamente. No máximo um BLOQUEADO por
  folha/prefixo; tentativa adicional é rejeitada, sem deduplicação.
  Remover bloqueio preserva execução. Liberação de bloqueado exige confirmação
  antes da chamada, retira bloqueio e execução e representa LIBERADO;
  cancelamento não grava. Nunca LIBERADO + BLOQUEADO.
- Oficina/preventiva/reforço/título EM MANUTENÇÃO da CI não são estado de
  execução e não sincronizam com o Controle. Observações de bloqueio e
  oficina são distintas. Título pode existir sem itens ou ser desconhecido
  (`NULL`); cache/default visual não deve inventá-lo.
- Reforço tem 12 posições FIXO (1..12), nos dois grupos do layout, e EXTRA
  com ordem inteira positiva. Identidade é tipo+ordem, nunca horário/prefixo.
- GET não cria/copia/finaliza/reconcilia/recupera/provisiona. Jobs idempotentes
  recuperam eventos vencidos do mesmo dia. Sem folha D finalizada, criam
  apenas estruturas atuais vazias RECUPERACAO; não fabricam dias anteriores.
- Histórico 01–07/10/2026 será importado por SQL manual revisado: cada Excel
  é fotografia independente FINALIZADA/IMPORTACAO, sem parser no runtime.
  Somente nessa carga, data de bloqueio ausente/inválida/posterior à folha
  recebe 01/10/2026 (3083, 3951 em 01/02 e 1322). Uso normal rejeita datas
  inválidas/futuras ao dia operacional D; bloqueio sincronizado é vigente
  no Controle D. Não utiliza esse fallback. Cópia preserva data original;
  carga histórica é validada contra a data de sua própria folha.

O seletor CI VCG consulta o endpoint existente de Veiculos, usando o valor
real `garagem = 1`, sem exclusão por prefixo VCM. Colunas observadas no código:
`idCarro`, `garagem`, `ativo`. Não existe coluna de consorciada comprovada
nessa consulta: o grupo de bloqueio escolhido é informado explicitamente e
a consorciada persistida permanece preservada. Consulta não altera Veiculos.

`CI_NOVO_FLUXO_GARAGENS` vazia mantém legado; `VCG` habilita só o piloto;
VCM exige configuração explícita. Com C4 habilitado, C4 é fonte de verdade,
sem fallback ou dupla escrita legada. A proteção física conservadora anterior
permanece apenas no MVP legado desativado para aquela garagem.

Este documento tem caráter de documentação de domínio e não substitui validação formal do processo pela operação, manutenção, portaria e responsável do negócio.

## 1. Objetivo e limites do sistema

### Status: ATUAL/OBSERVADO

O Sistema Garagem não pretende substituir o ERP existente.

O ERP continua sendo utilizado para processos como abertura e gestão de ordens de serviço de manutenção.

O Sistema Garagem pretende digitalizar e integrar processos operacionais que hoje dependem de Excel, controles manuais e consultas a sistemas existentes.

### Limites observados

- O sistema atua como apoio operacional para acompanhamento, liberação e organização do uso da frota.
- O ERP continua sendo a referência para gestão formal de manutenção e ordens de serviço.
- O Sistema Garagem não deve assumir, automaticamente, todas as responsabilidades do ERP.

### Conflito a validar

- A documentação técnica existente em código pode sugerir uma modelagem operacional mais rígida do que o processo observado em campo.
- O entendimento atual indica que parte do processo ainda depende de decisões humanas e de fontes fora do sistema.

## 2. Níveis de confiança da documentação

### CONFIRMADO

O termo "CONFIRMADO" deve ser reservado apenas para informações validadas formalmente pelo responsável do processo.

As regras da DATA-001A foram explicitamente confirmadas pelo usuário em 2026-10-05; DATA-001C1 e DATA-001C3 em 2026-10-06. Os demais conteúdos mantêm a classificação indicada. Confirmação operacional não significa implementação existente.

### ATUAL/OBSERVADO

É o nível principal usado neste documento.

Representa o entendimento atual do processo, obtido por experiência de uso, conversas com colaboradores e observação do comportamento do sistema.

### PLANEJADO

Representa comportamento ou módulo desejado para o futuro, ainda não formalmente validado.

## 3. Visão geral do fluxo operacional

### Status: ATUAL/OBSERVADO

A soltura é uma etapa final do processo operacional.

Antes dela, existe trabalho de manutenção e portaria.

A manutenção conversa com colaboradores da oficina e verifica:

- veículos que serão necessários para trabalho da oficina no próximo dia;
- veículos atualmente sendo trabalhados;
- veículos que poderão ser liberados;
- veículos que devem permanecer bloqueados/pendurados.

### Fluxo geral observado

1. a oficina e a manutenção avaliam a frota e os veículos em uso;
2. a portaria acompanha a situação operacional do pátio e dos veículos;
3. a escala de carros é montada considerando CI, manutenção, pátio e terminais;
4. a soltura do período atual e a preparação da programação do próximo período podem acontecer em paralelo;
5. a operação finaliza com a soltura dos veículos e a execução do serviço.

### Conflito a validar

- O código e os módulos observados podem apresentar uma lógica mais formal e estruturada do que o processo real do dia a dia.
- Há risco de que alguns termos utilizados em interfaces e relatórios estejam sendo usados com intenção operacional, mas sem correspondência 1:1 com o processo formalizado pela empresa.

## 4. Veículo/Carro

### Status: ATUAL/OBSERVADO

O termo "veículo" e o termo "carro" são usados de forma operacionalmente sobreposta no sistema.

No contexto de turno e soltura, o prefixo do veículo é a unidade mais importante para rastreio.

### Conceito operacional

Um veículo pode estar em um dos seguintes estados operacionais observados:

- em manutenção;
- liberado;
- bloqueado/pendurado;
- disponível para operação;
- indisponível por condição operacional.

### Importante

A disponibilidade de um veículo não deve ser tratada como um simples booleano.

A decisão operacional pode depender de:

- bloqueios na CI;
- situação no Controle de Manutenção;
- observação física do pátio;
- presença do veículo em garagem ou terminal;
- condição percebida/testada no momento da soltura.

### Ponto a validar

A regra definitiva de disponibilidade ainda precisa ser validada formalmente pela operação.

## 5. Linha

### Status: ATUAL/OBSERVADO

Uma linha possui várias tabelas.

As tabelas representam serviços/horários diferentes de uma mesma linha.

### Concepção operacional

- a linha representa a identidade do serviço;
- a tabela representa a variação operacional dentro dessa linha;
- a portaria usa esse conjunto para planejar e acompanhar a execução diária.

### Ponto a validar

Nem sempre o sistema pode tratar linha e tabela como entidades totalmente independentes do planejamento operacional real.

## 6. Tabela

### Status: ATUAL/OBSERVADO

A tabela é o serviço/horário associado a uma linha.

Ela define a execução específica prevista para um veículo e para um conjunto de condições operacionais.

### Uso observado

- a portaria monta a programação por tabela;
- a soltura usa a tabela como contexto da operação;
- o veículo programado e o veículo realizado podem ser distintos.

### Conflito a validar

Há risco de que, em alguns contextos, a tabela seja tratada como dado de escala e em outros como dado de operação interna.

## 7. Soltura

### Status: ATUAL/OBSERVADO

A soltura é uma das etapas finais do processo operacional.

Ela envolve a liberação do veículo para execução do serviço.

### Observações

- a portaria pode preparar programação do próximo período enquanto executa a soltura do período atual;
- diferentes veículos podem ser usados em comparação com o que foi programado;
- a soltura pode depender de condições externas, como presença física do veículo, situação de manutenção, condição do pátio e disponibilidade operacional.

### Ponto a validar

Ainda não foi formalmente validado qual conjunto exato de regras transforma um veículo em "liberado" para operação no processo completo.

## 8. Carro programado e realizado

### Status: ATUAL/OBSERVADO

Carro programado:

- é o veículo planejado pela portaria para executar determinada tabela/serviço.

Carro realizado:

- é o veículo que efetivamente executa a soltura/serviço.

### Exemplo conceitual

- carro programado: 1205;
- motorista vai buscar/testar o veículo;
- é identificado um problema;
- motorista retorna à portaria;
- outro veículo é designado;
- carro realizado: 1210.

### Observação importante

Este exemplo é conceitual e não deve ser transformado em dado real do sistema.

### Ponto a validar

A diferenciação formal entre carro programado e realizado ainda precisa ser conferida com a operação e com o comportamento real esperado em cada turno.

## 9. CI Manutenção

### Status: ATUAL/OBSERVADO

A CI contém, no entendimento atual:

- veículos pedidos pela oficina para o próximo dia;
- veículos bloqueados/pendurados.

### Observação

A CI é entendida como mecanismo de indicação de veículos que não devem ser liberados sem tratamento específico.

### Importante

Conforme a DATA-001C1, colocar um veículo em manutenção preserva seu bloqueio. BLOQUEADOS da manutenção do dia sincronizam com BLOQUEADOS da CI correspondente em preparação; liberação de veículo bloqueado exige confirmação antes de qualquer alteração, preservando CIs finalizadas.

### Conflito a validar

- O código e a interface podem sugerir a existência de integrações mais automáticas entre controle de manutenção e CI.
- O contrato confirmado na DATA-001A define coexistência e retirada explicitamente confirmada dirigida à preparação; a implementação ainda apresenta lacunas.

## 10. Controle de Manutenção

### Status: ATUAL/OBSERVADO

O Controle de Manutenção é usado para permitir que a portaria visualize a situação operacional dos veículos durante o dia.

Entre os estados/conceitos utilizados estão:

- em manutenção;
- liberado.

### Observação

O Controle de Manutenção pode consultar os veículos bloqueados na CI e existe necessidade de permitir retirada/desbloqueio quando aplicável.

### Importante

Conforme o contrato confirmado na DATA-001A, execução na oficina pode coexistir com bloqueio da CI. Liberação não deve retirar silenciosamente esse bloqueio; retirada confirmada deve atingir somente a CI em preparação.

### Conflito a validar

- A DATA-001C1 confirma continuidade e sincronização dos bloqueados. A implementação do ciclo e da proteção temporal permanece pendente; cancelamento da liberação de bloqueado não pode alterar nenhum estado.

## 11. ERP / Ordem de Serviço

### Status: ATUAL/OBSERVADO

Existe um ERP separado onde a portaria abre ordens de serviço.

Existem conceitos como:

- preventiva;
- corretiva;
- defeito.

### Limitação do Sistema Garagem

O Sistema Garagem não deve duplicar automaticamente as responsabilidades do ERP.

### Regra observada

Um veículo não deve operar quando houver condição que impeça sua circulação ou prejudique a operação/atendimento aos passageiros.

### Ponto a validar

Os critérios formais para decidir quando a condição do veículo impede circulação ainda precisam ser validados com a manutenção.

## 12. Portaria

### Status: ATUAL/OBSERVADO

A portaria é o ponto central de planejamento e coordenação.

Ela utiliza:

- informações da CI;
- informações do Controle de Manutenção;
- situação física do pátio;
- condições dos terminais;
- disponibilidade operacional de cada veículo.

### Papel observado

A portaria monta a programação de veículos para o próximo período/dia e também pode estar realizando a soltura do período atual.

### Conflito a validar

- O processo real pode exigir simultaneidade entre planejamento e execução, o que nem sempre se traduz em fluxos estritamente sequenciais no sistema.

## 13. Motorista

### Status: PLANEJADO / ATUAL/OBSERVADO

A gestão de escala de motoristas ainda não está implementada no Sistema Garagem.

Hoje esse processo utiliza Excel.

### Planejamento futuro

Está planejada futuramente a digitalização de conceitos como:

- motorista;
- escala;
- folga;
- férias;
- afastamento;
- substituição;
- associação do motorista ao serviço/tabela.

### Importante

Não devem ser inventadas regras formais para esses conceitos neste documento.

## 14. Garagem

### Status: ATUAL/OBSERVADO

Existem múltiplas empresas, garagens e terminais na operação.

### Observação

As quantidades exatas e seus relacionamentos ainda precisam ser validados.

### Importante

Não devem ser fixados números como regra de domínio neste documento.

## 15. Terminal

### Status: ATUAL/OBSERVADO

Os terminais são parte do contexto operacional da portaria e da escala.

Eles ajudam a determinar a disponibilidade e a necessidade de veículos em cada período.

### Ponto a validar

Não foi observado neste repositório um mapeamento formal completo de todos os terminais, suas dependências e impactos no processo.

## 16. Empresa/Consórcio

### Status: ATUAL/OBSERVADO

Existem múltiplas empresas, garagens e terminais na operação.

A relação entre empresa, consórcio e garagem ainda precisa ser validada.

### Conflito a validar

Há possibilidade de que a modelagem técnica atual use termos diferentes dos usados pela operação, e isso deve ser considerado ao evoluir o sistema.

## 17. Reserva

### Status: ATUAL/OBSERVADO

Reservas são utilizadas operacionalmente para ajudar a suprir necessidade de veículo quando há indisponibilidade, por exemplo por manutenção ou bloqueio.

### Observação

A regra completa de reservas ainda precisa ser validada.

### Ponto a validar

A reserva pode ter regras próprias por garagem, empresa, terminal, disponibilidade e situação de manutenção, mas isso ainda não foi formalizado como regra de domínio.

## 18. Abastecimento

### Status: ATUAL/OBSERVADO

O abastecimento acontece antes das solturas.

Atualmente ele não deve ser tratado como bloqueio automático para soltura.

### Observação

O abastecimento é um processo operacional relacionado à disponibilidade do veículo e ao preparo da operação, mas não deve ser confundido com regra de liberação final.

## 19. Catracas/Bilhetagem

### Status: ATUAL/OBSERVADO

Atualmente o módulo é predominantemente separado da soltura.

Pode existir integração futura, mas ela não deve ser assumida como requisito atual.

### Conflito a validar

- O código pode possuir módulos e integrações que apontam para relação com catracas e bilhetagem.
- O processo operacional reportado pela equipe indica que esse módulo ainda é predominantemente independente da operação de soltura no curto prazo.

## 20. Conceitos planejados

### Status: PLANEJADO

Os seguintes itens aparecem como intenção de evolução futura e não devem ser tratados como regras atuais:

- digitalização da gestão de motoristas;
- escala de motoristas e substituições;
- integração mais profunda entre CI, manutenção e soltura;
- regras automatizadas de disponibilidade e bloqueio;
- sincronização mais formal entre manutenção, pátio e operação;
- digitalização de reservas com regras mais explícitas;
- maior integração com catracas e bilhetagem.

### Observação

Esses conceitos podem ser implementados no futuro, mas exigem validação de processo antes de se tornarem regra de domínio.

## 21. Pontos que precisam de validação

### Status: ATUAL/OBSERVADO / PLANEJADO

Os pontos abaixo devem ser considerados pendentes de conferência formal:

- regra definitiva de disponibilidade de veículo;
- critérios formais para impedir circulação do veículo;
- detalhes pendentes da CI/manutenção listados na DATA-001A e critérios completos de disponibilidade operacional;
- manutenção de matriz de empresas, garagens, terminais e consórcios;
- regras completas de reserva;
- digitalização de motoristas e escalas;
- relação formal entre linha, tabela e serviço;
- integração futura entre catracas/bilhetagem e soltura;
- distinção precisa entre dados de operação e dados de planejamento.

## 22. Conflitos observados entre entendimento operacional e código/documentação

### Situação 1

CI e Controle de Manutenção são conceitos operacionais distintos, com responsabilidades e ciclos próprios. Isso não significa ausência de integração: a DATA-001C1 confirma a sincronização dos bloqueios vigentes entre o Controle de Manutenção do dia operacional atual e a CI correspondente em preparação.

BLOQUEADO + EM MANUTENÇÃO podem coexistir; os estados de oficina não devem ser confundidos com o bloqueio. Disponibilidade operacional e soltura também são conceitos distintos, sem que essa distinção implique ausência de integração.

O problema da implementação atual não é a existência da sincronização, mas os efeitos colaterais implícitos, a reconstrução durante consultas e a ausência de destino temporal seguro para algumas operações. Essa sincronização não deve alterar CI finalizada/histórica nem manutenção histórica. Os mecanismos técnicos permanecem pendentes.

### Situação 2

O domínio de "disponibilidade" é mais complexo do que um booleano; o código e os módulos podem representar estados mais simples, mas a operação real parece depender de contexto adicional.

### Situação 3

O domínio de motoristas, escala, folga e substituição aparece como processo ainda não implementado e ainda dependente de Excel.

### Situação 4

As entidades de garagem, empresa, terminal e consórcio parecem relevantes para a operação, mas a estrutura e os relacionamentos exatos ainda precisam ser validados.

## 23. Resumo executivo

Este documento representa o entendimento atual do domínio do Sistema Garagem, com classificação explícita de confiança.

- As informações com status ATUAL/OBSERVADO refletem o entendimento operacional atual.
- As informações com status PLANEJADO representam evolução desejada, mas ainda não validada.
- As regras CONFIRMADAS na DATA-001A, DATA-001C1 e DATA-001C3 registram a confirmação explícita recebida do usuário; não demonstram implementação existente.

O contrato confirmado da DATA-001A orienta as próximas etapas. Os demais conteúdos observados ou planejados permanecem base de discussão e não devem ser promovidos a regras confirmadas por inferência.

## DATA-001A — Contrato operacional da CI

### CONFIRMADO — confirmação explícita do usuário em 2026-10-05

As regras abaixo prevalecem sobre trechos anteriores que tratam genericamente a relação CI/manutenção como pendente. Confirmação do contrato não significa implementação existente.

- A CI é uma fotografia operacional diária, preparada antecipadamente, normalmente no dia anterior.
- Historicamente, parte-se de uma cópia da CI anterior, com inclusões, exclusões e alterações para preparar a próxima.
- Durante a preparação pode haver alterações. Após finalizada para uso operacional, a CI não deve sofrer alterações posteriores.
- Consulta de CI finalizada/passada retorna a fotografia registrada daquele dia. Não deve reconstruir, completar, reconciliar ou modificar silenciosamente históricos com o estado atual. GETs devem ser somente leitura.
- CI e Controle de Manutenção são relacionados, mas distintos. O veículo pode estar simultaneamente bloqueado pela CI e em execução/manutenção; esses estados não são mutuamente exclusivos.
- Liberação na manutenção não deve retirar silenciosamente o bloqueio da CI. Retirada explicitamente confirmada deve atingir a CI em preparação, preservando as finalizadas.
- O processo trabalha com fotografias diárias; não foi decidida substituição por um único bloqueio global com intervalo de vigência.

### ATUAL/OBSERVADO — implementação e divergências

A interface permite edição de amanhã, bloqueia hoje/passado e calcula cópias; algumas ações materializam essas cópias. Não foi identificado estado persistido de preparação/finalização, data de finalização ou versão. Após B1/B2, DDL e saneamentos históricos saíram desses controllers; GET de manutenção ainda copia, cria, atualiza, exclui e reconcilia registros funcionalmente. Herança pode completar históricos e exclusões por prefixo podem atingir várias datas. Isso diverge do contrato confirmado.

Fontes: controllers ciBloqueios.ts/manutencao.ts, CiManutencaoView.tsx e managers de CI/manutenção. Análise estática, sem consulta ao banco.

### Decisões complementadas pela DATA-001C3

Calendário, finalização, conteúdo copiado, âmbito e janela operacional foram confirmados na C3 abaixo. Persistência, execução técnica, transações e adoção dos dados continuam pendentes. Não presumir preparação apenas por data futura; identidade/status ainda não estão implementados.

## DATA-001C1 — Ciclos operacionais e continuidade dos bloqueados

### CONFIRMADO — decisões do responsável pelo processo registradas em 2026-10-06

Esta seção complementa a DATA-001A e prevalece sobre referências anteriores que tratam genericamente sincronização ou liberação mantendo bloqueio como indefinidas. DOMAIN.md permanece a fonte principal das regras. Confirmação não significa implementação existente.

- Controle de Manutenção representa a situação operacional do próprio dia e muda durante o trabalho da oficina. BLOQUEADO, EM MANUTENÇÃO e LIBERADO são conceitos distintos; BLOQUEADO + EM MANUTENÇÃO podem coexistir. Colocar em manutenção não remove o bloqueio nem o veículo da CI em preparação.
- A CI é preparada antecipadamente. CI passada/finalizada preserva exatamente sua fotografia persistida e não pode sofrer alteração retroativa.
- Durante o dia operacional, BLOQUEADOS da manutenção do dia atual sincronizam bidirecionalmente com BLOQUEADOS da CI em preparação para o próximo dia operacional. Adicionar bloqueado em qualquer um desses dois destinos deve refletir no outro. Isso não autoriza alterar manutenção anterior, CI do dia já finalizada ou outras CIs finalizadas.
- Retirada explícita de BLOQUEADOS da manutenção deve retirar também de BLOQUEADOS da CI em preparação correspondente, preservando as finalizadas.
- Ao tentar liberar veículo ainda bloqueado, confirmação é pré-condição ANTES de qualquer alteração. Confirmar conclui a liberação, retira de EM MANUTENÇÃO conforme o fluxo operacional, representa em LIBERADOS e remove de BLOQUEADOS da manutenção e da CI em preparação correspondente.
- Cancelar ou não confirmar não altera nada: não adiciona a LIBERADOS, não retira de EM MANUTENÇÃO/BLOQUEADOS e não altera a CI. Neste fluxo não há resultado LIBERADO + BLOQUEADO. Isso não transforma todos os estados em mutuamente exclusivos: BLOQUEADO + EM MANUTENÇÃO continua permitido.
- Bloqueios vigentes continuam entre dias enquanto não retirados/liberados. No novo ciclo, iniciam a manutenção do dia e são o ponto de partida dos BLOQUEADOS da próxima CI em preparação.
- EM MANUTENÇÃO e LIBERADOS pertencem ao dia e não são carregados como estados iniciais do dia seguinte. O estado inicial dos bloqueios continuados é conceitualmente bloqueado=true, em_execucao=false, liberado=false, inclusive se estavam também em manutenção no dia anterior.
- Inicialização/materialização do novo dia deve ser explícita e independente de GET. A continuidade/sincronização é uma necessidade operacional real, mas consulta genérica não pode materializar ou reconciliar silenciosamente com o presente. GET deve consultar o estado persistido da data, sem reconstruir arbitrariamente históricos.

### Exemplos confirmados

Durante 01/10/2026, BLOQUEADOS do Controle de Manutenção 01/10 sincronizam com BLOQUEADOS da CI 02/10 em preparação: adicionar 3000 na CI o inclui na manutenção 01/10; adicionar 4000 na manutenção o inclui na CI 02/10. Nenhuma dessas ações altera CI 01/10 finalizada.

Se 3000 e 4000 continuam bloqueados ao fim de 01/10, iniciam BLOQUEADOS da manutenção 02/10 e da CI 03/10 em preparação. Mesmo se 3000 estava BLOQUEADO + EM MANUTENÇÃO em 01/10, somente seu bloqueio continua. EM MANUTENÇÃO e LIBERADOS começam limpos em 02/10; 2424 apenas LIBERADO em 01/10 não é carregado como liberado no novo dia.

### ATUAL/OBSERVADO — lacunas da implementação

B1 removeu saneamentos históricos e B2 removeu DDL e carga inicial acoplada dos controllers. GET /api/manutencao ainda materializa herança, faz upserts e reconcilia/exclui por CI ativa. Fluxos de retirada podem atingir prefixos em várias datas; caches recompõem listas. Esses comportamentos não implementam a correspondência dos ciclos nem proteção de finalizadas. Não há garantia de cancelamento sem efeitos ou de sincronização restrita ao destino correto demonstrada por esta documentação.

### Decisões complementadas pela DATA-001C3

C3 abaixo confirma as escolhas operacionais antes pendentes. Os mecanismos técnicos permanecem propostos/não implementados; data_folha segue sem finalidade comprovada.


## DATA-001C3 — Contrato consolidado do ciclo e da fotografia CI

### CONFIRMADO — decisões do responsável em 2026-10-06

Esta seção complementa A/C1 e substitui suas pendências já decididas sobre calendário, finalização, conteúdo da cópia, âmbito e janela operacional. DOMAIN.md é a fonte principal do contrato. Decisão aprovada e proposta de schema NÃO significam implementação existente.

- FolhaCI e CicloOperacional são entidades distintas relacionadas. Ciclo D representa operação/manutenção D e prepara FolhaCI D+1. No fluxo normal há um ciclo por garagem/data operacional e uma folha por garagem/data destinatária; a preparação correspondente pertence ao ciclo D. Finalizar a folha não transforma ciclo e folha no mesmo conceito.
- VCG e VCM são contextos independentes; dados não se misturam. O rollout inicial habilitará VCG; VCM não será ativada automaticamente por existir no modelo. Acesso a esses contextos é exclusivo de ADMIN, que pode operar ambas. Não há associação obrigatória usuário→garagem nem perfil por garagem.
- A fonte temporal comum é America/Campo_Grande, sem offset UTC fixo. Inicialização às 03:00 e finalização às 18:30 ocorrem todos os dias, inclusive sábados, domingos e feriados, sem exceção atual de calendário.
- Às 03:00 de D, inicializar Ciclo D, criar FolhaCI D+1 EM_PREPARACAO como cópia integral da FolhaCI D FINALIZADA e iniciar manutenção D. Cada folha e cada item copiado recebem nova identidade; os itens pertencem à nova folha e a origem permanece imutável.
- Copiar a fotografia efetiva inteira: Preventivas e subtipos, Setores da Oficina, Reforço com Horário, suas 12 posições fixas (horários podem repetir), posições/itens da coluna adicional, título variável dessa coluna, Bloqueados e informações operacionais persistidas pertencentes à folha. Preservar multiplicidade e posição lógica, não deduplicar apenas por veículo/horário.
- O título adicional pertence à folha mesmo com zero itens. Opções atuais: INSPEÇÃO, LUBRIFICAÇÃO, EM MANUTENÇÃO, TROCA DE ÓLEO, REVISÃO e PREVENTIVA. A autoridade oficial será o backend persistido, não localStorage. EM MANUTENÇÃO nesse título não é estado de oficina do Controle.
- Não copiar rascunhos não salvos, modais, filtros, seleção, mensagens, marcadores de reconstrução, IDs clone-*, finalização da origem, EM MANUTENÇÃO ou LIBERADOS do Controle. Cópia às 03:00 e sincronização durante o ciclo são operações distintas.
- A manutenção inicial contém os BLOQUEADOS da nova folha; EM MANUTENÇÃO e LIBERADOS começam vazios. Somente BLOQUEADOS sincronizam bidirecionalmente com a preparação correspondente. Preventivas, Oficina e Reforço da CI não alteram automaticamente estados de oficina/liberados do Controle, nem o inverso.
- BLOQUEADO + EM MANUTENÇÃO coexistem. Colocar em manutenção não remove bloqueio, presença nos Bloqueados da CI ou conteúdo de outras seções.
- Retirar/liberar bloqueado da CI em preparação remove apenas sua participação nos BLOQUEADOS daquela folha; não exige mantê-lo visível como LIBERADO. Não remove o veículo de outras seções nem de folhas anteriores. Campos legados de status/liberação serão preservados até análise posterior de compatibilidade.
- Liberação de bloqueado no Controle exige confirmação ANTES de qualquer alteração. Confirmar libera, trata execução conforme o fluxo, representa Liberados e retira bloqueios do Controle e da preparação numa operação atômica. Cancelar não muda nada; esse fluxo não produz LIBERADO + BLOQUEADO parcial.
- Às 18:30, a folha passa de EM_PREPARACAO para FINALIZADA: sem inclusão, alteração ou exclusão. Reabertura não integra o escopo; não criar REABERTA agora.
- Janela operacional: 03:00 inclusive até 18:30 exclusive. A partir de 18:30, tanto CI quanto Controle ficam somente para consulta, sem alteração operacional. Antes das 03:00 não há abertura do novo ciclo. Equipe noturna não utiliza esses módulos; anota em papel para repasse no próximo dia. Não implementar suporte noturno.
- Autorização temporal ocorre no backend dentro da fronteira transacional. Requisição iniciada antes do limite não tem direito adquirido: se não obtiver autorização protegida antes de 18:30:00, rejeitar integralmente. Mesmo com scheduler atrasado e estado ainda EM_PREPARACAO, o horário impede mutações. Frontend apenas reflete o fechamento.
- Inicialização/finalização são operações de domínio reutilizáveis e idempotentes; scheduler apenas dispara, sem regras acopladas à biblioteca. Nenhuma biblioteca foi escolhida. GETs não inicializam nem recuperam eventos.
- Atraso no mesmo dia: volta às 06:00 recupera inicialização pendente usando origem FINALIZADA; volta às 20:00 regulariza finalização com alterações já bloqueadas por horário. Distinguir previsto e efetivamente executado, sem falsificar timestamps.
- Indisponibilidade por vários dias: não reconstruir realidade nem repetir cópias antigas como fotografias reais. Criar estruturas ausentes vazias, representar dias históricos ausentes como folhas vazias FINALIZADAS e criar a preparação atual necessária. Identificar RECUPERACAO. ADMIN poderá preencher/corrigir conforme procedimento administrativo posterior; isso NÃO autoriza editar FINALIZADA por comando operacional nem implementar reabertura agora.
- Histórico inicial VCG: Excels oficiais de outubro serão fotografias independentes FINALIZADAS, identificadas IMPORTACAO. Script de INSERT será preparado externamente, revisado e executado manualmente pelo responsável, em etapa futura. Não haverá importador na aplicação nem inferência de transições ou reinterpretação automática do legado. Nenhum SQL é escrito/executado nesta C3.

### ATUAL/OBSERVADO — lacunas preservadas

Não existem os modelos/ciclo/status de folha propostos. As quatro seções usam CiBloqueio; subTipo distingue preventiva/oficina; horarioReforco guarda horário/serviço e observacoes é exposto como os. Posições de reforço dependem de IDs e reforcoSlotId local não é enviado pelo manager. Título reforco_servico_tipo_<data> vive em localStorage, inclusive sem itens. GET de manutenção continua mutável; filtros de garagem/usuário e ausência de autorização ADMIN/temporal nos caminhos atuais divergem do novo contrato. Não foram corrigidos nesta etapa.

### PENDENTE — desenho e implementação

A proposta técnica está em DATABASE.md. Schema, constraints, comandos, transações, scheduler, habilitação do rollout e adaptação do frontend precisam de revisão/implementação. data_folha continua sem finalidade comprovada e não será reutilizada. Definir posteriormente o procedimento administrativo de preenchimento/correção da recuperação, preservando a imutabilidade operacional; dados/arquivo inicial e data de rollout ainda precisam ser fornecidos/aprovados. Não há nova dúvida sobre horários, timezone, cópia integral, acesso ADMIN, isolamento de garagens ou janela noturna.


### Soltura VCG: resolucao temporal explicita

CONFIRMADO nesta etapa: equipe prepara CI D+1 em D; portaria consulta D+1
na tarde/noite D e na madrugada D+1. Consultar EM_PREPARACAO nao equivale
a autorizar soltura. Manutencao oficial atual tambem deve ser considerada.

ATUAL/OBSERVADO: o piloto autoriza somente VCG/C4 com CI FINALIZADA da
dataOperacao explicita e ciclo NORMAL de manutencao atual. Legado, VCM,
preparacao, recuperacao e madrugada antes das 03:00 permanecem recusados.
A escala possui armazenamento proprio/revisao e nao confirma disponibilidade.
Limites e verificacoes em [SOLTURA-ESCALA-SEGURANCA.md](SOLTURA-ESCALA-SEGURANCA.md).
