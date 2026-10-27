import test from 'node:test';
import assert from 'node:assert/strict';
import { readEscalaDiaria as readReal, saveEscalaDiaria as saveReal, parseDailyContext, fixedSchedule } from '../src/services/escalaDiaria';
import { subscribeC4Updates } from '../src/services/c4Events';
import { applyDailySchedule, fixedScheduleRows, fixedScheduleToken } from '../../web/src/lib/dailySchedule';
import { validateDailyEscala } from '../../web/src/lib/sharedEscala';
import { currentScaleTemplate } from '../../web/src/data/scheduleTemplates';
import { officialGarageFleet, occupations, defaultAllocations } from '../src/services/escalaAllocation';

const baseContext = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO' } as const;
const contexto = { ...baseContext, dataOperacao: '2026-10-14' };
const original = fixedSchedule(contexto).find(row => /^\d+$/.test(row.carroProgramado) && fixedSchedule(contexto).filter(other => other.carroProgramado === row.carroProgramado).length === 1)!;
const fleetRows = [...new Set([...fixedSchedule(contexto).map(i => i.carroProgramado).filter(p => /^\d{1,10}$/.test(p)), '5001', '5002', '5001', '5002', '5003'])].map(prefixo => ({ idCarro: Number(prefixo), prefixo, garagem: 2, garagemNome: 'VCG' }));
const readEscalaDiaria = (db: any, value: unknown, userId: number | undefined) => readReal(db, value, userId, async () => db.__fleet, async () => db.__colors ?? null);
const now = () => new Date('2026-10-13T16:00:00Z');
const lifecycle = (db: any, operacao: 'iniciar' | 'finalizar' | 'reabrir', revisao = operacao === 'iniciar' ? 0 : 1, context = contexto, clock = now, userId: number | undefined = 1) =>
  saveReal(db, userId, { contexto: context, revisao, operacao }, async () => db.__fleet, async () => db.__colors ?? null, clock);
