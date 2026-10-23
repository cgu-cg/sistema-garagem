// Conversao local e explicita. Nao acessa banco, rede ou variaveis de ambiente.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const XLSX = require('xlsx');
const root = path.resolve(__dirname, '..');
const specs = [
  ['escala-carros', 'seg-sex', 'seg-sex', 'VCG_SEG_SEX_MATUTINO', 'vcg-mat'],
  ['escala-carros', 'sabado', 'sabado', 'VCG_SABADO_PADRAO', 'vcg-sab'],
  ['escala-carros', 'domingo-feriado', 'domingo-feriado', 'VCG_DOM_FER_PADRAO', 'vcg-dom'],
  ['soltura', 'soltura-seg-sex', 'seg-sex-matutino', 'VCG_SEG_SEX_MATUTINO', 'vcg-mat'],
  ['soltura', 'soltura-seg-sex-vespertina', 'seg-sex-vespertino', 'VCG_SEG_SEX_VESPERTINO', 'vcg-vesp'],
  ['soltura', 'soltura-sabado', 'sabado', 'VCG_SABADO_PADRAO', 'vcg-sab'],
  ['soltura', 'soltura-domingo-feriado', 'domingo-feriado', 'VCG_DOM_FER_PADRAO', 'vcg-dom'],
].map(([kind, excel, json, context, prefix]) => ({ kind, context, prefix,
  excel: `exemplos/${kind === 'soltura' ? 'solturas' : kind}/vcg/${excel}.xlsx`,
  json: `apps/web/src/data/${kind}/vcg/${json}.json`,
}));
const text = value => String(value ?? '').trim();
function time(value) {
  const v = text(value), m = v.match(/^(\d{1,2})[:;](\d{2})(?::00)?$/);
  if (!v) return '';
  if (!m || +m[1] > 23 || +m[2] > 59) throw Error(`Horario invalido: ${v}`);
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}
const code = value => text(value).replace(/[_-]/g, '/').replace(/\s/g, '').split('/').map(p => /^\d+$/.test(p) ? String(Number(p)) : p).join('/');
const identity = item => JSON.stringify([code(item.linha), code(item.tabela), time(item.saidaGaragem)]);
function readRows(file, prefix, legacy = []) {
  const workbook = XLSX.readFile(file), rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: '', raw: false });
  if (text(rows[0]?.[0]).toLowerCase() !== 'linha' || text(rows[0]?.[2]).toLowerCase() !== 'garagem') throw Error(`Cabecalho inesperado: ${file}`);
  const old = new Map();
  for (const item of legacy) { const key = identity(item); old.set(key, [...(old.get(key) ?? []), item.id]); }
  const result = [], used = new Set(), occurrences = new Map();
  let section = '', sectionOrder = 0;
  for (let index = 1; index < rows.length; index++) {
    const row = rows[index].map(text);
    if (row.every(v => !v)) continue;
    const [linha, tabela, garagem, bairro, carro] = row;
    if (!tabela && !garagem && !bairro && !carro) {
      if (!/^SOLTURA VESPERTINA |^MOTORISTAS VCM |^ESPECIAL FRETAMENTO$/.test(linha)) throw Error(`Secao desconhecida em ${file}:${index + 1}: ${linha}`);
      section = linha.replace(/^SOLTURA VESPERTINA /, ''); sectionOrder = 0; continue;
    }
    if (!linha || (!tabela && !['SISEP', 'ESP.VCM'].includes(linha))) throw Error(`Linha/tabela incompleta em ${file}:${index + 1}`);
    const item = { id: '', ordem: result.length + 1, linha, tabela,
      saidaGaragem: time(garagem), chegadaGaragem: bairro === 'VCM' ? bairro : time(bairro),
      inicioLinha: bairro === 'VCM' ? bairro : time(bairro), inicioBairro: bairro === 'VCM' ? bairro : time(bairro),
      carroProgramado: carro, status: 'PENDENTE' };
    if (section.startsWith('MOTORISTAS VCM')) { item.tipo = 'VCM'; item.observacoes = section; }
    else if (section === 'ESPECIAL FRETAMENTO') { item.tipo = 'FRETAMENTO'; item.observacoes = section; }
    else if (section) { item.observacoes = section; item.ordemTerminal = ++sectionOrder; }
    const key = identity(item), candidates = old.get(key) ?? [];
    const ordinal = (occurrences.get(key) ?? 0) + 1; occurrences.set(key, ordinal);
    const candidate = candidates.length === 1 ? candidates[0] : candidates[ordinal - 1];
    item.id = candidate && !used.has(candidate) ? candidate
      : `${prefix}-xlsx-${createHash('sha256').update(key + '|' + section + '|' + ordinal).digest('hex').slice(0, 16)}`;
    if (used.has(item.id)) throw Error(`Identidade duplicada em ${file}:${index + 1}`);
    used.add(item.id); result.push(item);
  }
  return result;
}
function generate(write = false) {
  const entries = specs.map(spec => {
    const dest = path.join(root, spec.json);
    const existing = fs.existsSync(dest) && fs.readFileSync(dest, 'utf8').trim();
    if (!existing) throw Error(`Restaure ${spec.json} antes de importar, para preservar as identidades das viagens.`);
    const items = readRows(path.join(root, spec.excel), spec.prefix, JSON.parse(existing));
    if (spec.kind === 'escala-carros') {
      const seen = new Set();
      for (const item of items) {
        if (!item.carroProgramado) continue;
        if (seen.has(item.carroProgramado)) item.carroProgramado = '';
        else seen.add(item.carroProgramado);
      }
    }
    return { ...spec, items };
  });
  // Validar os sete documentos antes de substituir qualquer arquivo.
  if (write) {
    for (const entry of entries) {
      const dest = path.join(root, entry.json), bytes = JSON.stringify(entry.items, null, 2) + '\n';
      fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, bytes);
      const apiDest = path.join(root, entry.json.replace('apps/web/', 'apps/api/'));
      fs.mkdirSync(path.dirname(apiDest), { recursive: true }); fs.writeFileSync(apiDest, bytes);
    }
  }
  return entries;
}
module.exports = { specs, time, identity, readRows, generate };
if (require.main === module) {
  const write = process.argv.includes('--write');
  for (const entry of generate(write)) console.log(`${write ? 'Gravado' : 'Conferido'} ${entry.json}: ${entry.items.length} linhas`);
}
