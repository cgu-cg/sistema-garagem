# Escala de Carros manual

Regra confirmada em 23/10/2026, substituindo a edicao somente da escala de hoje.

## Operacao

Quando a CI correspondente ainda nao estiver finalizada, tabela e cards ficam
desfocados e indisponiveis para clique/foco, com aviso central explicando a
pendencia e a referencia provisoria, quando houver. Esse aviso substitui o
card superior de estado enquanto a CI esta pendente. Seletores permanecem
acessiveis; apos finalizar a CI, o controle manual de iniciar/editar/finalizar
reaparece. Registros legados mantem a consulta existente. Trata-se de uma
apresentacao da restricao existente; as validacoes do backend nao mudam.

Antes da CI da data ser iniciada, a consulta usa exclusivamente os bloqueados
da ultima CI finalizada anterior da mesma garagem. Esses carros ficam fora da
reserva e a tela identifica a data da referencia provisoria. Pedidos, reforcos e
demais itens da CI anterior nao sao herdados. Se nao houver nenhuma CI anterior
finalizada, a consulta informa indisponibilidade dos bloqueios, sem presumir
reserva livre. Ao iniciar a CI da data, seus dados passam a valer mesmo enquanto
ela estiver em preparacao; uma CI iniciada vazia nao recorre a anterior.

Essa referencia provisoria nao autoriza iniciar nem editar a Escala: continua
exigindo a CI da mesma data finalizada. Escalas ja finalizadas preservam a
fotografia salva. Consulta e troca de referencia nao gravam nem copiam dados.

1. Finalizar a CI da data que sera preparada (CI de 24/10 para Escala de 24/10).
2. Selecionar essa data na Escala e clicar em **Iniciar Escala**.
3. Escolher carros, substituicoes e confirmar linhas; salvar alteracoes dos cards.
4. Clicar em **Finalizar Escala**. O molde permanece nos JSONs; operacao por data
   e estado ficam no banco, na estrutura existente.

A tela inicia em amanha. Pode consultar qualquer data. Iniciar, editar e reabrir
exigem data futura. Escala finalizada permite reabrir somente se a escala do dia
seguinte ainda nao foi iniciada na mesma garagem, inclusive em outro tipo/turno.
Chegando a data da escala, conteudo e reabertura ficam indisponiveis. Uma pendencia
pode ser finalizada depois da virada, sem alterar linhas ou cards.

O inicio nao e automatico e nao depende de finalizar a escala anterior. Ele limpa
substituicoes e confirmacoes, sem copiar operacao de outras datas. Cards de lista
comecam vazios; posicoes fixas dos demais cards permanecem com prefixo vazio.
Se a CI for reaberta, os comandos da escala aguardam nova finalizacao da CI.
Os detalhes da CI exibidos em escala finalizada sao a fotografia de sua finalizacao.
Finalizacao da CI e mudancas de estado da Escala invalidam as consultas abertas
pelo canal realtime existente. Rascunhos em edicao nao sao sobrescritos; o backend
continua revalidando todas as condicoes ao salvar.

## Persistencia e compatibilidade

### Destino do carro retirado - 27/10/2026

Selecionar um substituto abre um popup com **Colocar carro na reserva** ou
**Bloquear carro**, e motivo obrigatorio (ate 1000 caracteres). Digitacao manual
abre o mesmo popup ao confirmar. O carro mostrado e o efetivo anterior da linha:
o fixo na primeira troca ou o substituto atual em uma troca seguinte. Confirmar
sem mudar de carro nao exige motivo; linha sem carro anterior nao destina um
prefixo inexistente. Cancelar restaura o valor salvo, sem gravar a troca.

Salvar grava substituicao, confirmacao, destino e motivo na mesma transacao e
revisao. Reserva continua derivada da frota livre; Bloquear inclui o retirado em
**Bloqueados Portaria**, impedindo sua reutilizacao. Nao libera nem modifica CI
ou manutencao. Bloqueado pela CI nao pode ir para reserva; o popup desabilita
essa escolha e o backend tambem recusa. Carro ainda ocupado em outra linha/card
nao e movido automaticamente. Conflito ou falha mantem o formulario para revisao.

O JSON existente em escala_diaria recebe historicoTrocas opcional, com prefixo
retirado, substituto, linha, destino, motivo, usuarioId e registradoEm obtidos
no servidor. Finalizar/reabrir preserva esse historico. Registros anteriores
continuam legiveis sem criar motivos ficticios. O motivo mais recente do carro
pode ser consultado nos cards de reserva e Portaria. Sem alteracao de schema,
migration ou escrita operacional para validacao.

Novos registros em escala_diaria usam conteudo version 3, com itens, cards,
confirmacoes e fluxo (status, iniciadaEm, finalizadaEm e fonteCI). CI usa a mesma
data. Antes de existir registro, GET retorna revisao 0 e Iniciar recebe essa
revisao como base. O inicio grava e retorna revisao 1; cada alteracao seguinte
incrementa. Revisao nao representa preenchimento nem finalizacao da escala.
Isso atende ao CHECK revisao>=1 do SQL Server (correcao de 26/10/2026).
Iniciar repetidamente nao sobrescreve registros: revisao antiga gera conflito
e um comando com revisao atual tambem recusa uma escala ja iniciada.

Arrays antigos e conteudo version 2 continuam legiveis. Recebem o estado de tela
LEGADO e mantem a referencia antiga da CI (dia seguinte), somente para consulta.
Nao sao apagados, reinterpretados como novas escalas ou reiniciados automaticamente.
Se houver um registro antigo numa data futura, a aplicacao o preserva; eventual
conversao exige decisao operacional separada. Nenhuma migracao foi executada.

API GET/POST /escala-carros/diaria permanece. POST de ciclo recebe contexto,
revisao e operacao iniciar/finalizar/reabrir. Gravacoes de linha e card exigem
EM_PREPARACAO e CI finalizada. Backend revalida data antes do commit, permissao
apos adquirir transacao e revisao antes da mutacao. Locks CI e escala ordenados
serializam reabertura da origem e inicio da proxima. Nao ha jobs nem escrita em GET.

## Verificacao local

Testes usam transacoes e frota simuladas sem rede/banco: inicio limpo, CI da mesma
data, ausencia de CI, revisao obsoleta, bloqueios/duplicidade de carro, finalizacao,
reabertura, virada, proxima iniciada, rollback, permissao e consulta legada.
