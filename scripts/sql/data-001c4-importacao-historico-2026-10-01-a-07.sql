-- DATA-001C4: candidato de importacao historica VCG, SOMENTE PARA REVISAO. NAO EXECUTADO.
-- SQL Server 2012. Executar futuramente apenas pelo responsavel, com banco alvo/backup confirmados.
-- Fontes exclusivas: sete Excel em importes/, aba Preenchido; nenhum dado de 08/10.
-- Fotografias independentes: nao criar ciclos, manutencao, linhagem ou timestamps operacionais.
-- Auditoria tecnica: SYSUTCDATETIME no instante da insercao, nunca representa evento historico.
-- Chaves de item deterministicas: primeiros 128 bits SHA256 de DATA-001C4|arquivo|Preenchido|celula|categoria.
-- Strings operacionais preservadas, inclusive grafias; J22 e whitespace terminal de sub_tipo PREVENTIVA/Lubrificação normalizados por autorizacao.
-- Motivos em varias celulas da mesma linha concatenados em ordem, separados por um espaco.
-- IMPORTANTE: executar o arquivo INTEIRO; nao selecionar trechos. Nenhum GO/transacao parcial.
-- A existencia de qualquer folha VCG no intervalo impede toda a carga, sem substituir registros.

IF @@TRANCOUNT > 0
BEGIN
    RAISERROR('Execute fora de transacao existente; a transacao do chamador sera preservada.',16,1);
    RETURN;
END;
IF (@@OPTIONS & 2) = 2
BEGIN
    RAISERROR('IMPLICIT_TRANSACTIONS deve estar OFF.',16,1);
    RETURN;
END;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;
SET NOCOUNT ON;

-- FONTE CI-01-10-2026.xlsx | aba=Preenchido | SHA256=e5803ef52211e4cfb9a524257ea99c1c7b93eade237e5e540d8ef3c3ccd0b22e
-- NORMALIZACAO CI-01-10-2026.xlsx | celula=J22 | valor_original=INSPEÇÂO | valor_importado=INSPEÇÃO | motivo=normalização histórica explicitamente autorizada
-- FONTE CI-02-10-2026.xlsx | aba=Preenchido | SHA256=1267d0c3346bea5196ae4f1d5a3af99be3be95645bbb8c29abd3277cdd23e062
-- NORMALIZACAO CI-02-10-2026.xlsx | celula=J22 | valor_original=INSPEÇÂO | valor_importado=INSPEÇÃO | motivo=normalização histórica explicitamente autorizada
-- FONTE CI-03-10-2026.xlsx | aba=Preenchido | SHA256=15abcd16ced80bc9db6529009a34c360fc28c0bfba765642b600708f2e539501
-- NORMALIZACAO CI-03-10-2026.xlsx | celula=J22 | valor_original=INSPEÇÂO | valor_importado=INSPEÇÃO | motivo=normalização histórica explicitamente autorizada
-- FONTE CI-04-10-2026.xlsx | aba=Preenchido | SHA256=6b6e9f2b5cd834b72224f59d0140db14a7db19fb56271a7765a6e18b6d2ab023
-- NORMALIZACAO CI-04-10-2026.xlsx | celula=J22 | valor_original=INSPEÇÂO | valor_importado=INSPEÇÃO | motivo=normalização histórica explicitamente autorizada
-- FONTE CI-05-10-2026.xlsx | aba=Preenchido | SHA256=d12753ed10e1bffd6fb1bc5700353339d50c7408f8ccf89c58a33e0e0960a3a7
-- NORMALIZACAO CI-05-10-2026.xlsx | celula=J22 | valor_original=INSPEÇÂO | valor_importado=INSPEÇÃO | motivo=normalização histórica explicitamente autorizada
-- FONTE CI-06-10-2026.xlsx | aba=Preenchido | SHA256=5aa02014e43f71a1fed5e5ba08e57733ec4c7e07f71b15dbaf192ef5c3c5c652
-- NORMALIZACAO CI-06-10-2026.xlsx | celula=J22 | valor_original=INSPEÇÂO | valor_importado=INSPEÇÃO | motivo=normalização histórica explicitamente autorizada
-- FONTE CI-07-10-2026.xlsx | aba=Preenchido | SHA256=b192fd48e111472ed3ef22c959b2bf8045bcae3f2b65864687d6fb3d9a086ed9
-- NORMALIZACAO CI-07-10-2026.xlsx | celula=J22 | valor_original=INSPEÇÂO | valor_importado=INSPEÇÃO | motivo=normalização histórica explicitamente autorizada
-- NORMALIZACAO CI-01-10-2026.xlsx | categoria=PREVENTIVA | campo=sub_tipo | cabecalho=D5 | valor_original="Lubrificação " | valor_importado="Lubrificação" | itens=3 | motivo=cabeçalho histórico com whitespace terminal normalizado para valor canônico do domínio; autorização histórica específica
-- NORMALIZACAO CI-02-10-2026.xlsx | categoria=PREVENTIVA | campo=sub_tipo | cabecalho=D5 | valor_original="Lubrificação " | valor_importado="Lubrificação" | itens=5 | motivo=cabeçalho histórico com whitespace terminal normalizado para valor canônico do domínio; autorização histórica específica
-- NORMALIZACAO CI-03-10-2026.xlsx | categoria=PREVENTIVA | campo=sub_tipo | cabecalho=D5 | valor_original="Lubrificação " | valor_importado="Lubrificação" | itens=0 | motivo=cabeçalho histórico com whitespace terminal normalizado para valor canônico do domínio; autorização histórica específica
-- NORMALIZACAO CI-04-10-2026.xlsx | categoria=PREVENTIVA | campo=sub_tipo | cabecalho=D5 | valor_original="Lubrificação " | valor_importado="Lubrificação" | itens=0 | motivo=cabeçalho histórico com whitespace terminal normalizado para valor canônico do domínio; autorização histórica específica
-- NORMALIZACAO CI-05-10-2026.xlsx | categoria=PREVENTIVA | campo=sub_tipo | cabecalho=D5 | valor_original="Lubrificação " | valor_importado="Lubrificação" | itens=3 | motivo=cabeçalho histórico com whitespace terminal normalizado para valor canônico do domínio; autorização histórica específica
-- NORMALIZACAO CI-06-10-2026.xlsx | categoria=PREVENTIVA | campo=sub_tipo | cabecalho=D5 | valor_original="Lubrificação " | valor_importado="Lubrificação" | itens=2 | motivo=cabeçalho histórico com whitespace terminal normalizado para valor canônico do domínio; autorização histórica específica
-- NORMALIZACAO CI-07-10-2026.xlsx | categoria=PREVENTIVA | campo=sub_tipo | cabecalho=D5 | valor_original="Lubrificação " | valor_importado="Lubrificação" | itens=3 | motivo=cabeçalho histórico com whitespace terminal normalizado para valor canônico do domínio; autorização histórica específica
-- OBS autorizada: CI-05-10-2026.xlsx!Preenchido!D26=URGENT -> FIXO 4, C26=3277; J25 independente.
-- FALLBACK CI-01-10-2026.xlsx | celula=F58 | prefixo=3951 | consorciada=JTU | original="29/29" | motivo=invalida | importada=2026-10-01
-- FALLBACK CI-01-10-2026.xlsx | celula=L51 | prefixo=1322 | consorciada=VCM | original=46334 | motivo=futura | importada=2026-10-01
-- FALLBACK CI-01-10-2026.xlsx | celula=L52 | prefixo=3083 | consorciada=VCM | original=null | motivo=ausente | importada=2026-10-01
-- FALLBACK CI-02-10-2026.xlsx | celula=F61 | prefixo=3951 | consorciada=JTU | original="29/29" | motivo=invalida | importada=2026-10-01
-- FALLBACK CI-02-10-2026.xlsx | celula=L52 | prefixo=3083 | consorciada=VCM | original=null | motivo=ausente | importada=2026-10-01
-- FALLBACK CI-02-10-2026.xlsx | celula=L54 | prefixo=1322 | consorciada=VCM | original=46334 | motivo=futura | importada=2026-10-01
-- FALLBACK CI-03-10-2026.xlsx | celula=L55 | prefixo=3083 | consorciada=VCM | original=null | motivo=ausente | importada=2026-10-01
-- FALLBACK CI-03-10-2026.xlsx | celula=L57 | prefixo=1322 | consorciada=VCM | original=46334 | motivo=futura | importada=2026-10-01
-- FALLBACK CI-04-10-2026.xlsx | celula=L55 | prefixo=3083 | consorciada=VCM | original=null | motivo=ausente | importada=2026-10-01
-- FALLBACK CI-04-10-2026.xlsx | celula=L57 | prefixo=1322 | consorciada=VCM | original=46334 | motivo=futura | importada=2026-10-01
-- FALLBACK CI-05-10-2026.xlsx | celula=L50 | prefixo=3083 | consorciada=VCM | original=null | motivo=ausente | importada=2026-10-01
-- FALLBACK CI-05-10-2026.xlsx | celula=L52 | prefixo=1322 | consorciada=VCM | original=46334 | motivo=futura | importada=2026-10-01
-- FALLBACK CI-06-10-2026.xlsx | celula=L51 | prefixo=3083 | consorciada=VCM | original=null | motivo=ausente | importada=2026-10-01
-- FALLBACK CI-06-10-2026.xlsx | celula=L53 | prefixo=1322 | consorciada=VCM | original=46334 | motivo=futura | importada=2026-10-01
-- FALLBACK CI-07-10-2026.xlsx | celula=L52 | prefixo=3083 | consorciada=VCM | original=null | motivo=ausente | importada=2026-10-01
-- FALLBACK CI-07-10-2026.xlsx | celula=L54 | prefixo=1322 | consorciada=VCM | original=46334 | motivo=futura | importada=2026-10-01
-- 46334 = 2026-11-08; 3951 tem 29/29 (invalida), e nao celula vazia.
-- EXCLUIDA CI-01-10-2026.xlsx | aba=Preenchido | celula=F25 | valor="07:45 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-01-10-2026.xlsx | aba=Preenchido | celula=G25 | valor="TROCA DE ÓLEO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-01-10-2026.xlsx | aba=Preenchido | celula=F26 | valor="07:50 - C" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-01-10-2026.xlsx | aba=Preenchido | celula=G26 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-01-10-2026.xlsx | aba=Preenchido | celula=F27 | valor="07:50 - C" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-01-10-2026.xlsx | aba=Preenchido | celula=G27 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-01-10-2026.xlsx | aba=Preenchido | celula=F28 | valor="07:50 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-01-10-2026.xlsx | aba=Preenchido | celula=G28 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-01-10-2026.xlsx | aba=Preenchido | celula=N47 | valor=28 | motivo=total de resumo do documento; nao constitui item
-- EXCLUIDA CI-02-10-2026.xlsx | aba=Preenchido | celula=F27 | valor="07:50 - C" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-02-10-2026.xlsx | aba=Preenchido | celula=G27 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-02-10-2026.xlsx | aba=Preenchido | celula=A28 | valor="07:40 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-02-10-2026.xlsx | aba=Preenchido | celula=B28 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-02-10-2026.xlsx | aba=Preenchido | celula=F28 | valor="07:50 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-02-10-2026.xlsx | aba=Preenchido | celula=G28 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-02-10-2026.xlsx | aba=Preenchido | celula=N50 | valor=29 | motivo=total de resumo do documento; nao constitui item
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=A23 | valor="07:15 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=B23 | valor="LUBRIFICAÇÃO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=F23 | valor="07:40 - C" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=G23 | valor="TROCA DE ÓLEO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=A24 | valor="07:15 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=B24 | valor="LUBRIFICAÇÃO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=F24 | valor="07:45 - C" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=G24 | valor="TROCA DE ÓLEO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=A25 | valor="07:32 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=B25 | valor="LUBRIFICAÇÃO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=F25 | valor="07:45 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=G25 | valor="TROCA DE ÓLEO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=A26 | valor="07:40 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=B26 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=F26 | valor="07:50 - C" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=G26 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=A27 | valor="07:40 - M" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=B27 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=F27 | valor="07:50 - C" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=G27 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=A28 | valor="07:40 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=B28 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=F28 | valor="07:50 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=G28 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-03-10-2026.xlsx | aba=Preenchido | celula=N53 | valor=33 | motivo=total de resumo do documento; nao constitui item
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=A23 | valor="07:15 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=B23 | valor="LUBRIFICAÇÃO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=F23 | valor="07:40 - C" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=G23 | valor="TROCA DE ÓLEO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=A24 | valor="07:15 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=B24 | valor="LUBRIFICAÇÃO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=F24 | valor="07:45 - C" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=G24 | valor="TROCA DE ÓLEO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=A25 | valor="07:32 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=B25 | valor="LUBRIFICAÇÃO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=F25 | valor="07:45 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=G25 | valor="TROCA DE ÓLEO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=A26 | valor="07:40 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=B26 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=F26 | valor="07:50 - C" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=G26 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=A27 | valor="07:40 - M" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=B27 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=F27 | valor="07:50 - C" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=G27 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=A28 | valor="07:40 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=B28 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=F28 | valor="07:50 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=G28 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-04-10-2026.xlsx | aba=Preenchido | celula=N53 | valor=33 | motivo=total de resumo do documento; nao constitui item
-- EXCLUIDA CI-05-10-2026.xlsx | aba=Preenchido | celula=A28 | valor="07:40 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-05-10-2026.xlsx | aba=Preenchido | celula=B28 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-05-10-2026.xlsx | aba=Preenchido | celula=F28 | valor="07:50 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-05-10-2026.xlsx | aba=Preenchido | celula=G28 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-05-10-2026.xlsx | aba=Preenchido | celula=N48 | valor=27 | motivo=total de resumo do documento; nao constitui item
-- EXCLUIDA CI-06-10-2026.xlsx | aba=Preenchido | celula=A28 | valor="07:40 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-06-10-2026.xlsx | aba=Preenchido | celula=B28 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-06-10-2026.xlsx | aba=Preenchido | celula=N49 | valor=28 | motivo=total de resumo do documento; nao constitui item
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=A23 | valor="07:15 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=B23 | valor="LUBRIFICAÇÃO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=F23 | valor="07:40 - C" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=G23 | valor="TROCA DE ÓLEO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=A24 | valor="07:15 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=B24 | valor="LUBRIFICAÇÃO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=F24 | valor="07:45 - C" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=G24 | valor="TROCA DE ÓLEO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=A25 | valor="07:32 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=B25 | valor="LUBRIFICAÇÃO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=F25 | valor="07:45 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=G25 | valor="TROCA DE ÓLEO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=A28 | valor="07:40 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=B28 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=F28 | valor="07:50 - A" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=G28 | valor="INSPEÇÂO" | motivo=horario/motivo de posicao sem prefixo; nao gera item vazio
-- EXCLUIDA CI-07-10-2026.xlsx | aba=Preenchido | celula=N50 | valor=28 | motivo=total de resumo do documento; nao constitui item

DECLARE @dias TABLE (data_folha date PRIMARY KEY, arquivo nvarchar(255) NOT NULL, titulo nvarchar(30) NOT NULL,
    preventiva int NOT NULL, oficina int NOT NULL, fixo int NOT NULL, extra int NOT NULL,
    vsf int NOT NULL, vcg int NOT NULL, jtu int NOT NULL, vcm int NOT NULL);
INSERT INTO @dias VALUES
(CONVERT(date,'20261001',112),N'CI-01-10-2026.xlsx',N'INSPEÇÃO',9,26,8,3,5,11,12,4),
(CONVERT(date,'20261002',112),N'CI-02-10-2026.xlsx',N'INSPEÇÃO',10,26,9,3,4,14,11,4),
(CONVERT(date,'20261003',112),N'CI-03-10-2026.xlsx',N'INSPEÇÃO',0,23,0,2,5,17,11,4),
(CONVERT(date,'20261004',112),N'CI-04-10-2026.xlsx',N'INSPEÇÃO',0,23,0,2,5,17,11,4),
(CONVERT(date,'20261005',112),N'CI-05-10-2026.xlsx',N'INSPEÇÃO',6,31,10,4,4,12,11,4),
(CONVERT(date,'20261006',112),N'CI-06-10-2026.xlsx',N'INSPEÇÃO',5,26,11,4,4,13,11,4),
(CONVERT(date,'20261007',112),N'CI-07-10-2026.xlsx',N'INSPEÇÃO',7,28,4,4,4,14,10,4);

DECLARE @itens TABLE (data_folha date NOT NULL, celula nvarchar(10) NOT NULL, chave_item uniqueidentifier NOT NULL,
    categoria nvarchar(20) NOT NULL, tipo_posicao nvarchar(10) NULL, ordem_posicao int NULL,
    prefixo nvarchar(10) NOT NULL, consorciada nvarchar(10) NULL, sub_tipo nvarchar(50) NULL,
    horario_reforco nvarchar(20) NULL, motivo nvarchar(255) NULL, observacoes nvarchar(255) NULL,
    data_bloqueio date NULL, PRIMARY KEY(data_folha,chave_item));
