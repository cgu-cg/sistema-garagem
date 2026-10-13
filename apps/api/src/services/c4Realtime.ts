import type { Server as HttpServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { Server, type Socket } from 'socket.io';
import { assertC4Read } from './c4Authorization';
import { enabledGarages, type Garage } from './c4Temporal';
import { subscribeC4Updates, type C4Updated } from './c4Events';

type ReadDatabase = Parameters<typeof assertC4Read>[0];
type Identity = { userId: number; expiresAt: number; garages: Garage[] };
const room = (garage: Garage) => `c4:${garage}`;

export async function authenticateC4Socket(token: unknown, secret: string, db: ReadDatabase, garages = enabledGarages()): Promise<Identity> {
  if (typeof token !== 'string' || !token) throw new Error('Nao autorizado');
  const decoded = jwt.verify(token, secret);
  if (typeof decoded === 'string' || !Number.isSafeInteger(decoded.id) || decoded.id <= 0 || typeof decoded.exp !== 'number') throw new Error('Nao autorizado');
  const allowed: Garage[] = [];
  for (const garage of garages) {
    try { await assertC4Read(db, decoded.id, garage); allowed.push(garage); }
    catch (error) {
      // Falha tecnica nao deve ser interpretada como permissao parcial.
      if (!(error && typeof error === 'object' && 'status' in error && error.status === 403)) throw error;
    }
  }
  if (!allowed.length) throw new Error('Nao autorizado');
  return { userId: decoded.id, expiresAt: decoded.exp * 1000, garages: allowed };
}

export async function deliverC4Update(socket: Socket, identity: Identity, db: ReadDatabase, event: C4Updated) {
  if (!socket.connected || !socket.rooms.has(room(event.garagem))) return;
  try {
    if (Date.now() >= identity.expiresAt) throw new Error('Sessao expirada');
    await assertC4Read(db, identity.userId, event.garagem);
    if (!socket.connected || Date.now() >= identity.expiresAt) return;
    socket.emit('c4:updated', event);
  } catch {
    // Usuario removido, garagem/papel revogado ou autorizacao indisponivel: falhar fechado.
    socket.disconnect(true);
  }
}

export function attachC4Realtime(http: HttpServer, db: ReadDatabase, secret: string) {
  const io = new Server(http, { path: '/api/socket.io', serveClient: false });
  const identities = new WeakMap<Socket, Identity>();
  io.use(async (socket, next) => {
    try {
      const identity = await authenticateC4Socket(socket.handshake.auth?.token, secret, db);
      identities.set(socket, identity);
      next();
    } catch { next(new Error('Nao autorizado')); }
  });
  io.on('connection', socket => {
    const identity = identities.get(socket)!;
    for (const garage of identity.garages) void socket.join(room(garage));
    let timer: ReturnType<typeof setTimeout>;
    const expire = () => {
      const remaining = identity.expiresAt - Date.now();
      if (remaining <= 0) { socket.disconnect(true); return; }
      timer = setTimeout(expire, Math.min(remaining, 2147483647)); timer.unref();
    };
    expire();
    socket.on('disconnect', () => clearTimeout(timer));
  });
  const unsubscribe = subscribeC4Updates(event => Promise.all(
    [...io.sockets.sockets.values()].map(socket => deliverC4Update(socket, identities.get(socket)!, db, event)),
  ).then(() => undefined));
  http.once('close', unsubscribe);
  return io;
}
