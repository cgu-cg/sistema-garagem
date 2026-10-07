-- DATA-001C4 fase 2: candidato administrativo, NAO EXECUTADO.
-- Execucao futura requer revisao, autorizacao, banco alvo e backup definidos.
-- SQL Server 2012. Nenhum dado, migration, startup, HTTP ou reparo automatico.
-- Pre-requisito documental: User @@map("users"), id Int @id no schema Prisma.
-- Todos os instantes sao UTC; datas civis sao calculadas em America/Campo_Grande.
-- Sem AT TIME ZONE. updated_at deve ser atualizado pelo escritor; nao ha trigger.
IF @@TRANCOUNT > 0
BEGIN
    RAISERROR('Execute fora de transacao existente; a transacao do chamador sera preservada.', 16, 1);
    RETURN;
END;

IF (@@OPTIONS & 2) = 2
BEGIN
    RAISERROR('IMPLICIT_TRANSACTIONS deve estar OFF antes do provisionamento.', 16, 1);
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

IF COALESCE(HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'VIEW DEFINITION'), 0) <> 1
    THROW 50101, 'Requer VIEW DEFINITION no banco: ausencia invisivel nao autoriza criacao.', 1;
IF OBJECT_ID(N'dbo.ciclo_operacional') IS NOT NULL
   OR OBJECT_ID(N'dbo.folha_ci') IS NOT NULL
   OR OBJECT_ID(N'dbo.item_folha_ci') IS NOT NULL
   OR OBJECT_ID(N'dbo.estado_manutencao_ciclo') IS NOT NULL
    THROW 50102, 'Objeto alvo existente: pare para analise; nao alterar, reparar ou completar.', 1;
