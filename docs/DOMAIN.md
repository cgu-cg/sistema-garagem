# Domain model e entendimento operacional atual

## Enter na folha de Soltura — 04/11/2026

Com carro e MOTO preenchidos, Enter confirma a viagem. Somente apos sucesso
da gravacao e dos avisos obrigatorios, o foco fica no botao da linha confirmada.
Um novo Enter leva ao Carro da proxima linha pendente da mesma tabela exibida,
rolando a lista quando necessario e pulando confirmadas e suspensas. Na ultima
linha nao retorna ao inicio. Erro ou cancelamento nao avanca; manter Enter
pressionado nao confirma nem pula linhas por repeticao automatica da tecla.

## Separadores no relatorio de Soltura — 04/11/2026

O relatorio impresso exibe as secoes do vespertino (observacoes salvas na
viagem), Motoristas VCM que saem da VCG e Especial Fretamento. Os titulos
acompanham as viagens e se repetem na continuacao de coluna/pagina, ocupando
espaco na paginacao A4. Usa somente os metadados recebidos da fotografia ou
da folha consultada; nao consulta moldes atuais para completar historicos.
Fotografias finalizadas nao sao alteradas. Historicos sem esses metadados
continuam sem separadores inferidos.

## Carro e motorista repetidos na mesma Soltura — 04/11/2026

CONFIRMADO pelo usuário: o mesmo carro realizado e/ou MOTO pode ser usado em
outras linhas da mesma Soltura. Ao salvar, inclusive trocar carro/motorista ou
gravar lote, o popup central informa as linhas/tabelas que compartilham o dado
e exige Sim ou Não. Cancelar não grava. A API calcula os conflitos na transação
e exige a confirmação correspondente; mudança concorrente dos conflitos exige
novo aviso. A anuência registra operador, instante e conflitos na auditoria JSON
da folha. A repetição não altera regras de CI, Portaria, pendências, permissões,
datas ou folhas finalizadas. A Escala de Carros não recebe esta exceção.

Ao trocar um carro que continua em outra linha da mesma folha, a troca permanece
no histórico sem gerar uma retirada ativa para Substituídos. Quando a última
linha deixa de utilizá-lo, volta a valer a tratativa normal da retirada.
Não há mudança de schema nem execução de SQL.

## Reserva da Soltura por folha — 04/11/2026

CONFIRMADO pelo usuário: atribuições de carros e retornos para Reserva pertencem
à própria Soltura (garagem, data, tipo e turno). Carros realizados em outra
folha não reduzem sua Reserva, e retornos de outra folha não ampliam a lista.
A gravação exige confirmação para repetição dentro da folha selecionada,
conforme a atualização acima.
Permanecem os bloqueios e retiradas pendentes aplicáveis à mesma garagem/data,
a confirmação explícita para uso de bloqueados CI e as reservas de terminal.
Solturas vinculadas continuam partindo da disponibilidade da Escala de origem;
o vespertino independente parte da frota da garagem. Sem alteração de schema.

Correção da tratativa: enviar a Reserva (inclusive desbloquear Portaria) verifica
uso realizado somente na própria garagem/data/tipo/turno. Registros PENDENTE,
que já foram limpos, não constituem uso ativo. Uso real na mesma folha continua
impedindo o retorno e a mensagem identifica as linhas e tabelas envolvidas.
Isso não remove bloqueios CI nem outras retiradas ou bloqueios independentes.

## Uso confirmado de carro bloqueado na CI — 04/11/2026

CONFIRMADO pelo usuário: Escala de Carros e Soltura podem atribuir um carro
bloqueado na CI mediante confirmação explícita no popup central. Isso substitui
a recusa absoluta anterior somente para bloqueio CI. Portaria, defeitos da
Soltura, pendências de tratamento, duplicidade, frota, permissões, datas e estados
das folhas continuam sendo validados. A CI não é liberada ou modificada: seu
card conserva o carro e o triângulo vermelho permanece nos prefixos em uso.
Reservas e tratamentos de desbloqueio não ganham autorização para ignorar CI.

A API exige confirmarBloqueadoCI com o prefixo exato da atribuição. A permissão
fica vinculada à linha, prefixo e data CI, com operador e instante do servidor.
Na Escala fica na confirmação da linha; na Soltura, nos usosBloqueadosCI do
JSON da folha. A auditoria existente registra USO_BLOQUEADO_CI. Trocar, limpar,
suspender ou reativar remove a permissão daquela atribuição; alterar somente
o motorista do mesmo despacho pode reutilizar a permissão existente. Se o carro
deixar de estar bloqueado ao salvar, não é mantida uma permissão desnecessária.
Confirmar no popup sem salvar não altera dados e não modifica a CI.

O frontend solicita a confirmação ao digitar/selecionar um bloqueado conhecido,
ou ao confirmar o fixo/programado bloqueado. Cancelar não grava a atribuição.
A anuência temporária é descartada após salvar ou mudar o contexto. A API
reconsulta o bloqueio na transação e recusa prefixo diferente do confirmado.
Lotes exigem confirmação individual dos bloqueados e são atômicos. Não há
autorização para alterar folhas finalizadas ou ampliar a janela de edição.

O vespertino continua sem exigir CI finalizada, origem CI certificada ou
Escala. Ao despachar consulta bloqueios CI existentes da mesma data: se houver
bloqueio, também exige confirmação; ausência da folha CI não impede despacho.
Falha de consulta não é tratada como ausência de bloqueios. A frota independente
continua sem herdar alocações da Escala; os triângulos CI são observacionais.

Persistência nos campos JSON existentes, sem tabela, coluna ou execução de SQL.

## Cards da Soltura por folha e programado riscado — 04/11/2026

CONFIRMADO: Substituídos e Bloqueados Portaria aparecem somente na folha de
origem, identificada por garagem, data, tipo de escala e turno. A consulta
filtra garagem/data no banco e tipo/turno na projeção dos cards. Um registro
matutino não aparece no card vespertino. Registros antigos sem tipo/turno
comprovados não são atribuídos a uma folha por suposição. O histórico salvo
não é movido, apagado ou reclassificado. A Escala já isola seus cards pelos
quatro campos do contexto e mantém esse comportamento.

A separação visual não libera carros: bloqueios e retiradas pendentes da
mesma garagem/data continuam participando da validação de disponibilidade,
inclusive entre turnos. O relatório novo usa os bloqueios da própria folha;
fotografias antigas finalizadas continuam intactas.

Na tabela da Folha de Soltura, o programado recebe risco horizontal quando
a viagem está liberada e o realizado difere dele. A cor da frota e os avisos
são mantidos. Programado igual ao realizado ou linha pendente fica sem risco.
Os campos existentes atendem à alteração, sem mudança de schema ou SQL.

## Tratativas de carros na Soltura — 04/11/2026

CONFIRMADO pelo usuário: o programado é o carro inicial. Confirmar somente
motorista usa esse carro sem retirada. Informar outro realizado envia o
programado para Substituídos. Trocas seguintes retiram o realizado anterior.
No vespertino independente, sem programado, o primeiro carro não gera retirada.
O motivo deixa de ser solicitado ao trocar: o operador escolhe depois, no card,
Reserva ou Bloqueados Portaria (motivo/defeito obrigatório). O card Defeito
Garagem é substituído por Bloqueados Portaria. O histórico permanece acessível.

Novas retiradas usam o JSON historicoTrocas existente, com origem SOLTURA e
destino PENDENTE, RESERVA, BLOQUEAR ou DESFEITO. Tratativas e desfazimentos
registram operador, instante e destino anterior. Eventos antigos de Defeito
Garagem permanecem bloqueados e identificados como registros anteriores;
não há conversão, exclusão ou desbloqueio automático. Comandos antigos que
enviam motivo continuam compatíveis. Não foi alterado o schema nem executado SQL.

Pendências e bloqueios são consultados por garagem/data e impedem novas
atribuições e a criação de reserva terminal, inclusive entre turnos. Apenas
eventos da própria folha em andamento podem receber tratativa. Desde o ajuste
de isolamento acima, eventos de outro turno não aparecem nos cards. A finalização exige tratar todas as retiradas
da própria folha, além de liberar ou suspender as viagens. Suspender não desfaz
retiradas anteriores: elas continuam exigindo tratamento. Folhas finalizadas
não são editadas por esses comandos. ADMIN conserva a edição explícita de
folhas anteriores em andamento; demais perfis continuam na data corrente.

Desbloquear exige frota oficial, ausência de uso em despachos, de outro bloqueio
ou pendência, de bloqueio CI e, quando vinculada, de bloqueio/pendência na Escala.
Nenhum comando remove bloqueios da CI ou altera a Escala de origem. A consulta
da CI para desbloqueio não transforma o vespertino em operação vinculada à CI.
Uma devolução não assegura disponibilidade se houver outra viagem programada
ou reserva terminal: a Reserva continua sendo calculada pela ocupação efetiva.

Limpar dados deixa a linha sem realizado/MOTO e sem liberação, conserva o
programado como referência e desfaz a sequência de retiradas novas daquela
linha. Eventos permanecem com destino DESFEITO, fora dos cards ativos. Bloqueios
antigos/independentes permanecem. Se algum carro necessário estiver em uso em
outro despacho ou em reserva terminal, a operação inteira é recusada. Permissões,
revisão da folha e token do registro são revalidados na transação, com rollback
de despacho e folha juntos. Escritores da Soltura e reservas de terminal usam
o mesmo bloqueio por garagem/data para serializar essas decisões.

## Limpar Escala restaura o fixo ? 04/11/2026

CONFIRMADO: Limpar dados retira o substituto e a confirma??o, restaura o fixo
na linha e desfaz seu destino ligado ? troca dessa linha. O fixo deixa a Reserva
autom?tica por voltar a ocupar a linha. Substitu?dos exige o identificador exato
da retirada; Bloqueados Portaria exige posi??o com o mesmo identificador da troca.
Novos bloqueios gerados por troca usam esse v?nculo; bloqueios antigos sem prova
ou independentes e todos os bloqueios CI s?o preservados. Isso n?o libera um
carro bloqueado para confirma??o. Se o fixo estiver em outro local, a limpeza
? recusada integralmente. Hist?rico permanece intacto e o desfazimento ?
registrado na auditoria existente com usu?rio, instante e posi??es removidas.
Valem as permiss?es e janela atuais, sem alterar folhas finalizadas ou a Soltura.
Suspender/reativar continuam deixando a linha sem carro. Sem SQL novo.
O card Substitu?dos e seu contador cruzam o hist?rico PENDENTE com as posi??es
atuais pelo identificador e prefixo. Uma retirada limpa permanece no hist?rico,
mas n?o aparece como pend?ncia nem oferece tratamento novamente.


## Devolver carro fixo da Reserva a Substituídos — 04/11/2026

O menu da linha da Escala oferece Devolver carro fixo a Substituídos quando
o fixo está disponível na Reserva e sua última retirada nessa linha teve
destino Reserva. A confirmação envia somente esse fixo para tratamento
pendente, sem limpar/confirmar a linha nem mudar seu substituto atual.
Aplica-se também após limpar e preencher a linha novamente.

A API exige revisão e molde atuais, permissão de edição e a janela normal
da Escala (até 06h do dia da operação). Não reabre nem modifica Escala
finalizada. Recusa carro fora da frota, bloqueado na CI/Portaria, já atribuído
a qualquer linha/card ou sem retirada anterior para Reserva. Não remove
bloqueios nem retira automaticamente carros de outros locais.

É criado um novo registro PENDENTE e uma posição em Substituídos; a retirada
e o tratamento anteriores ficam intactos. Se a linha estiver vazia, o novo
tratamento conserva a referência de substituto da retirada anterior, sem
atribuir esse carro à linha. Com substituto atual, usa essa referência atual.
A auditoria no JSON existente registra DEVOLVER_FIXO_SUBSTITUIDOS, retirada
de origem, novo identificador pendente, usuário e instante. O operador volta
a escolher Reserva ou Bloqueados Portaria pelo tratamento já existente.
Persistência atômica na folha diária, sem nova tabela/coluna ou SQL.

