const MESES_MAP: Record<number, string> = {
  1: "01 JANEIRO",
  2: "02 FEVEREIRO",
  3: "03 MARÇO",
  4: "04 ABRIL",
  5: "05 MAIO",
  6: "06 JUNHO",
  7: "07 JULHO",
  8: "08 AGOSTO",
  9: "09 SETEMBRO",
  10: "10 OUTUBRO",
  11: "11 NOVEMBRO",
  12: "12 DEZEMBRO",
};

const EMPRESAS_MAP: Record<string, { pasta: string; sigla: string }> = {
  "1": { pasta: "1-VCM", sigla: "VCM" },
  "2": { pasta: "2-VSF", sigla: "VSF" },
  "3": { pasta: "3-JTU", sigla: "JTU" },
  "4": { pasta: "4-VCG", sigla: "VCG" },
};

const BASE_URL = "http://192.168.0.51:19100";

export interface DiarioItem {
  dateStr: string;
  filename: string;
  label: string;
  url: string;
  found: boolean;
}

export async function fetchDiariosRange(
  carro: string,
  startStr: string,
  endStr: string,
  dateSV1?: string | null,
  dateSV2?: string | null
): Promise<DiarioItem[]> {
  const prefixo = carro.trim()[0];
  const empresa = EMPRESAS_MAP[prefixo];
  if (!empresa) {
    return [];
  }

  const { pasta: nomePastaEmpresa, sigla } = empresa;

  const [sY, sM, sD] = startStr.split("-").map(Number);
  const [eY, eM, eD] = endStr.split("-").map(Number);

  const dCurrent = new Date(sY, sM - 1, sD, 12, 0, 0);
  const dEnd = new Date(eY, eM - 1, eD, 12, 0, 0);

  // Coleta todas as datas do intervalo
  const datesToProcess: {
    curDateStr: string;
    dia: string;
    mesNum: number;
    ano: number;
    anoCurto: string;
    pastaDia: string;
    nomeMes: string;
    labelSuffix: string;
  }[] = [];

  while (dCurrent <= dEnd) {
    const dia = dCurrent.getDate().toString().padStart(2, "0");
    const mesNum = dCurrent.getMonth() + 1;
    const ano = dCurrent.getFullYear();
    const anoCurto = ano.toString().slice(-2);
    const pastaDia = `${dia}${mesNum.toString().padStart(2, "0")}${anoCurto}`;
    const nomeMes = MESES_MAP[mesNum];

    const yyyy = dCurrent.getFullYear();
    const mm = (dCurrent.getMonth() + 1).toString().padStart(2, "0");
    const dd = dCurrent.getDate().toString().padStart(2, "0");
    const curDateStr = `${yyyy}-${mm}-${dd}`;

    let labelSuffix = "";
    if (dateSV1 === curDateStr && dateSV2 === curDateStr) {
      labelSuffix = " (1º e 2º Serviço)";
    } else if (dateSV1 === curDateStr) {
      labelSuffix = " (1º Serviço - SV1)";
    } else if (dateSV2 === curDateStr) {
      labelSuffix = " (2º Serviço - SV2)";
    }

    datesToProcess.push({
      curDateStr,
      dia,
      mesNum,
      ano,
      anoCurto,
      pastaDia,
      nomeMes,
      labelSuffix,
    });

    dCurrent.setDate(dCurrent.getDate() + 1);
  }

  // Executa as consultas em paralelo para cada dia
  const dayResults = await Promise.all(
    datesToProcess.map(async (d) => {
      const dirUrl = `${BASE_URL}/${d.ano}/${nomePastaEmpresa}/${encodeURIComponent(d.nomeMes)}/${d.pastaDia}/`;
      const matchedPdfs: { filename: string; url: string }[] = [];

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(dirUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const html = await res.text();
          const regex = /<A\s+HREF=["']?([^"'>]+)["']?>([^<]+)<\/A>/gi;
          let match;
          const carClean = carro.trim();
          while ((match = regex.exec(html)) !== null) {
            const href = match[1];
            const filename = match[2].trim();
            const lowerName = filename.toLowerCase();

            // Checa se o arquivo pertence a esse carro e é pdf
            if (
              lowerName.endsWith(".pdf") &&
              (lowerName.startsWith(`${sigla.toLowerCase()}-${carClean.toLowerCase()}-`) ||
                lowerName.startsWith(`${sigla.toLowerCase()}_${carClean.toLowerCase()}_`) ||
                lowerName.includes(`-${carClean}-`) ||
                lowerName.includes(`_${carClean}_`))
            ) {
              const fullUrl = href.startsWith("http")
                ? href
                : `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
              matchedPdfs.push({ filename, url: fullUrl });
            }
          }
        }
      } catch (err) {
        // Silently catch network or timeout issues
      }

      // Ordena arquivos encontrados de forma previsível (ex: arquivo principal antes de - ou -2)
      matchedPdfs.sort((a, b) => {
        // Coloca o arquivo padrão exato antes
        const aStandard = a.filename === `${sigla}-${carro.trim()}-${d.pastaDia}.pdf`;
        const bStandard = b.filename === `${sigla}-${carro.trim()}-${d.pastaDia}.pdf`;
        if (aStandard && !bStandard) return -1;
        if (!aStandard && bStandard) return 1;
        return a.filename.localeCompare(b.filename);
      });

      const dayItems: DiarioItem[] = [];

      if (matchedPdfs.length === 0) {
        const fallbackPath = `${d.ano}/${nomePastaEmpresa}/${d.nomeMes}/${d.pastaDia}/${sigla}-${carro.trim()}-${d.pastaDia}.pdf`;
        const fallbackUrl = `${BASE_URL}/${fallbackPath}`.replace(/ /g, "%20");
        dayItems.push({
          dateStr: d.curDateStr,
          filename: `${sigla}-${carro.trim()}-${d.pastaDia}.pdf`,
          label: `${d.dia}/${d.mesNum.toString().padStart(2, "0")}/${d.ano}${d.labelSuffix}`,
          url: fallbackUrl,
          found: false,
        });
      } else if (matchedPdfs.length === 1) {
        dayItems.push({
          dateStr: d.curDateStr,
          filename: matchedPdfs[0].filename,
          label: `${d.dia}/${d.mesNum.toString().padStart(2, "0")}/${d.ano}${d.labelSuffix}`,
          url: matchedPdfs[0].url,
          found: true,
        });
      } else {
        matchedPdfs.forEach((pdf, idx) => {
          dayItems.push({
            dateStr: d.curDateStr,
            filename: pdf.filename,
            label: `${d.dia}/${d.mesNum.toString().padStart(2, "0")}/${d.ano} - Diário ${idx + 1} (${pdf.filename})${d.labelSuffix}`,
            url: pdf.url,
            found: true,
          });
        });
      }

      return dayItems;
    })
  );

  return dayResults.flat();
}
