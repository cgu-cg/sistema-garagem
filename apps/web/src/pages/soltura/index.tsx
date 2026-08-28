import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Search, 
  Bus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Printer, 
  RefreshCw, 
  Wrench, 
  MapPin, 
  Calendar, 
  ShieldAlert,
  SlidersHorizontal,
  Undo2,
  Check,
  Zap
} from "lucide-react";
import { 
  SolturaItem, 
  vcgSegundaSexta, 
  vcgSabado, 
  vcgDomingoFeriado, 
  vcmSegundaSexta, 
  vcmSabado, 
  vcmDomingoFeriado, 
  terminaisReservaVCG, 
  terminaisReservaVCM,
  BloqueioCarro,
  TerminalReserva
} from "@/data/solturaData";
import { drivers } from "@/data/drivers";
import { cn } from "@/lib/utils";
import { CiManutencaoView } from "./CiManutencaoView";
import { CarroRealizadoView } from "./CarroRealizadoView";
import { getInitialCIBloqueios, checkCarroBloqueado, subscribeCIUpdates } from "./ciManager";

type GaragemType = "VCG" | "VCM";
type EscalaTipo = "SEG_SEX" | "SABADO" | "DOM_FER";
export type ViewMode = "FOLHA" | "CARRO_REALIZADO" | "CI_MANUTENCAO" | "CARDS" | "CI_BLOQUEIOS" | "RESERVAS";
type FilterStatus = "TODOS" | "PENDENTES" | "LIBERADOS" | "SUBSTITUIDOS" | "ATRASADOS";

interface DispatchedRecord {
  scheduleId: string;
  carroRealizado: string;
  motoristaCodigo: string;
  motoristaNome: string;
  horaLiberacao: string;
  observacoes?: string;
  substituido: boolean;
}

interface SolturaPageProps {
  defaultTab?: ViewMode;
}

