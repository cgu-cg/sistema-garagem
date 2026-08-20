import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

// Configuração do SQL Server
const config: sql.config = {
  user: process.env.SQL_SERVER_USER,
  password: process.env.SQL_SERVER_PASSWORD,
  server: process.env.SQL_SERVER_HOST || "",
  port: parseInt(process.env.SQL_SERVER_PORT || "1433"),
  database: process.env.SQL_SERVER_DATABASE || "bilhetagem",
  options: {
    encrypt: process.env.SQL_SERVER_ENCRYPT === "true",
    trustServerCertificate: process.env.SQL_SERVER_TRUST_SERVER_CERTIFICATE !== "false",
    enableArithAbort: true,
  },
  connectionTimeout: 5000,
  requestTimeout: 10000,
};

let pool: sql.ConnectionPool | null = null;

// Função para obter o pool de conexão
export async function getPool(): Promise<sql.ConnectionPool | null> {
  if (pool && pool.connected) return pool;

  try {
    console.log(`[SQL Server] Conectando a ${config.server}:${config.port}...`);
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log("[SQL Server] Conectado com sucesso!");
    return pool;
  } catch (error) {
    console.error("[SQL Server] Erro ao conectar no SQL Server:", error);
    pool = null;
    return null;
  }
}

export function isMockMode(): boolean {
  return false;
}

// 1. Diferenças de Catraca (fnConsisteCatracaVEICULOS)
export async function queryConsistenciaCatraca(dateStr: string, minDiff: number) {
  const pool = await getPool();
  if (!pool) throw new Error("Não foi possível conectar ao SQL Server.");

  const result = await pool.request()
    .input("data", sql.VarChar, dateStr)
    .input("diff", sql.Int, minDiff)
    .query(`
      SELECT idCarro, Linha, idSV1, datainiSV1, datafimSV1, catracaFim, idSV2, datainiSV2, datafimSV2, catracaIni, diff 
      FROM fnConsisteCatracaVEICULOS(@data, @diff) 
      ORDER BY idCarro
    `);
  return result.recordset;
}

// 2. Datas Incorretas (TotalizadorServico ts WHERE dataHIni NOT LIKE '%ano%' AND dataHoraUL >= 'startDate')
export async function queryDatasIncorretas(startDateStr: string, yearStr: string) {
  const pool = await getPool();
  if (!pool) throw new Error("Não foi possível conectar ao SQL Server.");

  const q1 = `
    SELECT totalEDM, catracaIni, catracaFim, idVeiculo, dataHIni, dataHFim, dataHoraUL 
    FROM TotalizadorServico ts 
    WHERE dataHIni NOT LIKE '%${yearStr}%' AND dataHoraUL >= @startDate 
    ORDER BY ts.catracaFim
  `;
  const q2 = `
    SELECT totalEDM, catracaIni, catracaFim, idVeiculo, dataHIni, dataHFim, dataHoraUL 
    FROM TotalizadorServico ts 
    WHERE dataHFim NOT LIKE '%${yearStr}%' AND dataHoraUL >= @startDate 
    ORDER BY ts.catracaFim
  `;
  const [res1, res2] = await Promise.all([
    pool.request().input("startDate", sql.VarChar, startDateStr).query(q1),
    pool.request().input("startDate", sql.VarChar, startDateStr).query(q2),
  ]);
  return {
    dataHIniInvalido: res1.recordset,
    dataHFimInvalido: res2.recordset,
  };
}

// 3. Veículos Fora da Frota
export async function queryVeiculosForaFrota(startDateStr: string, fleetIds: number[]) {
  const pool = await getPool();
  if (!pool) throw new Error("Não foi possível conectar ao SQL Server.");

  const queryGte6999 = `
    SELECT totalEDM, catracaIni, catracaFim, idVeiculo, dataHIni, dataHFim, dataHoraUL 
    FROM TotalizadorServico ts 
    WHERE dataHoraUL >= @startDate 
    AND idVeiculo NOT IN (${fleetIds.join(",")}) 
    AND idVeiculo >= 6999 
    ORDER BY ts.dataHFim, ts.idVeiculo
  `;
  const queryLt6000 = `
    SELECT totalEDM, catracaIni, catracaFim, idVeiculo, dataHIni, dataHFim, dataHoraUL 
    FROM TotalizadorServico ts 
    WHERE dataHoraUL >= @startDate 
    AND idVeiculo NOT IN (${fleetIds.join(",")}) 
    AND idVeiculo < 6000 
    ORDER BY ts.dataHFim, ts.idVeiculo
  `;
  const [resGte, resLt] = await Promise.all([
    pool.request().input("startDate", sql.VarChar, startDateStr).query(queryGte6999),
    pool.request().input("startDate", sql.VarChar, startDateStr).query(queryLt6000),
  ]);
  return {
    carrosEspeciais: resGte.recordset,
    carrosComuns: resLt.recordset,
  };
}

