-- PARA REVISAO. NAO EXECUTADO PELO CODEX.
-- Aplicar no ambiente confirmado ANTES da nova API. Nao altera folhas existentes.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID(N'dbo.ci_portaria_evento', N'U') IS NOT NULL
BEGIN
  RAISERROR('Tabela ci_portaria_evento ja existe. Confira a estrutura.',16,1);
  ROLLBACK TRANSACTION;
  RETURN;
END;
CREATE TABLE dbo.ci_portaria_evento (
 id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 operacao_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT UQ_ci_portaria_evento_operacao UNIQUE,
 garagem NVARCHAR(10) NOT NULL,
 data_operacao NVARCHAR(10) NOT NULL,
 prefixo NVARCHAR(10) NOT NULL,
 tipo NVARCHAR(20) NOT NULL,
 modulo NVARCHAR(10) NOT NULL,
 escala_tipo NVARCHAR(10) NOT NULL,
 turno NVARCHAR(10) NOT NULL,
 descricao NVARCHAR(1000) NULL,
 folha_id INT NULL,
 item_chave UNIQUEIDENTIFIER NULL,
 usuario_id INT NOT NULL,
 created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT FK_ci_portaria_evento_folha FOREIGN KEY(folha_id) REFERENCES dbo.folha_ci(id),
 CONSTRAINT FK_ci_portaria_evento_usuario FOREIGN KEY(usuario_id) REFERENCES dbo.users(id),
 CONSTRAINT CK_ci_portaria_evento_garagem CHECK(garagem IN(N'VCG',N'VCM')),
 CONSTRAINT CK_ci_portaria_evento_tipo CHECK(tipo IN(N'BLOQUEIO_CI',N'JUSTIFICATIVA',N'USO_CI')),
 CONSTRAINT CK_ci_portaria_evento_modulo CHECK(modulo IN(N'ESCALA',N'SOLTURA')),
 CONSTRAINT CK_ci_portaria_evento_escala CHECK(escala_tipo IN(N'SEG_SEX',N'SABADO',N'DOM_FER')),
 CONSTRAINT CK_ci_portaria_evento_turno CHECK(turno IN(N'MATUTINO',N'VESPERTINO',N'PADRAO')),
 CONSTRAINT CK_ci_portaria_evento_prefixo CHECK(LEN(prefixo)>0 AND prefixo NOT LIKE N'%[^0-9]%'),
 CONSTRAINT CK_ci_portaria_evento_vinculo CHECK(tipo=N'JUSTIFICATIVA' OR (folha_id IS NOT NULL AND item_chave IS NOT NULL)),
 CONSTRAINT CK_ci_portaria_evento_descricao CHECK(tipo=N'USO_CI' OR (descricao IS NOT NULL AND LEN(LTRIM(RTRIM(descricao)))>0)),
 CONSTRAINT CK_ci_portaria_evento_data CHECK(LEN(data_operacao)=10 AND TRY_CONVERT(DATE,data_operacao,23) IS NOT NULL AND data_operacao=CONVERT(NVARCHAR(10),TRY_CONVERT(DATE,data_operacao,23),23))
);
CREATE INDEX IX_ci_portaria_evento_contexto ON dbo.ci_portaria_evento(garagem,data_operacao,prefixo);
CREATE INDEX IX_ci_portaria_evento_item ON dbo.ci_portaria_evento(folha_id,item_chave);
COMMIT TRANSACTION;
