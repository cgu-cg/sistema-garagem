import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { saveMaintenance } from '../services/mvpLegado';
import { isVCG, MvpError, operationalContext } from '../services/mvpTemporal';
import { ZodError } from 'zod';

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

// Consulta nao materializa, herda, reconcilia ou apaga registros.
export async function list(req: AuthRequest, res: Response) {
  try {
    const data = String(req.query.data || operationalContext().today);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return res.status(400).json({ message: 'Data invalida.' });
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { garagem: true, email: true, role: true } });
    const userGarage = user?.garagem?.toUpperCase() || (user?.email?.toLowerCase().includes('vcm') ? 'VCM' : user?.email?.toLowerCase().includes('vcg') ? 'VCG' : undefined);
    const scope = user?.role !== 'ADMIN' && userGarage ? userGarage : req.query.garagem;
    const records = await prisma.manutencaoCarro.findMany({ where: { data }, orderBy: { prefixo: 'asc' } });
    return res.json(records.filter(r => scope === 'VCG' ? isVCG(r.prefixo) : scope === 'VCM' ? !isVCG(r.prefixo) : true));
  } catch { return res.status(500).json({ message: 'Erro ao consultar manutencao.' }); }
}
export async function sync(req: AuthRequest, res: Response) {
  try { return res.json(await saveMaintenance(prisma, req.userId, req.body)); }
  catch (error) {
    if (error instanceof MvpError) return res.status(error.status).json({ message: error.message });
    if (error instanceof ZodError) return res.status(400).json({ message: 'Dados invalidos para manutencao.' });
    return res.status(500).json({ message: 'Operacao nao concluida. Recarregue e tente novamente.' });
  }
}
export async function createOrUpdate(_req: AuthRequest, res: Response) {
  return res.status(409).json({ message: 'Use sincronizacao com data, itens e versao atual.' });
}
export const update = createOrUpdate;
export const remove = createOrUpdate;
export const clearList = createOrUpdate;
// Reset nao pode apagar estados de oficina/liberados nem reconstruir a partir de CIs globais.
export async function reset(req: AuthRequest, res: Response) { return list(req, res); }
