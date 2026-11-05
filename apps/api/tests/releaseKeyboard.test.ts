import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmReleaseWithKeyboard, focusNextReleaseCar } from '../../web/src/pages/soltura/releaseKeyboard';

test('primeiro Enter aguarda sucesso e foca confirmacao; somente o segundo avanca', async () => {
  const actions: string[] = []; let resolve!: (saved: boolean) => void;
  let frame: FrameRequestCallback | undefined;
  const next: any = { focus: () => actions.push('carro'), scrollIntoView: () => actions.push('rolagem') };
  const rows: any[] = [];
  const row: any = { isConnected: true,
    querySelector: () => ({ focus: () => actions.push('confirmacao') }),
    closest: () => ({ querySelectorAll: () => rows }) };
  rows.push(row, { querySelector: () => next });
  const pending = confirmReleaseWithKeyboard(row, () => new Promise<boolean>(r => { resolve = r; }), callback => { frame = callback; return 1; });
  assert.deepEqual(actions, []); assert.equal(frame, undefined);
  resolve(true); await pending; assert.deepEqual(actions, []);
  frame!(0); assert.deepEqual(actions, ['confirmacao']);
  focusNextReleaseCar(row); assert.deepEqual(actions, ['confirmacao', 'carro', 'rolagem']);
});

test('erro ou cancelamento nao altera foco e linha desmontada nao recebe foco atrasado', async () => {
  let frames = 0, focused = false;
  const row: any = { isConnected: false, querySelector: () => ({ focus: () => { focused = true; } }) };
  const schedule = (callback: FrameRequestCallback) => { frames++; callback(0); return 1; };
  await confirmReleaseWithKeyboard(row, async () => false, schedule);
  await assert.rejects(confirmReleaseWithKeyboard(row, async () => { throw Error('cancelado'); }, schedule), /cancelado/);
  assert.equal(frames, 0);
  await confirmReleaseWithKeyboard(row, async () => true, schedule);
  assert.equal(frames, 1); assert.equal(focused, false);
});

test('avanco pula confirmadas e suspensas, mantem ordem da tabela e para na ultima linha', () => {
  const focused: string[] = [];
  const rows: any[] = [];
  const row: any = { closest: () => ({ querySelectorAll: () => rows }) };
  const input = { focus: () => focused.push('pendente'), scrollIntoView: () => {} };
  rows.push(row, { querySelector: () => null }, { querySelector: () => null }, { querySelector: () => input });
  focusNextReleaseCar(row); assert.deepEqual(focused, ['pendente']);
  rows.splice(1); focusNextReleaseCar(row); assert.deepEqual(focused, ['pendente']);
});
