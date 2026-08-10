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
let useMock = !process.env.SQL_SERVER_HOST;

// Função para obter o pool de conexão
export async function getPool(): Promise<sql.ConnectionPool | null> {
  if (useMock) return null;
  if (pool && pool.connected) return pool;

  try {
    console.log(`[SQL Server] Tentando conectar a ${config.server}:${config.port}...`);
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log("[SQL Server] Conectado com sucesso!");
    return pool;
  } catch (error) {
    console.error("[SQL Server] Erro ao conectar no SQL Server. Ativando Modo Simulação.", error);
    useMock = true;
    return null;
  }
}

export function isMockMode(): boolean {
  return useMock;
}

// ----------------------------------------------------
// DADOS MOCKADOS (EM MEMÓRIA) PARA MODO SIMULAÇÃO
// ----------------------------------------------------

interface MockVeiculo {
  idCarro: number;
  garagem: string;
  coletaBKPIni: string | null;
  coletaBKPFim: string | null;
  emManutencao: boolean;
}

// Estado em memória para persistir alterações de backup de coleta
const mockVeiculos: MockVeiculo[] = [
  { idCarro: 1118, garagem: "1-VCM", coletaBKPIni: "01/08/2026 03:00:00", coletaBKPFim: "07/08/2026 02:59:59", emManutencao: false },
  { idCarro: 1327, garagem: "1-VCM", coletaBKPIni: null, coletaBKPFim: null, emManutencao: false },
  { idCarro: 2701, garagem: "2-VSF", coletaBKPIni: "01/08/2026 03:00:00", coletaBKPFim: "07/08/2026 02:59:59", emManutencao: true },
  { idCarro: 4251, garagem: "4-VCG", coletaBKPIni: null, coletaBKPFim: null, emManutencao: false },
  { idCarro: 1200, garagem: "1-VCM", coletaBKPIni: "01/08/2026 03:00:00", coletaBKPFim: "07/08/2026 02:59:59", emManutencao: false },
  { idCarro: 2025, garagem: "2-VSF", coletaBKPIni: null, coletaBKPFim: null, emManutencao: false },
];

// Helper para formatar datas em DD/MM/YYYY HH:mm:ss
function formatDateStr(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  const h = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  const s = date.getSeconds().toString().padStart(2, "0");
  return `${d}/${m}/${y} ${h}:${min}:${s}`;
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
      console.error("[SQL Server] Erro na queryConsistenciaCatraca, usando mock", err);
    }
  }

  // Fallback Mock
  console.log(`[SQL Server Mock] Executando ConsisteCatraca para ${dateStr}`);
  // Usar data de referência
  const baseDate = dateStr.includes("/") 
    ? dateStr.split("/").reverse().join("-") // converte DD/MM/YYYY para YYYY-MM-DD
    : dateStr;

  return [
    {
      idCarro: 4251,
      Linha: "3250",
      idSV1: 981123,
      datainiSV1: `${baseDate} 06:12:00`,
      datafimSV1: `${baseDate} 13:45:00`,
      catracaFim: 125430,
      idSV2: 981155,
      datainiSV2: `${baseDate} 14:15:00`,
      datafimSV2: `${baseDate} 22:50:00`,
      catracaIni: 125442,
      diff: 12,
    },
    {
      idCarro: 1118,
      Linha: "1118",
      idSV1: 980456,
      datainiSV1: `${baseDate} 05:00:00`,
      datafimSV1: `${baseDate} 12:30:00`,
      catracaFim: 89745,
      idSV2: 980512,
      datainiSV2: `${baseDate} 13:10:00`,
      datafimSV2: `${baseDate} 21:00:00`,
      catracaIni: 89753,
      diff: 8,
    },
    {
      idCarro: 2701,
      Linha: "2701",
      idSV1: 981320,
      datainiSV1: `${baseDate} 05:30:00`,
      datafimSV1: `${baseDate} 13:00:00`,
      catracaFim: 43210,
      idSV2: 981401,
      datainiSV2: `${baseDate} 13:45:00`,
      datafimSV2: `${baseDate} 22:00:00`,
      catracaIni: 43213,
      diff: 3,
    },
  ].filter(item => item.diff >= minDiff);
}

