import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readEscalaDiaria as readReal, saveEscalaDiaria as saveReal, parseDailyContext, fixedSchedule } from '../src/services/escalaDiaria';
import { applyDailySchedule, fixedScheduleRows, fixedScheduleToken } from '../../web/src/lib/dailySchedule';
import { validateDailyEscala } from '../../web/src/lib/sharedEscala';
import { officialGarageFleet, occupations, defaultAllocations } from '../src/services/escalaAllocation';

const baseContext = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO' } as const;
const contexto = { ...baseContext, dataOperacao: '2026-10-14' };
const original = fixedSchedule(contexto)[0];
const fleetRows = [...new Set([...fixedSchedule(contexto).map(i => i.carroProgramado).filter(p => /^\d{1,10}$/.test(p)), '5001', '5002', '5001', '5002', '5003'])].map(prefixo => ({ idCarro: Number(prefixo), prefixo, garagem: 2, garagemNome: 'VCG' }));
const readEscalaDiaria = (db: any, value: unknown, userId: number | undefined) => readReal(db, value, userId, async () => db.__fleet);
const saveEscalaDiaria = (db: any, userId: number | undefined, value: unknown) => saveReal(db, userId, value, async () => db.__fleet);
function fixture() {
  const records = new Map<string, any>();
  let role = 'ADMIN', garagem = 'VCG', fail = false;
  const locks: string[] = [];
  const key = (where: any) => JSON.stringify(where.garagem_escalaTipo_turno_dataOperacao);
  const db: any = {
    __fleet: { source: 'real', data: fleetRows }, __blocks: [] as string[],
    folhaCI: { findUnique: async ({ where }: any) => { db.__ciDate = where.garagem_dataFolha.dataFolha.toISOString().slice(0,10); return { itens: db.__blocks.map((prefixo: string) => ({ prefixo, categoria: 'BLOQUEADO', statusItem: 'BLOQUEADO' })) }; } },
    user: { findUnique: async () => ({ role, garagem }) },
    get escalaCarros() { throw Error('Programacao permanente nao pode ser consultada'); },
    get soltura() { throw Error('Substituicao nao pode registrar liberacao'); },
    escalaDiaria: {
      findUnique: async ({ where }: any) => records.get(key(where)) ?? null,
      create: async ({ data }: any) => {
        if (fail) throw new Error('Falha simulada');
        const { garagem, escalaTipo, turno, dataOperacao } = data;
        records.set(JSON.stringify({ garagem, escalaTipo, turno, dataOperacao }), { id: records.size + 1, ...data });
      },
      update: async ({ where, data }: any) => {
        if (fail) throw new Error('Falha simulada');
        for (const [k, r] of records) if (r.id === where.id) records.set(k, { ...r, ...data });
      },
    },
    $queryRaw: async (sql: TemplateStringsArray) => { locks.push(sql.join('?')); return []; },
    $transaction: async (fn: any, options: any) => {
      assert.equal(options.isolationLevel, 'Serializable');
      const before = structuredClone(records);
      try { return await fn(db); } catch (e) { records.clear(); for (const [k, r] of before) records.set(k, r); throw e; }
    },
  };
  return { db, records, locks, role: (value: string) => { role = value; }, garage: (value: string) => { garagem = value; }, fail: () => { fail = true; } };
}
const command = (revisao = 0, carroSubstituido = '5001') => ({ contexto, revisao, id: original.id, carroSubstituido, base: JSON.stringify(original) });

