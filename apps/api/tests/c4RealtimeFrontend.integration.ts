import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { io, type Socket } from 'socket.io-client';
import { attachC4Realtime } from '../src/services/c4Realtime';
import { notifyC4Updated } from '../src/services/c4Events';
import { createRealtimeSession, matchesInvalidation } from '../../web/src/lib/realtimeSession';
import { createRealtimeRefresh } from '../../web/src/lib/realtimeRefresh';
import { createEditBaselines } from '../../web/src/lib/editBaselines';

async function until(predicate: () => boolean) {
  const deadline = Date.now() + 8000;
  while (!predicate()) {
    if (Date.now() > deadline) throw Error('Condicao local nao satisfeita');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

test('dois clientes reais: invalidacao consulta HTTP, preserva rascunhos e recupera apos reconexao sem POST', async () => {
  const previous = process.env.CI_NOVO_FLUXO_GARAGENS; process.env.CI_NOVO_FLUXO_GARAGENS = 'VCG';
  const secret = 'test-only-socket-secret';
  let version = 1, reads = 0, posts = 0;
  const http = createServer((req, res) => {
    if (req.method !== 'GET') { posts++; res.writeHead(405); res.end(); return; }
    assert.ok(req.url?.startsWith('/api/c4/contexto'));
    reads++; res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ version, items: [{ id: '1', prefixo: '4000', text: `oficial-${version}` }] }));
  });
  const db: any = { user: { findUnique: async () => ({ role: 'manutencao', garagem: 'VCG' }) } };
  const server = attachC4Realtime(http, db, secret);
  const sockets: Socket[] = [], cleanup: (() => void)[] = [];
  const views = [1, 2].map(() => ({ version: 0, list: [] as any[], draft: { open: true, text: 'digitado', selection: '4000' }, edits: createEditBaselines<any>() }));
  try {
    await new Promise<void>(resolve => http.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${(http.address() as { port: number }).port}`;
    for (const [i, view] of views.entries()) {
      const session = createRealtimeSession(token => {
        const socket = io(base, { path: '/api/socket.io', auth: { token }, autoConnect: false, forceNew: true, reconnectionDelay: 50 });
        sockets.push(socket); return socket;
      });
      const queue = createRealtimeRefresh(async () => {
        const response = await fetch(`${base}/api/c4/contexto?garagem=VCG&data=2026-10-13`);
        const data = await response.json() as any; view.list = data.items; view.version = data.version;
      }, () => false, 30);
      cleanup.push(() => queue.dispose(), session.subscribe(e => { if (!e || matchesInvalidation(e, 'VCG', '2026-10-14', 'ci')) queue.request(); }),
        session.retain(jwt.sign({ id: i + 1 }, secret, { expiresIn: 60 })), () => session.logout());
    }
    await until(() => views.every(v => v.version === 1));
    const originals = views.map(v => v.list);
    views.forEach(v => v.edits.begin('modal', 'VCG|14', v.list));
    const before = reads; version = 2;
    await Promise.all(Array.from({ length: 4 }, () => notifyC4Updated('VCG', '2026-10-13')));
    await until(() => views.every(v => v.version === 2));
    assert.equal(reads, before + 2);
    for (const [i, view] of views.entries()) {
      assert.deepEqual(view.draft, { open: true, text: 'digitado', selection: '4000' });
      assert.equal(view.edits.read('modal', view.list), originals[i]); assert.notEqual(view.list, originals[i]);
    }
    version = 3; sockets[0].io.engine.close();
    await until(() => views[0].version === 3);
    assert.equal(views[0].edits.read('modal', views[0].list), originals[0]); assert.equal(posts, 0);
    cleanup.splice(0).forEach(fn => fn()); await until(() => sockets.every(s => !s.connected));
  } finally {
    cleanup.forEach(fn => fn()); await new Promise<void>(resolve => server.close(() => resolve()));
    if (previous === undefined) delete process.env.CI_NOVO_FLUXO_GARAGENS; else process.env.CI_NOVO_FLUXO_GARAGENS = previous;
  }
});
