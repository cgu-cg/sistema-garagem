# Módulo: Controle Operacional & Vistoria (`/controle-operacional`)

## 1. Objetivo da Funcionalidade
O Controle Operacional gerencia a vistoria física e fotográfica diária do inventário completo de veículos da frota (464 veículos pré-mapeados). Os fiscais de pista utilizam esta tela no celular/tablet ou desktop para registrar as condições de cada ônibus que entra ou sai da garagem.

---

## 2. Regras de Negócio
1. **Inventário Fixo de Veículos**: Lista oficial de prefixos operacionais (`INVENTORY_CARS` contendo prefixos de `1000` a `4279`).
2. **Requisitos de Cadastro de Vistoria**:
   * **Foto 1 (Frente)**: Obrigatória (ex: parachoque, letreiro, para-brisa).
   * **Foto 2 (Lateral)**: Obrigatória (ex: lataria, portas, pneus).
   * **Foto 3 (Traseira)**: Obrigatória (ex: lanternas, placa, tampa do motor).
   * **Carro**: Prefixo do veículo selecionado.
   * **Linha**: Linha operacional atribuída (selecionada a partir da base do SQL Server).
   * **Garagem**: Garagem onde ocorreu a vistoria (`Garagem: VCG` ou `Garagem VCM`).
3. **Persistência de Fotos no Servidor**:
   * As fotos enviadas em base64 são salvas no disco do backend em `uploads/controle-operacional/[carro]_[data_hora].jpg`.
   * URLs relativas (`/api/uploads/controle-operacional/...`) são salvas no banco.
4. **Modo Offline & PWA**:
   * Se o fiscal estiver em ponto cego sem sinal de Wi-Fi/4G na pista, a vistoria é armazenada localmente no IndexedDB.
   * Um badge visual "Pendente Sincronização" em tom âmbar é exibido.
   * Quando a internet é restaurada (ou a cada 30 segundos), a sincronização em segundo plano é disparada automaticamente.

---

## 3. Estados Visuais dos Cartões no Grid
* **Concluído / Vistoriado**: Cartão cinza grafite neutro com badge verde esmeralda (`text-emerald-400` / `bg-emerald-500/10`). Indica que o carro já possui registro no sistema.
* **Pendente Sincronização**: Cartão com contorno âmbar (`border-amber-500/40`) aguardando upload.
* **Sem Vistoria**: Cartão cinza padrão (`text-slate-400`). Ao clicar, abre imediatamente o modal de inserção com o carro já pré-selecionado.

---

## 4. Endpoints & Banco de Dados
* `GET /api/controle-operacional`: Retorna a lista de registros de vistoria (com filtro opcional por data e garagem).
* `POST /api/controle-operacional`: Salva nova vistoria.
* `PUT /api/controle-operacional/:id`: Atualiza dados ou fotos de uma vistoria.
* `DELETE /api/controle-operacional/:id`: Exclui registro e remove fotos associadas do disco (apenas `ADMIN`).
* `GET /api/controle-operacional/veiculos`: Lista prefixos ativos do SQL Server.
* `GET /api/controle-operacional/linhas`: Lista linhas cadastradas no SQL Server.
* **Tabela Prisma**: `controleOperacional` (mapeada para a tabela homônima no SQL Server).
