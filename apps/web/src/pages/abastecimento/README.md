# Módulo: Medição e Leitura de Tanques (`/abastecimento`)

## 1. Visão Geral
Gerencia o inventário estático de combustível armazenado nos tanques subterrâneos/estacionários da garagem (Tanque 1, Tanque 2 e Tanque 3). É utilizado diariamente para confrontar o volume físico aferido nas réguas volumétricas com o saldo contábil do sistema.

---

## 2. Regras de Negócio
1. **Leitura Multi-Tanques**:
   * **Tanque 1 (T1)**: Litragem em Decimal (`litros_t1`) e Foto da régua/marcador (`foto_t1`).
   * **Tanque 2 (T2)**: Litragem em Decimal (`litros_t2`) e Foto da régua/marcador (`foto_t2`).
   * **Tanque 3 (T3)**: Opcional (suporte para garagens com terceiro reservatório).
2. **Captura Fotográfica**:
   * Suporta disparo ao vivo via câmera do dispositivo (webcam do notebook ou câmera traseira de celulares/tablets) ou upload de imagem do armazenamento local.
   * As fotos são arquivadas no diretório físico do servidor (`uploads/`) e visualizáveis em modal Lightbox de alta resolução com zoom.
3. **Auditoria por Garagem & Usuário**:
   * Cada medição grava a garagem correspondente (`VCG` ou `VCM`) e o `userId` autenticado.

---

## 3. Endpoints & Banco de Dados
* `GET /api/abastecimentos`: Lista o histórico de medições (com filtros de data `date` e garagem `garagem`).
* `POST /api/abastecimentos`: Registra uma nova leitura dos tanques.
* **Tabela Prisma**: `abastecimentos`.
* **Permissões de Acesso**: `ADMIN`, `tanque`, `abastecimento`.
