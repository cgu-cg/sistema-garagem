import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { attachC4Realtime } from '../src/services/c4Realtime';
import { notifyC4Updated } from '../src/services/c4Events';
const secret = 'local-test-only-not-a-deployment-secret';
const token = (id = 1, expiresIn = 60) => jwt.sign({ id }, secret, { expiresIn });
function database() {
  const users = new Map<number, { role: string; garagem?: string }>([[1, { role: 'manutencao', garagem: 'VCG' }]]);
  const db: any = { user: { findUnique: async ({ where }: any) => users.get(where.id) ?? null } };
  return { db, users };
}

// Cliente Engine.IO/Socket.IO minimo via polling HTTP local, sem socket.io-client.
async function connect(base: string, auth: object, query = '') {
  const url = `${base}/api/socket.io/?EIO=4&transport=polling${query}`;
  const open = await (await fetch(url)).text();
  assert.equal(open[0], '0');
  const sid = JSON.parse(open.slice(1)).sid;
  const session = `${url}&sid=${encodeURIComponent(sid)}`;
  await fetch(session, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: `40${JSON.stringify(auth)}` });
  const result = await (await fetch(session)).text();
  return { result, session };
}

test('Socket.IO real no HTTP existente: salas, payload minimo e revogacao durante conexao', async () => {
  const previous = process.env.CI_NOVO_FLUXO_GARAGENS; process.env.CI_NOVO_FLUXO_GARAGENS = 'VCG,VCM';
  const { db, users } = database();
  const http = createServer((_req, res) => { res.end('HTTP existente'); });
  const io = attachC4Realtime(http, db, secret);
  try {
    await new Promise<void>(resolve => http.listen(0, '127.0.0.1', resolve));
    const address = http.address() as { port: number };
    const base = `http://127.0.0.1:${address.port}`;
    assert.equal(await (await fetch(base)).text(), 'HTTP existente');
    const denied = await connect(base, {}, `&token=${encodeURIComponent(token())}`);
    assert.match(denied.result, /^44/); // JWT na query nao autentica.
    const expired = await connect(base, { token: token(1, -1) }); assert.match(expired.result, /^44/);
    const client = await connect(base, { token: token(), rooms: ['c4:VCM'], garagem: 'VCM' });
    assert.match(client.result, /^40/);
    const socket = [...io.sockets.sockets.values()][0];
    assert.ok(socket.rooms.has('c4:VCG')); assert.equal(socket.rooms.has('c4:VCM'), false);
    const outgoing: unknown[] = [];
    socket.onAnyOutgoing((...args) => { outgoing.push(args); });
    await notifyC4Updated('VCM', '2026-10-13'); assert.equal(outgoing.length, 0);
    const received = fetch(client.session).then(r => r.text());
    await notifyC4Updated('VCG', '2026-10-13');
    assert.deepEqual(JSON.parse((await received).slice(2)), ['c4:updated', { garagem: 'VCG', dataOperacional: '2026-10-13', dataFolha: '2026-10-14' }]);
    // Acesso revogado apos handshake: nenhum evento deve ser entregue.
    users.set(1, { role: 'manutencao', garagem: 'VCM' });
    const revoked = fetch(client.session).then(r => r.text());
    await notifyC4Updated('VCG', '2026-10-13');
    assert.equal(socket.connected, false); assert.doesNotMatch(await revoked, /c4:updated/);
    users.set(1, { role: 'manutencao', garagem: 'VCG' });
    const expiring = await connect(base, { token: token(1, 2) }); assert.match(expiring.result, /^40/);
    assert.doesNotMatch(await (await fetch(expiring.session)).text(), /c4:updated/);
    assert.equal(io.sockets.sockets.size, 0);
  } finally {
    await new Promise<void>(resolve => io.close(() => resolve()));
    if (previous === undefined) delete process.env.CI_NOVO_FLUXO_GARAGENS; else process.env.CI_NOVO_FLUXO_GARAGENS = previous;
  }
});