// Setup explicito de preparacao para os cenarios de alocacao; nao altera o fluxo da aplicacao.
const saveEscalaDiaria = async (db: any, userId: number | undefined, value: any) => db.$transaction(async () => {
  if (!await db.escalaDiaria.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: value.contexto } })) await lifecycle(db, 'iniciar', 0, value.contexto, now, userId);
  return saveReal(db, userId, value, async () => db.__fleet, async () => db.__colors ?? null, now);
}, { isolationLevel: 'Serializable' });
function fixture() {
  const records = new Map<string, any>();
  let role = 'ADMIN', garagem = 'VCG', fail = false;
  const locks: string[] = [];
  const key = (where: any) => JSON.stringify(where.garagem_escalaTipo_turno_dataOperacao);
  const db: any = {
    __fleet: { source: 'real', data: fleetRows }, __blocks: [] as string[],
    folhaCI: {
      findFirst: async ({ where, orderBy, include }: any) => {
        assert.deepEqual(orderBy, { dataFolha: 'desc' }); assert.deepEqual(include, { itens: true });
        return [...(db.__prior ?? [])].filter(row => row.garagem === where.garagem && row.status === where.status && row.dataFolha < where.dataFolha.lt)
          .sort((a, b) => b.dataFolha.getTime() - a.dataFolha.getTime())[0] ?? null;
      },
      findUnique: async ({ where }: any) => { db.__ciDate = where.garagem_dataFolha.dataFolha.toISOString().slice(0,10); return { status: db.__ciStatus ?? 'FINALIZADA', itens: db.__blocks.map((prefixo: string) => ({ prefixo, categoria: 'BLOQUEADO', statusItem: 'BLOQUEADO' })) }; },
    },
    user: { findUnique: async () => ({ role, garagem }) },
    get escalaCarros() { throw Error('Programacao permanente nao pode ser consultada'); },
    get soltura() { throw Error('Substituicao nao pode registrar liberacao'); },
    escalaDiaria: {
      findFirst: async ({ where }: any) => [...records.values()].find(row => row.garagem === where.garagem && row.dataOperacao === where.dataOperacao) ?? null,
      findUnique: async ({ where }: any) => records.get(key(where)) ?? null,
      create: async ({ data }: any) => {
        if (fail) throw new Error('Falha simulada');
        assert.ok(Number.isInteger(data.revisao) && data.revisao >= 1, 'CK_escala_diaria_revisao: revisao >= 1');
        const { garagem, escalaTipo, turno, dataOperacao } = data;
        records.set(JSON.stringify({ garagem, escalaTipo, turno, dataOperacao }), { id: records.size + 1, ...data });
      },
      update: async ({ where, data }: any) => {
        if (fail) throw new Error('Falha simulada');
        assert.ok(Number.isInteger(data.revisao) && data.revisao >= 1, 'CK_escala_diaria_revisao: revisao >= 1');
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
const command = (revisao = 1, carroSubstituido = '5001') => ({ contexto, revisao, id: original.id, carroSubstituido, base: JSON.stringify(original),
  retirada: { prefixo: revisao === 1 ? original.carroProgramado : '5001', destino: 'RESERVA' as const, motivo: 'Troca operacional' } });

test('hoje e anteriores rejeitam linhas e cards antes das integracoes, inclusive ADMIN', async () => {
  for (const day of ['2026-10-13', '2026-10-14']) {
    for (const mutation of [command(), { contexto, revisao: 0, card: 'PORTARIA', operacao: 'adicionar', prefixo: '5001' }]) {
      const f = fixture();
      const noFleet = async (): Promise<never> => { throw Error('Nao deveria carregar frota'); };
      await assert.rejects(saveReal(f.db, 1, { ...mutation, contexto: { ...contexto, dataOperacao: day } }, noFleet,
        async () => null, () => new Date('2026-10-14T16:00:00Z')), (e: any) => e.status === 409 && /hoje/.test(e.message));
      assert.equal(f.records.size, 0); assert.equal(f.locks.length, 0);
    }
  }
});

test('data usa Campo Grande: aceita antes da meia-noite local e rejeita depois', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar');
  await saveReal(f.db, 1, command(), async () => f.db.__fleet, async () => null,
    () => new Date('2026-10-14T03:59:59Z'));
  await assert.rejects(saveReal(f.db, 1, command(2, '5002'), async () => f.db.__fleet, async () => null,
    () => new Date('2026-10-14T04:00:00Z')), (e: any) => e.status === 409);
  assert.equal([...f.records.values()][0].revisao, 2);
});

test('virada do dia durante a transacao cancela gravacao', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar'); const before = structuredClone([...f.records]); let calls = 0;
  await assert.rejects(saveReal(f.db, 1, command(), async () => f.db.__fleet, async () => null,
    () => new Date(++calls < 3 ? '2026-10-14T03:59:59Z' : '2026-10-14T04:00:00Z')),
    (e: any) => e.status === 409);
  assert.deepEqual([...f.records], before);
});

test('escala usa JSON fixo e banco armazena somente a substituicao', async () => {
  const f = fixture();
  const before = JSON.stringify(fixedSchedule(contexto));
  const daily = await saveEscalaDiaria(f.db, 1, command());
  const rows = applyDailySchedule(fixedScheduleRows(baseContext), daily);
  assert.equal(JSON.stringify(fixedSchedule(contexto)), before);
  assert.equal(rows.find(i => i.id === original.id)!.carroProgramado, original.carroProgramado);
  assert.equal(rows.find(i => i.id === original.id)!.carroSubstituido, '5001');
  assert.equal(rows.find(i => i.id === original.id)!.status, 'PENDENTE');
  assert.equal(rows.find(i => i.id === original.id)!.carroRealizado, undefined);
  assert.deepEqual(JSON.parse([...f.records.values()][0].conteudo).itens, [{ id: original.id, carroSubstituido: '5001' }]);
  assert.ok(f.locks.some(lock => /escala_diaria WITH \(UPDLOCK,HOLDLOCK\)/.test(lock)));
});
test('todos os campos fixos permanecem iguais apos substituir', async () => {
  const daily = await saveEscalaDiaria(fixture().db, 1, command());
  const base = fixedScheduleRows(baseContext), row = applyDailySchedule(base, daily).find(i => i.id === original.id)!;
  for (const key of ['linha', 'tabela', 'saidaGaragem', 'chegadaGaragem', 'carroProgramado'] as const)
    assert.equal(row[key], base.find(i => i.id === original.id)![key]);
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
  const daily = await saveEscalaDiaria(f.db, 1, command(2, '5002'));
  assert.equal(daily.revisao, 3); assert.deepEqual(daily.itens, [{ id: original.id, carroSubstituido: '5002' }]);
});
test('limpar substituicao ou informar carro original restaura valores fixos', async () => {
  for (const value of ['', original.carroProgramado]) {
    const f = fixture(); await saveEscalaDiaria(f.db, 1, command());
    const daily = await saveEscalaDiaria(f.db, 1, command(2, value));
    assert.deepEqual(daily.itens, []);
    assert.equal(applyDailySchedule(fixedScheduleRows(baseContext), daily).find(i => i.id === original.id)!.carroProgramado, original.carroProgramado);
  }
});
test('revisao diaria obsoleta retorna 409 e preserva vencedor', async () => {
  const f = fixture(); await saveEscalaDiaria(f.db, 1, command());
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(1, '5002')), (e: any) => e.status === 409);
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
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(2, '5002')));
  const daily = await readEscalaDiaria(f.db, contexto, 1);
  assert.equal(daily.revisao, 2); assert.equal(daily.itens[0].carroSubstituido, '5001');
});
test('ADMIN e Soltura da propria garagem podem alterar; outra garagem e COLABORADOR nao', async () => {
  const f = fixture(); f.role('COLABORADOR');
  await assert.rejects(saveEscalaDiaria(f.db, 1, command()), (e: any) => e.status === 403);
  f.role('soltura');
  assert.equal((await saveEscalaDiaria(f.db, 1, command())).revisao, 2);
  f.garage('VCM');
  await assert.rejects(readEscalaDiaria(f.db, contexto, 1), (e: any) => e.status === 403);
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(2)), (e: any) => e.status === 403);
});
test('datas invalidas, prefixos invalidos e tentativa de editar campos fixos sao recusados', async () => {
  assert.throws(() => parseDailyContext({ ...contexto, dataOperacao: '2026-02-30' }));
  await assert.rejects(saveEscalaDiaria(fixture().db, 1, command(1, 'abc')));
  for (const extra of [{ linha: '02' }, { chegadaGaragem: '08:20' }, { carroProgramado: '4200' }, { status: 'LIBERADO' }])
    await assert.rejects(saveEscalaDiaria(fixture().db, 1, { ...command(), ...extra }));
});
test('falha real de consulta preserva JSON visivel; recuperacao carrega substituicoes', async () => {
  const f = fixture(); await saveEscalaDiaria(f.db, 1, command());
  const load = f.db.escalaDiaria.findUnique;
  f.db.escalaDiaria.findUnique = async () => { throw new Error('Consulta indisponivel'); };
  await assert.rejects(readEscalaDiaria(f.db, contexto, 1));
  assert.equal(applyDailySchedule(fixedScheduleRows(baseContext), null).find(i => i.id === original.id)!.carroProgramado, original.carroProgramado);
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
  for (const garagem of ['VCG', 'VCM'] as const) for (const [escalaTipo, turno] of [['SEG_SEX','MATUTINO'],['SEG_SEX','VESPERTINO'],['SABADO','PADRAO'],['DOM_FER','PADRAO']] as const) {
    const context = { garagem, escalaTipo, turno };
    assert.deepEqual(fixedSchedule({ ...context, dataOperacao: contexto.dataOperacao }), currentScaleTemplate(context));
    const rows = currentScaleTemplate(context); assert.equal(new Set(rows.map(r => r.id)).size, rows.length);
  }
  assert.equal(fixedScheduleToken(baseContext, original.id), JSON.stringify(original));
});

test('frontend recusa resposta malformada, duplicada ou de outra data', async () => {
  const response = await saveEscalaDiaria(fixture().db, 1, command());
  assert.deepEqual(validateDailyEscala(response, contexto), response);
  assert.throws(() => validateDailyEscala({}, contexto));
  assert.throws(() => validateDailyEscala(response, { ...contexto, dataOperacao: '2026-10-15' }));
  assert.throws(() => validateDailyEscala({ ...response, itens: [response.itens[0], response.itens[0]] }, contexto));
});

