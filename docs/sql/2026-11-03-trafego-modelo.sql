-- PROPOSTA PARA REVISAO. NAO EXECUTADO PELO CODEX.
-- Confirmar ambiente antes de executar. Nao altera excecoes ou dados existentes.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID(N'dbo.trafego_modelo', N'U') IS NOT NULL
BEGIN
  RAISERROR('Tabela trafego_modelo ja existe. Confira estrutura antes de continuar.',16,1);
  ROLLBACK TRANSACTION;
  RETURN;
END;
CREATE TABLE dbo.trafego_modelo (
  id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_trafego_modelo PRIMARY KEY,
  tipo NVARCHAR(10) NOT NULL,
  nome NVARCHAR(150) NOT NULL,
  garagem NVARCHAR(10) NOT NULL,
  escala_tipo NVARCHAR(10) NOT NULL,
  turno NVARCHAR(10) NOT NULL,
  revisao INT NOT NULL CONSTRAINT DF_trafego_modelo_revisao DEFAULT 1,
  conteudo NVARCHAR(MAX) NOT NULL,
  responsavel_id INT NOT NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_trafego_modelo_created DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_trafego_modelo_updated DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_trafego_modelo_contexto UNIQUE (tipo,garagem,escala_tipo,turno),
  CONSTRAINT CK_trafego_modelo_revisao CHECK (revisao>=1),
  CONSTRAINT CK_trafego_modelo_tipo CHECK (tipo IN (N'ESCALA',N'SOLTURA')),
  CONSTRAINT CK_trafego_modelo_garagem CHECK (garagem IN (N'VCG',N'VCM')),
  CONSTRAINT CK_trafego_modelo_escala CHECK (escala_tipo IN (N'SEG_SEX',N'SABADO',N'DOM_FER')),
  CONSTRAINT CK_trafego_modelo_turno CHECK (
    (escala_tipo=N'SEG_SEX' AND turno IN (N'MATUTINO',N'VESPERTINO')) OR
    (escala_tipo IN (N'SABADO',N'DOM_FER') AND turno=N'PADRAO')),
  CONSTRAINT CK_trafego_modelo_escala_turno CHECK (tipo<>N'ESCALA' OR turno<>N'VESPERTINO')
);
COMMIT TRANSACTION;
