-- SOMENTE PARA REVISAO. NAO EXECUTADO. SQL Server 2012+.
-- Independente das tabelas permanentes: a base fixa vem do JSON do sistema.
-- Nao importa programacao, nao altera solturas, CI ou manutencao.
SET NOCOUNT ON;
SET XACT_ABORT ON;
DECLARE @ServidorEsperado nvarchar(128)=N'SRV-BD02';
DECLARE @BancoEsperado nvarchar(128)=N'garagem';
DECLARE @Aplicar bit=1;
IF @ServidorEsperado=N'' OR @BancoEsperado=N''
    THROW 51000, 'Preencher servidor e banco explicitamente autorizados.', 1;
IF CONVERT(nvarchar(128),SERVERPROPERTY('ServerName'))<>@ServidorEsperado OR DB_NAME()<>@BancoEsperado
    THROW 51000, 'Ambiente diferente do autorizado.', 1;
IF @@TRANCOUNT<>0 OR (@@OPTIONS & 2)=2
    THROW 51000, 'Executar sem transacao existente e IMPLICIT_TRANSACTIONS OFF.', 1;
IF OBJECT_ID(N'dbo.escala_diaria') IS NOT NULL
    THROW 51000, 'Destino existente. Nao substituir nem recriar.', 1;
IF @Aplicar=0
BEGIN
    SELECT N'PRECHECK_OK; nenhuma estrutura alterada' AS resultado;
    RETURN;
END;
BEGIN TRY
    BEGIN TRANSACTION;
    CREATE TABLE dbo.escala_diaria (
        id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_escala_diaria PRIMARY KEY,
        garagem nvarchar(10) NOT NULL,
        escala_tipo nvarchar(10) NOT NULL,
        turno nvarchar(10) NOT NULL,
        data_operacao nvarchar(10) NOT NULL,
        revisao int NOT NULL CONSTRAINT DF_escala_diaria_revisao DEFAULT(1),
        conteudo nvarchar(max) NOT NULL,
        responsavel_id int NOT NULL,
        created_at datetime2(3) NOT NULL CONSTRAINT DF_escala_diaria_created DEFAULT(SYSUTCDATETIME()),
        updated_at datetime2(3) NOT NULL CONSTRAINT DF_escala_diaria_updated DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT UQ_escala_diaria_contexto UNIQUE(garagem,escala_tipo,turno,data_operacao),
        CONSTRAINT CK_escala_diaria_garagem CHECK(garagem IN (N'VCG',N'VCM')),
        CONSTRAINT CK_escala_diaria_contexto CHECK(
            (escala_tipo=N'SEG_SEX' AND turno IN (N'MATUTINO',N'VESPERTINO'))
            OR (escala_tipo IN (N'SABADO',N'DOM_FER') AND turno=N'PADRAO')),
        CONSTRAINT CK_escala_diaria_revisao CHECK(revisao>=1),
        CONSTRAINT CK_escala_diaria_data CHECK(LEN(data_operacao)=10 AND data_operacao LIKE N'[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
    );
    COMMIT TRANSACTION;
    SELECT N'PROVISIONAMENTO_CONCLUIDO' AS resultado;
END TRY
BEGIN CATCH
    IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
