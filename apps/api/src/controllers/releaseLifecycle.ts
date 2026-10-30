import type { Response } from 'express';
import { ZodError } from 'zod';
import type { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { MvpError } from '../services/mvpTemporal';
import { changeReleaseLifecycle, readReleaseLifecycle, readReleaseReport } from '../services/releaseLifecycle';

function respondError(res: Response, error: unknown) {
  if (error instanceof MvpError) return res.status(error.status).json({ error: error.message });
  if (error instanceof ZodError) return res.status(400).json({ error: 'Contexto ou estado da Soltura invalido.' });
  return res.status(503).json({ error: 'Controle oficial da Soltura indisponivel. Verifique a aplicacao da tabela soltura_folha e recarregue.' });
}
export async function read(req: AuthRequest, res: Response) {
  try { return res.json(await readReleaseLifecycle(prisma, req.query, req.userId)); } catch (error) { return respondError(res, error); }
}
export async function change(req: AuthRequest, res: Response) {
  try { return res.json(await changeReleaseLifecycle(prisma, req.userId, req.body)); } catch (error) { return respondError(res, error); }
}
export async function report(req: AuthRequest, res: Response) {
  try { return res.json(await readReleaseReport(prisma, req.query, req.userId)); } catch (error) { return respondError(res, error); }
}
