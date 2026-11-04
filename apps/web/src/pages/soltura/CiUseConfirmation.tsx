import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Gate = { request: (prefixo: string) => Promise<boolean>; isBlocked: (prefixo: string) => boolean;
  consume: (prefixo: string) => void; isPending: () => boolean };
export const CiUseConfirmationContext = createContext<Gate | null>(null);
export const useCiUseConfirmationContext = () => useContext(CiUseConfirmationContext);

export function useCiUseConfirmation(scope: string, blocked: string[]) {
  const [prefixo, setPrefixo] = useState<string | null>(null);
  const approved = useRef(new Set<string>()), blockedRef = useRef(blocked), scopeRef = useRef(scope);
  blockedRef.current = blocked; scopeRef.current = scope;
  const waiting = useRef<{ prefixo: string; scope: string; promise: Promise<boolean>; resolve: (value: boolean) => void } | null>(null);
  const finish = (answer: boolean) => {
    const current = waiting.current;
    if (!current) { setPrefixo(null); return; }
    const accepted = answer && current.scope === scopeRef.current;
    if (accepted) approved.current.add(current.prefixo);
    waiting.current = null; setPrefixo(null); current.resolve(accepted);
  };
  useEffect(() => {
    scopeRef.current = scope; approved.current.clear(); setPrefixo(null); finish(false);
    return () => { approved.current.clear(); const current = waiting.current; waiting.current = null; current?.resolve(false); };
  }, [scope]);
  const gate: Gate = {
    isBlocked: value => blockedRef.current.includes(value),
    isPending: () => Boolean(waiting.current),
    consume: value => approved.current.delete(value),
    request: value => {
      if (!blockedRef.current.includes(value) || approved.current.has(value)) return Promise.resolve(true);
      if (waiting.current) return waiting.current.prefixo === value ? waiting.current.promise : Promise.resolve(false);
      let resolve!: (answer: boolean) => void;
      const promise = new Promise<boolean>(r => { resolve = r; });
      waiting.current = { prefixo: value, scope, promise, resolve }; setPrefixo(value); return promise;
    },
  };
  const dialog = <Dialog open={Boolean(prefixo)} onOpenChange={open => { if (!open) finish(false); }}>
    <DialogContent className="sm:max-w-md rounded-2xl">
      <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-rose-600" />Carro bloqueado na CI</DialogTitle>
        <DialogDescription>O carro <strong>{prefixo}</strong> está bloqueado na CI de manutenção. Deseja mesmo assim usar esse carro?</DialogDescription></DialogHeader>
      <p className="text-xs text-muted-foreground">O bloqueio será mantido na CI e o carro continuará com o triângulo vermelho. A confirmação ficará registrada ao salvar a linha.</p>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => finish(false)}>Cancelar</Button>
        <Button type="button" className="bg-[#164E3A] text-white hover:bg-[#113C2D]" onClick={() => finish(true)}>Sim, usar este carro</Button></div>
    </DialogContent>
  </Dialog>;
  return { gate, dialog };
}
