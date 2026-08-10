# Documentação do Projeto: Sistema Garagem

Este documento fornece uma análise detalhada e abrangente do **Sistema Garagem**, um sistema desenvolvido para gerenciamento interno de operações de garagem de ônibus, focado no registro e controle de **abastecimentos** e **solturas** (despacho) de veículos.

---

## 1. Visão Geral e Arquitetura

O projeto está estruturado como um **Monorepo** utilizando **NPM Workspaces**. Ele é dividido em duas aplicações principais localizadas no diretório `apps/`:

1. **`apps/api` (Backend)**: Uma API REST desenvolvida em **Node.js** com **Express** e **TypeScript**, utilizando **Prisma ORM** para comunicação com um banco de dados **PostgreSQL**.
2. **`apps/web` (Frontend)**: Uma aplicação Single Page Application (SPA) moderna em **React** construída com **Vite**, **TypeScript**, estilizada com **Tailwind CSS** e componentes do **Radix UI**, com gerenciamento de estado via **Zustand**.

### Estrutura de Diretórios
```text
sistema-garagem/
├── apps/
│   ├── api/                   # Aplicação Backend (API REST)
│   │   ├── prisma/            # Schema do banco de dados e sementes (seed)
│   │   └── src/
│   │       ├── controllers/   # Controladores da API (lógica de negócios das rotas)
│   │       ├── middleware/    # Middlewares de autenticação e validação
│   │       ├── routes/        # Definições de rotas da API
│   │       ├── utils/         # Schemas do Zod e cliente Prisma
│   │       └── index.ts       # Ponto de entrada da API
│   └── web/                   # Aplicação Frontend (React)
│       ├── src/
│       │   ├── app/           # Configuração de rotas principais e inicialização
│       │   ├── components/    # Layout e componentes reutilizáveis (UI)
│       │   ├── hooks/         # Custom hooks
│       │   ├── lib/           # Cliente de integração com a API e utilitários
│       │   ├── pages/         # Telas do sistema (Login, Home, Abastecimento, Soltura, Admin)
│       │   └── stores/        # Estado global gerenciado pelo Zustand (Autenticação)
│       ├── Dockerfile         # Dockerfile para produção com Nginx
│       └── nginx.conf         # Configurações do servidor Nginx do Frontend
├── docker-compose.yml         # Orquestração de containers locais (API, Web e PostgreSQL)
├── package.json               # Configurações do NPM Workspaces
└── .env.example               # Modelo de variáveis de ambiente
```

---

## 2. Modelagem do Banco de Dados (Prisma Schema)

