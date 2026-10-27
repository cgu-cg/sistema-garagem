import { FleetVehicleInput } from './FleetVehicleInput';
import type { DailyEscala } from '@/lib/sharedEscala';
import { ScaleVehiclePrefix } from './ScaleVehiclePrefix';
import { CiVehicleNotice, VehicleNoticeIcons, vehicleNoticeFlags } from './CiVehicleNotice';
import { useRef, useState } from "react";
import type { ReleaseExchangeCommand } from '@/lib/releaseProgramming';
import { SolturaItem } from "@/data/solturaTypes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pencil, X, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export interface TrocaCarroItem {
  carroAnterior: string;
  novoCarro: string;
  motivo: "Adicionado equivocadamente" | "Defeito Garagem" | "Defeito Rua (SOS)" | string;
  dataHora: string;
  descricaoDefeito?: string;
  registradoEm?: string;
  usuarioId?: number;
}

interface CarroTrocaPopoverProps {
  scaleState?: DailyEscala | null;
  item: SolturaItem;
  carroAtual: string;
  historicoTrocas?: TrocaCarroItem[];
  onTrocarCarro: (item: SolturaItem, novoCarro: string, motivo: ReleaseExchangeCommand['motivo'], descricaoDefeito?: string) => Promise<boolean>;
  checkBloqueioCI?: (prefixo?: string) => any;
  onPenduradoAlert?: (prefixo: string, motivo?: string) => void;
  getOutraLinhaComCarroRealiz?: (carro: string, currentItemId: string) => SolturaItem | undefined | null;
  isReadOnly?: boolean;
}

const MOTIVOS_DISPONIVEIS = [
  "Adicionado equivocadamente",
  "Defeito Garagem"
] as const;
const vehicleBadgeClass = 'relative inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-neutral-100/90 px-2.5 py-0.5 font-mono text-xs font-bold text-neutral-900 shadow-2xs dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-white';

