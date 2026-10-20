import { z } from 'zod';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const colors = ['OUTRO', 'AZUL', 'PRATA', 'VERMELHO', 'VERMELHO/AZUL', 'EXECUTIVO', 'NAO IDENTIFICADO'] as const;
export type FleetColor = typeof colors[number];
const cacheSchema = z.object({ version: z.literal(1), updatedAt: z.string().datetime(), scheduledMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  vehicles: z.array(z.object({ idCarro: z.string().regex(/^\d+$/), cor: z.enum(colors) }).strict()).min(1),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.vehicles.map(v => v.idCarro)).size !== value.vehicles.length)
    ctx.addIssue({ code: 'custom', message: 'Veiculos duplicados.' });
});
export type FleetColorCache = z.infer<typeof cacheSchema>;

export function colorForCode(code: number | null): FleetColor {
  if (code === null) return 'OUTRO';
  return ({ 1: 'AZUL', 3: 'PRATA', 4: 'VERMELHO', 5: 'VERMELHO/AZUL', 6: 'EXECUTIVO' } as Record<number, FleetColor>)[code] || 'NAO IDENTIFICADO';
}

export function buildColorCache(rows: unknown, now = new Date(), scheduledMonth?: string): FleetColorCache {
  const parsed = z.array(z.object({ idCarro: z.coerce.number().int().positive().lt(6000), carroceriaFAIXA: z.number().int().nullable() })).min(1).parse(rows);
  if (parsed.some(v => [1999, 2999, 3999, 4999].includes(v.idCarro))) throw new Error('FROTA_INVALIDA');
  return cacheSchema.parse({ version: 1, updatedAt: now.toISOString(), scheduledMonth,
    vehicles: parsed.map(v => ({ idCarro: String(v.idCarro), cor: colorForCode(v.carroceriaFAIXA) }))
      .sort((a, b) => Number(a.idCarro) - Number(b.idCarro)) });
}

// Veiculos continua sendo a fonte de existencia/garagem; este arquivo guarda somente cores.
export function vehicleColor(cache: FleetColorCache | null, idCarro: string | number): FleetColor {
  return cache?.vehicles.find(v => v.idCarro === String(idCarro))?.cor ?? 'OUTRO';
}

export async function readColorCache(file: string): Promise<FleetColorCache | null> {
  try { return cacheSchema.parse(JSON.parse(await readFile(file, 'utf8'))); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw new Error('CACHE_CORES_INVALIDO'); }
}

export async function writeColorCache(file: string, cache: FleetColorCache) {
  const validated = cacheSchema.parse(cache);
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = file + '.' + randomUUID() + '.tmp';
  try {
    await writeFile(temporary, JSON.stringify(validated, null, 2) + '\n', { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    await rename(temporary, file);
  } finally { await unlink(temporary).catch(() => undefined); }
}

export function createColorUpdater(file: string, load: () => Promise<unknown>, now = () => new Date()) {
  let pending: Promise<FleetColorCache> | undefined;
  return (scheduledMonth?: string): Promise<FleetColorCache> => {
    if (pending) return pending;
    pending = (async () => {
      const rows = await load();
      const cache = buildColorCache(rows, now(), scheduledMonth);
      await writeColorCache(file, cache);
      return cache;
    })().finally(() => { pending = undefined; });
    return pending;
  };
}
