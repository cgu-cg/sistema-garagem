# Módulo: Autenticação & Sessão (`/`)

## 1. Visão Geral
Gerencia a autenticação segura de usuários via tokens JWT (JSON Web Token), controle de sessão e seleção rápida de perfis em ambiente de demonstração e homologação.

---

## 2. Regras de Negócio e Segurança
1. **Login com JWT**:
   * O usuário informa `email` e `password`.
   * A API valida as credenciais contra a tabela `users` do SQL Server usando `bcrypt.compare`.
   * É emitido um token JWT com expiração configurável (padrão `365d` ou `8h`).
2. **Gerenciamento de Sessão com Zustand (`useAuth`)**:
   * O token e os dados do usuário autenticado são persistidos no `localStorage` do navegador.
   * Ao recarregar a página, o hook `useAuth` dispara `GET /api/auth/me` para revalidar a sessão e atualizar permissões de grupos.
3. **Controle de Acesso em Rotas (Frontend)**:
   * `ProtectedRoute`: Redireciona usuários não autenticados para `/`.
   * `RoleRoute`: Valida se o usuário tem a `role` necessária ou permissão de grupo para acessar a rota filha.
4. **Demonstração Rápida**:
   * Botões de acesso rápido para login instantâneo com contas pré-configuradas (`admin@teste.com`, `tanque_vcg@teste.com`, `abastecimento_vcg@teste.com`, `soltura_vcg@teste.com`, `controle_vcg@teste.com`).

---

## 3. Endpoints & Banco de Dados
* `POST /api/auth/login`: Autentica e retorna o JWT e objeto do usuário com grupos.
* `GET /api/auth/me`: Retorna os dados atualizados do usuário autenticado.
* **Tabela Prisma**: `users`.
