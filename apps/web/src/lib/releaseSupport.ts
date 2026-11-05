// VCM habilitada somente para a Soltura matutina Seg-Sex autorizada.
type Context = { garagem?: unknown; escalaTipo?: unknown; turno?: unknown };
export const isVcmMorningRelease = (context: Context) =>
  context.garagem === 'VCM' && context.escalaTipo === 'SEG_SEX' && context.turno === 'MATUTINO';
export const supportsReleaseContext = (context: Context) => context.garagem === 'VCG' || isVcmMorningRelease(context);
