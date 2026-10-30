-- OPCIONAL, PARA REVISAO. NAO EXECUTADO PELO CODEX.
-- Nao executar junto com o CREATE automaticamente. Confirmar ambiente e fonte.
-- Preencher data e usuario reais. Usar antes de ativar a nova API/web.
-- Copia estados salvos da manutencao; nunca consulta CI nem altera a origem.
-- Compativel com SQL Server sem JSON_VALUE/JSON_MODIFY/FOR JSON.
SET XACT_ABORT ON;
DECLARE @Garagem NVARCHAR(10) = N'VCG';
DECLARE @DataOperacao NVARCHAR(10) = N'AAAA-MM-DD';
DECLARE @ResponsavelId INT = NULL;
DECLARE @Fonte NVARCHAR(10) = N'C4'; -- C4 (estado_manutencao_ciclo) ou LEGADO (manutencao_carros)
IF @Garagem IS NULL OR @Garagem NOT IN (N'VCG',N'VCM') OR TRY_CONVERT(DATE,@DataOperacao,23) IS NULL
   OR @DataOperacao<>CONVERT(NVARCHAR(10),TRY_CONVERT(DATE,@DataOperacao,23),23)
   OR @ResponsavelId IS NULL OR @Fonte IS NULL OR @Fonte NOT IN (N'C4',N'LEGADO')
BEGIN
  RAISERROR('Preencha garagem, data, responsavel e fonte antes de executar.',16,1);
  RETURN;
END;
BEGIN TRANSACTION;
IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE id=@ResponsavelId AND role=N'ADMIN')
BEGIN
  RAISERROR('Informe o id real do ADMIN responsavel pela copia.',16,1);
  ROLLBACK TRANSACTION; RETURN;
END;
IF EXISTS (SELECT id FROM dbo.controle_manutencao_folha WITH (UPDLOCK,HOLDLOCK)
           WHERE garagem=@Garagem AND data_operacao=@DataOperacao)
BEGIN
  RAISERROR('Folha independente ja existe. A copia nao sobrescreve dados.',16,1);
  ROLLBACK TRANSACTION; RETURN;
END;
DECLARE @Estados TABLE (prefixo NVARCHAR(10) PRIMARY KEY,consorciada NVARCHAR(10),
  obsBloqueio NVARCHAR(255),obsOficina NVARCHAR(255),bloqueado BIT,emExecucao BIT,liberado BIT);
IF @Fonte=N'C4'
  INSERT INTO @Estados
  SELECT s.prefixo,s.consorciada,s.observacao_bloqueio,s.observacao_oficina,s.bloqueado,
         CASE WHEN s.bloqueado=1 THEN 0 ELSE s.em_execucao END,
         CASE WHEN s.bloqueado=1 OR s.em_execucao=1 THEN 0 ELSE s.liberado END
  FROM dbo.estado_manutencao_ciclo s WITH (UPDLOCK,HOLDLOCK)
  JOIN dbo.ciclo_operacional c WITH (UPDLOCK,HOLDLOCK) ON c.id=s.ciclo_id
  WHERE c.garagem=@Garagem AND c.data_operacional=CONVERT(DATE,@DataOperacao,23)
    AND (s.bloqueado=1 OR s.em_execucao=1 OR s.liberado=1);
ELSE
  INSERT INTO @Estados
  SELECT prefixo,consorciada,CASE WHEN bloqueado=1 THEN observacao END,
    CASE WHEN bloqueado=0 THEN observacao END,bloqueado,
    CASE WHEN bloqueado=1 THEN 0 ELSE em_execucao END,
    CASE WHEN bloqueado=1 OR em_execucao=1 THEN 0 ELSE liberado END
  FROM dbo.manutencao_carros WITH (UPDLOCK,HOLDLOCK)
  WHERE data=@DataOperacao AND (bloqueado=1 OR em_execucao=1 OR liberado=1)
    AND ((@Garagem=N'VCM' AND (prefixo LIKE N'1%' OR prefixo=N'2002'))
      OR (@Garagem=N'VCG' AND prefixo NOT LIKE N'1%' AND prefixo<>N'2002'));
IF NOT EXISTS (SELECT 1 FROM @Estados) OR EXISTS
  (SELECT 1 FROM @Estados WHERE consorciada NOT IN (N'VCG',N'VCM',N'VSF',N'JTU')
    OR consorciada IS NULL OR prefixo=N'' OR prefixo LIKE N'%[^0-9]%')
BEGIN
  RAISERROR('Fonte vazia ou invalida. Confira estados persistidos e escolha da fonte.',16,1);
  ROLLBACK TRANSACTION; RETURN;
END;
DECLARE @Items NVARCHAR(MAX);
-- Escapa barras, aspas e controles comuns sem funcoes JSON do servidor.
SELECT @Items=STUFF((SELECT N',{"id":"manut-'+@DataOperacao+N'-'+s.prefixo+N'","prefixo":"'+s.prefixo+
  N'","consorciada":"'+s.consorciada+N'","data":"'+@DataOperacao+
  N'","observacao":'+CASE WHEN s.bloqueado=1 THEN escaped.bloqueio ELSE escaped.oficina END+
  N',"observacaoBloqueio":'+escaped.bloqueio+N',"observacaoOficina":'+escaped.oficina+
  N',"bloqueado":'+CASE WHEN s.bloqueado=1 THEN N'true' ELSE N'false' END+
  N',"emExecucao":'+CASE WHEN s.emExecucao=1 THEN N'true' ELSE N'false' END+
  N',"liberado":'+CASE WHEN s.liberado=1 THEN N'true' ELSE N'false' END+N'}'
 FROM @Estados s
 CROSS APPLY (SELECT
   CASE WHEN s.obsBloqueio IS NULL THEN N'null' ELSE N'"'+REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(s.obsBloqueio,N'\',N'\\'),N'"',N'\"'),NCHAR(13),N'\r'),NCHAR(10),N'\n'),NCHAR(9),N'\t'),NCHAR(8),N'\b'),NCHAR(12),N'\f')+N'"' END AS bloqueio,
   CASE WHEN s.obsOficina IS NULL THEN N'null' ELSE N'"'+REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(s.obsOficina,N'\',N'\\'),N'"',N'\"'),NCHAR(13),N'\r'),NCHAR(10),N'\n'),NCHAR(9),N'\t'),NCHAR(8),N'\b'),NCHAR(12),N'\f')+N'"' END AS oficina) escaped
 ORDER BY s.prefixo FOR XML PATH(''),TYPE).value('.','NVARCHAR(MAX)'),1,1,N'');
DECLARE @Conteudo NVARCHAR(MAX)=N'{"version":1,"items":['+@Items+N'],"eventos":[{"id":"'+
  CONVERT(NVARCHAR(36),NEWID())+N'","hash":"COPIA_ESTADOS_PERSISTIDOS","usuarioId":'+
  CONVERT(NVARCHAR(20),@ResponsavelId)+N',"registradoEm":"'+CONVERT(NVARCHAR(33),SYSUTCDATETIME(),127)+N'Z"}]}';
INSERT INTO dbo.controle_manutencao_folha (garagem,data_operacao,revisao,conteudo,responsavel_id)
VALUES (@Garagem,@DataOperacao,1,@Conteudo,@ResponsavelId);
COMMIT TRANSACTION;
