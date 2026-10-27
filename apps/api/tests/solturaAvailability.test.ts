import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveReleaseContext, writeSafeRelease } from '../src/services/solturaAvailability';
import { eventInstant } from '../src/services/c4Temporal';
import { currentReleaseTemplate } from '../src/data/scheduleTemplates';
const day = '2026-10-08', target = '2026-10-09';
const context = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO', dataOperacao: target } as const;
const [first, second] = currentReleaseTemplate(context);
const item = { scheduleId: first.id, carroRealizado: '4000', linha: first.linha, tabela: first.tabela, driverCode: '123' };
const secondItem = { ...item, scheduleId: second.id, linha: second.linha, tabela: second.tabela, carroRealizado: '4001' };
function scaleContent(status = 'FINALIZADA') { return JSON.stringify({ version: 3, itens: [], cards: [], confirmacoes: [],
 fluxo: { status, iniciadaEm: '2026-10-08T15:00:00Z', finalizadaEm: status === 'FINALIZADA' ? '2026-10-08T16:00:00Z' : null,
 fonteCI: { ciData: target, bloqueados: [], ciAvisos: [] } } }); }
const body = { ...item, garagem: 'VCG', dataOperacao: target, turno: 'MATUTINO', escalaTipo: 'SEG_SEX' };
function fixture(status = 'FINALIZADA') {
  let rows: any[] = [], failRead = false, failWrite = false;
  const locks: string[] = [], states: any[] = [], ci: any[] = [];
  let cycle: any = { id: 1, origem: 'NORMAL' };
  const db: any = {
    user: { findUnique: async () => ({ role: 'soltura', garagem: 'VCG' }) },
    $queryRaw: async (parts: TemplateStringsArray) => { locks.push(parts.join('?')); },
    escalaDiaria: { findUnique: async () => ({ conteudo: scaleContent() }) },
    cicloOperacional: { findUnique: async () => cycle },
    folhaCI: { findUnique: async ({ where }: any) => {
      if (failRead) throw Error('SQL indisponivel');
      if (where.id) return { id: 1, garagem: 'VCG', dataFolha: new Date(day), status: 'FINALIZADA', origem: 'IMPORTACAO', folhaOrigemId: null, cicloPreparacaoId: null, itens: [] };
      return { id: 2, garagem: 'VCG', dataFolha: new Date(target), status, origem: 'NORMAL', folhaOrigemId: 1, cicloPreparacaoId: 1, itens: ci };
    } },
    estadoManutencao: { findMany: async () => states },
    soltura: {
      findMany: async ({ where }: any) => rows.filter(r => Object.entries(where).every(([key, value]) => r[key] === value)),
      update: async ({ where, data }: any) => { const index = rows.findIndex(row => row.id === where.id); rows[index] = { ...rows[index], ...data }; return rows[index]; },
      create: async ({ data }: any) => { if (failWrite && rows.length) throw Error('Escrita falhou'); const r = { id: rows.length + 1, ...data }; rows.push(r); return r; },
    },
    $transaction: async (fn: any, options: any) => {
      assert.equal(options.isolationLevel, 'Serializable'); const prior = structuredClone(rows);
      try { return await fn(db); } catch (e) { rows = prior; throw e; }
    },
  };
  return { db, locks, states, ci, rows: () => rows, failRead: () => { failRead = true; }, failWrite: () => { failWrite = true; }, missingCycle: () => { cycle = null; } };
}
const reason = (code: string) => (e: any) => e.status === 409 && e.code === code;

