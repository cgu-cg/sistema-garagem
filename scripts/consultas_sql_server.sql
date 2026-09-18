/***************************************************************************************************
 * SISTEMA GARAGEM - MAPEAMENTO GERAL DE COMANDOS SQL SERVER
 * 
 * Este script reúne todas as operações SQL (SELECT, INSERT, UPDATE, DELETE) executadas no SQL Server,
 * organizadas e detalhadas por página, tela e função no sistema.
 * 
 * O sistema utiliza o SQL Server em dois contextos:
 * 1. BANCO EXTERNO / BILHETAGEM (Consultas diretas via driver mssql / apps/api/src/services/mssql.ts)
 * 2. BANCO OPERACIONAL DO SISTEMA (Gerenciado via Prisma ORM com adapter SQL Server)
 ***************************************************************************************************/

-- =================================================================================================
-- PARTE 1: BANCO EXTERNO / BILHETAGEM ELETRÔNICA (QUERIES DIRETAS EM MSSQL)
-- =================================================================================================

----------------------------------------------------------------------------------------------------
-- 1. PÁGINA: CONFERÊNCIA DE CATRACAS (/catracas)
--    ABA: Consistência Diária de Turnos
--    ARQUIVO BACKEND: apps/api/src/services/mssql.ts -> queryConsistenciaCatraca()
--    FINALIDADE: Localizar inconsistências de catraca entre o final do 1º Turno (SV1) e início do 2º Turno (SV2)
----------------------------------------------------------------------------------------------------
-- Parâmetros:
-- @data: Data de operação no formato 'YYYY-MM-DD' (ex: '2026-09-18')
-- @diff: Diferença mínima de catraca para filtrar (ex: 0 para todos com diferença, ou 5)

DECLARE @data VARCHAR(10) = '2026-09-18';
DECLARE @diff INT = 1;

SELECT 
    idCarro, 
    Linha, 
    idSV1, 
    datainiSV1, 
    datafimSV1, 
    catracaFim, 
    idSV2, 
    datainiSV2, 
    datafimSV2, 
    catracaIni, 
    diff 
FROM fnConsisteCatracaVEICULOS(@data, @diff) 
ORDER BY idCarro;


----------------------------------------------------------------------------------------------------
-- 2. PÁGINA: CONFERÊNCIA DE CATRACAS (/catracas)
--    ABA: Datas Incorretas (Alertas de descalibração de relógio do validador)
--    ARQUIVO BACKEND: apps/api/src/services/mssql.ts -> queryDatasIncorretas()
--    FINALIDADE: Identificar registros de bilhetagem com ano inconsistente (diferente do ano atual ou virada de ano)
----------------------------------------------------------------------------------------------------
-- Parâmetros:
-- @startDate: Data limite inicial no formato 'DD/MM/YYYY' (ex: primeiro dia do mês anterior)
-- @anoAtual: Ano vigente (ex: '2026')

DECLARE @startDate VARCHAR(20) = '01/08/2026';
DECLARE @anoVigente VARCHAR(4) = '2026';

-- 2.1 - Consulta de Início de Serviço com data/ano inválido
SELECT 
    totalEDM, 
    catracaIni, 
    catracaFim, 
    idVeiculo, 
    dataHIni, 
    dataHFim, 
    dataHoraUL 
FROM TotalizadorServico ts 
WHERE dataHIni NOT LIKE '%' + @anoVigente + '%' 
  AND dataHoraUL >= @startDate 
ORDER BY ts.catracaFim;

-- 2.2 - Consulta de Fim de Serviço com data/ano inválido
SELECT 
    totalEDM, 
    catracaIni, 
    catracaFim, 
    idVeiculo, 
    dataHIni, 
    dataHFim, 
    dataHoraUL 
FROM TotalizadorServico ts 
WHERE dataHFim NOT LIKE '%' + @anoVigente + '%' 
  AND dataHoraUL >= @startDate 
ORDER BY ts.catracaFim;


