export function focusNextReleaseCar(row: HTMLTableRowElement) {
  const rows = Array.from(row.closest('table')?.querySelectorAll<HTMLTableRowElement>('tr[data-release-row]') ?? []);
  const index = rows.indexOf(row);
  if (index < 0) return;
  for (const next of rows.slice(index + 1)) {
    const input = next.querySelector<HTMLInputElement>('input[data-release-car]:not(:disabled)');
    if (!input) continue;
    input.focus({ preventScroll: true });
    input.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    return;
  }
}

export async function confirmReleaseWithKeyboard(row: HTMLTableRowElement, save: () => Promise<boolean>,
  scheduleFrame: (callback: FrameRequestCallback) => number = requestAnimationFrame) {
  if (!await save()) return;
  // Espera a troca dos inputs pelo estado confirmado, sem avancar no mesmo Enter.
  scheduleFrame(() => {
    if (row.isConnected) row.querySelector<HTMLButtonElement>('button[data-release-confirmed]')?.focus({ preventScroll: true });
  });
}