test('escala usa JSON fixo e banco armazena somente a substituicao', async () => {
  const f = fixture();
  const before = JSON.stringify(fixedSchedule(contexto));
  const daily = await saveEscalaDiaria(f.db, 1, command());
  const rows = applyDailySchedule(fixedScheduleRows(baseContext), daily);
  assert.equal(JSON.stringify(fixedSchedule(contexto)), before);
  assert.equal(rows[0].carroProgramado, original.carroProgramado);
  assert.equal(rows[0].carroSubstituido, '5001');
  assert.equal(rows[0].status, 'PENDENTE');
  assert.equal(rows[0].carroRealizado, undefined);
  assert.deepEqual(JSON.parse([...f.records.values()][0].conteudo).itens, [{ id: original.id, carroSubstituido: '5001' }]);
  assert.equal(f.locks.length, 3);
  assert.match(f.locks[2], /escala_diaria WITH \(UPDLOCK,HOLDLOCK\)/);
});
test('todos os campos fixos permanecem iguais apos substituir', async () => {
  const daily = await saveEscalaDiaria(fixture().db, 1, command());
  const base = fixedScheduleRows(baseContext), row = applyDailySchedule(base, daily)[0];
  for (const key of ['linha', 'tabela', 'saidaGaragem', 'chegadaGaragem', 'carroProgramado'] as const)
    assert.equal(row[key], base[0][key]);
});
test('dia seguinte, garagem e turno nao herdam substituicoes', async () => {
  const f = fixture(); await saveEscalaDiaria(f.db, 1, command());
  for (const change of [{ dataOperacao: '2026-10-15' }, { garagem: 'VCM' }, { turno: 'VESPERTINO' }]) {
    const daily = await readEscalaDiaria(f.db, { ...contexto, ...change }, 1);
    assert.equal(daily.revisao, 0); assert.deepEqual(daily.itens, []);
  }
});
test('consulta data anterior recupera substituicao sem modificar o dia seguinte', async () => {
  const f = fixture(); await saveEscalaDiaria(f.db, 1, command());
  await readEscalaDiaria(f.db, { ...contexto, dataOperacao: '2026-10-15' }, 1);
  assert.equal((await readEscalaDiaria(f.db, contexto, 1)).itens[0].carroSubstituido, '5001');
});
test('duas gravacoes consecutivas atualizam apenas a substituicao', async () => {
  const f = fixture(); await saveEscalaDiaria(f.db, 1, command());
  const daily = await saveEscalaDiaria(f.db, 1, command(1, '5002'));
  assert.equal(daily.revisao, 2); assert.deepEqual(daily.itens, [{ id: original.id, carroSubstituido: '5002' }]);
});
test('limpar substituicao ou informar carro original restaura valores fixos', async () => {
  for (const value of ['', original.carroProgramado]) {
    const f = fixture(); await saveEscalaDiaria(f.db, 1, command());
    const daily = await saveEscalaDiaria(f.db, 1, command(1, value));
    assert.deepEqual(daily.itens, []);
    assert.equal(applyDailySchedule(fixedScheduleRows(baseContext), daily)[0].carroProgramado, original.carroProgramado);
  }
});
test('revisao diaria obsoleta retorna 409 e preserva vencedor', async () => {
  const f = fixture(); await saveEscalaDiaria(f.db, 1, command());
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(0, '5002')), (e: any) => e.status === 409);
  assert.equal((await readEscalaDiaria(f.db, contexto, 1)).itens[0].carroSubstituido, '5001');
});
test('JSON divergente entre cliente e servidor retorna 409', async () => {
  await assert.rejects(saveEscalaDiaria(fixture().db, 1, { ...command(), base: 'versao antiga' }), (e: any) => e.status === 409);
});
test('viagem inexistente nao pode ser gravada', async () => {
  await assert.rejects(saveEscalaDiaria(fixture().db, 1, { ...command(), id: 'inventada' }), (e: any) => e.status === 409);
});
test('erro de persistencia conserva alteracao anterior', async () => {
  const f = fixture(); await saveEscalaDiaria(f.db, 1, command()); f.fail();
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(1, '5002')));
  const daily = await readEscalaDiaria(f.db, contexto, 1);
  assert.equal(daily.revisao, 1); assert.equal(daily.itens[0].carroSubstituido, '5001');
});
test('ADMIN e Soltura da propria garagem podem alterar; outra garagem e COLABORADOR nao', async () => {
  const f = fixture(); f.role('COLABORADOR');
  await assert.rejects(saveEscalaDiaria(f.db, 1, command()), (e: any) => e.status === 403);
  f.role('soltura');
  assert.equal((await saveEscalaDiaria(f.db, 1, command())).revisao, 1);
  f.garage('VCM');
  await assert.rejects(readEscalaDiaria(f.db, contexto, 1), (e: any) => e.status === 403);
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(1)), (e: any) => e.status === 403);
});
test('datas invalidas, prefixos invalidos e tentativa de editar campos fixos sao recusados', async () => {
  assert.throws(() => parseDailyContext({ ...contexto, dataOperacao: '2026-02-30' }));
  await assert.rejects(saveEscalaDiaria(fixture().db, 1, command(0, 'abc')));
  for (const extra of [{ linha: '02' }, { chegadaGaragem: '08:20' }, { carroProgramado: '4200' }, { status: 'LIBERADO' }])
    await assert.rejects(saveEscalaDiaria(fixture().db, 1, { ...command(), ...extra }));
});
test('falha real de consulta preserva JSON visivel; recuperacao carrega substituicoes', async () => {
  const f = fixture(); await saveEscalaDiaria(f.db, 1, command());
  const load = f.db.escalaDiaria.findUnique;
  f.db.escalaDiaria.findUnique = async () => { throw new Error('Consulta indisponivel'); };
  await assert.rejects(readEscalaDiaria(f.db, contexto, 1));
  assert.equal(applyDailySchedule(fixedScheduleRows(baseContext), null)[0].carroProgramado, original.carroProgramado);
  f.db.escalaDiaria.findUnique = load;
  assert.equal((await readEscalaDiaria(f.db, contexto, 1)).itens[0].carroSubstituido, '5001');
});
test('conteudo diario malformado ou com viagem desconhecida nao e descartado silenciosamente', async () => {
  const f = fixture(); f.db.escalaDiaria.findUnique = async () => ({ revisao: 1, conteudo: '{invalido' });
  await assert.rejects(readEscalaDiaria(f.db, contexto, 1));
  f.db.escalaDiaria.findUnique = async () => ({ revisao: 1, conteudo: JSON.stringify([{ id: 'outra', carroSubstituido: '5001' }]) });
  await assert.rejects(readEscalaDiaria(f.db, contexto, 1), (e: any) => e.status === 409);
});
test('JSON frontend e backend sao identicos em todos os oito contextos', () => {
  const a = JSON.parse(readFileSync('apps/api/src/data/escalaFixa.json', 'utf8'));
  const b = JSON.parse(readFileSync('apps/web/src/data/escalaFixa.json', 'utf8'));
  assert.deepEqual(a, b); assert.equal(Object.keys(a).length, 8);
  for (const rows of Object.values(a) as any[][]) assert.equal(new Set(rows.map(r => r.id)).size, rows.length);
  assert.equal(fixedScheduleToken(baseContext, original.id), JSON.stringify(original));
});
test('frontend recusa resposta malformada, duplicada ou de outra data', async () => {
  const response = await saveEscalaDiaria(fixture().db, 1, command());
  assert.deepEqual(validateDailyEscala(response, contexto), response);
  assert.throws(() => validateDailyEscala({}, contexto));
  assert.throws(() => validateDailyEscala(response, { ...contexto, dataOperacao: '2026-10-15' }));
  assert.throws(() => validateDailyEscala({ ...response, itens: [response.itens[0], response.itens[0]] }, contexto));
});

