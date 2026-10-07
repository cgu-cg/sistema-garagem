-- DATA-001C4: validacao estrutural SOMENTE LEITURA, NAO EXECUTADA.
-- Somente catalogos: nenhum registro operacional e nenhuma inicializacao.
-- Executar futuramente apenas com autorizacao/banco alvo confirmado.
-- Resultados por objeto: OK, AUSENTE, DIVERGENTE ou REVISAR_DEFINICAO.
-- CHECKs: lista fechada de representacoes equivalentes; literais/agrupamentos preservados.
-- Expressoes nao reconhecidas e filtros diferentes exigem revisao manual.
-- Objetos adicionais sao reportados para analise, sem reparo.
-- Sem VIEW DEFINITION no banco, resultados NAO certificam ausencia/completude.

SELECT N'00_identificacao' AS bloco, DB_NAME() AS banco,
       CAST(SERVERPROPERTY('ProductVersion') AS NVARCHAR(128)) AS versao,
       HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'VIEW DEFINITION') AS possui_view_definition;

;WITH alvos(tabela) AS (SELECT v.tabela FROM (VALUES
    (N'ciclo_operacional'),
    (N'folha_ci'),
    (N'item_folha_ci'),
    (N'estado_manutencao_ciclo')
) v(tabela))
SELECT N'01_tabelas' AS bloco, N'dbo' AS esquema, a.tabela,
       CASE WHEN t.object_id IS NULL THEN N'AUSENTE' ELSE N'OK' END AS resultado
FROM alvos a LEFT JOIN sys.schemas s ON s.name = N'dbo'
LEFT JOIN sys.tables t ON t.schema_id = s.schema_id AND t.name = a.tabela
ORDER BY a.tabela;

;WITH esperadas(tabela,coluna,ordem,tipo,bytes,nullable,identity_flag,escala) AS (
    SELECT * FROM (VALUES
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
    ) v(tabela,coluna,ordem,tipo,bytes,nullable,identity_flag,escala)
)
SELECT N'02_colunas' AS bloco, e.tabela, e.coluna,
       CASE WHEN c.column_id IS NULL THEN N'AUSENTE'
            WHEN ty.name <> e.tipo OR ty.is_user_defined <> 0 OR c.is_nullable <> e.nullable
              OR c.is_identity <> e.identity_flag OR c.column_id <> e.ordem OR c.is_computed <> 0
              OR (e.bytes IS NOT NULL AND c.max_length <> e.bytes)
              OR (e.escala IS NOT NULL AND c.scale <> e.escala)
              OR (e.identity_flag = 1 AND (CONVERT(BIGINT,ic.seed_value) <> 1 OR CONVERT(BIGINT,ic.increment_value) <> 1))
            THEN N'DIVERGENTE' ELSE N'OK' END AS resultado,
       e.tipo AS tipo_esperado, ty.name AS tipo_real, e.bytes AS bytes_esperados, c.max_length AS bytes_reais,
       e.nullable AS nullable_esperado, c.is_nullable AS nullable_real,
       e.identity_flag AS identity_esperado, c.is_identity AS identity_real,
       e.escala AS escala_esperada, c.scale AS escala_real, ic.seed_value, ic.increment_value
FROM esperadas e LEFT JOIN sys.schemas s ON s.name = N'dbo'
LEFT JOIN sys.tables t ON t.schema_id = s.schema_id AND t.name = e.tabela
LEFT JOIN sys.columns c ON c.object_id = t.object_id AND c.name = e.coluna
LEFT JOIN sys.types ty ON ty.user_type_id = c.user_type_id
LEFT JOIN sys.identity_columns ic ON ic.object_id = c.object_id AND ic.column_id = c.column_id
ORDER BY e.tabela, e.ordem;

