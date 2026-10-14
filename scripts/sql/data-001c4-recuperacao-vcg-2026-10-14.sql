-- Recuperacao excepcional aprovada: fechamento atrasado da folha 14/10,
-- abertura do ciclo 14/10 e copia integral para a CI 15/10.
-- NAO EXECUTADO pelo agente. Confirmar ambiente autorizado antes de executar.
-- Nao altera schema, folhas finalizadas, itens de origem ou estados anteriores.
-- Preflight por padrao: @Aplicar=0 nao executa INSERT/UPDATE.
-- Scheduler deve permanecer desativado durante a recuperacao.
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

DECLARE @ServidorEsperado nvarchar(128) = N'SRV-BD02'; -- preencher apos identificar ambiente
DECLARE @BancoEsperado nvarchar(128) = N'garagem';
DECLARE @Aplicar bit = 0;
DECLARE @Agora datetime2(3) = SYSUTCDATETIME();
DECLARE @Origem int = 14, @CicloAnterior int = 6, @CicloNovo int, @FolhaNova int;
-- Instantes UTC deste incidente, conforme eventInstant/America/Campo_Grande.
DECLARE @Abertura datetime2(3) = '2026-10-14T07:00:00.000';
DECLARE @Fechamento datetime2(3) = '2026-10-15T00:00:00.000';

IF @ServidorEsperado = N'' OR @BancoEsperado = N''
    THROW 51000, 'Identifique explicitamente servidor e banco autorizados.', 1;
IF CONVERT(nvarchar(128), SERVERPROPERTY('ServerName')) <> @ServidorEsperado OR DB_NAME() <> @BancoEsperado
    THROW 51000, 'Servidor ou banco diferente do autorizado.', 1;
IF @Aplicar = 1 AND (@Agora < @Abertura OR @Agora >= @Fechamento)
    THROW 51000, 'Recuperacao limitada a janela operacional de 14/10/2026. Replanejar fora dela.', 1;