test('carro realizado vazio usa programado oficial e exige motorista e disponibilidade', async () => {
 const f = fixture();
 const saved: any = await writeSafeRelease(f.db, 1, { ...body, carroRealizado: '', carroProgramado: '9999' }, false, () => eventInstant(target, 4), () => ['VCG']);
 assert.ok(saved.carroProgramado); assert.equal(saved.carroRealizado, saved.carroProgramado); assert.notEqual(saved.carroRealizado, '9999');
 assert.equal(saved.substituido, false);
 const g = fixture(); g.ci.push({ prefixo: saved.carroProgramado, categoria: 'BLOQUEADO' });
 await assert.rejects(writeSafeRelease(g.db, 1, { ...body, carroRealizado: undefined }, false, () => eventInstant(target, 4), () => ['VCG']), reason('VEICULO_BLOQUEADO_NA_CI'));
 await assert.rejects(writeSafeRelease(f.db, 1, { ...body, carroRealizado: '', driverCode: '' }, false, () => eventInstant(target, 4), () => ['VCG']));
 assert.equal(g.rows().length, 0);
});

test('troca por defeito salva descricao e autor no servidor e impede outro despacho', async () => {
 const f = fixture(); const clock = () => eventInstant(target, 4);
 await writeSafeRelease(f.db, 1, body, false, clock, () => ['VCG']);
 const saved: any = await writeSafeRelease(f.db, 1, { ...body, carroRealizado: '4001', trocaCarro: { carroAnterior: '4000', motivo: 'Defeito Garagem', descricaoDefeito: '  Pneu furado  ' } }, false, clock, () => ['VCG']);
 const history = JSON.parse(saved.historicoTrocas);
 assert.equal(history.length, 1); assert.equal(history[0].descricaoDefeito, 'Pneu furado'); assert.equal(history[0].usuarioId, 1);
 assert.equal(history[0].registradoEm, clock().toISOString()); assert.equal(history[0].carroAnterior, '4000');
 assert.equal(f.ci.length, 0);
 const before = structuredClone(f.rows());
 await assert.rejects(writeSafeRelease(f.db, 1, { ...body, ...secondItem, carroRealizado: '4000' }, false, clock, () => ['VCG']), reason('VEICULO_COM_DEFEITO_GARAGEM'));
 assert.deepEqual(f.rows(), before);
 const same: any = await writeSafeRelease(f.db, 1, { ...body, carroRealizado: '4001', historicoTrocas: [] }, false, clock, () => ['VCG']);
 assert.deepEqual(JSON.parse(same.historicoTrocas), history);
});

test('troca exige motivo, descricao de defeito e prefixo anterior atual, sem gravacao parcial', async () => {
 const f = fixture(); const clock = () => eventInstant(target, 4);
 await writeSafeRelease(f.db, 1, body, false, clock, () => ['VCG']); const before = structuredClone(f.rows());
 for (const trocaCarro of [undefined, { carroAnterior: '4000', motivo: 'Defeito Garagem', descricaoDefeito: '  ' },
   { carroAnterior: '4002', motivo: 'Adicionado equivocadamente' }, { carroAnterior: '4000', motivo: 'Outro' },
   { carroAnterior: '4000', motivo: 'Defeito Garagem', descricaoDefeito: 'Pneu', usuarioId: 99 }]) {
   await assert.rejects(writeSafeRelease(f.db, 1, { ...body, carroRealizado: '4001', trocaCarro }, false, clock, () => ['VCG']));
   assert.deepEqual(f.rows(), before);
 }
});

test('equivoco registra troca sem criar defeito; cliente nao pode inventar historico', async () => {
 const f = fixture(); const clock = () => eventInstant(target, 4);
 const forged = [{ carroAnterior: '4001', motivo: 'Defeito Garagem' }];
 const initial: any = await writeSafeRelease(f.db, 1, { ...body, historicoTrocas: forged }, false, clock, () => ['VCG']);
 assert.deepEqual(JSON.parse(initial.historicoTrocas), []);
 const saved: any = await writeSafeRelease(f.db, 1, { ...body, carroRealizado: '4001', trocaCarro: { carroAnterior: '4000', motivo: 'Adicionado equivocadamente' } }, false, clock, () => ['VCG']);
 assert.equal(JSON.parse(saved.historicoTrocas)[0].motivo, 'Adicionado equivocadamente');
 await writeSafeRelease(f.db, 1, { ...body, ...secondItem, carroRealizado: '4000' }, false, clock, () => ['VCG']);
 assert.equal(f.rows().length, 2);
});

