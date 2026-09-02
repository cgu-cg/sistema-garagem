import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

// Configuração do SQL Server
const config: sql.config = {
  user: process.env.SQL_SERVER_USER || "",
  password: process.env.SQL_SERVER_PASSWORD || "",
  server: process.env.SQL_SERVER_HOST || "localhost",
  port: parseInt(process.env.SQL_SERVER_PORT || "1433"),
  database: process.env.SQL_SERVER_DATABASE || "bilhetagem",
  options: {
    encrypt: process.env.SQL_SERVER_ENCRYPT === "true",
    trustServerCertificate: process.env.SQL_SERVER_TRUST_SERVER_CERTIFICATE !== "false",
    enableArithAbort: true,
  },
  connectionTimeout: 3000,
  requestTimeout: 5000,
};

let pool: sql.ConnectionPool | null = null;
let connectionAttempted = false;

// Função para obter o pool de conexão
export async function getPool(): Promise<sql.ConnectionPool | null> {
  if (pool && pool.connected) return pool;
  if (!process.env.SQL_SERVER_HOST) return null;

  if (connectionAttempted && !pool?.connected) return null;
  connectionAttempted = true;

  try {
    console.log(`[SQL Server] Tentando conectar a ${config.server}:${config.port}...`);
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log("[SQL Server] Conectado com sucesso!");
    return pool;
  } catch (error) {
    console.warn("[SQL Server] Banco SQL Server offline — usando dados simulados (mock)");
    pool = null;
    return null;
  }
}

export function isMockMode(): boolean {
  return !pool || !pool.connected;
}

// 1. Diferenças de Catraca (fnConsisteCatracaVEICULOS)
export async function queryConsistenciaCatraca(dateStr: string, minDiff: number) {
  const pool = await getPool();
  if (pool) {
    try {
      const result = await pool.request()
        .input("data", sql.VarChar, dateStr)
        .input("diff", sql.Int, minDiff)
        .query(`
          SELECT idCarro, Linha, idSV1, datainiSV1, datafimSV1, catracaFim, idSV2, datainiSV2, datafimSV2, catracaIni, diff 
          FROM fnConsisteCatracaVEICULOS(@data, @diff) 
          ORDER BY idCarro
        `);
      return result.recordset;
    } catch (err) {
      console.warn("[SQL Server] Falha na consulta de consistência, retornando mock:", err);
    }
  }

  // Mock data
  return [
    {
      idCarro: 1201,
      Linha: "501 - CIRCULAR CENTRO",
      idSV1: 89412,
      datainiSV1: `${dateStr} 05:40:00`,
      datafimSV1: `${dateStr} 12:30:00`,
      catracaFim: 4520,
      idSV2: 89455,
      datainiSV2: `${dateStr} 13:00:00`,
      datafimSV2: `${dateStr} 20:10:00`,
      catracaIni: 4535,
      diff: 15,
    },
    {
      idCarro: 1204,
      Linha: "302 - BAIRRO / CENTRO",
      idSV1: 89415,
      datainiSV1: `${dateStr} 06:10:00`,
      datafimSV1: `${dateStr} 13:45:00`,
      catracaFim: 12890,
      idSV2: 89462,
      datainiSV2: `${dateStr} 14:15:00`,
      datafimSV2: `${dateStr} 22:00:00`,
      catracaIni: 12898,
      diff: 8,
    },
    {
      idCarro: 2319,
      Linha: "105 - TERMINAL NORTE",
      idSV1: 89420,
      datainiSV1: `${dateStr} 05:15:00`,
      datafimSV1: `${dateStr} 11:50:00`,
      catracaFim: 3100,
      idSV2: 89470,
      datainiSV2: `${dateStr} 12:20:00`,
      datafimSV2: `${dateStr} 19:30:00`,
      catracaIni: 3112,
      diff: 12,
    },
  ].filter(item => item.diff >= minDiff);
}

