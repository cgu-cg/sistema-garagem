import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReleaseReportHtml, type ReleaseReport } from '../../web/src/lib/releaseReport';

function fixture(count = 105, type: ReleaseReport['contexto']['escalaTipo'] = 'SEG_SEX'): ReleaseReport {
 return { contexto: { garagem: 'VCG', escalaTipo: type, turno: type === 'SEG_SEX' ? 'MATUTINO' : 'PADRAO', dataOperacao: '2026-10-30' },
  status: 'FINALIZADA', emitidoEm: '2026-10-30T16:00:00Z', reserva: ['4001'], bloqueados: ['4002'],
  defeitosGaragem: [{ prefixo: '4003', descricao: '<script>alert(1)</script>' }], reservasTerminais: [{ terminal: 'NOVA BAHIA', carro: '4004' }],
  itens: Array.from({ length: count }, (_, i) => ({ id: String(i), linha: 'LINHA-' + i, tabela: '1', carroProgramado: '4000',
    carroRealizado: '4001', motoristaCodigo: '123', saidaGaragem: '04:00', inicioLinha: '05:00', status: 'LIBERADO' as const })) };
}
test('relatorio A4 inclui todas as linhas, duas colunas e paginas numeradas, sem assinaturas ficticias', () => {
 const html = buildReleaseReportHtml(fixture());
 assert.match(html, /size:A4 portrait/); assert.match(html, /repeat\(2/);
 assert.match(html, /Página 1 de 2/); assert.match(html, /Página 2 de 2/);
 assert.equal((html.match(/LINHA-/g) ?? []).length, 105);
 assert.match(html, /class="replaced"/); assert.match(html, /Reserva terminal/);
 assert.doesNotMatch(html, /<script>/); assert.match(html, /&lt;script&gt;/);
});
test('sabado usa tres colunas; vespertino nao exibe programado', () => {
 assert.match(buildReleaseReportHtml(fixture(108, 'SABADO')), /repeat\(3/);
 const evening = fixture(2); evening.contexto.turno = 'VESPERTINO';
 assert.doesNotMatch(buildReleaseReportHtml(evening), /<th>Programado<\/th>/);
});

test('relatorio diferencia suspensas de liberadas e pendentes', () => {
 const report = fixture(2);
 report.itens[0] = { ...report.itens[0], suspensa: true, status: 'PENDENTE', carroRealizado: '', motoristaCodigo: '' };
 const html = buildReleaseReportHtml(report);
 assert.match(html, /background:#ffe4e6/); assert.match(html, /<small>SUSPENSA<\/small>/);
 assert.match(html, /Liberados: 1/); assert.match(html, /Suspensas: 1/); assert.match(html, /Pendentes: 0/);
});
