import { useState } from 'react';
import { BusFront, Check, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ScaleWithdrawal } from '@/lib/sharedEscala';

const defects = ['MOTOR', 'MECÂNICA', 'SINISTRO', 'CÂMBIO', 'MODULO', 'COXIM MOTOR', 'VIDRO DA JANELA', 'RADIADOR', 'PNEU FURADO'];

export function ScaleSubstitutionDialog({ prefixo, substituto, reserveUnavailable, saving, onCancel, onSave }: {
  prefixo: string; substituto: string; reserveUnavailable?: string; saving: boolean;
  onCancel: () => void; onSave: (retirada: ScaleWithdrawal) => void;
}) {
  const [destino, setDestino] = useState<ScaleWithdrawal['destino'] | ''>('');
  const [motivo, setMotivo] = useState('');
  return <Dialog open onOpenChange={open => { if (!open && !saving) onCancel(); }}>
    <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card p-5 shadow-2xl"
      onEscapeKeyDown={e => { if (saving) e.preventDefault(); }} onPointerDownOutside={e => { if (saving) e.preventDefault(); }}>
      <DialogHeader className="space-y-1.5 text-left">
        <DialogTitle className="flex items-center gap-2 pr-6 text-base font-bold"><BusFront className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />Substituição de carro</DialogTitle>
        <DialogDescription className="text-xs">O carro {substituto} assumiu a linha. Informe o destino do carro {prefixo}. Para bloquear, informe a observação ou defeito.</DialogDescription>
      </DialogHeader>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (!saving && destino && (destino === 'RESERVA' || motivo.trim()) && !(destino === 'RESERVA' && reserveUnavailable)) onSave({ prefixo, destino, motivo: destino === 'RESERVA' ? '' : motivo.trim() }); }}>
        <fieldset disabled={saving} className="space-y-2">
          <legend className="mb-2 text-[11px] font-bold uppercase text-muted-foreground">Destino do carro {prefixo} <span className="text-rose-500">*</span></legend>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-muted/20 p-3 text-xs has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-500/10">
            <input type="radio" name="destino" value="RESERVA" checked={destino === 'RESERVA'} disabled={Boolean(reserveUnavailable)} onChange={() => setDestino('RESERVA')} required />
            <BusFront aria-hidden="true" className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />Colocar carro na reserva
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-muted/20 p-3 text-xs has-[:checked]:border-rose-500 has-[:checked]:bg-rose-500/10">
            <input type="radio" name="destino" value="BLOQUEAR" checked={destino === 'BLOQUEAR'} onChange={() => setDestino('BLOQUEAR')} required />
            <ShieldAlert aria-hidden="true" className="h-4 w-4 text-rose-600" />Bloquear carro
          </label>
          {reserveUnavailable && <p role="status" className="text-xs text-rose-600">{reserveUnavailable}</p>}
        </fieldset>
        {destino === 'BLOQUEAR' && <div className="space-y-2">
          <label htmlFor="motivo-substituicao" className="text-xs font-bold uppercase text-muted-foreground">Observação / Defeito <span className="text-rose-500">*</span></label>
          <input id="motivo-substituicao" value={motivo} onChange={e => setMotivo(e.target.value)} maxLength={1000} required disabled={saving}
            placeholder="Ex: MOTOR, MECÂNICA, CÂMBIO, ELEVADOR..." className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-700/30" />
          <div className="flex flex-wrap gap-1">{defects.map(defect => <button key={defect} type="button" disabled={saving}
            onClick={() => setMotivo(defect)} className="cursor-pointer rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground hover:bg-muted/80 disabled:cursor-default">{defect}</button>)}</div>
        </div>}
        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <Button type="button" variant="ghost" className="rounded-xl text-xs" disabled={saving} onClick={onCancel}>Cancelar</Button>
          <Button type="submit" className="rounded-xl bg-[#164E3A] text-xs text-white hover:bg-[#113C2D]" disabled={saving || !destino || (destino === 'BLOQUEAR' && !motivo.trim()) || (destino === 'RESERVA' && Boolean(reserveUnavailable))}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}Salvar substituição
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
