# Contencao emergencial de solturas e escala compartilhada

> Soltura atualizada em 23/10/2026: CI e Escala finalizadas da mesma data,
> despacho apenas na data atual e sem horario minimo de 03h. Programacao
> por linha/tabela e historico integrado conforme
> [SOLTURA-POR-DATA.md](SOLTURA-POR-DATA.md), que prevalece sobre o fluxo
> historico de Soltura abaixo. CI/Escala mantem seus contratos manuais.

> Atualizacao de 23/10/2026: novas Escalas tem ciclo manual e usam CI finalizada
> da mesma data, com preparacao somente futura. Registros anteriores ficam em
> consulta. [ESCALA-MANUAL.md](ESCALA-MANUAL.md) prevalece sobre regras antigas.

> Atualizacao de 21/10/2026: o molde VCG agora vem dos JSONs convertidos dos
> Excel, inclusive na Soltura e nas datas anteriores. Consulte
> [MOLDES-ESCALA-SOLTURA.md](MOLDES-ESCALA-SOLTURA.md) para o contrato atual.

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
Contexto permanente preserva os seletores existentes: garagem, tipo da escala
e turno; substituicoes diarias ficam separadas em EscalaDiaria, descrita abaixo.
Nao ha migracao automatica de dados locais.
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
Sem provisionamento, a consulta oficial retorna 503. Conforme decisao de
14/10/2026, a interface exibe a programacao fixa somente para consulta, com
aviso e gravacoes/liberacoes bloqueadas. Nao apresenta a base como confirmacao
de que nao ha substituicoes oficiais.

## Escala de Carros com base fixa em JSON ? 14/10/2026

Escopo refinado pelo usuario: nesta etapa somente Escala de Carros. Soltura e
Alterar Folha serao revisadas depois; a substituicao diaria nao e aplicada
nessas telas nesta entrega. Nao registra despacho nem altera disponibilidade C4.

A programacao vem de apps/web/src/data/escala-carros/ (selecionada por scheduleTemplates.ts): linha, tabela, saida,
chegada e carro original sao somente leitura. A base foi extraida dos oito
contextos existentes, preservando valores e identificadores. Carro Substituido
fica em coluna separada com Salvar. Limpar ou informar o carro fixo remove a
substituicao. Horarios nao sao editaveis nesta tela.

A API possui a mesma base em apps/api/src/data/escala-carros/ (copias dos mesmos JSONs) para validar
viagens/contexts, sem confiar na programacao enviada pelo cliente. As duas
copias sao necessarias aos contextos Docker independentes atuais; testes
verificam igualdade integral. Futuras revisoes da base devem atualizar ambas
explicitamente. O comando compara a linha fixa local com a versao do servidor
para recusar JSON divergente com 409, sem armazenar a linha original no banco.

GET/POST /api/escala-carros/diaria consultam/escrevem apenas EscalaDiaria,
independente de EscalaCarros/ItemEscalaCarros e de publicacao permanente.
Conteudo guarda substituicoes e alocacoes dos cards, junto dos metadados
de data, contexto, autor e revisao do cabecalho. Nao copia as linhas fixas para o banco.
A data e um filtro explicito: D+1 nao herda D e selecionar D recupera suas
substituicoes. Nao exige job diario nem exclusao de registros antigos.

## Cards, frota e bloqueios da Escala - complemento de 14/10/2026

Escala de 14/10 consulta somente a CI 15/10 da mesma garagem. Nao agrega
bloqueados de todas as folhas. So categoria BLOQUEADO nao liberada participa;
Oficina/Preventiva/Reforco nao foram convertidos em bloqueio. A lista e
intersectada com a frota oficial da garagem, sem inferir garagem por prefixo
ou consorciada. A consulta da frota reutiliza queryVeiculosSelect e exige
source=real. Garagem nula e omitida com diagnostico de contagem; garagem
desconhecida/inconsistente, resposta invalida, mock ou CI ausente impedem gravar.

O carro efetivo de cada linha e o substituto salvo, ou o fixo na ausencia
de substituto. So o efetivo ocupa a linha. Fixo continua visivel e fica
vermelho/com alerta se bloqueado, fora da frota ou usado em outro lugar.
Fixo bloqueado exige substituto livre ao confirmar. Fixo substituido pode
ser usado em card se estiver livre e nao bloqueado. Restaurar o fixo nao pode
duplicar uma alocacao existente. Todos esses controles sao garantidos na API.

Azul/Vermelho/Micro, Portaria, Terminais, Rabicho e Pedidos sao alocacoes
oficiais compartilhadas por data. Reserva e derivada, sem botao de inclusao:
frota menos ocupacoes efetivas e bloqueios CI/Portaria. Padroes ficam em
apps/api/src/data/escalaCards.json; padroes nao pertencentes a frota, bloqueados,
duplicados ou em linhas nao sao aplicados, com aviso de contagem na interface.
Marcadores compostos dos padroes (ex. dois prefixos unidos) nao sao inferidos
como veiculos. Cache anterior de cards no localStorage nao e importado nem
apagado. Alocacoes oficiais ja salvas nao sao removidas por nova mudanca de
bloqueio/frota: ficam sinalizadas para correcao, sem perda de historico.

