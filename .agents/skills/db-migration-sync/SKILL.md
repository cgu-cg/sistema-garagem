---
name: db-migration-sync
description: >-
  Utilize esta skill sempre que o usuário pedir para criar, alterar ou remover
  tabelas/colunas no banco de dados, criar novos modelos no schema.prisma ou
  sincronizar schemas Zod e tipos do backend com o frontend.
---

# Evolução de Schema e Sincronização (Prisma + SQL Server)

## Salvaguardas obrigatórias

As regras de [AGENTS.md](../../../AGENTS.md) prevalecem em caso de conflito.

- Nunca execute migrations ou DDL automaticamente.
- Proponha alterações de schema antes de executá-las; a execução exige aprovação explícita.
- Nunca presuma que um banco disponível seja um ambiente de desenvolvimento.
- Nunca modifique dados de produção.
- Não execute comandos que alterem schema ou dados sem autorização explícita para a ação e confirmação do ambiente alvo.

## Orientações condicionais de schema

As etapas abaixo são pontos a avaliar conforme o modelo, o domínio validado e a tarefa; não são convenções universais. Não introduza garagem, tamanhos de campo, defaults ou índices sem justificativa para o modelo em questão.

## 1. Alteração no Modelo (`schema.prisma`)
1. Abra `apps/api/prisma/schema.prisma`.
2. Proponha o modelo/campos e avalie, conforme necessário:
   - se o conceito exige segregação por garagem e qual representação corresponde ao domínio;
   - tipo e tamanho de strings compatíveis com os dados e limites reais;
   - defaults de data/hora compatíveis com o fluxo;
   - índices justificados por consultas e filtros observados.
3. Após a aprovação da proposta, edite o schema de acordo com o escopo aprovado.
4. Formate o schema:
   ```bash
   npx prisma format