test('defeito de outro turno bloqueia; outra data ou garagem nao transporta bloqueio', async () => {
 const clock = () => eventInstant(target, 4);
 for (const [garagem, dataOperacao, shouldBlock] of [['VCG', target, true], ['VCM', target, false], ['VCG', day, false]] as const) {
  const f = fixture(); f.rows().push({ id: 99, garagem, dataOperacao, turno: 'VESPERTINO', escalaTipo: 'SEG_SEX', scheduleId: 'outro', carroRealizado: '4002',
    historicoTrocas: JSON.stringify([{ carroAnterior: '4000', motivo: 'Defeito Garagem', descricaoDefeito: 'Motor' }]) });
  const request = writeSafeRelease(f.db, 1, body, false, clock, () => ['VCG']);
  if (shouldBlock) await assert.rejects(request, reason('VEICULO_COM_DEFEITO_GARAGEM')); else await request;
 }
});

test('defeito em lote impede reutilizacao no mesmo lote e reverte tudo', async () => {
 const f = fixture(); const clock = () => eventInstant(target, 4);
 await writeSafeRelease(f.db, 1, body, false, clock, () => ['VCG']); const before = structuredClone(f.rows());
 for (const reverse of [false, true]) {
  const rows = [{ ...item, carroRealizado: '4002', trocaCarro: { carroAnterior: '4000', motivo: 'Defeito Garagem', descricaoDefeito: 'Motor' } }, { ...secondItem, carroRealizado: '4000' }];
  await assert.rejects(writeSafeRelease(f.db, 1, { ...body, items: reverse ? rows.reverse() : rows }, true, clock, () => ['VCG']), reason('VEICULO_COM_DEFEITO_GARAGEM'));
  assert.deepEqual(f.rows(), before);
 }
});

test('falha ao persistir lote reverte troca e historico de defeito ja preparados', async () => {
 const f = fixture(); const clock = () => eventInstant(target, 4);
 await writeSafeRelease(f.db, 1, body, false, clock, () => ['VCG']); const before = structuredClone(f.rows()); f.failWrite();
 await assert.rejects(writeSafeRelease(f.db, 1, { ...body, items: [
  { ...item, carroRealizado: '4002', trocaCarro: { carroAnterior: '4000', motivo: 'Defeito Garagem', descricaoDefeito: 'Motor' } }, secondItem,
 ] }, true, clock, () => ['VCG']), /Escrita falhou/);
 assert.deepEqual(f.rows(), before);
});
test('somente a data atual permite despacho, inclusive antes das 03h', () => {
 for (const hour of [0, 1, 3, 22]) assert.deepEqual(resolveReleaseContext('VCG', target, eventInstant(target, hour)), { ciDate: target, maintenanceDate: target });
 for (const hour of [15, 22]) assert.throws(() => resolveReleaseContext('VCG', target, eventInstant(day, hour)), reason('DATA_FORA_DO_CONTEXTO'));
 assert.throws(() => resolveReleaseContext('VCG', undefined, eventInstant(day, 15)), reason('DATA_OPERACIONAL_OBRIGATORIA'));
});