// 4. Verificar Serviços por Carro
export async function queryVeiculoServicos(idVeiculo: number, startDateStr: string) {
  const pool = await getPool();
  if (!pool) throw new Error("Não foi possível conectar ao SQL Server.");

  const result = await pool.request()
    .input("idVeiculo", sql.Int, idVeiculo)
    .input("startDate", sql.VarChar, startDateStr)
    .query(`
      SELECT totalEDM, catracaIni, catracaFim, idVeiculo, dataHIni, dataHFim, dataHoraUL 
      FROM TotalizadorServico ts 
      WHERE idVeiculo = @idVeiculo AND dataHoraUL >= @startDate 
      ORDER BY ts.dataHFim
    `);
  return result.recordset;
}

// 5. Verificar se os carros estão em Backup
export async function queryBackupStatus(ids: number[]) {
  const pool = await getPool();
  if (!pool) throw new Error("Não foi possível conectar ao SQL Server.");

  const result = await pool.request().query(`
    SELECT garagem as garage, coletaBKPIni, coletaBKPFim, emManutencao, idCarro 
    FROM Veiculos 
    WHERE idCarro IN (${ids.join(",")}) 
    ORDER BY idCarro
  `);
  return result.recordset;
}

// 6. Atualizar status de Backup dos carros
export async function updateBackupStatus(ids: number[], coletaBKPIni: string, coletaBKPFim: string) {
  const pool = await getPool();
  if (!pool) throw new Error("Não foi possível conectar ao SQL Server.");

  await pool.request()
    .input("bkpIni", sql.VarChar, coletaBKPIni)
    .input("bkpFim", sql.VarChar, coletaBKPFim)
    .query(`
      UPDATE Veiculos 
      SET coletaBKPIni = @bkpIni, coletaBKPFim = @bkpFim 
      WHERE idCarro IN (${ids.join(",")})
    `);
  return { success: true, updatedCount: ids.length };
}

