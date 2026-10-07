-- DATA-001B2: somente metadados, sem registros operacionais ou reparos.
-- Requer visibilidade de metadados (VIEW DEFINITION); ausencia pode ser falta de permissao.
-- OBRIGATORIO indica incompatibilidade; AVISO nao autoriza alteracao.
SELECT DB_NAME() AS banco;

SELECT e.tabela, N'dbo' AS schema_esperado,
       CASE WHEN t.object_id IS NULL THEN N'OBRIGATORIO: tabela ausente ou nao visivel' ELSE N'COMPATIVEL' END AS diagnostico
FROM (VALUES (N'ci_bloqueios'), (N'manutencao_carros')) AS e(tabela)
LEFT JOIN sys.schemas s ON s.name = N'dbo'
LEFT JOIN sys.tables t ON t.schema_id = s.schema_id AND t.name = e.tabela;

;WITH esperado AS (
    SELECT * FROM (VALUES
    (N'ci_bloqueios', N'id', N'nvarchar', 200, 0, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'prefixo', N'nvarchar', 20, 0, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'garagem', N'nvarchar', 20, 0, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'consorciada', N'nvarchar', 20, 0, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'categoria', N'nvarchar', 40, 0, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'sub_tipo', N'nvarchar', 100, 1, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'horario_reforco', N'nvarchar', 40, 1, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'motivo', N'nvarchar', 510, 1, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'data_bloqueio', N'nvarchar', 40, 0, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'hora_bloqueio', N'nvarchar', 20, 1, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'gravidade', N'nvarchar', 20, 1, N'''ALTA'''),
    (N'ci_bloqueios', N'responsavel', N'nvarchar', 200, 1, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'observacoes', N'nvarchar', 510, 1, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'status', N'nvarchar', 40, 1, N'''BLOQUEADO'''),
    (N'ci_bloqueios', N'data_liberacao', N'nvarchar', 100, 1, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'motivo_liberacao', N'nvarchar', 510, 1, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'responsavel_liberacao', N'nvarchar', 200, 1, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'user_id', N'int', 0, 1, CAST(NULL AS nvarchar(100))),
    (N'ci_bloqueios', N'created_at', N'datetime', 0, 1, N'GETDATE()'),
    (N'ci_bloqueios', N'updated_at', N'datetime', 0, 1, N'GETDATE()'),
    (N'manutencao_carros', N'id', N'nvarchar', 200, 0, CAST(NULL AS nvarchar(100))),
    (N'manutencao_carros', N'prefixo', N'nvarchar', 20, 0, CAST(NULL AS nvarchar(100))),
    (N'manutencao_carros', N'consorciada', N'nvarchar', 20, 0, CAST(NULL AS nvarchar(100))),
    (N'manutencao_carros', N'observacao', N'nvarchar', 510, 1, N''''''),
    (N'manutencao_carros', N'bloqueado', N'bit', 0, 1, N'0'),
    (N'manutencao_carros', N'em_execucao', N'bit', 0, 1, N'0'),
    (N'manutencao_carros', N'liberado', N'bit', 0, 1, N'0'),
    (N'manutencao_carros', N'data', N'nvarchar', 40, 0, CAST(NULL AS nvarchar(100))),
    (N'manutencao_carros', N'user_id', N'int', 0, 1, CAST(NULL AS nvarchar(100))),
    (N'manutencao_carros', N'created_at', N'datetime', 0, 1, N'GETDATE()'),
    (N'manutencao_carros', N'updated_at', N'datetime', 0, 1, N'GETDATE()')
    ) v(tabela, coluna, tipo, minimo_bytes, nullable_referencia, default_referencia)
)
SELECT e.*, ty.name AS tipo_real, c.max_length AS capacidade_bytes_real,
       c.is_nullable AS nullable_real, dc.definition AS default_real,
       CASE
         WHEN c.column_id IS NULL THEN N'OBRIGATORIO: coluna ausente ou nao visivel'
         WHEN c.is_computed = 1 OR c.is_identity = 1 THEN N'OBRIGATORIO: coluna mapeada nao gravavel como esperado'
         WHEN ty.name <> e.tipo AND NOT (e.tipo = N'datetime' AND ty.name = N'datetime2') THEN N'OBRIGATORIO: tipo divergente'
         WHEN e.minimo_bytes > 0 AND c.max_length <> -1 AND c.max_length < e.minimo_bytes THEN N'OBRIGATORIO: capacidade insuficiente'
         ELSE N'COMPATIVEL' END AS diagnostico_estrutura,
       CASE WHEN c.is_nullable <> e.nullable_referencia THEN N'AVISO: nulabilidade divergente da referencia operacional'
            WHEN c.is_nullable = 1 AND e.coluna IN (N'created_at', N'updated_at', N'observacao', N'bloqueado', N'em_execucao', N'liberado') THEN N'AVISO: nullable operacional diverge do Prisma'
            ELSE N'COMPATIVEL' END AS diagnostico_nullable,
       CASE WHEN e.tipo = N'datetime' AND ty.name = N'datetime2' THEN N'COMPATIVEL: variacao temporal'
            WHEN e.minimo_bytes > 0 AND (c.max_length = -1 OR c.max_length > e.minimo_bytes) THEN N'COMPATIVEL: capacidade maior'
            ELSE N'COMPATIVEL: referencia' END AS variacao
