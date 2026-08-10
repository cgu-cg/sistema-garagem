import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  Calendar,
  AlertTriangle,
  RefreshCw,
  FileText,
  Wifi,
  Wrench,
  ExternalLink,
  Copy,
  Check,
  Database,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// Meses para geração de URL PDF
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

// Empresas com base no primeiro dígito do carro
const EMPRESAS_MAP: Record<string, { pasta: string; sigla: string }> = {
  "1": { pasta: "1-VCM", sigla: "VCM" },
  "2": { pasta: "2-VSF", sigla: "VSF" },
  "3": { pasta: "3-JTU", sigla: "JTU" },
  "4": { pasta: "4-VCG", sigla: "VCG" },
};

export function CatracasPage() {
  const location = useLocation();

  const activeTab = location.pathname.includes("/alertas")
    ? "alertas"
    : location.pathname.includes("/backup")
      ? "backup"
      : location.pathname.includes("/historico")
        ? "consulta"
        : location.pathname.includes("/diario")
          ? "diario"
          : "consistencia";

  const [activeAlertSubTab, setActiveAlertSubTab] = useState<"datas" | "frota">("datas");
  const [isMockMode, setIsMockMode] = useState(false);

  // Estados dos filtros da Consistência
  const [consistenciaDate, setConsistenciaDate] = useState("2026-08-05");
  const [consistenciaMinDiff, setConsistenciaMinDiff] = useState(1);
  const [consistenciaLoading, setConsistenciaLoading] = useState(false);
  const [consistenciaData, setConsistenciaData] = useState<any[]>([]);

  // Estados de detalhes do veículo selecionado
  const [selectedCar, setSelectedCar] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState<any | null>(null);

  // Estados dos Alertas Globais (Datas Incorretas e Fora da Frota)
  const [alertYear, setAlertYear] = useState("2026");
  const [alertStartDate, setAlertStartDate] = useState("2026-06-01");
  const [alertLoading, setAlertLoading] = useState(false);
  const [datasIncorretas, setDatasIncorretas] = useState<{ hIni: any[]; hFim: any[] }>({ hIni: [], hFim: [] });
  const [foraFrota, setForaFrota] = useState<{ especiais: any[]; comuns: any[] }>({ especiais: [], comuns: [] });

  // Estados de Backup de Coleta
  const [backupCarIds, setBackupCarIds] = useState("1118, 1327, 2701");
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupData, setBackupData] = useState<any[]>([]);
  const [coletaBKPIni, setColetaBKPIni] = useState("2026-08-01T03:00:00");
  const [coletaBKPFim, setColetaBKPFim] = useState("2026-08-07T02:59:59");
  const [updatingBackup, setUpdatingBackup] = useState(false);

  // Estados de Consulta por Carro
  const [consultaCarId, setConsultaCarId] = useState("");
  const [consultaDateLimit, setConsultaDateLimit] = useState("2026-07-01");
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [consultaData, setConsultaData] = useState<any[]>([]);

  // Estados de PDF do Diário de Bordo (Lado Direito)
  const [pdfCarId, setPdfCarId] = useState("");
  const [pdfDateIni, setPdfDateIni] = useState("2026-08-05");
  const [pdfDateFim, setPdfDateFim] = useState("2026-08-05");
  const [pdfDaysList, setPdfDaysList] = useState<{ dateStr: string; label: string; url: string }[]>([]);
  const [activePdfUrl, setActivePdfUrl] = useState<string>("");
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Carregar dados de consistência inicial
  useEffect(() => {
    handleSearchConsistencia();
  }, []);

  // Handler de Busca de Consistência
  const handleSearchConsistencia = async () => {
    setConsistenciaLoading(true);
    try {
      // Ajustar formato da data para DD/MM/YYYY ou enviar YYYY-MM-DD
      // O backend converte automaticamente
      const response = await api.getConsistenciaCatraca({
        date: consistenciaDate,
        minDiff: consistenciaMinDiff,
      });
      setConsistenciaData(response.data || []);
      setIsMockMode(response.isMock);
    } catch (error: any) {
      toast.error("Erro ao buscar dados de consistência: " + error.message);
    } finally {
      setConsistenciaLoading(false);
    }
  };

  const [loadingDiarios, setLoadingDiarios] = useState(false);

  // Carregar detalhes automáticos de um veículo
  const handleSelectCar = async (idCarro: number, dateStr: string) => {
    setSelectedCar(idCarro);
    setSelectedDate(dateStr);
    setDetailsLoading(true);

    // Configurar diário de bordo do carro na data
    setPdfCarId(idCarro.toString());
    setPdfDateIni(dateStr);
    setPdfDateFim(dateStr);

    try {
      const response = await api.getDetalhesVeiculo({
        idVeiculo: idCarro,
        date: dateStr,
      });
      setDetailsData(response.data);

      if (response.data?.consistenciaBase) {
        const cb = response.data.consistenciaBase;
        const extractYMD = (d: string | null) => {
          if (!d) return null;
          if (d.includes("T")) return d.split("T")[0];
          if (d.includes(" ")) return d.split(" ")[0];
          return d;
        };
        const dateSV1 = extractYMD(cb.datainiSV1);
        const dateSV2 = extractYMD(cb.datainiSV2);

        const start = dateSV1 && dateSV2 ? (dateSV1 <= dateSV2 ? dateSV1 : dateSV2) : (dateSV1 || dateSV2 || dateStr);
        const end = dateSV1 && dateSV2 ? (dateSV1 <= dateSV2 ? dateSV2 : dateSV1) : (dateSV1 || dateSV2 || dateStr);

        setPdfDateIni(start);
        setPdfDateFim(end);

        loadDiarios(idCarro.toString(), start, end, dateSV1, dateSV2);
      } else {
        setPdfDateIni(dateStr);
        setPdfDateFim(dateStr);
        loadDiarios(idCarro.toString(), dateStr, dateStr, dateStr, dateStr);
      }
    } catch (error: any) {
      toast.error(`Erro ao carregar detalhes do carro ${idCarro}: ` + error.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Busca de Alertas Globais (Datas incorretas e Fora da Frota)
  const handleSearchAlerts = async () => {
    setAlertLoading(true);
    try {
      const [resDatas, resFrota] = await Promise.all([
        api.getDatasIncorretas({ startDate: alertStartDate, year: alertYear }),
        api.getVeiculosForaFrota({ startDate: alertStartDate }),
      ]);

      setDatasIncorretas({
        hIni: resDatas.data?.dataHIniInvalido || [],
        hFim: resDatas.data?.dataHFimInvalido || [],
      });

      setForaFrota({
        especiais: resFrota.data?.carrosEspeciais || [],
        comuns: resFrota.data?.carrosComuns || [],
      });

      setIsMockMode(resDatas.isMock || resFrota.isMock);
      toast.success("Alertas atualizados");
    } catch (error: any) {
      toast.error("Erro ao buscar alertas: " + error.message);
    } finally {
      setAlertLoading(false);
    }
  };

  // Busca de Backup de Coleta
  const handleSearchBackup = async () => {
    setBackupLoading(true);
    try {
      const ids = backupCarIds
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));

      if (ids.length === 0) {
        toast.error("Insira pelo menos um ID de veículo válido");
        return;
      }

      const response = await api.getBackupStatus(ids);
      setBackupData(response.data || []);
      setIsMockMode(response.isMock);
    } catch (error: any) {
      toast.error("Erro ao consultar backup: " + error.message);
    } finally {
      setBackupLoading(false);
    }
  };

  // Atualizar datas de backup
  const handleUpdateBackup = async () => {
    setUpdatingBackup(true);
    try {
      const ids = backupData.map((b) => b.idCarro);
      if (ids.length === 0) {
        toast.error("Nenhum carro na lista para atualizar");
        return;
      }

      // Formatar datas para o SQL Server (DD/MM/YYYY HH:mm:ss)
      const formatToSql = (isoStr: string) => {
        const d = new Date(isoStr);
        const day = d.getDate().toString().padStart(2, "0");
        const month = (d.getMonth() + 1).toString().padStart(2, "0");
        const year = d.getFullYear();
        const hour = d.getHours().toString().padStart(2, "0");
        const min = d.getMinutes().toString().padStart(2, "0");
        const sec = d.getSeconds().toString().padStart(2, "0");
        return `${day}/${month}/${year} ${hour}:${min}:${sec}`;
      };

      const iniFormatted = formatToSql(coletaBKPIni);
      const fimFormatted = formatToSql(coletaBKPFim);

      await api.updateBackupStatus({
        ids,
        coletaBKPIni: iniFormatted,
        coletaBKPFim: fimFormatted,
      });

      toast.success("Datas de backup atualizadas com sucesso!");
      handleSearchBackup(); // Atualiza a tabela
    } catch (error: any) {
      toast.error("Erro ao atualizar backup: " + error.message);
    } finally {
      setUpdatingBackup(false);
    }
  };

  // Consulta manual por carro
  const handleSearchConsultaCarro = async () => {
    const idCarro = parseInt(consultaCarId, 10);
    if (isNaN(idCarro)) {
      toast.error("Insira um número de carro válido");
      return;
    }

    setConsultaLoading(true);
    try {
      const response = await api.getVeiculoServicos({
        idVeiculo: idCarro,
        startDate: consultaDateLimit,
      });
      setConsultaData(response.data || []);
      setIsMockMode(response.isMock);
    } catch (error: any) {
      toast.error("Erro ao buscar histórico do veículo: " + error.message);
    } finally {
      setConsultaLoading(false);
    }
  };

  // Fallback síncrono para gerar links previstos enquanto o servidor de arquivos é consultado
  const generatePdfUrlsForDates = (carro: string, date1: string | null, date2: string | null) => {
    if (!carro) return;

    const prefixo = carro.trim()[0];
    const empresaInfo = EMPRESAS_MAP[prefixo];

    if (!empresaInfo) {
      setPdfDaysList([]);
      setActivePdfUrl("");
      return;
    }

    const { pasta: nomePastaEmpresa, sigla } = empresaInfo;
    const base_url = "http://192.168.0.51:19100";

    const extractYMD = (d: string | null) => {
      if (!d) return null;
      if (d.includes("T")) return d.split("T")[0];
      if (d.includes(" ")) return d.split(" ")[0];
      return d;
    };

    const d1Str = extractYMD(date1);
    const d2Str = extractYMD(date2);

    if (!d1Str && !d2Str) {
      setPdfDaysList([]);
      setActivePdfUrl("");
      return;
    }

    const startStr = d1Str && d2Str ? (d1Str <= d2Str ? d1Str : d2Str) : (d1Str || d2Str)!;
    const endStr = d1Str && d2Str ? (d1Str <= d2Str ? d2Str : d1Str) : (d1Str || d2Str)!;

    const [sY, sM, sD] = startStr.split("-").map(Number);
    const [eY, eM, eD] = endStr.split("-").map(Number);

    const dCurrent = new Date(sY, sM - 1, sD, 12, 0, 0);
    const dEnd = new Date(eY, eM - 1, eD, 12, 0, 0);

    const list: { dateStr: string; label: string; url: string }[] = [];

    while (dCurrent <= dEnd) {
      const dia = dCurrent.getDate().toString().padStart(2, "0");
      const mesNum = dCurrent.getMonth() + 1;
      const ano = dCurrent.getFullYear();
      const anoCurto = ano.toString().slice(-2);
      const pastaDia = `${dia}${mesNum.toString().padStart(2, "0")}${anoCurto}`;
      const nomeMes = MESES_MAP[mesNum];

      const caminho = `${ano}/${nomePastaEmpresa}/${nomeMes}/${pastaDia}/${sigla}-${carro.trim()}-${pastaDia}.pdf`;
      const urlFinal = `${base_url}/${caminho}`.replace(/ /g, "%20");

      const yyyy = dCurrent.getFullYear();
      const mm = (dCurrent.getMonth() + 1).toString().padStart(2, "0");
      const dd = dCurrent.getDate().toString().padStart(2, "0");
      const curDateStr = `${yyyy}-${mm}-${dd}`;

      let labelSuffix = "";
      if (d1Str === curDateStr && d2Str === curDateStr) {
        labelSuffix = " (1º e 2º Serviço)";
      } else if (d1Str === curDateStr) {
        labelSuffix = " (1º Serviço - SV1)";
      } else if (d2Str === curDateStr) {
        labelSuffix = " (2º Serviço - SV2)";
      }

      list.push({
        dateStr: curDateStr,
        label: `${dia}/${mesNum.toString().padStart(2, "0")}/${ano}${labelSuffix}`,
        url: urlFinal,
      });

      dCurrent.setDate(dCurrent.getDate() + 1);
    }

    setPdfDaysList(list);
    if (list.length > 0) {
      setActivePdfUrl(list[0].url);
    } else {
      setActivePdfUrl("");
    }
  };

  // Busca lista precisa de diários no servidor HTTP via API
  const loadDiarios = async (
    carro: string,
    startStr: string,
    endStr: string,
    dateSV1?: string | null,
    dateSV2?: string | null
  ) => {
    if (!carro) return;

    // Primeiro aplica o fallback síncrono para renderizar imediatamente
    generatePdfUrlsForDates(carro, dateSV1 || startStr, dateSV2 || endStr);

    setLoadingDiarios(true);
    try {
      const response = await api.getDiarios({
        carro,
        startDate: startStr,
        endDate: endStr,
        dateSV1: dateSV1 || null,
        dateSV2: dateSV2 || null,
      });

      if (response?.data && response.data.length > 0) {
        setPdfDaysList(response.data);
        // Se o PDF ativo anterior não estiver na nova lista, seleciona o primeiro
        setActivePdfUrl((prevUrl) => {
          if (response.data.some((d: any) => d.url === prevUrl)) {
            return prevUrl;
          }
          return response.data[0].url;
        });
      }
    } catch (err) {
      console.warn("Consulta dinâmica de diários falhou, usando lista padrão:", err);
    } finally {
      setLoadingDiarios(false);
    }
  };

  const handleManualPdfGeneration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfCarId) {
      toast.error("Digite o número do carro");
      return;
    }
    loadDiarios(pdfCarId, pdfDateIni, pdfDateFim, pdfDateIni, pdfDateFim);
  };

  const handleCopyUrl = () => {
    if (!activePdfUrl) return;
    navigator.clipboard.writeText(activePdfUrl);
    setCopiedUrl(true);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return "";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateVal;
    }
  };

  const formatDateTime = (dateVal: any) => {
    if (!dateVal) return "";
    if (typeof dateVal === "string" && /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(dateVal)) {
      return dateVal;
    }
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const year = d.getFullYear();
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      const seconds = d.getSeconds().toString().padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (e) {
      return dateVal;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Modo Simulação */}
      {isMockMode && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="text-sm">
            <span className="font-semibold">Modo Simulação Ativo:</span> Banco de dados SQL Server não conectado. As informações mostradas abaixo são dados de demonstração salvos localmente.
          </div>
        </div>
      )}

      {/* Título da Página */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conferência de Catracas</h1>
          <p className="text-muted-foreground">Auditoria de turnos,WiFi logs, ordens de serviço de manutenção e diários de bordo.</p>
        </div>
      </div>

      {/* Painel de Ferramentas e Consultas (100% da largura) */}
      <div className="space-y-6">

        {/* ABA 1: CONSISTÊNCIA DIÁRIA (fnConsisteCatracaVEICULOS) */}
        {activeTab === "consistencia" && (
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-600" />
                Diferenças de Catraca por Carro
              </CardTitle>
              <CardDescription>
                Verifica discrepâncias entre a catraca final do primeiro turno e a inicial do segundo turno.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Data de Auditoria</Label>
                  <div className="relative">
                    <Input
                      type="date"
                      id="date"
                      value={consistenciaDate}
                      onChange={(e) => setConsistenciaDate(e.target.value)}
                      className="pl-9"
                    />
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minDiff">Diferença Mínima</Label>
                  <Input
                    type="number"
                    id="minDiff"
                    value={consistenciaMinDiff}
                    onChange={(e) => setConsistenciaMinDiff(parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleSearchConsistencia}
                    className="w-full flex items-center gap-2"
                    disabled={consistenciaLoading}
                  >
                    {consistenciaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Pesquisar Inconsistências
                  </Button>
                </div>
              </div>

              {/* Tabela de Resultados */}
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/80 text-muted-foreground text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-3 py-2">Carro</th>
                      <th className="px-3 py-2">Linha</th>
                      <th className="px-3 py-2">1º Turno (SV1)</th>
                      <th className="px-3 py-2">Data SV1</th>
                      <th className="px-3 py-2">2º Turno (SV2)</th>
                      <th className="px-3 py-2">Data SV2</th>
                      <th className="px-3 py-2 text-right">Dif.</th>
                      <th className="px-3 py-2 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {consistenciaLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-600" />
                          Consultando o banco bilhetagem...
                        </td>
                      </tr>
                    ) : consistenciaData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-muted-foreground font-medium">
                          Nenhuma divergência encontrada para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      consistenciaData.map((row) => (
                        <tr
                          key={row.idCarro}
                          onClick={() => handleSelectCar(row.idCarro, consistenciaDate)}
                          className={`hover:bg-accent-400 cursor-pointer transition-colors ${selectedCar === row.idCarro ? "bg-indigo-200 dark:bg-indigo-950/20" : ""
                            }`}
                        >
                          <td className="px-4 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {row.idCarro}
                          </td>
                          <td className="px-4 py-1 text-xs">{row.Linha}</td>
                          <td className="px-4 py-1 text-xs font-semibold text-foreground">
                            {row.catracaFim}
                          </td>
                          <td className="px-4 py-1 text-xs text-muted-foreground">
                            {formatDate(row.datainiSV1)}
                          </td>
                          <td className="px-4 py-1 text-xs font-semibold text-foreground">
                            {row.catracaIni}
                          </td>
                          <td className="px-4 py-1 text-xs text-muted-foreground">
                            {formatDate(row.datainiSV2)}
                          </td>
                          <td className="px-4 py-1 text-xs text-right font-bold text-rose-600 dark:text-rose-400">
                            {row.diff}
                          </td>
                          <td className="px-4 py-1 text-center">
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                              Inspecionar <ChevronRight className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ABA 2: ALERTAS GLOBAIS (Datas incorretas e Fora da frota) */}
        {activeTab === "alertas" && (
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                Alertas Globais de Erros de Configuração
              </CardTitle>
              <CardDescription>
                Monitora dados incomuns vindos de validadores ou carros, indicando horários e equipamentos mal configurados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Configurações dos filtros */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 bg-muted/30 p-3 rounded-lg border">
                <div className="space-y-1">
                  <Label htmlFor="alertYear" className="text-xs">Ano Referência</Label>
                  <Input
                    id="alertYear"
                    value={alertYear}
                    onChange={(e) => setAlertYear(e.target.value)}
                    size={4}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="alertStartDate" className="text-xs">Data Limite Inicial</Label>
                  <Input
                    type="date"
                    id="alertStartDate"
                    value={alertStartDate}
                    onChange={(e) => setAlertStartDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleSearchAlerts}
                    className="h-8 text-xs w-full gap-1.5"
                    variant="outline"
                    disabled={alertLoading}
                  >
                    {alertLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Recarregar Alertas
                  </Button>
                </div>
              </div>

              {/* Sub-abas de Alertas */}
              <div className="flex gap-2 border-b border-muted">
                <button
                  onClick={() => setActiveAlertSubTab("datas")}
                  className={`pb-2 text-sm font-semibold border-b-2 px-1 transition-all ${activeAlertSubTab === "datas"
                    ? "border-rose-600 text-rose-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Datas Incorretas ({datasIncorretas.hIni.length + datasIncorretas.hFim.length})
                </button>
                <button
                  onClick={() => setActiveAlertSubTab("frota")}
                  className={`pb-2 text-sm font-semibold border-b-2 px-1 transition-all ${activeAlertSubTab === "frota"
                    ? "border-rose-600 text-rose-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Coletores Fora da Frota ({foraFrota.especiais.length + foraFrota.comuns.length})
                </button>
              </div>

              {/* Sub-aba Datas */}
              {activeAlertSubTab === "datas" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 p-2 rounded mb-2">
                      Data Inicial Incorreta (Não contém {alertYear})
                    </h4>
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted text-muted-foreground uppercase font-medium">
                          <tr>
                            <th className="px-3 py-2">Carro</th>
                            <th className="px-3 py-2">Data Inicial (HIni)</th>
                            <th className="px-3 py-2">Data Final (HFim)</th>
                            <th className="px-3 py-2">Catraca Fim</th>
                            <th className="px-3 py-2">Último Batimento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {datasIncorretas.hIni.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-4 text-muted-foreground">Nenhum veículo com data inicial inconsistente.</td>
                            </tr>
                          ) : (
                            datasIncorretas.hIni.map((row, idx) => (
                              <tr key={idx} className="hover:bg-muted/30">
                                <td className="px-3 py-2 font-semibold text-indigo-600">{row.idVeiculo}</td>
                                <td className="px-3 py-2 font-bold text-rose-600">{row.dataHIni}</td>
                                <td className="px-3 py-2">{row.dataHFim}</td>
                                <td className="px-3 py-2">{row.catracaFim}</td>
                                <td className="px-3 py-2 text-muted-foreground text-[10px]">{row.dataHoraUL}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 p-2 rounded mb-2">
                      Data Final Incorreta (Não contém {alertYear})
                    </h4>
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted text-muted-foreground uppercase font-medium">
                          <tr>
                            <th className="px-3 py-2">Carro</th>
                            <th className="px-3 py-2">Data Inicial (HIni)</th>
                            <th className="px-3 py-2">Data Final (HFim)</th>
                            <th className="px-3 py-2">Catraca Fim</th>
                            <th className="px-3 py-2">Último Batimento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {datasIncorretas.hFim.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-4 text-muted-foreground">Nenhum veículo com data final inconsistente.</td>
                            </tr>
                          ) : (
                            datasIncorretas.hFim.map((row, idx) => (
                              <tr key={idx} className="hover:bg-muted/30">
                                <td className="px-3 py-2 font-semibold text-indigo-600">{row.idVeiculo}</td>
                                <td className="px-3 py-2">{row.dataHIni}</td>
                                <td className="px-3 py-2 font-bold text-rose-600">{row.dataHFim}</td>
                                <td className="px-3 py-2">{row.catracaFim}</td>
                                <td className="px-3 py-2 text-muted-foreground text-[10px]">{row.dataHoraUL}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-aba Frota */}
              {activeAlertSubTab === "frota" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 p-2 rounded mb-2">
                      Carros Especiais ou com Prefixos Reservados (ID &gt;= 6999)
                    </h4>
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted text-muted-foreground uppercase font-medium">
                          <tr>
                            <th className="px-3 py-2">Carro</th>
                            <th className="px-3 py-2">Turno Inicial</th>
                            <th className="px-3 py-2">Turno Final</th>
                            <th className="px-3 py-2">Catraca Fim</th>
                            <th className="px-3 py-2">Data Processamento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {foraFrota.especiais.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-4 text-muted-foreground">Nenhum registro encontrado.</td>
                            </tr>
                          ) : (
                            foraFrota.especiais.map((row, idx) => (
                              <tr key={idx} className="hover:bg-muted/30">
                                <td className="px-3 py-2 font-semibold text-indigo-600">{row.idVeiculo}</td>
                                <td className="px-3 py-2">{row.dataHIni}</td>
                                <td className="px-3 py-2">{row.dataHFim}</td>
                                <td className="px-3 py-2 font-semibold">{row.catracaFim}</td>
                                <td className="px-3 py-2 text-muted-foreground text-[10px]">{row.dataHoraUL}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 p-2 rounded mb-2">
                      Possível Configuração Incorreta de ID do Validador (ID &lt; 6000 fora da frota)
                    </h4>
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted text-muted-foreground uppercase font-medium">
                          <tr>
                            <th className="px-3 py-2">Carro</th>
                            <th className="px-3 py-2">Turno Inicial</th>
                            <th className="px-3 py-2">Turno Final</th>
                            <th className="px-3 py-2">Catraca Fim</th>
                            <th className="px-3 py-2">Data Processamento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {foraFrota.comuns.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-4 text-muted-foreground">Nenhum veículo comum com prefixo desconhecido.</td>
                            </tr>
                          ) : (
                            foraFrota.comuns.map((row, idx) => (
                              <tr key={idx} className="hover:bg-muted/30">
                                <td className="px-3 py-2 font-semibold text-amber-600">{row.idVeiculo}</td>
                                <td className="px-3 py-2">{row.dataHIni}</td>
                                <td className="px-3 py-2">{row.dataHFim}</td>
                                <td className="px-3 py-2 font-semibold">{row.catracaFim}</td>
                                <td className="px-3 py-2 text-muted-foreground text-[10px]">{row.dataHoraUL}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ABA 3: BACKUP DE COLETAS (Veiculos) */}
        {activeTab === "backup" && (
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-600" />
                Gerenciamento de Coleta de Backup
              </CardTitle>
              <CardDescription>
                Permite consultar e atualizar as datas inicial e final para coleta de backup de catracas dos veículos selecionados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="backupCars">IDs dos Veículos (separados por vírgula)</Label>
                  <Input
                    id="backupCars"
                    placeholder="Ex: 1118, 1327, 2701"
                    value={backupCarIds}
                    onChange={(e) => setBackupCarIds(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleSearchBackup}
                  className="flex gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={backupLoading}
                >
                  {backupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Consultar Status
                </Button>
              </div>

              {backupData.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="rounded-md border">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted text-muted-foreground uppercase font-medium">
                        <tr>
                          <th className="px-3 py-2">Carro</th>
                          <th className="px-3 py-2">Garagem</th>
                          <th className="px-3 py-2">Início Backup</th>
                          <th className="px-3 py-2">Fim Backup</th>
                          <th className="px-3 py-2">Manutenção?</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {backupData.map((row) => (
                          <tr key={row.idCarro} className="hover:bg-muted/30">
                            <td className="px-3 py-2 font-semibold">{row.idCarro}</td>
                            <td className="px-3 py-2">{row.garage || "N/A"}</td>
                            <td className="px-3 py-2 text-indigo-600 font-semibold">{row.coletaBKPIni || "Não configurado"}</td>
                            <td className="px-3 py-2 text-indigo-600 font-semibold">{row.coletaBKPFim || "Não configurado"}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.emManutencao ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                                }`}>
                                {row.emManutencao ? "Sim" : "Não"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Form de Edição em Lote */}
                  <div className="border p-4 rounded-lg bg-emerald-50/20 dark:bg-emerald-950/5 space-y-4">
                    <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">Configurar Nova Faixa de Backup em Lote</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bkpIni">Data/Hora Início</Label>
                        <Input
                          type="datetime-local"
                          id="bkpIni"
                          value={coletaBKPIni}
                          onChange={(e) => setColetaBKPIni(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bkpFim">Data/Hora Fim</Label>
                        <Input
                          type="datetime-local"
                          id="bkpFim"
                          value={coletaBKPFim}
                          onChange={(e) => setColetaBKPFim(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleUpdateBackup}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                      disabled={updatingBackup}
                    >
                      {updatingBackup ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Aplicar Data de Backup para {backupData.length} carro(s)
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ABA 4: CONSULTA HISTÓRICO POR CARRO (TotalizadorServico) */}
        {activeTab === "consulta" && (
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Histórico de Serviços por Veículo
              </CardTitle>
              <CardDescription>
                Pesquisa individual no TotalizadorServico para auditar todos os turnos fechados de um carro específico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="histCarId">Prefixo do Carro</Label>
                  <Input
                    id="histCarId"
                    placeholder="Ex: 4251"
                    value={consultaCarId}
                    onChange={(e) => setConsultaCarId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="histDateLimit">Coletados desde (Hora UL)</Label>
                  <Input
                    type="date"
                    id="histDateLimit"
                    value={consultaDateLimit}
                    onChange={(e) => setConsultaDateLimit(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleSearchConsultaCarro}
                    className="w-full gap-1.5"
                    disabled={consultaLoading}
                  >
                    {consultaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Buscar Registros
                  </Button>
                </div>
              </div>

              {consultaData.length > 0 && (
                <div className="rounded-md border">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted text-muted-foreground uppercase font-medium">
                      <tr>
                        <th className="px-3 py-2">HIni</th>
                        <th className="px-3 py-2">HFim</th>
                        <th className="px-3 py-2 text-right">Catraca Ini</th>
                        <th className="px-3 py-2 text-right">Catraca Fim</th>
                        <th className="px-3 py-2 text-right">Total EDM</th>
                        <th className="px-3 py-2">Data Transmissão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {consultaData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="px-3 py-2">{row.dataHIni}</td>
                          <td className="px-3 py-2">{row.dataHFim}</td>
                          <td className="px-3 py-2 text-right font-medium">{row.catracaIni}</td>
                          <td className="px-3 py-2 text-right font-medium">{row.catracaFim}</td>
                          <td className="px-3 py-2 text-right font-bold text-indigo-600">{row.totalEDM}</td>
                          <td className="px-3 py-2 text-muted-foreground text-[10px]">{row.dataHoraUL}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Painel de Detalhes e Diário de Bordo (Dividido 50% / 50%) */}
      {activeTab === "consistencia" && selectedCar && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-6">

          {/* Lado Esquerdo: Detalhes do Veículo (50%) */}
          {selectedCar ? (
            <Card className="border-indigo-200 dark:border-indigo-900/60 shadow-lg bg-indigo-50/5 dark:bg-slate-900/10">
              <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-indigo-800 dark:text-indigo-400">
                    Detalhes do Veículo: {selectedCar}
                  </CardTitle>
                  <CardDescription>
                    Auditoria detalhada automática executada para a data {selectedDate}.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCar(null)} className="h-8">
                  Fechar Painel
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                {detailsLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600 mb-2" />
                    Buscando Logs de WiFi, Erros de Transmissão e Ordens de Serviço...
                  </div>
                ) : detailsData ? (
                  (() => {
                    const consistenciaBase = detailsData.consistenciaBase || {};
                    const ultimaComunicacao = detailsData.ultimaComunicacao || null;
                    const errosEvento = detailsData.errosEvento || [];
                    const primeiraLeituraLogs = detailsData.primeiraLeituraCatracaFim ||
                      detailsData.primeiraLeitura?.CatracaFim ||
                      [];
                    const ultimaLeituraLogs = detailsData.ultimaLeituraCatracaIni ||
                      detailsData.ultimaLeitura?.CatracaIni ||
                      [];

                    const parseDate = (dStr: string) => {
                      if (!dStr) return 0;
                      if (dStr.includes("/")) {
                        const [datePart, timePart] = dStr.split(" ");
                        const [day, month, year] = datePart.split("/").map(Number);
                        const [hour, min, sec] = timePart.split(":").map(Number);
                        return new Date(year, month - 1, day, hour, min, sec).getTime();
                      }
                      return new Date(dStr).getTime();
                    };

                    const earliestLog = ultimaLeituraLogs.length > 0
                      ? [...ultimaLeituraLogs].sort((a, b) => parseDate(a.DataHora) - parseDate(b.DataHora))[0]
                      : null;

                    const latestLog = primeiraLeituraLogs.length > 0
                      ? [...primeiraLeituraLogs].sort((a, b) => parseDate(b.DataHora) - parseDate(a.DataHora))[0]
                      : null;

                    return (
                      <div className="flex flex-col gap-4">

                        {/* WiFi e Eventos */}
                        {/* Ultima Conexão WiFi */}
                        <Card className="border shadow-none">
                          <CardHeader className="py-2.5 bg-muted/40 border-b flex flex-row items-center gap-2">
                            <Wifi className="h-4 w-4 text-indigo-600" />
                            <h4 className="font-semibold text-sm">Última Comunicação WiFi</h4>
                          </CardHeader>
                          <CardContent className="py-3 text-xs">
                            {ultimaComunicacao ? (
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center justify-between  gap-x-6 gap-y-2">
                                  <div className="flex flex-col">
                                    <span className="text-muted-foreground">Data/Hora:</span>{" "}
                                    <span className="font-semibold">{formatDateTime(ultimaComunicacao.UltimaComunicacao)}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-muted-foreground">Catraca Atual:</span>{" "}
                                    <span className="font-semibold">{ultimaComunicacao.CATRACA}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-muted-foreground">MAC Validador:</span>{" "}
                                    <span className="font-semibold">{ultimaComunicacao.MACValidador}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground py-2">Nenhum log WiFi registrado no período.</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Serviços Registrados */}
                        <Card className="border shadow-none">
                          <CardHeader className="py-2.5 bg-muted/40 border-b flex flex-row items-center gap-2">
                            <FileText className="h-4 w-4 text-indigo-600" />
                            <h4 className="font-semibold text-sm">Serviços Fechados (SAE)</h4>
                          </CardHeader>
                          <CardContent className="py-3 text-xs max-h-52 overflow-y-auto">
                            {detailsData.servicosPeriodo && detailsData.servicosPeriodo.length > 0 ? (
                              <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse min-w-[850px]">
                                  <thead>
                                    <tr className="text-muted-foreground border-b border-muted text-[10px] uppercase font-semibold">
                                      <th className="pb-2 font-semibold">Total EDM</th>
                                      <th className="pb-2 font-semibold">Cat. Inicial</th>
                                      <th className="pb-2 font-semibold">Cat. Final</th>
                                      <th className="pb-2 font-semibold">Linha</th>
                                      <th className="pb-2 font-semibold">Motorista</th>
                                      <th className="pb-2 font-semibold pl-4">Data Inicial</th>
                                      <th className="pb-2 font-semibold">Data Final</th>
                                      <th className="pb-2 font-semibold">Data/Hora UL</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {detailsData.servicosPeriodo.map((row: any, idx: number) => (
                                      <tr key={idx} className="border-b last:border-0 border-muted/30 hover:bg-muted/10 font-mono">
                                        <td className="py-2 font-bold text-indigo-600">{row.totalEDM}</td>
                                        <td className="py-2 text-foreground font-semibold">{row.catracaIni}</td>
                                        <td className="py-2 text-foreground font-semibold">{row.catracaFim}</td>
                                        <td className="py-2 text-muted-foreground font-semibold">{row.linha}</td>
                                        <td className="py-2 text-muted-foreground font-semibold">{row.motorista}</td>
                                        <td className="py-2 text-muted-foreground pl-4">{formatDateTime(row.dataHIni)}</td>
                                        <td className="py-2 text-muted-foreground">{formatDateTime(row.dataHFim)}</td>
                                        <td className="py-2 text-muted-foreground">{formatDateTime(row.dataHoraUL)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-muted-foreground py-2">Nenhum serviço registrado no intervalo deste dia.</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Histórico de Conexão e Ajustes (Combinado) */}
                        <Card className="border shadow-none">
                          <CardHeader className="py-2.5 bg-muted/40 border-b flex flex-row items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-indigo-600" />
                            <h4 className="font-semibold text-sm">Comunicação e Ajustes de Catraca</h4>
                          </CardHeader>
                          <CardContent className="py-4 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                              {/* 1. Primeiras Conexões */}
                              <div className="flex flex-col bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-lg border justify-between">
                                <div>
                                  <div className="font-semibold text-emerald-700 dark:text-emerald-400 text-xs mb-2 pb-1.5 border-b border-emerald-100/50 dark:border-emerald-900/30 flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                    Últimas conexões ({consistenciaBase?.catracaFim})
                                  </div>
                                  <div className="space-y-1 mt-2 bg-muted/30 p-2.5 rounded border text-[11px] font-mono">
                                    {latestLog ? (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left font-mono">
                                          <thead>
                                            <tr className="text-muted-foreground text-[10px] border-b border-muted">
                                              <th className="pb-1.5 font-semibold">MAC Validador</th>
                                              <th className="pb-1.5 text-center font-semibold">Catraca</th>
                                              <th className="pb-1.5 text-right font-semibold">Data/Hora</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr className="border-b last:border-0 border-muted/30">
                                              <td className="py-1.5 text-foreground">{latestLog.MACValidador}</td>
                                              <td className="py-1.5 text-center text-foreground font-semibold">{latestLog.CATRACA}</td>
                                              <td className="py-1.5 text-right text-muted-foreground">{formatDateTime(latestLog.DataHora)}</td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="text-muted-foreground py-2 text-xs">Nenhum log WiFi registrado com esse valor.</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 2. Ajustes de Catraca */}
                              <div className="flex flex-col bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-lg border justify-between">
                                <div>
                                  <div className="font-semibold text-amber-700 dark:text-amber-400 text-xs mb-2 pb-1.5 border-b border-amber-100/50 dark:border-amber-900/30 flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                    Ajustes de Catraca
                                  </div>
                                  <div className="space-y-1 mt-2 bg-muted/30 p-2.5 rounded border text-[11px]">
                                    {errosEvento && errosEvento.length > 0 ? (
                                      <div className="overflow-x-auto max-h-[140px] overflow-y-auto">
                                        <table className="w-full text-left font-mono">
                                          <thead>
                                            <tr className="text-muted-foreground text-[10px] border-b border-muted">
                                              <th className="pb-1.5">Cartão</th>
                                              <th className="pb-1.5 text-right">Catraca</th>
                                              <th className="pb-1.5 text-right">Data/Hora</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {errosEvento.map((err: any, idx: number) => (
                                              <tr key={idx} className="border-b last:border-0 border-muted/30">
                                                <td className="py-1 font-semibold text-rose-600">{err.idCartao}</td>
                                                <td className="py-1 text-right">{err.catraca}</td>
                                                <td className="py-1 text-right text-muted-foreground">{formatDateTime(err.Datahora)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="text-muted-foreground py-2 text-xs">Nenhum erro de evento codErro = 154 registrado.</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 3. Últimas Conexões */}

                              <div className="flex flex-col bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-lg border justify-between">
                                <div>
                                  <div className="font-semibold text-indigo-700 dark:text-indigo-400 text-xs mb-2 pb-1.5 border-b border-indigo-100/50 dark:border-indigo-900/30 flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                                    Primeiras conexões ({consistenciaBase?.catracaIni})
                                  </div>
                                  <div className="space-y-1 mt-2 bg-muted/30 p-2.5 rounded border text-[11px] font-mono">
                                    {earliestLog ? (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left font-mono">
                                          <thead>
                                            <tr className="text-muted-foreground text-[10px] border-b border-muted">
                                              <th className="pb-1.5 font-semibold">MAC Validador</th>
                                              <th className="pb-1.5 text-center font-semibold">Catraca</th>
                                              <th className="pb-1.5 text-right font-semibold">Data/Hora</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr className="border-b last:border-0 border-muted/30">
                                              <td className="py-1.5 text-foreground">{earliestLog.MACValidador}</td>
                                              <td className="py-1.5 text-center text-foreground font-semibold">{earliestLog.CATRACA}</td>
                                              <td className="py-1.5 text-right text-muted-foreground">{formatDateTime(earliestLog.DataHora)}</td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="text-muted-foreground py-2 text-xs">Nenhum log WiFi registrado com esse valor.</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                            </div>
                          </CardContent>
                        </Card>

                        {/* Ordem de Serviço Bilhetagem */}
                        <Card className="border shadow-none">
                          <CardHeader className="py-2.5 bg-muted/40 border-b flex flex-row items-center gap-2">
                            <Wrench className="h-4 w-4 text-indigo-600" />
                            <h4 className="font-semibold text-sm">Ordem de Serviço (Bilhetagem)</h4>
                          </CardHeader>
                          <CardContent className="py-3 text-xs">
                            {detailsData.ordemServicoBilhetagem ? (
                              <div className="space-y-2">
                                <div className="flex justify-between border-b pb-1">
                                  <span className="font-semibold">ID OS: {detailsData.ordemServicoBilhetagem.Id}</span>
                                  <span className="text-muted-foreground">{formatDateTime(detailsData.ordemServicoBilhetagem.DataHora)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Equipamento: <span className="text-black" >Validador</span></span>
                                  <span className="text-muted-foreground">Status da OS: <span className="font-bold text-indigo-600">{detailsData.ordemServicoBilhetagem.status}</span></span>
                                </div>
                                <div className="pt-2">
                                  <details className="group border rounded-md overflow-hidden bg-muted/20">
                                    <summary className="flex justify-between items-center font-semibold text-[11px] text-muted-foreground p-2 bg-muted/40 cursor-pointer list-none select-none hover:bg-muted/60 transition-colors">
                                      <span>Descrição ({detailsData.ordemServicoBilhetagem.itens?.length || 0})</span>
                                      <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180 text-muted-foreground" />
                                    </summary>
                                    <div className="p-2 border-t bg-background">
                                      {detailsData.ordemServicoBilhetagem.itens && detailsData.ordemServicoBilhetagem.itens.length > 0 ? (
                                        <ul className="space-y-1 text-[11px]">
                                          {detailsData.ordemServicoBilhetagem.itens.map((it: any, idx: number) => (
                                            <li key={idx} className="flex flex-col border-b last:border-0 pb-1.5 mb-1.5 last:pb-0 last:mb-0 border-muted/50">
                                              {it.observacaoProblema && (
                                                <div>
                                                  <strong className="text-rose-600 dark:text-rose-400">Problema:</strong>{" "}
                                                  <span>{it.observacaoProblema}</span>
                                                </div>
                                              )}
                                              {it.observacaoSolucao && (
                                                <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                                                  <strong>Solução:</strong>{" "}
                                                  <span>{it.observacaoSolucao}</span>
                                                </div>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <div className="text-muted-foreground text-[10px] py-1">Nenhum item registrado.</div>
                                      )}
                                    </div>
                                  </details>
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground py-2">Nenhuma Ordem de Serviço recente encontrada com equipamento de catraca/validador.</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Ordem de Serviço Simanet */}
                        <Card className="border shadow-none">
                          <CardHeader className="py-2.5 bg-muted/40 border-b flex flex-row items-center gap-2">
                            <Wrench className="h-4 w-4 text-emerald-600" />
                            <h4 className="font-semibold text-sm">OS de Oficina Física (Simanet)</h4>
                          </CardHeader>
                          <CardContent className="py-3 text-xs">
                            {detailsData.ordemServicoSimanet ? (
                              <div className="space-y-2">
                                <div className="flex justify-between border-b pb-1">
                                  <span className="font-semibold">ID OS: {detailsData.ordemServicoSimanet.IdOrdemServico}</span>
                                  <span className="text-muted-foreground">{formatDateTime(detailsData.ordemServicoSimanet.DataHora)}</span>
                                </div>
                                <div className="grid grid-cols-2">
                                  <span className="text-muted-foreground">Status da OS:</span>
                                  <span className="font-bold text-indigo-600">{detailsData.ordemServicoSimanet.status}</span>
                                </div>
                                <div className="pt-2">
                                  <details className="group border rounded-md overflow-hidden bg-muted/20">
                                    <summary className="flex justify-between items-center font-semibold text-[11px] text-muted-foreground p-2 bg-muted/40 cursor-pointer list-none select-none hover:bg-muted/60 transition-colors">
                                      <span>Equipamentos em Análise ({detailsData.ordemServicoSimanet.equipamentos?.length || 0})</span>
                                      <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180 text-muted-foreground" />
                                    </summary>
                                    <div className="p-2 border-t bg-background">
                                      {detailsData.ordemServicoSimanet.equipamentos && detailsData.ordemServicoSimanet.equipamentos.length > 0 ? (
                                        <ul className="space-y-1 text-[11px]">
                                          {detailsData.ordemServicoSimanet.equipamentos.map((eq: any, idx: number) => (
                                            <li key={idx} className="flex flex-col border-b last:border-0 pb-1 mb-1 last:pb-0 last:mb-0 border-muted/50">
                                              <div className="flex justify-between font-semibold">
                                                <span>{eq.descricao}</span>
                                                <span className="text-muted-foreground text-[10px]">{eq.numeroSerie}</span>
                                              </div>
                                              <span className="text-rose-600 text-[10px]">{eq.defeitoRelatado}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <div className="text-muted-foreground text-[10px] py-1">Nenhum equipamento em análise.</div>
                                      )}
                                    </div>
                                  </details>
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground py-2">Nenhuma Ordem de Serviço de equipamento Tipo 2 encontrada no Simanet.</div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-6 text-muted-foreground">Selecione uma divergência para obter a auditoria completa automaticamente.</div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed bg-muted/10 h-full flex flex-col items-center justify-center p-6 min-h-[350px] shadow-sm">
              <div className="text-center space-y-2">
                <AlertTriangle className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                <p className="font-semibold text-sm text-muted-foreground">Nenhum Veículo Selecionado</p>
                <p className="text-xs text-muted-foreground/80 max-w-[280px]">
                  Clique em "Inspecionar" em qualquer carro da tabela de divergências acima para carregar logs de WiFi, erros de evento e ordens de serviço.
                </p>
              </div>
            </Card>
          )}

          {/* Lado Direito: Visualizador de Diário de Bordo (50%) */}
          <div className="space-y-6">
            <Card className="shadow-md border-indigo-100 dark:border-indigo-950">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-indigo-800 dark:text-indigo-400">
                  <FileText className="h-5 w-5" />
                  Consulta de Diário de Bordo (PDF)
                </CardTitle>
                <CardDescription>
                  Carrega o diário de bordo digitalizado arquivado no servidor de imagens.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">

                {/* Informação Fixa do Veículo Selecionado */}
                <div className="grid grid-cols-2 gap-4 bg-muted/40 p-3 rounded-lg border text-xs">
                  <div>
                    <span className="text-muted-foreground block font-medium">Veículo Selecionado:</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">{pdfCarId || "Nenhum"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Data de Referência:</span>
                    <span className="font-semibold text-foreground">
                      {pdfDateIni && pdfDateFim && pdfDateIni !== pdfDateFim
                        ? `${pdfDateIni.split("-")[2]}/${pdfDateIni.split("-")[1]}/${pdfDateIni.split("-")[0]} a ${pdfDateFim.split("-")[2]}/${pdfDateFim.split("-")[1]}/${pdfDateFim.split("-")[0]}`
                        : (pdfDateIni ? `${pdfDateIni.split("-")[2]}/${pdfDateIni.split("-")[1]}/${pdfDateIni.split("-")[0]}` : "Nenhuma")}
                    </span>
                  </div>
                </div>

                {/* Seletor de data quando há intervalo */}
                {pdfDaysList.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-muted-foreground">Selecione o Diário para Visualizar no Split Screen:</Label>
                      {loadingDiarios && (
                        <span className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400">
                          <Loader2 className="h-3 w-3 animate-spin" /> Verificando arquivos no servidor...
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {pdfDaysList.map((day, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActivePdfUrl(day.url)}
                          className={`flex items-center justify-between text-left p-3 rounded-lg border transition-all text-xs ${activePdfUrl === day.url
                            ? "bg-indigo-600 border-indigo-700 text-white font-semibold shadow-sm"
                            : "bg-background hover:bg-muted border-muted text-foreground"
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-indigo-500" />
                            <span>{day.label}</span>
                          </span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Container do Iframe PDF */}
                {activePdfUrl ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 justify-between items-center text-xs text-muted-foreground p-1 border-b">
                      <span className="font-semibold text-indigo-700 dark:text-indigo-400 truncate max-w-[200px]" title={activePdfUrl}>
                        Carro {pdfCarId} | PDF
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={handleCopyUrl}
                          title="Copiar Link do PDF"
                        >
                          {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        <a
                          href={activePdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 hover:text-indigo-600 transition-colors font-medium"
                        >
                          Nova Aba <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Iframe */}
                    <div className="relative rounded-lg border overflow-hidden bg-muted/20 h-[600px] flex items-center justify-center">
                      <iframe
                        src={activePdfUrl}
                        className="w-full h-full"
                        title="Diário de Bordo PDF"
                      />

                      {/* Alerta de erro de carregamento local/HTTP se aplicável */}
                      <div className="absolute bottom-2 left-2 right-2 bg-black/80 text-white text-[10px] p-2 rounded flex justify-between items-center">
                        <span>Caso o PDF não carregue por restrições do navegador, clique em "Nova Aba".</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg bg-muted/10">
                    <FileText className="h-12 w-12 text-muted-foreground/45 mb-3" />
                    <p className="text-sm font-semibold text-muted-foreground">Nenhum Diário Selecionado</p>
                    <p className="text-xs text-muted-foreground/80 max-w-[250px] text-center mt-1">
                      Selecione um veículo com discrepância à esquerda ou faça uma pesquisa manual para abrir seu diário de bordo digitalizado.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ABA 5: CONSULTA DE DIÁRIO DE BORDO (PDF) STANDALONE */}
      {activeTab === "diario" && (
        <div className="space-y-6">
          <Card className="shadow-md border-indigo-100 dark:border-indigo-950">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-indigo-800 dark:text-indigo-400">
                <FileText className="h-5 w-5" />
                Consulta de Diário de Bordo (PDF)
              </CardTitle>
              <CardDescription>
                Carrega o diário de bordo digitalizado arquivado no servidor de imagens.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">

              {/* Form Manual de Busca */}
              <form onSubmit={handleManualPdfGeneration} className="grid grid-cols-3 gap-3 bg-muted/30 p-3 rounded-lg border">
                <div className="col-span-1">
                  <Label htmlFor="pdfCar" className="text-xs">Número do Carro</Label>
                  <Input
                    id="pdfCar"
                    placeholder="Ex: 1118"
                    value={pdfCarId}
                    onChange={(e) => setPdfCarId(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="pdfIni" className="text-xs">Data Inicial</Label>
                  <Input
                    type="date"
                    id="pdfIni"
                    value={pdfDateIni}
                    onChange={(e) => setPdfDateIni(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="pdfFim" className="text-xs">Data Final</Label>
                  <Input
                    type="date"
                    id="pdfFim"
                    value={pdfDateFim}
                    onChange={(e) => setPdfDateFim(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <Button type="submit" className="col-span-2 h-8 text-xs font-semibold gap-1" variant="secondary">
                  Gerar Link(s) do Diário
                </Button>
              </form>

              {/* Seletor de data quando há intervalo */}
              {pdfDaysList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground">Selecione o Diário para Visualizar:</Label>
                    {loadingDiarios && (
                      <span className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400">
                        <Loader2 className="h-3 w-3 animate-spin" /> Verificando arquivos no servidor...
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {pdfDaysList.map((day, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePdfUrl(day.url)}
                        className={`flex items-center justify-between text-left p-3 rounded-lg border transition-all text-xs ${activePdfUrl === day.url
                          ? "bg-indigo-600 border-indigo-700 text-white font-semibold shadow-md"
                          : "bg-background hover:bg-muted border-muted text-foreground"
                          }`}
                      >
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-indigo-500" />
                          <span>{day.label}</span>
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Container do Iframe PDF */}
              {activePdfUrl ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 justify-between items-center text-xs text-muted-foreground p-1 border-b">
                    <span className="font-semibold text-indigo-700 dark:text-indigo-400 truncate max-w-[200px]" title={activePdfUrl}>
                      Carro {pdfCarId} | PDF
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={handleCopyUrl}
                        title="Copiar Link do PDF"
                      >
                        {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                      <a
                        href={activePdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors font-medium"
                      >
                        Nova Aba <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Iframe */}
                  <div className="relative rounded-lg border overflow-hidden bg-muted/20 h-[600px] flex items-center justify-center">
                    <iframe
                      src={activePdfUrl}
                      className="w-full h-full"
                      title="Diário de Bordo PDF"
                    />

                    {/* Alerta de erro de carregamento local/HTTP se aplicável */}
                    <div className="absolute bottom-2 left-2 right-2 bg-black/80 text-white text-[10px] p-2 rounded flex justify-between items-center">
                      <span>Caso o PDF não carregue por restrições do navegador, clique em "Nova Aba".</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg bg-muted/10">
                  <FileText className="h-12 w-12 text-muted-foreground/45 mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">Nenhum Diário Selecionado</p>
                  <p className="text-xs text-muted-foreground/80 max-w-[250px] text-center mt-1">
                    Faça uma pesquisa manual para abrir seu diário de bordo digitalizado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div >
  );
}
