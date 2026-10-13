import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readContext } from '../src/services/c4Flow';
import { dateValue } from '../src/services/c4Temporal';
import { selectCIReportItems, ciReportSlot, ciReportExtraSlots, groupCIReportSubtypes, matchesCISubtype } from '../../web/src/pages/soltura/ciReport';

function fixture() {
  const folhas = [
    { id: 1, garagem: 'VCG', dataFolha: dateValue('2026-10-09'), tituloColunaAdicional: 'INSPEÇÃO' },
    { id: 2, garagem: 'VCG', dataFolha: dateValue('2026-10-10'), tituloColunaAdicional: 'REVISÃO' },
    { id: 3, garagem: 'VCM', dataFolha: dateValue('2026-10-09'), tituloColunaAdicional: 'LUBRIFICAÇÃO' },
  ].map(f => ({ ...f, status: 'FINALIZADA', origem: 'IMPORTACAO' }));
  const itens = folhas.flatMap(f => [
    { categoria: 'PREVENTIVA', subTipo: 'PREVENTIVA' },
    { categoria: 'OFICINA', subTipo: 'MECANICA' },
    { categoria: 'OFICINA', subTipo: 'ELETRICA' },
    { categoria: 'REFORCO', tipoPosicao: 'FIXO', ordemPosicao: 1, horarioReforco: '07:40' },
    { categoria: 'REFORCO', tipoPosicao: 'EXTRA', ordemPosicao: f.id === 2 ? 9 : 1 },
    // Consorciada VCM pode pertencer legitimamente a uma folha VCG.
    { categoria: 'BLOQUEADO', consorciada: 'VCM', dataBloqueio: dateValue('2026-10-01') },
  ].map((i, index) => ({ id: f.id * 100 + index, folhaId: f.id, prefixo: `${f.id}${index}00`,
    consorciada: null, motivo: `MOTIVO ${f.id}`, observacoes: `OBS ${f.id}`, ...i })));
  const include = (f: typeof folhas[number]) => ({ ...f, itens: itens.filter(i => i.folhaId === f.id) });
  const tx: any = {
    cicloOperacional: { findUnique: async () => null },
    folhaCI: {
      findUnique: async ({ where }: any) => {
        const key = where.garagem_dataFolha;
        const f = folhas.find(f => f.garagem === key.garagem && f.dataFolha.getTime() === key.dataFolha.getTime());
        return f ? include(f) : null;
      },
      findMany: async ({ where }: any) => folhas.filter(f => f.garagem === where.garagem).map(include),
    },
  };
  // Apenas os metodos de leitura em memoria acima existem; escrita/conexao falha.
  const db: any = new Proxy({ $transaction: async (fn: any) => fn(tx) }, {
    get(target, key) { if (key !== '$transaction') throw Error('Banco real proibido'); return target.$transaction; },
  });
  return { db };
}

test('duas CIs C4 preservam itens por folhaId na API e nao se misturam no relatorio', async () => {
  const { db } = fixture();
  const context = await readContext(db, 'VCG', '2026-10-09');
  // Endpoint de navegacao retorna ambas as fotografias VCG, sem a folha VCM.
  assert.equal(context.ci.length, 12);
  assert.ok(context.ci.every(i => i.garagem === 'VCG'));
  const a = selectCIReportItems(context.ci as any, '2026-10-09', 'VCG');
  const b = selectCIReportItems(context.ci as any, '2026-10-10', 'VCG');
  assert.equal(a.length, 6);
  assert.equal(b.length, 6);
  assert.ok(a.every(i => i.id?.startsWith('c4-ci-10')));
  assert.ok(b.every(i => i.id?.startsWith('c4-ci-20')));
  for (const section of ['PREVENTIVA', 'OFICINA', 'REFORCO', 'BLOQUEADO']) {
    assert.ok(a.some(i => i.categoriaPlanilha === section));
    assert.ok(b.some(i => i.categoriaPlanilha === section));
    assert.ok(a.filter(i => i.categoriaPlanilha === section).every(i => !b.some(j => j.id === i.id)));
  }
  assert.deepEqual(a.filter(i => i.categoriaPlanilha === 'OFICINA').map(i => i.setorOficina), ['MECANICA', 'ELETRICA']);
  assert.equal(a.find(i => i.categoriaPlanilha === 'BLOQUEADO')?.consorciada, 'VCM');
  assert.equal(ciReportSlot(a, 'ref-1', true).prefixo, '1300');
  assert.equal(ciReportSlot(b, 'ref-1', true).prefixo, '2300');
  assert.equal(ciReportSlot(a, 'ref-extra-9', true).prefixo, '');
  assert.equal(ciReportSlot(b, 'ref-extra-9', true).prefixo, '2400');
  assert.equal(ciReportExtraSlots(a).length, 6);
  assert.equal(ciReportExtraSlots(b).length, 7);
});