// 2. Datas Incorretas (TotalizadorServico ts WHERE dataHIni NOT LIKE '%ano%' AND dataHoraUL >= 'startDate')
export async function queryDatasIncorretas(startDateStr: string, yearStr: string) {
  const pool = await getPool();
  if (pool) {
    try {
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
    } catch (err) {
      console.error("[SQL Server] Erro na queryDatasIncorretas, usando mock", err);
    }
  }

  // Fallback Mock
  console.log(`[SQL Server Mock] Buscando datas incorretas para ano ${yearStr} desde ${startDateStr}`);
  return {
    dataHIniInvalido: [
      { totalEDM: 154, catracaIni: 1045, catracaFim: 1199, idVeiculo: 1327, dataHIni: "15/07/2025 04:32:00", dataHFim: "15/08/2026 01:22:00", dataHoraUL: `${yearStr}-08-01 12:44:00` },
      { totalEDM: 322, catracaIni: 54300, catracaFim: 54622, idVeiculo: 3100, dataHIni: "01/01/1900 00:00:00", dataHFim: "04/08/2026 23:45:00", dataHoraUL: `${yearStr}-08-04 23:59:00` },
    ],
    dataHFimInvalido: [
      { totalEDM: 95, catracaIni: 4320, catracaFim: 4415, idVeiculo: 1200, dataHIni: "05/08/2026 05:00:00", dataHFim: "05/08/2025 13:44:00", dataHoraUL: `${yearStr}-08-05 14:10:00` },
    ],
  };
}

// 3. Veículos Fora da Frota
export async function queryVeiculosForaFrota(startDateStr: string, fleetIds: number[]) {
  const pool = await getPool();
  if (pool) {
    try {
      // Divide em >= 6999 e < 6000
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
    } catch (err) {
      console.error("[SQL Server] Erro na queryVeiculosForaFrota, usando mock", err);
    }
  }

  // Fallback Mock
  console.log(`[SQL Server Mock] Buscando carros fora da frota desde ${startDateStr}`);
  return {
    carrosEspeciais: [
      { totalEDM: 10, catracaIni: 50, catracaFim: 60, idVeiculo: 7200, dataHIni: "01/08/2026 08:00:00", dataHFim: "01/08/2026 12:00:00", dataHoraUL: "2026-08-01 13:00:00" },
      { totalEDM: 25, catracaIni: 100, catracaFim: 125, idVeiculo: 8500, dataHIni: "03/08/2026 09:30:00", dataHFim: "03/08/2026 14:00:00", dataHoraUL: "2026-08-03 14:30:00" },
    ],
    carrosComuns: [
      { totalEDM: 80, catracaIni: 12440, catracaFim: 12520, idVeiculo: 999, dataHIni: "04/08/2026 06:00:00", dataHFim: "04/08/2026 14:30:00", dataHoraUL: "2026-08-04 15:00:00" },
      { totalEDM: 15, catracaIni: 5400, catracaFim: 5415, idVeiculo: 5990, dataHIni: "05/08/2026 17:00:00", dataHFim: "05/08/2026 19:30:00", dataHoraUL: "2026-08-05 20:00:00" },
    ],
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
      console.error("[SQL Server] Erro na queryVeiculoServicos, usando mock", err);
    }
  }

  // Fallback Mock
  console.log(`[SQL Server Mock] Buscando serviços para carro ${idVeiculo} desde ${startDateStr}`);
  return [
    { totalEDM: 120, catracaIni: 12000, catracaFim: 12120, idVeiculo, dataHIni: "01/08/2026 05:30:00", dataHFim: "01/08/2026 13:40:00", dataHoraUL: "2026-08-01 14:00:00" },
    { totalEDM: 98, catracaIni: 12120, catracaFim: 12218, idVeiculo, dataHIni: "02/08/2026 06:00:00", dataHFim: "02/08/2026 14:10:00", dataHoraUL: "2026-08-02 14:30:00" },
    { totalEDM: 115, catracaIni: 12218, catracaFim: 12333, idVeiculo, dataHIni: "03/08/2026 05:45:00", dataHFim: "03/08/2026 14:00:00", dataHoraUL: "2026-08-03 14:15:00" },
    { totalEDM: 80, catracaIni: 12333, catracaFim: 12413, idVeiculo, dataHIni: "04/08/2026 06:12:00", dataHFim: "04/08/2026 13:30:00", dataHoraUL: "2026-08-04 13:45:00" },
    { totalEDM: 110, catracaIni: 12413, catracaFim: 12523, idVeiculo, dataHIni: "05/08/2026 06:00:00", dataHFim: "05/08/2026 14:30:00", dataHoraUL: "2026-08-05 15:00:00" },
  ];
}

// 5. Verificar se os carros estão em Backup
export async function queryBackupStatus(ids: number[]) {
  const pool = await getPool();
  if (pool) {
    try {
      const result = await pool.request().query(`
        SELECT garagem as garage, coletaBKPIni, coletaBKPFim, emManutencao, idCarro 
        FROM Veiculos 
        WHERE idCarro IN (${ids.join(",")}) 
        ORDER BY idCarro
      `);
      return result.recordset;
    } catch (err) {
      console.error("[SQL Server] Erro na queryBackupStatus, usando mock", err);
    }
  }

  // Fallback Mock
  console.log(`[SQL Server Mock] Buscando status de backup para carros: [${ids.join(", ")}]`);
  return mockVeiculos.filter((v) => ids.includes(v.idCarro));
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
      console.error("[SQL Server] Erro ao atualizar status de backup, usando mock", err);
    }
  }

  // Fallback Mock
  console.log(`[SQL Server Mock] Atualizando backup para [${ids.join(", ")}]. Ini: ${coletaBKPIni}, Fim: ${coletaBKPFim}`);
  mockVeiculos.forEach((v) => {
    if (ids.includes(v.idCarro)) {
      v.coletaBKPIni = coletaBKPIni;
      v.coletaBKPFim = coletaBKPFim;
    }
  });
  return { success: true, updatedCount: ids.length };
}

