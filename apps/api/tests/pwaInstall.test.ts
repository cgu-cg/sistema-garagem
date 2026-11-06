import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createPwaInstallController, PWA_INSTALLED_KEY } from '../../web/src/lib/pwaInstall';

function fixture(storage = new Map<string, string>(), standalone = false) {
  const win = Object.assign(new EventTarget(), { navigator: { standalone: false },
    localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { storage.set(key, value); } } });
  const display = Object.assign(new EventTarget(), { matches: standalone });
  Object.assign(win, { matchMedia: () => display });
  const controller = createPwaInstallController(win as unknown as Window), unmount = controller.mount();
  let calls = 0;
  const offer = (outcome = 'accepted', prompt = async () => { calls++; }) => {
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt, userChoice: Promise.resolve({ outcome }) });
    win.dispatchEvent(event); return event;
  };
  return { win, display, storage, controller, unmount, offer, calls: () => calls };
}
test('oferta capturada antes de login abre somente autenticado e instala apenas no clique', async () => {
  const f = fixture(), event = f.offer();
  assert.equal(event.defaultPrevented, true); assert.equal(f.controller.getState().open, false); assert.equal(f.calls(), 0);
  f.controller.authenticate(true); assert.equal(f.controller.getState().open, true);
  await Promise.all([f.controller.install(), f.controller.install()]); assert.equal(f.calls(), 1);
  assert.equal(f.storage.has(PWA_INSTALLED_KEY), false, 'aceitar nao confirma conclusao da instalacao');
  f.win.dispatchEvent(new Event('appinstalled')); assert.equal(f.storage.get(PWA_INSTALLED_KEY), '1');
  const next = fixture(f.storage); next.controller.authenticate(true); next.offer();
  assert.equal(next.controller.getState().open, false);
  f.unmount(); next.unmount();
});
test('modo instalado nao mostra popup; Agora nao fecha sem marcar como instalado', () => {
  const installed = fixture(new Map(), true); installed.controller.authenticate(true); installed.offer();
  assert.equal(installed.controller.getState().open, false); assert.equal(installed.storage.get(PWA_INSTALLED_KEY), '1');
  const f = fixture(); f.controller.authenticate(true); f.offer(); f.controller.dismiss();
  assert.equal(f.controller.getState().open, false); assert.equal(f.storage.has(PWA_INSTALLED_KEY), false);
  f.controller.authenticate(false); f.controller.authenticate(true); assert.equal(f.controller.getState().open, true);
  installed.unmount(); f.unmount();
});
test('cancelar ou falhar instalacao nao grava falso positivo e logout oculta oferta', async () => {
  const f = fixture(); f.controller.authenticate(true); f.offer('dismissed'); await f.controller.install();
  assert.equal(f.storage.has(PWA_INSTALLED_KEY), false);
  f.controller.authenticate(false); f.controller.authenticate(true);
  f.offer('accepted', async () => { throw Error('falha do navegador'); });
  await assert.rejects(f.controller.install(), /falha do navegador/);
  assert.equal(f.controller.getState().busy, false); assert.equal(f.storage.has(PWA_INSTALLED_KEY), false);
  f.offer(); f.controller.authenticate(false); assert.equal(f.controller.getState().open, false);
  f.unmount(); assert.equal(f.offer().defaultPrevented, false);
});
test('mudanca para modo instalado e armazenamento privado nao interrompem o sistema', () => {
  const f = fixture(); Object.defineProperty(f.win, 'localStorage', { get() { throw Error('storage bloqueado'); } });
  f.controller.authenticate(true); f.offer(); assert.equal(f.controller.getState().open, true);
  f.display.matches = true; f.display.dispatchEvent(new Event('change'));
  assert.equal(f.controller.getState().open, false); f.unmount();
});
test('todos os icones PNG do manifesto existem e possuem as dimensoes declaradas', () => {
  const manifest = JSON.parse(readFileSync('apps/web/public/manifest.json', 'utf8'));
  assert.equal(manifest.display, 'standalone'); assert.equal(manifest.scope, '/');
  for (const icon of manifest.icons) {
    const file = `apps/web/public${icon.src}`; assert.ok(existsSync(file));
    const png = readFileSync(file); assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});
