# Módulo: Soltura de Frota & Despacho (`/soltura`)

## 1. Visão Geral
Controla o despacho matinal e vespertino de todos os ônibus que saem da garagem para operar nas linhas do transporte público municipal e metropolitano. Substitui a tradicional prancheta física de papel pela **Prancheta Digital**.

---

## 2. Modos de Visualização e Subpáginas

### A. Folha de Soltura (Prancheta Digital)
* Exibição em duas colunas estilo prancheta física.
* Seleção de **Garagem** (`VCG` ou `VCM`) e **Tipo de Escala** (`SEG_SEX`, `SABADO`, `DOM_FER`).
* Operação de **Liberação Rápida**: Com 1 clique no botão "Liberar", o veículo é despachado e marcado com status `LIBERADO` verde.
* Suporte a **Desfazer Liberação**: Permite reverter um despacho realizado por engano.
* **Impressão A4 Landscape**: Botão de impressão que formata a página perfeitamente para formato folha A4 paisagem, ocultando menus e destacando os dados operacionais.

### B. CI Manutenção (Bloqueio & Restrições de Veículos)
* Gestão dos carros que estão com **Comunicado Interno (CI)** emitido pela manutenção.
* Carros bloqueados impedem a liberação na pista ou disparam alerta imediato com motivo (ex: vazamento de ar, revisão de freios, alto consumo de diesel).
* Permite cadastrar novo bloqueio com prefixo, motivo, data/hora e nível de severidade.

### C. Carro Realizado (P) (Ajustes Rápidos de Troca)
* Interface rápida para substituição de prefixo quando o carro programado não puder sair (ex: quebra de última hora).
* Permite alterar o carro escalado pelo carro substituto e o código do motorista diretamente na linha da tabela.

### D. Cartões de Pista & Reservas
* Exibe a grade de carros reservas nos terminais operacionais (ex: Terminal Central, Oficinas, Nova Rússia, Uvaranas).
* Lista de "Carros Pendurados" (veículos com restrições de alto consumo ou monitoramento preventivo).

---

## 3. Endpoints & Banco de Dados
* `GET /api/solturas`: Retorna despachos registrados no período.
* `POST /api/solturas`: Salva registro de despacho.
* **Tabelas Prisma**: `solturas`, `buses`, `users`.
* **Permissões de Acesso**: `ADMIN`, `soltura`, `COLABORADOR`.