const cardCommand = (revisao = 1, prefixo = '5001', card = 'LIMPEZA') => ({ contexto, revisao, card, operacao: 'adicionar', prefixo });
test('bloqueados vem exclusivamente da CI da mesma data e da frota selecionada', async () => {
  const f = fixture();
  f.db.folhaCI.findUnique = async ({ where }: any) => {
    assert.equal(where.garagem_dataFolha.garagem, 'VCG');
    assert.equal(where.garagem_dataFolha.dataFolha.toISOString().slice(0, 10), '2026-10-14');
    return { status: 'FINALIZADA', itens: [
      { prefixo: '5001', categoria: 'BLOQUEADO', statusItem: 'BLOQUEADO' },
      { prefixo: '5002', categoria: 'OFICINA' },
      { prefixo: '5003', categoria: 'BLOQUEADO', statusItem: 'LIBERADO' },
      { prefixo: '1333', categoria: 'BLOQUEADO' },
    ] };
  };
  const read = await readEscalaDiaria(f.db, contexto, 1);
  assert.equal(read.ciData, '2026-10-14'); assert.deepEqual(read.bloqueados, ['5001']);
});
test('carro fixo bloqueado exige substituto livre, sem alterar o JSON', async () => {
  const f = fixture(); f.db.__blocks = [original.carroProgramado];
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(1, '')), (e: any) => e.status === 409 && /bloqueado/.test(e.message));
  assert.equal(f.records.size, 0);
  const saved = await saveEscalaDiaria(f.db, 1, { ...command(), retirada: { ...command().retirada, destino: 'BLOQUEAR' } });
  assert.equal(saved.itens[0].carroSubstituido, '5001');
  assert.equal(fixedSchedule(contexto).find(i => i.id === original.id)!.carroProgramado, original.carroProgramado);
  assert.ok(!saved.reserva.includes(original.carroProgramado));
});
test('bloqueado nao entra em linha nem em qualquer card de veiculos', async () => {
  const f = fixture(); f.db.__blocks = ['5001'];
  await assert.rejects(saveEscalaDiaria(f.db, 1, command()), (e: any) => /bloqueado/.test(e.message));
  for (const card of ['PORTARIA', 'LIMPEZA', 'BORRACHARIA', 'PEDIDOS_GARAGEM'])
    await assert.rejects(saveEscalaDiaria(f.db, 1, cardCommand(1, '5001', card)), (e: any) => /bloqueado/.test(e.message));
  const state = await readEscalaDiaria(f.db, contexto, 1);
  const terminal = state.cards.find(c => c.modo === 'unico')!;
  await assert.rejects(saveEscalaDiaria(f.db, 1, { ...cardCommand(1, '5001', terminal.id), operacao: 'definir', itemId: terminal.itens[0].id }), (e: any) => /bloqueado/.test(e.message));
  await assert.rejects(saveEscalaDiaria(f.db, 1, { ...cardCommand(1, '5001', 'RABICHO'), operacao: 'definir', itemId: state.cards.find(c => c.id === 'RABICHO')!.itens[0].id }), (e: any) => /bloqueado/.test(e.message));
  assert.equal(f.records.size, 0);
});
test('duplicidade entre linha e cards ou entre cards e recusada no backend', async () => {
  const f = fixture();
  await assert.rejects(saveEscalaDiaria(f.db, 1, cardCommand(1, original.carroProgramado)), (e: any) => /ja utilizado/.test(e.message));
  await saveEscalaDiaria(f.db, 1, cardCommand());
  await assert.rejects(saveEscalaDiaria(f.db, 1, cardCommand(2, '5001', 'BORRACHARIA')), (e: any) => /ja utilizado/.test(e.message));
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(2)), (e: any) => /ja utilizado/.test(e.message));
});
test('fixo so pode entrar em card apos ser substituido; restauracao nao pode duplicar', async () => {
  const f = fixture();
  await saveEscalaDiaria(f.db, 1, command());
  const card = await saveEscalaDiaria(f.db, 1, cardCommand(2, original.carroProgramado));
  assert.ok(card.cards.find(c => c.id === 'LIMPEZA')?.itens.some(i => i.prefixo === original.carroProgramado));
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(3, '')), (e: any) => /ja utilizado/.test(e.message));
  assert.equal((await readEscalaDiaria(f.db, contexto, 1)).itens[0].carroSubstituido, '5001');
});
test('reserva e derivada da frota menos linhas, cards e bloqueados', async () => {
  const f = fixture(); f.db.__blocks = ['5003'];
  const before = await readEscalaDiaria(f.db, contexto, 1);
  assert.ok(before.reserva.includes('5001')); assert.ok(!before.reserva.includes(original.carroProgramado));
  const saved = await saveEscalaDiaria(f.db, 1, command());
  assert.ok(!saved.reserva.includes('5001')); assert.ok(!saved.reserva.includes('5003'));
  assert.ok(saved.reserva.includes(original.carroProgramado));
  const withCard = await saveEscalaDiaria(f.db, 1, cardCommand(2, '5002'));
  assert.ok(!withCard.reserva.includes('5002'));
});
test('cards compartilhados por data nao migram para o dia seguinte e podem ser retirados', async () => {
  const f = fixture(); const saved = await saveEscalaDiaria(f.db, 1, cardCommand());
  const item = saved.cards.find(c => c.id === 'LIMPEZA')!.itens[0];
  assert.equal((await readEscalaDiaria(f.db, contexto, 1)).cards.find(c => c.id === 'LIMPEZA')?.itens[0].prefixo, '5001');
  const tomorrow = await readEscalaDiaria(f.db, { ...contexto, dataOperacao: '2026-10-15' }, 1);
  assert.deepEqual(tomorrow.cards.find(c => c.id === 'LIMPEZA')?.itens, []);
  await saveEscalaDiaria(f.db, 1, { contexto, revisao: 2, card: 'LIMPEZA', operacao: 'remover', prefixo: '', itemId: item.id });
  assert.deepEqual((await readEscalaDiaria(f.db, contexto, 1)).cards.find(c => c.id === 'LIMPEZA')?.itens, []);
});
test('conflito entre gravacao de card e linha preserva vencedor sem repetir POST', async () => {
  const f = fixture(); await saveEscalaDiaria(f.db, 1, cardCommand());
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(1, '5002')), (e: any) => e.status === 409);
  const state = await readEscalaDiaria(f.db, contexto, 1);
  assert.equal(state.revisao, 2); assert.deepEqual(state.itens, []);
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
  await assert.rejects(saveEscalaDiaria(f.db, 1, command()), (e: any) => e.status === 409 && /CI/.test(e.message));
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
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(1, '1322')), (e: any) => /frota/.test(e.message));
  await assert.rejects(saveEscalaDiaria(f.db, 1, cardCommand(1, '5999')), (e: any) => /frota/.test(e.message));
});
test('formato anterior continua legivel e nao e convertido ou sobrescrito ao salvar', async () => {
  const f = fixture();
  f.records.set(JSON.stringify(contexto), { id: 1, revisao: 1, conteudo: JSON.stringify([{ id: original.id, carroSubstituido: '5001' }]) });
  const read = await readEscalaDiaria(f.db, contexto, 1);
  assert.equal(read.itens[0].carroSubstituido, '5001'); assert.equal(read.cardsOrigem, 'padrao');
  const before = structuredClone([...f.records]);
  await assert.rejects(saveEscalaDiaria(f.db, 1, cardCommand(1, '5002')), /somente para consulta/);
  assert.equal(read.fluxo.status, 'LEGADO'); assert.deepEqual([...f.records], before);
});
test('nova escala tem cards vazios antes de iniciar, sem escrita em GET', async () => {
  const f = fixture();
  const read = await readEscalaDiaria(f.db, contexto, 1);
  const used = occupations([], [], read.cards).map(o => o.prefixo);
  assert.equal(new Set(used).size, used.length);
  assert.equal(read.omitidosPadrao, 0); assert.ok(read.cards.every(c => c.itens.every(i => !i.prefixo))); assert.equal(f.records.size, 0);
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
  assert.equal(applyDailySchedule(fixedScheduleRows(baseContext), loaded).find(i => i.id === original.id)!.confirmada, true);
  const tomorrow = await readEscalaDiaria(f.db, { ...contexto, dataOperacao: '2026-10-15' }, 1);
  assert.deepEqual(tomorrow.confirmadas, []);
});
test('carro fixo livre pode ser confirmado sem substituicao e nao se torna LIBERADO', async () => {
  const saved = await saveEscalaDiaria(fixture().db, 1, command(1, ''));
  assert.deepEqual(saved.itens, []); assert.deepEqual(saved.confirmadas, [original.id]);
  assert.equal(applyDailySchedule(fixedScheduleRows(baseContext), saved).find(i => i.id === original.id)!.status, 'PENDENTE');
});
test('confirmacoes nao sao inferidas de registros antigos e novos bloqueios invalidam indicador', async () => {
  const f = fixture();
  f.records.set(JSON.stringify(contexto), { id: 1, revisao: 1, conteudo: JSON.stringify([{ id: original.id, carroSubstituido: '5001' }]) });
  assert.deepEqual((await readEscalaDiaria(f.db, contexto, 1)).confirmadas, []);
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(1)), /somente para consulta/);
  f.records.clear(); await saveEscalaDiaria(f.db, 1, command());
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
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(2, '5002')));
  const payload = JSON.parse([...f.records.values()][0].conteudo);
  assert.deepEqual(payload.confirmacoes, [{ id: original.id, prefixo: '5001' }]);
});

