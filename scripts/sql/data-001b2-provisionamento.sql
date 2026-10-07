-- DATA-001B2: execucao administrativa deliberada, somente instalacao nova.
-- Nao executar no startup/HTTP. Confirmar banco e visibilidade dos objetos antes.
-- Requer ambas as tabelas ausentes; nao repara estrutura existente.
-- SQL Server 2012. Sem dados, FKs, users ou data_folha.
IF @@TRANCOUNT <> 0
    THROW 50000, 'Execute fora de uma transacao existente.', 1;

IF OBJECT_ID(N'dbo.ci_bloqueios') IS NOT NULL
   OR OBJECT_ID(N'dbo.manutencao_carros') IS NOT NULL
    THROW 50001, 'Objeto alvo existente: use a validacao separada. Nenhuma criacao autorizada neste estado.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    CREATE TABLE dbo.ci_bloqueios (
        id NVARCHAR(100) NOT NULL PRIMARY KEY,
        prefixo NVARCHAR(10) NOT NULL,
        garagem NVARCHAR(10) NOT NULL,
        consorciada NVARCHAR(10) NOT NULL,
        categoria NVARCHAR(20) NOT NULL,
        sub_tipo NVARCHAR(50) NULL,
        horario_reforco NVARCHAR(20) NULL,
        motivo NVARCHAR(255) NULL,
        data_bloqueio NVARCHAR(20) NOT NULL,
        hora_bloqueio NVARCHAR(10) NULL,
        gravidade NVARCHAR(10) NULL DEFAULT 'ALTA',
        responsavel NVARCHAR(100) NULL,
        observacoes NVARCHAR(255) NULL,
        status NVARCHAR(20) NULL DEFAULT 'BLOQUEADO',
        data_liberacao NVARCHAR(50) NULL,
        motivo_liberacao NVARCHAR(255) NULL,
        responsavel_liberacao NVARCHAR(100) NULL,
        user_id INT NULL,
        created_at DATETIME NULL DEFAULT GETDATE(),
        updated_at DATETIME NULL DEFAULT GETDATE()
    );
    CREATE INDEX idx_ci_bloqueios_prefixo ON dbo.ci_bloqueios (prefixo);
    CREATE INDEX idx_ci_bloqueios_status ON dbo.ci_bloqueios (status);
    CREATE INDEX idx_ci_bloqueios_garagem ON dbo.ci_bloqueios (garagem);

    CREATE TABLE dbo.manutencao_carros (
        id NVARCHAR(100) NOT NULL PRIMARY KEY,
        prefixo NVARCHAR(10) NOT NULL,
        consorciada NVARCHAR(10) NOT NULL,
        observacao NVARCHAR(255) NULL DEFAULT '',
        bloqueado BIT NULL DEFAULT 0,
        em_execucao BIT NULL DEFAULT 0,
        liberado BIT NULL DEFAULT 0,
        data NVARCHAR(20) NOT NULL,
        user_id INT NULL,
        created_at DATETIME NULL DEFAULT GETDATE(),
        updated_at DATETIME NULL DEFAULT GETDATE()
    );
    CREATE INDEX idx_manutencao_carros_data ON dbo.manutencao_carros (data);
    CREATE INDEX idx_manutencao_carros_prefixo ON dbo.manutencao_carros (prefixo);
    CREATE INDEX idx_manutencao_carros_data_prefixo ON dbo.manutencao_carros (data, prefixo);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
