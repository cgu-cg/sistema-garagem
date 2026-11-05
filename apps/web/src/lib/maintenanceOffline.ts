import { z } from 'zod';

export const maintenanceItemSchema = z.object({ id: z.string(), prefixo: z.string(), consorciada: z.enum(['VCG', 'VCM', 'VSF', 'JTU']),
  data: z.string(), observacao: z.string().nullable(), observacaoBloqueio: z.string().nullish(), observacaoOficina: z.string().nullish(),
  bloqueado: z.boolean(), emExecucao: z.boolean(), liberado: z.boolean(), usadoPortaria: z.boolean().optional(),
  saidasPortaria: z.array(z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)).max(1440).optional(),
  viagensPortaria: z.array(z.object({ saidaGaragem: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    linha: z.string().min(1).max(100), tabela: z.string().max(100) }).strict()).max(2000).optional() });
export const maintenanceSnapshotSchema = z.object({ garagem: z.enum(['VCG', 'VCM']), data: z.string(), revisao: z.number().int().nonnegative(),
  base: z.string(), items: z.array(maintenanceItemSchema), origem: z.enum(['PERSISTIDA', 'VIRADA', 'LEGADO', 'VAZIA']) });
export type MaintenanceSnapshot = z.infer<typeof maintenanceSnapshotSchema>;
export type MaintenanceCommand = { garagem: 'VCG' | 'VCM'; data: string; base: string; items: MaintenanceSnapshot['items']; operacaoId: string; confirmRelease: boolean; operacao?: 'USADO_PORTARIA' };
export type MaintenanceLocal = { snapshot: MaintenanceSnapshot; confirmed?: MaintenanceSnapshot; queue: MaintenanceCommand[]; issue: string; offline: boolean; notice?: string };
type Dependencies = {
  get: (key: string) => Promise<MaintenanceLocal | null>; put: (key: string, value: MaintenanceLocal) => Promise<void>;
  read: () => Promise<unknown>; send: (value: MaintenanceCommand) => Promise<unknown>;
  online: () => boolean; uuid: () => string;
  today?: () => string; seed?: () => Promise<MaintenanceSnapshot>;
};
// Uma escrita IndexedDB guarda fotografia e fila juntas; nenhuma credencial e persistida.
export function createMaintenanceOffline(key: string, garage: 'VCG' | 'VCM', day: string, deps: Dependencies) {
  let chain = Promise.resolve();
  function exclusive<T>(fn: () => Promise<T>): Promise<T> { const next = chain.then(fn); chain = next.then(() => {}, () => {}); return next; }
  function validate(value: unknown) {
    const snapshot = maintenanceSnapshotSchema.parse(value);
    if (snapshot.garagem !== garage || snapshot.data !== day) throw Error('Controle retornou outra garagem/data.');
    return snapshot;
  }
  async function expire(local: MaintenanceLocal) {
    if (!local.queue.length || !deps.today || day >= deps.today()) return local;
    const count = local.queue.length;
    const next = { ...local, snapshot: local.confirmed ?? { ...local.snapshot, items: [], revisao: 0, base: 'EXPIRADA', origem: 'VAZIA' as const },
      queue: [], issue: '', notice: `${count} alteracao(oes) de ${day} nao sincronizada(s) no dia foram descartadas.` };
    await deps.put(key, next); return next;
  }
  async function flush(local: MaintenanceLocal) {
    local = await expire(local);
    if (!deps.online()) return { ...local, offline: true };
    local = { ...local, queue: [...local.queue], issue: '', offline: false };
    while (local.queue.length) {
      local = await expire(local);
      if (!local.queue.length) break;
      try {
        const saved = validate(await deps.send(local.queue[0]));
        local.confirmed = saved;
        local.queue.shift();
        // Nao apaga a fotografia das alteracoes seguintes ainda nao enviadas.
        if (!local.queue.length) local.snapshot = saved;
        await deps.put(key, local);
      } catch (error) {
        const status = (error as { status?: number }).status;
        local.issue = error instanceof Error ? error.message : 'Sincronizacao pendente.';
        local.offline = !status || status >= 500;
        await deps.put(key, local);
        break;
      }
    }
    return local;
  }
  return {
    expire: () => exclusive(async () => { const local = await deps.get(key); if (!local) return 0;
      const next = await expire(local); return local.queue.length - next.queue.length; }),
    load: () => exclusive(async () => {
      let local = await deps.get(key);
      if (local) local = await expire(local);
      if (!local && deps.seed) {
        const snapshot = validate(await deps.seed());
        local = { snapshot, confirmed: snapshot, queue: [], issue: '', offline: true };
        await deps.put(key, local);
      }
      if (local?.queue.length) { local = await flush(local); await deps.put(key, local); return local; }
      if (!deps.online()) { if (!local) throw Error('Abra este Controle com conexao antes de usar offline.'); return { ...local, offline: true }; }
      try {
        const snapshot = validate(await deps.read());
        local = { snapshot, confirmed: snapshot, queue: [], issue: '', offline: false, notice: local?.notice };
        await deps.put(key, local); return local;
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (!local || (status && status < 500)) throw error;
        return { ...local, offline: true, issue: 'Sem conexao com a API. Exibindo copia local.' };
      }
    }),
    save: (items: MaintenanceSnapshot['items'], confirmed: boolean, baseline: MaintenanceSnapshot['items'], operacao?: 'USADO_PORTARIA') => exclusive(async () => {
      const local = await deps.get(key);
      if (!local) throw Error('Carregue o Controle antes de alterar.');
      if (deps.today && day !== deps.today()) throw Error('Alteracoes somente no dia atual.');
      if (local.issue && !local.offline) throw Error('Revise a pendencia antes de continuar.');
      if (JSON.stringify(z.array(maintenanceItemSchema).parse(local.snapshot.items)) !== JSON.stringify(z.array(maintenanceItemSchema).parse(baseline)))
        throw Error('Controle atualizado enquanto o formulario estava aberto. Reabra para revisar.');
      const command: MaintenanceCommand = { garagem: garage, data: day, base: local.snapshot.base,
        items: z.array(maintenanceItemSchema).parse(items), confirmRelease: confirmed, operacaoId: deps.uuid(), ...(operacao ? { operacao } : {}) };
      const next: MaintenanceLocal = { confirmed: local.confirmed ?? (local.queue.length ? undefined : local.snapshot), snapshot: { ...local.snapshot, items: command.items,
        revisao: local.snapshot.revisao + 1, base: String(local.snapshot.revisao + 1) }, queue: [...local.queue, command], issue: '', offline: !deps.online() };
      await deps.put(key, next); // Exibe sucesso local somente apos commit no IndexedDB.
      return flush(next);
    }),
    discard: () => exclusive(async () => {
      // Consulta primeiro: uma falha nao perde a fila antiga.
      const snapshot = validate(await deps.read());
      const next = { snapshot, confirmed: snapshot, queue: [], issue: '', offline: false };
      await deps.put(key, next); return next;
    }),
  };
}