test('Rabicho permite definir carro em posicao existente mas nao criar linha ou tabela', async () => {
  const f = fixture();
  const state = await readEscalaDiaria(f.db, contexto, 1);
  const card = state.cards.find(c => c.id === 'RABICHO')!;
  await assert.rejects(saveEscalaDiaria(f.db, 1, { ...cardCommand(1, '5001', 'RABICHO'), linha: '999', tabela: '99' }), (e: any) => e.status === 400 && /fixas/.test(e.message));
  assert.equal(f.records.size, 0);
  const saved = await saveEscalaDiaria(f.db, 1, { ...cardCommand(1, '5001', 'RABICHO'), operacao: 'definir', itemId: card.itens[0].id });
  const updated = saved.cards.find(c => c.id === 'RABICHO')!;
  assert.equal(updated.itens.length, card.itens.length);
  assert.equal(updated.itens[0].linha, card.itens[0].linha);
  assert.equal(updated.itens[0].tabela, card.itens[0].tabela);
  assert.equal(updated.itens[0].prefixo, '5001');
});

test('API retorna reserva automatica sem gravacao e recusa mutacoes nos grupos antigos de cor', async () => {
  const f = fixture();
  f.db.__colors = { version: 1, updatedAt: '2026-10-16T15:00:00Z', vehicles: [{ idCarro: '5001', cor: 'AZUL' }] };
  const state = await readEscalaDiaria(f.db, contexto, 1);
  assert.ok(state.reservaPorCor.grupos[0].prefixos.includes('5001'));
  assert.equal(f.records.size, 0);
  await assert.rejects(saveEscalaDiaria(f.db, 1, cardCommand(1, '5001', 'AZUL')), (e: any) => e.status === 400 && /automatica/.test(e.message));
  assert.equal(f.records.size, 0);
  const saved = await saveEscalaDiaria(f.db, 1, command());
  assert.ok(!saved.reservaPorCor.grupos.flatMap(g => g.prefixos).includes('5001'));
  assert.deepEqual(validateDailyEscala(saved, contexto), saved);
});

test('cards manuais antigos de cor sao preservados para consulta sem ocupar a reserva', async () => {
  const f = fixture();
  const oldCard = { id: 'AZUL', titulo: 'AZUL', modo: 'lista', itens: [{ id: 'legacy', prefixo: '5002' }] };
  const conteudo = JSON.stringify({ version: 2, itens: [], cards: [oldCard], confirmacoes: [] });
  f.records.set(JSON.stringify(contexto), { id: 1, revisao: 1, conteudo });
  const read = await readEscalaDiaria(f.db, contexto, 1);
  assert.ok(read.reserva.includes('5002'));
  assert.equal([...f.records.values()][0].conteudo, conteudo);
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(1)), /somente para consulta/);
  assert.deepEqual(JSON.parse([...f.records.values()][0].conteudo).cards, [oldCard]);
});

