import type { PrismaClient } from '@prisma/client';
import { currentReleaseTemplate, currentScaleTemplate, type TemplateContext } from '../data/scheduleTemplates';
import { trafficCommandSchema, trafficContentSchema, trafficModelCommandSchema, type TrafficCommand } from './trafficSchema';
import { canWriteDailyScale } from './operationalAccess';
import { MvpError, operationalContext } from './mvpTemporal';
import { notifyC4Updated } from './c4Events';
import { addDays } from './c4Temporal';
import { effectiveTrafficModel, preserveTrafficModel } from './trafficModelHistory';

type Context = TemplateContext & { dataOperacao: string };
type Reader = Partial<Pick<PrismaClient, 'trafegoProgramacao' | 'trafegoModelo' | 'trafegoModeloVersao'>>;
function contentFields(conteudo: string) {
  const { itens, origemCarros } = trafficContentSchema.parse(JSON.parse(conteudo));
  return { itens, ...(origemCarros ? { origemCarros } : {}) };
}
export async function dateProgramming(db: Reader, tipo: 'ESCALA' | 'SOLTURA', context: Context) {
  return (await resolveDateProgramming(db, tipo, context)).itens;
}
export async function resolveDateProgramming(db: Reader, tipo: 'ESCALA' | 'SOLTURA', context: Context) {
  const record = db.trafegoProgramacao ? await db.trafegoProgramacao.findUnique({
    where: { tipo_garagem_escalaTipo_turno_dataOperacao: { tipo, ...context } },
  }) : null;
  const { dataOperacao: _date, ...base } = context;
  const model = !record && db.trafegoModelo ? await db.trafegoModelo.findUnique({ where: { tipo_garagem_escalaTipo_turno: { tipo, ...base } } }) : null;
  if (model && !db.trafegoModeloVersao) throw new MvpError(503, 'Histórico de modelos indisponível. Atualize a API e aplique o SQL trafego_modelo_versao.');
  const effective = model ? await effectiveTrafficModel({ trafegoModeloVersao: db.trafegoModeloVersao! }, model, context.dataOperacao) : null;
  const content = record || effective ? trafficContentSchema.parse(JSON.parse((record ?? effective)!.conteudo)) : null;
  return { excecao: Boolean(record), recorrente: Boolean(effective), origemCarros: content?.origemCarros, itens: content ? content.itens
    : tipo === 'ESCALA' ? currentScaleTemplate(context) : currentReleaseTemplate(context) };
}
export function trafficCatalog(garagem: 'VCG' | 'VCM') {
  return (['ESCALA', 'SOLTURA'] as const).flatMap(tipo => (['SEG_SEX', 'SABADO', 'DOM_FER'] as const).flatMap(escalaTipo => {
    const turns = escalaTipo !== 'SEG_SEX' ? ['PADRAO'] as const : tipo === 'SOLTURA' ? ['MATUTINO', 'VESPERTINO'] as const : ['MATUTINO'] as const;
    return turns.map(turno => {
      const contexto = { garagem, escalaTipo, turno };
      return { chave: `${tipo}_${garagem}_${escalaTipo}_${turno}`, tipo, contexto,
        nome: `${tipo === 'ESCALA' ? 'Escala' : 'Soltura'} ${garagem} · ${escalaTipo === 'SEG_SEX' ? 'Seg–Sex' : escalaTipo === 'SABADO' ? 'Sábado' : 'Dom/Fer'} · ${turno === 'MATUTINO' ? 'Matutino' : turno === 'VESPERTINO' ? 'Vespertino' : 'Padrão'}`,
        itens: tipo === 'ESCALA' ? currentScaleTemplate(contexto) : currentReleaseTemplate(contexto) };
    });
  }));
}
async function authorize(db: Pick<PrismaClient, 'user'>, userId: number | undefined, garagem: string) {
  const user = userId ? await db.user.findUnique({ where: { id: userId }, select: { role: true, garagem: true } }) : null;
  if (!canWriteDailyScale(user, garagem)) throw new MvpError(403, 'Tráfego exige administrador ou perfil Soltura da própria garagem.');
}
export async function listTraffic(db: PrismaClient, userId: number | undefined, garagem: unknown) {
  if (garagem !== 'VCG' && garagem !== 'VCM') throw new MvpError(400, 'Informe a garagem.');
  await authorize(db, userId, garagem);
  const records = await db.trafegoProgramacao.findMany({ where: { garagem }, orderBy: [{ dataOperacao: 'desc' }, { nome: 'asc' }] });
  const models = db.trafegoModelo ? await db.trafegoModelo.findMany({ where: { garagem } }) : [];
  const padroes = trafficCatalog(garagem).map(base => {
    const model = models.find(item => item.tipo === base.tipo && item.escalaTipo === base.contexto.escalaTipo && item.turno === base.contexto.turno);
    return { ...base, revisao: model?.revisao ?? 0, funcionamento: 'RECORRENTE' as const,
      ...(model ? { nome: model.nome, ...contentFields(model.conteudo) } : {}) };
  });
  return { padroes, excecoes: records.map(record => ({
    tipo: record.tipo, nome: record.nome, revisao: record.revisao,
    contexto: { garagem: record.garagem, escalaTipo: record.escalaTipo, turno: record.turno, dataOperacao: record.dataOperacao },
    ...contentFields(record.conteudo),
  })) };
}
export function assertTrafficDate(command: TrafficCommand, now: Date) {
  const today = operationalContext(now).today;
  if (command.contexto.dataOperacao < today || (command.tipo === 'ESCALA' && command.contexto.dataOperacao === today))
    throw new MvpError(409, 'Escalas exigem data futura; solturas permitem hoje ou data futura.');
}
export async function saveTraffic(db: PrismaClient, userId: number | undefined, value: unknown, clock = () => new Date()) {
  if (value && typeof value === 'object' && 'funcionamento' in value && value.funcionamento === 'RECORRENTE') return saveTrafficModel(db, userId, value, clock);
  const command = trafficCommandSchema.parse(value), { contexto, tipo, nome, itens, revisao } = command;
  const origin = command.origem ?? contexto;
  if (origin.garagem !== contexto.garagem) throw new MvpError(400, 'A mudança de data deve manter a garagem.');
  assertTrafficDate(command, clock());
  assertTrafficDate({ ...command, contexto: origin }, clock());
  await authorize(db, userId, contexto.garagem);
  const result = await db.$transaction(async tx => {
    await authorize(tx, userId, contexto.garagem);
    // Mesma ordem dos inícios: escala -> soltura -> programação. Locks de faixa também cobrem ausência.
    const contexts = [...new Map([origin, contexto].map(c => [JSON.stringify(c), c])).values()]
      .sort((a, b) => a.dataOperacao.localeCompare(b.dataOperacao) || a.escalaTipo.localeCompare(b.escalaTipo) || a.turno.localeCompare(b.turno));
    for (const day of [...new Set(contexts.map(c => c.dataOperacao))])
      await tx.$queryRaw`SELECT id FROM dbo.escala_diaria WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${contexto.garagem} AND data_operacao=${day}`;
    for (const c of contexts) {
      await tx.$queryRaw`SELECT id FROM dbo.soltura_folha WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${c.garagem} AND escala_tipo=${c.escalaTipo} AND turno=${c.turno} AND data_operacao=${c.dataOperacao}`;
      if (tipo === 'ESCALA' && await tx.escalaDiaria.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: c } })
        || tipo === 'SOLTURA' && (await tx.folhaSoltura.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: c } })
          || await tx.soltura.findFirst({ where: c, select: { id: true } })))
        throw new MvpError(409, 'Operação já iniciada na origem ou destino. A programação utilizada deve ser preservada.');
    }
    for (const c of contexts)
      await tx.$queryRaw`SELECT id FROM dbo.trafego_programacao WITH (UPDLOCK,HOLDLOCK) WHERE tipo=${tipo} AND garagem=${c.garagem} AND escala_tipo=${c.escalaTipo} AND turno=${c.turno} AND data_operacao=${c.dataOperacao}`;
    const lookup = (c: Context) => ({ tipo_garagem_escalaTipo_turno_dataOperacao: { tipo, ...c } });
    const old = await tx.trafegoProgramacao.findUnique({ where: lookup(origin) });
    const moved = contexts.length > 1;
    if (command.origem && !old) throw new MvpError(409, 'Programação de origem não encontrada. Recarregue.');
    if ((old?.revisao ?? 0) !== revisao) throw new MvpError(409, 'Programação alterada em outro posto. Recarregue e revise.');
    if (moved && await tx.trafegoProgramacao.findUnique({ where: lookup(contexto) })) throw new MvpError(409, 'Já existe programação na data de destino. Nenhum cadastro foi sobrescrito.');
    const data = { nome, revisao: revisao + 1, conteudo: JSON.stringify({ version: 1, itens, ...(command.origemCarros ? { origemCarros: command.origemCarros } : {}) }), responsavelId: userId! };
    assertTrafficDate(command, clock());
    if (old) await tx.trafegoProgramacao.update({ where: { id: old.id }, data: { ...data, ...contexto } });
    else await tx.trafegoProgramacao.create({ data: { tipo, ...contexto, ...data } });
    assertTrafficDate(command, clock());
    assertTrafficDate({ ...command, contexto: origin }, clock());
    return { ...command, revisao: data.revisao, ...(command.origem ? { origem: contexto } : {}) };
  }, { isolationLevel: 'Serializable' });
  await notifyC4Updated(contexto.garagem, addDays(contexto.dataOperacao, -1));
  if (origin.dataOperacao !== contexto.dataOperacao) await notifyC4Updated(origin.garagem, addDays(origin.dataOperacao, -1));
  return result;
}

