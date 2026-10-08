-- DATA-001C4 08/10: consultas independentes SOMENTE SELECT; NAO EXECUTADAS.
-- Banco esperado garagem. Ler todas as saidas; divergencias devem estar vazias.
-- SHA256 fonte: 7dca091d37ccc6c094f05e206f8cd33bc449e5b5dd2ab307731e3f0d9f82d882
-- Acumulado 8/595/262 e condicional a preservacao integral de 01-07; contagem nao prova conteudo.
SELECT DB_NAME() banco_alvo, CASE WHEN CONVERT(varbinary(256),DB_NAME())=CONVERT(varbinary(256),N'garagem') AND DATALENGTH(DB_NAME())=DATALENGTH(N'garagem') THEN N'OK' ELSE N'BANCO_INCORRETO' END verificacao;

SELECT f.id,f.garagem,f.data_folha,f.status,f.origem,f.titulo_coluna_adicional,f.referencia_origem,
       f.ciclo_preparacao_id,f.folha_origem_id,f.inicializacao_prevista_em,f.inicializada_em,
       f.finalizacao_prevista_em,f.finalizada_em,f.responsavel_registro_id,f.created_at,f.updated_at
FROM dbo.folha_ci f WHERE f.garagem=N'VCG' AND f.data_folha=CONVERT(date,'20261008',112);
-- Esperado exatamente uma folha FINALIZADA/IMPORTACAO; vinculos/tempos operacionais/responsavel NULL.

-- Divergencias nos campos da folha: zero linhas, com comparacao exata de textos.
SELECT f.id,N'FOLHA_DIVERGENTE' divergencia
FROM dbo.folha_ci f
WHERE f.garagem=N'VCG' AND f.data_folha=CONVERT(date,'20261008',112)
 AND (CONVERT(varbinary(max),f.garagem)<>CONVERT(varbinary(max),N'VCG') OR DATALENGTH(f.garagem)<>6
   OR CONVERT(varbinary(max),f.status)<>CONVERT(varbinary(max),N'FINALIZADA') OR DATALENGTH(f.status)<>20
   OR CONVERT(varbinary(max),f.origem)<>CONVERT(varbinary(max),N'IMPORTACAO') OR DATALENGTH(f.origem)<>20
   OR f.titulo_coluna_adicional IS NULL
   OR CONVERT(varbinary(max),f.titulo_coluna_adicional)<>CONVERT(varbinary(max),N'INSPEÇÃO') OR DATALENGTH(f.titulo_coluna_adicional)<>16
   OR f.referencia_origem IS NULL
   OR CONVERT(varbinary(max),f.referencia_origem)<>CONVERT(varbinary(max),N'CI-08-10-2026.xlsx') OR DATALENGTH(f.referencia_origem)<>DATALENGTH(N'CI-08-10-2026.xlsx')
   OR f.ciclo_preparacao_id IS NOT NULL OR f.folha_origem_id IS NOT NULL
   OR f.inicializacao_prevista_em IS NOT NULL OR f.inicializada_em IS NOT NULL
   OR f.finalizacao_prevista_em IS NOT NULL OR f.finalizada_em IS NOT NULL
   OR f.responsavel_registro_id IS NOT NULL);

SELECT i.categoria,i.tipo_posicao,i.consorciada,COUNT(*) quantidade
FROM dbo.item_folha_ci i JOIN dbo.folha_ci f ON f.id=i.folha_id
WHERE f.garagem=N'VCG' AND f.data_folha=CONVERT(date,'20261008',112)
GROUP BY i.categoria,i.tipo_posicao,i.consorciada;
-- PREVENTIVA 6, OFICINA 29, FIXO 10, EXTRA 4; VSF 6, VCG 10, JTU 8, VCM 4.

SELECT COUNT(*) itens, SUM(CASE WHEN i.categoria=N'BLOQUEADO' THEN 1 ELSE 0 END) bloqueados,
 SUM(CASE WHEN i.categoria<>N'BLOQUEADO' AND i.consorciada IS NULL THEN 1 ELSE 0 END) nao_bloqueados_null
FROM dbo.item_folha_ci i JOIN dbo.folha_ci f ON f.id=i.folha_id
WHERE f.garagem=N'VCG' AND f.data_folha=CONVERT(date,'20261008',112);
-- Esperado 77/28/49.

