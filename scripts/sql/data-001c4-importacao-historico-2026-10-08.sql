-- DATA-001C4: candidato de importacao historica VCG, SOMENTE PARA REVISAO. NAO EXECUTADO.
-- SQL Server 2012. Executar futuramente apenas pelo responsavel, com banco alvo/backup confirmados.
-- Fontes exclusivas: CI-08-10-2026.xlsx em importes/, aba Preenchido; somente 08/10.
-- Fotografias independentes: nao criar ciclos, manutencao, linhagem ou timestamps operacionais.
-- Auditoria tecnica: SYSUTCDATETIME no instante da insercao, nunca representa evento historico.
-- Chaves de item deterministicas: primeiros 128 bits SHA256 de DATA-001C4|arquivo|Preenchido|celula|categoria.
-- Strings preservadas exceto D6, J22 e D5 pelas autorizacoes especificas abaixo.
-- Motivos em varias celulas da mesma linha concatenados em ordem, separados por um espaco.
-- IMPORTANTE: executar o arquivo INTEIRO; nao selecionar trechos. Nenhum GO/transacao parcial.
-- A existencia de qualquer folha VCG em 08/10/2026 impede toda a carga, sem substituir registros.
-- Manter o scheduler C4 VCG desabilitado durante a importacao; validar antes da primeira ativacao.

IF @@TRANCOUNT > 0
BEGIN
    RAISERROR('Execute fora de transacao existente; a transacao do chamador sera preservada.',16,1);
    RETURN;
END;
IF (@@OPTIONS & 2) = 2
BEGIN
    RAISERROR('IMPLICIT_TRANSACTIONS deve estar OFF.',16,1);
    RETURN;
END;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;
SET NOCOUNT ON;


-- FONTE CI-08-10-2026.xlsx | aba=Preenchido | SHA256=7dca091d37ccc6c094f05e206f8cd33bc449e5b5dd2ab307731e3f0d9f82d882
-- CORRECAO CI-08-10-2026.xlsx!Preenchido!D6 | categoria=PREVENTIVA | sub_tipo=Lubrificação | original=30326 | corrigido=3026 | justificativa=correcao operacional desta ocorrencia expressamente aprovada pelo responsavel; C23=3026 permanece independente
-- FALLBACK CI-08-10-2026.xlsx!Preenchido!L48 | prefixo=3083 | consorciada=VCM | original=NULL | motivo=ausente | importada=2026-10-01 | autorizacao expressa
-- FALLBACK CI-08-10-2026.xlsx!Preenchido!L50 | prefixo=1322 | consorciada=VCM | original=46334 (2026-11-08) | motivo=futura | importada=2026-10-01 | autorizacao expressa
-- NORMALIZACAO CI-08-10-2026.xlsx!Preenchido!J22 | original=INSPEÇÂO | importado=INSPEÇÃO | somente cabecalho; motivos INSPEÇÂO preservados | autorizacao expressa
-- NORMALIZACAO CI-08-10-2026.xlsx!Preenchido!D5 | original="Lubrificação " | importado="Lubrificação" | itens=D6,D7,D8 | somente espaco final do cabecalho historico para valor canonico do dominio | autorizacao expressa
-- EXCLUIDAS A28,B28,F28,G28: horarios/motivos sem prefixos C28/H28; slots FIXO 6/12 vazios.
-- EXCLUIDA N46=24: formula COUNT(A47:A54,A35:A44,G35:G44) nao inclui os quatro VCM; nao gera item.
-- Espacos finais de motivos (B47="SUSPENSÃO ", C40="LONAS DE FREIO ") preservados.
-- Nenhum timestamp operacional historico inventado; nenhum ciclo/estado criado.
DECLARE @dias TABLE (data_folha date PRIMARY KEY, arquivo nvarchar(255) NOT NULL, titulo nvarchar(30) NOT NULL,
    preventiva int NOT NULL, oficina int NOT NULL, fixo int NOT NULL, extra int NOT NULL,
    vsf int NOT NULL, vcg int NOT NULL, jtu int NOT NULL, vcm int NOT NULL);
INSERT INTO @dias VALUES
(CONVERT(date,'20261008',112),N'CI-08-10-2026.xlsx',N'INSPEÇÃO',6,29,10,4,6,10,8,4);

DECLARE @itens TABLE (data_folha date NOT NULL, celula nvarchar(10) NOT NULL, chave_item uniqueidentifier NOT NULL,
    categoria nvarchar(20) NOT NULL, tipo_posicao nvarchar(10) NULL, ordem_posicao int NULL,
    prefixo nvarchar(10) NOT NULL, consorciada nvarchar(10) NULL, sub_tipo nvarchar(50) NULL,
    horario_reforco nvarchar(20) NULL, motivo nvarchar(255) NULL, observacoes nvarchar(255) NULL,
    data_bloqueio date NULL, PRIMARY KEY(data_folha,chave_item));