----------------------------------------------------------------------------------------------------
-- 3. PÁGINA: CONFERÊNCIA DE CATRACAS (/catracas)
--    ABA: Veículos Fora da Frota
--    ARQUIVO BACKEND: apps/api/src/services/mssql.ts -> queryVeiculosForaFrota()
--    FINALIDADE: Detectar veículos operando que não pertencem à lista de frota cadastrada da empresa
----------------------------------------------------------------------------------------------------
-- Parâmetros:
-- @startDate: Data de corte inicial (ex: '01/08/2026')
-- Lista de prefixos da frota informada na cláusula NOT IN (...)

DECLARE @startDateFrota VARCHAR(20) = '01/08/2026';

-- 3.1 - Carros especiais fora da frota (prefixo >= 6999 e idLinha diferente de 888)
SELECT 
    totalEDM, 
    catracaIni, 
    catracaFim, 
    idVeiculo, 
    dataHIni, 
    dataHFim, 
    dataHoraUL 
FROM TotalizadorServico ts 
WHERE dataHoraUL >= @startDateFrota 
  AND idLinha <> '888'
  AND idVeiculo NOT IN (1000, 1108, 1201, 1301, 2319, 3003, 4178) -- Lista de veículos cadastrados
  AND idVeiculo >= 6999 
ORDER BY ts.dataHFim, ts.idVeiculo;

-- 3.2 - Carros comuns fora da frota (prefixo < 6000 e idLinha diferente de 888)
SELECT 
    totalEDM, 
    catracaIni, 
    catracaFim, 
    idVeiculo, 
    dataHIni, 
    dataHFim, 
    dataHoraUL 
FROM TotalizadorServico ts 
WHERE dataHoraUL >= @startDateFrota 
  AND idLinha <> '888'
  AND idVeiculo NOT IN (1000, 1108, 1201, 1301, 2319, 3003, 4178) -- Lista de veículos cadastrados
  AND idVeiculo < 6000 
ORDER BY ts.dataHFim, ts.idVeiculo;


----------------------------------------------------------------------------------------------------
-- 4. PÁGINA: CONFERÊNCIA DE CATRACAS (/catracas)
--    MODAL: Histórico de Serviços por Veículo
--    ARQUIVO BACKEND: apps/api/src/services/mssql.ts -> queryVeiculoServicos()
--    FINALIDADE: Listar todas as viagens e totalizadores de um veículo específico a partir de uma data
----------------------------------------------------------------------------------------------------
-- Parâmetros:
-- @idVeiculo: Prefixo do ônibus
-- @startDate: Data inicial de busca (formato 'YYYY-MM-DD' ou 'DD/MM/YYYY')

DECLARE @idVeiculo INT = 1201;
DECLARE @startDateServicos VARCHAR(20) = '2026-08-01';

SELECT 
    totalEDM, 
    catracaIni, 
    catracaFim, 
    idVeiculo, 
    dataHIni, 
    dataHFim, 
    dataHoraUL 
FROM TotalizadorServico ts 
WHERE idVeiculo = @idVeiculo 
  AND dataHoraUL >= @startDateServicos 
ORDER BY ts.dataHFim;


----------------------------------------------------------------------------------------------------
-- 5. PÁGINA: CONFERÊNCIA DE CATRACAS (/catracas)
--    ABA: Backup de Coletas (Validação de Backup de Validadores)
--    ARQUIVO BACKEND: apps/api/src/services/mssql.ts -> queryBackupStatus() e updateBackupStatus()
--    FINALIDADE: Consultar e atualizar as faixas de backup de bilhetagem na tabela Veiculos
----------------------------------------------------------------------------------------------------

-- 5.1 - CONSULTA (SELECT): Listar veículos em período de backup (ou veículos específicos)
SELECT 
    garagem AS garage, 
    coletaBKPIni, 
    coletaBKPFim, 
    emManutencao, 
    * 
FROM Veiculos 
WHERE coletaBKPIni IS NOT NULL 
-- OU para IDs específicos: WHERE idCarro IN (1118, 1327, 2701)
ORDER BY idCarro;

-- 5.2 - ATUALIZAÇÃO (UPDATE): Atualizar o período de backup de um lote de carros
-- Parâmetros:
-- @bkpIni: 'YYYY-MM-DD HH:mm:ss' (ex: '2026-08-01 03:00:00')
-- @bkpFim: 'YYYY-MM-DD HH:mm:ss' (ex: '2026-08-07 02:59:59')
-- Cláusula IN com os IDs dos carros selecionados na tela
UPDATE Veiculos 
SET coletaBKPIni = '2026-08-01 03:00:00', 
    coletaBKPFim = '2026-08-07 02:59:59' 
