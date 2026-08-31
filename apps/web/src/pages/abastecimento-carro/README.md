# Módulo: Abastecimento de Pista por Carro (`/abastecimento-carro`)

## 1. Visão Geral
Controla o abastecimento individual de combustível de cada veículo na pista da garagem por turno operacional, garantindo a rastreabilidade por bico/bomba, matrícula do frentista, litragem abastecida e foto comprobatória do painel/bico.

---

## 2. Fluxo e Regras de Negócio

### A. Abertura de Sessão de Abastecimento (Início do Turno)
1. O frentista identifica sua **matrícula** e a **garagem** de atuação (VCG ou VCM).
2. Registra a **leitura inicial do hodômetro/totalizador mecânico** das bombas ativas na pista:
   * Bomba 1 (`b1Ini`), Bomba 2 (`b2Ini`), Bomba 3 (`b3Ini`), Bomba 4 (`b4Ini`), Bomba 5 (`b5Ini`), Bomba 6 (`b6Ini`).
3. Uma sessão com status `EM_ANDAMENTO` é iniciada no banco de dados.

### B. Inserção de Abastecimentos por Veículo
* Para cada veículo abastecido durante o turno:
  * **Carro**: Prefixo do veículo.
  * **Litros**: Volume em litros abastecido.
  * **Bomba**: Identificação do bico/bomba utilizada (`B.01`, `B.02`, etc.).
  * **Foto**: Comprovante visual capturado via câmera ou upload.
  * **Matrícula do Operador**: Registrada para auditoria.

### C. Encerramento da Sessão (Fim do Turno)
1. O operador realiza a **leitura final dos totalizadores** das bombas (`b1Fim` a `b6Fim`).
2. O sistema calcula automaticamente:
   * **Total Marcado nas Bombas** = `(b1Fim - b1Ini) + (b2Fim - b2Ini) + ...`
   * **Total Lançado nos Veículos** = Soma de todos os itens da sessão.
   * **Diferença / Sobra / Falta** para fins de auditoria de perdas e calibração de bicos.
3. Status da sessão é alterado para `FINALIZADO` com registro do timestamp `dthFimAbastec`.

---

## 3. Endpoints & Banco de Dados
* `GET /api/abastecimento-carro/session/active`: Recupera a sessão aberta do usuário/garagem atual.
* `POST /api/abastecimento-carro/session/start`: Inicia nova sessão com leituras iniciais.
* `POST /api/abastecimento-carro/item`: Adiciona abastecimento de um carro na sessão ativa.
* `POST /api/abastecimento-carro/session/finish`: Finaliza a sessão com leituras finais das bombas.
* `GET /api/abastecimento-carro/sessions`: Histórico de todas as sessões anteriores.
* `GET /api/abastecimento-carro/sessions/:id`: Detalhes completos e lista de carros de uma sessão específica.
* **Tabelas Prisma**: `abastecimento_carro_sessions` e `abastecimento_carro_items`.
