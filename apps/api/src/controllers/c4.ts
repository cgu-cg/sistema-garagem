import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { enabledGarages, garage, civil } from '../services/c4Temporal';
import { operationalContext, MvpError } from '../services/mvpTemporal';
import { readContext } from '../services/c4Flow';

export async function context(req: AuthRequest, res: Response) {
  try {
    const scope = garage(req.query.garagem);
    const garages = enabledGarages();
    if (!garages.includes(scope)) return res.json({ mode: 'LEGADO', garagem: scope, garages });
    return res.json({ ...await readContext(prisma, scope, civil(req.query.data || operationalContext().today)), garages });
  } catch (error) {
    if (error instanceof MvpError) return res.status(error.status).json({ error: error.message });
    return res.status(503).json({ error: 'C4 indisponivel; nao ha fallback para o legado.' });
  }
}