FROM esperado e
LEFT JOIN sys.schemas s ON s.name = N'dbo'
LEFT JOIN sys.tables t ON t.schema_id = s.schema_id AND t.name = e.tabela
LEFT JOIN sys.columns c ON c.object_id = t.object_id AND c.name = e.coluna
LEFT JOIN sys.types ty ON ty.user_type_id = c.user_type_id
LEFT JOIN sys.default_constraints dc ON dc.object_id = c.default_object_id
ORDER BY e.tabela, e.coluna;

SELECT t.name AS tabela, i.name AS pk_nome,
       CASE WHEN i.index_id IS NULL THEN N'OBRIGATORIO: PK habilitada somente em id nao encontrada' ELSE N'COMPATIVEL' END AS diagnostico
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id AND s.name = N'dbo'
LEFT JOIN sys.indexes i ON i.object_id = t.object_id AND i.is_primary_key = 1 AND i.is_disabled = 0
 AND (SELECT COUNT(*) FROM sys.index_columns x WHERE x.object_id = i.object_id AND x.index_id = i.index_id AND x.key_ordinal > 0) = 1
 AND EXISTS (SELECT 1 FROM sys.index_columns x JOIN sys.columns c ON c.object_id = x.object_id AND c.column_id = x.column_id
             WHERE x.object_id = i.object_id AND x.index_id = i.index_id AND x.key_ordinal = 1 AND c.name = N'id')
WHERE t.name IN (N'ci_bloqueios', N'manutencao_carros');

;WITH esperado AS (
 SELECT * FROM (VALUES
    (N'ci_bloqueios', N'prefixo', CAST(NULL AS nvarchar(128)), 1),
    (N'ci_bloqueios', N'status', CAST(NULL AS nvarchar(128)), 1),
    (N'ci_bloqueios', N'garagem', CAST(NULL AS nvarchar(128)), 1),
    (N'manutencao_carros', N'data', CAST(NULL AS nvarchar(128)), 1),
    (N'manutencao_carros', N'prefixo', CAST(NULL AS nvarchar(128)), 1),
    (N'manutencao_carros', N'data', N'prefixo', 2)
 ) v(tabela, coluna1, coluna2, quantidade)
)
SELECT e.*, i.name AS indice_encontrado,
 CASE WHEN i.index_id IS NULL THEN N'AVISO: indice esperado nao encontrado' ELSE N'COMPATIVEL' END AS diagnostico
FROM esperado e
LEFT JOIN sys.schemas s ON s.name = N'dbo'
LEFT JOIN sys.tables t ON t.schema_id = s.schema_id AND t.name = e.tabela
LEFT JOIN sys.indexes i ON i.object_id = t.object_id AND i.type IN (1, 2) AND i.is_disabled = 0 AND i.is_hypothetical = 0 AND i.has_filter = 0
 AND (SELECT COUNT(*) FROM sys.index_columns x WHERE x.object_id=i.object_id AND x.index_id=i.index_id AND x.key_ordinal>0)=e.quantidade
 AND EXISTS (SELECT 1 FROM sys.index_columns x JOIN sys.columns c ON c.object_id=x.object_id AND c.column_id=x.column_id WHERE x.object_id=i.object_id AND x.index_id=i.index_id AND x.key_ordinal=1 AND c.name=e.coluna1)
 AND (e.quantidade=1 OR EXISTS (SELECT 1 FROM sys.index_columns x JOIN sys.columns c ON c.object_id=x.object_id AND c.column_id=x.column_id WHERE x.object_id=i.object_id AND x.index_id=i.index_id AND x.key_ordinal=2 AND c.name=e.coluna2))