## Edição administrativa de Soltura anterior em andamento — 04/11/2026

CONFIRMADO pelo usuário: ADMIN pode editar Soltura já iniciada e ainda não
finalizada, inclusive de dias anteriores. Na consulta da data anterior, o botão
Editar Soltura habilita explicitamente os controles; Encerrar edição volta à
consulta. A escolha é local e reinicia ao mudar data/contexto ou perfil.
Correções incluem carro/MOTO, limpar dados, suspender/reativar e preencher
viagens pendentes, mantendo linhas e horários do molde operacional existente.
Após resolver as pendências, ADMIN também pode finalizar essa folha anterior.

A API revalida o perfil atual dentro da transação e exige a folha real em
EM_ANDAMENTO. Não permite iniciar/reabrir folha antiga nem editar finalizadas,
datas futuras ou registros legados sem folha iniciada. Demais perfis continuam
limitados ao dia atual. VCG, CI/Escala da data quando exigidas, frota, bloqueios,
motivos de troca e atomicidade mantêm suas validações. A Escala de Carros e seu
limite de 06h não foram alterados.

Na correção administrativa anterior, usuário e instante reais da alteração,
estado anterior da viagem/despacho e operação EDICAO_ADMIN_HISTORICA ficam
auditados no JSON existente (`limpezas`); a data operacional permanece a da
folha. Limpar/suspender/reativar preserva a auditoria já existente; finalizar
gera a fotografia e o evento normais. Não modifica outras datas ou folhas
finalizadas. Sem SQL, nova tabela ou migração. Publicar API e frontend juntos.

## Releitura após limpar linha da Soltura — 03/11/2026

A validação do cliente distingue o molde de Tráfego da fotografia operacional:
aceita a flag `suspensa` na programação retornada pela Soltura, preserva seu
valor nos itens e continua recusando campos de molde desconhecidos. Um registro
de despacho `PENDENTE`, inclusive recebido de uma API anterior ou cache, não
é projetado como liberado e não bloqueia a viagem como confirmação existente.

Limpar/suspender/reativar valida todo o JSON resultante antes de persistir o
despacho e a folha na mesma transação. A releitura de conteúdo inválido informa
os caminhos dos campos que falharam, sem expor valores nem apagar metadados ou
histórico. Erro de conteúdo persistido não é apresentado como erro de contexto.
Publicar API e frontend juntos; não há normalização destrutiva ou SQL automático.

## Uso pela Portaria no Controle de Manutenção — 03/11/2026

CONFIRMADO pelo usuário: a ação Usado Portaria marca o veículo que está em
Em Manutenção, preservando o defeito e o estado. A tela mostra um badge índigo
Usado Portaria ao lado do defeito, também nas consultas posteriores e no
relatório da tela. A marca acompanha o registro nas alterações normais.

Perfil `soltura` da própria garagem e ADMIN podem executar a marcação pela
ação específica `USADO_PORTARIA`. O backend aceita somente acrescentar a marca
a um único carro em manutenção, com revisão válida; recusa alterar defeitos,
estados, identificação, lista de carros ou desfazer a marca nesse comando.
Portaria não ganha autorização de escrita geral no Controle nem na CI.
Editar Defeito e o clique na célula de defeito permanecem disponíveis somente
para quem já pode editar Manutenção (ADMIN/Manutenção conforme regras atuais).

Mantêm-se o dia atual, janela 03h–20h de America/Campo_Grande, isolamento por
garagem, conflitos e idempotência. A fila offline guarda a ação e o badge;
sincronização e descarte de pendências antigas seguem as regras existentes.
Campo JSON opcional `usadoPortaria`, sem nova tabela/coluna, SQL ou migração.
Publicar API e frontend juntos; clientes antigos não preservam essa marca.

## Limpar dados e suspender viagens — 03/11/2026

CONFIRMADO pelo usuário: o menu vertical de três pontos nas linhas da Escala
de Carros e da Soltura oferece Limpar dados e Suspender linha. Suspensão é
por viagem da folha operacional; não exclui a linha nem modifica o modelo.
As ações exigem confirmação, revisão atual, permissão e folha aberta, dentro
dos limites de data/horário já existentes. Folhas finalizadas permanecem
protegidas; eventual reabertura segue as regras anteriores.

Limpar na Escala grava uma atribuição explicitamente vazia e retira a
confirmação, mantendo o carro fixo apenas como referência. Limpar na Soltura
retira realizado, vínculo do veículo, MOTO e horário de liberação; o registro
existente fica pendente e pode ser preenchido novamente. Não apaga registros
nem históricos de trocas/bloqueios. O estado anterior, usuário e instante
ficam auditados no JSON da própria folha, na coleção `limpezas`.

Suspender também retira a atribuição/confirmação e, na Soltura, o MOTO. A linha
fica vermelha, identificada como Suspensa e sem permitir confirmação/despacho.
Ela conta como resolvida para a finalização, sem contar como saída liberada.
O menu passa a oferecer Reativar linha: volta a ficar pendente e vazia, sem
restaurar automaticamente dados retirados. A finalização da Soltura exige
viagens liberadas com carro e motorista ou explicitamente suspensas.
Relatórios e fotografias finalizados preservam a suspensão. Não há propagação
automática de uma suspensão da Escala para uma viagem da Soltura.

Persistência usa campos JSON opcionais (`suspensa` nos itens operacionais) e
campos anuláveis existentes; sem DDL, alteração de Prisma ou migração de dados.
Publicar API e frontend em conjunto. Nenhum SQL foi executado pelo agente.

## Seleção inicial do turno da Soltura — 03/11/2026

No contexto Seg–Sex, abrir a Folha de Soltura a partir das 12h de
America/Campo_Grande sugere Vespertino; antes disso, Matutino. A sugestão
também é aplicada ao mudar a data ou o tipo de dia na Folha. O seletor manual
continua disponível e sua escolha permanece enquanto esses dados não mudarem.
Não troca automaticamente uma folha já aberta ao chegar meio-dia. Sábado e
Dom/Fer mantêm o turno PADRÃO, sem novo turno ou alteração de programação.
Trata-se de seleção na interface: não inicia, finaliza ou modifica folhas.

## Atualização dos vínculos e edição de linhas confirmadas — 03/11/2026

CONFIRMADO pelo usuário: CI corrigida deve ser refletida na Escala em
preparação; Escala corrigida deve atualizar os carros vinculados da Soltura
em andamento. Não alterar automaticamente viagens liberadas/substituídas
nem folhas finalizadas. Esta decisão substitui o congelamento integral dos
carros programados na Soltura iniciada descrito nas entradas anteriores.

Escala em preparação já projeta os bloqueios/avisos atuais da CI, sem escrita
em GET; correções na CI podem invalidar a confirmação de um carro bloqueado.
Escala finalizada mantém sua fonte CI fotografada. Correções operacionais
continuam exigindo reabertura/finalização e respeitando permissões e horários.

Novas folhas de Soltura guardam `escalaVinculadaIds` no JSON, com as viagens
que herdavam carro da Escala ao iniciar. A política não é recalculada a partir
de modelos posteriormente editados. Ao finalizar novamente a Escala corrigida,
consultas da Soltura aberta reavaliam somente esses carros pendentes, pela
linha/tabela da fotografia original. Linhas, horários, realizados e motoristas
não são copiados da origem. Sem correspondência única, o programado fica vazio.
Carros explícitos do modelo e vespertino permanecem independentes.

Despacho revalida a programação dentro da transação e recusa cliente com
programado divergente no vínculo pendente. Se necessário, persiste o novo
conteúdo da folha e incrementa sua revisão junto do despacho, com rollback
integral em caso de erro. GET não grava. Relatório em andamento usa a projeção;
relatório e folha finalizados mantêm sua fotografia. Folhas anteriores sem
`escalaVinculadaIds` conservam o comportamento congelado, pois não há informação
segura para reconstruir quais carros eram herdados. Não há migração automática.

O lápis ao lado do ✓ na Escala inicia uma edição local do carro, cancelável,
sem apagar a confirmação oficial antes de salvar. Na Soltura, o lápis oferece
as correções manuais existentes de carro/motorista; não desfaz a liberação.
Correção de carro mantém motivo/histórico obrigatórios. Folhas finalizadas e
datas sem permissão não habilitam esses controles; backend continua validando.

Validação: 146 testes locais passaram em Escala diária, programação de
Tráfego/Soltura, atualização de vínculos, disponibilidade e ciclo da Soltura,
incluindo validação do cliente. Persistência simulada e rede bloqueada.
Builds da API/frontend e typecheck passaram. Componentes React reais no
navegador validaram editar/cancelar/confirmar na Escala, corrigir MOTO pelo
menu da Soltura e ocultar edição em consulta. Sem acesso ao banco ou produção.

## Escala de Carros até as 06h — 03/11/2026

CONFIRMADO pelo usuário: a Escala de D, preparada em D-1, continua podendo
ser iniciada, editada ou reaberta durante D antes das 06:00 em
America/Campo_Grande. Às 06:00 esses comandos ficam indisponíveis para D.
Datas anteriores continuam em consulta; finalizar pendência permanece permitido.
Esta regra substitui o limite da meia-noite descrito nos registros anteriores.
Permissões, revisão, CI finalizada, reabertura explícita e impedimento de
reabrir após iniciar a próxima Escala permanecem obrigatórios no backend.

Ao entrar na Escala de Carros, a data sugerida é hoje antes das 06h e amanhã
a partir das 06h. A tela aberta acompanha essa passagem quando está na data
sugerida e sem rascunho/gravação pendente. Uma data histórica escolhida
manualmente não é trocada. Rascunhos não são descartados automaticamente;
o backend recusa gravar após o limite, inclusive se a transação atravessá-lo.
A mudança de data seleciona o tipo de dia pelo calendário existente.
Não há finalização automática, cópia ou exclusão de folhas na virada.
Fotografias de viagens liberadas e relatórios finalizados não são atualizados
pelas edições posteriores da Escala. Pendentes vinculadas em folha aberta
seguem a regra de atualização acima. A data civil da CI e Soltura não muda.

## Soltura vinculada à Escala — 03/11/2026

CONFIRMADO pelo usuário: Soltura vinculada mantém suas próprias linhas e
horários e busca todos os carros na Escala finalizada da mesma data, garagem
e contexto de tipo de dia, por linha e tabela. Usa substitutos quando definidos;
sem correspondência única, não atribui carro programado. A opção é explícita no
editor da Soltura matutina/PADRÃO; vespertino mantém operação independente.
Persistência `origemCarros: "ESCALA"` no conteúdo JSON da programação/modelo,
incluindo suas versões de vigência, sem nova tabela ou coluna. Sem essa opção,
mantém-se o comportamento anterior. Exceções por data continuam prioritárias;
o vínculo não cria automaticamente uma exceção de Soltura nem copia linhas.
Folhas finalizadas e viagens liberadas conservam os carros registrados.
Nas folhas abertas, pendentes vinculadas seguem a atualização descrita acima.

## Vigência histórica dos modelos — 03/11/2026

CONFIRMADO pelo usuário: editar Escala ou Soltura recorrente vale a partir
da data da gravação (America/Campo_Grande), sem alterar datas anteriores ou
folhas já iniciadas/finalizadas. `trafego_modelo_versao` preserva revisões;
consultas sem folha escolhem a última revisão vigente na data selecionada.
Exceção por data continua prioritária. Fotografias operacionais prevalecem.
Versões antigas já sobrescritas não são recuperáveis; não reconstruir folhas
com o presente. Implantação e limites em
`proposals/TRAFEGO-VIGENCIA-HISTORICA.md`. SQL apenas preparado, não executado.

