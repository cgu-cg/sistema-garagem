import { operationalContext } from './mvpTemporal';
// Preferencia de navegacao; nao cria folhas nem acompanha o relogio depois da selecao.
export function initialCIDate(now = new Date()) {
 const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Campo_Grande', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now);
 const get = (key: string) => parts.find(p => p.type === key)!.value;
 const date = new Date(get('year') + '-' + get('month') + '-' + get('day') + 'T12:00:00Z');
 if (Number(get('hour')) >= 3) date.setUTCDate(date.getUTCDate()+1);
 return date.toISOString().slice(0,10);
}

// Selecao manual ou inicial ja fixada prevalece ate sair da tela; recarga usa null.
export function ciSelectionDate(selected: string | null, c4: boolean, now = new Date()) {
 return selected ?? (c4 ? initialCIDate(now) : operationalContext(now).today);
}