IF OBJECT_ID(N'dbo.users', N'U') IS NULL
   OR NOT EXISTS (
       SELECT 1 FROM sys.columns c JOIN sys.types ty ON ty.user_type_id = c.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.users', N'U') AND c.name = N'id'
         AND ty.name = N'int' AND ty.is_user_defined = 0 AND c.is_nullable = 0
   )
   OR NOT EXISTS (
       SELECT 1 FROM sys.key_constraints k JOIN sys.indexes i
         ON i.object_id = k.parent_object_id AND i.index_id = k.unique_index_id
       JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
       JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
       WHERE k.parent_object_id = OBJECT_ID(N'dbo.users', N'U') AND k.type = N'PK'
         AND i.is_disabled = 0 AND ic.key_ordinal = 1 AND c.name = N'id'
         AND (SELECT COUNT(*) FROM sys.index_columns x
              WHERE x.object_id = i.object_id AND x.index_id = i.index_id AND x.key_ordinal > 0) = 1
   )
    THROW 50103, 'Pre-requisito users.id INT NOT NULL PK incompativel: pare sem reparar users.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    CREATE TABLE dbo.ciclo_operacional (
        id INT IDENTITY(1,1) NOT NULL,
        garagem NVARCHAR(10) NOT NULL,
        data_operacional DATE NOT NULL,
        origem NVARCHAR(20) NOT NULL,
        inicializacao_prevista_em DATETIME2(3) NOT NULL,
        inicializado_em DATETIME2(3) NOT NULL,
        referencia_origem NVARCHAR(255) NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_ciclo_operacional_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_ciclo_operacional_updated_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_ciclo_operacional PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_ciclo_operacional_garagem_data UNIQUE NONCLUSTERED (garagem, data_operacional),
        CONSTRAINT UQ_ciclo_operacional_id_garagem UNIQUE NONCLUSTERED (id, garagem),
        CONSTRAINT CK_ciclo_operacional_garagem CHECK (garagem IN (N'VCG', N'VCM')),
        CONSTRAINT CK_ciclo_operacional_origem CHECK (origem IN (N'NORMAL', N'RECUPERACAO'))
    );

    CREATE TABLE dbo.folha_ci (
        id INT IDENTITY(1,1) NOT NULL,
        garagem NVARCHAR(10) NOT NULL,
        data_folha DATE NOT NULL,
        status NVARCHAR(20) NOT NULL,
        origem NVARCHAR(20) NOT NULL,
        ciclo_preparacao_id INT NULL,
        folha_origem_id INT NULL,
        titulo_coluna_adicional NVARCHAR(30) NULL,
        inicializacao_prevista_em DATETIME2(3) NULL,
        inicializada_em DATETIME2(3) NULL,
        finalizacao_prevista_em DATETIME2(3) NULL,
        finalizada_em DATETIME2(3) NULL,
        referencia_origem NVARCHAR(255) NULL,
        responsavel_registro_id INT NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_folha_ci_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_folha_ci_updated_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_folha_ci PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_folha_ci_garagem_data UNIQUE NONCLUSTERED (garagem, data_folha),
        CONSTRAINT UQ_folha_ci_id_garagem UNIQUE NONCLUSTERED (id, garagem),
        CONSTRAINT CK_folha_ci_garagem CHECK (garagem IN (N'VCG', N'VCM')),
        CONSTRAINT CK_folha_ci_status CHECK (status IN (N'EM_PREPARACAO', N'FINALIZADA')),
        CONSTRAINT CK_folha_ci_origem CHECK (origem IN (N'NORMAL', N'IMPORTACAO', N'RECUPERACAO')),
        CONSTRAINT CK_folha_ci_nao_autorreferencia CHECK (folha_origem_id IS NULL OR folha_origem_id <> id),
        CONSTRAINT CK_folha_ci_titulo CHECK (titulo_coluna_adicional IS NULL OR titulo_coluna_adicional IN (N'INSPEÇÃO', N'LUBRIFICAÇÃO', N'EM MANUTENÇÃO', N'TROCA DE ÓLEO', N'REVISÃO', N'PREVENTIVA')),
        CONSTRAINT CK_folha_ci_origem_vinculos CHECK ((origem = N'NORMAL' AND ciclo_preparacao_id IS NOT NULL AND folha_origem_id IS NOT NULL AND inicializacao_prevista_em IS NOT NULL AND inicializada_em IS NOT NULL) OR (origem = N'IMPORTACAO' AND status = N'FINALIZADA' AND ciclo_preparacao_id IS NULL AND folha_origem_id IS NULL) OR (origem = N'RECUPERACAO' AND folha_origem_id IS NULL)),
        CONSTRAINT CK_folha_ci_preparacao_tempos CHECK (status <> N'EM_PREPARACAO' OR (ciclo_preparacao_id IS NOT NULL AND inicializacao_prevista_em IS NOT NULL AND inicializada_em IS NOT NULL AND finalizacao_prevista_em IS NOT NULL AND finalizada_em IS NULL)),
        CONSTRAINT CK_folha_ci_finalizada_tempo CHECK (status <> N'FINALIZADA' OR origem = N'IMPORTACAO' OR finalizada_em IS NOT NULL),
        CONSTRAINT FK_folha_ci_ciclo_garagem FOREIGN KEY (ciclo_preparacao_id, garagem) REFERENCES dbo.ciclo_operacional (id, garagem) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_folha_ci_origem_garagem FOREIGN KEY (folha_origem_id, garagem) REFERENCES dbo.folha_ci (id, garagem) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_folha_ci_responsavel FOREIGN KEY (responsavel_registro_id) REFERENCES dbo.users (id) ON DELETE NO ACTION ON UPDATE NO ACTION
    );
    CREATE UNIQUE NONCLUSTERED INDEX UQ_folha_ci_ciclo_preparacao ON dbo.folha_ci (ciclo_preparacao_id) WHERE ciclo_preparacao_id IS NOT NULL;
    CREATE NONCLUSTERED INDEX IX_folha_ci_folha_origem_garagem ON dbo.folha_ci (folha_origem_id, garagem);

    CREATE TABLE dbo.item_folha_ci (
        id INT IDENTITY(1,1) NOT NULL,
        folha_id INT NOT NULL,
        chave_item UNIQUEIDENTIFIER NOT NULL,
        categoria NVARCHAR(20) NOT NULL,
        tipo_posicao NVARCHAR(10) NULL,
        ordem_posicao INT NULL,
        prefixo NVARCHAR(10) NOT NULL,
        consorciada NVARCHAR(10) NOT NULL,
        sub_tipo NVARCHAR(50) NULL,
        horario_reforco NVARCHAR(20) NULL,
        motivo NVARCHAR(255) NULL,
        observacoes NVARCHAR(255) NULL,
        hora_bloqueio NVARCHAR(10) NULL,
        gravidade NVARCHAR(10) NULL,
        responsavel NVARCHAR(100) NULL,
        status_item NVARCHAR(20) NULL,
        data_liberacao NVARCHAR(50) NULL,
        motivo_liberacao NVARCHAR(255) NULL,
        responsavel_liberacao NVARCHAR(100) NULL,
        responsavel_registro_id INT NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_item_folha_ci_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_item_folha_ci_updated_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_item_folha_ci PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_item_folha_ci_folha_chave UNIQUE NONCLUSTERED (folha_id, chave_item),
        CONSTRAINT CK_item_folha_ci_categoria CHECK (categoria IN (N'PREVENTIVA', N'OFICINA', N'REFORCO', N'BLOQUEADO')),
        CONSTRAINT CK_item_folha_ci_posicao CHECK ((categoria = N'REFORCO' AND tipo_posicao IS NOT NULL AND ordem_posicao IS NOT NULL AND ((tipo_posicao = N'FIXO' AND ordem_posicao BETWEEN 1 AND 12) OR (tipo_posicao = N'EXTRA' AND ordem_posicao > 0))) OR (categoria <> N'REFORCO' AND tipo_posicao IS NULL AND ordem_posicao IS NULL)),
        CONSTRAINT CK_item_folha_ci_prefixo CHECK (LEN(LTRIM(RTRIM(prefixo))) > 0),
        CONSTRAINT CK_item_folha_ci_consorciada CHECK (LEN(LTRIM(RTRIM(consorciada))) > 0),
        CONSTRAINT FK_item_folha_ci_folha FOREIGN KEY (folha_id) REFERENCES dbo.folha_ci (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_item_folha_ci_responsavel FOREIGN KEY (responsavel_registro_id) REFERENCES dbo.users (id) ON DELETE NO ACTION ON UPDATE NO ACTION
    );
    CREATE UNIQUE NONCLUSTERED INDEX UQ_item_folha_ci_bloqueado_prefixo ON dbo.item_folha_ci (folha_id, prefixo) WHERE categoria = N'BLOQUEADO';
    CREATE UNIQUE NONCLUSTERED INDEX UQ_item_folha_ci_reforco_posicao ON dbo.item_folha_ci (folha_id, tipo_posicao, ordem_posicao) WHERE categoria = N'REFORCO';
    CREATE NONCLUSTERED INDEX IX_item_folha_ci_folha_categoria ON dbo.item_folha_ci (folha_id, categoria);
    CREATE NONCLUSTERED INDEX IX_item_folha_ci_folha_prefixo ON dbo.item_folha_ci (folha_id, prefixo);

    CREATE TABLE dbo.estado_manutencao_ciclo (
        id INT IDENTITY(1,1) NOT NULL,
        ciclo_id INT NOT NULL,
        prefixo NVARCHAR(10) NOT NULL,
        consorciada NVARCHAR(10) NOT NULL,
        bloqueado BIT NOT NULL CONSTRAINT DF_estado_manutencao_ciclo_bloqueado DEFAULT (0),
        em_execucao BIT NOT NULL CONSTRAINT DF_estado_manutencao_ciclo_em_execucao DEFAULT (0),
        liberado BIT NOT NULL CONSTRAINT DF_estado_manutencao_ciclo_liberado DEFAULT (0),
        observacao_bloqueio NVARCHAR(255) NULL,
        observacao_oficina NVARCHAR(255) NULL,
        responsavel_registro_id INT NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_estado_manutencao_ciclo_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_estado_manutencao_ciclo_updated_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_estado_manutencao_ciclo PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_estado_manutencao_ciclo_ciclo_prefixo UNIQUE NONCLUSTERED (ciclo_id, prefixo),
        CONSTRAINT CK_estado_manutencao_ciclo_liberacao CHECK (liberado = 0 OR (bloqueado = 0 AND em_execucao = 0)),
        CONSTRAINT CK_estado_manutencao_ciclo_prefixo CHECK (LEN(LTRIM(RTRIM(prefixo))) > 0),
        CONSTRAINT CK_estado_manutencao_ciclo_consorciada CHECK (LEN(LTRIM(RTRIM(consorciada))) > 0),
        CONSTRAINT FK_estado_manutencao_ciclo_ciclo FOREIGN KEY (ciclo_id) REFERENCES dbo.ciclo_operacional (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_estado_manutencao_ciclo_responsavel FOREIGN KEY (responsavel_registro_id) REFERENCES dbo.users (id) ON DELETE NO ACTION ON UPDATE NO ACTION
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