-- Cada registro tem proveniencia arquivo (via @dias) + aba Preenchido + celula do prefixo.
INSERT INTO @itens (data_folha,celula,chave_item,categoria,tipo_posicao,ordem_posicao,prefixo,consorciada,sub_tipo,horario_reforco,motivo,observacoes,data_bloqueio) VALUES
(CONVERT(date,'20261008',112),N'D6',N'b3b1967a-ca48-8294-dadc-f67652ff358e',N'PREVENTIVA',NULL,NULL,N'3026',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'G6',N'7725699f-6439-4373-b7f4-65dfad610c28',N'PREVENTIVA',NULL,NULL,N'3205',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'D7',N'62a9990a-b0fa-b74a-ddd2-180d2680a2c1',N'PREVENTIVA',NULL,NULL,N'3957',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'G7',N'a874f39e-449b-19a7-d7e7-7c064b2804a0',N'PREVENTIVA',NULL,NULL,N'4243',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'D8',N'6dde8fc8-a325-b22c-f913-3b133e064668',N'PREVENTIVA',NULL,NULL,N'3208',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'G8',N'f4a0b5dc-cea5-1859-936f-eec027fdae0f',N'PREVENTIVA',NULL,NULL,N'4258',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'A12',N'a31296c5-a3ff-6589-72fc-700a710b9e03',N'OFICINA',NULL,NULL,N'2704',NULL,N'Mecânica',NULL,N'BOMBA ARLA',NULL,NULL),
(CONVERT(date,'20261008',112),N'C12',N'45d29ce4-66bf-fffe-5776-8a30b647c88f',N'OFICINA',NULL,NULL,N'3951',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'D12',N'9e0b392b-587c-1227-a630-ca3f400d083c',N'OFICINA',NULL,NULL,N'3100',NULL,N'Elétrica',NULL,N'MODULO',NULL,NULL),
(CONVERT(date,'20261008',112),N'G12',N'5aa8b207-d78b-2c58-933e-330ba9516f97',N'OFICINA',NULL,NULL,N'3147',NULL,N'Funilaria / Pintura',NULL,N'BANCO',NULL,NULL),
(CONVERT(date,'20261008',112),N'J12',N'69a6cdcd-da1c-8b51-4777-2a672e468cae',N'OFICINA',NULL,NULL,N'23',NULL,N'Bilhetagem',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'A13',N'4110a082-ee18-b22d-35ae-ce3309e52428',N'OFICINA',NULL,NULL,N'3222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261008',112),N'C13',N'6a02d605-5fa7-983a-0fea-3744f7b7881d',N'OFICINA',NULL,NULL,N'2514',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'D13',N'e0ee289a-705e-494a-1b93-9358dcdf1100',N'OFICINA',NULL,NULL,N'2623',NULL,N'Elétrica',NULL,N'LIMPADOR',NULL,NULL),
(CONVERT(date,'20261008',112),N'F13',N'759a95a0-0007-e2b7-6c22-fb6c91009705',N'OFICINA',NULL,NULL,N'4270',NULL,N'Borracharia',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'J13',N'9408ee8a-d744-97c5-35e2-e6c84269c57b',N'OFICINA',NULL,NULL,N'3021',NULL,N'Bilhetagem',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'A14',N'019e232d-a91a-7942-87e4-216dfd1c91a9',N'OFICINA',NULL,NULL,N'4244',NULL,N'Mecânica',NULL,N'M DE EIXO',NULL,NULL),
(CONVERT(date,'20261008',112),N'C14',N'b2214a26-6678-97f8-1464-cc83d3a452d1',N'OFICINA',NULL,NULL,N'3139',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'D14',N'527a1914-518f-848b-6fc8-617350e7dc5a',N'OFICINA',NULL,NULL,N'4189',NULL,N'Elétrica',NULL,N'LIMPADOR',NULL,NULL),
(CONVERT(date,'20261008',112),N'F14',N'5039eba6-40f6-233b-0679-027a888424e5',N'OFICINA',NULL,NULL,N'2410',NULL,N'Borracharia',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'G14',N'22ffa540-af92-c8f9-8ab8-8c762fdf4516',N'OFICINA',NULL,NULL,N'4227',NULL,N'Funilaria / Pintura',NULL,N'PARACHOQUE',NULL,NULL),
(CONVERT(date,'20261008',112),N'J14',N'f487ba43-536a-7400-90a3-abd3aa016bbc',N'OFICINA',NULL,NULL,N'3254',NULL,N'Bilhetagem',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'A15',N'99268636-276a-f413-4bac-c962ab230816',N'OFICINA',NULL,NULL,N'4222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261008',112),N'C15',N'ffa229b2-c985-e5d8-b03d-81143dc8b5e6',N'OFICINA',NULL,NULL,N'4196',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'G15',N'1d21bab5-ec30-ba57-dfbe-a44f172722a8',N'OFICINA',NULL,NULL,N'4245',NULL,N'Funilaria / Pintura',NULL,N'BANCO PSG',NULL,NULL),
(CONVERT(date,'20261008',112),N'A16',N'4621e26d-2455-cf95-e3ea-3462102d28cc',N'OFICINA',NULL,NULL,N'4197',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261008',112),N'C16',N'08acce3c-084d-1079-6d71-a0a778de0f39',N'OFICINA',NULL,NULL,N'4222',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'A17',N'bd6e2cb0-a2f9-d01e-3190-84d816edd1c2',N'OFICINA',NULL,NULL,N'4225',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261008',112),N'C17',N'7e4ecbb1-e0a0-fe76-dbae-752da370e015',N'OFICINA',NULL,NULL,N'2426',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'A18',N'6ea784e5-75f6-1349-6a77-53a8b2649f40',N'OFICINA',NULL,NULL,N'2425',NULL,N'Mecânica',NULL,N'VAZ OLEO',NULL,NULL),
(CONVERT(date,'20261008',112),N'C18',N'e94c091b-ff00-6155-6882-904d7272e897',N'OFICINA',NULL,NULL,N'4209',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'A19',N'29f6f5ba-81ae-08f6-3f59-654b23e3e67f',N'OFICINA',NULL,NULL,N'2352',NULL,N'Mecânica',NULL,N'POTENCIA',NULL,NULL),
(CONVERT(date,'20261008',112),N'C19',N'cbaa4864-16b1-3cdd-2549-3b3c77ce8ec0',N'OFICINA',NULL,NULL,N'3271',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'A20',N'32e0eda3-eeaa-c94d-f9bb-2ae8f844dc62',N'OFICINA',NULL,NULL,N'4224',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261008',112),N'C20',N'240b4b7c-9b52-317c-b1b6-813a74d1dcbf',N'OFICINA',NULL,NULL,N'4193',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'C23',N'f4372952-e8c8-e28c-178b-5a559f70d17e',N'REFORCO',N'FIXO',1,N'3026',NULL,NULL,N'07:15 - A',N'LUBRIFICAÇÃO',NULL,NULL),
(CONVERT(date,'20261008',112),N'H23',N'b5217e9a-bbae-1657-028c-c21092714c28',N'REFORCO',N'FIXO',7,N'3205',NULL,NULL,N'07:40 - C',N'TROCA DE ÓLEO',NULL,NULL),
(CONVERT(date,'20261008',112),N'J23',N'ee77bfd7-320a-be48-ab4a-d31e248828ee',N'REFORCO',N'EXTRA',1,N'3902',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'C24',N'ac2097cf-01cc-4551-0fcf-ae01b125ab6b',N'REFORCO',N'FIXO',2,N'3957',NULL,NULL,N'07:15 - A',N'LUBRIFICAÇÃO',NULL,NULL),
(CONVERT(date,'20261008',112),N'H24',N'f6abd685-3679-3a64-18b4-3531776832df',N'REFORCO',N'FIXO',8,N'4243',NULL,NULL,N'07:45 - C',N'TROCA DE ÓLEO',NULL,NULL),
(CONVERT(date,'20261008',112),N'J24',N'b02c3090-e046-85db-a427-92a3e01ed058',N'REFORCO',N'EXTRA',2,N'4257',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'C25',N'7757a06d-192c-40ca-5fc0-5e11f3ac3e74',N'REFORCO',N'FIXO',3,N'3208',NULL,NULL,N'07:32 - A',N'LUBRIFICAÇÃO',NULL,NULL),
(CONVERT(date,'20261008',112),N'H25',N'a479e387-8e85-1f50-5036-7fba5005775a',N'REFORCO',N'FIXO',9,N'4258',NULL,NULL,N'07:45 - A',N'TROCA DE ÓLEO',NULL,NULL),
(CONVERT(date,'20261008',112),N'J25',N'2fa665e0-8051-64dd-b255-e1bf2f1ab46b',N'REFORCO',N'EXTRA',3,N'3273',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'C26',N'f97b5105-045b-65d7-e7ca-d8a702491dbf',N'REFORCO',N'FIXO',4,N'3273',NULL,NULL,N'07:40 - A',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261008',112),N'H26',N'ae0fecee-b247-eb47-b7b4-1ae9e3aa1398',N'REFORCO',N'FIXO',10,N'3902',NULL,NULL,N'07:50 - C',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261008',112),N'J26',N'83a710e6-af0a-11ae-4e2f-18d7c1de0797',N'REFORCO',N'EXTRA',4,N'3283',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261008',112),N'C27',N'2da3e13e-a63f-2099-cfca-01ecdadbca6d',N'REFORCO',N'FIXO',5,N'4257',NULL,NULL,N'07:40 - M',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261008',112),N'H27',N'4cb04594-2801-fa8c-554c-9235cacf9caf',N'REFORCO',N'FIXO',11,N'3283',NULL,NULL,N'07:50 - C',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261008',112),N'A35',N'c6c999d5-3986-798e-5702-ab152a8dead4',N'BLOQUEADO',NULL,NULL,N'2424',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260603',112)),
(CONVERT(date,'20261008',112),N'A36',N'24adf9b5-44d8-fbb5-ccd2-e52d9fab7299',N'BLOQUEADO',NULL,NULL,N'2600',N'VSF',NULL,NULL,N'ELÉTRICA',NULL,CONVERT(date,'20260106',112)),
(CONVERT(date,'20261008',112),N'A37',N'da450da8-da69-d543-eeaf-0ab43ab264ec',N'BLOQUEADO',NULL,NULL,N'2800',N'VSF',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20260103',112)),
(CONVERT(date,'20261008',112),N'A38',N'54d06bb0-fa39-0371-8f23-4d51ab0330fa',N'BLOQUEADO',NULL,NULL,N'2611',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260825',112)),
(CONVERT(date,'20261008',112),N'A39',N'3fd792a1-72a1-4487-b456-b83bd8cf7956',N'BLOQUEADO',NULL,NULL,N'2712',N'VSF',NULL,NULL,N'VALVULAS',NULL,CONVERT(date,'20261007',112)),
(CONVERT(date,'20261008',112),N'A40',N'f7343c63-5896-8220-165c-855626087fa3',N'BLOQUEADO',NULL,NULL,N'2320',N'VSF',NULL,NULL,N'LONAS DE FREIO ',NULL,CONVERT(date,'20261007',112)),
(CONVERT(date,'20261008',112),N'G35',N'd6f89013-9dbe-bc5b-71c8-bb5b4982b48c',N'BLOQUEADO',NULL,NULL,N'4199',N'VCG',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240503',112)),
(CONVERT(date,'20261008',112),N'G36',N'1af25046-9597-d6e3-b266-195f984bc483',N'BLOQUEADO',NULL,NULL,N'4200',N'VCG',NULL,NULL,N'TRANSMISSÃO',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261008',112),N'G37',N'434a3b60-5d7e-0321-c6a7-eb16ee79ca5d',N'BLOQUEADO',NULL,NULL,N'4201',N'VCG',NULL,NULL,N'MECANICA PASTILHS E DISCO DE FREIO',NULL,CONVERT(date,'20260628',112)),
(CONVERT(date,'20261008',112),N'G38',N'e36a640d-cfa7-b2e6-39ab-63cc0a87065f',N'BLOQUEADO',NULL,NULL,N'4190',N'VCG',NULL,NULL,N'VIDRO BOLHA',NULL,CONVERT(date,'20260820',112)),
(CONVERT(date,'20261008',112),N'G39',N'1d44ac0a-592e-8f98-32a4-5c75c462ffbd',N'BLOQUEADO',NULL,NULL,N'4255',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260824',112)),
(CONVERT(date,'20261008',112),N'G40',N'4187da59-42ce-af5e-ca0a-4559dc7c31e6',N'BLOQUEADO',NULL,NULL,N'4211',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261008',112),N'G41',N'910beeda-5e18-e39d-f843-ada4813fdb9b',N'BLOQUEADO',NULL,NULL,N'4248',N'VCG',NULL,NULL,N'AR E EMBREAGEM',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261008',112),N'G42',N'9d732fa6-f18f-632d-b110-afa155a28eb3',N'BLOQUEADO',NULL,NULL,N'4196',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260827',112)),
(CONVERT(date,'20261008',112),N'G43',N'3710bc5a-aa11-10d8-1a7c-67ea02152251',N'BLOQUEADO',NULL,NULL,N'4253',N'VCG',NULL,NULL,N'REVISÂO',NULL,CONVERT(date,'20261007',112)),
(CONVERT(date,'20261008',112),N'G44',N'3b1655a0-6070-ff57-1281-014a51c6abb2',N'BLOQUEADO',NULL,NULL,N'4257',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260921',112)),
(CONVERT(date,'20261008',112),N'A47',N'4c9c3a16-ced8-7b80-b815-7fc497552e6f',N'BLOQUEADO',NULL,NULL,N'3005',N'JTU',NULL,NULL,N'SUSPENSÃO ',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261008',112),N'A48',N'c944e8ee-8727-2d0a-7e61-a09afa0d7440',N'BLOQUEADO',NULL,NULL,N'3133',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260901',112)),
(CONVERT(date,'20261008',112),N'A49',N'b6ae1a1c-4f04-c9e1-dff9-60d770a06d68',N'BLOQUEADO',NULL,NULL,N'3006',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240630',112)),
(CONVERT(date,'20261008',112),N'A50',N'8e6ac113-e773-2492-acc3-91d01c393819',N'BLOQUEADO',NULL,NULL,N'3903',N'JTU',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20261005',112)),
(CONVERT(date,'20261008',112),N'A51',N'd85874d2-77b4-8fc8-687a-2886c891037e',N'BLOQUEADO',NULL,NULL,N'3106',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260624',112)),
(CONVERT(date,'20261008',112),N'A52',N'741a01a7-370a-91cc-9740-2cf5943e95f1',N'BLOQUEADO',NULL,NULL,N'3263',N'JTU',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20261007',112)),
(CONVERT(date,'20261008',112),N'A53',N'a0a1aacb-1cec-5ab2-4f7d-7bed049fd689',N'BLOQUEADO',NULL,NULL,N'3271',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20261004',112)),
(CONVERT(date,'20261008',112),N'A54',N'0c8569ab-fed5-025b-3b6b-d5d23aaae7a4',N'BLOQUEADO',NULL,NULL,N'3904',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20261005',112)),
(CONVERT(date,'20261008',112),N'G47',N'df032709-f881-2c4f-3188-033793f97480',N'BLOQUEADO',NULL,NULL,N'1119',N'VCM',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20201218',112)),
(CONVERT(date,'20261008',112),N'G48',N'fde8fede-f75b-054d-59d0-0ff5b48a9e4a',N'BLOQUEADO',NULL,NULL,N'3083',N'VCM',NULL,NULL,N'FORA DE OPERAÇÂO',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261008',112),N'G49',N'39aae336-03fc-d007-e4fe-f4ff556f3a75',N'BLOQUEADO',NULL,NULL,N'1323',N'VCM',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20241207',112)),
(CONVERT(date,'20261008',112),N'G50',N'706341a0-c199-16fd-0c8b-639e999423e4',N'BLOQUEADO',NULL,NULL,N'1322',N'VCM',NULL,NULL,N'REVISÂO GERAL',NULL,CONVERT(date,'20261001',112));

DECLARE @folhas TABLE (id int PRIMARY KEY, data_folha date UNIQUE NOT NULL);
BEGIN TRY
    BEGIN TRANSACTION;
    IF CONVERT(varbinary(256),DB_NAME())<>CONVERT(varbinary(256),N'garagem') OR DATALENGTH(DB_NAME())<>DATALENGTH(N'garagem')
        RAISERROR('Banco alvo deve ser garagem; nao executar em outro banco.',16,1);
    IF COALESCE(CONVERT(nvarchar(60),DATABASEPROPERTYEX(DB_NAME(),'Updateability')),N'')<>N'READ_WRITE'
        RAISERROR('Banco alvo nao esta READ_WRITE.',16,1);
    IF COALESCE(HAS_PERMS_BY_NAME(DB_NAME(),'DATABASE','VIEW DEFINITION'),0)<>1
        RAISERROR('Requer VIEW DEFINITION: metadados invisiveis nao certificam pre-requisitos.',16,1);
    IF OBJECT_ID(N'dbo.ciclo_operacional',N'U') IS NULL OR OBJECT_ID(N'dbo.folha_ci',N'U') IS NULL
       OR OBJECT_ID(N'dbo.item_folha_ci',N'U') IS NULL OR OBJECT_ID(N'dbo.estado_manutencao_ciclo',N'U') IS NULL
        RAISERROR('Estruturas C4 ausentes; pare sem provisionar ou reparar.',16,1);
    IF COALESCE(HAS_PERMS_BY_NAME(N'dbo.folha_ci',N'OBJECT',N'SELECT'),0)<>1
       OR COALESCE(HAS_PERMS_BY_NAME(N'dbo.folha_ci',N'OBJECT',N'INSERT'),0)<>1
       OR COALESCE(HAS_PERMS_BY_NAME(N'dbo.item_folha_ci',N'OBJECT',N'SELECT'),0)<>1
       OR COALESCE(HAS_PERMS_BY_NAME(N'dbo.item_folha_ci',N'OBJECT',N'INSERT'),0)<>1
        RAISERROR('Requer SELECT/INSERT nos dois alvos C4.',16,1);
    -- Contrato integral das colunas, incluindo consorciada nvarchar(10), 20 bytes, nullable=1.
    IF EXISTS (
        SELECT 1 FROM (VALUES
    (N'ciclo_operacional', N'id', 1, N'int', NULL, 0, 1, NULL),
    (N'ciclo_operacional', N'garagem', 2, N'nvarchar', 20, 0, 0, NULL),
    (N'ciclo_operacional', N'data_operacional', 3, N'date', NULL, 0, 0, NULL),
    (N'ciclo_operacional', N'origem', 4, N'nvarchar', 40, 0, 0, NULL),
    (N'ciclo_operacional', N'inicializacao_prevista_em', 5, N'datetime2', NULL, 0, 0, 3),
    (N'ciclo_operacional', N'inicializado_em', 6, N'datetime2', NULL, 0, 0, 3),
    (N'ciclo_operacional', N'referencia_origem', 7, N'nvarchar', 510, 1, 0, NULL),
    (N'ciclo_operacional', N'created_at', 8, N'datetime2', NULL, 0, 0, 3),
    (N'ciclo_operacional', N'updated_at', 9, N'datetime2', NULL, 0, 0, 3),
    (N'folha_ci', N'id', 1, N'int', NULL, 0, 1, NULL),
    (N'folha_ci', N'garagem', 2, N'nvarchar', 20, 0, 0, NULL),
    (N'folha_ci', N'data_folha', 3, N'date', NULL, 0, 0, NULL),
    (N'folha_ci', N'status', 4, N'nvarchar', 40, 0, 0, NULL),
    (N'folha_ci', N'origem', 5, N'nvarchar', 40, 0, 0, NULL),
    (N'folha_ci', N'ciclo_preparacao_id', 6, N'int', NULL, 1, 0, NULL),
    (N'folha_ci', N'folha_origem_id', 7, N'int', NULL, 1, 0, NULL),
    (N'folha_ci', N'titulo_coluna_adicional', 8, N'nvarchar', 60, 1, 0, NULL),
    (N'folha_ci', N'inicializacao_prevista_em', 9, N'datetime2', NULL, 1, 0, 3),
    (N'folha_ci', N'inicializada_em', 10, N'datetime2', NULL, 1, 0, 3),
    (N'folha_ci', N'finalizacao_prevista_em', 11, N'datetime2', NULL, 1, 0, 3),
    (N'folha_ci', N'finalizada_em', 12, N'datetime2', NULL, 1, 0, 3),
    (N'folha_ci', N'referencia_origem', 13, N'nvarchar', 510, 1, 0, NULL),
    (N'folha_ci', N'responsavel_registro_id', 14, N'int', NULL, 1, 0, NULL),
    (N'folha_ci', N'created_at', 15, N'datetime2', NULL, 0, 0, 3),
    (N'folha_ci', N'updated_at', 16, N'datetime2', NULL, 0, 0, 3),
    (N'item_folha_ci', N'id', 1, N'int', NULL, 0, 1, NULL),
    (N'item_folha_ci', N'folha_id', 2, N'int', NULL, 0, 0, NULL),
    (N'item_folha_ci', N'chave_item', 3, N'uniqueidentifier', NULL, 0, 0, NULL),
    (N'item_folha_ci', N'categoria', 4, N'nvarchar', 40, 0, 0, NULL),
    (N'item_folha_ci', N'tipo_posicao', 5, N'nvarchar', 20, 1, 0, NULL),
    (N'item_folha_ci', N'ordem_posicao', 6, N'int', NULL, 1, 0, NULL),
    (N'item_folha_ci', N'prefixo', 7, N'nvarchar', 20, 0, 0, NULL),
    (N'item_folha_ci', N'consorciada', 8, N'nvarchar', 20, 1, 0, NULL),
    (N'item_folha_ci', N'sub_tipo', 9, N'nvarchar', 100, 1, 0, NULL),
    (N'item_folha_ci', N'horario_reforco', 10, N'nvarchar', 40, 1, 0, NULL),
    (N'item_folha_ci', N'motivo', 11, N'nvarchar', 510, 1, 0, NULL),
    (N'item_folha_ci', N'observacoes', 12, N'nvarchar', 510, 1, 0, NULL),
    (N'item_folha_ci', N'hora_bloqueio', 13, N'nvarchar', 20, 1, 0, NULL),
    (N'item_folha_ci', N'gravidade', 14, N'nvarchar', 20, 1, 0, NULL),
    (N'item_folha_ci', N'responsavel', 15, N'nvarchar', 200, 1, 0, NULL),
    (N'item_folha_ci', N'status_item', 16, N'nvarchar', 40, 1, 0, NULL),
    (N'item_folha_ci', N'data_liberacao', 17, N'nvarchar', 100, 1, 0, NULL),
    (N'item_folha_ci', N'motivo_liberacao', 18, N'nvarchar', 510, 1, 0, NULL),
    (N'item_folha_ci', N'responsavel_liberacao', 19, N'nvarchar', 200, 1, 0, NULL),
    (N'item_folha_ci', N'responsavel_registro_id', 20, N'int', NULL, 1, 0, NULL),
    (N'item_folha_ci', N'created_at', 21, N'datetime2', NULL, 0, 0, 3),
    (N'item_folha_ci', N'updated_at', 22, N'datetime2', NULL, 0, 0, 3),
    (N'item_folha_ci', N'data_bloqueio', 23, N'date', NULL, 1, 0, NULL),
    (N'estado_manutencao_ciclo', N'id', 1, N'int', NULL, 0, 1, NULL),
    (N'estado_manutencao_ciclo', N'ciclo_id', 2, N'int', NULL, 0, 0, NULL),
    (N'estado_manutencao_ciclo', N'prefixo', 3, N'nvarchar', 20, 0, 0, NULL),
    (N'estado_manutencao_ciclo', N'consorciada', 4, N'nvarchar', 20, 0, 0, NULL),
    (N'estado_manutencao_ciclo', N'bloqueado', 5, N'bit', NULL, 0, 0, NULL),
    (N'estado_manutencao_ciclo', N'em_execucao', 6, N'bit', NULL, 0, 0, NULL),
    (N'estado_manutencao_ciclo', N'liberado', 7, N'bit', NULL, 0, 0, NULL),
    (N'estado_manutencao_ciclo', N'observacao_bloqueio', 8, N'nvarchar', 510, 1, 0, NULL),
    (N'estado_manutencao_ciclo', N'observacao_oficina', 9, N'nvarchar', 510, 1, 0, NULL),
    (N'estado_manutencao_ciclo', N'responsavel_registro_id', 10, N'int', NULL, 1, 0, NULL),
    (N'estado_manutencao_ciclo', N'created_at', 11, N'datetime2', NULL, 0, 0, 3),
    (N'estado_manutencao_ciclo', N'updated_at', 12, N'datetime2', NULL, 0, 0, 3)

        ) e(tabela,coluna,ordem,tipo,bytes,nullable,identity_flag,escala)
        LEFT JOIN sys.tables t ON t.name=e.tabela AND t.schema_id=SCHEMA_ID(N'dbo')
        LEFT JOIN sys.columns c ON c.object_id=t.object_id AND c.name=e.coluna
        LEFT JOIN sys.types ty ON ty.user_type_id=c.user_type_id
        WHERE c.column_id IS NULL OR ty.name<>e.tipo OR ty.is_user_defined<>0
           OR c.is_nullable<>e.nullable OR c.is_identity<>e.identity_flag OR c.is_computed<>0
           OR (e.bytes IS NOT NULL AND c.max_length<>e.bytes)
           OR (e.escala IS NOT NULL AND c.scale<>e.escala)
    ) RAISERROR('Colunas C4 incompativeis; nenhuma carga autorizada.',16,1);
    -- Whitelist fechada do CHECK novo: nao apagar agrupamentos/literais nem aceitar o antigo LEN.
    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints c
        WHERE c.parent_object_id=OBJECT_ID(N'dbo.item_folha_ci') AND c.name=N'CK_item_folha_ci_consorciada'
          AND c.is_disabled=0 AND c.is_not_trusted=0 AND c.is_not_for_replication=0 AND c.parent_column_id=0
          AND c.definition COLLATE Latin1_General_100_BIN2 IN (
              N'((consorciada IS NULL OR consorciada IN (N''VSF'', N''VCG'', N''JTU'', N''VCM'')) AND (categoria <> N''BLOQUEADO'' OR consorciada IS NOT NULL))',
              N'(([consorciada] IS NULL OR ([consorciada]=N''VCM'' OR [consorciada]=N''JTU'' OR [consorciada]=N''VCG'' OR [consorciada]=N''VSF'')) AND ([categoria]<>N''BLOQUEADO'' OR [consorciada] IS NOT NULL))'
          )
    ) RAISERROR('CHECK novo de consorciada ausente/incompativel/nao reconhecido; revisar sem DDL.',16,1);
    IF EXISTS (SELECT 1 FROM sys.triggers WHERE parent_id IN (OBJECT_ID(N'dbo.folha_ci'),OBJECT_ID(N'dbo.item_folha_ci')) AND is_disabled=0)
        RAISERROR('Trigger ativo inesperado nos alvos: revisar efeitos antes da carga.',16,1);
    -- Restricoes e indices devem existir e estar ativos/confiaveis; nao reparar.
    IF EXISTS (SELECT 1 FROM (VALUES
      (N'folha_ci',N'CK_folha_ci_garagem'),(N'folha_ci',N'CK_folha_ci_status'),
      (N'folha_ci',N'CK_folha_ci_origem'),(N'folha_ci',N'CK_folha_ci_titulo'),
      (N'folha_ci',N'CK_folha_ci_origem_vinculos'),(N'folha_ci',N'CK_folha_ci_preparacao_tempos'),
      (N'folha_ci',N'CK_folha_ci_finalizada_tempo'),(N'folha_ci',N'CK_folha_ci_nao_autorreferencia'),
      (N'item_folha_ci',N'CK_item_folha_ci_categoria'),(N'item_folha_ci',N'CK_item_folha_ci_posicao'),
      (N'item_folha_ci',N'CK_item_folha_ci_data_bloqueio'),(N'item_folha_ci',N'CK_item_folha_ci_prefixo')
    ) e(tabela,nome) LEFT JOIN sys.check_constraints c ON c.parent_object_id=OBJECT_ID(N'dbo.'+e.tabela) AND c.name=e.nome
    WHERE c.object_id IS NULL OR c.is_disabled=1 OR c.is_not_trusted=1 OR c.is_not_for_replication=1)
        RAISERROR('CHECK obrigatorio ausente ou nao confiavel.',16,1);
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id IN (OBJECT_ID(N'dbo.folha_ci'),OBJECT_ID(N'dbo.item_folha_ci'))
        AND (is_disabled=1 OR is_not_trusted=1 OR is_not_for_replication=1 OR delete_referential_action<>0 OR update_referential_action<>0))
        RAISERROR('FK nao confiavel ou com acao referencial inesperada.',16,1);
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys k JOIN sys.foreign_key_columns c ON c.constraint_object_id=k.object_id
        WHERE k.parent_object_id=OBJECT_ID(N'dbo.item_folha_ci') AND k.referenced_object_id=OBJECT_ID(N'dbo.folha_ci')
          AND COL_NAME(c.parent_object_id,c.parent_column_id)=N'folha_id' AND COL_NAME(c.referenced_object_id,c.referenced_column_id)=N'id'
          AND (SELECT COUNT(*) FROM sys.foreign_key_columns x WHERE x.constraint_object_id=k.object_id)=1)
        RAISERROR('FK item para folha ausente/incompativel.',16,1);
    IF EXISTS (SELECT 1 FROM (VALUES
       (N'folha_ci',N'id',CAST(NULL AS nvarchar(128))),
       (N'item_folha_ci',N'id',CAST(NULL AS nvarchar(128))),
       (N'folha_ci',N'garagem',N'data_folha'),
       (N'item_folha_ci',N'folha_id',N'chave_item')
    ) e(tabela,c1,c2) WHERE NOT EXISTS (
       SELECT 1 FROM sys.indexes ix
       WHERE ix.object_id=OBJECT_ID(N'dbo.'+e.tabela) AND ix.is_unique=1 AND ix.is_disabled=0 AND ix.is_hypothetical=0 AND ix.has_filter=0
         AND (e.c2 IS NOT NULL OR ix.is_primary_key=1)
         AND (SELECT COUNT(*) FROM sys.index_columns x WHERE x.object_id=ix.object_id AND x.index_id=ix.index_id AND x.key_ordinal>0)=CASE WHEN e.c2 IS NULL THEN 1 ELSE 2 END
         AND EXISTS (SELECT 1 FROM sys.index_columns x WHERE x.object_id=ix.object_id AND x.index_id=ix.index_id AND x.key_ordinal=1 AND COL_NAME(x.object_id,x.column_id)=e.c1)
         AND (e.c2 IS NULL OR EXISTS (SELECT 1 FROM sys.index_columns x WHERE x.object_id=ix.object_id AND x.index_id=ix.index_id AND x.key_ordinal=2 AND COL_NAME(x.object_id,x.column_id)=e.c2))
    )) RAISERROR('PK/UNIQUE obrigatorio ausente/incompativel.',16,1);
    -- UPDLOCK/HOLDLOCK preservam o intervalo ate COMMIT, incluindo concorrencia com outra carga.
    IF EXISTS (SELECT 1 FROM dbo.folha_ci WITH (UPDLOCK,HOLDLOCK)
               WHERE garagem=N'VCG' AND data_folha=CONVERT(date,'20261008',112))
        RAISERROR('Existe FolhaCI VCG em 08/10/2026; carga integral recusada.',16,1);
    IF (SELECT COUNT(*) FROM @dias)<>1 OR (SELECT COUNT(*) FROM @itens)<>77
        RAISERROR('Manifesto de carga incompleto.',16,1);

    -- Manifesto local: contratos e campos aprovados antes de qualquer INSERT persistente.
    IF (SELECT SUM(preventiva) FROM @dias)<>6 OR (SELECT SUM(oficina) FROM @dias)<>29
       OR (SELECT SUM(fixo) FROM @dias)<>10 OR (SELECT SUM(extra) FROM @dias)<>4
       OR (SELECT COUNT(*) FROM @itens WHERE categoria=N'BLOQUEADO')<>28
       OR (SELECT COUNT(*) FROM @itens WHERE categoria<>N'BLOQUEADO' AND consorciada IS NULL)<>49
       OR EXISTS (SELECT 1 FROM @itens WHERE data_folha<>CONVERT(date,'20261008',112))
        RAISERROR('Manifesto local divergente.',16,1);
    IF EXISTS (SELECT 1 FROM @dias d OUTER APPLY (SELECT
        SUM(CASE WHEN categoria=N'PREVENTIVA' THEN 1 ELSE 0 END) preventiva,
        SUM(CASE WHEN categoria=N'OFICINA' THEN 1 ELSE 0 END) oficina,
        SUM(CASE WHEN categoria=N'REFORCO' AND tipo_posicao=N'FIXO' THEN 1 ELSE 0 END) fixo,
        SUM(CASE WHEN categoria=N'REFORCO' AND tipo_posicao=N'EXTRA' THEN 1 ELSE 0 END) extra,
        SUM(CASE WHEN categoria=N'BLOQUEADO' AND consorciada=N'VSF' THEN 1 ELSE 0 END) vsf,
        SUM(CASE WHEN categoria=N'BLOQUEADO' AND consorciada=N'VCG' THEN 1 ELSE 0 END) vcg,
        SUM(CASE WHEN categoria=N'BLOQUEADO' AND consorciada=N'JTU' THEN 1 ELSE 0 END) jtu,
        SUM(CASE WHEN categoria=N'BLOQUEADO' AND consorciada=N'VCM' THEN 1 ELSE 0 END) vcm
        FROM @itens WHERE data_folha=d.data_folha) c
        WHERE COALESCE(c.preventiva,-1)<>d.preventiva OR COALESCE(c.oficina,-1)<>d.oficina
           OR COALESCE(c.fixo,-1)<>d.fixo OR COALESCE(c.extra,-1)<>d.extra
           OR COALESCE(c.vsf,-1)<>d.vsf OR COALESCE(c.vcg,-1)<>d.vcg
           OR COALESCE(c.jtu,-1)<>d.jtu OR COALESCE(c.vcm,-1)<>d.vcm)
        RAISERROR('Contagens do manifesto local por grupo divergentes.',16,1);
    IF EXISTS (SELECT 1 FROM @itens
        WHERE categoria NOT IN (N'PREVENTIVA',N'OFICINA',N'REFORCO',N'BLOQUEADO')
           OR (categoria=N'BLOQUEADO' AND (consorciada IS NULL OR consorciada NOT IN (N'VSF',N'VCG',N'JTU',N'VCM')
               OR data_bloqueio IS NULL OR data_bloqueio>data_folha))
           OR (categoria<>N'BLOQUEADO' AND (consorciada IS NOT NULL OR data_bloqueio IS NOT NULL))
           OR (categoria=N'REFORCO' AND (tipo_posicao IS NULL OR tipo_posicao NOT IN (N'FIXO',N'EXTRA')
               OR ordem_posicao IS NULL OR ordem_posicao<1 OR (tipo_posicao=N'FIXO' AND ordem_posicao>12)))
           OR (categoria<>N'REFORCO' AND (tipo_posicao IS NOT NULL OR ordem_posicao IS NOT NULL)))
       OR EXISTS (SELECT prefixo FROM @itens WHERE categoria=N'BLOQUEADO' GROUP BY prefixo HAVING COUNT(*)>1)
       OR EXISTS (SELECT tipo_posicao,ordem_posicao FROM @itens WHERE categoria=N'REFORCO'
           GROUP BY tipo_posicao,ordem_posicao HAVING COUNT(*)>1)
        RAISERROR('Contrato de itens do manifesto local violado.',16,1);
    IF (SELECT COUNT(*) FROM @itens WHERE celula=N'D6' AND categoria=N'PREVENTIVA' AND prefixo=N'3026' AND CONVERT(varbinary(max),sub_tipo)=CONVERT(varbinary(max),N'Lubrificação') AND DATALENGTH(sub_tipo)=24)<>1
       OR (SELECT COUNT(*) FROM @itens WHERE categoria=N'PREVENTIVA' AND CONVERT(varbinary(max),sub_tipo)=CONVERT(varbinary(max),N'Lubrificação') AND DATALENGTH(sub_tipo)=24)<>3
       OR EXISTS (SELECT 1 FROM @itens WHERE categoria=N'REFORCO' AND tipo_posicao=N'FIXO' AND ordem_posicao IN (6,12))
       OR (SELECT COUNT(*) FROM @itens WHERE categoria=N'OFICINA' AND prefixo=N'23' AND sub_tipo=N'Bilhetagem')<>1
        RAISERROR('Correcao D6, D5, Bilhetagem ou lacunas do reforco divergentes.',16,1);
    INSERT INTO dbo.folha_ci (garagem,data_folha,status,origem,ciclo_preparacao_id,folha_origem_id,
        titulo_coluna_adicional,inicializacao_prevista_em,inicializada_em,finalizacao_prevista_em,finalizada_em,
        referencia_origem,responsavel_registro_id,created_at,updated_at)
    OUTPUT inserted.id,inserted.data_folha INTO @folhas(id,data_folha)
    SELECT N'VCG',data_folha,N'FINALIZADA',N'IMPORTACAO',NULL,NULL,titulo,NULL,NULL,NULL,NULL,
        arquivo,NULL,SYSUTCDATETIME(),SYSUTCDATETIME() FROM @dias;

    INSERT INTO dbo.item_folha_ci (folha_id,chave_item,categoria,tipo_posicao,ordem_posicao,prefixo,consorciada,sub_tipo,horario_reforco,motivo,observacoes,data_bloqueio,
        hora_bloqueio,gravidade,responsavel,status_item,data_liberacao,motivo_liberacao,responsavel_liberacao,
        responsavel_registro_id,created_at,updated_at)
    SELECT f.id,i.chave_item,i.categoria,i.tipo_posicao,i.ordem_posicao,i.prefixo,i.consorciada,i.sub_tipo,i.horario_reforco,i.motivo,i.observacoes,i.data_bloqueio,
        NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,SYSUTCDATETIME(),SYSUTCDATETIME()
    FROM @itens i JOIN @folhas f ON f.data_folha=i.data_folha;

    -- Validacao da fotografia persistida antes do COMMIT.
    IF (SELECT COUNT(*) FROM @folhas)<>1 OR EXISTS (
        SELECT 1 FROM @dias d LEFT JOIN @folhas n ON n.data_folha=d.data_folha
        LEFT JOIN dbo.folha_ci f ON f.id=n.id
        WHERE f.id IS NULL OR f.data_folha<>d.data_folha
          OR CONVERT(varbinary(max),f.garagem)<>CONVERT(varbinary(max),N'VCG') OR DATALENGTH(f.garagem)<>DATALENGTH(N'VCG')
          OR CONVERT(varbinary(max),f.status)<>CONVERT(varbinary(max),N'FINALIZADA') OR DATALENGTH(f.status)<>DATALENGTH(N'FINALIZADA')
          OR CONVERT(varbinary(max),f.origem)<>CONVERT(varbinary(max),N'IMPORTACAO') OR DATALENGTH(f.origem)<>DATALENGTH(N'IMPORTACAO')
          OR f.titulo_coluna_adicional IS NULL
          OR (CONVERT(varbinary(max),f.titulo_coluna_adicional)<>CONVERT(varbinary(max),d.titulo) OR DATALENGTH(f.titulo_coluna_adicional)<>DATALENGTH(d.titulo))
          OR f.referencia_origem IS NULL OR (CONVERT(varbinary(max),f.referencia_origem)<>CONVERT(varbinary(max),d.arquivo) OR DATALENGTH(f.referencia_origem)<>DATALENGTH(d.arquivo))
          OR f.ciclo_preparacao_id IS NOT NULL OR f.folha_origem_id IS NOT NULL
          OR f.inicializacao_prevista_em IS NOT NULL OR f.inicializada_em IS NOT NULL
          OR f.finalizacao_prevista_em IS NOT NULL OR f.finalizada_em IS NOT NULL OR f.responsavel_registro_id IS NOT NULL
    ) RAISERROR('Folhas persistidas divergem da fotografia de 08/10.',16,1);
    IF EXISTS (
        SELECT 1 FROM @dias d JOIN @folhas f ON f.data_folha=d.data_folha
        OUTER APPLY (SELECT
            SUM(CASE WHEN categoria=N'PREVENTIVA' THEN 1 ELSE 0 END) preventiva,
            SUM(CASE WHEN categoria=N'OFICINA' THEN 1 ELSE 0 END) oficina,
            SUM(CASE WHEN categoria=N'REFORCO' AND tipo_posicao=N'FIXO' THEN 1 ELSE 0 END) fixo,
            SUM(CASE WHEN categoria=N'REFORCO' AND tipo_posicao=N'EXTRA' THEN 1 ELSE 0 END) extra,
            SUM(CASE WHEN categoria=N'BLOQUEADO' AND consorciada=N'VSF' THEN 1 ELSE 0 END) vsf,
            SUM(CASE WHEN categoria=N'BLOQUEADO' AND consorciada=N'VCG' THEN 1 ELSE 0 END) vcg,
            SUM(CASE WHEN categoria=N'BLOQUEADO' AND consorciada=N'JTU' THEN 1 ELSE 0 END) jtu,
            SUM(CASE WHEN categoria=N'BLOQUEADO' AND consorciada=N'VCM' THEN 1 ELSE 0 END) vcm
            FROM dbo.item_folha_ci WHERE folha_id=f.id) c
        WHERE COALESCE(c.preventiva,-1)<>d.preventiva OR COALESCE(c.oficina,-1)<>d.oficina
           OR COALESCE(c.fixo,-1)<>d.fixo OR COALESCE(c.extra,-1)<>d.extra
           OR COALESCE(c.vsf,-1)<>d.vsf OR COALESCE(c.vcg,-1)<>d.vcg
           OR COALESCE(c.jtu,-1)<>d.jtu OR COALESCE(c.vcm,-1)<>d.vcm
    ) RAISERROR('Contagens por categoria/posicao/consorciada divergem.',16,1);
    IF (SELECT COUNT(*) FROM dbo.item_folha_ci i JOIN @folhas f ON f.id=i.folha_id WHERE i.categoria=N'BLOQUEADO')<>28
        RAISERROR('Total BLOQUEADOS diferente de 28.',16,1);
    IF EXISTS (SELECT 1 FROM dbo.item_folha_ci i JOIN @folhas f ON f.id=i.folha_id
        WHERE (i.categoria=N'BLOQUEADO' AND (i.consorciada IS NULL OR i.consorciada NOT IN (N'VSF',N'VCG',N'JTU',N'VCM') OR i.data_bloqueio IS NULL OR i.data_bloqueio>f.data_folha))
           OR (i.categoria<>N'BLOQUEADO' AND i.consorciada IS NOT NULL)
           OR (i.categoria=N'REFORCO' AND (i.tipo_posicao IS NULL OR i.ordem_posicao IS NULL
               OR i.tipo_posicao NOT IN (N'FIXO',N'EXTRA') OR i.ordem_posicao<1 OR (i.tipo_posicao=N'FIXO' AND i.ordem_posicao>12)))
           OR (i.categoria<>N'REFORCO' AND (i.tipo_posicao IS NOT NULL OR i.ordem_posicao IS NOT NULL)))
        RAISERROR('Contrato de consorciada/data/posicoes violado.',16,1);
    IF EXISTS (SELECT i.folha_id,i.prefixo FROM dbo.item_folha_ci i JOIN @folhas f ON f.id=i.folha_id
               WHERE i.categoria=N'BLOQUEADO' GROUP BY i.folha_id,i.prefixo HAVING COUNT(*)>1)
        RAISERROR('Prefixo BLOQUEADO duplicado na mesma folha.',16,1);
    IF EXISTS (SELECT 1 FROM @folhas f WHERE
        (SELECT COUNT(*) FROM dbo.item_folha_ci WHERE folha_id=f.id AND categoria=N'OFICINA' AND prefixo=N'23' AND sub_tipo=N'Bilhetagem' AND consorciada IS NULL)<>1
        OR (SELECT COUNT(*) FROM dbo.item_folha_ci WHERE folha_id=f.id AND categoria=N'BLOQUEADO' AND prefixo=N'3083' AND consorciada=N'VCM' AND data_bloqueio=CONVERT(date,'20261001',112))<>1)
        RAISERROR('23/Bilhetagem/NULL ou 3083/VCM/fallback nao preservado.',16,1);
    -- NVARCHAR compara com padding mesmo sob BIN2. Bytes + DATALENGTH preservam
    -- caixa, acentos, espacos finais/iniciais, conteudo interno e NULL versus vazio.
    -- NULLs opcionais tipados evitam conversoes implicitas nos operadores de conjunto.
    IF (SELECT COUNT(*) FROM dbo.item_folha_ci i JOIN @folhas f ON f.id=i.folha_id)<>77
       OR EXISTS (SELECT f.data_folha,
                   i.chave_item,
                   CONVERT(varbinary(max),i.categoria),
                   DATALENGTH(i.categoria),
                   CONVERT(varbinary(max),i.tipo_posicao),
                   DATALENGTH(i.tipo_posicao),
                   i.ordem_posicao,
                   CONVERT(varbinary(max),i.prefixo),
                   DATALENGTH(i.prefixo),
                   CONVERT(varbinary(max),i.consorciada),
                   DATALENGTH(i.consorciada),
                   CONVERT(varbinary(max),i.sub_tipo),
                   DATALENGTH(i.sub_tipo),
                   CONVERT(varbinary(max),i.horario_reforco),
                   DATALENGTH(i.horario_reforco),
                   CONVERT(varbinary(max),i.motivo),
                   DATALENGTH(i.motivo),
                   CONVERT(varbinary(max),i.observacoes),
                   DATALENGTH(i.observacoes),
                   i.data_bloqueio,
                   CONVERT(varbinary(max),i.hora_bloqueio),
                   DATALENGTH(i.hora_bloqueio),
                   CONVERT(varbinary(max),i.gravidade),
                   DATALENGTH(i.gravidade),
                   CONVERT(varbinary(max),i.responsavel),
                   DATALENGTH(i.responsavel),
                   CONVERT(varbinary(max),i.status_item),
                   DATALENGTH(i.status_item),
                   CONVERT(varbinary(max),i.data_liberacao),
                   DATALENGTH(i.data_liberacao),
                   CONVERT(varbinary(max),i.motivo_liberacao),
                   DATALENGTH(i.motivo_liberacao),
                   CONVERT(varbinary(max),i.responsavel_liberacao),
                   DATALENGTH(i.responsavel_liberacao),
                   i.responsavel_registro_id
            FROM dbo.item_folha_ci i JOIN @folhas f ON f.id=i.folha_id
            EXCEPT
            SELECT i.data_folha,
                   i.chave_item,
                   CONVERT(varbinary(max),i.categoria),
                   DATALENGTH(i.categoria),
                   CONVERT(varbinary(max),i.tipo_posicao),
                   DATALENGTH(i.tipo_posicao),
                   i.ordem_posicao,
                   CONVERT(varbinary(max),i.prefixo),
                   DATALENGTH(i.prefixo),
                   CONVERT(varbinary(max),i.consorciada),
                   DATALENGTH(i.consorciada),
                   CONVERT(varbinary(max),i.sub_tipo),
                   DATALENGTH(i.sub_tipo),
                   CONVERT(varbinary(max),i.horario_reforco),
                   DATALENGTH(i.horario_reforco),
                   CONVERT(varbinary(max),i.motivo),
                   DATALENGTH(i.motivo),
                   CONVERT(varbinary(max),i.observacoes),
                   DATALENGTH(i.observacoes),
                   i.data_bloqueio,
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS int)
            FROM @itens i)
       OR EXISTS (SELECT i.data_folha,
                   i.chave_item,
                   CONVERT(varbinary(max),i.categoria),
                   DATALENGTH(i.categoria),
                   CONVERT(varbinary(max),i.tipo_posicao),
                   DATALENGTH(i.tipo_posicao),
                   i.ordem_posicao,
                   CONVERT(varbinary(max),i.prefixo),
                   DATALENGTH(i.prefixo),
                   CONVERT(varbinary(max),i.consorciada),
                   DATALENGTH(i.consorciada),
                   CONVERT(varbinary(max),i.sub_tipo),
                   DATALENGTH(i.sub_tipo),
                   CONVERT(varbinary(max),i.horario_reforco),
                   DATALENGTH(i.horario_reforco),
                   CONVERT(varbinary(max),i.motivo),
                   DATALENGTH(i.motivo),
                   CONVERT(varbinary(max),i.observacoes),
                   DATALENGTH(i.observacoes),
                   i.data_bloqueio,
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS int)
            FROM @itens i
            EXCEPT
            SELECT f.data_folha,
                   i.chave_item,
                   CONVERT(varbinary(max),i.categoria),
                   DATALENGTH(i.categoria),
                   CONVERT(varbinary(max),i.tipo_posicao),
                   DATALENGTH(i.tipo_posicao),
                   i.ordem_posicao,
                   CONVERT(varbinary(max),i.prefixo),
                   DATALENGTH(i.prefixo),
                   CONVERT(varbinary(max),i.consorciada),
                   DATALENGTH(i.consorciada),
                   CONVERT(varbinary(max),i.sub_tipo),
                   DATALENGTH(i.sub_tipo),
                   CONVERT(varbinary(max),i.horario_reforco),
                   DATALENGTH(i.horario_reforco),
                   CONVERT(varbinary(max),i.motivo),
                   DATALENGTH(i.motivo),
                   CONVERT(varbinary(max),i.observacoes),
                   DATALENGTH(i.observacoes),
                   i.data_bloqueio,
                   CONVERT(varbinary(max),i.hora_bloqueio),
                   DATALENGTH(i.hora_bloqueio),
                   CONVERT(varbinary(max),i.gravidade),
                   DATALENGTH(i.gravidade),
                   CONVERT(varbinary(max),i.responsavel),
                   DATALENGTH(i.responsavel),
                   CONVERT(varbinary(max),i.status_item),
                   DATALENGTH(i.status_item),
                   CONVERT(varbinary(max),i.data_liberacao),
                   DATALENGTH(i.data_liberacao),
                   CONVERT(varbinary(max),i.motivo_liberacao),
                   DATALENGTH(i.motivo_liberacao),
                   CONVERT(varbinary(max),i.responsavel_liberacao),
                   DATALENGTH(i.responsavel_liberacao),
                   i.responsavel_registro_id
            FROM dbo.item_folha_ci i JOIN @folhas f ON f.id=i.folha_id)
        RAISERROR('Itens persistidos divergem integralmente do manifesto, incluindo fallbacks e opcionais NULL.',16,1);
        IF (SELECT COUNT(*) FROM dbo.item_folha_ci i JOIN @folhas f ON f.id=i.folha_id
        WHERE i.categoria=N'BLOQUEADO' AND i.prefixo IN (N'3083',N'1322') AND i.consorciada=N'VCM' AND i.data_bloqueio=CONVERT(date,'20261001',112))<>2
        RAISERROR('Os dois fallbacks aprovados nao foram preservados.',16,1);
    COMMIT TRANSACTION;
    SELECT N'IMPORTACAO_CONCLUIDA' resultado,1 folhas,77 itens,28 bloqueados;
END TRY
BEGIN CATCH
    IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

-- AUDITORIA DE ITENS: fonte Preenchido, valores persistidos apos excecoes aprovadas.
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"D6","guid":"b3b1967a-ca48-8294-dadc-f67652ff358e","categoria":"PREVENTIVA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3026","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G6","guid":"7725699f-6439-4373-b7f4-65dfad610c28","categoria":"PREVENTIVA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3205","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"D7","guid":"62a9990a-b0fa-b74a-ddd2-180d2680a2c1","categoria":"PREVENTIVA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3957","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G7","guid":"a874f39e-449b-19a7-d7e7-7c064b2804a0","categoria":"PREVENTIVA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4243","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"D8","guid":"6dde8fc8-a325-b22c-f913-3b133e064668","categoria":"PREVENTIVA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3208","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G8","guid":"f4a0b5dc-cea5-1859-936f-eec027fdae0f","categoria":"PREVENTIVA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4258","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A12","guid":"a31296c5-a3ff-6589-72fc-700a710b9e03","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"2704","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"BOMBA ARLA","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"C12","guid":"45d29ce4-66bf-fffe-5776-8a30b647c88f","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3951","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"D12","guid":"9e0b392b-587c-1227-a630-ca3f400d083c","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3100","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"MODULO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G12","guid":"5aa8b207-d78b-2c58-933e-330ba9516f97","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3147","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"BANCO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"J12","guid":"69a6cdcd-da1c-8b51-4777-2a672e468cae","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"23","consorciada":null,"sub_tipo":"Bilhetagem","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A13","guid":"4110a082-ee18-b22d-35ae-ce3309e52428","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"C13","guid":"6a02d605-5fa7-983a-0fea-3744f7b7881d","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"2514","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"D13","guid":"e0ee289a-705e-494a-1b93-9358dcdf1100","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"2623","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"LIMPADOR","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"F13","guid":"759a95a0-0007-e2b7-6c22-fb6c91009705","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4270","consorciada":null,"sub_tipo":"Borracharia","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"J13","guid":"9408ee8a-d744-97c5-35e2-e6c84269c57b","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3021","consorciada":null,"sub_tipo":"Bilhetagem","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A14","guid":"019e232d-a91a-7942-87e4-216dfd1c91a9","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4244","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"M DE EIXO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"C14","guid":"b2214a26-6678-97f8-1464-cc83d3a452d1","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3139","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"D14","guid":"527a1914-518f-848b-6fc8-617350e7dc5a","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4189","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"LIMPADOR","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"F14","guid":"5039eba6-40f6-233b-0679-027a888424e5","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"2410","consorciada":null,"sub_tipo":"Borracharia","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G14","guid":"22ffa540-af92-c8f9-8ab8-8c762fdf4516","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4227","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"PARACHOQUE","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"J14","guid":"f487ba43-536a-7400-90a3-abd3aa016bbc","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3254","consorciada":null,"sub_tipo":"Bilhetagem","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A15","guid":"99268636-276a-f413-4bac-c962ab230816","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"C15","guid":"ffa229b2-c985-e5d8-b03d-81143dc8b5e6","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4196","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G15","guid":"1d21bab5-ec30-ba57-dfbe-a44f172722a8","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4245","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"BANCO PSG","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A16","guid":"4621e26d-2455-cf95-e3ea-3462102d28cc","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4197","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"C16","guid":"08acce3c-084d-1079-6d71-a0a778de0f39","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4222","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A17","guid":"bd6e2cb0-a2f9-d01e-3190-84d816edd1c2","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4225","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"C17","guid":"7e4ecbb1-e0a0-fe76-dbae-752da370e015","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"2426","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A18","guid":"6ea784e5-75f6-1349-6a77-53a8b2649f40","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"2425","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"VAZ OLEO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"C18","guid":"e94c091b-ff00-6155-6882-904d7272e897","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4209","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A19","guid":"29f6f5ba-81ae-08f6-3f59-654b23e3e67f","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"2352","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"POTENCIA","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"C19","guid":"cbaa4864-16b1-3cdd-2549-3b3c77ce8ec0","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3271","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A20","guid":"32e0eda3-eeaa-c94d-f9bb-2ae8f844dc62","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4224","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"C20","guid":"240b4b7c-9b52-317c-b1b6-813a74d1dcbf","categoria":"OFICINA","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4193","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"C23","guid":"f4372952-e8c8-e28c-178b-5a559f70d17e","categoria":"REFORCO","tipo_posicao":"FIXO","ordem_posicao":1,"prefixo":"3026","consorciada":null,"sub_tipo":null,"horario_reforco":"07:15 - A","motivo":"LUBRIFICAÇÃO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"H23","guid":"b5217e9a-bbae-1657-028c-c21092714c28","categoria":"REFORCO","tipo_posicao":"FIXO","ordem_posicao":7,"prefixo":"3205","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - C","motivo":"TROCA DE ÓLEO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"J23","guid":"ee77bfd7-320a-be48-ab4a-d31e248828ee","categoria":"REFORCO","tipo_posicao":"EXTRA","ordem_posicao":1,"prefixo":"3902","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"C24","guid":"ac2097cf-01cc-4551-0fcf-ae01b125ab6b","categoria":"REFORCO","tipo_posicao":"FIXO","ordem_posicao":2,"prefixo":"3957","consorciada":null,"sub_tipo":null,"horario_reforco":"07:15 - A","motivo":"LUBRIFICAÇÃO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"H24","guid":"f6abd685-3679-3a64-18b4-3531776832df","categoria":"REFORCO","tipo_posicao":"FIXO","ordem_posicao":8,"prefixo":"4243","consorciada":null,"sub_tipo":null,"horario_reforco":"07:45 - C","motivo":"TROCA DE ÓLEO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"J24","guid":"b02c3090-e046-85db-a427-92a3e01ed058","categoria":"REFORCO","tipo_posicao":"EXTRA","ordem_posicao":2,"prefixo":"4257","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"C25","guid":"7757a06d-192c-40ca-5fc0-5e11f3ac3e74","categoria":"REFORCO","tipo_posicao":"FIXO","ordem_posicao":3,"prefixo":"3208","consorciada":null,"sub_tipo":null,"horario_reforco":"07:32 - A","motivo":"LUBRIFICAÇÃO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"H25","guid":"a479e387-8e85-1f50-5036-7fba5005775a","categoria":"REFORCO","tipo_posicao":"FIXO","ordem_posicao":9,"prefixo":"4258","consorciada":null,"sub_tipo":null,"horario_reforco":"07:45 - A","motivo":"TROCA DE ÓLEO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"J25","guid":"2fa665e0-8051-64dd-b255-e1bf2f1ab46b","categoria":"REFORCO","tipo_posicao":"EXTRA","ordem_posicao":3,"prefixo":"3273","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"C26","guid":"f97b5105-045b-65d7-e7ca-d8a702491dbf","categoria":"REFORCO","tipo_posicao":"FIXO","ordem_posicao":4,"prefixo":"3273","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - A","motivo":"INSPEÇÂO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"H26","guid":"ae0fecee-b247-eb47-b7b4-1ae9e3aa1398","categoria":"REFORCO","tipo_posicao":"FIXO","ordem_posicao":10,"prefixo":"3902","consorciada":null,"sub_tipo":null,"horario_reforco":"07:50 - C","motivo":"INSPEÇÂO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"J26","guid":"83a710e6-af0a-11ae-4e2f-18d7c1de0797","categoria":"REFORCO","tipo_posicao":"EXTRA","ordem_posicao":4,"prefixo":"3283","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"C27","guid":"2da3e13e-a63f-2099-cfca-01ecdadbca6d","categoria":"REFORCO","tipo_posicao":"FIXO","ordem_posicao":5,"prefixo":"4257","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - M","motivo":"INSPEÇÂO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"H27","guid":"4cb04594-2801-fa8c-554c-9235cacf9caf","categoria":"REFORCO","tipo_posicao":"FIXO","ordem_posicao":11,"prefixo":"3283","consorciada":null,"sub_tipo":null,"horario_reforco":"07:50 - C","motivo":"INSPEÇÂO","observacoes":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A35","guid":"c6c999d5-3986-798e-5702-ab152a8dead4","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"2424","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"data_bloqueio":"2026-06-03"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A36","guid":"24adf9b5-44d8-fbb5-ccd2-e52d9fab7299","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"2600","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"ELÉTRICA","observacoes":null,"data_bloqueio":"2026-01-06"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A37","guid":"da450da8-da69-d543-eeaf-0ab43ab264ec","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"2800","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"data_bloqueio":"2026-01-03"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A38","guid":"54d06bb0-fa39-0371-8f23-4d51ab0330fa","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"2611","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"data_bloqueio":"2026-08-25"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A39","guid":"3fd792a1-72a1-4487-b456-b83bd8cf7956","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"2712","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"VALVULAS","observacoes":null,"data_bloqueio":"2026-10-07"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A40","guid":"f7343c63-5896-8220-165c-855626087fa3","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"2320","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"LONAS DE FREIO ","observacoes":null,"data_bloqueio":"2026-10-07"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G35","guid":"d6f89013-9dbe-bc5b-71c8-bb5b4982b48c","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4199","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"data_bloqueio":"2024-05-03"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G36","guid":"1af25046-9597-d6e3-b266-195f984bc483","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4200","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"TRANSMISSÃO","observacoes":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G37","guid":"434a3b60-5d7e-0321-c6a7-eb16ee79ca5d","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4201","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MECANICA PASTILHS E DISCO DE FREIO","observacoes":null,"data_bloqueio":"2026-06-28"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G38","guid":"e36a640d-cfa7-b2e6-39ab-63cc0a87065f","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4190","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"VIDRO BOLHA","observacoes":null,"data_bloqueio":"2026-08-20"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G39","guid":"1d44ac0a-592e-8f98-32a4-5c75c462ffbd","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4255","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"data_bloqueio":"2026-08-24"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G40","guid":"4187da59-42ce-af5e-ca0a-4559dc7c31e6","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4211","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G41","guid":"910beeda-5e18-e39d-f843-ada4813fdb9b","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4248","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"AR E EMBREAGEM","observacoes":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G42","guid":"9d732fa6-f18f-632d-b110-afa155a28eb3","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4196","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"data_bloqueio":"2026-08-27"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G43","guid":"3710bc5a-aa11-10d8-1a7c-67ea02152251","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4253","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"REVISÂO","observacoes":null,"data_bloqueio":"2026-10-07"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G44","guid":"3b1655a0-6070-ff57-1281-014a51c6abb2","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"4257","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"data_bloqueio":"2026-09-21"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A47","guid":"4c9c3a16-ced8-7b80-b815-7fc497552e6f","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3005","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"SUSPENSÃO ","observacoes":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A48","guid":"c944e8ee-8727-2d0a-7e61-a09afa0d7440","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3133","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"data_bloqueio":"2026-09-01"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A49","guid":"b6ae1a1c-4f04-c9e1-dff9-60d770a06d68","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3006","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"data_bloqueio":"2024-06-30"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A50","guid":"8e6ac113-e773-2492-acc3-91d01c393819","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3903","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"data_bloqueio":"2026-10-05"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A51","guid":"d85874d2-77b4-8fc8-687a-2886c891037e","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3106","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"data_bloqueio":"2026-06-24"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A52","guid":"741a01a7-370a-91cc-9740-2cf5943e95f1","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3263","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"data_bloqueio":"2026-10-07"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A53","guid":"a0a1aacb-1cec-5ab2-4f7d-7bed049fd689","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3271","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"data_bloqueio":"2026-10-04"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"A54","guid":"0c8569ab-fed5-025b-3b6b-d5d23aaae7a4","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3904","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"data_bloqueio":"2026-10-05"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G47","guid":"df032709-f881-2c4f-3188-033793f97480","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"1119","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"data_bloqueio":"2020-12-18"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G48","guid":"fde8fede-f75b-054d-59d0-0ff5b48a9e4a","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"3083","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"FORA DE OPERAÇÂO","observacoes":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G49","guid":"39aae336-03fc-d007-e4fe-f4ff556f3a75","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"1323","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"data_bloqueio":"2024-12-07"}
-- AUDIT-ITEM {"date":"2026-10-08","file":"CI-08-10-2026.xlsx","cell":"G50","guid":"706341a0-c199-16fd-0c8b-639e999423e4","categoria":"BLOQUEADO","tipo_posicao":null,"ordem_posicao":null,"prefixo":"1322","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"REVISÂO GERAL","observacoes":null,"data_bloqueio":"2026-10-01"}
