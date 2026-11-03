# Moldes VCG em JSON - 21/10/2026

## Atualização de carros vinculados em operação — 03/11/2026

Nova regra autorizada: novas Solturas fotografam no JSON quais viagens herdam
carros da Escala. Enquanto em andamento, apenas essas viagens pendentes
acompanham a Escala operacional corrigida e novamente finalizada. Modelo,
linhas e horários continuam fotografados; viagens liberadas e folhas finalizadas
não mudam automaticamente. Folhas antigas sem essa informação continuam
congeladas, sem inferência retroativa. Não exige nova tabela nem SQL.
Correções manuais de carro/motorista estão acessíveis pelo lápis ao lado do ✓,
respeitando as validações de histórico, motivos e estado da folha existentes.

## Vínculo de carros com a Escala — 03/11/2026

Atualização de interface: a opção agora é o select “Escala de vinculação”,
com o nome da Escala compatível. Soltura Seg–Sex não oferece Sábado ou Dom/Fer.
A lista também respeita a garagem e o turno da Escala (matutino/PADRÃO).
Para uma Soltura com funcionamento por data, a Escala especial do mesmo dia
aparece no lugar da recorrente, respeitando a prioridade existente. Para usar
uma especial, primeiro escolher “Uma data específica” e informar seu dia.
No funcionamento recorrente, o vínculo acompanha a Escala utilizada em cada
data, inclusive uma exceção compatível. O select não permite forçar um modelo
recorrente quando ele seria sobreposto pela exceção da data. A persistência
continua no JSON existente; não há novo identificador de vínculo nem SQL.
Sem vínculo mantém o comportamento anterior, inclusive a herança de carros
em branco nos recorrentes. Nomes são rótulos do catálogo; os carros são os
da folha operacional finalizada, cuja fotografia continua preservada.

No editor da Soltura, selecionar a Escala em “Escala de vinculação”
para manter o molde de viagens/horários e usar os carros da Escala operacional
finalizada do mesmo contexto. A Escala operacional já seleciona sua exceção
por data ou modelo vigente. O vínculo não aponta para um nome de cadastro:
segue a Escala efetivamente utilizada na data, garagem e tipo de dia da Soltura.
Não consulta nem herda outra data ou garagem. A correspondência é linha E tabela;
substitutos prevalecem. Ausência ou ambiguidade deixa carro em branco.

A opção vale para recorrentes e exceções matutinas/PADRÃO e é versionada no JSON.
Vespertino não aceita vínculo no backend. O editor oculta o carro programado
enquanto vinculado; valores cadastrados são preservados, mas ignorados nesse
modo, e voltam a valer ao selecionar “Sem vínculo”. Sem vínculo mantém a regra anterior.
Finalização da Escala continua obrigatória para iniciar a Soltura dependente.
Folhas já iniciadas preservam o conteúdo fotografado. Não exige SQL adicional.

Validação local: 35 testes passaram em programação/editor, programação e ciclo
da Soltura, com rede bloqueada e persistência simulada. Cobrem persistência do
vínculo, vigência, rejeição de contextos incompatíveis, correspondência,
substitutos, horários preservados e fotografia operacional.

## Vigência histórica — 03/11/2026

Edições recorrentes passam a gerar versões em `trafego_modelo_versao`, com
vigência desde a data da gravação. Datas anteriores sem folha usam a revisão
vigente naquele dia, ou o JSON de compatibilidade se não houver versão conhecida.
Folhas iniciadas e finalizadas preservam sua fotografia. Exceções por data
mantêm prioridade. Aplicar o SQL de versões antes da API; detalhes e limites
em `proposals/TRAFEGO-VIGENCIA-HISTORICA.md`.

## Editor de recorrentes e exceções — 03/11/2026

Portaria → Editar Escalas e Solturas abre diretamente as linhas do card e
permite editar funcionamento recorrente ou uma data específica. Modelos
recorrentes são guardados em `trafego_modelo`; exceções continuam na tabela
`trafego_programacao`. Prioridade para operação ainda não iniciada: data
específica, recorrente salvo, JSON original. Nenhum JSON é alterado em disco.
Fotografias já iniciadas/finalizadas não mudam. A exceção por data pode ter
a data alterada antes do uso, sem sobrescrever outro cadastro no destino.
Ver implantação em `proposals/PORTARIA-MODELOS-RECORRENTES.md`.

## Exceções por data — 02/11/2026

O menu Tráfego permite criar exceções de Escala ou Soltura para uma data,
do zero ou copiando padrões/exceções existentes. ADMIN e perfil Soltura da
própria garagem podem editar. As exceções ficam em `trafego_programacao` e
prevalecem no contexto da data; os padrões JSON permanecem como base quando
não houver exceção. Copiar sábado para segunda não altera o sábado padrão.

Programação em uso não pode ser editada. Novas escalas fotografam suas linhas
ao iniciar; solturas preservam a fotografia já existente no ciclo. Na exceção
de Soltura, o carro programado é o cadastrado no editor; no vespertino continua
ausente. Requisitos operacionais de CI, Escala, data e garagem permanecem.
Detalhes e implantação em `proposals/TRAFEGO-PROGRAMACAO.md`.

## Carros fixos sem repeticao - decisao de 22/10/2026

Na Escala VCG, cada carro fixo aparece uma unica vez por molde. O importador
mantem a primeira ocorrencia na ordem da planilha e deixa carroProgramado
vazio nas seguintes. Essa e uma excecao autorizada a copia dos valores Excel;
nao atribui substitutos nem altera IDs, linhas, tabelas, horarios ou registros
no banco. No seg-sex foram esvaziadas 25 ocorrencias extras de 24 carros.
Sabado e domingo-feriado ja eram unicos; moldes de Soltura nao mudam.

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
| exemplos/solturas/vcg/soltura-seg-sex-vespertina.xlsx | soltura/vcg/seg-sex-vespertino.json | 84 |
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
