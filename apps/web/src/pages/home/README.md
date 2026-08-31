# Módulo: Dashboard & Analytics Operacional (`/home`)

## 1. Visão Geral
A Dashboard é a central de comando operacional do Sistema Garagem. Ela resume os indicadores-chave de desempenho (KPIs) do dia atual, gráficos de volume de combustível, agenda de despachos e o checklist de rotina dos fiscais e operadores.

---

## 2. Indicadores-Chave (KPI Cards)
1. **Soltura de Frota**: Total de viagens/veículos despachados hoje vs. total programado.
2. **Combustível Hoje**: Litros totais acumulados no dia, divididos entre Tanque 1 (T1) e Tanque 2 (T2).
3. **Medição de Tanques**: Quantidade de registros de leitura de réguas/tanques realizados no dia.
4. **Consistência de Catracas**: Status de auditoria de bilhetagem (percentual de turnos consistentes sem pulos).

---

## 3. Painéis e Funcionalidades
* **Gráfico de Consumo Diário**: Gráfico de barras verticais com visual Bento Grid exibindo o volume em litros injetado na frota nos últimos 7 dias, 30 dias ou dia atual.
* **Lembretes & Tarefas**: Checklist interativo de rotina operacional (ex: conferência de bicos, auditoria de tanques, verificação de CIs). Permite marcar como concluído e adicionar novas tarefas dinamicamente.
* **Escala & Saídas da Garagem**: Tabela com os próximos despachos prioritários, motorista escalado, carro programado, linha, tabela e horário de saída da garagem.
* **Controle de Turno (Stopwatch)**: Cronômetro em tempo real do turno ativo com metas visuais de despacho matinal e abastecimento.

---

## 4. Integração com Backend & Dados
* `GET /api/abastecimentos`: Carrega leituras de tanques do dia.
* `GET /api/solturas`: Carrega despachos efetuados.
* `GET /api/buses`: Total da frota cadastrada.
* `GET /api/controle-operacional`: Total de vistorias realizadas.

---

## 5. Permissões e Visibilidade (RBAC)
* `ADMIN`: Visualização completa de todos os KPIs, gráficos e cartões de frota.
* `tanque` / `abastecimento`: Foco nos dados de combustível e tanques.
* `soltura`: Foco no progresso de despachos e saídas de garagem.
* `operacional`: Foco nas métricas de vistorias e checklist.
