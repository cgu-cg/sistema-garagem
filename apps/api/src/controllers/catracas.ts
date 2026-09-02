import { Request, Response } from "express";
import prisma from "../utils/prisma";
import * as mssqlService from "../services/mssql";
import {
  consisteCatracaQuerySchema,
  datasIncorretasQuerySchema,
  foraFrotaQuerySchema,
  backupStatusQuerySchema,
  updateBackupSchema,
  detalhesVeiculoQuerySchema,
} from "../utils/schemas";

// Lista estática da frota fornecida pelo usuário
const STATIC_FLEET_IDS = [
  2025, 1000, 1108, 1109, 1110, 1111, 1112, 1113, 1114, 1115, 1116, 1117, 1118, 1119, 1120, 1121, 1122, 1123, 1124, 1125,
  1126, 1127, 1200, 1201, 1202, 1204, 1205, 1206, 1207, 1208, 1209, 1210, 1211, 1212, 1213, 1214, 1215, 1216, 1217, 1218,
  1219, 1220, 1221, 1222, 1223, 1224, 1225, 1226, 1227, 1228, 1229, 1230, 1231, 1232, 1233, 1234, 1260, 1261, 1262, 1263,
  1264, 1265, 1266, 1267, 1268, 1269, 1270, 1271, 1272, 1273, 1274, 1275, 1276, 1277, 1278, 1279, 1301, 1302, 1303, 1304,
  1305, 1306, 1307, 1308, 1309, 1310, 1311, 1312, 1313, 1314, 1315, 1316, 1317, 1318, 1319, 1320, 1321, 1322, 1323, 1324,
  1325, 1326, 1327, 1328, 1329, 1330, 1331, 1332, 1333, 1334, 1335, 1336, 1337, 1338, 1339, 1340, 1341, 1342, 1343, 1344,
  1345, 1346, 1347, 1348, 1349, 1350, 1351, 1352, 1353, 1354, 1355, 1356, 1357, 1358, 1359, 1360, 1361, 1362, 1363, 1364,
  1365, 1366, 1367, 1368, 1369, 1370, 1371, 1372, 1373, 1374, 1375, 1376, 1377, 1378, 1379, 1380, 1381, 1382, 1383, 1384,
  1385, 1386, 1387, 1388, 1389, 1390, 1391, 1392, 1393, 2319, 2320, 2321, 2323, 2324, 2325, 2326, 2327, 2328, 2329, 2330,
  2331, 2350, 2351, 2352, 2353, 2354, 2355, 2409, 2410, 2411, 2412, 2413, 2420, 2421, 2422, 2423, 2424, 2425, 2426, 2514,
  2515, 2516, 2600, 2601, 2611, 2613, 2615, 2623, 2625, 2627, 2629, 2631, 2633, 2635, 2637, 2639, 2700, 2701, 2702, 2703,
  2704, 2705, 2706, 2707, 2708, 2709, 2710, 2711, 2712, 2713, 2714, 2715, 2716, 2717, 2718, 2719, 2720, 2800, 2801, 2802,
  3003, 3004, 3005, 3006, 3008, 3011, 3012, 3013, 3014, 3016, 3021, 3022, 3026, 3027, 3028, 3034, 3035, 3047, 3057, 3062,
  3064, 3065, 3071, 3078, 3096, 3098, 3099, 3100, 3103, 3105, 3106, 3107, 3108, 3109, 3115, 3132, 3133, 3134, 3135, 3136,
  3137, 3138, 3139, 3140, 3141, 3146, 3147, 3148, 3149, 3200, 3201, 3202, 3203, 3204, 3205, 3206, 3207, 3208, 3209, 3210,
  3211, 3212, 3213, 3214, 3215, 3216, 3217, 3218, 3219, 3220, 3222, 3224, 3226, 3228, 3230, 3250, 3251, 3252, 3253, 3254,
  3255, 3257, 3259, 3261, 3263, 3265, 3267, 3269, 3271, 3273, 3275, 3277, 3279, 3281, 3283, 3850, 3851, 3852, 3853, 3854,
  3855, 3900, 3901, 3902, 3903, 3904, 3950, 3951, 3952, 3953, 3954, 3955, 3956, 3957, 3958, 3959, 4015, 4016, 4017, 4018,
  4178, 4180, 4181, 4182, 4183, 4184, 4185, 4186, 4187, 4188, 4189, 4190, 4191, 4192, 4193, 4194, 4195, 4196, 4197, 4198,
  4199, 4200, 4201, 4202, 4203, 4204, 4205, 4206, 4207, 4208, 4209, 4210, 4211, 4212, 4213, 4214, 4215, 4216, 4217, 4218,
  4219, 4220, 4221, 4222, 4223, 4224, 4225, 4226, 4227, 4228, 4229, 4230, 4231, 4232, 4233, 4234, 4235, 4236, 4237, 4238,
  4239, 4240, 4241, 4242, 4243, 4244, 4245, 4246, 4247, 4248, 4249, 4250, 4251, 4252, 4253, 4254, 4255, 4256, 4257, 4258,
  4259, 4260, 4261, 4262, 4263, 4264, 4265, 4266, 4267, 4268, 4269, 4270, 4271, 4272, 4273, 4274, 4275, 4276, 4277, 4278,
  4279,
];

