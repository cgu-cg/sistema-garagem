-- Delta C4 administrativo para o baseline anterior. NAO EXECUTADO.
-- Revisar banco alvo/backup; parar escritores e manter C4 desativado.
-- SQL Server 2012. Nao reaplicar provisionamento nem apagar dados.
-- Recusa baseline parcial, ja atualizado ou com dependencias inesperadas.
IF @@TRANCOUNT > 0
BEGIN
    RAISERROR('Execute fora de transacao externa; a transacao do chamador sera preservada.', 16, 1);
    RETURN;
END;
IF (@@OPTIONS & 2) = 2
BEGIN
    RAISERROR('IMPLICIT_TRANSACTIONS deve estar OFF antes deste delta.', 16, 1);
    RETURN;
END;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

BEGIN TRY
    BEGIN TRANSACTION;
    IF COALESCE(HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'VIEW DEFINITION'), 0) <> 1
        THROW 50201, 'Requer VIEW DEFINITION para inspecionar o baseline.', 1;
    DECLARE @obj INT = OBJECT_ID(N'dbo.item_folha_ci', N'U');
    IF @obj IS NULL
        THROW 50202, 'item_folha_ci ausente; nao provisionar automaticamente.', 1;

    -- Bloqueio exclusivo mantido ate COMMIT: dados nao mudam entre validacao e DDL.
    DECLARE @linhas BIGINT;
    -- Compilar referencias ao alvo num nivel inferior permite ao CATCH tratar
    -- ausencia/estrutura invalida, sem deixar transacao propria aberta.
    EXEC sys.sp_executesql
        N'SELECT @contagem = COUNT_BIG(*) FROM dbo.item_folha_ci WITH (TABLOCKX, HOLDLOCK);',
        N'@contagem BIGINT OUTPUT', @contagem = @linhas OUTPUT;

    DECLARE @colunas TABLE (
        nome SYSNAME, ordinal INT, tipo SYSNAME, tamanho INT,
        nullable BIT, identidade BIT, escala INT
    );
    INSERT INTO @colunas VALUES
        (N'id',1,N'int',4,0,1,0),
        (N'folha_id',2,N'int',4,0,0,0),
        (N'chave_item',3,N'uniqueidentifier',16,0,0,0),
        (N'categoria',4,N'nvarchar',40,0,0,0),
        (N'tipo_posicao',5,N'nvarchar',20,1,0,0),
        (N'ordem_posicao',6,N'int',4,1,0,0),
        (N'prefixo',7,N'nvarchar',20,0,0,0),
        (N'consorciada',8,N'nvarchar',20,0,0,0),
        (N'sub_tipo',9,N'nvarchar',100,1,0,0),
        (N'horario_reforco',10,N'nvarchar',40,1,0,0),
        (N'motivo',11,N'nvarchar',510,1,0,0),
        (N'observacoes',12,N'nvarchar',510,1,0,0),
        (N'hora_bloqueio',13,N'nvarchar',20,1,0,0),
        (N'gravidade',14,N'nvarchar',20,1,0,0),
        (N'responsavel',15,N'nvarchar',200,1,0,0),
        (N'status_item',16,N'nvarchar',40,1,0,0),
        (N'data_liberacao',17,N'nvarchar',100,1,0,0),
        (N'motivo_liberacao',18,N'nvarchar',510,1,0,0),
        (N'responsavel_liberacao',19,N'nvarchar',200,1,0,0),
        (N'responsavel_registro_id',20,N'int',4,1,0,0),
        (N'created_at',21,N'datetime2',7,0,0,3),
        (N'updated_at',22,N'datetime2',7,0,0,3),
        (N'data_bloqueio',23,N'date',3,1,0,0);
    IF (SELECT COUNT(*) FROM sys.columns WHERE object_id = @obj) <> 23
       OR EXISTS (
           SELECT 1 FROM @colunas e
           LEFT JOIN sys.columns c ON c.object_id = @obj AND c.name = e.nome
           LEFT JOIN sys.types t ON t.user_type_id = c.user_type_id
           WHERE c.column_id IS NULL OR c.column_id <> e.ordinal OR t.name <> e.tipo
              OR t.is_user_defined <> 0 OR c.max_length <> e.tamanho
              OR c.is_nullable <> e.nullable OR c.is_identity <> e.identidade
              OR c.scale <> e.escala OR c.is_computed <> 0 OR c.is_sparse <> 0
       )
        THROW 50203, 'Colunas divergem do baseline anterior; pare sem adaptar estrutura.', 1;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = @obj AND name = N'consorciada'
               AND collation_name <> CONVERT(SYSNAME, DATABASEPROPERTYEX(DB_NAME(), 'Collation')))
        THROW 50212, 'Collation da consorciada inesperada; nao alterar implicitamente.', 1;

    DECLARE @antigo NVARCHAR(MAX), @novo NVARCHAR(MAX);
    IF (SELECT COUNT(*) FROM sys.check_constraints WHERE parent_object_id = @obj) <> 5
       OR EXISTS (
           SELECT 1 FROM sys.check_constraints WHERE parent_object_id = @obj
           AND (name NOT IN (N'CK_item_folha_ci_categoria', N'CK_item_folha_ci_data_bloqueio',
                N'CK_item_folha_ci_posicao', N'CK_item_folha_ci_prefixo', N'CK_item_folha_ci_consorciada')
                OR is_disabled <> 0 OR is_not_trusted <> 0 OR is_not_for_replication <> 0 OR parent_column_id <> 0)
       )
        THROW 50211, 'Conjunto de CHECKs diverge do baseline anterior.', 1;
    SELECT @antigo = definition FROM sys.check_constraints
    WHERE parent_object_id = @obj AND name = N'CK_item_folha_ci_consorciada'
      AND is_disabled = 0 AND is_not_trusted = 0
      AND is_not_for_replication = 0 AND parent_column_id = 0;
    -- Normalizacao apenas de delimitadores/espacos; identificadores e literais permanecem.
    IF @antigo IS NULL OR
       UPPER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@antigo,N'(',N''),N')',N''),N'[',N''),N']',N''),N' ',N''),CHAR(13),N''),CHAR(10),N''))
       COLLATE Latin1_General_100_BIN2 <> N'LENLTRIMRTRIMCONSORCIADA>0'
        THROW 50204, 'CHECK antigo ausente, desabilitado ou divergente; nao remover outro CHECK.', 1;
    IF EXISTS (SELECT 1 FROM sys.triggers WHERE parent_id = @obj)
       OR EXISTS (SELECT 1 FROM sys.index_columns WHERE object_id = @obj AND column_id = 8)
       OR EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = @obj AND parent_column_id = 8)
       OR EXISTS (SELECT 1 FROM sys.foreign_key_columns WHERE (parent_object_id = @obj AND parent_column_id = 8) OR (referenced_object_id = @obj AND referenced_column_id = 8))
       OR EXISTS (
           SELECT 1 FROM sys.sql_expression_dependencies
           WHERE referenced_id = @obj AND referenced_minor_id = 8
             AND referencing_id <> OBJECT_ID(N'dbo.CK_item_folha_ci_consorciada')
       )
        THROW 50205, 'Dependencia inesperada na tabela/consorciada; revisar antes do delta.', 1;
    EXEC sys.sp_executesql N'
        IF EXISTS (
            SELECT 1 FROM dbo.item_folha_ci
            WHERE (consorciada IS NOT NULL AND (consorciada COLLATE Latin1_General_100_BIN2 NOT IN (N''VSF'',N''VCG'',N''JTU'',N''VCM'') OR DATALENGTH(consorciada) <> 6))
               OR (categoria = N''BLOQUEADO'' AND consorciada IS NULL)
               OR categoria NOT IN (N''PREVENTIVA'',N''OFICINA'',N''REFORCO'',N''BLOQUEADO'')
               OR LEN(LTRIM(RTRIM(prefixo))) = 0
               OR (categoria = N''BLOQUEADO'' AND data_bloqueio IS NULL)
               OR (categoria = N''REFORCO'' AND (tipo_posicao IS NULL OR ordem_posicao IS NULL
                    OR tipo_posicao NOT IN (N''FIXO'',N''EXTRA'') OR ordem_posicao <= 0
                    OR (tipo_posicao = N''FIXO'' AND ordem_posicao > 12)))
               OR (categoria <> N''REFORCO'' AND (tipo_posicao IS NOT NULL OR ordem_posicao IS NOT NULL))
        )
            THROW 50206, ''Dados existentes incompativeis; nenhum saneamento autorizado.'', 1;';

    -- SQL literal fixo, sem identificadores/dados fornecidos pelo usuario.
    EXEC sys.sp_executesql N'
        ALTER TABLE dbo.item_folha_ci DROP CONSTRAINT CK_item_folha_ci_consorciada;
        ALTER TABLE dbo.item_folha_ci ALTER COLUMN consorciada NVARCHAR(10) NULL;
        ALTER TABLE dbo.item_folha_ci WITH CHECK ADD CONSTRAINT CK_item_folha_ci_consorciada
            CHECK ((consorciada IS NULL OR consorciada IN (N''VSF'', N''VCG'', N''JTU'', N''VCM'')) AND (categoria <> N''BLOQUEADO'' OR consorciada IS NOT NULL));
        ALTER TABLE dbo.item_folha_ci WITH CHECK CHECK CONSTRAINT CK_item_folha_ci_consorciada;';

    UPDATE @colunas SET nullable = 1 WHERE nome = N'consorciada';
    IF EXISTS (
        SELECT 1 FROM @colunas e
        LEFT JOIN sys.columns c ON c.object_id = @obj AND c.name = e.nome
        LEFT JOIN sys.types t ON t.user_type_id = c.user_type_id
        WHERE c.column_id IS NULL OR c.column_id <> e.ordinal OR t.name <> e.tipo
           OR t.is_user_defined <> 0 OR c.max_length <> e.tamanho
           OR c.is_nullable <> e.nullable OR c.is_identity <> e.identidade
           OR c.scale <> e.escala OR c.is_computed <> 0 OR c.is_sparse <> 0
    ) OR (SELECT COUNT(*) FROM sys.columns WHERE object_id = @obj) <> 23
        THROW 50207, 'Estrutura final divergente; desfazer delta.', 1;
    SELECT @novo = definition FROM sys.check_constraints
    WHERE parent_object_id = @obj AND name = N'CK_item_folha_ci_consorciada'
      AND is_disabled = 0 AND is_not_trusted = 0 AND is_not_for_replication = 0 AND parent_column_id = 0;
    -- A expressao e criada pelo DDL literal acima; confirmar que o CHECK esta ativo/confiavel.
    IF @novo IS NULL
        THROW 50208, 'Novo CHECK ausente, desabilitado ou nao confiavel.', 1;
    DECLARE @linhasFinal BIGINT;
    EXEC sys.sp_executesql N'SELECT @contagem = COUNT_BIG(*) FROM dbo.item_folha_ci;',
        N'@contagem BIGINT OUTPUT', @contagem = @linhasFinal OUTPUT;
    IF @linhasFinal <> @linhas
        THROW 50209, 'Quantidade de registros mudou; desfazer delta.', 1;
    IF @@TRANCOUNT <> 1
        THROW 50210, 'Transacao propria inesperada; nao confirmar delta.', 1;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
