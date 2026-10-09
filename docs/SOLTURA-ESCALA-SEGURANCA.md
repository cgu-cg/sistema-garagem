# Contencao emergencial de solturas e escala compartilhada

## Integração da consolidação

Consolidado sobre fb6eb69 em 09/10/2026. C4 preserva abertura às 03h,
fechamento às 20h e permissões ADMIN/manutencao VCG. A Soltura não herda a
janela de edição da CI: continua sujeita às fontes e restrições abaixo.
Código integrado sem publicação, consulta ao banco ou certificação operacional.

Consulta da Escala e gravação de Soltura também verificam a garagem do usuário
no backend. Respostas de Escala anteriores à publicação são descartadas;
resposta de Soltura de outro contexto não é aplicada na tela selecionada.

## Estado da entrega

ATUAL/OBSERVADO: VCG em C4 usa a FolhaCI FINALIZADA da dataOperacao
explicitamente pedida (hoje ou amanha), junto do EstadoManutencao do Ciclo
NORMAL da data civil atual. A API nao escolhe a fonte por flags do payload.
Na tarde/noite D, solicitar D+1 consulta D+1. Na madrugada seguinte a CI
continua sendo D+1; antes das 03:00 a autorizacao e recusada porque nao ha
regra comprovada para transportar manutencao do ciclo anterior.

CI EM_PREPARACAO pode ser consultada, mas retorna 409 para soltura. Ciclo
ou folha ausentes/RECUPERACAO, origem recuperada na linhagem, manutencao
inconsistente ou divergente da CI D+1, BLOQUEADO na CI ou
bloqueado/emExecucao no Controle recusam a gravacao. OFICINA, PREVENTIVA e
REFORCO nao foram convertidos em bloqueio. Nao se exige constar na escala.
VCM permanece recusada. Com flag ausente/vazia, legado permanece recusado:
CiBloqueio.dataBloqueio e ManutencaoCarro.data sao registros planos sem
FolhaCI/Ciclo persistidos que certifiquem finalizacao e manutencao inicializada.

Os escritores C4 saveC4/startCycle/finalizeCycle e a soltura utilizam a mesma
funcao lockC4Context, que trava ciclo D e folha D+1 em ordem identica com
UPDLOCK/HOLDLOCK, dentro de transacao Serializable. CI D FINALIZADA e imutavel;
sua leitura e a verificacao de linhagem ate a importacao oficial permanecem na
mesma transacao. Toda verificacao precede as escritas;
lote grava inteiro ou faz rollback. Data e modo sao reavaliados apos espera
pelos locks e antes de sair da transacao. Scheduler participa do protocolo.
O legado nao participa deste protocolo e nao foi habilitado para soltura.
Esta garantia exige todos os processos executarem a versao revisada e a mesma
configuracao; escritores externos/SQL manual nao sao certificados por testes.

Falha de consulta/escrita retorna 409. Falha de comunicacao no COMMIT pode
ter resultado indeterminado: consultar historico oficial antes de repetir,
sem afirmar rollback confirmado apenas pelo erro HTTP.

## Frontend

Gravacoes de despacho aguardam a API antes de alterar estado/cache, consumir
reservas ou mostrar sucesso. Erros conservam os dados para correcao. Carro
Realizado consulta bloqueios como aviso adicional e nunca substitui a API.
O preenchimento automatico agora prepara somente o proximo rascunho; nao
libera um lote nem inventa motoristas. Codigo informado sem nome conhecido
permanece sem nome ficticio.

Cache local de manutencao nao sobrepoe bloqueio da CI. Removida a referencia
fixa de 09/09 desse criterio. Ausencia de bloqueio no aviso visual NAO confirma
disponibilidade; a tela informa as condicoes exigidas pela API. Autorizacao sobre CI em
preparacao e manutencao anterior na madrugada permanecem pendentes.

## Escala compartilhada

Modelos proprios `EscalaCarros` e `ItemEscalaCarros`, separados de despachos.
Contexto recorrente preserva os seletores existentes: garagem, tipo da escala
e turno; nao foi criado calendario diario nem migracao de dados locais.
Itens guardam somente programacao validada por Zod, em NVARCHAR(MAX), sem
depender de funcoes JSON posteriores ao SQL Server 2012.
Preservam marcadores existentes (4220R/2711R) e repeticao de carro em viagens
distintas; apenas identificadores de item precisam ser unicos. Isso nao
autoriza usar marcador como prefixo nem libera veiculo na portaria.

GET `/api/escala-carros` e somente leitura. POST requer ADMIN, revisao base e
transacao Serializable com bloqueio de intervalo na chave unica do contexto.
Conflito de revisao/deadlock retorna 409; falha de banco retorna 503.
Cabecalho e itens sao publicados atomicamente. Recarregar e revisar o conflito;
nao existe sobrescrita automatica. Atualizacao entre postos ocorre ao abrir,
voltar o foco da janela ou solicitar recarga, nao em tempo real.

Uma escala inexistente retorna vazia, revisao zero. ADMIN pode revisar e
publicar explicitamente a programacao padrao; nenhum localStorage e importado.
Publicar escala nao e confirmar disponibilidade do carro para soltura.

## Banco e liberacao

`scripts/sql/escala-carros-provisionamento.sql` e candidato revisavel, NAO
EXECUTADO. Cria apenas as duas novas tabelas; recusa destinos existentes.
Nao modifica CI, manutencao, historicos importados ou tabelas legadas.
Nao executar `prisma migrate`, `db push` ou provisionamento automaticamente.
Sem provisionamento, a escala fica indisponivel (503), sem fallback local.

NAO LIBERAR producao sem verificacao controlada. Antes da liberacao:

1. Confirmar manutencao da madrugada e autorizacao sobre CI em preparacao;
   VCM e legado continuam suspensos.
2. Testar concorrencia real no SQL Server com todos os escritores, atualizacao
   simultanea, finalizacao do scheduler, virada de data e lote atomico.
3. Revisar/aprovar provisionamento, backup e permissao das novas tabelas.
4. Testar dois postos: publicacao compartilhada, conflito 409, erro de rede,
   preservacao do formulario e ausencia de falso sucesso.
5. Testar bloqueio e manutencao impeditiva nos dois POST, legado e C4,
   incluindo tentativa de adulterar flags no payload.

Rollback de aplicacao deve preservar as tabelas/dados. Voltar a versao antiga
reabre os endpoints inseguros: manter as rotas de escrita suspensas ate haver
protecao validada. Nao excluir dados nem alterar a flag C4 como rollback.

Testes locais usam persistencia simulada e rede bloqueada. Eles nao comprovam
provisionamento, locks concorrentes reais no SQL Server ou operacao no Ubuntu.
