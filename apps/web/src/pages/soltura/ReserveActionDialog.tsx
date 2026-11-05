import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { maintenanceOperationId } from '@/lib/maintenanceCompatibility';
import type { DailyEscala } from '@/lib/sharedEscala';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function ReserveActionDialog({ prefixo, contexto, modulo, onClose, onSaved }: {
  prefixo: string; contexto: DailyEscala['contexto']; modulo: 'ESCALA'|'SOLTURA'; onClose: () => void; onSaved: () => Promise<void>;
}) {
  const [tipo, setTipo] = useState<'BLOQUEIO_CI'|'JUSTIFICATIVA'>('BLOQUEIO_CI'), [descricao, setDescricao] = useState(''), [saving, setSaving] = useState(false);
  const pending = useRef(false), command = useRef<{ fingerprint: string; id: string }>();
  const save = async () => {
    if (pending.current || !descricao.trim()) return;
    pending.current = true; setSaving(true);
    const fingerprint = JSON.stringify([tipo, descricao.trim()]);
    if (command.current?.fingerprint !== fingerprint) command.current = { fingerprint, id: maintenanceOperationId() };
    try {
      await api.post('/solturas/reserva-acao', { contexto, modulo, prefixo, tipo, descricao: descricao.trim(), operacaoId: command.current.id });
      toast.success(tipo === 'BLOQUEIO_CI' ? 'Bloqueio registrado na CI.' : 'Justificativa registrada. Carro continua disponível.');
      await onSaved(); onClose();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Ação não gravada.'); }
    finally { pending.current = false; setSaving(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !pending.current) onClose(); }}>
    <DialogContent className="sm:max-w-md rounded-2xl"><DialogHeader><DialogTitle>Reserva — carro {prefixo}</DialogTitle>
      <DialogDescription>Garagem {contexto.garagem} · CI de {contexto.dataOperacao.split('-').reverse().join('/')}</DialogDescription></DialogHeader>
      <fieldset disabled={saving} className="space-y-2 text-sm"><legend className="sr-only">Ação</legend>
        <label className="flex items-center gap-2"><input type="radio" checked={tipo === 'BLOQUEIO_CI'} onChange={() => setTipo('BLOQUEIO_CI')} />Bloquear carro na CI</label>
        <label className="flex items-center gap-2"><input type="radio" checked={tipo === 'JUSTIFICATIVA'} onChange={() => setTipo('JUSTIFICATIVA')} />Outro</label>
      </fieldset>
      <label className="text-sm font-semibold">{tipo === 'BLOQUEIO_CI' ? 'Descrição do problema' : 'Descrição da justificativa'}
        <textarea value={descricao} onChange={event => setDescricao(event.target.value)} maxLength={tipo === 'BLOQUEIO_CI' ? 255 : 1000} disabled={saving} className="mt-2 min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm font-normal" />
      </label>
      <p className="text-xs text-muted-foreground">{tipo === 'BLOQUEIO_CI' ? 'O carro fica na CI desta data com a identificação Bloqueado Portaria.' : 'O carro permanece disponível e recebe o triângulo azul de Justificativas.'}</p>
      <div className="flex justify-end gap-2"><Button variant="outline" disabled={saving} onClick={onClose}>Cancelar</Button>
        <Button disabled={saving || !descricao.trim()} onClick={() => void save()} className="bg-[#164E3A] text-white hover:bg-[#113C2D]">{saving ? 'Salvando...' : 'Salvar'}</Button></div>
    </DialogContent>
  </Dialog>;
}