WHERE idCarro IN (1118, 1327, 2701);


----------------------------------------------------------------------------------------------------
-- 6. PÁGINA: CONFERÊNCIA DE CATRACAS (/catracas)
--    MODAL: Diagnóstico Completo de Inconsistência de Catraca
--    ARQUIVO BACKEND: apps/api/src/services/mssql.ts -> queryDetalhesVeiculo()
--    FINALIDADE: Realizar auditoria minuciosa: WiFi, erros no validador, diários, motorista e OS
----------------------------------------------------------------------------------------------------

DECLARE @carroDiagnostico INT = 1201;
DECLARE @dataDiagnostico VARCHAR(10) = '2026-09-18';
DECLARE @inicioTurno DATETIME = '2026-09-18 05:40:00';
DECLARE @fimTurno DATETIME = '2026-09-18 20:10:00';
DECLARE @catracaFimValor INT = 4520;
DECLARE @catracaIniValor INT = 4535;

-- 6.1 - Validação da inconsistência base
SELECT TOP 1 
    datainiSV1, 
    datafimSV2, 
    catracaFim, 
    catracaIni, 
    datainiSV2 
FROM fnConsisteCatracaVEICULOS(@dataDiagnostico, 1) 
WHERE idCarro = @carroDiagnostico;

-- 6.2 - Última comunicação Wi-Fi do veículo
SELECT TOP 1 
    DataHora AS UltimaComunicacao, 
    ArquivoUL, 
    CATRACA, 
    ulAtualNome, 
    MACValidador, 
    MACWiFi, 
    RemoteIP 
FROM tbLogWiFi 
WHERE DataHora > @inicioTurno 
  AND idCarro = @carroDiagnostico 
ORDER BY DataHora DESC;

-- 6.3 - Logs de evento de erro do validador (Código 154)
SELECT 
    idCartao, 
    catraca, 
    Datahora 
FROM tbLogEventoErro 
WHERE Datahora > @inicioTurno 
  AND codErro = 154 
  AND tipo = @carroDiagnostico 
ORDER BY Datahora DESC;

-- 6.4 - Primeiras leituras da catraca no fim do 1º turno
SELECT TOP 2 
    catraca AS CATRACA, 
    MACValidador, 
    DataHora 
FROM tbLogWiFi 
WHERE idCarro = @carroDiagnostico 
  AND catraca = @catracaFimValor 
ORDER BY DataHora DESC;

-- 6.5 - Últimas leituras da catraca no início do 2º turno
SELECT TOP 2 
    catraca AS CATRACA, 
    MACValidador, 
    DataHora 
FROM tbLogWiFi 
WHERE idCarro = @carroDiagnostico 
  AND catraca = @catracaIniValor 
ORDER BY DataHora;

-- 6.6 - Todos os serviços do período com dados do motorista vinculado
DECLARE @INICIO_DIA DATETIME = CAST(CONVERT(DATE, @inicioTurno) AS DATETIME);
DECLARE @FIM_DIA DATETIME = DATEADD(SECOND, -1, DATEADD(DAY, 1, CAST(CONVERT(DATE, @fimTurno) AS DATETIME)));

SELECT 
    ts.totalEDM, 
    ts.catracaIni, 
    ts.catracaFim, 
    ts.idVeiculo, 
    ts.idLinha AS linha,
    COALESCE(f.Nome, CAST(ts.matMotorista AS VARCHAR), ts.idMotorista) AS motorista,
    ts.dataHIni, 
    ts.dataHFim, 
    ts.dataHoraUL 
FROM TotalizadorServico ts 
OUTER APPLY (
    SELECT TOP 1 Nome 
    FROM Funcionario 
    WHERE CAST(idCartao AS VARCHAR) = ts.idMotorista 
       OR (ts.matMotorista IS NOT NULL AND ts.matMotorista > 0 AND Matricula = ts.matMotorista AND idEmpresa = ts.idEmpresa)
) f
WHERE ts.idVeiculo = @carroDiagnostico 
  AND ts.dataHIni BETWEEN @INICIO_DIA AND @FIM_DIA 