;WITH esperados(tabela,nome,classe,unique_flag,tipo,filtro,chaves) AS (
    SELECT * FROM (VALUES
    (N'ciclo_operacional', N'PK_ciclo_operacional', N'PK', 1, 1, NULL, N'id'),
    (N'ciclo_operacional', N'UQ_ciclo_operacional_garagem_data', N'UQ', 1, 2, NULL, N'garagem,data_operacional'),
    (N'ciclo_operacional', N'UQ_ciclo_operacional_id_garagem', N'UQ', 1, 2, NULL, N'id,garagem'),
    (N'folha_ci', N'PK_folha_ci', N'PK', 1, 1, NULL, N'id'),
    (N'folha_ci', N'UQ_folha_ci_garagem_data', N'UQ', 1, 2, NULL, N'garagem,data_folha'),
    (N'folha_ci', N'UQ_folha_ci_id_garagem', N'UQ', 1, 2, NULL, N'id,garagem'),
    (N'folha_ci', N'UQ_folha_ci_ciclo_preparacao', N'INDEX', 1, 2, N'ciclo_preparacao_id IS NOT NULL', N'ciclo_preparacao_id'),
    (N'folha_ci', N'IX_folha_ci_folha_origem_garagem', N'INDEX', 0, 2, NULL, N'folha_origem_id,garagem'),
    (N'item_folha_ci', N'PK_item_folha_ci', N'PK', 1, 1, NULL, N'id'),
    (N'item_folha_ci', N'UQ_item_folha_ci_folha_chave', N'UQ', 1, 2, NULL, N'folha_id,chave_item'),
    (N'item_folha_ci', N'UQ_item_folha_ci_bloqueado_prefixo', N'INDEX', 1, 2, N'categoria = N''BLOQUEADO''', N'folha_id,prefixo'),
    (N'item_folha_ci', N'UQ_item_folha_ci_reforco_posicao', N'INDEX', 1, 2, N'categoria = N''REFORCO''', N'folha_id,tipo_posicao,ordem_posicao'),
    (N'item_folha_ci', N'IX_item_folha_ci_folha_categoria', N'INDEX', 0, 2, NULL, N'folha_id,categoria'),
    (N'item_folha_ci', N'IX_item_folha_ci_folha_prefixo', N'INDEX', 0, 2, NULL, N'folha_id,prefixo'),
    (N'estado_manutencao_ciclo', N'PK_estado_manutencao_ciclo', N'PK', 1, 1, NULL, N'id'),
    (N'estado_manutencao_ciclo', N'UQ_estado_manutencao_ciclo_ciclo_prefixo', N'UQ', 1, 2, NULL, N'ciclo_id,prefixo')
    ) v(tabela,nome,classe,unique_flag,tipo,filtro,chaves)
), reais AS (
    SELECT t.name AS tabela, i.*, k.type AS constraint_type,
           STUFF((SELECT N',' + c.name FROM sys.index_columns ic
                  JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                  WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.key_ordinal > 0
                  ORDER BY ic.key_ordinal FOR XML PATH(''), TYPE).value('.', 'nvarchar(max)'), 1, 1, N'') AS chaves,
           (SELECT COUNT(*) FROM sys.index_columns ic WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id
            AND (ic.is_included_column = 1 OR ic.is_descending_key = 1)) AS extras
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id AND s.name = N'dbo'
    JOIN sys.indexes i ON i.object_id = t.object_id
    LEFT JOIN sys.key_constraints k ON k.parent_object_id = i.object_id AND k.unique_index_id = i.index_id
)
SELECT N'03_indices_pk_unique' AS bloco, e.tabela, e.nome,
       CASE WHEN r.index_id IS NULL THEN N'AUSENTE'
            WHEN r.is_disabled <> 0 OR r.is_hypothetical <> 0 OR r.ignore_dup_key <> 0
              OR r.is_unique <> e.unique_flag OR r.type <> e.tipo OR r.chaves <> e.chaves OR r.extras <> 0
              OR (e.classe IN (N'PK',N'UQ') AND COALESCE(r.constraint_type,N'') <> e.classe)
              OR (e.classe = N'INDEX' AND r.constraint_type IS NOT NULL)
              OR (e.filtro IS NULL AND r.has_filter <> 0)
              OR (e.filtro IS NOT NULL AND (r.has_filter <> 1 OR r.filter_definition IS NULL))
            THEN N'DIVERGENTE'
            WHEN e.filtro IS NOT NULL
              AND r.filter_definition COLLATE Latin1_General_100_BIN2 <> e.filtro COLLATE Latin1_General_100_BIN2
              AND r.filter_definition COLLATE Latin1_General_100_BIN2 <> (N'('+e.filtro+N')') COLLATE Latin1_General_100_BIN2
              AND NOT (
                  -- Whitelist fechada: nao remover espacos/literais do filtro.
                  (e.nome=N'UQ_folha_ci_ciclo_preparacao' AND r.filter_definition COLLATE Latin1_General_100_BIN2 IN
                    (N'[ciclo_preparacao_id] IS NOT NULL',N'([ciclo_preparacao_id] IS NOT NULL)',N'(([ciclo_preparacao_id] IS NOT NULL))'))
                  OR (e.nome=N'UQ_item_folha_ci_bloqueado_prefixo' AND r.filter_definition COLLATE Latin1_General_100_BIN2 IN
                    (N'[categoria]=N''BLOQUEADO''',N'([categoria]=N''BLOQUEADO'')',N'(([categoria]=N''BLOQUEADO''))'))
                  OR (e.nome=N'UQ_item_folha_ci_reforco_posicao' AND r.filter_definition COLLATE Latin1_General_100_BIN2 IN
                    (N'[categoria]=N''REFORCO''',N'([categoria]=N''REFORCO'')',N'(([categoria]=N''REFORCO''))'))
              )
            THEN N'REVISAR_DEFINICAO' ELSE N'OK' END AS resultado,
       e.chaves AS chaves_esperadas, r.chaves AS chaves_reais, e.filtro AS filtro_esperado, r.filter_definition AS filtro_real,
       r.is_disabled, r.ignore_dup_key
FROM esperados e LEFT JOIN reais r ON r.tabela = e.tabela AND r.name = e.nome
ORDER BY e.tabela,e.nome;

;WITH esperadas(tabela,nome,destino,colunas,colunas_destino) AS (
    SELECT * FROM (VALUES
    (N'folha_ci', N'FK_folha_ci_ciclo_garagem', N'ciclo_operacional', N'ciclo_preparacao_id,garagem', N'id,garagem'),
    (N'folha_ci', N'FK_folha_ci_origem_garagem', N'folha_ci', N'folha_origem_id,garagem', N'id,garagem'),
    (N'folha_ci', N'FK_folha_ci_responsavel', N'users', N'responsavel_registro_id', N'id'),
    (N'item_folha_ci', N'FK_item_folha_ci_folha', N'folha_ci', N'folha_id', N'id'),
    (N'item_folha_ci', N'FK_item_folha_ci_responsavel', N'users', N'responsavel_registro_id', N'id'),
    (N'estado_manutencao_ciclo', N'FK_estado_manutencao_ciclo_ciclo', N'ciclo_operacional', N'ciclo_id', N'id'),
    (N'estado_manutencao_ciclo', N'FK_estado_manutencao_ciclo_responsavel', N'users', N'responsavel_registro_id', N'id')
    ) v(tabela,nome,destino,colunas,colunas_destino)
), reais AS (
    SELECT t.name AS tabela, f.*, rt.name AS destino, rs.name AS esquema_destino,
           STUFF((SELECT N',' + c.name FROM sys.foreign_key_columns fc
                  JOIN sys.columns c ON c.object_id = fc.parent_object_id AND c.column_id = fc.parent_column_id
                  WHERE fc.constraint_object_id = f.object_id ORDER BY fc.constraint_column_id
                  FOR XML PATH(''), TYPE).value('.', 'nvarchar(max)'),1,1,N'') AS colunas,
           STUFF((SELECT N',' + c.name FROM sys.foreign_key_columns fc
                  JOIN sys.columns c ON c.object_id = fc.referenced_object_id AND c.column_id = fc.referenced_column_id
                  WHERE fc.constraint_object_id = f.object_id ORDER BY fc.constraint_column_id
                  FOR XML PATH(''), TYPE).value('.', 'nvarchar(max)'),1,1,N'') AS colunas_destino
    FROM sys.foreign_keys f JOIN sys.tables t ON t.object_id = f.parent_object_id
    JOIN sys.schemas s ON s.schema_id = t.schema_id AND s.name = N'dbo'
    JOIN sys.tables rt ON rt.object_id = f.referenced_object_id JOIN sys.schemas rs ON rs.schema_id = rt.schema_id
)
SELECT N'04_foreign_keys' AS bloco, e.tabela,e.nome,
       CASE WHEN r.object_id IS NULL THEN N'AUSENTE'
            WHEN r.destino <> e.destino OR r.esquema_destino <> N'dbo' OR r.colunas <> e.colunas
              OR r.colunas_destino <> e.colunas_destino OR r.delete_referential_action <> 0
              OR r.update_referential_action <> 0 OR r.is_disabled <> 0 OR r.is_not_trusted <> 0 OR r.is_not_for_replication <> 0
            THEN N'DIVERGENTE' ELSE N'OK' END AS resultado,
       e.destino AS destino_esperado,r.destino AS destino_real,
       e.colunas AS colunas_esperadas,r.colunas AS colunas_reais,
       e.colunas_destino AS referencias_esperadas,r.colunas_destino AS referencias_reais,
       r.delete_referential_action_desc,r.update_referential_action_desc,r.is_disabled,r.is_not_trusted
