# Domain model e entendimento operacional atual

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

Até que isso ocorra, as informações operacionais abaixo devem ser tratadas principalmente como ATUAL/OBSERVADO.

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

No comportamento desejado atualmente, marcar um veículo como "em manutenção" ou "liberado" no Controle de Manutenção NÃO deve automaticamente alterar a CI.

### Conflito a validar

- O código e a interface podem sugerir a existência de integrações mais automáticas entre controle de manutenção e CI.
- O entendimento atual indica que esses estados devem permanecer independentes neste momento.

## 10. Controle de Manutenção

### Status: ATUAL/OBSERVADO

O Controle de Manutenção é usado para permitir que a portaria visualize a situação operacional dos veículos durante o dia.

Entre os estados/conceitos utilizados estão:

- em manutenção;
- liberado.

### Observação

O Controle de Manutenção pode consultar os veículos bloqueados na CI e existe necessidade de permitir retirada/desbloqueio quando aplicável.

### Importante

Os estados "em manutenção" e "liberado" permanecem independentes da CI neste momento.

### Conflito a validar

- Pode haver intenção futura de sincronizar esses estados, mas isso não deve ser assumido como regra atual.

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
- relação entre CI, Controle de Manutenção e operação;
- manutenção de matriz de empresas, garagens, terminais e consórcios;
- regras completas de reserva;
- digitalização de motoristas e escalas;
- relação formal entre linha, tabela e serviço;
- integração futura entre catracas/bilhetagem e soltura;
- distinção precisa entre dados de operação e dados de planejamento.

## 22. Conflitos observados entre entendimento operacional e código/documentação

### Situação 1

O entendimento operacional atual indica independência entre:

- CI Manutenção;
- Controle de Manutenção;
- disponibilidade operacional;
- soltura.

Mesmo assim, o código e parte da documentação podem sugerir integrações mais automáticas entre esses conceitos.

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
- As informações com status CONFIRMADO dependem de validação formal do responsável do processo.

Até que esse processo de validação ocorra, o documento deve ser lido como base de discussão operacional, e não como regra formal do negócio.
