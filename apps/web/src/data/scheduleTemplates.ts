import vcmReleaseMatutino from './soltura/vcm/seg-sex-matutino.json';
import escalaSegSex from './escala-carros/vcg/seg-sex.json';
import escalaSabado from './escala-carros/vcg/sabado.json';
import escalaDomingo from './escala-carros/vcg/domingo-feriado.json';
import solturaMatutino from './soltura/vcg/seg-sex-matutino.json';
import solturaVespertino from './soltura/vcg/seg-sex-vespertino.json';
import solturaSabado from './soltura/vcg/sabado.json';
import solturaDomingo from './soltura/vcg/domingo-feriado.json';
import vcmScaleSegSex from './escala-carros/vcm/seg-sex.json';
import vcmScaleSabado from './escala-carros/vcm/sabado.json';
import vcmScaleDomingo from './escala-carros/vcm/domingo-feriado.json';
import vcmReleaseSegSex from './soltura/vcm/seg-sex.json';
import vcmReleaseSabado from './soltura/vcm/sabado.json';
import vcmReleaseDomingo from './soltura/vcm/domingo-feriado.json';
import retired from './retiredScaleRows.json';

export interface TemplateContext {
  garagem: 'VCG' | 'VCM'; escalaTipo: 'SEG_SEX' | 'SABADO' | 'DOM_FER'; turno: 'MATUTINO' | 'VESPERTINO' | 'PADRAO';
}
export interface TemplateRow {
  id: string; ordem?: number; ordemTerminal?: number; linha: string; tabela: string;
  saidaGaragem: string; chegadaGaragem?: string; inicioLinha?: string; inicioBairro?: string;
  carroProgramado: string; status?: string; observacoes?: string;
  tipo?: 'REGULAR' | 'VCM' | 'FRETAMENTO' | 'EXTRA';
}
const rows = (value: unknown) => value as TemplateRow[];
export function retiredScaleRows(context: TemplateContext) {
  return retired[`${context.garagem}_${context.escalaTipo}_${context.turno}` as keyof typeof retired];
}
export function currentScaleTemplate(context: TemplateContext): TemplateRow[] {
  if (context.garagem === 'VCM') return rows(context.escalaTipo === 'SEG_SEX' ? vcmScaleSegSex : context.escalaTipo === 'SABADO' ? vcmScaleSabado : vcmScaleDomingo);
  return rows(context.escalaTipo === 'SEG_SEX' ? escalaSegSex : context.escalaTipo === 'SABADO' ? escalaSabado : escalaDomingo);
}
export function currentReleaseTemplate(context: TemplateContext): TemplateRow[] {
  if (context.garagem === 'VCM') return rows(context.escalaTipo === 'SEG_SEX' ? (context.turno === 'MATUTINO' ? vcmReleaseMatutino : vcmReleaseSegSex) : context.escalaTipo === 'SABADO' ? vcmReleaseSabado : vcmReleaseDomingo);
  return rows(context.escalaTipo === 'SEG_SEX' ? context.turno === 'VESPERTINO' ? solturaVespertino : solturaMatutino
    : context.escalaTipo === 'SABADO' ? solturaSabado : solturaDomingo);
}
