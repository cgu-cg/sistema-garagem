import { useState, useMemo, useEffect } from "react";
import { SolturaItem, BloqueioCarro } from "@/data/solturaData";
import { drivers } from "@/data/drivers";
import { checkCarroBloqueado } from "./ciManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Bus,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Save,
  ShieldAlert,
  Sparkles,
  Zap,
  PlusCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DispatchedRecord {
  scheduleId: string;
  carroRealizado: string;
  motoristaCodigo: string;
  motoristaNome: string;
  horaLiberacao: string;
  observacoes?: string;
  substituido: boolean;
}

interface CarroRealizadoViewProps {
  garagem: "VCG" | "VCM";
  setGaragem: (g: "VCG" | "VCM") => void;
  escalaTipo: "SEG_SEX" | "SABADO" | "DOM_FER";
  setEscalaTipo: (e: "SEG_SEX" | "SABADO" | "DOM_FER") => void;
  turnoTipo?: "MATUTINO" | "VESPERTINO";
  setTurnoTipo?: (t: "MATUTINO" | "VESPERTINO") => void;
  dataOperacao: string;
  setDataOperacao: (d: string) => void;
  schedules: SolturaItem[];
  dispatches: Record<string, DispatchedRecord>;
  onSaveDispatch: (newDispatches: Record<string, DispatchedRecord>) => void;
  ciList: BloqueioCarro[];
  onAddSchedule?: (newItem: SolturaItem) => void;
}

