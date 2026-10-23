# Dashboard

O card **CI MANUTENCAO** substitui a antiga consistencia de Catracas. Consulta
somente leitura de `/c4/contexto`, para a garagem cadastrada do usuario;
ADMIN sem garagem usa VCG, identificada no card. A data e amanha no contexto
operacional America/Campo_Grande, inclusive antes das 03h.

Mostra o status da folha e o total de prefixos unicos em BLOQUEADO nessa
data/garagem, excluindo registros LIBERADO. Pedidos de oficina, preventivas e
reforcos nao entram na contagem. Enquanto a CI de amanha nao existir, usa a
ultima CI FINALIZADA anterior da mesma garagem, exibindo a data real dessa
fonte e **Ultima CI finalizada**. Nao usa folhas futuras nem em preparacao
como referencia. A CI de amanha iniciada passa a prevalecer, mesmo vazia:
nesse caso mostra zero, sem herdar bloqueados. Sem nenhuma origem disponivel,
mostra **Nao iniciada**, sem numero presumido. Falha, legado ou falta de
acesso nao geram zero nem percentual ficticio. Consulta nao copia dados.

Atualiza ao abrir, voltar a janela e receber eventos CI da garagem. A consulta
nao muda o cache oficial de edicao da CI e nao grava dados. Permissoes seguem
validadas pelo endpoint existente. O atalho abre a tela da CI, que conserva
sua propria selecao inicial de data.

Botao Nova Soltura removido e destaques azuis/roxos substituidos por verde.
Pendencias dos demais indicadores demonstrativos estao em BACKLOG.md.
