-- CANDIDATO PARA REVISAO. NAO EXECUTADO. SQL Server 2012.
-- Cria somente armazenamento da programacao recorrente; nao importa dados locais.
-- Execucao manual futura exige banco/backup e aprovacao do responsavel.
IF @@TRANCOUNT <> 0 OR (@@OPTIONS & 2)=2
BEGIN
    RAISERROR('Executar fora de transacao existente e com IMPLICIT_TRANSACTIONS OFF.',16,1);
    RETURN;
END;
SET XACT_ABORT ON;
SET NOCOUNT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF CONVERT(varbinary(256),DB_NAME())<>CONVERT(varbinary(256),N'garagem')
       OR DATALENGTH(DB_NAME())<>DATALENGTH(N'garagem')
        RAISERROR('Banco alvo deve ser garagem.',16,1);
    IF OBJECT_ID(N'dbo.escala_carros') IS NOT NULL OR OBJECT_ID(N'dbo.item_escala_carros') IS NOT NULL
        RAISERROR('Destino existente: revisar sem substituir estruturas.',16,1);
    CREATE TABLE dbo.escala_carros (
        id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_escala_carros PRIMARY KEY,
        garagem nvarchar(10) NOT NULL,
        escala_tipo nvarchar(10) NOT NULL,
        turno nvarchar(10) NOT NULL,
        revisao int NOT NULL CONSTRAINT DF_escala_carros_revisao DEFAULT(1),
        responsavel_id int NOT NULL,
        created_at datetime2(3) NOT NULL CONSTRAINT DF_escala_carros_created DEFAULT(SYSUTCDATETIME()),
        updated_at datetime2(3) NOT NULL CONSTRAINT DF_escala_carros_updated DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT UQ_escala_carros_contexto UNIQUE(garagem,escala_tipo,turno),
        CONSTRAINT CK_escala_carros_garagem CHECK(garagem IN (N'VCG',N'VCM')),
        CONSTRAINT CK_escala_carros_contexto CHECK(
            (escala_tipo=N'SEG_SEX' AND turno IN (N'MATUTINO',N'VESPERTINO'))
            OR (escala_tipo IN (N'SABADO',N'DOM_FER') AND turno=N'PADRAO')),
        CONSTRAINT CK_escala_carros_revisao CHECK(revisao>=1)
    );
    CREATE TABLE dbo.item_escala_carros (
        id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_item_escala_carros PRIMARY KEY,
        escala_id int NOT NULL,
        chave_item nvarchar(100) NOT NULL,
        ordem int NOT NULL,
        -- Payload validado por Zod na API; sem funcoes JSON posteriores ao SQL 2012.
        conteudo nvarchar(max) NOT NULL,
        CONSTRAINT FK_item_escala_carros_escala FOREIGN KEY(escala_id) REFERENCES dbo.escala_carros(id),
        CONSTRAINT UQ_item_escala_carros_chave UNIQUE(escala_id,chave_item),
        CONSTRAINT UQ_item_escala_carros_ordem UNIQUE(escala_id,ordem),
        CONSTRAINT CK_item_escala_carros_ordem CHECK(ordem>=0)
    );
    COMMIT TRANSACTION;
    SELECT N'PROVISIONAMENTO_CONCLUIDO' resultado;
END TRY
BEGIN CATCH
    IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