// 7. Consulta de detalhamento automático de inconsistência
export async function queryDetalhesVeiculo(idVeiculo: number, dateStr: string) {
  const pool = await getPool();
  if (!pool) throw new Error("Não foi possível conectar ao SQL Server.");

  const resConsiste = await pool.request()
    .input("data", sql.VarChar, dateStr)
    .query(`
      SELECT TOP 1 datainiSV1, datafimSV2, catracaFim, catracaIni, datainiSV2 
      FROM fnConsisteCatracaVEICULOS(@data, 1) 
      WHERE idCarro = ${idVeiculo}
    `);
  const consisteRes = resConsiste.recordset[0];

  if (!consisteRes) {
    return {
      message: `Nenhuma inconsistência de catraca registrada para o carro ${idVeiculo} na data ${dateStr}.`,
      consistenciaBase: null,
    };
  }

  const { datainiSV1, datafimSV2, catracaFim, catracaIni, datainiSV2 } = consisteRes;

  // 1. tbLogWiFi - UltimaComunicacao
  const wifiQuery = `
    SELECT TOP 1 DataHora as UltimaComunicacao, ArquivoUL, CATRACA, ulAtualNome, MACValidador, MACWiFi, RemoteIP 
    FROM tbLogWiFi 
    WHERE DataHora > @inicio AND idCarro = @carro 
    ORDER BY DataHora DESC
  `;
  // 2. tbLogEventoErro - Erro 154
  const erroQuery = `
    SELECT idCartao, catraca, Datahora 
    FROM tbLogEventoErro 
    WHERE Datahora > @inicio AND codErro = 154 AND tipo = @carro 
    ORDER BY Datahora DESC
  `;
  // 3. tbLogWiFi - Catraca Fim (SV1)
  const catracaFimQuery = `
    SELECT TOP 2 catraca as CATRACA, MACValidador, DataHora 
    FROM tbLogWiFi 
    WHERE idCarro = @carro AND catraca = @catracaFim 
    ORDER BY DataHora DESC
  `;
  // 4. tbLogWiFi - Catraca Ini (SV2)
  const catracaIniQuery = `
    SELECT TOP 2 catraca as CATRACA, MACValidador, DataHora 
    FROM tbLogWiFi 
    WHERE idCarro = @carro AND catraca = @catracaIni 
    ORDER BY DataHora
  `;
  const servicosQuery = `
    DECLARE @INICIO_DIA DATETIME = CAST(CONVERT(DATE, @inicio) AS DATETIME);
    DECLARE @FIM_DIA DATETIME = DATEADD(SECOND, -1, DATEADD(DAY, 1, CAST(CONVERT(DATE, @fim) AS DATETIME)));

    SELECT 
      ts.totalEDM, 
      ts.catracaIni, 
      ts.catracaFim, 
      ts.idVeiculo, 
      ts.idLinha as linha,
      COALESCE(f.Nome, CAST(ts.matMotorista AS VARCHAR), ts.idMotorista) AS motorista,
      ts.dataHIni, 
      ts.dataHFim, 
      ts.dataHoraUL 
    FROM TotalizadorServico ts 
    OUTER APPLY (
      SELECT TOP 1 Nome FROM Funcionario WHERE CAST(idCartao AS VARCHAR) = ts.idMotorista OR (ts.matMotorista IS NOT NULL AND ts.matMotorista > 0 AND Matricula = ts.matMotorista AND idEmpresa = ts.idEmpresa)
    ) f
    WHERE ts.idVeiculo = @carro AND ts.dataHIni BETWEEN @INICIO_DIA AND @FIM_DIA 
    ORDER BY ts.dataHFim
  `;
  // 6. ManutencaoOrdemServico (bilhetagem)
  const osBilhetagemQuery = `
    SELECT TOP 1 Id, DataHora, Carro, LoginAbertura, NomeLoginAbertura, DatahoraFinalizacao,
           CASE WHEN DatahoraFinalizacao IS NOT NULL THEN 'Encerrada' 
                WHEN EmExecucao = 1 THEN 'Em Execução' 
                ELSE 'Aberta' END AS status
    FROM ManutencaoOrdemServico 
    WHERE Carro = @carro 
    AND DataHora >= DATEADD(DAY, -5, @inicio)
    ORDER BY Id DESC
  `;

  const req = pool.request()
    .input("carro", sql.Int, idVeiculo)
    .input("inicio", sql.DateTime, datainiSV1)
    .input("fim", sql.DateTime, datafimSV2)
    .input("catracaFim", sql.Int, catracaFim)
    .input("catracaIni", sql.Int, catracaIni);

  const [resWifi, resErro, resCatFim, resCatIni, resServ, resOSBil] = await Promise.all([
    req.query(wifiQuery),
    req.query(erroQuery),
    req.query(catracaFimQuery),
    req.query(catracaIniQuery),
    req.query(servicosQuery),
    req.query(osBilhetagemQuery),
  ]);

  // Subquery OS Itens se houver OS
  let osBilhetagemItens: any[] = [];
  const osBilhetagem = resOSBil.recordset[0];
  if (osBilhetagem) {
    const resOSItens = await pool.request()
      .input("idOS", sql.Int, osBilhetagem.Id)
      .query("SELECT * FROM ManutencaoOrdemServicoItens WHERE IdOrdemServico = @idOS");
    osBilhetagemItens = resOSItens.recordset;
  }

  // 7. OrdemServico (Simanet)
  let osSimanet: any = null;
  let osSimanetEquipamentos: any[] = [];
  try {
    const resOSSimanet = await pool.request().query(`
      SELECT TOP 1 IdOrdemServico, DataHora, IDVeiculo, status
      FROM Simanet.dbo.OrdemServico 
      WHERE IDVeiculo = ${idVeiculo} 
      AND IdOrdemServico IN (
        SELECT IdOrdemServico FROM Simanet.dbo.OrdemServicoEquipamento WHERE idTipoEquipamento = 2
      ) 
      ORDER BY IdOrdemServico DESC
    `);
    osSimanet = resOSSimanet.recordset[0];
    if (osSimanet) {
      const resOSSimEquip = await pool.request().query(`
        SELECT * FROM Simanet.dbo.OrdemServicoEquipamento 
        WHERE IdOrdemServico = ${osSimanet.IdOrdemServico}
      `);
      osSimanetEquipamentos = resOSSimEquip.recordset;
    }
  } catch (simanetErr) {
    console.error("[SQL Server] Erro ao consultar banco Simanet para OS, pulando", simanetErr);
  }

  return {
    consistenciaBase: consisteRes,
    ultimaComunicacao: resWifi.recordset[0] || null,
    errosEvento: resErro.recordset,
    primeiraLeituraCatracaFim: resCatFim.recordset,
    ultimaLeituraCatracaIni: resCatIni.recordset,
    servicosPeriodo: resServ.recordset,
    ordemServicoBilhetagem: osBilhetagem ? {
      Id: osBilhetagem.Id,
      DataHora: osBilhetagem.DataHora,
      Equipamento: "Validador / Catraca",
      status: osBilhetagem.status,
      itens: osBilhetagemItens.map((it: any) => ({
        NomeItem: `Defeito ${it.Defeito} (Grupo ${it.Grupo})`,
        Quantidade: 1,
        Observacao: it.ObservacaoDefeito ? `Relatado: ${it.ObservacaoDefeito}` : (it.ObservacaoFinalizacao ? `Solução: ${it.ObservacaoFinalizacao}` : ""),
        observacaoProblema: it.ObservacaoDefeito || "",
        observacaoSolucao: it.ObservacaoFinalizacao || ""
      }))
    } : null,
    ordemServicoSimanet: osSimanet ? {
      ...osSimanet,
      status: osSimanet.status === 'A' ? 'Aberta' : (osSimanet.status === 'R' ? 'Em Análise' : (osSimanet.status === 'F' ? 'Finalizada' : osSimanet.status)),
      equipamentos: osSimanetEquipamentos
    } : null,
  };
}

