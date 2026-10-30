import type { DailyEscala } from '@/lib/sharedEscala';

export function ScaleVehiclePrefix({ state, prefixo, struck = false }: { state: DailyEscala | null; prefixo: string; struck?: boolean }) {
  const color = state?.coresFrota?.[prefixo];
  const strike = struck ? ' line-through decoration-current' : '';
  if (color === 'VERMELHO/AZUL') return <span className="font-bold whitespace-nowrap"><span className={'text-rose-600 dark:text-rose-400' + strike}>{prefixo.slice(0, 2)}</span><span className={'text-sky-600 dark:text-sky-400' + strike}>{prefixo.slice(2)}</span></span>;
  const className = color === 'VERMELHO' ? 'text-rose-600 dark:text-rose-400'
    : color === 'AZUL' ? 'text-sky-600 dark:text-sky-400'
    : color === 'PRATA' ? 'text-slate-500 dark:text-slate-300'
    : color === 'EXECUTIVO' ? 'text-amber-600 dark:text-amber-400' : 'text-foreground';
  return <span className={'font-bold ' + className + strike}>{prefixo}</span>;
}