// Helper para obter todos os carros do banco local cadastrados no sistema
async function getCompleteFleetIds(): Promise<number[]> {
  try {
    const buses = await prisma.bus.findMany({
      select: { prefix: true },
    });
    const localIds = buses.map((b: any) => parseInt(b.prefix, 10)).filter((id: number) => !isNaN(id));
    // Junta com a lista estática e remove duplicados
    return Array.from(new Set([...STATIC_FLEET_IDS, ...localIds]));
  } catch (err) {
    console.error("Erro ao buscar frota local do Prisma, usando estática:", err);
    return STATIC_FLEET_IDS;
  }
}

// 1. GET /api/catracas/consistencia
export async function getConsistenciaCatraca(req: Request, res: Response) {
  try {
    const { date, minDiff } = consisteCatracaQuerySchema.parse(req.query);
    const data = await mssqlService.queryConsistenciaCatraca(date, minDiff);
    res.json({
      isMock: mssqlService.isMockMode(),
      data,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Erro de validação" });
  }
}

// Função para calcular parâmetros padrão de alertas (ano atual e dia 01 do mês anterior)
export function calculateDefaultAlertParams(now = new Date()) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1 a 12

  let targetMonth: number;
  let targetYear = currentYear;

  if (currentMonth === 1) {
    // Janeiro: mês anterior é Dezembro do ano passado
    targetMonth = 12;
    targetYear = currentYear - 1;
  } else if (currentMonth === 12) {
    // Dezembro: mês anterior é Novembro (ou atual Dezembro)
    targetMonth = 11;
    targetYear = currentYear;
  } else {
    // Demais meses: mês anterior no dia 01 (ex: mês 09 -> 01/08/AAAA)
    targetMonth = currentMonth - 1;
    targetYear = currentYear;
  }

  const mm = String(targetMonth).padStart(2, "0");
  const startDateBR = `01/${mm}/${targetYear}`;
  const startDateISO = `${targetYear}-${mm}-01`;

  // Anos válidos permitidos (evita falsos positivos quando o período de consulta cruza a virada de ano)
  const allowedYears = Array.from(new Set([currentYear.toString(), targetYear.toString()]));

  return {
    year: currentYear.toString(),
    startDateBR,
    startDateISO,
    allowedYears,
  };
}

export function normalizeToDateBR(dateStr: string): string {
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${dd}/${mm}/${yyyy}`;
  }
  return dateStr;
}

// 2. GET /api/catracas/datas-incorretas
export async function getDatasIncorretas(req: Request, res: Response) {
  try {
    const parsed = datasIncorretasQuerySchema.parse(req.query);
    const defaults = calculateDefaultAlertParams();

    // Se o cliente enviar startDate em formato YYYY-MM-DD, normaliza para DD/MM/YYYY
    const rawStartDate = parsed.startDate || defaults.startDateBR;
    const startDate = normalizeToDateBR(rawStartDate);
    const year = parsed.year || defaults.year;

    // Detectar ano da data inicial para permitir virada de ano caso seja diferente
    const startYearMatch = startDate.match(/(\d{4})/);
    const startYear = startYearMatch ? startYearMatch[1] : year;
    const allowedYears = Array.from(new Set([year, startYear]));

    const data = await mssqlService.queryDatasIncorretas(startDate, year, allowedYears);
    res.json({
      isMock: mssqlService.isMockMode(),
      data,
      meta: {
        year,
        startDate,
        allowedYears,
        totalHIni: data?.dataHIniInvalido?.length || 0,
        totalHFim: data?.dataHFimInvalido?.length || 0,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Erro de validação" });
  }
}

// 3. GET /api/catracas/fora-frota
export async function getVeiculosForaFrota(req: Request, res: Response) {
  try {
    const parsed = foraFrotaQuerySchema.parse(req.query);
    const defaults = calculateDefaultAlertParams();

    const rawStartDate = parsed.startDate || defaults.startDateBR;
    const startDate = normalizeToDateBR(rawStartDate);

    const fleetIds = await getCompleteFleetIds();
    const data = await mssqlService.queryVeiculosForaFrota(startDate, fleetIds);

    res.json({
      isMock: mssqlService.isMockMode(),
      data,
      meta: {
        startDate,
        totalEspeciais: data?.carrosEspeciais?.length || 0,
        totalComuns: data?.carrosComuns?.length || 0,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Erro de validação" });
  }
}

// 4. GET /api/catracas/veiculo-servicos
export async function getVeiculoServicos(req: Request, res: Response) {
  try {
    const idVeiculo = parseInt(req.query.idVeiculo as string, 10);
    if (isNaN(idVeiculo)) {
      return res.status(400).json({ error: "idVeiculo inválido" });
    }

    // Default 1 mes atrás
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const defaultStartDate = d.toISOString().split("T")[0];
    const startDate = (req.query.startDate as string) || defaultStartDate;

    const data = await mssqlService.queryVeiculoServicos(idVeiculo, startDate);
    res.json({
      isMock: mssqlService.isMockMode(),
      data,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Erro de validação" });
  }
}

// 5. GET /api/catracas/backup
export async function getBackupStatus(req: Request, res: Response) {
  try {
    const { ids } = backupStatusQuerySchema.parse(req.query);
    const data = await mssqlService.queryBackupStatus(ids);
    res.json({
      isMock: mssqlService.isMockMode(),
      data,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Erro de validação" });
  }
}

// 6. POST /api/catracas/backup/update
export async function updateBackupStatus(req: Request, res: Response) {
  try {
    const { ids, coletaBKPIni, coletaBKPFim } = updateBackupSchema.parse(req.body);
    const data = await mssqlService.updateBackupStatus(ids, coletaBKPIni, coletaBKPFim);
    res.json({
      isMock: mssqlService.isMockMode(),
      data,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Erro de validação" });
  }
}

// 7. GET /api/catracas/detalhes-veiculo
export async function getDetalhesVeiculo(req: Request, res: Response) {
  try {
    const { idVeiculo, date } = detalhesVeiculoQuerySchema.parse(req.query);
    const data = await mssqlService.queryDetalhesVeiculo(idVeiculo, date);
    res.json({
      isMock: mssqlService.isMockMode(),
      data,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Erro de validação" });
  }
}

// 8. GET /api/catracas/diarios
export async function getDiarios(req: Request, res: Response) {
  try {
    const { carro, startDate, endDate, dateSV1, dateSV2 } = req.query as {
      carro?: string;
      startDate?: string;
      endDate?: string;
      dateSV1?: string;
      dateSV2?: string;
    };

    if (!carro || !startDate || !endDate) {
      return res.status(400).json({ error: "Parâmetros 'carro', 'startDate' e 'endDate' são obrigatórios" });
    }

    const { fetchDiariosRange } = await import("../services/diarios");
    const data = await fetchDiariosRange(carro, startDate, endDate, dateSV1, dateSV2);

    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao buscar diários de bordo" });
  }
}