test('mesma data em garagens diferentes, folha ausente e TODAS nao agregam registros', async () => {
  const { db } = fixture();
  const vcg = await readContext(db, 'VCG', '2026-10-09');
  const vcm = await readContext(db, 'VCM', '2026-10-09');
  const all: any = [...vcg.ci, ...vcm.ci];
  const a = selectCIReportItems(all, '09/10/2026', 'VCG');
  const b = selectCIReportItems(all, '2026-10-09T12:00:00Z', 'VCM');
  assert.equal(a.length, 6);
  assert.equal(b.length, 6);
  assert.ok(a.every(i => i.garagem === 'VCG'));
  assert.ok(b.every(i => i.garagem === 'VCM'));
  assert.deepEqual(selectCIReportItems(all, '2026-10-11', 'VCG'), []);
  assert.deepEqual(selectCIReportItems(all, '2026-10-09', 'TODAS'), []);
});

test('reforco C4 usa posicao persistida, nunca horario, ID legado ou rascunho como fallback', async () => {
  const { db } = fixture();
  const context = await readContext(db, 'VCG', '2026-10-09');
  const a = selectCIReportItems(context.ci as any, '2026-10-09', 'VCG');
  const slot = ciReportSlot(a, 'ref-1', true);
  assert.equal(slot.motivo, 'MOTIVO 1');
  assert.equal(slot.obs, 'OBS 1');
  assert.equal(ciReportSlot(a, 'ref-2', true, '07:40').prefixo, '');
  assert.equal(ciReportSlot([{ ...a[3], id: 'ci-reforco-ref-2', tipoPosicao: null, ordemPosicao: null }], 'ref-2', true).prefixo, '');
  assert.deepEqual(ciReportSlot([], 'ref-1', true), { prefixo: '', motivo: '', obs: '', savedItem: undefined });
});

test('legado filtra garagem/data e preserva slots com horarios repetidos sem duplicar', () => {
  const records: any = [
    { id: 'a', prefixo: '4000', garagem: 'VCG', data: '2026-10-09', categoriaPlanilha: 'REFORCO', horarioReforco: '07:40' },
    { id: 'b', prefixo: '4001', garagem: 'VCG', data: '2026-10-09', categoriaPlanilha: 'REFORCO', horarioReforco: '07:40' },
    { id: 'c', prefixo: '1000', garagem: 'VCM', data: '2026-10-09', categoriaPlanilha: 'REFORCO', horarioReforco: '07:40' },
    { id: 'd', prefixo: '4002', garagem: 'VCG', data: '2026-10-08', categoriaPlanilha: 'REFORCO', horarioReforco: '07:40' },
    { id: 'e', prefixo: '4003', garagem: 'VCG', data: '2026-10-09', categoriaPlanilha: 'BLOQUEADO', status: 'LIBERADO' },
  ];
  const items = selectCIReportItems(records, '2026-10-09', 'VCG');
  const slots = [{ id: 'ref-1', horario: '07:40' }, { id: 'ref-2', horario: '07:40' }];
  assert.equal(items.length, 2);
  assert.equal(ciReportSlot(items, 'ref-1', false, '07:40', slots).prefixo, '4000');
  assert.equal(ciReportSlot(items, 'ref-2', false, '07:40', slots).prefixo, '4001');
});