export function SolturaPage({ defaultTab }: SolturaPageProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Garagem e tipo de escala
  const [garagem, setGaragem] = useState<GaragemType>("VCG");
  const [escalaTipo, setEscalaTipo] = useState<EscalaTipo>("SEG_SEX");
  const [dataOperacao, setDataOperacao] = useState(() => new Date().toISOString().split("T")[0]);
  
  // Modos de visualização
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (location.pathname.includes("/ci-manutencao")) return "CI_MANUTENCAO";
    if (location.pathname.includes("/carro-realizado")) return "CARRO_REALIZADO";
    return defaultTab || "FOLHA";
  });

  // Atualizar viewMode baseado na URL quando a rota mudar
  useEffect(() => {
    if (location.pathname.endsWith("/ci-manutencao")) {
      setViewMode("CI_MANUTENCAO");
    } else if (location.pathname.endsWith("/carro-realizado")) {
      setViewMode("CARRO_REALIZADO");
    } else if (location.pathname.endsWith("/soltura") && !defaultTab) {
      // Manter se for CARDS ou RESERVAS, caso contrário FOLHA
      if (viewMode === "CI_MANUTENCAO" || viewMode === "CARRO_REALIZADO") {
        setViewMode("FOLHA");
      }
    } else if (defaultTab) {
      setViewMode(defaultTab);
    }
  }, [location.pathname, defaultTab]);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>("TODOS");
  const [searchQuery, setSearchQuery] = useState("");

  // Base de CIs Bloqueados sincronizada e persistida
  const [ciList, setCiList] = useState<BloqueioCarro[]>(() => getInitialCIBloqueios());

  useEffect(() => {
    const unsubscribe = subscribeCIUpdates((updated) => {
      setCiList(updated);
    });
    return unsubscribe;
  }, []);

  // Despachos em memória / sincronizados localmente e via backend
  const [dispatches, setDispatches] = useState<Record<string, DispatchedRecord>>(() => {
    try {
      const saved = localStorage.getItem(`soltura_dispatches_${garagem}_${escalaTipo}_${dataOperacao}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modal de liberação rápida
  const [selectedItem, setSelectedItem] = useState<SolturaItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputCarroRealizado, setInputCarroRealizado] = useState("");
  const [inputMotoristaCodigo, setInputMotoristaCodigo] = useState("");
  const [inputMotoristaNome, setInputMotoristaNome] = useState("");
  const [inputObs, setInputObs] = useState("");

  // Recarregar despachos quando trocar garagem, escala ou data
  useEffect(() => {
    try {
      const key = `soltura_dispatches_${garagem}_${escalaTipo}_${dataOperacao}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setDispatches(JSON.parse(saved));
      } else {
        setDispatches({});
      }
    } catch {
      setDispatches({});
    }
  }, [garagem, escalaTipo, dataOperacao]);

  // Persistir despachos no localStorage
  const saveDispatches = (newDispatches: Record<string, DispatchedRecord>) => {
    setDispatches(newDispatches);
    try {
      const key = `soltura_dispatches_${garagem}_${escalaTipo}_${dataOperacao}`;
      localStorage.setItem(key, JSON.stringify(newDispatches));
    } catch (e) {
      console.error("Falha ao salvar localStorage", e);
    }
  };

  // Base de dados ativa baseada na Garagem e no Dia
  const baseSchedules = useMemo<SolturaItem[]>(() => {
    if (garagem === "VCG") {
      if (escalaTipo === "SEG_SEX") return vcgSegundaSexta;
      if (escalaTipo === "SABADO") return vcgSabado;
      return vcgDomingoFeriado;
    } else {
      if (escalaTipo === "SEG_SEX") return vcmSegundaSexta;
      if (escalaTipo === "SABADO") return vcmSabado;
      return vcmDomingoFeriado;
    }
  }, [garagem, escalaTipo]);

  // Reservas ativas
  const reservasAtivas = useMemo<TerminalReserva[]>(() => {
    return garagem === "VCG" ? terminaisReservaVCG : terminaisReservaVCM;
  }, [garagem]);

  // Mapear itens mesclando programação base + despachos realizados
  const activeSchedules = useMemo(() => {
    return baseSchedules.map(item => {
      const dispatch = dispatches[item.id];
      if (dispatch) {
        return {
          ...item,
          carroRealizado: dispatch.carroRealizado,
          motoristaCodigo: dispatch.motoristaCodigo,
          motoristaNome: dispatch.motoristaNome,
          horaLiberacao: dispatch.horaLiberacao,
          observacoes: dispatch.observacoes,
          status: (dispatch.substituido ? "SUBSTITUIDO" : "LIBERADO") as "LIBERADO" | "SUBSTITUIDO"
        };
      }
      return item;
    });
  }, [baseSchedules, dispatches]);

  // Estatísticas operacionais
  const stats = useMemo(() => {
    const total = activeSchedules.length;
    const liberados = activeSchedules.filter(s => s.status === "LIBERADO" || s.status === "SUBSTITUIDO").length;
    const substituidos = activeSchedules.filter(s => s.status === "SUBSTITUIDO" || (s.carroRealizado && s.carroRealizado !== s.carroProgramado)).length;
    const pendentes = total - liberados;
    const percentual = total > 0 ? Math.round((liberados / total) * 100) : 0;
    
    // Contar CIs ativos para a garagem selecionada
    const totalBloqueadosCI = ciList.filter(c => (!c.status || c.status === "BLOQUEADO") && (!c.garagem || c.garagem === garagem || c.garagem === "TODAS")).length;

    return { total, liberados, substituidos, pendentes, percentual, totalBloqueadosCI };
  }, [activeSchedules, ciList, garagem]);

  // Função para verificar se o carro está em CI Bloqueado
  const checkBloqueioCI = (prefixo?: string) => {
    if (!prefixo) return null;
    return checkCarroBloqueado(prefixo, ciList);
  };

  // Filtro de pesquisa e status
  const filteredSchedules = useMemo(() => {
    return activeSchedules.filter(item => {
      // Filtro de Status
      const isDone = item.status === "LIBERADO" || item.status === "SUBSTITUIDO";
      const isSub = item.status === "SUBSTITUIDO" || (item.carroRealizado && item.carroRealizado !== item.carroProgramado);
      
      if (filterStatus === "PENDENTES" && isDone) return false;
      if (filterStatus === "LIBERADOS" && !isDone) return false;
      if (filterStatus === "SUBSTITUIDOS" && !isSub) return false;

      // Filtro de Texto
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.linha.toLowerCase().includes(q) ||
        item.tabela.toLowerCase().includes(q) ||
        item.carroProgramado.toLowerCase().includes(q) ||
        (item.carroRealizado && item.carroRealizado.toLowerCase().includes(q)) ||
        (item.motoristaCodigo && item.motoristaCodigo.toLowerCase().includes(q)) ||
        (item.motoristaNome && item.motoristaNome.toLowerCase().includes(q)) ||
        item.saidaGaragem.includes(q)
      );
    });
  }, [activeSchedules, filterStatus, searchQuery]);

  // Dividir em 2 colunas para exibição estilo Prancheta / Folha
  const { colunaEsquerda, colunaDireita } = useMemo(() => {
    const meio = Math.ceil(filteredSchedules.length / 2);
    return {
      colunaEsquerda: filteredSchedules.slice(0, meio),
      colunaDireita: filteredSchedules.slice(meio)
    };
  }, [filteredSchedules]);

  // Abrir Modal de Despacho
  const handleOpenDispatch = (item: SolturaItem) => {
    const currentDispatch = dispatches[item.id];
    setSelectedItem(item);
    setInputCarroRealizado(currentDispatch?.carroRealizado || item.carroProgramado || "");
    setInputMotoristaCodigo(currentDispatch?.motoristaCodigo || item.motoristaCodigo || "");
    setInputMotoristaNome(currentDispatch?.motoristaNome || item.motoristaNome || "");
    setInputObs(currentDispatch?.observacoes || item.observacoes || "");
    setIsDialogOpen(true);
  };

  // Atualizar código de motorista e sugerir nome
  const handleMotoristaCodeChange = (code: string) => {
    setInputMotoristaCodigo(code);
    const found = drivers.find(d => d.code.toLowerCase() === code.trim().toLowerCase());
    if (found) {
      setInputMotoristaNome(found.name);
    }
  };

  // Liberar saída no Modal
  const handleConfirmDispatch = async () => {
    if (!selectedItem) return;
    const finalCarro = inputCarroRealizado.trim() || selectedItem.carroProgramado;
    const finalMotoCode = inputMotoristaCodigo.trim();

    if (!finalCarro) {
      toast.error("Informe o prefixo do carro realizado.");
      return;
    }

    // Verificar bloqueio no CI
    const bloqueio = checkBloqueioCI(finalCarro);
    if (bloqueio) {
      toast.warning(`Atenção: Carro ${finalCarro} está no CI (${bloqueio.motivo})! Verifique com a manutenção.`, {
        duration: 5000
      });
    }

    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
    const substituido = finalCarro !== selectedItem.carroProgramado;

    const newRecord: DispatchedRecord = {
      scheduleId: selectedItem.id,
      carroRealizado: finalCarro,
      motoristaCodigo: finalMotoCode || "01",
      motoristaNome: inputMotoristaNome || (finalMotoCode ? `Motorista ${finalMotoCode}` : "Motorista Escalado"),
      horaLiberacao: horaAtual,
      observacoes: inputObs,
      substituido
    };

    const updated = { ...dispatches, [selectedItem.id]: newRecord };
    saveDispatches(updated);

    toast.success(`Linha ${selectedItem.linha} Tab ${selectedItem.tabela} liberada com sucesso! Carro: ${finalCarro}`);
    setIsDialogOpen(false);
    setSelectedItem(null);
  };

  // Liberação Rápida Direta (1 clique com carro programado)
  const handleQuickRelease = (item: SolturaItem) => {
    const finalCarro = item.carroRealizado || item.carroProgramado;
    const bloqueio = checkBloqueioCI(finalCarro);
    if (bloqueio) {
      toast.warning(`Atenção: Carro ${finalCarro} consta no CI como: ${bloqueio.motivo}!`);
    }

    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

    const newRecord: DispatchedRecord = {
      scheduleId: item.id,
      carroRealizado: finalCarro,
      motoristaCodigo: item.motoristaCodigo || "01",
      motoristaNome: item.motoristaNome || "Motorista Escalado",
      horaLiberacao: horaAtual,
      substituido: finalCarro !== item.carroProgramado
    };

    const updated = { ...dispatches, [item.id]: newRecord };
    saveDispatches(updated);
    toast.success(`Linha ${item.linha} / Tab ${item.tabela} liberada às ${horaAtual}!`);
  };

  // Desfazer liberação
  const handleUndoDispatch = (itemId: string) => {
    const updated = { ...dispatches };
    delete updated[itemId];
    saveDispatches(updated);
    toast.info("Liberação desfeita. Registro retornado para pendente.");
  };

  // Atualização rápida inline de Carro ou Motorista ao pressionar Enter na célula
  const handleInlineCommit = (item: SolturaItem, field: "carro" | "motorista", value: string) => {
    const current = dispatches[item.id];
    const agora = new Date();
    const horaAtual = current?.horaLiberacao || `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
    
    let finalCarro = current?.carroRealizado || item.carroProgramado;
    let finalMoto = current?.motoristaCodigo || "";
    let finalNome = current?.motoristaNome || "";

    if (field === "carro") {
      finalCarro = value.trim() || item.carroProgramado;
      const bloqueio = checkBloqueioCI(finalCarro);
      if (bloqueio) {
        toast.warning(`Carro ${finalCarro} em CI: ${bloqueio.motivo}`);
      }
    } else {
      finalMoto = value.trim();
      const driverObj = drivers.find(d => d.code === finalMoto);
      finalNome = driverObj ? driverObj.name : (finalMoto ? `Motorista ${finalMoto}` : "");
    }

    const updated: DispatchedRecord = {
      scheduleId: item.id,
      carroRealizado: finalCarro,
      motoristaCodigo: finalMoto || "01",
      motoristaNome: finalNome || "Motorista Escalado",
      horaLiberacao: horaAtual,
      substituido: finalCarro !== item.carroProgramado
    };

    saveDispatches({ ...dispatches, [item.id]: updated });
    toast.success(`Registro atualizado!`);
  };

  // Imprimir folha A4
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-16">
      
      {/* ========================================================= */}
      {/* CABEÇALHO PRINCIPAL E SELETORES DE GARAGEM / ESCALA */}
      {/* ========================================================= */}
      <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Título e Identificação Oficial */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                  CGU.REG.OP.0001
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Consórcio Guaicurus
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
                Controle de Soltura da Frota
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Despacho diário de veículos, controle de motoristas (MOTO) e horários de saída
              </p>
            </div>
          </div>

          {/* Seletor de Garagem e Escala */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Seletor de Garagem */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border">
              <button
                type="button"
                onClick={() => setGaragem("VCG")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  garagem === "VCG"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Viação Campo Grande (VCG)
              </button>

              <button
                type="button"
                onClick={() => setGaragem("VCM")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  garagem === "VCM"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Viação Cidade Morena (VCM)
              </button>
            </div>

            {/* Seletor de Escala */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border">
              <button
                type="button"
                onClick={() => setEscalaTipo("SEG_SEX")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  escalaTipo === "SEG_SEX"
                    ? "bg-background text-foreground shadow-2xs font-bold border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Segunda a Sexta
              </button>

              <button
                type="button"
                onClick={() => setEscalaTipo("SABADO")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  escalaTipo === "SABADO"
                    ? "bg-background text-foreground shadow-2xs font-bold border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sábado
              </button>

              <button
                type="button"
                onClick={() => setEscalaTipo("DOM_FER")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  escalaTipo === "DOM_FER"
                    ? "bg-background text-foreground shadow-2xs font-bold border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Dom / Feriado
              </button>
            </div>

            {/* Data e Ação Imprimir */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-background border px-2.5 py-1.5 rounded-xl text-xs">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="date"
                  value={dataOperacao}
                  onChange={(e) => setDataOperacao(e.target.value)}
                  className="bg-transparent text-xs font-semibold focus:outline-hidden cursor-pointer"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-9 px-3 text-xs gap-1.5 border-dashed"
                title="Imprimir folha de soltura em formato papel A4"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir A4</span>
              </Button>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* BARRA DE ESTATÍSTICAS E PROGRESSO OPERACIONAL */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t">
          
          {/* Card Total */}
          <div className="bg-muted/40 p-2.5 rounded-xl border">
            <span className="text-[11px] text-muted-foreground font-medium block">Total Programado</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-foreground">{stats.total}</span>
              <span className="text-[10px] text-muted-foreground">viagens</span>
            </div>
          </div>

          {/* Card Liberados */}
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Liberados
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.liberados}</span>
              <span className="text-[10px] text-emerald-700/70 dark:text-emerald-300/70">carros na rua</span>
            </div>
          </div>

          {/* Card Pendentes */}
          <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" /> Pendentes
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.pendentes}</span>
              <span className="text-[10px] text-amber-700/70 dark:text-amber-300/70">na garagem</span>
            </div>
          </div>

          {/* Card Substituídos (Trocados) */}
          <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
            <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-blue-500" /> Substituídos
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.substituidos}</span>
              <span className="text-[10px] text-blue-700/70 dark:text-blue-300/70">trocas</span>
            </div>
          </div>

          {/* Card CI Bloqueios */}
          <div 
            onClick={() => {
              setViewMode("CI_MANUTENCAO");
              navigate("/soltura/ci-manutencao");
            }}
            className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 cursor-pointer hover:bg-rose-500/15 transition-all"
            title="Clique para abrir a tela de CI Manutenção"
          >
            <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium flex items-center gap-1">
              <Wrench className="w-3 h-3 text-rose-500" /> CI Manutenção
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{stats.totalBloqueadosCI}</span>
              <span className="text-[10px] text-rose-700/70 dark:text-rose-300/70">bloqueados</span>
            </div>
          </div>

          {/* Card Taxa de Soltura */}
          <div className="bg-primary/5 p-2.5 rounded-xl border border-primary/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-primary font-bold">Soltura</span>
              <span className="text-xs font-bold text-primary">{stats.percentual}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.percentual}%` }}
              />
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* ABAS DE NAVEGAÇÃO DE MODOS E BARRA DE BUSCA */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Abas */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setViewMode("FOLHA");
              navigate("/soltura");
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
              viewMode === "FOLHA"
                ? "bg-background text-foreground shadow-2xs border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="w-3.5 h-3.5 text-primary" />
            Folha de Soltura (Prancheta Digital)
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode("CARRO_REALIZADO");
              navigate("/soltura/carro-realizado");
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
              viewMode === "CARRO_REALIZADO"
                ? "bg-blue-600 text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            Alimentar Carro Realiz. (P)
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode("CI_MANUTENCAO");
              navigate("/soltura/ci-manutencao");
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
              viewMode === "CI_MANUTENCAO" || viewMode === "CI_BLOQUEIOS"
                ? "bg-rose-600 text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
            Alimentar CI Manutenção ({stats.totalBloqueadosCI})
          </button>

          <button
            type="button"
            onClick={() => setViewMode("CARDS")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
              viewMode === "CARDS"
                ? "bg-background text-foreground shadow-2xs border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bus className="w-3.5 h-3.5 text-primary" />
            Cartões de Pista
          </button>

          <button
            type="button"
            onClick={() => setViewMode("RESERVAS")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
              viewMode === "RESERVAS"
                ? "bg-background text-foreground shadow-2xs border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            Carros Reservas Terminais ({reservasAtivas.length})
          </button>
        </div>

        {/* Filtros de Status e Busca */}
        {viewMode !== "CI_MANUTENCAO" && viewMode !== "CI_BLOQUEIOS" && viewMode !== "RESERVAS" && viewMode !== "CARRO_REALIZADO" && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border">
              {(["TODOS", "PENDENTES", "LIBERADOS", "SUBSTITUIDOS"] as FilterStatus[]).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={cn(
                    "px-2 py-1 rounded text-[11px] font-semibold transition-all",
                    filterStatus === st
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {st === "TODOS" && `Todos (${stats.total})`}
                  {st === "PENDENTES" && `Pendentes (${stats.pendentes})`}
                  {st === "LIBERADOS" && `Liberados (${stats.liberados})`}
                  {st === "SUBSTITUIDOS" && `Trocados (${stats.substituidos})`}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar linha, tab, carro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-card"
              />
            </div>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* VISUALIZAÇÃO 1: FOLHA DE SOLTURA / PRANCHETA DIGITAL */}
      {/* Idêntico às fotos dos formulários de papel de VCG e VCM */}
      {/* ========================================================= */}
      {viewMode === "FOLHA" && (
        <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* Header da Folha de Papel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/80 gap-2">
            <div>
              <div className="text-[11px] font-mono text-muted-foreground uppercase">
                Consórcio Guaicurus • Garagem {garagem === "VCG" ? "Viação Campo Grande" : "Viação Cidade Morena"}
              </div>
              <h2 className="text-base font-bold text-foreground">
                Horário de Saída de Veículos • {escalaTipo === "SEG_SEX" ? "Segunda a Sexta" : escalaTipo === "SABADO" ? "Sábado" : "Domingo e Feriado"}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Carro Liberado
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Carro Trocado / Substituto
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Saída Pendente
              </span>
            </div>
          </div>

          {/* Grade de 2 Colunas Lado a Lado (como no papel físico) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            
            {/* Coluna 1 */}
            <div className="border rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-muted/70 px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b">
                <span>Coluna 01 (Ordens 01 a {colunaEsquerda.length})</span>
                <span>{colunaEsquerda.length} horários</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold">
                      <th className="py-2 px-2.5 w-12 text-center">N° / Ord</th>
                      <th className="py-2 px-2.5 font-bold text-foreground">Linha</th>
                      <th className="py-2 px-2 text-center">Tab</th>
                      <th className="py-2 px-2.5">Carro Prog.</th>
                      <th className="py-2 px-2.5 bg-primary/5 text-primary font-bold">Carro Realiz. (P)</th>
                      <th className="py-2 px-2.5">MOTO</th>
                      <th className="py-2 px-2 text-center font-bold">Saída Gar.</th>
                      <th className="py-2 px-2 text-center text-muted-foreground">Início Linha</th>
                      <th className="py-2 px-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {colunaEsquerda.map((item, idx) => (
                      <FolhaTableRow
                        key={item.id}
                        item={item}
                        index={item.ordem || idx + 1}
                        checkBloqueioCI={checkBloqueioCI}
                        onOpenDispatch={handleOpenDispatch}
                        onQuickRelease={handleQuickRelease}
                        onUndoDispatch={handleUndoDispatch}
                        onInlineCommit={handleInlineCommit}
                      />
                    ))}
                    {colunaEsquerda.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-muted-foreground font-sans">
                          Nenhum registro encontrado para este filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Coluna 2 */}
            <div className="border rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-muted/70 px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b">
                <span>Coluna 02 (Ordens {colunaEsquerda.length + 1} a {filteredSchedules.length})</span>
                <span>{colunaDireita.length} horários</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold">
                      <th className="py-2 px-2.5 w-12 text-center">N° / Ord</th>
                      <th className="py-2 px-2.5 font-bold text-foreground">Linha</th>
                      <th className="py-2 px-2 text-center">Tab</th>
                      <th className="py-2 px-2.5">Carro Prog.</th>
                      <th className="py-2 px-2.5 bg-primary/5 text-primary font-bold">Carro Realiz. (P)</th>
                      <th className="py-2 px-2.5">MOTO</th>
                      <th className="py-2 px-2 text-center font-bold">Saída Gar.</th>
                      <th className="py-2 px-2 text-center text-muted-foreground">Início Linha</th>
                      <th className="py-2 px-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {colunaDireita.map((item, idx) => (
                      <FolhaTableRow
                        key={item.id}
                        item={item}
                        index={item.ordem || colunaEsquerda.length + idx + 1}
                        checkBloqueioCI={checkBloqueioCI}
                        onOpenDispatch={handleOpenDispatch}
                        onQuickRelease={handleQuickRelease}
                        onUndoDispatch={handleUndoDispatch}
                        onInlineCommit={handleInlineCommit}
                      />
                    ))}
                    {colunaDireita.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-muted-foreground font-sans">
                          Nenhum registro nesta coluna.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Rodapé da Folha com Informações de Assinatura */}
          <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Fiscal de Pista Responsável:</span>
              <span>Operação Garagem {garagem}</span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span>Emissão: {dataOperacao}</span>
              <span>Status Sistema: ONLINE (Sincronizado)</span>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* VISUALIZAÇÃO 2: CARDS DE PISTA */}
      {/* ========================================================= */}
      {viewMode === "CARDS" && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSchedules.map(item => {
            const isDone = item.status === "LIBERADO" || item.status === "SUBSTITUIDO";
            const isSub = item.status === "SUBSTITUIDO" || (item.carroRealizado && item.carroRealizado !== item.carroProgramado);
            const finalCarro = item.carroRealizado || item.carroProgramado;
            const bloqueio = checkBloqueioCI(finalCarro);

            return (
              <div
                key={item.id}
                className={cn(
                  "p-3.5 rounded-xl border transition-all shadow-2xs hover:shadow-md flex flex-col justify-between relative overflow-hidden bg-card",
                  isDone 
                    ? "border-emerald-500/30 bg-emerald-500/5" 
                    : "hover:border-primary/50"
                )}
              >
                {/* Topo do Card */}
                <div>
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-foreground">
                        Linha {item.linha}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                        Tab {item.tabela}
                      </span>
                    </div>

                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Liberado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Clock className="w-3 h-3" /> Pendente
                      </span>
                    )}
                  </div>

                  {/* Informações de Carro e Motorista */}
                  <div className="py-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Carro Programado:</span>
                      <span className={cn("font-mono font-bold", isSub && "line-through text-rose-500")}>
                        {item.carroProgramado || "—"}
                      </span>
                    </div>

                    {item.carroRealizado && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Carro Realizado:</span>
                        <span className={cn(
                          "font-mono font-bold px-1.5 py-0.5 rounded text-xs",
                          isSub ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black" : "text-foreground"
                        )}>
                          {item.carroRealizado}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Motorista (MOTO):</span>
                      <span className="font-semibold text-foreground">
                        {item.motoristaCodigo ? `${item.motoristaCodigo} - ${item.motoristaNome || "Escalado"}` : "Aguardando"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground border-t">
                      <span>Saída Garagem: <strong className="text-foreground">{item.saidaGaragem}</strong></span>
                      {item.inicioBairro && <span>Início Bairro: <strong>{item.inicioBairro}</strong></span>}
                    </div>

                    {bloqueio && (
                      <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        CI: {bloqueio.motivo}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="pt-2 border-t flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isDone ? "outline" : "default"}
                    onClick={() => handleOpenDispatch(item)}
                    className="flex-1 h-8 text-xs font-semibold"
                  >
                    {isDone ? "Editar Despacho" : "Liberar Saída"}
                  </Button>

                  {isDone ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUndoDispatch(item.id)}
                      className="h-8 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      title="Desfazer liberação"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickRelease(item)}
                      className="h-8 px-2 text-emerald-600 hover:bg-emerald-500/10"
                      title="Liberação rápida com carro programado"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* VISUALIZAÇÃO: FORMULÁRIO PARA ALIMENTAR CARRO REALIZ. (P) */}
      {/* ========================================================= */}
      {viewMode === "CARRO_REALIZADO" && (
        <CarroRealizadoView
          garagem={garagem}
          setGaragem={setGaragem}
          escalaTipo={escalaTipo}
          setEscalaTipo={setEscalaTipo}
          dataOperacao={dataOperacao}
          setDataOperacao={setDataOperacao}
          schedules={baseSchedules}
          dispatches={dispatches}
          onSaveDispatch={saveDispatches}
          ciList={ciList}
        />
      )}

      {/* ========================================================= */}
      {/* VISUALIZAÇÃO: FORMULÁRIO PARA ALIMENTAR CI MANUTENÇÃO */}
      {/* ========================================================= */}
      {(viewMode === "CI_MANUTENCAO" || viewMode === "CI_BLOQUEIOS") && (
        <CiManutencaoView
          ciList={ciList}
          setCiList={setCiList}
          garagemFiltro={garagem}
        />
      )}

      {/* ========================================================= */}
      {/* VISUALIZAÇÃO 4: CARROS RESERVAS NOS TERMINAIS */}
      {/* ========================================================= */}
      {viewMode === "RESERVAS" && (
        <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b">
            <span className="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
              Escala de Apoio Operacional
            </span>
            <h2 className="text-lg font-bold text-foreground mt-1">
              Quadro de Carros Reservas nos Terminais • {garagem}
            </h2>
            <p className="text-xs text-muted-foreground">
              Alocação estratégica de ônibus reservas (Azul, Vermelho, Micro e Articulados)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {reservasAtivas.map((res, idx) => (
              <div key={idx} className="p-4 rounded-xl border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-sm">{res.terminal}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    res.cor === "VERMELHO" ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" :
                    res.cor === "AZUL" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" :
                    "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  )}>
                    {res.cor}
                  </span>
                </div>

                <div className="text-xs space-y-1 pt-1 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Carro 01:</span>
                    <strong className="font-mono text-primary text-sm">{res.carro1 || "—"}</strong>
                  </div>
                  {res.carro2 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Carro 02:</span>
                      <strong className="font-mono text-primary text-sm">{res.carro2}</strong>
                    </div>
                  )}
                  {res.horario && (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Chegada Terminal:</span>
                      <span className="font-mono">{res.horario}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DIÁLOGO / MODAL DE DESPACHO E LIBERAÇÃO */}
      {/* ========================================================= */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bus className="w-5 h-5 text-primary" />
              Despacho de Saída • Linha {selectedItem?.linha}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirme o prefixo do veículo e informe a matrícula (MOTO) do motorista escalado.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 pt-2">
              
              {/* Informações da Linha */}
              <div className="grid grid-cols-3 gap-2 bg-muted/50 p-3 rounded-xl border text-center">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Linha</span>
                  <p className="font-mono font-bold text-base text-foreground">{selectedItem.linha}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Tabela</span>
                  <p className="font-mono font-bold text-base text-foreground">{selectedItem.tabela}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Saída Garagem</span>
                  <p className="font-mono font-bold text-base text-primary">{selectedItem.saidaGaragem}</p>
                </div>
              </div>

              {/* Campo Carro Realizado */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">Carro Realizado (Prefixo)</Label>
                  <span className="text-[11px] text-muted-foreground">
                    Programado: <strong className="font-mono text-foreground">{selectedItem.carroProgramado}</strong>
                  </span>
                </div>
                <Input
                  placeholder="Ex: 4210"
                  value={inputCarroRealizado}
                  onChange={(e) => setInputCarroRealizado(e.target.value)}
                  className="font-mono text-base font-bold tracking-wider"
                />
                
                {/* Alerta de Carro no CI */}
                {checkBloqueioCI(inputCarroRealizado) && (
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Atenção: Carro {inputCarroRealizado} está no CI: {checkBloqueioCI(inputCarroRealizado)?.motivo}!</span>
                  </div>
                )}
              </div>

              {/* Motorista (MOTO) */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-xs font-bold">MOTO (Cód)</Label>
                  <Input
                    placeholder="Ex: 1012"
                    value={inputMotoristaCodigo}
                    onChange={(e) => handleMotoristaCodeChange(e.target.value)}
                    className="font-mono font-bold text-sm"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs font-bold">Nome do Motorista</Label>
                  <Input
                    placeholder="Nome ou identificação"
                    value={inputMotoristaNome}
                    onChange={(e) => setInputMotoristaNome(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Observações / Motivo da Troca</Label>
                <Input
                  placeholder="Ex: Carro reserva utilizado por revisão de mola"
                  value={inputObs}
                  onChange={(e) => setInputObs(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmDispatch}
                  className="font-bold gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar e Liberar Saída
                </Button>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ----------------------------------------------------------------------
// COMPONENTE DE LINHA DA TABELA DA FOLHA DE SOLTURA (ESTILO PRANCHETA)
// ----------------------------------------------------------------------
interface FolhaTableRowProps {
  item: SolturaItem;
  index: number;
  checkBloqueioCI: (prefixo?: string) => BloqueioCarro | undefined | null;
  onOpenDispatch: (item: SolturaItem) => void;
  onQuickRelease: (item: SolturaItem) => void;
  onUndoDispatch: (id: string) => void;
  onInlineCommit: (item: SolturaItem, field: "carro" | "motorista", value: string) => void;
}

function FolhaTableRow({
  item,
  index,
  checkBloqueioCI,
  onOpenDispatch,
  onQuickRelease,
  onUndoDispatch,
  onInlineCommit
}: FolhaTableRowProps) {
  const isDone = item.status === "LIBERADO" || item.status === "SUBSTITUIDO";
  const isSub = item.status === "SUBSTITUIDO" || (item.carroRealizado && item.carroRealizado !== item.carroProgramado);
  const finalCarro = item.carroRealizado || item.carroProgramado;
  const bloqueio = checkBloqueioCI(finalCarro);

  const [carroValue, setCarroValue] = useState(item.carroRealizado || "");
  const [motoValue, setMotoValue] = useState(item.motoristaCodigo || "");

  useEffect(() => {
    setCarroValue(item.carroRealizado || "");
  }, [item.carroRealizado]);

  useEffect(() => {
    setMotoValue(item.motoristaCodigo || "");
  }, [item.motoristaCodigo]);

  return (
    <tr
      className={cn(
        "transition-colors group",
        isDone 
          ? "bg-emerald-500/5 hover:bg-emerald-500/10" 
          : index % 2 === 0 ? "bg-muted/20 hover:bg-muted/40" : "bg-card hover:bg-muted/30"
      )}
    >
      {/* Ordem */}
      <td className="py-2 px-2 text-center text-muted-foreground text-[11px] font-semibold">
        {String(index).padStart(2, "0")}
      </td>

      {/* Linha */}
      <td className="py-2 px-2.5 font-bold text-foreground text-xs whitespace-nowrap">
        {item.linha}
      </td>

      {/* Tabela */}
      <td className="py-2 px-2 text-center text-xs font-semibold text-muted-foreground">
        {item.tabela}
      </td>

      {/* Carro Programado (com risco vermelho se foi substituído, como no papel) */}
      <td className="py-2 px-2.5 whitespace-nowrap">
        <span className={cn(
          "font-bold",
          isSub ? "line-through text-rose-500 font-normal decoration-2" : "text-muted-foreground"
        )}>
          {item.carroProgramado || "—"}
        </span>
      </td>

      {/* Carro Realizado (Input rápido / display) */}
      <td className="py-1 px-2.5 bg-primary/5">
        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder={item.carroProgramado || "Carro"}
            value={carroValue}
            onChange={(e) => setCarroValue(e.target.value)}
            onBlur={() => {
              if (carroValue && carroValue !== item.carroRealizado) {
                onInlineCommit(item, "carro", carroValue);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onInlineCommit(item, "carro", carroValue);
              }
            }}
            className={cn(
              "w-16 bg-background border rounded px-1.5 py-0.5 text-xs font-bold font-mono focus:outline-hidden focus:ring-1 focus:ring-primary",
              isSub && "text-blue-600 dark:text-blue-400 border-blue-500/40 bg-blue-500/5",
              bloqueio && "border-rose-500 text-rose-600 bg-rose-500/10"
            )}
          />
          {bloqueio && (
            <span title={`CI: ${bloqueio.motivo}`} className="cursor-help text-rose-500">
              <AlertTriangle className="w-3 h-3" />
            </span>
          )}
        </div>
      </td>

      {/* Motorista (MOTO) */}
      <td className="py-1 px-2.5">
        <input
          type="text"
          placeholder="MOTO"
          value={motoValue}
          onChange={(e) => setMotoValue(e.target.value)}
          onBlur={() => {
            if (motoValue && motoValue !== item.motoristaCodigo) {
              onInlineCommit(item, "motorista", motoValue);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onInlineCommit(item, "motorista", motoValue);
            }
          }}
          className="w-16 bg-background border rounded px-1.5 py-0.5 text-xs font-semibold font-mono focus:outline-hidden focus:ring-1 focus:ring-primary"
          title={item.motoristaNome || "Código do motorista"}
        />
      </td>

      {/* Saída Garagem */}
      <td className="py-2 px-2 text-center font-bold text-foreground text-xs">
        {item.saidaGaragem}
      </td>

      {/* Início Linha / Bairro */}
      <td className="py-2 px-2 text-center text-muted-foreground text-[11px]">
        {item.inicioBairro || "—"}
      </td>

      {/* Ações */}
      <td className="py-2 px-2.5 text-center whitespace-nowrap">
        {isDone ? (
          <div className="flex items-center justify-center gap-1">
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="w-3 h-3" /> OK
            </span>
            <button
              type="button"
              onClick={() => onUndoDispatch(item.id)}
              className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Desfazer liberação"
            >
              <Undo2 className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <Button
              size="sm"
              variant="default"
              onClick={() => onQuickRelease(item)}
              className="h-6 px-2 text-[10px] font-bold"
              title="Liberar saída rápida"
            >
              Liberar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenDispatch(item)}
              className="h-6 px-1.5 text-muted-foreground hover:text-foreground"
              title="Abrir detalhes"
            >
              <SlidersHorizontal className="w-3 h-3" />
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}