## Portaria: recorrência e edição direta — 03/11/2026

CONFIRMADO pelo usuário: os cards abrem diretamente o editor de linhas e
funcionamento. Modelos recorrentes Seg–Sex, Sábado e Dom/Fer são editáveis
no banco (`trafego_modelo`); uma exceção por data tem prioridade sobre eles.
Sem exceção/modelo salvo, usam-se os padrões JSON. Fotografia operacional
iniciada permanece preservada, inclusive na consulta de disponibilidade.
Exceção ainda não utilizada pode mudar de data no mesmo cadastro, com revisão
e proteção contra colisões e operação iniciada na origem/destino. Detalhes
em `proposals/PORTARIA-MODELOS-RECORRENTES.md`. Substitui a limitação anterior
do editor somente a exceções; não introduz calendário de feriados.

## Exceções de Tráfego por data — 02/11/2026

CONFIRMADO pelo usuário: Escalas e Solturas especiais valem para uma data
específica, sem substituir padrões recorrentes; criação e edição por ADMIN
e perfil Soltura. O editor permite copiar uma base ou começar vazio e editar
campos/adicionar viagens. A API preserva o isolamento de garagem e as folhas
já iniciadas. Implementação e limites em `proposals/TRAFEGO-PROGRAMACAO.md`.

## Controle de Manutencao independente e offline - 30/10/2026

Decisao confirmada pelo usuario: o Controle continua neste sistema, com
Bloqueados, Em Manutencao e Liberados persistidos na folha propria
`controle_manutencao_folha`, sem sincronizar estados ou observacoes com a CI.
Esta decisao substitui a sincronizacao bidirecional descrita nas entradas
historicas abaixo. A CI conserva suas fotografias e seu ciclo. A Soltura
matutina/PADRAO considera os bloqueios da CI, sem consultar estados de
manutencao; requisitos de CI/Escala, frota e defeitos proprios permanecem.

Atualizacao confirmada: na mudanca de data civil America/Campo_Grande,
somente Bloqueados permanecem. Em Manutencao e Liberados comecam vazios.
Nao se transportam os demais carros nem se inclui a frota automaticamente.
GET projeta a virada sem gravar, e o primeiro comando persiste a nova folha.
Datas intermediarias sem folha nao sao reconstruidas; folhas anteriores
permanecem consultaveis. Folha vazia salva impede ressuscitar carros excluidos.
Nao ha limpeza destrutiva de historico nem dependencia de scheduler/CI.

O cadastro de veiculos ja embarcado no frontend fornece o seletor offline;
a consulta oficial pode atualizar essa lista e a garagem. Sem folha local do
dia, o app inicia vazio, ou com somente bloqueados da ultima folha confirmada
em cache. Essa projecao e identificada como copia local, sem autoridade sobre
o banco. Conflitos de revisao e frota continuam verificados ao sincronizar.
O PWA e a sessao ainda precisam ter sido disponibilizados no aparelho.
Alteracoes
e fila sao gravadas juntas no IndexedDB, com identificador idempotente por
comando, sem guardar credenciais. Reconexao com a tela aberta ou nova entrada
sincroniza na sessao de origem. Revisao, perfil, garagem, frota, exclusividade
dos estados e confirmacao de liberacao de bloqueado sao revalidados na API.
Conflitos do mesmo dia e sessao revogada preservam a fila para revisao.
Por decisao explicita do usuario, pendencias locais de dias anteriores sao
descartadas automaticamente na proxima entrada/consulta, sem envio para a API
e sem apagar registros ja salvos no banco. O colaborador deve sincronizar no
Wi-Fi no mesmo dia, dentro da janela de manutencao. A tela informa o descarte.

Permissoes existentes preservadas: ADMIN; perfil manutencao vinculado a VCG.
Edicao no dia da operacao, 03:00 ate 20:00; historico somente consulta.
Arraste no desktop chama a mesma transicao dos menus; liberar bloqueado
continua exigindo confirmacao. Menus permanecem como alternativa ao arraste.
Detalhes e implantacao em `docs/CONTROLE-MANUTENCAO-INDEPENDENTE.md`.

## Ciclo explicito da Soltura e relatorio - 30/10/2026

Implementacao autorizada: Iniciar Soltura cria folha propria por garagem,
data, tipo de escala e turno. Despacho individual/lote exige EM_ANDAMENTO.
Finalizar exige todas as viagens do molde fotografado liberadas no banco,
com carro e motorista; contadores e flags do cliente nao autorizam a acao.
FINALIZADA bloqueia despachos; somente ADMIN reabre por comando auditado,
sem apagar os despachos existentes. Escrita permanece restrita a VCG e ao
dia da operacao; consultas e relatorios admitem outras datas. A independencia
do vespertino e os requisitos de CI/Escala do matutino/PADRAO permanecem.

A tabela independente soltura_folha guarda revisao, molde do inicio, eventos
com usuario/horario reais e fotografia do relatorio na finalizacao. A tabela
solturas continua guardando despachos. Inicio preserva despachos ja existentes;
GET nao cria folhas. Inicio/finalizacao/despachos compartilham locks e transacao.
Relatorio finalizado usa a fotografia salva, sem completar com dados atuais.
Historico anterior sem folha usa somente os despachos persistidos e identifica
a ausencia de fotografia de reservas/bloqueios, sem reconstruir esses dados.

Imprimir relatorio gera documento A4, duas colunas em SEG_SEX e tres no fim
de semana, com paginacao, programado/realizado (so realizado no vespertino),
motorista, horarios e dados auxiliares registrados. Inclui todas as viagens,
independentemente do filtro de busca. Dados administrativos/assinaturas das
fotos de referencia nao sao inventados. SQL para revisao em
docs/sql/2026-10-30-soltura-folha.sql; nao executado automaticamente.

## Soltura vespertina independente — confirmado em 29/10/2026

No contexto SEG_SEX / VESPERTINO, a Soltura nao depende de CI, Controle de
Manutencao ou Escala de Carros, nem consulta seus bloqueios ou programados.
Usa o molde vespertino para linha, tabela e horarios, e a frota oficial para
selecao do Carro Realizado, obrigatorio junto do motorista. Nao exige CI ou
Escala finalizada nem habilitacao do modulo CI. Matutino e PADRAO preservam
as regras anteriores. A restricao existente de escrita para VCG permanece.

Carro Programado e avisos de dependencia da CI nao aparecem no vespertino.
O card Bloqueados CI permanece visivel com consulta separada, informativa,
da garagem/data selecionadas. Falha nessa consulta e exibida no card sem
impedir a Soltura ou alterar sua validacao independente no backend. Novos
despachos vespertinos gravam programado nulo; historicos antigos nao sao
migrados, e o programado antigo nao serve de preenchimento automatico.
Permissoes, garagem, data operacional, molde, identidade do veiculo e
historico de troca continuam validados no backend. Defeitos registrados na
propria Soltura seguem impedindo reutilizacao na mesma garagem/data.
Nao altera schema nem registros existentes automaticamente.

## Atualizacao da Soltura e estabilidade visual - 27/10/2026

Recargas por foco e realtime sao agrupadas em 100 ms e executadas em serie.
Uma recarga explicita absorve eventos ainda agendados; invalidacao recebida
durante consulta exige uma leitura posterior. Trocar contexto cancela a fila
antiga. Nao usa cache para autorizar despacho e nao remove validacoes oficiais.

Durante consulta, a Soltura continua bloqueando gravacao, mas o carro realizado
mantem borda, tamanho e icones. Popup ja aberto preserva rascunho e permanece
visivel, com Salvar indisponivel ate a revalidacao terminar. Formularios e
cards de hover fechados nao sao montados. Correspondencia por linha/tabela
usa indice local por leitura, preservando a recusa de correspondencias ambiguas.

## Troca de carro e defeito na garagem na Soltura - 27/10/2026

Ao corrigir o carro de um despacho existente, escolher **Adicionado
equivocadamente** ou **Defeito Garagem**. Defeito exige descricao. Equivoco
devolve o carro retirado a reserva somente se nao estiver ocupado/bloqueado;
defeito exclui o prefixo da reserva e o mostra no card **DEFEITO GARAGEM**, logo
abaixo de Bloqueados CI. O bloqueio por defeito vale na mesma garagem/data,
inclusive em outro turno. Nao modifica CI, manutencao ou escala finalizada.
Nao cria liberacao automatica nem transporta esses registros para outras datas.

Troca e historico sao gravados na mesma transacao. O backend confirma o carro
anterior e registra usuario/horario reais, preservando historico anterior.
Historicos enviados pelo cliente nao substituem os oficiais. Dados antigos
sem descricao permanecem visiveis como registro anterior sem descricao.
Popup fecha somente com sucesso; falha mantem o rascunho.

Na Soltura, a troca por Defeito Garagem recebe triangulo azul e legenda propria,
sem fundo azul no botao do carro realizado. Avisos sao independentes: bloqueio
vermelho, pedido CI amarelo e defeito/substituicao azul aparecem lado a lado
quando coexistem. O azul da troca informa o motivo historico; nao bloqueia o
substituto que assumiu a linha. O carro retirado por defeito continua bloqueado.

Na confirmacao inicial, Carro Realizado pode ficar vazio se houver programado
oficial. O backend resolve o programado da escala/snapshot e grava esse prefixo
como realizado. Motorista permanece obrigatorio, com as mesmas verificacoes
de CI, manutencao, defeito, data e permissao. Sem programado, exige realizado.
Usa historicoTrocas existente em Soltura; nenhuma alteracao de schema.

## Destino de carro substituido na Escala - confirmado em 27/10/2026

Atualizacao confirmada em 30/10/2026: confirmar no botao da linha salva a
substituicao diretamente. O carro retirado fica PENDENTE no card Substituidos,
entre Reserva Garagem e Bloqueados CI, fora da reserva e das alocacoes ate
ser tratado. Na primeira troca, retira o fixo; nas seguintes, o substituto
anterior. Somente o numero na coluna Carro fixo fica riscado apos salvar.

Clicar no carro pendente abre o popup de destino. Reserva nao exige motivo
e oculta o campo; Bloquear exige Observacao / Defeito, digitado ou escolhido
nos atalhos (incluindo PNEU FURADO).
Reserva devolve a reserva automatica; Bloquear coloca em Bloqueados Portaria.
Bloqueados pela CI nao podem ir para reserva. Cancelar/falhar mantem pendente.
O comando de tratamento exige revisao atual e permissao ADMIN/Soltura da
garagem; pode ocorrer em preparacao ou finalizada, no futuro ou no dia da
operacao. Nao reabre a escala, nao altera linhas/confirmacoes/fonte CI e nao
modifica CI ou manutencao. Datas anteriores permitem consulta, sem tratamento.

Pendencia, destino e motivo ficam no JSON da escala_diaria, junto ao historico
de trocas. A criacao registra autor/horario da troca; tratar preserva esses
campos e registra tratadoPor/tratadoEm reais. Nao ha migration ou regravacao
automatica de registros antigos; pendencias continuam visiveis nas consultas
historicas. Historicos anteriores com destino ja informado permanecem validos.
Ver ESCALA-MANUAL.md.

## Cadastro de Reforco e Inspecao por popup - 26/10/2026

Os horarios do Reforco exibem somente dados salvos. O botao + de cada posicao
abre formulario de situacao (campo motivo), carro e observacao opcional.
Salvar exige situacao e prefixo, conforme validacao existente no backend.
Alteracao e retirada ocorrem pelo popup; cancelar descarta apenas o rascunho.

Inspecao possui um unico + no cabecalho, sem seletores ou confirmacoes por
linha. O popup mostra os carros atuais e permite adicionar/remover badges e
salvar o conjunto de ate seis carros em um unico snapshot. Impede novas
selecoes repetidas. Registros antigos adicionais nao sao truncados ao abrir,
copiar, consultar ou salvar outros setores; o popup pede ajuste explicito
para salvar conjuntos com mais de seis. Itens mantidos conservam identidade
e campos opcionais existentes; novos extras C4 nao recebem motivo/obs ficticios.

