import test from 'node:test';
import assert from 'node:assert/strict';
import { assertContext, assertFlags, operationalContext, revision } from '../src/services/mvpTemporal';
import { operationalContext as webContext, revision as webRevision, beginMutation, endMutation, requireRefresh, confirmRefresh, getMutationState, readTicket, assertReadTicket, SavedRefreshRequired } from '../../web/src/lib/mvpTemporal';
import { saveCI, saveMaintenance } from '../src/services/mvpLegado';

test('3083 legado preservado nao impede alteracao independente nem recebe UPDATE', async () => {
  const legacy = m('legacy', { prefixo: '3083', consorciada: 'VCM', userId: 7 });
  const f = fixture([], [legacy, m()]);
  await saveMaintenance(f.db, 1, { data: '2026-10-07', base: revision(f.state().manut), items: [legacy, m('m1', { emExecucao: true })] }, now);
  assert.deepEqual(f.state().manut.find(r => r.id === 'legacy'), legacy);
  assert.equal(f.state().manut.find(r => r.id === 'm1')?.emExecucao, true);
  assert.equal(f.calls(), 2); // deleteMany vazio + upsert somente do outro veiculo.
});
test('3083 inconsistente nao pode ser saneado, alterado, removido ou recriado', async () => {
  for (const changes of [{ consorciada: 'JTU' }, { observacao: 'Outra' }, { prefixo: '1000', consorciada: 'VCG' }, { id: 'novo' }, null]) {
    const legacy = m('legacy', { prefixo: '3083', consorciada: 'VCM' });
    const f = fixture([], [legacy]);
    const before = structuredClone(f.state());
    await assert.rejects(saveMaintenance(f.db, 1, { data: '2026-10-07', base: revision([legacy]), items: changes ? [{ ...legacy, ...changes }] : [], removeBlocked: changes ? [] : ['3083'] }, now));
    assert.equal(f.calls(), 0); assert.deepEqual(f.state(), before);
  }
});
test('nova inclusao fisica VCG com consorciada VCM nao recebe tolerancia', async () => {
  const f = fixture([], []);
  await assert.rejects(saveMaintenance(f.db, 1, { data: '2026-10-07', base: revision([]), items: [m('new', { prefixo: '3083', consorciada: 'VCM' })] }, now));
  assert.equal(f.calls(), 0);
});
test('CI preserva legado intacto mas nao pode altera-lo', async () => {
  const legacy = c('legacy', { prefixo: '3083', consorciada: 'VCM' });
  const f = fixture([legacy], []);
  await saveCI(f.db, 1, { data: '2026-10-08', base: revision([legacy]), items: [item(legacy), item(c('other', { categoria: 'OFICINA' }))] }, now);
  assert.deepEqual(f.state().ci.find(r => r.id === 'legacy'), legacy);
  const g = fixture([legacy], []);
  await assert.rejects(saveCI(g.db, 1, { data: '2026-10-08', base: revision([legacy]), items: [item({ ...legacy, consorciada: 'JTU' })] }, now));
  assert.equal(g.calls(), 0);
});
test('sincronizacao CI nao saneia legado inconsistente do Controle', async () => {
  const legacy = m('legacy', { prefixo: '3083', consorciada: 'VCM' });
  const f = fixture([], [legacy]);
  await assert.rejects(saveCI(f.db, 1, { data: '2026-10-08', base: revision([]), items: [item(c('new', { prefixo: '3083', consorciada: 'JTU' }))] }, now));
  assert.equal(f.calls(), 0); assert.deepEqual(f.state().manut, [legacy]);
});
test('sincronizacao Controle nao saneia legado inconsistente da CI', async () => {
  const legacy = c('legacy', { prefixo: '3083', consorciada: 'VCM' });
  const f = fixture([legacy], []);
  await assert.rejects(saveMaintenance(f.db, 1, { data: '2026-10-07', base: revision([]), items: [m('new', { prefixo: '3083', consorciada: 'JTU' })] }, now));
  assert.equal(f.calls(), 0); assert.deepEqual(f.state().ci, [legacy]);
});

const now = () => new Date('2026-10-07T12:00:00Z');
const stamp = new Date('2026-10-07T10:00:00Z');
const m = (id = 'm1', changes = {}) => ({ id, prefixo: '4000', consorciada: 'VCG', data: '2026-10-07', bloqueado: true, emExecucao: false, liberado: false, observacao: 'Motor', updatedAt: stamp, ...changes });
const c = (id = 'c1', changes = {}) => ({ id, prefixo: '4000', garagem: 'VCG', consorciada: 'VCG', categoria: 'BLOQUEADO', dataBloqueio: '2026-10-08', motivo: 'Motor', status: 'BLOQUEADO', updatedAt: stamp, ...changes });
const item = (row: any) => ({ ...row, data: row.dataBloqueio, categoriaPlanilha: row.categoria });

