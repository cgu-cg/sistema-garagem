# Sistema Garagem

O Sistema Garagem é uma aplicação interna de apoio à operação de uma empresa
de transporte coletivo. Seu objetivo é digitalizar e integrar processos
operacionais atualmente apoiados por planilhas, controles manuais e sistemas
existentes.

O sistema não pretende substituir automaticamente o ERP existente. Ele
complementa os processos operacionais sem assumir, por padrão, as
responsabilidades dos sistemas corporativos.

## Módulos

O sistema inclui interfaces e serviços para:

- dashboard;
- abastecimento e abastecimento por carro;
- soltura de veículos;
- controle operacional;
- manutenção;
- catracas e bilhetagem;
- reservas de terminais;
- administração de usuários e grupos;
- recursos de PWA com service worker e suporte offline parcial.

## Stack

- **Web:** React, TypeScript, Vite, React Router, Zustand, Tailwind CSS e Radix UI.
- **API:** Node.js, Express e TypeScript.
- **Dados:** Prisma com SQL Server como banco principal; integração separada
  com SQL Server legado.
- **Monorepo:** npm workspaces.
- **Entrega web:** Docker Compose, com Nginx servindo o frontend e fazendo proxy
  para a API.

## Estrutura do monorepo

```text
apps/
  api/       API Express, schema Prisma e serviços
  web/       aplicação React
docs/        arquitetura, dados, segurança e domínio
.env.example modelo das variáveis de ambiente
docker-compose.yml
package.json scripts e configuração dos workspaces
```

## Pré-requisitos

- Node.js 20 ou superior e npm para desenvolvimento local;
- uma instância SQL Server configurada para a aplicação;
- Docker e Docker Compose para executar os serviços definidos no Compose.

## Configuração do ambiente

Crie o arquivo `.env` a partir do exemplo e preencha as configurações
necessárias para o ambiente local:

```bash
cp .env.example .env
```

Configure principalmente `DATABASE_URL` e `JWT_SECRET`. As variáveis de
`SQL_SERVER_*` são usadas pela integração legada. Não compartilhe nem versione
o arquivo `.env`; mantenha secrets e credenciais fora do repositório.

## Desenvolvimento local

Na raiz do repositório, instale as dependências, configure `.env` e inicie
frontend e API:

```bash
npm install
npm run dev
```

O frontend do Vite fica normalmente disponível em `http://localhost:5173` e a
API em `http://localhost:3001`. Também é possível iniciar cada workspace
separadamente com `npm run dev:web` ou `npm run dev:api`.

## Scripts disponíveis

Os scripts abaixo estão definidos nos `package.json` da raiz e dos workspaces:

| Comando | Finalidade |
| --- | --- |
| `npm run build` | Compila frontend e API |
| `npm run build:web` / `npm run build:api` | Compila um workspace |
| `npm run lint` | Executa verificações TypeScript para web e API |
| `npm start` | Inicia a API compilada |
| `npm run db:generate -w apps/api` | Gera o Prisma Client |
| `npm run db:migrate -w apps/api` | Executa `prisma migrate dev` |
| `npm run db:seed -w apps/api` | Executa o seed da API |
| `npm run dev -w apps/web` | Inicia o servidor de desenvolvimento do Vite |
| `npm run build -w apps/web` | Verifica TypeScript e gera a build web |
| `npm run preview -w apps/web` | Pré-visualiza a build web |

Os scripts de migração e seed alteram o banco configurado. Execute-os somente
quando apropriado para o ambiente e após confirmar a configuração de conexão.
O comando `npm start` requer a build da API.

## Docker Compose

O `docker-compose.yml` atual define somente os serviços `api` e `web`; não
inicia um container de banco de dados. Ambos carregam o arquivo `.env`, e a API
recebe `DATABASE_URL` também por interpolação do Compose.

Com Docker Compose instalado e `.env` configurado, os serviços podem ser
construídos e iniciados com:

```bash
docker compose up --build
```

O Compose publica a API na porta `3001` e o frontend/Nginx na porta `5173`.
O Nginx encaminha requisições `/api` para a API.

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Banco de dados](docs/DATABASE.md)
- [Segurança](docs/SECURITY.md)
- [Domínio](docs/DOMAIN.md)

Desenvolvedores e agentes devem consultar [AGENTS.md](AGENTS.md) antes de
alterar o projeto. A documentação detalhada de regras de domínio deve ser
consultada no documento correspondente, não inferida a partir deste resumo.
- [Moldes JSON de Escala e Soltura VCG](docs/MOLDES-ESCALA-SOLTURA.md)
