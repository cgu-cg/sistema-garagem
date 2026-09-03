import { useState } from "react";
import { SolturaItem } from "@/data/solturaData";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { History, Pencil, X, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export interface TrocaCarroItem {
  carroAnterior: string;
  novoCarro: string;
  motivo: "Adicionado equivocadamente" | "Defeito Garagem" | "Defeito Rua (SOS)" | string;
  dataHora: string;
}

interface CarroTrocaPopoverProps {
  item: SolturaItem;
  carroAtual: string;
  historicoTrocas?: TrocaCarroItem[];
  onTrocarCarro: (item: SolturaItem, novoCarro: string, motivo: string) => void;
  isReadOnly?: boolean;
}

const MOTIVOS_DISPONIVEIS = [
  "Adicionado equivocadamente",
  "Defeito Garagem",
  "Defeito Rua (SOS)"
] as const;

export function CarroTrocaPopover({
  item,
  carroAtual,
  historicoTrocas = [],
  onTrocarCarro,
  isReadOnly = false
}: CarroTrocaPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALTERAR" | "HISTORICO">("ALTERAR");
  const [novoCarro, setNovoCarro] = useState("");
  const [motivo, setMotivo] = useState<string>("Adicionado equivocadamente");

  const totalTrocas = historicoTrocas.length;

  const handleOpenAlterar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTab("ALTERAR");
    setNovoCarro("");
    setMotivo("Adicionado equivocadamente");
    setIsOpen(true);
  };

  const handleOpenHistorico = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTab("HISTORICO");
    setIsOpen(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCarro = novoCarro.trim().replace(/\D/g, "");
    if (!cleanCarro) {
      toast.error("Informe o número do novo carro.");
      return;
    }
    if (cleanCarro === carroAtual.trim()) {
      toast.error("O novo carro deve ser diferente do carro atual.");
      return;
    }

    onTrocarCarro(item, cleanCarro, motivo);
    setIsOpen(false);
    setNovoCarro("");
  };

  if (isReadOnly) {
    return (
      <span className="font-mono font-bold text-xs text-foreground">
        {carroAtual || "—"}
      </span>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      {/* Gatilho visual na célula da tabela */}
      <div className="flex items-center justify-center gap-1 group">
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={handleOpenAlterar}
            className={cn(
              "font-mono font-bold text-xs px-2 py-0.5 rounded-md transition-all cursor-pointer select-none",
              "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30",
              "flex items-center gap-1 shadow-2xs group-hover:ring-1 group-hover:ring-emerald-500/40"
            )}
            title="Clique para alterar o carro ou ver histórico de trocas"
          >
            <span>{carroAtual || "—"}</span>
            <Pencil className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        </PopoverTrigger>

        {/* Indicador e atalho para Histórico de Trocas se houver trocas */}
        {totalTrocas > 0 && (
          <button
            type="button"
            onClick={handleOpenHistorico}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            title={`Ver histórico de ${totalTrocas} troca(s) realizada(s)`}
          >
            <History className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          </button>
        )}
      </div>

      {/* Conteúdo do Card Suspenso Ancorado (Seguindo Prints 2 e 3) */}
      <PopoverContent
        align="center"
        sideOffset={6}
        className="w-[280px] p-3.5 rounded-2xl border border-border/80 bg-card shadow-2xl text-card-foreground space-y-3 print:hidden"
      >
        {/* Cabeçalho do Card com alternância de abas */}
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("ALTERAR")}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                activeTab === "ALTERAR"
                  ? "bg-primary/10 text-primary font-bold shadow-2xs border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Alterar Carro Prog.
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("HISTORICO")}
              className={cn(
                "px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1",
                activeTab === "HISTORICO"
                  ? "bg-primary/10 text-primary font-bold shadow-2xs border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Histórico
              {totalTrocas > 0 && (
                <span className="text-[10px] px-1 py-0.2 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono">
                  {totalTrocas}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ABA 1: ALTERAR CARRO (PRINT 2)                                 */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "ALTERAR" && (
          <form onSubmit={handleSalvar} className="space-y-3 pt-0.5">
            {/* Input do Novo Carro */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Carro Atual: <span className="font-mono font-bold text-foreground">{carroAtual}</span>
              </label>
              <input
                type="text"
                autoFocus
                placeholder="novo carro"
                value={novoCarro}
                onChange={(e) => setNovoCarro(e.target.value.replace(/\D/g, ""))}
                className="w-full h-9 px-3 rounded-xl border border-border/80 bg-background text-sm font-mono font-bold text-foreground placeholder:text-muted-foreground placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-[#164E3A] transition-all shadow-2xs"
              />
            </div>

            {/* Motivo da Troca */}
            <div className="space-y-1.5 pt-0.5">
              <span className="text-xs font-bold text-foreground block">
                Motivo da troca
              </span>
              <div className="space-y-1.5">
                {MOTIVOS_DISPONIVEIS.map((op) => {
                  const isChecked = motivo === op;
                  return (
                    <label
                      key={op}
                      onClick={() => setMotivo(op)}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all select-none",
                        isChecked
                          ? "border-[#164E3A] bg-[#164E3A]/10 text-foreground font-semibold dark:border-emerald-500/50"
                          : "border-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all shrink-0",
                          isChecked
                            ? "border-[#164E3A] bg-[#164E3A] dark:border-emerald-500 dark:bg-emerald-600"
                            : "border-muted-foreground/60 bg-transparent"
                        )}
                      >
                        {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs">{op}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Botão Salvar */}
            <Button
              type="submit"
              className="w-full h-9 rounded-xl bg-[#164E3A] hover:bg-[#113C2D] text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Salvar
            </Button>

            {/* Atalho para ver histórico se houver */}
            {totalTrocas > 0 && (
              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("HISTORICO")}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Ver histórico de trocas ({totalTrocas})
                </button>
              </div>
            )}
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ABA 2: HISTÓRICO DE TROCAS (PRINT 3)                           */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "HISTORICO" && (
          <div className="space-y-2.5 pt-0.5">
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {/* Lista dos Carros Trocados Anteriores */}
              {historicoTrocas.map((t, index) => (
                <div
                  key={`${t.carroAnterior}-${index}`}
                  className="flex items-start justify-between gap-2 p-2 rounded-xl bg-muted/40 border border-border/50 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 font-mono font-bold text-foreground">
                      <span>{t.carroAnterior}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground font-semibold">{t.novoCarro}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t.motivo}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {t.dataHora}
                  </span>
                </div>
              ))}

              {/* Linha do Carro Atual (Exatamente como no print 3: "3205 - Carro Atual") */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  <span>{carroAtual}</span>
                  <span className="text-muted-foreground font-sans font-normal">—</span>
                  <span className="font-sans font-semibold text-emerald-700 dark:text-emerald-300">
                    Carro Atual
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>

            {/* Botão para efetuar nova troca a partir do histórico */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("ALTERAR")}
              className="w-full h-8 rounded-xl border-border/80 text-xs font-bold hover:bg-muted/50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Pencil className="w-3 h-3" />
              Efetuar Nova Troca
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
