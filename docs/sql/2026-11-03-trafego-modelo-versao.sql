-- PARA REVISAO. NAO EXECUTADO PELO CODEX.
-- Confirmar ambiente. Aplicar apos trafego_modelo e antes da nova API.
-- Nao copia dados nem modifica folhas existentes. A API preserva o modelo
-- preexistente na primeira edicao, usando sua ultima data conhecida.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID(N'dbo.trafego_modelo', N'U') IS NULL
   OR OBJECT_ID(N'dbo.trafego_modelo_versao', N'U') IS NOT NULL
BEGIN
  RAISERROR('Confira trafego_modelo: a origem deve existir e a tabela de versoes ainda nao.',16,1);
  ROLLBACK TRANSACTION;
  RETURN;
END;
CREATE TABLE dbo.trafego_modelo_versao (
  id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_trafego_modelo_versao PRIMARY KEY,
  modelo_id INT NOT NULL,
  revisao INT NOT NULL,
  vigente_desde NVARCHAR(10) NOT NULL,
  nome NVARCHAR(150) NOT NULL,
  conteudo NVARCHAR(MAX) NOT NULL,
  responsavel_id INT NOT NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_trafego_modelo_versao_created DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_trafego_modelo_versao_modelo FOREIGN KEY (modelo_id) REFERENCES dbo.trafego_modelo(id),
  CONSTRAINT UQ_trafego_modelo_versao_revisao UNIQUE (modelo_id,revisao),
  CONSTRAINT CK_trafego_modelo_versao_revisao CHECK (revisao>=1),
  CONSTRAINT CK_trafego_modelo_versao_data CHECK (
    LEN(vigente_desde)=10 AND TRY_CONVERT(DATE,vigente_desde,23) IS NOT NULL
    AND vigente_desde=CONVERT(NVARCHAR(10),TRY_CONVERT(DATE,vigente_desde,23),23))
);
CREATE INDEX IX_trafego_modelo_versao_vigencia
  ON dbo.trafego_modelo_versao (modelo_id,vigente_desde,revisao);
COMMIT TRANSACTION;
