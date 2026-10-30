-- PROPOSTA PARA REVISAO. NAO EXECUTADA PELO CODEX.
-- Aplicar somente no ambiente confirmado pelo responsavel, antes do deploy da API.
-- Nao converte despachos antigos nem cria folhas automaticamente.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID(N'dbo.soltura_folha', N'U') IS NOT NULL
BEGIN
  RAISERROR('Tabela soltura_folha ja existe. Conferir estrutura antes de continuar.', 16, 1);
  ROLLBACK TRANSACTION;
  RETURN;
END;
CREATE TABLE dbo.soltura_folha (
  id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_soltura_folha PRIMARY KEY,
  garagem NVARCHAR(10) NOT NULL,
  escala_tipo NVARCHAR(10) NOT NULL,
  turno NVARCHAR(10) NOT NULL,
  data_operacao NVARCHAR(10) NOT NULL,
  status NVARCHAR(20) NOT NULL,
  revisao INT NOT NULL CONSTRAINT DF_soltura_folha_revisao DEFAULT 1,
  conteudo NVARCHAR(MAX) NOT NULL,
  responsavel_id INT NOT NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_soltura_folha_created DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_soltura_folha_updated DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_soltura_folha_contexto UNIQUE (garagem, escala_tipo, turno, data_operacao),
  CONSTRAINT CK_soltura_folha_revisao CHECK (revisao >= 1),
  CONSTRAINT CK_soltura_folha_status CHECK (status IN (N'EM_ANDAMENTO', N'FINALIZADA')),
  CONSTRAINT CK_soltura_folha_tipo CHECK (escala_tipo IN (N'SEG_SEX', N'SABADO', N'DOM_FER')),
  CONSTRAINT CK_soltura_folha_turno CHECK ((escala_tipo=N'SEG_SEX' AND turno IN (N'MATUTINO',N'VESPERTINO')) OR (escala_tipo IN (N'SABADO',N'DOM_FER') AND turno=N'PADRAO'))
);
COMMIT TRANSACTION;
