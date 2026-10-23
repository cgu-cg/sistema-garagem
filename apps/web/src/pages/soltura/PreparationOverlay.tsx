import type { ReactNode } from 'react';
import { LockKeyhole } from 'lucide-react';
import { cn } from '@/lib/utils';

export function releasePreparationMessage(ciFinalizada: boolean, escalaFinalizada: boolean) {
  if (!ciFinalizada && !escalaFinalizada) return 'Finalize a CI e a Escala de Carros desta data para liberar a Soltura.';
  if (!ciFinalizada) return 'Finalize a CI desta data para liberar a Soltura.';
  if (!escalaFinalizada) return 'Finalize a Escala de Carros desta data para liberar a Soltura.';
  return null;
}

// Aviso local: os seletores fora desta area continuam acessiveis.
export function PreparationOverlay({ title, message, children, className }: {
  title: string; message?: ReactNode; children: ReactNode; className?: string;
}) {
  const blocked = Boolean(message);
  // React 18 transmite o atributo HTML inert como string vazia.
  const inertProps = blocked ? { inert: '' } : {};
  return <div className={cn('relative isolate', className)}>
    <div {...inertProps} aria-hidden={blocked || undefined} className={cn(blocked && 'pointer-events-none select-none blur-sm print:blur-none')}>
      {children}
    </div>
    {blocked && <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/20 p-4 print:hidden">
      <div role="status" aria-live="polite" className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center text-card-foreground shadow-xl">
        <LockKeyhole aria-hidden="true" className="mx-auto mb-3 h-6 w-6 text-emerald-700 dark:text-emerald-400" />
        <p className="text-base font-bold">{title}</p>
        <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</div>
      </div>
    </div>}
  </div>;
}
