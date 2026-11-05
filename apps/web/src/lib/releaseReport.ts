import type { ReleaseWithdrawal } from './releaseProgramming';
import type { SolturaItem } from '@/data/solturaTypes';
import type { DailyEscala } from './sharedEscala';

export interface ReleaseReport {
  contexto: DailyEscala['contexto']; status: string; emitidoEm: string;
  itens: SolturaItem[]; reserva: string[]; bloqueados: string[];
  substituidos?: ReleaseWithdrawal[]; bloqueadosPortaria?: ReleaseWithdrawal[];
  defeitosGaragem: { prefixo: string; descricao: string }[];
  reservasTerminais: { terminal: string; carro: string }[];
  auxiliaresIndisponiveis?: boolean; ciNaoVinculada?: boolean;
}
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const labels = { SEG_SEX: 'Segunda a sexta', SABADO: 'Sábado', DOM_FER: 'Domingo / Feriado' };

// Documento independente: nunca imprime somente os resultados da busca da tela.
export function buildReleaseReportHtml(report: ReleaseReport): string {
  const c = report.contexto, weekend = c.escalaTipo !== 'SEG_SEX';
  const independent = c.escalaTipo === 'SEG_SEX' && c.turno === 'VESPERTINO';
  const columns = weekend ? 3 : 2, perColumn = weekend ? 45 : 52;
  const sections = (row: SolturaItem, previous?: SolturaItem) => [
    ...(independent && row.observacoes && row.observacoes !== previous?.observacoes
      ? [{ kind: 'evening', title: `SOLTURA VESPERTINA ${row.observacoes}` }] : []),
    ...(row.tipo === 'VCM' && previous?.tipo !== 'VCM'
      ? [{ kind: 'vcm', title: 'MOTORISTAS VCM QUE SAEM DA VCG' }] : []),
    ...(row.tipo === 'FRETAMENTO' && previous?.tipo !== 'FRETAMENTO'
      ? [{ kind: 'charter', title: 'ESPECIAL FRETAMENTO' }] : []),
  ];
  // Titulos ocupam espaco na pagina e acompanham a primeira viagem do grupo.
  const columnRows: SolturaItem[][] = [[]];
  let occupied = 0;
  for (const row of report.itens) {
    let current = columnRows[columnRows.length - 1];
    let needed = 1 + sections(row, current[current.length - 1]).length;
    if (occupied + needed > perColumn && current.length) {
      current = []; columnRows.push(current); occupied = 0;
      needed = 1 + sections(row).length;
    }
    current.push(row); occupied += needed;
  }
  const pages: string[] = [];
  const totalPages = Math.max(1, Math.ceil(columnRows.length / columns));
  for (let page = 0; page < totalPages; page++) {
    const tables = Array.from({ length: columns }, (_, column) => {
      const rows = columnRows[page * columns + column] ?? [];
      const body = rows.map((row, index) => {
        const headings = sections(row, rows[index - 1]).map(section =>
          `<tr class="section ${section.kind}"><th colspan="${independent ? 6 : 7}">${escape(section.title)}</th></tr>`).join('');
        const done = row.status === 'LIBERADO' || row.status === 'SUBSTITUIDO';
        const changed = Boolean(done && row.carroProgramado && row.carroRealizado && row.carroRealizado !== row.carroProgramado);
        const kind = row.tipo === 'VCM' ? 'VCM' : row.tipo === 'FRETAMENTO' ? 'Fretamento' : '';
        const cells = [escape(row.linha) + (row.suspensa ? '<small>SUSPENSA</small>' : '') + (kind ? `<small>${kind}</small>` : ''), escape(row.tabela),
          ...(!independent ? [`<span class="${changed ? 'replaced' : ''}">${escape(row.carroProgramado)}</span>`] : []),
          escape(done ? row.carroRealizado || row.carroProgramado : ''), escape(done ? row.motoristaCodigo : ''),
          escape(row.saidaGaragem), escape(weekend ? row.chegadaGaragem : row.inicioLinha || row.inicioBairro)];
        return `${headings}<tr${row.suspensa ? ' style="background:#ffe4e6"' : ''}>${cells.map(value => `<td>${value}</td>`).join('')}</tr>`;
      }).join('');
      return `<table><thead><tr><th>Linha</th><th>Tab.</th>${!independent ? `<th>${weekend ? 'Carro' : 'Programado'}</th>` : ''}<th>${weekend ? 'Realiz.' : 'Realizado'}</th><th>MOTO</th><th>Saída</th><th>${weekend ? 'Chegada' : 'Início'}</th></tr></thead><tbody>${body}</tbody></table>`;
    }).join('');
    const suspended = report.itens.filter(row => row.suspensa).length;
    const liberated = report.itens.filter(row => ['LIBERADO', 'SUBSTITUIDO'].includes(row.status)).length;
    const portaria = report.bloqueadosPortaria ? report.bloqueadosPortaria.map(item => ({ prefixo: item.prefixo, descricao: item.motivo })) : report.defeitosGaragem;
    const auxiliary = page === totalPages - 1 && report.auxiliaresIndisponiveis ? '<p>Reservas e bloqueios não registrados neste histórico. Dados atuais não foram usados para completar o relatório.</p>' : page === totalPages - 1 ? `<div class="auxiliary"><div><h3>Reserva garagem</h3><p>${escape(report.reserva.join(' · ') || 'Sem carros')}</p></div>
      <div><h3>Reserva terminal</h3>${report.reservasTerminais.length ? report.reservasTerminais.map(r => `<p>${escape(r.terminal)}: ${escape(r.carro)}</p>`).join('') : '<p>Sem registros</p>'}</div>
      <div><h3>Bloqueados CI</h3><p>${escape(report.ciNaoVinculada ? 'CI não vinculada ao vespertino' : report.bloqueados.join(' · ') || 'Sem registros')}</p><h3>${report.bloqueadosPortaria ? 'Bloqueados Portaria' : 'Defeito garagem'}</h3>${portaria.map(d => `<p>${escape(d.prefixo)}: ${escape(d.descricao)}</p>`).join('') || '<p>Sem registros</p>'}</div></div>` : '';
    pages.push(`<section class="sheet"><header><h1>CONSÓRCIO GUAICURUS · GARAGEM ${escape(c.garagem)}</h1><h2>FOLHA DE SOLTURA — ${labels[c.escalaTipo]}${c.turno === 'PADRAO' ? '' : ' · ' + escape(c.turno)} · ${escape(c.dataOperacao.split('-').reverse().join('/'))}</h2>
      <p>${escape(report.status === 'FINALIZADA' ? 'Finalizada' : report.status === 'LEGADO' ? 'Histórico anterior ao controle de início/fim' : report.status === 'NAO_INICIADA' ? 'Não iniciada — prévia' : 'Em andamento — parcial')} · Total: ${report.itens.length} · Liberados: ${liberated} \u00b7 Suspensas: ${suspended} · Pendentes: ${report.itens.length - liberated - suspended}</p></header>
      <div class="columns" style="grid-template-columns:repeat(${columns},minmax(0,1fr))">${tables}</div>${auxiliary}
      <footer>Página ${page + 1} de ${totalPages} · Registro de emissão: ${escape(report.emitidoEm)} · Responsável: ____________________</footer></section>`);
  }
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Soltura ${escape(c.garagem)} ${escape(c.dataOperacao)}</title><style>
    @page{size:A4 portrait;margin:8mm}*{box-sizing:border-box}body{margin:0;color:#111;background:#eee;font-family:Arial,sans-serif}.sheet{width:194mm;min-height:275mm;margin:5mm auto;padding:0;background:white;break-after:page}.sheet:last-child{break-after:auto}
    header{border:1px solid #222;text-align:center;padding:2mm;margin-bottom:2mm}h1{font-size:10pt;margin:0 0 1mm}h2{font-size:8pt;margin:0}header p{font-size:7pt;margin:1mm 0 0}.columns{display:grid;gap:2mm;align-items:start}table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:${weekend ? '5.5' : '6.5'}pt}th,td{border:.2mm solid #444;text-align:center;padding:.5mm .2mm;height:3.8mm;overflow-wrap:anywhere}thead{display:table-header-group}th{background:#eee;font-size:${weekend ? '5' : '6'}pt}td:first-child{font-weight:bold}.section{break-after:avoid}.section th{text-align:left;font-weight:bold;padding:.7mm 1mm;print-color-adjust:exact;-webkit-print-color-adjust:exact}.section.evening th{background:#dcf5ed;color:#164e3a}.section.vcm th{background:#eaf0ff;color:#254edb}.section.charter th{background:#fff3cd;color:#805600}.replaced{text-decoration:line-through}small{display:block;font-size:5pt}tr{break-inside:avoid}.auxiliary{display:grid;grid-template-columns:repeat(3,1fr);gap:2mm;margin-top:2mm;font-size:6pt;break-inside:avoid}.auxiliary>div{border:.2mm solid #555;padding:1mm}h3{font-size:6.5pt;margin:0;border-bottom:1px solid #aaa}p{margin:1mm 0}footer{font-size:6pt;border-top:1px solid #333;margin-top:2mm;padding-top:1mm}.actions{text-align:center;padding:12px}button{padding:8px 18px;cursor:pointer}@media print{body{background:white}.sheet{margin:0;width:auto;min-height:0}.actions{display:none}}
    </style></head><body><div class="actions"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>${pages.join('')}</body></html>`;
}
