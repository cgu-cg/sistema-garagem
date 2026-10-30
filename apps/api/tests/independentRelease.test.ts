import test from 'node:test';
import assert from 'node:assert/strict';
import { readIndependentReleaseFleet } from '../src/services/independentRelease';

test('frota vespertina nao consulta CI, manutencao ou escala, e respeita garagem do usuario', async () => {
 const context = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'VESPERTINO', dataOperacao: '2026-10-29' } as const;
 const db: any = { user: { findUnique: async () => ({ role: 'soltura', garagem: 'VCG' }) } };
 const fleet = async () => ({ source: 'real', data: [{ prefixo: '4000', idCarro: '4000', garagem: 'VCG' }] });
 const result = await readIndependentReleaseFleet(db, context, 1, fleet, async () => null);
 assert.deepEqual(result.frota, ['4000']); assert.deepEqual(result.bloqueados, []);
 assert.deepEqual(result.ciAvisos, []); assert.deepEqual(result.cards, []);
 assert.equal(result.fluxo.ciFinalizada, false);
 db.user.findUnique = async () => ({ role: 'soltura', garagem: 'VCM' });
 await assert.rejects(readIndependentReleaseFleet(db, context, 1, fleet, async () => null), (e: any) => e.status === 403);
});
