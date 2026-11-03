import type { PrismaClient } from '@prisma/client';
import { currentReleaseTemplate, currentScaleTemplate, type TemplateContext } from '../data/scheduleTemplates';
import { trafficCommandSchema, trafficRowsSchema, type TrafficCommand } from './trafficSchema';
import { canWriteDailyScale } from './operationalAccess';
import { MvpError, operationalContext } from './mvpTemporal';
import { notifyC4Updated } from './c4Events';
import { addDays } from './c4Temporal';

type Context = TemplateContext & { dataOperacao: string };
type Reader = Partial<Pick<PrismaClient, 'trafegoProgramacao'>>;
export async function dateProgramming(db: Reader, tipo: 'ESCALA' | 'SOLTURA', context: Context) {
  return (await resolveDateProgramming(db, tipo, context)).itens;
}
export async function resolveDateProgramming(db: Reader, tipo: 'ESCALA' | 'SOLTURA', context: Context) {
  const record = db.trafegoProgramacao ? await db.trafegoProgramacao.findUnique({
    where: { tipo_garagem_escalaTipo_turno_dataOperacao: { tipo, ...context } },
  }) : null;
  return { excecao: Boolean(record), itens: record ? trafficRowsSchema.parse(JSON.parse(record.conteudo).itens)
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
  return { padroes: trafficCatalog(garagem), excecoes: records.map(record => ({
    tipo: record.tipo, nome: record.nome, revisao: record.revisao,
    contexto: { garagem: record.garagem, escalaTipo: record.escalaTipo, turno: record.turno, dataOperacao: record.dataOperacao },
    itens: trafficRowsSchema.parse(JSON.parse(record.conteudo).itens),
  })) };
}
export function assertTrafficDate(command: TrafficCommand, now: Date) {
  const today = operationalContext(now).today;
  if (command.contexto.dataOperacao < today || (command.tipo === 'ESCALA' && command.contexto.dataOperacao === today))
    throw new MvpError(409, 'Escalas exigem data futura; solturas permitem hoje ou data futura.');
}
export async function saveTraffic(db: PrismaClient, userId: number | undefined, value: unknown, clock = () => new Date()) {
  const command = trafficCommandSchema.parse(value), { contexto, tipo, nome, itens, revisao } = command;
  assertTrafficDate(command, clock());
  await authorize(db, userId, contexto.garagem);
  const result = await db.$transaction(async tx => {
    await authorize(tx, userId, contexto.garagem);
    // Mesma ordem dos inícios: escala -> soltura -> programação. Locks de faixa também cobrem ausência.
    await tx.$queryRaw`SELECT id FROM dbo.escala_diaria WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${contexto.garagem} AND data_operacao=${contexto.dataOperacao}`;
    await tx.$queryRaw`SELECT id FROM dbo.soltura_folha WITH (UPDLOCK,HOLDLOCK) WHERE garagem=${contexto.garagem} AND escala_tipo=${contexto.escalaTipo} AND turno=${contexto.turno} AND data_operacao=${contexto.dataOperacao}`;
    if (tipo === 'ESCALA' && await tx.escalaDiaria.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: contexto } })
      || tipo === 'SOLTURA' && (await tx.folhaSoltura.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: contexto } })
        || await tx.soltura.findFirst({ where: contexto, select: { id: true } })))
      throw new MvpError(409, 'Operação já iniciada. A programação utilizada deve ser preservada.');
    await tx.$queryRaw`SELECT id FROM dbo.trafego_programacao WITH (UPDLOCK,HOLDLOCK) WHERE tipo=${tipo} AND garagem=${contexto.garagem} AND escala_tipo=${contexto.escalaTipo} AND turno=${contexto.turno} AND data_operacao=${contexto.dataOperacao}`;
    const where = { tipo_garagem_escalaTipo_turno_dataOperacao: { tipo, ...contexto } };
    const old = await tx.trafegoProgramacao.findUnique({ where });
    if ((old?.revisao ?? 0) !== revisao) throw new MvpError(409, 'Programação alterada em outro posto. Recarregue e revise.');
    const data = { nome, revisao: revisao + 1, conteudo: JSON.stringify({ version: 1, itens }), responsavelId: userId! };
    assertTrafficDate(command, clock());
    if (old) await tx.trafegoProgramacao.update({ where: { id: old.id }, data });
    else await tx.trafegoProgramacao.create({ data: { tipo, ...contexto, ...data } });
    assertTrafficDate(command, clock());
    return { ...command, revisao: data.revisao };
  }, { isolationLevel: 'Serializable' });
  await notifyC4Updated(contexto.garagem, addDays(contexto.dataOperacao, -1));
  return result;
}
