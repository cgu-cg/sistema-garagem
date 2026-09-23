import React, { useState, useMemo, useEffect } from "react";
import { 
  ManutencaoCarroItem, 
  getManutencaoData, 
  saveManutencaoData, 
  subscribeManutencaoUpdates,
  syncItemsWithCI,
  SEED_MANUTENCAO_OFICIAL,
  getConsorciadaByPrefix
} from "./manutencaoManager";
import { getInitialCIBloqueios, saveCIBloqueiosToStorage, subscribeCIUpdates } from "@/pages/soltura/ciManager";
import { INVENTORY_CARS } from "@/data/inventoryCars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/stores/auth";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Printer, 
  Plus, 
  RotateCcw, 
  Wrench, 
  Calendar as CalendarIcon, 
  Edit2, 
  Trash2, 
  Bus,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  Ban
} from "lucide-react";
import { cn } from "@/lib/utils";

const SUGESTOES_OBS = [
  "MOTOR", "MECÂNICA", "SINISTRO", "CÂMBIO", "MODULO", "COXIM MOTOR", 
  "VIDRO DA JANELA", "RADIADOR", "REVISAO", "FALHANDO", "ALTERNADOR", 
  "ALINHAMENTO", "TACOGRAFO", "ELEVADOR", "VIDRO BOLHA", "FREIO", "SUSPENSÃO"
];