Rascunhos ficam locais ao popup, sem gravacao em localStorage ou cards.
Fechar com alteracoes pede descarte; salvar so fecha apos confirmacao da API.
Enquanto ha popup aberto, a protecao existente impede finalizar a CI com
edicao pendente. Contexto e snapshot da abertura sao preservados, incluindo
em recargas concorrentes; conflito ou falha mantem o formulario para revisao.
Permissoes, datas, avisos de coexistencia e relatorio oficial sao preservados.
Usa o sync existente, sem nova rota ou alteracao de banco.

## Regularizacao sequencial da CI - confirmado em 26/10/2026

ADMIN pode iniciar explicitamente a regularizacao de uma CI de hoje ou
anterior, ausente ou EM_PREPARACAO. Exige CI do dia imediatamente anterior
FINALIZADA e ausencia de folha seguinte iniciada na mesma garagem. Nao pula
datas, nao cria intermediarias automaticamente e nao ha job de finalizacao.
Esta excecao prevalece sobre as restricoes de edicao retroativa abaixo,
somente para folhas em regularizacao e somente para ADMIN.

Se ausente, copia integralmente a anterior, com novos IDs fisicos; se aberta,
preserva seus itens e o inicio original. Registra regularizacaoIniciadaEm,
regularizacaoIniciadaPorId e, ao finalizar, finalizadaPorId/finalizadaEm.
Usuarios e horarios reais sao obtidos no servidor; o usuario iniciador nao e
sobrescrito ao salvar/finalizar. A identificacao de regularizacao permanece
visivel depois da finalizacao. Campos novos sao opcionais para preservar
fotografias antigas, sem inventar autores ou datas para o legado.

Somente ADMIN pode editar ou finalizar uma folha em regularizacao. Os demais
usuarios mantem o fluxo normal, inclusive finalizar pendente nao regularizada
sem editar seu conteudo. CI finalizada de hoje/passada nao reabre, nem mesmo
para ADMIN. Revisoes, locks por garagem/data e transacoes continuam obrigatorios.

Regularizacao nao sincroniza/manipula manutencao de hoje ou historica, Escala
ou despachos existentes. A regra de BLOQUEADOS continua limitada a CI de amanha
e manutencao de hoje. Datas de bloqueio da regularizacao respeitam o limite
da folha original (dia anterior a data da CI), nunca o presente como fallback.
GET permanece somente leitura. Apos finalizar, a acao Proxima CI permite
seguir a sequencia ate voltar ao planejamento futuro normal.

Banco: script aditivo `scripts/sql/ci-regularizacao-provisionamento.sql`;
aplicar antes de subir o backend gerado com o novo schema Prisma. Nao usar
prisma migrate/db push e nao executar regularizacoes reais para testar.

## Reforco com horario - confirmado em 23/10/2026

Salvar uma inclusao ou alteracao nos horarios do Reforco exige prefixo e
motivo preenchidos; somente espacos nao atendem. Observacao continua opcional.
O botao fica desabilitado enquanto faltar um desses campos e o backend
revalida no fluxo C4 e no legado. Retirar carro continua pela acao explicita
do seletor, sem usar Salvar com prefixo vazio para excluir um registro.

Essa obrigatoriedade se aplica as posicoes FIXO (duas colunas de horarios)
e aos horarios identificados no legado. A coluna separada de servicos extras
mantem sua regra atual. Registros antigos incompletos sao preservados quando
inalterados, inclusive na copia/inicializacao e em salvamentos de outros
setores. Ao editar o horario, exige-se completar os campos. Isso complementa
as referencias historicas a motivo opcional, sem alterar schema ou historico.

## Soltura por data - confirmado em 23/10/2026

A Soltura de D exige CI e Escala de D finalizadas. Despacho somente em D,
sem horario minimo de 03h. Carro programado vem do substituto ou fixo da
Escala por linha e tabela; sem correspondencia unica fica vazio. Vespertino
seg-sex usa a Escala matutina de D. Pendentes acompanham a programacao;
despachos preservam o registro original. Historico fica na propria tela.
Contrato e limites em [SOLTURA-POR-DATA.md](SOLTURA-POR-DATA.md), prevalecendo
sobre referencias historicas a CI D+1/03h na Soltura. CI/Escala nao mudam.

## Escala de Carros manual - confirmado em 23/10/2026

Complemento: enquanto a CI da data nao existir, consultar os bloqueados da
ultima CI finalizada anterior da mesma garagem, identificando sua data como
referencia provisoria. Somente bloqueados, sem copiar pedidos/itens. A CI da
data iniciada passa a fornecer os dados, mesmo vazia. Isso nao libera comandos
sem CI correspondente finalizada nem altera fotografias de escalas finalizadas.
Se nenhuma origem estiver disponivel, nao presumir reserva livre: informar falha.

A Escala de D usa os bloqueios e pedidos da CI de D, substituindo a referencia
anterior D+1 para novas escalas. Finalizar a CI de 24/10 libera iniciar a
Escala de 24/10. Preparacao pode ocorrer em qualquer data futura, sem janela
de horario; iniciar, editar ou reabrir exige data maior que hoje em Campo Grande.
Finalizar pendencia continua permitido depois da virada, sem editar conteudo.

Iniciar e explicito: usa o molde JSON, com substituicoes e confirmacoes vazias
e cards sem carros atribuidos, preservando suas posicoes. Nao copia a escala
anterior. Finalizada so reabre antes de chegar sua data e enquanto nao existir
escala da mesma garagem no dia imediatamente seguinte, em qualquer tipo/turno.
Nao ha exigencia adicional de escala anterior finalizada para iniciar: a
condicao e a CI correspondente finalizada. CI reaberta suspende alteracoes
da escala ate nova finalizacao. Permissoes existentes sao preservadas.

Estado, horarios e fotografia de bloqueios/pedidos ficam no conteudo JSON
versionado da tabela escala_diaria; nao exige DDL, migrations ou jobs. Escritas
validam permissao, revisao, CI e data dentro da transacao com locks ordenados.
Consulta nao grava. Escala finalizada conserva fotografia da CI ate reabertura.
Registros anteriores, sem estado manual, permanecem para consulta com dados
e referencia CI anteriores, sem conversao, reset ou descarte automatico.
Procedimento e compatibilidade em docs/ESCALA-MANUAL.md.

## Cores dos prefixos na Escala - confirmado em 22/10/2026

Reserva Garagem exibe uma lista unica de carros, ordenada por prefixo, com
contadores por cor abaixo do titulo. O card de Bloqueados CI omite triangulos
individuais, preservando detalhes das ocorrencias. A legenda usa triangulos.
Linha sem carro fixo exibe traco sem alerta; confirmacao ainda exige carro valido.

Prefixos usam a cor do cache da frota, independentemente das ocorrencias CI.
Vermelho/Azul divide o prefixo apos os dois primeiros digitos. Prata usa cinza,
Micro/Executivo usa laranja e cores ausentes/Outro usam a cor padrao do texto.
Bloqueios e pedidos usam triangulo no canto superior direito, respectivamente
vermelho e amarelo, mantendo detalhes ao passar o mouse ou clicar e as mesmas
restricoes de uso. A API envia cores da frota completa da garagem, incluindo
carros ocupados, sem depender dos grupos de reserva. Nao altera banco/cache.

## Finalizacao de CI pendente apos a virada - confirmado em 22/10/2026

Uma CI existente em EM_PREPARACAO pode ser finalizada manualmente mesmo que
sua data seja hoje ou anterior. Isso altera somente o estado da folha e os
metadados da finalizacao; itens, titulo e manutencao nao sao modificados.
Permissoes por garagem, revisao e locks continuam obrigatorios. Iniciar,
reabrir e editar conteudo continuam restritos a datas futuras. Assim, uma
pendencia pode ser encerrada para liberar a preparacao da CI seguinte, sem
reabrir edicao do historico e sem criar folhas intermediarias automaticamente.

## Exclusao no Controle de Manutencao - decisao confirmada em 21/10/2026

Bloqueados, Em Manutencao e Liberados permitem excluir um ou varios carros
da folha atual, com confirmacao. Exclusao integral remove o estado sem criar
Liberado; nao cria restricao adicional para uso na Escala ou Soltura.
Ao excluir Bloqueados, retira tambem o BLOQUEADO correspondente da CI de
amanha, preservando os demais itens e historicos. Exige reabertura se essa
CI estiver finalizada. Permissoes, janela de manutencao e revisao permanecem.
Isso substitui a retirada anterior dos botoes de excluir e permite excluir
integralmente coexistencias antigas; uma retirada parcial de bloqueio continua
preservando execucao, salvo liberacao confirmada.

## Inclusao multipla de carros na CI - 21/10/2026

Os modais de inclusao de Preventivas, Setores da Oficina e Bloqueados por
Consorciada permitem selecionar varios carros, com badges removiveis antes
de salvar. O motivo/defeito e a data original do bloqueio informados no modal
valem para todos os selecionados. A inclusao envia uma unica alteracao da CI,
preservando validacoes de garagem, revisao, permissoes e duplicidade.
Carros presentes em outros locais continuam exigindo confirmacao de coexistencia.
Edicao de registros existentes e Reforco com Horario permanecem individuais.

## Moldes de Escala e Soltura VCG - decisao confirmada em 21/10/2026

Os JSONs separados por dia/turno passam a ser os moldes oficiais das telas,
conforme os sete Excel em exemplos/escala-carros/vcg e exemplos/solturas/vcg.
Na Soltura VCG, a programacao recorrente publicada anteriormente no banco
nao define mais o molde. Despachos, trocas e substituicoes continuam salvos
por data nas estruturas existentes; nenhum dado ou schema foi migrado.
Os novos moldes valem tambem para datas anteriores, por decisao do usuario.
SISEP e ESP.VCM sao incluidos com tabela vazia; horarios padronizados HH:mm;
a coluna garagem mantem seu mapeamento. VCM nao muda de programacao.
Viagens retiradas nao recebem IDs de outras viagens nem perdem seus registros.
Detalhes e fontes em [MOLDES-ESCALA-SOLTURA.md](MOLDES-ESCALA-SOLTURA.md).

## CI manual - regra vigente confirmada em 20/10/2026

Esta decisao substitui as janelas de 03h/20h, finalizacao automatica e limite
de planejamento somente para amanha descritos nas secoes historicas abaixo.
No C4, CI com data de hoje ou anterior e somente consulta; qualquer data futura
pode ser preparada, sem limite de horario, mas somente depois de finalizar
a CI do dia imediatamente anterior. Iniciar e um comando explicito e copia
integralmente os itens e o titulo da anterior, com novas identidades fisicas.
Nao cria folhas intermediarias nem recuperacao vazia quando a origem falta.

Finalizar CI e manual. Uma CI finalizada futura pode ser reaberta e novamente
finalizada somente enquanto a CI seguinte nao existir. Iniciar a seguinte e
reabrir a origem compartilham locks ordenados, impedindo sucesso simultaneo.
Comandos exigem revisao oficial, permissao existente e garagem habilitada;
essas permissoes nao mudam. Falha ou cancelamento preservam os registros.

Somente CI de amanha sincroniza bloqueados com a manutencao de hoje. CIs mais
futuras nao alteram estados de manutencao. Ao chegar o dia correspondente,
GET pode projetar os bloqueados da CI vinculada sem gravar: o primeiro comando
materializa esses estados e a alteracao solicitada atomicamente. Estados
Em Manutencao/Liberado de dias anteriores nao sao herdados. A manutencao C4
continua limitada a hoje e preserva sua janela 03h-20h. Se a CI de amanha estiver
finalizada, alteracoes dos bloqueios (inclusive motivo/data) exigem reabertura;
alteracoes independentes de oficina/liberados continuam disponiveis.

