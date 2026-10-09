import { Response } from 'express';
import { ZodError } from 'zod';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { readEscala, saveEscala } from '../services/escalaCarros';
import { MvpError } from '../services/mvpTemporal';

function failure(res: Response, error: unknown) {
  if (error instanceof MvpError) return res.status(error.status).json({ error: error.message });
  if (error instanceof ZodError) return res.status(400).json({ error: 'Contexto ou itens da escala invalidos.' });
  if (error && typeof error === 'object' && 'code' in error && ['P2034', 'P2002'].includes(String(error.code)))
    return res.status(409).json({ error: 'Conflito de escala. Recarregue antes de salvar.' });
  return res.status(503).json({ error: 'Escala oficial indisponivel. Verifique provisionamento e conectividade; nao usar cache como fonte oficial.' });
}
export async function list(req: AuthRequest, res: Response) {
  try { return res.json(await readEscala(prisma, req.query, req.userId)); } catch (error) { return failure(res, error); }
}
export async function save(req: AuthRequest, res: Response) {
  try { return res.json(await saveEscala(prisma, req.userId, req.body)); } catch (error) { return failure(res, error); }
}