Payload persistido version=2 contem itens/cards. Arrays anteriores de
substituicoes continuam legiveis e sao preservados ao salvar no formato novo.
Confirmacao visual da linha adiciona confirmacoes opcionais (id e prefixo
efetivo) ao mesmo payload. POST de linha so as registra depois de validar
frota, bloqueios e ocupacoes; rollback/409 nao registra a nova confirmacao.
GET projeta confirmadas apenas enquanto o carro confirmado coincide com o
efetivo e continua valido. Linhas sem substituto tambem podem ser confirmadas.
Registros anteriores sem esse campo permanecem pendentes ate confirmacao
explicita, sem escrita/backfill via GET. Interface usa apenas fundo verde,
sem texto de status e com uma marca de certo no botao; ao digitar remove o destaque.
Nao altera o status de despacho/liberacao. Sem DDL ou migration adicional.
GET nao cria/corrige registros. Nenhuma migration/tabela nova e necessaria
para este complemento: usa a coluna conteudo existente de escala_diaria.
O usuario informou PROVISIONAMENTO_CONCLUIDO para essa tabela; o agente nao
executou o script nem acessou o banco. Nao repetir provisionamento.

Gravacoes consultam novamente a frota e validam a CI dentro da transacao.
Adquirem lockC4Context (ciclo D/folha D+1) antes do lock da escala diaria,
sem modificar C4, suas revisoes, estados, locks ou transacoes existentes.
Revisao diaria e compartilhada por alteracoes de linhas/cards; conflitos
retornam 409 sem repetir POST. Remover alocacao permite corrigir um carro
que ficou bloqueado depois de salvo. Uma confirmacao valida a programacao;
nao registra despacho nem libera carro no Controle/CI.

Historico dos cards/substituicoes e por data. A frota usada pela Reserva e a
frota atual do legado, nao um snapshot historico de garagem fisica. Atualizar
entre postos continua por abertura/foco/recarga, sem novo evento Socket.IO.
Formulario aberto e rascunhos suspendem recarga por foco; filtros de busca
preservam rascunhos de linhas. Trocar contexto ou confirmar descarte em
recarga manual troca explicitamente o editor.

Autenticacao e leitura por garagem foram preservadas. Conforme autorizacao
operacional de 14/10/2026, escrita diaria e permitida para ADMIN ou perfil
Soltura da propria garagem, revalidada dentro da transacao Serializable.
Publicacao permanente continua exclusiva de ADMIN. Range lock no
contexto diario protege a primeira gravacao e a revisao evita sobrescrever
outro posto. Datas/prefixos invalidos, viagens desconhecidas e tentativas de
alterar linha/tabela/horarios/carro fixo sao recusadas pelo backend.
HTTP 409 nao repete POST automaticamente. Registros malformados/desconhecidos
nao sao descartados silenciosamente para apresentar lista vazia.

Sem consulta oficial das substituicoes, o JSON permanece visivel com aviso e
edicao bloqueada. Respostas substituidas sao descartadas por contexto/sequencia.
Rascunhos suspendem recarga por foco; recarga manual exige confirmar descarte.
Atualizacao entre postos ocorre ao abrir, voltar ao foco ou recarregar, sem
novo evento Socket.IO. A mudanca explicita de data/garagem/turno troca o editor.

scripts/sql/escala-diaria-provisionamento.sql e candidato NAO EXECUTADO pelo
agente. Agora cria apenas escala_diaria, SEM exigir tabelas permanentes. Mantem
precheck @Aplicar=0, identificacao explicita de servidor/banco e recusa destino
existente. Nao apaga/substitui estruturas nem dados. Registros da proposta
anterior, se alguem os tiver criado, precisam de revisao: nao ha conversao
silenciosa do formato antigo com original/alteracoes.

Validacao manual pendente, apos provisionamento autorizado em ambiente isolado:
1. Conferir as linhas fixas mesmo com API indisponivel, sem campos fixos editaveis.
2. Salvar um substituto em D; atualizar a pagina e conferir original preservado.
3. Selecionar D+1: nenhuma substituicao de D; retornar a D: recuperacao dos dados.
4. Limpar substituto e salvar: carro fixo intacto e substituicao removida.
5. Dois postos gravam sobre a mesma revisao: segundo recebe 409 sem apagar digitacao.
6. Falha de consulta bloqueia salvar; recuperacao habilita apos consulta oficial.
7. Conferir isolamento de garagem/turno e que Soltura/Alterar Folha nao foram alteradas.
8. Com perfil Soltura VCG, verificar que nao ha seletor VCM e que a API recusa
   contexto adulterado para VCM. Confirmar que a frota do seletor e fisica VCG.
9. Na Escala 14/10, conferir que bloqueados vem da CI 15/10; um fixo bloqueado
   permanece vermelho e sua confirmacao exige substituto livre.
10. Testar inclusao de bloqueado e duplicado em cada card, terminal e Rabicho;
    servidor deve recusar, mesmo com payload manual.
11. Substituir um fixo livre, conferir sua entrada na Reserva e aloca-lo em
    outro card; tentar restaurar o fixo na linha deve ser recusado por duplicidade.
12. Salvar cards em uma data, conferir compartilhamento em outro posto e
    ausencia dessas alocacoes na data seguinte. Conferir conflitos linha/card.
Esses passos de navegador e o DDL nao foram executados pelo agente.

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
