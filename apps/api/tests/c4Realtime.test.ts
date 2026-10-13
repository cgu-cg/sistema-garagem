import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authenticateC4Socket, deliverC4Update } from '../src/services/c4Realtime';

const secret = 'local-test-only-not-a-deployment-secret';
const token = (id = 1, expiresIn = 60) => jwt.sign({ id }, secret, { expiresIn });
function database() {
  const users = new Map<number, { role: string; garagem?: string }>([
    [1, { role: 'manutencao', garagem: 'VCG' }], [2, { role: 'ADMIN' }], [3, { role: 'COLABORADOR', garagem: 'VCM' }],
  ]);
  const db: any = { user: { findUnique: async ({ where }: any) => users.get(where.id) ?? null } };
  return { db, users };
}

test('handshake JWT usa usuario atual e politica de leitura C4, nunca papel/garagem do cliente', async () => {
  const { db } = database();
  assert.deepEqual((await authenticateC4Socket(token(), secret, db, ['VCG', 'VCM'])).garages, ['VCG']);
  assert.deepEqual((await authenticateC4Socket(token(2), secret, db, ['VCG', 'VCM'])).garages, ['VCG', 'VCM']);
  assert.deepEqual((await authenticateC4Socket(token(3), secret, db, ['VCG', 'VCM'])).garages, ['VCM']);
  const forgedRole = jwt.sign({ id: 1, role: 'ADMIN', garagem: 'VCM' }, secret, { expiresIn: 60 });
  assert.deepEqual((await authenticateC4Socket(forgedRole, secret, db, ['VCG', 'VCM'])).garages, ['VCG']);
});

test('handshake rejeita token invalido, expirado, sem expiracao, usuario ausente e garagem nao autorizada', async () => {
  const { db } = database();
  for (const value of [undefined, '', 'invalid', token(1, -1), token(999), jwt.sign({ id: 1 }, secret), jwt.sign({ id: 1 }, 'wrong-secret')]) {
    await assert.rejects(authenticateC4Socket(value, secret, db, ['VCG', 'VCM']));
  }
  await assert.rejects(authenticateC4Socket(token(), secret, db, ['VCM']));
  await assert.rejects(authenticateC4Socket(token(), secret, db, []));
});

test('entrega falha fechada se usuario removido, ADMIN revogado, sessao expirada ou consulta de permissao falhar', async () => {
  for (const reason of ['deleted', 'role', 'expired', 'database']) {
    const { db, users } = database();
    const identity = await authenticateC4Socket(token(2), secret, db, ['VCG', 'VCM']);
    if (reason === 'deleted') users.delete(2);
    if (reason === 'role') users.set(2, { role: 'COLABORADOR', garagem: 'VCM' });
    if (reason === 'expired') identity.expiresAt = 0;
    if (reason === 'database') db.user.findUnique = async () => { throw Error('DB unavailable'); };
    let emitted = 0, disconnected = 0;
    const socket: any = { connected: true, rooms: new Set(['c4:VCG']), emit() { emitted++; }, disconnect() { disconnected++; } };
    await deliverC4Update(socket, identity, db, { garagem: 'VCG', dataOperacional: '2026-10-13', dataFolha: '2026-10-14' });
    assert.equal(emitted, 0); assert.equal(disconnected, 1, reason);
  }
});