-- Cada registro tem proveniencia arquivo (via @dias) + aba Preenchido + celula do prefixo.
INSERT INTO @itens (data_folha,celula,chave_item,categoria,tipo_posicao,ordem_posicao,prefixo,consorciada,sub_tipo,horario_reforco,motivo,observacoes,data_bloqueio) VALUES
(CONVERT(date,'20261001',112),N'A6',N'0b085644-661b-8913-eac5-63eeca39fbc2',N'PREVENTIVA',NULL,NULL,N'3904',NULL,N'Preventiva',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'B6',N'20cb4237-a01c-35d4-0e13-19e479992111',N'PREVENTIVA',NULL,NULL,N'4258',NULL,N'Preventiva',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'A7',N'0de6c202-c103-d193-af2d-8623016e9c53',N'PREVENTIVA',NULL,NULL,N'3902',NULL,N'Preventiva',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'E6',N'98200285-7aa2-c227-c8fc-678c22afbd3e',N'PREVENTIVA',NULL,NULL,N'4253',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'E7',N'ff87419d-957a-3a85-c3cb-b33b279b1fad',N'PREVENTIVA',NULL,NULL,N'4015',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'E8',N'e21167cf-79e5-49c0-af5b-a563005ccffb',N'PREVENTIVA',NULL,NULL,N'4222',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'G6',N'b9d93b7a-2d61-4956-03ce-3f34a8089e20',N'PREVENTIVA',NULL,NULL,N'4181',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'G7',N'b3724397-b425-4cf4-a2e8-f0fc11dbbb7b',N'PREVENTIVA',NULL,NULL,N'4197',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'G8',N'789ac3d3-89a1-58cd-3134-aa752275bb56',N'PREVENTIVA',NULL,NULL,N'4231',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'A12',N'59becab4-175f-d796-fb38-9024ce93dfa4',N'OFICINA',NULL,NULL,N'2704',NULL,N'Mecânica',NULL,N'BOMBA ARLA',NULL,NULL),
(CONVERT(date,'20261001',112),N'A13',N'68c7e3e3-01d4-60f9-699d-fd10eb4377f5',N'OFICINA',NULL,NULL,N'3222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261001',112),N'A14',N'e28fa347-d99d-712f-1979-c6f25374af52',N'OFICINA',NULL,NULL,N'4244',NULL,N'Mecânica',NULL,N'M DE EIXO',NULL,NULL),
(CONVERT(date,'20261001',112),N'A15',N'f0728ac8-d783-3733-45fe-868f62cb87b2',N'OFICINA',NULL,NULL,N'4222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261001',112),N'A16',N'cfd572d0-bb0a-5e45-72ac-22ea0c227255',N'OFICINA',NULL,NULL,N'4197',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261001',112),N'A17',N'407d49ab-25b9-7a4b-9a53-3cc204c53c30',N'OFICINA',NULL,NULL,N'4225',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261001',112),N'A18',N'8869807f-08cb-ef69-2458-29e84e1a140a',N'OFICINA',NULL,NULL,N'2425',NULL,N'Mecânica',NULL,N'VAZ OLEO',NULL,NULL),
(CONVERT(date,'20261001',112),N'A19',N'14b178a1-1ca5-e2a1-5a8e-83505ee3e71b',N'OFICINA',NULL,NULL,N'4272',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261001',112),N'A20',N'15804910-30da-26c5-e4a8-31798005653e',N'OFICINA',NULL,NULL,N'4224',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261001',112),N'C12',N'29d3ebe6-3f98-2b56-ce22-5a6ee3959c2d',N'OFICINA',NULL,NULL,N'3263',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'C13',N'efb34bc0-1d42-eba6-f10f-954103d8e554',N'OFICINA',NULL,NULL,N'2514',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'C14',N'f9c5da83-956c-f8a9-d3ac-8f6d96e3fd34',N'OFICINA',NULL,NULL,N'3139',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'C15',N'c3d5bac0-6c74-eff5-7d1c-d6b2f10a05ba',N'OFICINA',NULL,NULL,N'4196',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'C16',N'50ab2c78-7757-430f-8f59-e8f2f0fbbcfb',N'OFICINA',NULL,NULL,N'4222',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'C17',N'b88eb062-7f17-46ff-f739-6a53f296137a',N'OFICINA',NULL,NULL,N'2426',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'C18',N'2c30c120-cd53-9bc1-c48b-8cd6146c9948',N'OFICINA',NULL,NULL,N'4209',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'C19',N'913d4f28-7ef4-71e0-37f6-26cb0f35279d',N'OFICINA',NULL,NULL,N'3271',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'C20',N'2ed2f79c-fedf-d358-52d5-cea3aca0feda',N'OFICINA',NULL,NULL,N'4193',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'D12',N'5c569aaa-9de0-8672-1369-69f4003f81e4',N'OFICINA',NULL,NULL,N'3100',NULL,N'Elétrica',NULL,N'MODULO',NULL,NULL),
(CONVERT(date,'20261001',112),N'D13',N'0c84e899-18ac-d5d9-d56e-9dfab3806847',N'OFICINA',NULL,NULL,N'2623',NULL,N'Elétrica',NULL,N'LIMPADOR',NULL,NULL),
(CONVERT(date,'20261001',112),N'F12',N'c6e64d7e-5f0f-0849-bbd4-c1df608d9040',N'OFICINA',NULL,NULL,N'4217',NULL,N'Borracharia',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'F13',N'd1f63a33-3e99-eea2-8ee3-13b1c1e5b6e8',N'OFICINA',NULL,NULL,N'4221',NULL,N'Borracharia',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'G12',N'ce4c1576-0182-4566-7651-9dc9fd2e43dc',N'OFICINA',NULL,NULL,N'3206',NULL,N'Funilaria / Pintura',NULL,N'FUNILARIA',NULL,NULL),
(CONVERT(date,'20261001',112),N'G13',N'82b4282e-9318-b263-21a4-851b9c8b51c7',N'OFICINA',NULL,NULL,N'2713',NULL,N'Funilaria / Pintura',NULL,N'BANCO',NULL,NULL),
(CONVERT(date,'20261001',112),N'G14',N'd981bbb4-2d2e-1edc-ad59-ebf63c52db86',N'OFICINA',NULL,NULL,N'4227',NULL,N'Funilaria / Pintura',NULL,N'PARACHOQUE',NULL,NULL),
(CONVERT(date,'20261001',112),N'J12',N'3d4653f5-9831-5491-de41-9701ab979c85',N'OFICINA',NULL,NULL,N'23',NULL,N'Bilhetagem',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'C23',N'5b5f8f58-7140-04ff-4d4b-2b9900273e02',N'REFORCO',N'FIXO',1,N'4253',NULL,NULL,N'07:15 - A',N'LUBRIFICAÇÃO',NULL,NULL),
(CONVERT(date,'20261001',112),N'H23',N'e0adbf15-949e-50a9-5ba6-4118fd8f0432',N'REFORCO',N'FIXO',7,N'4015',NULL,NULL,N'07:40 - C',N'TROCA DE ÓLEO',NULL,NULL),
(CONVERT(date,'20261001',112),N'C24',N'f50935b7-d84e-4096-1c80-2b4495801568',N'REFORCO',N'FIXO',2,N'4181',NULL,NULL,N'07:15 - A',N'LUBRIFICAÇÃO',NULL,NULL),
(CONVERT(date,'20261001',112),N'H24',N'b024c335-8b09-000e-53c9-d309802049bc',N'REFORCO',N'FIXO',8,N'4222',NULL,NULL,N'07:45 - C',N'TROCA DE ÓLEO',NULL,NULL),
(CONVERT(date,'20261001',112),N'C25',N'726b1362-db51-5c6d-4c5a-9a2178c4c642',N'REFORCO',N'FIXO',3,N'4197',NULL,NULL,N'07:32 - A',N'LUBRIFICAÇÃO',NULL,NULL),
(CONVERT(date,'20261001',112),N'C26',N'41463993-c34e-cd54-dd3d-2af4ce8651b6',N'REFORCO',N'FIXO',4,N'4274',NULL,NULL,N'07:40 - A',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261001',112),N'C27',N'6cd79ec2-a5d4-a078-098c-813d92442080',N'REFORCO',N'FIXO',5,N'4267',NULL,NULL,N'07:40 - M',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261001',112),N'C28',N'c0103854-dc86-4de0-c5ff-afaec5aafef8',N'REFORCO',N'FIXO',6,N'3252',NULL,NULL,N'07:40 - A',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261001',112),N'J24',N'de672aa4-882e-bfa5-a0f5-e5507cc433b8',N'REFORCO',N'EXTRA',2,N'4267',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'J25',N'7830f797-9f42-84d9-6cbf-4401d3360826',N'REFORCO',N'EXTRA',3,N'4274',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'J26',N'8cc648e1-c75d-0f65-dd0d-3032d3e44328',N'REFORCO',N'EXTRA',4,N'3252',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261001',112),N'A35',N'660370a8-7011-f298-27e5-326657068dc5',N'BLOQUEADO',NULL,NULL,N'2424',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260603',112)),
(CONVERT(date,'20261001',112),N'A36',N'f1a4388b-69b2-5620-5e59-a960bd462e6f',N'BLOQUEADO',NULL,NULL,N'2600',N'VSF',NULL,NULL,N'ELÉTRICA',NULL,CONVERT(date,'20260106',112)),
(CONVERT(date,'20261001',112),N'A37',N'f84a9179-90bc-d224-209c-91f1a7f7c820',N'BLOQUEADO',NULL,NULL,N'2800',N'VSF',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20260103',112)),
(CONVERT(date,'20261001',112),N'A38',N'7a74ec25-9a8a-2fcf-9e16-fa37c03a8773',N'BLOQUEADO',NULL,NULL,N'2611',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260825',112)),
(CONVERT(date,'20261001',112),N'A39',N'b7c6a54c-9edd-5d2e-813c-fd4e9dd8872b',N'BLOQUEADO',NULL,NULL,N'2327',N'VSF',NULL,NULL,N'EMBREAGEM',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261001',112),N'G35',N'32cb3ad6-839d-6172-b40f-a0cb9c60dee4',N'BLOQUEADO',NULL,NULL,N'4199',N'VCG',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240503',112)),
(CONVERT(date,'20261001',112),N'G36',N'2828f4ae-81ab-2056-275e-be3409f53172',N'BLOQUEADO',NULL,NULL,N'4200',N'VCG',NULL,NULL,N'TRANSMISSÃO',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261001',112),N'G37',N'8b54765b-d263-c703-7f6a-1057e3a0330a',N'BLOQUEADO',NULL,NULL,N'4201',N'VCG',NULL,NULL,N'MECANICA PASTILHS E DISCO DE FREIO',NULL,CONVERT(date,'20260628',112)),
(CONVERT(date,'20261001',112),N'G38',N'f92e4595-f3ff-54c9-1f85-3d771b111e5d',N'BLOQUEADO',NULL,NULL,N'4190',N'VCG',NULL,NULL,N'VIDRO BOLHA',NULL,CONVERT(date,'20260820',112)),
(CONVERT(date,'20261001',112),N'G39',N'04c194a9-c9b4-3cd5-465f-8582cd03534f',N'BLOQUEADO',NULL,NULL,N'4255',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260824',112)),
(CONVERT(date,'20261001',112),N'G40',N'802a867f-2783-464c-8a18-4c3266192ad7',N'BLOQUEADO',NULL,NULL,N'4196',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260827',112)),
(CONVERT(date,'20261001',112),N'G41',N'715be3eb-95f8-a557-84a8-19ee4636337d',N'BLOQUEADO',NULL,NULL,N'4230',N'VCG',NULL,NULL,N'CABEÇOTE DO MOTOR',NULL,CONVERT(date,'20260918',112)),
(CONVERT(date,'20261001',112),N'G42',N'11ac3f9e-ae4f-f6bb-6d28-2500dd3767ec',N'BLOQUEADO',NULL,NULL,N'4257',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260921',112)),
(CONVERT(date,'20261001',112),N'G43',N'5e247fae-e34f-0e0c-b96f-89db2d8d9e3d',N'BLOQUEADO',NULL,NULL,N'4194',N'VCG',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261001',112),N'G44',N'18c3a24f-d854-682a-543c-23033d5c0854',N'BLOQUEADO',NULL,NULL,N'4212',N'VCG',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20260927',112)),
(CONVERT(date,'20261001',112),N'G45',N'3f732b60-6f42-4ef6-3da5-ae0220b6a711',N'BLOQUEADO',NULL,NULL,N'4275',N'VCG',NULL,NULL,N'EMBREAGEM',NULL,CONVERT(date,'20260928',112)),
(CONVERT(date,'20261001',112),N'A48',N'94502839-132a-ca80-a38a-782c0019c1e1',N'BLOQUEADO',NULL,NULL,N'3005',N'JTU',NULL,NULL,N'SUSPENSÃO ',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261001',112),N'A49',N'2e02fe27-ad77-12de-b976-959552f54455',N'BLOQUEADO',NULL,NULL,N'3133',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260901',112)),
(CONVERT(date,'20261001',112),N'A50',N'46d59e22-f282-b6d2-5c79-6733dce073d6',N'BLOQUEADO',NULL,NULL,N'3006',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240630',112)),
(CONVERT(date,'20261001',112),N'A51',N'6bf13922-ff87-5467-22dd-045ec4127bac',N'BLOQUEADO',NULL,NULL,N'3279',N'JTU',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20260929',112)),
(CONVERT(date,'20261001',112),N'A52',N'49faf212-5614-8464-bec0-20ec49a34b81',N'BLOQUEADO',NULL,NULL,N'3263',N'JTU',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20260929',112)),
(CONVERT(date,'20261001',112),N'A53',N'fb819a60-71bf-6615-fadc-90cebe3b482a',N'BLOQUEADO',NULL,NULL,N'3214',N'JTU',NULL,NULL,N'PANE ELETRICA',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261001',112),N'A54',N'53ff827f-2b61-74b9-e7f4-1559cc1363c0',N'BLOQUEADO',NULL,NULL,N'3106',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260624',112)),
(CONVERT(date,'20261001',112),N'A55',N'59db0cf7-c5f2-b8a4-5e4e-6178ab71e669',N'BLOQUEADO',NULL,NULL,N'3267',N'JTU',NULL,NULL,N'EMBREAGEM',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261001',112),N'A56',N'a10e2d41-9410-3260-c907-d5ad7de72daa',N'BLOQUEADO',NULL,NULL,N'3269',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261001',112),N'A57',N'ccb98a5c-e8a8-4946-29df-abdbe8953304',N'BLOQUEADO',NULL,NULL,N'3261',N'JTU',NULL,NULL,N'INSPEÇÂO',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261001',112),N'A58',N'b5188749-e6bc-7abb-c886-00f251162a0f',N'BLOQUEADO',NULL,NULL,N'3951',N'JTU',NULL,NULL,N'EMBREAGEM',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261001',112),N'A59',N'73a33a7c-3451-a1ab-546e-ccb629e45aee',N'BLOQUEADO',NULL,NULL,N'3959',N'JTU',NULL,NULL,N'REVISÂO',NULL,CONVERT(date,'20260922',112)),
(CONVERT(date,'20261001',112),N'G48',N'063b6564-e553-8c11-78dc-d45aeef60b3c',N'BLOQUEADO',NULL,NULL,N'1119',N'VCM',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20201218',112)),
(CONVERT(date,'20261001',112),N'G50',N'1b06e147-7f91-d73b-c3a2-e83dfd76fea7',N'BLOQUEADO',NULL,NULL,N'1323',N'VCM',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20241207',112)),
(CONVERT(date,'20261001',112),N'G51',N'381a3e7e-56bd-8fa8-abee-0392d5a789eb',N'BLOQUEADO',NULL,NULL,N'1322',N'VCM',NULL,NULL,N'REVISÂO GERAL',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261001',112),N'G52',N'58bc8582-8ade-172c-bdc5-965917083e51',N'BLOQUEADO',NULL,NULL,N'3083',N'VCM',NULL,NULL,N'FORA DE OPERAÇÂO',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261002',112),N'A6',N'd1b76123-a248-565d-72e4-dfa342b49148',N'PREVENTIVA',NULL,NULL,N'3904',NULL,N'Preventiva',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'B6',N'85892568-9882-196e-2ab9-05da80a5ce55',N'PREVENTIVA',NULL,NULL,N'4258',NULL,N'Preventiva',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'A7',N'15f95fd8-d7cd-1c8f-95a6-0979f152a81f',N'PREVENTIVA',NULL,NULL,N'3902',NULL,N'Preventiva',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'E6',N'eff79907-6661-9f9c-4d48-ff68c0c33dd2',N'PREVENTIVA',NULL,NULL,N'4253',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'F6',N'4ea59d9b-366f-94bb-34bb-b4df3a789dd4',N'PREVENTIVA',NULL,NULL,N'4184',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'E7',N'd7560ff3-d27e-4297-ae71-42057daf85cd',N'PREVENTIVA',NULL,NULL,N'4015',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'F7',N'97979a2d-cb0b-d590-a759-d547c069f8c1',N'PREVENTIVA',NULL,NULL,N'4264',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'E8',N'391b4cd7-a853-47e7-5ea3-809b68119c94',N'PREVENTIVA',NULL,NULL,N'4188',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'G6',N'5a86e1ce-9f83-7f27-74bd-67c74d4b61ce',N'PREVENTIVA',NULL,NULL,N'4235',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'G8',N'3205bfba-9709-3c14-6f4d-abccff3cf662',N'PREVENTIVA',NULL,NULL,N'4231',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'A12',N'8b4e808c-afd7-6fda-2296-97044978a6c1',N'OFICINA',NULL,NULL,N'2704',NULL,N'Mecânica',NULL,N'BOMBA ARLA',NULL,NULL),
(CONVERT(date,'20261002',112),N'A13',N'4ff3fd86-3324-9f6f-03d6-f788ab52c02a',N'OFICINA',NULL,NULL,N'3222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261002',112),N'A14',N'd29179f3-529e-404a-aa87-102636b106be',N'OFICINA',NULL,NULL,N'4244',NULL,N'Mecânica',NULL,N'M DE EIXO',NULL,NULL),
(CONVERT(date,'20261002',112),N'A15',N'bf93f4f4-0b5d-d495-4c31-a4b99881baff',N'OFICINA',NULL,NULL,N'4222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261002',112),N'A16',N'a3b3e305-a9bb-a594-4354-7c691464d9d5',N'OFICINA',NULL,NULL,N'4197',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261002',112),N'A17',N'c7e456c1-d124-b5d7-d04a-f5bfd1d8b7a0',N'OFICINA',NULL,NULL,N'4225',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261002',112),N'A18',N'17dfb63a-0d17-e5b2-5b71-466920f3ff2b',N'OFICINA',NULL,NULL,N'2425',NULL,N'Mecânica',NULL,N'VAZ OLEO',NULL,NULL),
(CONVERT(date,'20261002',112),N'A20',N'034c9fe1-0994-eb78-72d7-dab74b6b9507',N'OFICINA',NULL,NULL,N'4224',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261002',112),N'C12',N'b2de580c-d580-08bb-91e8-155d617e020f',N'OFICINA',NULL,NULL,N'3263',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'C13',N'0511acf5-b484-001b-6527-edcf11f79bfe',N'OFICINA',NULL,NULL,N'2514',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'C14',N'efd3873d-c51d-b603-b632-0db8c65c12cd',N'OFICINA',NULL,NULL,N'3139',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'C15',N'a754ee89-61e1-de12-633b-a71072f07311',N'OFICINA',NULL,NULL,N'4196',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'C16',N'7f5072a1-6d62-f39f-3b7a-072413b8d519',N'OFICINA',NULL,NULL,N'4222',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'C17',N'87d92114-5372-9229-e560-8d678f095efb',N'OFICINA',NULL,NULL,N'2426',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'C18',N'09b8a9c9-157a-1d6b-e48b-2004fe504d08',N'OFICINA',NULL,NULL,N'4209',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'C19',N'c85ef5c3-2d31-c299-a8d2-52706f503a88',N'OFICINA',NULL,NULL,N'3271',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'C20',N'725b9c4a-7252-0d53-c3c2-591e6c4ad0ee',N'OFICINA',NULL,NULL,N'4193',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'D12',N'a9ed6610-85b0-e5e5-5dc4-abbd010291c5',N'OFICINA',NULL,NULL,N'3100',NULL,N'Elétrica',NULL,N'MODULO',NULL,NULL),
(CONVERT(date,'20261002',112),N'D13',N'3ed679b8-d32b-22b4-e193-6331a8887f36',N'OFICINA',NULL,NULL,N'2623',NULL,N'Elétrica',NULL,N'LIMPADOR',NULL,NULL),
(CONVERT(date,'20261002',112),N'D14',N'fd148de9-fceb-46d3-fa21-79dce180920b',N'OFICINA',NULL,NULL,N'4189',NULL,N'Elétrica',NULL,N'limpa',NULL,NULL),
(CONVERT(date,'20261002',112),N'F12',N'84737d47-e994-52a5-31fc-e49f48cb6964',N'OFICINA',NULL,NULL,N'4228',NULL,N'Borracharia',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'F13',N'c6b4f7e6-bfc5-5f4b-47be-580239f8ebdf',N'OFICINA',NULL,NULL,N'2325',NULL,N'Borracharia',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'G12',N'9480f97b-140d-2949-7a94-59a94589ebbb',N'OFICINA',NULL,NULL,N'3147',NULL,N'Funilaria / Pintura',NULL,N'BANCO',NULL,NULL),
(CONVERT(date,'20261002',112),N'G13',N'5dc0ae57-9b68-5ed8-275d-39e3a14c10bc',N'OFICINA',NULL,NULL,N'3900',NULL,N'Funilaria / Pintura',NULL,N'INFITRAÇAO',NULL,NULL),
(CONVERT(date,'20261002',112),N'G14',N'86297a12-d6e5-17e4-311e-5ef1d2150a6a',N'OFICINA',NULL,NULL,N'4227',NULL,N'Funilaria / Pintura',NULL,N'PARACHOQUE',NULL,NULL),
(CONVERT(date,'20261002',112),N'J12',N'800b9876-3f51-317d-35d6-fde7760bdf11',N'OFICINA',NULL,NULL,N'23',NULL,N'Bilhetagem',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'C23',N'd20c0a24-419f-f619-253d-f67def8ae480',N'REFORCO',N'FIXO',1,N'4253',NULL,NULL,N'07:15 - A',N'LUBRIFICAÇÃO',NULL,NULL),
(CONVERT(date,'20261002',112),N'H23',N'aa39f413-880a-960b-3673-5805a20156c0',N'REFORCO',N'FIXO',7,N'4015',NULL,NULL,N'07:40 - C',N'TROCA DE ÓLEO',NULL,NULL),
(CONVERT(date,'20261002',112),N'C24',N'150a5c4a-c0f8-de4c-8b74-667dd3544fdf',N'REFORCO',N'FIXO',2,N'4015',NULL,NULL,N'07:15 - A',N'LUBRIFICAÇÃO',NULL,NULL),
(CONVERT(date,'20261002',112),N'H24',N'a711b3ad-1835-b94f-df0b-647894e16272',N'REFORCO',N'FIXO',8,N'4184',NULL,NULL,N'07:45 - C',N'TROCA DE ÓLEO',NULL,NULL),
(CONVERT(date,'20261002',112),N'C25',N'330d4e85-7604-0683-bdb5-8e8e96f1826f',N'REFORCO',N'FIXO',3,N'4188',NULL,NULL,N'07:32 - A',N'LUBRIFICAÇÃO',NULL,NULL),
(CONVERT(date,'20261002',112),N'H25',N'5f6639ea-4fd7-09fb-9def-5507b46831cd',N'REFORCO',N'FIXO',9,N'4264',NULL,NULL,N'07:45 - A',N'TROCA DE ÓLEO',NULL,NULL),
(CONVERT(date,'20261002',112),N'C26',N'd879af70-874b-eb4e-02ec-a856e4786eab',N'REFORCO',N'FIXO',4,N'3257',NULL,NULL,N'07:40 - A',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261002',112),N'H26',N'6999828e-ed3c-31a9-8e39-619e927d71fa',N'REFORCO',N'FIXO',10,N'3902',NULL,NULL,N'07:50 - C',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261002',112),N'C27',N'39c2344d-8e8f-4b5d-aa53-264b86ab6336',N'REFORCO',N'FIXO',5,N'4267',NULL,NULL,N'07:40 - M',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261002',112),N'J24',N'8fe52464-d0c2-7c87-4e00-71def5d73a22',N'REFORCO',N'EXTRA',2,N'4267',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'J25',N'cef92b26-82c6-6312-49fa-ac3b81694401',N'REFORCO',N'EXTRA',3,N'3257',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'J26',N'37ffb3f6-3189-016c-16ee-dd9ed9bc9411',N'REFORCO',N'EXTRA',4,N'3902',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261002',112),N'A35',N'c79cd40f-c842-f957-86e2-11dca11d1181',N'BLOQUEADO',NULL,NULL,N'2424',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260603',112)),
(CONVERT(date,'20261002',112),N'A36',N'5cfad59f-9bcc-4886-8b45-8a2209f4ca86',N'BLOQUEADO',NULL,NULL,N'2600',N'VSF',NULL,NULL,N'ELÉTRICA',NULL,CONVERT(date,'20260106',112)),
(CONVERT(date,'20261002',112),N'A37',N'147107bc-75a7-9c23-a5de-643af7cc25db',N'BLOQUEADO',NULL,NULL,N'2800',N'VSF',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20260103',112)),
(CONVERT(date,'20261002',112),N'A38',N'fa2f0107-d3da-d64b-9f53-f63e97573bb3',N'BLOQUEADO',NULL,NULL,N'2611',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260825',112)),
(CONVERT(date,'20261002',112),N'G35',N'085fee80-eee5-5488-e563-5deb028292a6',N'BLOQUEADO',NULL,NULL,N'4199',N'VCG',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240503',112)),
(CONVERT(date,'20261002',112),N'G36',N'e8263a7c-4c15-3c4e-fdde-27c9699d818f',N'BLOQUEADO',NULL,NULL,N'4200',N'VCG',NULL,NULL,N'TRANSMISSÃO',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261002',112),N'G37',N'89b89a2f-fbff-d876-9e5c-d0ab9f8e1a78',N'BLOQUEADO',NULL,NULL,N'4201',N'VCG',NULL,NULL,N'MECANICA PASTILHS E DISCO DE FREIO',NULL,CONVERT(date,'20260628',112)),
(CONVERT(date,'20261002',112),N'G38',N'2996d623-dc05-a6a3-e2f3-d92dec1a5c19',N'BLOQUEADO',NULL,NULL,N'4190',N'VCG',NULL,NULL,N'VIDRO BOLHA',NULL,CONVERT(date,'20260820',112)),
(CONVERT(date,'20261002',112),N'G39',N'4daf3b4b-a7b0-bbd7-c75b-6f142e0d9dbb',N'BLOQUEADO',NULL,NULL,N'4196',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260827',112)),
(CONVERT(date,'20261002',112),N'G40',N'a81c6317-a0d9-8f1e-a9dd-d15867485d3d',N'BLOQUEADO',NULL,NULL,N'4230',N'VCG',NULL,NULL,N'CABEÇOTE DO MOTOR',NULL,CONVERT(date,'20260918',112)),
(CONVERT(date,'20261002',112),N'G41',N'f60816ec-21bd-8eec-2dc4-db0cc350de7f',N'BLOQUEADO',NULL,NULL,N'4255',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260824',112)),
(CONVERT(date,'20261002',112),N'G42',N'3b39e9fd-7817-c886-5474-737690a4aa38',N'BLOQUEADO',NULL,NULL,N'4211',N'VCG',NULL,NULL,N'PANE ELETRICA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261002',112),N'G43',N'a232cd9b-a6b6-cbb1-6968-0b65f3610a91',N'BLOQUEADO',NULL,NULL,N'4225',N'VCG',NULL,NULL,N'PANE ELETRICA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261002',112),N'G44',N'79ccbf71-3153-2320-9fc1-960fbe1c88e8',N'BLOQUEADO',NULL,NULL,N'4257',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260921',112)),
(CONVERT(date,'20261002',112),N'G45',N'7866abfe-349f-3c1a-9bec-6cb4628d3cf7',N'BLOQUEADO',NULL,NULL,N'4274',N'VCG',NULL,NULL,N'REVISÂO ELEVADOR',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261002',112),N'G46',N'd45303b7-1ae2-b024-12dd-7aa9cb82cd01',N'BLOQUEADO',NULL,NULL,N'4194',N'VCG',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261002',112),N'G47',N'7e0c5e59-d318-ab2e-8e89-833112b142c7',N'BLOQUEADO',NULL,NULL,N'4212',N'VCG',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20260927',112)),
(CONVERT(date,'20261002',112),N'G48',N'3a54c4a2-a2a6-979f-3f69-1418bef2e9a5',N'BLOQUEADO',NULL,NULL,N'4275',N'VCG',NULL,NULL,N'EMBREAGEM',NULL,CONVERT(date,'20260928',112)),
(CONVERT(date,'20261002',112),N'A51',N'f3094c61-cdc5-4497-9c03-ea299452393d',N'BLOQUEADO',NULL,NULL,N'3005',N'JTU',NULL,NULL,N'SUSPENSÃO ',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261002',112),N'A52',N'51f21c3e-3edd-f1db-b5c4-0166e37221ef',N'BLOQUEADO',NULL,NULL,N'3133',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260901',112)),
(CONVERT(date,'20261002',112),N'A53',N'ac2b9c11-fb10-d2f0-7bac-ed4d817880d3',N'BLOQUEADO',NULL,NULL,N'3006',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240630',112)),
(CONVERT(date,'20261002',112),N'A54',N'ed49de01-7d35-8665-ad8d-fc21db0b9ff4',N'BLOQUEADO',NULL,NULL,N'3279',N'JTU',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20260929',112)),
(CONVERT(date,'20261002',112),N'A55',N'9dfa6104-bc10-598f-4578-07a4554be3b5',N'BLOQUEADO',NULL,NULL,N'3263',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20260929',112)),
(CONVERT(date,'20261002',112),N'A56',N'ebed541c-cabe-ee58-d463-a82e126d201b',N'BLOQUEADO',NULL,NULL,N'3106',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260624',112)),
(CONVERT(date,'20261002',112),N'A57',N'9546890e-0213-52fa-bb0d-e4b840e2022e',N'BLOQUEADO',NULL,NULL,N'3099',N'JTU',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261002',112),N'A58',N'444de40c-d36a-46bf-63c4-c3b716e61b78',N'BLOQUEADO',NULL,NULL,N'3252',N'JTU',NULL,NULL,N'MOLEJO',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261002',112),N'A59',N'cfcaeff5-4789-6a2e-209e-f74b4e18ff80',N'BLOQUEADO',NULL,NULL,N'3267',N'JTU',NULL,NULL,N'EMBREAGEM',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261002',112),N'A60',N'ccc2730d-bf93-6779-7301-b2fadca664fa',N'BLOQUEADO',NULL,NULL,N'3269',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261002',112),N'A61',N'c46106da-38d3-fd03-e590-8ce6348569d7',N'BLOQUEADO',NULL,NULL,N'3951',N'JTU',NULL,NULL,N'EMBREAGEM',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261002',112),N'G51',N'b520e495-3aa8-c00b-65cb-9c1d82292cc4',N'BLOQUEADO',NULL,NULL,N'1119',N'VCM',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20201218',112)),
(CONVERT(date,'20261002',112),N'G52',N'0131656c-d462-dd03-fc88-a3af6519e7d1',N'BLOQUEADO',NULL,NULL,N'3083',N'VCM',NULL,NULL,N'FORA DE OPERAÇÂO',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261002',112),N'G53',N'd6e1fac2-bf60-4fb6-1f05-6b7c7a69a7c9',N'BLOQUEADO',NULL,NULL,N'1323',N'VCM',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20241207',112)),
(CONVERT(date,'20261002',112),N'G54',N'bc3abfdd-44ee-6c9b-2729-defd303b2b6c',N'BLOQUEADO',NULL,NULL,N'1322',N'VCM',NULL,NULL,N'REVISÂO GERAL',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261003',112),N'A12',N'7fb6ada8-f6f7-4a2b-4283-0c563357cde9',N'OFICINA',NULL,NULL,N'2704',NULL,N'Mecânica',NULL,N'BOMBA ARLA',NULL,NULL),
(CONVERT(date,'20261003',112),N'A13',N'd2f656fc-1a3c-6fc9-255b-d4c4dbf45de4',N'OFICINA',NULL,NULL,N'3222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261003',112),N'A14',N'00ece86a-8e14-2473-f621-0f44739b124f',N'OFICINA',NULL,NULL,N'4244',NULL,N'Mecânica',NULL,N'M DE EIXO',NULL,NULL),
(CONVERT(date,'20261003',112),N'A15',N'1398cb29-8a26-ae04-67c2-feecca97e7d1',N'OFICINA',NULL,NULL,N'4222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261003',112),N'A16',N'6c31a251-f326-7695-4087-b9dd4f341961',N'OFICINA',NULL,NULL,N'4197',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261003',112),N'A17',N'571f97be-def7-75b4-3822-16ec48cf1623',N'OFICINA',NULL,NULL,N'4225',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261003',112),N'A18',N'6db2c53b-3da0-ca96-2fef-b262eb281d4c',N'OFICINA',NULL,NULL,N'2425',NULL,N'Mecânica',NULL,N'VAZ OLEO',NULL,NULL),
(CONVERT(date,'20261003',112),N'A20',N'12043cef-3e2f-d65e-8c78-fc39ada0fea9',N'OFICINA',NULL,NULL,N'4224',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261003',112),N'C12',N'8e239ed4-cd76-4dc4-7c59-d39aeacd23c7',N'OFICINA',NULL,NULL,N'3263',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261003',112),N'C13',N'0a550f4b-0d41-8242-15b2-a964447b303a',N'OFICINA',NULL,NULL,N'2514',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261003',112),N'C14',N'836db6e6-c64e-1604-20f4-5e3179beede5',N'OFICINA',NULL,NULL,N'3139',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261003',112),N'C15',N'bfa3e516-a436-3ce3-2b31-94f2209ea652',N'OFICINA',NULL,NULL,N'4196',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261003',112),N'C16',N'f33426c5-6df1-22fc-3557-bd1b55c9a62f',N'OFICINA',NULL,NULL,N'4222',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261003',112),N'C17',N'71e2eb89-c1de-1b07-98d5-052081a67c02',N'OFICINA',NULL,NULL,N'2426',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261003',112),N'C18',N'e1940ae1-52b9-392d-7032-cce0ec67948a',N'OFICINA',NULL,NULL,N'4209',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261003',112),N'C19',N'5dd43a7a-78fa-f1f6-f47c-4622631fe9c3',N'OFICINA',NULL,NULL,N'3271',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261003',112),N'C20',N'488bfe77-36b1-143e-cff5-14f6ab4276eb',N'OFICINA',NULL,NULL,N'4193',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261003',112),N'D12',N'eb18f95c-3137-47f5-16db-04b1aae61588',N'OFICINA',NULL,NULL,N'3100',NULL,N'Elétrica',NULL,N'MODULO',NULL,NULL),
(CONVERT(date,'20261003',112),N'D13',N'7e282f4c-a187-1595-02dc-cd9c0b6cfd11',N'OFICINA',NULL,NULL,N'2623',NULL,N'Elétrica',NULL,N'LIMPADOR',NULL,NULL),
(CONVERT(date,'20261003',112),N'D14',N'85737b33-8b5a-b44c-20fc-ac8fb67ffcfb',N'OFICINA',NULL,NULL,N'4189',NULL,N'Elétrica',NULL,N'LIMPADOR',NULL,NULL),
(CONVERT(date,'20261003',112),N'G12',N'3deeeec1-2efe-737d-0ac0-8fe55c40f121',N'OFICINA',NULL,NULL,N'3147',NULL,N'Funilaria / Pintura',NULL,N'BANCO',NULL,NULL),
(CONVERT(date,'20261003',112),N'G14',N'ace5ec0a-9d74-2316-f880-bc707db02594',N'OFICINA',NULL,NULL,N'4227',NULL,N'Funilaria / Pintura',NULL,N'PARACHOQUE',NULL,NULL),
(CONVERT(date,'20261003',112),N'J12',N'ae9f1f19-3d96-e16a-344c-282860a355c2',N'OFICINA',NULL,NULL,N'23',NULL,N'Bilhetagem',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261003',112),N'J23',N'48a9b9f2-8499-876b-6416-1d9ca15f1845',N'REFORCO',N'EXTRA',1,N'3902',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261003',112),N'J24',N'617b5e02-eeda-71c2-7c4a-c4643e344533',N'REFORCO',N'EXTRA',2,N'3904',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261003',112),N'A35',N'e3c700f8-3206-d46e-0009-9b49125324c4',N'BLOQUEADO',NULL,NULL,N'2424',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260603',112)),
(CONVERT(date,'20261003',112),N'A36',N'0fc2eb0b-0cbe-6940-84ec-7ebd6dd0c783',N'BLOQUEADO',NULL,NULL,N'2600',N'VSF',NULL,NULL,N'ELÉTRICA',NULL,CONVERT(date,'20260106',112)),
(CONVERT(date,'20261003',112),N'A37',N'4e0cffc2-00c7-307f-79e1-4c2c77055d7e',N'BLOQUEADO',NULL,NULL,N'2800',N'VSF',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20260103',112)),
(CONVERT(date,'20261003',112),N'A38',N'55838c77-d65e-574b-5d9f-e9576015ce5d',N'BLOQUEADO',NULL,NULL,N'2611',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260825',112)),
(CONVERT(date,'20261003',112),N'A39',N'c8596901-bc62-e7b2-a1da-7ba3558dcd07',N'BLOQUEADO',NULL,NULL,N'2352',N'VSF',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261003',112),N'G35',N'3563d7c6-0245-2fbb-1793-24cc3b3be587',N'BLOQUEADO',NULL,NULL,N'4199',N'VCG',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240503',112)),
(CONVERT(date,'20261003',112),N'G36',N'316da7a4-80c7-fe7d-765d-dc29b1e0a75e',N'BLOQUEADO',NULL,NULL,N'4200',N'VCG',NULL,NULL,N'TRANSMISSÃO',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261003',112),N'G37',N'17c0299d-89d2-e33d-64ba-4dc9f7603913',N'BLOQUEADO',NULL,NULL,N'4201',N'VCG',NULL,NULL,N'MECANICA PASTILHS E DISCO DE FREIO',NULL,CONVERT(date,'20260628',112)),
(CONVERT(date,'20261003',112),N'G38',N'745344f3-8212-d6b9-d96a-7318eff5a1ff',N'BLOQUEADO',NULL,NULL,N'4190',N'VCG',NULL,NULL,N'VIDRO BOLHA',NULL,CONVERT(date,'20260820',112)),
(CONVERT(date,'20261003',112),N'G39',N'd36a8931-cf48-d5ef-d8c5-5a132dd2c50f',N'BLOQUEADO',NULL,NULL,N'4196',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260827',112)),
(CONVERT(date,'20261003',112),N'G40',N'a7a7f41d-4e5d-db3f-4d19-12c2bd4fbe6d',N'BLOQUEADO',NULL,NULL,N'4255',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260824',112)),
(CONVERT(date,'20261003',112),N'G41',N'5075c507-3dd8-4d13-b548-91c6ca2a07bb',N'BLOQUEADO',NULL,NULL,N'4211',N'VCG',NULL,NULL,N'PANE ELETRICA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261003',112),N'G42',N'63a4c895-06e1-19c3-a53d-131a2e60f6d6',N'BLOQUEADO',NULL,NULL,N'4225',N'VCG',NULL,NULL,N'PANE ELETRICA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261003',112),N'G43',N'22c70da6-9009-a47d-5493-b63923b9951e',N'BLOQUEADO',NULL,NULL,N'4234',N'VCG',NULL,NULL,N'TACOGRAFO',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261003',112),N'G44',N'b670f509-54a7-0f17-5d7f-f5547025ccbd',N'BLOQUEADO',NULL,NULL,N'4248',N'VCG',NULL,NULL,N'AR E EMBREAGEM',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261003',112),N'G45',N'0637cc09-4333-e163-e600-4a48ec3e266d',N'BLOQUEADO',NULL,NULL,N'4257',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260921',112)),
(CONVERT(date,'20261003',112),N'G46',N'5e6dca8e-7a13-02a5-daac-23e3ce5bf13b',N'BLOQUEADO',NULL,NULL,N'4274',N'VCG',NULL,NULL,N'ISPEÇAO A PEDIDO DA GERENCIA',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261003',112),N'G47',N'311e59b2-bded-3454-e6d6-f79723845291',N'BLOQUEADO',NULL,NULL,N'4194',N'VCG',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261003',112),N'G48',N'3c5175dc-6a4e-fe30-18ae-0e556d2fb005',N'BLOQUEADO',NULL,NULL,N'4272',N'VCG',NULL,NULL,N'ELETRICA FAROL',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261003',112),N'G49',N'67cbc06c-b262-15e7-fe5c-5b2da646b5af',N'BLOQUEADO',NULL,NULL,N'4182',N'VCG',NULL,NULL,N'PINTURA',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261003',112),N'G50',N'b656cc29-2d96-c5c3-a9c9-0bb3c7caa2f1',N'BLOQUEADO',NULL,NULL,N'4212',N'VCG',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20260927',112)),
(CONVERT(date,'20261003',112),N'G51',N'7fadad67-a28c-c519-acd3-08a1f147c8b7',N'BLOQUEADO',NULL,NULL,N'4275',N'VCG',NULL,NULL,N'EMBREAGEM',NULL,CONVERT(date,'20260928',112)),
(CONVERT(date,'20261003',112),N'A54',N'2dbdf68c-3462-b4f9-da4e-fd9c480ff148',N'BLOQUEADO',NULL,NULL,N'3005',N'JTU',NULL,NULL,N'SUSPENSÃO ',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261003',112),N'A55',N'944d5083-f568-012e-67e0-9516c8754c4f',N'BLOQUEADO',NULL,NULL,N'3133',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260901',112)),
(CONVERT(date,'20261003',112),N'A56',N'37042362-9ba9-56be-6634-af0916e25f4e',N'BLOQUEADO',NULL,NULL,N'3006',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240630',112)),
(CONVERT(date,'20261003',112),N'A57',N'57da1fde-1153-4ffa-e3f8-8a0bbd20165b',N'BLOQUEADO',NULL,NULL,N'3252',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261003',112),N'A58',N'f7c2a613-7bde-5291-36f8-2995e0a6f301',N'BLOQUEADO',NULL,NULL,N'3263',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20260929',112)),
(CONVERT(date,'20261003',112),N'A59',N'c995cc65-82a5-205f-abff-7221079dc9ad',N'BLOQUEADO',NULL,NULL,N'3279',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261003',112),N'A60',N'13d6cdcf-6c32-311e-a6d9-13ab38c5c0f8',N'BLOQUEADO',NULL,NULL,N'3257',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261003',112),N'A61',N'443d3093-5a21-6a0e-a138-3a27092627cc',N'BLOQUEADO',NULL,NULL,N'3106',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260624',112)),
(CONVERT(date,'20261003',112),N'A62',N'cd0700c2-37bc-00da-e0a7-361aa09fdf72',N'BLOQUEADO',NULL,NULL,N'3099',N'JTU',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261003',112),N'A63',N'343ad712-cd6e-55c9-c901-e1a15468ff93',N'BLOQUEADO',NULL,NULL,N'3208',N'JTU',NULL,NULL,N'FREIO',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261003',112),N'A64',N'5d5b4c6c-889b-eae0-40a6-87ee4c798dca',N'BLOQUEADO',NULL,NULL,N'3267',N'JTU',NULL,NULL,N'EMBREAGEM',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261003',112),N'G54',N'0ac1aa5a-c17f-5ad8-f1c4-555cca0a9952',N'BLOQUEADO',NULL,NULL,N'1119',N'VCM',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20201218',112)),
(CONVERT(date,'20261003',112),N'G55',N'85517927-583b-b7cf-c378-9688789e26fd',N'BLOQUEADO',NULL,NULL,N'3083',N'VCM',NULL,NULL,N'FORA DE OPERAÇÂO',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261003',112),N'G56',N'4d7c9623-d1b3-0c08-5af6-62ef63668f6b',N'BLOQUEADO',NULL,NULL,N'1323',N'VCM',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20241207',112)),
(CONVERT(date,'20261003',112),N'G57',N'791465e8-d143-1190-1fdd-ec5eb09e5c4e',N'BLOQUEADO',NULL,NULL,N'1322',N'VCM',NULL,NULL,N'REVISÂO GERAL',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261004',112),N'A12',N'b6eae899-90e3-3c24-e6d4-c2e5750d95b0',N'OFICINA',NULL,NULL,N'2704',NULL,N'Mecânica',NULL,N'BOMBA ARLA',NULL,NULL),
(CONVERT(date,'20261004',112),N'A13',N'3b5c7ca6-7899-197d-3a31-99fd3790512e',N'OFICINA',NULL,NULL,N'3222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261004',112),N'A14',N'0e7c669e-4a5e-f450-7c93-0979dd518b94',N'OFICINA',NULL,NULL,N'4244',NULL,N'Mecânica',NULL,N'M DE EIXO',NULL,NULL),
(CONVERT(date,'20261004',112),N'A15',N'507b9103-b22a-6842-45b1-2c872e539024',N'OFICINA',NULL,NULL,N'4222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261004',112),N'A16',N'056d520c-66f5-2017-3c81-8e159f0d7f88',N'OFICINA',NULL,NULL,N'4197',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261004',112),N'A17',N'0499bf8d-777c-8bd1-34e6-b8f53b1b71fa',N'OFICINA',NULL,NULL,N'4225',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261004',112),N'A18',N'94aad291-9f24-ec9d-7ce3-30be2f82e4d2',N'OFICINA',NULL,NULL,N'2425',NULL,N'Mecânica',NULL,N'VAZ OLEO',NULL,NULL),
(CONVERT(date,'20261004',112),N'A20',N'fd6a7fe9-21f2-c618-131d-0b555aa8b1a3',N'OFICINA',NULL,NULL,N'4224',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261004',112),N'C12',N'7f42d1ea-4802-e200-0a6f-c782a1a42ff0',N'OFICINA',NULL,NULL,N'3263',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261004',112),N'C13',N'6db5bd21-3548-4abd-5a7e-ad94edc5bb1b',N'OFICINA',NULL,NULL,N'2514',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261004',112),N'C14',N'796020d2-3590-e20f-65b5-9218ab1c5e36',N'OFICINA',NULL,NULL,N'3139',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261004',112),N'C15',N'6cbf0d39-b039-2d8e-856b-7ce83f5e32a7',N'OFICINA',NULL,NULL,N'4196',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261004',112),N'C16',N'3fa2d72f-fc28-0c45-3e09-b5ebbfe808df',N'OFICINA',NULL,NULL,N'4222',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261004',112),N'C17',N'fbb2f04e-af14-5a60-1a6f-9ecfb43074b1',N'OFICINA',NULL,NULL,N'2426',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261004',112),N'C18',N'4b17c201-7d36-6eda-7e15-744184bf1735',N'OFICINA',NULL,NULL,N'4209',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261004',112),N'C19',N'a4e104f8-fce7-c571-ddbb-4b40473353c5',N'OFICINA',NULL,NULL,N'3271',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261004',112),N'C20',N'f0353df4-4d0e-c3a1-fbe7-eac9988ed76b',N'OFICINA',NULL,NULL,N'4193',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261004',112),N'D12',N'7befb838-8bd1-19e7-2981-c67349b0e5ad',N'OFICINA',NULL,NULL,N'3100',NULL,N'Elétrica',NULL,N'MODULO',NULL,NULL),
(CONVERT(date,'20261004',112),N'D13',N'787bf057-55db-dd4e-3e44-ffd7b9fca627',N'OFICINA',NULL,NULL,N'2623',NULL,N'Elétrica',NULL,N'LIMPADOR',NULL,NULL),
(CONVERT(date,'20261004',112),N'D14',N'57f257c9-f036-060c-61a9-5a29395ecc21',N'OFICINA',NULL,NULL,N'4189',NULL,N'Elétrica',NULL,N'LIMPADOR',NULL,NULL),
(CONVERT(date,'20261004',112),N'G12',N'e35645a0-56de-1c30-800e-5ac0afeca645',N'OFICINA',NULL,NULL,N'3147',NULL,N'Funilaria / Pintura',NULL,N'BANCO',NULL,NULL),
(CONVERT(date,'20261004',112),N'G14',N'682bf278-28b3-7fb5-f21c-d8db7653cb3a',N'OFICINA',NULL,NULL,N'4227',NULL,N'Funilaria / Pintura',NULL,N'PARACHOQUE',NULL,NULL),
(CONVERT(date,'20261004',112),N'J12',N'cde6a64f-4696-ccdc-516c-5289a21fb2be',N'OFICINA',NULL,NULL,N'23',NULL,N'Bilhetagem',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261004',112),N'J23',N'cd59f9ea-bc2e-4784-bd62-1cdb417e1f4f',N'REFORCO',N'EXTRA',1,N'3902',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261004',112),N'J24',N'800d1346-0b4f-f08e-aeec-377098e3fcdd',N'REFORCO',N'EXTRA',2,N'3904',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261004',112),N'A35',N'4f6b206a-862a-64a5-78c0-d40aa5f0dd7e',N'BLOQUEADO',NULL,NULL,N'2424',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260603',112)),
(CONVERT(date,'20261004',112),N'A36',N'eeb32557-3acf-2791-6a2f-40ae0b4d5f7b',N'BLOQUEADO',NULL,NULL,N'2600',N'VSF',NULL,NULL,N'ELÉTRICA',NULL,CONVERT(date,'20260106',112)),
(CONVERT(date,'20261004',112),N'A37',N'46f6f117-dd53-6862-2d50-5abfa13ce0b2',N'BLOQUEADO',NULL,NULL,N'2800',N'VSF',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20260103',112)),
(CONVERT(date,'20261004',112),N'A38',N'29b252d3-f9df-6d33-cfe3-4b3000fefe54',N'BLOQUEADO',NULL,NULL,N'2611',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260825',112)),
(CONVERT(date,'20261004',112),N'A39',N'ef5480dc-c65f-79f0-a74d-32f5477ab2ab',N'BLOQUEADO',NULL,NULL,N'2352',N'VSF',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261004',112),N'G35',N'1e55dd8e-ca39-1ec9-0147-5b74509e733a',N'BLOQUEADO',NULL,NULL,N'4199',N'VCG',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240503',112)),
(CONVERT(date,'20261004',112),N'G36',N'587a08fd-6a89-4984-91b3-cfaf98716766',N'BLOQUEADO',NULL,NULL,N'4200',N'VCG',NULL,NULL,N'TRANSMISSÃO',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261004',112),N'G37',N'f6384a53-37ec-8eba-aac1-a326dd93fed2',N'BLOQUEADO',NULL,NULL,N'4201',N'VCG',NULL,NULL,N'MECANICA PASTILHS E DISCO DE FREIO',NULL,CONVERT(date,'20260628',112)),
(CONVERT(date,'20261004',112),N'G38',N'45d9e4e6-4271-0e23-fe6e-8fb49aa69a2f',N'BLOQUEADO',NULL,NULL,N'4190',N'VCG',NULL,NULL,N'VIDRO BOLHA',NULL,CONVERT(date,'20260820',112)),
(CONVERT(date,'20261004',112),N'G39',N'3fc0d013-d349-6410-5bc0-86f637757492',N'BLOQUEADO',NULL,NULL,N'4196',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260827',112)),
(CONVERT(date,'20261004',112),N'G40',N'1a984871-f166-8d93-a1b5-26312145a5ae',N'BLOQUEADO',NULL,NULL,N'4255',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260824',112)),
(CONVERT(date,'20261004',112),N'G41',N'2a2f3213-2557-3627-fb7c-fd0584823a74',N'BLOQUEADO',NULL,NULL,N'4211',N'VCG',NULL,NULL,N'PANE ELETRICA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261004',112),N'G42',N'fda6cd1b-64bc-60ba-320c-6d2273a27f52',N'BLOQUEADO',NULL,NULL,N'4225',N'VCG',NULL,NULL,N'PANE ELETRICA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261004',112),N'G43',N'c54ff18c-c930-de8e-3bb6-52c7ed5e402d',N'BLOQUEADO',NULL,NULL,N'4234',N'VCG',NULL,NULL,N'TACOGRAFO',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261004',112),N'G44',N'8fcb7421-ca8f-f44d-3bbf-3ff50670ee13',N'BLOQUEADO',NULL,NULL,N'4248',N'VCG',NULL,NULL,N'AR E EMBREAGEM',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261004',112),N'G45',N'a78982b6-3d94-4f8e-8b83-c4b683ea1cbe',N'BLOQUEADO',NULL,NULL,N'4257',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260921',112)),
(CONVERT(date,'20261004',112),N'G46',N'7c6a0f95-e8fa-2345-23c1-04e4eb7a592d',N'BLOQUEADO',NULL,NULL,N'4274',N'VCG',NULL,NULL,N'ISPEÇAO A PEDIDO DA GERENCIA',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261004',112),N'G47',N'a35d658f-24c5-da9d-d45a-99032758c461',N'BLOQUEADO',NULL,NULL,N'4194',N'VCG',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261004',112),N'G48',N'427acd16-f588-ff9b-4dc1-56f8960aa393',N'BLOQUEADO',NULL,NULL,N'4272',N'VCG',NULL,NULL,N'ELETRICA FAROL',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261004',112),N'G49',N'9aeffd0a-886e-02cb-4117-6bd8f9598643',N'BLOQUEADO',NULL,NULL,N'4182',N'VCG',NULL,NULL,N'PINTURA',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261004',112),N'G50',N'cb5b9f0d-77a9-3f80-6ca7-e5f3d354c95d',N'BLOQUEADO',NULL,NULL,N'4212',N'VCG',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20260927',112)),
(CONVERT(date,'20261004',112),N'G51',N'5ff85a5b-91db-d51e-d137-d6e44bafdf23',N'BLOQUEADO',NULL,NULL,N'4275',N'VCG',NULL,NULL,N'EMBREAGEM',NULL,CONVERT(date,'20260928',112)),
(CONVERT(date,'20261004',112),N'A54',N'6ec577ae-c3bf-4929-d01e-191f5173374f',N'BLOQUEADO',NULL,NULL,N'3005',N'JTU',NULL,NULL,N'SUSPENSÃO ',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261004',112),N'A55',N'a38e1f7d-2ebf-4c5a-42dd-3e7a294fcbef',N'BLOQUEADO',NULL,NULL,N'3133',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260901',112)),
(CONVERT(date,'20261004',112),N'A56',N'5ae464b5-c5d1-2313-7542-6be5601755c6',N'BLOQUEADO',NULL,NULL,N'3006',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240630',112)),
(CONVERT(date,'20261004',112),N'A57',N'c9c4a333-3417-6c50-5425-1a7486f806cc',N'BLOQUEADO',NULL,NULL,N'3252',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261004',112),N'A58',N'e4040497-de73-18c9-65ec-bafc8db2ed28',N'BLOQUEADO',NULL,NULL,N'3263',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20260929',112)),
(CONVERT(date,'20261004',112),N'A59',N'00ef90a9-13fa-7c2e-ba8c-e82fb5da33ee',N'BLOQUEADO',NULL,NULL,N'3279',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261004',112),N'A60',N'ec4b17b2-1bdf-6fb4-4237-162f67565824',N'BLOQUEADO',NULL,NULL,N'3257',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261004',112),N'A61',N'ed8ea0f7-7d56-5419-582d-5a4e6ed1381c',N'BLOQUEADO',NULL,NULL,N'3106',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260624',112)),
(CONVERT(date,'20261004',112),N'A62',N'0529c3ee-e11a-97ce-9613-b70cdd0b8b3e',N'BLOQUEADO',NULL,NULL,N'3099',N'JTU',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261004',112),N'A63',N'87358aaf-030c-68bb-b7ff-6be72a38b65c',N'BLOQUEADO',NULL,NULL,N'3208',N'JTU',NULL,NULL,N'FREIO',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261004',112),N'A64',N'b43f2a95-796e-2b61-70d6-a586b81f7fe2',N'BLOQUEADO',NULL,NULL,N'3267',N'JTU',NULL,NULL,N'EMBREAGEM',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261004',112),N'G54',N'9d3b13aa-9fdd-f670-926a-d2a3c388bbfe',N'BLOQUEADO',NULL,NULL,N'1119',N'VCM',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20201218',112)),
(CONVERT(date,'20261004',112),N'G55',N'953a4f07-58ff-2771-e0e1-ace107135ac3',N'BLOQUEADO',NULL,NULL,N'3083',N'VCM',NULL,NULL,N'FORA DE OPERAÇÂO',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261004',112),N'G56',N'27439ce0-8aa9-95af-c83e-7418f87acefc',N'BLOQUEADO',NULL,NULL,N'1323',N'VCM',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20241207',112)),
(CONVERT(date,'20261004',112),N'G57',N'60987108-fbb0-cbcd-c2ff-af142f173a25',N'BLOQUEADO',NULL,NULL,N'1322',N'VCM',NULL,NULL,N'REVISÂO GERAL',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261005',112),N'D6',N'4ea2cbdd-ff20-0565-f08a-1936deed3816',N'PREVENTIVA',NULL,NULL,N'4224',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'D7',N'065095f6-64f6-5e96-46c0-cb59288d25b9',N'PREVENTIVA',NULL,NULL,N'4217',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'D8',N'decf56f2-47bf-fe7a-8d3e-da15c55340ad',N'PREVENTIVA',NULL,NULL,N'4213',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'G6',N'9a9d89cc-1335-70c3-a0b2-195f98af3c34',N'PREVENTIVA',NULL,NULL,N'4192',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'G7',N'f15ba98a-be5c-88c0-be71-6aa5dd3af365',N'PREVENTIVA',NULL,NULL,N'4018',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'G8',N'4dc688b4-ec9d-3041-1c29-a67143a83c4e',N'PREVENTIVA',NULL,NULL,N'4191',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'A12',N'926748e9-18f2-e374-3bac-8d0d484d0b13',N'OFICINA',NULL,NULL,N'2704',NULL,N'Mecânica',NULL,N'BOMBA ARLA',NULL,NULL),
(CONVERT(date,'20261005',112),N'A13',N'5be4f940-6188-7c19-6f54-458f4665633c',N'OFICINA',NULL,NULL,N'3222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261005',112),N'A14',N'575901b8-f439-8284-ee99-6f4ffc4a54e8',N'OFICINA',NULL,NULL,N'4244',NULL,N'Mecânica',NULL,N'M DE EIXO',NULL,NULL),
(CONVERT(date,'20261005',112),N'A15',N'086f35b3-e747-e276-8c7a-179154937361',N'OFICINA',NULL,NULL,N'4222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261005',112),N'A16',N'27145d73-21e8-1d05-f6ce-6b95feb3b8ea',N'OFICINA',NULL,NULL,N'4197',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261005',112),N'A17',N'dbc4b999-8dcd-017a-5d2f-2bd741b27e30',N'OFICINA',NULL,NULL,N'4225',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261005',112),N'A18',N'0bba33d8-5340-e482-2133-551e59b95288',N'OFICINA',NULL,NULL,N'2425',NULL,N'Mecânica',NULL,N'VAZ OLEO',NULL,NULL),
(CONVERT(date,'20261005',112),N'A19',N'34e78892-0a70-676d-d49b-0dc57904710e',N'OFICINA',NULL,NULL,N'2320',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261005',112),N'A20',N'590a5e2b-56dc-6d90-32e4-d11863c7a8b9',N'OFICINA',NULL,NULL,N'4224',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261005',112),N'C12',N'a0e4931c-1abd-ebde-5b39-c7762e51376c',N'OFICINA',NULL,NULL,N'3263',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'C13',N'686e85b6-41e0-3b7e-3972-2cf7b3412766',N'OFICINA',NULL,NULL,N'2514',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'C14',N'3f5f7b69-0f03-c446-dae5-a2683a1b0226',N'OFICINA',NULL,NULL,N'3139',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'C15',N'5237abb8-f3f0-cb19-cb50-70a6cc5243a4',N'OFICINA',NULL,NULL,N'4196',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'C16',N'481779bb-2a60-7734-929c-5710f2a96058',N'OFICINA',NULL,NULL,N'4222',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'C17',N'2f0791f3-c05e-4079-4125-0c590b70cf47',N'OFICINA',NULL,NULL,N'2426',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'C18',N'b96f80f7-c49f-5534-9fab-c5c12d3cff52',N'OFICINA',NULL,NULL,N'4209',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'C19',N'c4a1be36-70a2-9dad-e40b-95f01885cbb1',N'OFICINA',NULL,NULL,N'3271',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'C20',N'1f7e9875-6142-2270-0af0-b64c31706d22',N'OFICINA',NULL,NULL,N'4193',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'D12',N'e3fccc6d-c922-3043-545e-0b005932d59b',N'OFICINA',NULL,NULL,N'3100',NULL,N'Elétrica',NULL,N'MODULO',NULL,NULL),
(CONVERT(date,'20261005',112),N'D13',N'3c8aa894-132c-731d-ce9c-769e9ec1d6d6',N'OFICINA',NULL,NULL,N'2623',NULL,N'Elétrica',NULL,N'LIMPADOR',NULL,NULL),
(CONVERT(date,'20261005',112),N'D14',N'8b05a8aa-4f19-825b-5115-d7d803d84b76',N'OFICINA',NULL,NULL,N'4189',NULL,N'Elétrica',NULL,N'LIMPADOR',NULL,NULL),
(CONVERT(date,'20261005',112),N'F13',N'18aac7e6-0d51-9c54-79b8-b644fce34bbe',N'OFICINA',NULL,NULL,N'3035',NULL,N'Borracharia',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'F14',N'f76577e0-9264-654c-9653-c3535f194dd8',N'OFICINA',NULL,NULL,N'3206',NULL,N'Borracharia',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'G12',N'e45a6b51-2c7b-3c44-2330-1677e2aa3fb9',N'OFICINA',NULL,NULL,N'3147',NULL,N'Funilaria / Pintura',NULL,N'BANCO',NULL,NULL),
(CONVERT(date,'20261005',112),N'G14',N'f1893aff-8b88-4b71-2e9e-0a8aa51f47f4',N'OFICINA',NULL,NULL,N'4227',NULL,N'Funilaria / Pintura',NULL,N'PARACHOQUE',NULL,NULL),
(CONVERT(date,'20261005',112),N'I13',N'8697cef5-4e18-ae75-a40d-5fe50c5abb4b',N'OFICINA',NULL,NULL,N'3004',NULL,N'Tacógrafo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'I14',N'a0f08307-93f6-5582-68ed-5d152a8f49e9',N'OFICINA',NULL,NULL,N'3206',NULL,N'Tacógrafo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'I15',N'627055e4-b31d-8fd6-46ef-0a258c3c8cb4',N'OFICINA',NULL,NULL,N'4261',NULL,N'Tacógrafo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'I16',N'dd0e9e0d-f4b0-fca6-a46d-7482a30c8904',N'OFICINA',NULL,NULL,N'4234',NULL,N'Tacógrafo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'I17',N'd2a1107f-4e16-d403-424a-32642c7cf411',N'OFICINA',NULL,NULL,N'4188',NULL,N'Tacógrafo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'J12',N'8161c789-da69-e315-1b35-f5324585f4b6',N'OFICINA',NULL,NULL,N'23',NULL,N'Bilhetagem',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'C23',N'fed3ee4b-1720-e729-1e14-821a21f2d49e',N'REFORCO',N'FIXO',1,N'4224',NULL,NULL,N'07:15 - A',N'LUBRIFICAÇÃO',NULL,NULL),
(CONVERT(date,'20261005',112),N'H23',N'cca9415c-c15c-e088-18f3-09f761c67e8e',N'REFORCO',N'FIXO',7,N'4213',NULL,NULL,N'07:40 - C',N'TROCA DE ÓLEO',NULL,NULL),
(CONVERT(date,'20261005',112),N'C24',N'dd9f3e1e-5069-676e-fa92-b31f78cbc377',N'REFORCO',N'FIXO',2,N'4217',NULL,NULL,N'07:15 - A',N'LUBRIFICAÇÃO',NULL,NULL),
(CONVERT(date,'20261005',112),N'H24',N'c1c50fb0-e721-acb8-2936-a34b6a5ad46b',N'REFORCO',N'FIXO',8,N'4192',NULL,NULL,N'07:45 - C',N'TROCA DE ÓLEO',NULL,NULL),
(CONVERT(date,'20261005',112),N'C25',N'246d4d64-173f-5be1-6125-6b976200d411',N'REFORCO',N'FIXO',3,N'4191',NULL,NULL,N'07:32 - A',N'LUBRIFICAÇÃO',NULL,NULL),
(CONVERT(date,'20261005',112),N'H25',N'0e5c7c08-efd4-2e24-886a-d8de5cc84a18',N'REFORCO',N'FIXO',9,N'4018',NULL,NULL,N'07:45 - A',N'TROCA DE ÓLEO',NULL,NULL),
(CONVERT(date,'20261005',112),N'C26',N'23f2d77a-eda7-eb47-a171-0c582c5f16a4',N'REFORCO',N'FIXO',4,N'3277',NULL,NULL,N'07:40 - A',N'INSPEÇÂO',N'URGENT',NULL),
(CONVERT(date,'20261005',112),N'H26',N'd37502a0-2265-225f-da2e-716c7b93f693',N'REFORCO',N'FIXO',10,N'3902',NULL,NULL,N'07:50 - C',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261005',112),N'C27',N'b6f464ba-7c46-fd5c-9288-c89215b16574',N'REFORCO',N'FIXO',5,N'4267',NULL,NULL,N'07:40 - M',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261005',112),N'H27',N'fb0df78e-4301-3ee7-e022-264cf6baa8b1',N'REFORCO',N'FIXO',11,N'3904',NULL,NULL,N'07:50 - C',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261005',112),N'J23',N'52838355-edf5-fbdf-37a3-03d7047ea8fd',N'REFORCO',N'EXTRA',1,N'3902',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'J24',N'2c478ff2-f355-f83b-c1b6-41dc7b8582d6',N'REFORCO',N'EXTRA',2,N'3904',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'J25',N'd11165e7-357f-dda3-4276-b6fb239ff96b',N'REFORCO',N'EXTRA',3,N'3277',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'J26',N'2e9289d6-9115-c5fa-1839-b9a21d272e20',N'REFORCO',N'EXTRA',4,N'4267',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261005',112),N'A35',N'83698b90-9711-d7d8-3aaa-aeb1e7a9eb4b',N'BLOQUEADO',NULL,NULL,N'2424',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260603',112)),
(CONVERT(date,'20261005',112),N'A36',N'64a533b0-927b-524f-fe6e-04eded29a0ce',N'BLOQUEADO',NULL,NULL,N'2600',N'VSF',NULL,NULL,N'ELÉTRICA',NULL,CONVERT(date,'20260106',112)),
(CONVERT(date,'20261005',112),N'A37',N'11eeaba8-07bd-7311-c240-1c9f316db313',N'BLOQUEADO',NULL,NULL,N'2800',N'VSF',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20260103',112)),
(CONVERT(date,'20261005',112),N'A38',N'904bbd2c-33c1-497c-202c-c6b96417ab64',N'BLOQUEADO',NULL,NULL,N'2611',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260825',112)),
(CONVERT(date,'20261005',112),N'G35',N'ca53541b-4083-3e68-735f-384940c94ba9',N'BLOQUEADO',NULL,NULL,N'4199',N'VCG',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240503',112)),
(CONVERT(date,'20261005',112),N'G36',N'6846abea-81ca-892e-8df6-4527e812a66f',N'BLOQUEADO',NULL,NULL,N'4200',N'VCG',NULL,NULL,N'TRANSMISSÃO',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261005',112),N'G37',N'806ac30d-3fa8-e703-4a3d-7cb72e648cfd',N'BLOQUEADO',NULL,NULL,N'4201',N'VCG',NULL,NULL,N'MECANICA PASTILHS E DISCO DE FREIO',NULL,CONVERT(date,'20260628',112)),
(CONVERT(date,'20261005',112),N'G38',N'3128eda8-f773-d7d5-7ffe-e10dfb43256e',N'BLOQUEADO',NULL,NULL,N'4190',N'VCG',NULL,NULL,N'VIDRO BOLHA',NULL,CONVERT(date,'20260820',112)),
(CONVERT(date,'20261005',112),N'G39',N'6794820c-3770-f454-1e88-37afa2f47dc0',N'BLOQUEADO',NULL,NULL,N'4255',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260824',112)),
(CONVERT(date,'20261005',112),N'G40',N'74ead00e-b036-b17c-96c6-2c3c2696c608',N'BLOQUEADO',NULL,NULL,N'4211',N'VCG',NULL,NULL,N'PANE ELETRICA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261005',112),N'G41',N'61719672-f189-4482-8a4c-817120634406',N'BLOQUEADO',NULL,NULL,N'4225',N'VCG',NULL,NULL,N'PANE ELETRICA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261005',112),N'G42',N'e1ec8682-633f-bf85-80e3-ff19ce0b758f',N'BLOQUEADO',NULL,NULL,N'4223',N'VCG',NULL,NULL,N'MOLEJO',NULL,CONVERT(date,'20261004',112)),
(CONVERT(date,'20261005',112),N'G43',N'7e765a79-3fa2-4ada-0458-011dc7291458',N'BLOQUEADO',NULL,NULL,N'4248',N'VCG',NULL,NULL,N'AR E EMBREAGEM',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261005',112),N'G44',N'6c144f03-aa6d-3262-2662-8fa894e72444',N'BLOQUEADO',NULL,NULL,N'4257',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260921',112)),
(CONVERT(date,'20261005',112),N'G45',N'f874e25a-c4cb-ccb6-ca60-d705eb1156bd',N'BLOQUEADO',NULL,NULL,N'4194',N'VCG',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261005',112),N'G46',N'a8a99383-746e-1a83-2b61-30e5312a2db6',N'BLOQUEADO',NULL,NULL,N'4212',N'VCG',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20260927',112)),
(CONVERT(date,'20261005',112),N'A49',N'53e4efe1-8ace-2423-b667-1b15ca49b8e0',N'BLOQUEADO',NULL,NULL,N'3005',N'JTU',NULL,NULL,N'SUSPENSÃO ',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261005',112),N'A50',N'7fd7f612-8b33-5ecb-8539-f1aeea5cd80e',N'BLOQUEADO',NULL,NULL,N'3133',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260901',112)),
(CONVERT(date,'20261005',112),N'A51',N'6c50bd2d-ff1f-0844-2b13-829659997527',N'BLOQUEADO',NULL,NULL,N'3006',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240630',112)),
(CONVERT(date,'20261005',112),N'A52',N'01540579-cc40-3835-3bd7-6143ae70424f',N'BLOQUEADO',NULL,NULL,N'3252',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261005',112),N'A53',N'cb9d36d8-a5da-abf2-26cc-4263ac64504b',N'BLOQUEADO',NULL,NULL,N'3263',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20260929',112)),
(CONVERT(date,'20261005',112),N'A54',N'daa3fc4b-6943-d59f-dee5-073a88ac6194',N'BLOQUEADO',NULL,NULL,N'3279',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261005',112),N'A55',N'35eaecca-cdce-0663-e331-8da0f6825bc1',N'BLOQUEADO',NULL,NULL,N'3257',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261005',112),N'A56',N'180b6da0-b50c-6737-2178-1d7407773b20',N'BLOQUEADO',NULL,NULL,N'3106',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260624',112)),
(CONVERT(date,'20261005',112),N'A57',N'ef200152-7e28-7667-5bbf-ae758a5e7aec',N'BLOQUEADO',NULL,NULL,N'3099',N'JTU',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261005',112),N'A58',N'96b48b6f-4d3c-8d00-9c82-75942b35d9a4',N'BLOQUEADO',NULL,NULL,N'3900',N'JTU',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20261004',112)),
(CONVERT(date,'20261005',112),N'A59',N'0e6695ce-2736-2bda-ad01-4fa7b5a5f0ce',N'BLOQUEADO',NULL,NULL,N'3267',N'JTU',NULL,NULL,N'EMBREAGEM',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261005',112),N'G49',N'34972e80-6205-c331-0fc6-3a9ab2ec8a8e',N'BLOQUEADO',NULL,NULL,N'1119',N'VCM',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20201218',112)),
(CONVERT(date,'20261005',112),N'G50',N'42c00bfb-96d1-2939-e7cc-1b97237d73c6',N'BLOQUEADO',NULL,NULL,N'3083',N'VCM',NULL,NULL,N'FORA DE OPERAÇÂO',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261005',112),N'G51',N'f5e5eca6-1607-03d0-8a4c-dec3cb31a85b',N'BLOQUEADO',NULL,NULL,N'1323',N'VCM',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20241207',112)),
(CONVERT(date,'20261005',112),N'G52',N'ae617115-e4ec-4a3b-a09a-e133d3a25e86',N'BLOQUEADO',NULL,NULL,N'1322',N'VCM',NULL,NULL,N'REVISÂO GERAL',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261006',112),N'D6',N'22c8c1d7-e5a3-69a5-999a-4e555952e444',N'PREVENTIVA',NULL,NULL,N'4224',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'D7',N'1389252d-7d81-6321-8c44-2d07f3a655e2',N'PREVENTIVA',NULL,NULL,N'4217',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'G6',N'089f9e41-9657-0c00-15e7-f24068849576',N'PREVENTIVA',NULL,NULL,N'4192',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'G7',N'd570fd09-3b29-92df-a98c-d7e9c40fb284',N'PREVENTIVA',NULL,NULL,N'4233',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'G8',N'74a965ce-51d2-310a-afd5-c946bafbb609',N'PREVENTIVA',NULL,NULL,N'4191',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'A12',N'756bb45c-1781-ec40-7259-380040628b85',N'OFICINA',NULL,NULL,N'2704',NULL,N'Mecânica',NULL,N'BOMBA ARLA',NULL,NULL),
(CONVERT(date,'20261006',112),N'A13',N'dd678e77-6390-bcef-0b9d-f2397087a993',N'OFICINA',NULL,NULL,N'3222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261006',112),N'A14',N'9be042ed-7ec2-dab0-f654-eb49d62c730a',N'OFICINA',NULL,NULL,N'4244',NULL,N'Mecânica',NULL,N'M DE EIXO',NULL,NULL),
(CONVERT(date,'20261006',112),N'A15',N'7a710e31-7018-43cf-0f8c-65e24c79a56c',N'OFICINA',NULL,NULL,N'4222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261006',112),N'A16',N'dfec93b2-ed29-da26-7a5c-9a5e305791b6',N'OFICINA',NULL,NULL,N'4197',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261006',112),N'A17',N'2d837b9a-da9d-8032-f0bd-742338077829',N'OFICINA',NULL,NULL,N'4225',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261006',112),N'A18',N'78dd56c9-d6d7-55c4-18c5-31909181cbbe',N'OFICINA',NULL,NULL,N'2425',NULL,N'Mecânica',NULL,N'VAZ OLEO',NULL,NULL),
(CONVERT(date,'20261006',112),N'A19',N'b6d357cd-8d4a-b7d7-00fd-f4884964c114',N'OFICINA',NULL,NULL,N'2320',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261006',112),N'A20',N'f3c22edb-5fb2-ac88-23ff-0e393bfc7835',N'OFICINA',NULL,NULL,N'4224',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261006',112),N'C12',N'd18c57ee-e2e8-947a-eb6f-14287eacddb4',N'OFICINA',NULL,NULL,N'3951',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'C13',N'6397bad8-aa19-657c-76ce-3e21eb60cfba',N'OFICINA',NULL,NULL,N'2514',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'C14',N'383a0cc8-80f0-f97f-61a2-fabaa4904e55',N'OFICINA',NULL,NULL,N'3139',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'C15',N'e2508664-2036-cdf8-d16c-c2ed9ec2b625',N'OFICINA',NULL,NULL,N'4196',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'C16',N'7a698ef3-3000-0d12-0d78-1ed77694a865',N'OFICINA',NULL,NULL,N'4222',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'C17',N'56e63dab-646f-fe0d-ca41-7fc68a18b8a6',N'OFICINA',NULL,NULL,N'2426',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'C18',N'f18cd36f-082c-1c35-5bbd-a25b6501ca74',N'OFICINA',NULL,NULL,N'4209',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'C19',N'bf3e11fe-c2cc-b6a4-e30f-9a3008ff8b53',N'OFICINA',NULL,NULL,N'3271',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'C20',N'0bf4b234-eea8-7346-89dd-25e7ba844377',N'OFICINA',NULL,NULL,N'4193',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'D12',N'7be0db71-a763-e9ae-508c-e3de69ecb4f4',N'OFICINA',NULL,NULL,N'3100',NULL,N'Elétrica',NULL,N'MODULO',NULL,NULL),
(CONVERT(date,'20261006',112),N'D13',N'c65ce75d-65af-efd1-0708-d93839121726',N'OFICINA',NULL,NULL,N'2623',NULL,N'Elétrica',NULL,N'LIMPADOR',NULL,NULL),
(CONVERT(date,'20261006',112),N'D14',N'42e20295-375e-f45d-5480-40e6a37634e9',N'OFICINA',NULL,NULL,N'4189',NULL,N'Elétrica',NULL,N'LIMPADOR',NULL,NULL),
(CONVERT(date,'20261006',112),N'G12',N'58cbbd4a-3d62-3d7d-efb9-fb6252b7bdd7',N'OFICINA',NULL,NULL,N'3147',NULL,N'Funilaria / Pintura',NULL,N'BANCO',NULL,NULL),
(CONVERT(date,'20261006',112),N'G14',N'e119fb2b-dde3-a353-f02a-0b49de2e1518',N'OFICINA',NULL,NULL,N'4227',NULL,N'Funilaria / Pintura',NULL,N'PARACHOQUE',NULL,NULL),
(CONVERT(date,'20261006',112),N'I14',N'e6fdb5c7-a747-cd28-44f9-0174b934daec',N'OFICINA',NULL,NULL,N'3206',NULL,N'Tacógrafo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'I15',N'1983d054-f74f-de25-80cb-ee7570ff4226',N'OFICINA',NULL,NULL,N'4261',NULL,N'Tacógrafo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'J12',N'2cf1a139-7957-a639-7b1e-284f1cc366f3',N'OFICINA',NULL,NULL,N'23',NULL,N'Bilhetagem',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'C23',N'894466e8-3fc2-202e-cc28-401eb4362ca7',N'REFORCO',N'FIXO',1,N'4224',NULL,NULL,N'07:15 - A',N'LUBRIFICAÇÃO',NULL,NULL),
(CONVERT(date,'20261006',112),N'H23',N'72ec8340-7c31-ce68-e29e-38fd1971727d',N'REFORCO',N'FIXO',7,N'4213',NULL,NULL,N'07:40 - C',N'TROCA DE ÓLEO',NULL,NULL),
(CONVERT(date,'20261006',112),N'C24',N'a9970958-ba6c-f1fb-e471-0f3d7798971a',N'REFORCO',N'FIXO',2,N'4217',NULL,NULL,N'07:15 - A',N'LUBRIFICAÇÃO',NULL,NULL),
(CONVERT(date,'20261006',112),N'H24',N'84e91761-bf9f-13a4-a472-59225475aa6a',N'REFORCO',N'FIXO',8,N'4192',NULL,NULL,N'07:45 - C',N'TROCA DE ÓLEO',NULL,NULL),
(CONVERT(date,'20261006',112),N'C25',N'c05327da-0f76-634f-eaf7-a4fd3cdaa90b',N'REFORCO',N'FIXO',3,N'4191',NULL,NULL,N'07:32 - A',N'LUBRIFICAÇÃO',NULL,NULL),
(CONVERT(date,'20261006',112),N'H25',N'ca8b8fd9-406b-9d65-990a-6a2c8cb32a8c',N'REFORCO',N'FIXO',9,N'4018',NULL,NULL,N'07:45 - A',N'TROCA DE ÓLEO',NULL,NULL),
(CONVERT(date,'20261006',112),N'C26',N'57ec0ed2-76b5-9c09-f854-ed52a78b91e2',N'REFORCO',N'FIXO',4,N'3271',NULL,NULL,N'07:40 - A',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261006',112),N'H26',N'52895b3b-5827-7caf-5774-82b8a80f9a21',N'REFORCO',N'FIXO',10,N'3902',NULL,NULL,N'07:50 - C',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261006',112),N'C27',N'ae1d5775-a520-be85-31b5-f7e69476e467',N'REFORCO',N'FIXO',5,N'4267',NULL,NULL,N'07:40 - M',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261006',112),N'H27',N'7022802d-7221-1ec4-7ca4-96d686eac704',N'REFORCO',N'FIXO',11,N'4253',NULL,NULL,N'07:50 - C',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261006',112),N'H28',N'f7246dd7-a291-3ca3-665a-d47ff39a481f',N'REFORCO',N'FIXO',12,N'4267',NULL,NULL,N'07:50 - A',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261006',112),N'J23',N'f50934bc-15b6-0264-464c-04b614750567',N'REFORCO',N'EXTRA',1,N'3902',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'J25',N'21adc5c6-b737-67f6-9ac8-f922b2daa847',N'REFORCO',N'EXTRA',3,N'4253',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'J26',N'56eb0bbf-d039-90c5-b4d2-2c6b29662e47',N'REFORCO',N'EXTRA',4,N'4267',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'J27',N'8dd41932-0199-d0ac-854e-2539cc4f1228',N'REFORCO',N'EXTRA',5,N'3271',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261006',112),N'A35',N'f41c66f5-cf1f-a723-c822-389f2b9c5c0f',N'BLOQUEADO',NULL,NULL,N'2424',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260603',112)),
(CONVERT(date,'20261006',112),N'A36',N'038147ac-c415-2ec8-6e08-40eba726a170',N'BLOQUEADO',NULL,NULL,N'2600',N'VSF',NULL,NULL,N'ELÉTRICA',NULL,CONVERT(date,'20260106',112)),
(CONVERT(date,'20261006',112),N'A37',N'1d55004c-1636-7739-f941-691942ed8528',N'BLOQUEADO',NULL,NULL,N'2800',N'VSF',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20260103',112)),
(CONVERT(date,'20261006',112),N'A38',N'6c346d45-56f7-990c-3337-fecd1499f9e7',N'BLOQUEADO',NULL,NULL,N'2611',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260825',112)),
(CONVERT(date,'20261006',112),N'G35',N'3272991f-5be5-c552-590e-e7cb0967e3d6',N'BLOQUEADO',NULL,NULL,N'4199',N'VCG',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240503',112)),
(CONVERT(date,'20261006',112),N'G36',N'7c4249e0-2135-3297-8f33-39eb0c4da124',N'BLOQUEADO',NULL,NULL,N'4200',N'VCG',NULL,NULL,N'TRANSMISSÃO',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261006',112),N'G37',N'9f38604e-c4bf-9696-5e11-95afdee0b342',N'BLOQUEADO',NULL,NULL,N'4201',N'VCG',NULL,NULL,N'MECANICA PASTILHS E DISCO DE FREIO',NULL,CONVERT(date,'20260628',112)),
(CONVERT(date,'20261006',112),N'G38',N'b4a8c278-8ea2-1cff-dd1e-30349fbf52b7',N'BLOQUEADO',NULL,NULL,N'4190',N'VCG',NULL,NULL,N'VIDRO BOLHA',NULL,CONVERT(date,'20260820',112)),
(CONVERT(date,'20261006',112),N'G39',N'3e88a47d-88d2-41bb-694a-2a5e404e5270',N'BLOQUEADO',NULL,NULL,N'4255',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260824',112)),
(CONVERT(date,'20261006',112),N'G40',N'fe06677f-54af-40ae-3b05-329eeafbe8d1',N'BLOQUEADO',NULL,NULL,N'4211',N'VCG',NULL,NULL,N'PANE ELETRICA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261006',112),N'G41',N'dcb23ff5-0ff4-1026-f5b4-90417b40fb77',N'BLOQUEADO',NULL,NULL,N'4225',N'VCG',NULL,NULL,N'PANE ELETRICA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261006',112),N'G42',N'cc4ca620-cd77-a038-2ab9-9673079795ec',N'BLOQUEADO',NULL,NULL,N'4223',N'VCG',NULL,NULL,N'MOLEJO',NULL,CONVERT(date,'20261004',112)),
(CONVERT(date,'20261006',112),N'G43',N'6fd962b0-84d6-dbfd-62bb-089dbe9a2a7f',N'BLOQUEADO',NULL,NULL,N'4248',N'VCG',NULL,NULL,N'AR E EMBREAGEM',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261006',112),N'G44',N'fd6e7d2b-d70e-8e21-210f-7edf15487f73',N'BLOQUEADO',NULL,NULL,N'4215',N'VCG',NULL,NULL,N'VALVULAS FALTA DE PEÇAS',NULL,CONVERT(date,'20261005',112)),
(CONVERT(date,'20261006',112),N'G45',N'ffa66a2f-580f-d5f2-d024-187661cb5d2a',N'BLOQUEADO',NULL,NULL,N'4257',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260921',112)),
(CONVERT(date,'20261006',112),N'G46',N'7f0059e5-e96f-74f4-43a1-23df838cd68c',N'BLOQUEADO',NULL,NULL,N'4194',N'VCG',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261006',112),N'G47',N'84aac564-7704-249a-685c-be122fd8bb38',N'BLOQUEADO',NULL,NULL,N'4212',N'VCG',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20260927',112)),
(CONVERT(date,'20261006',112),N'A50',N'26ca9abb-bb65-2a3d-5abd-d38611dc9673',N'BLOQUEADO',NULL,NULL,N'3005',N'JTU',NULL,NULL,N'SUSPENSÃO ',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261006',112),N'A51',N'e4c7402f-7405-d0fa-c495-f83471839300',N'BLOQUEADO',NULL,NULL,N'3133',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260901',112)),
(CONVERT(date,'20261006',112),N'A52',N'8a5e9c4b-c4cf-34cb-8215-0405a0cfbece',N'BLOQUEADO',NULL,NULL,N'3006',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240630',112)),
(CONVERT(date,'20261006',112),N'A53',N'5c3d3411-9dcc-2682-ac41-1f8ebc040054',N'BLOQUEADO',NULL,NULL,N'3252',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261006',112),N'A54',N'55a605ae-c269-51b2-99f9-e4ac7aa3a11d',N'BLOQUEADO',NULL,NULL,N'3263',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20260929',112)),
(CONVERT(date,'20261006',112),N'A55',N'd3d5780d-2e58-303c-f4eb-2912967792b9',N'BLOQUEADO',NULL,NULL,N'3106',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260624',112)),
(CONVERT(date,'20261006',112),N'A56',N'160eaabc-09dc-9732-4495-f1fbf39aa757',N'BLOQUEADO',NULL,NULL,N'3228',N'JTU',NULL,NULL,N'EMBREAGEM',NULL,CONVERT(date,'20261005',112)),
(CONVERT(date,'20261006',112),N'A57',N'b036e627-ada7-50eb-baff-5adf49bb9f06',N'BLOQUEADO',NULL,NULL,N'3904',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20261005',112)),
(CONVERT(date,'20261006',112),N'A58',N'5fc0f62c-f0e9-6dc2-c989-4dcaf71e9eb4',N'BLOQUEADO',NULL,NULL,N'3099',N'JTU',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261006',112),N'A59',N'd6df2f35-44bb-0cda-7769-02533e432e11',N'BLOQUEADO',NULL,NULL,N'3900',N'JTU',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20261004',112)),
(CONVERT(date,'20261006',112),N'A60',N'6fd51834-0408-c98f-cc7f-3c29379f689a',N'BLOQUEADO',NULL,NULL,N'3267',N'JTU',NULL,NULL,N'EMBREAGEM',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261006',112),N'G50',N'2982736c-684f-19e2-143b-22fe9778bae1',N'BLOQUEADO',NULL,NULL,N'1119',N'VCM',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20201218',112)),
(CONVERT(date,'20261006',112),N'G51',N'c5d4eae3-fac3-2f91-e908-1ed348b45f15',N'BLOQUEADO',NULL,NULL,N'3083',N'VCM',NULL,NULL,N'FORA DE OPERAÇÂO',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261006',112),N'G52',N'5339df2d-b14a-5a81-d9c9-ebc35c5b5bf9',N'BLOQUEADO',NULL,NULL,N'1323',N'VCM',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20241207',112)),
(CONVERT(date,'20261006',112),N'G53',N'daaeee4c-06dc-551b-dbbb-c1da0197df8d',N'BLOQUEADO',NULL,NULL,N'1322',N'VCM',NULL,NULL,N'REVISÂO GERAL',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261007',112),N'D6',N'7845dabf-729f-e5c6-9dc3-e390fd37c7fb',N'PREVENTIVA',NULL,NULL,N'4243',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'D7',N'39eb181e-4d24-ca31-56c0-16bda7897394',N'PREVENTIVA',NULL,NULL,N'4258',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'D8',N'd3c9eda2-4f4d-fe62-a0a6-e01b92e7d3ff',N'PREVENTIVA',NULL,NULL,N'3022',NULL,N'Lubrificação',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'G6',N'5a16003e-a74b-d25d-9230-3ce99ec3827a',N'PREVENTIVA',NULL,NULL,N'3204',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'H6',N'5bf3f309-9ba5-6327-91fd-86599f7cc92a',N'PREVENTIVA',NULL,NULL,N'3253',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'G7',N'550c721b-7a20-6807-cefd-e557dfa56eb9',N'PREVENTIVA',NULL,NULL,N'3220',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'G8',N'585ab324-1ce3-06ab-c6d9-c391b6046582',N'PREVENTIVA',NULL,NULL,N'3226',NULL,N'Troca de óleo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'A12',N'b43a23a1-a4cf-637e-51a6-511ecf6216d9',N'OFICINA',NULL,NULL,N'2704',NULL,N'Mecânica',NULL,N'BOMBA ARLA',NULL,NULL),
(CONVERT(date,'20261007',112),N'A13',N'63da96fe-eb1c-4d17-00df-13cf885e6002',N'OFICINA',NULL,NULL,N'3222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261007',112),N'A14',N'27e8770e-4935-c718-78f6-490c43fb888d',N'OFICINA',NULL,NULL,N'4244',NULL,N'Mecânica',NULL,N'M DE EIXO',NULL,NULL),
(CONVERT(date,'20261007',112),N'A15',N'0b54e3a0-5568-e8ed-de15-9b0966047171',N'OFICINA',NULL,NULL,N'4222',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261007',112),N'A16',N'9ce69892-79c4-7d0d-fb36-fdad06f78746',N'OFICINA',NULL,NULL,N'4197',NULL,N'Mecânica',NULL,N'SUSPENÇÂO',NULL,NULL),
(CONVERT(date,'20261007',112),N'A17',N'1eb9df0a-c2bb-1b1e-2659-1f3c209cfdd0',N'OFICINA',NULL,NULL,N'4225',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261007',112),N'A18',N'b3c4ea78-bdf3-bd0b-1d9f-66cb8f6fcfca',N'OFICINA',NULL,NULL,N'2425',NULL,N'Mecânica',NULL,N'VAZ OLEO',NULL,NULL),
(CONVERT(date,'20261007',112),N'A19',N'e4fdfe3a-16c6-76b3-b6ef-ad4f7cdafaa7',N'OFICINA',NULL,NULL,N'2352',NULL,N'Mecânica',NULL,N'POTENCIA',NULL,NULL),
(CONVERT(date,'20261007',112),N'A20',N'8255f961-228d-d03e-8f34-9d18e6f74bcd',N'OFICINA',NULL,NULL,N'4224',NULL,N'Mecânica',NULL,N'MECANICA',NULL,NULL),
(CONVERT(date,'20261007',112),N'C12',N'453034b7-7c31-6d6e-574c-f0af9648931f',N'OFICINA',NULL,NULL,N'3951',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'C13',N'3d89cba5-cb28-b5df-d0a4-3ab661983ab6',N'OFICINA',NULL,NULL,N'2514',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'C14',N'8d247137-1fbc-0c1d-b335-12cdd35ab368',N'OFICINA',NULL,NULL,N'3139',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'C15',N'4ce5d428-8d67-286c-cf3e-cf94cee990bb',N'OFICINA',NULL,NULL,N'4196',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'C16',N'62473bcd-26a5-8c86-d775-0337320cf407',N'OFICINA',NULL,NULL,N'4222',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'C17',N'2f7efb7f-5755-0b7c-42b3-899793e209e3',N'OFICINA',NULL,NULL,N'2426',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'C18',N'1e64f7a5-d182-12ee-d0a5-bb45efcb90f1',N'OFICINA',NULL,NULL,N'4209',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'C19',N'82363108-48d1-7dad-449d-381535327f27',N'OFICINA',NULL,NULL,N'3271',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'C20',N'15af7bd9-655b-3420-5fe2-d07998feb739',N'OFICINA',NULL,NULL,N'4193',NULL,N'Elevador',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'D12',N'1752d317-f74e-38ff-dadd-d24e5873f253',N'OFICINA',NULL,NULL,N'3100',NULL,N'Elétrica',NULL,N'MODULO',NULL,NULL),
(CONVERT(date,'20261007',112),N'D13',N'eb1aed0c-e52e-0145-79f6-76aab2bf5053',N'OFICINA',NULL,NULL,N'2623',NULL,N'Elétrica',NULL,N'LIMPADOR',NULL,NULL),
(CONVERT(date,'20261007',112),N'D14',N'176e201c-d21f-d7ca-6441-8a80582ef643',N'OFICINA',NULL,NULL,N'4189',NULL,N'Elétrica',NULL,N'LIMPADOR',NULL,NULL),
(CONVERT(date,'20261007',112),N'F13',N'9d1209b4-c1ec-a198-29d5-bd53d887dbd6',N'OFICINA',NULL,NULL,N'4270',NULL,N'Borracharia',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'F14',N'19c383a0-a99a-9e97-2d2c-513b02454b01',N'OFICINA',NULL,NULL,N'4250',NULL,N'Borracharia',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'G12',N'401e34a6-98ba-9835-53e3-cb7a474b91fd',N'OFICINA',NULL,NULL,N'3147',NULL,N'Funilaria / Pintura',NULL,N'BANCO',NULL,NULL),
(CONVERT(date,'20261007',112),N'G14',N'03d9a0bd-f3ac-7669-50a9-97800c58d44b',N'OFICINA',NULL,NULL,N'4227',NULL,N'Funilaria / Pintura',NULL,N'PARACHOQUE',NULL,NULL),
(CONVERT(date,'20261007',112),N'I14',N'92577546-fd69-07ff-26aa-54030d4c0515',N'OFICINA',NULL,NULL,N'3206',NULL,N'Tacógrafo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'I15',N'8c867190-08c5-4a62-3b9e-4a169fe042d3',N'OFICINA',NULL,NULL,N'4261',NULL,N'Tacógrafo',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'J12',N'57f3f686-9119-4472-8882-9c3a3fca6d1d',N'OFICINA',NULL,NULL,N'23',NULL,N'Bilhetagem',NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'C26',N'8dad15a6-64bb-ba15-9215-b5a7038038ba',N'REFORCO',N'FIXO',4,N'3271',NULL,NULL,N'07:40 - A',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261007',112),N'H26',N'28b06a8e-d2c7-5c06-50b8-b975023c524e',N'REFORCO',N'FIXO',10,N'3902',NULL,NULL,N'07:50 - C',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261007',112),N'C27',N'd4e66460-e57f-5634-6ee4-7e780bd08516',N'REFORCO',N'FIXO',5,N'4257',NULL,NULL,N'07:40 - M',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261007',112),N'H27',N'b5e0b08d-f6f4-c661-043d-6b57405ebc64',N'REFORCO',N'FIXO',11,N'4253',NULL,NULL,N'07:50 - C',N'INSPEÇÂO',NULL,NULL),
(CONVERT(date,'20261007',112),N'J23',N'5bb7acac-3e50-55c3-0df1-6246dceaab0f',N'REFORCO',N'EXTRA',1,N'3902',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'J24',N'51a14d51-aa01-879e-3d66-f71440a50f38',N'REFORCO',N'EXTRA',2,N'4257',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'J25',N'8a79fbcc-a36d-efa3-bad2-21d5903e5115',N'REFORCO',N'EXTRA',3,N'4253',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'J27',N'a523f91e-9847-ebb6-0962-c50b6f93d740',N'REFORCO',N'EXTRA',5,N'3271',NULL,NULL,NULL,NULL,NULL,NULL),
(CONVERT(date,'20261007',112),N'A35',N'cfefe548-003e-ba2c-cca5-b24f09da63e8',N'BLOQUEADO',NULL,NULL,N'2424',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260603',112)),
(CONVERT(date,'20261007',112),N'A36',N'3dde756c-9cc5-a9be-3781-04037d387b26',N'BLOQUEADO',NULL,NULL,N'2600',N'VSF',NULL,NULL,N'ELÉTRICA',NULL,CONVERT(date,'20260106',112)),
(CONVERT(date,'20261007',112),N'A37',N'c27c29fc-4269-b2ef-f5b8-c83c82c58000',N'BLOQUEADO',NULL,NULL,N'2800',N'VSF',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20260103',112)),
(CONVERT(date,'20261007',112),N'A38',N'fd44941c-51a8-eec4-24cc-374296243c50',N'BLOQUEADO',NULL,NULL,N'2611',N'VSF',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260825',112)),
(CONVERT(date,'20261007',112),N'G35',N'8295703b-45a0-b8ca-2ebf-387b5f5212b0',N'BLOQUEADO',NULL,NULL,N'4199',N'VCG',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240503',112)),
(CONVERT(date,'20261007',112),N'G36',N'7f7ff7fe-56d1-daaf-6b68-7b189d483a2b',N'BLOQUEADO',NULL,NULL,N'4200',N'VCG',NULL,NULL,N'TRANSMISSÃO',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261007',112),N'G37',N'e3fbefbf-343e-3d14-726d-fdb8f23c1e6d',N'BLOQUEADO',NULL,NULL,N'4201',N'VCG',NULL,NULL,N'MECANICA PASTILHS E DISCO DE FREIO',NULL,CONVERT(date,'20260628',112)),
(CONVERT(date,'20261007',112),N'G38',N'f479ec76-23a5-9610-7fc9-5ba207744daa',N'BLOQUEADO',NULL,NULL,N'4190',N'VCG',NULL,NULL,N'VIDRO BOLHA',NULL,CONVERT(date,'20260820',112)),
(CONVERT(date,'20261007',112),N'G39',N'734fe30a-22bb-3594-887e-ba26a7504406',N'BLOQUEADO',NULL,NULL,N'4255',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260824',112)),
(CONVERT(date,'20261007',112),N'G40',N'ace65504-2783-fa86-6f3c-2f78b09ed5e8',N'BLOQUEADO',NULL,NULL,N'4211',N'VCG',NULL,NULL,N'PANE ELETRICA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261007',112),N'G41',N'5f4b4be8-fb8f-1bca-fdd0-f83519a0a837',N'BLOQUEADO',NULL,NULL,N'4225',N'VCG',NULL,NULL,N'PANE ELETRICA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261007',112),N'G42',N'9a079e47-a53c-52f0-cf7e-e97126ac04b7',N'BLOQUEADO',NULL,NULL,N'4223',N'VCG',NULL,NULL,N'MOLEJO',NULL,CONVERT(date,'20261004',112)),
(CONVERT(date,'20261007',112),N'G43',N'e9c3ba32-0f3f-ecbf-9373-90b552e4d41a',N'BLOQUEADO',NULL,NULL,N'4267',N'VCG',NULL,NULL,N'REVISÂO PARA INSPEÇAO',NULL,CONVERT(date,'20261006',112)),
(CONVERT(date,'20261007',112),N'G44',N'3220a08b-15d2-d475-8615-919a6977a162',N'BLOQUEADO',NULL,NULL,N'4248',N'VCG',NULL,NULL,N'AR E EMBREAGEM',NULL,CONVERT(date,'20261003',112)),
(CONVERT(date,'20261007',112),N'G45',N'2fe9d207-35f7-a541-eeff-19cade95f45e',N'BLOQUEADO',NULL,NULL,N'4196',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260827',112)),
(CONVERT(date,'20261007',112),N'G46',N'4f47c90c-f537-ba92-f6df-00903e644ea0',N'BLOQUEADO',NULL,NULL,N'4257',N'VCG',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20260921',112)),
(CONVERT(date,'20261007',112),N'G47',N'bef9a2a9-8e19-e624-3c04-e7edee76b9da',N'BLOQUEADO',NULL,NULL,N'4194',N'VCG',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261007',112),N'G48',N'f848bf44-e8ff-99ba-9552-c075a83323a7',N'BLOQUEADO',NULL,NULL,N'4212',N'VCG',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20260927',112)),
(CONVERT(date,'20261007',112),N'A51',N'6efad749-9052-27eb-ea37-882a73ee634e',N'BLOQUEADO',NULL,NULL,N'3005',N'JTU',NULL,NULL,N'SUSPENSÃO ',NULL,CONVERT(date,'20251020',112)),
(CONVERT(date,'20261007',112),N'A52',N'c59b6ef7-44f8-96fe-5950-db2bd8815635',N'BLOQUEADO',NULL,NULL,N'3133',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260901',112)),
(CONVERT(date,'20261007',112),N'A53',N'4a694980-a2e8-7af8-e403-99fce0dc7e2f',N'BLOQUEADO',NULL,NULL,N'3006',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20240630',112)),
(CONVERT(date,'20261007',112),N'A54',N'fb19814e-ed75-989c-81ef-8136ed375a0c',N'BLOQUEADO',NULL,NULL,N'3903',N'JTU',NULL,NULL,N'MODULO',NULL,CONVERT(date,'20261005',112)),
(CONVERT(date,'20261007',112),N'A55',N'fead8a38-a596-5de2-1798-08dad613e96a',N'BLOQUEADO',NULL,NULL,N'3106',N'JTU',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20260624',112)),
(CONVERT(date,'20261007',112),N'A56',N'c7eda0a0-d869-e897-9ecc-3ae6c1a10548',N'BLOQUEADO',NULL,NULL,N'3904',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20261005',112)),
(CONVERT(date,'20261007',112),N'A57',N'1c2f5515-0d22-7409-b626-0530c3336433',N'BLOQUEADO',NULL,NULL,N'3951',N'JTU',NULL,NULL,N'MANGA DE EIXO',NULL,CONVERT(date,'20261006',112)),
(CONVERT(date,'20261007',112),N'A58',N'e7bd5121-7fc6-7a02-271c-f9f547ae6a73',N'BLOQUEADO',NULL,NULL,N'3099',N'JTU',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261007',112),N'A59',N'e4f431b2-adf7-6516-b7e3-79b416f922a5',N'BLOQUEADO',NULL,NULL,N'3900',N'JTU',NULL,NULL,N'POSTO DE MOLA',NULL,CONVERT(date,'20261004',112)),
(CONVERT(date,'20261007',112),N'A60',N'72234a56-a148-8cf3-57e2-2a3f2f90fc1f',N'BLOQUEADO',NULL,NULL,N'3267',N'JTU',NULL,NULL,N'REVISAO',NULL,CONVERT(date,'20260930',112)),
(CONVERT(date,'20261007',112),N'G51',N'3c0e4988-3b42-b736-899b-adf122dc3802',N'BLOQUEADO',NULL,NULL,N'1119',N'VCM',NULL,NULL,N'MOTOR',NULL,CONVERT(date,'20201218',112)),
(CONVERT(date,'20261007',112),N'G52',N'b7c8972c-b916-ce5b-6cce-61c1cdc0ecd2',N'BLOQUEADO',NULL,NULL,N'3083',N'VCM',NULL,NULL,N'FORA DE OPERAÇÂO',NULL,CONVERT(date,'20261001',112)),
(CONVERT(date,'20261007',112),N'G53',N'4833daeb-76a3-0b55-44e9-7915745cd4c2',N'BLOQUEADO',NULL,NULL,N'1323',N'VCM',NULL,NULL,N'SINISTRO',NULL,CONVERT(date,'20241207',112)),
(CONVERT(date,'20261007',112),N'G54',N'6e803522-d915-4275-fe3d-61add5a7445a',N'BLOQUEADO',NULL,NULL,N'1322',N'VCM',NULL,NULL,N'REVISÂO GERAL',NULL,CONVERT(date,'20261001',112));

DECLARE @folhas TABLE (id int PRIMARY KEY, data_folha date UNIQUE NOT NULL);
BEGIN TRY
    BEGIN TRANSACTION;
    IF COALESCE(HAS_PERMS_BY_NAME(DB_NAME(),'DATABASE','VIEW DEFINITION'),0)<>1
        RAISERROR('Requer VIEW DEFINITION: metadados invisiveis nao certificam pre-requisitos.',16,1);
    IF OBJECT_ID(N'dbo.ciclo_operacional',N'U') IS NULL OR OBJECT_ID(N'dbo.folha_ci',N'U') IS NULL
       OR OBJECT_ID(N'dbo.item_folha_ci',N'U') IS NULL OR OBJECT_ID(N'dbo.estado_manutencao_ciclo',N'U') IS NULL
        RAISERROR('Estruturas C4 ausentes; pare sem provisionar ou reparar.',16,1);
    -- Contrato integral das colunas, incluindo consorciada nvarchar(10), 20 bytes, nullable=1.
    IF EXISTS (
        SELECT 1 FROM (VALUES
    (N'ciclo_operacional', N'id', 1, N'int', NULL, 0, 1, NULL),
    (N'ciclo_operacional', N'garagem', 2, N'nvarchar', 20, 0, 0, NULL),
    (N'ciclo_operacional', N'data_operacional', 3, N'date', NULL, 0, 0, NULL),
    (N'ciclo_operacional', N'origem', 4, N'nvarchar', 40, 0, 0, NULL),
    (N'ciclo_operacional', N'inicializacao_prevista_em', 5, N'datetime2', NULL, 0, 0, 3),
    (N'ciclo_operacional', N'inicializado_em', 6, N'datetime2', NULL, 0, 0, 3),
    (N'ciclo_operacional', N'referencia_origem', 7, N'nvarchar', 510, 1, 0, NULL),
    (N'ciclo_operacional', N'created_at', 8, N'datetime2', NULL, 0, 0, 3),
    (N'ciclo_operacional', N'updated_at', 9, N'datetime2', NULL, 0, 0, 3),
    (N'folha_ci', N'id', 1, N'int', NULL, 0, 1, NULL),
    (N'folha_ci', N'garagem', 2, N'nvarchar', 20, 0, 0, NULL),
    (N'folha_ci', N'data_folha', 3, N'date', NULL, 0, 0, NULL),
    (N'folha_ci', N'status', 4, N'nvarchar', 40, 0, 0, NULL),
    (N'folha_ci', N'origem', 5, N'nvarchar', 40, 0, 0, NULL),
    (N'folha_ci', N'ciclo_preparacao_id', 6, N'int', NULL, 1, 0, NULL),
    (N'folha_ci', N'folha_origem_id', 7, N'int', NULL, 1, 0, NULL),
    (N'folha_ci', N'titulo_coluna_adicional', 8, N'nvarchar', 60, 1, 0, NULL),
    (N'folha_ci', N'inicializacao_prevista_em', 9, N'datetime2', NULL, 1, 0, 3),
    (N'folha_ci', N'inicializada_em', 10, N'datetime2', NULL, 1, 0, 3),
    (N'folha_ci', N'finalizacao_prevista_em', 11, N'datetime2', NULL, 1, 0, 3),
    (N'folha_ci', N'finalizada_em', 12, N'datetime2', NULL, 1, 0, 3),
    (N'folha_ci', N'referencia_origem', 13, N'nvarchar', 510, 1, 0, NULL),
    (N'folha_ci', N'responsavel_registro_id', 14, N'int', NULL, 1, 0, NULL),
    (N'folha_ci', N'created_at', 15, N'datetime2', NULL, 0, 0, 3),
    (N'folha_ci', N'updated_at', 16, N'datetime2', NULL, 0, 0, 3),
    (N'item_folha_ci', N'id', 1, N'int', NULL, 0, 1, NULL),
    (N'item_folha_ci', N'folha_id', 2, N'int', NULL, 0, 0, NULL),
    (N'item_folha_ci', N'chave_item', 3, N'uniqueidentifier', NULL, 0, 0, NULL),
    (N'item_folha_ci', N'categoria', 4, N'nvarchar', 40, 0, 0, NULL),
    (N'item_folha_ci', N'tipo_posicao', 5, N'nvarchar', 20, 1, 0, NULL),
    (N'item_folha_ci', N'ordem_posicao', 6, N'int', NULL, 1, 0, NULL),
    (N'item_folha_ci', N'prefixo', 7, N'nvarchar', 20, 0, 0, NULL),
    (N'item_folha_ci', N'consorciada', 8, N'nvarchar', 20, 1, 0, NULL),
    (N'item_folha_ci', N'sub_tipo', 9, N'nvarchar', 100, 1, 0, NULL),
    (N'item_folha_ci', N'horario_reforco', 10, N'nvarchar', 40, 1, 0, NULL),
    (N'item_folha_ci', N'motivo', 11, N'nvarchar', 510, 1, 0, NULL),
    (N'item_folha_ci', N'observacoes', 12, N'nvarchar', 510, 1, 0, NULL),
    (N'item_folha_ci', N'hora_bloqueio', 13, N'nvarchar', 20, 1, 0, NULL),
    (N'item_folha_ci', N'gravidade', 14, N'nvarchar', 20, 1, 0, NULL),
    (N'item_folha_ci', N'responsavel', 15, N'nvarchar', 200, 1, 0, NULL),
    (N'item_folha_ci', N'status_item', 16, N'nvarchar', 40, 1, 0, NULL),
    (N'item_folha_ci', N'data_liberacao', 17, N'nvarchar', 100, 1, 0, NULL),
    (N'item_folha_ci', N'motivo_liberacao', 18, N'nvarchar', 510, 1, 0, NULL),
    (N'item_folha_ci', N'responsavel_liberacao', 19, N'nvarchar', 200, 1, 0, NULL),
    (N'item_folha_ci', N'responsavel_registro_id', 20, N'int', NULL, 1, 0, NULL),
    (N'item_folha_ci', N'created_at', 21, N'datetime2', NULL, 0, 0, 3),
    (N'item_folha_ci', N'updated_at', 22, N'datetime2', NULL, 0, 0, 3),
    (N'item_folha_ci', N'data_bloqueio', 23, N'date', NULL, 1, 0, NULL),
    (N'estado_manutencao_ciclo', N'id', 1, N'int', NULL, 0, 1, NULL),
    (N'estado_manutencao_ciclo', N'ciclo_id', 2, N'int', NULL, 0, 0, NULL),
    (N'estado_manutencao_ciclo', N'prefixo', 3, N'nvarchar', 20, 0, 0, NULL),
    (N'estado_manutencao_ciclo', N'consorciada', 4, N'nvarchar', 20, 0, 0, NULL),
    (N'estado_manutencao_ciclo', N'bloqueado', 5, N'bit', NULL, 0, 0, NULL),
    (N'estado_manutencao_ciclo', N'em_execucao', 6, N'bit', NULL, 0, 0, NULL),
    (N'estado_manutencao_ciclo', N'liberado', 7, N'bit', NULL, 0, 0, NULL),
    (N'estado_manutencao_ciclo', N'observacao_bloqueio', 8, N'nvarchar', 510, 1, 0, NULL),
    (N'estado_manutencao_ciclo', N'observacao_oficina', 9, N'nvarchar', 510, 1, 0, NULL),
    (N'estado_manutencao_ciclo', N'responsavel_registro_id', 10, N'int', NULL, 1, 0, NULL),
    (N'estado_manutencao_ciclo', N'created_at', 11, N'datetime2', NULL, 0, 0, 3),
    (N'estado_manutencao_ciclo', N'updated_at', 12, N'datetime2', NULL, 0, 0, 3)

        ) e(tabela,coluna,ordem,tipo,bytes,nullable,identity_flag,escala)
        LEFT JOIN sys.tables t ON t.name=e.tabela AND t.schema_id=SCHEMA_ID(N'dbo')
        LEFT JOIN sys.columns c ON c.object_id=t.object_id AND c.name=e.coluna
        LEFT JOIN sys.types ty ON ty.user_type_id=c.user_type_id
        WHERE c.column_id IS NULL OR ty.name<>e.tipo OR ty.is_user_defined<>0
           OR c.is_nullable<>e.nullable OR c.is_identity<>e.identity_flag OR c.is_computed<>0
           OR (e.bytes IS NOT NULL AND c.max_length<>e.bytes)
           OR (e.escala IS NOT NULL AND c.scale<>e.escala)
    ) RAISERROR('Colunas C4 incompativeis; nenhuma carga autorizada.',16,1);
    -- Whitelist fechada do CHECK novo: nao apagar agrupamentos/literais nem aceitar o antigo LEN.
    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints c
        WHERE c.parent_object_id=OBJECT_ID(N'dbo.item_folha_ci') AND c.name=N'CK_item_folha_ci_consorciada'
          AND c.is_disabled=0 AND c.is_not_trusted=0 AND c.is_not_for_replication=0 AND c.parent_column_id=0
          AND c.definition COLLATE Latin1_General_100_BIN2 IN (
              N'((consorciada IS NULL OR consorciada IN (N''VSF'', N''VCG'', N''JTU'', N''VCM'')) AND (categoria <> N''BLOQUEADO'' OR consorciada IS NOT NULL))',
              N'(([consorciada] IS NULL OR ([consorciada]=N''VCM'' OR [consorciada]=N''JTU'' OR [consorciada]=N''VCG'' OR [consorciada]=N''VSF'')) AND ([categoria]<>N''BLOQUEADO'' OR [consorciada] IS NOT NULL))'
          )
    ) RAISERROR('CHECK novo de consorciada ausente/incompativel/nao reconhecido; revisar sem DDL.',16,1);
    IF EXISTS (SELECT 1 FROM sys.triggers WHERE parent_id IN (OBJECT_ID(N'dbo.folha_ci'),OBJECT_ID(N'dbo.item_folha_ci')) AND is_disabled=0)
        RAISERROR('Trigger ativo inesperado nos alvos: revisar efeitos antes da carga.',16,1);
    -- UPDLOCK/HOLDLOCK preservam o intervalo ate COMMIT, incluindo concorrencia com outra carga.
    IF EXISTS (SELECT 1 FROM dbo.folha_ci WITH (UPDLOCK,HOLDLOCK)
               WHERE garagem=N'VCG' AND data_folha>=CONVERT(date,'20261001',112) AND data_folha<=CONVERT(date,'20261007',112))
        RAISERROR('Existe FolhaCI VCG entre 01 e 07/10/2026; carga integral recusada.',16,1);
    IF (SELECT COUNT(*) FROM @dias)<>7 OR (SELECT COUNT(*) FROM @itens)<>518
        RAISERROR('Manifesto de carga incompleto.',16,1);

    INSERT INTO dbo.folha_ci (garagem,data_folha,status,origem,ciclo_preparacao_id,folha_origem_id,
        titulo_coluna_adicional,inicializacao_prevista_em,inicializada_em,finalizacao_prevista_em,finalizada_em,
        referencia_origem,responsavel_registro_id,created_at,updated_at)
    OUTPUT inserted.id,inserted.data_folha INTO @folhas(id,data_folha)
    SELECT N'VCG',data_folha,N'FINALIZADA',N'IMPORTACAO',NULL,NULL,titulo,NULL,NULL,NULL,NULL,
        arquivo,NULL,SYSUTCDATETIME(),SYSUTCDATETIME() FROM @dias;

    INSERT INTO dbo.item_folha_ci (folha_id,chave_item,categoria,tipo_posicao,ordem_posicao,prefixo,consorciada,sub_tipo,horario_reforco,motivo,observacoes,data_bloqueio,
        hora_bloqueio,gravidade,responsavel,status_item,data_liberacao,motivo_liberacao,responsavel_liberacao,
        responsavel_registro_id,created_at,updated_at)
    SELECT f.id,i.chave_item,i.categoria,i.tipo_posicao,i.ordem_posicao,i.prefixo,i.consorciada,i.sub_tipo,i.horario_reforco,i.motivo,i.observacoes,i.data_bloqueio,
        NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,SYSUTCDATETIME(),SYSUTCDATETIME()
    FROM @itens i JOIN @folhas f ON f.data_folha=i.data_folha;

    -- Validacao da fotografia persistida antes do COMMIT.
    IF (SELECT COUNT(*) FROM @folhas)<>7 OR EXISTS (
        SELECT 1 FROM @dias d LEFT JOIN @folhas n ON n.data_folha=d.data_folha
        LEFT JOIN dbo.folha_ci f ON f.id=n.id
        WHERE f.id IS NULL OR f.data_folha<>d.data_folha OR f.garagem<>N'VCG' OR f.status<>N'FINALIZADA'
          OR f.origem<>N'IMPORTACAO' OR f.titulo_coluna_adicional IS NULL
          OR (CONVERT(varbinary(max),f.titulo_coluna_adicional)<>CONVERT(varbinary(max),d.titulo) OR DATALENGTH(f.titulo_coluna_adicional)<>DATALENGTH(d.titulo))
          OR f.referencia_origem IS NULL OR (CONVERT(varbinary(max),f.referencia_origem)<>CONVERT(varbinary(max),d.arquivo) OR DATALENGTH(f.referencia_origem)<>DATALENGTH(d.arquivo))
          OR f.ciclo_preparacao_id IS NOT NULL OR f.folha_origem_id IS NOT NULL
          OR f.inicializacao_prevista_em IS NOT NULL OR f.inicializada_em IS NOT NULL
          OR f.finalizacao_prevista_em IS NOT NULL OR f.finalizada_em IS NOT NULL OR f.responsavel_registro_id IS NOT NULL
    ) RAISERROR('Folhas persistidas divergem das sete fotografias.',16,1);
    IF EXISTS (
        SELECT 1 FROM @dias d JOIN @folhas f ON f.data_folha=d.data_folha
        OUTER APPLY (SELECT
            SUM(CASE WHEN categoria=N'PREVENTIVA' THEN 1 ELSE 0 END) preventiva,
            SUM(CASE WHEN categoria=N'OFICINA' THEN 1 ELSE 0 END) oficina,
            SUM(CASE WHEN categoria=N'REFORCO' AND tipo_posicao=N'FIXO' THEN 1 ELSE 0 END) fixo,
            SUM(CASE WHEN categoria=N'REFORCO' AND tipo_posicao=N'EXTRA' THEN 1 ELSE 0 END) extra,
            SUM(CASE WHEN categoria=N'BLOQUEADO' AND consorciada=N'VSF' THEN 1 ELSE 0 END) vsf,
            SUM(CASE WHEN categoria=N'BLOQUEADO' AND consorciada=N'VCG' THEN 1 ELSE 0 END) vcg,
            SUM(CASE WHEN categoria=N'BLOQUEADO' AND consorciada=N'JTU' THEN 1 ELSE 0 END) jtu,
            SUM(CASE WHEN categoria=N'BLOQUEADO' AND consorciada=N'VCM' THEN 1 ELSE 0 END) vcm
            FROM dbo.item_folha_ci WHERE folha_id=f.id) c
        WHERE COALESCE(c.preventiva,-1)<>d.preventiva OR COALESCE(c.oficina,-1)<>d.oficina
           OR COALESCE(c.fixo,-1)<>d.fixo OR COALESCE(c.extra,-1)<>d.extra
           OR COALESCE(c.vsf,-1)<>d.vsf OR COALESCE(c.vcg,-1)<>d.vcg
           OR COALESCE(c.jtu,-1)<>d.jtu OR COALESCE(c.vcm,-1)<>d.vcm
    ) RAISERROR('Contagens por categoria/posicao/consorciada divergem.',16,1);
    IF (SELECT COUNT(*) FROM dbo.item_folha_ci i JOIN @folhas f ON f.id=i.folha_id WHERE i.categoria=N'BLOQUEADO')<>234
        RAISERROR('Total BLOQUEADOS diferente de 234.',16,1);
    IF EXISTS (SELECT 1 FROM dbo.item_folha_ci i JOIN @folhas f ON f.id=i.folha_id
        WHERE (i.categoria=N'BLOQUEADO' AND (i.consorciada IS NULL OR i.consorciada NOT IN (N'VSF',N'VCG',N'JTU',N'VCM') OR i.data_bloqueio IS NULL OR i.data_bloqueio>f.data_folha))
           OR (i.categoria<>N'BLOQUEADO' AND i.consorciada IS NOT NULL)
           OR (i.categoria=N'REFORCO' AND (i.tipo_posicao IS NULL OR i.ordem_posicao IS NULL
               OR i.tipo_posicao NOT IN (N'FIXO',N'EXTRA') OR i.ordem_posicao<1 OR (i.tipo_posicao=N'FIXO' AND i.ordem_posicao>12)))
           OR (i.categoria<>N'REFORCO' AND (i.tipo_posicao IS NOT NULL OR i.ordem_posicao IS NOT NULL)))
        RAISERROR('Contrato de consorciada/data/posicoes violado.',16,1);
    IF EXISTS (SELECT i.folha_id,i.prefixo FROM dbo.item_folha_ci i JOIN @folhas f ON f.id=i.folha_id
               WHERE i.categoria=N'BLOQUEADO' GROUP BY i.folha_id,i.prefixo HAVING COUNT(*)>1)
        RAISERROR('Prefixo BLOQUEADO duplicado na mesma folha.',16,1);
    IF EXISTS (SELECT 1 FROM @folhas f WHERE
        (SELECT COUNT(*) FROM dbo.item_folha_ci WHERE folha_id=f.id AND categoria=N'OFICINA' AND prefixo=N'23' AND sub_tipo=N'Bilhetagem' AND consorciada IS NULL)<>1
        OR (SELECT COUNT(*) FROM dbo.item_folha_ci WHERE folha_id=f.id AND categoria=N'BLOQUEADO' AND prefixo=N'3083' AND consorciada=N'VCM' AND data_bloqueio=CONVERT(date,'20261001',112))<>1)
        RAISERROR('23/Bilhetagem/NULL ou 3083/VCM/fallback nao preservado.',16,1);
    -- NVARCHAR compara com padding mesmo sob BIN2. Bytes + DATALENGTH preservam
    -- caixa, acentos, espacos finais/iniciais, conteudo interno e NULL versus vazio.
    -- NULLs opcionais tipados evitam conversoes implicitas nos operadores de conjunto.
    IF (SELECT COUNT(*) FROM dbo.item_folha_ci i JOIN @folhas f ON f.id=i.folha_id)<>518
       OR EXISTS (SELECT f.data_folha,
                   i.chave_item,
                   CONVERT(varbinary(max),i.categoria),
                   DATALENGTH(i.categoria),
                   CONVERT(varbinary(max),i.tipo_posicao),
                   DATALENGTH(i.tipo_posicao),
                   i.ordem_posicao,
                   CONVERT(varbinary(max),i.prefixo),
                   DATALENGTH(i.prefixo),
                   CONVERT(varbinary(max),i.consorciada),
                   DATALENGTH(i.consorciada),
                   CONVERT(varbinary(max),i.sub_tipo),
                   DATALENGTH(i.sub_tipo),
                   CONVERT(varbinary(max),i.horario_reforco),
                   DATALENGTH(i.horario_reforco),
                   CONVERT(varbinary(max),i.motivo),
                   DATALENGTH(i.motivo),
                   CONVERT(varbinary(max),i.observacoes),
                   DATALENGTH(i.observacoes),
                   i.data_bloqueio,
                   CONVERT(varbinary(max),i.hora_bloqueio),
                   DATALENGTH(i.hora_bloqueio),
                   CONVERT(varbinary(max),i.gravidade),
                   DATALENGTH(i.gravidade),
                   CONVERT(varbinary(max),i.responsavel),
                   DATALENGTH(i.responsavel),
                   CONVERT(varbinary(max),i.status_item),
                   DATALENGTH(i.status_item),
                   CONVERT(varbinary(max),i.data_liberacao),
                   DATALENGTH(i.data_liberacao),
                   CONVERT(varbinary(max),i.motivo_liberacao),
                   DATALENGTH(i.motivo_liberacao),
                   CONVERT(varbinary(max),i.responsavel_liberacao),
                   DATALENGTH(i.responsavel_liberacao),
                   i.responsavel_registro_id
            FROM dbo.item_folha_ci i JOIN @folhas f ON f.id=i.folha_id
            EXCEPT
            SELECT i.data_folha,
                   i.chave_item,
                   CONVERT(varbinary(max),i.categoria),
                   DATALENGTH(i.categoria),
                   CONVERT(varbinary(max),i.tipo_posicao),
                   DATALENGTH(i.tipo_posicao),
                   i.ordem_posicao,
                   CONVERT(varbinary(max),i.prefixo),
                   DATALENGTH(i.prefixo),
                   CONVERT(varbinary(max),i.consorciada),
                   DATALENGTH(i.consorciada),
                   CONVERT(varbinary(max),i.sub_tipo),
                   DATALENGTH(i.sub_tipo),
                   CONVERT(varbinary(max),i.horario_reforco),
                   DATALENGTH(i.horario_reforco),
                   CONVERT(varbinary(max),i.motivo),
                   DATALENGTH(i.motivo),
                   CONVERT(varbinary(max),i.observacoes),
                   DATALENGTH(i.observacoes),
                   i.data_bloqueio,
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS int)
            FROM @itens i)
       OR EXISTS (SELECT i.data_folha,
                   i.chave_item,
                   CONVERT(varbinary(max),i.categoria),
                   DATALENGTH(i.categoria),
                   CONVERT(varbinary(max),i.tipo_posicao),
                   DATALENGTH(i.tipo_posicao),
                   i.ordem_posicao,
                   CONVERT(varbinary(max),i.prefixo),
                   DATALENGTH(i.prefixo),
                   CONVERT(varbinary(max),i.consorciada),
                   DATALENGTH(i.consorciada),
                   CONVERT(varbinary(max),i.sub_tipo),
                   DATALENGTH(i.sub_tipo),
                   CONVERT(varbinary(max),i.horario_reforco),
                   DATALENGTH(i.horario_reforco),
                   CONVERT(varbinary(max),i.motivo),
                   DATALENGTH(i.motivo),
                   CONVERT(varbinary(max),i.observacoes),
                   DATALENGTH(i.observacoes),
                   i.data_bloqueio,
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS varbinary(max)),
                   CAST(NULL AS int),
                   CAST(NULL AS int)
            FROM @itens i
            EXCEPT
            SELECT f.data_folha,
                   i.chave_item,
                   CONVERT(varbinary(max),i.categoria),
                   DATALENGTH(i.categoria),
                   CONVERT(varbinary(max),i.tipo_posicao),
                   DATALENGTH(i.tipo_posicao),
                   i.ordem_posicao,
                   CONVERT(varbinary(max),i.prefixo),
                   DATALENGTH(i.prefixo),
                   CONVERT(varbinary(max),i.consorciada),
                   DATALENGTH(i.consorciada),
                   CONVERT(varbinary(max),i.sub_tipo),
                   DATALENGTH(i.sub_tipo),
                   CONVERT(varbinary(max),i.horario_reforco),
                   DATALENGTH(i.horario_reforco),
                   CONVERT(varbinary(max),i.motivo),
                   DATALENGTH(i.motivo),
                   CONVERT(varbinary(max),i.observacoes),
                   DATALENGTH(i.observacoes),
                   i.data_bloqueio,
                   CONVERT(varbinary(max),i.hora_bloqueio),
                   DATALENGTH(i.hora_bloqueio),
                   CONVERT(varbinary(max),i.gravidade),
                   DATALENGTH(i.gravidade),
                   CONVERT(varbinary(max),i.responsavel),
                   DATALENGTH(i.responsavel),
                   CONVERT(varbinary(max),i.status_item),
                   DATALENGTH(i.status_item),
                   CONVERT(varbinary(max),i.data_liberacao),
                   DATALENGTH(i.data_liberacao),
                   CONVERT(varbinary(max),i.motivo_liberacao),
                   DATALENGTH(i.motivo_liberacao),
                   CONVERT(varbinary(max),i.responsavel_liberacao),
                   DATALENGTH(i.responsavel_liberacao),
                   i.responsavel_registro_id
            FROM dbo.item_folha_ci i JOIN @folhas f ON f.id=i.folha_id)
        RAISERROR('Itens persistidos divergem integralmente do manifesto, incluindo fallbacks e opcionais NULL.',16,1);
    -- Casos historicos auditados: 16 fallbacks, sem promover regra para o runtime.
    IF EXISTS (
        SELECT 1 FROM (VALUES
            ('20261001',N'3951',N'JTU'),
            ('20261001',N'1322',N'VCM'),
            ('20261001',N'3083',N'VCM'),
            ('20261002',N'3951',N'JTU'),
            ('20261002',N'3083',N'VCM'),
            ('20261002',N'1322',N'VCM'),
            ('20261003',N'3083',N'VCM'),
            ('20261003',N'1322',N'VCM'),
            ('20261004',N'3083',N'VCM'),
            ('20261004',N'1322',N'VCM'),
            ('20261005',N'3083',N'VCM'),
            ('20261005',N'1322',N'VCM'),
            ('20261006',N'3083',N'VCM'),
            ('20261006',N'1322',N'VCM'),
            ('20261007',N'3083',N'VCM'),
            ('20261007',N'1322',N'VCM')
        ) e(data_folha,prefixo,consorciada)
        LEFT JOIN @folhas f ON f.data_folha=CONVERT(date,e.data_folha,112)
        WHERE (SELECT COUNT(*) FROM dbo.item_folha_ci i WHERE i.folha_id=f.id
            AND i.categoria=N'BLOQUEADO' AND i.prefixo=e.prefixo AND i.consorciada=e.consorciada
            AND i.data_bloqueio=CONVERT(date,'20261001',112))<>1
    ) RAISERROR('Um dos 16 fallbacks historicos nao foi preservado.',16,1);
    IF (SELECT COUNT(*) FROM dbo.item_folha_ci i JOIN @folhas f ON f.id=i.folha_id
        WHERE f.data_folha=CONVERT(date,'20261005',112) AND i.categoria=N'REFORCO'
          AND i.tipo_posicao=N'FIXO' AND i.ordem_posicao=4 AND i.prefixo=N'3277'
          AND i.observacoes COLLATE Latin1_General_100_BIN2=N'URGENT'
          AND i.horario_reforco=N'07:40 - A' AND i.motivo COLLATE Latin1_General_100_BIN2=N'INSPEÇÂO')<>1
       OR (SELECT COUNT(*) FROM dbo.item_folha_ci i JOIN @folhas f ON f.id=i.folha_id
        WHERE f.data_folha=CONVERT(date,'20261005',112) AND i.categoria=N'REFORCO'
          AND i.tipo_posicao=N'EXTRA' AND i.ordem_posicao=3 AND i.prefixo=N'3277' AND i.observacoes IS NULL)<>1
        RAISERROR('3277 FIXO/URGENT e EXTRA devem permanecer independentes.',16,1);
    COMMIT TRANSACTION;
    SELECT N'IMPORTACAO_CONCLUIDA' resultado,7 folhas,518 itens,234 bloqueados;
END TRY
BEGIN CATCH
    IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

-- AUDITORIA LOCAL: leitura SheetJS conferida celula a celula com ZIP/XML independente.
-- AUDIT-DIA {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","sha256":"e5803ef52211e4cfb9a524257ea99c1c7b93eade237e5e540d8ef3c3ccd0b22e","counts":[9,26,8,3,5,11,12,4],"title_original":"INSPEÇÂO","title":"INSPEÇÃO","oficina":{"Mecânica":9,"Elevador":9,"Elétrica":2,"Borracharia":2,"Funilaria / Pintura":3,"Bilhetagem":1}}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A6","guid":"0b085644-661b-8913-eac5-63eeca39fbc2","categoria":"PREVENTIVA","prefixo":"3904","consorciada":null,"sub_tipo":"Preventiva","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"B6","guid":"20cb4237-a01c-35d4-0e13-19e479992111","categoria":"PREVENTIVA","prefixo":"4258","consorciada":null,"sub_tipo":"Preventiva","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A7","guid":"0de6c202-c103-d193-af2d-8623016e9c53","categoria":"PREVENTIVA","prefixo":"3902","consorciada":null,"sub_tipo":"Preventiva","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"E6","guid":"98200285-7aa2-c227-c8fc-678c22afbd3e","categoria":"PREVENTIVA","prefixo":"4253","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"E7","guid":"ff87419d-957a-3a85-c3cb-b33b279b1fad","categoria":"PREVENTIVA","prefixo":"4015","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"E8","guid":"e21167cf-79e5-49c0-af5b-a563005ccffb","categoria":"PREVENTIVA","prefixo":"4222","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G6","guid":"b9d93b7a-2d61-4956-03ce-3f34a8089e20","categoria":"PREVENTIVA","prefixo":"4181","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G7","guid":"b3724397-b425-4cf4-a2e8-f0fc11dbbb7b","categoria":"PREVENTIVA","prefixo":"4197","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G8","guid":"789ac3d3-89a1-58cd-3134-aa752275bb56","categoria":"PREVENTIVA","prefixo":"4231","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A12","guid":"59becab4-175f-d796-fb38-9024ce93dfa4","categoria":"OFICINA","prefixo":"2704","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"BOMBA ARLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A13","guid":"68c7e3e3-01d4-60f9-699d-fd10eb4377f5","categoria":"OFICINA","prefixo":"3222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A14","guid":"e28fa347-d99d-712f-1979-c6f25374af52","categoria":"OFICINA","prefixo":"4244","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"M DE EIXO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A15","guid":"f0728ac8-d783-3733-45fe-868f62cb87b2","categoria":"OFICINA","prefixo":"4222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A16","guid":"cfd572d0-bb0a-5e45-72ac-22ea0c227255","categoria":"OFICINA","prefixo":"4197","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A17","guid":"407d49ab-25b9-7a4b-9a53-3cc204c53c30","categoria":"OFICINA","prefixo":"4225","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A18","guid":"8869807f-08cb-ef69-2458-29e84e1a140a","categoria":"OFICINA","prefixo":"2425","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"VAZ OLEO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A19","guid":"14b178a1-1ca5-e2a1-5a8e-83505ee3e71b","categoria":"OFICINA","prefixo":"4272","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A20","guid":"15804910-30da-26c5-e4a8-31798005653e","categoria":"OFICINA","prefixo":"4224","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"C12","guid":"29d3ebe6-3f98-2b56-ce22-5a6ee3959c2d","categoria":"OFICINA","prefixo":"3263","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"C13","guid":"efb34bc0-1d42-eba6-f10f-954103d8e554","categoria":"OFICINA","prefixo":"2514","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"C14","guid":"f9c5da83-956c-f8a9-d3ac-8f6d96e3fd34","categoria":"OFICINA","prefixo":"3139","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"C15","guid":"c3d5bac0-6c74-eff5-7d1c-d6b2f10a05ba","categoria":"OFICINA","prefixo":"4196","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"C16","guid":"50ab2c78-7757-430f-8f59-e8f2f0fbbcfb","categoria":"OFICINA","prefixo":"4222","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"C17","guid":"b88eb062-7f17-46ff-f739-6a53f296137a","categoria":"OFICINA","prefixo":"2426","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"C18","guid":"2c30c120-cd53-9bc1-c48b-8cd6146c9948","categoria":"OFICINA","prefixo":"4209","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"C19","guid":"913d4f28-7ef4-71e0-37f6-26cb0f35279d","categoria":"OFICINA","prefixo":"3271","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"C20","guid":"2ed2f79c-fedf-d358-52d5-cea3aca0feda","categoria":"OFICINA","prefixo":"4193","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"D12","guid":"5c569aaa-9de0-8672-1369-69f4003f81e4","categoria":"OFICINA","prefixo":"3100","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"D13","guid":"0c84e899-18ac-d5d9-d56e-9dfab3806847","categoria":"OFICINA","prefixo":"2623","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"LIMPADOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"F12","guid":"c6e64d7e-5f0f-0849-bbd4-c1df608d9040","categoria":"OFICINA","prefixo":"4217","consorciada":null,"sub_tipo":"Borracharia","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"F13","guid":"d1f63a33-3e99-eea2-8ee3-13b1c1e5b6e8","categoria":"OFICINA","prefixo":"4221","consorciada":null,"sub_tipo":"Borracharia","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G12","guid":"ce4c1576-0182-4566-7651-9dc9fd2e43dc","categoria":"OFICINA","prefixo":"3206","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"FUNILARIA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G13","guid":"82b4282e-9318-b263-21a4-851b9c8b51c7","categoria":"OFICINA","prefixo":"2713","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"BANCO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G14","guid":"d981bbb4-2d2e-1edc-ad59-ebf63c52db86","categoria":"OFICINA","prefixo":"4227","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"PARACHOQUE","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"J12","guid":"3d4653f5-9831-5491-de41-9701ab979c85","categoria":"OFICINA","prefixo":"23","consorciada":null,"sub_tipo":"Bilhetagem","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"C23","guid":"5b5f8f58-7140-04ff-4d4b-2b9900273e02","categoria":"REFORCO","prefixo":"4253","consorciada":null,"sub_tipo":null,"horario_reforco":"07:15 - A","motivo":"LUBRIFICAÇÃO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":1,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"H23","guid":"e0adbf15-949e-50a9-5ba6-4118fd8f0432","categoria":"REFORCO","prefixo":"4015","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - C","motivo":"TROCA DE ÓLEO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":7,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"C24","guid":"f50935b7-d84e-4096-1c80-2b4495801568","categoria":"REFORCO","prefixo":"4181","consorciada":null,"sub_tipo":null,"horario_reforco":"07:15 - A","motivo":"LUBRIFICAÇÃO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":2,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"H24","guid":"b024c335-8b09-000e-53c9-d309802049bc","categoria":"REFORCO","prefixo":"4222","consorciada":null,"sub_tipo":null,"horario_reforco":"07:45 - C","motivo":"TROCA DE ÓLEO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":8,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"C25","guid":"726b1362-db51-5c6d-4c5a-9a2178c4c642","categoria":"REFORCO","prefixo":"4197","consorciada":null,"sub_tipo":null,"horario_reforco":"07:32 - A","motivo":"LUBRIFICAÇÃO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":3,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"C26","guid":"41463993-c34e-cd54-dd3d-2af4ce8651b6","categoria":"REFORCO","prefixo":"4274","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - A","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":4,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"C27","guid":"6cd79ec2-a5d4-a078-098c-813d92442080","categoria":"REFORCO","prefixo":"4267","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - M","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":5,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"C28","guid":"c0103854-dc86-4de0-c5ff-afaec5aafef8","categoria":"REFORCO","prefixo":"3252","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - A","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":6,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"J24","guid":"de672aa4-882e-bfa5-a0f5-e5507cc433b8","categoria":"REFORCO","prefixo":"4267","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":2,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"J25","guid":"7830f797-9f42-84d9-6cbf-4401d3360826","categoria":"REFORCO","prefixo":"4274","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":3,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"J26","guid":"8cc648e1-c75d-0f65-dd0d-3032d3e44328","categoria":"REFORCO","prefixo":"3252","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":4,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A35","guid":"660370a8-7011-f298-27e5-326657068dc5","categoria":"BLOQUEADO","prefixo":"2424","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-03"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A36","guid":"f1a4388b-69b2-5620-5e59-a960bd462e6f","categoria":"BLOQUEADO","prefixo":"2600","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"ELÉTRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-01-06"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A37","guid":"f84a9179-90bc-d224-209c-91f1a7f7c820","categoria":"BLOQUEADO","prefixo":"2800","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-01-03"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A38","guid":"7a74ec25-9a8a-2fcf-9e16-fa37c03a8773","categoria":"BLOQUEADO","prefixo":"2611","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-25"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A39","guid":"b7c6a54c-9edd-5d2e-813c-fd4e9dd8872b","categoria":"BLOQUEADO","prefixo":"2327","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G35","guid":"32cb3ad6-839d-6172-b40f-a0cb9c60dee4","categoria":"BLOQUEADO","prefixo":"4199","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-05-03"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G36","guid":"2828f4ae-81ab-2056-275e-be3409f53172","categoria":"BLOQUEADO","prefixo":"4200","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"TRANSMISSÃO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G37","guid":"8b54765b-d263-c703-7f6a-1057e3a0330a","categoria":"BLOQUEADO","prefixo":"4201","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MECANICA PASTILHS E DISCO DE FREIO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-28"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G38","guid":"f92e4595-f3ff-54c9-1f85-3d771b111e5d","categoria":"BLOQUEADO","prefixo":"4190","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"VIDRO BOLHA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-20"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G39","guid":"04c194a9-c9b4-3cd5-465f-8582cd03534f","categoria":"BLOQUEADO","prefixo":"4255","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-24"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G40","guid":"802a867f-2783-464c-8a18-4c3266192ad7","categoria":"BLOQUEADO","prefixo":"4196","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-27"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G41","guid":"715be3eb-95f8-a557-84a8-19ee4636337d","categoria":"BLOQUEADO","prefixo":"4230","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"CABEÇOTE DO MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-18"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G42","guid":"11ac3f9e-ae4f-f6bb-6d28-2500dd3767ec","categoria":"BLOQUEADO","prefixo":"4257","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-21"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G43","guid":"5e247fae-e34f-0e0c-b96f-89db2d8d9e3d","categoria":"BLOQUEADO","prefixo":"4194","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G44","guid":"18c3a24f-d854-682a-543c-23033d5c0854","categoria":"BLOQUEADO","prefixo":"4212","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-27"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G45","guid":"3f732b60-6f42-4ef6-3da5-ae0220b6a711","categoria":"BLOQUEADO","prefixo":"4275","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-28"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A48","guid":"94502839-132a-ca80-a38a-782c0019c1e1","categoria":"BLOQUEADO","prefixo":"3005","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"SUSPENSÃO ","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A49","guid":"2e02fe27-ad77-12de-b976-959552f54455","categoria":"BLOQUEADO","prefixo":"3133","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-01"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A50","guid":"46d59e22-f282-b6d2-5c79-6733dce073d6","categoria":"BLOQUEADO","prefixo":"3006","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-06-30"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A51","guid":"6bf13922-ff87-5467-22dd-045ec4127bac","categoria":"BLOQUEADO","prefixo":"3279","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-29"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A52","guid":"49faf212-5614-8464-bec0-20ec49a34b81","categoria":"BLOQUEADO","prefixo":"3263","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-29"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A53","guid":"fb819a60-71bf-6615-fadc-90cebe3b482a","categoria":"BLOQUEADO","prefixo":"3214","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"PANE ELETRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A54","guid":"53ff827f-2b61-74b9-e7f4-1559cc1363c0","categoria":"BLOQUEADO","prefixo":"3106","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-24"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A55","guid":"59db0cf7-c5f2-b8a4-5e4e-6178ab71e669","categoria":"BLOQUEADO","prefixo":"3267","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A56","guid":"a10e2d41-9410-3260-c907-d5ad7de72daa","categoria":"BLOQUEADO","prefixo":"3269","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A57","guid":"ccb98a5c-e8a8-4946-29df-abdbe8953304","categoria":"BLOQUEADO","prefixo":"3261","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A58","guid":"b5188749-e6bc-7abb-c886-00f251162a0f","categoria":"BLOQUEADO","prefixo":"3951","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"A59","guid":"73a33a7c-3451-a1ab-546e-ccb629e45aee","categoria":"BLOQUEADO","prefixo":"3959","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-22"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G48","guid":"063b6564-e553-8c11-78dc-d45aeef60b3c","categoria":"BLOQUEADO","prefixo":"1119","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2020-12-18"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G50","guid":"1b06e147-7f91-d73b-c3a2-e83dfd76fea7","categoria":"BLOQUEADO","prefixo":"1323","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-12-07"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G51","guid":"381a3e7e-56bd-8fa8-abee-0392d5a789eb","categoria":"BLOQUEADO","prefixo":"1322","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"REVISÂO GERAL","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"G52","guid":"58bc8582-8ade-172c-bdc5-965917083e51","categoria":"BLOQUEADO","prefixo":"3083","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"FORA DE OPERAÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-DIA {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","sha256":"1267d0c3346bea5196ae4f1d5a3af99be3be95645bbb8c29abd3277cdd23e062","counts":[10,26,9,3,4,14,11,4],"title_original":"INSPEÇÂO","title":"INSPEÇÃO","oficina":{"Mecânica":8,"Elevador":9,"Elétrica":3,"Borracharia":2,"Funilaria / Pintura":3,"Bilhetagem":1}}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A6","guid":"d1b76123-a248-565d-72e4-dfa342b49148","categoria":"PREVENTIVA","prefixo":"3904","consorciada":null,"sub_tipo":"Preventiva","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"B6","guid":"85892568-9882-196e-2ab9-05da80a5ce55","categoria":"PREVENTIVA","prefixo":"4258","consorciada":null,"sub_tipo":"Preventiva","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A7","guid":"15f95fd8-d7cd-1c8f-95a6-0979f152a81f","categoria":"PREVENTIVA","prefixo":"3902","consorciada":null,"sub_tipo":"Preventiva","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"E6","guid":"eff79907-6661-9f9c-4d48-ff68c0c33dd2","categoria":"PREVENTIVA","prefixo":"4253","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"F6","guid":"4ea59d9b-366f-94bb-34bb-b4df3a789dd4","categoria":"PREVENTIVA","prefixo":"4184","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"E7","guid":"d7560ff3-d27e-4297-ae71-42057daf85cd","categoria":"PREVENTIVA","prefixo":"4015","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"F7","guid":"97979a2d-cb0b-d590-a759-d547c069f8c1","categoria":"PREVENTIVA","prefixo":"4264","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"E8","guid":"391b4cd7-a853-47e7-5ea3-809b68119c94","categoria":"PREVENTIVA","prefixo":"4188","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G6","guid":"5a86e1ce-9f83-7f27-74bd-67c74d4b61ce","categoria":"PREVENTIVA","prefixo":"4235","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G8","guid":"3205bfba-9709-3c14-6f4d-abccff3cf662","categoria":"PREVENTIVA","prefixo":"4231","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A12","guid":"8b4e808c-afd7-6fda-2296-97044978a6c1","categoria":"OFICINA","prefixo":"2704","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"BOMBA ARLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A13","guid":"4ff3fd86-3324-9f6f-03d6-f788ab52c02a","categoria":"OFICINA","prefixo":"3222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A14","guid":"d29179f3-529e-404a-aa87-102636b106be","categoria":"OFICINA","prefixo":"4244","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"M DE EIXO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A15","guid":"bf93f4f4-0b5d-d495-4c31-a4b99881baff","categoria":"OFICINA","prefixo":"4222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A16","guid":"a3b3e305-a9bb-a594-4354-7c691464d9d5","categoria":"OFICINA","prefixo":"4197","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A17","guid":"c7e456c1-d124-b5d7-d04a-f5bfd1d8b7a0","categoria":"OFICINA","prefixo":"4225","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A18","guid":"17dfb63a-0d17-e5b2-5b71-466920f3ff2b","categoria":"OFICINA","prefixo":"2425","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"VAZ OLEO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A20","guid":"034c9fe1-0994-eb78-72d7-dab74b6b9507","categoria":"OFICINA","prefixo":"4224","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"C12","guid":"b2de580c-d580-08bb-91e8-155d617e020f","categoria":"OFICINA","prefixo":"3263","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"C13","guid":"0511acf5-b484-001b-6527-edcf11f79bfe","categoria":"OFICINA","prefixo":"2514","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"C14","guid":"efd3873d-c51d-b603-b632-0db8c65c12cd","categoria":"OFICINA","prefixo":"3139","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"C15","guid":"a754ee89-61e1-de12-633b-a71072f07311","categoria":"OFICINA","prefixo":"4196","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"C16","guid":"7f5072a1-6d62-f39f-3b7a-072413b8d519","categoria":"OFICINA","prefixo":"4222","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"C17","guid":"87d92114-5372-9229-e560-8d678f095efb","categoria":"OFICINA","prefixo":"2426","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"C18","guid":"09b8a9c9-157a-1d6b-e48b-2004fe504d08","categoria":"OFICINA","prefixo":"4209","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"C19","guid":"c85ef5c3-2d31-c299-a8d2-52706f503a88","categoria":"OFICINA","prefixo":"3271","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"C20","guid":"725b9c4a-7252-0d53-c3c2-591e6c4ad0ee","categoria":"OFICINA","prefixo":"4193","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"D12","guid":"a9ed6610-85b0-e5e5-5dc4-abbd010291c5","categoria":"OFICINA","prefixo":"3100","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"D13","guid":"3ed679b8-d32b-22b4-e193-6331a8887f36","categoria":"OFICINA","prefixo":"2623","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"LIMPADOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"D14","guid":"fd148de9-fceb-46d3-fa21-79dce180920b","categoria":"OFICINA","prefixo":"4189","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"limpa","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"F12","guid":"84737d47-e994-52a5-31fc-e49f48cb6964","categoria":"OFICINA","prefixo":"4228","consorciada":null,"sub_tipo":"Borracharia","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"F13","guid":"c6b4f7e6-bfc5-5f4b-47be-580239f8ebdf","categoria":"OFICINA","prefixo":"2325","consorciada":null,"sub_tipo":"Borracharia","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G12","guid":"9480f97b-140d-2949-7a94-59a94589ebbb","categoria":"OFICINA","prefixo":"3147","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"BANCO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G13","guid":"5dc0ae57-9b68-5ed8-275d-39e3a14c10bc","categoria":"OFICINA","prefixo":"3900","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"INFITRAÇAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G14","guid":"86297a12-d6e5-17e4-311e-5ef1d2150a6a","categoria":"OFICINA","prefixo":"4227","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"PARACHOQUE","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"J12","guid":"800b9876-3f51-317d-35d6-fde7760bdf11","categoria":"OFICINA","prefixo":"23","consorciada":null,"sub_tipo":"Bilhetagem","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"C23","guid":"d20c0a24-419f-f619-253d-f67def8ae480","categoria":"REFORCO","prefixo":"4253","consorciada":null,"sub_tipo":null,"horario_reforco":"07:15 - A","motivo":"LUBRIFICAÇÃO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":1,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"H23","guid":"aa39f413-880a-960b-3673-5805a20156c0","categoria":"REFORCO","prefixo":"4015","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - C","motivo":"TROCA DE ÓLEO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":7,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"C24","guid":"150a5c4a-c0f8-de4c-8b74-667dd3544fdf","categoria":"REFORCO","prefixo":"4015","consorciada":null,"sub_tipo":null,"horario_reforco":"07:15 - A","motivo":"LUBRIFICAÇÃO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":2,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"H24","guid":"a711b3ad-1835-b94f-df0b-647894e16272","categoria":"REFORCO","prefixo":"4184","consorciada":null,"sub_tipo":null,"horario_reforco":"07:45 - C","motivo":"TROCA DE ÓLEO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":8,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"C25","guid":"330d4e85-7604-0683-bdb5-8e8e96f1826f","categoria":"REFORCO","prefixo":"4188","consorciada":null,"sub_tipo":null,"horario_reforco":"07:32 - A","motivo":"LUBRIFICAÇÃO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":3,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"H25","guid":"5f6639ea-4fd7-09fb-9def-5507b46831cd","categoria":"REFORCO","prefixo":"4264","consorciada":null,"sub_tipo":null,"horario_reforco":"07:45 - A","motivo":"TROCA DE ÓLEO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":9,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"C26","guid":"d879af70-874b-eb4e-02ec-a856e4786eab","categoria":"REFORCO","prefixo":"3257","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - A","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":4,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"H26","guid":"6999828e-ed3c-31a9-8e39-619e927d71fa","categoria":"REFORCO","prefixo":"3902","consorciada":null,"sub_tipo":null,"horario_reforco":"07:50 - C","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":10,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"C27","guid":"39c2344d-8e8f-4b5d-aa53-264b86ab6336","categoria":"REFORCO","prefixo":"4267","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - M","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":5,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"J24","guid":"8fe52464-d0c2-7c87-4e00-71def5d73a22","categoria":"REFORCO","prefixo":"4267","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":2,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"J25","guid":"cef92b26-82c6-6312-49fa-ac3b81694401","categoria":"REFORCO","prefixo":"3257","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":3,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"J26","guid":"37ffb3f6-3189-016c-16ee-dd9ed9bc9411","categoria":"REFORCO","prefixo":"3902","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":4,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A35","guid":"c79cd40f-c842-f957-86e2-11dca11d1181","categoria":"BLOQUEADO","prefixo":"2424","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-03"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A36","guid":"5cfad59f-9bcc-4886-8b45-8a2209f4ca86","categoria":"BLOQUEADO","prefixo":"2600","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"ELÉTRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-01-06"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A37","guid":"147107bc-75a7-9c23-a5de-643af7cc25db","categoria":"BLOQUEADO","prefixo":"2800","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-01-03"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A38","guid":"fa2f0107-d3da-d64b-9f53-f63e97573bb3","categoria":"BLOQUEADO","prefixo":"2611","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-25"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G35","guid":"085fee80-eee5-5488-e563-5deb028292a6","categoria":"BLOQUEADO","prefixo":"4199","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-05-03"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G36","guid":"e8263a7c-4c15-3c4e-fdde-27c9699d818f","categoria":"BLOQUEADO","prefixo":"4200","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"TRANSMISSÃO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G37","guid":"89b89a2f-fbff-d876-9e5c-d0ab9f8e1a78","categoria":"BLOQUEADO","prefixo":"4201","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MECANICA PASTILHS E DISCO DE FREIO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-28"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G38","guid":"2996d623-dc05-a6a3-e2f3-d92dec1a5c19","categoria":"BLOQUEADO","prefixo":"4190","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"VIDRO BOLHA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-20"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G39","guid":"4daf3b4b-a7b0-bbd7-c75b-6f142e0d9dbb","categoria":"BLOQUEADO","prefixo":"4196","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-27"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G40","guid":"a81c6317-a0d9-8f1e-a9dd-d15867485d3d","categoria":"BLOQUEADO","prefixo":"4230","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"CABEÇOTE DO MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-18"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G41","guid":"f60816ec-21bd-8eec-2dc4-db0cc350de7f","categoria":"BLOQUEADO","prefixo":"4255","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-24"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G42","guid":"3b39e9fd-7817-c886-5474-737690a4aa38","categoria":"BLOQUEADO","prefixo":"4211","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"PANE ELETRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G43","guid":"a232cd9b-a6b6-cbb1-6968-0b65f3610a91","categoria":"BLOQUEADO","prefixo":"4225","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"PANE ELETRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G44","guid":"79ccbf71-3153-2320-9fc1-960fbe1c88e8","categoria":"BLOQUEADO","prefixo":"4257","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-21"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G45","guid":"7866abfe-349f-3c1a-9bec-6cb4628d3cf7","categoria":"BLOQUEADO","prefixo":"4274","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"REVISÂO ELEVADOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G46","guid":"d45303b7-1ae2-b024-12dd-7aa9cb82cd01","categoria":"BLOQUEADO","prefixo":"4194","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G47","guid":"7e0c5e59-d318-ab2e-8e89-833112b142c7","categoria":"BLOQUEADO","prefixo":"4212","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-27"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G48","guid":"3a54c4a2-a2a6-979f-3f69-1418bef2e9a5","categoria":"BLOQUEADO","prefixo":"4275","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-28"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A51","guid":"f3094c61-cdc5-4497-9c03-ea299452393d","categoria":"BLOQUEADO","prefixo":"3005","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"SUSPENSÃO ","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A52","guid":"51f21c3e-3edd-f1db-b5c4-0166e37221ef","categoria":"BLOQUEADO","prefixo":"3133","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-01"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A53","guid":"ac2b9c11-fb10-d2f0-7bac-ed4d817880d3","categoria":"BLOQUEADO","prefixo":"3006","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-06-30"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A54","guid":"ed49de01-7d35-8665-ad8d-fc21db0b9ff4","categoria":"BLOQUEADO","prefixo":"3279","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-29"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A55","guid":"9dfa6104-bc10-598f-4578-07a4554be3b5","categoria":"BLOQUEADO","prefixo":"3263","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-29"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A56","guid":"ebed541c-cabe-ee58-d463-a82e126d201b","categoria":"BLOQUEADO","prefixo":"3106","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-24"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A57","guid":"9546890e-0213-52fa-bb0d-e4b840e2022e","categoria":"BLOQUEADO","prefixo":"3099","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A58","guid":"444de40c-d36a-46bf-63c4-c3b716e61b78","categoria":"BLOQUEADO","prefixo":"3252","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOLEJO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A59","guid":"cfcaeff5-4789-6a2e-209e-f74b4e18ff80","categoria":"BLOQUEADO","prefixo":"3267","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A60","guid":"ccc2730d-bf93-6779-7301-b2fadca664fa","categoria":"BLOQUEADO","prefixo":"3269","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"A61","guid":"c46106da-38d3-fd03-e590-8ce6348569d7","categoria":"BLOQUEADO","prefixo":"3951","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G51","guid":"b520e495-3aa8-c00b-65cb-9c1d82292cc4","categoria":"BLOQUEADO","prefixo":"1119","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2020-12-18"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G52","guid":"0131656c-d462-dd03-fc88-a3af6519e7d1","categoria":"BLOQUEADO","prefixo":"3083","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"FORA DE OPERAÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G53","guid":"d6e1fac2-bf60-4fb6-1f05-6b7c7a69a7c9","categoria":"BLOQUEADO","prefixo":"1323","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-12-07"}
-- AUDIT-ITEM {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"G54","guid":"bc3abfdd-44ee-6c9b-2729-defd303b2b6c","categoria":"BLOQUEADO","prefixo":"1322","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"REVISÂO GERAL","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-DIA {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","sha256":"15abcd16ced80bc9db6529009a34c360fc28c0bfba765642b600708f2e539501","counts":[0,23,0,2,5,17,11,4],"title_original":"INSPEÇÂO","title":"INSPEÇÃO","oficina":{"Mecânica":8,"Elevador":9,"Elétrica":3,"Funilaria / Pintura":2,"Bilhetagem":1}}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A12","guid":"7fb6ada8-f6f7-4a2b-4283-0c563357cde9","categoria":"OFICINA","prefixo":"2704","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"BOMBA ARLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A13","guid":"d2f656fc-1a3c-6fc9-255b-d4c4dbf45de4","categoria":"OFICINA","prefixo":"3222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A14","guid":"00ece86a-8e14-2473-f621-0f44739b124f","categoria":"OFICINA","prefixo":"4244","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"M DE EIXO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A15","guid":"1398cb29-8a26-ae04-67c2-feecca97e7d1","categoria":"OFICINA","prefixo":"4222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A16","guid":"6c31a251-f326-7695-4087-b9dd4f341961","categoria":"OFICINA","prefixo":"4197","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A17","guid":"571f97be-def7-75b4-3822-16ec48cf1623","categoria":"OFICINA","prefixo":"4225","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A18","guid":"6db2c53b-3da0-ca96-2fef-b262eb281d4c","categoria":"OFICINA","prefixo":"2425","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"VAZ OLEO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A20","guid":"12043cef-3e2f-d65e-8c78-fc39ada0fea9","categoria":"OFICINA","prefixo":"4224","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"C12","guid":"8e239ed4-cd76-4dc4-7c59-d39aeacd23c7","categoria":"OFICINA","prefixo":"3263","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"C13","guid":"0a550f4b-0d41-8242-15b2-a964447b303a","categoria":"OFICINA","prefixo":"2514","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"C14","guid":"836db6e6-c64e-1604-20f4-5e3179beede5","categoria":"OFICINA","prefixo":"3139","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"C15","guid":"bfa3e516-a436-3ce3-2b31-94f2209ea652","categoria":"OFICINA","prefixo":"4196","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"C16","guid":"f33426c5-6df1-22fc-3557-bd1b55c9a62f","categoria":"OFICINA","prefixo":"4222","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"C17","guid":"71e2eb89-c1de-1b07-98d5-052081a67c02","categoria":"OFICINA","prefixo":"2426","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"C18","guid":"e1940ae1-52b9-392d-7032-cce0ec67948a","categoria":"OFICINA","prefixo":"4209","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"C19","guid":"5dd43a7a-78fa-f1f6-f47c-4622631fe9c3","categoria":"OFICINA","prefixo":"3271","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"C20","guid":"488bfe77-36b1-143e-cff5-14f6ab4276eb","categoria":"OFICINA","prefixo":"4193","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"D12","guid":"eb18f95c-3137-47f5-16db-04b1aae61588","categoria":"OFICINA","prefixo":"3100","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"D13","guid":"7e282f4c-a187-1595-02dc-cd9c0b6cfd11","categoria":"OFICINA","prefixo":"2623","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"LIMPADOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"D14","guid":"85737b33-8b5a-b44c-20fc-ac8fb67ffcfb","categoria":"OFICINA","prefixo":"4189","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"LIMPADOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G12","guid":"3deeeec1-2efe-737d-0ac0-8fe55c40f121","categoria":"OFICINA","prefixo":"3147","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"BANCO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G14","guid":"ace5ec0a-9d74-2316-f880-bc707db02594","categoria":"OFICINA","prefixo":"4227","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"PARACHOQUE","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"J12","guid":"ae9f1f19-3d96-e16a-344c-282860a355c2","categoria":"OFICINA","prefixo":"23","consorciada":null,"sub_tipo":"Bilhetagem","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"J23","guid":"48a9b9f2-8499-876b-6416-1d9ca15f1845","categoria":"REFORCO","prefixo":"3902","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":1,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"J24","guid":"617b5e02-eeda-71c2-7c4a-c4643e344533","categoria":"REFORCO","prefixo":"3904","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":2,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A35","guid":"e3c700f8-3206-d46e-0009-9b49125324c4","categoria":"BLOQUEADO","prefixo":"2424","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-03"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A36","guid":"0fc2eb0b-0cbe-6940-84ec-7ebd6dd0c783","categoria":"BLOQUEADO","prefixo":"2600","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"ELÉTRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-01-06"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A37","guid":"4e0cffc2-00c7-307f-79e1-4c2c77055d7e","categoria":"BLOQUEADO","prefixo":"2800","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-01-03"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A38","guid":"55838c77-d65e-574b-5d9f-e9576015ce5d","categoria":"BLOQUEADO","prefixo":"2611","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-25"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A39","guid":"c8596901-bc62-e7b2-a1da-7ba3558dcd07","categoria":"BLOQUEADO","prefixo":"2352","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G35","guid":"3563d7c6-0245-2fbb-1793-24cc3b3be587","categoria":"BLOQUEADO","prefixo":"4199","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-05-03"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G36","guid":"316da7a4-80c7-fe7d-765d-dc29b1e0a75e","categoria":"BLOQUEADO","prefixo":"4200","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"TRANSMISSÃO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G37","guid":"17c0299d-89d2-e33d-64ba-4dc9f7603913","categoria":"BLOQUEADO","prefixo":"4201","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MECANICA PASTILHS E DISCO DE FREIO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-28"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G38","guid":"745344f3-8212-d6b9-d96a-7318eff5a1ff","categoria":"BLOQUEADO","prefixo":"4190","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"VIDRO BOLHA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-20"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G39","guid":"d36a8931-cf48-d5ef-d8c5-5a132dd2c50f","categoria":"BLOQUEADO","prefixo":"4196","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-27"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G40","guid":"a7a7f41d-4e5d-db3f-4d19-12c2bd4fbe6d","categoria":"BLOQUEADO","prefixo":"4255","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-24"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G41","guid":"5075c507-3dd8-4d13-b548-91c6ca2a07bb","categoria":"BLOQUEADO","prefixo":"4211","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"PANE ELETRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G42","guid":"63a4c895-06e1-19c3-a53d-131a2e60f6d6","categoria":"BLOQUEADO","prefixo":"4225","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"PANE ELETRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G43","guid":"22c70da6-9009-a47d-5493-b63923b9951e","categoria":"BLOQUEADO","prefixo":"4234","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"TACOGRAFO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G44","guid":"b670f509-54a7-0f17-5d7f-f5547025ccbd","categoria":"BLOQUEADO","prefixo":"4248","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"AR E EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G45","guid":"0637cc09-4333-e163-e600-4a48ec3e266d","categoria":"BLOQUEADO","prefixo":"4257","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-21"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G46","guid":"5e6dca8e-7a13-02a5-daac-23e3ce5bf13b","categoria":"BLOQUEADO","prefixo":"4274","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"ISPEÇAO A PEDIDO DA GERENCIA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G47","guid":"311e59b2-bded-3454-e6d6-f79723845291","categoria":"BLOQUEADO","prefixo":"4194","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G48","guid":"3c5175dc-6a4e-fe30-18ae-0e556d2fb005","categoria":"BLOQUEADO","prefixo":"4272","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"ELETRICA FAROL","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G49","guid":"67cbc06c-b262-15e7-fe5c-5b2da646b5af","categoria":"BLOQUEADO","prefixo":"4182","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"PINTURA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G50","guid":"b656cc29-2d96-c5c3-a9c9-0bb3c7caa2f1","categoria":"BLOQUEADO","prefixo":"4212","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-27"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G51","guid":"7fadad67-a28c-c519-acd3-08a1f147c8b7","categoria":"BLOQUEADO","prefixo":"4275","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-28"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A54","guid":"2dbdf68c-3462-b4f9-da4e-fd9c480ff148","categoria":"BLOQUEADO","prefixo":"3005","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"SUSPENSÃO ","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A55","guid":"944d5083-f568-012e-67e0-9516c8754c4f","categoria":"BLOQUEADO","prefixo":"3133","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-01"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A56","guid":"37042362-9ba9-56be-6634-af0916e25f4e","categoria":"BLOQUEADO","prefixo":"3006","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-06-30"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A57","guid":"57da1fde-1153-4ffa-e3f8-8a0bbd20165b","categoria":"BLOQUEADO","prefixo":"3252","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A58","guid":"f7c2a613-7bde-5291-36f8-2995e0a6f301","categoria":"BLOQUEADO","prefixo":"3263","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-29"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A59","guid":"c995cc65-82a5-205f-abff-7221079dc9ad","categoria":"BLOQUEADO","prefixo":"3279","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A60","guid":"13d6cdcf-6c32-311e-a6d9-13ab38c5c0f8","categoria":"BLOQUEADO","prefixo":"3257","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A61","guid":"443d3093-5a21-6a0e-a138-3a27092627cc","categoria":"BLOQUEADO","prefixo":"3106","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-24"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A62","guid":"cd0700c2-37bc-00da-e0a7-361aa09fdf72","categoria":"BLOQUEADO","prefixo":"3099","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A63","guid":"343ad712-cd6e-55c9-c901-e1a15468ff93","categoria":"BLOQUEADO","prefixo":"3208","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"FREIO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"A64","guid":"5d5b4c6c-889b-eae0-40a6-87ee4c798dca","categoria":"BLOQUEADO","prefixo":"3267","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G54","guid":"0ac1aa5a-c17f-5ad8-f1c4-555cca0a9952","categoria":"BLOQUEADO","prefixo":"1119","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2020-12-18"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G55","guid":"85517927-583b-b7cf-c378-9688789e26fd","categoria":"BLOQUEADO","prefixo":"3083","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"FORA DE OPERAÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G56","guid":"4d7c9623-d1b3-0c08-5af6-62ef63668f6b","categoria":"BLOQUEADO","prefixo":"1323","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-12-07"}
-- AUDIT-ITEM {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"G57","guid":"791465e8-d143-1190-1fdd-ec5eb09e5c4e","categoria":"BLOQUEADO","prefixo":"1322","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"REVISÂO GERAL","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-DIA {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","sha256":"6b6e9f2b5cd834b72224f59d0140db14a7db19fb56271a7765a6e18b6d2ab023","counts":[0,23,0,2,5,17,11,4],"title_original":"INSPEÇÂO","title":"INSPEÇÃO","oficina":{"Mecânica":8,"Elevador":9,"Elétrica":3,"Funilaria / Pintura":2,"Bilhetagem":1}}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A12","guid":"b6eae899-90e3-3c24-e6d4-c2e5750d95b0","categoria":"OFICINA","prefixo":"2704","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"BOMBA ARLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A13","guid":"3b5c7ca6-7899-197d-3a31-99fd3790512e","categoria":"OFICINA","prefixo":"3222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A14","guid":"0e7c669e-4a5e-f450-7c93-0979dd518b94","categoria":"OFICINA","prefixo":"4244","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"M DE EIXO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A15","guid":"507b9103-b22a-6842-45b1-2c872e539024","categoria":"OFICINA","prefixo":"4222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A16","guid":"056d520c-66f5-2017-3c81-8e159f0d7f88","categoria":"OFICINA","prefixo":"4197","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A17","guid":"0499bf8d-777c-8bd1-34e6-b8f53b1b71fa","categoria":"OFICINA","prefixo":"4225","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A18","guid":"94aad291-9f24-ec9d-7ce3-30be2f82e4d2","categoria":"OFICINA","prefixo":"2425","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"VAZ OLEO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A20","guid":"fd6a7fe9-21f2-c618-131d-0b555aa8b1a3","categoria":"OFICINA","prefixo":"4224","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"C12","guid":"7f42d1ea-4802-e200-0a6f-c782a1a42ff0","categoria":"OFICINA","prefixo":"3263","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"C13","guid":"6db5bd21-3548-4abd-5a7e-ad94edc5bb1b","categoria":"OFICINA","prefixo":"2514","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"C14","guid":"796020d2-3590-e20f-65b5-9218ab1c5e36","categoria":"OFICINA","prefixo":"3139","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"C15","guid":"6cbf0d39-b039-2d8e-856b-7ce83f5e32a7","categoria":"OFICINA","prefixo":"4196","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"C16","guid":"3fa2d72f-fc28-0c45-3e09-b5ebbfe808df","categoria":"OFICINA","prefixo":"4222","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"C17","guid":"fbb2f04e-af14-5a60-1a6f-9ecfb43074b1","categoria":"OFICINA","prefixo":"2426","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"C18","guid":"4b17c201-7d36-6eda-7e15-744184bf1735","categoria":"OFICINA","prefixo":"4209","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"C19","guid":"a4e104f8-fce7-c571-ddbb-4b40473353c5","categoria":"OFICINA","prefixo":"3271","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"C20","guid":"f0353df4-4d0e-c3a1-fbe7-eac9988ed76b","categoria":"OFICINA","prefixo":"4193","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"D12","guid":"7befb838-8bd1-19e7-2981-c67349b0e5ad","categoria":"OFICINA","prefixo":"3100","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"D13","guid":"787bf057-55db-dd4e-3e44-ffd7b9fca627","categoria":"OFICINA","prefixo":"2623","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"LIMPADOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"D14","guid":"57f257c9-f036-060c-61a9-5a29395ecc21","categoria":"OFICINA","prefixo":"4189","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"LIMPADOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G12","guid":"e35645a0-56de-1c30-800e-5ac0afeca645","categoria":"OFICINA","prefixo":"3147","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"BANCO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G14","guid":"682bf278-28b3-7fb5-f21c-d8db7653cb3a","categoria":"OFICINA","prefixo":"4227","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"PARACHOQUE","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"J12","guid":"cde6a64f-4696-ccdc-516c-5289a21fb2be","categoria":"OFICINA","prefixo":"23","consorciada":null,"sub_tipo":"Bilhetagem","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"J23","guid":"cd59f9ea-bc2e-4784-bd62-1cdb417e1f4f","categoria":"REFORCO","prefixo":"3902","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":1,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"J24","guid":"800d1346-0b4f-f08e-aeec-377098e3fcdd","categoria":"REFORCO","prefixo":"3904","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":2,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A35","guid":"4f6b206a-862a-64a5-78c0-d40aa5f0dd7e","categoria":"BLOQUEADO","prefixo":"2424","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-03"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A36","guid":"eeb32557-3acf-2791-6a2f-40ae0b4d5f7b","categoria":"BLOQUEADO","prefixo":"2600","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"ELÉTRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-01-06"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A37","guid":"46f6f117-dd53-6862-2d50-5abfa13ce0b2","categoria":"BLOQUEADO","prefixo":"2800","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-01-03"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A38","guid":"29b252d3-f9df-6d33-cfe3-4b3000fefe54","categoria":"BLOQUEADO","prefixo":"2611","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-25"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A39","guid":"ef5480dc-c65f-79f0-a74d-32f5477ab2ab","categoria":"BLOQUEADO","prefixo":"2352","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G35","guid":"1e55dd8e-ca39-1ec9-0147-5b74509e733a","categoria":"BLOQUEADO","prefixo":"4199","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-05-03"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G36","guid":"587a08fd-6a89-4984-91b3-cfaf98716766","categoria":"BLOQUEADO","prefixo":"4200","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"TRANSMISSÃO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G37","guid":"f6384a53-37ec-8eba-aac1-a326dd93fed2","categoria":"BLOQUEADO","prefixo":"4201","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MECANICA PASTILHS E DISCO DE FREIO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-28"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G38","guid":"45d9e4e6-4271-0e23-fe6e-8fb49aa69a2f","categoria":"BLOQUEADO","prefixo":"4190","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"VIDRO BOLHA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-20"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G39","guid":"3fc0d013-d349-6410-5bc0-86f637757492","categoria":"BLOQUEADO","prefixo":"4196","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-27"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G40","guid":"1a984871-f166-8d93-a1b5-26312145a5ae","categoria":"BLOQUEADO","prefixo":"4255","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-24"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G41","guid":"2a2f3213-2557-3627-fb7c-fd0584823a74","categoria":"BLOQUEADO","prefixo":"4211","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"PANE ELETRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G42","guid":"fda6cd1b-64bc-60ba-320c-6d2273a27f52","categoria":"BLOQUEADO","prefixo":"4225","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"PANE ELETRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G43","guid":"c54ff18c-c930-de8e-3bb6-52c7ed5e402d","categoria":"BLOQUEADO","prefixo":"4234","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"TACOGRAFO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G44","guid":"8fcb7421-ca8f-f44d-3bbf-3ff50670ee13","categoria":"BLOQUEADO","prefixo":"4248","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"AR E EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G45","guid":"a78982b6-3d94-4f8e-8b83-c4b683ea1cbe","categoria":"BLOQUEADO","prefixo":"4257","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-21"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G46","guid":"7c6a0f95-e8fa-2345-23c1-04e4eb7a592d","categoria":"BLOQUEADO","prefixo":"4274","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"ISPEÇAO A PEDIDO DA GERENCIA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G47","guid":"a35d658f-24c5-da9d-d45a-99032758c461","categoria":"BLOQUEADO","prefixo":"4194","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G48","guid":"427acd16-f588-ff9b-4dc1-56f8960aa393","categoria":"BLOQUEADO","prefixo":"4272","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"ELETRICA FAROL","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G49","guid":"9aeffd0a-886e-02cb-4117-6bd8f9598643","categoria":"BLOQUEADO","prefixo":"4182","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"PINTURA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G50","guid":"cb5b9f0d-77a9-3f80-6ca7-e5f3d354c95d","categoria":"BLOQUEADO","prefixo":"4212","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-27"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G51","guid":"5ff85a5b-91db-d51e-d137-d6e44bafdf23","categoria":"BLOQUEADO","prefixo":"4275","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-28"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A54","guid":"6ec577ae-c3bf-4929-d01e-191f5173374f","categoria":"BLOQUEADO","prefixo":"3005","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"SUSPENSÃO ","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A55","guid":"a38e1f7d-2ebf-4c5a-42dd-3e7a294fcbef","categoria":"BLOQUEADO","prefixo":"3133","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-01"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A56","guid":"5ae464b5-c5d1-2313-7542-6be5601755c6","categoria":"BLOQUEADO","prefixo":"3006","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-06-30"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A57","guid":"c9c4a333-3417-6c50-5425-1a7486f806cc","categoria":"BLOQUEADO","prefixo":"3252","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A58","guid":"e4040497-de73-18c9-65ec-bafc8db2ed28","categoria":"BLOQUEADO","prefixo":"3263","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-29"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A59","guid":"00ef90a9-13fa-7c2e-ba8c-e82fb5da33ee","categoria":"BLOQUEADO","prefixo":"3279","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A60","guid":"ec4b17b2-1bdf-6fb4-4237-162f67565824","categoria":"BLOQUEADO","prefixo":"3257","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A61","guid":"ed8ea0f7-7d56-5419-582d-5a4e6ed1381c","categoria":"BLOQUEADO","prefixo":"3106","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-24"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A62","guid":"0529c3ee-e11a-97ce-9613-b70cdd0b8b3e","categoria":"BLOQUEADO","prefixo":"3099","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A63","guid":"87358aaf-030c-68bb-b7ff-6be72a38b65c","categoria":"BLOQUEADO","prefixo":"3208","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"FREIO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"A64","guid":"b43f2a95-796e-2b61-70d6-a586b81f7fe2","categoria":"BLOQUEADO","prefixo":"3267","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G54","guid":"9d3b13aa-9fdd-f670-926a-d2a3c388bbfe","categoria":"BLOQUEADO","prefixo":"1119","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2020-12-18"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G55","guid":"953a4f07-58ff-2771-e0e1-ace107135ac3","categoria":"BLOQUEADO","prefixo":"3083","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"FORA DE OPERAÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G56","guid":"27439ce0-8aa9-95af-c83e-7418f87acefc","categoria":"BLOQUEADO","prefixo":"1323","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-12-07"}
-- AUDIT-ITEM {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"G57","guid":"60987108-fbb0-cbcd-c2ff-af142f173a25","categoria":"BLOQUEADO","prefixo":"1322","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"REVISÂO GERAL","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-DIA {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","sha256":"d12753ed10e1bffd6fb1bc5700353339d50c7408f8ccf89c58a33e0e0960a3a7","counts":[6,31,10,4,4,12,11,4],"title_original":"INSPEÇÂO","title":"INSPEÇÃO","oficina":{"Mecânica":9,"Elevador":9,"Elétrica":3,"Borracharia":2,"Funilaria / Pintura":2,"Tacógrafo":5,"Bilhetagem":1}}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"D6","guid":"4ea2cbdd-ff20-0565-f08a-1936deed3816","categoria":"PREVENTIVA","prefixo":"4224","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"D7","guid":"065095f6-64f6-5e96-46c0-cb59288d25b9","categoria":"PREVENTIVA","prefixo":"4217","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"D8","guid":"decf56f2-47bf-fe7a-8d3e-da15c55340ad","categoria":"PREVENTIVA","prefixo":"4213","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G6","guid":"9a9d89cc-1335-70c3-a0b2-195f98af3c34","categoria":"PREVENTIVA","prefixo":"4192","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G7","guid":"f15ba98a-be5c-88c0-be71-6aa5dd3af365","categoria":"PREVENTIVA","prefixo":"4018","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G8","guid":"4dc688b4-ec9d-3041-1c29-a67143a83c4e","categoria":"PREVENTIVA","prefixo":"4191","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A12","guid":"926748e9-18f2-e374-3bac-8d0d484d0b13","categoria":"OFICINA","prefixo":"2704","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"BOMBA ARLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A13","guid":"5be4f940-6188-7c19-6f54-458f4665633c","categoria":"OFICINA","prefixo":"3222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A14","guid":"575901b8-f439-8284-ee99-6f4ffc4a54e8","categoria":"OFICINA","prefixo":"4244","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"M DE EIXO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A15","guid":"086f35b3-e747-e276-8c7a-179154937361","categoria":"OFICINA","prefixo":"4222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A16","guid":"27145d73-21e8-1d05-f6ce-6b95feb3b8ea","categoria":"OFICINA","prefixo":"4197","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A17","guid":"dbc4b999-8dcd-017a-5d2f-2bd741b27e30","categoria":"OFICINA","prefixo":"4225","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A18","guid":"0bba33d8-5340-e482-2133-551e59b95288","categoria":"OFICINA","prefixo":"2425","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"VAZ OLEO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A19","guid":"34e78892-0a70-676d-d49b-0dc57904710e","categoria":"OFICINA","prefixo":"2320","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A20","guid":"590a5e2b-56dc-6d90-32e4-d11863c7a8b9","categoria":"OFICINA","prefixo":"4224","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"C12","guid":"a0e4931c-1abd-ebde-5b39-c7762e51376c","categoria":"OFICINA","prefixo":"3263","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"C13","guid":"686e85b6-41e0-3b7e-3972-2cf7b3412766","categoria":"OFICINA","prefixo":"2514","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"C14","guid":"3f5f7b69-0f03-c446-dae5-a2683a1b0226","categoria":"OFICINA","prefixo":"3139","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"C15","guid":"5237abb8-f3f0-cb19-cb50-70a6cc5243a4","categoria":"OFICINA","prefixo":"4196","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"C16","guid":"481779bb-2a60-7734-929c-5710f2a96058","categoria":"OFICINA","prefixo":"4222","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"C17","guid":"2f0791f3-c05e-4079-4125-0c590b70cf47","categoria":"OFICINA","prefixo":"2426","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"C18","guid":"b96f80f7-c49f-5534-9fab-c5c12d3cff52","categoria":"OFICINA","prefixo":"4209","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"C19","guid":"c4a1be36-70a2-9dad-e40b-95f01885cbb1","categoria":"OFICINA","prefixo":"3271","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"C20","guid":"1f7e9875-6142-2270-0af0-b64c31706d22","categoria":"OFICINA","prefixo":"4193","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"D12","guid":"e3fccc6d-c922-3043-545e-0b005932d59b","categoria":"OFICINA","prefixo":"3100","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"D13","guid":"3c8aa894-132c-731d-ce9c-769e9ec1d6d6","categoria":"OFICINA","prefixo":"2623","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"LIMPADOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"D14","guid":"8b05a8aa-4f19-825b-5115-d7d803d84b76","categoria":"OFICINA","prefixo":"4189","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"LIMPADOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"F13","guid":"18aac7e6-0d51-9c54-79b8-b644fce34bbe","categoria":"OFICINA","prefixo":"3035","consorciada":null,"sub_tipo":"Borracharia","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"F14","guid":"f76577e0-9264-654c-9653-c3535f194dd8","categoria":"OFICINA","prefixo":"3206","consorciada":null,"sub_tipo":"Borracharia","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G12","guid":"e45a6b51-2c7b-3c44-2330-1677e2aa3fb9","categoria":"OFICINA","prefixo":"3147","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"BANCO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G14","guid":"f1893aff-8b88-4b71-2e9e-0a8aa51f47f4","categoria":"OFICINA","prefixo":"4227","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"PARACHOQUE","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"I13","guid":"8697cef5-4e18-ae75-a40d-5fe50c5abb4b","categoria":"OFICINA","prefixo":"3004","consorciada":null,"sub_tipo":"Tacógrafo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"I14","guid":"a0f08307-93f6-5582-68ed-5d152a8f49e9","categoria":"OFICINA","prefixo":"3206","consorciada":null,"sub_tipo":"Tacógrafo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"I15","guid":"627055e4-b31d-8fd6-46ef-0a258c3c8cb4","categoria":"OFICINA","prefixo":"4261","consorciada":null,"sub_tipo":"Tacógrafo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"I16","guid":"dd0e9e0d-f4b0-fca6-a46d-7482a30c8904","categoria":"OFICINA","prefixo":"4234","consorciada":null,"sub_tipo":"Tacógrafo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"I17","guid":"d2a1107f-4e16-d403-424a-32642c7cf411","categoria":"OFICINA","prefixo":"4188","consorciada":null,"sub_tipo":"Tacógrafo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"J12","guid":"8161c789-da69-e315-1b35-f5324585f4b6","categoria":"OFICINA","prefixo":"23","consorciada":null,"sub_tipo":"Bilhetagem","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"C23","guid":"fed3ee4b-1720-e729-1e14-821a21f2d49e","categoria":"REFORCO","prefixo":"4224","consorciada":null,"sub_tipo":null,"horario_reforco":"07:15 - A","motivo":"LUBRIFICAÇÃO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":1,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"H23","guid":"cca9415c-c15c-e088-18f3-09f761c67e8e","categoria":"REFORCO","prefixo":"4213","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - C","motivo":"TROCA DE ÓLEO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":7,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"C24","guid":"dd9f3e1e-5069-676e-fa92-b31f78cbc377","categoria":"REFORCO","prefixo":"4217","consorciada":null,"sub_tipo":null,"horario_reforco":"07:15 - A","motivo":"LUBRIFICAÇÃO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":2,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"H24","guid":"c1c50fb0-e721-acb8-2936-a34b6a5ad46b","categoria":"REFORCO","prefixo":"4192","consorciada":null,"sub_tipo":null,"horario_reforco":"07:45 - C","motivo":"TROCA DE ÓLEO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":8,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"C25","guid":"246d4d64-173f-5be1-6125-6b976200d411","categoria":"REFORCO","prefixo":"4191","consorciada":null,"sub_tipo":null,"horario_reforco":"07:32 - A","motivo":"LUBRIFICAÇÃO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":3,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"H25","guid":"0e5c7c08-efd4-2e24-886a-d8de5cc84a18","categoria":"REFORCO","prefixo":"4018","consorciada":null,"sub_tipo":null,"horario_reforco":"07:45 - A","motivo":"TROCA DE ÓLEO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":9,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"C26","guid":"23f2d77a-eda7-eb47-a171-0c582c5f16a4","categoria":"REFORCO","prefixo":"3277","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - A","motivo":"INSPEÇÂO","observacoes":"URGENT","tipo_posicao":"FIXO","ordem_posicao":4,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"H26","guid":"d37502a0-2265-225f-da2e-716c7b93f693","categoria":"REFORCO","prefixo":"3902","consorciada":null,"sub_tipo":null,"horario_reforco":"07:50 - C","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":10,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"C27","guid":"b6f464ba-7c46-fd5c-9288-c89215b16574","categoria":"REFORCO","prefixo":"4267","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - M","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":5,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"H27","guid":"fb0df78e-4301-3ee7-e022-264cf6baa8b1","categoria":"REFORCO","prefixo":"3904","consorciada":null,"sub_tipo":null,"horario_reforco":"07:50 - C","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":11,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"J23","guid":"52838355-edf5-fbdf-37a3-03d7047ea8fd","categoria":"REFORCO","prefixo":"3902","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":1,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"J24","guid":"2c478ff2-f355-f83b-c1b6-41dc7b8582d6","categoria":"REFORCO","prefixo":"3904","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":2,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"J25","guid":"d11165e7-357f-dda3-4276-b6fb239ff96b","categoria":"REFORCO","prefixo":"3277","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":3,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"J26","guid":"2e9289d6-9115-c5fa-1839-b9a21d272e20","categoria":"REFORCO","prefixo":"4267","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":4,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A35","guid":"83698b90-9711-d7d8-3aaa-aeb1e7a9eb4b","categoria":"BLOQUEADO","prefixo":"2424","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-03"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A36","guid":"64a533b0-927b-524f-fe6e-04eded29a0ce","categoria":"BLOQUEADO","prefixo":"2600","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"ELÉTRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-01-06"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A37","guid":"11eeaba8-07bd-7311-c240-1c9f316db313","categoria":"BLOQUEADO","prefixo":"2800","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-01-03"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A38","guid":"904bbd2c-33c1-497c-202c-c6b96417ab64","categoria":"BLOQUEADO","prefixo":"2611","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-25"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G35","guid":"ca53541b-4083-3e68-735f-384940c94ba9","categoria":"BLOQUEADO","prefixo":"4199","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-05-03"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G36","guid":"6846abea-81ca-892e-8df6-4527e812a66f","categoria":"BLOQUEADO","prefixo":"4200","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"TRANSMISSÃO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G37","guid":"806ac30d-3fa8-e703-4a3d-7cb72e648cfd","categoria":"BLOQUEADO","prefixo":"4201","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MECANICA PASTILHS E DISCO DE FREIO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-28"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G38","guid":"3128eda8-f773-d7d5-7ffe-e10dfb43256e","categoria":"BLOQUEADO","prefixo":"4190","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"VIDRO BOLHA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-20"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G39","guid":"6794820c-3770-f454-1e88-37afa2f47dc0","categoria":"BLOQUEADO","prefixo":"4255","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-24"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G40","guid":"74ead00e-b036-b17c-96c6-2c3c2696c608","categoria":"BLOQUEADO","prefixo":"4211","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"PANE ELETRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G41","guid":"61719672-f189-4482-8a4c-817120634406","categoria":"BLOQUEADO","prefixo":"4225","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"PANE ELETRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G42","guid":"e1ec8682-633f-bf85-80e3-ff19ce0b758f","categoria":"BLOQUEADO","prefixo":"4223","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MOLEJO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-04"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G43","guid":"7e765a79-3fa2-4ada-0458-011dc7291458","categoria":"BLOQUEADO","prefixo":"4248","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"AR E EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G44","guid":"6c144f03-aa6d-3262-2662-8fa894e72444","categoria":"BLOQUEADO","prefixo":"4257","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-21"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G45","guid":"f874e25a-c4cb-ccb6-ca60-d705eb1156bd","categoria":"BLOQUEADO","prefixo":"4194","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G46","guid":"a8a99383-746e-1a83-2b61-30e5312a2db6","categoria":"BLOQUEADO","prefixo":"4212","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-27"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A49","guid":"53e4efe1-8ace-2423-b667-1b15ca49b8e0","categoria":"BLOQUEADO","prefixo":"3005","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"SUSPENSÃO ","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A50","guid":"7fd7f612-8b33-5ecb-8539-f1aeea5cd80e","categoria":"BLOQUEADO","prefixo":"3133","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-01"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A51","guid":"6c50bd2d-ff1f-0844-2b13-829659997527","categoria":"BLOQUEADO","prefixo":"3006","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-06-30"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A52","guid":"01540579-cc40-3835-3bd7-6143ae70424f","categoria":"BLOQUEADO","prefixo":"3252","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A53","guid":"cb9d36d8-a5da-abf2-26cc-4263ac64504b","categoria":"BLOQUEADO","prefixo":"3263","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-29"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A54","guid":"daa3fc4b-6943-d59f-dee5-073a88ac6194","categoria":"BLOQUEADO","prefixo":"3279","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A55","guid":"35eaecca-cdce-0663-e331-8da0f6825bc1","categoria":"BLOQUEADO","prefixo":"3257","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A56","guid":"180b6da0-b50c-6737-2178-1d7407773b20","categoria":"BLOQUEADO","prefixo":"3106","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-24"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A57","guid":"ef200152-7e28-7667-5bbf-ae758a5e7aec","categoria":"BLOQUEADO","prefixo":"3099","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A58","guid":"96b48b6f-4d3c-8d00-9c82-75942b35d9a4","categoria":"BLOQUEADO","prefixo":"3900","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-04"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"A59","guid":"0e6695ce-2736-2bda-ad01-4fa7b5a5f0ce","categoria":"BLOQUEADO","prefixo":"3267","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G49","guid":"34972e80-6205-c331-0fc6-3a9ab2ec8a8e","categoria":"BLOQUEADO","prefixo":"1119","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2020-12-18"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G50","guid":"42c00bfb-96d1-2939-e7cc-1b97237d73c6","categoria":"BLOQUEADO","prefixo":"3083","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"FORA DE OPERAÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G51","guid":"f5e5eca6-1607-03d0-8a4c-dec3cb31a85b","categoria":"BLOQUEADO","prefixo":"1323","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-12-07"}
-- AUDIT-ITEM {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"G52","guid":"ae617115-e4ec-4a3b-a09a-e133d3a25e86","categoria":"BLOQUEADO","prefixo":"1322","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"REVISÂO GERAL","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-DIA {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","sha256":"5aa02014e43f71a1fed5e5ba08e57733ec4c7e07f71b15dbaf192ef5c3c5c652","counts":[5,26,11,4,4,13,11,4],"title_original":"INSPEÇÂO","title":"INSPEÇÃO","oficina":{"Mecânica":9,"Elevador":9,"Elétrica":3,"Funilaria / Pintura":2,"Tacógrafo":2,"Bilhetagem":1}}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"D6","guid":"22c8c1d7-e5a3-69a5-999a-4e555952e444","categoria":"PREVENTIVA","prefixo":"4224","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"D7","guid":"1389252d-7d81-6321-8c44-2d07f3a655e2","categoria":"PREVENTIVA","prefixo":"4217","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G6","guid":"089f9e41-9657-0c00-15e7-f24068849576","categoria":"PREVENTIVA","prefixo":"4192","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G7","guid":"d570fd09-3b29-92df-a98c-d7e9c40fb284","categoria":"PREVENTIVA","prefixo":"4233","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G8","guid":"74a965ce-51d2-310a-afd5-c946bafbb609","categoria":"PREVENTIVA","prefixo":"4191","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A12","guid":"756bb45c-1781-ec40-7259-380040628b85","categoria":"OFICINA","prefixo":"2704","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"BOMBA ARLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A13","guid":"dd678e77-6390-bcef-0b9d-f2397087a993","categoria":"OFICINA","prefixo":"3222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A14","guid":"9be042ed-7ec2-dab0-f654-eb49d62c730a","categoria":"OFICINA","prefixo":"4244","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"M DE EIXO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A15","guid":"7a710e31-7018-43cf-0f8c-65e24c79a56c","categoria":"OFICINA","prefixo":"4222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A16","guid":"dfec93b2-ed29-da26-7a5c-9a5e305791b6","categoria":"OFICINA","prefixo":"4197","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A17","guid":"2d837b9a-da9d-8032-f0bd-742338077829","categoria":"OFICINA","prefixo":"4225","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A18","guid":"78dd56c9-d6d7-55c4-18c5-31909181cbbe","categoria":"OFICINA","prefixo":"2425","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"VAZ OLEO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A19","guid":"b6d357cd-8d4a-b7d7-00fd-f4884964c114","categoria":"OFICINA","prefixo":"2320","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A20","guid":"f3c22edb-5fb2-ac88-23ff-0e393bfc7835","categoria":"OFICINA","prefixo":"4224","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"C12","guid":"d18c57ee-e2e8-947a-eb6f-14287eacddb4","categoria":"OFICINA","prefixo":"3951","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"C13","guid":"6397bad8-aa19-657c-76ce-3e21eb60cfba","categoria":"OFICINA","prefixo":"2514","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"C14","guid":"383a0cc8-80f0-f97f-61a2-fabaa4904e55","categoria":"OFICINA","prefixo":"3139","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"C15","guid":"e2508664-2036-cdf8-d16c-c2ed9ec2b625","categoria":"OFICINA","prefixo":"4196","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"C16","guid":"7a698ef3-3000-0d12-0d78-1ed77694a865","categoria":"OFICINA","prefixo":"4222","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"C17","guid":"56e63dab-646f-fe0d-ca41-7fc68a18b8a6","categoria":"OFICINA","prefixo":"2426","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"C18","guid":"f18cd36f-082c-1c35-5bbd-a25b6501ca74","categoria":"OFICINA","prefixo":"4209","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"C19","guid":"bf3e11fe-c2cc-b6a4-e30f-9a3008ff8b53","categoria":"OFICINA","prefixo":"3271","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"C20","guid":"0bf4b234-eea8-7346-89dd-25e7ba844377","categoria":"OFICINA","prefixo":"4193","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"D12","guid":"7be0db71-a763-e9ae-508c-e3de69ecb4f4","categoria":"OFICINA","prefixo":"3100","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"D13","guid":"c65ce75d-65af-efd1-0708-d93839121726","categoria":"OFICINA","prefixo":"2623","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"LIMPADOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"D14","guid":"42e20295-375e-f45d-5480-40e6a37634e9","categoria":"OFICINA","prefixo":"4189","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"LIMPADOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G12","guid":"58cbbd4a-3d62-3d7d-efb9-fb6252b7bdd7","categoria":"OFICINA","prefixo":"3147","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"BANCO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G14","guid":"e119fb2b-dde3-a353-f02a-0b49de2e1518","categoria":"OFICINA","prefixo":"4227","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"PARACHOQUE","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"I14","guid":"e6fdb5c7-a747-cd28-44f9-0174b934daec","categoria":"OFICINA","prefixo":"3206","consorciada":null,"sub_tipo":"Tacógrafo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"I15","guid":"1983d054-f74f-de25-80cb-ee7570ff4226","categoria":"OFICINA","prefixo":"4261","consorciada":null,"sub_tipo":"Tacógrafo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"J12","guid":"2cf1a139-7957-a639-7b1e-284f1cc366f3","categoria":"OFICINA","prefixo":"23","consorciada":null,"sub_tipo":"Bilhetagem","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"C23","guid":"894466e8-3fc2-202e-cc28-401eb4362ca7","categoria":"REFORCO","prefixo":"4224","consorciada":null,"sub_tipo":null,"horario_reforco":"07:15 - A","motivo":"LUBRIFICAÇÃO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":1,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"H23","guid":"72ec8340-7c31-ce68-e29e-38fd1971727d","categoria":"REFORCO","prefixo":"4213","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - C","motivo":"TROCA DE ÓLEO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":7,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"C24","guid":"a9970958-ba6c-f1fb-e471-0f3d7798971a","categoria":"REFORCO","prefixo":"4217","consorciada":null,"sub_tipo":null,"horario_reforco":"07:15 - A","motivo":"LUBRIFICAÇÃO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":2,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"H24","guid":"84e91761-bf9f-13a4-a472-59225475aa6a","categoria":"REFORCO","prefixo":"4192","consorciada":null,"sub_tipo":null,"horario_reforco":"07:45 - C","motivo":"TROCA DE ÓLEO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":8,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"C25","guid":"c05327da-0f76-634f-eaf7-a4fd3cdaa90b","categoria":"REFORCO","prefixo":"4191","consorciada":null,"sub_tipo":null,"horario_reforco":"07:32 - A","motivo":"LUBRIFICAÇÃO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":3,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"H25","guid":"ca8b8fd9-406b-9d65-990a-6a2c8cb32a8c","categoria":"REFORCO","prefixo":"4018","consorciada":null,"sub_tipo":null,"horario_reforco":"07:45 - A","motivo":"TROCA DE ÓLEO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":9,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"C26","guid":"57ec0ed2-76b5-9c09-f854-ed52a78b91e2","categoria":"REFORCO","prefixo":"3271","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - A","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":4,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"H26","guid":"52895b3b-5827-7caf-5774-82b8a80f9a21","categoria":"REFORCO","prefixo":"3902","consorciada":null,"sub_tipo":null,"horario_reforco":"07:50 - C","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":10,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"C27","guid":"ae1d5775-a520-be85-31b5-f7e69476e467","categoria":"REFORCO","prefixo":"4267","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - M","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":5,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"H27","guid":"7022802d-7221-1ec4-7ca4-96d686eac704","categoria":"REFORCO","prefixo":"4253","consorciada":null,"sub_tipo":null,"horario_reforco":"07:50 - C","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":11,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"H28","guid":"f7246dd7-a291-3ca3-665a-d47ff39a481f","categoria":"REFORCO","prefixo":"4267","consorciada":null,"sub_tipo":null,"horario_reforco":"07:50 - A","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":12,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"J23","guid":"f50934bc-15b6-0264-464c-04b614750567","categoria":"REFORCO","prefixo":"3902","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":1,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"J25","guid":"21adc5c6-b737-67f6-9ac8-f922b2daa847","categoria":"REFORCO","prefixo":"4253","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":3,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"J26","guid":"56eb0bbf-d039-90c5-b4d2-2c6b29662e47","categoria":"REFORCO","prefixo":"4267","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":4,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"J27","guid":"8dd41932-0199-d0ac-854e-2539cc4f1228","categoria":"REFORCO","prefixo":"3271","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":5,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A35","guid":"f41c66f5-cf1f-a723-c822-389f2b9c5c0f","categoria":"BLOQUEADO","prefixo":"2424","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-03"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A36","guid":"038147ac-c415-2ec8-6e08-40eba726a170","categoria":"BLOQUEADO","prefixo":"2600","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"ELÉTRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-01-06"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A37","guid":"1d55004c-1636-7739-f941-691942ed8528","categoria":"BLOQUEADO","prefixo":"2800","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-01-03"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A38","guid":"6c346d45-56f7-990c-3337-fecd1499f9e7","categoria":"BLOQUEADO","prefixo":"2611","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-25"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G35","guid":"3272991f-5be5-c552-590e-e7cb0967e3d6","categoria":"BLOQUEADO","prefixo":"4199","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-05-03"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G36","guid":"7c4249e0-2135-3297-8f33-39eb0c4da124","categoria":"BLOQUEADO","prefixo":"4200","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"TRANSMISSÃO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G37","guid":"9f38604e-c4bf-9696-5e11-95afdee0b342","categoria":"BLOQUEADO","prefixo":"4201","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MECANICA PASTILHS E DISCO DE FREIO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-28"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G38","guid":"b4a8c278-8ea2-1cff-dd1e-30349fbf52b7","categoria":"BLOQUEADO","prefixo":"4190","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"VIDRO BOLHA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-20"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G39","guid":"3e88a47d-88d2-41bb-694a-2a5e404e5270","categoria":"BLOQUEADO","prefixo":"4255","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-24"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G40","guid":"fe06677f-54af-40ae-3b05-329eeafbe8d1","categoria":"BLOQUEADO","prefixo":"4211","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"PANE ELETRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G41","guid":"dcb23ff5-0ff4-1026-f5b4-90417b40fb77","categoria":"BLOQUEADO","prefixo":"4225","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"PANE ELETRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G42","guid":"cc4ca620-cd77-a038-2ab9-9673079795ec","categoria":"BLOQUEADO","prefixo":"4223","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MOLEJO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-04"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G43","guid":"6fd962b0-84d6-dbfd-62bb-089dbe9a2a7f","categoria":"BLOQUEADO","prefixo":"4248","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"AR E EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G44","guid":"fd6e7d2b-d70e-8e21-210f-7edf15487f73","categoria":"BLOQUEADO","prefixo":"4215","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"VALVULAS FALTA DE PEÇAS","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-05"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G45","guid":"ffa66a2f-580f-d5f2-d024-187661cb5d2a","categoria":"BLOQUEADO","prefixo":"4257","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-21"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G46","guid":"7f0059e5-e96f-74f4-43a1-23df838cd68c","categoria":"BLOQUEADO","prefixo":"4194","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G47","guid":"84aac564-7704-249a-685c-be122fd8bb38","categoria":"BLOQUEADO","prefixo":"4212","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-27"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A50","guid":"26ca9abb-bb65-2a3d-5abd-d38611dc9673","categoria":"BLOQUEADO","prefixo":"3005","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"SUSPENSÃO ","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A51","guid":"e4c7402f-7405-d0fa-c495-f83471839300","categoria":"BLOQUEADO","prefixo":"3133","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-01"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A52","guid":"8a5e9c4b-c4cf-34cb-8215-0405a0cfbece","categoria":"BLOQUEADO","prefixo":"3006","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-06-30"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A53","guid":"5c3d3411-9dcc-2682-ac41-1f8ebc040054","categoria":"BLOQUEADO","prefixo":"3252","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A54","guid":"55a605ae-c269-51b2-99f9-e4ac7aa3a11d","categoria":"BLOQUEADO","prefixo":"3263","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-29"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A55","guid":"d3d5780d-2e58-303c-f4eb-2912967792b9","categoria":"BLOQUEADO","prefixo":"3106","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-24"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A56","guid":"160eaabc-09dc-9732-4495-f1fbf39aa757","categoria":"BLOQUEADO","prefixo":"3228","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-05"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A57","guid":"b036e627-ada7-50eb-baff-5adf49bb9f06","categoria":"BLOQUEADO","prefixo":"3904","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-05"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A58","guid":"5fc0f62c-f0e9-6dc2-c989-4dcaf71e9eb4","categoria":"BLOQUEADO","prefixo":"3099","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A59","guid":"d6df2f35-44bb-0cda-7769-02533e432e11","categoria":"BLOQUEADO","prefixo":"3900","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-04"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"A60","guid":"6fd51834-0408-c98f-cc7f-3c29379f689a","categoria":"BLOQUEADO","prefixo":"3267","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G50","guid":"2982736c-684f-19e2-143b-22fe9778bae1","categoria":"BLOQUEADO","prefixo":"1119","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2020-12-18"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G51","guid":"c5d4eae3-fac3-2f91-e908-1ed348b45f15","categoria":"BLOQUEADO","prefixo":"3083","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"FORA DE OPERAÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G52","guid":"5339df2d-b14a-5a81-d9c9-ebc35c5b5bf9","categoria":"BLOQUEADO","prefixo":"1323","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-12-07"}
-- AUDIT-ITEM {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"G53","guid":"daaeee4c-06dc-551b-dbbb-c1da0197df8d","categoria":"BLOQUEADO","prefixo":"1322","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"REVISÂO GERAL","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-DIA {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","sha256":"b192fd48e111472ed3ef22c959b2bf8045bcae3f2b65864687d6fb3d9a086ed9","counts":[7,28,4,4,4,14,10,4],"title_original":"INSPEÇÂO","title":"INSPEÇÃO","oficina":{"Mecânica":9,"Elevador":9,"Elétrica":3,"Borracharia":2,"Funilaria / Pintura":2,"Tacógrafo":2,"Bilhetagem":1}}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"D6","guid":"7845dabf-729f-e5c6-9dc3-e390fd37c7fb","categoria":"PREVENTIVA","prefixo":"4243","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"D7","guid":"39eb181e-4d24-ca31-56c0-16bda7897394","categoria":"PREVENTIVA","prefixo":"4258","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"D8","guid":"d3c9eda2-4f4d-fe62-a0a6-e01b92e7d3ff","categoria":"PREVENTIVA","prefixo":"3022","consorciada":null,"sub_tipo":"Lubrificação","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G6","guid":"5a16003e-a74b-d25d-9230-3ce99ec3827a","categoria":"PREVENTIVA","prefixo":"3204","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"H6","guid":"5bf3f309-9ba5-6327-91fd-86599f7cc92a","categoria":"PREVENTIVA","prefixo":"3253","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G7","guid":"550c721b-7a20-6807-cefd-e557dfa56eb9","categoria":"PREVENTIVA","prefixo":"3220","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G8","guid":"585ab324-1ce3-06ab-c6d9-c391b6046582","categoria":"PREVENTIVA","prefixo":"3226","consorciada":null,"sub_tipo":"Troca de óleo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A12","guid":"b43a23a1-a4cf-637e-51a6-511ecf6216d9","categoria":"OFICINA","prefixo":"2704","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"BOMBA ARLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A13","guid":"63da96fe-eb1c-4d17-00df-13cf885e6002","categoria":"OFICINA","prefixo":"3222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A14","guid":"27e8770e-4935-c718-78f6-490c43fb888d","categoria":"OFICINA","prefixo":"4244","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"M DE EIXO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A15","guid":"0b54e3a0-5568-e8ed-de15-9b0966047171","categoria":"OFICINA","prefixo":"4222","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A16","guid":"9ce69892-79c4-7d0d-fb36-fdad06f78746","categoria":"OFICINA","prefixo":"4197","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"SUSPENÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A17","guid":"1eb9df0a-c2bb-1b1e-2659-1f3c209cfdd0","categoria":"OFICINA","prefixo":"4225","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A18","guid":"b3c4ea78-bdf3-bd0b-1d9f-66cb8f6fcfca","categoria":"OFICINA","prefixo":"2425","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"VAZ OLEO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A19","guid":"e4fdfe3a-16c6-76b3-b6ef-ad4f7cdafaa7","categoria":"OFICINA","prefixo":"2352","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"POTENCIA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A20","guid":"8255f961-228d-d03e-8f34-9d18e6f74bcd","categoria":"OFICINA","prefixo":"4224","consorciada":null,"sub_tipo":"Mecânica","horario_reforco":null,"motivo":"MECANICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"C12","guid":"453034b7-7c31-6d6e-574c-f0af9648931f","categoria":"OFICINA","prefixo":"3951","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"C13","guid":"3d89cba5-cb28-b5df-d0a4-3ab661983ab6","categoria":"OFICINA","prefixo":"2514","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"C14","guid":"8d247137-1fbc-0c1d-b335-12cdd35ab368","categoria":"OFICINA","prefixo":"3139","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"C15","guid":"4ce5d428-8d67-286c-cf3e-cf94cee990bb","categoria":"OFICINA","prefixo":"4196","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"C16","guid":"62473bcd-26a5-8c86-d775-0337320cf407","categoria":"OFICINA","prefixo":"4222","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"C17","guid":"2f7efb7f-5755-0b7c-42b3-899793e209e3","categoria":"OFICINA","prefixo":"2426","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"C18","guid":"1e64f7a5-d182-12ee-d0a5-bb45efcb90f1","categoria":"OFICINA","prefixo":"4209","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"C19","guid":"82363108-48d1-7dad-449d-381535327f27","categoria":"OFICINA","prefixo":"3271","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"C20","guid":"15af7bd9-655b-3420-5fe2-d07998feb739","categoria":"OFICINA","prefixo":"4193","consorciada":null,"sub_tipo":"Elevador","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"D12","guid":"1752d317-f74e-38ff-dadd-d24e5873f253","categoria":"OFICINA","prefixo":"3100","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"D13","guid":"eb1aed0c-e52e-0145-79f6-76aab2bf5053","categoria":"OFICINA","prefixo":"2623","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"LIMPADOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"D14","guid":"176e201c-d21f-d7ca-6441-8a80582ef643","categoria":"OFICINA","prefixo":"4189","consorciada":null,"sub_tipo":"Elétrica","horario_reforco":null,"motivo":"LIMPADOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"F13","guid":"9d1209b4-c1ec-a198-29d5-bd53d887dbd6","categoria":"OFICINA","prefixo":"4270","consorciada":null,"sub_tipo":"Borracharia","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"F14","guid":"19c383a0-a99a-9e97-2d2c-513b02454b01","categoria":"OFICINA","prefixo":"4250","consorciada":null,"sub_tipo":"Borracharia","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G12","guid":"401e34a6-98ba-9835-53e3-cb7a474b91fd","categoria":"OFICINA","prefixo":"3147","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"BANCO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G14","guid":"03d9a0bd-f3ac-7669-50a9-97800c58d44b","categoria":"OFICINA","prefixo":"4227","consorciada":null,"sub_tipo":"Funilaria / Pintura","horario_reforco":null,"motivo":"PARACHOQUE","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"I14","guid":"92577546-fd69-07ff-26aa-54030d4c0515","categoria":"OFICINA","prefixo":"3206","consorciada":null,"sub_tipo":"Tacógrafo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"I15","guid":"8c867190-08c5-4a62-3b9e-4a169fe042d3","categoria":"OFICINA","prefixo":"4261","consorciada":null,"sub_tipo":"Tacógrafo","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"J12","guid":"57f3f686-9119-4472-8882-9c3a3fca6d1d","categoria":"OFICINA","prefixo":"23","consorciada":null,"sub_tipo":"Bilhetagem","horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"C26","guid":"8dad15a6-64bb-ba15-9215-b5a7038038ba","categoria":"REFORCO","prefixo":"3271","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - A","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":4,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"H26","guid":"28b06a8e-d2c7-5c06-50b8-b975023c524e","categoria":"REFORCO","prefixo":"3902","consorciada":null,"sub_tipo":null,"horario_reforco":"07:50 - C","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":10,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"C27","guid":"d4e66460-e57f-5634-6ee4-7e780bd08516","categoria":"REFORCO","prefixo":"4257","consorciada":null,"sub_tipo":null,"horario_reforco":"07:40 - M","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":5,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"H27","guid":"b5e0b08d-f6f4-c661-043d-6b57405ebc64","categoria":"REFORCO","prefixo":"4253","consorciada":null,"sub_tipo":null,"horario_reforco":"07:50 - C","motivo":"INSPEÇÂO","observacoes":null,"tipo_posicao":"FIXO","ordem_posicao":11,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"J23","guid":"5bb7acac-3e50-55c3-0df1-6246dceaab0f","categoria":"REFORCO","prefixo":"3902","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":1,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"J24","guid":"51a14d51-aa01-879e-3d66-f71440a50f38","categoria":"REFORCO","prefixo":"4257","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":2,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"J25","guid":"8a79fbcc-a36d-efa3-bad2-21d5903e5115","categoria":"REFORCO","prefixo":"4253","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":3,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"J27","guid":"a523f91e-9847-ebb6-0962-c50b6f93d740","categoria":"REFORCO","prefixo":"3271","consorciada":null,"sub_tipo":null,"horario_reforco":null,"motivo":null,"observacoes":null,"tipo_posicao":"EXTRA","ordem_posicao":5,"data_bloqueio":null}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A35","guid":"cfefe548-003e-ba2c-cca5-b24f09da63e8","categoria":"BLOQUEADO","prefixo":"2424","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-03"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A36","guid":"3dde756c-9cc5-a9be-3781-04037d387b26","categoria":"BLOQUEADO","prefixo":"2600","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"ELÉTRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-01-06"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A37","guid":"c27c29fc-4269-b2ef-f5b8-c83c82c58000","categoria":"BLOQUEADO","prefixo":"2800","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-01-03"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A38","guid":"fd44941c-51a8-eec4-24cc-374296243c50","categoria":"BLOQUEADO","prefixo":"2611","consorciada":"VSF","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-25"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G35","guid":"8295703b-45a0-b8ca-2ebf-387b5f5212b0","categoria":"BLOQUEADO","prefixo":"4199","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-05-03"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G36","guid":"7f7ff7fe-56d1-daaf-6b68-7b189d483a2b","categoria":"BLOQUEADO","prefixo":"4200","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"TRANSMISSÃO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G37","guid":"e3fbefbf-343e-3d14-726d-fdb8f23c1e6d","categoria":"BLOQUEADO","prefixo":"4201","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MECANICA PASTILHS E DISCO DE FREIO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-28"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G38","guid":"f479ec76-23a5-9610-7fc9-5ba207744daa","categoria":"BLOQUEADO","prefixo":"4190","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"VIDRO BOLHA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-20"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G39","guid":"734fe30a-22bb-3594-887e-ba26a7504406","categoria":"BLOQUEADO","prefixo":"4255","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-24"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G40","guid":"ace65504-2783-fa86-6f3c-2f78b09ed5e8","categoria":"BLOQUEADO","prefixo":"4211","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"PANE ELETRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G41","guid":"5f4b4be8-fb8f-1bca-fdd0-f83519a0a837","categoria":"BLOQUEADO","prefixo":"4225","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"PANE ELETRICA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G42","guid":"9a079e47-a53c-52f0-cf7e-e97126ac04b7","categoria":"BLOQUEADO","prefixo":"4223","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MOLEJO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-04"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G43","guid":"e9c3ba32-0f3f-ecbf-9373-90b552e4d41a","categoria":"BLOQUEADO","prefixo":"4267","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"REVISÂO PARA INSPEÇAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-06"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G44","guid":"3220a08b-15d2-d475-8615-919a6977a162","categoria":"BLOQUEADO","prefixo":"4248","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"AR E EMBREAGEM","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-03"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G45","guid":"2fe9d207-35f7-a541-eeff-19cade95f45e","categoria":"BLOQUEADO","prefixo":"4196","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-08-27"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G46","guid":"4f47c90c-f537-ba92-f6df-00903e644ea0","categoria":"BLOQUEADO","prefixo":"4257","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-21"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G47","guid":"bef9a2a9-8e19-e624-3c04-e7edee76b9da","categoria":"BLOQUEADO","prefixo":"4194","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G48","guid":"f848bf44-e8ff-99ba-9552-c075a83323a7","categoria":"BLOQUEADO","prefixo":"4212","consorciada":"VCG","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-27"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A51","guid":"6efad749-9052-27eb-ea37-882a73ee634e","categoria":"BLOQUEADO","prefixo":"3005","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"SUSPENSÃO ","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2025-10-20"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A52","guid":"c59b6ef7-44f8-96fe-5950-db2bd8815635","categoria":"BLOQUEADO","prefixo":"3133","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-01"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A53","guid":"4a694980-a2e8-7af8-e403-99fce0dc7e2f","categoria":"BLOQUEADO","prefixo":"3006","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-06-30"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A54","guid":"fb19814e-ed75-989c-81ef-8136ed375a0c","categoria":"BLOQUEADO","prefixo":"3903","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MODULO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-05"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A55","guid":"fead8a38-a596-5de2-1798-08dad613e96a","categoria":"BLOQUEADO","prefixo":"3106","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-06-24"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A56","guid":"c7eda0a0-d869-e897-9ecc-3ae6c1a10548","categoria":"BLOQUEADO","prefixo":"3904","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-05"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A57","guid":"1c2f5515-0d22-7409-b626-0530c3336433","categoria":"BLOQUEADO","prefixo":"3951","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"MANGA DE EIXO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-06"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A58","guid":"e7bd5121-7fc6-7a02-271c-f9f547ae6a73","categoria":"BLOQUEADO","prefixo":"3099","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A59","guid":"e4f431b2-adf7-6516-b7e3-79b416f922a5","categoria":"BLOQUEADO","prefixo":"3900","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"POSTO DE MOLA","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-04"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"A60","guid":"72234a56-a148-8cf3-57e2-2a3f2f90fc1f","categoria":"BLOQUEADO","prefixo":"3267","consorciada":"JTU","sub_tipo":null,"horario_reforco":null,"motivo":"REVISAO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-09-30"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G51","guid":"3c0e4988-3b42-b736-899b-adf122dc3802","categoria":"BLOQUEADO","prefixo":"1119","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"MOTOR","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2020-12-18"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G52","guid":"b7c8972c-b916-ce5b-6cce-61c1cdc0ecd2","categoria":"BLOQUEADO","prefixo":"3083","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"FORA DE OPERAÇÂO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G53","guid":"4833daeb-76a3-0b55-44e9-7915745cd4c2","categoria":"BLOQUEADO","prefixo":"1323","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"SINISTRO","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2024-12-07"}
-- AUDIT-ITEM {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"G54","guid":"6e803522-d915-4275-fe3d-61add5a7445a","categoria":"BLOQUEADO","prefixo":"1322","consorciada":"VCM","sub_tipo":null,"horario_reforco":null,"motivo":"REVISÂO GERAL","observacoes":null,"tipo_posicao":null,"ordem_posicao":null,"data_bloqueio":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"F58","prefixo":"3951","consorciada":"JTU","original":"29/29","motivo":"invalida","importada":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"L51","prefixo":"1322","consorciada":"VCM","original":46334,"motivo":"futura","importada":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-01","file":"CI-01-10-2026.xlsx","cell":"L52","prefixo":"3083","consorciada":"VCM","original":null,"motivo":"ausente","importada":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"F61","prefixo":"3951","consorciada":"JTU","original":"29/29","motivo":"invalida","importada":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"L52","prefixo":"3083","consorciada":"VCM","original":null,"motivo":"ausente","importada":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-02","file":"CI-02-10-2026.xlsx","cell":"L54","prefixo":"1322","consorciada":"VCM","original":46334,"motivo":"futura","importada":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"L55","prefixo":"3083","consorciada":"VCM","original":null,"motivo":"ausente","importada":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-03","file":"CI-03-10-2026.xlsx","cell":"L57","prefixo":"1322","consorciada":"VCM","original":46334,"motivo":"futura","importada":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"L55","prefixo":"3083","consorciada":"VCM","original":null,"motivo":"ausente","importada":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-04","file":"CI-04-10-2026.xlsx","cell":"L57","prefixo":"1322","consorciada":"VCM","original":46334,"motivo":"futura","importada":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"L50","prefixo":"3083","consorciada":"VCM","original":null,"motivo":"ausente","importada":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-05","file":"CI-05-10-2026.xlsx","cell":"L52","prefixo":"1322","consorciada":"VCM","original":46334,"motivo":"futura","importada":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"L51","prefixo":"3083","consorciada":"VCM","original":null,"motivo":"ausente","importada":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-06","file":"CI-06-10-2026.xlsx","cell":"L53","prefixo":"1322","consorciada":"VCM","original":46334,"motivo":"futura","importada":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"L52","prefixo":"3083","consorciada":"VCM","original":null,"motivo":"ausente","importada":"2026-10-01"}
-- AUDIT-FALLBACK {"date":"2026-10-07","file":"CI-07-10-2026.xlsx","cell":"L54","prefixo":"1322","consorciada":"VCM","original":46334,"motivo":"futura","importada":"2026-10-01"}
-- AUDIT-EXCLUIDA {"file":"CI-01-10-2026.xlsx","cell":"F25","valor":"07:45 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-01-10-2026.xlsx","cell":"G25","valor":"TROCA DE ÓLEO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-01-10-2026.xlsx","cell":"F26","valor":"07:50 - C","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-01-10-2026.xlsx","cell":"G26","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-01-10-2026.xlsx","cell":"F27","valor":"07:50 - C","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-01-10-2026.xlsx","cell":"G27","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-01-10-2026.xlsx","cell":"F28","valor":"07:50 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-01-10-2026.xlsx","cell":"G28","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-01-10-2026.xlsx","cell":"N47","valor":28,"motivo":"total de resumo do documento; nao constitui item"}
-- AUDIT-EXCLUIDA {"file":"CI-02-10-2026.xlsx","cell":"F27","valor":"07:50 - C","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-02-10-2026.xlsx","cell":"G27","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-02-10-2026.xlsx","cell":"A28","valor":"07:40 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-02-10-2026.xlsx","cell":"B28","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-02-10-2026.xlsx","cell":"F28","valor":"07:50 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-02-10-2026.xlsx","cell":"G28","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-02-10-2026.xlsx","cell":"N50","valor":29,"motivo":"total de resumo do documento; nao constitui item"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"A23","valor":"07:15 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"B23","valor":"LUBRIFICAÇÃO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"F23","valor":"07:40 - C","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"G23","valor":"TROCA DE ÓLEO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"A24","valor":"07:15 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"B24","valor":"LUBRIFICAÇÃO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"F24","valor":"07:45 - C","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"G24","valor":"TROCA DE ÓLEO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"A25","valor":"07:32 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"B25","valor":"LUBRIFICAÇÃO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"F25","valor":"07:45 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"G25","valor":"TROCA DE ÓLEO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"A26","valor":"07:40 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"B26","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"F26","valor":"07:50 - C","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"G26","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"A27","valor":"07:40 - M","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"B27","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"F27","valor":"07:50 - C","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"G27","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"A28","valor":"07:40 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"B28","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"F28","valor":"07:50 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"G28","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-03-10-2026.xlsx","cell":"N53","valor":33,"motivo":"total de resumo do documento; nao constitui item"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"A23","valor":"07:15 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"B23","valor":"LUBRIFICAÇÃO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"F23","valor":"07:40 - C","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"G23","valor":"TROCA DE ÓLEO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"A24","valor":"07:15 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"B24","valor":"LUBRIFICAÇÃO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"F24","valor":"07:45 - C","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"G24","valor":"TROCA DE ÓLEO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"A25","valor":"07:32 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"B25","valor":"LUBRIFICAÇÃO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"F25","valor":"07:45 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"G25","valor":"TROCA DE ÓLEO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"A26","valor":"07:40 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"B26","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"F26","valor":"07:50 - C","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"G26","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"A27","valor":"07:40 - M","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"B27","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"F27","valor":"07:50 - C","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"G27","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"A28","valor":"07:40 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"B28","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"F28","valor":"07:50 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"G28","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-04-10-2026.xlsx","cell":"N53","valor":33,"motivo":"total de resumo do documento; nao constitui item"}
-- AUDIT-EXCLUIDA {"file":"CI-05-10-2026.xlsx","cell":"A28","valor":"07:40 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-05-10-2026.xlsx","cell":"B28","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-05-10-2026.xlsx","cell":"F28","valor":"07:50 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-05-10-2026.xlsx","cell":"G28","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-05-10-2026.xlsx","cell":"N48","valor":27,"motivo":"total de resumo do documento; nao constitui item"}
-- AUDIT-EXCLUIDA {"file":"CI-06-10-2026.xlsx","cell":"A28","valor":"07:40 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-06-10-2026.xlsx","cell":"B28","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-06-10-2026.xlsx","cell":"N49","valor":28,"motivo":"total de resumo do documento; nao constitui item"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"A23","valor":"07:15 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"B23","valor":"LUBRIFICAÇÃO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"F23","valor":"07:40 - C","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"G23","valor":"TROCA DE ÓLEO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"A24","valor":"07:15 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"B24","valor":"LUBRIFICAÇÃO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"F24","valor":"07:45 - C","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"G24","valor":"TROCA DE ÓLEO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"A25","valor":"07:32 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"B25","valor":"LUBRIFICAÇÃO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"F25","valor":"07:45 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"G25","valor":"TROCA DE ÓLEO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"A28","valor":"07:40 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"B28","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"F28","valor":"07:50 - A","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"G28","valor":"INSPEÇÂO","motivo":"horario/motivo de posicao sem prefixo; nao gera item vazio"}
-- AUDIT-EXCLUIDA {"file":"CI-07-10-2026.xlsx","cell":"N50","valor":28,"motivo":"total de resumo do documento; nao constitui item"}
