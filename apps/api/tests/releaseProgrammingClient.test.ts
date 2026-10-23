import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../../web/src/lib/api';
import { loadReleaseProgramming } from '../../web/src/lib/releaseProgramming';
import { currentReleaseTemplate } from '../../web/src/data/scheduleTemplates';

const context = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'VESPERTINO', dataOperacao: '2026-10-24' } as const;
function response() {
  return { contexto: context, escalaFinalizada: true, itens: currentReleaseTemplate(context).map(row => ({ ...row, carroProgramado: '4001' })),
    escala: { contexto: { ...context, turno: 'MATUTINO' }, revisao: 2, itens: [], cards: [], confirmadas: [],
      frota: ['4001'], bloqueados: [], reserva: ['4001'], ocupacoes: [], ciData: context.dataOperacao, cardsOrigem: 'salvo', omitidosPadrao: 0,
      fluxo: { status: 'FINALIZADA', ciFinalizada: true, proximaIniciada: false, iniciadaEm: '2026-10-23T16:00:00Z', finalizadaEm: '2026-10-23T17:00:00Z' } } };
}

test('cliente consulta data/periodo selecionados e valida escala matutina da mesma data no vespertino', async () => {
  const original = api.get;
  try {
    api.get = (async (path: string, options: unknown) => {
      assert.equal(path, '/solturas/programacao'); assert.deepEqual(options, { params: context });
      return response();
    }) as typeof api.get;
    const data = await loadReleaseProgramming(context);
    assert.equal(data.escala.contexto.turno, 'MATUTINO');
    assert.equal(data.itens[0].carroProgramado, '4001');
  } finally { api.get = original; }
});

test('cliente rejeita resposta de outra data, fonte errada, linha alterada ou lista parcial', async () => {
  const original = api.get;
  try {
    for (const mutate of [
      (value: any) => { value.contexto = { ...context, dataOperacao: '2026-10-23' }; },
      (value: any) => { value.escala.contexto.turno = 'VESPERTINO'; },
      (value: any) => { value.itens[0].linha = 'INCORRETA'; },
      (value: any) => { value.itens.pop(); },
      (value: any) => { value.itens[1].id = value.itens[0].id; },
      (value: any) => { value.escalaFinalizada = false; },
    ]) {
      const value = response(); mutate(value);
      api.get = (async () => value) as typeof api.get;
      await assert.rejects(loadReleaseProgramming(context));
    }
  } finally { api.get = original; }
});

test('sem escala finalizada cliente aceita somente programacao vazia, sem recorrer aos carros JSON', async () => {
  const original = api.get;
  try {
    const value = response(); value.escalaFinalizada = false; value.escala.fluxo.status = 'EM_PREPARACAO';
    api.get = (async () => value) as typeof api.get;
    await assert.rejects(loadReleaseProgramming(context));
    value.itens.forEach(row => { row.carroProgramado = ''; });
    assert.ok((await loadReleaseProgramming(context)).itens.every(row => row.carroProgramado === ''));
  } finally { api.get = original; }
});
