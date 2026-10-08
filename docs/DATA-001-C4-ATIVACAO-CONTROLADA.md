# DATA-001/C4 — auditoria de primeira ativação

Auditoria local atualizada em 08/10/2026 na branch
`feat/data-001-c4-operational-flow`, sobre a base `50f708a`. O responsável informou
importação validada no banco garagem: oito folhas VCG FINALIZADA/IMPORTACAO
de 01 a 08/10, 595 itens e 262 registros históricos de bloqueio. A folha de
08/10 tem 77 itens e 28 bloqueados; validação independente sem divergências.
Esta auditoria não acessou o banco. Ubuntu permanece, conforme informado,
na branch main, commit `5f144b3`, com flag ausente/vazia e sem código C4.
O histórico é imutável; ativação e rollback não podem modificá-lo.

## Comportamento da ativação

O bootstrap de `c4Scheduler.ts` chama `startCycle` para a data civil atual D
em America/Campo_Grande. A origem é exclusivamente a folha VCG da data D,
se FINALIZADA. IMPORTACAO é aceita e não exige timestamps operacionais nem
ciclo histórico. A folha anterior mais recente não substitui a folha D.

| Situação | Resultado |
| --- | --- |
| Antes das 03:00 | NOT_DUE; aguarda 03:00. |
| Em 07/10, com 08/10 importado | Destino histórico ocupado: erro 409, sem ciclo ou alteração da história. |
| Em 08/10, 03:00 até antes de 18:30, sem destino 09/10 | Ciclo 08/10 NORMAL, folha 09/10 EM_PREPARACAO, cópia dos 77 itens de 08/10 e 28 estados bloqueados. |
| Depois de 08/10, sem folha D finalizada | Somente ciclo D RECUPERACAO e folha D+1 vazia, título e vínculo com a folha anterior NULL; manutenção D vazia. |
| A partir das 18:30 | Inicializa o dia atual e finaliza imediatamente D+1; não há janela para edição nesse dia. |
| Ciclo e preparação associados já existem | ALREADY_DONE; não recopia nem restaura bloqueados removidos. |
| Só ciclo ou folha D+1 existem | Erro 409; rollback; nenhum reparo implícito, inclusive se D+1 for histórico FINALIZADA. |

Não cria ciclos para dias perdidos. Preparações antigas eventualmente deixadas
abertas durante uma indisponibilidade não são finalizadas retroativamente.
No dia seguinte, uma recuperação vazia já finalizada pode ser origem NORMAL
de outra cópia vazia: NORMAL não certifica inventário operacional completo.

A cópia preserva chaves lógicas e campos dos itens, gera novos IDs físicos e
timestamps técnicos e não escreve na origem. Somente BLOQUEADO gera estado
inicial de manutenção: bloqueado=true, emExecucao=false, liberado=false,
consorciada e motivo da origem. Os 262 bloqueados são o total de oito
fotografias, não o inventário a transportar em um único dia.

POSTs exigem ADMIN, contexto explícito, versão atual, ciclo associado e folha
EM_PREPARACAO. A janela é 03:00 inclusivo até 18:30 exclusivo, inclusive
verificação após escritas para rollback quando a requisição cruza o limite.
GET não inicializa, recupera ou finaliza. Falha C4 não usa legado como fallback.

## Classificação

- **BLOQUEADOR operacional, quando há lacuna:** aceitar e conferir o início
  vazio antes de liberar a operação. Continuidade automática dos bloqueados
  de 08/10 não existe e não pode ser inventada sem decisão de negócio.
- **BLOQUEADOR condicional:** estrutura parcial, destino ocupado, schema
  incompatível ou erro persistente de bootstrap. Não tentar sanear história.
  Nenhum defeito técnico bloqueador reproduzido nos testes locais.
- **IMPORTANTE:** `/health` informa disponibilidade HTTP, não conclusão do
  bootstrap. Exigir contexto C4 com ciclo/preparação válidos e logs de sucesso.
- **IMPORTANTE:** flag é ambiente da API. Um processo iniciado desabilitado
  não instala o timer; alterar arquivo de ambiente exige recriar o container.
  Não misturar réplicas com flags diferentes nem manter clientes com contexto
  antigo. Requisições antigas podem ser recusadas até recarregar o contexto.
- **IMPORTANTE:** inicialização copia itens e estados com chamadas sequenciais
  dentro de transação interativa sem timeout explícito. Avaliar duração e
  contenção na homologação equivalente; requestTimeout do adapter não define
  o orçamento global da transação. Falhas provocam rollback e retry em 60 s.
- **IMPORTANTE:** concorrência depende de transações Serializable, locks e
  índices reais. Mocks não certificam concorrência, permissões ou desempenho
  SQL Server. Preparações antigas abertas exigem análise do responsável.
