// Janela exclusiva da Escala de Carros; não muda a data civil da CI/Soltura.
export function dailyScaleWindow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Campo_Grande',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)!.value;
  const today = `${get('year')}-${get('month')}-${get('day')}`;
  const beforeCutoff = Number(get('hour')) < 6;
  const next = new Date(`${today}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return { today, beforeCutoff, preparationDate: beforeCutoff ? today : next.toISOString().slice(0, 10) };
}

export function canEditScaleDate(date: string, now = new Date()) {
  const { today, beforeCutoff } = dailyScaleWindow(now);
  return date > today || date === today && beforeCutoff;
}
