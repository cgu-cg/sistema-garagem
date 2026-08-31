# Módulo: Administração de Usuários & Grupos (`/admin/usuarios`)

## 1. Visão Geral
Módulo restrito a **Administradores (`ADMIN`)** para gerenciamento centralizado de contas de acesso, perfis de operadores e permissões de rotas do Sistema Garagem.

---

## 2. Modelos e Regras de Negócio

### A. Usuários (`User`)
* **Campos**: Nome, Email, Senha (criptografada com `bcryptjs`), Papel (`role`), Garagem vinculada (`VCG`, `VCM` ou `null`) e Grupos.
* **Papéis Padrão (`role`)**:
  * `ADMIN`: Acesso total e irrestrito ao sistema.
  * `COLABORADOR`: Usuário padrão geral.
  * `tanque`: Operador da medição de tanques.
  * `abastecimento`: Operador do abastecimento de pista por veículo.
  * `soltura`: Fiscal de pista / despachante.
  * `operacional`: Fiscal de vistoria do controle operacional.
* **Regra de Segurança**: O administrador logado não pode auto-excluir sua própria conta.

### B. Grupos de Permissões (`Group`)
* **Campos**: Nome, Descrição e Permissões (`permissions` em formato JSON array de rotas).
* **Exemplo de Permissões**: `["/home", "/abastecimento-carro", "/controle-operacional"]`.
* Os usuários vinculados a um grupo herdam o acesso às rotas correspondentes no menu e nos middlewares do backend.

---

## 3. Endpoints & Banco de Dados
* `GET /api/users`: Lista todos os usuários.
* `POST /api/users`: Cria novo usuário (com validação Zod).
* `PUT /api/users/:id`: Edita informações e grupos do usuário.
* `DELETE /api/users/:id`: Exclui usuário.
* `GET /api/groups`: Lista grupos de permissões.
* `POST /api/groups`: Cria grupo.
* `PUT /api/groups/:id`: Atualiza grupo e suas permissões.
* `DELETE /api/groups/:id`: Exclui grupo.
* **Tabelas Prisma**: `users` e `groups`.
