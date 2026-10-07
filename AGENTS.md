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

## Autonomia dos agentes e controle de escopo

As instruções explícitas da tarefa delimitam a autonomia. Dentro desse escopo,
ações locais e reversíveis não exigem aprovação individual adicional.

### Ações locais permitidas sem aprovação adicional

- Ler arquivos e pesquisar o repositório com rg/find ou equivalentes.
- Consultar git status, git diff e git log.
- Criar/editar código, testes, arquivos necessários e documentação relacionada.
- Fazer refatorações locais estritamente necessárias à tarefa.
- Criar scripts SQL para revisão, SEM executá-los.
- Executar lint, build, testes locais, typecheck e validações que comprovadamente
  não acessem banco, serviços externos ou dados operacionais.
- Revisar o próprio diff e corrigir falhas dessas verificações dentro do escopo.

Antes de executar verificações, inspecione seus comandos e efeitos. Uma tarefa
somente leitura ou com restrições específicas não autoriza implementação.

### Ações que exigem autorização explícita na tarefa

- git add e git commit.
- Consultas SELECT e inspeção somente leitura de banco de dados.
- Alterações coordenadas que ultrapassem claramente o escopo inicial.

Mesmo com staging/commit autorizados, adicione somente arquivos da tarefa,
revise o staged diff e pare se houver arquivo inesperado ou alteração não
relacionada. Autorização para criar/revisar SQL não autoriza sua execução.

### Ações proibidas sem autorização explícita

- Executar INSERT, UPDATE, DELETE, MERGE, CREATE, ALTER, DROP ou TRUNCATE.
- Executar scripts SQL contra banco, migrations, prisma migrate, prisma db push
  ou prisma db pull; modificar dados operacionais.
- Alterar .env ou credenciais; instalar, remover ou atualizar dependências.
- Alterar infraestrutura ou serviços externos.
- git push, force push, git reset destrutivo, git clean, rebase, apagar branches
  ou alterar histórico Git.
- Executar comandos destrutivos fora do escopo.

As proibições de expor/registrar segredos e introduzir credenciais reais no
código permanecem válidas. Nenhuma autorização local implica acesso ao banco,
produção ou Git remoto. Nunca suponha que um banco disponível seja de teste.

### Quando parar para decisão

Interrompa a implementação e peça decisão quando houver regra de negócio não
documentada necessária, conflito entre documentação e operação, dúvida que
mude comportamento operacional, risco relevante de perda/corrupção de dados,
necessidade real de alterar banco/migration, ampliação significativa de escopo
ou operação destrutiva não coberta por autorização específica.

Decisões técnicas locais, reversíveis, sem impacto de negócio e dentro do
escopo não exigem aprovação: escolha a alternativa conservadora, implemente,
valide e registre a decisão no resumo final. Não invente regras de negócio.

### Classificação de problemas encontrados

1. **Necessário para concluir com segurança:** se impedir a tarefa ou criar
   risco operacional/dados, corrija dentro do escopo e das autorizações. Se
   exigir uma das decisões acima, pare antes de executar a ação restrita.
2. **Importante, mas separável:** não amplie a implementação; registre em
   docs/BACKLOG.md com categoria SEC, DATA, OPS, TECH, FUNC ou UX e continue.
   Respeite restrições da tarefa sobre arquivos; se o backlog estiver fora dos
   arquivos autorizados, relate a pendência no resumo sem alterá-lo.
3. **Melhoria não necessária:** não implemente limpeza estética, reorganização
   ou mudança arquitetural dispensável à tarefa. Evite ampliar o escopo.

---

## Modo de trabalho esperado

Salvo instrução contrária, uma tarefa de implementação segue autonomamente:

1. analisar o fluxo, explicar impacto e propor plano curto quando estrutural;
2. implementar em pequenos passos;
3. criar/ajustar testes quando aplicável;
4. executar lint/typecheck/build/testes permitidos e sem acesso ao banco;
5. revisar o próprio diff e corrigir problemas dentro do escopo;
6. apresentar resultado, arquivos alterados, riscos e pendências para revisão.

Não é necessário parar entre essas etapas. Decisões arquiteturais novas que
mudem comportamento operacional ou ampliem significativamente o escopo exigem
aprovação; decisões locais reversíveis seguem a política de autonomia.
git add/commit somente com autorização explícita na tarefa atual. Banco e Git
remoto permanecem sujeitos às restrições anteriores.

Ao finalizar uma implementação, informe:

- o que foi alterado;
- quais arquivos foram alterados;
- quais verificações foram executadas;
- o que não foi possível verificar;
- riscos ou próximos passos.