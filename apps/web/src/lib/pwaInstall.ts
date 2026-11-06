export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export const PWA_INSTALLED_KEY = 'garagem:pwa-installed:v1';
export function createPwaInstallController(win: Window) {
  let authenticated = false, installed = false, dismissed = false, busy = false;
  let deferred: InstallPromptEvent | null = null;
  const listeners = new Set<() => void>();
  const display = win.matchMedia('(display-mode: standalone)');
  const standalone = () => display.matches || Boolean((win.navigator as Navigator & { standalone?: boolean }).standalone);
  const remember = () => { installed = true; deferred = null; try { win.localStorage.setItem(PWA_INSTALLED_KEY, '1'); } catch { /* Modo privado: estado da sessao permanece. */ } };
  const emit = () => listeners.forEach(fn => fn());
  const detect = () => {
    try { installed = installed || win.localStorage.getItem(PWA_INSTALLED_KEY) === '1'; } catch { /* Storage indisponivel. */ }
    if (standalone()) remember();
  };
  const beforeInstall = (event: Event) => {
    event.preventDefault(); detect(); if (installed) return;
    deferred = event as InstallPromptEvent; emit();
  };
  const appInstalled = () => { remember(); emit(); };
  const displayChanged = () => { detect(); emit(); };
  return {
    getState: () => ({ open: authenticated && !installed && !dismissed && Boolean(deferred), busy }),
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    mount() {
      detect(); emit();
      win.addEventListener('beforeinstallprompt', beforeInstall);
      win.addEventListener('appinstalled', appInstalled);
      win.addEventListener('storage', displayChanged);
      display.addEventListener('change', displayChanged);
      return () => {
        win.removeEventListener('beforeinstallprompt', beforeInstall);
        win.removeEventListener('appinstalled', appInstalled);
        win.removeEventListener('storage', displayChanged);
        display.removeEventListener('change', displayChanged);
      };
    },
    authenticate(value: boolean) { if (value && !authenticated) dismissed = false; authenticated = value; detect(); emit(); },
    dismiss() { if (!busy) { dismissed = true; emit(); } },
    async install() {
      if (busy || !authenticated || installed || !deferred) return;
      const event = deferred; deferred = null; busy = true; emit();
      try {
        // Chamado diretamente no clique, preservando a ativacao exigida pelo navegador.
        await event.prompt();
        await event.userChoice;
        // Apenas appinstalled/standalone confirma instalacao; aceitar o dialogo nao basta.
      } finally { dismissed = true; busy = false; emit(); }
    },
  };
}
