# Arquitetura do sistema

> Atualizacao de 20/10/2026: os agendadores automaticos C4 e de cores foram
> removidos. CI usa comandos manuais em ciLifecycle; cores usam somente
> fleetColorRefresh --refresh. Referencias a scheduler abaixo sao historicas.

## Notificações C4 — backend Socket.IO

Uma instância de Socket.IO compartilha o servidor HTTP do Express e a porta
existente, em `/api/socket.io`. O cliente React usa o mesmo caminho e os
endpoints HTTP oficiais, conforme a integração descrita abaixo.
JWT é recebido somente em `handshake.auth.token`, validado com o segredo atual;
usuário e acesso são consultados pela mesma política `assertC4Read` do HTTP.
Somente garagens C4 habilitadas e autorizadas recebem salas `c4:VCG`/`c4:VCM`,
atribuídas pelo servidor. Papel e salas enviados pelo cliente não são usados.
Tokens expirados desconectam; permissões são revalidadas antes de cada entrega.
Revogação/usuário removido ou falha na consulta de autorização impede a entrega
e encerra a conexão. Novas permissões exigem reconexão para atribuir novas salas.

`saveC4`, `startCycle` e `finalizeCycle` notificam somente após a resolução da
transação Serializable. `saveC4` compara o snapshot antes/depois sem alterar seu
formato; prepare, no-op, rollback, conflito, NOT_DUE e ALREADY_DONE não emitem.
O único evento é `c4:updated`, com garagem, dataOperacional D e dataFolha D+1.
Controllers e scheduler não duplicam emissões. Falha de transporte é isolada
da gravação confirmada; não há repetição de POST. A autorização de cada cliente
é consultada após commit, acrescentando leituras proporcionais às conexões.

Escopo: uma API, sem Redis, adapter distribuído, tabelas ou migrations. Eventos
não são persistidos: falha do processo entre commit e emissão pode perder a
notificação. O frontend recupera por HTTP ao conectar/reconectar, preservando
rascunhos e baselines originais. Docker e Nginx não foram alterados; o proxy
Vite habilita `ws` no caminho `/api` já existente.

## Realtime C4 — cliente e edições

`App` mantém uma conexão compartilhada com `socket.io-client`, autenticada
por `auth.token`, somente após carregar a sessão. Logout e invalidação da
sessão fecham a conexão. A contagem de consumidores e a limpeza adiada por
microtask evitam duplicação no ciclo de efeitos StrictMode. Os listeners de
transporte são registrados uma vez; a mudança de token substitui a conexão.

O único evento de aplicação ouvido é `c4:updated`. Garagem, data operacional D
e folha D+1 são validadas; CI considera a data da folha e Controle a data D.
Connect/reconnect invalida as telas abertas. `useC4RealtimeReload` agrupa eventos,
usa os managers e `readCoordination`, aguarda consultas/gravações pendentes e
descarta respostas antigas. Não executa POST nem usa itens do evento. Recarga
em segundo plano não faz `setReady(false)`; falha conserva lista e formulários.
Uma leitura invalidada por mutação é reagendada; 409/POST salvo+GET falho também
podem provocar somente recuperação de leitura. Atualização manual continua
disponível. O listener local do Controle já ignora consultas coordenadas em
andamento, evitando a consulta adicional disparada pelo manager da CI.

`editBaselines` conserva o array original associado aos tokens WeakMap de C4.
Modais capturam ao abrir; reforços ao focar/editar a linha; título ao focar.
Cada rascunho conserva seus valores e baseline quando o snapshot exibido muda.
Salvar constrói alterações sobre a baseline do editor e envia os tokens dela.
O salvamento em lote de reforços usa a baseline mais antiga entre os rascunhos;
não certifica rascunhos antigos com tokens novos. Data/garagem diferentes são
recusadas na tentativa de salvar. Nova edição usa a lista oficial atual.

HTTP 409 mantém rascunho e baseline; não há repetição automática de POST nem
rebase silencioso. Fechar/reabrir o modal inicia nova edição; título e reforços
oferecem descarte explícito no aviso de falha. Os efeitos de atualização da CI
não apagam rascunhos de reforço em cada mudança da lista. O snapshot oficial
e o relatório continuam atualizando, inclusive com um formulário aberto.

