---
name: db-migration-sync
description: >-
  Utilize esta skill sempre que o usuário pedir para criar, alterar ou remover
  tabelas/colunas no banco de dados, criar novos modelos no schema.prisma ou
  sincronizar schemas Zod e tipos do backend com o frontend.
---

# Procedimento de Evolução de Schema (Prisma + SQL Server)

Siga rigorosamente estas etapas em ordem para garantir consistência e zero quebras:

## 1. Alteração no Modelo (`schema.prisma`)
1. Abra `apps/api/prisma/schema.prisma`.
2. Adicione ou edite o modelo respeitando:
   - Segregação multi-garagem (`garagem: String` ou enum `VCG` / `VCM`).
   - Strings com `@db.NVarChar(tamanho)`.
   - Datas com `@default(now())`.
   - Índices `@@index([garagem, data])` para filtros comuns.
3. Formate o schema:
   ```bash
   npx prisma format
