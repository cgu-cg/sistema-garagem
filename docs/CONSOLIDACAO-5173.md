# Consolidação do Sistema Garagem para revisão — 09/10/2026

## Resultado e limites

Código integrado no worktree `sistema-garagem-consolidacao`, branch
`feat/consolidacao-c4-producao`, sobre `fb6eb69`. Pronto para revisão local;
publicação operacional depende das pendências abaixo. Porta Vite 5173
preservada. Porta 5174, infraestrutura, containers e produção não foram alterados.
API e frontend não foram iniciados. Nenhum deploy, commit, staging, push,
migration, seed, SQL ou consulta ao banco foi executado.

O original foi lido diretamente, incluindo seu status e fontes não rastreadas.
Sua base era `f0d24e5`; os commits `5eb9c56` e `fb6eb69` da consolidação foram
preservados. A integração usou merge de três vias por arquivo e revisão dos
fluxos, sem substituir indiscriminadamente arquivos inteiros. Os arquivos
de ambiente, importes, planilhas e dados operacionais não foram copiados.
Não houve escrita no original; seu status permanece igual ao levantamento
inicial. Uma comparação de hashes de 126 fontes/documentos também não
identificou mudanças no original durante a inspeção e integração.

## Funcionalidades integradas

- Escala compartilhada por garagem, tipo e turno, com revisão otimista,
  validação Zod, publicação ADMIN e transação atômica de cabeçalho/itens.
  Conflitos retornam 409; indisponibilidade de banco/provisionamento retorna
  503. Não importa automaticamente programação antiga de localStorage.
- Soltura individual e em lote consultam CI finalizada da data explícita e
  manutenção oficial atual antes de escrever. Recusam bloqueio, execução,
  recuperação não certificada, contexto incompleto e identidades divergentes.
  Usam os mesmos locks por garagem/dia dos escritores C4 e scheduler.
- Despacho e troca aguardam confirmação da API antes de aplicar estado/cache,
  sucesso ou consumo de reserva. Erros preservam formulário. Preenchimento
  automático prepara rascunho, sem inventar motorista ou liberar lote.
- Cache de manutenção liberada não neutraliza bloqueio oficial da CI.
  Removida a referência fixa de 09/09 do aviso de disponibilidade.
- Consulta de Escala e escrita de Soltura verificam garagem do usuário no
  backend, reutilizando o controle C4. ADMIN tem acesso global, respeitando
  as restrições do piloto. Incluídos testes de recusa de outra garagem.
- Respostas atrasadas de Escala não sobrescrevem publicação mais recente;
  resposta de despacho de outro contexto não substitui o estado da tela atual.
- Layout existente, componentes, duas colunas da prancheta e impressão
  preservados. Demais módulos não foram reescritos.

## C4 preservado e conflitos resolvidos

Conflitos de merge em `c4Flow.ts`, `c4Flow.test.ts`, manutenção e
`CiManutencaoView.tsx` foram resolvidos mantendo o comportamento mais recente
da consolidação: janela C4 03:00 inclusivo até 20:00 exclusivo em
America/Campo_Grande; legado permanece em 18:30. Seleção inicial da CI usa
hoje antes das 03h e amanhã depois desse limite, sem alterar a data de Soltura
ou Histórico. Seleção manual permanece durante a tela.

Permissões existentes de ADMIN/manutencao VCG, proteção de FINALIZADA,
persistência de slots/título, sincronização exclusiva de BLOQUEADOS,
coexistência com execução e liberação confirmada foram mantidas.
O lock C4 foi exportado para reutilização pela Soltura, preservando horário,
ordem dos locks e revalidação transacional. Um import duplicado detectado
pelo TypeScript foi removido; as verificações foram repetidas com sucesso.

Documentação histórica ainda descrevia 18:30/ADMIN exclusivo. `DOMAIN.md`
e a auditoria de ativação agora explicitam a precedência dos documentos
vigentes de horário e permissões, preservando os baselines históricos.

## Frota: 296 versus 464 e classificação

Comparação estática das listas em `data/inventoryCars.ts`, Controle
Operacional e Abastecimento: cada uma tem 464 prefixos únicos e é idêntica
entre os worktrees. São 168 prefixos iniciados por 1 e 296 restantes.
Isso explica uma possível contagem por filtro; não prova a quantidade real
do SQL Server nem qual ambiente exibe qual fonte.

O endpoint existente consulta `Veiculos` com `ativo=1`, prefixo menor que
6000 e exclusões 1999/2999/3999/4999. C4 usa o valor bruto `garagemFonte=1`
para a seleção da CI VCG. O normalizador legado associa valor 1 a VCM,
valor 2 a VCG e mantém fallback por prefixo/2002. Essa diferença deve ser
validada na origem: contexto de folha, garagem física e consorciada não
são equivalentes. A consulta não fornece coluna de consorciada comprovada.
Nenhum filtro, cadastro, classificação ou histórico foi corrigido por inferência.