export function CarroTrocaPopover({
  scaleState = null,
  item,
  carroAtual,
  historicoTrocas = [],
  onTrocarCarro,
  checkBloqueioCI,
  onPenduradoAlert,
  getOutraLinhaComCarroRealiz,
  isReadOnly = false
}: CarroTrocaPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALTERAR" | "HISTORICO">("ALTERAR");
  const [novoCarro, setNovoCarro] = useState("");
  const [motivo, setMotivo] = useState<ReleaseExchangeCommand['motivo'] | ''>('');
  const [descricaoDefeito, setDescricaoDefeito] = useState(''), [saving, setSaving] = useState(false);
  const pending = useRef(false);

  const totalTrocas = historicoTrocas.length;
  const isAlterado = totalTrocas > 0;
  const ultimaTroca = historicoTrocas.slice(-1)[0];
  const substitution = ultimaTroca?.motivo === 'Defeito Garagem' && ultimaTroca.novoCarro === carroAtual
    ? { carroAnterior: ultimaTroca.carroAnterior, descricaoDefeito: ultimaTroca.descricaoDefeito } : undefined;
  const historyDescription = !substitution && ultimaTroca
    ? 'Última troca: ' + ultimaTroca.carroAnterior + ' → ' + ultimaTroca.novoCarro + '. ' + ultimaTroca.motivo : undefined;

  const handleOpenAlterar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) return;
    setActiveTab("ALTERAR");
    setNovoCarro("");
    setMotivo('');
    setDescricaoDefeito('');
    setIsOpen(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.current || isReadOnly) return;
    if (!motivo) { toast.error('Selecione o motivo da troca.'); return; }
    if (motivo === 'Defeito Garagem' && !descricaoDefeito.trim()) { toast.error('Descreva o defeito na garagem.'); return; }
    const cleanCarro = novoCarro.trim().replace(/\D/g, "");
    if (!cleanCarro) {
      toast.error("Informe o número do novo carro.");
      return;
    }
    if (cleanCarro === carroAtual.trim()) {
      toast.error("O novo carro deve ser diferente do carro atual.");
      return;
    }

    // Se estiver bloqueado / pendurado no CI
    if (checkBloqueioCI) {
      const bloqueio = checkBloqueioCI(cleanCarro);
      if (bloqueio) {
        onPenduradoAlert?.(cleanCarro, bloqueio.motivo);
        return;
      }
    }

    // Só poder adicionar se NÃO estiver sendo utilizado em nenhum outro campo de carro realiz
    if (getOutraLinhaComCarroRealiz) {
      const outraLinha = getOutraLinhaComCarroRealiz(cleanCarro, item.id);
      if (outraLinha) {
        toast.error(`Carro ${cleanCarro} já está sendo utilizado na Linha ${outraLinha.linha} / Tab ${outraLinha.tabela}!`);
        return;
      }
    }

    pending.current = true; setSaving(true);
    try {
      if (await onTrocarCarro(item, cleanCarro, motivo, descricaoDefeito.trim())) { setIsOpen(false); setNovoCarro(''); setDescricaoDefeito(''); }
    } catch { toast.error('Troca não confirmada. Revise os dados antes de tentar novamente.'); }
    finally { pending.current = false; setSaving(false); }
  };

  if (isReadOnly && !isOpen) {
    return (
      <CiVehicleNotice state={scaleState} prefixo={carroAtual} substitution={substitution} description={historyDescription} hideIcon><span data-readonly="true" className={vehicleBadgeClass}>
        <ScaleVehiclePrefix state={scaleState} prefixo={carroAtual || "—"} />
        <Pencil aria-hidden="true" className="h-2.5 w-2.5 text-muted-foreground" />
        <VehicleNoticeIcons {...vehicleNoticeFlags(scaleState, carroAtual, undefined, substitution)} />
      </span></CiVehicleNotice>
    );
  }

  return (
    <CiVehicleNotice state={scaleState} prefixo={carroAtual} substitution={substitution} hideIcon hoverOnly hoverDisabled={isOpen}
      description={historyDescription}>
    <Popover open={isOpen} onOpenChange={open => { if (!pending.current) setIsOpen(open); }}>
      {/* Gatilho visual na célula da tabela */}
      <span className="inline-flex items-center justify-center gap-1 group">
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={isReadOnly}
            onClick={handleOpenAlterar}
            className={cn(
              vehicleBadgeClass,
              "transition-colors cursor-pointer select-none hover:bg-neutral-200 dark:hover:bg-neutral-700/80 group-hover:ring-1 group-hover:ring-neutral-400/40"
            )}
            aria-label={
              substitution
                ? `Defeito Garagem: ${substitution.descricaoDefeito || 'Troca por defeito na garagem'}. Clique para alterar ou ver histórico.`
                : isAlterado
                ? `Carro alterado/substituído (${totalTrocas} troca(s)). Clique para alterar ou ver histórico.`
                : "Carro realizado. Clique para alterar ou ver histórico."
            }
          >
            <span><ScaleVehiclePrefix state={scaleState} prefixo={carroAtual || "—"} /></span>
            <Pencil className={cn(
              "w-2.5 h-2.5 opacity-70 group-hover:opacity-100 transition-opacity",
              "text-muted-foreground group-hover:text-foreground dark:group-hover:text-white"
            )} />
            <VehicleNoticeIcons {...vehicleNoticeFlags(scaleState, carroAtual, undefined, substitution)} />
          </button>
        </PopoverTrigger>
      </span>

      {/* Conteúdo do Card Suspenso Ancorado (Seguindo Prints 2 e 3) */}
      {isOpen && <PopoverContent
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
              Alterar carro realizado
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
            disabled={saving}
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
                Carro Atual: <span className="font-mono font-bold text-foreground"><ScaleVehiclePrefix state={scaleState} prefixo={carroAtual} /></span>
              </label>
              <FleetVehicleInput fleetState={scaleState}
                type="text"
                autoFocus
                placeholder="novo carro"
                value={novoCarro}
                disabled={saving}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setNovoCarro(val);
                  if (val.length >= 4) {
                    if (checkBloqueioCI) {
                      const bloqueio = checkBloqueioCI(val);
                      if (bloqueio) {
                        onPenduradoAlert?.(val, bloqueio.motivo);
                        return;
                      }
                    }
                    if (getOutraLinhaComCarroRealiz) {
                      const outraLinha = getOutraLinhaComCarroRealiz(val, item.id);
                      if (outraLinha) {
                        toast.error(`Carro ${val} já está sendo utilizado na Linha ${outraLinha.linha} / Tab ${outraLinha.tabela}!`);
                      }
                    }
                  }
                }}
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
                      onClick={() => { if (!saving) setMotivo(op); }}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all select-none",
                        isChecked
                          ? "border-[#164E3A] bg-[#164E3A]/10 text-foreground font-semibold dark:border-emerald-500/50"
                          : "border-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <input type="radio" name={'motivo-troca-' + item.id} value={op} checked={isChecked} onChange={() => setMotivo(op)} disabled={saving} required className="sr-only" />
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
            {motivo === 'Defeito Garagem' && <div className="space-y-1.5">
              <label htmlFor={'defeito-' + item.id} className="text-xs font-semibold">Descreva o defeito <span className="text-rose-500">*</span></label>
              <textarea id={'defeito-' + item.id} value={descricaoDefeito} onChange={e => setDescricaoDefeito(e.target.value)} required maxLength={1000} disabled={saving}
                rows={3} placeholder="Informe o defeito na garagem..." className="w-full rounded-xl border border-border bg-background p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#164E3A]" />
            </div>}
            <Button
              type="submit"
              disabled={isReadOnly || saving || !novoCarro.trim() || !motivo || (motivo === 'Defeito Garagem' && !descricaoDefeito.trim())}
              className="w-full h-9 rounded-xl bg-[#164E3A] hover:bg-[#113C2D] text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Salvando...' : 'Salvar'}
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
                      {t.descricaoDefeito && <p className="mt-1 break-words">{t.descricaoDefeito}</p>}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {t.dataHora}
                  </span>
                </div>
              ))}

              {/* Linha do Carro Atual */}
              <div className={cn(
                "flex items-center justify-between gap-2 p-2 rounded-xl border text-xs transition-colors",
                isAlterado
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300"
                  : "bg-muted/50 border-border/80 text-neutral-900 dark:text-white"
              )}>
                <div className={cn(
                  "flex items-center gap-1.5 font-mono font-bold",
                  isAlterado ? "text-blue-700 dark:text-blue-400" : "text-neutral-900 dark:text-white"
                )}>
                  <span>{carroAtual}</span>
                  <span className="text-muted-foreground font-sans font-normal">—</span>
                  <span className={cn(
                    "font-sans font-semibold",
                    isAlterado ? "text-blue-700 dark:text-blue-300" : "text-foreground dark:text-white"
                  )}>
                    Carro Atual
                  </span>
                </div>
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  isAlterado ? "bg-blue-500 animate-pulse" : "bg-neutral-400"
                )} />
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
      </PopoverContent>}
    </Popover>
    </CiVehicleNotice>
  );
}
