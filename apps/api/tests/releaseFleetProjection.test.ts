import test from 'node:test';
import assert from 'node:assert/strict';
import { releaseFleetProjection } from '../src/services/releaseFleetProjection';
import { garageDefects } from '../src/services/releaseVehicleExchange';

const context = { turno: 'MATUTINO', escalaTipo: 'SEG_SEX' };
const scale = { frota: ['4000', '4001', '4002', '4003'], reserva: ['4001', '4002', '4003'], bloqueados: [] as string[], cards: [],
  coresFrota: { '4000': 'AZUL', '4001': 'VERMELHO', '4002': 'OUTRO', '4003': 'OUTRO' } as const,
  reservaPorCor: { updatedAt: '2026-10-27T12:00:00Z' } };
const programming = [{ id: 'linha-1', carroProgramado: '4000' }];
const record = (motivo: string) => ({ scheduleId: 'linha-1', ...context, carroRealizado: '4001',
  historicoTrocas: JSON.stringify([{ carroAnterior: '4000', novoCarro: '4001', motivo, descricaoDefeito: 'Pneu furado', registradoEm: '2026-10-27T12:00:00Z' }]) });

test('equivoco devolve programado retirado a reserva e atualiza cor, sem repetir carro realizado', () => {
 const state = releaseFleetProjection(scale, programming, [record('Adicionado equivocadamente')], context);
 assert.deepEqual(state.reserva, ['4000', '4002', '4003']); assert.deepEqual(state.defeitosGaragem, []);
 assert.deepEqual(state.reservaPorCor.grupos.find(g => g.id === 'AZUL')!.prefixos, ['4000']);
});

test('defeito vai para card proprio com descricao e permanece fora da reserva', () => {
 const state = releaseFleetProjection(scale, programming, [record('Defeito Garagem')], context);
 assert.deepEqual(state.reserva, ['4002', '4003']);
 assert.deepEqual(state.defeitosGaragem, [{ prefixo: '4000', descricao: 'Pneu furado', registradoEm: '2026-10-27T12:00:00Z' }]);
});

test('retorno nao libera bloqueio CI nem carro previsto em outra viagem pendente', () => {
 const records = [record('Adicionado equivocadamente')];
 assert.ok(!releaseFleetProjection({ ...scale, bloqueados: ['4000'] }, programming, records, context).reserva.includes('4000'));
 assert.ok(!releaseFleetProjection(scale, [...programming, { id: 'outra', carroProgramado: '4000' }], records, context).reserva.includes('4000'));
});

test('historico legado de defeito e preservado, nao duplica prefixos e dados corrompidos impedem consulta', () => {
 const records = [{ historicoTrocas: JSON.stringify([{ carroAnterior: '4000', motivo: 'Defeito Garagem' }]) }];
 assert.equal(garageDefects([...records, ...records]).length, 1);
 assert.match(garageDefects(records)[0].descricao, /sem descricao/);
 assert.throws(() => garageDefects([{ historicoTrocas: '{invalido' }]));
});