const cardCommand = (revisao = 0, prefixo = '5001', card = 'LIMPEZA') => ({ contexto, revisao, card, operacao: 'adicionar', prefixo });
test('bloqueados vem exclusivamente da CI do dia seguinte e da frota selecionada', async () => {
  const f = fixture();
  f.db.folhaCI.findUnique = async ({ where }: any) => {
    assert.equal(where.garagem_dataFolha.garagem, 'VCG');
    assert.equal(where.garagem_dataFolha.dataFolha.toISOString().slice(0, 10), '2026-10-15');
    return { itens: [
      { prefixo: '5001', categoria: 'BLOQUEADO', statusItem: 'BLOQUEADO' },
      { prefixo: '5002', categoria: 'OFICINA' },
      { prefixo: '5003', categoria: 'BLOQUEADO', statusItem: 'LIBERADO' },
      { prefixo: '1333', categoria: 'BLOQUEADO' },
    ] };
  };
  const read = await readEscalaDiaria(f.db, contexto, 1);
  assert.equal(read.ciData, '2026-10-15'); assert.deepEqual(read.bloqueados, ['5001']);
});
test('carro fixo bloqueado exige substituto livre, sem alterar o JSON', async () => {
  const f = fixture(); f.db.__blocks = [original.carroProgramado];
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(0, '')), (e: any) => e.status === 409 && /bloqueado/.test(e.message));
  assert.equal(f.records.size, 0);
  const saved = await saveEscalaDiaria(f.db, 1, command());
  assert.equal(saved.itens[0].carroSubstituido, '5001');
  assert.equal(fixedSchedule(contexto)[0].carroProgramado, original.carroProgramado);
  assert.ok(!saved.reserva.includes(original.carroProgramado));
});
test('bloqueado nao entra em linha nem em qualquer card de veiculos', async () => {
  const f = fixture(); f.db.__blocks = ['5001'];
  await assert.rejects(saveEscalaDiaria(f.db, 1, command()), (e: any) => /bloqueado/.test(e.message));
  for (const card of ['AZUL', 'VERMELHO', 'MICRO', 'PORTARIA', 'LIMPEZA', 'BORRACHARIA', 'PEDIDOS_GARAGEM'])
    await assert.rejects(saveEscalaDiaria(f.db, 1, cardCommand(0, '5001', card)), (e: any) => /bloqueado/.test(e.message));
  const state = await readEscalaDiaria(f.db, contexto, 1);
  const terminal = state.cards.find(c => c.modo === 'unico')!;
  await assert.rejects(saveEscalaDiaria(f.db, 1, { ...cardCommand(0, '5001', terminal.id), operacao: 'definir', itemId: terminal.itens[0].id }), (e: any) => /bloqueado/.test(e.message));
  await assert.rejects(saveEscalaDiaria(f.db, 1, { ...cardCommand(0, '5001', 'RABICHO'), operacao: 'definir', itemId: state.cards.find(c => c.id === 'RABICHO')!.itens[0].id }), (e: any) => /bloqueado/.test(e.message));
  assert.equal(f.records.size, 0);
});
test('duplicidade entre linha e cards ou entre cards e recusada no backend', async () => {
  const f = fixture();
  await assert.rejects(saveEscalaDiaria(f.db, 1, cardCommand(0, original.carroProgramado)), (e: any) => /ja utilizado/.test(e.message));
  await saveEscalaDiaria(f.db, 1, cardCommand());
  await assert.rejects(saveEscalaDiaria(f.db, 1, cardCommand(1, '5001', 'AZUL')), (e: any) => /ja utilizado/.test(e.message));
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(1)), (e: any) => /ja utilizado/.test(e.message));
});
test('fixo so pode entrar em card apos ser substituido; restauracao nao pode duplicar', async () => {
  const f = fixture();
  await saveEscalaDiaria(f.db, 1, command());
  const card = await saveEscalaDiaria(f.db, 1, cardCommand(1, original.carroProgramado));
  assert.ok(card.cards.find(c => c.id === 'LIMPEZA')?.itens.some(i => i.prefixo === original.carroProgramado));
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(2, '')), (e: any) => /ja utilizado/.test(e.message));
  assert.equal((await readEscalaDiaria(f.db, contexto, 1)).itens[0].carroSubstituido, '5001');
});
test('reserva e derivada da frota menos linhas, cards e bloqueados', async () => {
  const f = fixture(); f.db.__blocks = ['5003'];
  const before = await readEscalaDiaria(f.db, contexto, 1);
  assert.ok(before.reserva.includes('5001')); assert.ok(!before.reserva.includes(original.carroProgramado));
  const saved = await saveEscalaDiaria(f.db, 1, command());
  assert.ok(!saved.reserva.includes('5001')); assert.ok(!saved.reserva.includes('5003'));
  assert.ok(saved.reserva.includes(original.carroProgramado));
  const withCard = await saveEscalaDiaria(f.db, 1, cardCommand(1, '5002'));
  assert.ok(!withCard.reserva.includes('5002'));
});
test('cards compartilhados por data nao migram para o dia seguinte e podem ser retirados', async () => {
  const f = fixture(); const saved = await saveEscalaDiaria(f.db, 1, cardCommand());
  const item = saved.cards.find(c => c.id === 'LIMPEZA')!.itens[0];
  assert.equal((await readEscalaDiaria(f.db, contexto, 1)).cards.find(c => c.id === 'LIMPEZA')?.itens[0].prefixo, '5001');
  const tomorrow = await readEscalaDiaria(f.db, { ...contexto, dataOperacao: '2026-10-15' }, 1);
  assert.deepEqual(tomorrow.cards.find(c => c.id === 'LIMPEZA')?.itens, []);
  await saveEscalaDiaria(f.db, 1, { contexto, revisao: 1, card: 'LIMPEZA', operacao: 'remover', prefixo: '', itemId: item.id });
  assert.deepEqual((await readEscalaDiaria(f.db, contexto, 1)).cards.find(c => c.id === 'LIMPEZA')?.itens, []);
});
test('conflito entre gravacao de card e linha preserva vencedor sem repetir POST', async () => {
  const f = fixture(); await saveEscalaDiaria(f.db, 1, cardCommand());
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(0, '5002')), (e: any) => e.status === 409);
  const state = await readEscalaDiaria(f.db, contexto, 1);
  assert.equal(state.revisao, 1); assert.deepEqual(state.itens, []);
  assert.equal(state.cards.find(c => c.id === 'LIMPEZA')?.itens[0].prefixo, '5001');
});
test('mudanca na CI apos consulta bloqueia a gravacao com base diaria ainda valida', async () => {
  const f = fixture(); await readEscalaDiaria(f.db, contexto, 1);
  f.db.__blocks = ['5001'];
  await assert.rejects(saveEscalaDiaria(f.db, 1, command()), (e: any) => /bloqueado/.test(e.message));
  assert.equal(f.records.size, 0);
});
test('frota indisponivel, mock ou CI ausente nao autoriza alocacao', async () => {
  const f = fixture(); f.db.__fleet = { source: 'mock', data: fleetRows };
  await assert.rejects(readEscalaDiaria(f.db, contexto, 1), (e: any) => e.status === 503);
  await assert.rejects(saveEscalaDiaria(f.db, 1, command()), (e: any) => e.status === 503);
  f.db.__fleet = { source: 'real', data: fleetRows }; f.db.folhaCI.findUnique = async () => null;
  await assert.rejects(saveEscalaDiaria(f.db, 1, command()), (e: any) => e.status === 503);
});
test('frota filtra garagem oficial e nao infere pela consorciada ou prefixo', () => {
  const source = { source: 'real', data: [
    { idCarro: 1322, prefixo: '1322', garagem: 1, garagemNome: 'VCM' },
    { idCarro: 2300, prefixo: '2300', garagem: 2, garagemNome: 'VCG' },
    { idCarro: 3200, prefixo: '3200', garagem: 'VCG', garagemNome: 'VCG' },
  ] };
  assert.deepEqual(officialGarageFleet(source, 'VCG'), ['2300', '3200']);
  assert.deepEqual(officialGarageFleet(source, 'VCM'), ['1322']);
});
test('prefixo fora da frota ou de outra garagem nao pode ser alocado', async () => {
  const f = fixture(); f.db.__fleet.data = [...fleetRows, { idCarro: 1322, prefixo: '1322', garagem: 1, garagemNome: 'VCM' }];
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(0, '1322')), (e: any) => /frota/.test(e.message));
  await assert.rejects(saveEscalaDiaria(f.db, 1, cardCommand(0, '5999')), (e: any) => /frota/.test(e.message));
});
test('formato anterior de substituicoes continua legivel; primeiro save preserva e adiciona cards', async () => {
  const f = fixture();
  f.records.set(JSON.stringify(contexto), { id: 1, revisao: 1, conteudo: JSON.stringify([{ id: original.id, carroSubstituido: '5001' }]) });
  const read = await readEscalaDiaria(f.db, contexto, 1);
  assert.equal(read.itens[0].carroSubstituido, '5001'); assert.equal(read.cardsOrigem, 'padrao');
  await saveEscalaDiaria(f.db, 1, cardCommand(1, '5002'));
  const payload = JSON.parse([...f.records.values()][0].conteudo);
  assert.equal(payload.version, 2); assert.equal(payload.itens[0].carroSubstituido, '5001');
});
test('defaults conflitantes nao sao aplicados e geram diagnostico; nenhuma escrita no GET', async () => {
  const f = fixture();
  const read = await readEscalaDiaria(f.db, contexto, 1);
  const used = occupations([], [], read.cards).map(o => o.prefixo);
  assert.equal(new Set(used).size, used.length);
  assert.ok(read.omitidosPadrao > 0); assert.equal(f.records.size, 0);
  const defaults = defaultAllocations('VCG', [], [], [], []);
  assert.ok(defaults.cards.every(c => c.itens.every(i => !i.prefixo)));
});
test('revogacao de permissao entre consulta da frota e transacao impede escrita', async () => {
  const f = fixture(); let reads = 0;
  f.db.user.findUnique = async () => (++reads === 1 ? { role: 'soltura', garagem: 'VCG' } : { role: 'COLABORADOR', garagem: 'VCG' });
  await assert.rejects(saveEscalaDiaria(f.db, 1, command()), (e: any) => e.status === 403);
  assert.equal(f.records.size, 0);
});
test('confirmacao da linha persiste por data e e recuperada apos recarga', async () => {
  const f = fixture(); const saved = await saveEscalaDiaria(f.db, 1, command());
  assert.deepEqual(saved.confirmadas, [original.id]);
  const loaded = await readEscalaDiaria(f.db, contexto, 1);
  assert.deepEqual(loaded.confirmadas, [original.id]);
  assert.equal(applyDailySchedule(fixedScheduleRows(baseContext), loaded)[0].confirmada, true);
  const tomorrow = await readEscalaDiaria(f.db, { ...contexto, dataOperacao: '2026-10-15' }, 1);
  assert.deepEqual(tomorrow.confirmadas, []);
});
test('carro fixo livre pode ser confirmado sem substituicao e nao se torna LIBERADO', async () => {
  const saved = await saveEscalaDiaria(fixture().db, 1, command(0, ''));
  assert.deepEqual(saved.itens, []); assert.deepEqual(saved.confirmadas, [original.id]);
  assert.equal(applyDailySchedule(fixedScheduleRows(baseContext), saved)[0].status, 'PENDENTE');
});
test('confirmacoes nao sao inferidas de registros antigos e novos bloqueios invalidam indicador', async () => {
  const f = fixture();
  f.records.set(JSON.stringify(contexto), { id: 1, revisao: 1, conteudo: JSON.stringify([{ id: original.id, carroSubstituido: '5001' }]) });
  assert.deepEqual((await readEscalaDiaria(f.db, contexto, 1)).confirmadas, []);
  await saveEscalaDiaria(f.db, 1, command(1));
  f.db.__blocks = ['5001'];
  assert.deepEqual((await readEscalaDiaria(f.db, contexto, 1)).confirmadas, []);
  assert.equal(JSON.parse([...f.records.values()][0].conteudo).confirmacoes[0].prefixo, '5001');
  f.db.__blocks = [];
  const record = [...f.records.values()][0], changed = JSON.parse(record.conteudo);
  changed.itens[0].carroSubstituido = '5002'; record.conteudo = JSON.stringify(changed);
  assert.deepEqual((await readEscalaDiaria(f.db, contexto, 1)).confirmadas, []);
});
test('falha de gravacao nao registra confirmacao de outro carro nem altera confirmacao oficial', async () => {
  const f = fixture(); await saveEscalaDiaria(f.db, 1, command()); f.fail();
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(1, '5002')));
  const payload = JSON.parse([...f.records.values()][0].conteudo);
  assert.deepEqual(payload.confirmacoes, [{ id: original.id, prefixo: '5001' }]);
});

test('Rabicho permite definir carro em posicao existente mas nao criar linha ou tabela', async () => {
  const f = fixture();
  const state = await readEscalaDiaria(f.db, contexto, 1);
  const card = state.cards.find(c => c.id === 'RABICHO')!;
  await assert.rejects(saveEscalaDiaria(f.db, 1, { ...cardCommand(0, '5001', 'RABICHO'), linha: '999', tabela: '99' }), (e: any) => e.status === 400 && /fixas/.test(e.message));
  assert.equal(f.records.size, 0);
  const saved = await saveEscalaDiaria(f.db, 1, { ...cardCommand(0, '5001', 'RABICHO'), operacao: 'definir', itemId: card.itens[0].id });
  const updated = saved.cards.find(c => c.id === 'RABICHO')!;
  assert.equal(updated.itens.length, card.itens.length);
  assert.equal(updated.itens[0].linha, card.itens[0].linha);
  assert.equal(updated.itens[0].tabela, card.itens[0].tabela);
  assert.equal(updated.itens[0].prefixo, '5001');
});
