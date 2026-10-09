# C4: janela e navegacao

Regra aprovada: selecao inicial em America/Campo_Grande usa dia atual antes das 03h e proximo dia a partir das 03h, inclusive fins de semana e feriados. Selecao manual permanece durante a tela; recarga recalcula. A meia-noite nao avanca a folha selecionada inicialmente.

C4 permite mutacoes 03:00 inclusive a 20:00 exclusive. Scheduler, bootstrap/retry e verificacao transacional usam 20h. Legado permanece em 18h30. Folhas previamente finalizadas nao reabrem, e finalizacao prevista de registros existentes nao e reescrita: o scheduler usa a nova regra, nao esse campo historico. Permissoes 5eb9c56 preservadas.

Implantar API e frontend juntos; evitar replicas com horarios divergentes. Nenhum SQL/migration ou alteracao direta de dados. Esta regra substitui o limite anterior nos documentos C4.

A janela do frontend consulta somente a garagem selecionada: habilitar C4 VCG nao estende o legado VCM, nem vice-versa. A data selecionada da CI e independente da data de Solturas, Escala e Historico. Sair da CI descarta sua preferencia; permanecer nela preserva a selecao manual e inicial, inclusive nas viradas do relogio.