## Validação executada

| Verificação | Resultado |
| --- | --- |
| `node scripts/test-sem-banco.cjs` | 136 testes passaram; 0 falhas, 0 ignorados. |
| `npm run lint` | Passou: TypeScript web e API. Não há ESLint configurado nesse comando. |
| `npm run build:api` | Passou após corrigir import duplicado. |
| `npm run build:web` | Passou: 1950 módulos; aviso de chunk maior que 500 kB. |
| `git diff --check` | Passou após remover linha vazia excedente da documentação. |
| Revisão de bootstrap, scripts e scheduler | Realizada por leitura de código; nada iniciado. |

As dependências já instaladas no original foram copiadas para `node_modules`
independente e ignorado pelo Git, sem instalar/atualizar pacotes e sem arquivos
de ambiente ou planilhas. Prisma Client 6.10.0 foi gerado nessa cópia local
com `node node_modules/prisma/build/index.js generate --schema apps/api/prisma/schema.prisma`.
Isso gera código; não executa migration, DDL ou conexão ao banco.
O cache TypeScript rastreado foi restaurado ao conteúdo inicial após os builds.

A suíte usa doubles em memória, intercepta o Prisma nos controllers testados
e bloqueia conexões TCP/TLS. O erro simulado de consulta C4 e o aviso de
localStorage do Node são esperados. Não executar `apps/api/test-conn.js`:
ele consulta banco real e ficou fora da validação autorizada.

Não foram verificados banco real, provisionamento, locks concorrentes reais,
permissões SQL, desempenho, dois postos no navegador, apresentação visual
em execução, Docker/Ubuntu ou publicação. Builds e mocks não certificam esses itens.

## Possíveis gravações automáticas no banco

### Controle independente do scheduler por instância

`C4_SCHEDULER_ENABLED` tem padrão `true`. Somente o valor `false` desabilita
a inicialização automática; espaços nas extremidades e maiúsculas são aceitos.
Variável ausente ou vazia mantém o comportamento anterior.

Configuração prevista para a instância consolidada publicada na 5173:

```text
CI_NOVO_FLUXO_GARAGENS=VCG
C4_SCHEDULER_ENABLED=false
```

Assim, as rotas C4 continuam habilitadas, mas essa instância não dispara
bootstrap, timers de abertura/fechamento ou retries do scheduler. A instância
C4 da 5174 permanece responsável pelo processamento automático no banco
compartilhado, conforme a topologia informada. Sua configuração não foi alterada.

A flag é lida quando `startC4Scheduler` é chamado na inicialização da API;
não é um interruptor dinâmico de um scheduler já iniciado. Não controla portas,
`enabledGarages()`, `mutationMode()`, rotas ou comandos de domínio explícitos.
Operações manuais continuam podendo gravar no banco conforme autorização,
janela e validações existentes; esta flag não torna a API somente leitura.
Sem outra instância responsável pelo scheduler, a preparação/finalização
automática não ocorrerá nesta instância desabilitada.

Nenhum `.env` foi modificado. Configuração efetiva e reinicialização continuam
pendentes de autorização de publicação; nenhum deploy foi executado.

Validação desta configuração: `node scripts/test-sem-banco.cjs` passou com
141 testes, incluindo cinco novos cenários (padrão ausente, `true`, vazio,
`false` e ` FALSE `). Os testes simulam comandos e timers, verificam ausência
de bootstrap com a flag desabilitada e preservação do modo C4/comando explícito.
`npm run build:api` e `git diff --check` também passaram, sem acesso ao banco.

| Caminho | Efeito observado |
| --- | --- |
| `apps/api/src/index.ts` após `app.listen` | Chama `startC4Scheduler(prisma)`, que retorna sem bootstrap ou timers quando `C4_SCHEDULER_ENABLED=false`. Com scheduler habilitado e garagens C4 configuradas, pode gravar. |
| `c4Scheduler.ts` / `recoverCurrentDay` | Bootstrap imediato para garagens habilitadas; eventos às 03h e 20h; retry em 60 s após falha. |
| `c4Flow.ts` / `startCycle` | Pode criar Ciclo D, Folha D+1, copiar itens e criar estados bloqueados; sem origem válida cria recuperação atual vazia. |
| `c4Flow.ts` / `finalizeCycle` | Atualiza folha para FINALIZADA e timestamp efetivo. Bootstrap após 20h pode abrir e finalizar no mesmo processamento. |
| Flag C4 ausente/vazia | Scheduler retorna sem instalar timer ou acessar persistência; não foi alterada nesta tarefa. |
| `prisma/seed.ts` / `npm run db:seed` | Faz upsert de usuários/grupos; execução manual separada, não acoplada ao bootstrap. Não executado. |
| `npm run db:migrate` | Executa `prisma migrate dev`; manual e não executado. |
| `utils/createReservasTable.ts` | Contém DDL via executeRawUnsafe; só executa explicitamente como script, sem import/chamada no bootstrap localizado. Não executado. |
| SQL em `scripts/sql/` | Scripts administrativos separados, inclusive o candidato da Escala; não chamados no bootstrap. Nenhum executado. |
| Dockerfile da API | Build gera Prisma Client e compila; CMD inicia `dist/index.js`, respeitando `C4_SCHEDULER_ENABLED` no startup do scheduler. Não há migration/seed no CMD observado. Docker não foi executado. |

