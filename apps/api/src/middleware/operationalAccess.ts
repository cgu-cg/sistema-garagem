import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth';
import prisma from '../utils/prisma';
import { canDispatch, canReadOperation, canReadScale, canReadReservations, explicitGarage } from '../services/operationalAccess';
export function operationalAccess(action: 'read' | 'dispatch' | 'scale' | 'admin' | 'reservations' | 'deleteReservation') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) return res.status(401).json({ code: 'AUTHENTICATION_REQUIRED', error: 'Sessao obrigatoria.' });
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId }, include: { groups: true } });
      if (!user) return res.status(401).json({ code: 'SESSION_INVALID', error: 'Usuario da sessao nao encontrado.' });
      if (user.role !== 'ADMIN' && !explicitGarage(user))
        return res.status(403).json({ code: 'GARAGE_REQUIRED', error: 'Usuario sem garagem cadastrada. Solicite revisao ao administrador.' });
      const allowed = action === 'reservations' ? canReadReservations(user) : action === 'admin' ? user.role === 'ADMIN' : (action === 'dispatch' || action === 'deleteReservation') ? canDispatch(user) : action === 'scale' ? canReadScale(user) : canReadOperation(user);
      if (!allowed) return res.status(403).json({ code: 'ACTION_FORBIDDEN', error: 'Seu perfil ou grupo nao permite esta operacao.' });
      const scope = req.method === 'GET' ? req.query.garagem : req.body?.garagem;
      if (action === 'dispatch' && req.method === 'POST' && !scope)
        return res.status(400).json({ code: 'GARAGE_CONTEXT_REQUIRED', error: 'Informe a garagem da operacao explicitamente.' });
      if (scope && user.role !== 'ADMIN' && scope !== user.garagem)
        return res.status(403).json({ code: 'GARAGE_FORBIDDEN', error: 'Operacao de outra garagem nao autorizada.' });
      if (user.role !== 'ADMIN' && req.method === 'GET' && !scope) req.query.garagem = user.garagem!;
      req.userRole = user.role;
      next();
    } catch {
      return res.status(503).json({ code: 'AUTHORIZATION_UNAVAILABLE', error: 'Nao foi possivel verificar a autorizacao.' });
    }
  };
}