Testes usam clientes Socket.IO/HTTP em loopback e banco simulado, além dos
managers reais com API simulada. Não há DOM/browser runner instalado: foco,
aparência, seletores nativos e interação visual devem ser conferidos em dois
navegadores. Não se garante entrega durável de eventos; reconexão recupera
o estado HTTP, não repete escritas. A arquitetura continua limitada a uma API.

Verificação manual pendente em dois navegadores autorizados, no mesmo contexto:
abrir inclusão/edição na CI e Controle e digitar sem salvar; gravar no outro
navegador e conferir atualização da lista, texto, seleção, foco e modal intactos.
Salvar o rascunho antigo deve enviar um único POST e receber 409, mantendo-o.
Cancelar/reabrir deve usar a baseline nova. Repetir com liberação, reforços,
título e remoção concorrente de uma posição EXTRA em edição. Desconectar um
cliente, gravar no outro e reconectar deve atualizar listas sem POST. Conferir
também alternância de contexto, duas gravações consecutivas e logout.

## Frota da CI e conexão com o legado

Contrato de garagem da frota: o backend preserva `garagem` original e sua
classificação histórica em `garagemNome`. O seletor reconhece explicitamente
1/"1"/VCM/textos contendo MORENA como código 1 e 2/"2"/VCG/textos contendo
CAMPO GRANDE como código 2, na mesma precedência do backend. Não usa o fallback
do backend por prefixo para certificar cadastro. Veículos com garagem nula,
ausente, vazia ou composta por espaços são omitidos somente dos seletores;
os demais são carregados sem novas tentativas por esse motivo. A contagem
omitida é registrada no console, sem identificadores. Itens salvos da CI não
são filtrados. Códigos desconhecidos e identificadores inválidos ainda rejeitam
a resposta inteira, mantendo a lista anterior. O diagnóstico informa contagens de registros incompletos, garagens
desconhecidas e inconsistências, sem expor identificadores. Valores originais
válidos ficam em `garagemOriginal` no cliente. O formato público não mudou.
Por confirmação operacional, os seletores da CI VCG usam garagem cadastrada 2,
exceto BLOQUEADOS VCM, que usa somente garagem 1 dentro da mesma folha VCG.
`vehiclesForGarage` usa 1 para VCM e 2 para VCG. Este filtro não remove itens
já salvos nem altera históricos. A baixa confirmada pela CI envia
`confirmRelease` com a retirada explícita: a transação C4 remove o bloqueio e
marca LIBERADO no Controle, encerrando execução; exclusão comum não libera.

`mssql.getPool` usa `legacyPool`: requisições simultâneas aguardam a mesma
promessa de conexão. Pool desconectado é fechado antes da substituição; uma
tentativa malsucedida é fechada e permite outra consulta tentar novamente após
5 segundos. Não há loop de conexão nem nova consulta SQL disparada por timer
no backend. O pool atende todos os consumidores existentes do serviço legado.

Na CI, `useCIFleet`/`ciFleet` carregam o inventário independentemente dos snapshots
C4. Após falha transitória há até três novas consultas em 5, 10 e 20 segundos;
o usuário pode consultar novamente e a volta do foco/rede permite recuperação.
401/403 não geram tentativas automáticas por timer. Respostas antigas e de
componentes desmontados são descartadas; consultas simultâneas da mesma
instância não duplicam requisições.

Falha de atualização mantém a última lista recebida e informa sua origem.
Resposta oficial vazia substitui a lista anterior, sem fallback para frota
estática. O aviso distingue sessão, permissão, timeout, indisponibilidade do
legado, outros erros HTTP e falha de comunicação. Mock/origem desconhecida
continuam identificados, sem serem certificados como frota oficial.

A lista local não recebe `garagemFonte` inferida. Se não houver inventário válido
para o seletor C4/VCG, a tela informa que aguarda a frota oficial; itens já salvos,
relatórios e revisões operacionais permanecem independentes dessa consulta.
Não foi alterada a política de gravação: validação cadastral de novas inclusões
sem inventário oficial requer decisão operacional; edição de itens históricos
não deve ser restringida por inferência. Validação com SQL Server real permanece
pendente e não integra os testes locais simulados.

