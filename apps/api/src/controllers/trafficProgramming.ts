import type { Response } from 'express';
import { ZodError } from 'zod';
import type { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { MvpError } from '../services/mvpTemporal';
import { listTraffic, saveTraffic } from '../services/trafficProgramming';
function error(res: Response, value: unknown) {
  if (value instanceof MvpError) return res.status(value.status).json({ error: value.message });
  if (value instanceof ZodError) return res.status(400).json({ error: value.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ') });
  return res.status(503).json({ error: 'Programação indisponível. Verifique os SQLs trafego_programacao, trafego_modelo e trafego_modelo_versao, o cliente Prisma e a atualização da API.' });
}
export async function list(req: AuthRequest, res: Response) {
  try { return res.json(await listTraffic(prisma, req.userId, req.query.garagem)); } catch (value) { return error(res, value); }
}
export async function save(req: AuthRequest, res: Response) {
  try { return res.json(await saveTraffic(prisma, req.userId, req.body)); } catch (value) { return error(res, value); }
}