// 8. Consulta de veículos para o Controle Operacional
export async function queryVeiculosSelect() {
  const pool = await getPool();
  if (!pool) {
    console.log("[SQL Server] Retornando dados mockados de Veículos (sem conexão)");
    return [
      { idCarro: 101 },
      { idCarro: 102 },
      { idCarro: 103 },
      { idCarro: 104 },
      { idCarro: 201 },
    ];
  }

  try {
    const result = await pool.request().query(`
      SELECT idCarro 
      FROM Veiculos 
      WHERE ativo=1 and idCarro < 6000 and idCarro not in (1999,2999,3999,4999) 
      ORDER BY idCarro
    `);
    return result.recordset;
  } catch (error) {
    console.error("[SQL Server] Erro ao consultar veículos, retornando mocks:", error);
    return [
      { idCarro: 101 },
      { idCarro: 102 },
      { idCarro: 103 },
      { idCarro: 104 },
      { idCarro: 201 },
    ];
  }
}

// 9. Consulta de linhas para o Controle Operacional
export async function queryLinhasSelect() {
  const pool = await getPool();
  if (!pool) {
    console.log("[SQL Server] Retornando dados mockados de Linhas (sem conexão)");
    return [
      { descricao: "501 - Circular Centro" },
      { descricao: "302 - Bairro/Centro" },
      { descricao: "105 - Terminal Norte" },
      { descricao: "401 - Circular Sul" },
      { descricao: "202 - Circular Oeste" },
    ];
  }

  try {
    const result = await pool.request().query(`
      SELECT CONCAT(id, ' - ', Descricao) as descricao 
      FROM Linha 
      WHERE id not in (145, 146, 147, 678, 900, 901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912, 913, 914, 915, 000, 004) 
      ORDER BY Id
    `);
    return result.recordset;
  } catch (error) {
    console.error("[SQL Server] Erro ao consultar linhas, retornando mocks:", error);
    return [
      { descricao: "501 - Circular Centro" },
      { descricao: "302 - Bairro/Centro" },
      { descricao: "105 - Terminal Norte" },
      { descricao: "401 - Circular Sul" },
      { descricao: "202 - Circular Oeste" },
    ];
  }
}