SELECT i.chave_item,i.categoria,i.tipo_posicao,i.ordem_posicao,i.prefixo,i.consorciada,
 i.sub_tipo,LEN(i.sub_tipo) len_sub_tipo,DATALENGTH(i.sub_tipo) bytes_sub_tipo,
 i.horario_reforco,i.motivo,DATALENGTH(i.motivo) bytes_motivo,i.observacoes,i.data_bloqueio
FROM dbo.item_folha_ci i JOIN dbo.folha_ci f ON f.id=i.folha_id
WHERE f.garagem=N'VCG' AND f.data_folha=CONVERT(date,'20261008',112)
ORDER BY i.categoria,i.tipo_posicao,i.ordem_posicao,i.prefixo;
-- D6 Lubrificacao 3026, tres subtipos LEN=12/bytes=24; 23/Bilhetagem;
-- 3083/VCM e 1322/VCM com 2026-10-01; FIXO lacunas 6/12; EXTRA 1..4.

SELECT (SELECT COUNT(*) FROM dbo.folha_ci WHERE garagem=N'VCG'
 AND data_folha BETWEEN CONVERT(date,'20261001',112) AND CONVERT(date,'20261008',112)) folhas,
 COUNT(*) itens,SUM(CASE WHEN i.categoria=N'BLOQUEADO' THEN 1 ELSE 0 END) bloqueados
FROM dbo.item_folha_ci i JOIN dbo.folha_ci f ON f.id=i.folha_id
WHERE f.garagem=N'VCG' AND f.data_folha BETWEEN CONVERT(date,'20261001',112) AND CONVERT(date,'20261008',112);
-- Esperado acumulado 8/595/262. Conferir 01-07 separadamente com seu manifesto original.

