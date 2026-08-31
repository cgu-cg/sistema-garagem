# Base de Conhecimento: Regras de Negócio da Soltura (CGU)

### 📌 Glossário Operacional
- **Soltura**: Processo diário de liberação dos ônibus da garagem para as linhas urbanas.
- **CI (Comunicação Interna / Pendurado na CI)**: Carro que apresentou falha mecânica, elétrica ou operacional e está retido na oficina/manutenção, impedido de sair.
- **Cartão de Pista**: Documento físico entregue ao motorista contendo tabela horária, prefixo, itinerário e catraca inicial.
- **Carro Reserva**: Veículo mantido no pátio para substituição imediata em caso de pane.

### 🔄 Fluxo de Substituição de Carro
1. O despachante seleciona o horário/tabela original.
2. Informa o motivo da troca (ex: avaria, atraso de motorista).
3. O sistema libera o carro original e aloca o reserva, registrando o histórico de substituição no banco (`SolturaHistorico`).
4. Atualiza a prancheta digital em tempo real.