O banco de dados utiliza a seguinte estrutura relacional definida em [schema.prisma](file:///apps/api/prisma/schema.prisma):

```mermaid
erDiagram
    User ||--o{ Abastecimento : "registra"
    User ||--o{ Soltura : "registra"
    Bus ||--o{ Abastecimento : "abastece"
    Bus ||--o{ Soltura : "libera"

    User {
        Int id PK
        String name
        String email UK
        String password
        String role
        DateTime createdAt
        DateTime updatedAt
    }

    Bus {
        Int id PK
        String plate UK
        String prefix
        String model
        DateTime createdAt
        DateTime updatedAt
    }

    Abastecimento {
        Int id PK
        Int busId FK
        Decimal liters
        Decimal value
        String driverName
        Int odometer
        Int userId FK
        DateTime createdAt
    }

    Soltura {
        Int id PK
        Int busId FK
        Int programmedBusId FK
        String linha
        String tabela
        String driverCode
        String driverName
        String saidaGaragem
        String inicioLinha
        String notes
        Int userId FK
        DateTime createdAt
    }
```

### Tabelas e Campos:
*   **`users`**: Armazena os usuários do sistema com controle de acesso baseado em papéis (`role`).
    *   `role` pode ser: `ADMIN`, `COLABORADOR`, `COLABORADOR_ABASTECIMENTO` ou `COLABORADOR_SOLTURA`.
*   **`buses`**: Frota de ônibus cadastrada (placa, prefixo e modelo do veículo).
*   **`abastecimentos`**: Registro de consumo de combustível. Contém o veículo abastecido, motorista que realizou a viagem, litros inseridos, valor monetário gasto, a quilometragem atual do hodômetro e o usuário do sistema que efetuou a inserção do registro.
*   **`solturas`**: Despacho de veículos da garagem para as ruas. Contém o veículo liberado, veículo programado, linha, tabela, código e nome do motorista, horários de saída da garagem e início da linha, além de observações adicionais e o usuário que registrou o despacho.

---

## 3. Controle de Acesso e Permissões (RBAC)

O controle de rotas no backend e no frontend é rigidamente baseado no papel (`role`) do usuário logado:

| Perfil (`role`) | Descrição | Acesso às Funcionalidades |
| :--- | :--- | :--- |
| **`ADMIN`** | Administrador do Sistema | Acesso total. Pode gerenciar usuários, cadastrar ônibus e visualizar/registrar tanto abastecimentos quanto solturas. |
| **`COLABORADOR_ABASTECIMENTO`** | Operador da Bomba de Combustível | Visualização do dashboard diário e acesso exclusivo à tela de registros de **Abastecimento**. Não visualiza solturas nem gerencia usuários. |
| **`COLABORADOR_SOLTURA`** | Fiscal de Pista / Despachante | Visualização do dashboard diário e acesso exclusivo à tela de registros de **Solturas**. Não visualiza abastecimentos nem gerencia usuários. |
| **`COLABORADOR`** | Operador Padrão Geral | Acesso básico à página inicial (Dashboard). |

---

## 4. Detalhamento Técnico do Backend (`apps/api`)

### Tecnologias Utilizadas
*   **Express**: Framework web minimalista para Node.
*   **Zod**: Biblioteca de declaração e validação de esquemas TypeScript, garantindo robustez de dados na recepção de requisições.
*   **Prisma Client**: Query builder auto-gerado que previne erros de tipagem SQL.
*   **bcryptjs**: Utilizado para criptografar as senhas no cadastro de usuários e compará-las de forma segura no login.
*   **jsonwebtoken (JWT)**: Criação de tokens de sessão que expiram por padrão em 8 horas.

### Endpoints da API

*   **Autenticação**:
    *   `POST /api/auth/login`: Autentica o usuário com email/senha e retorna um Token JWT e os dados básicos do usuário.
    *   `GET /api/auth/me`: Retorna os dados do usuário atualmente logado (requer token JWT).
*   **Usuários** *(Apenas perfil `ADMIN`)*:
    *   `GET /api/users`: Lista todos os usuários cadastrados.
    *   `POST /api/users`: Cria um novo usuário (criptografando a senha fornecida).
    *   `PUT /api/users/:id`: Edita informações de um usuário existente.
    *   `DELETE /api/users/:id`: Exclui um usuário (impede a auto-exclusão do admin logado).
*   **Ônibus**:
    *   `GET /api/buses`: Lista os ônibus ordenados pelo prefixo *(Acesso: Todos os logados)*.
    *   `POST /api/buses`: Cadastra um novo ônibus no sistema *(Acesso: `ADMIN`)*.
*   **Abastecimentos** *(Acesso: `ADMIN` e `COLABORADOR_ABASTECIMENTO`)*:
    *   `GET /api/abastecimentos`: Lista os registros de abastecimento, suportando filtros opcionais de data inicial (`startDate`) e data final (`endDate`).
    *   `POST /api/abastecimentos`: Cria um registro de abastecimento no banco.
*   **Solturas** *(Acesso: `ADMIN` e `COLABORADOR_SOLTURA`)*:
    *   `GET /api/solturas`: Lista as solturas cadastradas com filtros opcionais de período.
    *   `POST /api/solturas`: Cria um registro de soltura no banco de dados.

---

## 5. Detalhamento Técnico do Frontend (`apps/web`)

### Tecnologias Utilizadas
*   **React (v18)** com build tool super rápida via **Vite**.
*   **React Router DOM (v6)**: Implementação de rotas protegidas (`ProtectedRoute`) e roteamento baseado no nível de privilégio (`RoleRoute`).
*   **Zustand**: Gerenciamento leve do estado global da sessão do usuário (`useAuth`), persistindo o JWT no `localStorage`.
*   **React Hook Form & Zod**: Para estruturação de formulários, validação em tempo de execução no cliente e exibição de alertas amigáveis.
*   **Tailwind CSS & Radix UI**: Design responsivo com componentes de alta fidelidade e acessibilidade, como diálogos modais (`Dialog`), menus dropdown (`DropdownMenu`), selects customizados e toasts com a biblioteca **Sonner**.

### Telas e Fluxos do Usuário

1.  **Tela de Login (`/`)**:
    *   Formulário limpo com validação de formato de email e obrigatoriedade de senha. Armazena o token de sessão localmente e redireciona para a Dashboard em caso de sucesso.
2.  **Dashboard (`/home`)**:
    *   Exibe cartões estatísticos rápidos com dados do dia atual: *Quantidade de Abastecimentos*, *Litros Totais Abastecidos*, *Quantidade de Solturas* e *Total de Ônibus da Frota*.
    *   **Aparência Inteligente**: Se o colaborador logado for de Abastecimento, ele não visualizará o cartão de solturas (e vice-versa).
3.  **Gestão de Abastecimento (`/abastecimento`)**:
    *   Exibe à esquerda um formulário intuitivo para registrar um abastecimento (seleção do ônibus por prefixo/placa, nome do motorista, litros de combustível, valor em R$ e quilometragem do hodômetro).
    *   À direita, lista os abastecimentos já realizados no dia atual em ordem cronológica reversa.
4.  **Gestão de Soltura (`/soltura`)**:
    *   Possui o formulário de despacho completo baseado no documento físico de controle de horários de saída (campos: Linha, Tabela, Ônibus Programado, Ônibus Realizado, Código do Motorista (MOTO), Nome do Motorista, Horário de Saída da Garagem, Horário de Início da Linha e Observações) e o feed cronológico lateral detalhando todas as solturas registradas no dia atual.
5.  **Gestão de Usuários (`/admin/usuarios`)**:
    *   Uma interface administrativa elegante que lista todos os colaboradores do sistema com badges coloridos de identificação da função (`ADMIN` = Roxo, `Abastecimento` = Verde, `Soltura` = Laranja, `Colaborador` = Azul).
    *   Permite a criação e edição de novos usuários através de diálogos modais, além da exclusão de contas obsoletas.
6.  **Conferência de Catracas (`/catracas`)**:
    *   Uma tela dividida (Split Screen) com design de alta fidelidade voltada para auditoria operacional.
    *   **Painel Esquerdo (Auditoria)**: Contém abas para analisar consistência de turnos (`fnConsisteCatracaVEICULOS`), alertas de datas inválidas (`TotalizadorServico`), coletores fora de frota, busca histórica de serviços de um veículo e atualização de datas de backup de coletas na tabela `Veiculos` do SQL Server.
    *   **Painel de Inspeção**: Ao selecionar um veículo com discrepância, o sistema detalha automaticamente os últimos logs de WiFi (`tbLogWiFi`), cartões com erro de leitura (Erro 154), batimento físico de catracas inicial e final, e ordens de serviço de manutenção (Bilhetagem + Simanet) para ajudar a diagnosticar o motivo da diferença.
    *   **Painel Direito (Diário de Bordo)**: Renderiza o diário de bordo digitalizado em PDF correspondente à data e veículo selecionados. Permite analisar um intervalo de dias de forma sequencial com navegação local sem abrir múltiplos popups.

---

## 6. Infraestrutura, Containerização e DevOps

O projeto está totalmente preparado para ambientes de produção ou desenvolvimento isolados usando **Docker**:

*   **Banco de Dados**: Utiliza a imagem oficial `postgres:16-alpine`.
*   **API (Express)**: Construída através de build multi-stage ([Dockerfile](file:///apps/api/Dockerfile)):
    1.  Compilação do TypeScript e geração do Prisma Client no estágio de build.
    2.  Instalação apenas das dependências de produção para obter uma imagem final extremamente leve.
*   **Web (React + Nginx)**: Construída em dois estágios ([Dockerfile](file:///apps/web/Dockerfile)):
    1.  Geração da build de produção otimizada (`dist/`) do React com o Vite.
    2.  Cópia dos estáticos para um container rodando **Nginx**, servindo na porta padrão `80`.
*   **Roteamento e Proxy Reverso**: O arquivo [nginx.conf](file:///apps/web/nginx.conf) configura o Nginx para servir a SPA React corretamente com rotas virtuais (fallback para `index.html`) e atua como proxy reverso, encaminhando requisições com prefixo `/api` diretamente para o container da API.

---

## 7. Instruções para Execução do Projeto

### Pré-requisitos
*   **Node.js (v20 ou superior)** e **NPM** instalados localmente, OU
*   **Docker** e **Docker Compose** instalados.

### Executando em Ambiente de Desenvolvimento (Sem Docker)

1.  **Instalar dependências** na raiz do projeto (o NPM detectará e instalará todas as dependências do monorepo):
    ```bash
    npm install
    ```

2.  **Configurar Variáveis de Ambiente**:
    Copie o arquivo `.env.example` para `.env` na raiz do projeto e configure suas credenciais de banco de dados e chave do JWT:
    ```bash
    cp .env.example .env
    ```

3.  **Configurar e Popular o Banco de Dados**:
    Com um banco PostgreSQL ativo localmente conforme as configurações do seu `.env`, execute as migrations e alimente o banco com dados de testes:
    ```bash
    # Executar migrações do Prisma
    npm run db:migrate

    # Alimentar o banco com usuários e ônibus padrão
    npm run db:seed
    ```

4.  **Iniciar o Ambiente**:
    Inicie tanto a API quanto o Frontend simultaneamente usando o comando concorrente definido na raiz:
    ```bash
    npm run dev
    ```
    *   O frontend React estará acessível em: `http://localhost:5173`
    *   A API backend estará respondendo em: `http://localhost:3001`

---

### Executando com Docker Compose

Para colocar toda a pilha de serviços no ar (Banco de dados Postgres, Backend API e Frontend Web/Nginx) com apenas um comando:

1.  Certifique-se de criar o arquivo `.env` na raiz com as credenciais.
2.  Suba os containers:
    ```bash
    docker-compose up -d --build
    ```
3.  Execute o seed do banco de dados de dentro do container da API se for a primeira execução:
    ```bash
    docker-compose exec api npm run db:seed
    ```
    *   A aplicação web consolidada estará disponível na porta mapeada: `http://localhost:5173`

---

## 8. Contas de Acesso Padrão (Criadas pelo Seed)

Para testes iniciais de validação de papéis de segurança no sistema, o script de sementes (`seed.ts`) cria as seguintes credenciais padrão:

| E-mail | Senha | Função / Nível de Acesso |
| :--- | :--- | :--- |
| **`admin@teste.com`** | `admin123` | **`ADMIN`** (Visualiza tudo, gerencia usuários e frotas) |
| **`abastecimento@teste.com`** | `abastecimento123` | **`COLABORADOR_ABASTECIMENTO`** (Operador de abastecimento) |
| **`soltura@teste.com`** | `soltura123` | **`COLABORADOR_SOLTURA`** (Fiscal despachante de ônibus) |
| **`colaborador@teste.com`** | `colaborador123` | **`COLABORADOR`** (Visualizador geral do dashboard) |

teste
