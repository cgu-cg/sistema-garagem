-- Regularizacao manual da CI. Apenas DDL aditivo; sem carga ou alteracao de dados.
-- Parametros obrigatorios do executor: @ServidorEsperado nvarchar(128),
-- @BancoEsperado nvarchar(128), @Aplicar bit (0 = precheck; 1 = aplicar).
-- Em SSMS, declarar esses parametros com o ambiente explicitamente autorizado.
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF NULLIF(@ServidorEsperado,N'') IS NULL OR NULLIF(@BancoEsperado,N'') IS NULL OR @Aplicar IS NULL
    THROW 51000, 'Informe o ambiente autorizado e o modo de execucao.', 1;
IF CONVERT(nvarchar(128),SERVERPROPERTY('ServerName'))<>@ServidorEsperado OR DB_NAME()<>@BancoEsperado
    THROW 51000, 'Ambiente diferente do autorizado.', 1;
IF @@TRANCOUNT<>0 OR (@@OPTIONS & 2)=2
    THROW 51000, 'Executar sem transacao existente e IMPLICIT_TRANSACTIONS OFF.', 1;
IF OBJECT_ID(N'dbo.folha_ci',N'U') IS NULL OR OBJECT_ID(N'dbo.users',N'U') IS NULL
    THROW 51000, 'Tabelas da CI/usuarios indisponiveis.', 1;
IF @Aplicar=0
BEGIN
    SELECT N'PRECHECK_OK; nenhuma estrutura alterada' AS resultado;
    RETURN;
END;
BEGIN TRY
    BEGIN TRANSACTION;
    IF COL_LENGTH(N'dbo.folha_ci',N'regularizacao_iniciada_em') IS NULL
        ALTER TABLE dbo.folha_ci ADD regularizacao_iniciada_em datetime2(3) NULL;
    IF COL_LENGTH(N'dbo.folha_ci',N'regularizacao_iniciada_por_id') IS NULL
        ALTER TABLE dbo.folha_ci ADD regularizacao_iniciada_por_id int NULL;
    IF COL_LENGTH(N'dbo.folha_ci',N'finalizada_por_id') IS NULL
        ALTER TABLE dbo.folha_ci ADD finalizada_por_id int NULL;
    -- SQL dinamico constante: permite compilar tambem na primeira execucao,
    -- quando as novas colunas ainda nao existem. Nenhuma entrada concatenada.
    IF OBJECT_ID(N'dbo.FK_folha_ci_regularizacao_usuario',N'F') IS NULL
        EXEC(N'ALTER TABLE dbo.folha_ci WITH CHECK ADD CONSTRAINT FK_folha_ci_regularizacao_usuario FOREIGN KEY (regularizacao_iniciada_por_id) REFERENCES dbo.users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;');
    IF OBJECT_ID(N'dbo.FK_folha_ci_finalizador',N'F') IS NULL
        EXEC(N'ALTER TABLE dbo.folha_ci WITH CHECK ADD CONSTRAINT FK_folha_ci_finalizador FOREIGN KEY (finalizada_por_id) REFERENCES dbo.users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;');
    IF OBJECT_ID(N'dbo.CK_folha_ci_regularizacao_auditoria',N'C') IS NULL
        EXEC(N'ALTER TABLE dbo.folha_ci WITH CHECK ADD CONSTRAINT CK_folha_ci_regularizacao_auditoria CHECK ((regularizacao_iniciada_em IS NULL AND regularizacao_iniciada_por_id IS NULL) OR (regularizacao_iniciada_em IS NOT NULL AND regularizacao_iniciada_por_id IS NOT NULL));');
    IF OBJECT_ID(N'dbo.CK_folha_ci_regularizacao_finalizador',N'C') IS NULL
        EXEC(N'ALTER TABLE dbo.folha_ci WITH CHECK ADD CONSTRAINT CK_folha_ci_regularizacao_finalizador CHECK (regularizacao_iniciada_em IS NULL OR status<>N''FINALIZADA'' OR finalizada_por_id IS NOT NULL);');
    COMMIT TRANSACTION;
    SELECT N'REGULARIZACAO_PROVISIONADA' AS resultado;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
