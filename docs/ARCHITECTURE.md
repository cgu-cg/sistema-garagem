# Arquitetura do sistema

Este documento descreve o estado técnico atual do projeto, conforme observado no código do repositório em 2026-10-02.

## Visão geral

O projeto é um monorepo gerenciado com npm workspaces, conforme observado no código atual.

- Raiz: `package.json`
- Aplicações workspace:
  - `apps/api`
  - `apps/web`

A análise estática indica que a primeira aplicação é a API backend e a segunda é a interface web.

## Estrutura atual

### Raiz

O arquivo raiz `package.json` define scripts para executar ambos os ambientes em paralelo:

- `dev`: executa `web` e `api`
- `build`: compila `apps/web` e `apps/api`
- `start`: inicia o backend compilado
- `lint`: executa TypeScript para frontend e backend

A análise estática indica um monorepo com build e execução separados por workspace.

### Backend (`apps/api`)

Estrutura atual observada:

- `src/index.ts`
- `src/routes/index.ts`
- `src/controllers/`
- `src/middleware/`
- `src/services/`
- `src/utils/`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `uploads/`

O backend usa:

- Node.js + Express
- TypeScript
- Prisma
- SQL Server como datasource principal
- `@prisma/adapter-mssql` e pacote `mssql` para integração com SQL Server legado
- `bcryptjs` para senha
- `jsonwebtoken` para autenticação
- `zod` para validação de esquemas

### Frontend (`apps/web`)

Estrutura atual observada:

- `src/app/App.tsx`
- `src/components/`
- `src/lib/`
- `src/pages/`
- `src/stores/`
- `public/`

O frontend usa:

- React
- Vite
- TypeScript
- React Router
- Zustand
- Tailwind CSS
- Radix UI
- `react-hook-form` + `zod`
- `sonner` para toasts

## Fluxo de execução e integração

### Inicialização do backend

O ponto de entrada do backend é `apps/api/src/index.ts`.

O código atual mostra que a aplicação:

1. carrega variáveis de ambiente da raiz do monorepo e do diretório local, quando presentes;
2. cria um app Express;
3. habilita CORS;
4. aceita JSON e formulários de grande payload;
5. serve uploads estáticos em `/api/uploads`;
6. registra as rotas em `/api`;
7. expõe `GET /health`;
8. serve build estática do frontend, quando disponível;
9. registra middleware global de erro.

### Roteamento HTTP

As rotas são centralizadas em `apps/api/src/routes/index.ts`.

Esse arquivo define rotas para:

- autenticação
- usuários e grupos
- ônibus
- abastecimento
- abastecimento por carro
- soltura
- reservas de terminais
- catracas
- controle operacional
- CI bloqueios / manutenção

No código atual, a autenticação e autorização são tratadas por middleware importado de `../middleware/auth` e por validação de schemas na rota.

### Autorização atual

A autorização é implementada em:

- `apps/api/src/routes/index.ts`
- `apps/api/src/middleware/auth` (referenciado indireta do código de rotas)
- `apps/web/src/app/App.tsx`
- `apps/web/src/stores/auth.ts`

Observação importante: o código atual mostra que o frontend define regras de navegação e roteamento baseadas em `role` e `groups`, mas o backend também aplica autorização nas rotas. A análise do repositório indica que a documentação antiga pode sugerir controle restrito apenas no frontend; no código atual, a validação no backend também participa do acesso a rotas protegidas.

## Banco de dados principal

O schema Prisma em `apps/api/prisma/schema.prisma` mostra SQL Server como datasource principal:

```prisma
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}
```

O projeto modela entidades como:

- `User`
- `Group`
- `Bus`
- `Abastecimento`
- `Soltura`
- `ControleOperacional`
- `AbastecimentoCarroSession`
- `AbastecimentoCarroItem`
- `ReservaTerminal`
- `CiBloqueio`
- `ManutencaoCarro`

A análise estática indica que a estrutura atual é mais ampla do que a documentação antiga e inclui módulos como grupos, manutenção e reservas de terminais.

## Integração com legado

O código atual mostra integração separada com SQL Server legado, além do banco principal do Prisma.

Evidências observadas no repositório:

- `apps/api/package.json` inclui `@prisma/adapter-mssql`, `mssql`
- `apps/api/src/services/mssql.ts` existe
- `.agents/skills/legacy-telemetry/references/dicionario-dados-legado.md` descreve tabelas e regras para o banco legado

Essa integração foi observada no código atual e deve ser tratada como uma camada diferente da base principal do sistema. Não foi possível confirmar, apenas pelo repositório, todos os contratos e regras do banco legado em produção.

## Uploads e mídia

O backend cria e serve a pasta `uploads` em `apps/api/uploads` em runtime.

No `src/index.ts` há:

- criação da pasta `uploads` se ela não existir;
- `app.use("/api/uploads", express.static(uploadsDir));`

