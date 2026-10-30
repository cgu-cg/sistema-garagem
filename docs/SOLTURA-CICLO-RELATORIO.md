# Inicio, finalizacao e relatorio da Soltura

## Uso

1. Selecione garagem, data, tipo de dia e periodo.
2. Clique em **Iniciar Soltura**. Despachos anteriores do mesmo contexto sao
   preservados; o molde e fotografado para manter as viagens da folha.
3. Registre carro realizado e motorista nas viagens.
4. **Finalizar Soltura** exige todas as viagens liberadas no banco. A API
   recusa finalizacao incompleta mesmo se o comando for enviado diretamente.
5. Finalizada, a folha permite consulta e impressao. Somente ADMIN pode
   **Reabrir Soltura**, sem apagar despachos, com evento de auditoria.

Inicio, finalizacao, reabertura e despachos permanecem restritos a VCG e ao
dia da operacao. Matutino/PADRAO continuam exigindo CI/Escala; vespertino nao
adquire dependencia desses modulos. Mudancas de contexto nao transportam estado.

## Impressao

Na Folha de Soltura, o MOTO de uma viagem liberada pode ser clicado para
alterar o motorista e salvar. Usa a mesma gravacao autenticada do despacho,
preservando carro, horario de liberacao e historico de trocas de veiculo.
Disponivel somente com Soltura em andamento no dia da operacao, para o
perfil autorizado. Folha finalizada exige reabertura por ADMIN.

**Imprimir relatorio** abre documento A4 e a impressao do navegador (ou Salvar
PDF). Seg-Sex usa duas colunas e ate 52 linhas por coluna; sabado/domingo usa
tres colunas. O vespertino omite o carro programado. Inclui motorista, horarios,
reservas e bloqueios registrados. O filtro de busca nao exclui viagens do relatorio.
O programado substituido e riscado na impressao. Textos sao escapados como HTML.

Relatorio finalizado usa a fotografia gravada ao finalizar. Ao reabrir, a
consulta volta a ser parcial ate nova finalizacao. Historicos anteriores ao
controle usam somente os despachos persistidos, sem reconstruir reservas,
bloqueios ou linhas a partir do presente. Esses dados auxiliares ausentes sao
identificados no documento. Nao sao inventadas assinaturas ou revisoes documentais.

## Implantacao pendente no banco

O codigo e o modelo `FolhaSoltura` estao implementados. **O SQL nao foi executado.**
Revisar `docs/sql/2026-10-30-soltura-folha.sql` e aplicar somente no ambiente
confirmado pelo responsavel, antes de ativar esta versao da API/web. O script
cria apenas a tabela nova e nao converte, exclui ou finaliza registros antigos.

Gerar Prisma Client e executar os builds no procedimento de deploy. Na validacao
local, a DLL do Prisma estava em uso; a geracao completa foi comprovada em uma
saida temporaria isolada. Nenhum processo operacional foi encerrado.

Sem a tabela, o estado oficial fica indisponivel e nao ha simulacao local de
inicio/fim. Nao executar migrations ou db push como alternativa automatica.

## Verificacoes

Testes locais sem rede/banco: ciclo, permissoes, revisao, completude, historico
finalizado, bloqueio de POST individual/lote e relatorio paginado/escape HTML.
Previa visual de Seg-Sex e sabado em navegador headless local, com dados
ficticios. PDF Seg-Sex com 202 viagens conferido em duas paginas.
Banco real e fluxo autenticado completo aguardam implantacao da tabela.