test('tarde: preparacao nao autoriza; noite: CI finalizada e manutencao oficial permitem gravacao', async () => {
  const prep = fixture('EM_PREPARACAO');
  await assert.rejects(writeSafeRelease(prep.db, 1, body, false, () => eventInstant(target, 15), () => ['VCG']), reason('CI_EM_PREPARACAO_NAO_AUTORIZA_SOLTURA'));
  assert.equal(prep.rows().length, 0);
  const ready = fixture();
  const row: any = await writeSafeRelease(ready.db, 1, body, false, () => eventInstant(target, 22), () => ['VCG']);
  assert.equal(row.status, 'LIBERADO'); assert.equal(row.dataOperacao, target);
  assert.match(ready.locks[0], /ciclo_operacional.*UPDLOCK, HOLDLOCK/);
  assert.match(ready.locks[1], /folha_ci.*UPDLOCK, HOLDLOCK/);
});
test('bloqueio CI e manutencao impeditiva recusam lote inteiro antes das escritas', async () => {
  for (const source of ['CI', 'BLOQUEADO', 'EXECUCAO']) {
    const f = fixture();
    if (source === 'CI') f.ci.push({ prefixo: '4001', categoria: 'BLOQUEADO' });
    else f.states.push({ prefixo: '4001', bloqueado: source === 'BLOQUEADO', emExecucao: source === 'EXECUCAO', liberado: false });
    await assert.rejects(writeSafeRelease(f.db, 1, { ...body, items: [item, secondItem] }, true, () => eventInstant(target, 22), () => ['VCG']));
    assert.equal(f.rows().length, 0);
  }
});
test('falha de consulta e erro na segunda escrita nunca deixam lote parcial', async () => {
  for (const fail of ['failRead', 'failWrite'] as const) {
    const f = fixture(); f[fail]();
    await assert.rejects(writeSafeRelease(f.db, 1, { ...body, items: [item, secondItem] }, true, () => eventInstant(target, 22), () => ['VCG']));
    assert.equal(f.rows().length, 0);
  }
});
test('VCM e legado permanecem suspensos sem consultar banco', async () => {
  const db: any = { $transaction: () => { throw Error('Nao consultar'); } };
  await assert.rejects(writeSafeRelease(db, 1, { ...body, garagem: 'VCM' }, false), reason('FONTE_VCM_NAO_COMPROVADA'));
  await assert.rejects(writeSafeRelease(db, 1, body, false, () => eventInstant(target, 22), () => []), reason('LEGADO_SEM_FOLHA_FINALIZADA_CERTIFICAVEL'));
});
test('bloqueio confirmado durante espera pelo lock e visto antes de gravar', async () => {
  const f = fixture();
  f.db.$queryRaw = async () => {
    if (!f.states.length) {
      f.states.push({ prefixo: '4000', bloqueado: true, emExecucao: false, liberado: false, consorciada: 'VCG' });
      f.ci.push({ prefixo: '4000', categoria: 'BLOQUEADO', consorciada: 'VCG' });
    }
  };
  await assert.rejects(writeSafeRelease(f.db, 1, body, false, () => eventInstant(target, 22), () => ['VCG']), reason('VEICULO_BLOQUEADO_NA_CI'));
  assert.equal(f.rows().length, 0);
});
test('virada de dia antes do commit desfaz a soltura', async () => {
  const f = fixture();
  await assert.rejects(writeSafeRelease(f.db, 1, body, false,
    () => f.rows().length ? eventInstant('2026-10-10', 1) : eventInstant(target, 23), () => ['VCG']));
  assert.equal(f.rows().length, 0);
});
test('copia NORMAL de origem RECUPERACAO nao autoriza e manutencao bloqueada recusa', async () => {
  const f = fixture(); const original = f.db.folhaCI.findUnique;
  f.db.folhaCI.findUnique = async (q: any) => {
    const record = await original(q);
    return q.where.id ? { ...record, origem: 'RECUPERACAO' } : record;
  };
  await assert.rejects(writeSafeRelease(f.db, 1, body, false, () => eventInstant(target, 22), () => ['VCG']), reason('ORIGEM_CI_NAO_CERTIFICADA'));
  assert.equal(f.rows().length, 0);
  const divergent = fixture(); divergent.states.push({ prefixo: '4000', bloqueado: true, emExecucao: false, liberado: false });
  await assert.rejects(writeSafeRelease(divergent.db, 1, body, false, () => eventInstant(target, 22), () => ['VCG']), reason('VEICULO_BLOQUEADO_OU_EM_EXECUCAO'));
});


