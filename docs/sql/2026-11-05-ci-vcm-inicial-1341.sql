-- CARGA INICIAL INFORMADA PELO USUARIO: VCM, 05/11/2026, apenas 1341 bloqueado.
-- PARA REVISAO. NAO EXECUTADO AUTOMATICAMENTE. Execute no banco correto.
-- A primeira fotografia usa IMPORTACAO/FINALIZADA, conforme o modelo existente.
-- Depois desta carga, iniciar 06/11 pela tela copia esta base para EM_PREPARACAO.
-- Nao cria CI ficticia anterior, ciclos, Controle de Manutencao, Escala ou Soltura.
-- Nao sobrescreve estrutura VCM existente. Nenhuma alteracao na garagem VCG.
-- Defeito/hora de bloqueio nao informados: ficam NULL.
-- data_bloqueio e a data da fotografia inicial informada, sem inferir data anterior.
-- Datas de gravacao sao reais; nao inventa horario historico de finalizacao.
SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @Garagem NVARCHAR(10)=N'VCM';
  DECLARE @DataFolha DATE=CONVERT(DATE,'20261105',112);
  DECLARE @Agora DATETIME2(3)=SYSUTCDATETIME();
  DECLARE @Referencia NVARCHAR(255)=LEFT(CONCAT(
    N'IMPLANTACAO VCM 05/11/2026: bloqueado 1341 informado pelo usuario; executor SQL: ', ORIGINAL_LOGIN()),255);

  -- Mesma ordem geral dos escritores: primeiro ciclo, depois folha.
  IF EXISTS (SELECT 1 FROM dbo.ciclo_operacional WITH (UPDLOCK,HOLDLOCK) WHERE garagem=@Garagem)
    THROW 50001, 'Ja existem ciclos VCM. Revisar a estrutura existente; nada sera sobrescrito.', 1;
  IF EXISTS (SELECT 1 FROM dbo.folha_ci WITH (UPDLOCK,HOLDLOCK) WHERE garagem=@Garagem)
    THROW 50002, 'Ja existe CI VCM. Esta carga so pode ser usada na primeira implantacao.', 1;

  INSERT INTO dbo.folha_ci (
    garagem, data_folha, [status], origem, ciclo_preparacao_id, folha_origem_id,
    titulo_coluna_adicional, inicializacao_prevista_em, inicializada_em,
    finalizacao_prevista_em, finalizada_em, referencia_origem, responsavel_registro_id,
    created_at, updated_at
  ) VALUES (
    @Garagem, @DataFolha, N'FINALIZADA', N'IMPORTACAO', NULL, NULL,
    NULL, NULL, NULL, NULL, NULL, @Referencia, NULL, @Agora, @Agora
  );
  DECLARE @FolhaId INT=CONVERT(INT,SCOPE_IDENTITY());

  INSERT INTO dbo.item_folha_ci (
    folha_id, chave_item, categoria, prefixo, consorciada, motivo, observacoes,
    status_item, data_bloqueio, created_at, updated_at
  ) VALUES (
    @FolhaId, NEWID(), N'BLOQUEADO', N'1341', N'VCM', NULL,
    N'Bloqueio informado na carga inicial da CI VCM de 05/11/2026.',
    N'BLOQUEADO', @DataFolha, @Agora, @Agora
  );

  IF (SELECT COUNT(*) FROM dbo.item_folha_ci WHERE folha_id=@FolhaId) <> 1
    THROW 50003, 'A primeira CI deve conter exatamente o carro 1341. Operacao cancelada.', 1;

  COMMIT TRANSACTION;

  SELECT f.id AS folha_id, f.garagem, f.data_folha, f.[status], f.origem,
    i.prefixo, i.categoria, i.consorciada, i.status_item, i.data_bloqueio
  FROM dbo.folha_ci f
  JOIN dbo.item_folha_ci i ON i.folha_id=f.id
  WHERE f.id=@FolhaId;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