Os agendadores C4 e de cores foram removidos em todos os ambientes.
A atualizacao de cores e somente manual pelo comando fleetColorRefresh.
C4_SCHEDULER_ENABLED e FLEET_COLORS_JOB_ENABLED nao sao mais utilizadas;
CI_NOVO_FLUXO_GARAGENS, SIGSIT_SQL_* e FLEET_COLORS_CACHE_PATH permanecem.
Nenhum GET cria/finaliza CI.
Nao houve alteracao de schema. finalizacaoPrevistaEm permanece preenchido
por compatibilidade com o CHECK legado, sem determinar prazo de finalizacao.
A escala de carros continua editavel somente hoje, conforme regra de 19/10.

## Escala de carros - edicao somente no dia atual (19/10/2026)

Substituicoes, confirmacoes e alocacoes nos cards da escala diaria somente
podem ser alteradas na data civil atual de America/Campo_Grande, inclusive
por ADMIN. Dias anteriores e posteriores continuam disponiveis para consulta.
A API verifica a data antes de carregar integracoes e novamente na transacao,
antes da gravacao. Esta regra nao acrescenta restricao de horario nem altera
a programacao fixa ou as regras temporais da CI.

## Controle de Manutencao - regra vigente confirmada em 19/10/2026

Esta decisao substitui a coexistencia BLOQUEADO + EM MANUTENCAO nas NOVAS
transicoes do Controle. Em Manutencao retira o carro dos Bloqueados do
Controle e da CI em preparacao correspondente na mesma transacao. O menu
Bloquear, disponivel em Em Manutencao e Liberados, move para somente
Bloqueados e sincroniza a CI; nao mantem execucao/liberado simultaneamente.
Inclusao de novo bloqueio pela CI tambem encerra execucao no Controle.
A regra vale para inclusao simples, lote e menus. Liberar bloqueado continua
exigindo confirmacao previa. Cancelamento/erro nao altera os destinos.
Ao adicionar carros bloqueados em Em Manutencao ou Liberados, o formulario
avisa sobre o bloqueio e exige confirmacao antes de salvar, inclusive em lote.
Cancelar preserva o bloqueio e os carros selecionados no formulario.
Os tres menus nao oferecem mais Remover/Excluir; Liberar Bloqueio continua
sendo uma acao explicita disponivel no quadro Bloqueados.
Estados antigos coexistentes e fotografias finalizadas nao sao reescritos
por GET ou por edicao de observacao. A API rejeita novas coexistencias,
mas permite consultar e transicionar registros anteriores para estado unico.
Permissoes, revisoes, locks e janela operacional permanecem obrigatorios.


## Seleção de veículos na CI VCG — confirmação operacional

Novas inclusões nos seletores da CI VCG apresentam somente veículos com
garagem cadastrada 2 (VCG), independentemente da consorciada, exceto no card
BLOQUEADOS VCM: somente nesse card, o seletor usa garagem cadastrada 1 (VCM),
preservando o contexto operacional VCG da folha. Garagem 1
corresponde a VCM. A restrição do seletor não filtra itens já salvos nem
reclassifica consorciadas, garagens ou históricos da folha.

Liberar (Baixa) um BLOQUEADO na CI, ou confirmar sua liberação no Controle,
retira o bloqueio da CI em preparação e do Controle do ciclo correspondente,
encerra eventual execução e marca LIBERADO no Controle, atomicamente.
Apagar/retirar bloqueio sem liberação continua preservando execução. A baixa
exige confirmação, revisões oficiais e mantém históricos finalizados intactos.

## Ajuste autorizado para inclusão no Controle de Manutenção

Por orientação explícita do usuário, novas inclusões pelo modal do Controle
preenchem consorciada pelo primeiro dígito: 1=VCM, 2=VSF, 3=JTU, 4=VCG.
Prefixos fora desses grupos são recusados na interface. Esta é uma exceção
local à orientação de não inferir consorciada abaixo: não altera registros
existentes, históricos, garagem física, contexto C4 ou o contrato do backend.
O grupo do prefixo não comprova sozinho a existência no cadastro da frota.

### Selecao multipla no Controle - ajuste de 14/10/2026

Os tres modais (Bloqueados, Em Manutencao e Liberados) consultam o cadastro
oficial e filtram pela garagem cadastrada do usuario: 2=VCG, 1=VCM. ADMIN sem
garagem cadastrada usa o contexto selecionado; TODAS exige escolher uma garagem.
A lista estatica e a classificacao por prefixo nao servem como fonte da garagem.
Selecionar na lista ou digitar o prefixo completo e pressionar Enter adiciona
um badge removivel; a insercao grava os selecionados em uma unica operacao.
A observacao informada se aplica aos carros incluidos. Registros ja no destino
nao sao alterados pelo lote. Liberar bloqueados exige confirmacao previa;
cancelar preserva todo o lote. Falha de consulta da frota impede novas inclusoes,
sem alterar registros existentes ou fotografias historicas.

## Consolidação em 09/10/2026 — precedência vigente

O C4 abre às 03:00 inclusivo e fecha às 20:00 exclusivo, em
America/Campo_Grande. A seleção inicial da CI usa hoje antes das 03h e
amanhã a partir das 03h; sua data é independente da Soltura e do Histórico.
ADMIN pode escrever nos contextos habilitados; manutencao vinculada
explicitamente a VCG pode escrever apenas VCG. Leituras C4 e de Escala e
gravações de Soltura verificam a garagem do usuário no backend; ADMIN pode
consultar todos os contextos. Publicação de Escala exige ADMIN.

As referências históricas abaixo a 18:30/ADMIN exclusivo foram substituídas
pelo [horário vigente](DATA-001-C4-HORARIO-20H.md) e pelas
[permissões vigentes](DATA-001-C4-PERMISSOES.md). O legado mantém 18:30.
As restrições recentes de Soltura estão em
[SOLTURA-ESCALA-SEGURANCA.md](SOLTURA-ESCALA-SEGURANCA.md).
A integração não certifica dados nem autoriza publicação; consulte o
[relatório da consolidação](CONSOLIDACAO-5173.md).

## DATA-001/C4 — Contrato operacional confirmado em 07/10/2026

Esta seção atualiza os baselines históricos A/C1/C3 abaixo. A implementação
local C4 é opt-in e ainda requer provisionamento, carga inicial e validação
operacional autorizados; este documento não afirma implantação no banco.

- Garagem da FolhaCI/CicloOperacional é contexto, não consorciada nem garagem
  física inferida pelo prefixo. Folha VCG admite VSF, VCG, JTU **e VCM** nos
  bloqueados, inclusive 3083/VCM e veículos fisicamente VCM. Não converter
  consorciada nem corrigir históricos silenciosamente. VCG/VCM continuam
  contextos separados; cópia somente dentro da mesma garagem.
- ItemFolhaCI exige consorciada VSF/VCG/JTU/VCM somente em BLOQUEADO.
  Nas demais categorias, ausência no documento é NULL; informação explicitamente
  conhecida pode ser preservada. Nunca inferir pelo prefixo, garagem física,
  garagem da folha ou participação do mesmo veículo em outra categoria.
  Os sete Excel oficiais de 01–07/10/2026 identificam consorciada explicitamente
  somente nos grupos BLOQUEADOS. Prefixo 23/Bilhetagem permanece "23", sem zeros
  adicionais e sem atribuir consorciada ausente.
- Campos opcionais ausentes permanecem NULL na consulta, cópia e persistência
  C4; não fabricar motivo, gravidade ALTA ou status BLOQUEADO. Motivo permanece
  nullable, inclusive em BLOQUEADO: os documentos não estabelecem obrigatoriedade
  universal desse campo e o contrato anterior aceitava ausência. Isso não
  flexibiliza consorciada/data obrigatórias dos bloqueados nem posições do reforço.
- Em `America/Campo_Grande`, todos os dias, às 03:00 inicia-se o ciclo D e
  copia-se integralmente a folha D finalizada para D+1 em EM_PREPARACAO.
  Novas PKs preservam chave lógica dos itens, categorias/subtipos/setores,
  horários, posição FIXO/EXTRA, datas/motivos e título da coluna adicional.
  Controle D inicia somente com bloqueados; execução/liberados ficam vazios.
- Mutações exigem ADMIN, contexto explícito, ciclo atual ligado à folha em
  preparação e janela `03:00:00 <= hora < 18:30:00`. Às 18:30, D+1 é
  FINALIZADA e imutável. Folha vazia possui identidade e estado persistidos.
- Bloqueios são sincronizados atomicamente apenas Controle D ↔ CI D+1 em
  preparação. Uma linha de EstadoManutencao por veículo/ciclo pode representar
  bloqueado e emExecucao simultaneamente. No máximo um BLOQUEADO por
  folha/prefixo; tentativa adicional é rejeitada, sem deduplicação.
  Remover bloqueio preserva execução. Liberação de bloqueado exige confirmação
  antes da chamada, retira bloqueio e execução e representa LIBERADO;
  cancelamento não grava. Nunca LIBERADO + BLOQUEADO.
- Oficina/preventiva/reforço/título EM MANUTENÇÃO da CI não são estado de
  execução e não sincronizam com o Controle. Observações de bloqueio e
  oficina são distintas. Título pode existir sem itens ou ser desconhecido
  (`NULL`); cache/default visual não deve inventá-lo.
- Reforço tem 12 posições FIXO (1..12), nos dois grupos do layout, e EXTRA
  com ordem inteira positiva. Identidade é tipo+ordem, nunca horário/prefixo.
- GET não cria/copia/finaliza/reconcilia/recupera/provisiona. Jobs idempotentes
  recuperam eventos vencidos do mesmo dia. Sem folha D finalizada, criam
  apenas estruturas atuais vazias RECUPERACAO; não fabricam dias anteriores.
- Histórico 01–07/10/2026 será importado por SQL manual revisado: cada Excel
  é fotografia independente FINALIZADA/IMPORTACAO, sem parser no runtime.
  Somente nessa carga, data de bloqueio ausente/inválida/posterior à folha
  recebe 01/10/2026 (3083, 3951 em 01/02 e 1322). Uso normal rejeita datas
  inválidas/futuras ao dia operacional D; bloqueio sincronizado é vigente
  no Controle D. Não utiliza esse fallback. Cópia preserva data original;
  carga histórica é validada contra a data de sua própria folha.

O seletor CI VCG consulta o endpoint existente de Veiculos, usando o valor
real `garagem = 1`, sem exclusão por prefixo VCM. Colunas observadas no código:
`idCarro`, `garagem`, `ativo`. Não existe coluna de consorciada comprovada
nessa consulta: o grupo de bloqueio escolhido é informado explicitamente e
a consorciada persistida permanece preservada. Consulta não altera Veiculos.

`CI_NOVO_FLUXO_GARAGENS` vazia mantém legado; `VCG` habilita só o piloto;
VCM exige configuração explícita. Com C4 habilitado, C4 é fonte de verdade,
sem fallback ou dupla escrita legada. A proteção física conservadora anterior
permanece apenas no MVP legado desativado para aquela garagem.

Este documento tem caráter de documentação de domínio e não substitui validação formal do processo pela operação, manutenção, portaria e responsável do negócio.

## 1. Objetivo e limites do sistema

### Status: ATUAL/OBSERVADO

O Sistema Garagem não pretende substituir o ERP existente.

O ERP continua sendo utilizado para processos como abertura e gestão de ordens de serviço de manutenção.

O Sistema Garagem pretende digitalizar e integrar processos operacionais que hoje dependem de Excel, controles manuais e consultas a sistemas existentes.

### Limites observados

- O sistema atua como apoio operacional para acompanhamento, liberação e organização do uso da frota.
- O ERP continua sendo a referência para gestão formal de manutenção e ordens de serviço.
- O Sistema Garagem não deve assumir, automaticamente, todas as responsabilidades do ERP.