// 7. Consulta de detalhamento automático de inconsistência
export async function queryDetalhesVeiculo(idVeiculo: number, dateStr: string) {
  const pool = await getPool();
  
  let consisteRes: any = null;
  if (pool) {
    try {
      const resConsiste = await pool.request()
        .input("data", sql.VarChar, dateStr)
        .query(`
          SELECT TOP 1 datainiSV1, datafimSV2, catracaFim, catracaIni, datainiSV2, datainiSV1 as datainiSV1_ref 
          FROM fnConsisteCatracaVEICULOS(@data, 1) 
          WHERE idCarro = ${idVeiculo}
        `);
      consisteRes = resConsiste.recordset[0];
    } catch (err) {
      console.error("[SQL Server] Erro ao buscar consistência base de detalhes", err);
    }
  } else {
    // Carregar mock consistência correspondente
    const consistencias = await queryConsistenciaCatraca(dateStr, 1);
    const match = consistencias.find((c) => c.idCarro === idVeiculo);
    if (match) {
      consisteRes = {
        datainiSV1: match.datainiSV1,
        datafimSV2: match.datafimSV2,
        catracaFim: match.catracaFim,
        catracaIni: match.catracaIni,
        datainiSV2: match.datainiSV2,
        datainiSV1_ref: match.datainiSV1,
      };
    }
  }

  if (!consisteRes) {
    return {
      message: `Nenhuma inconsistência de catraca registrada para o carro ${idVeiculo} na data ${dateStr}.`,
      consistenciaBase: null,
    };
  }

  const { datainiSV1, datafimSV2, catracaFim, catracaIni, datainiSV2, datainiSV1_ref } = consisteRes;

  if (pool) {
    try {
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
      // 3. tbLogWiFi - Catraca Fim primeira leitura
      const catracaFimQuery = `
        SELECT * FROM (
          SELECT TOP 2 CATRACA, MACValidador, DataHora 
          FROM tbLogWiFi 
          WHERE catraca = @catracaFim AND idCarro = @carro AND DataHora > @dataRefFim
        ) AS sub ORDER BY DataHora DESC
      `;
      // 4. tbLogWiFi - Catraca Ini ultima leitura
      const catracaIniQuery = `
        SELECT TOP 2 CATRACA, MACValidador, DataHora 
        FROM tbLogWiFi 
        WHERE catraca = @catracaIni AND idCarro = @carro AND DataHora < @dataRef
        ORDER BY DataHora DESC
      `;
      // 5. TotalizadorServico - no período (incluindo Linha e Motorista)
      const servicosQuery = `
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
        WHERE ts.idVeiculo = @carro AND ts.dataHIni BETWEEN @inicio AND @fim 
        ORDER BY ts.dataHFim
      `;
      // 6. ManutencaoOrdemServico (bilhetagem)
      const osBilhetagemQuery = `
        SELECT TOP 1 Id, DataHora, Carro, LoginAbertura, NomeLoginAbertura, DatahoraFinalizacao,
               CASE WHEN DatahoraFinalizacao IS NOT NULL THEN 'Encerrada' 
                    WHEN EmExecucao = 1 THEN 'Em Execução' 
                    ELSE 'Aberta' END AS status
        FROM ManutencaoOrdemServico 
        WHERE Carro = @carro AND DataHora >= DATEADD(day, -3, @inicio) 
        ORDER BY DataHora DESC
      `;
      
      const req = pool.request()
        .input("carro", sql.Int, idVeiculo)
        .input("inicio", sql.DateTime, datainiSV1)
        .input("fim", sql.DateTime, datafimSV2)
        .input("catracaFim", sql.Int, catracaFim)
        .input("catracaIni", sql.Int, catracaIni)
        .input("dataRef", sql.DateTime, datainiSV2)
        .input("dataRefFim", sql.DateTime, datainiSV1_ref);

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
    } catch (err) {
      console.error("[SQL Server] Erro ao buscar detalhes, usando mock", err);
    }
  }

  // Fallback Mock
  console.log(`[SQL Server Mock] Buscando detalhes de veículo para carro ${idVeiculo} e data ${dateStr}`);
  
  // Converter as datas dos limites
  const dataIni = new Date(datainiSV1);
  const dataFim = new Date(datafimSV2);
  const dataRef = new Date(datainiSV2);
  const dataRefFim = new Date(datainiSV1_ref);

  const mockWifi: any[] = [];
  const mockErros: any[] = [];

  // Gerar alguns registros de logs wifi fictícios
  for (let i = 0; i < 5; i++) {
    const logTime = new Date(dataIni.getTime() + i * 2 * 3600 * 1000);
    mockWifi.push({
      UltimaComunicacao: formatDateStr(logTime),
      ArquivoUL: `UL_CATRACA_${idVeiculo}_${logTime.getTime()}.xml`,
      CATRACA: catracaFim - 100 + i * 20,
      ulAtualNome: "Garagem Central WiFi",
      MACValidador: "00:1A:2B:3C:4D:5E",
      MACWiFi: "AA:BB:CC:DD:EE:FF",
      RemoteIP: "192.168.10.150",
    });
  }

  // Logs para o batimento
  const mockCatFimLogs = [
    { CATRACA: catracaFim, MACValidador: "00:1A:2B:3C:4D:5E", DataHora: formatDateStr(new Date(dataRefFim.getTime() + 15 * 60 * 1000)) },
    { CATRACA: catracaFim, MACValidador: "00:1A:2B:3C:4D:5E", DataHora: formatDateStr(new Date(dataRefFim.getTime() + 5 * 60 * 1000)) }
  ];

  const mockCatIniLogs = [
    { CATRACA: catracaIni, MACValidador: "00:1A:2B:3C:4D:5E", DataHora: formatDateStr(new Date(dataRef.getTime() - 5 * 60 * 1000)) },
    { CATRACA: catracaIni, MACValidador: "00:1A:2B:3C:4D:5E", DataHora: formatDateStr(new Date(dataRef.getTime() - 15 * 60 * 1000)) }
  ];

  // Cartões com erro 154
  mockErros.push(
    { idCartao: 9876543, catraca: catracaFim + 2, Datahora: formatDateStr(new Date(dataIni.getTime() + 45 * 60 * 1000)) },
    { idCartao: 9876544, catraca: catracaFim + 5, Datahora: formatDateStr(new Date(dataIni.getTime() + 75 * 60 * 1000)) }
  );

  // Serviços no período
  const mockServs = [
    { totalEDM: 15, catracaIni: catracaFim - 15, catracaFim, idVeiculo, linha: "080", motorista: "CARLOS SILVA (1240)", dataHIni: formatDateStr(dataIni), dataHFim: formatDateStr(new Date(dataIni.getTime() + 4 * 3600 * 1000)), dataHoraUL: formatDateStr(new Date(dataIni.getTime() + 4.2 * 3600 * 1000)) },
    { totalEDM: 18, catracaIni, catracaFim: catracaIni + 18, idVeiculo, linha: "080", motorista: "JOAO PEREIRA (3820)", dataHIni: formatDateStr(dataRef), dataHFim: formatDateStr(dataFim), dataHoraUL: formatDateStr(new Date(dataFim.getTime() + 15 * 60 * 1000)) }
  ];

  // Ordem de Serviço Bilhetagem
  const mockOSBil = {
    Id: 7856,
    DataHora: formatDateStr(new Date(dataIni.getTime() - 24 * 3600 * 1000)),
    carro: idVeiculo,
    status: "Encerrada",
    Equipamento: "Validador V1",
    itens: [
      { IdOrdemServico: 7856, CodItem: 104, NomeItem: "Cabo de alimentação do validador", Quantidade: 1, Observacao: "Troca preventiva realizada" },
      { IdOrdemServico: 7856, CodItem: 302, NomeItem: "Configuração de firmware", Quantidade: 1, Observacao: "Atualização para versão 2.45" }
    ]
  };

  // Ordem de Serviço Simanet
  const mockOSSimanet = {
    IdOrdemServico: 12569,
    DataHora: formatDateStr(new Date(dataIni.getTime() - 48 * 3600 * 1000)),
    IDVeiculo: idVeiculo,
    status: "Faturada",
    equipamentos: [
      { IdOrdemServico: 12569, idTipoEquipamento: 2, descricao: "Catraca Mecânica 4 Braços", numeroSerie: "CAT-45892", defeitoRelatado: "Travando ao girar" }
    ]
  };

  return {
    consistenciaBase: consisteRes,
    ultimaComunicacao: mockWifi[0] || null,
    errosEvento: mockErros,
    primeiraLeituraCatracaFim: mockCatFimLogs,
    ultimaLeituraCatracaIni: mockCatIniLogs,
    servicosPeriodo: mockServs,
    ordemServicoBilhetagem: mockOSBil,
    ordemServicoSimanet: mockOSSimanet,
  };
}
