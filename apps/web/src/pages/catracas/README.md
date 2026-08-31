# Módulo: Conferência de Catracas & Bilhetagem (`/catracas`)

## 1. Visão Geral
Módulo restrito a **Administradores (`ADMIN`)** destinado à auditoria, consistência e conciliação de dados dos validadores de bilhetagem eletrônica e catracas físicas dos ônibus. Conecta-se diretamente ao banco de dados legado SQL Server de Bilhetagem.

---

## 2. Submódulos e Funcionalidades

### A. Consistência Diária de Turnos (`/catracas/consistencia`)
* Executa a function `fnConsisteCatracaVEICULOS(@data, @diff)` no SQL Server.
* Compara a leitura final do Turno 1 (SV1 - `catracaFim`) com a leitura inicial do Turno 2 (SV2 - `catracaIni`).
* Detecta **pulos de catraca** (diferença maior que o threshold configurado, padrão `0` ou `5`).
* Exibe alertas visuais para veículos com turnos inconsistentes.

### B. Datas Incorretas & Fora de Frota (`/catracas/alertas`)
* Identifica validadores com relógio interno descalibrado (transações gravadas com anos ou datas divergentes).
* Identifica veículos operando fora da frota programada ou com divergência de prefixo no concentrador.

### C. Backup de Coletas (`/catracas/backup`)
* Gerencia a data/hora de coleta de backup de dados dos validadores na tabela `Veiculos`.
* Permite **atualização em lote** das datas de coleta inicial (`coletaBKPIni`) e final (`coletaBKPFim`) com tratamento de fuso horário local e formato internacional ISO.

### D. Diário de Bordo & Relatórios em PDF (`/catracas/diario`)
* Consulta o extrato de viagens e bilhetagem por prefixo e intervalo de datas.
* Geração de relatórios com layout para impressão/PDF detalhando motorista, horários, linha e catracas.

---

## 3. Endpoints & Conexão
* `GET /api/catracas/consistencia`: Consulta de consistência diária.
* `GET /api/catracas/datas-incorretas`: Alertas de relógio e datas.
* `GET /api/catracas/fora-frota`: Veículos fora de frota.
* `GET /api/catracas/veiculo-servicos`: Serviços operacionais do carro.
* `GET /api/catracas/backup`: Status atual das coletas de backup.
* `POST /api/catracas/backup/update`: Atualização em lote de coletas de backup.
* `GET /api/catracas/detalhes-veiculo`: Diagnóstico completo do validador, Wi-Fi e ordens de serviço.
* `GET /api/catracas/diarios`: Extrato de diários de bordo.
* **Serviço Backend**: `apps/api/src/services/mssql.ts` (conexão direta via pool Tedious ao banco `bilhetagem`).
