# Pendencias identificadas

## TECH - Teste VCM ainda depende da fase Substituidos removida

Identificado em 05/11/2026 ao verificar marcacao automatica de uso no Controle.
O teste `VCM trata substituicao, limpa, suspende, finaliza e conserva fotografia
do relatorio` em `apps/api/tests/vcmRelease.test.ts` acessa
`releaseWithdrawals(...)[0].prefixo` apos troca que agora retorna direto a
Reserva, resultando em TypeError. Falha reproduzida com os dois servicos desta
tarefa carregados diretamente do HEAD, sem as novas alteracoes. Atualizar o
cenario de teste ao contrato vigente, preservando suas validacoes de limpeza,
suspensao, finalizacao e fotografia; nao reintroduzir pendencia operacional.

## DATA - Indicadores demonstrativos no dashboard

Identificado em 23/10/2026 ao substituir o card de Catracas pela CI.
`apps/web/src/pages/home/index.tsx` usa numeros de exemplo quando consultas
retornam zero, alem de percentuais, grafico semanal e tarefas predefinidos.
Revisar separadamente essas fontes e diferenciar zero, ausencia e falha, sem
apresentar exemplos como dados operacionais. O novo card de CI usa somente
consulta oficial e informa ausencia/indisponibilidade, sem esses fallbacks.