// Double em memoria: nao importa Prisma runtime, controllers, .env ou conexoes.
function fixture(cs = [c()], ms = [m()], fail: boolean | 'ci-delete' | 'manut-upsert' = false, role = 'ADMIN') {
  let state = { ci: structuredClone(cs), manut: structuredClone(ms) };
  let calls = 0;
  function matches(r: any, w: any): boolean {
    return Object.entries(w || {}).every(([k, v]: any) => k === 'OR' ? v.some((part: any) => matches(r, part)) : v && typeof v === 'object'
      ? ('in' in v ? v.in.includes(r[k]) : 'not' in v ? r[k] !== v.not : false) : r[k] === v);
  }
  function model(key: 'ci' | 'manut', draft: any) {
    return {
      findMany: async ({ where }: any) => structuredClone(draft[key].filter((r: any) => matches(r, where))),
      deleteMany: async ({ where }: any) => { calls++; if (fail === 'ci-delete' && key === 'ci') throw new Error('falha CI delete'); draft[key] = draft[key].filter((r: any) => !matches(r, where)); },
      update: async ({ where, data }: any) => { calls++; Object.assign(draft[key].find((r: any) => r.id === where.id), data, { updatedAt: stamp }); },
      upsert: async ({ where, create, update }: any) => {
        calls++;
        if ((fail === true && key === 'ci') || (fail === 'manut-upsert' && key === 'manut')) throw new Error('falha simulada CI');
        const old = draft[key].find((r: any) => r.id === where.id);
        if (old) Object.assign(old, update, { updatedAt: stamp }); else draft[key].push({ ...create, updatedAt: stamp });
      },
    };
  }
  const db = { $transaction: async (fn: any, options: any) => {
    assert.equal(options.isolationLevel, 'Serializable');
    const draft = structuredClone(state);
    const result = await fn({ user: { findUnique: async () => ({ role }) }, ciBloqueio: model('ci', draft), manutencaoCarro: model('manut', draft) });
    state = draft; return result;
  } } as any;
  return { db, state: () => state, calls: () => calls };
}
for (const [utc, open] of [['06:59:59', false], ['07:00:00', true], ['22:29:59', true], ['22:30:00', false]] as const) {
  test(`limite Campo Grande ${utc} UTC`, async () => {
    const date = new Date(`2026-10-07T${utc}Z`);
    assert.equal(operationalContext(date).open, open);
    assert.deepEqual(webContext(date), operationalContext(date));
    const f = fixture([], []);
    const command = saveCI(f.db, 1, { data: '2026-10-08', base: revision([]), items: [item(c())] }, () => date);
    if (open) { await command; assert.equal(f.state().ci.length, 1); }
    else { await assert.rejects(command, (e: any) => e.status === 409); assert.equal(f.calls(), 0); }
  });
}
test('data operacional nao e data UTC; virada de mes', () => {
  assert.equal(operationalContext(new Date('2026-10-08T02:00:00Z')).today, '2026-10-07');
  assert.equal(operationalContext(new Date('2026-11-01T02:00:00Z')).tomorrow, '2026-11-01');
});
test('versao do frontend corresponde ao registro raw e inclui conteudo no mesmo timestamp', () => {
  assert.equal(revision([c()]), webRevision([item(c())]));
  assert.equal(revision([m()]), webRevision([m()]));
  assert.notEqual(revision([m()]), revision([m('m1', { emExecucao: true })]));
});
test('CI D, passada e D+2 rejeitadas', () => {
  for (const date of ['2026-10-06', '2026-10-07', '2026-10-09', '07/10/2026']) assert.throws(() => assertContext(date, 'ci', now()));
  assert.doesNotThrow(() => assertContext('2026-10-08', 'ci', now()));
});
test('coexistencia bloqueio/execucao, rejeicao liberado/bloqueado inclusive separado', () => {
  assert.doesNotThrow(() => assertFlags([m('m1', { emExecucao: true })]));
  assert.throws(() => assertFlags([m('m1', { liberado: true })]));
  assert.throws(() => assertFlags([m(), m('m2', { bloqueado: false, liberado: true })]));
});
test('segundo bloqueado CI e rejeitado sem escrita; demais categorias coexistem', async () => {
  const f = fixture();
  await assert.rejects(saveCI(f.db, 1, { data: '2026-10-08', base: revision(f.state().ci), items: [item(c()), item(c('c2'))] }, now));
  assert.equal(f.calls(), 0);
  await saveCI(f.db, 1, { data: '2026-10-08', base: revision(f.state().ci), items: [item(c()), item(c('c2', { categoria: 'OFICINA' }))] }, now);
  assert.equal(f.state().ci.length, 2);
});
test('remocao CI D+1 preserva historia, outras categorias e execucao', async () => {
  const history = c('h', { dataBloqueio: '2026-10-07' });
  const future = c('f', { dataBloqueio: '2026-10-09' });
  const office = c('o', { categoria: 'OFICINA' });
  const f = fixture([c(), history, future, office], [m('m1', { emExecucao: true })]);
  await saveCI(f.db, 1, { data: '2026-10-08', base: revision([c(), office]), items: [item(office)], removeBlocked: ['4000'] }, now);
  assert.deepEqual(f.state().ci.filter(i => ['h','f'].includes(i.id)), [history, future]);
  assert.equal(f.state().manut[0].bloqueado, false);
  assert.equal(f.state().manut[0].emExecucao, true);
});
test('cancelamento/ausencia de confirmacao nao muda estado; confirmacao libera atomicamente', async () => {
  const f = fixture(); const before = structuredClone(f.state());
  const released = m('m1', { bloqueado: false, liberado: true });
  const input = { data: '2026-10-07', base: revision(before.manut), items: [released], removeBlocked: ['4000'] };
  await assert.rejects(saveMaintenance(f.db, 1, input, now));
  assert.equal(f.calls(), 0); assert.deepEqual(f.state(), before);
  await saveMaintenance(f.db, 1, { ...input, confirmRelease: true }, now);
  assert.equal(f.state().ci.length, 0); assert.equal(f.state().manut[0].liberado, true);
  assert.equal(f.state().manut[0].bloqueado, false); assert.equal(f.state().manut[0].emExecucao, false);
});
test('falha CI apos gravacao Controle desfaz operacao inteira', async () => {
  const f = fixture([], [], true); const before = structuredClone(f.state());
  await assert.rejects(saveMaintenance(f.db, 1, { data: '2026-10-07', base: revision([]), items: [m()] }, now));
  assert.ok(f.calls() > 0); assert.deepEqual(f.state(), before);
});
test('inclusao Controle usa D+1 mesmo com CI passada/futura e status nulo', async () => {
  const previous = c('h', { dataBloqueio: '2026-10-07' });
  const future = c('f', { dataBloqueio: '2026-10-09' });
  const active = c('c1', { status: null });
  const f = fixture([previous, future, active], []);
  await saveMaintenance(f.db, 1, { data: '2026-10-07', base: revision([]), items: [m()] }, now);
  assert.equal(f.state().ci.filter(r => r.dataBloqueio === '2026-10-08').length, 1);
  assert.deepEqual(f.state().ci.filter(r => r.id !== 'c1'), [previous, future]);
});
test('remocao Controle retira somente bloqueio D+1, preservando execucao e historicos', async () => {
  const previous = c('h', { dataBloqueio: '2026-10-07' });
  const future = c('f', { dataBloqueio: '2026-10-09' });
  const historicMaintenance = m('hm', { data: '2026-10-06' });
  const combined = m('m1', { emExecucao: true });
  const f = fixture([c(), previous, future], [combined, historicMaintenance]);
  await saveMaintenance(f.db, 1, { data: '2026-10-07', base: revision([combined]), items: [m('m1', { bloqueado: false, emExecucao: true })], removeBlocked: ['4000'] }, now);
  assert.deepEqual(f.state().ci, [previous, future]);
  assert.deepEqual(f.state().manut.find(r => r.id === 'hm'), historicMaintenance);
  assert.equal(f.state().manut.find(r => r.id === 'm1')?.emExecucao, true);
});
test('versao desatualizada, ID historico e usuario nao ADMIN rejeitados', async () => {
  const f = fixture([c(), c('h', { dataBloqueio: '2026-10-07' })]);
  await assert.rejects(saveCI(f.db, 1, { data: '2026-10-08', base: 'stale', items: [] }, now));
  await assert.rejects(saveCI(f.db, 1, { data: '2026-10-08', base: revision([c()]), items: [item(c('h'))] }, now));
  const other = fixture([c()], [m()], false, 'PORTARIA');
  await assert.rejects(saveCI(other.db, 1, { data: '2026-10-08', base: revision([c()]), items: [] }, now));
  assert.equal(f.calls(), 0); assert.equal(other.calls(), 0);
});
test('requisicao ultrapassa 18:30 enquanto espera: rollback integral', async () => {
  const f = fixture(); const before = structuredClone(f.state()); let calls = 0;
  const clock = () => new Date(++calls === 1 ? '2026-10-07T22:29:59Z' : '2026-10-07T22:30:00Z');
  await assert.rejects(saveCI(f.db, 1, { data: '2026-10-08', base: revision([c()]), items: [], removeBlocked: ['4000'] }, clock));
  assert.deepEqual(f.state(), before);
});