// 2. Datas Incorretas (TotalizadorServico ts WHERE dataHIni NOT LIKE '%ano%' AND dataHoraUL >= 'startDate')
export async function queryDatasIncorretas(startDateStr: string, yearStr: string, allowedYears?: string[]) {
  const pool = await getPool();
  if (pool) {
    try {
      const years = allowedYears && allowedYears.length > 0 ? allowedYears : [yearStr];
      const whereHIni = years.map((y) => `dataHIni NOT LIKE '%${y}%'`).join(" AND ");
      const whereHFim = years.map((y) => `dataHFim NOT LIKE '%${y}%'`).join(" AND ");

      const q1 = `
        SELECT totalEDM, catracaIni, catracaFim, idVeiculo, dataHIni, dataHFim, dataHoraUL 
        FROM TotalizadorServico ts 
        WHERE ${whereHIni} AND dataHoraUL >= @startDate 
        ORDER BY ts.catracaFim
      `;
      const q2 = `
        SELECT totalEDM, catracaIni, catracaFim, idVeiculo, dataHIni, dataHFim, dataHoraUL 
        FROM TotalizadorServico ts 
        WHERE ${whereHFim} AND dataHoraUL >= @startDate 
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
    } catch (err) {
      console.warn("[SQL Server] Falha em datas incorretas, usando mock:", err);
    }
  }

  return {
    dataHIniInvalido: [
      {
        totalEDM: 142,
        catracaIni: 3120,
        catracaFim: 3262,
        idVeiculo: 1301,
        dataHIni: "1970-01-01 00:00:00",
        dataHFim: `${startDateStr} 18:20:00`,
        dataHoraUL: `${startDateStr} 18:25:00`,
      },
    ],
    dataHFimInvalido: [],
  };
}

// 3. Veículos Fora da Frota
export async function queryVeiculosForaFrota(startDateStr: string, fleetIds: number[]) {
  const pool = await getPool();
  if (pool) {
    try {
      const queryGte6999 = `
        SELECT totalEDM, catracaIni, catracaFim, idVeiculo, dataHIni, dataHFim, dataHoraUL 
        FROM TotalizadorServico ts 
        WHERE dataHoraUL >= @startDate 
        AND idLinha <> '888'
        AND idVeiculo NOT IN (${fleetIds.join(",")}) 
        AND idVeiculo >= 6999 
        ORDER BY ts.dataHFim, ts.idVeiculo
      `;
      const queryLt6000 = `
        SELECT totalEDM, catracaIni, catracaFim, idVeiculo, dataHIni, dataHFim, dataHoraUL 
        FROM TotalizadorServico ts 
        WHERE dataHoraUL >= @startDate 
        AND idLinha <> '888'
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
    } catch (err) {
      console.warn("[SQL Server] Falha em veículos fora de frota, usando mock:", err);
    }
  }

  return {
    carrosEspeciais: [],
    carrosComuns: [],
  };
}

// 4. Verificar Serviços por Carro
export async function queryVeiculoServicos(idVeiculo: number, startDateStr: string) {
  const pool = await getPool();
  if (pool) {
    try {
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
    } catch (err) {
      console.warn("[SQL Server] Falha em veiculo servicos, usando mock:", err);
    }
  }

  return [
    {
      totalEDM: 185,
      catracaIni: 4335,
      catracaFim: 4520,
      idVeiculo,
      dataHIni: `${startDateStr} 05:40:00`,
      dataHFim: `${startDateStr} 12:30:00`,
      dataHoraUL: `${startDateStr} 12:35:00`,
    },
    {
      totalEDM: 210,
      catracaIni: 4535,
      catracaFim: 4745,
      idVeiculo,
      dataHIni: `${startDateStr} 13:00:00`,
      dataHFim: `${startDateStr} 20:10:00`,
      dataHoraUL: `${startDateStr} 20:15:00`,
    },
  ];
}

// 5. Verificar se os carros estão em Backup (se ids informado filtra, senão traz WHERE coletaBKPIni IS NOT NULL)
export async function queryBackupStatus(ids?: number[]) {
  const pool = await getPool();
  if (pool) {
    try {
      const hasSpecificIds = ids && ids.length > 0;
      const whereClause = hasSpecificIds
        ? `WHERE idCarro IN (${ids.join(",")})`
        : `WHERE coletaBKPIni IS NOT NULL`;

      const result = await pool.request().query(`
        SELECT garagem as garage, coletaBKPIni, coletaBKPFim, emManutencao, * 
        FROM Veiculos 
        ${whereClause} 
        ORDER BY idCarro
      `);
      return result.recordset;
    } catch (err) {
      console.warn("[SQL Server] Falha em status backup, usando mock:", err);
    }
  }

  const mockIds = ids && ids.length > 0 ? ids : [1118, 1327, 2701];
  return mockIds.map((id, index) => ({
    idCarro: id,
    garage: index % 2 === 0 ? "VCG" : "VCM",
    coletaBKPIni: "2026-08-01 03:00:00",
    coletaBKPFim: "2026-08-07 02:59:59",
    emManutencao: 0,
  }));
}

// 6. Atualizar status de Backup dos carros
export async function updateBackupStatus(ids: number[], coletaBKPIni: string, coletaBKPFim: string) {
  const pool = await getPool();
  if (pool) {
    try {
      await pool.request()
        .input("bkpIni", sql.VarChar, coletaBKPIni)
        .input("bkpFim", sql.VarChar, coletaBKPFim)
        .query(`
          UPDATE Veiculos 
          SET coletaBKPIni = @bkpIni, coletaBKPFim = @bkpFim 
          WHERE idCarro IN (${ids.join(",")})
        `);
      return { success: true, updatedCount: ids.length };
    } catch (err) {
      console.warn("[SQL Server] Falha ao atualizar backup, usando mock:", err);
    }
  }

  return { success: true, updatedCount: ids.length };
}