test('soltura recusa usuario de outra garagem antes de gravar', async () => {
  const f = fixture();
  f.db.user.findUnique = async () => ({ role: 'soltura', garagem: 'VCM' });
  await assert.rejects(writeSafeRelease(f.db, 1, body, false, () => eventInstant(target, 22), () => ['VCG']), (e: any) => e.status === 403);
  assert.equal(f.rows().length, 0);
});

for (const batch of [false, true]) test('fretamento sem tabela preserva o registro no banco simulado, lote=' + batch, async () => {
 const f = fixture(); const special = currentReleaseTemplate({ garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO' }).find(i => i.tipo === 'FRETAMENTO')!;
 const entry = { ...item, scheduleId: special.id, linha: special.linha, tabela: '' };
 const command = batch ? { ...body, items: [entry] } : { ...body, ...entry };
 await writeSafeRelease(f.db, 1, command, batch, () => eventInstant(target, 12), () => ['VCG']);
 assert.equal(f.rows().length, 1); assert.equal(f.rows()[0].tabela, ''); assert.equal(f.rows()[0].linha, special.linha);
});

 test('sem ciclo de manutencao e sem CI de amanha, CI e Escala da data bastam antes das 03h', async () => {
 const f = fixture(); f.missingCycle(); const read = f.db.folhaCI.findUnique;
 f.db.folhaCI.findUnique = async (q: any) => q.where.garagem_dataFolha && q.where.garagem_dataFolha.dataFolha.toISOString().slice(0,10) !== target ? null : read(q);
 await writeSafeRelease(f.db, 1, body, false, () => eventInstant(target, 1), () => ['VCG']);
 assert.equal(f.rows().length, 1);
 });
 for (const value of [null, { conteudo: scaleContent('EM_PREPARACAO') }]) test('Escala ausente ou em preparacao recusa despacho', async () => {
 const f = fixture(); f.db.escalaDiaria.findUnique = async () => value;
 await assert.rejects(writeSafeRelease(f.db, 1, body, false, () => eventInstant(target, 4), () => ['VCG']), reason('ESCALA_NAO_FINALIZADA'));
 assert.equal(f.rows().length, 0);
 });
 test('backend ignora carro programado adulterado e preserva programacao apos despacho', async () => {
 const f = fixture(); const row: any = await writeSafeRelease(f.db, 1, { ...body, carroProgramado: '9999' }, false, () => eventInstant(target, 4), () => ['VCG']);
 assert.notEqual(row.carroProgramado, '9999'); const saved = row.carroProgramado;
 f.db.escalaDiaria.findUnique = async () => { const state=JSON.parse(scaleContent()); state.itens=[{ id: first.id, carroSubstituido: '5001' }]; return { conteudo: JSON.stringify(state) }; };
 const corrected: any = await writeSafeRelease(f.db, 1, { ...body, carroProgramado: '8888', saidaGaragem:'23:59' }, false, () => eventInstant(target, 5), () => ['VCG']);
 assert.equal(corrected.carroProgramado, saved); assert.equal(corrected.saidaGaragem, first.saidaGaragem);
 });
 test('perfil sem autorizacao de despacho e viagem adulterada sao recusados', async () => {
 const f = fixture(); f.db.user.findUnique = async () => ({ role: 'manutencao', garagem: 'VCG' });
 await assert.rejects(writeSafeRelease(f.db, 1, body, false, () => eventInstant(target, 4), () => ['VCG']), (e:any)=> e.status===403);
 const g = fixture(); await assert.rejects(writeSafeRelease(g.db, 1, {...body, tabela:'ADULTERADA'}, false, () => eventInstant(target,4), () => ['VCG']),reason('VIAGEM_FORA_DO_MOLDE'));
 assert.equal(g.rows().length,0);
 });
