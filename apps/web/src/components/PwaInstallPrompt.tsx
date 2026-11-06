import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/stores/auth';
import { createPwaInstallController } from '@/lib/pwaInstall';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function PwaInstallPrompt() {
  const { token, user, loading } = useAuth();
  const [controller] = useState(() => createPwaInstallController(window));
  const [state, setState] = useState(controller.getState);
  useEffect(() => {
    const unsubscribe = controller.subscribe(() => setState(controller.getState()));
    const unmount = controller.mount();
    return () => { unsubscribe(); unmount(); };
  }, [controller]);
  useEffect(() => { controller.authenticate(Boolean(token && user && !loading)); }, [controller, token, user, loading]);
  return <Dialog open={state.open} onOpenChange={open => { if (!open) controller.dismiss(); }}>
    <DialogContent className="rounded-2xl sm:max-w-sm" onInteractOutside={event => { if (state.busy) event.preventDefault(); }} onEscapeKeyDown={event => { if (state.busy) event.preventDefault(); }}>
      <DialogHeader>
        <img src="/icons/icon-512.png" alt="" className="mx-auto mb-3 h-16 w-16 rounded-2xl" />
        <DialogTitle>Instalar Sistema Garagem</DialogTitle>
        <DialogDescription>Acesse o sistema pelo ícone do aplicativo na tela inicial do seu dispositivo.</DialogDescription>
      </DialogHeader>
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={state.busy} onClick={() => controller.dismiss()}>Agora não</Button>
        <Button className="bg-[#164E3A] text-white hover:bg-[#113C2D]" disabled={state.busy} onClick={() => {
          void controller.install().catch(() => toast.error('Não foi possível iniciar a instalação. Tente pelo menu do navegador.'));
        }}><Download className="mr-2 h-4 w-4" />{state.busy ? 'Aguarde...' : 'Instalar'}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