test('contrato de reserva por cor recusa grupos duplicados, carros ocupados e cache ausente com cores', async () => {
  const f = fixture();
  f.db.__colors = { version: 1, updatedAt: '2026-10-16T15:00:00Z', vehicles: [{ idCarro: '5001', cor: 'AZUL' }] };
  const response = await readEscalaDiaria(f.db, contexto, 1);
  const grouped = response.reservaPorCor;
  assert.throws(() => validateDailyEscala({ ...response, reservaPorCor: { ...grouped, grupos: grouped.grupos.map(() => grouped.grupos[0]) } }, contexto));
  assert.throws(() => validateDailyEscala({ ...response, reservaPorCor: { ...grouped, updatedAt: null } }, contexto));
  assert.throws(() => validateDailyEscala({ ...response, reservaPorCor: { ...grouped, grupos: grouped.grupos.map((g,i) => i ? g : { ...g, prefixos: [...g.prefixos, original.carroProgramado] }) } }, contexto));
});

test('cores incluem fixos ocupados, independem da reserva e permanecem no contrato', async () => {
  const f = fixture();
  f.db.__colors = { version: 1, updatedAt: '2026-10-16T15:00:00Z', vehicles: [
    { idCarro: original.carroProgramado, cor: 'VERMELHO/AZUL' }, { idCarro: '5001', cor: 'AZUL' },
  ] };
  const response = await readEscalaDiaria(f.db, contexto, 1);
  assert.equal(response.coresFrota[original.carroProgramado], 'VERMELHO/AZUL');
  assert.equal(response.coresFrota['5001'], 'AZUL');
  assert.ok(!response.reserva.includes(original.carroProgramado));
  assert.deepEqual(validateDailyEscala(response, contexto).coresFrota, response.coresFrota);
});

test('avisos informativos vem da CI da mesma data e nao bloqueiam confirmacao nem reserva', async () => {
  const f = fixture();
  f.db.folhaCI.findUnique = async ({ where }: any) => {
    assert.equal(where.garagem_dataFolha.dataFolha.toISOString().slice(0,10), '2026-10-14');
    return { status: 'FINALIZADA', itens: [
      { prefixo: '5001', categoria: 'OFICINA', subTipo: 'ELEVADOR' },
      { prefixo: '5001', categoria: 'PREVENTIVA', subTipo: 'LUBRIFICACAO' },
      { prefixo: '5002', categoria: 'REFORCO', horarioReforco: '07:15 - A', tipoPosicao: 'FIXO', ordemPosicao: 1 },
      { prefixo: '1333', categoria: 'OFICINA', subTipo: 'MECANICA' },
    ] };
  };
  const read = await readEscalaDiaria(f.db, contexto, 1);
  assert.equal(read.ciAvisos.length, 3);
  assert.equal(read.ciAvisos[0].subTipo, 'ELEVADOR');
  assert.ok(read.reserva.includes('5001'));
  assert.ok(!read.bloqueados.includes('5001'));
  assert.equal(f.records.size, 0);
  const saved = await saveEscalaDiaria(f.db, 1, command());
  assert.ok(saved.confirmadas.includes(original.id));
  assert.equal(saved.ciAvisos.length, 3);
  assert.deepEqual(validateDailyEscala(saved, contexto), saved);
  assert.throws(() => validateDailyEscala({ ...saved, ciAvisos: [{ ...saved.ciAvisos[0], prefixo: '1333' }] }, contexto));
});

test('troca do molde preserva substituicoes antigas sem aplicar em outra viagem', async () => {
 const f = fixture();
 const old = { id: 'vcg-mat-008', carroSubstituido: '5001' };
 f.records.set(JSON.stringify(contexto), { id: 1, revisao: 1, conteudo: JSON.stringify([old]) });
 const read = await readEscalaDiaria(f.db, contexto, 1);
 assert.deepEqual(read.itens, [old]); assert.equal(read.foraMolde.length, 1);
 assert.equal(read.foraMolde[0].linha, '323');
 assert.ok(!applyDailySchedule(fixedScheduleRows(baseContext), read).some(i => i.carroSubstituido === '5001'));
 assert.deepEqual(validateDailyEscala(read, contexto).itens, [old]);
 await assert.rejects(saveEscalaDiaria(f.db, 1, command(1, '5002')), /somente para consulta/);
 assert.deepEqual(JSON.parse([...f.records.values()][0].conteudo), [old]);
});

test('manual: gravacao direta nao inicia a escala implicitamente', async () => {
  const f = fixture();
  await assert.rejects(saveReal(f.db, 1, command(0), async () => f.db.__fleet, async () => null, now), /Inicie a escala/);
  assert.equal(f.records.size, 0);
});

test('manual: CI ausente ou em preparacao impede inicio, sem gravar durante consulta', async () => {
  for (const status of ['EM_PREPARACAO', null]) {
    const f = fixture(); f.db.__ciStatus = status;
    if (status === null) f.db.folhaCI.findUnique = async () => null;
    if (status === null) await assert.rejects(readEscalaDiaria(f.db, contexto, 1), (e: any) => e.status === 503 && /nenhuma CI anterior/.test(e.message));
    else {
      const read = await readEscalaDiaria(f.db, contexto, 1);
      assert.equal(read.fluxo.status, 'NAO_INICIADA'); assert.equal(read.fluxo.ciFinalizada, false);
      assert.equal(read.ciData, contexto.dataOperacao);
      assert.deepEqual(validateDailyEscala(read, contexto), read);
    }
    await assert.rejects(lifecycle(f.db, 'iniciar'), /Finalize a CI da mesma data/);
    assert.equal(f.records.size, 0);
  }
});

test('manual: primeira escala persiste revisao 1 e rejeita inicio repetido com revisao zero', async () => {
  const f = fixture();
  const absent = await readEscalaDiaria(f.db, contexto, 1);
  assert.equal(absent.revisao, 0);
  assert.equal(f.records.size, 0);
  const started = await lifecycle(f.db, 'iniciar', absent.revisao);
  assert.equal(started.revisao, 1);
  assert.equal([...f.records.values()][0].revisao, 1);
  assert.equal(started.fluxo.status, 'EM_PREPARACAO');
  const before = structuredClone([...f.records]);
  await assert.rejects(lifecycle(f.db, 'iniciar', 0), (e: any) => e.status === 409);
  assert.deepEqual([...f.records], before);
  const saved = await saveReal(f.db, 1, command(started.revisao), async () => f.db.__fleet, async () => null, now);
  assert.equal(saved.revisao, 2);
  assert.equal((await readEscalaDiaria(f.db, contexto, 1)).revisao, 2);
});