## Consistência de snapshots C4 nos clientes

`lib/c4.ts` compartilha consultas em andamento por garagem, dia e época de
mutação. Respostas anteriores a uma mutação ou substituídas por uma consulta
posterior não podem publicar contexto. Os managers preservam suas guardas de
leitura e os eventos existentes.

Cada lista oficial de CI/Controle fica associada em memória, por identidade do
array, ao contexto, `base` e `baseC4` da mesma resposta. A gravação verifica que
a baseline não mudou e utiliza esse par, sem buscar token no mapa compartilhado
nem no localStorage. Uma lista antiga conserva seu token antigo: alterações de
outro posto continuam causando 409 no backend, sem repetição automática.

Após gravar, a consulta oficial fornece a próxima baseline e seus tokens. No
Controle, a lista retornada à tela vem dessa consulta, não dos registros do POST
combinados com token de outra leitura. Falha nessa recarga mantém a indicação
de gravação concluída com atualização necessária. Formato de revisão, regras
operacionais, transações e locks do backend permanecem inalterados.

As telas usam `readCoordination` para coordenar carga inicial, atualização manual
e reações a eventos. Só a conclusão mais recente do contexto ativo (garagem/data),
na mesma época de mutação e com componente montado, pode publicar estado,
mensagens ou flags de leitura. Interrupções tipadas por substituição/mutação
não são falhas operacionais; falhas reais da consulta vigente mantêm o bloqueio.
Não há repetição automática de gravações.

Durante uma recarga coordenada, o listener do Controle não inicia outra consulta
em resposta à publicação da própria CI. Fora dela, continua reagindo às consultas
e alterações oficiais da CI. Eventos preservam o array original e acrescentam
garagem/dia; consumidores antigos com callback de um argumento continuam válidos.
O listener ignora outra garagem/data. A recarga oficial após POST permanece.

Pendências preservadas nesta etapa: inclusão no Controle ainda restringe pela
garagem inferida do prefixo; o botão de verificar preparação permanece desabilitado
em VCM. Nenhuma dessas regras foi alterada pela coordenação de recargas.

## DATA-001/C4 — Runtime local opt-in (07/10/2026)

As seções C3/fase 2 abaixo registram decisões e o baseline anterior.
Agora existem serviços operacionais locais; não houve provisionamento ou
ativação real nesta etapa. A regra de domínio atual está em DOMAIN.md.

`c4Temporal` calcula datas civis/eventos em America/Campo_Grande com Intl,
independente de TZ do container. `c4Flow` reutiliza os quatro models candidatos:
consultas coerentes somente leitura, início/finalização idempotentes e comando
atômico CI/Controle. `c4Scheduler` chama esses serviços no bootstrap e por
timeouts calculados para 03:00/18:30; retry após erro em 60s, sem replay histórico
e sem dependências novas. Logs incluem contexto/dia/resultado; não incluem SQL
ou credenciais. Configuração vazia não inicia automação nem acessa C4.

Escritores usam Serializable e SELECT parametrizado UPDLOCK/HOLDLOCK sobre
chaves garagem/data do ciclo e folha alvo, nessa ordem, inclusive chave ausente.
Mutação revalida ADMIN e janela após locks; revalida hora imediatamente antes
de retornar da transação. Finalização usa os mesmos locks. Snapshot SHA-256
inclui ciclo, cabeçalho, itens e estados; versão de conteúdo do MVP permanece
e agora inclui campos C4. Stale retorna 409, sem sobrescrever; rollback cobre
ambos os lados. Não há lock global de todas as garagens. A simulação de testes
não comprova o comportamento dos locks reais: validação SQL Server autorizada
continua necessária antes da operação.

