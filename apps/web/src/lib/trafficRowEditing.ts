import { trafficRowSchema, type TrafficRow } from './trafficSchema';

export function renumberTrafficRows(rows: TrafficRow[]): TrafficRow[] {
  return rows.map((row, index) => row.ordem === index + 1 ? row : { ...row, ordem: index + 1 });
}

export function moveTrafficRow(rows: TrafficRow[], id: string, position: number): TrafficRow[] {
  const from = rows.findIndex(row => row.id === id);
  if (from < 0 || !Number.isInteger(position)) return rows;
  const to = Math.max(0, Math.min(position, rows.length - 1));
  if (from === to) return rows;
  const next = [...rows]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved);
  return renumberTrafficRows(next);
}

export function confirmTrafficRow(rows: TrafficRow[], id: string): TrafficRow[] {
  const row = rows.find(item => item.id === id);
  if (!row) throw Error('Linha não encontrada.');
  trafficRowSchema.parse(row);
  return row.ordem !== undefined && row.ordem >= 1 ? moveTrafficRow(rows, id, row.ordem - 1) : rows;
}