async function saveTrafficModel(db: PrismaClient, userId: number | undefined, value: unknown, clock: () => Date) {
  const command = trafficModelCommandSchema.parse(value), { tipo, contexto, nome, itens, revisao } = command;
  await authorize(db, userId, contexto.garagem);
  const result = await db.$transaction(async tx => {
    await authorize(tx, userId, contexto.garagem);
    await tx.$queryRaw`SELECT id FROM dbo.trafego_modelo WITH (UPDLOCK,HOLDLOCK) WHERE tipo=${tipo} AND garagem=${contexto.garagem} AND escala_tipo=${contexto.escalaTipo} AND turno=${contexto.turno}`;
    const where = { tipo_garagem_escalaTipo_turno: { tipo, ...contexto } };
    const old = await tx.trafegoModelo.findUnique({ where });
    if ((old?.revisao ?? 0) !== revisao) throw new MvpError(409, 'Modelo recorrente alterado em outro posto ou já cadastrado. Recarregue e revise.');
    if (old) await preserveTrafficModel(tx, old);
    const savedAt = clock();
    const vigenteDesde = operationalContext(savedAt).today;
    if (old && old.updatedAt > savedAt) throw new MvpError(409, 'Data da alteração anterior está no futuro. Revise o relógio antes de salvar.');
    const data = { nome, conteudo: JSON.stringify({ version: 1, itens, ...(command.origemCarros ? { origemCarros: command.origemCarros } : {}) }), revisao: revisao + 1, responsavelId: userId!, updatedAt: savedAt };
    const saved = old ? await tx.trafegoModelo.update({ where: { id: old.id }, data })
      : await tx.trafegoModelo.create({ data: { tipo, ...contexto, ...data } });
    await tx.trafegoModeloVersao.create({ data: { modeloId: saved.id, revisao: data.revisao,
      vigenteDesde, nome, conteudo: data.conteudo, responsavelId: userId!, createdAt: savedAt } });
    if (operationalContext(clock()).today !== vigenteDesde) throw new MvpError(409, 'A data mudou durante a gravação. Recarregue e salve novamente.');
    return { ...command, revisao: data.revisao };
  }, { isolationLevel: 'Serializable' });
  await notifyC4Updated(contexto.garagem, addDays(operationalContext(clock()).today, -1));
  return result;
}