test('troca: reserva salva motivo, autor e horario e preserva historico ao finalizar/reabrir', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar');
  const saved = await saveReal(f.db, 1, { ...command(), retirada: { ...command().retirada, motivo: '  Ajuste operacional  ' } }, async () => f.db.__fleet, async () => null, now);
  assert.ok(saved.reserva.includes(original.carroProgramado));
  assert.ok(!saved.reserva.includes('5001'));
  assert.ok(!saved.cards.find(c => c.id === 'PORTARIA')!.itens.length);
  assert.equal(saved.historicoTrocas.length, 1);
  assert.deepEqual({ ...saved.historicoTrocas[0], id: 'gerado' }, { id: 'gerado', linhaId: original.id,
    prefixo: original.carroProgramado, substituto: '5001', destino: 'RESERVA', motivo: 'Ajuste operacional', usuarioId: 1, registradoEm: now().toISOString() });
  const closed = await lifecycle(f.db, 'finalizar', saved.revisao);
  const reopened = await lifecycle(f.db, 'reabrir', closed.revisao);
  assert.deepEqual(reopened.historicoTrocas, saved.historicoTrocas);
  const loaded = await readEscalaDiaria(f.db, contexto, 1);
  assert.deepEqual(validateDailyEscala(loaded, contexto), loaded);
  assert.deepEqual(loaded.historicoTrocas, saved.historicoTrocas);
});

test('troca: bloquear e substituir sao atomicos e impedem reutilizacao do carro retirado', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar');
  const saved = await saveReal(f.db, 1, { ...command(), retirada: { ...command().retirada, destino: 'BLOQUEAR' } }, async () => f.db.__fleet, async () => null, now);
  assert.equal(saved.revisao, 2);
  assert.equal(saved.cards.find(c => c.id === 'PORTARIA')!.itens[0].prefixo, original.carroProgramado);
  assert.ok(!saved.reserva.includes(original.carroProgramado));
  assert.deepEqual(saved.bloqueados, []); // Nao escreve nem simula bloqueio na CI.
  assert.equal(saved.historicoTrocas[0].destino, 'BLOQUEAR');
  assert.deepEqual((await readEscalaDiaria(f.db, contexto, 1)).historicoTrocas, saved.historicoTrocas);
  await assert.rejects(saveReal(f.db, 1, command(2, ''), async () => f.db.__fleet, async () => null, now), /bloqueado/);
  await assert.rejects(saveReal(f.db, 1, cardCommand(2, original.carroProgramado), async () => f.db.__fleet, async () => null, now), /bloqueado/);
  assert.equal([...f.records.values()][0].revisao, 2);
});

test('troca: falha ao persistir nao move carro nem registra motivo ou confirmacao', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar');
  const before = structuredClone([...f.records]); f.fail();
  await assert.rejects(saveReal(f.db, 1, { ...command(), retirada: { ...command().retirada, destino: 'BLOQUEAR' } }, async () => f.db.__fleet, async () => null, now), /Falha simulada/);
  assert.deepEqual([...f.records], before);
});

test('troca: motivo e destino obrigatorios, carro retirado correto e autor nao fornecido pelo cliente', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar');
  const before = structuredClone([...f.records]);
  for (const retirada of [undefined, { ...command().retirada, motivo: '  ' }, { ...command().retirada, motivo: 'x'.repeat(1001) },
    { ...command().retirada, destino: 'OUTRO' }, { ...command().retirada, prefixo: '5002' }, { ...command().retirada, usuarioId: 99 }]) {
    await assert.rejects(saveReal(f.db, 1, { ...command(), retirada }, async () => f.db.__fleet, async () => null, now));
    assert.deepEqual([...f.records], before);
  }
});

test('troca: segunda substituicao destina o substituto anterior e mantem a primeira decisao', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar');
  const first = await saveReal(f.db, 1, { ...command(), retirada: { ...command().retirada, destino: 'BLOQUEAR' } }, async () => f.db.__fleet, async () => null, now);
  const second = await saveReal(f.db, 1, { ...command(first.revisao, '5002'), retirada: { prefixo: '5001', destino: 'RESERVA', motivo: 'Nova troca' } }, async () => f.db.__fleet, async () => null, now);
  assert.equal(second.historicoTrocas.length, 2);
  assert.equal(second.historicoTrocas[1].prefixo, '5001');
  assert.ok(second.reserva.includes('5001'));
  assert.ok(!second.reserva.includes(original.carroProgramado));
  assert.ok(!second.reserva.includes('5002'));
  const before = structuredClone([...f.records]);
  await assert.rejects(saveReal(f.db, 1, { ...command(second.revisao, '5003'), retirada: { prefixo: '5001', destino: 'RESERVA', motivo: 'Rascunho antigo' } }, async () => f.db.__fleet, async () => null, now), /carro da linha mudou/);
  assert.deepEqual([...f.records], before);
});

test('troca: bloqueio CI nao e removido pela opcao reserva, bloquear nao duplica na Portaria', async () => {
  const f = fixture(); f.db.__blocks = [original.carroProgramado]; await lifecycle(f.db, 'iniciar');
  const before = structuredClone([...f.records]);
  await assert.rejects(saveReal(f.db, 1, command(), async () => f.db.__fleet, async () => null, now), /bloqueado/);
  assert.deepEqual([...f.records], before);
  const saved = await saveReal(f.db, 1, { ...command(), retirada: { ...command().retirada, destino: 'BLOQUEAR' } }, async () => f.db.__fleet, async () => null, now);
  assert.deepEqual(saved.bloqueados, [original.carroProgramado]);
  assert.equal(saved.cards.find(c => c.id === 'PORTARIA')!.itens.length, 1);
  const confirmed = await saveReal(f.db, 1, { ...command(saved.revisao), retirada: undefined }, async () => f.db.__fleet, async () => null, now);
  assert.equal(confirmed.historicoTrocas.length, 1);
  assert.equal(confirmed.cards.find(c => c.id === 'PORTARIA')!.itens.length, 1);
});