test('relatorio agrupa aliases textuais e internos sem modificar os itens persistidos', () => {
  const aliases = {
    PREVENTIVA: ['Preventivas', 'PREVENTIVA'],
    LUBRIFICACAO: [' Lubrificação ', 'LUBRIFICACAO'],
    TROCA_OLEO: ['Troca de óleo', 'TROCA_OLEO', ' troca   de ÓLEO '],
    REVISAO_GERAL: ['Revisão Geral', 'REVISAO_GERAL'],
    SISEP: ['sisep', 'SISEP'],
  };
  const sectors = ['Mecânica', 'Elevador', 'Elétrica', 'Borracharia', 'Funilaria / Pintura', 'Tacógrafo', 'Bilhetagem', 'Limpeza'];
  const sectorKeys = ['MECANICA', 'ELEVADOR', 'ELETRICA', 'BORRACHARIA', 'FUNILARIA', 'TACOGRAFO', 'BILHETAGEM', 'LIMPEZA'];
  const records: any[] = Object.entries(aliases).flatMap(([key, values]) => values.map((value, index) => ({
    id: `${key}-${index}`, prefixo: `${4000 + index}`, categoriaPlanilha: 'PREVENTIVA', tipoPreventiva: value,
    motivo: null, os: 'OBS original', garagem: 'VCG', data: '2026-10-09',
  })));
  sectors.forEach((name, index) => {
    for (const value of [name, sectorKeys[index]]) records.push({ id: `o-${records.length}`, prefixo: '3000',
      categoriaPlanilha: 'OFICINA', setorOficina: value, motivo: 'Motivo original', os: null, garagem: 'VCG', data: '2026-10-09' });
  });
  const snapshot = structuredClone(records);
  records.forEach(Object.freeze);
  const result = groupCIReportSubtypes(selectCIReportItems(records, '09/10/2026', 'VCG'));
  for (const [key, values] of Object.entries(aliases)) assert.equal(result.preventivas[key].length, values.length);
  for (const key of sectorKeys) assert.equal(result.oficina[key].length, 2);
  assert.equal(result.unknown.length, 0);
  assert.deepEqual(records, snapshot);
  assert.equal(result.preventivas.LUBRIFICACAO[0], records.find(i => i.id === result.preventivas.LUBRIFICACAO[0].id));
});

test('subtipos desconhecidos ou ausentes permanecem identificados e linhas nao truncam grupos', () => {
  const unknown: any[] = [
    { id: 'x', prefixo: '4001', categoriaPlanilha: 'PREVENTIVA', tipoPreventiva: 'Serviço novo', motivo: 'original' },
    { id: 'y', prefixo: '4002', categoriaPlanilha: 'OFICINA', setorOficina: null, os: 'observação' },
    { id: 'z', prefixo: '4003', categoriaPlanilha: 'OFICINA', setorOficina: '  ' },
  ];
  const items: any[] = [...unknown,
    ...Array.from({ length: 21 }, (_, n) => ({ prefixo: `${n}`, categoriaPlanilha: 'PREVENTIVA', tipoPreventiva: 'Lubrificação' })),
    ...Array.from({ length: 13 }, (_, n) => ({ prefixo: `${n}`, categoriaPlanilha: 'OFICINA', setorOficina: 'Elétrica' })),
  ];
  const result = groupCIReportSubtypes(items);
  assert.deepEqual(result.unknown, unknown);
  assert.equal(result.numLinhasPreventivas, 21);
  assert.equal(result.numLinhasOficina, 13);
  assert.equal(result.unknown.length + Object.values(result.preventivas).flat().length + Object.values(result.oficina).flat().length, items.length);
});