ORDER BY ts.dataHFim;

-- 6.7 - Última Ordem de Serviço de manutenção de bilhetagem para o veículo
SELECT TOP 1 
    Id, 
    DataHora, 
    Carro, 
    LoginAbertura, 
    NomeLoginAbertura, 
    DatahoraFinalizacao,
    CASE 
        WHEN DatahoraFinalizacao IS NOT NULL THEN 'Encerrada' 
        WHEN EmExecucao = 1 THEN 'Em Execução' 
        ELSE 'Aberta' 
    END AS status
FROM ManutencaoOrdemServico 
WHERE Carro = @carroDiagnostico 
  AND DataHora >= DATEADD(DAY, -5, @inicioTurno)
ORDER BY Id DESC;

-- 6.8 - Itens de defeito da Ordem de Serviço encontrada
-- (@idOS obtido do resultado da consulta 6.7)
DECLARE @idOS INT = 12345;
SELECT * 
FROM ManutencaoOrdemServicoItens 
WHERE IdOrdemServico = @idOS;


----------------------------------------------------------------------------------------------------
-- 7. PÁGINA: CONTROLE OPERACIONAL (/controle-operacional)
--    CONSULTAS DE APOIO: Veículos e Linhas Cadastrados no SQL Server
--    ARQUIVO BACKEND: apps/api/src/services/mssql.ts -> queryVeiculosSelect() e queryLinhasSelect()
--    FINALIDADE: Carregar a lista de prefixos de carros e linhas nos selects do formulário de vistoria
----------------------------------------------------------------------------------------------------

-- 7.1 - Select de Veículos Operacionais Ativos
SELECT idCarro 
FROM Veiculos 
WHERE ativo = 1 
  AND idCarro < 6000 
  AND idCarro NOT IN (1999, 2999, 3999, 4999) 
ORDER BY idCarro;

-- 7.2 - Select de Linhas Operacionais Ativas
SELECT CONCAT(id, ' - ', Descricao) AS descricao 
FROM Linha 
WHERE id NOT IN (145, 146, 147, 678, 900, 901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912, 913, 914, 915, 000, 004) 
ORDER BY Id;


-- =================================================================================================
-- PARTE 2: BANCO OPERACIONAL DO SISTEMA GARAGEM (TABELAS GERENCIADAS PELO PRISMA ORM NO SQL SERVER)
-- =================================================================================================

----------------------------------------------------------------------------------------------------
-- 8. PÁGINA: CONTROLE OPERACIONAL (/controle-operacional)
--    TABELA: controleOperacional
--    ARQUIVO BACKEND: apps/api/src/controllers/controleOperacional.ts
--    FINALIDADE: Cadastro, visualização, edição e exclusão de vistorias com 3 fotos dos veículos
----------------------------------------------------------------------------------------------------

-- 8.1 - CONSULTA (SELECT): Listar vistorias cadastradas com filtro por data e garagem
SELECT 
    co.id,
    co.carro,
    co.linha,
    co.garagem,
    co.foto1,
    co.foto2,
    co.foto3,
    co.data_insercao,
    co.user_id,
    u.name AS usuario_nome,
    u.email AS usuario_email
FROM controleOperacional co
INNER JOIN users u ON co.user_id = u.id
WHERE co.data_insercao >= '2026-09-18 00:00:00' 
  AND co.data_insercao <= '2026-09-18 23:59:59'
  AND (co.garagem = 'VCG' OR 'VCG' IS NULL)
ORDER BY co.data_insercao DESC;

-- 8.2 - INSERÇÃO (INSERT): Cadastrar nova vistoria veicular com fotos
INSERT INTO controleOperacional (carro, linha, garagem, foto1, foto2, foto3, data_insercao, user_id)
VALUES ('1201', '501 - Circular Centro', 'VCG', 
        '/api/uploads/controle-operacional/1201_20260918_140000.jpg', 
        '/api/uploads/controle-operacional/1201_1_20260918_140000.jpg', 
        '/api/uploads/controle-operacional/1201_2_20260918_140000.jpg', 
        GETDATE(), 1);

