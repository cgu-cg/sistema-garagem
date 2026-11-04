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

test('uso em outro turno ou tipo nao reduz a reserva da folha selecionada', () => {
 const records = [
   { ...record(''), turno: 'VESPERTINO', carroRealizado: '4001', historicoTrocas: null },
   { ...record(''), escalaTipo: 'SABADO', turno: 'PADRAO', carroRealizado: '4002', historicoTrocas: null },
 ];
 assert.deepEqual(releaseFleetProjection(scale, programming, records, context).reserva, ['4001', '4002', '4003']);
 assert.deepEqual(releaseFleetProjection(scale, [], records, { ...context, turno: 'VESPERTINO' }).reserva, ['4002', '4003']);
});

test('retorno para reserva de outra folha nao importa carro alocado na escala vinculada', () => {
 const other = { ...record('Adicionado equivocadamente'), turno: 'VESPERTINO' };
 assert.deepEqual(releaseFleetProjection(scale, [], [other], context).reserva, ['4001', '4002', '4003']);
 assert.ok(releaseFleetProjection(scale, [], [other], { ...context, turno: 'VESPERTINO' }).reserva.includes('4000'));
});

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

test('cards isolam turno e tipo, mas bloqueios e pendencias de outras folhas impedem reserva', () => {
 const records = [
   { ...record('Aguardando tratativa'), historicoTrocas: JSON.stringify([{ id: 'pending-own', carroAnterior: '4000', destino: 'PENDENTE' }]) },
   { ...record('Defeito Garagem'), turno: 'VESPERTINO', historicoTrocas: JSON.stringify([{ carroAnterior: '4002', motivo: 'Defeito Garagem' }]) },
   { ...record('Aguardando tratativa'), turno: 'PADRAO', escalaTipo: 'SABADO', historicoTrocas: JSON.stringify([{ id: 'pending-other', carroAnterior: '4003', destino: 'PENDENTE' }]) },
 ];
 const morning = releaseFleetProjection(scale, programming, records, context);
 assert.deepEqual(morning.substituidos.map(r => r.prefixo), ['4000']);
 assert.deepEqual(morning.bloqueadosPortaria, []);
 assert.ok(!morning.reserva.includes('4002')); assert.ok(!morning.reserva.includes('4003'));
 const evening = releaseFleetProjection(scale, [], records, { ...context, turno: 'VESPERTINO' });
 assert.deepEqual(evening.substituidos, []);
 assert.deepEqual(evening.bloqueadosPortaria.map(r => r.prefixo), ['4002']);
 assert.ok(!evening.reserva.includes('4000')); assert.ok(!evening.reserva.includes('4003'));
 const saturday = releaseFleetProjection(scale, [], records, { escalaTipo: 'SABADO', turno: 'PADRAO' });
 assert.deepEqual(saturday.substituidos.map(r => r.prefixo), ['4003']); assert.deepEqual(saturday.bloqueadosPortaria, []);
 const sunday = releaseFleetProjection(scale, [], records, { escalaTipo: 'DOM_FER', turno: 'PADRAO' });
 assert.deepEqual(sunday.substituidos, []); assert.deepEqual(sunday.bloqueadosPortaria, []);
});

test('legado sem tipo ou turno nao e atribuido a folha, mas conserva bloqueio', () => {
 const records = [{ ...record('Defeito Garagem'), turno: null, escalaTipo: null }];
 const state = releaseFleetProjection(scale, programming, records, context);
 assert.deepEqual(state.bloqueadosPortaria, []); assert.deepEqual(state.substituidos, []);
 assert.equal(state.defeitosGaragem[0].prefixo, '4000'); assert.ok(!state.reserva.includes('4000'));
});
