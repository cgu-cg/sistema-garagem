import { useState } from "react";
import { SolturaItem, BloqueioCarro } from "@/data/solturaData";
import { AlertTriangle, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AlterarCarroProgramadoViewProps {
  garagem: "VCG" | "VCM";
  escalaTipo: "SEG_SEX" | "SABADO" | "DOM_FER";
  schedules: SolturaItem[];
  ciList: BloqueioCarro[];
  onUpdateField: (itemId: string, field: keyof SolturaItem, value: any) => void;
  checkBloqueioCI: (prefixo: string) => BloqueioCarro | null | undefined;
  onSelectGaragem?: (garagem: "VCG" | "VCM") => void;
  onSelectEscalaTipo?: (escala: "SEG_SEX" | "SABADO" | "DOM_FER") => void;
}

export function AlterarCarroProgramadoView({
  garagem,
  escalaTipo,
  schedules,
  onUpdateField,
  checkBloqueioCI,
  onSelectGaragem,
  onSelectEscalaTipo
}: AlterarCarroProgramadoViewProps) {
  // Divisão simétrica em 2 colunas idêntica à Folha de Soltura
  const metade = Math.ceil(schedules.length / 2);
  const colunaEsquerda = schedules.slice(0, metade);
  const colunaDireita = schedules.slice(metade);

  return (
    <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      
      {/* Cabeçalho Oficial no padrão Folha de Soltura */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
        <div>
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
            CONSÓRCIO GUAICURUS • GARAGEM {garagem === "VCG" ? "VIAÇÃO CAMPO GRANDE" : "VIAÇÃO CIDADE MORENA"}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Alterar Carro Programado • {escalaTipo === "SEG_SEX" ? "Segunda a Sexta" : escalaTipo === "SABADO" ? "Sábado" : "Dom / Feriado"}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
              Escala de Frota
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Defina e altere o prefixo do Carro Programado para cada linha e tabela da escala operacional.
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

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted/40 border">
            <Bus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-foreground">{schedules.length} Viagens</span>
          </div>
        </div>
      </div>

      {/* Grade de 2 Colunas Lado a Lado (idêntico à Folha de Soltura, sem Carro Realizado e sem MOTO) */}
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
                  <th className="py-2 px-2 text-center bg-blue-500/5 text-blue-700 dark:text-blue-300 font-bold w-24">Carro Prog.</th>
                  <th className="py-2 px-1.5 text-center font-bold text-foreground w-20">Saída Gar.</th>
                  <th className="py-2 px-1.5 text-center text-muted-foreground w-20">Início Linha</th>
                  <th className="py-2 px-2 text-center w-24">Status CI</th>
                  <th className="py-2 px-2 text-center w-20">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {colunaEsquerda.map((item, idx) => (
                  <AlterarCarroProgramadoTableRow
                    key={item.id}
                    item={item}
                    index={item.ordem || idx + 1}
                    schedules={schedules}
                    checkBloqueioCI={checkBloqueioCI}
                    onUpdateField={onUpdateField}
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
                  <th className="py-2 px-2 text-center bg-blue-500/5 text-blue-700 dark:text-blue-300 font-bold w-24">Carro Prog.</th>
                  <th className="py-2 px-1.5 text-center font-bold text-foreground w-20">Saída Gar.</th>
                  <th className="py-2 px-1.5 text-center text-muted-foreground w-20">Início Linha</th>
                  <th className="py-2 px-2 text-center w-24">Status CI</th>
                  <th className="py-2 px-2 text-center w-20">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {colunaDireita.map((item, idx) => (
                  <AlterarCarroProgramadoTableRow
                    key={item.id}
                    item={item}
                    index={item.ordem || colunaEsquerda.length + idx + 1}
                    schedules={schedules}
                    checkBloqueioCI={checkBloqueioCI}
                    onUpdateField={onUpdateField}
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
        </div>

      </div>

    </div>
  );
}

interface AlterarCarroProgramadoTableRowProps {
  item: SolturaItem;
  index: number;
  schedules: SolturaItem[];
  checkBloqueioCI: (prefixo: string) => BloqueioCarro | null | undefined;
  onUpdateField: (itemId: string, field: keyof SolturaItem, value: any) => void;
}

function AlterarCarroProgramadoTableRow({
  item,
  index,
  schedules,
  checkBloqueioCI,
  onUpdateField
}: AlterarCarroProgramadoTableRowProps) {
  const [carroProg, setCarroProg] = useState(item.carroProgramado || "");
  const bloqueio = checkBloqueioCI(carroProg);

  // Validação em tempo real de duplicidade de carro programado
  const duplicado = schedules.find(s => s.id !== item.id && s.carroProgramado?.trim() === carroProg.trim() && carroProg.trim() !== "");

  const handleAlterar = () => {
    const finalVal = carroProg.trim();
    if (!finalVal) {
      toast.error("Informe o prefixo do Carro Programado.");
      return;
    }

    // Regra: Bloquear duplicidade de carro programado
    if (duplicado) {
      toast.error(`O carro ${finalVal} já está programado na Linha ${duplicado.linha} (Tab ${duplicado.tabela})! Não é permitido o mesmo carro programado.`);
      return;
    }

    onUpdateField(item.id, "carroProgramado", finalVal);
    if (bloqueio) {
      toast.warning(`Carro ${finalVal} alterado, porém consta no CI: ${bloqueio.motivo}`);
    } else {
      toast.success(`Carro programado da Linha ${item.linha} alterado para ${finalVal}!`);
    }
  };

  return (
    <tr className={cn(
      "transition-colors hover:bg-muted/40",
      index % 2 === 0 ? "bg-muted/15" : "bg-card"
    )}>
      {/* Nº / Ordem */}
      <td className="py-2 px-2 text-center text-muted-foreground text-xs font-bold">
        {String(index).padStart(2, "0")}
      </td>

      {/* Linha (Somente leitura) */}
      <td className="py-2 px-2 font-bold text-foreground text-xs">
        {item.linha}
      </td>

      {/* Tabela (Somente leitura) */}
      <td className="py-2 px-1 text-center text-muted-foreground text-xs font-bold">
        {item.tabela}
      </td>

      {/* Carro Programado (Editável com validação de duplicidade e CI) */}
      <td className="py-1 px-1.5 bg-blue-500/5 text-center">
        <div className="flex items-center justify-center gap-1">
          <input
            type="text"
            value={carroProg}
            onChange={(e) => setCarroProg(e.target.value)}
            placeholder="Carro..."
            className={cn(
              "w-20 h-7 text-center rounded-md border text-xs font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition-all",
              duplicado
                ? "border-rose-600 text-rose-700 bg-rose-500/20 ring-1 ring-rose-500 font-black"
                : bloqueio
                  ? "border-rose-500 text-rose-600 bg-rose-500/10 font-black"
                  : "border-border/80 bg-background text-foreground"
            )}
            title={
              duplicado
                ? `Atenção: Carro ${carroProg} já está programado na Linha ${duplicado.linha} (Tab ${duplicado.tabela})!`
                : bloqueio
                  ? `Carro no CI: ${bloqueio.motivo}`
                  : "Digite para alterar o Carro Programado e clique em Alterar ao lado"
            }
          />
          {duplicado ? (
            <span title={`Carro Duplicado! Já programado na Linha ${duplicado.linha} (Tab ${duplicado.tabela})`} className="cursor-help text-rose-600 shrink-0 font-bold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          ) : bloqueio ? (
            <span title={`Carro no CI: ${bloqueio.motivo}`} className="cursor-help text-rose-500 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          ) : null}
        </div>
      </td>

      {/* Saída Garagem (Somente leitura) */}
      <td className="py-2 px-1.5 text-center font-bold text-foreground text-xs">
        {item.saidaGaragem}
      </td>

      {/* Início Linha (Somente leitura) */}
      <td className="py-2 px-1.5 text-center text-muted-foreground text-xs">
        {item.inicioLinha || item.inicioBairro || "—"}
      </td>

      {/* Status CI */}
      <td className="py-2 px-2 text-center">
        {bloqueio ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Oficina
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            Apto
          </span>
        )}
      </td>

      {/* Botão Alterar da Linha */}
      <td className="py-1 px-1.5 text-center">
        <Button
          type="button"
          size="sm"
          onClick={handleAlterar}
          className="h-7 px-2.5 text-[11px] font-bold rounded-lg transition-all bg-[#164E3A] hover:bg-[#113C2D] text-white shadow-2xs"
          title="Clique para confirmar e salvar a alteração do carro programado"
        >
          Alterar
        </Button>
      </td>
    </tr>
  );
}