### Conflito a validar

- A documentação técnica existente em código pode sugerir uma modelagem operacional mais rígida do que o processo observado em campo.
- O entendimento atual indica que parte do processo ainda depende de decisões humanas e de fontes fora do sistema.

## 2. Níveis de confiança da documentação

### CONFIRMADO

O termo "CONFIRMADO" deve ser reservado apenas para informações validadas formalmente pelo responsável do processo.

As regras da DATA-001A foram explicitamente confirmadas pelo usuário em 2026-10-05; DATA-001C1 e DATA-001C3 em 2026-10-06. Os demais conteúdos mantêm a classificação indicada. Confirmação operacional não significa implementação existente.

### ATUAL/OBSERVADO

É o nível principal usado neste documento.

Representa o entendimento atual do processo, obtido por experiência de uso, conversas com colaboradores e observação do comportamento do sistema.

### PLANEJADO

Representa comportamento ou módulo desejado para o futuro, ainda não formalmente validado.

## 3. Visão geral do fluxo operacional

### Status: ATUAL/OBSERVADO

A soltura é uma etapa final do processo operacional.

Antes dela, existe trabalho de manutenção e portaria.

A manutenção conversa com colaboradores da oficina e verifica:

- veículos que serão necessários para trabalho da oficina no próximo dia;
- veículos atualmente sendo trabalhados;
- veículos que poderão ser liberados;
- veículos que devem permanecer bloqueados/pendurados.

### Fluxo geral observado

1. a oficina e a manutenção avaliam a frota e os veículos em uso;
2. a portaria acompanha a situação operacional do pátio e dos veículos;
3. a escala de carros é montada considerando CI, manutenção, pátio e terminais;
4. a soltura do período atual e a preparação da programação do próximo período podem acontecer em paralelo;
5. a operação finaliza com a soltura dos veículos e a execução do serviço.

### Conflito a validar

- O código e os módulos observados podem apresentar uma lógica mais formal e estruturada do que o processo real do dia a dia.
- Há risco de que alguns termos utilizados em interfaces e relatórios estejam sendo usados com intenção operacional, mas sem correspondência 1:1 com o processo formalizado pela empresa.

## 4. Veículo/Carro

### Status: ATUAL/OBSERVADO

O termo "veículo" e o termo "carro" são usados de forma operacionalmente sobreposta no sistema.

No contexto de turno e soltura, o prefixo do veículo é a unidade mais importante para rastreio.

### Conceito operacional

Um veículo pode estar em um dos seguintes estados operacionais observados:

- em manutenção;
- liberado;
- bloqueado/pendurado;
- disponível para operação;
- indisponível por condição operacional.

### Importante

A disponibilidade de um veículo não deve ser tratada como um simples booleano.

A decisão operacional pode depender de:

- bloqueios na CI;
- situação no Controle de Manutenção;
- observação física do pátio;
- presença do veículo em garagem ou terminal;
- condição percebida/testada no momento da soltura.

### Ponto a validar

A regra definitiva de disponibilidade ainda precisa ser validada formalmente pela operação.

## 5. Linha

### Status: ATUAL/OBSERVADO

Uma linha possui várias tabelas.

As tabelas representam serviços/horários diferentes de uma mesma linha.

### Concepção operacional

- a linha representa a identidade do serviço;
- a tabela representa a variação operacional dentro dessa linha;
- a portaria usa esse conjunto para planejar e acompanhar a execução diária.

### Ponto a validar

Nem sempre o sistema pode tratar linha e tabela como entidades totalmente independentes do planejamento operacional real.

## 6. Tabela

### Status: ATUAL/OBSERVADO

A tabela é o serviço/horário associado a uma linha.

Ela define a execução específica prevista para um veículo e para um conjunto de condições operacionais.

### Uso observado

- a portaria monta a programação por tabela;
- a soltura usa a tabela como contexto da operação;
- o veículo programado e o veículo realizado podem ser distintos.

### Conflito a validar

Há risco de que, em alguns contextos, a tabela seja tratada como dado de escala e em outros como dado de operação interna.

## 7. Soltura

### Status: ATUAL/OBSERVADO

A soltura é uma das etapas finais do processo operacional.

Ela envolve a liberação do veículo para execução do serviço.

### Observações

- a portaria pode preparar programação do próximo período enquanto executa a soltura do período atual;
- diferentes veículos podem ser usados em comparação com o que foi programado;
- a soltura pode depender de condições externas, como presença física do veículo, situação de manutenção, condição do pátio e disponibilidade operacional.

### Ponto a validar

Ainda não foi formalmente validado qual conjunto exato de regras transforma um veículo em "liberado" para operação no processo completo.

## 8. Carro programado e realizado

### Status: ATUAL/OBSERVADO

Carro programado:

- é o veículo planejado pela portaria para executar determinada tabela/serviço.

Carro realizado:

- é o veículo que efetivamente executa a soltura/serviço.

### Exemplo conceitual

- carro programado: 1205;
- motorista vai buscar/testar o veículo;
- é identificado um problema;
- motorista retorna à portaria;
- outro veículo é designado;
- carro realizado: 1210.

### Observação importante

Este exemplo é conceitual e não deve ser transformado em dado real do sistema.

### Ponto a validar

A diferenciação formal entre carro programado e realizado ainda precisa ser conferida com a operação e com o comportamento real esperado em cada turno.

## 9. CI Manutenção

### Status: ATUAL/OBSERVADO

A CI contém, no entendimento atual:

- veículos pedidos pela oficina para o próximo dia;
- veículos bloqueados/pendurados.

### Observação

A CI é entendida como mecanismo de indicação de veículos que não devem ser liberados sem tratamento específico.

### Importante

Conforme a DATA-001C1, colocar um veículo em manutenção preserva seu bloqueio. BLOQUEADOS da manutenção do dia sincronizam com BLOQUEADOS da CI correspondente em preparação; liberação de veículo bloqueado exige confirmação antes de qualquer alteração, preservando CIs finalizadas.

### Conflito a validar

- O código e a interface podem sugerir a existência de integrações mais automáticas entre controle de manutenção e CI.
- O contrato confirmado na DATA-001A define coexistência e retirada explicitamente confirmada dirigida à preparação; a implementação ainda apresenta lacunas.

## 10. Controle de Manutenção

### Status: ATUAL/OBSERVADO

O Controle de Manutenção é usado para permitir que a portaria visualize a situação operacional dos veículos durante o dia.

Entre os estados/conceitos utilizados estão:

- em manutenção;
- liberado.

### Observação

O Controle de Manutenção pode consultar os veículos bloqueados na CI e existe necessidade de permitir retirada/desbloqueio quando aplicável.

### Importante

Conforme o contrato confirmado na DATA-001A, execução na oficina pode coexistir com bloqueio da CI. Liberação não deve retirar silenciosamente esse bloqueio; retirada confirmada deve atingir somente a CI em preparação.

### Conflito a validar

- A DATA-001C1 confirma continuidade e sincronização dos bloqueados. A implementação do ciclo e da proteção temporal permanece pendente; cancelamento da liberação de bloqueado não pode alterar nenhum estado.

## 11. ERP / Ordem de Serviço

### Status: ATUAL/OBSERVADO

Existe um ERP separado onde a portaria abre ordens de serviço.

Existem conceitos como:

- preventiva;
- corretiva;
- defeito.

### Limitação do Sistema Garagem

O Sistema Garagem não deve duplicar automaticamente as responsabilidades do ERP.

### Regra observada

Um veículo não deve operar quando houver condição que impeça sua circulação ou prejudique a operação/atendimento aos passageiros.

### Ponto a validar

Os critérios formais para decidir quando a condição do veículo impede circulação ainda precisam ser validados com a manutenção.

## 12. Portaria

### Status: ATUAL/OBSERVADO

A portaria é o ponto central de planejamento e coordenação.

Ela utiliza:

- informações da CI;
- informações do Controle de Manutenção;
- situação física do pátio;
- condições dos terminais;
- disponibilidade operacional de cada veículo.

### Papel observado

A portaria monta a programação de veículos para o próximo período/dia e também pode estar realizando a soltura do período atual.

### Conflito a validar

- O processo real pode exigir simultaneidade entre planejamento e execução, o que nem sempre se traduz em fluxos estritamente sequenciais no sistema.

## 13. Motorista

### Status: PLANEJADO / ATUAL/OBSERVADO

A gestão de escala de motoristas ainda não está implementada no Sistema Garagem.

Hoje esse processo utiliza Excel.

### Planejamento futuro

Está planejada futuramente a digitalização de conceitos como:

- motorista;
- escala;
- folga;
- férias;
- afastamento;
- substituição;
- associação do motorista ao serviço/tabela.

### Importante

Não devem ser inventadas regras formais para esses conceitos neste documento.

## 14. Garagem

### Status: ATUAL/OBSERVADO

Existem múltiplas empresas, garagens e terminais na operação.

### Observação

As quantidades exatas e seus relacionamentos ainda precisam ser validados.

### Importante

Não devem ser fixados números como regra de domínio neste documento.

## 15. Terminal

### Status: ATUAL/OBSERVADO

Os terminais são parte do contexto operacional da portaria e da escala.

Eles ajudam a determinar a disponibilidade e a necessidade de veículos em cada período.

### Ponto a validar

Não foi observado neste repositório um mapeamento formal completo de todos os terminais, suas dependências e impactos no processo.

## 16. Empresa/Consórcio

### Status: ATUAL/OBSERVADO

Existem múltiplas empresas, garagens e terminais na operação.

A relação entre empresa, consórcio e garagem ainda precisa ser validada.

### Conflito a validar

Há possibilidade de que a modelagem técnica atual use termos diferentes dos usados pela operação, e isso deve ser considerado ao evoluir o sistema.

## 17. Reserva

### Status: ATUAL/OBSERVADO

Reservas são utilizadas operacionalmente para ajudar a suprir necessidade de veículo quando há indisponibilidade, por exemplo por manutenção ou bloqueio.

### Observação

A regra completa de reservas ainda precisa ser validada.

### Ponto a validar

A reserva pode ter regras próprias por garagem, empresa, terminal, disponibilidade e situação de manutenção, mas isso ainda não foi formalizado como regra de domínio.

## 18. Abastecimento

### Status: ATUAL/OBSERVADO

O abastecimento acontece antes das solturas.

Atualmente ele não deve ser tratado como bloqueio automático para soltura.

### Observação

O abastecimento é um processo operacional relacionado à disponibilidade do veículo e ao preparo da operação, mas não deve ser confundido com regra de liberação final.

## 19. Catracas/Bilhetagem

### Status: ATUAL/OBSERVADO

Atualmente o módulo é predominantemente separado da soltura.

Pode existir integração futura, mas ela não deve ser assumida como requisito atual.

### Conflito a validar

- O código pode possuir módulos e integrações que apontam para relação com catracas e bilhetagem.
- O processo operacional reportado pela equipe indica que esse módulo ainda é predominantemente independente da operação de soltura no curto prazo.

## 20. Conceitos planejados

### Status: PLANEJADO

Os seguintes itens aparecem como intenção de evolução futura e não devem ser tratados como regras atuais:

- digitalização da gestão de motoristas;
- escala de motoristas e substituições;
- integração mais profunda entre CI, manutenção e soltura;
- regras automatizadas de disponibilidade e bloqueio;
- sincronização mais formal entre manutenção, pátio e operação;
- digitalização de reservas com regras mais explícitas;
- maior integração com catracas e bilhetagem.

### Observação

Esses conceitos podem ser implementados no futuro, mas exigem validação de processo antes de se tornarem regra de domínio.

## 21. Pontos que precisam de validação

### Status: ATUAL/OBSERVADO / PLANEJADO

Os pontos abaixo devem ser considerados pendentes de conferência formal:

- regra definitiva de disponibilidade de veículo;
- critérios formais para impedir circulação do veículo;
- detalhes pendentes da CI/manutenção listados na DATA-001A e critérios completos de disponibilidade operacional;
- manutenção de matriz de empresas, garagens, terminais e consórcios;
- regras completas de reserva;
- digitalização de motoristas e escalas;
- relação formal entre linha, tabela e serviço;
- integração futura entre catracas/bilhetagem e soltura;
- distinção precisa entre dados de operação e dados de planejamento.

## 22. Conflitos observados entre entendimento operacional e código/documentação

### Situação 1

CI e Controle de Manutenção são conceitos operacionais distintos, com responsabilidades e ciclos próprios. Isso não significa ausência de integração: a DATA-001C1 confirma a sincronização dos bloqueios vigentes entre o Controle de Manutenção do dia operacional atual e a CI correspondente em preparação.

BLOQUEADO + EM MANUTENÇÃO podem coexistir; os estados de oficina não devem ser confundidos com o bloqueio. Disponibilidade operacional e soltura também são conceitos distintos, sem que essa distinção implique ausência de integração.

O problema da implementação atual não é a existência da sincronização, mas os efeitos colaterais implícitos, a reconstrução durante consultas e a ausência de destino temporal seguro para algumas operações. Essa sincronização não deve alterar CI finalizada/histórica nem manutenção histórica. Os mecanismos técnicos permanecem pendentes.

### Situação 2

O domínio de "disponibilidade" é mais complexo do que um booleano; o código e os módulos podem representar estados mais simples, mas a operação real parece depender de contexto adicional.

### Situação 3

O domínio de motoristas, escala, folga e substituição aparece como processo ainda não implementado e ainda dependente de Excel.

### Situação 4

As entidades de garagem, empresa, terminal e consórcio parecem relevantes para a operação, mas a estrutura e os relacionamentos exatos ainda precisam ser validados.

## 23. Resumo executivo

Este documento representa o entendimento atual do domínio do Sistema Garagem, com classificação explícita de confiança.

- As informações com status ATUAL/OBSERVADO refletem o entendimento operacional atual.
- As informações com status PLANEJADO representam evolução desejada, mas ainda não validada.
- As regras CONFIRMADAS na DATA-001A, DATA-001C1 e DATA-001C3 registram a confirmação explícita recebida do usuário; não demonstram implementação existente.

O contrato confirmado da DATA-001A orienta as próximas etapas. Os demais conteúdos observados ou planejados permanecem base de discussão e não devem ser promovidos a regras confirmadas por inferência.

## DATA-001A — Contrato operacional da CI

### CONFIRMADO — confirmação explícita do usuário em 2026-10-05

As regras abaixo prevalecem sobre trechos anteriores que tratam genericamente a relação CI/manutenção como pendente. Confirmação do contrato não significa implementação existente.

- A CI é uma fotografia operacional diária, preparada antecipadamente, normalmente no dia anterior.
- Historicamente, parte-se de uma cópia da CI anterior, com inclusões, exclusões e alterações para preparar a próxima.
- Durante a preparação pode haver alterações. Após finalizada para uso operacional, a CI não deve sofrer alterações posteriores.
- Consulta de CI finalizada/passada retorna a fotografia registrada daquele dia. Não deve reconstruir, completar, reconciliar ou modificar silenciosamente históricos com o estado atual. GETs devem ser somente leitura.
- CI e Controle de Manutenção são relacionados, mas distintos. O veículo pode estar simultaneamente bloqueado pela CI e em execução/manutenção; esses estados não são mutuamente exclusivos.
- Liberação na manutenção não deve retirar silenciosamente o bloqueio da CI. Retirada explicitamente confirmada deve atingir a CI em preparação, preservando as finalizadas.
- O processo trabalha com fotografias diárias; não foi decidida substituição por um único bloqueio global com intervalo de vigência.

### ATUAL/OBSERVADO — implementação e divergências

A interface permite edição de amanhã, bloqueia hoje/passado e calcula cópias; algumas ações materializam essas cópias. Não foi identificado estado persistido de preparação/finalização, data de finalização ou versão. Após B1/B2, DDL e saneamentos históricos saíram desses controllers; GET de manutenção ainda copia, cria, atualiza, exclui e reconcilia registros funcionalmente. Herança pode completar históricos e exclusões por prefixo podem atingir várias datas. Isso diverge do contrato confirmado.

Fontes: controllers ciBloqueios.ts/manutencao.ts, CiManutencaoView.tsx e managers de CI/manutenção. Análise estática, sem consulta ao banco.

### Decisões complementadas pela DATA-001C3

Calendário, finalização, conteúdo copiado, âmbito e janela operacional foram confirmados na C3 abaixo. Persistência, execução técnica, transações e adoção dos dados continuam pendentes. Não presumir preparação apenas por data futura; identidade/status ainda não estão implementados.

## DATA-001C1 — Ciclos operacionais e continuidade dos bloqueados

### CONFIRMADO — decisões do responsável pelo processo registradas em 2026-10-06

Esta seção complementa a DATA-001A e prevalece sobre referências anteriores que tratam genericamente sincronização ou liberação mantendo bloqueio como indefinidas. DOMAIN.md permanece a fonte principal das regras. Confirmação não significa implementação existente.

- Controle de Manutenção representa a situação operacional do próprio dia e muda durante o trabalho da oficina. BLOQUEADO, EM MANUTENÇÃO e LIBERADO são conceitos distintos; BLOQUEADO + EM MANUTENÇÃO podem coexistir. Colocar em manutenção não remove o bloqueio nem o veículo da CI em preparação.
- A CI é preparada antecipadamente. CI passada/finalizada preserva exatamente sua fotografia persistida e não pode sofrer alteração retroativa.
- Durante o dia operacional, BLOQUEADOS da manutenção do dia atual sincronizam bidirecionalmente com BLOQUEADOS da CI em preparação para o próximo dia operacional. Adicionar bloqueado em qualquer um desses dois destinos deve refletir no outro. Isso não autoriza alterar manutenção anterior, CI do dia já finalizada ou outras CIs finalizadas.
- Retirada explícita de BLOQUEADOS da manutenção deve retirar também de BLOQUEADOS da CI em preparação correspondente, preservando as finalizadas.
- Ao tentar liberar veículo ainda bloqueado, confirmação é pré-condição ANTES de qualquer alteração. Confirmar conclui a liberação, retira de EM MANUTENÇÃO conforme o fluxo operacional, representa em LIBERADOS e remove de BLOQUEADOS da manutenção e da CI em preparação correspondente.
- Cancelar ou não confirmar não altera nada: não adiciona a LIBERADOS, não retira de EM MANUTENÇÃO/BLOQUEADOS e não altera a CI. Neste fluxo não há resultado LIBERADO + BLOQUEADO. Isso não transforma todos os estados em mutuamente exclusivos: BLOQUEADO + EM MANUTENÇÃO continua permitido.
- Bloqueios vigentes continuam entre dias enquanto não retirados/liberados. No novo ciclo, iniciam a manutenção do dia e são o ponto de partida dos BLOQUEADOS da próxima CI em preparação.
- EM MANUTENÇÃO e LIBERADOS pertencem ao dia e não são carregados como estados iniciais do dia seguinte. O estado inicial dos bloqueios continuados é conceitualmente bloqueado=true, em_execucao=false, liberado=false, inclusive se estavam também em manutenção no dia anterior.
- Inicialização/materialização do novo dia deve ser explícita e independente de GET. A continuidade/sincronização é uma necessidade operacional real, mas consulta genérica não pode materializar ou reconciliar silenciosamente com o presente. GET deve consultar o estado persistido da data, sem reconstruir arbitrariamente históricos.

### Exemplos confirmados

Durante 01/10/2026, BLOQUEADOS do Controle de Manutenção 01/10 sincronizam com BLOQUEADOS da CI 02/10 em preparação: adicionar 3000 na CI o inclui na manutenção 01/10; adicionar 4000 na manutenção o inclui na CI 02/10. Nenhuma dessas ações altera CI 01/10 finalizada.

Se 3000 e 4000 continuam bloqueados ao fim de 01/10, iniciam BLOQUEADOS da manutenção 02/10 e da CI 03/10 em preparação. Mesmo se 3000 estava BLOQUEADO + EM MANUTENÇÃO em 01/10, somente seu bloqueio continua. EM MANUTENÇÃO e LIBERADOS começam limpos em 02/10; 2424 apenas LIBERADO em 01/10 não é carregado como liberado no novo dia.

### ATUAL/OBSERVADO — lacunas da implementação

B1 removeu saneamentos históricos e B2 removeu DDL e carga inicial acoplada dos controllers. GET /api/manutencao ainda materializa herança, faz upserts e reconcilia/exclui por CI ativa. Fluxos de retirada podem atingir prefixos em várias datas; caches recompõem listas. Esses comportamentos não implementam a correspondência dos ciclos nem proteção de finalizadas. Não há garantia de cancelamento sem efeitos ou de sincronização restrita ao destino correto demonstrada por esta documentação.

### Decisões complementadas pela DATA-001C3

C3 abaixo confirma as escolhas operacionais antes pendentes. Os mecanismos técnicos permanecem propostos/não implementados; data_folha segue sem finalidade comprovada.


## DATA-001C3 — Contrato consolidado do ciclo e da fotografia CI

### CONFIRMADO — decisões do responsável em 2026-10-06

Esta seção complementa A/C1 e substitui suas pendências já decididas sobre calendário, finalização, conteúdo da cópia, âmbito e janela operacional. DOMAIN.md é a fonte principal do contrato. Decisão aprovada e proposta de schema NÃO significam implementação existente.

