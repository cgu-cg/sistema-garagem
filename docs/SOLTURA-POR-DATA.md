# Soltura por data

Regra confirmada em 23/10/2026. Substitui, para a Soltura, as referencias
anteriores a CI D+1 e ao impedimento antes das 03h. O fluxo manual da CI e
da Escala permanece inalterado.

## Fluxo

1. Em D-1, preparar e finalizar a CI de D.
2. Preparar e finalizar a Escala de Carros de D.
3. Em D, realizar a Soltura com a CI e a Escala de D finalizadas.

03h e uma referencia aproximada de uso, sem horario minimo obrigatorio.
Datas futuras permitem consultar a programacao; datas anteriores permitem
consultar despachos na propria tela, pelo seletor de data. Gravar exige
data atual em America/Campo_Grande, usuario autorizado e mesma garagem.

## Carro programado

Os JSONs da Soltura definem linhas, tabelas e horarios. O carro programado
vem da Escala finalizada da mesma data, por linha **e** tabela: substituto
quando houver, senao fixo. Codigos numericos aceitam zeros a esquerda e
separadores equivalentes /, - e _. Sem correspondencia unica, fica vazio.
Os carros preenchidos no JSON nao sao fallback.

Segunda a sexta vespertino utiliza a Escala matutina da mesma data, pois
nao existe Escala vespertina. Tambem exige essa Escala finalizada. O Excel
correspondente chama-se `soltura-seg-sex-vespertina.xlsx`; seu JSON ja confere
com o documento, sem regeneracao nesta entrega.

Consultas atualizam ao entrar, ao retornar a janela e pelo canal realtime
de CI/Escala. Viagens pendentes acompanham a Escala. Despachos salvos preservam
carro programado, linha, tabela e horarios registrados, inclusive programado
vazio. Correcoes de realizado e motorista continuam sujeitas as validacoes
da Soltura. Consulta nao grava nem migra dados.

## Interface

Data, garagem, tipo de dia e periodo ficam no topo, sem indicadores ou filtros
de status. Impressao A4 permanece. Historico pelo seletor de data; URL antiga
compativel, sem item separado no menu.

Prefixos usam as cores da frota da Escala, inclusive vermelho/azul dividido.
Alertas CI ficam separados das cores. Reserva automatica usa carros livres
da Escala, descontando realizados e reservas de terminal da consulta; aparece
acima dos bloqueados. Bloqueados usam a referencia CI da Escala, incluindo
identificacao provisoria antes de iniciar a CI da data. Nao se importam
reservas manuais antigas do navegador.

## Garantias e limites

Backend revalida data, permissoes, CI, Escala finalizada e bloqueios dentro
da transacao Serializable. Usa locks CI/manutencao na ordem existente, depois
Escala; define o carro programado sem confiar no payload. Preserva bloqueios
e execucao registrados na manutencao atual. Nao exige CI de amanha nem ciclo
de manutencao inexistente para autorizar hoje. Origens recuperadas, estados
inconsistentes e falhas de leitura continuam recusados.

Mantida a restricao preexistente de despacho certificado VCG com C4 habilitado;
esta entrega nao habilita despacho VCM ou legado. Sem alteracao de schema,
migration, consulta ao banco ou certificacao operacional em ambiente real.

Validacao local: testes com banco simulado e rede bloqueada, correspondencia
linha/tabela e vespertino, preservacao de registros, origem/permissoes,
concorrencia/virada do dia, renderizacao React e builds API/web.