test('preventivas mantem ordem recebida e uma posicao por linha em todas as colunas', () => {
  const keys = ['PREVENTIVA', 'LUBRIFICACAO', 'TROCA_OLEO', 'REVISAO_GERAL', 'SISEP'] as const;
  const items: any[] = keys.flatMap((key, index) => ['3953', '3028', '3065'].slice(0, index === 0 ? 1 : 3)
    .map(prefixo => ({ prefixo, categoriaPlanilha: 'PREVENTIVA', tipoPreventiva: key })));
  const result = groupCIReportSubtypes(items);
  assert.equal(result.numLinhasPreventivas, 3);
  for (const key of keys) {
    assert.deepEqual(result.preventivas[key].map(i => i.prefixo), key === 'PREVENTIVA' ? ['3953'] : ['3953', '3028', '3065']);
  }
  assert.equal(result.preventivas.PREVENTIVA[1], undefined);
});

test('previa e impressao compartilham celulas preventivas e avisos simples preservam restricoes', () => {
  const source = readFileSync('apps/web/src/pages/soltura/CiManutencaoView.tsx', 'utf8');
  for (const list of ['prevList', 'lubList', 'oleoList', 'geralList', 'sisepList']) {
    assert.ok(source.includes(`${list}[rIdx]?.prefixo`));
  }
  assert.ok(!source.includes('lubItem2'));
  assert.ok(source.includes('const htmlContent = element.outerHTML'));
  assert.ok(source.includes('disabled={!isDataEditavel}'));
  assert.ok(source.includes('!canMutate(target'));
  assert.ok(source.includes('toast.error(error instanceof Error ? error.message'));
  assert.ok(!source.includes('Copia automatica indisponivel no legado'));
  assert.ok(!source.includes('Somente leitura. Altera\u00e7\u00f5es requerem'));
  const parent = readFileSync('apps/web/src/pages/soltura/index.tsx', 'utf8');
  assert.ok(!parent.includes('Soltura depende da CI finalizada'));
  assert.ok(parent.includes('{ciReadError && <p>{ciReadError}</p>}'));
});


test('cards da folha 9 exibem os seis veiculos e compartilham aliases do relatorio', () => {
  const items = [
    ...['3953', '3065', '3028'].map(prefixo => ({ prefixo, subtype: 'Lubrifica\u00e7\u00e3o' })),
    ...['3148', '3034', '3057'].map((prefixo, i) => ({ prefixo, subtype: ['Troca de \u00f3leo', 'TROCA_OLEO', 'TROCA DE OLEO'][i] })),
  ];
  const keys = ['PREVENTIVA', 'LUBRIFICACAO', 'TROCA_OLEO', 'REVISAO_GERAL', 'SISEP'];
  const groups = keys.map(key => items.filter(i => matchesCISubtype('PREVENTIVA', i.subtype, key)));
  assert.deepEqual(groups[2].map(i => i.prefixo), ['3148', '3034', '3057']);
  assert.equal(groups.reduce((sum, group) => sum + group.length, 0), 6);
  assert.ok(matchesCISubtype('PREVENTIVA', '  troca   de \u00d3LEO ', 'TROCA_OLEO'));
  assert.ok(matchesCISubtype('PREVENTIVA', 'Revis\u00e3o Geral', 'REVISAO_GERAL'));
  assert.ok(matchesCISubtype('PREVENTIVA', 'Preventivas', 'PREVENTIVA'));
  assert.ok(matchesCISubtype('PREVENTIVA', 'sisep', 'SISEP'));
  const names = ['Mec\u00e2nica', 'El\u00e9trica', 'Elevador', 'Borracharia', 'Funilaria / Pintura', 'Tac\u00f3grafo', 'Bilhetagem', 'Limpeza'];
  const sectors = ['MECANICA', 'ELETRICA', 'ELEVADOR', 'BORRACHARIA', 'FUNILARIA', 'TACOGRAFO', 'BILHETAGEM', 'LIMPEZA'];
  names.forEach((name, i) => assert.ok(matchesCISubtype('OFICINA', name, sectors[i])));
  assert.equal(matchesCISubtype('OFICINA', 'desconhecido', 'MECANICA'), false);
  const source = readFileSync('apps/web/src/pages/soltura/CiManutencaoView.tsx', 'utf8');
  assert.ok(source.includes("matchesCISubtype('PREVENTIVA', c.tipoPreventiva, card.id)"));
  assert.ok(source.includes("matchesCISubtype('OFICINA', c.setorOficina, setor.id)"));
});
