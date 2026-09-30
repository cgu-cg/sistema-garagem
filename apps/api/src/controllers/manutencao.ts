import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";

export function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const DEFAULT_REF_DATE = getTodayDate();

export const SEED_MANUTENCAO_OFICIAL = [
  // VSF
  { id: "manut-2424", prefixo: "2424", consorciada: "VSF", observacao: "MOTOR", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-2600", prefixo: "2600", consorciada: "VSF", observacao: "MECÂNICA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-2611", prefixo: "2611", consorciada: "VSF", observacao: "MOTOR", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-2700", prefixo: "2700", consorciada: "VSF", observacao: "CÂMBIO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-2712", prefixo: "2712", consorciada: "VSF", observacao: "MODULO", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-2800", prefixo: "2800", consorciada: "VSF", observacao: "SINISTRO", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-2319", prefixo: "2319", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2323", prefixo: "2323", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2325", prefixo: "2325", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2355", prefixo: "2355", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2409", prefixo: "2409", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2411", prefixo: "2411", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2412", prefixo: "2412", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2420", prefixo: "2420", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2423", prefixo: "2423", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2425", prefixo: "2425", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2426", prefixo: "2426", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2514", prefixo: "2514", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2613", prefixo: "2613", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2615", prefixo: "2615", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2704", prefixo: "2704", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2713", prefixo: "2713", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-2801", prefixo: "2801", consorciada: "VSF", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },

  // JTU
  { id: "manut-3005", prefixo: "3005", consorciada: "JTU", observacao: "MECÂNICA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3006", prefixo: "3006", consorciada: "JTU", observacao: "MECÂNICA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3014", prefixo: "3014", consorciada: "JTU", observacao: "COXIM MOTOR", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3057", prefixo: "3057", consorciada: "JTU", observacao: "VIDRO DA JANELA", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3078", prefixo: "3078", consorciada: "JTU", observacao: "REVISÃO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3098", prefixo: "3098", consorciada: "JTU", observacao: "RADIADOR", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3099", prefixo: "3099", consorciada: "JTU", observacao: "REVISÃO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3100", prefixo: "3100", consorciada: "JTU", observacao: "FALHANDO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3106", prefixo: "3106", consorciada: "JTU", observacao: "MECÂNICA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3133", prefixo: "3133", consorciada: "JTU", observacao: "MOTOR", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3217", prefixo: "3217", consorciada: "JTU", observacao: "ALTERNADOR", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3220", prefixo: "3220", consorciada: "JTU", observacao: "ALINHAMENTO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3224", prefixo: "3224", consorciada: "JTU", observacao: "TACOGRAFO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3230", prefixo: "3230", consorciada: "JTU", observacao: "MANUTENÇÃO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3257", prefixo: "3257", consorciada: "JTU", observacao: "VIDRO", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3903", prefixo: "3903", consorciada: "JTU", observacao: "ALINHAMENTO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3950", prefixo: "3950", consorciada: "JTU", observacao: "CAMBIO", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3951", prefixo: "3951", consorciada: "JTU", observacao: "ELÉTRICA", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3953", prefixo: "3953", consorciada: "JTU", observacao: "MOTOR", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-3003", prefixo: "3003", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3021", prefixo: "3021", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3034", prefixo: "3034", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3103", prefixo: "3103", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3107", prefixo: "3107", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3132", prefixo: "3132", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3134", prefixo: "3134", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3136", prefixo: "3136", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3139", prefixo: "3139", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3140", prefixo: "3140", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3147", prefixo: "3147", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3148", prefixo: "3148", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3202", prefixo: "3202", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3226", prefixo: "3226", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3281", prefixo: "3281", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3902", prefixo: "3902", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-3904", prefixo: "3904", consorciada: "JTU", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },

  // VCG
  { id: "manut-4178", prefixo: "4178", consorciada: "VCG", observacao: "ELEVADOR", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4185", prefixo: "4185", consorciada: "VCG", observacao: "REVISÃO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4190", prefixo: "4190", consorciada: "VCG", observacao: "VIDRO BOLHA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4191", prefixo: "4191", consorciada: "VCG", observacao: "MECÂNICA", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4195", prefixo: "4195", consorciada: "VCG", observacao: "ELEVADOR", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4196", prefixo: "4196", consorciada: "VCG", observacao: "MODULO", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4198", prefixo: "4198", consorciada: "VCG", observacao: "ELÉTRICA", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4199", prefixo: "4199", consorciada: "VCG", observacao: "MECÂNICA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4200", prefixo: "4200", consorciada: "VCG", observacao: "MECÂNICA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4201", prefixo: "4201", consorciada: "VCG", observacao: "MECÂNICA", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4205", prefixo: "4205", consorciada: "VCG", observacao: "SUSPENSÃO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4212", prefixo: "4212", consorciada: "VCG", observacao: "FREIO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4219", prefixo: "4219", consorciada: "VCG", observacao: "REVISÃO", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4221", prefixo: "4221", consorciada: "VCG", observacao: "MOTOR", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4233", prefixo: "4233", consorciada: "VCG", observacao: "MECÂNICA", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4255", prefixo: "4255", consorciada: "VCG", observacao: "MODULO", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4259", prefixo: "4259", consorciada: "VCG", observacao: "ELEVADOR", bloqueado: true, emExecucao: true, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4269", prefixo: "4269", consorciada: "VCG", observacao: "REVISÃO", bloqueado: true, emExecucao: false, liberado: false, data: DEFAULT_REF_DATE },
  { id: "manut-4016", prefixo: "4016", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4181", prefixo: "4181", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4182", prefixo: "4182", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4183", prefixo: "4183", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4188", prefixo: "4188", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4203", prefixo: "4203", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4204", prefixo: "4204", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4213", prefixo: "4213", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4214", prefixo: "4214", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4215", prefixo: "4215", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4238", prefixo: "4238", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4248", prefixo: "4248", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4256", prefixo: "4256", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
  { id: "manut-4263", prefixo: "4263", consorciada: "VCG", observacao: "", bloqueado: false, emExecucao: false, liberado: true, data: DEFAULT_REF_DATE },
];

let tableEnsured = false;

async function ensureTableAndSeed() {
  if (tableEnsured) return;

  try {
    const checkTable: any[] = await prisma.$queryRawUnsafe(`
      SELECT 1 AS exists_tbl FROM sysobjects WHERE name='manutencao_carros' AND xtype='U'
    `);
    const tableAlreadyExisted = Array.isArray(checkTable) && checkTable.length > 0;

    await prisma.$executeRawUnsafe(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='manutencao_carros' AND xtype='U')
      BEGIN
        CREATE TABLE manutencao_carros (
          id NVARCHAR(100) NOT NULL PRIMARY KEY,
          prefixo NVARCHAR(10) NOT NULL,
          consorciada NVARCHAR(10) NOT NULL,
          observacao NVARCHAR(255) DEFAULT '',
          bloqueado BIT DEFAULT 0,
          em_execucao BIT DEFAULT 0,
          liberado BIT DEFAULT 0,
          data NVARCHAR(20) NOT NULL,
          user_id INT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        );

        CREATE INDEX idx_manutencao_carros_data ON manutencao_carros(data);
        CREATE INDEX idx_manutencao_carros_prefixo ON manutencao_carros(prefixo);
        CREATE INDEX idx_manutencao_carros_data_prefixo ON manutencao_carros(data, prefixo);
      END
    `);

    if (!tableAlreadyExisted) {
      console.log("[Manutenção] Nova tabela criada. Populando apenas com os bloqueados da CI...");
      const activeCIs = await prisma.ciBloqueio.findMany({
        where: {
          status: { not: "LIBERADO" },
          categoria: "BLOQUEADO",
        },
      });

      for (const ci of activeCIs) {
        const cleanPref = ci.prefixo.replace(/\D/g, "");
        await prisma.manutencaoCarro.create({
          data: {
            id: `manut-${DEFAULT_REF_DATE}-${cleanPref}`,
            prefixo: cleanPref,
            consorciada: ci.consorciada,
            observacao: ci.motivo || "",
            bloqueado: true,
            emExecucao: false,
            liberado: false,
            data: DEFAULT_REF_DATE,
          },
        });
      }
    }

    // Limpeza de segurança: remove registros de manutenção gerados automaticamente
    // que pertenciam a preventivas ou setores da oficina diários (que não são bloqueios permanentes)
    try {
      await prisma.$executeRawUnsafe(`
        DELETE FROM manutencao_carros 
        WHERE id LIKE 'manut-%' 
          AND prefixo IN (SELECT prefixo FROM ci_bloqueios WHERE categoria IN ('OFICINA', 'PREVENTIVA', 'REFORCO'))
          AND em_execucao = 0 AND liberado = 0
      `);

      // Limpeza de resíduos: listas de em manutenção e liberados são independentes da CI
      await prisma.$executeRawUnsafe(`
        DELETE FROM manutencao_carros 
        WHERE observacao LIKE '%Liberado pela CI%'
           OR observacao LIKE '%LIBERADO PELA CI%'
      `);
    } catch (_) {}

    tableEnsured = true;
  } catch (err) {
    console.error("[Manutenção] Erro ao verificar/criar tabela manutencao_carros:", err);
  }
}

// GET /api/manutencao?data=YYYY-MM-DD
export async function list(req: AuthRequest, res: Response) {
  try {
    await ensureTableAndSeed();

    const dataQuery = String(req.query.data || DEFAULT_REF_DATE);

    // Identificação da Garagem Física do Usuário Logado (VCG ou VCM)
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { garagem: true, email: true, role: true }
    });

    let userGaragem = user?.garagem?.toUpperCase();
    if (!userGaragem) {
      const emailLower = (user?.email || "").toLowerCase();
      if (emailLower.includes("vcg")) userGaragem = "VCG";
      else if (emailLower.includes("vcm")) userGaragem = "VCM";
    }

    const queryGaragem = req.query.garagem && req.query.garagem !== "TODAS" ? String(req.query.garagem).toUpperCase() : undefined;
    const effectiveGaragem = userGaragem || queryGaragem;

    let records = await prisma.manutencaoCarro.findMany({
      where: { data: dataQuery },
      orderBy: { prefixo: "asc" },
    });

    // Se para esta data ainda não existem registros cadastrados,
    // herda o estado consolidado da data anterior mais recente ou da CI até esta data
    if (records.length === 0) {
      // 1. Procura a data anterior mais recente cadastrada
      const previousDate = await prisma.manutencaoCarro.findFirst({
        where: { data: { lt: dataQuery } },
        orderBy: { data: "desc" },
        select: { data: true },
      });

      if (previousDate) {
        // Herda APENAS os registros BLOQUEADOS da data anterior mais recente
        // Veículos em manutenção ou liberados NÃO aparecem no próximo dia
        const prevRecords = await prisma.manutencaoCarro.findMany({
          where: { 
            data: previousDate.data,
            bloqueado: true,
            emExecucao: false,
            liberado: false
          },
          orderBy: { prefixo: "asc" },
        });

        for (const prev of prevRecords) {
          const finalId = `manut-${dataQuery}-${prev.prefixo}`;
          try {
            await prisma.manutencaoCarro.create({
              data: {
                id: finalId,
                prefixo: prev.prefixo,
                consorciada: prev.consorciada,
                observacao: prev.observacao,
                bloqueado: true,
                emExecucao: false,
                liberado: false,
                data: dataQuery,
              },
            });
          } catch {}
        }
      }

      // 2. Mescla CIs ativas criadas até esta data (dataBloqueio <= dataQuery)
      const activeCIs = await prisma.ciBloqueio.findMany({
        where: {
          status: { not: "LIBERADO" },
          categoria: "BLOQUEADO",
          dataBloqueio: { lte: dataQuery },
        },
      });

      for (const ci of activeCIs) {
        const cleanPref = ci.prefixo.replace(/\D/g, "");
        const finalId = `manut-${dataQuery}-${cleanPref}`;
        try {
          await prisma.manutencaoCarro.upsert({
            where: { id: finalId },
            update: {
              bloqueado: true,
              observacao: ci.motivo || "",
            },
            create: {
              id: finalId,
              prefixo: cleanPref,
              consorciada: ci.consorciada || "VCG",
              observacao: ci.motivo || "",
              bloqueado: true,
              emExecucao: false,
              liberado: false,
              data: dataQuery,
            },
          });
        } catch {}
      }

      records = await prisma.manutencaoCarro.findMany({
        where: { data: dataQuery },
        orderBy: { prefixo: "asc" },
      });
    } else {
      // Se a data já tinha registros, mas uma data anterior mais recente foi atualizada com carros adicionais,
      // herda esses carros adicionais APENAS se forem bloqueados vigentes
      const previousDate = await prisma.manutencaoCarro.findFirst({
        where: { data: { lt: dataQuery } },
        orderBy: { data: "desc" },
        select: { data: true },
      });

      if (previousDate) {
        const prevRecords = await prisma.manutencaoCarro.findMany({
          where: { 
            data: previousDate.data,
            bloqueado: true,
            emExecucao: false,
            liberado: false
          },
        });

        const existingPrefixes = new Set(records.map(r => r.prefixo));
        let addedAny = false;

        for (const prev of prevRecords) {
          if (!existingPrefixes.has(prev.prefixo)) {
            const finalId = `manut-${dataQuery}-${prev.prefixo}`;
            try {
              await prisma.manutencaoCarro.create({
                data: {
                  id: finalId,
                  prefixo: prev.prefixo,
                  consorciada: prev.consorciada,
                  observacao: prev.observacao,
                  bloqueado: true,
                  emExecucao: false,
                  liberado: false,
                  data: dataQuery,
                },
              });
              addedAny = true;
            } catch {}
          }
        }

        if (addedAny) {
          records = await prisma.manutencaoCarro.findMany({
            where: { data: dataQuery },
            orderBy: { prefixo: "asc" },
          });
        }
      }
    }

    // Limpeza de consistência com a CI:
    // Remove registros que constavam apenas como bloqueados mas cujo bloqueio já foi encerrado na CI
    const currentActiveCIs = await prisma.ciBloqueio.findMany({
      where: {
        status: { not: "LIBERADO" },
        categoria: "BLOQUEADO",
      },
      select: { prefixo: true },
    });
    const activeCIPrefixes = new Set(currentActiveCIs.map(c => c.prefixo.replace(/\D/g, "")));

    await prisma.manutencaoCarro.deleteMany({
      where: {
        data: dataQuery,
        bloqueado: true,
        emExecucao: false,
        liberado: false,
        prefixo: { notIn: Array.from(activeCIPrefixes) },
      },
    });

    records = await prisma.manutencaoCarro.findMany({
      where: { data: dataQuery },
      orderBy: { prefixo: "asc" },
    });

    // Se o usuário estiver restrito a VCG ou VCM, garante estritamente que apenas veículos de sua garagem física apareçam
    if (effectiveGaragem === "VCG" || effectiveGaragem === "VCM") {
      records = records.filter((r) => {
        const clean = (r.prefixo || "").replace(/\D/g, "");
        const carroGaragem = (clean.startsWith("1") || clean === "2002") ? "VCM" : "VCG";
        return carroGaragem === effectiveGaragem;
      });
    }

    return res.json(records);
  } catch (error) {
    console.error("[Manutenção] Erro ao listar veículos de manutenção:", error);
    return res.status(500).json({ message: "Erro ao listar folha de manutenção." });
  }
}

// POST /api/manutencao/clear-list
export async function clearList(req: AuthRequest, res: Response) {
  try {
    await ensureTableAndSeed();

    const { data: dateRef, tipo } = req.body;
    const currentData = dateRef || DEFAULT_REF_DATE;

    if (!tipo || (tipo !== "EM_EXECUCAO" && tipo !== "LIBERADO")) {
      return res.status(400).json({ message: "Tipo inválido. Deve ser 'EM_EXECUCAO' ou 'LIBERADO'." });
    }

    if (tipo === "EM_EXECUCAO") {
      // Remove carros que estavam estritamente em execução na data e datas posteriores
      await prisma.manutencaoCarro.deleteMany({
        where: {
          data: { gte: currentData },
          emExecucao: true,
          liberado: false,
        },
      });
    } else if (tipo === "LIBERADO") {
      // Remove carros que estavam na lista de liberados na data e datas posteriores
      await prisma.manutencaoCarro.deleteMany({
        where: {
          data: { gte: currentData },
          liberado: true,
        },
      });
    }

    const remaining = await prisma.manutencaoCarro.findMany({
      where: { data: currentData },
      orderBy: { prefixo: "asc" },
    });

    return res.json({
      message: `Lista de ${tipo === "EM_EXECUCAO" ? "Em Manutenção" : "Liberados"} limpa com sucesso na data ${currentData}.`,
      records: remaining,
    });
  } catch (error) {
    console.error("[Manutenção] Erro ao limpar lista de manutenção:", error);
    return res.status(500).json({ message: "Erro ao limpar lista de manutenção." });
  }
}

// POST /api/manutencao
export async function createOrUpdate(req: AuthRequest, res: Response) {
  try {
    await ensureTableAndSeed();

    const { id, prefixo, consorciada, observacao, bloqueado, emExecucao, liberado, data } = req.body;

    if (!prefixo) {
      return res.status(400).json({ message: "Prefixo do veículo é obrigatório." });
    }

    const cleanPrefixo = String(prefixo).replace(/\D/g, "");
    const dateRef = data || DEFAULT_REF_DATE;
    const finalId = id || `manut-${dateRef}-${cleanPrefixo}`;

    const record = await prisma.manutencaoCarro.upsert({
      where: { id: finalId },
      update: {
        prefixo: cleanPrefixo,
        consorciada: consorciada || "VCG",
        observacao: observacao || "",
        bloqueado: Boolean(bloqueado),
        emExecucao: Boolean(emExecucao),
        liberado: Boolean(liberado),
        data: dateRef,
        userId: req.userId || null,
      },
      create: {
        id: finalId,
        prefixo: cleanPrefixo,
        consorciada: consorciada || "VCG",
        observacao: observacao || "",
        bloqueado: Boolean(bloqueado),
        emExecucao: Boolean(emExecucao),
        liberado: Boolean(liberado),
        data: dateRef,
        userId: req.userId || null,
      },
    });

    return res.status(200).json(record);
  } catch (error) {
    console.error("[Manutenção] Erro ao salvar veículo na folha:", error);
    return res.status(500).json({ message: "Erro ao salvar veículo na folha de manutenção." });
  }
}

// PUT /api/manutencao/:id
export async function update(req: AuthRequest, res: Response) {
  try {
    await ensureTableAndSeed();

    const { id } = req.params;
    const { observacao, bloqueado, emExecucao, liberado } = req.body;

    const dataToUpdate: any = {};
    if (observacao !== undefined) dataToUpdate.observacao = String(observacao);
    if (bloqueado !== undefined) dataToUpdate.bloqueado = Boolean(bloqueado);
    if (emExecucao !== undefined) dataToUpdate.emExecucao = Boolean(emExecucao);
    if (liberado !== undefined) dataToUpdate.liberado = Boolean(liberado);
    if (req.userId) dataToUpdate.userId = req.userId;

    const updated = await prisma.manutencaoCarro.update({
      where: { id },
      data: dataToUpdate,
    });

    // Regra: ao tirar um carro dos bloqueios ou liberá-lo, tira da tabela ci_bloqueios
    if (liberado === true || bloqueado === false) {
      const existing = await prisma.manutencaoCarro.findUnique({ where: { id } });
      const clean = (existing?.prefixo || id.replace("manut-", "").replace(/^\d{4}-\d{2}-\d{2}-/, "")).replace(/\D/g, "");
      if (clean) {
        try {
          await prisma.ciBloqueio.deleteMany({
            where: {
              OR: [
                { prefixo: clean },
                { prefixo: existing?.prefixo || clean },
              ],
            },
          });
        } catch (_) {}
      }
    }

    return res.json(updated);
  } catch (error) {
    console.error("[Manutenção] Erro ao atualizar item de manutenção:", error);
    return res.status(500).json({ message: "Erro ao atualizar item de manutenção." });
  }
}

// DELETE /api/manutencao/:id
export async function remove(req: AuthRequest, res: Response) {
  try {
    await ensureTableAndSeed();

    const { id } = req.params;

    const existing = await prisma.manutencaoCarro.findUnique({ where: { id } });
    const clean = (existing?.prefixo || id.replace("manut-", "").replace(/^\d{4}-\d{2}-\d{2}-/, "")).replace(/\D/g, "");

    await prisma.manutencaoCarro.deleteMany({
      where: { id },
    });

    // Regra: ao remover da folha de manutenção, tira também da tabela ci_bloqueios
    if (clean) {
      try {
        await prisma.ciBloqueio.deleteMany({
          where: {
            OR: [
              { prefixo: clean },
              { prefixo: existing?.prefixo || clean },
            ],
          },
        });
      } catch (_) {}
    }

    return res.json({ message: "Veículo removido da folha de manutenção e desimpedido dos bloqueios com sucesso." });
  } catch (error) {
    console.error("[Manutenção] Erro ao remover item da folha:", error);
    return res.status(500).json({ message: "Erro ao remover da folha de manutenção." });
  }
}

// POST /api/manutencao/sync
export async function sync(req: AuthRequest, res: Response) {
  try {
    await ensureTableAndSeed();

    const { data: dateRef, items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "A lista de itens deve ser um array." });
    }

    const currentData = dateRef || DEFAULT_REF_DATE;

    for (const item of items) {
      const cleanPrefixo = String(item.prefixo || "").replace(/\D/g, "");
      if (!cleanPrefixo) continue;

      const finalId = item.id || `manut-${currentData}-${cleanPrefixo}`;

      await prisma.manutencaoCarro.upsert({
        where: { id: finalId },
        update: {
          prefixo: cleanPrefixo,
          consorciada: item.consorciada || "VCG",
          observacao: item.observacao || "",
          bloqueado: Boolean(item.bloqueado),
          emExecucao: Boolean(item.emExecucao),
          liberado: Boolean(item.liberado),
          data: currentData,
          userId: req.userId || null,
        },
        create: {
          id: finalId,
          prefixo: cleanPrefixo,
          consorciada: item.consorciada || "VCG",
          observacao: item.observacao || "",
          bloqueado: Boolean(item.bloqueado),
          emExecucao: Boolean(item.emExecucao),
          liberado: Boolean(item.liberado),
          data: currentData,
          userId: req.userId || null,
        },
      });
    }

    // Propagação para datas futuras: sincroniza APENAS OS BLOQUEADOS para as datas posteriores já salvas no banco
    const futureDates = await prisma.manutencaoCarro.findMany({
      where: { data: { gt: currentData } },
      select: { data: true },
      distinct: ["data"],
      orderBy: { data: "asc" },
    });

    // Se veículos foram liberados hoje, garante que não apareçam mais como bloqueados em datas futuras
    const liberadosHoje = items.filter(it => it.liberado).map(it => String(it.prefixo || "").replace(/\D/g, "")).filter(Boolean);
    if (liberadosHoje.length > 0) {
      await prisma.manutencaoCarro.deleteMany({
        where: {
          data: { gt: currentData },
          prefixo: { in: liberadosHoje },
        },
      });
    }

    for (const f of futureDates) {
      for (const item of items) {
        // Regra: "as listas de em manutencao e liberado o q foi adicionado hj no proximo dia nao aparecer mais"
        if (item.emExecucao || item.liberado || !item.bloqueado) continue;

        const cleanPref = String(item.prefixo || "").replace(/\D/g, "");
        if (!cleanPref) continue;
        const finalId = `manut-${f.data}-${cleanPref}`;

        await prisma.manutencaoCarro.upsert({
          where: { id: finalId },
          update: {
            consorciada: item.consorciada || "VCG",
            observacao: item.observacao || "",
            bloqueado: true,
            emExecucao: false,
            liberado: false,
          },
          create: {
            id: finalId,
            prefixo: cleanPref,
            consorciada: item.consorciada || "VCG",
            observacao: item.observacao || "",
            bloqueado: true,
            emExecucao: false,
            liberado: false,
            data: f.data,
            userId: req.userId || null,
          },
        });
      }
    }

    // Regra: "quando tirar um carro dos bloqueios tbm tirar da tabela de ci_bloqueios"
    // Remove da tabela ci_bloqueios todos os veículos que vierem como liberados ou desimpedidos
    const desimpedidosHoje = items
      .filter((it: any) => it.liberado || !it.bloqueado)
      .map((it: any) => String(it.prefixo || "").replace(/\D/g, ""))
      .filter(Boolean);

    if (desimpedidosHoje.length > 0) {
      try {
        await prisma.ciBloqueio.deleteMany({
          where: {
            prefixo: { in: desimpedidosHoje },
          },
        });
      } catch (err) {
        console.warn("[Manutenção Sync] Erro ao excluir de ci_bloqueios:", err);
      }
    }

    let savedRecords = await prisma.manutencaoCarro.findMany({
      where: { data: currentData },
      orderBy: { prefixo: "asc" },
    });

    // Identificação da Garagem Física do Usuário Logado para retorno estrito
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { garagem: true, email: true }
    });

    let userGaragem = user?.garagem?.toUpperCase();
    if (!userGaragem) {
      const emailLower = (user?.email || "").toLowerCase();
      if (emailLower.includes("vcg")) userGaragem = "VCG";
      else if (emailLower.includes("vcm")) userGaragem = "VCM";
    }

    if (userGaragem === "VCG" || userGaragem === "VCM") {
      savedRecords = savedRecords.filter((r) => {
        const clean = (r.prefixo || "").replace(/\D/g, "");
        const carroGaragem = (clean.startsWith("1") || clean === "2002") ? "VCM" : "VCG";
        return carroGaragem === userGaragem;
      });
    }

    return res.json({
      message: "Folha de manutenção sincronizada com sucesso no banco de dados.",
      count: savedRecords.length,
      records: savedRecords,
    });
  } catch (error) {
    console.error("[Manutenção] Erro ao sincronizar folha no banco de dados:", error);
    return res.status(500).json({ message: "Erro ao sincronizar folha de manutenção." });
  }
}

// POST /api/manutencao/reset
export async function reset(req: AuthRequest, res: Response) {
  try {
    await ensureTableAndSeed();

    const { data: dateRef } = req.body;
    const currentData = dateRef || DEFAULT_REF_DATE;

    await prisma.manutencaoCarro.deleteMany({
      where: { data: currentData },
    });

    const activeCIs = await prisma.ciBloqueio.findMany({
      where: {
        status: { not: "LIBERADO" },
      },
    });

    for (const ci of activeCIs) {
      const cleanPref = ci.prefixo.replace(/\D/g, "");
      await prisma.manutencaoCarro.create({
        data: {
          id: `manut-${currentData}-${cleanPref}`,
          prefixo: cleanPref,
          consorciada: ci.consorciada,
          observacao: ci.motivo || "",
          bloqueado: true,
          emExecucao: false,
          liberado: false,
          data: currentData,
        },
      });
    }

    const resetRecords = await prisma.manutencaoCarro.findMany({
      where: { data: currentData },
      orderBy: { prefixo: "asc" },
    });

    return res.json({
      message: "Folha de manutenção restaurada para os padrões oficiais no banco de dados.",
      records: resetRecords,
    });
  } catch (error) {
    console.error("[Manutenção] Erro ao resetar folha de manutenção:", error);
    return res.status(500).json({ message: "Erro ao resetar folha de manutenção." });
  }
}
