import { useState, type InputHTMLAttributes } from 'react';
import type { DailyEscala } from '@/lib/sharedEscala';
import { Input } from '@/components/ui/input';
import { CiVehicleNotice } from './CiVehicleNotice';
import { ScaleVehiclePrefix } from './ScaleVehiclePrefix';

// Mantem o input nativo para edicao/atalhos; o texto sobreposto permite duas cores.
export function FleetVehicleInput({ fleetState, value, defaultValue, onChange, className = '', ...props }:
  InputHTMLAttributes<HTMLInputElement> & { fleetState: DailyEscala | null }) {
  const [draft, setDraft] = useState(String(defaultValue ?? ''));
  const text = value === undefined ? draft : String(value);
  return <CiVehicleNotice state={fleetState} prefixo={text.trim()}>
    <span className="relative inline-flex items-center justify-center text-xs font-mono">
      <Input {...props} value={text} className={className + ' !text-transparent caret-foreground placeholder:text-muted-foreground'}
        onChange={event => { setDraft(event.target.value); onChange?.(event); }} />
      <span aria-hidden="true" className="pointer-events-none absolute z-10 inset-0 flex items-center justify-center">
        <ScaleVehiclePrefix state={fleetState} prefixo={text} />
      </span>
    </span>
  </CiVehicleNotice>;
}
