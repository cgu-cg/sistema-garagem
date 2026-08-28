import { useState, useMemo } from "react";
import { BloqueioCarro } from "@/data/solturaData";
import { saveCIBloqueiosToStorage, checkCarroBloqueado } from "./ciManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  ShieldAlert, 
  Wrench, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Check, 
  RefreshCw,
  Printer
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CiManutencaoViewProps {
  ciList: BloqueioCarro[];
  setCiList: React.Dispatch<React.SetStateAction<BloqueioCarro[]>>;
  garagemFiltro?: "VCG" | "VCM" | "TODAS";
}

const TIPO_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  BLOQUEADO_CORRETIVA: { label: "Corretiva Urgente", color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-200 dark:border-rose-900/50" },
  EM_MANUTENCAO: { label: "Manutenção Geral", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-900/50" },
  REFORCO_REVISAO: { label: "Revisão Preventiva", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-900/50" },
  BLOQUEADO_MOTOR: { label: "Motor / Arrefecimento", color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40", border: "border-red-200 dark:border-red-900/50" },
  BLOQUEADO_CAMBIO: { label: "Câmbio / Embreagem", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-200 dark:border-orange-900/50" },
  BLOQUEADO_FREIO: { label: "Freio / Cuíca / Ar", color: "text-rose-800 dark:text-rose-300", bg: "bg-rose-100/70 dark:bg-rose-950/60", border: "border-rose-300 dark:border-rose-800" },
  BLOQUEADO_MOLA: { label: "Mola / Suspensão", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200 dark:border-purple-900/50" },
  BLOQUEADO_AGETRAN: { label: "Agetran / Notificação", color: "text-indigo-700 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-200 dark:border-indigo-900/50" },
  BLOQUEADO_MODULO: { label: "Elétrica / Módulo", color: "text-cyan-700 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/40", border: "border-cyan-200 dark:border-cyan-900/50" },
  BLOQUEADO_AR: { label: "Ar-Condicionado", color: "text-teal-700 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/40", border: "border-teal-200 dark:border-teal-900/50" },
  BLOQUEADO_SINISTRO: { label: "Sinistro / Batido", color: "text-zinc-800 dark:text-zinc-300", bg: "bg-zinc-100 dark:bg-zinc-800", border: "border-zinc-300 dark:border-zinc-700" },
};

export function CiManutencaoView({ ciList, setCiList, garagemFiltro = "TODAS" }: CiManutencaoViewProps) {
  const [showForm, setShowForm] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGaragem, setSelectedGaragem] = useState<"TODAS" | "VCG" | "VCM">(garagemFiltro);
  const [selectedStatus, setSelectedStatus] = useState<"TODOS" | "ATIVOS" | "LIBERADOS">("ATIVOS");
  const [selectedGravidade, setSelectedGravidade] = useState<string>("TODAS");

  // Form State para Novo CI
  const [formPrefixo, setFormPrefixo] = useState("");
  const [formGaragem, setFormGaragem] = useState<"VCG" | "VCM">("VCG");
  const [formTipo, setFormTipo] = useState<BloqueioCarro["tipo"]>("EM_MANUTENCAO");
  const [formMotivo, setFormMotivo] = useState("");
  const [formGravidade, setFormGravidade] = useState<"ALTA" | "MEDIA" | "BAIXA">("ALTA");
  const [formResponsavel, setFormResponsavel] = useState("Oficina Mecânica");
  const [formData, setFormData] = useState(() => new Date().toISOString().split("T")[0]);
  const [formHora, setFormHora] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [formPrevisao, setFormPrevisao] = useState("");
  const [formOS, setFormOS] = useState("");

  // Modal de Baixa / Liberação de CI
  const [itemToRelease, setItemToRelease] = useState<BloqueioCarro | null>(null);
  const [releaseMotivo, setReleaseMotivo] = useState("Reparo concluído e testado");
  const [releaseResponsavel, setReleaseResponsavel] = useState("Chefe de Oficina");

  // Modal de Edição
  const [editingItem, setEditingItem] = useState<BloqueioCarro | null>(null);

  // Auto-detectar garagem ao digitar prefixo
  const handlePrefixoChange = (val: string) => {
    setFormPrefixo(val);
    const clean = val.replace(/\D/g, "");
    if (clean.startsWith("1") || clean.startsWith("38") || clean.startsWith("39")) {
      setFormGaragem("VCM");
    } else if (clean.startsWith("2") || clean.startsWith("3") || clean.startsWith("4")) {
      setFormGaragem("VCG");
    }
  };

  // Salvar Novo CI
  const handleCreateCI = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrefixo = formPrefixo.trim();

    if (!cleanPrefixo) {
      toast.error("Informe o prefixo do veículo.");
      return;
    }

    if (!formMotivo.trim()) {
      toast.error("Informe o motivo ou defeito do veículo.");
      return;
    }

    // Verificar se já existe bloqueio ativo para esse prefixo
    const existing = checkCarroBloqueado(cleanPrefixo, ciList);
    if (existing) {
      toast.warning(`Atenção: Carro ${cleanPrefixo} já possui um CI ativo (${existing.motivo}).`);
    }

    const newCI: BloqueioCarro = {
      id: `ci-${Date.now()}-${cleanPrefixo}`,
      prefixo: cleanPrefixo,
      garagem: formGaragem,
      tipo: formTipo,
      motivo: formMotivo.trim(),
      data: formData,
      hora: formHora,
      gravidade: formGravidade,
      responsavel: formResponsavel.trim() || "Oficina Central",
      previsao: formPrevisao.trim() || undefined,
      os: formOS.trim() || `OS-${Math.floor(100000 + Math.random() * 900000)}`,
      status: "BLOQUEADO"
    };

    const updatedList = [newCI, ...ciList];
    setCiList(updatedList);
    saveCIBloqueiosToStorage(updatedList);

    toast.success(`CI de Manutenção cadastrado com sucesso para o Carro ${cleanPrefixo}!`);

    // Reset Form
    setFormPrefixo("");
    setFormMotivo("");
    setFormPrevisao("");
    setFormOS("");
  };

  // Confirmar Baixa / Liberação
  const handleConfirmRelease = () => {
    if (!itemToRelease) return;

    const agora = new Date();
    const dataLib = agora.toLocaleDateString("pt-BR");
    const horaLib = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

    const updatedList = ciList.map(item => {
      if (item.id === itemToRelease.id || (!item.id && item.prefixo === itemToRelease.prefixo)) {
        return {
          ...item,
          status: "LIBERADO" as const,
          dataLiberacao: `${dataLib} às ${horaLib}`,
          motivoLiberacao: releaseMotivo,
          responsavelLiberacao: releaseResponsavel
        };
      }
      return item;
    });

    setCiList(updatedList);
    saveCIBloqueiosToStorage(updatedList);
    toast.success(`Carro ${itemToRelease.prefixo} liberado do CI com sucesso!`);
    setItemToRelease(null);
  };

  // Salvar Edição
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updatedList = ciList.map(item => {
      if (item.id === editingItem.id || (!item.id && item.prefixo === editingItem.prefixo)) {
        return editingItem;
      }
      return item;
    });

    setCiList(updatedList);
    saveCIBloqueiosToStorage(updatedList);
    toast.success(`Registro do Carro ${editingItem.prefixo} atualizado!`);
    setEditingItem(null);
  };

  // Excluir CI
  const handleDeleteCI = (target: BloqueioCarro) => {
    if (!confirm(`Deseja realmente remover o registro de CI do Carro ${target.prefixo}?`)) return;

    const updatedList = ciList.filter(item => {
      if (target.id && item.id) return item.id !== target.id;
      return item.prefixo !== target.prefixo;
    });

    setCiList(updatedList);
    saveCIBloqueiosToStorage(updatedList);
    toast.info(`CI do Carro ${target.prefixo} removido.`);
  };

  // Filtragem da Lista
  const filteredCIs = useMemo(() => {
    return ciList.filter(item => {
      const isLiberado = item.status === "LIBERADO";

      if (selectedStatus === "ATIVOS" && isLiberado) return false;
      if (selectedStatus === "LIBERADOS" && !isLiberado) return false;

      if (selectedGaragem !== "TODAS") {
        const itemGaragem = item.garagem || (item.prefixo.startsWith("1") ? "VCM" : "VCG");
        if (itemGaragem !== selectedGaragem) return false;
      }

      if (selectedGravidade !== "TODAS") {
        const grav = item.gravidade || "MEDIA";
        if (grav !== selectedGravidade) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.prefixo.toLowerCase().includes(q) ||
          item.motivo.toLowerCase().includes(q) ||
          (item.responsavel && item.responsavel.toLowerCase().includes(q)) ||
          (item.os && item.os.toLowerCase().includes(q)) ||
          (TIPO_LABELS[item.tipo]?.label.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [ciList, selectedStatus, selectedGaragem, selectedGravidade, searchQuery]);

  // Estatísticas Rápidas
  const stats = useMemo(() => {
    const total = ciList.length;
    const ativos = ciList.filter(c => c.status !== "LIBERADO").length;
    const liberados = ciList.filter(c => c.status === "LIBERADO").length;
    const vcgAtivos = ciList.filter(c => c.status !== "LIBERADO" && (!c.garagem || c.garagem === "VCG" || (!c.garagem && !c.prefixo.startsWith("1")))).length;
    const vcmAtivos = ciList.filter(c => c.status !== "LIBERADO" && (c.garagem === "VCM" || (!c.garagem && c.prefixo.startsWith("1")))).length;
    const altaGravidade = ciList.filter(c => c.status !== "LIBERADO" && (c.gravidade === "ALTA" || c.motivo.toLowerCase().includes("motor") || c.motivo.toLowerCase().includes("freio"))).length;

    return { total, ativos, liberados, vcgAtivos, vcmAtivos, altaGravidade };
  }, [ciList]);

  return (
    <div className="space-y-6">
      
      {/* ========================================================= */}
      {/* CABEÇALHO DO SUBMENU CI MANUTENÇÃO */}
      {/* ========================================================= */}
      <div className="bg-card border rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                CI - COMUNICAÇÃO INTERNA
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Oficina & Pátio
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
              Alimentar CI Manutenção & Bloqueios da Frota
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Cadastre veículos retidos na oficina, acompanhe reparos e libere carros aptos para a soltura.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={showForm ? "default" : "outline"}
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="gap-1.5 h-9 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            {showForm ? "Ocultar Formulário" : "Novo Bloqueio CI"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 h-9 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir CI
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CARDS DE RESUMO DO QUADRO CI */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl">
          <span className="text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            Ativos no CI
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.ativos}</span>
            <span className="text-xs text-rose-700/70 dark:text-rose-300/70">carros bloqueados</span>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl">
          <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Críticos / Motor / Freio
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.altaGravidade}</span>
            <span className="text-xs text-amber-700/70 dark:text-amber-300/70">bloqueio total</span>
          </div>
        </div>

        <div className="bg-card border p-3.5 rounded-xl">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            VCG Retidos
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-foreground">{stats.vcgAtivos}</span>
            <span className="text-xs text-muted-foreground">veículos</span>
          </div>
        </div>

        <div className="bg-card border p-3.5 rounded-xl">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            VCM Retidos
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-foreground">{stats.vcmAtivos}</span>
            <span className="text-xs text-muted-foreground">veículos</span>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl">
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Liberados / Baixados
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.liberados}</span>
            <span className="text-xs text-emerald-700/70 dark:text-emerald-300/70">prontos p/ pista</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FORMULÁRIO DE CADASTRO DE BLOQUEIO CI */}
      {/* ========================================================= */}
      {showForm && (
        <div className="bg-card border-2 border-rose-500/30 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h2 className="text-base font-bold text-foreground">
                Formulário de Alimentação de CI Manutenção
              </h2>
            </div>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
              Impacta a Folha de Soltura em Tempo Real
            </span>
          </div>

          <form onSubmit={handleCreateCI} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              
              {/* Prefixo do Carro */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Prefixo do Carro <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="Ex: 3200, 1345"
                  value={formPrefixo}
                  onChange={(e) => handlePrefixoChange(e.target.value)}
                  className="font-mono font-bold text-sm bg-muted/40 h-9"
                  required
                />
              </div>

              {/* Garagem */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Garagem <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={formGaragem}
                  onChange={(e) => setFormGaragem(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-lg border bg-muted/40 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="VCG">Viação Campo Grande (VCG)</option>
                  <option value="VCM">Viação Cidade Morena (VCM)</option>
                </select>
              </div>

              {/* Tipo de Bloqueio */}
              <div className="space-y-1.5 lg:col-span-2">
                <Label className="text-xs font-bold text-foreground">
                  Tipo de Bloqueio / Categoria <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={formTipo}
                  onChange={(e) => setFormTipo(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-lg border bg-muted/40 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="EM_MANUTENCAO">Manutenção Geral / Mecânica</option>
                  <option value="BLOQUEADO_CORRETIVA">Corretiva Urgente / Pátio</option>
                  <option value="BLOQUEADO_MOTOR">Motor / Arrefecimento / Óleo</option>
                  <option value="BLOQUEADO_FREIO">Freio / Cuíca / Válvula de Ar</option>
                  <option value="BLOQUEADO_MOLA">Mola / Suspensão / Eixo</option>
                  <option value="BLOQUEADO_CAMBIO">Câmbio / Embreagem / Diferencial</option>
                  <option value="BLOQUEADO_AGETRAN">Agetran / Vistoria / Notificação</option>
                  <option value="BLOQUEADO_MODULO">Elétrica / Módulo / Multiplex</option>
                  <option value="BLOQUEADO_AR">Ar-Condicionado / Climatizador</option>
                  <option value="BLOQUEADO_SINISTRO">Sinistro / Batido / Chaparia</option>
                  <option value="REFORCO_REVISAO">Revisão Preventiva Programada</option>
                </select>
              </div>

              {/* Gravidade */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Gravidade / Impacto
                </Label>
                <select
                  value={formGravidade}
                  onChange={(e) => setFormGravidade(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-lg border bg-muted/40 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="ALTA">Alta (Bloqueio Total)</option>
                  <option value="MEDIA">Média (Restrição)</option>
                  <option value="BAIXA">Baixa (Monitoramento)</option>
                </select>
              </div>

              {/* Número OS */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  N° Ordem Serviço (OS)
                </Label>
                <Input
                  placeholder="Ex: OS-202645"
                  value={formOS}
                  onChange={(e) => setFormOS(e.target.value)}
                  className="text-xs bg-muted/40 h-9 font-mono"
                />
              </div>

            </div>

            {/* Linha 2 do formulário */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
              
              {/* Motivo detalhado */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-bold text-foreground">
                  Motivo Detalhado / Sintoma do Defeito <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="Ex: Bloqueado cuíca de freio com vazamento de ar..."
                  value={formMotivo}
                  onChange={(e) => setFormMotivo(e.target.value)}
                  className="text-xs bg-muted/40 h-9"
                  required
                />
              </div>

              {/* Responsável / Oficina */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Responsável / Oficina
                </Label>
                <Input
                  placeholder="Ex: Mecânico Silva / Plantão"
                  value={formResponsavel}
                  onChange={(e) => setFormResponsavel(e.target.value)}
                  className="text-xs bg-muted/40 h-9"
                />
              </div>

              {/* Data e Hora de Entrada */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Data & Hora Entrada
                </Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="date"
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    className="text-xs bg-muted/40 h-9"
                  />
                  <Input
                    type="time"
                    value={formHora}
                    onChange={(e) => setFormHora(e.target.value)}
                    className="text-xs bg-muted/40 h-9 w-20"
                  />
                </div>
              </div>

              {/* Previsão de Liberação */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Previsão de Liberação
                </Label>
                <Input
                  placeholder="Ex: Hoje às 14:00, Amanhã"
                  value={formPrevisao}
                  onChange={(e) => setFormPrevisao(e.target.value)}
                  className="text-xs bg-muted/40 h-9"
                />
              </div>

            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormPrefixo("");
                  setFormMotivo("");
                }}
                className="text-xs h-9"
              >
                Limpar Campos
              </Button>

              <Button
                type="submit"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 font-semibold gap-1.5 shadow-xs"
              >
                <ShieldAlert className="w-4 h-4" />
                Cadastrar Bloqueio CI
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* FILTROS E BUSCA DO QUADRO CI */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Filtros de Status e Garagem */}
        <div className="flex items-center gap-2 flex-wrap">
          
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border text-xs">
            <button
              type="button"
              onClick={() => setSelectedStatus("ATIVOS")}
              className={cn(
                "px-3 py-1 rounded-lg font-bold transition-all",
                selectedStatus === "ATIVOS"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Ativos ({stats.ativos})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("LIBERADOS")}
              className={cn(
                "px-3 py-1 rounded-lg font-bold transition-all",
                selectedStatus === "LIBERADOS"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Liberados ({stats.liberados})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("TODOS")}
              className={cn(
                "px-3 py-1 rounded-lg font-bold transition-all",
                selectedStatus === "TODOS"
                  ? "bg-background text-foreground shadow-2xs border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Todos ({stats.total})
            </button>
          </div>

          <div className="flex items-center bg-muted/60 p-1 rounded-xl border text-xs">
            <button
              type="button"
              onClick={() => setSelectedGaragem("TODAS")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-semibold transition-all",
                selectedGaragem === "TODAS" ? "bg-background text-foreground shadow-2xs border" : "text-muted-foreground"
              )}
            >
              Todas Garagens
            </button>
            <button
              type="button"
              onClick={() => setSelectedGaragem("VCG")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-semibold transition-all",
                selectedGaragem === "VCG" ? "bg-background text-foreground shadow-2xs border" : "text-muted-foreground"
              )}
            >
              VCG
            </button>
            <button
              type="button"
              onClick={() => setSelectedGaragem("VCM")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-semibold transition-all",
                selectedGaragem === "VCM" ? "bg-background text-foreground shadow-2xs border" : "text-muted-foreground"
              )}
            >
              VCM
            </button>
          </div>

          <div className="flex items-center bg-muted/60 p-1 rounded-xl border text-xs">
            {(["TODAS", "ALTA", "MEDIA", "BAIXA"] as const).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGravidade(g)}
                className={cn(
                  "px-2 py-1 rounded-lg font-semibold transition-all",
                  selectedGravidade === g ? "bg-background text-foreground shadow-2xs border" : "text-muted-foreground"
                )}
              >
                {g === "TODAS" ? "Todas Grav." : g}
              </button>
            ))}
          </div>

        </div>

        {/* Input de Busca */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por prefixo, motivo, OS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs bg-card"
          />
        </div>

      </div>

      {/* ========================================================= */}
      {/* TABELA DE REGISTROS DE CI MANUTENÇÃO */}
      {/* ========================================================= */}
      <div className="bg-card border rounded-2xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Registros de Comunicação Interna (CI) - {filteredCIs.length} encontrado(s)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-muted/20 text-muted-foreground font-semibold">
                <th className="py-2.5 px-3">Prefixo</th>
                <th className="py-2.5 px-2">Garagem</th>
                <th className="py-2.5 px-3">Tipo de Bloqueio</th>
                <th className="py-2.5 px-3">Motivo / Descrição do Defeito</th>
                <th className="py-2.5 px-2">Gravidade</th>
                <th className="py-2.5 px-3">Entrada / Previsão</th>
                <th className="py-2.5 px-3">OS / Responsável</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCIs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    Nenhum registro de CI encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredCIs.map((item, idx) => {
                  const isLiberado = item.status === "LIBERADO";
                  const tipoInfo = TIPO_LABELS[item.tipo] || {
                    label: item.tipo,
                    color: "text-foreground",
                    bg: "bg-muted",
                    border: "border-border"
                  };
                  const itemGaragem = item.garagem || (item.prefixo.startsWith("1") ? "VCM" : "VCG");

                  return (
                    <tr 
                      key={item.id || `${item.prefixo}-${idx}`}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        isLiberado ? "opacity-60 bg-emerald-500/5" : ""
                      )}
                    >
                      {/* Prefixo */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "font-mono font-bold text-sm px-2 py-0.5 rounded-md border shadow-2xs",
                            isLiberado 
                              ? "bg-muted text-muted-foreground border-border" 
                              : "bg-rose-600 text-white border-rose-700"
                          )}>
                            {item.prefixo}
                          </span>
                        </div>
                      </td>

                      {/* Garagem */}
                      <td className="py-2.5 px-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold",
                          itemGaragem === "VCG"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                        )}>
                          {itemGaragem}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td className="py-2.5 px-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-semibold border inline-block",
                          tipoInfo.bg,
                          tipoInfo.color,
                          tipoInfo.border
                        )}>
                          {tipoInfo.label}
                        </span>
                      </td>

                      {/* Motivo */}
                      <td className="py-2.5 px-3 max-w-xs">
                        <p className="font-semibold text-foreground truncate" title={item.motivo}>
                          {item.motivo}
                        </p>
                        {isLiberado && item.motivoLiberacao && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                            ✓ Baixa: {item.motivoLiberacao} ({item.dataLiberacao})
                          </p>
                        )}
                      </td>

                      {/* Gravidade */}
                      <td className="py-2.5 px-2">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                          (item.gravidade === "ALTA" || !item.gravidade)
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
                            : item.gravidade === "MEDIA"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        )}>
                          {item.gravidade || "ALTA"}
                        </span>
                      </td>

                      {/* Entrada / Previsão */}
                      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                        <div>
                          <span className="font-medium text-foreground">{item.data}</span>
                          {item.hora && <span className="text-[10px] ml-1 text-muted-foreground">({item.hora})</span>}
                        </div>
                        {item.previsao && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                            Prev: {item.previsao}
                          </div>
                        )}
                      </td>

                      {/* OS / Responsável */}
                      <td className="py-2.5 px-3 max-w-[140px] truncate text-muted-foreground">
                        <span className="font-mono text-[10px] text-foreground font-semibold block">
                          {item.os || "OS-Pátio"}
                        </span>
                        <span className="text-[11px] truncate block">
                          {item.responsavel || "Oficina Mecânica"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-2">
                        {isLiberado ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                            <Check className="w-2.5 h-2.5" /> Liberado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300">
                            <ShieldAlert className="w-2.5 h-2.5" /> Retido CI
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isLiberado ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setItemToRelease(item);
                                setReleaseMotivo("Reparo concluído e testado");
                              }}
                              className="h-7 px-2 text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 font-semibold gap-1"
                              title="Dar baixa e liberar veículo do CI"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Liberar
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updatedList = ciList.map(ci => ci.id === item.id ? { ...ci, status: "BLOQUEADO" as const } : ci);
                                setCiList(updatedList);
                                saveCIBloqueiosToStorage(updatedList);
                                toast.info(`Carro ${item.prefixo} retornado para Bloqueado.`);
                              }}
                              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                              title="Reabrir CI"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Reabrir
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingItem(item)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Editar CI"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCI(item)}
                            className="h-7 w-7 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Excluir CI"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL DE BAIXA / LIBERAÇÃO DE CI */}
      {/* ========================================================= */}
      <Dialog open={!!itemToRelease} onOpenChange={(open) => !open && setItemToRelease(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              Liberar Veículo do CI de Manutenção
            </DialogTitle>
            <DialogDescription>
              Confirme a conclusão do reparo para liberar o veículo para a escala e soltura na pista.
            </DialogDescription>
          </DialogHeader>

          {itemToRelease && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 p-3 rounded-xl border flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground block">Carro</span>
                  <span className="font-mono font-bold text-lg text-foreground">{itemToRelease.prefixo}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Defeito Registrado</span>
                  <span className="text-xs font-semibold text-rose-600">{itemToRelease.motivo}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Motivo / Parecer da Liberação</Label>
                <Input
                  value={releaseMotivo}
                  onChange={(e) => setReleaseMotivo(e.target.value)}
                  placeholder="Ex: Troca de cuíca concluída, testado na pista..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Responsável pela Liberação</Label>
                <Input
                  value={releaseResponsavel}
                  onChange={(e) => setReleaseResponsavel(e.target.value)}
                  placeholder="Ex: Encarregado Silva"
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setItemToRelease(null)}>
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={handleConfirmRelease}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Confirmar Baixa & Liberar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL DE EDIÇÃO DE CI */}
      {/* ========================================================= */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Editar Registro de CI - Carro {editingItem?.prefixo}
            </DialogTitle>
            <DialogDescription>
              Atualize as informações de manutenção e previsão deste veículo.
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <form onSubmit={handleSaveEdit} className="space-y-3.5 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Prefixo</Label>
                  <Input
                    value={editingItem.prefixo}
                    onChange={(e) => setEditingItem({ ...editingItem, prefixo: e.target.value })}
                    className="font-mono font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Garagem</Label>
                  <select
                    value={editingItem.garagem || "VCG"}
                    onChange={(e) => setEditingItem({ ...editingItem, garagem: e.target.value as any })}
                    className="w-full h-9 px-3 rounded-lg border text-xs font-semibold"
                  >
                    <option value="VCG">VCG</option>
                    <option value="VCM">VCM</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Motivo / Defeito</Label>
                <Input
                  value={editingItem.motivo}
                  onChange={(e) => setEditingItem({ ...editingItem, motivo: e.target.value })}
                  className="text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Gravidade</Label>
                  <select
                    value={editingItem.gravidade || "ALTA"}
                    onChange={(e) => setEditingItem({ ...editingItem, gravidade: e.target.value as any })}
                    className="w-full h-9 px-3 rounded-lg border text-xs font-semibold"
                  >
                    <option value="ALTA">Alta (Bloqueio Total)</option>
                    <option value="MEDIA">Média (Restrição)</option>
                    <option value="BAIXA">Baixa (Monitoramento)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Previsão</Label>
                  <Input
                    value={editingItem.previsao || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, previsao: e.target.value })}
                    placeholder="Ex: Hoje 16:00"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Responsável</Label>
                  <Input
                    value={editingItem.responsavel || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, responsavel: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">N° OS</Label>
                  <Input
                    value={editingItem.os || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, os: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingItem(null)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="font-semibold">
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