03:00 copia somente Folha D FINALIZADA da mesma garagem, com PKs novas e
identidades/posições/conteúdo preservados. Somente seus bloqueados inicializam
Controle D. Ausência da fonte cria RECUPERACAO vazia para D/D+1, sem reconstruir
passado. 18:30 finaliza a folha corrente, mantendo horário efetivo na repetição.
Bootstrap recupera apenas eventos de hoje; GET nunca chama esses serviços.

### Transição e consumidores

- GET `/api/c4/contexto?garagem=VCG&data=D`: metadados, CI histórica e Controle
  coerentes, modo/versão/status/título. Estrutura ausente é informação, não seed.
- GET `/api/ci-bloqueios` e `/api/manutencao`: C4 para contexto habilitado;
  mantêm formatos de itens usados pelos consumidores. Contexto explícito é
  obrigatório quando qualquer garagem C4 está habilitada.
- POST `/api/ci-bloqueios/sync` e `/api/manutencao/sync`: C4 na garagem
  habilitada; MVP legado VCG quando não habilitado. VCM não habilitada não pode
  cair no escritor legado VCG. Demais contratos antigos de escrita continuam
  recusados. Não há dupla escrita nem fallback para dados legados se C4 falhar.
- `ciManager`/`manutencaoManager`, telas CI/Controle e Soltura/index e
  CarroRealizadoView são consumidores identificados. Managers preservam
  projeções/cache informativo; escritores antigos persist/release/delete
  continuam recusados. Com C4, helpers de status usam contexto oficial/data
  exata e não reconstrução por caches legados. Cache não autoriza mutação.
- `mvpLegado` é o único escritor restante de ci_bloqueios/manutencao_carros
  para VCG não habilitada. Não apagar tabelas/dados legados nesta entrega.

UI mantém aparência, quatro grupos BLOQUEADOS no contexto VCG, seleção de
Veiculos da Garagem 2 no seletor VCG, flags independentes em uma linha, observações separadas,
metadados persistidos e leitura explícita de FINALIZADA/ausente. Título é salvo
no backend, inclusive folha sem itens; não é reconstruído de localStorage.
Drafts de reforço não substituem fotografia finalizada. POST confirmado é
seguido de consulta oficial; falha de refresh bloqueia novas gravações.

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
| Preparação da próxima CI | Ajustes durante preparação, historicamente a partir da anterior; cópia integral confirmada na C3 |
| Finalização | Preservar fotografia para uso operacional; automática às 18:30 conforme C3; implementação pendente |
| Alterações explícitas | Retirada confirmada dirigida à preparação, preservando finalizadas |
| Controle de Manutenção | Oficina distinta da CI; execução e bloqueio podem coexistir |

Esta separação não define novos endpoints, serviços, tabelas ou arquitetura futura implementada. Data futura não equivale automaticamente a preparação.

**ATUAL/OBSERVADO:** interface calcula herança e permite edição de amanhã; algumas ações persistem cópias. Não há ciclo persistido de preparação/finalização identificado. Após DATA-001B1/B2, os controllers de CI/manutenção não executam saneamentos históricos ou provisionamento estrutural; GET de manutenção ainda materializa, reconcilia e exclui registros funcionalmente; managers locais acrescentam sincronização. Isso não garante fotografias imutáveis.

Pendências estão centralizadas no contrato de DOMAIN.md; etapas propostas na DATA-001 de BACKLOG.md. DATA-001A não altera aplicação.


## DATA-001C1 — Correspondência dos ciclos, sem implementação técnica

