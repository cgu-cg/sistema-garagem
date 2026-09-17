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
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AlterarCarroProgramadoViewProps {
  garagem: "VCG" | "VCM";
  escalaTipo: "SEG_SEX" | "SABADO" | "DOM_FER";
  schedules: SolturaItem[];
  ciList: BloqueioCarro[];
  onUpdateField: (itemId: string, field: keyof SolturaItem, value: any) => void;
  onUpdateMultipleFields?: (itemId: string, updates: Partial<SolturaItem>) => void;
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

  // Carros bloqueados / pendurados na CI vindos da mesma fonte dinâmica da Soltura e Manutenção
  const penduradosCI = useMemo<BloqueioCarro[]>(() => {
    return (ciList || []).filter(c =>
      (!c.status || c.status === "BLOQUEADO" || c.status === "EM_MANUTENCAO" || c.status === "AGUARDANDO_PECA") &&
      (!c.garagem || c.garagem === garagem || c.garagem === "TODAS")
    );
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
      
      {/* Topo: Barra de Busca com design do segundo print */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar uma linha..."
            className="w-full h-10 pl-10 pr-8 text-xs sm:text-sm rounded-2xl border border-slate-800 bg-[#0B101B] text-foreground placeholder:text-slate-400 focus:outline-hidden focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-bold"
              title="Limpar pesquisa"
            >
              ✕
            </button>
          )}
        </div>

        {/* Seletores de Garagem e Escala (Apenas para ajustes rápidos) */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          {onSelectGaragem && (
            <div className="flex items-center bg-[#0E1420] p-1 rounded-full border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => onSelectGaragem("VCG")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-all",
                  garagem === "VCG" ? "bg-[#164E3A] text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                VCG
              </button>
              <button
                type="button"
                onClick={() => onSelectGaragem("VCM")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-all",
                  garagem === "VCM" ? "bg-[#164E3A] text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                VCM
              </button>
            </div>
          )}

          {onSelectEscalaTipo && (
            <div className="flex items-center bg-[#0E1420] p-1 rounded-full border border-slate-800 text-xs">
              {(["SEG_SEX", "SABADO", "DOM_FER"] as const).map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => onSelectEscalaTipo(tipo)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold transition-all",
                    escalaTipo === tipo ? "bg-slate-800 text-foreground font-bold shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tipo === "SEG_SEX" ? "Seg-Sex" : tipo === "SABADO" ? "Sábado" : "Dom/Fer"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid Principal: Tabela à Esquerda + Painel Lateral à Direita (Fiel ao print) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px] xl:grid-cols-[1fr_320px] gap-4 items-start">
        
        {/* ========================================================= */}
        {/* ÁREA ESQUERDA: CARD PRINCIPAL COM A TABELA DE ESCALA */}
        {/* ========================================================= */}
        <div className="rounded-3xl border border-slate-800/90 bg-[#0A0F1A]/95 shadow-xl overflow-hidden flex flex-col min-h-[680px]">
          
          {/* Topo do card com contagem de horários alinhada à direita */}
          <div className="px-5 py-3 flex items-center justify-end border-b border-slate-800/60 bg-[#0E1420]/40">
            <span className="text-[11px] font-mono text-slate-400 font-semibold tracking-wide">
              {filteredSchedules.length} horários
            </span>
          </div>

          {/* Tabela de Escala de Horários */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[11px] font-bold text-slate-300 tracking-wider">
                  <th className="py-2.5 px-3 text-left w-24">Linha</th>
                  <th className="py-2.5 px-3 text-left w-16">Tabela</th>
                  <th className="py-2.5 px-3 text-left w-24">Hr Saida</th>
                  <th className="py-2.5 px-3 text-left w-24">Hr Chegada</th>
                  <th className="py-2.5 px-3 text-left w-28">Carro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono text-xs">
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
                    <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                      Nenhum horário encontrado para "{searchQuery}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* ========================================================= */}
        {/* ÁREA DIREITA: PAINEL LATERAL OPERACIONAL VCG (PRINT & PDF) */}
        {/* ========================================================= */}
        <div className="space-y-3 font-sans text-xs">
          
          {/* Card 1: GARAGEM VCG (Azul, Vermelho, Micro) */}
          <div className="rounded-2xl border border-slate-800/90 bg-[#0A0F1A]/95 p-3 shadow-lg space-y-2.5">
            <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-200 border-b border-slate-800/60 pb-1.5">
              GARAGEM VCG
            </div>

            {/* Subseção AZUL */}
            <div className="rounded-xl border border-slate-800/80 bg-[#0E1420]/60 p-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10px] uppercase text-sky-400 tracking-wider">
                  AZUL ({reservasAzul.length})
                </span>
                <button
                  type="button"
                  onClick={() => setModalType("AZUL")}
                  className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                  title="Adicionar carro na reserva Azul"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1 pt-1 font-mono text-[10px]">
                {reservasAzul.map((c, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Subseção VERMELHO */}
            <div className="rounded-xl border border-slate-800/80 bg-[#0E1420]/60 p-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10px] uppercase text-rose-400 tracking-wider">
                  VERMELHO ({reservasVermelho.length})
                </span>
                <button
                  type="button"
                  onClick={() => setModalType("VERMELHO")}
                  className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                  title="Adicionar carro na reserva Vermelha"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1 pt-1 font-mono text-[10px]">
                {reservasVermelho.map((c, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Subseção MICRO */}
            <div className="rounded-xl border border-slate-800/80 bg-[#0E1420]/60 p-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10px] uppercase text-amber-400 tracking-wider">
                  MICRO ({reservasMicro.length})
                </span>
                <button
                  type="button"
                  onClick={() => setModalType("MICRO")}
                  className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                  title="Adicionar carro na reserva Micro"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1 pt-1 font-mono text-[10px]">
                {reservasMicro.map((c, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Card 2: CARROS BLOQUEADOS C.I. (Mesma informação dinâmica da Soltura e Manutenção) */}
          <div className="rounded-2xl border border-rose-500/40 bg-[#160A10]/90 p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-rose-900/40 pb-1.5">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[10px] uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>CARROS BLOQUEADOS C.I.</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-semibold">
                {penduradosCI.length} {penduradosCI.length === 1 ? "carro" : "carros"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono text-[10px] max-h-[340px] overflow-y-auto pr-1">
              {penduradosCI.map(ci => (
                <span
                  key={ci.id || ci.prefixo}
                  className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/40 font-bold text-xs shadow-2xs hover:bg-rose-500/25 transition-all cursor-pointer select-none"
                  title={`Carro ${ci.prefixo}${ci.motivo ? ` • Motivo: ${ci.motivo}` : ""}`}
                >
                  {ci.prefixo}
                </span>
              ))}
              {penduradosCI.length === 0 && (
                <span className="text-slate-500 text-[10px] italic py-1">
                  Nenhum carro bloqueado ou na CI no momento.
                </span>
              )}
            </div>
          </div>

          {/* Card 3: BLOQUEADOS PORTARIA */}
          <div className="rounded-2xl border border-slate-800/90 bg-[#0A0F1A]/95 p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-300">
                BLOQUEADOS PORTARIA
              </span>
              <button
                type="button"
                onClick={() => setModalType("PORTARIA")}
                className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                title="Adicionar bloqueado portaria"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1 font-mono text-[10px] min-h-[22px]">
              {bloqueadosPortaria.length === 0 ? (
                <span className="text-slate-500 text-[10px] italic">Nenhum veículo bloqueado.</span>
              ) : (
                bloqueadosPortaria.map((c, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-bold flex items-center gap-1"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => setBloqueadosPortaria(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-400"
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
            <div key={i} className="rounded-2xl border border-slate-800/90 bg-[#0A0F1A]/95 p-3 shadow-lg space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1">
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-300">
                  {t.terminal}
                </span>
                <button
                  type="button"
                  onClick={() => setModalType(`TERMINAL_${t.terminal}`)}
                  className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                  title="Alterar carro"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-slate-400">Carro:</span>
                <span className="font-bold text-sky-400">{t.carro || "—"}</span>
                <span className="text-slate-400">Hora:</span>
                <span className="text-slate-300">{t.horario}</span>
              </div>
            </div>
          ))}

          {/* Card 5: TERMINAL NOVA BAHIA */}
          {terminais.filter(t => t.terminal.includes("NOVA BAHIA")).map((t, i) => (
            <div key={i} className="rounded-2xl border border-slate-800/90 bg-[#0A0F1A]/95 p-3 shadow-lg space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1">
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-300">
                  {t.terminal}
                </span>
                <button
                  type="button"
                  onClick={() => setModalType(`TERMINAL_${t.terminal}`)}
                  className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                  title="Alterar carro"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-slate-400">Carro:</span>
                <span className="font-bold text-sky-400">{t.carro || "—"}</span>
                <span className="text-slate-400">Hora:</span>
                <span className="text-slate-300">{t.horario}</span>
              </div>
            </div>
          ))}

          {/* Card 6: TERMINAL BANDEIRANTES */}
          {terminais.filter(t => t.terminal.includes("BANDEIRANTES")).map((t, i) => (
            <div key={i} className="rounded-2xl border border-slate-800/90 bg-[#0A0F1A]/95 p-3 shadow-lg space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1">
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-300">
                  {t.terminal}
                </span>
                <button
                  type="button"
                  onClick={() => setModalType(`TERMINAL_${t.terminal}`)}
                  className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                  title="Alterar carro"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-slate-400">Carro:</span>
                <span className="font-bold text-sky-400">{t.carro || "—"}</span>
                <span className="text-slate-400">Hora:</span>
                <span className="text-slate-300">{t.horario}</span>
              </div>
            </div>
          ))}

          {/* Card 7: RABICHO (Tabela LINHA | TAB | CARRO) */}
          <div className="rounded-2xl border border-slate-800/90 bg-[#0A0F1A]/95 p-3 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-1">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-300">
                RABICHO
              </span>
              <button
                type="button"
                onClick={() => setModalType("RABICHO")}
                className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                title="Adicionar linha no Rabicho"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/40">
                  <th className="py-1 text-left">LINHA</th>
                  <th className="py-1 text-center">TAB</th>
                  <th className="py-1 text-right">CARRO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {rabichoList.map((r, i) => (
                  <tr key={r.id || i}>
                    <td className="py-1 font-bold text-slate-200">{r.linha}</td>
                    <td className="py-1 text-center text-slate-400">{r.tab}</td>
                    <td className="py-1 text-right font-bold text-sky-400">
                      <input
                        type="text"
                        value={r.carro}
                        placeholder="—"
                        onChange={(e) => {
                          const val = e.target.value;
                          setRabichoList(prev => prev.map((item, idx) => idx === i ? { ...item, carro: val } : item));
                        }}
                        className="w-14 h-5 text-center text-[10px] font-mono font-bold rounded bg-slate-800/60 border border-slate-700/80 focus:outline-hidden"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card 8: PEDIDO LIMPEZA */}
          <div className="rounded-2xl border border-slate-800/90 bg-[#0A0F1A]/95 p-3 shadow-lg space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-1">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-300">
                PEDIDO LIMPEZA ({pedidosLimpeza.length})
              </span>
              <button
                type="button"
                onClick={() => setModalType("LIMPEZA")}
                className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                title="Adicionar pedido de limpeza"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1 font-mono text-[10px]">
              {pedidosLimpeza.length === 0 ? (
                <span className="text-slate-500 text-[10px] italic">Nenhum pedido.</span>
              ) : (
                pedidosLimpeza.map((c, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold flex items-center gap-1"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => setPedidosLimpeza(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Card 9: PEDIDO BORRACHARIA */}
          <div className="rounded-2xl border border-slate-800/90 bg-[#0A0F1A]/95 p-3 shadow-lg space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-1">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-300">
                PEDIDO BORRACHARIA ({pedidosBorracharia.length})
              </span>
              <button
                type="button"
                onClick={() => setModalType("BORRACHARIA")}
                className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                title="Adicionar pedido de borracharia"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1 font-mono text-[10px]">
              {pedidosBorracharia.length === 0 ? (
                <span className="text-slate-500 text-[10px] italic">Nenhum pedido.</span>
              ) : (
                pedidosBorracharia.map((c, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold flex items-center gap-1"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => setPedidosBorracharia(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Card 10: PEDIDOS GARAGEM */}
          <div className="rounded-2xl border border-slate-800/90 bg-[#0A0F1A]/95 p-3 shadow-lg space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-1">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-300">
                PEDIDOS GARAGEM ({pedidosGaragem.length})
              </span>
              <button
                type="button"
                onClick={() => setModalType("PEDIDOS_GARAGEM")}
                className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                title="Adicionar pedido garagem"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1 font-mono text-[10px]">
              {pedidosGaragem.length === 0 ? (
                <span className="text-slate-500 text-[10px] italic">Nenhum pedido.</span>
              ) : (
                pedidosGaragem.map((c, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold flex items-center gap-1"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => setPedidosGaragem(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Card 11: TOTAL DE CARROS SOLTURA LINHAS */}
          <div className="rounded-2xl border border-slate-800/90 bg-[#0A0F1A]/95 p-3 shadow-lg space-y-2">
            <div className="text-center font-bold text-[10px] uppercase tracking-wider text-slate-300 border-b border-slate-800/60 pb-1">
              <div>TOTAL DE CARROS</div>
              <div className="text-[9px] text-slate-400">SOLTURA LINHAS</div>
            </div>
            <table className="w-full text-[9px] font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/40">
                  <th className="py-0.5 text-left"></th>
                  <th className="py-0.5 text-center">LINHAS</th>
                  <th className="py-0.5 text-center">REFORÇO</th>
                  <th className="py-0.5 text-center">TERMINAL</th>
                  <th className="py-0.5 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30 text-slate-300">
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
                  <td className="py-0.5 font-bold text-sky-400">VCG</td>
                  <td className="py-0.5 text-center font-bold">{filteredSchedules.length}</td>
                  <td className="py-0.5 text-center">—</td>
                  <td className="py-0.5 text-center">{terminais.filter(t => t.carro).length}</td>
                  <td className="py-0.5 text-right font-bold text-sky-300">
                    {filteredSchedules.length + terminais.filter(t => t.carro).length}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="border-t border-slate-800/60 pt-1.5 space-y-1 text-[9px] font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="font-bold">SOLTURA</span>
                <span className="font-bold text-sky-300">{filteredSchedules.length}</span>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs rounded-2xl border border-slate-700 bg-[#0E1420] p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                Adicionar em {modalType}
              </span>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
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
                className="w-full h-9 px-3 rounded-lg border border-slate-700 bg-[#0A0F1A] text-xs font-mono font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-sky-500"
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
                  className="w-full h-9 px-3 rounded-lg border border-slate-700 bg-[#0A0F1A] text-xs font-mono font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="flex-1 h-8 rounded-lg border border-slate-700 text-xs font-semibold text-slate-400 hover:bg-slate-800"
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
  onUpdateField: (itemId: string, field: keyof SolturaItem, value: any) => void;
  onUpdateMultipleFields?: (itemId: string, updates: Partial<SolturaItem>) => void;
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
  const handleSaveCarro = () => {
    const clean = carroProg.trim();
    if (clean === (item.carroProgramado || "").trim()) return;

    if (duplicado) {
      toast.error(`O carro ${clean} já está programado na Linha ${duplicado.linha} (Tab ${duplicado.tabela})!`);
      return;
    }

    if (onUpdateMultipleFields) {
      onUpdateMultipleFields(item.id, { carroProgramado: clean });
    } else {
      onUpdateField(item.id, "carroProgramado", clean);
    }

    if (bloqueioProg) {
      toast.warning(`Carro ${clean} programado, porém consta no CI: ${bloqueioProg.motivo}`);
    } else {
      toast.success(`Linha ${item.linha} (Tab ${item.tabela}) programada com carro ${clean || "—"}!`);
    }
  };

  // Salvar / Alterar Horário de Chegada (sincroniza com a soltura imediatamente)
  const handleSaveChegada = () => {
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
      onUpdateMultipleFields(item.id, updates);
    } else {
      onUpdateField(item.id, "chegadaGaragem", clean);
    }

    if (clean) {
      toast.success(`Horário de chegada da Linha ${item.linha} (Tab ${item.tabela}) definido para ${clean}!`);
    } else {
      toast.info(`Horário de chegada da Linha ${item.linha} removido.`);
    }
  };

  return (
    <tr className={cn(
      "transition-colors hover:bg-slate-800/30",
      index % 2 === 0 ? "bg-slate-900/20" : "bg-transparent"
    )}>
      {/* 1. Linha */}
      <td className="py-2 px-3 font-bold text-slate-100 text-xs">
        {item.linha}
      </td>

      {/* 2. Tabela */}
      <td className="py-2 px-3 text-slate-400 text-xs font-medium">
        {item.tabela}
      </td>

      {/* 3. Hr Saida */}
      <td className="py-2 px-3 font-bold text-slate-200 text-xs">
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
              ? "border-slate-700/80 bg-[#0E1420] text-slate-200 focus:border-slate-500"
              : "border-slate-800/60 bg-[#0E1420]/50 text-slate-500 placeholder:text-slate-600 focus:border-slate-500"
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
                ? "border-rose-500 text-rose-300 bg-rose-500/20 ring-1 ring-rose-500"
                : bloqueioProg
                  ? "border-rose-500 text-rose-300 bg-rose-500/10"
                  : "border-slate-700/80 bg-[#0E1420] text-slate-100 focus:border-slate-500"
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
            <span title={`Carro Duplicado! Já na Linha ${duplicado.linha} / Tab ${duplicado.tabela}`} className="text-rose-500 cursor-help">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          )}
          {!duplicado && bloqueioProg && (
            <span title={`Carro no CI: ${bloqueioProg.motivo}`} className="text-rose-500 cursor-help">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
