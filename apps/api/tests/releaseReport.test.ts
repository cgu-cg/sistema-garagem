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

test('relatorio novo imprime bloqueios da propria folha sem misturar impedimentos de outro turno', () => {
 const report = fixture(1);
 report.defeitosGaragem = [{ prefixo: '3098', descricao: 'Outro turno' }];
 report.bloqueadosPortaria = [];
 const html = buildReleaseReportHtml(report);
 assert.match(html, /Bloqueados Portaria/); assert.doesNotMatch(html, /3098/);
 delete report.bloqueadosPortaria;
 assert.match(buildReleaseReportHtml(report), /3098/, 'Relatorio antigo conserva a fotografia original');
});

test('relatorio imprime faixas do vespertino, VCM e fretamento na ordem das viagens', () => {
 const report = fixture(5); report.contexto.turno = 'VESPERTINO';
 report.itens[0].observacoes = 'V.C.G.'; report.itens[1].observacoes = 'V.C.G.';
 report.itens[2].observacoes = 'TERMINAL NOVA BAHIA';
 report.itens[3].tipo = 'VCM'; report.itens[4].tipo = 'FRETAMENTO';
 const html = buildReleaseReportHtml(report);
 assert.equal((html.match(/SOLTURA VESPERTINA V\.C\.G\./g) ?? []).length, 1);
 assert.ok(html.indexOf('SOLTURA VESPERTINA V.C.G.') < html.indexOf('LINHA-0'));
 assert.ok(html.indexOf('LINHA-1') < html.indexOf('SOLTURA VESPERTINA TERMINAL NOVA BAHIA'));
 assert.ok(html.indexOf('SOLTURA VESPERTINA TERMINAL NOVA BAHIA') < html.indexOf('LINHA-2'));
 assert.ok(html.indexOf('MOTORISTAS VCM QUE SAEM DA VCG') < html.indexOf('LINHA-3'));
 assert.ok(html.indexOf('ESPECIAL FRETAMENTO') < html.indexOf('LINHA-4'));
 assert.match(html, /class="section evening"><th colspan="6"/);
 const morning = fixture(1); morning.itens[0].tipo = 'VCM';
 assert.match(buildReleaseReportHtml(morning), /class="section vcm"><th colspan="7"/);
});

test('titulos acompanham viagens nas quebras e repetem grupo na coluna e pagina seguintes', () => {
 const report = fixture(103); report.contexto.turno = 'VESPERTINO';
 report.itens.forEach(row => { row.observacoes = 'V.C.G.'; });
 const html = buildReleaseReportHtml(report);
 assert.match(html, /Página 1 de 2/); assert.match(html, /Página 2 de 2/);
 assert.equal((html.match(/SOLTURA VESPERTINA V\.C\.G\./g) ?? []).length, 3);
 assert.equal((html.match(/LINHA-/g) ?? []).length, 103);
 assert.ok(html.indexOf('LINHA-50') < html.indexOf('LINHA-51'));
 const boundary = fixture(53); boundary.itens[51].tipo = 'VCM'; boundary.itens[52].tipo = 'VCM';
 const bodies = [...buildReleaseReportHtml(boundary).matchAll(/<tbody>(.*?)<\/tbody>/g)].map(m => m[1]);
 assert.doesNotMatch(bodies[0], /MOTORISTAS VCM/);
 assert.match(bodies[1], /^<tr class="section vcm"><th colspan="7">MOTORISTAS VCM QUE SAEM DA VCG<\/th><\/tr><tr><td>LINHA-51/);
});

test('titulo salvo e escapado e relatorio nao modifica a fotografia recebida', () => {
 const report = fixture(1); report.contexto.turno = 'VESPERTINO';
 report.itens[0].observacoes = '<img src=x onerror=alert(1)>';
 const before = structuredClone(report), html = buildReleaseReportHtml(report);
 assert.match(html, /SOLTURA VESPERTINA &lt;img/); assert.doesNotMatch(html, /<img/);
 assert.deepEqual(report, before);
});