-- 8.3 - ATUALIZAÇÃO (UPDATE): Editar dados ou fotos de uma vistoria existente
UPDATE controleOperacional
SET carro = '1201',
    linha = '501 - Circular Centro',
    garagem = 'VCG',
    foto1 = '/api/uploads/controle-operacional/1201_20260918_141000.jpg',
    foto2 = '/api/uploads/controle-operacional/1201_1_20260918_141000.jpg',
    foto3 = '/api/uploads/controle-operacional/1201_2_20260918_141000.jpg'
WHERE id = 10;

-- 8.4 - EXCLUSÃO (DELETE): Excluir vistoria veicular
DELETE FROM controleOperacional
WHERE id = 10;


----------------------------------------------------------------------------------------------------
-- 9. PÁGINA: GESTÃO DE SOLTURA E PRANCHETA DIGITAL (/soltura)
--    TABELA: solturas
--    ARQUIVO BACKEND: apps/api/src/controllers/soltura.ts
--    FINALIDADE: Liberação, despacho e substituição de ônibus na pista e acompanhamento do quadro
----------------------------------------------------------------------------------------------------

-- 9.1 - CONSULTA (SELECT): Listar solturas por período/data de operação e garagem
SELECT 
    s.id,
    s.schedule_id,
    s.carro_programado,
    s.carro_realizado,
    s.linha,
    s.tabela,
    s.driver_code,
    s.motorista,
    s.saida_garagem,
    s.inicio_linha,
    s.hora_liberacao,
    s.garagem,
    s.turno,
    s.escala_tipo,
    s.data_operacao,
    s.substituido,
    s.historico_trocas,
    s.status,
    s.observacoes,
    s.user_id,
    s.created_at
FROM solturas s
WHERE s.data_operacao = '2026-09-18' 
  AND s.garagem = 'VCG'
ORDER BY s.saida_garagem ASC;

-- 9.2 - INSERÇÃO (INSERT): Registrar nova liberação/despacho de veículo
INSERT INTO solturas (
    bus_id, programmed_bus_id, schedule_id, carro_programado, carro_realizado,
    linha, tabela, driver_code, motorista, saida_garagem, inicio_linha,
    hora_liberacao, garagem, turno, escala_tipo, data_operacao, status,
    observacoes, user_id, created_at
)
VALUES (
    1, 1, 'SCH_001', '1201', '1201',
    '501', '01', 'MOT123', 'CARLOS SILVA', '05:30', '06:00',
    '05:25', 'VCG', 'MANHA', 'REGULAR', '2026-09-18', 'LIBERADO',
    'Veículo liberado no horário', 1, GETDATE()
);

-- 9.3 - ATUALIZAÇÃO (UPDATE): Substituição de carro/motorista ou cancelamento de soltura
UPDATE solturas
SET carro_realizado = '1204',
    substituido = 1,
    historico_trocas = 'Carro trocado de 1201 para 1204 por falha de ar condicionado',
    status = 'SUBSTITUIDO'
WHERE id = 5;


----------------------------------------------------------------------------------------------------
-- 10. PÁGINA: GESTÃO DE SOLTURA (/soltura) - PRANCHETA DIGITAL DE RESERVAS
--     TABELA: reservas_terminais
--     ARQUIVO BACKEND: apps/api/src/controllers/reservasTerminais.ts
--     FINALIDADE: Registrar e gerenciar carros reservas alocados em terminais
----------------------------------------------------------------------------------------------------

-- 10.1 - CONSULTA (SELECT): Listar reservas do dia por garagem
SELECT 
    rt.id,
    rt.carro,
    rt.tipo,
    rt.terminal,
    rt.datahora,
    rt.garagem,
    rt.user_id,
    u.name AS usuario_nome
FROM reservas_terminais rt
LEFT JOIN users u ON rt.user_id = u.id
WHERE rt.garagem = 'VCG'
  AND CAST(rt.datahora AS DATE) = '2026-09-18'
ORDER BY rt.datahora DESC;

-- 10.2 - INSERÇÃO (INSERT): Adicionar carro reserva em terminal
INSERT INTO reservas_terminais (carro, tipo, terminal, garagem, datahora, user_id, created_at)
VALUES ('1260', 'AZUL', 'Terminal Central', 'VCG', GETDATE(), 1, GETDATE());

