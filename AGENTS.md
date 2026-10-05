# AGENTS.md

## Objetivo do projeto

O Sistema Garagem é uma aplicação interna para apoio à operação de uma
empresa de transporte coletivo.

O sistema possui módulos relacionados a:

- manutenção de veículos;
- soltura de veículos;
- escalas operacionais;
- abastecimento;
- controle operacional;
- catracas e bilhetagem;
- usuários e permissões;
- reservas de terminal.

Mudanças nesses módulos podem afetar diretamente a operação da empresa.

---

## Stack principal

Frontend:

- React
- TypeScript
- Vite
- React Router
- Zustand
- Tailwind CSS
- Radix UI
- Zod

Backend:

- Node.js
- Express
- TypeScript
- Prisma
- Microsoft SQL Server
- JWT
- Zod

Infraestrutura:

- npm workspaces
- Docker
- Nginx

Existe também integração com SQL Server legado utilizando `mssql`.

---

## Princípios obrigatórios

Antes de modificar código:

1. Leia os arquivos relacionados ao fluxo solicitado.
2. Identifique frontend, backend, banco e regras de negócio afetadas.
3. Verifique documentação e skills relacionadas.
4. Apresente um plano curto antes de mudanças estruturais.
5. Preserve o comportamento existente que não faça parte da tarefa.

Não altere arquivos fora do escopo sem explicar previamente a necessidade.

---

## Banco de dados

O banco principal utiliza Microsoft SQL Server.

O projeto também acessa sistemas SQL Server legados.

Nunca:

- execute migrations automaticamente;
- execute DDL automaticamente;
- apague tabelas;
- apague colunas;
- execute scripts destrutivos;
- modifique dados de produção;
- suponha que um banco disponível seja ambiente de desenvolvimento.

Alterações de schema devem ser propostas antes de serem executadas.

Nunca coloque credenciais reais no código.

---

## Git

Nunca execute automaticamente:

- `git push`
- `git reset --hard`
- `git clean`
- rebase destrutivo
- force push

Não faça commits sem solicitação explícita.

Antes de uma alteração relevante, consulte `git status`.

---

## Segurança

Toda autorização deve ser garantida pelo backend.

Restrições existentes apenas no frontend não devem ser consideradas
controle de segurança.

Nunca:

- introduza secrets no código;
- crie fallback inseguro para secrets;
- registre senhas ou tokens em logs;
- exponha credenciais;
- monte SQL com entrada do usuário sem validação/parametrização.

---

## Arquitetura

Evite adicionar novas regras de negócio diretamente em componentes React
grandes.

Evite aumentar controllers já extensos quando a lógica puder ser isolada.

Não faça grandes refatorações junto com implementação de funcionalidade,
salvo quando explicitamente solicitado.

Prefira alterações pequenas, rastreáveis e verificáveis.

Não introduza nova biblioteca, framework ou padrão arquitetural sem
justificar previamente.

---

## Frontend

Antes de criar um componente novo, procure componentes existentes que
possam ser reutilizados.

Siga o design system existente.

Não duplique regras de permissão ou regras de domínio no frontend quando
elas pertencem ao backend.

Estados exclusivamente locais devem permanecer locais quando não houver
necessidade de estado global.

---

## Backend

Rotas devem ser responsáveis principalmente pelo roteamento.

Controllers não devem acumular novas responsabilidades desnecessárias.

Regras de domínio novas devem, quando apropriado, ser isoladas de:

- HTTP;
- persistência;
- integração com sistemas legados.

Valide entradas externas.

Use queries parametrizadas para dados fornecidos externamente.

---

## Código legado

Não reescreva código apenas por considerá-lo antigo ou pouco elegante.

Antes de alterar comportamento legado:

1. identifique quem depende dele;
2. documente o comportamento atual;
3. preserve compatibilidade quando necessário;
4. crie testes quando possível.

---

## Testes

Funcionalidades novas devem ser projetadas para permitir testes.

Correções de bugs devem, quando viável, incluir teste que reproduza o
problema.

Não remova validações ou testes existentes apenas para fazer uma alteração
passar.

---

## Documentação

Mudanças relevantes em regras de negócio devem atualizar a documentação
correspondente em `docs/` ou no README específico do módulo.

Se código e documentação divergirem, não escolha silenciosamente um deles.

Informe a divergência antes de alterar comportamento.

---

## Skills

Consulte `.agents/skills/` quando a tarefa estiver relacionada ao domínio
de uma skill existente.

Skills fornecem contexto especializado, mas não substituem a leitura do
código atual.

---

## Modo de trabalho esperado

Para tarefas médias ou grandes:

1. analisar;
2. explicar impacto;
3. propor plano;
4. aguardar aprovação quando houver decisão arquitetural;
5. implementar em pequenos passos;
6. executar verificações disponíveis;
7. apresentar arquivos alterados;
8. apresentar riscos ou pendências.

Ao finalizar uma implementação, informe:

- o que foi alterado;
- quais arquivos foram alterados;
- quais verificações foram executadas;
- o que não foi possível verificar;
- riscos ou próximos passos.