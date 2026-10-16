# Cache de cores da frota

Implementacao local para uso futuro. Nenhuma conexao real, carga inicial ou
ativacao foi executada pelo agente. Nao altera SQL, schema ou a consulta de
Veiculos no Bilhetagem. A reserva da Escala usa o cache para agrupamento automatico por cor.

Veiculos continua sendo a fonte oficial de existencia e garagem. SIGSITBD.dbo.Frota
fornece somente idCarro e carroceriaFAIXA, por pool independente, sem JOIN entre
servidores. O cache contem cores da Frota ativa; nao cria veiculos no inventario.
O consumidor futuro deve relacionar pelo idCarro a lista atual do Bilhetagem.
Carro ausente ou faixa NULL: OUTRO. Codigos 1=AZUL, 3=PRATA, 4=VERMELHO,
5=VERMELHO/AZUL, 6=EXECUTIVO; demais: NAO IDENTIFICADO.

## Configuracao para ativacao posterior

Configure no ambiente da API, sem registrar senhas no repositorio:

```dotenv
SIGSIT_SQL_HOST=192.168.0.114
SIGSIT_SQL_PORT=1433
SIGSIT_SQL_DATABASE=SIGSITBD
FLEET_COLORS_JOB_ENABLED=false
```

SIGSIT_SQL_PORT e opcional: reutiliza SQL_SERVER_PORT quando omitida, ou 1433
se ambas estiverem ausentes. A conectividade ainda nao foi confirmada.
Sem SIGSIT_SQL_USER/PASSWORD, utiliza SQL_SERVER_USER/PASSWORD existentes,
conforme autorizado. Para usuario dedicado, configure AMBOS SIGSIT_SQL_USER
e SIGSIT_SQL_PASSWORD. Um par incompleto nao mistura credenciais dos servidores.
O usuario precisa somente SELECT na tabela de origem.
SIGSIT_SQL_ENCRYPT e SIGSIT_SQL_TRUST_SERVER_CERTIFICATE sao opcoes independentes,
habilitadas apenas pelo valor true; configure conforme o certificado do servidor.

O job somente inicia com FLEET_COLORS_JOB_ENABLED=true. A API verifica a agenda
a cada minuto: primeiro domingo do mes, 15:00 America/Campo_Grande (UTC-4).
O mes concluido e persistido no JSON. Se a API estiver desligada no horario,
recupera somente o mes atual ao iniciar depois da data prevista. Nao reproduz
meses passados. Falhas permitem nova tentativa apos 15 minutos.

## Carga inicial ou atualizacao manual

Somente no ambiente autorizado, apos configurar a conexao e compilar a API:

```sh
node dist/services/fleetColorJob.js --refresh
```

Execute a partir da pasta da API (no container, /app). O comando consulta
o SIGSITBD e grava arquivo; nao executa INSERT/UPDATE/DDL. O agente nao o executou.
A carga manual independe da ativacao do job e nao marca o mes como executado
pelo agendamento; o job ainda pode atualizar esse mes.

## Persistencia e falhas

Padrao: apps/api/uploads/.fleet-colors/cache.json, relativo a instalacao da API,
equivalente a /app/uploads/.fleet-colors/cache.json no container. A pasta oculta
nao e servida pelo express.static atual (dotfiles ignorados). Usa o volume de
uploads existente sem alterar Docker/Nginx. FLEET_COLORS_CACHE_PATH permite
outro caminho privado e persistente; nunca configure dentro de uma pasta publica.

JSON versionado com updatedAt UTC, scheduledMonth opcional e vehicles contendo
idCarro/cor. Sem credenciais, garagem ou dados operacionais diarios.
Gravacao em arquivo temporario exclusivo no mesmo diretorio e rename atomico.
Erro na origem, resultado vazio/invalido ou idCarro duplicado preserva o cache.
Cache corrompido gera falha; a atualizacao manual explicita pode recupera-lo.
Nao existe fallback mock. Logs nao incluem erros SQL ou dados de conexao.

Execute o job em apenas uma instancia. Chamadas simultaneas na mesma instancia
sao serializadas; nao ha lock distribuido entre processos/containers. O cache
nao substitui historicos ou fotografias oficiais e esta integrado a reserva por cor da Escala. Sem cache, a consulta de cores nao informa se a fonte esta atual;
consumidores futuros devem consultar tambem updatedAt e tratar indisponibilidade.

## Diagnostico seguro

Ao iniciar, a API informa se o job esta ativo. Falhas incluem apenas reason:
SIGSIT_CONFIG_INVALIDA (host/credenciais/porta), SIGSIT_LOGIN (autenticacao),
SIGSIT_REDE_PORTA (conexao), SIGSIT_TIMEOUT, SIGSIT_CERTIFICADO,
SIGSIT_SEM_PERMISSAO_SELECT, SIGSIT_TABELA_INEXISTENTE ou
SIGSIT_BANCO_INACESSIVEL. FROTA_VAZIA_INVALIDA_OU_DUPLICADA indica dados
incompativeis e CACHE_ERRO_DE_ARQUIVO indica falha de gravacao.
Nao registrar mensagens SQL brutas nem credenciais para investigar essas falhas.

## Consumidor: reserva da Escala

A API diaria le o cache local (sem consultar SIGSIT) e devolve reservaPorCor
com updatedAt e seis grupos. O calculo usa somente a reserva livre da
garagem selecionada, excluindo linhas, bloqueios e demais cards.
EXECUTIVO vai para MICRO; ausentes, NULL e NAO IDENTIFICADO vao para OUTRO.
Sem cache valido, updatedAt=null e grupos vazios, com aviso na interface.
Os antigos cards manuais de cor sao preservados no armazenamento, mas
nao ocupam carros e nao aceitam novas mutacoes. Sem alteracao de schema.
