# Moldes VCG em JSON - 21/10/2026

Decisao confirmada: os novos moldes se aplicam inclusive a datas anteriores.
Os sete arquivos Excel em `exemplos/` sao a referencia da conversao. O sistema
nao abre Excel em runtime. VCM mantem os dados anteriores, agora em JSONs
separados, pois nao foram fornecidas novas planilhas dessa garagem.

| Excel | JSON em apps/web/src/data | Linhas |
| --- | --- | --- |
| exemplos/escala-carros/vcg/seg-sex.xlsx | escala-carros/vcg/seg-sex.json | 202 |
| exemplos/escala-carros/vcg/sabado.xlsx | escala-carros/vcg/sabado.json | 108 |
| exemplos/escala-carros/vcg/domingo-feriado.xlsx | escala-carros/vcg/domingo-feriado.json | 52 |
| exemplos/solturas/vcg/soltura-seg-sex.xlsx | soltura/vcg/seg-sex-matutino.json | 202 |
| exemplos/solturas/vcg/soltura-vespertina.xlsx | soltura/vcg/seg-sex-vespertino.json | 84 |
| exemplos/solturas/vcg/soltura-sabado.xlsx | soltura/vcg/sabado.json | 108 |
| exemplos/solturas/vcg/soltura-domingo-feriado.xlsx | soltura/vcg/domingo-feriado.json | 52 |

## Conversao e campos

`node scripts/importar-moldes-vcg.cjs` confere a conversao sem gravar.
`node scripts/importar-moldes-vcg.cjs --write` regenera os sete JSONs e suas
copias em `apps/api/src/data/`. Usa a dependencia xlsx ja existente e nao
consulta banco, rede ou ambiente. As copias sao necessarias pelos contextos
Docker separados; testes conferem igualdade entre frontend e API.

Os arquivos sao arrays de viagens com os campos ja usados pelas telas:
id, ordem, linha, tabela, saidaGaragem, chegadaGaragem, inicioLinha,
inicioBairro, carroProgramado e status PENDENTE. Secoes geram tipo/observacoes
e, no vespertino, ordemTerminal. Cabecalhos e linhas vazias nao geram viagens.

Garagem continua em saidaGaragem; bairro conserva o mapeamento anterior dos
campos de chegada/inicio. Horarios sao padronizados HH:mm, inclusive 14;55
para 14:55. A indicacao VCM continua textual. Nao preencher carros vazios,
motoristas, carros realizados, substituicoes ou confirmacoes a partir de
outra planilha. SISEP e ESP.VCM entram como FRETAMENTO com tabela vazia.
A API aceita a excecao somente com identidade, linha e contexto desses
fretamentos; as demais viagens continuam exigindo tabela.

## Fontes e banco

`scheduleTemplates.ts` seleciona o JSON pela garagem/dia/turno. A Escala
VCG usa o arquivo seg-sex unico; a Soltura usa matutino ou vespertino.
Na Soltura VCG, publicacoes antigas em EscalaCarros nao sobrepoem o molde.
Alteracoes operacionais continuam salvas por data nas tabelas existentes,
assim como substituicoes/confirmacoes da EscalaDiaria. VCM conserva a
prioridade anterior de sua publicacao. O editor de publicacao recorrente
VCG deixa de editar o molde; alteracoes no molde sao feitas nos JSONs.

Nenhum SQL, schema, migration ou dado existente foi alterado nesta entrega.
As fontes antigas escalaOficialPdf.ts, solturaData.ts e escalaFixa.json foram
substituidas; tipos e reservas foram separados dos moldes em arquivos proprios.

## Identidade e historico

Preservar IDs quando linha/tabela/saida continuam equivalentes; nao reutilizar
um ID antigo por simples coincidencia de numero da linha no Excel. Novas
viagens recebem identidade determinista. O importador usa os JSONs existentes
para conservar IDs em novas conversoes e recusa regeneracao sem essa referencia.

`retiredScaleRows.json` guarda somente identificadores e descricoes das viagens
retiradas, sem servir de molde. Substituicoes antigas conhecidas continuam no
payload e no banco, mas nao sao aplicadas a outras viagens. A tela as exibe
separadamente. Confirmacoes antigas nao confirmam viagens diferentes. IDs
desconhecidos continuam causando erro, sem descartar historico silenciosamente.
Se uma futura revisao retirar outras viagens, atualizar esse catalogo antes
do rollout. Despachos salvos de viagens removidas continuam visiveis no
Historico da Soltura com a descricao persistida no proprio registro.

Registros operacionais so sao sobrepostos apos consulta do banco no contexto
de data/garagem/turno; os moldes nao recebem alteracoes da operacao diaria.