-- 10.3 - EXCLUSÃO (DELETE): Liberar/remover carro reserva do terminal
DELETE FROM reservas_terminais
WHERE id = 3;


----------------------------------------------------------------------------------------------------
-- 11. PÁGINA: MEDIÇÃO DE ABASTECIMENTO / TANQUES (/abastecimento)
--     TABELA: abastecimentos
--     ARQUIVO BACKEND: apps/api/src/controllers/abastecimento.ts
--     FINALIDADE: Registrar a medição estática dos tanques de combustível da garagem (T1, T2 e T3)
----------------------------------------------------------------------------------------------------

-- 11.1 - CONSULTA (SELECT): Listar medições de tanques com filtros de período
SELECT 
    a.id,
    a.litros_t1,
    a.foto_t1,
    a.litros_t2,
    a.foto_t2,
    a.litros_t3,
    a.foto_t3,
    a.garagem,
    a.user_id,
    a.created_at,
    u.name AS usuario_nome
FROM abastecimentos a
INNER JOIN users u ON a.user_id = u.id
WHERE a.created_at >= '2026-09-01 00:00:00' 
  AND a.created_at <= '2026-09-18 23:59:59'
ORDER BY a.created_at DESC;

-- 11.2 - INSERÇÃO (INSERT): Registrar nova medição de tanques com fotos
INSERT INTO abastecimentos (litros_t1, foto_t1, litros_t2, foto_t2, litros_t3, foto_t3, garagem, user_id, created_at)
VALUES (15200.50, '/api/uploads/abastecimento/t1_20260918.jpg', 
        14800.00, '/api/uploads/abastecimento/t2_20260918.jpg', 
        NULL, NULL, 'VCG', 1, GETDATE());


----------------------------------------------------------------------------------------------------
-- 12. PÁGINA: ABASTECIMENTO POR CARRO / PISTA (/abastecimento-carro)
--     TABELAS: abastecimento_carro_sessions, abastecimento_carro_items
--     ARQUIVO BACKEND: apps/api/src/controllers/abastecimentoCarro.ts
--     FINALIDADE: Sessão de abastecimento do frentista, controle de bombas B1-B6 e registros por ônibus
----------------------------------------------------------------------------------------------------

-- 12.1 - CONSULTA (SELECT): Buscar sessão ativa em andamento do frentista
SELECT * 
FROM abastecimento_carro_sessions 
WHERE status = 'EM_ANDAMENTO' 
  AND user_id = 1;

-- 12.2 - INSERÇÃO (INSERT): Abrir nova sessão de abastecimento com leituras iniciais das bombas
INSERT INTO abastecimento_carro_sessions (
    matricula, dth_ini_abastec, status, garagem,
    b1_ini, b2_ini, b3_ini, b4_ini, b5_ini, b6_ini,
    user_id, created_at
)
VALUES (
    'FRENT01', GETDATE(), 'EM_ANDAMENTO', 'VCG',
    10540.20, 20310.50, 5420.00, NULL, NULL, NULL,
    1, GETDATE()
);

-- 12.3 - INSERÇÃO (INSERT): Lançar abastecimento individual de um ônibus na sessão
INSERT INTO abastecimento_carro_items (session_id, carro, litros, bomba, foto, matricula, garagem, data_hora)
VALUES (1, '1201', 120.50, 'B.01', '/api/uploads/abastecimento-carro/1201_b1.jpg', 'FRENT01', 'VCG', GETDATE());

-- 12.4 - ATUALIZAÇÃO (UPDATE): Finalizar a sessão informando as leituras finais das bombas
UPDATE abastecimento_carro_sessions
SET dth_fim_abastec = GETDATE(),
    status = 'FINALIZADO',
    b1_fim = 11200.00,
    b2_fim = 20850.00,
    b3_fim = 5900.00
WHERE id = 1;

-- 12.5 - CONSULTA (SELECT): Listar histórico de sessões finalizadas com contagem e soma de litros
SELECT 
    s.id,
    s.matricula,
    s.dth_ini_abastec,
    s.dth_fim_abastec,
    s.status,
    s.garagem,
    COUNT(i.id) AS total_carros_abastecidos,
    COALESCE(SUM(i.litros), 0) AS total_litros_abastecidos
