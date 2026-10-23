# Pendencias identificadas

## DATA - Indicadores demonstrativos no dashboard

Identificado em 23/10/2026 ao substituir o card de Catracas pela CI.
`apps/web/src/pages/home/index.tsx` usa numeros de exemplo quando consultas
retornam zero, alem de percentuais, grafico semanal e tarefas predefinidos.
Revisar separadamente essas fontes e diferenciar zero, ausencia e falha, sem
apresentar exemplos como dados operacionais. O novo card de CI usa somente
consulta oficial e informa ausencia/indisponibilidade, sem esses fallbacks.
