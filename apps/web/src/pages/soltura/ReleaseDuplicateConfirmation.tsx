import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const line = z.object({ scheduleId: z.string(), linha: z.string(), tabela: z.string() });
const noticeSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), conflitos: z.array(line.extend({
  tipo: z.enum(['CARRO', 'MOTO']), valor: z.string(), outras: z.array(line),
})).min(1) });
type Notice = z.infer<typeof noticeSchema>;

export function useReleaseDuplicateConfirmation(scope: string) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const currentScope = useRef(scope); currentScope.current = scope;
  const waiting = useRef<((answer: boolean) => void) | null>(null);
  const finish = (answer: boolean) => {
    const resolve = waiting.current; waiting.current = null; setNotice(null); resolve?.(answer);
  };
  useEffect(() => {
    setNotice(null);
    return () => { const resolve = waiting.current; waiting.current = null; resolve?.(false); };
  }, [scope]);
  const run = async <T,>(write: (confirmation?: string) => Promise<T>): Promise<T> => {
    const started = scope;
    let token: string | undefined;
    for (;;) {
      if (currentScope.current !== started) throw Error('Contexto alterado. Confirme novamente.');
      try { return await write(token); }
      catch (error) {
        const failure = error as { code?: string; details?: unknown };
        if (failure?.code !== 'CONFIRMAR_REPETICAO_NA_SOLTURA') throw error;
        const parsed = noticeSchema.safeParse(failure.details);
        if (!parsed.success || waiting.current || currentScope.current !== started) throw error;
        const answer = await new Promise<boolean>(resolve => { waiting.current = resolve; setNotice(parsed.data); });
        if (!answer) throw Error('Uso repetido cancelado. Nenhuma alteração foi salva.');
        token = parsed.data.token;
        // A API revalida: se outro operador mudou o conflito, mostra o aviso atualizado.
      }
    }
  };
  const dialog = <Dialog open={Boolean(notice)} onOpenChange={open => { if (!open) finish(false); }}>
    <DialogContent className="sm:max-w-lg rounded-2xl">
      <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" />Carro ou motorista repetido</DialogTitle>
        <DialogDescription>Os dados abaixo já estão sendo usados nesta Soltura. Deseja confirmar mesmo assim?</DialogDescription></DialogHeader>
      <ul className="max-h-72 overflow-y-auto space-y-3 text-sm">
        {notice?.conflitos.map(c => <li key={`${c.scheduleId}:${c.tipo}`} className="rounded-xl border p-3">
          <strong>{c.tipo === 'CARRO' ? 'Carro' : 'MOTO'} {c.valor}</strong>
          <p className="text-muted-foreground">Ao salvar Linha {c.linha} / Tab {c.tabela}.</p>
          <p>Já utilizado em: {c.outras.map(other => `Linha ${other.linha} / Tab ${other.tabela}`).join('; ')}.</p>
        </li>)}
      </ul>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => finish(false)}>Não, voltar</Button>
        <Button type="button" className="bg-[#164E3A] text-white hover:bg-[#113C2D]" onClick={() => finish(true)}>Sim, confirmar</Button></div>
    </DialogContent>
  </Dialog>;
  return { run, dialog };
}
