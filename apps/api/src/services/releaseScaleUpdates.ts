type Row = { id: string; carroProgramado: string };
type Record = { scheduleId: string | null; status: string | null; carroProgramado: string | null };

// Política fotografada ao iniciar: não depende de edições futuras do modelo.
export function scaleLinkedReleaseIds(rows: Row[], explicit: boolean, recurring: boolean, linked: boolean) {
  return rows.filter(row => linked || !explicit && (!recurring || !row.carroProgramado)).map(row => row.id);
}

export function refreshPendingScaleCars<T extends Row>(rows: T[], current: Row[], linkedIds: string[], records: Record[]) {
  const linked = new Set(linkedIds), byId = new Map(current.map(row => [row.id, row.carroProgramado]));
  return rows.map(row => {
    const saved = records.filter(record => record.scheduleId === row.id);
    // Despacho existente é histórico operacional e nunca é reprogramado pela origem.
    if (saved.some(record => record.status === 'LIBERADO' || record.status === 'SUBSTITUIDO')) return row;
    return linked.has(row.id) && byId.has(row.id) ? { ...row, carroProgramado: byId.get(row.id)! } : row;
  });
}
