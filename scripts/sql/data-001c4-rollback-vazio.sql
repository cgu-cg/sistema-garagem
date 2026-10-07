-- Somente administrativo/manual. NUNCA executar no bootstrap/aplicacao.
-- Rollback estrutural permitido apenas se as quatro tabelas estiverem vazias.
-- Desativar CI_NOVO_FLUXO_GARAGENS e parar os escritores antes desta operacao.
IF @@TRANCOUNT > 0
BEGIN
    RAISERROR(N'Recusado: transacao externa ativa.', 16, 1);
    RETURN;
END;
IF (2 & @@OPTIONS) = 2
BEGIN
    RAISERROR(N'Recusado: IMPLICIT_TRANSACTIONS ON.', 16, 1);
    RETURN;
END;
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF OBJECT_ID(N'dbo.ciclo_operacional', N'U') IS NULL
       OR OBJECT_ID(N'dbo.folha_ci', N'U') IS NULL
       OR OBJECT_ID(N'dbo.item_folha_ci', N'U') IS NULL
       OR OBJECT_ID(N'dbo.estado_manutencao_ciclo', N'U') IS NULL
        THROW 51000, N'Estrutura parcial/ausente; investigar manualmente.', 1;
    IF EXISTS (SELECT 1 FROM dbo.ciclo_operacional WITH (TABLOCKX, HOLDLOCK))
       OR EXISTS (SELECT 1 FROM dbo.folha_ci WITH (TABLOCKX, HOLDLOCK))
       OR EXISTS (SELECT 1 FROM dbo.item_folha_ci WITH (TABLOCKX, HOLDLOCK))
       OR EXISTS (SELECT 1 FROM dbo.estado_manutencao_ciclo WITH (TABLOCKX, HOLDLOCK))
        THROW 51001, N'Rollback recusado: existe dado persistido. Nenhum dado sera apagado.', 1;
    -- Dependencias externas inesperadas tambem fazem DROP falhar e rollback integral.
    DROP TABLE dbo.estado_manutencao_ciclo;
    DROP TABLE dbo.item_folha_ci;
    DROP TABLE dbo.folha_ci;
    DROP TABLE dbo.ciclo_operacional;
    COMMIT;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK;
    THROW;
END CATCH;