A fonte das regras é [DOMAIN.md](./DOMAIN.md#data-001c1--ciclos-operacionais-e-continuidade-dos-bloqueados). Durante o dia D, BLOQUEADOS da manutenção D sincronizam bidirecionalmente com BLOQUEADOS da CI do próximo dia operacional em preparação. Essa correspondência não autoriza mutar manutenção anterior ou CIs finalizadas.

Bloqueios vigentes continuam no novo ciclo; execução e liberados começam limpos. BLOQUEADO + EM MANUTENÇÃO coexistem. Retirada explícita reflete na preparação correspondente; liberação de bloqueado depende de confirmação antes de qualquer alteração, com cancelamento sem efeitos.

Inicialização e sincronização devem ficar separadas da consulta, preservando fotografias. C3 confirma entidades distintas, timezone e horários; persistência, contratos de comandos e transações continuam sem implementação. Não inferir destino pela data futura nem interpretar esta separação como implementação existente. GET de manutenção e propagadores atuais ainda precisam ser corrigidos nas etapas C/D/E/F.


## DATA-001C3 — Desenho aprovado e implementação futura

Contrato em [DOMAIN.md](./DOMAIN.md#data-001c3--contrato-consolidado-do-ciclo-e-da-fotografia-ci); schema apenas proposto em [DATABASE.md](./DATABASE.md#data-001c3--proposta-de-schema-nao-implementada). FolhaCI e CicloOperacional são distintos, segregados por garagem; ADMIN opera ambos os contextos. Não derivar autorização de user.garagem. Piloto VCG; VCM requer habilitação explícita futura.

Fonte temporal comum America/Campo_Grande: todos os dias 03:00 inicializa ciclo/copia folha inteira; 18:30 finaliza e fecha mutações do Controle e da CI. A janela noturna é consulta, sem comandos operacionais. Cópia inclui título/slots de reforço; sincronização durante o dia envolve somente Bloqueados.

Operações de domínio devem ficar em serviço separado de HTTP e agendamento. Inicialização transacional inclui ciclo, folha, itens/metadados, estado diário e conclusão; finalização serializa com comandos. Autorização ADMIN, contexto de garagem, janela temporal e EM_PREPARACAO são revalidados dentro da fronteira segura. Chamadas antes do prazo não garantem autorização. GET é consulta do persistido, nunca recuperação oculta.

Scheduler sem biblioteca escolhida dispara operações idempotentes. Recuperação no mesmo dia processa evento pendente com horários previstos/efetivos; vários dias geram estruturas vazias identificadas, sem replay de realidade nem cópia repetida. Importação Excel é procedimento externo/manual posterior. Imutabilidade operacional não é revogada pelo futuro procedimento administrativo de recuperação.

Proposta mínima de habilitação: lista explícita de garagens do novo fluxo em configuração central do backend (padrão nenhuma; VCG habilitada no rollout). O config.ts atual trata secrets/conexão, sem catálogo de garagens habilitadas. Não criar tabela/perfis por garagem. Scheduler e comandos compartilham a configuração; ADMIN pode consultar VCM, mas mutações do novo fluxo exigem habilitação. Não há alteração de configuração nesta etapa.

Controllers/frontend atuais ainda usam prefixos globais, clones e caches mutáveis. Não há scheduler/ciclo/finalização ou garantia transacional implementados. C4/D/E/F precisam substituir esses caminhos de forma coordenada, sem manter dupla escrita entre fonte oficial nova e legado.


## DATA-001C4 — Fase 2: artefatos sem ativação do fluxo

A consolidação C3 está no commit 2c39fd1. A C4 fase 2 adiciona somente os models candidatos CicloOperacional, FolhaCI, ItemFolhaCI e EstadoManutencao ao schema Prisma e os scripts administrativos data-001c4-provisionamento.sql / data-001c4-validacao.sql. Detalhes e limites em [DATABASE.md](./DATABASE.md#data-001c4--fase-2-schema-candidato-e-provisionamento-administrativo).

Nenhum script foi executado, nenhuma migration/Prisma Client foi gerada e nenhuma tabela foi provisionada nesta fase. Não há integração com HTTP/startup/npm/Docker. Legado e consumidores permanecem intactos; novo fluxo desabilitado, sem feature flag ativa ou corte VCG. GET de manutenção continua mutável.

Prisma representa relações/uniques convencionais; CHECKs, três UNIQUEs filtrados e precisão DATETIME2(3) exigem SQL administrativo complementar. FKs compostas de garagem impedem vínculos cruzados; não garantem sozinhas a correspondência D/D+1 ou imutabilidade temporal. Inicialização atômica, fechamento protegido, autorização ADMIN/temporal, scheduler, recuperação e sincronização continuam por implementar. Compatibilidade controlada do stack Prisma 6.10/SQL Server 2012 fica para antes do rollout, sem atualização de dependências nesta modelagem.