FROM abastecimento_carro_sessions s
LEFT JOIN abastecimento_carro_items i ON s.id = i.session_id
GROUP BY s.id, s.matricula, s.dth_ini_abastec, s.dth_fim_abastec, s.status, s.garagem
ORDER BY s.dth_ini_abastec DESC;


----------------------------------------------------------------------------------------------------
-- 13. PÁGINA: AUTENTICAÇÃO E GESTÃO DE USUÁRIOS (/admin/usuarios, /)
--     TABELA: users
--     ARQUIVOS BACKEND: apps/api/src/controllers/auth.ts, apps/api/src/controllers/users.ts
--     FINALIDADE: Autenticação de colaboradores e gerenciamento de perfis de acesso
----------------------------------------------------------------------------------------------------

-- 13.1 - CONSULTA (SELECT): Login e validação de sessão por e-mail
SELECT id, name, email, password, role, garagem, created_at, updated_at 
FROM users 
WHERE email = 'admin@teste.com';

-- 13.2 - CONSULTA (SELECT): Listar todos os colaboradores cadastrados
SELECT id, name, email, role, garagem, created_at, updated_at 
FROM users 
ORDER BY name ASC;

-- 13.3 - INSERÇÃO (INSERT): Criar novo usuário
INSERT INTO users (name, email, password, role, garagem, created_at, updated_at)
VALUES ('Fiscal da Garagem', 'fiscal@teste.com', '$2a$10$hashSenhaCriptografada...', 'COLABORADOR_SOLTURA', 'VCG', GETDATE(), GETDATE());

-- 13.4 - ATUALIZAÇÃO (UPDATE): Alterar dados/perfil de usuário
UPDATE users
SET name = 'Fiscal da Garagem Atualizado',
    role = 'COLABORADOR_SOLTURA',
    garagem = 'VCG',
    updated_at = GETDATE()
WHERE id = 2;

-- 13.5 - EXCLUSÃO (DELETE): Excluir usuário
DELETE FROM users
WHERE id = 2;


----------------------------------------------------------------------------------------------------
-- 14. PÁGINA: FROTA DE ÔNIBUS (Apoio à Soltura e Cadastros)
--     TABELA: buses
--     ARQUIVO BACKEND: apps/api/src/controllers/buses.ts
--     FINALIDADE: Cadastro e consulta de prefixos, placas e modelos da frota
----------------------------------------------------------------------------------------------------

-- 14.1 - CONSULTA (SELECT): Listar todos os ônibus cadastrados ordenados por prefixo
SELECT id, placa, prefixo, modelo, created_at, updated_at 
FROM buses 
ORDER BY prefixo ASC;

-- 14.2 - INSERÇÃO (INSERT): Cadastrar novo ônibus
INSERT INTO buses (placa, prefixo, modelo, created_at, updated_at)
VALUES ('ABC-1234', '1201', 'Mercedes-Benz OF-1721', GETDATE(), GETDATE());


----------------------------------------------------------------------------------------------------
-- 15. PÁGINA: GESTÃO DE GRUPOS E PERMISSÕES (/admin/grupos)
--     TABELA: groups
--     ARQUIVO BACKEND: apps/api/src/controllers/groups.ts
--     FINALIDADE: Gerenciar papéis e permissões de rotas de tela dinamicamente
----------------------------------------------------------------------------------------------------

-- 15.1 - CONSULTA (SELECT): Listar grupos e permissões
SELECT id, name, description, permissions, created_at, updated_at 
FROM groups 
ORDER BY name ASC;

-- 15.2 - INSERÇÃO (INSERT): Criar novo grupo de permissões
INSERT INTO groups (name, description, permissions, created_at, updated_at)
VALUES ('Fiscais de Pista', 'Acesso ao módulo de soltura e controle', '["/home", "/soltura", "/controle-operacional"]', GETDATE(), GETDATE());

-- 15.3 - ATUALIZAÇÃO (UPDATE): Atualizar permissões do grupo
UPDATE groups
SET permissions = '["/home", "/soltura", "/controle-operacional", "/abastecimento-carro"]',
    updated_at = GETDATE()
WHERE id = 1;

-- 15.4 - EXCLUSÃO (DELETE): Excluir grupo
DELETE FROM groups
WHERE id = 1;