export function ManutencaoPage() {
  const { user } = useAuth();

  // Data selecionada (padrão inicial é a data oficial do documento: 2026-09-09 ou data corrente)
  const [dataOperacao, setDataOperacao] = useState<string>("2026-09-09");
  
  // Lista de carros de manutenção do dia
  const [items, setItems] = useState<ManutencaoCarroItem[]>(() => getManutencaoData("2026-09-09"));

  // Filtros inicializados com a garagem do usuário caso seja VCG ou VCM
  const [filterConsorciada, setFilterConsorciada] = useState<"TODAS" | "VSF" | "JTU" | "VCG" | "VCM">(() => {
    if (user?.garagem === "VCG" || user?.email?.toLowerCase().includes("vcg")) return "VCG";
    if (user?.garagem === "VCM" || user?.email?.toLowerCase().includes("vcm")) return "VCM";
    return "TODAS";
  });
  const [filterStatus, setFilterStatus] = useState<"TODOS" | "BLOQUEADOS" | "EM_EXECUCAO" | "LIBERADOS">("TODOS");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal de Adicionar Carro
  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [newPrefixo, setNewPrefixo] = useState("");
  const [newObservacao, setNewObservacao] = useState("");
  const [newBloqueado, setNewBloqueado] = useState(false);
  const [newEmExecucao, setNewEmExecucao] = useState(false);
  const [newLiberado, setNewLiberado] = useState(true);

  // Modal de Edição de Observação
  const [editItem, setEditItem] = useState<ManutencaoCarroItem | null>(null);
  const [editObs, setEditObs] = useState("");

  // Sincronização em tempo real via storage e custom events (Manutenção e CI)
  useEffect(() => {
    const list = getManutencaoData(dataOperacao);
    setItems(list);

    const unsubscribeManut = subscribeManutencaoUpdates((detail) => {
      if (detail.data === dataOperacao) {
        setItems(detail.items);
      }
    });

    const unsubscribeCI = subscribeCIUpdates((updatedCI) => {
      setItems(prevItems => {
        return syncItemsWithCI(prevItems, updatedCI, dataOperacao);
      });
    });

    return () => {
      unsubscribeManut();
      unsubscribeCI();
    };
  }, [dataOperacao]);

  // Cálculos de Resumo idênticos aos 3 quadros (Bloqueados, Em Manutenção, Liberados, Total)
  const stats = useMemo(() => {
    let bloqueados = 0;
    let emExecucao = 0;
    let liberados = 0;

    items.forEach(item => {
      if (item.emExecucao && !item.liberado) {
        emExecucao++;
      } else if (item.bloqueado && !item.liberado) {
        bloqueados++;
      } else {
        liberados++;
      }
    });

    const total = items.length || 1;
    const pctBloqueados = Math.round((bloqueados / total) * 100);
    const pctEmExecucao = Math.round((emExecucao / total) * 100);
    const pctLiberados = Math.round((liberados / total) * 100);

    return {
      bloqueados,
      emExecucao,
      liberados,
      total: items.length,
      pctBloqueados,
      pctEmExecucao,
      pctLiberados
    };
  }, [items]);

  // Transição de status a partir do menu de 3 pontinhos
  const handleSetStatus = (itemId: string, newStatus: "BLOQUEADO" | "EM_EXECUCAO" | "LIBERADO") => {
    const updated = items.map(item => {
      if (item.id !== itemId) return item;

      if (newStatus === "BLOQUEADO") {
        return {
          ...item,
          bloqueado: true,
          emExecucao: false,
          liberado: false
        };
      }

      if (newStatus === "EM_EXECUCAO") {
        return {
          ...item,
          bloqueado: true,
          emExecucao: true,
          liberado: false
        };
      }

      if (newStatus === "LIBERADO") {
        return {
          ...item,
          liberado: true,
          bloqueado: false,
          emExecucao: false
        };
      }

      return item;
    });

    setItems(updated);
    saveManutencaoData(dataOperacao, updated);

    if (newStatus === "LIBERADO") {
      toast.success("Veículo liberado da manutenção e desimpedido na CI e Soltura.");
    } else if (newStatus === "BLOQUEADO") {
      toast.success("Veículo bloqueado na manutenção, lançado na CI e retido na Soltura.");
    } else {
      toast.success("Veículo em manutenção na oficina, lançado na CI e retido na Soltura.");
    }
  };

  // Abrir modal de adição com pré-configuração
  const handleOpenAddModal = (status?: "BLOQUEADO" | "EM_EXECUCAO" | "LIBERADO") => {
    if (status === "BLOQUEADO") {
      setNewBloqueado(true);
      setNewEmExecucao(false);
      setNewLiberado(false);
    } else if (status === "EM_EXECUCAO") {
      setNewBloqueado(true);
      setNewEmExecucao(true);
      setNewLiberado(false);
    } else {
      setNewBloqueado(false);
      setNewEmExecucao(false);
      setNewLiberado(true);
    }
    setModalAddOpen(true);
  };

  // Salvar alteração de observação
  const handleSaveObservacao = () => {
    if (!editItem) return;
    const updated = items.map(it => {
      if (it.id === editItem.id) {
        return { ...it, observacao: editObs.trim().toUpperCase() };
      }
      return it;
    });

    setItems(updated);
    saveManutencaoData(dataOperacao, updated);
    setEditItem(null);
    toast.success(`Observação do carro ${editItem.prefixo} atualizada.`);
  };

  // Adicionar novo carro à folha
  const handleAddCarro = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrefix = newPrefixo.trim();
    if (!cleanPrefix) {
      toast.error("Informe o prefixo do veículo.");
      return;
    }

    const jaExiste = items.some(it => it.prefixo === cleanPrefix);
    if (jaExiste) {
      toast.error(`O carro ${cleanPrefix} já está presente na lista desta data.`);
      return;
    }

    const consorciada = getConsorciadaByPrefix(cleanPrefix);
    const newItem: ManutencaoCarroItem = {
      id: `manut-${cleanPrefix}-${Date.now()}`,
      prefixo: cleanPrefix,
      consorciada,
      observacao: newObservacao.trim().toUpperCase(),
      bloqueado: newBloqueado,
      emExecucao: newEmExecucao,
      liberado: newLiberado,
      data: dataOperacao
    };

    const updated = [...items, newItem];
    setItems(updated);
    saveManutencaoData(dataOperacao, updated);

    toast.success(`Carro ${cleanPrefix} adicionado à folha de manutenção.`);
    setModalAddOpen(false);
    setNewPrefixo("");
    setNewObservacao("");
    setNewBloqueado(false);
    setNewEmExecucao(false);
    setNewLiberado(true);
  };

  // Remover carro da folha
  const handleRemoveCarro = (id: string, prefixo: string) => {
    if (!confirm(`Deseja remover o carro ${prefixo} desta folha de manutenção?`)) return;
    const clean = prefixo.replace(/\D/g, "");
    const updated = items.filter(it => it.id !== id);
    setItems(updated);
    saveManutencaoData(dataOperacao, updated);

    // Também atualiza na CI para que o veículo não permaneça bloqueado na Soltura
    try {
      const currentCI = getInitialCIBloqueios();
      const updatedCI = currentCI.map(c => {
        if (c.prefixo.replace(/\D/g, "") === clean && c.status !== "LIBERADO") {
          return {
            ...c,
            status: "LIBERADO" as const,
            dataLiberacao: dataOperacao,
            motivoLiberacao: "Removido do Controle de Manutenção"
          };
        }
        return c;
      });
      saveCIBloqueiosToStorage(updatedCI);
    } catch (e) {
      console.error("Erro ao liberar carro na CI ao remover:", e);
    }

    toast.info(`Carro ${prefixo} removido da folha e liberado na CI e Soltura.`);
  };

  // Restaurar dados originais da semente sincronizados com a CI
  const handleResetSeed = () => {
    if (!confirm("Deseja restaurar a planilha com a base oficial sincronizada com a CI Manutenção?")) return;
    const currentCI = getInitialCIBloqueios();
    const seedWithDate = SEED_MANUTENCAO_OFICIAL.map(it => ({ ...it, data: dataOperacao }));
    const synced = syncItemsWithCI(seedWithDate, currentCI, dataOperacao);
    setItems(synced);
    saveManutencaoData(dataOperacao, synced);
    toast.success("Folha restaurada e sincronizada com a CI Manutenção.");
  };

  // Filtragem por busca e consorciada
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Filtro de consorciada
      if (filterConsorciada !== "TODAS" && item.consorciada !== filterConsorciada) {
        return false;
      }

      // Filtro de status
      // Filtro de status compatível com os 3 quadros
      if (filterStatus === "BLOQUEADOS" && (!item.bloqueado || item.emExecucao || item.liberado)) return false;
      if (filterStatus === "EM_EXECUCAO" && (!item.emExecucao || item.liberado)) return false;
      if (filterStatus === "LIBERADOS" && !item.liberado && (item.bloqueado || item.emExecucao)) return false;

      // Busca por prefixo ou observação
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchPref = item.prefixo.toLowerCase().includes(q);
        const matchObs = item.observacao.toLowerCase().includes(q);
        if (!matchPref && !matchObs) return false;
      }

      return true;
    });
  }, [items, filterConsorciada, filterStatus, searchQuery]);

  // Agrupamento por consorciada mantendo a ordem oficial: VSF, JTU, VCG, VCM
  const groupedSections = useMemo(() => {
    const consorciadas: Array<"VSF" | "JTU" | "VCG" | "VCM"> = ["VSF", "JTU", "VCG", "VCM"];
    return consorciadas.map(c => {
      const sectionItems = filteredItems.filter(it => it.consorciada === c);
      
      // Ordenação por prefixo numérico
      const sorted = [...sectionItems].sort((a, b) => 
        a.prefixo.localeCompare(b.prefixo, undefined, { numeric: true })
      );

      return {
        consorciada: c,
        label: c === "VSF" ? "VSF (Viação São Francisco)" : c === "JTU" ? "JTU (Jaguar Transporte Urbano)" : c === "VCG" ? "VCG (Viação Campo Grande)" : "VCM (Viação Cidade Morena)",
        items: sorted
      };
    }).filter(sec => sec.items.length > 0 || (filterConsorciada === sec.consorciada));
  }, [filteredItems, filterConsorciada]);

  // Formatação visual da data: se for ano atual, exibe apenas DD/MM (ex: 09/09); se outro ano, DD/MM/AAAA
  const formattedData = useMemo(() => {
    try {
      const [ano, mes, dia] = dataOperacao.split("-");
      const currentYear = new Date().getFullYear().toString();
      if (ano === currentYear) {
        return `${dia}/${mes}`;
      }
      return `${dia}/${mes}/${ano}`;
    } catch {
      return dataOperacao;
    }
  }, [dataOperacao]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ==========================================================
          1. HEADER PRINCIPAL (ESTILO DONEZO / BENTO GRID)
          ========================================================== */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Controle de Manutenção
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Gerencie, priorize e acompanhe os veículos bloqueados, em execução e liberados com facilidade.
          </p>
        </div>

        {/* Botões em formato de Pílula (Pill Buttons) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setModalAddOpen(true)}
            size="sm"
            className="rounded-full px-5 py-2 h-9 bg-[#164E3A] hover:bg-[#113C2D] text-white shadow-xs font-semibold text-xs flex items-center gap-2 transition-transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Veículo
          </Button>

          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="rounded-full px-5 py-2 h-9 border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0E1420] text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 shadow-xs font-semibold text-xs flex items-center gap-2"
          >
            <Printer className="w-3.5 h-3.5 text-gray-500" />
            Imprimir Planilha
          </Button>

          <Button
            onClick={handleResetSeed}
            variant="ghost"
            size="sm"
            className="rounded-full px-3 py-2 h-9 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
            title="Restaurar padrão oficial das 3 fotos (09/09/2026)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ==========================================================
          2. CARDS DE KPI BENTO GRID (4 COLUNAS - ESTILO DONEZO)
          O primeiro com destaque Verde Floresta e botão circular ↗
          ========================================================== */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: BLOQUEADOS (Destaque Verde Floresta Escuro) */}
        <div 
          onClick={() => setFilterStatus(prev => prev === "BLOQUEADOS" ? "TODOS" : "BLOQUEADOS")}
          className={cn(
            "rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between h-40 transition-all cursor-pointer group",
            filterStatus === "BLOQUEADOS" ? "ring-4 ring-emerald-400/40" : "",
            "bg-[#164E3A] text-white"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-100/90 tracking-wide">
              Veículos Bloqueados
            </span>
            <div className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center group-hover:bg-white/25 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              {stats.bloqueados}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-100">
              <AlertTriangle className="w-3 h-3 text-amber-300" />
              {stats.pctBloqueados}% da frota retida
            </span>
          </div>
        </div>

        {/* Card 2: EM EXECUÇÃO (Branco / Laranja) */}
        <div 
          onClick={() => setFilterStatus(prev => prev === "EM_EXECUCAO" ? "TODOS" : "EM_EXECUCAO")}
          className={cn(
            "rounded-3xl p-6 shadow-xs relative flex flex-col justify-between h-40 transition-all cursor-pointer group bg-white dark:bg-[#0E1420] border border-gray-100/90 dark:border-slate-800/80",
            filterStatus === "EM_EXECUCAO" ? "ring-4 ring-orange-500/30" : ""
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
              Em Execução
            </span>
            <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
              {stats.emExecucao}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/40">
              <Wrench className="w-3 h-3 text-orange-500" />
              {stats.pctEmExecucao}% em oficina ativa
            </span>
          </div>
        </div>

        {/* Card 3: LIBERADOS (Branco / Verde Esmeralda) */}
        <div 
          onClick={() => setFilterStatus(prev => prev === "LIBERADOS" ? "TODOS" : "LIBERADOS")}
          className={cn(
            "rounded-3xl p-6 shadow-xs relative flex flex-col justify-between h-40 transition-all cursor-pointer group bg-white dark:bg-[#0E1420] border border-gray-100/90 dark:border-slate-800/80",
            filterStatus === "LIBERADOS" ? "ring-4 ring-emerald-500/30" : ""
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
              Veículos Liberados
            </span>
            <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.liberados}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {stats.pctLiberados}% prontos para pista
            </span>
          </div>
        </div>

        {/* Card 4: TOTAL MONITORADO */}
        <div 
          onClick={() => setFilterStatus("TODOS")}
          className={cn(
            "rounded-3xl p-6 shadow-xs relative flex flex-col justify-between h-40 transition-all cursor-pointer group bg-white dark:bg-[#0E1420] border border-gray-100/90 dark:border-slate-800/80",
            filterStatus === "TODOS" ? "ring-2 ring-gray-300 dark:ring-slate-600" : ""
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
              Total Monitorado
            </span>
            <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              {stats.total}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
              <Bus className="w-3 h-3 text-gray-500" />
              VSF, JTU e VCG
            </span>
          </div>
        </div>

      </div>

      {/* ==========================================================
          3. CARD PRINCIPAL DA PLANILHA OFICIAL DE MANUTENÇÃO
          ========================================================== */}
      <div className="bg-white dark:bg-[#0E1420] border border-gray-100/90 dark:border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
        
        {/* ==========================================================
            CABEÇALHO DA PLANILHA (PRINT 01 - ACIMA DOS FILTROS)
            ========================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100 dark:border-slate-800/80">
          <div>
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              CARROS EM: MANUTENÇÃO, BLOQUEADO, LIBERADO
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
              Consórcio Guaicurus • Quadro de Manutenção Operacional
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden print:inline-block text-xs font-bold font-mono mr-2">
              {formattedData}
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              {filteredItems.length} veículos listados
            </span>
          </div>
        </div>

        {/* ==========================================================
            BARRA DE FILTROS E BUSCA (PRINT 02 - ABAIXO DO CABEÇALHO)
            ========================================================== */}
        <div className="print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
          
          {/* Seletor de Data e Pills de Consorciada */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Seletor de Data Sem "DATA:" e sem ano quando for ano atual */}
            <div className="relative flex items-center gap-2 bg-gray-50 dark:bg-slate-900 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 shadow-2xs hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group">
              <CalendarIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span className="text-xs font-mono font-bold text-gray-900 dark:text-white select-none">
                {formattedData}
              </span>
              <input
                type="date"
                value={dataOperacao}
                onChange={(e) => {
                  if (e.target.value) setDataOperacao(e.target.value);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Clique para selecionar data"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDataOperacao(new Date().toISOString().split("T")[0]);
                }}
                className="relative z-10 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline px-1 border-l border-gray-200 dark:border-slate-700 pl-2"
              >
                Hoje
              </button>
            </div>

            {/* Pills de Consorciadas */}
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-900 p-1 rounded-full border border-gray-200 dark:border-slate-700">
              {(["TODAS", "VSF", "JTU", "VCG", "VCM"] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilterConsorciada(c)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold transition-all",
                    filterConsorciada === c
                      ? "bg-[#164E3A] text-white shadow-xs font-bold"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  {c === "TODAS" ? "Todas as Garagens" : c}
                </button>
              ))}
            </div>

          </div>

          {/* Busca Global em Pílula com atalho Ctrl+K */}
          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar prefixo ou defeito..."
              className="h-9 pl-9 pr-14 text-xs rounded-full bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 shadow-2xs"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400 bg-gray-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm">
              Ctrl+K
            </span>
          </div>

        </div>

        {/* ==========================================================
            CONTEÚDO DAS CONSORCIADAS (3 QUADROS PARALELOS)
            ========================================================== */}
        <div className="space-y-6">
          {groupedSections.length === 0 ? (
            <div className="p-8 text-center text-gray-500 rounded-2xl border border-gray-200 dark:border-slate-800">
              <Bus className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">Nenhum veículo encontrado para os filtros selecionados.</p>
            </div>
          ) : (
              groupedSections.map((sec) => {
                const bloqueados = sec.items.filter(it => it.bloqueado && !it.emExecucao && !it.liberado);
                const emExecucao = sec.items.filter(it => it.emExecucao && !it.liberado);
                const liberados = sec.items.filter(it => it.liberado || (!it.bloqueado && !it.emExecucao));

                return (
                  <div 
                    key={sec.consorciada} 
                    className="rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden bg-gray-50/50 dark:bg-slate-900/30"
                  >
                    {/* CABEÇALHO DA CONSORCIADA */}
                    <div className="bg-gray-100/90 dark:bg-slate-800/60 text-gray-800 dark:text-slate-200 font-bold text-xs sm:text-sm py-2.5 px-4 flex items-center justify-between border-b border-gray-200 dark:border-slate-800">
                      <span className="tracking-wide font-bold">{sec.label}</span>
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 font-mono">
                        {sec.items.length} {sec.items.length === 1 ? "carro" : "carros"}
                      </span>
                    </div>

                    {/* GRID DE 3 QUADROS: BLOQUEADOS | EM MANUTENÇÃO | LIBERADO */}
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                      
                      {/* QUADRO 1: BLOQUEADOS (ROSE / VERMELHO) */}
                      <div className="rounded-2xl border border-rose-500/40 dark:border-rose-500/30 bg-rose-500/[0.02] dark:bg-rose-950/10 overflow-hidden flex flex-col">
                        {/* Header do Quadro */}
                        <div className="p-3 border-b border-rose-200/80 dark:border-rose-900/40 flex items-center justify-between bg-rose-50/60 dark:bg-rose-950/20">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                              Bloqueados
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/40">
                              {bloqueados.length}
                            </span>
                          </div>
                          <button
                            onClick={() => handleOpenAddModal("BLOQUEADO")}
                            className="w-6 h-6 rounded-md bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            title="Adicionar carro bloqueado"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Tabela de Bloqueados */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400 border-b border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10">
                                <th className="py-2 px-3 w-20 text-center">Carro</th>
                                <th className="py-2 px-3 text-left">Defeito</th>
                                <th className="py-2 px-3 w-12 text-center">Ação</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-100/60 dark:divide-rose-950/40">
                              {bloqueados.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="py-6 text-center text-xs text-gray-400 dark:text-slate-500">
                                    Nenhum veículo bloqueado
                                  </td>
                                </tr>
                              ) : (
                                bloqueados.map((item) => (
                                  <tr key={item.id} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
                                    <td className="py-2 px-3 text-center">
                                      <span className="inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-rose-100/80 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900/50">
                                        {item.prefixo}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 font-semibold uppercase text-[11px] text-gray-800 dark:text-slate-200">
                                      <span className="truncate block max-w-[130px] sm:max-w-[150px]" title={item.observacao}>
                                        {item.observacao || "—"}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="p-1 rounded-md text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer">
                                            <MoreVertical className="w-4 h-4" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                          <DropdownMenuItem onClick={() => handleSetStatus(item.id, "LIBERADO")}>
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-2" />
                                            Liberar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleSetStatus(item.id, "EM_EXECUCAO")}>
                                            <Wrench className="w-3.5 h-3.5 text-amber-500 mr-2" />
                                            Em Manutenção
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => { setEditItem(item); setEditObs(item.observacao); }}>
                                            <Edit2 className="w-3.5 h-3.5 text-gray-500 mr-2" />
                                            Editar Defeito
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleRemoveCarro(item.id, item.prefixo)} className="text-red-600 dark:text-red-400">
                                            <Trash2 className="w-3.5 h-3.5 text-red-500 mr-2" />
                                            Remover
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* QUADRO 2: EM MANUTENÇÃO (ÂMBAR / LARANJA) */}
                      <div className="rounded-2xl border border-amber-500/40 dark:border-amber-500/30 bg-amber-500/[0.02] dark:bg-amber-950/10 overflow-hidden flex flex-col">
                        {/* Header do Quadro */}
                        <div className="p-3 border-b border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between bg-amber-50/60 dark:bg-amber-950/20">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                              Em Manutenção
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/40">
                              {emExecucao.length}
                            </span>
                          </div>
                          <button
                            onClick={() => handleOpenAddModal("EM_EXECUCAO")}
                            className="w-6 h-6 rounded-md bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            title="Adicionar carro em manutenção"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Tabela de Em Manutenção */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/10">
                                <th className="py-2 px-3 w-20 text-center">Carro</th>
                                <th className="py-2 px-3 text-left">Defeito</th>
                                <th className="py-2 px-3 w-12 text-center">Ação</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100/60 dark:divide-amber-950/40">
                              {emExecucao.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="py-6 text-center text-xs text-gray-400 dark:text-slate-500">
                                    Nenhum veículo em manutenção
                                  </td>
                                </tr>
                              ) : (
                                emExecucao.map((item) => (
                                  <tr key={item.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                                    <td className="py-2 px-3 text-center">
                                      <span className="inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-900/50">
                                        {item.prefixo}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 font-semibold uppercase text-[11px] text-gray-800 dark:text-slate-200">
                                      <span className="truncate block max-w-[130px] sm:max-w-[150px]" title={item.observacao}>
                                        {item.observacao || "—"}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="p-1 rounded-md text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors cursor-pointer">
                                            <MoreVertical className="w-4 h-4" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                          <DropdownMenuItem onClick={() => handleSetStatus(item.id, "LIBERADO")}>
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-2" />
                                            Liberar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleSetStatus(item.id, "BLOQUEADO")}>
                                            <Ban className="w-3.5 h-3.5 text-rose-500 mr-2" />
                                            Bloquear
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => { setEditItem(item); setEditObs(item.observacao); }}>
                                            <Edit2 className="w-3.5 h-3.5 text-gray-500 mr-2" />
                                            Editar Defeito
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleRemoveCarro(item.id, item.prefixo)} className="text-red-600 dark:text-red-400">
                                            <Trash2 className="w-3.5 h-3.5 text-red-500 mr-2" />
                                            Remover
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* QUADRO 3: LIBERADO (ESMERALDA / VERDE) */}
                      <div className="rounded-2xl border border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-500/[0.02] dark:bg-emerald-950/10 overflow-hidden flex flex-col">
                        {/* Header do Quadro */}
                        <div className="p-3 border-b border-emerald-200/80 dark:border-emerald-900/40 flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/20">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                              Liberado
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/40">
                              {liberados.length}
                            </span>
                          </div>
                          <button
                            onClick={() => handleOpenAddModal("LIBERADO")}
                            className="w-6 h-6 rounded-md bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            title="Adicionar carro liberado"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Tabela de Liberados */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400 border-b border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10">
                                <th className="py-2 px-3 w-20 text-center">Carro</th>
                                <th className="py-2 px-3 text-left">Defeito</th>
                                <th className="py-2 px-3 w-12 text-center">Ação</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-100/60 dark:divide-emerald-950/40">
                              {liberados.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="py-6 text-center text-xs text-gray-400 dark:text-slate-500">
                                    Nenhum veículo liberado
                                  </td>
                                </tr>
                              ) : (
                                liberados.map((item) => (
                                  <tr key={item.id} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                                    <td className="py-2 px-3 text-center">
                                      <span className="inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-900/50">
                                        {item.prefixo}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 font-semibold uppercase text-[11px] text-gray-800 dark:text-slate-200">
                                      <span className="truncate block max-w-[130px] sm:max-w-[150px]" title={item.observacao}>
                                        {item.observacao || "—"}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="p-1 rounded-md text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer">
                                            <MoreVertical className="w-4 h-4" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                          <DropdownMenuItem onClick={() => handleSetStatus(item.id, "BLOQUEADO")}>
                                            <Ban className="w-3.5 h-3.5 text-rose-500 mr-2" />
                                            Bloquear
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleSetStatus(item.id, "EM_EXECUCAO")}>
                                            <Wrench className="w-3.5 h-3.5 text-amber-500 mr-2" />
                                            Em Manutenção
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => { setEditItem(item); setEditObs(item.observacao); }}>
                                            <Edit2 className="w-3.5 h-3.5 text-gray-500 mr-2" />
                                            Editar Defeito
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleRemoveCarro(item.id, item.prefixo)} className="text-red-600 dark:text-red-400">
                                            <Trash2 className="w-3.5 h-3.5 text-red-500 mr-2" />
                                            Remover
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

      {/* ==========================================================
          MODAL: ADICIONAR VEÍCULO À FOLHA DE MANUTENÇÃO
          ========================================================== */}
      <Dialog open={modalAddOpen} onOpenChange={setModalAddOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Bus className="w-5 h-5 text-[#164E3A]" />
              Adicionar Carro na Folha de Manutenção
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddCarro} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Prefixo do Carro
              </label>
              <div className="relative mt-1">
                <Input
                  list="inventory-suggestions"
                  value={newPrefixo}
                  onChange={(e) => setNewPrefixo(e.target.value)}
                  placeholder="Ex: 2424, 3005, 4199..."
                  className="font-mono font-bold rounded-xl"
                  maxLength={5}
                  required
                />
                <datalist id="inventory-suggestions">
                  {INVENTORY_CARS.map(car => (
                    <option key={car} value={car} />
                  ))}
                </datalist>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Consorciada: <b>{newPrefixo ? getConsorciadaByPrefix(newPrefixo) : "—"}</b>
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Observação / Defeito
              </label>
              <Input
                value={newObservacao}
                onChange={(e) => setNewObservacao(e.target.value)}
                placeholder="Ex: MOTOR, MECÂNICA, CÂMBIO, ELEVADOR..."
                className="mt-1 font-bold uppercase rounded-xl"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {SUGESTOES_OBS.slice(0, 8).map(sug => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setNewObservacao(sug)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-300"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <span className="text-xs font-bold text-gray-500 uppercase">
                Status Inicial
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewBloqueado(true);
                    setNewLiberado(false);
                  }}
                  className={cn(
                    "p-2 rounded-xl text-xs font-bold border transition-all text-center",
                    newBloqueado 
                      ? "bg-red-500 text-white border-red-600 shadow-xs" 
                      : "bg-gray-50 dark:bg-slate-800 text-gray-500"
                  )}
                >
                  Bloqueado
                </button>

                <button
                  type="button"
                  onClick={() => setNewEmExecucao(prev => !prev)}
                  className={cn(
                    "p-2 rounded-xl text-xs font-bold border transition-all text-center",
                    newEmExecucao 
                      ? "bg-orange-500 text-white border-orange-600 shadow-xs" 
                      : "bg-gray-50 dark:bg-slate-800 text-gray-500"
                  )}
                >
                  Em Execução
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewLiberado(true);
                    setNewBloqueado(false);
                  }}
                  className={cn(
                    "p-2 rounded-xl text-xs font-bold border transition-all text-center",
                    newLiberado 
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-xs" 
                      : "bg-gray-50 dark:bg-slate-800 text-gray-500"
                  )}
                >
                  Liberado
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setModalAddOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="rounded-full bg-[#164E3A] hover:bg-[#113C2D] text-white font-bold">
                Inserir na Folha
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==========================================================
          MODAL: EDITAR OBSERVAÇÃO DO VEÍCULO
          ========================================================== */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Editar Observação • Carro {editItem?.prefixo}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Observação / Motivo na Oficina
              </label>
              <Input
                value={editObs}
                onChange={(e) => setEditObs(e.target.value)}
                placeholder="Ex: MOTOR, MECÂNICA, RADIADOR..."
                className="mt-1 font-bold uppercase rounded-xl"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SUGESTOES_OBS.map(sug => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setEditObs(sug)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 hover:bg-[#164E3A] hover:text-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" className="rounded-full" onClick={() => setEditItem(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveObservacao} className="rounded-full bg-[#164E3A] hover:bg-[#113C2D] text-white font-bold">
                Salvar Observação
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
