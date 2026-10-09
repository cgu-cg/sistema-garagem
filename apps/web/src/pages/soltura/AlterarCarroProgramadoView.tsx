import { useState, useMemo, useEffect } from "react";
import {
  SolturaItem,
  BloqueioCarro,
  reservasGaragemVCG_Azul,
  reservasGaragemVCG_Vermelho,
  reservasGaragemVCG_Micro,
  rabichoPadraoPDF,
  terminaisReservaPDF,
  type RabichoItem,
  type TerminalReservaPDF
} from "@/data/solturaData";
import {
  Search,
  Plus,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getGaragemFisicaByCarro } from "./ciManager";

interface AlterarCarroProgramadoViewProps {
  garagem: "VCG" | "VCM";
  escalaTipo: "SEG_SEX" | "SABADO" | "DOM_FER";
  schedules: SolturaItem[];
  ciList: BloqueioCarro[];
  onUpdateField: (itemId: string, field: keyof SolturaItem, value: any) => Promise<boolean>;
  onUpdateMultipleFields?: (itemId: string, updates: Partial<SolturaItem>) => Promise<boolean>;
  checkBloqueioCI: (prefixo: string) => BloqueioCarro | null | undefined;
  onSelectGaragem?: (garagem: "VCG" | "VCM") => void;
  onSelectEscalaTipo?: (escala: "SEG_SEX" | "SABADO" | "DOM_FER") => void;
}

