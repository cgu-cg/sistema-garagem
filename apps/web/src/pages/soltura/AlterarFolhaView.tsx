import { useState, useMemo, useEffect } from "react";
import { SolturaItem } from "@/data/solturaData";
import { normalizeLinhaETabela } from "./folhaStorage";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AlterarFolhaViewProps {
  garagem: "VCG" | "VCM";
  escalaTipo: "SEG_SEX" | "SABADO" | "DOM_FER";
  turnoTipo?: "MATUTINO" | "VESPERTINO";
  schedules: SolturaItem[];
  onUpdateField: (itemId: string, field: keyof SolturaItem, value: any) => void;
  onUpdateMultipleFields?: (itemId: string, updates: Partial<SolturaItem>) => void;
  onAddSchedule?: (newItem: SolturaItem) => void;
  onDeleteSchedule?: (itemId: string) => void;
  onSelectGaragem?: (garagem: "VCG" | "VCM") => void;
  onSelectEscalaTipo?: (escala: "SEG_SEX" | "SABADO" | "DOM_FER") => void;
  onSelectTurnoTipo?: (turno: "MATUTINO" | "VESPERTINO") => void;
}

export function AlterarFolhaView({
  garagem,
  escalaTipo,
  turnoTipo = "MATUTINO",
  schedules,
  onUpdateField,
  onUpdateMultipleFields,
  onAddSchedule,
  onDeleteSchedule,
  onSelectGaragem,
  onSelectEscalaTipo,
  onSelectTurnoTipo
}: AlterarFolhaViewProps) {
  const [showAddRow, setShowAddRow] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newLine, setNewLine] = useState("");
  const [newTab, setNewTab] = useState("");
  const [newCarroProg, setNewCarroProg] = useState("");
  const [newSaida, setNewSaida] = useState("");
  const [newInicio, setNewInicio] = useState("");
  const [newTipo, setNewTipo] = useState<"REGULAR" | "VCM" | "FRETAMENTO" | "EXTRA">("REGULAR");

  // Seletor de Página da Folha Oficial
  // VCG Seg-Sex Matutino possui Página 1 oficial (Ordens 01 a 104) e Página 2 (Ordens 105 em diante)
  const isVCGMatutino = garagem === "VCG" && escalaTipo === "SEG_SEX" && turnoTipo === "MATUTINO";
  const [activePage, setActivePage] = useState<"PAGINA_1" | "PAGINA_2" | "TODAS">("PAGINA_1");

  // Itens da Página Selecionada
  const displayedSchedules = useMemo(() => {
    let list = schedules;
    if (isVCGMatutino) {
      if (activePage === "PAGINA_1") {
        list = schedules.filter(s => (s.ordem || 0) <= 104);
      } else if (activePage === "PAGINA_2") {
        list = schedules.filter(s => (s.ordem || 0) > 104);
      }
    }
    return list;
  }, [schedules, isVCGMatutino, activePage]);

  // Filtro de pesquisa rápida (por linha, tabela ou carro programado)
  const filteredSchedules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return displayedSchedules;
    return displayedSchedules.filter(s =>
      s.linha.toLowerCase().includes(q) ||
      s.tabela.toLowerCase().includes(q) ||
      (s.carroProgramado && s.carroProgramado.toLowerCase().includes(q))
    );
  }, [displayedSchedules, searchQuery]);

  // Divisão simétrica em 2 colunas idêntica à Folha de Soltura
  const { colunaEsquerda, colunaDireita } = useMemo(() => {
    // Se estiver na Página 1 oficial da VCG e sem busca por texto:
    // Exatamente Ordens 1 a 52 na Coluna 1 e Ordens 53 a 104 na Coluna 2
    if (isVCGMatutino && activePage === "PAGINA_1" && !searchQuery.trim()) {
      const col1 = displayedSchedules.filter(s => (s.ordem || 0) <= 52);
      const col2 = displayedSchedules.filter(s => (s.ordem || 0) > 52 && (s.ordem || 0) <= 104);
      return {
        colunaEsquerda: col1,
        colunaDireita: col2
      };
    }

    const metade = Math.ceil(filteredSchedules.length / 2);
    return {
      colunaEsquerda: filteredSchedules.slice(0, metade),
      colunaDireita: filteredSchedules.slice(metade)
    };
  }, [displayedSchedules, filteredSchedules, isVCGMatutino, activePage, searchQuery]);

  const handleCreateNewTrip = () => {
    if (!newLine.trim()) {
      toast.error("Informe a Linha.");
      return;
    }
    if (!newTab.trim()) {
      toast.error("Informe a Tabela.");
      return;
    }
    if (!newSaida.trim()) {
      toast.error("Informe a Saída da Garagem.");
      return;
    }

    const newItem: SolturaItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ordem: schedules.length + 1,
      linha: normalizeLinhaETabela(newLine),
      tabela: normalizeLinhaETabela(newTab),
      carroProgramado: newCarroProg.trim() || "",
      saidaGaragem: newSaida.trim(),
      inicioLinha: newInicio.trim() || undefined,
      inicioBairro: newInicio.trim() || undefined,
      tipo: newTipo,
      status: "PENDENTE"
    };

    if (onAddSchedule) {
      onAddSchedule(newItem);
    }

    setNewLine("");
    setNewTab("");
    setNewCarroProg("");
    setNewSaida("");
    setNewInicio("");
    setShowAddRow(false);
  };

  return (
    <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">

      {/* Cabeçalho Oficial da Folha de Soltura */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div>
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
            CONSÓRCIO GUAICURUS • GARAGEM {garagem === "VCG" ? "VIAÇÃO CAMPO GRANDE (VCG)" : "VIAÇÃO CIDADE MORENA (VCM)"}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Horário de Saída de Veículos • {escalaTipo === "SEG_SEX" ? `Segunda a Sexta (${turnoTipo === "MATUTINO" ? "Matutino" : "Vespertino"})` : escalaTipo === "SABADO" ? "Sábado" : "Dom / Feriado"}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Edição direta de Linha, Tabela, Carro Programado e Horários da grade da folha física. As alterações atualizam a tela de Soltura (/soltura) em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSelectGaragem && (
            <div className="flex items-center bg-muted/60 p-1 rounded-full border border-border/80 text-xs">
              <button
                type="button"
                onClick={() => onSelectGaragem("VCG")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  garagem === "VCG" ? "bg-[#164E3A] text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                VCG
              </button>
              <button
                type="button"
                onClick={() => onSelectGaragem("VCM")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  garagem === "VCM" ? "bg-[#164E3A] text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                VCM
              </button>
            </div>
          )}

          {onSelectEscalaTipo && (
            <div className="flex items-center bg-muted/60 p-1 rounded-full border border-border/80 text-xs">
              {(["SEG_SEX", "SABADO", "DOM_FER"] as const).map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => onSelectEscalaTipo(tipo)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                    escalaTipo === tipo ? "bg-card text-foreground font-bold shadow-2xs border" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tipo === "SEG_SEX" ? "Seg-Sex" : tipo === "SABADO" ? "Sábado" : "Dom/Fer"}
                </button>
              ))}
            </div>
          )}

          {/* Seletor de Turno Matutino x Vespertino */}
          {garagem === "VCG" && escalaTipo === "SEG_SEX" && onSelectTurnoTipo && (
            <div className="flex items-center bg-muted/60 p-1 rounded-full border border-border/80 text-xs">
              <button
                type="button"
                onClick={() => onSelectTurnoTipo("MATUTINO")}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                  turnoTipo === "MATUTINO" ? "bg-[#164E3A] text-white dark:bg-emerald-600 shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
                title="Matutino (Manhã - até 06:02)"
              >
                <span>☀️ Matutino</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTurnoTipo("VESPERTINO")}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                  turnoTipo === "VESPERTINO" ? "bg-[#164E3A] text-white dark:bg-emerald-600 shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
                title="Vespertino (Tarde - 10:30 até 17:40)"
              >
                <span>🌙 Vespertino</span>
              </button>
            </div>
          )}

          <Button
            type="button"
            size="sm"
            onClick={() => setShowAddRow(!showAddRow)}
            className="h-8 px-3 text-xs font-bold rounded-full bg-[#164E3A] hover:bg-[#113C2D] text-white shadow-2xs gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{showAddRow ? "Fechar Inserção" : "Nova Viagem"}</span>
          </Button>
        </div>
      </div>

      {/* Linha rápida de inserção de nova viagem (se aberto) */}
      {showAddRow && (
        <div className="p-3.5 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 space-y-2 animate-in fade-in duration-200">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Inserir Nova Viagem na Grade da Folha
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Linha *</label>
              <input
                type="text"
                placeholder="Ex: 302/051"
                value={newLine}
                onChange={(e) => setNewLine(e.target.value)}
                className="w-full h-8 px-2 text-xs font-bold rounded border bg-background"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Tab *</label>
              <input
                type="text"
                placeholder="1/1"
                value={newTab}
                onChange={(e) => setNewTab(e.target.value)}
                className="w-full h-8 px-2 text-xs font-mono text-center font-bold rounded border bg-background"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Carro Prog.</label>
              <input
                type="text"
                placeholder="Ex: 3950"
                value={newCarroProg}
                onChange={(e) => setNewCarroProg(e.target.value)}
                className="w-full h-8 px-2 text-xs font-mono text-center font-bold rounded border bg-background"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Saída Gar. *</label>
              <input
                type="time"
                value={newSaida}
                onChange={(e) => setNewSaida(e.target.value)}
                className="w-full h-8 px-1 text-xs font-mono text-center font-bold rounded border bg-background"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Bairro</label>
              <input
                type="time"
                value={newInicio}
                onChange={(e) => setNewInicio(e.target.value)}
                className="w-full h-8 px-1 text-xs font-mono text-center rounded border bg-background"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Tipo</label>
              <select
                value={newTipo}
                onChange={(e) => setNewTipo(e.target.value as any)}
                className="w-full h-8 px-1.5 text-xs font-semibold rounded border bg-background"
              >
                <option value="REGULAR">Regular</option>
                <option value="VCM">VCM</option>
                <option value="FRETAMENTO">Frete</option>
                <option value="EXTRA">Extra</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                size="sm"
                onClick={handleCreateNewTrip}
                className="w-full h-8 text-xs font-bold rounded-lg bg-[#164E3A] hover:bg-[#113C2D] text-white cursor-pointer"
              >
                Salvar Viagem
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Seleção de Página da Folha Oficial e Pesquisa Rápida */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Abas de Página (para a escala oficial de 104 veículos na Página 1) */}
        {isVCGMatutino && (
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/80">
            <button
              type="button"
              onClick={() => setActivePage("PAGINA_1")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activePage === "PAGINA_1"
                  ? "bg-card text-foreground shadow-xs border border-border/50 text-[#164E3A] dark:text-emerald-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Página 01 (Ordens 01 a 104 • Oficial)</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePage("PAGINA_2")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activePage === "PAGINA_2"
                  ? "bg-card text-foreground shadow-xs border border-border/50 text-[#164E3A] dark:text-emerald-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Página 02 (Ordens 105 a 199 • Complementar)</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePage("TODAS")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activePage === "TODAS"
                  ? "bg-card text-foreground shadow-xs border border-border/50 text-[#164E3A] dark:text-emerald-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>Todas as Viagens ({schedules.length})</span>
            </button>
          </div>
        )}

        {/* Barra de Filtro Rápido */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filtrar por Linha, Tab ou Carro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border bg-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
            />
          </div>
          {searchQuery && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Exibindo <strong>{filteredSchedules.length}</strong> de {displayedSchedules.length}
            </span>
          )}
        </div>
      </div>

      {/* Grade de 2 Colunas Lado a Lado (Fiel à Folha Oficial Impressa) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Coluna 1 */}
        <div className="border rounded-xl overflow-hidden shadow-2xs bg-card flex flex-col">
          <div className="bg-muted/60 px-3.5 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b">
            <span className="text-foreground">
              COLUNA 01 ({colunaEsquerda.length > 0 ? `ORDENS ${colunaEsquerda[0]?.ordem || 1} A ${colunaEsquerda[colunaEsquerda.length - 1]?.ordem || colunaEsquerda.length}` : "VAZIA"})
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{colunaEsquerda.length} CARROS</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold">
                  <th className="py-2 px-1.5 w-8 text-center">Nº</th>
                  <th className="py-2 px-1.5 font-bold text-foreground w-20">Linha</th>
                  <th className="py-2 px-1 text-center w-12">Tab</th>
                  <th className="py-2 px-1.5 text-center font-bold text-foreground w-16">Prog.</th>
                  <th className="py-2 px-1 text-center font-bold text-foreground w-18">Saída Gar.</th>
                  <th className="py-2 px-1 text-center text-foreground w-18">Bairro</th>
                  <th className="py-2 px-1 text-center w-12">Tipo</th>
                  <th className="py-2 px-1.5 text-center w-16">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {colunaEsquerda.map((item, idx) => (
                  <AlterarFolhaTableRow
                    key={item.id}
                    item={item}
                    index={item.ordem || idx + 1}
                    onUpdateField={onUpdateField}
                    onUpdateMultipleFields={onUpdateMultipleFields}
                    onDeleteSchedule={onDeleteSchedule}
                  />
                ))}
                {colunaEsquerda.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground font-sans">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-2 border-t bg-muted/20 text-right text-[11px] font-mono font-bold text-muted-foreground">
            {colunaEsquerda.length} CARROS
          </div>
        </div>

        {/* Coluna 2 */}
        <div className="border rounded-xl overflow-hidden shadow-2xs bg-card flex flex-col">
          <div className="bg-muted/60 px-3.5 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b">
            <span className="text-foreground">
              COLUNA 02 ({colunaDireita.length > 0 ? `ORDENS ${colunaDireita[0]?.ordem || colunaEsquerda.length + 1} A ${colunaDireita[colunaDireita.length - 1]?.ordem || schedules.length}` : "VAZIA"})
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{colunaDireita.length} CARROS</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold">
                  <th className="py-2 px-1.5 w-8 text-center">Nº</th>
                  <th className="py-2 px-1.5 font-bold text-foreground w-20">Linha</th>
                  <th className="py-2 px-1 text-center w-12">Tab</th>
                  <th className="py-2 px-1.5 text-center font-bold text-foreground w-16">Prog.</th>
                  <th className="py-2 px-1 text-center font-bold text-foreground w-18">Saída Gar.</th>
                  <th className="py-2 px-1 text-center text-foreground w-18">Bairro</th>
                  <th className="py-2 px-1 text-center w-12">Tipo</th>
                  <th className="py-2 px-1.5 text-center w-16">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {colunaDireita.map((item, idx) => (
                  <AlterarFolhaTableRow
                    key={item.id}
                    item={item}
                    index={item.ordem || colunaEsquerda.length + idx + 1}
                    onUpdateField={onUpdateField}
                    onUpdateMultipleFields={onUpdateMultipleFields}
                    onDeleteSchedule={onDeleteSchedule}
                  />
                ))}
                {colunaDireita.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground font-sans">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-2 border-t bg-muted/20 text-right text-[11px] font-mono font-bold text-muted-foreground">
            {colunaDireita.length} CARROS
          </div>
        </div>

      </div>

    </div>
  );
}

interface AlterarFolhaTableRowProps {
  item: SolturaItem;
  index: number;
  onUpdateField: (itemId: string, field: keyof SolturaItem, value: any) => void;
  onUpdateMultipleFields?: (itemId: string, updates: Partial<SolturaItem>) => void;
  onDeleteSchedule?: (itemId: string) => void;
}

function AlterarFolhaTableRow({ item, index, onUpdateField, onUpdateMultipleFields, onDeleteSchedule }: AlterarFolhaTableRowProps) {
  const [linha, setLinha] = useState(item.linha);
  const [tab, setTab] = useState(item.tabela);
  const [carroProg, setCarroProg] = useState(item.carroProgramado || "");
  const [saida, setSaida] = useState(item.saidaGaragem);
  const [bairro, setBairro] = useState(item.inicioBairro || item.chegadaGaragem || item.inicioLinha || "");

  // Sincronizar inputs locais caso as propriedades do item mudem externamente
  useEffect(() => {
    setLinha(item.linha);
    setTab(item.tabela);
    setCarroProg(item.carroProgramado || "");
    setSaida(item.saidaGaragem);
    setBairro(item.inicioBairro || item.chegadaGaragem || item.inicioLinha || "");
  }, [item.linha, item.tabela, item.carroProgramado, item.saidaGaragem, item.inicioBairro, item.chegadaGaragem, item.inicioLinha]);

  const handleAlterar = () => {
    if (!linha.trim()) {
      toast.error("A Linha não pode ficar vazia.");
      return;
    }
    if (!tab.trim()) {
      toast.error("A Tabela não pode ficar vazia.");
      return;
    }
    if (!saida) {
      toast.error("O Horário de Saída não pode ficar vazio.");
      return;
    }

    const updates: Partial<SolturaItem> = {
      linha: normalizeLinhaETabela(linha),
      tabela: normalizeLinhaETabela(tab),
      carroProgramado: carroProg.trim(),
      saidaGaragem: saida,
      inicioBairro: bairro.trim() || undefined,
      chegadaGaragem: bairro.trim() || undefined,
      inicioLinha: bairro.trim() || undefined
    };

    if (onUpdateMultipleFields) {
      onUpdateMultipleFields(item.id, updates);
    } else {
      onUpdateField(item.id, "linha", updates.linha);
      onUpdateField(item.id, "tabela", updates.tabela);
      onUpdateField(item.id, "carroProgramado", updates.carroProgramado);
      onUpdateField(item.id, "saidaGaragem", updates.saidaGaragem);
      onUpdateField(item.id, "inicioBairro", updates.inicioBairro);
      onUpdateField(item.id, "chegadaGaragem", updates.chegadaGaragem);
      onUpdateField(item.id, "inicioLinha", updates.inicioLinha);
    }
  };

  const isVCM = item.tipo === "VCM";
  const isFrete = item.tipo === "FRETAMENTO";

  return (
    <tr className={cn(
      "transition-colors",
      isVCM
        ? "bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 border-b border-blue-500/30 text-foreground"
        : isFrete
          ? "bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border-b border-amber-500/30 text-foreground"
          : index % 2 === 0 ? "bg-muted/15 hover:bg-muted/30" : "bg-card hover:bg-muted/30"
    )}>
      {/* Nº / Ordem Oficial */}
      <td className="py-1.5 px-1.5 text-center text-muted-foreground text-xs font-bold">
        {String(index).padStart(2, "0")}
      </td>

      {/* Linha (Editável) */}
      <td className="py-1 px-1">
        <input
          type="text"
          value={linha}
          onChange={(e) => setLinha(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAlterar();
          }}
          className="w-full h-7 px-1.5 rounded-md border border-border/80 bg-background text-xs font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
          title="Linha (Ex: 302/051)"
        />
      </td>

      {/* Tabela (Editável) */}
      <td className="py-1 px-0.5 text-center">
        <input
          type="text"
          value={tab}
          onChange={(e) => setTab(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAlterar();
          }}
          className="w-full h-7 px-1 text-center rounded-md border border-border/80 bg-background text-xs font-mono font-bold text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
          title="Tabela (Ex: 1/1)"
        />
      </td>

      {/* Carro Programado (Editável) */}
      <td className="py-1 px-1 text-center">
        <input
          type="text"
          value={carroProg}
          onChange={(e) => setCarroProg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAlterar();
          }}
          placeholder="—"
          className="w-full h-7 px-1 text-center rounded-md border border-border/80 bg-background text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
          title="Carro Programado (Ex: 3950)"
        />
      </td>

      {/* Saída Garagem (Editável) */}
      <td className="py-1 px-0.5 text-center">
        <input
          type="time"
          value={saida}
          onChange={(e) => setSaida(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAlterar();
          }}
          className="w-full h-7 px-0.5 text-center rounded-md border border-border/80 bg-background text-xs font-mono font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
          title="Saída da Garagem"
        />
      </td>

      {/* Bairro / Início Linha (Editável) */}
      <td className="py-1 px-0.5 text-center">
        <input
          type="time"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAlterar();
          }}
          className="w-full h-7 px-0.5 text-center rounded-md border border-border/80 bg-background text-xs font-mono text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
          title="Horário no Bairro / Chegada"
        />
      </td>

      {/* Tipo */}
      <td className="py-1.5 px-0.5 text-center">
        {item.tipo === "VCM" && (
          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 uppercase">VCM</span>
        )}
        {item.tipo === "FRETAMENTO" && (
          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase">Frete</span>
        )}
        {item.tipo === "EXTRA" && (
          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 uppercase">Extra</span>
        )}
        {(!item.tipo || item.tipo === "REGULAR") && (
          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-muted text-muted-foreground uppercase">Reg</span>
        )}
      </td>

      {/* Botões da Linha */}
      <td className="py-1 px-1 text-center">
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            size="sm"
            onClick={handleAlterar}
            className="h-7 px-2 text-[11px] font-bold rounded-lg transition-all bg-[#164E3A] hover:bg-[#113C2D] text-white shadow-2xs cursor-pointer"
            title="Salvar alterações desta viagem"
          >
            Alterar
          </Button>
          {onDeleteSchedule && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Deseja remover a linha ${item.linha} (Tab ${item.tabela}) da grade?`)) {
                  onDeleteSchedule(item.id);
                }
              }}
              className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Remover esta viagem da grade"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
