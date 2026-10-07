-- Delta C4 administrativo para o baseline anterior. NAO EXECUTADO.
-- Revisar banco alvo/backup; parar escritores e manter C4 desativado.
-- SQL Server 2012. Nao reaplicar provisionamento nem apagar dados.
-- Aceita estado antigo valido ou novo ja aplicado; recusa estados parciais.
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
        RAISERROR('Requer VIEW DEFINITION para inspecionar o baseline.', 16, 1);
    DECLARE @obj INT = OBJECT_ID(N'dbo.item_folha_ci', N'U');
    IF @obj IS NULL
        RAISERROR('item_folha_ci ausente; nao provisionar automaticamente.', 16, 1);

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
    DECLARE @nullable BIT, @colConsorciada INT;
    SELECT @nullable = is_nullable, @colConsorciada = column_id
    FROM sys.columns WHERE object_id = @obj AND name = N'consorciada';
    IF @colConsorciada IS NULL
        RAISERROR('Coluna consorciada ausente; nao adaptar estrutura.', 16, 1);
    UPDATE @colunas SET nullable = @nullable WHERE nome = N'consorciada';
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
        RAISERROR('Colunas divergem do baseline anterior; pare sem adaptar estrutura.', 16, 1);
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = @obj AND name = N'consorciada'
               AND collation_name <> CONVERT(SYSNAME, DATABASEPROPERTYEX(DB_NAME(), 'Collation')))
        RAISERROR('Collation da consorciada inesperada; nao alterar implicitamente.', 16, 1);

    -- Nao impor quantidade, nomes ou flags aos CHECKs alheios ao delta.
    -- Registrar seus metadados para confirmar que nenhum foi alterado.
    DECLARE @checksPreservados TABLE (
        id INT, nome SYSNAME, coluna INT, definicao NVARCHAR(MAX),
        desabilitado BIT, naoConfiavel BIT, naoReplicado BIT
    );
    INSERT INTO @checksPreservados
    SELECT object_id, name, parent_column_id, definition,
           is_disabled, is_not_trusted, is_not_for_replication
    FROM sys.check_constraints
    WHERE parent_object_id = @obj AND name <> N'CK_item_folha_ci_consorciada';

    -- A mesma validacao reconhece o baseline e confere o resultado do DDL.
    DECLARE @passo INT = 0, @estado CHAR(1), @definicao NVARCHAR(MAX);
    DECLARE @expressao NVARCHAR(MAX), @esquerda NVARCHAR(MAX), @direita NVARCHAR(MAX);
    DECLARE @i INT, @nivel INT, @fecha INT, @separador INT;
    DECLARE @lado INT, @fragmento NVARCHAR(MAX);
    DECLARE @lista NVARCHAR(MAX), @disjuncao NVARCHAR(MAX);
    WHILE @passo < 2
    BEGIN
        SET @definicao = NULL;
        SET @estado = NULL;
        SELECT @nullable = is_nullable FROM sys.columns
        WHERE object_id = @obj AND column_id = @colConsorciada;
        SELECT @definicao = definition FROM sys.check_constraints
        WHERE parent_object_id = @obj AND name = N'CK_item_folha_ci_consorciada'
          AND is_disabled = 0 AND is_not_trusted = 0 AND is_not_for_replication = 0
          AND parent_column_id IN (0, @colConsorciada);
        IF @definicao IS NULL
            RAISERROR('CHECK de consorciada ausente, opaco, inativo, nao confiavel ou com escopo incorreto.', 16, 1);
        SET @expressao = UPPER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            @definicao, N'[', N''), N']', N''), N' ', N''), CHAR(9), N''), CHAR(13), N''), CHAR(10), N''));
        IF REPLACE(REPLACE(@expressao, N'(', N''), N')', N'')
            COLLATE Latin1_General_100_BIN2 = N'LENLTRIMRTRIMCONSORCIADA>0'
            SET @estado = 'A';
        ELSE
        BEGIN
            -- Remover somente parenteses que envolvem toda a expressao.
            WHILE LEFT(@expressao, 1) = N'('
            BEGIN
                SET @i = 1; SET @nivel = 0; SET @fecha = 0;
                WHILE @i <= LEN(@expressao) AND @fecha = 0
                BEGIN
                    IF SUBSTRING(@expressao, @i, 1) = N'(' SET @nivel = @nivel + 1;
                    IF SUBSTRING(@expressao, @i, 1) = N')' SET @nivel = @nivel - 1;
                    IF @nivel = 0 SET @fecha = @i;
                    SET @i = @i + 1;
                END;
                IF @fecha <> LEN(@expressao) BREAK;
                SET @expressao = SUBSTRING(@expressao, 2, LEN(@expressao) - 2);
            END;
            -- O AND obrigatoriamente separa dois grupos completos. Nao achatar
            -- os parenteses globais: isso aceitaria um CHECK mais permissivo.
            SET @i = 1; SET @nivel = 0; SET @separador = 0;
            WHILE @i <= LEN(@expressao)
            BEGIN
                IF SUBSTRING(@expressao, @i, 1) = N'(' SET @nivel = @nivel + 1;
                IF SUBSTRING(@expressao, @i, 1) = N')' SET @nivel = @nivel - 1;
                IF @nivel = 0 AND SUBSTRING(@expressao, @i, 3) = N'AND'
                BEGIN
                    IF @separador <> 0
                        RAISERROR('CHECK condicional possui agrupamento inesperado.', 16, 1);
                    SET @separador = @i;
                END;
                SET @i = @i + 1;
            END;
            SET @esquerda = NULL; SET @direita = NULL;
            IF @separador > 0
            BEGIN
                -- Ambos os operandos precisam ser grupos completos. Sem isso,
                -- A OR B AND C poderia ser confundido com (A OR B) AND C.
                SET @lado = 0;
                WHILE @lado < 2
                BEGIN
                    SET @fragmento = CASE WHEN @lado = 0 THEN LEFT(@expressao, @separador - 1)
                        ELSE SUBSTRING(@expressao, @separador + 3, LEN(@expressao)) END;
                    SET @i = 1; SET @nivel = 0; SET @fecha = 0;
                    IF LEFT(@fragmento, 1) = N'('
                    BEGIN
                        WHILE @i <= LEN(@fragmento) AND @fecha = 0
                        BEGIN
                            IF SUBSTRING(@fragmento, @i, 1) = N'(' SET @nivel = @nivel + 1;
                            IF SUBSTRING(@fragmento, @i, 1) = N')' SET @nivel = @nivel - 1;
                            IF @nivel = 0 SET @fecha = @i;
                            SET @i = @i + 1;
                        END;
                    END;
                    IF @fecha <> LEN(@fragmento)
                        RAISERROR('CHECK condicional nao possui os dois grupos esperados.', 16, 1);
                    SET @lado = @lado + 1;
                END;
                SET @esquerda = REPLACE(REPLACE(LEFT(@expressao, @separador - 1), N'(', N''), N')', N'');
                SET @direita = REPLACE(REPLACE(SUBSTRING(@expressao, @separador + 3, LEN(@expressao)), N'(', N''), N')', N'');
            END;
            -- SQL Server pode expandir IN em OR e inverter a ordem dos valores.
            -- Lista fechada: qualquer literal, operador ou termo adicional sobra.
            -- Metadados nunca sao executados como SQL dinamico.
            SET @lista = REPLACE(REPLACE(REPLACE(REPLACE(@esquerda,
                N'N''VSF''', N''), N'N''VCG''', N''), N'N''JTU''', N''), N'N''VCM''', N'');
            SET @disjuncao = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@esquerda,
                N'CONSORCIADAISNULL', N''), N'CONSORCIADA=N''VSF''', N''),
                N'CONSORCIADA=N''VCG''', N''), N'CONSORCIADA=N''JTU''', N''), N'CONSORCIADA=N''VCM''', N'');
            IF (@lista COLLATE Latin1_General_100_BIN2 = N'CONSORCIADAISNULLORCONSORCIADAIN,,,'
                OR @disjuncao COLLATE Latin1_General_100_BIN2 = N'OROROROR')
               AND @direita COLLATE Latin1_General_100_BIN2 = N'CATEGORIA<>N''BLOQUEADO''ORCONSORCIADAISNOTNULL'
               AND CHARINDEX(N'N''VSF''', @definicao COLLATE Latin1_General_100_BIN2) > 0
               AND CHARINDEX(N'N''VCG''', @definicao COLLATE Latin1_General_100_BIN2) > 0
               AND CHARINDEX(N'N''JTU''', @definicao COLLATE Latin1_General_100_BIN2) > 0
               AND CHARINDEX(N'N''VCM''', @definicao COLLATE Latin1_General_100_BIN2) > 0
               AND CHARINDEX(N'N''BLOQUEADO''', @definicao COLLATE Latin1_General_100_BIN2) > 0
                SET @estado = 'B';
        END;
        IF @estado IS NULL OR (@nullable = 0 AND @estado <> 'A')
           OR (@nullable = 1 AND @estado <> 'B') OR (@passo = 1 AND @estado <> 'B')
            RAISERROR('Estado intermediario/incompativel: exige NOT NULL + CHECK antigo ou NULL + CHECK condicional novo.', 16, 1);
        IF @passo = 0 AND @estado = 'B'
        BEGIN
            EXEC sys.sp_executesql N'
                IF EXISTS (SELECT 1 FROM dbo.item_folha_ci
                    WHERE (consorciada IS NOT NULL AND (consorciada COLLATE Latin1_General_100_BIN2 NOT IN (N''VSF'',N''VCG'',N''JTU'',N''VCM'') OR DATALENGTH(consorciada) <> 6))
                       OR (categoria = N''BLOQUEADO'' AND consorciada IS NULL))
                    RAISERROR(''Dados de consorciada incompativeis; nenhum saneamento autorizado.'', 16, 1);';
            IF @@TRANCOUNT <> 1
                RAISERROR('Transacao propria inesperada; nao confirmar delta.', 16, 1);
            COMMIT TRANSACTION;
            RAISERROR('Ajuste ja aplicado: coluna NULL e CHECK condicional validos; nenhum DDL executado.', 10, 1);
            RETURN;
        END;
        IF @passo = 0
        BEGIN
    IF EXISTS (SELECT 1 FROM sys.triggers WHERE parent_id = @obj)
       OR EXISTS (SELECT 1 FROM sys.index_columns WHERE object_id = @obj AND column_id = 8)
       OR EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = @obj AND parent_column_id = 8)
       OR EXISTS (SELECT 1 FROM sys.foreign_key_columns WHERE (parent_object_id = @obj AND parent_column_id = 8) OR (referenced_object_id = @obj AND referenced_column_id = 8))
       OR EXISTS (
           SELECT 1 FROM sys.sql_expression_dependencies
           WHERE referenced_id = @obj AND referenced_minor_id = 8
             AND referencing_id <> OBJECT_ID(N'dbo.CK_item_folha_ci_consorciada')
       )
        RAISERROR('Dependencia inesperada na tabela/consorciada; revisar antes do delta.', 16, 1);
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
            RAISERROR(''Dados existentes incompativeis; nenhum saneamento autorizado.'', 16, 1);';

    -- SQL literal fixo, sem identificadores/dados fornecidos pelo usuario.
    EXEC sys.sp_executesql N'
        ALTER TABLE dbo.item_folha_ci DROP CONSTRAINT CK_item_folha_ci_consorciada;
        ALTER TABLE dbo.item_folha_ci ALTER COLUMN consorciada NVARCHAR(10) NULL;
        ALTER TABLE dbo.item_folha_ci WITH CHECK ADD CONSTRAINT CK_item_folha_ci_consorciada
            CHECK ((consorciada IS NULL OR consorciada IN (N''VSF'', N''VCG'', N''JTU'', N''VCM'')) AND (categoria <> N''BLOQUEADO'' OR consorciada IS NOT NULL));
        ALTER TABLE dbo.item_folha_ci WITH CHECK CHECK CONSTRAINT CK_item_folha_ci_consorciada;';

        END;
        SET @passo = @passo + 1;
    END;

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
        RAISERROR('Estrutura final divergente; desfazer delta.', 16, 1);
    IF EXISTS (
        SELECT id, nome, coluna, definicao COLLATE Latin1_General_100_BIN2,
               desabilitado, naoConfiavel, naoReplicado FROM @checksPreservados
        EXCEPT
        SELECT object_id, name, parent_column_id, definition COLLATE Latin1_General_100_BIN2,
               is_disabled, is_not_trusted, is_not_for_replication
        FROM sys.check_constraints WHERE parent_object_id = @obj AND name <> N'CK_item_folha_ci_consorciada'
    ) OR EXISTS (
        SELECT object_id, name, parent_column_id, definition COLLATE Latin1_General_100_BIN2,
               is_disabled, is_not_trusted, is_not_for_replication
        FROM sys.check_constraints WHERE parent_object_id = @obj AND name <> N'CK_item_folha_ci_consorciada'
        EXCEPT
        SELECT id, nome, coluna, definicao COLLATE Latin1_General_100_BIN2,
               desabilitado, naoConfiavel, naoReplicado FROM @checksPreservados
    )
        RAISERROR('CHECK nao relacionado mudou; desfazer delta.', 16, 1);
    DECLARE @linhasFinal BIGINT;
    EXEC sys.sp_executesql N'SELECT @contagem = COUNT_BIG(*) FROM dbo.item_folha_ci;',
        N'@contagem BIGINT OUTPUT', @contagem = @linhasFinal OUTPUT;
    IF @linhasFinal <> @linhas
        RAISERROR('Quantidade de registros mudou; desfazer delta.', 16, 1);
    IF @@TRANCOUNT <> 1
        RAISERROR('Transacao propria inesperada; nao confirmar delta.', 16, 1);
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