FROM esperadas e LEFT JOIN reais r ON r.tabela=e.tabela AND r.name=e.nome ORDER BY e.tabela,e.nome;

;WITH esperadas(tabela,nome,definicao) AS (
    SELECT * FROM (VALUES
    (N'ciclo_operacional', N'CK_ciclo_operacional_garagem', N'(garagem IN (N''VCG'', N''VCM''))'),
    (N'ciclo_operacional', N'CK_ciclo_operacional_origem', N'(origem IN (N''NORMAL'', N''RECUPERACAO''))'),
    (N'folha_ci', N'CK_folha_ci_garagem', N'(garagem IN (N''VCG'', N''VCM''))'),
    (N'folha_ci', N'CK_folha_ci_status', N'(status IN (N''EM_PREPARACAO'', N''FINALIZADA''))'),
    (N'folha_ci', N'CK_folha_ci_origem', N'(origem IN (N''NORMAL'', N''IMPORTACAO'', N''RECUPERACAO''))'),
    (N'folha_ci', N'CK_folha_ci_nao_autorreferencia', N'(folha_origem_id IS NULL OR folha_origem_id <> id)'),
    (N'folha_ci', N'CK_folha_ci_titulo', N'(titulo_coluna_adicional IS NULL OR titulo_coluna_adicional IN (N''INSPEÇÃO'', N''LUBRIFICAÇÃO'', N''EM MANUTENÇÃO'', N''TROCA DE ÓLEO'', N''REVISÃO'', N''PREVENTIVA''))'),
    (N'folha_ci', N'CK_folha_ci_origem_vinculos', N'((origem = N''NORMAL'' AND ciclo_preparacao_id IS NOT NULL AND folha_origem_id IS NOT NULL AND inicializacao_prevista_em IS NOT NULL AND inicializada_em IS NOT NULL) OR (origem = N''IMPORTACAO'' AND status = N''FINALIZADA'' AND ciclo_preparacao_id IS NULL AND folha_origem_id IS NULL) OR (origem = N''RECUPERACAO'' AND folha_origem_id IS NULL))'),
    (N'folha_ci', N'CK_folha_ci_preparacao_tempos', N'(status <> N''EM_PREPARACAO'' OR (ciclo_preparacao_id IS NOT NULL AND inicializacao_prevista_em IS NOT NULL AND inicializada_em IS NOT NULL AND finalizacao_prevista_em IS NOT NULL AND finalizada_em IS NULL))'),
    (N'folha_ci', N'CK_folha_ci_finalizada_tempo', N'(status <> N''FINALIZADA'' OR origem = N''IMPORTACAO'' OR finalizada_em IS NOT NULL)'),
    (N'item_folha_ci', N'CK_item_folha_ci_categoria', N'(categoria IN (N''PREVENTIVA'', N''OFICINA'', N''REFORCO'', N''BLOQUEADO''))'),
    (N'item_folha_ci', N'CK_item_folha_ci_data_bloqueio', N'(categoria <> N''BLOQUEADO'' OR data_bloqueio IS NOT NULL)'),
    (N'item_folha_ci', N'CK_item_folha_ci_posicao', N'((categoria = N''REFORCO'' AND tipo_posicao IS NOT NULL AND ordem_posicao IS NOT NULL AND ((tipo_posicao = N''FIXO'' AND ordem_posicao BETWEEN 1 AND 12) OR (tipo_posicao = N''EXTRA'' AND ordem_posicao > 0))) OR (categoria <> N''REFORCO'' AND tipo_posicao IS NULL AND ordem_posicao IS NULL))'),
    (N'item_folha_ci', N'CK_item_folha_ci_prefixo', N'(LEN(LTRIM(RTRIM(prefixo))) > 0)'),
    (N'item_folha_ci', N'CK_item_folha_ci_consorciada', N'((consorciada IS NULL OR consorciada IN (N''VSF'', N''VCG'', N''JTU'', N''VCM'')) AND (categoria <> N''BLOQUEADO'' OR consorciada IS NOT NULL))'),
    (N'estado_manutencao_ciclo', N'CK_estado_manutencao_ciclo_liberacao', N'(liberado = 0 OR (bloqueado = 0 AND em_execucao = 0))'),
    (N'estado_manutencao_ciclo', N'CK_estado_manutencao_ciclo_prefixo', N'(LEN(LTRIM(RTRIM(prefixo))) > 0)'),
    (N'estado_manutencao_ciclo', N'CK_estado_manutencao_ciclo_consorciada', N'(LEN(LTRIM(RTRIM(consorciada))) > 0)')
    ) v(tabela,nome,definicao)
), alternativas(nome,definicao) AS (
    -- Formas equivalentes conhecidas do catalogo; nao avaliar SQL dos metadados.
    -- IN pode ser expandido em OR. Cada alternativa preserva os mesmos valores.
    SELECT * FROM (VALUES
    (N'CK_ciclo_operacional_garagem', N'(garagem=N''VCM'' OR garagem=N''VCG'')'),
    (N'CK_ciclo_operacional_origem', N'(origem=N''RECUPERACAO'' OR origem=N''NORMAL'')'),
    (N'CK_folha_ci_garagem', N'(garagem=N''VCM'' OR garagem=N''VCG'')'),
    (N'CK_folha_ci_status', N'(status=N''FINALIZADA'' OR status=N''EM_PREPARACAO'')'),
    (N'CK_folha_ci_origem', N'(origem=N''RECUPERACAO'' OR origem=N''IMPORTACAO'' OR origem=N''NORMAL'')'),
    (N'CK_item_folha_ci_categoria', N'(categoria=N''BLOQUEADO'' OR categoria=N''REFORCO'' OR categoria=N''OFICINA'' OR categoria=N''PREVENTIVA'')'),
    (N'CK_folha_ci_titulo', N'(titulo_coluna_adicional IS NULL OR (titulo_coluna_adicional=N''PREVENTIVA'' OR titulo_coluna_adicional=N''REVISÃO'' OR titulo_coluna_adicional=N''TROCA DE ÓLEO'' OR titulo_coluna_adicional=N''EM MANUTENÇÃO'' OR titulo_coluna_adicional=N''LUBRIFICAÇÃO'' OR titulo_coluna_adicional=N''INSPEÇÃO''))'),
    (N'CK_item_folha_ci_consorciada', N'((consorciada IS NULL OR (consorciada=N''VCM'' OR consorciada=N''JTU'' OR consorciada=N''VCG'' OR consorciada=N''VSF'')) AND (categoria<>N''BLOQUEADO'' OR consorciada IS NOT NULL))'),
    (N'CK_estado_manutencao_ciclo_liberacao', N'(liberado=0 OR bloqueado=0 AND em_execucao=0)'),
    (N'CK_folha_ci_preparacao_tempos', N'(status<>N''EM_PREPARACAO'' OR ciclo_preparacao_id IS NOT NULL AND inicializacao_prevista_em IS NOT NULL AND inicializada_em IS NOT NULL AND finalizacao_prevista_em IS NOT NULL AND finalizada_em IS NULL)'),
    (N'CK_folha_ci_origem_vinculos', N'(origem=N''NORMAL'' AND ciclo_preparacao_id IS NOT NULL AND folha_origem_id IS NOT NULL AND inicializacao_prevista_em IS NOT NULL AND inicializada_em IS NOT NULL OR origem=N''IMPORTACAO'' AND status=N''FINALIZADA'' AND ciclo_preparacao_id IS NULL AND folha_origem_id IS NULL OR origem=N''RECUPERACAO'' AND folha_origem_id IS NULL)'),
    -- LTRIM e RTRIM de espacos nas extremidades comutam para estas strings.
    (N'CK_item_folha_ci_prefixo', N'(LEN(RTRIM(LTRIM(prefixo)))>0)'),
    (N'CK_estado_manutencao_ciclo_prefixo', N'(LEN(RTRIM(LTRIM(prefixo)))>0)'),
    (N'CK_estado_manutencao_ciclo_consorciada', N'(LEN(RTRIM(LTRIM(consorciada)))>0)'),
    -- Reordenacao apenas destas disjuncoes conhecidas e completas.
    (N'CK_ciclo_operacional_garagem', N'(garagem=N''VCG'' OR garagem=N''VCM'')'),
    (N'CK_ciclo_operacional_origem', N'(origem=N''NORMAL'' OR origem=N''RECUPERACAO'')'),
    (N'CK_folha_ci_garagem', N'(garagem=N''VCG'' OR garagem=N''VCM'')'),
    (N'CK_folha_ci_status', N'(status=N''EM_PREPARACAO'' OR status=N''FINALIZADA'')'),
    (N'CK_folha_ci_nao_autorreferencia', N'(folha_origem_id<>id OR folha_origem_id IS NULL)'),
    (N'CK_folha_ci_finalizada_tempo', N'(finalizada_em IS NOT NULL OR origem=N''IMPORTACAO'' OR status<>N''FINALIZADA'')'),
    -- Parenteses de atomos explicitamente enumerados; nao achatar AND/OR.
    (N'CK_estado_manutencao_ciclo_liberacao', N'((liberado=0) OR ((bloqueado=0) AND (em_execucao=0)))'),
    (N'CK_estado_manutencao_ciclo_liberacao', N'((liberado=0) OR (bloqueado=0) AND (em_execucao=0))'),
    (N'CK_folha_ci_nao_autorreferencia', N'((folha_origem_id IS NULL) OR (folha_origem_id<>id))'),
    (N'CK_folha_ci_finalizada_tempo', N'((status<>N''FINALIZADA'') OR (origem=N''IMPORTACAO'') OR (finalizada_em IS NOT NULL))'),
    -- Forma real coletada no SQL Server 2012: BETWEEN expandido, AND antes de OR.
    (N'CK_item_folha_ci_posicao', N'(categoria=N''REFORCO'' AND tipo_posicao IS NOT NULL AND ordem_posicao IS NOT NULL AND (tipo_posicao=N''FIXO'' AND (ordem_posicao>=1 AND ordem_posicao<=12) OR tipo_posicao=N''EXTRA'' AND ordem_posicao>0) OR categoria<>N''REFORCO'' AND tipo_posicao IS NULL AND ordem_posicao IS NULL)')
    ) v(nome,definicao)
), fontes(nome,lado,definicao) AS (
    SELECT nome, N'E', definicao FROM esperadas
    UNION ALL SELECT nome, N'E', definicao FROM alternativas
    UNION ALL
    SELECT e.nome,N'R',c.definition FROM esperadas e
    JOIN sys.schemas s ON s.name=N'dbo'
    JOIN sys.tables t ON t.schema_id=s.schema_id AND t.name=e.tabela
    JOIN sys.check_constraints c ON c.parent_object_id=t.object_id AND c.name=e.nome
    WHERE c.definition IS NOT NULL
), caracteres(nome,lado,definicao,posicao,em_literal,em_identificador,normalizada) AS (
    -- Remover espacos/colchetes e normalizar caixa SOMENTE fora de literais.
    -- 'EM MANUTENÇÃO' nao pode ser confundido com 'EMMANUTENÇÃO'.
    SELECT nome,lado,definicao,CAST(1 AS INT),CAST(0 AS INT),CAST(0 AS INT),CAST(N'' AS NVARCHAR(MAX)) FROM fontes
    UNION ALL
    SELECT nome,lado,definicao,posicao+1,
           CASE WHEN em_identificador=0 AND SUBSTRING(definicao,posicao,1)=N'''' THEN 1-em_literal ELSE em_literal END,
           CASE WHEN em_literal=0 AND SUBSTRING(definicao,posicao,1)=N'[' THEN 1
                WHEN em_literal=0 AND SUBSTRING(definicao,posicao,1)=N']' THEN 0 ELSE em_identificador END,
           CAST(normalizada + CASE
               WHEN SUBSTRING(definicao,posicao,1)=N'''' OR em_literal=1 THEN SUBSTRING(definicao,posicao,1)
               WHEN em_identificador=1 OR SUBSTRING(definicao,posicao,1)=N'[' THEN UPPER(SUBSTRING(definicao,posicao,1))
               WHEN SUBSTRING(definicao,posicao,1) IN (N' ',NCHAR(9),NCHAR(10),NCHAR(13)) THEN N''
               ELSE UPPER(SUBSTRING(definicao,posicao,1)) END AS NVARCHAR(MAX))
    FROM caracteres WHERE posicao<=LEN(definicao)
), identificadores_normalizados AS (
    -- Remover delimitadores apenas de identificadores conhecidos, sem apagar
    -- espacos/operadores de um eventual identificador diferente.
    SELECT nome,lado,REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(normalizada,N'[GARAGEM]',N'GARAGEM'),N'[ORIGEM]',N'ORIGEM'),N'[STATUS]',N'STATUS'),N'[FOLHA_ORIGEM_ID]',N'FOLHA_ORIGEM_ID'),N'[ID]',N'ID'),N'[TITULO_COLUNA_ADICIONAL]',N'TITULO_COLUNA_ADICIONAL'),N'[CICLO_PREPARACAO_ID]',N'CICLO_PREPARACAO_ID'),N'[INICIALIZACAO_PREVISTA_EM]',N'INICIALIZACAO_PREVISTA_EM'),N'[INICIALIZADA_EM]',N'INICIALIZADA_EM'),N'[FINALIZACAO_PREVISTA_EM]',N'FINALIZACAO_PREVISTA_EM'),N'[FINALIZADA_EM]',N'FINALIZADA_EM'),N'[CATEGORIA]',N'CATEGORIA'),N'[DATA_BLOQUEIO]',N'DATA_BLOQUEIO'),N'[TIPO_POSICAO]',N'TIPO_POSICAO'),N'[ORDEM_POSICAO]',N'ORDEM_POSICAO'),N'[PREFIXO]',N'PREFIXO'),N'[CONSORCIADA]',N'CONSORCIADA'),N'[LIBERADO]',N'LIBERADO'),N'[BLOQUEADO]',N'BLOQUEADO'),N'[EM_EXECUCAO]',N'EM_EXECUCAO') AS normalizada
    FROM caracteres WHERE posicao=LEN(definicao)+1
), normalizadas AS (
    SELECT nome,lado,
           -- Parenteses de constantes numericas nao mudam a precedencia booleana.
           REPLACE(REPLACE(REPLACE(normalizada,N'(0)',N'0'),N'(1)',N'1'),N'(12)',N'12') AS expressao
    FROM identificadores_normalizados
), aceitas(nome,expressao,envoltorios) AS (
    SELECT nome,CAST(expressao AS NVARCHAR(MAX)),CAST(0 AS INT) FROM normalizadas WHERE lado=N'E'
    UNION ALL
    -- Apenas envolver a expressao INTEIRA; nunca remover seus grupos internos.
    SELECT nome,CAST(N'('+expressao+N')' AS NVARCHAR(MAX)),envoltorios+1
    FROM aceitas WHERE envoltorios<3
), simples(nome,coluna) AS (
    SELECT * FROM (VALUES
    (N'CK_ciclo_operacional_garagem',N'garagem'),
    (N'CK_ciclo_operacional_origem',N'origem'),
    (N'CK_folha_ci_garagem',N'garagem'),
    (N'CK_folha_ci_status',N'status'),
    (N'CK_folha_ci_origem',N'origem'),
    (N'CK_folha_ci_titulo',N'titulo_coluna_adicional'),
    (N'CK_item_folha_ci_categoria',N'categoria'),
    (N'CK_item_folha_ci_prefixo',N'prefixo'),
    (N'CK_estado_manutencao_ciclo_prefixo',N'prefixo'),
    (N'CK_estado_manutencao_ciclo_consorciada',N'consorciada')
    ) v(nome,coluna)
)
SELECT N'05_checks' AS bloco,e.tabela,e.nome,
       CASE WHEN c.object_id IS NULL THEN N'AUSENTE'
            WHEN c.is_disabled <> 0 OR c.is_not_trusted <> 0 OR c.is_not_for_replication <> 0
              OR (c.parent_column_id<>0 AND (sc.column_id IS NULL OR c.parent_column_id<>sc.column_id)) THEN N'DIVERGENTE'
            WHEN EXISTS (SELECT 1 FROM aceitas a WHERE a.nome=e.nome
                         AND a.expressao COLLATE Latin1_General_100_BIN2=r.expressao COLLATE Latin1_General_100_BIN2)
            THEN N'OK'
            -- Reconhecer explicitamente o contrato antigo, agora incompatível.
            WHEN e.nome=N'CK_item_folha_ci_consorciada'
              AND REPLACE(REPLACE(r.expressao,N'(',N''),N')',N'') COLLATE Latin1_General_100_BIN2 IN
                  (N'LENLTRIMRTRIMCONSORCIADA>0',N'LENRTRIMLTRIMCONSORCIADA>0')
            THEN N'DIVERGENTE'
            ELSE N'REVISAR_DEFINICAO' END AS resultado,
       e.definicao AS definicao_esperada,c.definition AS definicao_real,
       c.is_disabled,c.is_not_trusted,c.is_not_for_replication,c.parent_column_id,
       CASE WHEN c.definition IS NULL THEN N'Definicao nao visivel: equivalencia nao certificada'
            ELSE N'OK exige representacao reconhecida e CHECK ativo/confiavel; outras expressoes requerem revisao' END AS criterio
