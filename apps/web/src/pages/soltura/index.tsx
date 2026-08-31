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
  TerminalReserva,
  CarroPendurado,
  carrosPendurados
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

  // Pendurados (carros em alto consumo/bloqueados na CI) filtrados por garagem
  const penduradosAtivos = useMemo<CarroPendurado[]>(() => {
    return carrosPendurados.filter(p => p.garagem === garagem);
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
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-[#164E3A] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                  CGU.REG.OP.0001
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
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

          {/* Seletor de Garagem, Escala, Data e Ação Imprimir */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            
            {/* Linha Superior: Garagem e Escala */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Seletor de Garagem */}
              <div className="flex items-center bg-muted/60 p-1 rounded-full border border-border/80">
                <button
                  type="button"
                  onClick={() => setGaragem("VCG")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2",
                    garagem === "VCG"
                      ? "bg-[#164E3A] text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                  Viação Campo Grande (VCG)
                </button>

                <button
                  type="button"
                  onClick={() => setGaragem("VCM")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2",
                    garagem === "VCM"
                      ? "bg-[#164E3A] text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                  Viação Cidade Morena (VCM)
                </button>
              </div>

              {/* Seletor de Escala */}
              <div className="flex items-center bg-muted/60 p-1 rounded-full border border-border/80">
                <button
                  type="button"
                  onClick={() => setEscalaTipo("SEG_SEX")}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs transition-all",
                    escalaTipo === "SEG_SEX"
                      ? "bg-card text-foreground shadow-2xs font-bold border"
                      : "text-muted-foreground hover:text-foreground font-medium"
                  )}
                >
                  Segunda a Sexta
                </button>

                <button
                  type="button"
                  onClick={() => setEscalaTipo("SABADO")}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs transition-all",
                    escalaTipo === "SABADO"
                      ? "bg-card text-foreground shadow-2xs font-bold border"
                      : "text-muted-foreground hover:text-foreground font-medium"
                  )}
                >
                  Sábado
                </button>

                <button
                  type="button"
                  onClick={() => setEscalaTipo("DOM_FER")}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs transition-all",
                    escalaTipo === "DOM_FER"
                      ? "bg-card text-foreground shadow-2xs font-bold border"
                      : "text-muted-foreground hover:text-foreground font-medium"
                  )}
                >
                  Dom / Feriado
                </button>
              </div>
            </div>

            {/* Linha Inferior/Ao lado: Data e Ação Imprimir */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-card border px-3 py-1.5 rounded-xl text-xs shadow-2xs">
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
                className="h-8 px-3 text-xs gap-1.5 rounded-xl border font-semibold shadow-2xs"
                title="Imprimir folha de soltura em formato papel A4"
              >
                <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Imprimir A4</span>
              </Button>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* BARRA DE ESTATÍSTICAS E PROGRESSO OPERACIONAL */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t">
          
          {/* Card Total */}
          <div className="bg-card p-3 rounded-2xl border shadow-2xs">
            <span className="text-[11px] text-muted-foreground font-medium block">Total Programado</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-foreground">{stats.total}</span>
              <span className="text-[11px] text-muted-foreground">viagens</span>
            </div>
          </div>

          {/* Card Liberados */}
          <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/30">
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Liberados
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.liberados}</span>
              <span className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">carros na rua</span>
            </div>
          </div>

          {/* Card Pendentes */}
          <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30">
            <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Pendentes
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-amber-700 dark:text-amber-300">{stats.pendentes}</span>
              <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80">na garagem</span>
            </div>
          </div>

          {/* Card Substituídos (Trocados) */}
          <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/30">
            <span className="text-[11px] text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Substituídos
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{stats.substituidos}</span>
              <span className="text-[11px] text-blue-800/80 dark:text-blue-300/80">trocas</span>
            </div>
          </div>

          {/* Card CI Bloqueios */}
          <div 
            onClick={() => {
              setViewMode("CI_MANUTENCAO");
              navigate("/soltura/ci-manutencao");
            }}
            className="bg-rose-500/10 p-3 rounded-2xl border border-rose-500/30 cursor-pointer hover:bg-rose-500/15 transition-all"
            title="Clique para abrir a tela de CI Manutenção"
          >
            <span className="text-[11px] text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> CI Manutenção
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-rose-700 dark:text-rose-300">{stats.totalBloqueadosCI}</span>
              <span className="text-[11px] text-rose-800/80 dark:text-rose-300/80">bloqueados</span>
            </div>
          </div>

          {/* Card Taxa de Soltura */}
          <div className="bg-card p-3 rounded-2xl border shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-foreground font-bold">Soltura</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{stats.percentual}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
              <div 
                className="bg-[#164E3A] dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
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
      {/* Idêntico às fotos dos formulários de papel e layout-soltura.PNG */}
      {/* ========================================================= */}
      {viewMode === "FOLHA" && (
        <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* Header da Folha de Papel — Exibição de Metadados apenas em Impressão */}
          <div className="hidden print:grid grid-cols-5 gap-2 bg-muted/40 p-2.5 rounded-lg border text-[10px] font-mono text-muted-foreground mb-3">
            <div>
              <span className="uppercase font-semibold block">Data da Criação</span>
              <span className="text-foreground font-bold text-xs">01/07/2025</span>
            </div>
            <div>
              <span className="uppercase font-semibold block">Revisão nº</span>
              <span className="text-foreground font-bold text-xs">1</span>
            </div>
            <div>
              <span className="uppercase font-semibold block">Data da Revisão</span>
              <span className="text-foreground font-bold text-xs">01/07/2025</span>
            </div>
            <div>
              <span className="uppercase font-semibold block">Data da Informação</span>
              <span className="text-foreground font-bold text-xs">{dataOperacao.split("-").reverse().join("/")}</span>
            </div>
            <div>
              <span className="uppercase font-semibold block">Número</span>
              <span className="text-foreground font-bold text-xs">{garagem === "VCG" ? "CGU.REG.OP.0001" : "VCM.REG.TR.0017"}</span>
            </div>
          </div>

          {/* Cabeçalho da Folha em Tela (fiel a layout-soltura.PNG) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
                CONSÓRCIO GUAICURUS • GARAGEM {garagem === "VCG" ? "VIAÇÃO CAMPO GRANDE" : "VIAÇÃO CIDADE MORENA"}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                Horário de Saída de Veículos • {escalaTipo === "SEG_SEX" ? "Segunda a Sexta" : escalaTipo === "SABADO" ? "Sábado" : "Dom / Feriado"}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                Carro Liberado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                Carro Trocado / Substituto
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                Saída Pendente
              </span>
            </div>
          </div>

          {/* Grade de 2 Colunas Lado a Lado (como no papel físico e layout-soltura.PNG) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            
            {/* Coluna 1 */}
            <div className="border rounded-xl overflow-hidden shadow-2xs bg-card">
              <div className="bg-muted/60 px-3.5 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b">
                <span className="text-foreground">
                  COLUNA 01 (ORDENS 01 A {String(colunaEsquerda.length).padStart(2, "0")})
                </span>
                <span className="font-semibold">{colunaEsquerda.length} HORÁRIOS</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold">
                      <th className="py-2.5 px-2.5 w-12 text-center">Nº / Ord</th>
                      <th className="py-2.5 px-2.5 font-bold text-foreground">Linha</th>
                      <th className="py-2.5 px-2 text-center">Tab</th>
                      <th className="py-2.5 px-2.5 text-center">Carro Prog.</th>
                      <th className="py-2.5 px-2.5 bg-primary/5 text-primary font-bold text-center">Carro Realiz. (P)</th>
                      <th className="py-2.5 px-2.5 text-center">MOTO</th>
                      <th className="py-2.5 px-2 text-center font-bold text-foreground">Saída Gar.</th>
                      <th className="py-2.5 px-2 text-center text-muted-foreground">Início Linha</th>
                      <th className="py-2.5 px-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {colunaEsquerda.map((item, idx) => {
                      const isFirstVCM = item.tipo === "VCM" && (idx === 0 || colunaEsquerda[idx - 1]?.tipo !== "VCM");
                      const isFirstFrete = item.tipo === "FRETAMENTO" && (idx === 0 || colunaEsquerda[idx - 1]?.tipo !== "FRETAMENTO");
                      return (
                        <>
                          {isFirstVCM && (
                            <tr key={`sep-vcm-${item.id}`}>
                              <td colSpan={9} className="py-1.5 px-3 bg-blue-500/10 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 border-y border-blue-500/30">
                                Motoristas VCM que saem da VCG
                              </td>
                            </tr>
                          )}
                          {isFirstFrete && (
                            <tr key={`sep-frete-${item.id}`}>
                              <td colSpan={9} className="py-1.5 px-3 bg-amber-500/10 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 border-y border-amber-500/30">
                                Especial Fretamento
                              </td>
                            </tr>
                          )}
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
                        </>
                      );
                    })}
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
            <div className="border rounded-xl overflow-hidden shadow-2xs bg-card">
              <div className="bg-muted/60 px-3.5 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b">
                <span className="text-foreground">
                  COLUNA 02 (ORDENS {String(colunaEsquerda.length + 1).padStart(2, "0")} A {String(filteredSchedules.length).padStart(2, "0")})
                </span>
                <span className="font-semibold">{colunaDireita.length} HORÁRIOS</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold">
                      <th className="py-2.5 px-2.5 w-12 text-center">Nº / Ord</th>
                      <th className="py-2.5 px-2.5 font-bold text-foreground">Linha</th>
                      <th className="py-2.5 px-2 text-center">Tab</th>
                      <th className="py-2.5 px-2.5 text-center">Carro Prog.</th>
                      <th className="py-2.5 px-2.5 bg-primary/5 text-primary font-bold text-center">Carro Realiz. (P)</th>
                      <th className="py-2.5 px-2.5 text-center">MOTO</th>
                      <th className="py-2.5 px-2 text-center font-bold text-foreground">Saída Gar.</th>
                      <th className="py-2.5 px-2 text-center text-muted-foreground">Início Linha</th>
                      <th className="py-2.5 px-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {colunaDireita.map((item, idx) => {
                      const isFirstVCM = item.tipo === "VCM" && (idx === 0 || colunaDireita[idx - 1]?.tipo !== "VCM");
                      const isFirstFrete = item.tipo === "FRETAMENTO" && (idx === 0 || colunaDireita[idx - 1]?.tipo !== "FRETAMENTO");
                      return (
                        <>
                          {isFirstVCM && (
                            <tr key={`sep-vcm-${item.id}`}>
                              <td colSpan={9} className="py-1.5 px-3 bg-blue-500/10 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 border-y border-blue-500/30">
                                Motoristas VCM que saem da VCG
                              </td>
                            </tr>
                          )}
                          {isFirstFrete && (
                            <tr key={`sep-frete-${item.id}`}>
                              <td colSpan={9} className="py-1.5 px-3 bg-amber-500/10 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 border-y border-amber-500/30">
                                Especial Fretamento
                              </td>
                            </tr>
                          )}
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
                        </>
                      );
                    })}
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

          {/* ========================================================= */}
          {/* SEÇÃO: RESERVAS DE TERMINAIS (como no rodapé do papel) */}
          {/* ========================================================= */}
          {reservasAtivas.length > 0 && (
            <div className="border rounded-xl p-3 bg-muted/20 space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Reserva Terminal
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {reservasAtivas.map((res, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border bg-card text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-[11px]">{res.terminal}</span>
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                        res.cor === "VERMELHO" ? "bg-rose-500/15 text-rose-600" :
                        res.cor === "AZUL" ? "bg-blue-500/15 text-blue-600" :
                        "bg-amber-500/15 text-amber-600"
                      )}>
                        {res.cor}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-muted-foreground">Carro 1:</span>
                      <span className="font-bold text-primary">{res.carro1 || "—"}</span>
                    </div>
                    {res.carro2 && (
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-muted-foreground">Carro 2:</span>
                        <span className="font-bold text-primary">{res.carro2}</span>
                      </div>
                    )}
                    {res.horario && (
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Horário: {res.horario}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SEÇÃO: PENDURADOS (carros alto consumo / bloqueados CI) */}
          {/* ========================================================= */}
          {penduradosAtivos.length > 0 && (
            <div className="border rounded-xl p-3 bg-rose-500/5 space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Pendurados — Carros Alto Consumo / Bloqueados
              </h3>
              <div className="flex flex-wrap gap-3">
                {(["VERMELHO", "AZUL", "MICRO", "ARTICULADO", "CINZA"] as const).map(tipo => {
                  const lista = penduradosAtivos.filter(p => p.tipo === tipo);
                  if (lista.length === 0) return null;
                  return (
                    <div key={tipo} className="space-y-1">
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block",
                        tipo === "VERMELHO" ? "bg-rose-500/15 text-rose-600" :
                        tipo === "AZUL" ? "bg-blue-500/15 text-blue-600" :
                        tipo === "MICRO" ? "bg-purple-500/15 text-purple-600" :
                        tipo === "ARTICULADO" ? "bg-amber-500/15 text-amber-600" :
                        "bg-gray-500/15 text-gray-600"
                      )}>
                        {tipo}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {lista.map(p => (
                          <span key={p.prefixo} className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted border text-foreground font-semibold">
                            {p.prefixo}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rodapé da Folha — Responsáveis e Paginação */}
          <div className="pt-4 border-t space-y-3">
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div className="space-y-1">
                <span className="font-semibold text-foreground block">Responsável pela Aprovação:</span>
                <div className="border-b border-dashed pb-3 text-[11px]">
                  {garagem === "VCG" ? "Paulo Vitor" : "Claudio Benites"}
                </div>
                <span className="text-[10px]">Data: ___/___/______</span>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-foreground block">Responsável pela Elaboração:</span>
                <div className="border-b border-dashed pb-3 text-[11px]">
                  {garagem === "VCG" ? "André Luiz" : "Reinaldo Iastremski"}
                </div>
                <span className="text-[10px]">Data: ___/___/______</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
              <span>**** CARROS DE PLANO ESCALADOS NAS LINHAS COM OBSERVAÇÃO, CONFERIR COM A CI ****</span>
              <span className="font-bold text-foreground">Página 01</span>
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
        <div className="flex items-center gap-1">
          {item.linha}
          {item.tipo === "VCM" && (
            <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 uppercase">VCM</span>
          )}
          {item.tipo === "FRETAMENTO" && (
            <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase">Frete</span>
          )}
          {item.tipo === "EXTRA" && (
            <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 uppercase">Extra</span>
          )}
        </div>
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
      <td className="py-1.5 px-2 bg-muted/20 text-center">
        <div className="flex items-center justify-center gap-1">
          <input
            type="text"
            placeholder={item.carroProgramado || "Carro"}
            value={carroValue}
            onChange={(e) => setCarroValue(e.target.value)}
            onBlur={() => {
              if (carroValue && carroValue !== (item.carroRealizado || item.carroProgramado)) {
                onInlineCommit(item, "carro", carroValue);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onInlineCommit(item, "carro", carroValue);
              }
            }}
            className={cn(
              "w-16 h-7 text-center rounded-md border text-xs font-bold font-mono focus:outline-hidden focus:ring-1 focus:ring-[#164E3A] transition-all",
              isSub 
                ? "text-blue-600 dark:text-blue-400 border-blue-500/50 bg-blue-500/10"
                : "bg-background border-border/80 text-foreground",
              bloqueio && "border-rose-500 text-rose-600 bg-rose-500/10"
            )}
          />
          {bloqueio && (
            <span title={`Carro no CI: ${bloqueio.motivo}`} className="cursor-help text-rose-500 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </td>

      {/* Motorista (MOTO) */}
      <td className="py-1.5 px-2 text-center">
        <input
          type="text"
          placeholder="MOTO"
          value={motoValue}
          onChange={(e) => setMotoValue(e.target.value)}
          onBlur={() => {
            if (motoValue !== item.motoristaCodigo) {
              onInlineCommit(item, "motorista", motoValue);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onInlineCommit(item, "motorista", motoValue);
            }
          }}
          className="w-16 h-7 text-center rounded-md border border-border/80 bg-background text-xs font-mono font-semibold placeholder:text-muted-foreground/50 focus:outline-hidden focus:ring-1 focus:ring-[#164E3A] transition-all"
          title={item.motoristaNome || "Código do motorista escalado"}
        />
      </td>

      {/* Saída Garagem */}
      <td className="py-2 px-2 text-center font-bold text-foreground text-xs">
        {item.saidaGaragem}
      </td>

      {/* Início Linha */}
      <td className="py-2 px-2 text-center text-muted-foreground text-xs">
        {item.inicioLinha || item.inicioBairro || "—"}
      </td>

      {/* Ações */}
      <td className="py-2 px-2.5 text-center whitespace-nowrap">
        {isDone ? (
          <div className="flex items-center justify-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Liberado
            </span>
            <button
              type="button"
              onClick={() => onUndoDispatch(item.id)}
              className="p-1 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Desfazer liberação"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5">
            <Button
              size="sm"
              onClick={() => onQuickRelease(item)}
              className="h-6 px-3 text-[11px] font-bold rounded-full bg-[#164E3A] hover:bg-[#113C2D] text-white shadow-2xs transition-colors"
              title="Liberar saída do veículo"
            >
              Liberar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenDispatch(item)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
              title="Abrir ajustes e detalhes da soltura"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}