- **MELHORIA:** integrar readiness C4, métricas/alertas do scheduler e chamar
  a função de parada no encerramento gracioso da API.

## Ubuntu e Docker

O scheduler roda dentro do processo Node; não depende de cron do Ubuntu.
A imagem usa Node 20 Alpine, e datas civis usam Intl com timezone explícito,
independentemente do TZ America/Sao_Paulo do Compose. Exige relógio correto,
suporte ICU ao timezone, API viva e conectividade com SQL Server. Restart
unless-stopped recupera somente o dia atual. O Compose não tem healthcheck
C4 nem gate de readiness. Não foi executado Docker nem teste no Ubuntu.

## Sequência futura de ativação (não executada)

1. Escolher D e horário com margem entre 03:00 e 18:30; suspender temporariamente
   gravações operacionais VCG e avisar os usuários. Confirmar relógio/NTP,
   backup restaurável e responsável pelo abortamento da ativação.
2. Em homologação equivalente, validar imagem Node 20, timezone, permissões,
   estrutura/índices, duração do bootstrap e concorrência. Não executar migration
   nem seed como parte da inicialização. Revisar as alterações locais antes de
   produzir a imagem que será usada; manter a imagem anterior identificada.
3. Pelo responsável, conferir histórico intacto, existência/status da folha D,
   ausência de ciclo D e destino D+1 ou associação válida se for retomada.
   Caso não exista origem D válida, aprovar recuperação vazia e providenciar
   inventário atual por fluxo autorizado. Não copiar nem alterar folha histórica.
4. Configurar futuramente CI_NOVO_FLUXO_GARAGENS=VCG apenas na API. Recriar
   todas as instâncias da API com configuração consistente; docker compose
   restart sozinho não recarrega o ambiente do container.
5. Observar logs do bootstrap e consultar GET autenticado
   /api/c4/contexto?garagem=VCG&data=D. Não liberar apenas por /health verde.
   Conferir mode=C4, garages somente VCG, ciclo D, preparação D+1 associada,
   origem/status esperados, mutable=true dentro da janela e VCM desabilitada.
6. Se origem for 08/10, exigir 77 itens copiados e 28 bloqueados, chaves e
   campos preservados, estados sem execução/liberação. Se RECUPERACAO, exigir
   zero itens/estados iniciais e nenhuma criação nos dias perdidos; conferir e
   cadastrar o inventário atual autorizado antes de operar. Histórico permanece
   com oito folhas/595 itens/262 bloqueados e os mesmos conteúdos, contando
   somente o intervalo histórico de 01 a 08/10.
7. Recarregar clientes, inclusive PWA, e conferir contexto. Liberar uso ADMIN
   após aprovação operacional. Acompanhar 18:30: D+1 FINALIZADA, mutações
   recusadas. Acompanhar próximo 03:00: novo ciclo e preparação, continuidade
   dos bloqueados da folha finalizada D+1 e ausência de duplicação.

## Abortamento e rollback

Falha persistente, destino parcial, contagens inesperadas, histórico divergente,
inventário não conferido ou origem diferente da aprovada impedem liberar uso.
Suspender gravações, preservar logs e diagnosticar; não excluir ciclos/folhas
nem executar reparo automático. Uma transação falha não deve deixar meia carga;
uma transação já concluída deve ser preservada.

O responsável pode desabilitar futuramente a flag e recriar todas as APIs para
parar novos jobs. Isso não desfaz dados C4 já confirmados. Flag desligada volta
as telas ao legado, cujo estado não é sincronizado automaticamente com C4:
não liberar gravação no legado como se fosse rollback transparente. Antes de
qualquer retomada, escolher formalmente a fonte operacional. Restauração de
backup, se necessária, exige procedimento separado e avaliação de todas as
gravações posteriores. Nenhuma dessas ações foi executada nesta auditoria.

## Evidência local

Testes em memória incluem cópia integral dos manifestos de 07/10 e 08/10, recuperação
com lacuna após 18:30 e recusa de destino FINALIZADA, além das proteções
existentes de fronteira temporal, rollback, versões e isolamento VCG/VCM.
Manifesto SQL foi somente lido como texto; não foi executado. Não foram
alterados serviços, banco, flags ou histórico importado. O teste de flag
ausente/vazia usa persistência que lança erro se acessada: bootstrap e scheduler
devem encerrar sem consultas nem escritas. Alterações de ambiente nos testes
são temporárias, no processo local, e restauradas em finally.