test('troca: confirmar carro fixo sem trocar dispensa popup e nao cria historico', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar');
  const saved = await saveReal(f.db, 1, { ...command(1, ''), retirada: undefined }, async () => f.db.__fleet, async () => null, now);
  assert.deepEqual(saved.historicoTrocas, []);
  assert.deepEqual(saved.confirmadas, [original.id]);
});

test('troca: conflito de revisao nao registra destino ou motivo de outro posto', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar');
  await saveReal(f.db, 1, command(), async () => f.db.__fleet, async () => null, now);
  const before = structuredClone([...f.records]);
  await assert.rejects(saveReal(f.db, 1, { ...command(1, '5002'), retirada: { ...command().retirada, destino: 'BLOQUEAR' } }, async () => f.db.__fleet, async () => null, now), (e: any) => e.status === 409);
  assert.deepEqual([...f.records], before);
});

test('manual: iniciar usa CI da mesma data e comeca limpa sem herdar escala anterior', async () => {
  const f = fixture();
  f.records.set('previous', { id: 22, garagem: 'VCG', dataOperacao: '2026-10-13', revisao: 9,
    conteudo: JSON.stringify([{ id: original.id, carroSubstituido: '5001' }]) });
  const previous = structuredClone(f.records.get('previous'));
  const started = await lifecycle(f.db, 'iniciar');
  assert.equal(f.db.__ciDate, '2026-10-14');
  assert.equal(started.fluxo.status, 'EM_PREPARACAO');
  assert.deepEqual(started.itens, []); assert.deepEqual(started.confirmadas, []);
  assert.ok(started.cards.every(card => card.itens.every(item => item.prefixo === '')));
  assert.deepEqual(f.records.get('previous'), previous);
  assert.deepEqual(validateDailyEscala(started, contexto), started);
  const before = structuredClone([...f.records]);
  await assert.rejects(lifecycle(f.db, 'iniciar', started.revisao), /ja iniciada/);
  assert.deepEqual([...f.records], before);
});

test('manual: finalizar e reabrir preserva dados e revisoes, mas editar finalizada e recusado', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar');
  const saved = await saveEscalaDiaria(f.db, 1, command());
  const closed = await lifecycle(f.db, 'finalizar', saved.revisao);
  assert.equal(closed.fluxo.status, 'FINALIZADA'); assert.ok(closed.fluxo.finalizadaEm);
  assert.deepEqual(closed.itens, saved.itens); assert.deepEqual(closed.cards, saved.cards);
  const before = structuredClone([...f.records]);
  await assert.rejects(saveEscalaDiaria(f.db, 1, command(closed.revisao, '5002')), /Reabra/);
  await assert.rejects(lifecycle(f.db, 'reabrir', saved.revisao), /outro posto/);
  assert.deepEqual([...f.records], before);
  const reopened = await lifecycle(f.db, 'reabrir', closed.revisao);
  assert.equal(reopened.fluxo.status, 'EM_PREPARACAO'); assert.equal(reopened.fluxo.finalizadaEm, null);
  assert.deepEqual(reopened.itens, saved.itens);
  await saveEscalaDiaria(f.db, 1, command(reopened.revisao, '5002'));
});

test('manual: proxima escala de qualquer tipo iniciada impede reabertura', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar');
  const closed = await lifecycle(f.db, 'finalizar');
  const nextContext = { ...contexto, dataOperacao: '2026-10-15', escalaTipo: 'SABADO', turno: 'PADRAO' } as any;
  await lifecycle(f.db, 'iniciar', 0, nextContext);
  const read = await readEscalaDiaria(f.db, contexto, 1);
  assert.equal(read.fluxo.proximaIniciada, true);
  await assert.rejects(lifecycle(f.db, 'reabrir', closed.revisao), /proxima escala/);
});

test('manual: CI reaberta impede editar, reabrir ou finalizar escala ate nova finalizacao da CI', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar'); f.db.__ciStatus = 'EM_PREPARACAO';
  await assert.rejects(saveEscalaDiaria(f.db, 1, command()), /Finalize a CI/);
  await assert.rejects(lifecycle(f.db, 'finalizar'), /Finalize a CI/);
  f.db.__ciStatus = 'FINALIZADA'; await lifecycle(f.db, 'finalizar');
});

test('manual: meia-noite bloqueia iniciar, reabrir e editar, permitindo apenas finalizar pendencia', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar');
  const beforeMidnight = () => new Date('2026-10-14T03:59:59Z');
  const afterMidnight = () => new Date('2026-10-14T04:00:00Z');
  const saved = await saveReal(f.db, 1, command(), async () => f.db.__fleet, async () => null, beforeMidnight);
  const before = structuredClone([...f.records]);
  await assert.rejects(saveReal(f.db, 1, command(saved.revisao), async () => f.db.__fleet, async () => null, afterMidnight), /hoje ou anterior/);
  await assert.rejects(lifecycle(f.db, 'iniciar', 0, contexto, afterMidnight), /hoje ou anterior/);
  assert.deepEqual([...f.records], before);
  const closed = await lifecycle(f.db, 'finalizar', saved.revisao, contexto, afterMidnight);
  assert.deepEqual(closed.itens, saved.itens);
  await assert.rejects(lifecycle(f.db, 'reabrir', closed.revisao, contexto, afterMidnight), /hoje ou anterior/);
});

test('manual: escala finalizada conserva fotografia da CI mesmo se a CI futura mudar', async () => {
  const f = fixture(); f.db.__blocks = ['5003']; await lifecycle(f.db, 'iniciar'); await lifecycle(f.db, 'finalizar');
  const before = structuredClone([...f.records]); f.db.__blocks = ['5001']; f.db.__ciStatus = 'EM_PREPARACAO';
  const read = await readEscalaDiaria(f.db, contexto, 1);
  assert.deepEqual(read.bloqueados, ['5003']); assert.equal(read.fluxo.ciFinalizada, false);
  assert.deepEqual([...f.records], before);
});

test('manual: comandos exigem permissoes e rollback preserva folha anterior', async () => {
  const f = fixture(); f.role('COLABORADOR'); await assert.rejects(lifecycle(f.db, 'iniciar'), (e: any) => e.status === 403);
  f.role('ADMIN'); await lifecycle(f.db, 'iniciar'); const before = structuredClone([...f.records]);
  f.fail(); await assert.rejects(lifecycle(f.db, 'finalizar'), /Falha simulada/);
  assert.deepEqual([...f.records], before);
});

