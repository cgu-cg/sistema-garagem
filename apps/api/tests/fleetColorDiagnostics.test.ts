import test from 'node:test';
import assert from 'node:assert/strict';
import { safeSigsitFailure } from '../src/services/sigsitFleetColors';
import { safeColorRefreshReason } from '../src/services/fleetColorRefresh';

test('diagnosticos SIGSIT distinguem falhas sem retornar mensagens ou credenciais', () => {
  const cases: [unknown, string][] = [
    [{ code: 'ESOCKET', message: 'self-signed certificate: segredo' }, 'SIGSIT_CERTIFICADO'],
    [{ code: 'ELOGIN', message: 'senha e usuario secretos' }, 'SIGSIT_LOGIN'],
    [{ code: 'ETIMEOUT' }, 'SIGSIT_TIMEOUT'], [{ code: 'ESOCKET' }, 'SIGSIT_REDE_PORTA'],
    [{ number: 229 }, 'SIGSIT_SEM_PERMISSAO_SELECT'], [{ number: 208 }, 'SIGSIT_TABELA_INEXISTENTE'],
    [{ number: 4060 }, 'SIGSIT_BANCO_INACESSIVEL'], [null, 'SIGSIT_CONSULTA_FALHOU'],
  ];
  for (const [input, expected] of cases) assert.equal(safeSigsitFailure(input), expected);
});

test('job permite apenas diagnosticos conhecidos e nunca imprime erro bruto', () => {
  assert.equal(safeColorRefreshReason(new Error('SIGSIT_LOGIN')), 'SIGSIT_LOGIN');
  assert.equal(safeColorRefreshReason(new Error('senha=secreta')), 'ATUALIZACAO_FALHOU');
  assert.equal(safeColorRefreshReason(Object.assign(new Error('segredo'), { code: 'EACCES' })), 'CACHE_ERRO_DE_ARQUIVO');
  assert.equal(safeColorRefreshReason(Object.assign(new Error('segredo'), { name: 'ZodError' })), 'FROTA_VAZIA_INVALIDA_OU_DUPLICADA');
});