-- Comparacao integral independente: zero linhas. Bytes + DATALENGTH detectam
-- caixa, acentos e espacos finais; EXCEPT distingue NULL de vazio.
;WITH manifesto AS (
 SELECT * FROM (VALUES
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
(CONVERT(date,'20261008',112),N'G50',N'706341a0-c199-16fd-0c8b-639e999423e4',N'BLOQUEADO',NULL,NULL,N'1322',N'VCM',NULL,NULL,N'REVISÂO GERAL',NULL,CONVERT(date,'20261001',112))
 ) e(data_folha,celula,chave_item,categoria,tipo_posicao,ordem_posicao,prefixo,consorciada,sub_tipo,horario_reforco,motivo,observacoes,data_bloqueio)
), esperado AS (
 SELECT i.data_folha AS data_folha,
        CONVERT(uniqueidentifier,i.chave_item) AS chave_item,
        i.ordem_posicao,
        i.data_bloqueio,
        CAST(NULL AS int) AS responsavel_registro_id,
        CONVERT(varbinary(max),i.categoria) AS categoria_bytes,
        DATALENGTH(i.categoria) AS categoria_length,
        CONVERT(varbinary(max),i.tipo_posicao) AS tipo_posicao_bytes,
        DATALENGTH(i.tipo_posicao) AS tipo_posicao_length,
        CONVERT(varbinary(max),i.prefixo) AS prefixo_bytes,
        DATALENGTH(i.prefixo) AS prefixo_length,
        CONVERT(varbinary(max),i.consorciada) AS consorciada_bytes,
        DATALENGTH(i.consorciada) AS consorciada_length,
        CONVERT(varbinary(max),i.sub_tipo) AS sub_tipo_bytes,
        DATALENGTH(i.sub_tipo) AS sub_tipo_length,
        CONVERT(varbinary(max),i.horario_reforco) AS horario_reforco_bytes,
        DATALENGTH(i.horario_reforco) AS horario_reforco_length,
        CONVERT(varbinary(max),i.motivo) AS motivo_bytes,
        DATALENGTH(i.motivo) AS motivo_length,
        CONVERT(varbinary(max),i.observacoes) AS observacoes_bytes,
        DATALENGTH(i.observacoes) AS observacoes_length,
        CAST(NULL AS varbinary(max)) AS hora_bloqueio_bytes,
        CAST(NULL AS int) AS hora_bloqueio_length,
        CAST(NULL AS varbinary(max)) AS gravidade_bytes,
        CAST(NULL AS int) AS gravidade_length,
        CAST(NULL AS varbinary(max)) AS responsavel_bytes,
        CAST(NULL AS int) AS responsavel_length,
        CAST(NULL AS varbinary(max)) AS status_item_bytes,
        CAST(NULL AS int) AS status_item_length,
        CAST(NULL AS varbinary(max)) AS data_liberacao_bytes,
        CAST(NULL AS int) AS data_liberacao_length,
        CAST(NULL AS varbinary(max)) AS motivo_liberacao_bytes,
        CAST(NULL AS int) AS motivo_liberacao_length,
        CAST(NULL AS varbinary(max)) AS responsavel_liberacao_bytes,
        CAST(NULL AS int) AS responsavel_liberacao_length FROM manifesto i
), persistido AS (
 SELECT i.data_folha AS data_folha,
        CONVERT(uniqueidentifier,i.chave_item) AS chave_item,
        i.ordem_posicao,
        i.data_bloqueio,
        CAST(i.responsavel_registro_id AS int) AS responsavel_registro_id,
        CONVERT(varbinary(max),i.categoria) AS categoria_bytes,
        DATALENGTH(i.categoria) AS categoria_length,
        CONVERT(varbinary(max),i.tipo_posicao) AS tipo_posicao_bytes,
        DATALENGTH(i.tipo_posicao) AS tipo_posicao_length,
        CONVERT(varbinary(max),i.prefixo) AS prefixo_bytes,
        DATALENGTH(i.prefixo) AS prefixo_length,
        CONVERT(varbinary(max),i.consorciada) AS consorciada_bytes,
        DATALENGTH(i.consorciada) AS consorciada_length,
        CONVERT(varbinary(max),i.sub_tipo) AS sub_tipo_bytes,
        DATALENGTH(i.sub_tipo) AS sub_tipo_length,
        CONVERT(varbinary(max),i.horario_reforco) AS horario_reforco_bytes,
        DATALENGTH(i.horario_reforco) AS horario_reforco_length,
        CONVERT(varbinary(max),i.motivo) AS motivo_bytes,
        DATALENGTH(i.motivo) AS motivo_length,
        CONVERT(varbinary(max),i.observacoes) AS observacoes_bytes,
        DATALENGTH(i.observacoes) AS observacoes_length,
        CONVERT(varbinary(max),i.hora_bloqueio) AS hora_bloqueio_bytes,
        DATALENGTH(i.hora_bloqueio) AS hora_bloqueio_length,
        CONVERT(varbinary(max),i.gravidade) AS gravidade_bytes,
        DATALENGTH(i.gravidade) AS gravidade_length,
        CONVERT(varbinary(max),i.responsavel) AS responsavel_bytes,
        DATALENGTH(i.responsavel) AS responsavel_length,
        CONVERT(varbinary(max),i.status_item) AS status_item_bytes,
        DATALENGTH(i.status_item) AS status_item_length,
        CONVERT(varbinary(max),i.data_liberacao) AS data_liberacao_bytes,
        DATALENGTH(i.data_liberacao) AS data_liberacao_length,
        CONVERT(varbinary(max),i.motivo_liberacao) AS motivo_liberacao_bytes,
        DATALENGTH(i.motivo_liberacao) AS motivo_liberacao_length,
        CONVERT(varbinary(max),i.responsavel_liberacao) AS responsavel_liberacao_bytes,
        DATALENGTH(i.responsavel_liberacao) AS responsavel_liberacao_length
 FROM (SELECT f.data_folha,i.* FROM dbo.item_folha_ci i JOIN dbo.folha_ci f ON f.id=i.folha_id
 WHERE f.garagem=N'VCG' AND f.data_folha=CONVERT(date,'20261008',112)) i
)
SELECT N'PERSISTIDO_DIVERGENTE' direcao,d.* FROM (SELECT * FROM persistido EXCEPT SELECT * FROM esperado) d
UNION ALL
SELECT N'ESPERADO_AUSENTE',d.* FROM (SELECT * FROM esperado EXCEPT SELECT * FROM persistido) d;
