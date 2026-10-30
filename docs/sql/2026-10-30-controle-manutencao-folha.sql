-- PROPOSTA AUTORIZADA PARA REVISAO. NAO EXECUTADA PELO CODEX.
-- Aplicar no ambiente confirmado antes do deploy. Nao migra ou apaga dados.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID(N'dbo.controle_manutencao_folha', N'U') IS NOT NULL
BEGIN
  RAISERROR('Tabela controle_manutencao_folha ja existe. Confira a estrutura.',16,1);
  ROLLBACK TRANSACTION;
  RETURN;
END;
CREATE TABLE dbo.controle_manutencao_folha (
  id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_controle_manutencao_folha PRIMARY KEY,
  garagem NVARCHAR(10) NOT NULL,
  data_operacao NVARCHAR(10) NOT NULL,
  revisao INT NOT NULL CONSTRAINT DF_controle_manutencao_folha_revisao DEFAULT 1,
  conteudo NVARCHAR(MAX) NOT NULL,
  responsavel_id INT NOT NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_controle_manutencao_folha_created DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_controle_manutencao_folha_updated DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_controle_manutencao_folha_contexto UNIQUE (garagem,data_operacao),
  CONSTRAINT CK_controle_manutencao_folha_garagem CHECK (garagem IN (N'VCG',N'VCM')),
  CONSTRAINT CK_controle_manutencao_folha_revisao CHECK (revisao>=1)
);
COMMIT TRANSACTION;
