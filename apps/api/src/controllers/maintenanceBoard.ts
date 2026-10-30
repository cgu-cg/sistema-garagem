import type { Response } from 'express';
import { ZodError } from 'zod';
import type { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { MvpError } from '../services/mvpTemporal';
import { readMaintenanceBoard, saveMaintenanceBoard } from '../services/maintenanceBoard';

function fail(res: Response, error: unknown) {
  if (error instanceof MvpError) return res.status(error.status).json({ message: error.message });
  if (error instanceof ZodError) return res.status(400).json({ message: 'Dados invalidos no Controle de Manutencao.' });
  if (error && typeof error === 'object' && 'code' in error && ['P2034', 'P2002'].includes(String(error.code)))
    return res.status(409).json({ message: 'Controle alterado por outro dispositivo. Revise a pendencia.' });
  return res.status(503).json({ message: 'Controle independente indisponivel. Verifique a tabela controle_manutencao_folha e a API.' });
}
export async function list(req: AuthRequest, res: Response) {
  try { return res.json(await readMaintenanceBoard(prisma, req.userId, req.query)); } catch (error) { return fail(res, error); }
}
export async function save(req: AuthRequest, res: Response) {
  try { return res.json(await saveMaintenanceBoard(prisma, req.userId, req.body)); } catch (error) { return fail(res, error); }
}