- FolhaCI e CicloOperacional são entidades distintas relacionadas. Ciclo D representa operação/manutenção D e prepara FolhaCI D+1. No fluxo normal há um ciclo por garagem/data operacional e uma folha por garagem/data destinatária; a preparação correspondente pertence ao ciclo D. Finalizar a folha não transforma ciclo e folha no mesmo conceito.
- VCG e VCM são contextos independentes; dados não se misturam. O rollout inicial habilitará VCG; VCM não será ativada automaticamente por existir no modelo. Acesso a esses contextos é exclusivo de ADMIN, que pode operar ambas. Não há associação obrigatória usuário→garagem nem perfil por garagem.
- A fonte temporal comum é America/Campo_Grande, sem offset UTC fixo. Inicialização às 03:00 e finalização às 18:30 ocorrem todos os dias, inclusive sábados, domingos e feriados, sem exceção atual de calendário.
- Às 03:00 de D, inicializar Ciclo D, criar FolhaCI D+1 EM_PREPARACAO como cópia integral da FolhaCI D FINALIZADA e iniciar manutenção D. Cada folha e cada item copiado recebem nova identidade; os itens pertencem à nova folha e a origem permanece imutável.
- Copiar a fotografia efetiva inteira: Preventivas e subtipos, Setores da Oficina, Reforço com Horário, suas 12 posições fixas (horários podem repetir), posições/itens da coluna adicional, título variável dessa coluna, Bloqueados e informações operacionais persistidas pertencentes à folha. Preservar multiplicidade e posição lógica, não deduplicar apenas por veículo/horário.
- O título adicional pertence à folha mesmo com zero itens. Opções atuais: INSPEÇÃO, LUBRIFICAÇÃO, EM MANUTENÇÃO, TROCA DE ÓLEO, REVISÃO e PREVENTIVA. A autoridade oficial será o backend persistido, não localStorage. EM MANUTENÇÃO nesse título não é estado de oficina do Controle.
- Não copiar rascunhos não salvos, modais, filtros, seleção, mensagens, marcadores de reconstrução, IDs clone-*, finalização da origem, EM MANUTENÇÃO ou LIBERADOS do Controle. Cópia às 03:00 e sincronização durante o ciclo são operações distintas.
- A manutenção inicial contém os BLOQUEADOS da nova folha; EM MANUTENÇÃO e LIBERADOS começam vazios. Somente BLOQUEADOS sincronizam bidirecionalmente com a preparação correspondente. Preventivas, Oficina e Reforço da CI não alteram automaticamente estados de oficina/liberados do Controle, nem o inverso.
- BLOQUEADO + EM MANUTENÇÃO coexistem. Colocar em manutenção não remove bloqueio, presença nos Bloqueados da CI ou conteúdo de outras seções.
- Retirar/liberar bloqueado da CI em preparação remove apenas sua participação nos BLOQUEADOS daquela folha; não exige mantê-lo visível como LIBERADO. Não remove o veículo de outras seções nem de folhas anteriores. Campos legados de status/liberação serão preservados até análise posterior de compatibilidade.
- Liberação de bloqueado no Controle exige confirmação ANTES de qualquer alteração. Confirmar libera, trata execução conforme o fluxo, representa Liberados e retira bloqueios do Controle e da preparação numa operação atômica. Cancelar não muda nada; esse fluxo não produz LIBERADO + BLOQUEADO parcial.
- Às 18:30, a folha passa de EM_PREPARACAO para FINALIZADA: sem inclusão, alteração ou exclusão. Reabertura não integra o escopo; não criar REABERTA agora.
- Janela operacional: 03:00 inclusive até 18:30 exclusive. A partir de 18:30, tanto CI quanto Controle ficam somente para consulta, sem alteração operacional. Antes das 03:00 não há abertura do novo ciclo. Equipe noturna não utiliza esses módulos; anota em papel para repasse no próximo dia. Não implementar suporte noturno.
- Autorização temporal ocorre no backend dentro da fronteira transacional. Requisição iniciada antes do limite não tem direito adquirido: se não obtiver autorização protegida antes de 18:30:00, rejeitar integralmente. Mesmo com scheduler atrasado e estado ainda EM_PREPARACAO, o horário impede mutações. Frontend apenas reflete o fechamento.
- Inicialização/finalização são operações de domínio reutilizáveis e idempotentes; scheduler apenas dispara, sem regras acopladas à biblioteca. Nenhuma biblioteca foi escolhida. GETs não inicializam nem recuperam eventos.
- Atraso no mesmo dia: volta às 06:00 recupera inicialização pendente usando origem FINALIZADA; volta às 20:00 regulariza finalização com alterações já bloqueadas por horário. Distinguir previsto e efetivamente executado, sem falsificar timestamps.
- Indisponibilidade por vários dias: não reconstruir realidade nem repetir cópias antigas como fotografias reais. Criar estruturas ausentes vazias, representar dias históricos ausentes como folhas vazias FINALIZADAS e criar a preparação atual necessária. Identificar RECUPERACAO. ADMIN poderá preencher/corrigir conforme procedimento administrativo posterior; isso NÃO autoriza editar FINALIZADA por comando operacional nem implementar reabertura agora.
- Histórico inicial VCG: Excels oficiais de outubro serão fotografias independentes FINALIZADAS, identificadas IMPORTACAO. Script de INSERT será preparado externamente, revisado e executado manualmente pelo responsável, em etapa futura. Não haverá importador na aplicação nem inferência de transições ou reinterpretação automática do legado. Nenhum SQL é escrito/executado nesta C3.

### ATUAL/OBSERVADO — lacunas preservadas

Não existem os modelos/ciclo/status de folha propostos. As quatro seções usam CiBloqueio; subTipo distingue preventiva/oficina; horarioReforco guarda horário/serviço e observacoes é exposto como os. Posições de reforço dependem de IDs e reforcoSlotId local não é enviado pelo manager. Título reforco_servico_tipo_<data> vive em localStorage, inclusive sem itens. GET de manutenção continua mutável; filtros de garagem/usuário e ausência de autorização ADMIN/temporal nos caminhos atuais divergem do novo contrato. Não foram corrigidos nesta etapa.

### PENDENTE — desenho e implementação

A proposta técnica está em DATABASE.md. Schema, constraints, comandos, transações, scheduler, habilitação do rollout e adaptação do frontend precisam de revisão/implementação. data_folha continua sem finalidade comprovada e não será reutilizada. Definir posteriormente o procedimento administrativo de preenchimento/correção da recuperação, preservando a imutabilidade operacional; dados/arquivo inicial e data de rollout ainda precisam ser fornecidos/aprovados. Não há nova dúvida sobre horários, timezone, cópia integral, acesso ADMIN, isolamento de garagens ou janela noturna.


### Soltura VCG: resolucao temporal explicita

CONFIRMADO nesta etapa: equipe prepara CI D+1 em D; portaria consulta D+1
na tarde/noite D e na madrugada D+1. Consultar EM_PREPARACAO nao equivale
a autorizar soltura. Manutencao oficial atual tambem deve ser considerada.

ATUAL/OBSERVADO: o piloto autoriza somente VCG/C4 com CI FINALIZADA da
dataOperacao explicita e ciclo NORMAL de manutencao atual. Legado, VCM,
preparacao, recuperacao e madrugada antes das 03:00 permanecem recusados.
A escala possui armazenamento proprio/revisao e nao confirma disponibilidade.
CONFIRMADO pelo usuario em 14/10/2026, com escopo refinado para Escala de Carros:
linha, tabela, saida, chegada e carro original sao fixos e vem de JSON do proprio
sistema, sem consultar/publicar a programacao permanente no banco. Somente
Carro Substituido e editavel e salvo por data/garagem/tipo/turno. No dia seguinte
a tela usa novamente o JSON, sem transportar substituicoes. Datas anteriores
permitem consultar as substituicoes salvas. Limpar a substituicao restaura o
carro fixo, sem mudar o arquivo. Banco guarda apenas alteracoes e metadados.
Alterar Folha permanece destinado a mudancas permanentes; sua revisao e a
integracao das substituicoes com Soltura foram adiadas pelo usuario para outra
etapa. Programar uma substituicao nao equivale a liberar o carro.
Na falha de consulta oficial, a base pode ser mostrada com aviso, mas sem
confirmacoes/gravacoes ate a recuperacao da consulta.
CONFIRMADO pelo usuario na etapa seguinte de 14/10/2026: a Escala diaria pode
ser alterada por ADMIN ou pelo perfil Soltura vinculado a propria garagem.
Outra garagem continua vedada ao perfil Soltura. A publicacao permanente
permanece exclusiva de ADMIN; esta permissao nao altera regras de liberacao.
CONFIRMADO nesta continuacao: Escala de 14/10 usa BLOQUEADOS da CI 15/10
(regra geral: CI do dia seguinte a data selecionada). Somente veiculos da
frota oficial da garagem selecionada podem ser alocados, independentemente
da consorciada/prefixo. CI e frota precisam estar disponiveis para gravar.
Carros nao podem ocupar simultaneamente linhas e cards, nem dois cards.
O carro fixo e referencia imutavel: permanece visivel em vermelho/com alerta
quando bloqueado, fora da frota ou ocupado em outro lugar. So fica disponivel
para outro card depois de substituido na linha e se nao estiver bloqueado.
Confirmar a linha valida o carro efetivo (substituto, quando informado);
fixo bloqueado sem substituto impede a confirmacao. Confirmar nao e liberar.
Cards laterais sao compartilhados no banco por data/garagem/tipo/turno e
retornam aos padroes no dia seguinte, sem transportar alocacoes antigas.
Reserva e calculada pela frota oficial menos carros efetivos das linhas,
cards e bloqueados (CI e Portaria). Nao e uma lista editavel independente.
Confirmacao da informacao do carro da linha fica indicada apenas pelo fundo
verde, mantendo o botao com uma marca de certo e sem texto de status. E registrada somente depois
de gravacao validada pelo backend, por data/contexto e carro efetivo. Edicao
local volta ao estado pendente ate nova confirmacao. A indicacao sobrevive a
recarga, mas nao e inferida de registros antigos sem confirmacao explicita,
nem permanece valida se o carro efetivo ficar bloqueado/duplicado/fora da frota.
Esta confirmacao continua sendo da Escala, sem registrar uma Soltura.
Limites e verificacoes em [SOLTURA-ESCALA-SEGURANCA.md](SOLTURA-ESCALA-SEGURANCA.md).

### Rabicho da Escala - ajuste autorizado em 15/10/2026

A interface e a API nao permitem criar novas linhas/tabelas no Rabicho.
As posicoes existentes permanecem, permitindo definir ou retirar apenas o carro.
O botao de posicao vazia usa mais (+); a retirada continua sem excluir a posicao.
O agrupamento visual dos terminais preserva os terminais e horarios cadastrados.

### Reserva automatica por cor na Escala - confirmado em 16/10/2026

Por confirmacao explicita, o card Reserva e substituido por seis grupos na
Garagem: AZUL, VERMELHO, MICRO; VERMELHO/AZUL, PRATA, OUTRO (grade 3x2).
Eles mostram automaticamente todos os carros livres da frota da garagem
selecionada, sem inclusao/retirada manual. EXECUTIVO corresponde a MICRO.
Ausencia de correspondencia, NULL e NAO IDENTIFICADO correspondem a OUTRO.
A fonte de cor e o cache JSON do SIGSIT; existencia e garagem continuam
vindo de Veiculos. Nao se consulta SIGSIT durante requisicoes da Escala.

Esta regra prevalece sobre os antigos cards de alocacao AZUL/VERMELHO/MICRO:
eles deixam de reservar carros ou participar da validacao de ocupacao.
Registros salvos desses cards permanecem intactos no JSON diario, sem
backfill, exclusao, migration ou alteracao em GET. A API recusa novas
mutacoes nesses grupos. Linhas, Portaria, terminais, Rabicho e demais
cards continuam ocupando carros; bloqueados nao entram na reserva.
O carro fixo fica disponivel somente depois de substituicao persistida,
se nao tiver outra ocupacao ou bloqueio. A classificacao usa o ultimo
cache valido, inclusive ao consultar datas antigas; nao representa uma
fotografia historica de cores. Sem cache valido, grupos vazios e aviso
de indisponibilidade, mantendo demais consultas/validacoes da Escala.

### Avisos amarelos da CI na Escala - confirmado em 16/10/2026

Veiculos presentes em PREVENTIVA, OFICINA ou REFORCO na folha CI da data
selecionada + 1 recebem aviso amarelo informativo. A consulta reutiliza a
mesma FolhaCI usada para os bloqueios, restrita a garagem e frota oficial.
O aviso lista todas as ocorrencias, com categoria, subtipo/setor e horario
ou posicao extra quando persistidos, ao passar o mouse, focar ou clicar.
Nao cria bloqueio, nao impede confirmacao e nao remove carro da reserva.
Bloqueados (CI ou Portaria) mantem prioridade vermelha e impedimento vigente.
Sem inferir subtipo/horario ausente, consultar outra folha, modificar dados
ou reconstruir fotografias finalizadas. Dados exibidos vem da ultima
consulta oficial da Escala; nao adiciona transporte realtime nesta tarefa.

Complemento aprovado: no aviso de REFORCO FIXO, quando horarioReforco estiver
ausente, exibir o horario da posicao fixa correspondente, igual ao mostrado
na tela da CI (ex.: posicoes 1/2 = 07:15 - A). Horario persistido tem prioridade.
Esta e somente uma regra de exibicao, sem gravar/completar a folha.
Extras e posicoes desconhecidas nao recebem horario inferido.

### Retirada imediata no Reforco da CI - ajuste de 16/10/2026

O botao x do seletor de carro dos horarios fixos e posicoes extras do Reforco
agora grava a retirada imediatamente, sem exigir clicar depois no certo.
Retira apenas o registro salvo da posicao, data e garagem, preservando
outras ocorrencias do carro em horarios/setores e o contrato de bloqueios.
O seletor somente limpa apos confirmacao da API; falha ou conflito preserva
a selecao/rascunho. Contexto, permissao e revisao continuam revalidados
pela persistencia existente. Nao altera folhas finalizadas nem faz backfill.