Revisão para versionamento em 08/10: 104 testes locais passaram (C4 e legado),
npm run lint e npm run build passaram. Vite avisou sobre bundle acima de 500 kB.
Execução local em Node 26; a imagem de produção usa Node 20 e exige homologação
própria. Conferência estática dos SQL: 77 linhas idênticas nos dois manifestos,
77 chaves determinísticas conferidas, grupos 6/29/10/4/28 e SHA256 da planilha
compatíveis. Importador grava somente folha_ci/item_folha_ci; validação usa
consultas de leitura. A referência NVARCHAR compara seu tamanho com
DATALENGTH(N'CI-08-10-2026.xlsx'), 36 bytes, sem contagem manual.
Nenhum SQL foi executado nesta revisão. importes/ não possui arquivos rastreados
e não foi staged. Não houve commit, push, merge, deploy ou alteração de flag.

## Deploy com C4 desativado, separado da ativação

O deploy do código e a ativação operacional são etapas distintas. Com flag
ausente/vazia, enabledGarages retorna []; startC4Scheduler não instala timer
nem executa bootstrap. GET /api/c4/contexto autenticado retorna mode=LEGADO
e garages=[] antes de consultar tabelas C4. CI e manutenção usam o caminho
legado para VCG/contexto ausente; VCM não passa a aceitar mutações por isso.
Não há sincronização automática das fotografias importadas para o legado.

Dockerfile da API executa prisma generate (geração do cliente) e build,
sem migration, db push ou seed; CMD inicia somente Node. Scripts SQL são
artefatos manuais e não fazem parte do startup. Mesmo desativado, o código
novo muda artefatos da API e web: validar login, permissões, CI/manutenção
legadas e cache/PWA em homologação e após o deploy. A flag inválida pode
lançar erro; confirmar apenas a chave pertinente, sem imprimir segredos.

Riscos importantes: Dockerfiles usam npm install sem lockfile no contexto
por workspace; builds podem resolver dependências distintas. Registrar imagem
efetiva, testar imagem em homologação e preservar imagens anteriores de API
e web para rollback. Testes locais não certificam Docker/Ubuntu, SQL Server,
concorrência ou permissões reais. Comparar também todo o diff entre main
5f144b3 e o commit de release: estes dois commits complementam o código C4
já presente na branch e não representam sozinhos toda a mudança do deploy.

Procedimento futuro, sem executar nesta preparação:

1. No Ubuntu, registrar HEAD, branch, git status --short e lista de arquivos
   não rastreados, incluindo ignorados, sem divulgar conteúdos sensíveis.
   Fazer backup externo dos arquivos locais (.env, uploads e configurações)
   e registrar imagens/volumes/Compose atualmente utilizados.
2. Comparar os caminhos não rastreados com os arquivos rastreados da release.
   Não fazer pull/checkout sobre colisões, git clean ou reset destrutivo.
   Preferir checkout separado da release em diretório novo. Revisar configurações
   locais e vincular explicitamente uploads existentes; novo checkout não deve
   apontar silenciosamente para pasta vazia ou criar segundo stack concorrente.
   Manter identidade/projeto Compose, portas e mounts aprovados.
3. Após aprovação dos dois commits e integração/release por processo separado,
   selecionar SHA imutável. Revisar diff completo, gerar imagens testadas e
   registrar tags/digests. Garantir flag ausente/vazia na configuração efetiva
   das APIs. Não executar migrations, SQL nem importador já concluído.
4. Implantar API e web compatíveis na janela aprovada, recriando containers com
   configuração revisada. Conferir saúde HTTP, login, GET contexto LEGADO,
   fluxo legado com usuário autorizado e ausência de START/jobs C4. Saúde HTTP
   sozinha não certifica funcionamento legado. Não ativar C4 nesta etapa.
5. Em falha de smoke test, suspender gravações e restaurar imagens anteriores
   com configuração/mounts preservados e flag desativada. Não desfazer histórico
   nem apagar arquivos locais. Avaliar escritas posteriores antes de restauração
   de dados; rollback de imagem não é rollback de banco.
6. Encerrar deploy desativado somente com smoke tests aprovados, uploads
   preservados e nenhum evento C4. Agendar ativação em procedimento separado
   seguindo a sequência acima e a decisão sobre origem D/recuperação vazia.

## Dois commits propostos (ainda não executados)

- feat(data): adiciona importação histórica da CI de 08/10
  — scripts/sql/data-001c4-importacao-historico-2026-10-08.sql e
  scripts/sql/data-001c4-validacao-historico-2026-10-08.sql.
- test(docs): documenta e valida ativação controlada do C4
  — apps/api/tests/c4Flow.test.ts e este documento.

Usar staging por caminhos exatos somente após aprovação. importes/ permanece
fora dos dois commits; não usar git add . ou git add -A. Cabeçalhos dos SQL
mantêm a condição de candidato não executado por esta ferramenta; execução e
validação reais em produção são o relato do responsável registrado acima.
