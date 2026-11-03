-- PARA REVISAO. NAO EXECUTADO PELO CODEX.
-- Confirmar ambiente. Aplicar antes do deploy da API que utiliza esta tabela.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID(N'dbo.trafego_programacao', N'U') IS NOT NULL
BEGIN
  RAISERROR('Tabela trafego_programacao ja existe. Confira estrutura antes de continuar.',16,1);
  ROLLBACK TRANSACTION;
  RETURN;
END;
CREATE TABLE dbo.trafego_programacao (
  id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_trafego_programacao PRIMARY KEY,
  tipo NVARCHAR(10) NOT NULL,
  nome NVARCHAR(150) NOT NULL,
  garagem NVARCHAR(10) NOT NULL,
  escala_tipo NVARCHAR(10) NOT NULL,
  turno NVARCHAR(10) NOT NULL,
  data_operacao NVARCHAR(10) NOT NULL,
  revisao INT NOT NULL CONSTRAINT DF_trafego_programacao_revisao DEFAULT 1,
  conteudo NVARCHAR(MAX) NOT NULL,
  responsavel_id INT NOT NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_trafego_programacao_created DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_trafego_programacao_updated DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_trafego_programacao_contexto UNIQUE (tipo,garagem,escala_tipo,turno,data_operacao),
  CONSTRAINT CK_trafego_programacao_revisao CHECK (revisao>=1),
  CONSTRAINT CK_trafego_programacao_tipo CHECK (tipo IN (N'ESCALA',N'SOLTURA')),
  CONSTRAINT CK_trafego_programacao_garagem CHECK (garagem IN (N'VCG',N'VCM')),
  CONSTRAINT CK_trafego_programacao_escala CHECK (escala_tipo IN (N'SEG_SEX',N'SABADO',N'DOM_FER')),
  CONSTRAINT CK_trafego_programacao_turno CHECK (
    (escala_tipo=N'SEG_SEX' AND turno IN (N'MATUTINO',N'VESPERTINO')) OR
    (escala_tipo IN (N'SABADO',N'DOM_FER') AND turno=N'PADRAO')),
  CONSTRAINT CK_trafego_programacao_escala_turno CHECK (tipo<>N'ESCALA' OR turno<>N'VESPERTINO')
);
COMMIT TRANSACTION;