// 7. Consulta de detalhamento automático de inconsistência
export async function queryDetalhesVeiculo(idVeiculo: number, dateStr: string) {
  const pool = await getPool();
  if (pool) {
    try {
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

      const wifiQuery = `
        SELECT TOP 1 DataHora as UltimaComunicacao, ArquivoUL, CATRACA, ulAtualNome, MACValidador, MACWiFi, RemoteIP 
        FROM tbLogWiFi 
        WHERE DataHora > @inicio AND idCarro = @carro 
        ORDER BY DataHora DESC
      `;
      const erroQuery = `
        SELECT idCartao, catraca, Datahora 
        FROM tbLogEventoErro 
        WHERE Datahora > @inicio AND codErro = 154 AND tipo = @carro 
        ORDER BY Datahora DESC
      `;
      const catracaFimQuery = `
        SELECT TOP 2 catraca as CATRACA, MACValidador, DataHora 
        FROM tbLogWiFi 
        WHERE idCarro = @carro AND catraca = @catracaFim 
        ORDER BY DataHora DESC
      `;
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

      let osBilhetagemItens: any[] = [];
      const osBilhetagem = resOSBil.recordset[0];
      if (osBilhetagem) {
        const resOSItens = await pool.request()
          .input("idOS", sql.Int, osBilhetagem.Id)
          .query("SELECT * FROM ManutencaoOrdemServicoItens WHERE IdOrdemServico = @idOS");
        osBilhetagemItens = resOSItens.recordset;
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
            Observacao: it.ObservacaoDefeito ? `Relatado: ${it.ObservacaoDefeito}` : "",
            observacaoProblema: it.ObservacaoDefeito || "",
            observacaoSolucao: it.ObservacaoFinalizacao || "",
          })),
        } : null,
        ordemServicoSimanet: null,
      };
    } catch (err) {
      console.warn("[SQL Server] Falha ao consultar detalhes veículo, usando mock:", err);
    }
  }

  // Mocked details
  return {
    consistenciaBase: {
      datainiSV1: `${dateStr} 05:40:00`,
      datafimSV2: `${dateStr} 20:10:00`,
      catracaFim: 4520,
      catracaIni: 4535,
      datainiSV2: `${dateStr} 13:00:00`,
    },
    ultimaComunicacao: {
      UltimaComunicacao: `${dateStr} 20:15:32`,
      ArquivoUL: `UL_${idVeiculo}_${dateStr.replace(/-/g, "")}.dat`,
      CATRACA: 4745,
      ulAtualNome: `GARAGEM_WIFI_01`,
      MACValidador: "00:1B:44:11:3A:B7",
      MACWiFi: "70:85:C2:54:19:90",
      RemoteIP: "192.168.1.104",
    },
    errosEvento: [],
    primeiraLeituraCatracaFim: [
      { CATRACA: 4520, MACValidador: "00:1B:44:11:3A:B7", DataHora: `${dateStr} 12:30:00` },
    ],
    ultimaLeituraCatracaIni: [
      { CATRACA: 4535, MACValidador: "00:1B:44:11:3A:B7", DataHora: `${dateStr} 13:00:00` },
    ],
    servicosPeriodo: [
      {
        totalEDM: 185,
        catracaIni: 4335,
        catracaFim: 4520,
        idVeiculo,
        linha: "501 - CIRCULAR CENTRO",
        motorista: "JOAO SILVA",
        dataHIni: `${dateStr} 05:40:00`,
        dataHFim: `${dateStr} 12:30:00`,
        dataHoraUL: `${dateStr} 12:35:00`,
      },
      {
        totalEDM: 210,
        catracaIni: 4535,
        catracaFim: 4745,
        idVeiculo,
        linha: "501 - CIRCULAR CENTRO",
        motorista: "CARLOS SOUZA",
        dataHIni: `${dateStr} 13:00:00`,
        dataHFim: `${dateStr} 20:10:00`,
        dataHoraUL: `${dateStr} 20:15:00`,
      },
    ],
    ordemServicoBilhetagem: null,
    ordemServicoSimanet: null,
  };
}

// 8. Consulta de veículos para o Controle Operacional
export async function queryVeiculosSelect() {
  const pool = await getPool();
  if (pool) {
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
    }
  }

  return [
    { idCarro: 101 },
    { idCarro: 102 },
    { idCarro: 103 },
    { idCarro: 104 },
    { idCarro: 1201 },
    { idCarro: 1202 },
    { idCarro: 1204 },
    { idCarro: 1301 },
    { idCarro: 2319 },
    { idCarro: 3003 },
    { idCarro: 4178 },
  ];
}

// 9. Consulta de linhas para o Controle Operacional
export async function queryLinhasSelect() {
  const pool = await getPool();
  if (pool) {
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
    }
  }

  return [
    { descricao: "501 - Circular Centro" },
    { descricao: "302 - Bairro/Centro" },
    { descricao: "105 - Terminal Norte" },
    { descricao: "401 - Circular Sul" },
    { descricao: "202 - Circular Oeste" },
  ];
}