Esse mecanismo é usado para fotos e documentação operacional.

## Observações estruturais relevantes

### Autenticação

A autenticação se dá via:

- `POST /api/auth/login`
- `GET /api/auth/me`

O frontend persiste token e usuário em `localStorage` usando `useAuth` em `apps/web/src/stores/auth.ts`.

### Permissões por grupos

A base de dados inclui `Group`, que possui:

- `name`
- `description`
- `permissions` (JSON em String)

A API expõe endpoints para gerenciamento de grupos e os usuários podem ter relação N:N com esses grupos.

### Arquitetura de módulos do frontend

O frontend organiza as páginas em `apps/web/src/pages`:

- abastecimento
- abastecimento-carro
- admin
- auth
- catracas
- controle-operacional
- home
- manutencao
- soltura

A navegação principal é controlada por `App.tsx`, com redirecionamento e controle de permissões por `role` e `groups`.

## Divergências relevantes

As divergências abaixo foram observadas entre documentação antiga e código atual:

1. A documentação antiga menciona PostgreSQL como banco principal. O código atual usa SQL Server no Prisma.
2. A documentação antiga menciona papéis antigos como `COLABORADOR_ABASTECIMENTO`, `COLABORADOR_SOLTURA` e `COLABORADOR_CONTROLE_OPERACIONAL`. O código atual usa `tanque`, `abastecimento`, `soltura`, `operacional` e `manutencao`.
3. A documentação antiga não representa adequadamente módulos atualmente presentes no código, como manutenção, grupos e reservas de terminais.
4. A documentação antiga descreve uma arquitetura de deploy de PostgreSQL em Docker, mas o compose atual do projeto não inclui banco PostgreSQL explícito e sim apenas `api` e `web`.
5. A documentação antiga não diferencia claramente o banco de produção principal do SQL Server legado integrado separadamente.

## Limitações da evidência

- Os detalhes completos de todos os serviços de integração legado não foram documentados neste arquivo; apenas foi observada a estrutura do código e os artefatos de apoio do repositório.
- A documentação de regras de negócio operacionais detalhadas exige validação separada em módulos específicos e não deve ser inferida apenas pela arquitetura.
- Não foi feita análise de runtime em execução; a descrição acima é baseada na análise estática do código atual.

## CI diária — separação conceitual da DATA-001A

Conforme o [contrato confirmado](./DOMAIN.md#data-001a--contrato-operacional-da-ci):

| Responsabilidade | Contrato |
|---|---|
| Leitura da fotografia | Estado registrado da CI finalizada, sem mutação/reconstrução silenciosa; GET somente leitura |
| Preparação da próxima CI | Ajustes durante preparação, historicamente a partir da anterior; conteúdo exato da cópia pendente |
| Finalização | Preservar fotografia para uso operacional; mecanismo e responsáveis pendentes |
| Alterações explícitas | Retirada confirmada dirigida à preparação, preservando finalizadas |
| Controle de Manutenção | Oficina distinta da CI; execução e bloqueio podem coexistir |

Esta separação não define novos endpoints, serviços, tabelas ou arquitetura futura implementada. Data futura não equivale automaticamente a preparação.

**ATUAL/OBSERVADO:** interface calcula herança e permite edição de amanhã; algumas ações persistem cópias. Não há ciclo persistido de preparação/finalização identificado. Após DATA-001B1/B2, os controllers de CI/manutenção não executam saneamentos históricos ou provisionamento estrutural; GET de manutenção ainda materializa, reconcilia e exclui registros funcionalmente; managers locais acrescentam sincronização. Isso não garante fotografias imutáveis.

Pendências estão centralizadas no contrato de DOMAIN.md; etapas propostas na DATA-001 de BACKLOG.md. DATA-001A não altera aplicação.


## DATA-001C1 — Correspondência dos ciclos, sem implementação técnica

A fonte das regras é [DOMAIN.md](./DOMAIN.md#data-001c1--ciclos-operacionais-e-continuidade-dos-bloqueados). Durante o dia D, BLOQUEADOS da manutenção D sincronizam bidirecionalmente com BLOQUEADOS da CI do próximo dia operacional em preparação. Essa correspondência não autoriza mutar manutenção anterior ou CIs finalizadas.

Bloqueios vigentes continuam no novo ciclo; execução e liberados começam limpos. BLOQUEADO + EM MANUTENÇÃO coexistem. Retirada explícita reflete na preparação correspondente; liberação de bloqueado depende de confirmação antes de qualquer alteração, com cancelamento sem efeitos.

Inicialização e sincronização devem ficar separadas da consulta, preservando fotografias. Identidade persistida, endpoints, transações e dia operacional técnico ainda não estão definidos. Não inferir destino pela data futura nem interpretar esta separação como implementação existente. GET de manutenção e propagadores atuais ainda precisam ser corrigidos nas etapas C/D/E/F.