export function AlterarCarroProgramadoView({
  garagem,
  escalaTipo,
  schedules,
  ciList,
  onUpdateField,
  onUpdateMultipleFields,
  checkBloqueioCI,
  onSelectGaragem,
  onSelectEscalaTipo
}: AlterarCarroProgramadoViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isListaEstendida, setIsListaEstendida] = useState(false);

  // Carros bloqueados oficiais da C.I. (Filtrados estritamente pela garagem atual: VCG ou VCM)
  const penduradosCI = useMemo<BloqueioCarro[]>(() => {
    const targetGaragem = garagem || "VCG";
    const bloqueados = (ciList || []).filter(c => {
      if (c.status === "LIBERADO") return false;
      // Considera apenas bloqueados reais de frota (exclui preventivas/oficinas de rotina)
      const isBloqueadoReal = (
        c.categoriaPlanilha === "BLOQUEADO" ||
        (!c.categoriaPlanilha && !c.setorOficina && !c.tipoPreventiva && !c.horarioReforco)
      );
      if (!isBloqueadoReal) return false;

      // Filtra estritamente pela garagem física do carro / registro
      const carroGaragem = c.garagem || getGaragemFisicaByCarro(c.prefixo);
      return carroGaragem === targetGaragem;
    });

    // Deduplica por prefixo para garantir que cada veículo apareça apenas uma vez
    const map = new Map<string, BloqueioCarro>();
    bloqueados.forEach(c => {
      const clean = (c.prefixo || "").trim();
      if (clean && !map.has(clean)) {
        map.set(clean, c);
      }
    });

    // Ordena numericamente por prefixo
    return Array.from(map.values()).sort((a, b) => {
      const numA = parseInt(a.prefixo.replace(/\D/g, ""), 10);
      const numB = parseInt(b.prefixo.replace(/\D/g, ""), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.prefixo.localeCompare(b.prefixo);
    });
  }, [ciList, garagem]);

  // Estados dos blocos laterais persistidos em localStorage
  const [reservasAzul, setReservasAzul] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem("escala_reservas_azul_vcg");
      return s ? JSON.parse(s) : reservasGaragemVCG_Azul;
    } catch {
      return reservasGaragemVCG_Azul;
    }
  });

  const [reservasVermelho, setReservasVermelho] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem("escala_reservas_vermelho_vcg");
      return s ? JSON.parse(s) : reservasGaragemVCG_Vermelho;
    } catch {
      return reservasGaragemVCG_Vermelho;
    }
  });

  const [reservasMicro, setReservasMicro] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem("escala_reservas_micro_vcg");
      return s ? JSON.parse(s) : reservasGaragemVCG_Micro;
    } catch {
      return reservasGaragemVCG_Micro;
    }
  });

  const [bloqueadosPortaria, setBloqueadosPortaria] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem("escala_bloqueados_portaria_vcg");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [terminais, setTerminais] = useState<TerminalReservaPDF[]>(() => {
    try {
      const s = localStorage.getItem("escala_terminais_reserva_vcg");
      return s ? JSON.parse(s) : terminaisReservaPDF;
    } catch {
      return terminaisReservaPDF;
    }
  });

  const [rabichoList, setRabichoList] = useState<RabichoItem[]>(() => {
    try {
      const s = localStorage.getItem("escala_rabicho_vcg");
      return s ? JSON.parse(s) : rabichoPadraoPDF;
    } catch {
      return rabichoPadraoPDF;
    }
  });

  const [pedidosLimpeza, setPedidosLimpeza] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem("escala_pedidos_limpeza_vcg");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [pedidosBorracharia, setPedidosBorracharia] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem("escala_pedidos_borracharia_vcg");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [pedidosGaragem, setPedidosGaragem] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem("escala_pedidos_garagem_vcg");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  // Modal genérico para adição rápida
  const [modalType, setModalType] = useState<string | null>(null);
  const [modalInput, setModalInput] = useState("");
  const [modalInputSec, setModalInputSec] = useState("");

  // Persistência das listas
  useEffect(() => {
    localStorage.setItem("escala_reservas_azul_vcg", JSON.stringify(reservasAzul));
  }, [reservasAzul]);

  useEffect(() => {
    localStorage.setItem("escala_reservas_vermelho_vcg", JSON.stringify(reservasVermelho));
  }, [reservasVermelho]);

  useEffect(() => {
    localStorage.setItem("escala_reservas_micro_vcg", JSON.stringify(reservasMicro));
  }, [reservasMicro]);

  useEffect(() => {
    localStorage.setItem("escala_bloqueados_portaria_vcg", JSON.stringify(bloqueadosPortaria));
  }, [bloqueadosPortaria]);

  useEffect(() => {
    localStorage.setItem("escala_terminais_reserva_vcg", JSON.stringify(terminais));
  }, [terminais]);

  useEffect(() => {
    localStorage.setItem("escala_rabicho_vcg", JSON.stringify(rabichoList));
  }, [rabichoList]);

  useEffect(() => {
    localStorage.setItem("escala_pedidos_limpeza_vcg", JSON.stringify(pedidosLimpeza));
  }, [pedidosLimpeza]);

  useEffect(() => {
    localStorage.setItem("escala_pedidos_borracharia_vcg", JSON.stringify(pedidosBorracharia));
  }, [pedidosBorracharia]);

  useEffect(() => {
    localStorage.setItem("escala_pedidos_garagem_vcg", JSON.stringify(pedidosGaragem));
  }, [pedidosGaragem]);

  // Filtro de pesquisa rápida (por Linha, Tabela, Carro Programado ou Chegada)
  const filteredSchedules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return schedules;
    return schedules.filter(s =>
      s.linha.toLowerCase().includes(q) ||
      s.tabela.toLowerCase().includes(q) ||
      (s.carroProgramado && s.carroProgramado.toLowerCase().includes(q)) ||
      (s.chegadaGaragem && s.chegadaGaragem.toLowerCase().includes(q))
    );
  }, [schedules, searchQuery]);

  // Handler de adição rápida no painel lateral
  const handleAddItem = () => {
    const val = modalInput.trim();
    if (!val) {
      toast.error("Informe o prefixo do veículo.");
      return;
    }

    if (modalType === "AZUL") {
      if (!reservasAzul.includes(val)) setReservasAzul(prev => [...prev, val]);
    } else if (modalType === "VERMELHO") {
      if (!reservasVermelho.includes(val)) setReservasVermelho(prev => [...prev, val]);
    } else if (modalType === "MICRO") {
      if (!reservasMicro.includes(val)) setReservasMicro(prev => [...prev, val]);
    } else if (modalType === "PORTARIA") {
      if (!bloqueadosPortaria.includes(val)) setBloqueadosPortaria(prev => [...prev, val]);
    } else if (modalType === "LIMPEZA") {
      if (!pedidosLimpeza.includes(val)) setPedidosLimpeza(prev => [...prev, val]);
    } else if (modalType === "BORRACHARIA") {
      if (!pedidosBorracharia.includes(val)) setPedidosBorracharia(prev => [...prev, val]);
    } else if (modalType === "PEDIDOS_GARAGEM") {
      if (!pedidosGaragem.includes(val)) setPedidosGaragem(prev => [...prev, val]);
    } else if (modalType === "RABICHO") {
      const tab = modalInputSec.trim() || "1";
      setRabichoList(prev => [...prev, { id: `rab-${Date.now()}`, linha: val, tab, carro: "" }]);
    } else if (modalType?.startsWith("TERMINAL_")) {
      const termName = modalType.replace("TERMINAL_", "");
      setTerminais(prev => prev.map(t => t.terminal === termName ? { ...t, carro: val } : t));
    }

    toast.success("Item adicionado com sucesso!");
    setModalType(null);
    setModalInput("");
    setModalInputSec("");
  };

  return (
    <div className="space-y-4 pb-12 font-sans text-foreground">
      
      {/* Topo: Barra de Busca com design moderno compatível com Light e Dark */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar uma linha..."
            className="w-full h-10 pl-10 pr-8 text-xs sm:text-sm rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary/60 focus:ring-1 focus:ring-primary/60 transition-all shadow-2xs dark:border-slate-800 dark:bg-[#0B101B]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold"
              title="Limpar pesquisa"
            >
              ✕
            </button>
          )}
        </div>

        {/* Seletores de Garagem e Escala (Apenas para ajustes rápidos) */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          {onSelectGaragem && (
            <div className="flex items-center bg-muted/60 p-1 rounded-full border border-border text-xs dark:bg-[#0E1420] dark:border-slate-800">
              <button
                type="button"
                onClick={() => onSelectGaragem("VCG")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-all",
                  garagem === "VCG" ? "bg-[#164E3A] text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                VCG
              </button>
              <button
                type="button"
                onClick={() => onSelectGaragem("VCM")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-all",
                  garagem === "VCM" ? "bg-[#164E3A] text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                VCM
              </button>
            </div>
          )}

          {onSelectEscalaTipo && (
            <div className="flex items-center bg-muted/60 p-1 rounded-full border border-border text-xs dark:bg-[#0E1420] dark:border-slate-800">
              {(["SEG_SEX", "SABADO", "DOM_FER"] as const).map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => onSelectEscalaTipo(tipo)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold transition-all",
                    escalaTipo === tipo
                      ? "bg-background text-foreground font-bold shadow-2xs dark:bg-slate-800"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tipo === "SEG_SEX" ? "Seg-Sex" : tipo === "SABADO" ? "Sábado" : "Dom/Fer"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid Principal: Tabela à Esquerda (70%) + Painel Lateral à Direita (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 xl:gap-6 items-start">
        
        {/* ========================================================= */}
        {/* ÁREA ESQUERDA: CARD PRINCIPAL COM A TABELA DE ESCALA (70%) */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 rounded-3xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col dark:border-slate-800/90 dark:bg-[#0A0F1A]/95 lg:sticky lg:top-4 self-start">
          
          {/* Topo do card com contagem de horários alinhada à direita */}
          <div className="px-5 py-3 flex items-center justify-end border-b border-border bg-muted/30 dark:border-slate-800/60 dark:bg-[#0E1420]/40">
            <span className="text-[11px] font-mono text-muted-foreground font-semibold tracking-wide">
              {filteredSchedules.length} horários
            </span>
          </div>

          {/* Tabela de Escala de Horários com rolagem vertical suave calibrada para ~12 linhas ou estendida */}
          <div
            className={cn(
              "overflow-x-auto overflow-y-auto transition-all duration-300 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40",
              isListaEstendida ? "max-h-none" : "max-h-[515px]"
            )}
          >
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-xs shadow-2xs">
                <tr className="border-b border-border bg-muted/60 text-[11px] font-bold text-muted-foreground tracking-wider dark:border-slate-800/80 dark:bg-[#0E1420] dark:text-slate-300">
                  <th className="py-2.5 px-3 text-left w-24">Linha</th>
                  <th className="py-2.5 px-3 text-left w-16">Tabela</th>
                  <th className="py-2.5 px-3 text-left w-24">Hr Saida</th>
                  <th className="py-2.5 px-3 text-left w-24">Hr Chegada</th>
                  <th className="py-2.5 px-3 text-left w-28">Carro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono text-xs dark:divide-slate-800/40">
                {filteredSchedules.map((item, idx) => (
                  <EscalaTableRow
                    key={item.id}
                    item={item}
                    index={idx + 1}
                    schedules={schedules}
                    checkBloqueioCI={checkBloqueioCI}
                    onUpdateField={onUpdateField}
                    onUpdateMultipleFields={onUpdateMultipleFields}
                  />
                ))}
                {filteredSchedules.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground font-sans">
                      Nenhum horário encontrado para "{searchQuery}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Rodapé com botão para estender ou recolher toda a lista */}
          <div className="p-2.5 border-t border-border bg-muted/25 dark:border-slate-800/60 dark:bg-[#0E1420]/40 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsListaEstendida(!isListaEstendida)}
              className="w-full py-2 px-4 rounded-xl border border-border/80 bg-card hover:bg-muted/50 text-xs font-semibold text-foreground flex items-center justify-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer group dark:border-slate-800 dark:bg-[#0B101B] dark:hover:bg-slate-800/60"
            >
              {isListaEstendida ? (
                <>
                  <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span>Recolher lista (mostrar 12 linhas)</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-[#164E3A] dark:text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
                  <span>Estender toda a lista (mostrar todos os {filteredSchedules.length} horários)</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* ========================================================= */}
        {/* ÁREA DIREITA: PAINEL LATERAL OPERACIONAL VCG (30%) */}
        {/* ========================================================= */}
        <div className="lg:col-span-3 space-y-3.5 font-sans text-xs">
          
          {/* Card 1: GARAGEM VCG (Azul, Vermelho, Micro) */}
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-3.5 shadow-xs space-y-3 dark:border-slate-800/90 dark:bg-[#0A0F1A]/95">
            <div className="text-center font-bold text-xs uppercase tracking-wider text-foreground border-b border-border pb-1.5 dark:text-slate-200 dark:border-slate-800/60">
              GARAGEM {garagem || "VCG"}
            </div>

            {/* Subseção AZUL */}
            <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5 space-y-2 dark:border-slate-800/80 dark:bg-[#0E1420]/60">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] uppercase text-sky-600 dark:text-sky-400 tracking-wider">
                  AZUL ({reservasAzul.length})
                </span>
                <button
                  type="button"
                  onClick={() => setModalType("AZUL")}
                  className="w-5 h-5 rounded flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                  title="Adicionar carro na reserva Azul"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5 font-mono text-xs">
                {reservasAzul.length === 0 ? (
                  <span className="text-muted-foreground text-xs italic">Nenhum carro na reserva azul.</span>
                ) : (
                  reservasAzul.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-bold flex items-center gap-1.5 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20 shadow-2xs group"
                    >
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReservasAzul(prev => prev.filter((_, idx) => idx !== i));
                          toast.success(`Carro ${c} removido da reserva Azul!`);
                        }}
                        className="text-sky-500 hover:text-rose-600 dark:text-sky-400 dark:hover:text-rose-400 opacity-60 hover:opacity-100 transition-opacity cursor-pointer font-bold leading-none text-xs ml-0.5"
                        title={`Remover carro ${c} da reserva Azul`}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Subseção VERMELHO */}
            <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5 space-y-2 dark:border-slate-800/80 dark:bg-[#0E1420]/60">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] uppercase text-rose-600 dark:text-rose-400 tracking-wider">
                  VERMELHO ({reservasVermelho.length})
                </span>
                <button
                  type="button"
                  onClick={() => setModalType("VERMELHO")}
                  className="w-5 h-5 rounded flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                  title="Adicionar carro na reserva Vermelha"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5 font-mono text-xs">
                {reservasVermelho.length === 0 ? (
                  <span className="text-muted-foreground text-xs italic">Nenhum carro na reserva vermelha.</span>
                ) : (
                  reservasVermelho.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold flex items-center gap-1.5 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20 shadow-2xs group"
                    >
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReservasVermelho(prev => prev.filter((_, idx) => idx !== i));
                          toast.success(`Carro ${c} removido da reserva Vermelha!`);
                        }}
                        className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 opacity-60 hover:opacity-100 transition-opacity cursor-pointer font-bold leading-none text-xs ml-0.5"
                        title={`Remover carro ${c} da reserva Vermelha`}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Subseção MICRO */}
            <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5 space-y-2 dark:border-slate-800/80 dark:bg-[#0E1420]/60">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                  MICRO ({reservasMicro.length})
                </span>
                <button
                  type="button"
                  onClick={() => setModalType("MICRO")}
                  className="w-5 h-5 rounded flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                  title="Adicionar carro na reserva Micro"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5 font-mono text-xs">
                {reservasMicro.length === 0 ? (
                  <span className="text-muted-foreground text-xs italic">Nenhum carro na reserva micro.</span>
                ) : (
                  reservasMicro.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold flex items-center gap-1.5 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 shadow-2xs group"
                    >
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReservasMicro(prev => prev.filter((_, idx) => idx !== i));
                          toast.success(`Carro ${c} removido da reserva Micro!`);
                        }}
                        className="text-amber-600 hover:text-rose-600 dark:text-amber-400 dark:hover:text-rose-400 opacity-60 hover:opacity-100 transition-opacity cursor-pointer font-bold leading-none text-xs ml-0.5"
                        title={`Remover carro ${c} da reserva Micro`}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Card 2: CARROS BLOQUEADOS C.I. (Mesma informação dinâmica da Soltura e Manutenção) */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 text-card-foreground p-3.5 shadow-xs space-y-2.5 dark:border-rose-500/40 dark:bg-[#160A10]/90">
            <div className="flex items-center justify-between border-b border-rose-200/70 pb-1.5 dark:border-rose-900/40">
              <div className="flex items-center gap-1.5 text-rose-700 font-bold text-[11px] uppercase tracking-wider dark:text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 dark:text-rose-500" />
                <span>CARROS BLOQUEADOS C.I. • {garagem || "VCG"}</span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground font-semibold dark:text-slate-400">
                {penduradosCI.length} {penduradosCI.length === 1 ? "carro" : "carros"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs max-h-[340px] overflow-y-auto pr-1">
              {penduradosCI.map(ci => (
                <span
                  key={ci.id || ci.prefixo}
                  className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300/80 font-bold text-xs shadow-2xs hover:bg-rose-200 transition-all cursor-pointer select-none dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40 dark:hover:bg-rose-500/25"
                  title={`Carro ${ci.prefixo}${ci.motivo ? ` • Motivo: ${ci.motivo}` : ""}`}
                >
                  {ci.prefixo}
                </span>
              ))}
              {penduradosCI.length === 0 && (
                <span className="text-muted-foreground text-xs italic py-1">
                  Nenhum carro bloqueado na C.I. para a Garagem {garagem || "VCG"} no momento.
                </span>
              )}
            </div>
          </div>

          {/* Card 3: BLOQUEADOS PORTARIA */}
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-3.5 shadow-xs space-y-2.5 dark:border-slate-800/90 dark:bg-[#0A0F1A]/95">
            <div className="flex items-center justify-between border-b border-border pb-1.5 dark:border-slate-800/60">
              <span className="font-bold text-[11px] uppercase tracking-wider text-foreground dark:text-slate-300">
                BLOQUEADOS PORTARIA
              </span>
              <button
                type="button"
                onClick={() => setModalType("PORTARIA")}
                className="w-5 h-5 rounded flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                title="Adicionar bloqueado portaria"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs min-h-[22px]">
              {bloqueadosPortaria.length === 0 ? (
                <span className="text-muted-foreground text-xs italic">Nenhum veículo bloqueado.</span>
              ) : (
                bloqueadosPortaria.map((c, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-muted text-foreground border border-border font-bold flex items-center gap-1 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => setBloqueadosPortaria(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Card 4: TERMINAL GENERAL OSÓRIO */}
          {terminais.filter(t => t.terminal.includes("OSORIO")).map((t, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card text-card-foreground p-3.5 shadow-xs space-y-2 dark:border-slate-800/90 dark:bg-[#0A0F1A]/95">
              <div className="flex items-center justify-between border-b border-border pb-1 dark:border-slate-800/60">
                <span className="font-bold text-[11px] uppercase tracking-wider text-foreground dark:text-slate-300">
                  {t.terminal}
                </span>
                <button
                  type="button"
                  onClick={() => setModalType(`TERMINAL_${t.terminal}`)}
                  className="w-5 h-5 rounded flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                  title="Alterar carro"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground">Carro:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">{t.carro || "—"}</span>
                <span className="text-muted-foreground">Hora:</span>
                <span className="text-foreground dark:text-slate-300">{t.horario}</span>
              </div>
            </div>
          ))}

          {/* Card 5: TERMINAL NOVA BAHIA */}
          {terminais.filter(t => t.terminal.includes("NOVA BAHIA")).map((t, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card text-card-foreground p-3.5 shadow-xs space-y-2 dark:border-slate-800/90 dark:bg-[#0A0F1A]/95">
              <div className="flex items-center justify-between border-b border-border pb-1 dark:border-slate-800/60">
                <span className="font-bold text-[11px] uppercase tracking-wider text-foreground dark:text-slate-300">
                  {t.terminal}
                </span>
                <button
                  type="button"
                  onClick={() => setModalType(`TERMINAL_${t.terminal}`)}
                  className="w-5 h-5 rounded flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                  title="Alterar carro"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground">Carro:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">{t.carro || "—"}</span>
                <span className="text-muted-foreground">Hora:</span>
                <span className="text-foreground dark:text-slate-300">{t.horario}</span>
              </div>
            </div>
          ))}

          {/* Card 6: TERMINAL BANDEIRANTES */}
          {terminais.filter(t => t.terminal.includes("BANDEIRANTES")).map((t, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card text-card-foreground p-3.5 shadow-xs space-y-2 dark:border-slate-800/90 dark:bg-[#0A0F1A]/95">
              <div className="flex items-center justify-between border-b border-border pb-1 dark:border-slate-800/60">
                <span className="font-bold text-[11px] uppercase tracking-wider text-foreground dark:text-slate-300">
                  {t.terminal}
                </span>
                <button
                  type="button"
                  onClick={() => setModalType(`TERMINAL_${t.terminal}`)}
                  className="w-5 h-5 rounded flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                  title="Alterar carro"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground">Carro:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">{t.carro || "—"}</span>
                <span className="text-muted-foreground">Hora:</span>
                <span className="text-foreground dark:text-slate-300">{t.horario}</span>
              </div>
            </div>
          ))}

          {/* Card 7: RABICHO (Tabela LINHA | TAB | CARRO) */}
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-3.5 shadow-xs space-y-2.5 dark:border-slate-800/90 dark:bg-[#0A0F1A]/95">
            <div className="flex items-center justify-between border-b border-border pb-1 dark:border-slate-800/60">
              <span className="font-bold text-[11px] uppercase tracking-wider text-foreground dark:text-slate-300">
                RABICHO
              </span>
              <button
                type="button"
                onClick={() => setModalType("RABICHO")}
                className="w-5 h-5 rounded flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                title="Adicionar linha no Rabicho"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="text-muted-foreground border-b border-border dark:border-slate-800/40">
                  <th className="py-1 text-left">LINHA</th>
                  <th className="py-1 text-center">TAB</th>
                  <th className="py-1 text-right">CARRO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 dark:divide-slate-800/30">
                {rabichoList.map((r, i) => (
                  <tr key={r.id || i}>
                    <td className="py-1 font-bold text-foreground dark:text-slate-200">{r.linha}</td>
                    <td className="py-1 text-center text-muted-foreground">{r.tab}</td>
                    <td className="py-1 text-right font-bold text-sky-600 dark:text-sky-400">
                      <input
                        type="text"
                        value={r.carro}
                        placeholder="—"
                        onChange={(e) => {
                          const val = e.target.value;
                          setRabichoList(prev => prev.map((item, idx) => idx === i ? { ...item, carro: val } : item));
                        }}
                        className="w-14 h-5 text-center text-[10px] font-mono font-bold rounded bg-background border border-input text-foreground focus:outline-hidden dark:bg-slate-800/60 dark:border-slate-700/80"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card 8: PEDIDO LIMPEZA */}
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-3.5 shadow-xs space-y-2.5 dark:border-slate-800/90 dark:bg-[#0A0F1A]/95">
            <div className="flex items-center justify-between border-b border-border pb-1 dark:border-slate-800/60">
              <span className="font-bold text-[11px] uppercase tracking-wider text-foreground dark:text-slate-300">
                PEDIDO LIMPEZA ({pedidosLimpeza.length})
              </span>
              <button
                type="button"
                onClick={() => setModalType("LIMPEZA")}
                className="w-5 h-5 rounded flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                title="Adicionar pedido de limpeza"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              {pedidosLimpeza.length === 0 ? (
                <span className="text-muted-foreground text-xs italic">Nenhum pedido.</span>
              ) : (
                pedidosLimpeza.map((c, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center gap-1 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20 shadow-2xs"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => setPedidosLimpeza(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Card 9: PEDIDO BORRACHARIA */}
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-3.5 shadow-xs space-y-2.5 dark:border-slate-800/90 dark:bg-[#0A0F1A]/95">
            <div className="flex items-center justify-between border-b border-border pb-1 dark:border-slate-800/60">
              <span className="font-bold text-[11px] uppercase tracking-wider text-foreground dark:text-slate-300">
                PEDIDO BORRACHARIA ({pedidosBorracharia.length})
              </span>
              <button
                type="button"
                onClick={() => setModalType("BORRACHARIA")}
                className="w-5 h-5 rounded flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                title="Adicionar pedido de borracharia"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              {pedidosBorracharia.length === 0 ? (
                <span className="text-muted-foreground text-xs italic">Nenhum pedido.</span>
              ) : (
                pedidosBorracharia.map((c, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold flex items-center gap-1 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 shadow-2xs"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => setPedidosBorracharia(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Card 10: PEDIDOS GARAGEM */}
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-3.5 shadow-xs space-y-2.5 dark:border-slate-800/90 dark:bg-[#0A0F1A]/95">
            <div className="flex items-center justify-between border-b border-border pb-1 dark:border-slate-800/60">
              <span className="font-bold text-[11px] uppercase tracking-wider text-foreground dark:text-slate-300">
                PEDIDOS GARAGEM ({pedidosGaragem.length})
              </span>
              <button
                type="button"
                onClick={() => setModalType("PEDIDOS_GARAGEM")}
                className="w-5 h-5 rounded flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                title="Adicionar pedido garagem"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              {pedidosGaragem.length === 0 ? (
                <span className="text-muted-foreground text-xs italic">Nenhum pedido.</span>
              ) : (
                pedidosGaragem.map((c, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 shadow-2xs"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => setPedidosGaragem(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Card 11: TOTAL DE CARROS SOLTURA LINHAS */}
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-3.5 shadow-xs space-y-2.5 dark:border-slate-800/90 dark:bg-[#0A0F1A]/95">
            <div className="text-center font-bold text-[11px] uppercase tracking-wider text-foreground border-b border-border pb-1 dark:text-slate-300 dark:border-slate-800/60">
              <div>TOTAL DE CARROS</div>
              <div className="text-[10px] text-muted-foreground">SOLTURA LINHAS</div>
            </div>
            <table className="w-full text-[9px] font-mono">
              <thead>
                <tr className="text-muted-foreground border-b border-border dark:border-slate-800/40">
                  <th className="py-0.5 text-left"></th>
                  <th className="py-0.5 text-center">LINHAS</th>
                  <th className="py-0.5 text-center">REFORÇO</th>
                  <th className="py-0.5 text-center">TERMINAL</th>
                  <th className="py-0.5 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground dark:divide-slate-800/30 dark:text-slate-300">
                <tr>
                  <td className="py-0.5 font-bold">VSF</td>
                  <td className="py-0.5 text-center">—</td>
                  <td className="py-0.5 text-center">—</td>
                  <td className="py-0.5 text-center">—</td>
                  <td className="py-0.5 text-right font-bold">—</td>
                </tr>
                <tr>
                  <td className="py-0.5 font-bold">JTU</td>
                  <td className="py-0.5 text-center">—</td>
                  <td className="py-0.5 text-center">—</td>
                  <td className="py-0.5 text-center">—</td>
                  <td className="py-0.5 text-right font-bold">—</td>
                </tr>
                <tr>
                  <td className="py-0.5 font-bold text-sky-600 dark:text-sky-400">VCG</td>
                  <td className="py-0.5 text-center font-bold">{filteredSchedules.length}</td>
                  <td className="py-0.5 text-center">—</td>
                  <td className="py-0.5 text-center">{terminais.filter(t => t.carro).length}</td>
                  <td className="py-0.5 text-right font-bold text-sky-600 dark:text-sky-300">
                    {filteredSchedules.length + terminais.filter(t => t.carro).length}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="border-t border-border pt-1.5 space-y-1 text-[9px] font-mono text-foreground dark:border-slate-800/60 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="font-bold">SOLTURA</span>
                <span className="font-bold text-sky-600 dark:text-sky-300">{filteredSchedules.length}</span>
              </div>
              <div className="flex justify-between">
                <span>RESERVA GARAGEM</span>
                <span className="font-bold">{reservasAzul.length + reservasVermelho.length + reservasMicro.length}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Modal / Popup de Adição Rápida */}
      {modalType && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-2xl space-y-3 dark:border-slate-700 dark:bg-[#0E1420]">
            <div className="flex items-center justify-between border-b border-border pb-2 dark:border-slate-800">
              <span className="font-bold text-xs uppercase tracking-wider text-foreground dark:text-slate-200">
                Adicionar em {modalType}
              </span>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder={modalType === "RABICHO" ? "Linha (ex: 470)" : "Prefixo do Carro"}
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddItem();
                }}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-mono font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-[#0A0F1A]"
                autoFocus
              />

              {modalType === "RABICHO" && (
                <input
                  type="text"
                  placeholder="Tabela (ex: 1)"
                  value={modalInputSec}
                  onChange={(e) => setModalInputSec(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddItem();
                  }}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-mono font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-[#0A0F1A]"
                />
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="flex-1 h-8 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex-1 h-8 rounded-lg bg-[#164E3A] hover:bg-[#113C2D] text-white text-xs font-bold"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ---------------------------------------------------------
// LINHA DA TABELA DE ESCALA (Linha, Tabela, Hr Saida, Hr Chegada, Carro, Subst)
// ---------------------------------------------------------
interface EscalaTableRowProps {
  item: SolturaItem;
  index: number;
  schedules: SolturaItem[];
  checkBloqueioCI: (prefixo: string) => BloqueioCarro | null | undefined;
  onUpdateField: (itemId: string, field: keyof SolturaItem, value: any) => Promise<boolean>;
  onUpdateMultipleFields?: (itemId: string, updates: Partial<SolturaItem>) => Promise<boolean>;
}

function EscalaTableRow({
  item,
  index,
  schedules,
  checkBloqueioCI,
  onUpdateField,
  onUpdateMultipleFields
}: EscalaTableRowProps) {
  const [carroProg, setCarroProg] = useState(item.carroProgramado || "");
  const [hrChegada, setHrChegada] = useState(item.chegadaGaragem || item.inicioBairro || item.inicioLinha || "");

  // Atualiza estado local quando o item mudar externamente
  useEffect(() => {
    setCarroProg(item.carroProgramado || "");
    setHrChegada(item.chegadaGaragem || item.inicioBairro || item.inicioLinha || "");
  }, [item.carroProgramado, item.chegadaGaragem, item.inicioBairro, item.inicioLinha]);

  const bloqueioProg = checkBloqueioCI(carroProg);

  // Validação de duplicidade de carro programado em outra linha
  const duplicado = useMemo(() => {
    const clean = carroProg.trim();
    if (!clean) return null;
    return schedules.find(s => s.id !== item.id && s.carroProgramado?.trim() === clean);
  }, [carroProg, schedules, item.id]);

  // Salvar Carro Programado (sincroniza com a soltura imediatamente)
  const handleSaveCarro = async () => {
    const clean = carroProg.trim();
    if (clean === (item.carroProgramado || "").trim()) return;

    if (duplicado) {
      toast.error(`O carro ${clean} já está programado na Linha ${duplicado.linha} (Tab ${duplicado.tabela})!`);
      return;
    }

    if (onUpdateMultipleFields) {
      if (!await onUpdateMultipleFields(item.id, { carroProgramado: clean })) return;
    } else {
      if (!await onUpdateField(item.id, "carroProgramado", clean)) return;
    }

    if (bloqueioProg) {
      toast.warning(`Carro ${clean} programado, porém consta no CI: ${bloqueioProg.motivo}`);
    } else {
      toast.success(`Linha ${item.linha} (Tab ${item.tabela}) programada com carro ${clean || "—"}!`);
    }
  };

  // Salvar / Alterar Horário de Chegada (sincroniza com a soltura imediatamente)
  const handleSaveChegada = async () => {
    let clean = hrChegada.trim();

    // Auto-formatação prática caso digite 4 dígitos contínuos (ex: 0820 -> 08:20)
    if (/^\d{4}$/.test(clean)) {
      clean = `${clean.slice(0, 2)}:${clean.slice(2)}`;
      setHrChegada(clean);
    }

    const atual = (item.chegadaGaragem || item.inicioBairro || item.inicioLinha || "").trim();
    if (clean === atual) return;

    const updates: Partial<SolturaItem> = {
      chegadaGaragem: clean,
      inicioLinha: clean,
      inicioBairro: clean
    };

    if (onUpdateMultipleFields) {
      if (!await onUpdateMultipleFields(item.id, updates)) return;
    } else {
      if (!await onUpdateField(item.id, "chegadaGaragem", clean)) return;
    }

    if (clean) {
      toast.success(`Horário de chegada da Linha ${item.linha} (Tab ${item.tabela}) definido para ${clean}!`);
    } else {
      toast.info(`Horário de chegada da Linha ${item.linha} removido.`);
    }
  };

  return (
    <tr className={cn(
      "transition-colors hover:bg-muted/40 dark:hover:bg-slate-800/30",
      index % 2 === 0 ? "bg-muted/20 dark:bg-slate-900/20" : "bg-transparent"
    )}>
      {/* 1. Linha */}
      <td className="py-2 px-3 font-bold text-foreground text-xs">
        {item.linha}
      </td>

      {/* 2. Tabela */}
      <td className="py-2 px-3 text-muted-foreground text-xs font-medium">
        {item.tabela}
      </td>

      {/* 3. Hr Saida */}
      <td className="py-2 px-3 font-bold text-foreground text-xs">
        {item.saidaGaragem}
      </td>

      {/* 4. Hr Chegada (Adicionar e Alterar editável) */}
      <td className="py-1.5 px-3">
        <input
          type="text"
          value={hrChegada}
          placeholder="—"
          onChange={(e) => setHrChegada(e.target.value)}
          onBlur={handleSaveChegada}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveChegada();
          }}
          className={cn(
            "w-20 h-7 text-center rounded-lg border text-xs font-mono font-bold focus:outline-hidden transition-all",
            hrChegada
              ? "border-input bg-background text-foreground focus:border-primary/60 dark:border-slate-700/80 dark:bg-[#0E1420] dark:text-slate-200"
              : "border-border/60 bg-muted/20 text-muted-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 dark:border-slate-800/60 dark:bg-[#0E1420]/50 dark:text-slate-500"
          )}
          title="Digite o horário de chegada (ex: 08:30) e pressione Enter ou clique fora"
        />
      </td>

      {/* 5. Carro (Carro Programado) */}
      <td className="py-1.5 px-3">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={carroProg}
            placeholder="—"
            onChange={(e) => setCarroProg(e.target.value)}
            onBlur={handleSaveCarro}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveCarro();
            }}
            className={cn(
              "w-20 h-7 text-center rounded-lg border text-xs font-mono font-bold focus:outline-hidden transition-all",
              duplicado
                ? "border-rose-500 text-rose-600 bg-rose-50 ring-1 ring-rose-500 dark:border-rose-500 dark:text-rose-300 dark:bg-rose-500/20"
                : bloqueioProg
                  ? "border-rose-500 text-rose-600 bg-rose-50/70 dark:border-rose-500 dark:text-rose-300 dark:bg-rose-500/10"
                  : "border-input bg-background text-foreground focus:border-primary/60 dark:border-slate-700/80 dark:bg-[#0E1420] dark:text-slate-100"
            )}
            title={
              duplicado
                ? `Atenção: Carro já programado na Linha ${duplicado.linha} / Tab ${duplicado.tabela}`
                : bloqueioProg
                  ? `Carro no CI: ${bloqueioProg.motivo}`
                  : "Altere o Carro Programado e pressione Enter ou clique fora"
            }
          />
          {duplicado && (
            <span title={`Carro Duplicado! Já na Linha ${duplicado.linha} / Tab ${duplicado.tabela}`} className="text-rose-600 dark:text-rose-500 cursor-help">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          )}
          {!duplicado && bloqueioProg && (
            <span title={`Carro no CI: ${bloqueioProg.motivo}`} className="text-rose-600 dark:text-rose-500 cursor-help">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