export function CarroRealizadoView({
  garagem,
  setGaragem,
  escalaTipo,
  setEscalaTipo,
  turnoTipo = "MATUTINO",
  setTurnoTipo,
  dataOperacao,
  setDataOperacao,
  schedules,
  dispatches,
  onSaveDispatch,
  ciList,
  onAddSchedule
}: CarroRealizadoViewProps) {

  // Estado do Formulário de Lançamento Individual
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [inputCarroRealizado, setInputCarroRealizado] = useState("");
  const [inputMotoCodigo, setInputMotoCodigo] = useState("");
  const [inputMotoNome, setInputMotoNome] = useState("");
  const [inputHoraSaida, setInputHoraSaida] = useState("");
  const [inputMotivoSubstituicao, setInputMotivoSubstituicao] = useState("");
  const [inputObs, setInputObs] = useState("");

  // Estado do Card de Cadastro de Carros Programados
  const [isCadastroExpanded, setIsCadastroExpanded] = useState(true);
  const [newLinha, setNewLinha] = useState("");
  const [newTabela, setNewTabela] = useState("");
  const [newCarroProgramado, setNewCarroProgramado] = useState("");
  const [newSaidaGaragem, setNewSaidaGaragem] = useState("");
  const [newInicioLinha, setNewInicioLinha] = useState("");
  const [newMotoCodigo, setNewMotoCodigo] = useState("");
  const [newMotoNome, setNewMotoNome] = useState("");
  const [newTipo, setNewTipo] = useState<"REGULAR" | "VCM" | "FRETAMENTO" | "EXTRA">("REGULAR");
  const [newObs, setNewObs] = useState("");

  const handleNewMotoCodeChange = (code: string) => {
    setNewMotoCodigo(code);
    const found = drivers.find(d => d.code.toLowerCase() === code.trim().toLowerCase());
    if (found) {
      setNewMotoNome(found.name);
    }
  };

  // Alerta de Bloqueio CI para o novo carro programado
  const newBloqueioCI = useMemo(() => {
    if (!newCarroProgramado.trim()) return null;
    return checkCarroBloqueado(newCarroProgramado.trim(), ciList);
  }, [newCarroProgramado, ciList]);

  // Filtros da Grade Rápida
  const [gridFilter, setGridFilter] = useState<"TODOS" | "PENDENTES" | "SUBSTITUIDOS">("TODOS");
  const [gridSearch, setGridSearch] = useState("");

  // Itens mapeados com estado atual de despachos
  const mergedItems = useMemo(() => {
    return schedules.map(item => {
      const disp = dispatches[item.id];
      const realizado = disp?.carroRealizado || item.carroRealizado || "";
      const isSub = realizado !== "" && realizado !== item.carroProgramado;
      const isDone = !!disp || !!item.carroRealizado;

      return {
        ...item,
        carroRealizado: realizado,
        motoristaCodigo: disp?.motoristaCodigo || item.motoristaCodigo || "",
        motoristaNome: disp?.motoristaNome || item.motoristaNome || "",
        horaLiberacao: disp?.horaLiberacao || item.horaLiberacao || "",
        observacoes: disp?.observacoes || item.observacoes || "",
        isSubstituido: isSub,
        isPreenchido: isDone
      };
    });
  }, [schedules, dispatches]);

  // Carregar primeiro item da lista ou manter selecionado
  useEffect(() => {
    if (mergedItems.length > 0) {
      const current = mergedItems.find(i => i.id === selectedScheduleId);
      if (!current) {
        handleSelectSchedule(mergedItems[0]);
      }
    }
  }, [mergedItems, selectedScheduleId]);

  // Selecionar viagem para preencher no formulário
  const handleSelectSchedule = (item: typeof mergedItems[0]) => {
    setSelectedScheduleId(item.id);
    const disp = dispatches[item.id];

    setInputCarroRealizado(disp?.carroRealizado || item.carroProgramado || "");
    setInputMotoCodigo(disp?.motoristaCodigo || item.motoristaCodigo || "");
    setInputMotoNome(disp?.motoristaNome || item.motoristaNome || "");

    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
    setInputHoraSaida(disp?.horaLiberacao || horaAtual);
    setInputObs(disp?.observacoes || item.observacoes || "");
    setInputMotivoSubstituicao("");
  };

  // Atualizar código de motorista
  const handleMotoCodeChange = (code: string) => {
    setInputMotoCodigo(code);
    const found = drivers.find(d => d.code.toLowerCase() === code.trim().toLowerCase());
    if (found) {
      setInputMotoNome(found.name);
    }
  };

  // Item atualmente selecionado no formulário
  const currentItem = useMemo(() => {
    return mergedItems.find(i => i.id === selectedScheduleId);
  }, [mergedItems, selectedScheduleId]);

  // Alerta de Bloqueio CI em tempo real para o carro digitado
  const bloqueioCI = useMemo(() => {
    if (!inputCarroRealizado.trim()) return null;
    return checkCarroBloqueado(inputCarroRealizado.trim(), ciList);
  }, [inputCarroRealizado, ciList]);

  // É substituição?
  const isSubstituicao = useMemo(() => {
    if (!currentItem) return false;
    const finalCarro = inputCarroRealizado.trim();
    return finalCarro !== "" && finalCarro !== currentItem.carroProgramado;
  }, [currentItem, inputCarroRealizado]);

  // Salvar Formulário de Carro Realizado (P)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) return;

    const finalCarro = inputCarroRealizado.trim() || currentItem.carroProgramado;
    if (!finalCarro) {
      toast.error("Informe o prefixo do Carro Realizado (P).");
      return;
    }

    if (bloqueioCI) {
      toast.warning(`Aviso: Carro ${finalCarro} está no CI (${bloqueioCI.motivo}). Liberação registrada com pendência.`, {
        duration: 5000
      });
    }

    const agora = new Date();
    const horaFinal = inputHoraSaida || `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
    const substituido = finalCarro !== currentItem.carroProgramado;

    let obsFinal = inputObs;
    if (substituido && inputMotivoSubstituicao.trim()) {
      obsFinal = `[Substituição: ${inputMotivoSubstituicao.trim()}] ${obsFinal}`.trim();
    }

    const newRecord: DispatchedRecord = {
      scheduleId: currentItem.id,
      carroRealizado: finalCarro,
      motoristaCodigo: inputMotoCodigo.trim(),
      motoristaNome: inputMotoNome.trim() || (inputMotoCodigo ? `Motorista ${inputMotoCodigo}` : ""),
      horaLiberacao: horaFinal,
      observacoes: obsFinal,
      substituido
    };

    const updated = { ...dispatches, [currentItem.id]: newRecord };
    onSaveDispatch(updated);

    toast.success(`Carro Realizado ${finalCarro} salvo para Linha ${currentItem.linha} / Tabela ${currentItem.tabela}!`);

    // Avançar automaticamente para o próximo item pendente
    const currentIndex = mergedItems.findIndex(i => i.id === currentItem.id);
    const nextItem = mergedItems.slice(currentIndex + 1).find(i => !i.isPreenchido) || mergedItems[currentIndex + 1];
    if (nextItem) {
      handleSelectSchedule(nextItem);
    }
  };

  // Edição rápida de célula na grade
  const handleCellChange = (itemId: string, field: "carro" | "moto", value: string) => {
    const item = mergedItems.find(i => i.id === itemId);
    if (!item) return;

    const currentDisp = dispatches[itemId];
    const agora = new Date();
    const hora = currentDisp?.horaLiberacao || `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

    let carro = currentDisp?.carroRealizado || item.carroProgramado;
    let moto = currentDisp?.motoristaCodigo || item.motoristaCodigo || "";
    let nome = currentDisp?.motoristaNome || item.motoristaNome || "";

    if (field === "carro") {
      carro = value.trim() || item.carroProgramado;
      const ci = checkCarroBloqueado(carro, ciList);
      if (ci) {
        toast.warning(`Carro ${carro} em CI: ${ci.motivo}`);
      }
    } else {
      moto = value.trim();
      const drv = drivers.find(d => d.code === moto);
      nome = drv ? drv.name : (moto ? `Motorista ${moto}` : "");
    }

    const updatedRecord: DispatchedRecord = {
      scheduleId: item.id,
      carroRealizado: carro,
      motoristaCodigo: moto,
      motoristaNome: nome,
      horaLiberacao: hora,
      substituido: carro !== item.carroProgramado
    };

    onSaveDispatch({ ...dispatches, [itemId]: updatedRecord });
  };

  // Ação em Lote: Preencher todos os pendentes com o Carro Programado
  const handleBatchFillProgramados = () => {
    if (!confirm(`Deseja preencher todos os carros programados para as viagens pendentes da escala de hoje (${garagem})?`)) return;

    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
    const newDispatches = { ...dispatches };
    let count = 0;

    schedules.forEach((item, index) => {
      if (!newDispatches[item.id]) {
        newDispatches[item.id] = {
          scheduleId: item.id,
          carroRealizado: item.carroProgramado,
          motoristaCodigo: String(index + 101),
          motoristaNome: `Motorista ${index + 1}`,
          horaLiberacao: horaAtual,
          substituido: false
        };
        count++;
      }
    });

    onSaveDispatch(newDispatches);
    toast.success(`${count} viagem(ns) preenchida(s) com o Carro Programado!`);
  };

  // Salvar cadastro de novo carro programado
  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinha.trim()) {
      toast.error("Informe a Linha do carro programado.");
      return;
    }
    if (!newTabela.trim()) {
      toast.error("Informe a Tabela da viagem.");
      return;
    }
    if (!newCarroProgramado.trim()) {
      toast.error("Informe o prefixo do Carro Programado.");
      return;
    }
    if (!newSaidaGaragem.trim()) {
      toast.error("Informe o horário de saída da garagem.");
      return;
    }

    if (newBloqueioCI) {
      toast.warning(`Atenção: Carro ${newCarroProgramado} consta no CI como: ${newBloqueioCI.motivo}!`, {
        duration: 5000
      });
    }

    const newItem: SolturaItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ordem: schedules.length + 1,
      linha: newLinha.trim(),
      tabela: newTabela.trim(),
      carroProgramado: newCarroProgramado.trim(),
      saidaGaragem: newSaidaGaragem.trim(),
      inicioLinha: newInicioLinha.trim() || undefined,
      inicioBairro: newInicioLinha.trim() || undefined,
      motoristaCodigo: newMotoCodigo.trim() || undefined,
      motoristaNome: newMotoNome.trim() || undefined,
      tipo: newTipo,
      observacoes: newObs.trim() || undefined,
      status: "PENDENTE"
    };

    if (onAddSchedule) {
      onAddSchedule(newItem);
    } else {
      toast.success(`Carro ${newItem.carroProgramado} programado com sucesso para a Linha ${newItem.linha}!`);
    }

    // Resetar formulário
    setNewLinha("");
    setNewTabela("");
    setNewCarroProgramado("");
    setNewSaidaGaragem("");
    setNewInicioLinha("");
    setNewMotoCodigo("");
    setNewMotoNome("");
    setNewObs("");
    setNewTipo("REGULAR");
  };

  // Itens filtrados para a grade
  const filteredGridItems = useMemo(() => {
    return mergedItems.filter(item => {
      if (gridFilter === "PENDENTES" && item.isPreenchido) return false;
      if (gridFilter === "SUBSTITUIDOS" && !item.isSubstituido) return false;

      if (gridSearch.trim()) {
        const q = gridSearch.toLowerCase();
        return (
          item.linha.toLowerCase().includes(q) ||
          item.tabela.toLowerCase().includes(q) ||
          item.carroProgramado.toLowerCase().includes(q) ||
          item.carroRealizado.toLowerCase().includes(q) ||
          item.motoristaCodigo?.toLowerCase().includes(q) ||
          item.saidaGaragem.includes(q)
        );
      }

      return true;
    });
  }, [mergedItems, gridFilter, gridSearch]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = mergedItems.length;
    const preenchidos = mergedItems.filter(i => i.isPreenchido).length;
    const substituidos = mergedItems.filter(i => i.isSubstituido).length;
    const pendentes = total - preenchidos;
    const taxa = total > 0 ? Math.round((preenchidos / total) * 100) : 0;

    return { total, preenchidos, substituidos, pendentes, taxa };
  }, [mergedItems]);

  return (
    <div className="space-y-6">

      {/* ========================================================= */}
      {/* CABEÇALHO DO SUBMENU CARRO REALIZADO */}
      {/* ========================================================= */}
      <div className="bg-card border rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold">
                CAMPO: CARRO REALIZ.
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Lançamento & Substituição
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
              Alimentar Carro Realizado da Soltura
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Preencha o prefixo real que executou cada tabela, registre substituições de frota e vincule a matrícula do motorista.
            </p>
          </div>
        </div>

        {/* Seletores de Contexto Operacional */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border text-xs">
            <button
              type="button"
              onClick={() => setGaragem("VCG")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg font-bold transition-all",
                garagem === "VCG" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground"
              )}
            >
              VCG
            </button>
            <button
              type="button"
              onClick={() => setGaragem("VCM")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg font-bold transition-all",
                garagem === "VCM" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground"
              )}
            >
              VCM
            </button>
          </div>

          <div className="flex items-center bg-muted/60 p-1 rounded-xl border text-xs">
            <button
              type="button"
              onClick={() => setEscalaTipo("SEG_SEX")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg font-semibold transition-all",
                escalaTipo === "SEG_SEX" ? "bg-background text-foreground shadow-2xs border" : "text-muted-foreground"
              )}
            >
              Seg a Sex
            </button>
            <button
              type="button"
              onClick={() => setEscalaTipo("SABADO")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg font-semibold transition-all",
                escalaTipo === "SABADO" ? "bg-background text-foreground shadow-2xs border" : "text-muted-foreground"
              )}
            >
              Sábado
            </button>
            <button
              type="button"
              onClick={() => setEscalaTipo("DOM_FER")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg font-semibold transition-all",
                escalaTipo === "DOM_FER" ? "bg-background text-foreground shadow-2xs border" : "text-muted-foreground"
              )}
            >
              Dom/Fer
            </button>
          </div>

          {/* Seletor de Turno para Segunda a Sexta */}
          {escalaTipo === "SEG_SEX" && setTurnoTipo && (
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border text-xs animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => setTurnoTipo("MATUTINO")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 cursor-pointer",
                  turnoTipo === "MATUTINO" ? "bg-[#164E3A] text-white dark:bg-emerald-600 shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>☀️ Matutino</span>
              </button>
              <button
                type="button"
                onClick={() => setTurnoTipo("VESPERTINO")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 cursor-pointer",
                  turnoTipo === "VESPERTINO" ? "bg-[#164E3A] text-white dark:bg-emerald-600 shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>🌙 Vespertino</span>
              </button>
            </div>
          )}

          <Input
            type="date"
            value={dataOperacao}
            onChange={(e) => setDataOperacao(e.target.value)}
            className="w-36 h-9 text-xs bg-background"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* PAINEL DE ESTATÍSTICAS DE LANÇAMENTO */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border p-3.5 rounded-xl">
          <span className="text-xs text-muted-foreground font-semibold">Total da Escala</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-foreground">{stats.total}</span>
            <span className="text-xs text-muted-foreground">viagens</span>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl">
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Carro Realiz. Preenchido
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.preenchidos}</span>
            <span className="text-xs text-emerald-700/70 dark:text-emerald-300/70">confirmados</span>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-xl">
          <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
            Substituições (Trocados)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.substituidos}</span>
            <span className="text-xs text-blue-700/70 dark:text-blue-300/70">carros substitutos</span>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl">
          <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Pendentes de Lançamento
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendentes}</span>
            <span className="text-xs text-amber-700/70 dark:text-amber-300/70">aguardando</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CADASTRO DE CARROS PROGRAMADOS NO PADRÃO FOLHA DE SOLTURA */}
      {/* ========================================================= */}
      <div className="bg-card border-2 border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#164E3A] dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  Cadastrar Carro Programado na Escala
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 uppercase">
                  {garagem} • {escalaTipo === "SEG_SEX" ? "Seg a Sex" : escalaTipo === "SABADO" ? "Sábado" : "Dom/Fer"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Insira novas viagens programadas diretamente na escala operacional seguindo o mesmo padrão da folha de soltura.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsCadastroExpanded(!isCadastroExpanded)}
            className="text-xs text-muted-foreground gap-1 hover:text-foreground"
          >
            {isCadastroExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" /> Recolher
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> Expandir
              </>
            )}
          </Button>
        </div>

        {isCadastroExpanded && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Tabela de Inserção Rápida no Padrão Folha de Soltura */}
            <div className="border border-border/80 rounded-xl overflow-hidden shadow-2xs bg-background">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#164E3A] text-white font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-2 text-center w-12">Nº</th>
                      <th className="py-2.5 px-2.5 w-32">Linha</th>
                      <th className="py-2.5 px-2 text-center w-16">Tab</th>
                      <th className="py-2.5 px-2.5 text-center w-28">Carro Prog.</th>
                      <th className="py-2.5 px-2.5 text-center w-24">Saída Gar.</th>
                      <th className="py-2.5 px-2.5 text-center w-24">Início Linha</th>
                      <th className="py-2.5 px-2 text-center w-20">MOTO</th>
                      <th className="py-2.5 px-2.5 w-44">Motorista Escalado</th>
                      <th className="py-2.5 px-2 w-28">Tipo</th>
                      <th className="py-2.5 px-3 text-center w-32">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-muted/10 hover:bg-muted/20 transition-colors">
                      {/* Nº Previsto */}
                      <td className="py-2 px-2 text-center font-mono font-bold text-muted-foreground text-xs">
                        {String(schedules.length + 1).padStart(2, "0")}
                      </td>

                      {/* Linha */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          placeholder="Ex: 302/051"
                          value={newLinha}
                          onChange={(e) => setNewLinha(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateSchedule(e);
                          }}
                          className="w-full h-8 px-2 rounded-md border border-border/80 bg-background text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
                          required
                        />
                      </td>

                      {/* Tabela */}
                      <td className="py-2 px-1.5 text-center">
                        <input
                          type="text"
                          placeholder="1/1"
                          value={newTabela}
                          onChange={(e) => setNewTabela(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateSchedule(e);
                          }}
                          className="w-full h-8 px-1.5 text-center rounded-md border border-border/80 bg-background text-xs font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
                          required
                        />
                      </td>

                      {/* Carro Programado */}
                      <td className="py-2 px-2 text-center">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Ex: 4210"
                            value={newCarroProgramado}
                            onChange={(e) => setNewCarroProgramado(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateSchedule(e);
                            }}
                            className={cn(
                              "w-full h-8 px-2 text-center rounded-md border text-xs font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]",
                              newBloqueioCI
                                ? "border-rose-500 bg-rose-500/10 text-rose-600"
                                : "border-border/80 bg-background"
                            )}
                            required
                          />
                        </div>
                      </td>

                      {/* Saída Garagem */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="time"
                          value={newSaidaGaragem}
                          onChange={(e) => setNewSaidaGaragem(e.target.value)}
                          className="w-full h-8 px-1.5 text-center rounded-md border border-border/80 bg-background text-xs font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
                          required
                        />
                      </td>

                      {/* Início Linha */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="time"
                          value={newInicioLinha}
                          onChange={(e) => setNewInicioLinha(e.target.value)}
                          className="w-full h-8 px-1.5 text-center rounded-md border border-border/80 bg-background text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
                        />
                      </td>

                      {/* MOTO */}
                      <td className="py-2 px-1.5 text-center">
                        <input
                          type="text"
                          placeholder="MOTO"
                          value={newMotoCodigo}
                          onChange={(e) => handleNewMotoCodeChange(e.target.value)}
                          className="w-full h-8 px-1 text-center rounded-md border border-border/80 bg-background text-xs font-mono placeholder:text-muted-foreground/50 focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
                        />
                      </td>

                      {/* Nome do Motorista */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          placeholder="Nome do motorista..."
                          value={newMotoNome}
                          onChange={(e) => setNewMotoNome(e.target.value)}
                          className="w-full h-8 px-2 rounded-md border border-border/80 bg-background text-xs focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
                        />
                      </td>

                      {/* Tipo */}
                      <td className="py-2 px-1.5">
                        <select
                          value={newTipo}
                          onChange={(e) => setNewTipo(e.target.value as any)}
                          className="w-full h-8 px-1.5 rounded-md border border-border/80 bg-background text-xs font-semibold focus:outline-hidden"
                        >
                          <option value="REGULAR">Regular</option>
                          <option value="VCM">VCM</option>
                          <option value="FRETAMENTO">Frete</option>
                          <option value="EXTRA">Extra</option>
                        </select>
                      </td>

                      {/* Ação */}
                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateSchedule}
                          className="h-8 px-3 text-xs font-bold rounded-full bg-[#164E3A] hover:bg-[#113C2D] text-white shadow-2xs gap-1 transition-colors"
                          title="Adicionar viagem programada à escala"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Adicionar</span>
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alerta de Carro Retido no CI (se digitado) */}
            {newBloqueioCI && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center justify-between gap-2 text-rose-800 dark:text-rose-300 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>ALERTA DE BLOQUEIO:</strong> Carro {newBloqueioCI.prefixo} está retido no CI por: <strong>{newBloqueioCI.motivo}</strong> ({newBloqueioCI.responsavel || "Oficina"}).
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-200/60 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">
                  Carro em Manutenção
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* FORMULÁRIO DE LANÇAMENTO E ATRIBUIÇÃO DIRETA */}
      {/* ========================================================= */}
      <div className="bg-card border-2 border-primary/30 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Lançador Individual de Carro Realizado (P)
            </h2>
          </div>
          {currentItem && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              Linha: {currentItem.linha} | Tabela: {currentItem.tabela} | Saída: {currentItem.saidaGaragem}
            </span>
          )}
        </div>

        <form onSubmit={handleSaveForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">

            {/* Seletor de Viagem / Tabela */}
            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-xs font-bold text-foreground">
                Selecione a Linha / Tabela / Horário <span className="text-rose-500">*</span>
              </Label>
              <select
                value={selectedScheduleId}
                onChange={(e) => {
                  const target = mergedItems.find(i => i.id === e.target.value);
                  if (target) handleSelectSchedule(target);
                }}
                className="w-full h-10 px-3 rounded-lg border bg-muted/40 text-xs font-semibold focus:outline-hidden"
              >
                {mergedItems.map(item => (
                  <option key={item.id} value={item.id}>
                    Linha {item.linha} - Tab {item.tabela} | Prog: {item.carroProgramado} | Saída: {item.saidaGaragem} {item.isPreenchido ? `(Realiz: ${item.carroRealizado})` : "• PENDENTE"}
                  </option>
                ))}
              </select>
            </div>

            {/* Carro Programado (Somente Leitura) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">
                Carro Programado
              </Label>
              <div className="h-10 px-3 rounded-lg border bg-muted/20 flex items-center justify-between font-mono font-bold text-sm text-muted-foreground">
                <span>{currentItem?.carroProgramado || "---"}</span>
                <span className="text-[10px] text-muted-foreground/70 uppercase">Escala</span>
              </div>
            </div>

            {/* Campo Carro Realizado (P) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Carro Realiz. <span className="text-rose-500">*</span></span>
                {isSubstituicao && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                    SUBSTITUIÇÃO
                  </span>
                )}
              </Label>
              <Input
                placeholder="Ex: 4204, 3200"
                value={inputCarroRealizado}
                onChange={(e) => setInputCarroRealizado(e.target.value)}
                className={cn(
                  "font-mono font-bold text-sm h-10 transition-colors",
                  isSubstituicao ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" : "bg-muted/40",
                  bloqueioCI ? "border-rose-500 bg-rose-50/70 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200" : ""
                )}
                required
              />
            </div>

            {/* Hora de Saída Real */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Hora Saída Garagem
              </Label>
              <Input
                type="time"
                value={inputHoraSaida}
                onChange={(e) => setInputHoraSaida(e.target.value)}
                className="h-10 text-xs font-mono bg-muted/40"
              />
            </div>

          </div>

          {/* Alerta de Carro Retido no CI */}
          {bloqueioCI && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 flex items-start gap-2.5 text-rose-800 dark:text-rose-300 text-xs">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  ALERTA DE BLOQUEIO CI: Carro {bloqueioCI.prefixo} está retido na oficina!
                </span>
                <p className="mt-0.5">
                  Motivo: <strong>{bloqueioCI.motivo}</strong> | Responsável: {bloqueioCI.responsavel || "Oficina"} | Entrada: {bloqueioCI.data}
                </p>
              </div>
            </div>
          )}

          {/* Segunda Linha: Motorista e Motivo de Substituição */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3.5">

            {/* Matrícula do Motorista */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                MOTO (Matrícula)
              </Label>
              <Input
                placeholder="Ex: 4012, 105"
                value={inputMotoCodigo}
                onChange={(e) => handleMotoCodeChange(e.target.value)}
                className="font-mono font-bold text-xs h-9 bg-muted/40"
              />
            </div>

            {/* Nome do Motorista */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-foreground">
                Nome do Motorista
              </Label>
              <Input
                placeholder="Nome do motorista escalado..."
                value={inputMotoNome}
                onChange={(e) => setInputMotoNome(e.target.value)}
                className="text-xs h-9 bg-muted/40"
              />
            </div>

            {/* Motivo de Substituição (se houver) */}
            {isSubstituicao ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  Motivo da Troca de Carro
                </Label>
                <select
                  value={inputMotivoSubstituicao}
                  onChange={(e) => setInputMotivoSubstituicao(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="Carro com pendência no CI">Carro com defeito / CI</option>
                  <option value="Remanejamento de frota">Remanejamento operacional</option>
                  <option value="Troca por ar condicionado">Ar-condicionado inoperante</option>
                  <option value="Atraso na liberação">Atraso na lavagem/revisão</option>
                  <option value="Outro motivo operacional">Outro motivo</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Observações de Pista
                </Label>
                <Input
                  placeholder="Observação opcional..."
                  value={inputObs}
                  onChange={(e) => setInputObs(e.target.value)}
                  className="text-xs h-9 bg-muted/40"
                />
              </div>
            )}

          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>Atalho: Pressione</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px]">Enter</kbd>
              <span>para salvar e avançar para o próximo item</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                className="bg-primary text-primary-foreground text-xs h-9 font-semibold gap-1.5 shadow-xs"
              >
                <Save className="w-4 h-4" />
                Salvar Carro Realizado (P)
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* ========================================================= */}
      {/* GRADE DE ALIMENTAÇÃO RÁPIDA EM LOTE */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-muted/60 p-1 rounded-full border border-border/80 text-xs">
              <button
                type="button"
                onClick={() => setGridFilter("TODOS")}
                className={cn(
                  "px-3.5 py-1 rounded-full font-bold transition-all cursor-pointer",
                  gridFilter === "TODOS" ? "bg-background text-foreground shadow-2xs border border-border/50" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Todos ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setGridFilter("PENDENTES")}
                className={cn(
                  "px-3.5 py-1 rounded-full font-bold transition-all cursor-pointer",
                  gridFilter === "PENDENTES" ? "bg-amber-500 text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Pendentes ({stats.pendentes})
              </button>
              <button
                type="button"
                onClick={() => setGridFilter("SUBSTITUIDOS")}
                className={cn(
                  "px-3.5 py-1 rounded-full font-bold transition-all cursor-pointer",
                  gridFilter === "SUBSTITUIDOS" ? "bg-blue-600 text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Trocados ({stats.substituidos})
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchFillProgramados}
              className="h-8 text-xs gap-1.5"
              title="Preenche todos os pendentes com o carro da escala"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Preencher Pendentes c/ Programados
            </Button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filtrar por linha, tab, carro..."
              value={gridSearch}
              onChange={(e) => setGridSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-card"
            />
          </div>

        </div>

        {/* Tabela Interativa de Digitação Rápida */}
        <div className="bg-card border rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3 w-12 text-center">N°</th>
                  <th className="py-2.5 px-3">Linha</th>
                  <th className="py-2.5 px-2">Tab</th>
                  <th className="py-2.5 px-3">Carro Programado</th>
                  <th className="py-2.5 px-3 w-40">Carro Realiz.</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-3 w-32">MOTO (Matrícula)</th>
                  <th className="py-2.5 px-3">Motorista</th>
                  <th className="py-2.5 px-2">Saída Gar.</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredGridItems.map((item, idx) => {
                  const isSelected = item.id === selectedScheduleId;
                  const itemBloqueio = checkCarroBloqueado(item.carroRealizado || item.carroProgramado, ciList);

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        isSelected ? "bg-primary/5 font-medium" : "",
                        item.isSubstituido ? "bg-blue-50/20 dark:bg-blue-950/10" : ""
                      )}
                    >
                      {/* Ordem */}
                      <td className="py-2 px-3 text-center font-mono text-muted-foreground">
                        {item.ordem || idx + 1}
                      </td>

                      {/* Linha */}
                      <td className="py-2 px-3 font-bold text-foreground">
                        {item.linha}
                      </td>

                      {/* Tabela */}
                      <td className="py-2 px-2 font-mono font-bold text-muted-foreground">
                        {item.tabela}
                      </td>

                      {/* Carro Programado */}
                      <td className="py-2 px-3">
                        <span className={cn(
                          "font-mono px-2 py-0.5 rounded text-xs font-semibold",
                          item.isSubstituido ? "line-through text-rose-500 bg-rose-50 dark:bg-rose-950/40" : "bg-muted text-muted-foreground"
                        )}>
                          {item.carroProgramado}
                        </span>
                      </td>

                      {/* Carro Realizado (P) - Input Inline de Alta Agilidade */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            defaultValue={item.carroRealizado || item.carroProgramado}
                            key={item.carroRealizado || item.carroProgramado}
                            onBlur={(e) => handleCellChange(item.id, "carro", e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleCellChange(item.id, "carro", e.currentTarget.value);
                                e.currentTarget.blur();
                              }
                            }}
                            className={cn(
                              "w-28 px-2 py-1 rounded-md border font-mono font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/40",
                              item.isSubstituido
                                ? "bg-blue-100 text-blue-900 border-blue-400 dark:bg-blue-950 dark:text-blue-200 font-bold"
                                : item.isPreenchido
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-200"
                                  : "bg-muted/40 text-foreground"
                            )}
                            placeholder="Prefixo..."
                          />
                          {itemBloqueio && (
                            <span title={`Carro no CI: ${itemBloqueio.motivo}`}>
                              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-2">
                        {item.isSubstituido ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            Trocado
                          </span>
                        ) : item.isPreenchido ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Normal
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Pendente
                          </span>
                        )}
                      </td>

                      {/* MOTO (Matrícula) */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          defaultValue={item.motoristaCodigo || ""}
                          key={item.motoristaCodigo}
                          onBlur={(e) => handleCellChange(item.id, "moto", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleCellChange(item.id, "moto", e.currentTarget.value);
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-20 px-2 py-1 rounded-md border text-xs font-mono bg-muted/40 focus:outline-hidden"
                          placeholder="MOTO..."
                        />
                      </td>

                      {/* Nome do Motorista */}
                      <td className="py-2 px-3 text-muted-foreground truncate max-w-[140px]" title={item.motoristaNome}>
                        {item.motoristaNome || "---"}
                      </td>

                      {/* Saída Garagem */}
                      <td className="py-2 px-2 font-mono text-muted-foreground">
                        {item.saidaGaragem}
                      </td>

                      {/* Ação */}
                      <td className="py-2 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectSchedule(item)}
                          className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10 font-semibold"
                        >
                          Carregar no Form
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