GETs de CI/Controle C4 não inicializam nem reconciliam dados. Rotas de escrita
de Escala, Soltura e demais módulos continuam gravando quando chamadas;
nenhuma chamada HTTP foi feita nesta tarefa. O bootstrap também pode criar
diretório de uploads no disco, independentemente do scheduler.

## Riscos e decisões pendentes antes da publicação

1. **Schema de Escala:** dois modelos e SQL candidato estão preparados apenas
   para revisão. Sem tabelas provisionadas, Escala fica indisponível (503).
   Execução exige autorização específica, ambiente confirmado, backup e revisão.
2. **Contenção de Soltura herdada:** VCM e legado recusados; CI em preparação
   não autoriza soltura; antes das 03h a manutenção atual não está comprovada.
   Autorizar outros fluxos exige decisão operacional, sem relaxamento inferido.
3. **Origem e continuidade:** recuperação vazia e linhagem sem importação
   certificada não autorizam Soltura. Conferir folha de origem e continuidade
   antes de ativar, sem reconstruir dias perdidos ou editar finalizadas.
4. **Concorrência real:** validar SQL Server, duração das transações, virada
   de dia e scheduler com todos os processos na mesma versão/configuração.
   Não basta HTTP `/health` responder para certificar bootstrap C4.
5. **Frota e garagem:** validar a fonte de 296/464 e semântica da coluna
   garagem antes de alterar regras. Nenhuma consulta foi autorizada/executada.
6. **Permissões preexistentes separáveis:** históricos de Soltura e reservas
   ainda exigem revisão contextual por garagem. Exclusão de reserva após
   despacho é outra requisição e pode falhar depois de Soltura confirmada.
7. **Programação repetida:** API preserva carro repetido em viagens distintas;
   a interface existente impede algumas alterações repetidas. Regra pendente;
   nenhum dos comportamentos foi arbitrariamente escolhido como regra geral.
8. **Dados locais antigos:** não houve migração automática; revisar programação
   antes de publicação explícita pelo ADMIN. Cache não substitui histórico oficial.
9. **Resultado indeterminado de rede:** erro no COMMIT pode exigir consulta ao
   histórico antes de repetir; não garante que não houve gravação no servidor.

Pendências separáveis registradas em `docs/BACKLOG.md` (DATA-003, SEC-004,
OPS-002). Deploy na porta 5173 permanece aguardando autorização e decisões
necessárias; esta entrega não autoriza executar SQL nem iniciar a API.

## Arquivos modificados e criados

O status abaixo lista todos os arquivos da entrega. C4 temporal, scheduler,
permissões já commitadas e seleção inicial da CI ficaram preservados sem
diff adicional. Artefatos de build e dependências locais não entram no Git.

Resultado de `git status --short`:

```text
 M apps/api/prisma/schema.prisma
 M apps/api/src/controllers/soltura.ts
 M apps/api/src/routes/index.ts
 M apps/api/src/services/c4Flow.ts
 M apps/web/src/pages/soltura/AlterarCarroProgramadoView.tsx
 M apps/web/src/pages/soltura/AlterarFolhaView.tsx
 M apps/web/src/pages/soltura/CarroRealizadoView.tsx
 M apps/web/src/pages/soltura/ciManager.ts
 M apps/web/src/pages/soltura/index.tsx
 M docs/BACKLOG.md
 M docs/DATA-001-C4-ATIVACAO-CONTROLADA.md
 M docs/DATABASE.md
 M docs/DOMAIN.md
?? apps/api/src/controllers/escalaCarros.ts
?? apps/api/src/services/escalaCarros.ts
?? apps/api/src/services/solturaAvailability.ts
?? apps/api/src/services/solturaSafety.ts
?? apps/api/tests/solturaAvailability.test.ts
?? apps/api/tests/solturaEscalaSafety.test.ts
?? apps/web/src/lib/confirmedWrite.ts
?? apps/web/src/lib/sharedEscala.ts
?? docs/CONSOLIDACAO-5173.md
?? docs/SOLTURA-ESCALA-SEGURANCA.md
?? scripts/sql/escala-carros-provisionamento.sql
```