test('manual: dupla finalizacao serializada tem um unico vencedor', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar'); const transaction = f.db.$transaction;
  let queue = Promise.resolve();
  f.db.$transaction = (fn: any, options: any) => { const result = queue.then(() => transaction(fn, options)); queue = result.catch(() => undefined); return result; };
  const results = await Promise.allSettled([lifecycle(f.db, 'finalizar'), lifecycle(f.db, 'finalizar')]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter(result => result.status === 'rejected').length, 1);
});

test('manual: virada durante a escrita de linha reverte conteudo e revisao', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar'); const before = structuredClone([...f.records]);
  const update = f.db.escalaDiaria.update; let crossed = false;
  f.db.escalaDiaria.update = async (args: any) => { await update(args); crossed = true; };
  await assert.rejects(saveReal(f.db, 1, command(), async () => f.db.__fleet, async () => null,
    () => new Date(crossed ? '2026-10-14T04:00:00Z' : '2026-10-14T03:59:59Z')), /hoje ou anterior/);
  assert.deepEqual([...f.records], before);
});

test('manual: iniciar proxima e reabrir origem serializados respeitam o vencedor', async () => {
  const f = fixture(); await lifecycle(f.db, 'iniciar'); const closed = await lifecycle(f.db, 'finalizar');
  const transaction = f.db.$transaction; let queue = Promise.resolve();
  f.db.$transaction = (fn: any, options: any) => { const result = queue.then(() => transaction(fn, options)); queue = result.catch(() => undefined); return result; };
  const results = await Promise.allSettled([
    lifecycle(f.db, 'iniciar', 0, { ...contexto, dataOperacao: '2026-10-15' }),
    lifecycle(f.db, 'reabrir', closed.revisao),
  ]);
  assert.equal(results[0].status, 'fulfilled'); assert.equal(results[1].status, 'rejected');
  assert.equal((await readEscalaDiaria(f.db, contexto, 1)).fluxo.status, 'FINALIZADA');
});

test('manual: evento de estado usa a data da escala e so e enviado depois do commit', async () => {
  const f = fixture(), events: unknown[] = [];
  const stop = subscribeC4Updates(event => {
    assert.equal(f.records.size, 1); events.push(event);
  });
  try {
    await lifecycle(f.db, 'iniciar');
    assert.deepEqual(events, [{ garagem: 'VCG', dataOperacional: '2026-10-13', dataFolha: '2026-10-14' }]);
    f.fail(); await assert.rejects(lifecycle(f.db, 'finalizar'), /Falha simulada/);
    assert.equal(events.length, 1);
  } finally { stop(); }
});

const priorCI = (date: string, prefixo: string, garagem = 'VCG', status = 'FINALIZADA') => ({ garagem, status,
  dataFolha: new Date(date + 'T00:00:00Z'), itens: [{ prefixo, categoria: 'BLOQUEADO', statusItem: 'BLOQUEADO' },
    { prefixo: '5003', categoria: 'OFICINA', subTipo: 'ELEVADOR' }],
});

test('provisoria: seleciona ultima CI finalizada anterior da garagem, exclui bloqueados da reserva e nao libera inicio', async () => {
  const f = fixture(); f.db.folhaCI.findUnique = async () => null;
  f.db.__prior = [priorCI('2026-10-10', '5002'), priorCI('2026-10-13', '5001'),
    priorCI('2026-10-13', '5002', 'VCM'), priorCI('2026-10-15', '5002'), priorCI('2026-10-13', '5002', 'VCG', 'EM_PREPARACAO')];
  const read = await readEscalaDiaria(f.db, contexto, 1);
  assert.equal(read.ciProvisoria, true); assert.equal(read.ciData, '2026-10-13');
  assert.deepEqual(read.bloqueados, ['5001']); assert.deepEqual(read.ciAvisos, []);
  assert.ok(!read.reserva.includes('5001')); assert.ok(read.reserva.includes('5002'));
  assert.equal(read.fluxo.ciFinalizada, false);
  assert.deepEqual(validateDailyEscala(read, contexto), read);
  assert.throws(() => validateDailyEscala({ ...read, fluxo: { ...read.fluxo, ciFinalizada: true } }, contexto));
  await assert.rejects(lifecycle(f.db, 'iniciar'), /Finalize a CI da mesma data/);
  assert.equal(f.records.size, 0);
});

test('provisoria: CI iniciada substitui a referencia anterior mesmo antes de finalizar ou quando vazia', async () => {
  const f = fixture(); const current = f.db.folhaCI.findUnique;
  f.db.folhaCI.findUnique = async () => null; f.db.__prior = [priorCI('2026-10-13', '5001')];
  assert.equal((await readEscalaDiaria(f.db, contexto, 1)).ciProvisoria, true);
  f.db.folhaCI.findUnique = current; f.db.__ciStatus = 'EM_PREPARACAO'; f.db.__blocks = ['5002'];
  const read = await readEscalaDiaria(f.db, contexto, 1);
  assert.equal(read.ciData, contexto.dataOperacao); assert.equal(read.ciProvisoria, false);
  assert.deepEqual(read.bloqueados, ['5002']); assert.ok(read.reserva.includes('5001'));
  assert.equal(read.fluxo.ciFinalizada, false);
  f.db.__blocks = [];
  assert.deepEqual((await readEscalaDiaria(f.db, contexto, 1)).bloqueados, []);
  assert.equal(f.records.size, 0);
});

test('provisoria: fotografia de escala finalizada nao consulta nem herda CI anterior', async () => {
  const f = fixture(); f.db.__blocks = ['5002']; await lifecycle(f.db, 'iniciar'); await lifecycle(f.db, 'finalizar');
  const before = structuredClone([...f.records]); f.db.folhaCI.findUnique = async () => null;
  f.db.folhaCI.findFirst = async () => { throw Error('Fotografia nao pode consultar CI anterior'); };
  const read = await readEscalaDiaria(f.db, contexto, 1);
  assert.equal(read.ciProvisoria, false); assert.equal(read.ciData, contexto.dataOperacao);
  assert.deepEqual(read.bloqueados, ['5002']); assert.deepEqual([...f.records], before);
});
