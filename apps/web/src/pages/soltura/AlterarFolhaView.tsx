import { useState } from "react";
import { SolturaItem } from "@/data/solturaData";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AlterarFolhaViewProps {
  garagem: "VCG" | "VCM";
  escalaTipo: "SEG_SEX" | "SABADO" | "DOM_FER";
  schedules: SolturaItem[];
  onUpdateField: (itemId: string, field: keyof SolturaItem, value: any) => void;
  onAddSchedule?: (newItem: SolturaItem) => void;
  onSelectGaragem?: (garagem: "VCG" | "VCM") => void;
  onSelectEscalaTipo?: (escala: "SEG_SEX" | "SABADO" | "DOM_FER") => void;
}

export function AlterarFolhaView({
  garagem,
  escalaTipo,
  schedules,
  onUpdateField,
  onAddSchedule,
  onSelectGaragem,
  onSelectEscalaTipo
}: AlterarFolhaViewProps) {
  const [showAddRow, setShowAddRow] = useState(false);
  const [newLine, setNewLine] = useState("");
  const [newTab, setNewTab] = useState("");
  const [newSaida, setNewSaida] = useState("");
  const [newInicio, setNewInicio] = useState("");
  const [newTipo, setNewTipo] = useState<"REGULAR" | "VCM" | "FRETAMENTO" | "EXTRA">("REGULAR");

  // Divisão simétrica em 2 colunas idêntica à Folha de Soltura
  const metade = Math.ceil(schedules.length / 2);
  const colunaEsquerda = schedules.slice(0, metade);
  const colunaDireita = schedules.slice(metade);

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
      linha: newLine.trim(),
      tabela: newTab.trim(),
      carroProgramado: "0000",
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
    setNewSaida("");
    setNewInicio("");
    setShowAddRow(false);
  };

  return (
    <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">

      {/* Cabeçalho da Folha de Soltura */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
        <div>
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
            CONSÓRCIO GUAICURUS • GARAGEM {garagem === "VCG" ? "VIAÇÃO CAMPO GRANDE" : "VIAÇÃO CIDADE MORENA"}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Alterar Folha de Soltura • {escalaTipo === "SEG_SEX" ? "Segunda a Sexta" : escalaTipo === "SABADO" ? "Sábado" : "Dom / Feriado"}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              Edição de Linha, Tab e Horários
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Edite diretamente as linhas, tabelas, horários de saída da garagem e início de linha da folha operacional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSelectGaragem && (
            <div className="flex items-center bg-muted/60 p-1 rounded-full border border-border/80 text-xs">
              <button
                type="button"
                onClick={() => onSelectGaragem("VCG")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
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
                  "px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
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
                    "px-2.5 py-1 rounded-full text-xs font-semibold transition-all",
                    escalaTipo === tipo ? "bg-card text-foreground font-bold shadow-2xs border" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tipo === "SEG_SEX" ? "Seg-Sex" : tipo === "SABADO" ? "Sábado" : "Dom/Fer"}
                </button>
              ))}
            </div>
          )}

          <Button
            type="button"
            size="sm"
            onClick={() => setShowAddRow(!showAddRow)}
            className="h-8 px-3 text-xs font-bold rounded-full bg-[#164E3A] hover:bg-[#113C2D] text-white shadow-2xs gap-1.5"
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
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
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
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Saída Gar. *</label>
              <input
                type="time"
                value={newSaida}
                onChange={(e) => setNewSaida(e.target.value)}
                className="w-full h-8 px-1 text-xs font-mono text-center font-bold rounded border bg-background"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Início Linha</label>
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
                className="w-full h-8 text-xs font-bold rounded-lg bg-[#164E3A] hover:bg-[#113C2D] text-white"
              >
                Salvar Viagem
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Grade de 2 Colunas Lado a Lado (como na Folha de Soltura) */}
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
                  <th className="py-2 px-2 w-10 text-center">Nº</th>
                  <th className="py-2 px-2 font-bold text-foreground w-24">Linha</th>
                  <th className="py-2 px-1 text-center w-14">Tab</th>
                  <th className="py-2 px-1.5 text-center font-bold text-foreground w-20">Saída Gar.</th>
                  <th className="py-2 px-1.5 text-center text-foreground w-20">Início Linha</th>
                  <th className="py-2 px-1 text-center w-14">Tipo</th>
                  <th className="py-2 px-2 text-center w-20">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {colunaEsquerda.map((item, idx) => (
                  <AlterarFolhaTableRow
                    key={item.id}
                    item={item}
                    index={item.ordem || idx + 1}
                    onUpdateField={onUpdateField}
                  />
                ))}
                {colunaEsquerda.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground font-sans">
                      Nenhum registro encontrado.
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
              COLUNA 02 (ORDENS {String(colunaEsquerda.length + 1).padStart(2, "0")} A {String(schedules.length).padStart(2, "0")})
            </span>
            <span className="font-semibold">{colunaDireita.length} HORÁRIOS</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold">
                  <th className="py-2 px-2 w-10 text-center">Nº</th>
                  <th className="py-2 px-2 font-bold text-foreground w-24">Linha</th>
                  <th className="py-2 px-1 text-center w-14">Tab</th>
                  <th className="py-2 px-1.5 text-center font-bold text-foreground w-20">Saída Gar.</th>
                  <th className="py-2 px-1.5 text-center text-foreground w-20">Início Linha</th>
                  <th className="py-2 px-1 text-center w-14">Tipo</th>
                  <th className="py-2 px-2 text-center w-20">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {colunaDireita.map((item, idx) => (
                  <AlterarFolhaTableRow
                    key={item.id}
                    item={item}
                    index={item.ordem || colunaEsquerda.length + idx + 1}
                    onUpdateField={onUpdateField}
                  />
                ))}
                {colunaDireita.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground font-sans">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
}

function AlterarFolhaTableRow({ item, index, onUpdateField }: AlterarFolhaTableRowProps) {
  const [linha, setLinha] = useState(item.linha);
  const [tab, setTab] = useState(item.tabela);
  const [saida, setSaida] = useState(item.saidaGaragem);
  const [inicio, setInicio] = useState(item.inicioLinha || item.inicioBairro || "");

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

    onUpdateField(item.id, "linha", linha.trim());
    onUpdateField(item.id, "tabela", tab.trim());
    onUpdateField(item.id, "saidaGaragem", saida);
    onUpdateField(item.id, "inicioLinha", inicio);
    onUpdateField(item.id, "inicioBairro", inicio);

    toast.success(`Linha ${linha.trim()} (Tab ${tab.trim()}) alterada com sucesso!`);
  };

  return (
    <tr className={cn(
      "transition-colors hover:bg-muted/40",
      index % 2 === 0 ? "bg-muted/15" : "bg-card"
    )}>
      {/* Nº / Ordem */}
      <td className="py-1.5 px-2 text-center text-muted-foreground text-xs font-bold">
        {String(index).padStart(2, "0")}
      </td>

      {/* Linha (Editável) */}
      <td className="py-1 px-1.5">
        <input
          type="text"
          value={linha}
          onChange={(e) => setLinha(e.target.value)}
          className="w-full h-7 px-1.5 rounded-md border border-border/80 bg-background text-xs font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
          title="Digite a nova Linha e clique em Alterar ao lado"
        />
      </td>

      {/* Tabela (Editável) */}
      <td className="py-1 px-1 text-center">
        <input
          type="text"
          value={tab}
          onChange={(e) => setTab(e.target.value)}
          className="w-full h-7 px-1 text-center rounded-md border border-border/80 bg-background text-xs font-mono font-bold text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
          title="Digite a nova Tabela e clique em Alterar ao lado"
        />
      </td>

      {/* Saída Garagem (Editável) */}
      <td className="py-1 px-1 text-center">
        <input
          type="time"
          value={saida}
          onChange={(e) => setSaida(e.target.value)}
          className="w-full h-7 px-1 text-center rounded-md border border-border/80 bg-background text-xs font-mono font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
          title="Defina o novo horário de saída da garagem e clique em Alterar"
        />
      </td>

      {/* Início Linha (Editável) */}
      <td className="py-1 px-1 text-center">
        <input
          type="time"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
          className="w-full h-7 px-1 text-center rounded-md border border-border/80 bg-background text-xs font-mono text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-[#164E3A]"
          title="Defina o novo horário de início de linha e clique em Alterar"
        />
      </td>

      {/* Tipo */}
      <td className="py-1.5 px-1 text-center">
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

      {/* Botão Alterar da Linha */}
      <td className="py-1 px-1.5 text-center">
        <Button
          type="button"
          size="sm"
          onClick={handleAlterar}
          className="h-7 px-2.5 text-[11px] font-bold rounded-lg transition-all bg-[#164E3A] hover:bg-[#113C2D] text-white shadow-2xs"
          title="Clique para salvar as alterações desta linha"
        >
          Alterar
        </Button>
      </td>
    </tr>
  );
}