BEGIN TRY
    BEGIN TRANSACTION;
    -- Mesmas chaves e hints dos escritores C4; dias em ordem cronologica.
    SELECT id FROM dbo.ciclo_operacional WITH (UPDLOCK,HOLDLOCK)
      WHERE garagem=N'VCG' AND data_operacional='2026-10-13';
    SELECT id FROM dbo.folha_ci WITH (UPDLOCK,HOLDLOCK)
      WHERE garagem=N'VCG' AND data_folha='2026-10-14';
    SELECT id FROM dbo.ciclo_operacional WITH (UPDLOCK,HOLDLOCK)
      WHERE garagem=N'VCG' AND data_operacional='2026-10-14';
    SELECT id FROM dbo.folha_ci WITH (UPDLOCK,HOLDLOCK)
      WHERE garagem=N'VCG' AND data_folha='2026-10-15';

    IF NOT EXISTS (SELECT 1 FROM dbo.ciclo_operacional WHERE id=@CicloAnterior AND garagem=N'VCG' AND data_operacional='2026-10-13')
        THROW 51000, 'Ciclo anterior nao corresponde ao incidente aprovado.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.folha_ci WHERE id=@Origem AND garagem=N'VCG' AND data_folha='2026-10-14'
        AND status=N'EM_PREPARACAO' AND origem=N'NORMAL' AND ciclo_preparacao_id=@CicloAnterior)
        THROW 51000, 'Origem mudou ou ja foi finalizada; nao aplicar novamente.', 1;
    IF EXISTS (SELECT 1 FROM dbo.ciclo_operacional WHERE garagem=N'VCG' AND data_operacional='2026-10-14')
       OR EXISTS (SELECT 1 FROM dbo.folha_ci WHERE garagem=N'VCG' AND data_folha='2026-10-15')
        THROW 51000, 'Destino existente/parcial: interromper, sem substituir dados.', 1;
    IF (SELECT COUNT(*) FROM dbo.item_folha_ci WITH (UPDLOCK,HOLDLOCK) WHERE folha_id=@Origem) <> 49
       OR (SELECT COUNT(*) FROM dbo.item_folha_ci WHERE folha_id=@Origem AND categoria=N'BLOQUEADO') <> 21
        THROW 51000, 'Contagens diferentes da resposta revisada: revisar novamente.', 1;
    IF EXISTS (SELECT prefixo FROM dbo.item_folha_ci WHERE folha_id=@Origem AND categoria=N'BLOQUEADO' GROUP BY prefixo HAVING COUNT(*)>1)
       OR EXISTS (SELECT 1 FROM dbo.item_folha_ci WHERE folha_id=@Origem AND categoria=N'BLOQUEADO'
          AND (consorciada IS NULL OR consorciada NOT IN (N'VCM',N'VCG',N'JTU',N'VSF') OR data_bloqueio IS NULL OR data_bloqueio>'2026-10-13' OR status_item=N'LIBERADO'))
        THROW 51000, 'Bloqueados invalidos; nao corrigir por inferencia.', 1;
    IF EXISTS (SELECT prefixo,consorciada,motivo FROM dbo.item_folha_ci WHERE folha_id=@Origem AND categoria=N'BLOQUEADO'
               EXCEPT SELECT prefixo,consorciada,observacao_bloqueio FROM dbo.estado_manutencao_ciclo WHERE ciclo_id=@CicloAnterior AND bloqueado=1)
       OR EXISTS (SELECT prefixo,consorciada,observacao_bloqueio FROM dbo.estado_manutencao_ciclo WHERE ciclo_id=@CicloAnterior AND bloqueado=1
               EXCEPT SELECT prefixo,consorciada,motivo FROM dbo.item_folha_ci WHERE folha_id=@Origem AND categoria=N'BLOQUEADO')
        THROW 51000, 'CI e Controle anteriores divergem; revisar antes de recuperar.', 1;

    SELECT @Aplicar AS aplicar, @Origem AS folha_origem, 49 AS itens_a_copiar, 21 AS bloqueados_a_continuar;
    IF @Aplicar=0 BEGIN ROLLBACK TRANSACTION; RETURN; END;

    -- Registrar a hora REAL da finalizacao atrasada, sem retroagir auditoria.
    UPDATE dbo.folha_ci SET status=N'FINALIZADA', finalizada_em=@Agora, updated_at=@Agora
      WHERE id=@Origem AND status=N'EM_PREPARACAO';
    IF @@ROWCOUNT<>1 THROW 51000, 'Origem alterada durante recuperacao.', 1;
    INSERT dbo.ciclo_operacional (garagem,data_operacional,origem,inicializacao_prevista_em,inicializado_em,referencia_origem)
      VALUES (N'VCG','2026-10-14',N'NORMAL',@Abertura,@Agora,N'Recuperacao manual autorizada: scheduler desativado; origem 14/10 finalizada com atraso.');
    SET @CicloNovo=CONVERT(int,SCOPE_IDENTITY());
    INSERT dbo.folha_ci (garagem,data_folha,status,origem,ciclo_preparacao_id,folha_origem_id,titulo_coluna_adicional,
        inicializacao_prevista_em,inicializada_em,finalizacao_prevista_em,referencia_origem)
      SELECT N'VCG','2026-10-15',N'EM_PREPARACAO',N'NORMAL',@CicloNovo,id,titulo_coluna_adicional,
        @Abertura,@Agora,@Fechamento,N'Recuperacao manual autorizada do ciclo 14/10/2026.' FROM dbo.folha_ci WHERE id=@Origem;
    SET @FolhaNova=CONVERT(int,SCOPE_IDENTITY());
    INSERT dbo.item_folha_ci (folha_id,chave_item,categoria,tipo_posicao,ordem_posicao,prefixo,consorciada,sub_tipo,
        horario_reforco,motivo,observacoes,hora_bloqueio,gravidade,responsavel,status_item,data_liberacao,
        motivo_liberacao,responsavel_liberacao,responsavel_registro_id,data_bloqueio)
      SELECT @FolhaNova,chave_item,categoria,tipo_posicao,ordem_posicao,prefixo,consorciada,sub_tipo,
        horario_reforco,motivo,observacoes,hora_bloqueio,gravidade,responsavel,status_item,data_liberacao,
        motivo_liberacao,responsavel_liberacao,responsavel_registro_id,data_bloqueio
      FROM dbo.item_folha_ci WHERE folha_id=@Origem;
    INSERT dbo.estado_manutencao_ciclo (ciclo_id,prefixo,consorciada,bloqueado,em_execucao,liberado,observacao_bloqueio)
      SELECT @CicloNovo,prefixo,consorciada,1,0,0,motivo FROM dbo.item_folha_ci WHERE folha_id=@Origem AND categoria=N'BLOQUEADO';
    IF (SELECT COUNT(*) FROM dbo.item_folha_ci WHERE folha_id=@FolhaNova)<>49
       OR (SELECT COUNT(*) FROM dbo.estado_manutencao_ciclo WHERE ciclo_id=@CicloNovo AND bloqueado=1 AND em_execucao=0 AND liberado=0)<>21
        THROW 51000, 'Pos-validacao falhou; rollback integral.', 1;
    IF SYSUTCDATETIME()>=@Fechamento
        THROW 51000, 'Janela operacional encerrou durante recuperacao; rollback integral.', 1;
    COMMIT TRANSACTION;
    SELECT @CicloNovo AS ciclo_criado, @FolhaNova AS folha_criada, N'Aplicado; validar contexto HTTP antes de habilitar scheduler.' AS resultado;
END TRY
BEGIN CATCH
    IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