FROM esperadas e LEFT JOIN sys.schemas s ON s.name=N'dbo'
LEFT JOIN sys.tables t ON t.schema_id=s.schema_id AND t.name=e.tabela
LEFT JOIN sys.check_constraints c ON c.parent_object_id=t.object_id AND c.name=e.nome
LEFT JOIN simples si ON si.nome=e.nome
LEFT JOIN sys.columns sc ON sc.object_id=t.object_id AND sc.name=si.coluna
LEFT JOIN normalizadas r ON r.nome=e.nome AND r.lado=N'R'
ORDER BY e.tabela,e.nome
OPTION (MAXRECURSION 0);

;WITH esperados(tabela,coluna,nome,definicao) AS (
    SELECT * FROM (VALUES
    (N'ciclo_operacional', N'id', NULL, NULL),
    (N'ciclo_operacional', N'garagem', NULL, NULL),
    (N'ciclo_operacional', N'data_operacional', NULL, NULL),
    (N'ciclo_operacional', N'origem', NULL, NULL),
    (N'ciclo_operacional', N'inicializacao_prevista_em', NULL, NULL),
    (N'ciclo_operacional', N'inicializado_em', NULL, NULL),
    (N'ciclo_operacional', N'referencia_origem', NULL, NULL),
    (N'ciclo_operacional', N'created_at', N'DF_ciclo_operacional_created_at', N'SYSUTCDATETIME()'),
    (N'ciclo_operacional', N'updated_at', N'DF_ciclo_operacional_updated_at', N'SYSUTCDATETIME()'),
    (N'folha_ci', N'id', NULL, NULL),
    (N'folha_ci', N'garagem', NULL, NULL),
    (N'folha_ci', N'data_folha', NULL, NULL),
    (N'folha_ci', N'status', NULL, NULL),
    (N'folha_ci', N'origem', NULL, NULL),
    (N'folha_ci', N'ciclo_preparacao_id', NULL, NULL),
    (N'folha_ci', N'folha_origem_id', NULL, NULL),
    (N'folha_ci', N'titulo_coluna_adicional', NULL, NULL),
    (N'folha_ci', N'inicializacao_prevista_em', NULL, NULL),
    (N'folha_ci', N'inicializada_em', NULL, NULL),
    (N'folha_ci', N'finalizacao_prevista_em', NULL, NULL),
    (N'folha_ci', N'finalizada_em', NULL, NULL),
    (N'folha_ci', N'referencia_origem', NULL, NULL),
    (N'folha_ci', N'responsavel_registro_id', NULL, NULL),
    (N'folha_ci', N'created_at', N'DF_folha_ci_created_at', N'SYSUTCDATETIME()'),
    (N'folha_ci', N'updated_at', N'DF_folha_ci_updated_at', N'SYSUTCDATETIME()'),
    (N'item_folha_ci', N'id', NULL, NULL),
    (N'item_folha_ci', N'folha_id', NULL, NULL),
    (N'item_folha_ci', N'chave_item', NULL, NULL),
    (N'item_folha_ci', N'categoria', NULL, NULL),
    (N'item_folha_ci', N'tipo_posicao', NULL, NULL),
    (N'item_folha_ci', N'ordem_posicao', NULL, NULL),
    (N'item_folha_ci', N'prefixo', NULL, NULL),
    (N'item_folha_ci', N'consorciada', NULL, NULL),
    (N'item_folha_ci', N'sub_tipo', NULL, NULL),
    (N'item_folha_ci', N'horario_reforco', NULL, NULL),
    (N'item_folha_ci', N'motivo', NULL, NULL),
    (N'item_folha_ci', N'observacoes', NULL, NULL),
    (N'item_folha_ci', N'hora_bloqueio', NULL, NULL),
    (N'item_folha_ci', N'gravidade', NULL, NULL),
    (N'item_folha_ci', N'responsavel', NULL, NULL),
    (N'item_folha_ci', N'status_item', NULL, NULL),
    (N'item_folha_ci', N'data_liberacao', NULL, NULL),
    (N'item_folha_ci', N'motivo_liberacao', NULL, NULL),
    (N'item_folha_ci', N'responsavel_liberacao', NULL, NULL),
    (N'item_folha_ci', N'responsavel_registro_id', NULL, NULL),
    (N'item_folha_ci', N'created_at', N'DF_item_folha_ci_created_at', N'SYSUTCDATETIME()'),
    (N'item_folha_ci', N'updated_at', N'DF_item_folha_ci_updated_at', N'SYSUTCDATETIME()'),
    (N'item_folha_ci', N'data_bloqueio', NULL, NULL),
    (N'estado_manutencao_ciclo', N'id', NULL, NULL),
    (N'estado_manutencao_ciclo', N'ciclo_id', NULL, NULL),
    (N'estado_manutencao_ciclo', N'prefixo', NULL, NULL),
    (N'estado_manutencao_ciclo', N'consorciada', NULL, NULL),
    (N'estado_manutencao_ciclo', N'bloqueado', N'DF_estado_manutencao_ciclo_bloqueado', N'0'),
    (N'estado_manutencao_ciclo', N'em_execucao', N'DF_estado_manutencao_ciclo_em_execucao', N'0'),
    (N'estado_manutencao_ciclo', N'liberado', N'DF_estado_manutencao_ciclo_liberado', N'0'),
    (N'estado_manutencao_ciclo', N'observacao_bloqueio', NULL, NULL),
    (N'estado_manutencao_ciclo', N'observacao_oficina', NULL, NULL),
    (N'estado_manutencao_ciclo', N'responsavel_registro_id', NULL, NULL),
    (N'estado_manutencao_ciclo', N'created_at', N'DF_estado_manutencao_ciclo_created_at', N'SYSUTCDATETIME()'),
    (N'estado_manutencao_ciclo', N'updated_at', N'DF_estado_manutencao_ciclo_updated_at', N'SYSUTCDATETIME()')
    ) v(tabela,coluna,nome,definicao)
)
SELECT N'06_defaults' AS bloco,e.tabela,e.coluna,
       CASE WHEN c.column_id IS NULL THEN N'AUSENTE'
            WHEN e.nome IS NULL AND d.object_id IS NULL THEN N'OK'
            WHEN e.nome IS NOT NULL AND d.object_id IS NULL THEN N'AUSENTE'
            WHEN e.nome IS NULL OR d.name <> e.nome OR d.definition IS NULL
              OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(d.definition, N'[', N''), N']', N''), N' ', N''), N'(', N''), N')', N''), N'n''', N'''')) <> LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(e.definicao, N'[', N''), N']', N''), N' ', N''), N'(', N''), N')', N''), N'n''', N''''))
            THEN N'DIVERGENTE' ELSE N'OK' END AS resultado,
       e.nome AS nome_esperado,d.name AS nome_real,e.definicao AS definicao_esperada,d.definition AS definicao_real
FROM esperados e LEFT JOIN sys.schemas s ON s.name=N'dbo'
LEFT JOIN sys.tables t ON t.schema_id=s.schema_id AND t.name=e.tabela
LEFT JOIN sys.columns c ON c.object_id=t.object_id AND c.name=e.coluna
LEFT JOIN sys.default_constraints d ON d.parent_object_id=c.object_id AND d.parent_column_id=c.column_id
ORDER BY e.tabela,e.coluna;

;WITH alvos(tabela) AS (SELECT v.tabela FROM (VALUES
    (N'ciclo_operacional'),
    (N'folha_ci'),
    (N'item_folha_ci'),
    (N'estado_manutencao_ciclo')
) v(tabela)), previstos(tabela,classe,nome) AS (
    SELECT * FROM (VALUES
    (N'ciclo_operacional', N'COLUNA', N'id'),
    (N'ciclo_operacional', N'COLUNA', N'garagem'),
    (N'ciclo_operacional', N'COLUNA', N'data_operacional'),
    (N'ciclo_operacional', N'COLUNA', N'origem'),
    (N'ciclo_operacional', N'COLUNA', N'inicializacao_prevista_em'),
    (N'ciclo_operacional', N'COLUNA', N'inicializado_em'),
    (N'ciclo_operacional', N'COLUNA', N'referencia_origem'),
    (N'ciclo_operacional', N'COLUNA', N'created_at'),
    (N'ciclo_operacional', N'COLUNA', N'updated_at'),
    (N'ciclo_operacional', N'INDICE', N'PK_ciclo_operacional'),
    (N'ciclo_operacional', N'INDICE', N'UQ_ciclo_operacional_garagem_data'),
    (N'ciclo_operacional', N'INDICE', N'UQ_ciclo_operacional_id_garagem'),
    (N'ciclo_operacional', N'CHECK', N'CK_ciclo_operacional_garagem'),
    (N'ciclo_operacional', N'CHECK', N'CK_ciclo_operacional_origem'),
    (N'folha_ci', N'COLUNA', N'id'),
    (N'folha_ci', N'COLUNA', N'garagem'),
    (N'folha_ci', N'COLUNA', N'data_folha'),
    (N'folha_ci', N'COLUNA', N'status'),
    (N'folha_ci', N'COLUNA', N'origem'),
    (N'folha_ci', N'COLUNA', N'ciclo_preparacao_id'),
    (N'folha_ci', N'COLUNA', N'folha_origem_id'),
    (N'folha_ci', N'COLUNA', N'titulo_coluna_adicional'),
    (N'folha_ci', N'COLUNA', N'inicializacao_prevista_em'),
    (N'folha_ci', N'COLUNA', N'inicializada_em'),
    (N'folha_ci', N'COLUNA', N'finalizacao_prevista_em'),
    (N'folha_ci', N'COLUNA', N'finalizada_em'),
    (N'folha_ci', N'COLUNA', N'referencia_origem'),
    (N'folha_ci', N'COLUNA', N'responsavel_registro_id'),
    (N'folha_ci', N'COLUNA', N'created_at'),
    (N'folha_ci', N'COLUNA', N'updated_at'),
    (N'folha_ci', N'INDICE', N'PK_folha_ci'),
    (N'folha_ci', N'INDICE', N'UQ_folha_ci_garagem_data'),
    (N'folha_ci', N'INDICE', N'UQ_folha_ci_id_garagem'),
    (N'folha_ci', N'INDICE', N'UQ_folha_ci_ciclo_preparacao'),
    (N'folha_ci', N'INDICE', N'IX_folha_ci_folha_origem_garagem'),
    (N'folha_ci', N'FK', N'FK_folha_ci_ciclo_garagem'),
    (N'folha_ci', N'FK', N'FK_folha_ci_origem_garagem'),
    (N'folha_ci', N'FK', N'FK_folha_ci_responsavel'),
    (N'folha_ci', N'CHECK', N'CK_folha_ci_garagem'),
    (N'folha_ci', N'CHECK', N'CK_folha_ci_status'),
    (N'folha_ci', N'CHECK', N'CK_folha_ci_origem'),
    (N'folha_ci', N'CHECK', N'CK_folha_ci_nao_autorreferencia'),
    (N'folha_ci', N'CHECK', N'CK_folha_ci_titulo'),
    (N'folha_ci', N'CHECK', N'CK_folha_ci_origem_vinculos'),
    (N'folha_ci', N'CHECK', N'CK_folha_ci_preparacao_tempos'),
    (N'folha_ci', N'CHECK', N'CK_folha_ci_finalizada_tempo'),
    (N'item_folha_ci', N'COLUNA', N'id'),
    (N'item_folha_ci', N'COLUNA', N'folha_id'),
    (N'item_folha_ci', N'COLUNA', N'chave_item'),
    (N'item_folha_ci', N'COLUNA', N'categoria'),
    (N'item_folha_ci', N'COLUNA', N'tipo_posicao'),
    (N'item_folha_ci', N'COLUNA', N'ordem_posicao'),
    (N'item_folha_ci', N'COLUNA', N'prefixo'),
    (N'item_folha_ci', N'COLUNA', N'consorciada'),
    (N'item_folha_ci', N'COLUNA', N'sub_tipo'),
    (N'item_folha_ci', N'COLUNA', N'horario_reforco'),
    (N'item_folha_ci', N'COLUNA', N'motivo'),
    (N'item_folha_ci', N'COLUNA', N'observacoes'),
    (N'item_folha_ci', N'COLUNA', N'hora_bloqueio'),
    (N'item_folha_ci', N'COLUNA', N'gravidade'),
    (N'item_folha_ci', N'COLUNA', N'responsavel'),
    (N'item_folha_ci', N'COLUNA', N'status_item'),
    (N'item_folha_ci', N'COLUNA', N'data_liberacao'),
    (N'item_folha_ci', N'COLUNA', N'motivo_liberacao'),
    (N'item_folha_ci', N'COLUNA', N'responsavel_liberacao'),
    (N'item_folha_ci', N'COLUNA', N'responsavel_registro_id'),
    (N'item_folha_ci', N'COLUNA', N'created_at'),
    (N'item_folha_ci', N'COLUNA', N'updated_at'),
    (N'item_folha_ci', N'COLUNA', N'data_bloqueio'),
    (N'item_folha_ci', N'INDICE', N'PK_item_folha_ci'),
    (N'item_folha_ci', N'INDICE', N'UQ_item_folha_ci_folha_chave'),
    (N'item_folha_ci', N'INDICE', N'UQ_item_folha_ci_bloqueado_prefixo'),
    (N'item_folha_ci', N'INDICE', N'UQ_item_folha_ci_reforco_posicao'),
    (N'item_folha_ci', N'INDICE', N'IX_item_folha_ci_folha_categoria'),
    (N'item_folha_ci', N'INDICE', N'IX_item_folha_ci_folha_prefixo'),
    (N'item_folha_ci', N'FK', N'FK_item_folha_ci_folha'),
    (N'item_folha_ci', N'FK', N'FK_item_folha_ci_responsavel'),
    (N'item_folha_ci', N'CHECK', N'CK_item_folha_ci_categoria'),
    (N'item_folha_ci', N'CHECK', N'CK_item_folha_ci_data_bloqueio'),
    (N'item_folha_ci', N'CHECK', N'CK_item_folha_ci_posicao'),
    (N'item_folha_ci', N'CHECK', N'CK_item_folha_ci_prefixo'),
    (N'item_folha_ci', N'CHECK', N'CK_item_folha_ci_consorciada'),
    (N'estado_manutencao_ciclo', N'COLUNA', N'id'),
    (N'estado_manutencao_ciclo', N'COLUNA', N'ciclo_id'),
    (N'estado_manutencao_ciclo', N'COLUNA', N'prefixo'),
    (N'estado_manutencao_ciclo', N'COLUNA', N'consorciada'),
    (N'estado_manutencao_ciclo', N'COLUNA', N'bloqueado'),
    (N'estado_manutencao_ciclo', N'COLUNA', N'em_execucao'),
    (N'estado_manutencao_ciclo', N'COLUNA', N'liberado'),
    (N'estado_manutencao_ciclo', N'COLUNA', N'observacao_bloqueio'),
    (N'estado_manutencao_ciclo', N'COLUNA', N'observacao_oficina'),
    (N'estado_manutencao_ciclo', N'COLUNA', N'responsavel_registro_id'),
    (N'estado_manutencao_ciclo', N'COLUNA', N'created_at'),
    (N'estado_manutencao_ciclo', N'COLUNA', N'updated_at'),
    (N'estado_manutencao_ciclo', N'INDICE', N'PK_estado_manutencao_ciclo'),
    (N'estado_manutencao_ciclo', N'INDICE', N'UQ_estado_manutencao_ciclo_ciclo_prefixo'),
    (N'estado_manutencao_ciclo', N'FK', N'FK_estado_manutencao_ciclo_ciclo'),
    (N'estado_manutencao_ciclo', N'FK', N'FK_estado_manutencao_ciclo_responsavel'),
    (N'estado_manutencao_ciclo', N'CHECK', N'CK_estado_manutencao_ciclo_liberacao'),
    (N'estado_manutencao_ciclo', N'CHECK', N'CK_estado_manutencao_ciclo_prefixo'),
    (N'estado_manutencao_ciclo', N'CHECK', N'CK_estado_manutencao_ciclo_consorciada')
    ) v(tabela,classe,nome)
), encontrados AS (
    SELECT t.name AS tabela,N'COLUNA' AS classe,c.name AS nome FROM alvos a
    JOIN sys.tables t ON t.name=a.tabela JOIN sys.schemas s ON s.schema_id=t.schema_id AND s.name=N'dbo'
    JOIN sys.columns c ON c.object_id=t.object_id
    UNION ALL
    SELECT t.name,N'INDICE',i.name FROM alvos a JOIN sys.tables t ON t.name=a.tabela
    JOIN sys.schemas s ON s.schema_id=t.schema_id AND s.name=N'dbo' JOIN sys.indexes i ON i.object_id=t.object_id AND i.index_id>0
    UNION ALL
    SELECT t.name,N'FK',f.name FROM alvos a JOIN sys.tables t ON t.name=a.tabela
    JOIN sys.schemas s ON s.schema_id=t.schema_id AND s.name=N'dbo' JOIN sys.foreign_keys f ON f.parent_object_id=t.object_id
    UNION ALL
    SELECT t.name,N'CHECK',c.name FROM alvos a JOIN sys.tables t ON t.name=a.tabela
    JOIN sys.schemas s ON s.schema_id=t.schema_id AND s.name=N'dbo' JOIN sys.check_constraints c ON c.parent_object_id=t.object_id
    UNION ALL
    SELECT t.name,N'TRIGGER',tr.name FROM alvos a JOIN sys.tables t ON t.name=a.tabela
    JOIN sys.schemas s ON s.schema_id=t.schema_id AND s.name=N'dbo' JOIN sys.triggers tr ON tr.parent_id=t.object_id
)
SELECT N'07_objetos_adicionais' AS bloco,e.*,N'REVISAR' AS resultado FROM encontrados e
WHERE NOT EXISTS(SELECT 1 FROM previstos p WHERE p.tabela=e.tabela AND p.classe=e.classe AND p.nome=e.nome)
ORDER BY e.tabela,e.classe,e.nome;

-- Pre-requisito externo somente por metadados; nenhuma leitura de users.
SELECT N'08_users_pre_requisito' AS bloco,
       CASE WHEN EXISTS (
           SELECT 1 FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id AND s.name=N'dbo'
           JOIN sys.columns c ON c.object_id=t.object_id AND c.name=N'id'
           JOIN sys.types ty ON ty.user_type_id=c.user_type_id AND ty.name=N'int' AND ty.is_user_defined=0
           JOIN sys.key_constraints k ON k.parent_object_id=t.object_id AND k.type=N'PK'
           JOIN sys.indexes i ON i.object_id=k.parent_object_id AND i.index_id=k.unique_index_id AND i.is_disabled=0
           JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.column_id=c.column_id AND ic.key_ordinal=1
           WHERE t.name=N'users' AND c.is_nullable=0
             AND (SELECT COUNT(*) FROM sys.index_columns x WHERE x.object_id=i.object_id AND x.index_id=i.index_id AND x.key_ordinal>0)=1
       ) THEN N'OK' ELSE N'AUSENTE_OU_DIVERGENTE' END AS resultado;