test('inclusao inicial explicita valida: CI vazia e Controle recebem bloqueio', async () => {
  const f = fixture([], []);
  await saveCI(f.db, 1, { data: '2026-10-08', base: revision([]), items: [item(c())] }, now);
  assert.equal(f.state().ci.length, 1); assert.equal(f.state().manut[0].bloqueado, true);
});
test('preparacao existente apenas valida, preservando todas as categorias e Liberado', async () => {
  const cs = [c(), c('oficina', { categoria: 'OFICINA' }), c('reforco', { categoria: 'REFORCO', horarioReforco: '06:00' })];
  const f = fixture(cs, [m('lib', { bloqueado: false, liberado: true })]); const before = structuredClone(f.state());
  await saveCI(f.db, 1, { operation: 'prepare', data: '2026-10-08', base: revision(cs), items: [] }, now);
  assert.equal(f.calls(), 0); assert.deepEqual(f.state(), before);
});
test('primeira copia vazia e recopia ambigua sao rejeitadas sem restaurar removidos', async () => {
  const source = c('origem', { dataBloqueio: '2026-10-07' });
  for (const cs of [[], [source]]) {
    const f = fixture(cs, []); const before = structuredClone(f.state());
    await assert.rejects(saveCI(f.db, 1, { operation: 'prepare', data: '2026-10-08', base: revision([]), items: [] }, now), (e: any) => e.status === 409);
    assert.equal(f.calls(), 0); assert.deepEqual(f.state(), before);
  }
});
test('liberado nao retorna a bloqueado por preparacao depois de esvaziar', async () => {
  const source = c('origem', { dataBloqueio: '2026-10-07' });
  const f = fixture([source, c()], [m()]);
  await saveMaintenance(f.db, 1, { data: '2026-10-07', base: revision([m()]), items: [m('m1', { bloqueado: false, liberado: true })], removeBlocked: ['4000'], confirmRelease: true }, now);
  const before = structuredClone(f.state()), calls = f.calls();
  await assert.rejects(saveCI(f.db, 1, { operation: 'prepare', data: '2026-10-08', base: revision([]), items: [] }, now));
  assert.equal(f.calls(), calls); assert.deepEqual(f.state(), before);
});
test('oficina 4001 nao remove nem altera BLOQUEADO 4000 exclusivo da CI', async () => {
  const ci = c(); const f = fixture([ci], []);
  await saveMaintenance(f.db, 1, { data: '2026-10-07', base: revision([]), items: [m('oficina', { prefixo: '4001', bloqueado: false, emExecucao: true })] }, now);
  assert.deepEqual(f.state().ci, [ci]); assert.equal(f.state().manut[0].emExecucao, true);
});
test('ausencia no snapshot CI ou Controle exige retirada explicita antes de escrever', async () => {
  for (const kind of ['ci','controle']) {
    const f = fixture(); const before = structuredClone(f.state());
    const command = kind === 'ci'
      ? saveCI(f.db, 1, { data: '2026-10-08', base: revision(before.ci), items: [] }, now)
      : saveMaintenance(f.db, 1, { data: '2026-10-07', base: revision(before.manut), items: [] }, now);
    await assert.rejects(command, (e: any) => e.status === 409);
    assert.equal(f.calls(), 0); assert.deepEqual(f.state(), before);
  }
});
test('retirada nominal CI preserva outro bloqueado, categorias, datas e execucao', async () => {
  const other = c('other', { prefixo: '4001' }); const history = c('h', { dataBloqueio: '2026-10-07' });
  const office = c('o', { categoria: 'OFICINA' }); const combined = m('m1', { emExecucao: true });
  const f = fixture([c(), other, office, history], [combined, m('m2', { prefixo: '4001' })]);
  await saveCI(f.db, 1, { data: '2026-10-08', base: revision([c(), other, office]), items: [item(other), item(office)], removeBlocked: ['4000'] }, now);
  assert.deepEqual(f.state().ci, [other, office, history]);
  assert.equal(f.state().manut.find(r => r.prefixo === '4000')?.emExecucao, true);
  assert.equal(f.state().manut.find(r => r.prefixo === '4001')?.bloqueado, true);
});
test('retirada de bloqueio Controle nao pode apagar execucao sem liberacao confirmada', async () => {
  const combined = m('m1', { emExecucao: true }); const f = fixture([c()], [combined]);
  await assert.rejects(saveMaintenance(f.db, 1, { data: '2026-10-07', base: revision([combined]), items: [], removeBlocked: ['4000'] }, now), (e: any) => e.status === 409);
  assert.equal(f.calls(), 0);
});
test('VCM rotulado VCG rejeitado antes de exclusao CI ou reconciliacao Controle', async () => {
  const bad = c('vcm', { prefixo: '1000' });
  for (const kind of ['ci','controle']) {
    const f = fixture([bad], []); const before = structuredClone(f.state());
    const command = kind === 'ci'
      ? saveCI(f.db, 1, { data: '2026-10-08', base: revision([bad]), items: [] }, now)
      : saveMaintenance(f.db, 1, { data: '2026-10-07', base: revision([]), items: [m()] }, now);
    await assert.rejects(command, (e: any) => e.status === 409);
    assert.equal(f.calls(), 0); assert.deepEqual(f.state(), before);
  }
});
test('payload VCM e ID VCM para upsert tambem rejeitados sem escrita', async () => {
  const f = fixture([c('vcm', { prefixo: '1000', garagem: 'VCM' })], []);
  await assert.rejects(saveCI(f.db, 1, { data: '2026-10-08', base: revision([]), items: [item(c('new', { prefixo: '1000' }))] }, now));
  await assert.rejects(saveCI(f.db, 1, { data: '2026-10-08', base: revision([]), items: [item(c('vcm'))] }, now));
  assert.equal(f.calls(), 0);
});
test('stale com retirada explicita retorna 409 sem alteracao parcial', async () => {
  const f = fixture(); const before = structuredClone(f.state());
  await assert.rejects(saveCI(f.db, 1, { data: '2026-10-08', base: 'stale', items: [], removeBlocked: ['4000'] }, now), (e: any) => e.status === 409);
  assert.equal(f.calls(), 0); assert.deepEqual(f.state(), before);
});
test('falha DELETE CI depois de liberar Controle desfaz ambas as partes', async () => {
  const f = fixture([c()], [m()], 'ci-delete'); const before = structuredClone(f.state());
  await assert.rejects(saveMaintenance(f.db, 1, { data: '2026-10-07', base: revision(before.manut), items: [m('m1', { bloqueado: false, liberado: true })], removeBlocked: ['4000'], confirmRelease: true }, now));
  assert.ok(f.calls() > 1); assert.deepEqual(f.state(), before);
});
test('falha Controle apos upsert CI desfaz a inclusao inteira', async () => {
  const f = fixture([], [], 'manut-upsert'); const before = structuredClone(f.state());
  await assert.rejects(saveCI(f.db, 1, { data: '2026-10-08', base: revision([]), items: [item(c())] }, now));
  assert.ok(f.calls() > 1); assert.deepEqual(f.state(), before);
});
test('alteracao de categoria oficina nao reconcilia LIBERADO com bloqueio inalterado', async () => {
  const f = fixture([c()], [m('lib', { bloqueado: false, liberado: true })]);
  const released = structuredClone(f.state().manut);
  await saveCI(f.db, 1, { data: '2026-10-08', base: revision([c()]), items: [item(c()), item(c('o', { categoria: 'OFICINA' }))] }, now);
  assert.deepEqual(f.state().manut, released);
});
test('UX: pending rejeita segundo comando e invalida respostas anteriores', () => {
  confirmRefresh(); const ticket = readTicket(); beginMutation();
  assert.equal(getMutationState().pending, true); assert.throws(beginMutation); assert.throws(() => assertReadTicket(ticket));
  endMutation(); assert.equal(getMutationState().pending, false);
});
test('UX: POST confirmado com refresh falho bloqueia novas mutacoes ate consulta', () => {
  beginMutation(); requireRefresh(); confirmRefresh();
  assert.equal(getMutationState().refreshRequired, true);
  endMutation(); assert.throws(beginMutation); assert.match(new SavedRefreshRequired().message, /Alteracao salva/);
  confirmRefresh(); beginMutation(); endMutation();
});

test('retirada nominal nao saneia silenciosamente bloqueios legados duplicados', async () => {
  const f = fixture([c(), c('duplicado')]); const before = structuredClone(f.state());
  await assert.rejects(saveCI(f.db, 1, { data: '2026-10-08', base: revision(before.ci), items: [], removeBlocked: ['4000'] }, now), (e: any) => e.status === 409);
  assert.equal(f.calls(), 0); assert.deepEqual(f.state(), before);
});