ORDER BY e.tabela, e.coluna1;

-- Colunas extras: informar sem remover; data_folha nao e requisito.
SELECT t.name AS tabela, c.name AS coluna, ty.name AS tipo, c.max_length, c.is_nullable, c.is_computed, dc.definition AS default_real,
       CASE WHEN c.name = N'data_folha' THEN N'INFORMACAO: preservar; finalidade desconhecida'
            WHEN c.is_nullable = 0 AND c.default_object_id = 0 AND c.is_computed = 0 AND c.is_identity = 0
             AND NOT EXISTS (SELECT 1 FROM (VALUES
                 (N'ci_bloqueios', N'id'),
                 (N'ci_bloqueios', N'prefixo'),
                 (N'ci_bloqueios', N'garagem'),
                 (N'ci_bloqueios', N'consorciada'),
                 (N'ci_bloqueios', N'categoria'),
                 (N'ci_bloqueios', N'sub_tipo'),
                 (N'ci_bloqueios', N'horario_reforco'),
                 (N'ci_bloqueios', N'motivo'),
                 (N'ci_bloqueios', N'data_bloqueio'),
                 (N'ci_bloqueios', N'hora_bloqueio'),
                 (N'ci_bloqueios', N'gravidade'),
                 (N'ci_bloqueios', N'responsavel'),
                 (N'ci_bloqueios', N'observacoes'),
                 (N'ci_bloqueios', N'status'),
                 (N'ci_bloqueios', N'data_liberacao'),
                 (N'ci_bloqueios', N'motivo_liberacao'),
                 (N'ci_bloqueios', N'responsavel_liberacao'),
                 (N'ci_bloqueios', N'user_id'),
                 (N'ci_bloqueios', N'created_at'),
                 (N'ci_bloqueios', N'updated_at'),
                 (N'manutencao_carros', N'id'),
                 (N'manutencao_carros', N'prefixo'),
                 (N'manutencao_carros', N'consorciada'),
                 (N'manutencao_carros', N'observacao'),
                 (N'manutencao_carros', N'bloqueado'),
                 (N'manutencao_carros', N'em_execucao'),
                 (N'manutencao_carros', N'liberado'),
                 (N'manutencao_carros', N'data'),
                 (N'manutencao_carros', N'user_id'),
                 (N'manutencao_carros', N'created_at'),
                 (N'manutencao_carros', N'updated_at')
             ) e(tabela, coluna) WHERE e.tabela=t.name AND e.coluna=c.name) THEN N'AVISO: revisar coluna adicional obrigatoria antes de insercoes'
            ELSE N'INFORMACAO: metadados' END AS diagnostico
FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id AND s.name=N'dbo'
JOIN sys.columns c ON c.object_id=t.object_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id
LEFT JOIN sys.default_constraints dc ON dc.object_id=c.default_object_id
WHERE t.name IN (N'ci_bloqueios', N'manutencao_carros')
ORDER BY t.name, c.column_id;

SELECT t.name AS tabela, fk.name AS fk_nome, fk.is_disabled, fk.is_not_trusted,
 CASE WHEN fk.object_id IS NULL THEN N'AVISO: FK user_id para dbo.users(id) ausente ou nao visivel' ELSE N'INFORMACAO: FK existente, revisar definicao' END AS diagnostico
FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id AND s.name=N'dbo'
LEFT JOIN sys.foreign_keys fk ON fk.parent_object_id=t.object_id
 AND fk.referenced_object_id=OBJECT_ID(N'dbo.users', N'U')
 AND EXISTS (SELECT 1 FROM sys.foreign_key_columns f JOIN sys.columns c ON c.object_id=f.parent_object_id AND c.column_id=f.parent_column_id
 JOIN sys.columns r ON r.object_id=f.referenced_object_id AND r.column_id=f.referenced_column_id
 WHERE f.constraint_object_id=fk.object_id AND c.name=N'user_id' AND r.name=N'id')
WHERE t.name IN (N'ci_bloqueios', N'manutencao_carros');
