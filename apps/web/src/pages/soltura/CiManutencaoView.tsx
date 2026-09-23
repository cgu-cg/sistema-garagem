import React, { useState, useMemo, useEffect } from "react";
import { BloqueioCarro } from "@/data/solturaData";
import { INVENTORY_CARS } from "@/data/inventoryCars";
import { 
  saveCIBloqueiosToStorage, 
  getConsorciadaByCarro,
  getGaragemFisicaByCarro 
} from "./ciManager";
import { useAuth } from "@/stores/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Bus, 
  ShieldAlert, 
  Wrench, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Check, 
  Printer, 
  Clock, 
  Layers, 
  Calendar, 
  FileText,
  ChevronRight 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CiManutencaoViewProps {
  ciList: BloqueioCarro[];
  setCiList: React.Dispatch<React.SetStateAction<BloqueioCarro[]>>;
  garagemFiltro?: "VCG" | "VCM" | "TODAS";
}

type TabCategory = "PREVENTIVA" | "OFICINA" | "REFORCO" | "BLOQUEADO";

const SETORES_OFICINA = [
  { id: "MECANICA", label: "Mecânica", chips: ["Suspensão", "Mecânica Geral", "Freio", "Diferencial", "Câmbio"] },
  { id: "ELEVADOR", label: "Elevador", chips: ["Elevador Acessibilidade", "Trava de Segurança", "Plataforma"] },
  { id: "ELETRICA", label: "Elétrica", chips: ["Módulo Eletrônico", "Chicote ARLA 32", "Sensor de Nível", "Tensor", "Alternador"] },
  { id: "BORRACHARIA", label: "Borracharia", chips: ["Pneu Furado", "Troca de Roda", "Alinhamento"] },
  { id: "FUNILARIA", label: "Funilaria / Pintura", chips: ["Sinistro", "Para-choque", "Retoque Pintura", "Chapeação"] },
  { id: "TACOGRAFO", label: "Tacógrafo", chips: ["Aferição", "Troca de Disco", "Lacre Rompido"] },
  { id: "BILHETAGEM", label: "Bilhetagem", chips: ["Validador", "Catraca Travada", "Cabo de Antena WiFi"] },
  { id: "LIMPEZA", label: "Limpeza", chips: ["Higienização Pesada", "Lavagem de Motor", "Polimento"] },
] as const;

const BLOQUEIOS_MOTIVOS_RAPIDOS = [
  "Motor", "Transmissão", "Revisão Geral", "Sinistro", "Mecânica (Pastilhas e Disco de Freio)",
  "Falta de Peça Para-brisa", "Posto de Molas", "Módulo", "Suspensão", "Câmbio", "Freio", "Elétrica"
];

export function CiManutencaoView({ ciList, setCiList }: CiManutencaoViewProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  // Identificação da Garagem Física do Usuário Logado:
  // - VCM (Garagem 1)
  // - VCG (Garagem 2)
  const userGaragemFixa: "VCM" | "VCG" | undefined = useMemo(() => {
    if (user?.garagem === "VCM" || user?.email?.toLowerCase().includes("vcm")) return "VCM";
    if (user?.garagem === "VCG" || user?.email?.toLowerCase().includes("vcg")) return "VCG";
    return undefined;
  }, [user]);

  // Seletor de Garagem exclusivo para ADMIN (permite visualizar Todas, VCG ou VCM)
  const [adminGaragemFiltro, setAdminGaragemFiltro] = useState<"TODAS" | "VCG" | "VCM">("TODAS");

  // Frota padrão com base nos 464 carros conhecidos, mapeados para suas garagens físicas (incluindo 2002 na Garagem 1 - VCM)
  const [fleetCars, setFleetCars] = useState<Array<{ prefixo: string; garagem: "VCM" | "VCG" }>>(() => {
    return INVENTORY_CARS.map(c => ({
      prefixo: c,
      garagem: getGaragemFisicaByCarro(c),
    }));
  });

  // Busca lista atualizada de veículos do SQL Server via API (tabela Veiculos, coluna garagem)
  useEffect(() => {
    let isMounted = true;
    api.getBusesInventory()
      .then((res: any) => {
        if (!isMounted || !Array.isArray(res)) return;
        const mapped = res.map((item: any) => {
          const prefixo = String(item.prefixo || item.idCarro || "");
          const garagemNome: "VCM" | "VCG" = item.garagemNome || getGaragemFisicaByCarro(prefixo);
          return {
            prefixo,
            garagem: garagemNome,
          };
        }).filter((item: { prefixo: string; garagem: "VCM" | "VCG" }) => item.prefixo.length > 0);

        if (mapped.length > 0) {
          setFleetCars(mapped);
        }
      })
      .catch((err: any) => {
        console.warn("[CI Manutenção] Usando frota padrão em cache/offline:", err);
      });

    return () => { isMounted = false; };
  }, []);

  // Escopo de Garagem Ativo:
  // - Se for usuário com garagem fixa (ex: VCG ou VCM): SEMPRE fixo na sua respectiva garagem!
  // - Se for ADMIN: pode alternar entre Todas, Garagem 1 (VCM) e Garagem 2 (VCG)
  const activeGaragemScope: "TODAS" | "VCG" | "VCM" = useMemo(() => {
    if (!isAdmin && userGaragemFixa) return userGaragemFixa;
    return adminGaragemFiltro;
  }, [isAdmin, userGaragemFixa, adminGaragemFiltro]);

  // Veículos permitidos na visualização de acordo com a garagem
  const allowedCars = useMemo(() => {
    if (activeGaragemScope === "TODAS") return fleetCars;
    return fleetCars.filter(c => c.garagem === activeGaragemScope);
  }, [fleetCars, activeGaragemScope]);

  // Conjunto de prefixos permitidos para verificação O(1)
  const allowedPrefixes = useMemo(() => {
    return new Set(allowedCars.map(c => c.prefixo));
  }, [allowedCars]);

  // Modo de visualização: Grade de Carros (Print 1) ou Planilha Espelho Impressa (Print 2)
  const [viewMode, setViewMode] = useState<"GRID" | "PLANILHA">("GRID");

  // Filtros de busca e status do grid
  const [searchCarQuery, setSearchCarQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "BLOQUEADOS" | "APTOS" | "PREVENTIVAS" | "OFICINA">("ALL");

  // Carro Selecionado para o Modal de CI (Print 2)
  const [selectedCarro, setSelectedCarro] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Aba selecionada dentro do modal
  const [modalCategory, setModalCategory] = useState<TabCategory>("OFICINA");

  // Estados do Formulário dentro do Modal
  const [formSetor, setFormSetor] = useState<(typeof SETORES_OFICINA)[number]["id"]>("MECANICA");
  const [formTipoPreventiva, setFormTipoPreventiva] = useState<"PREVENTIVA" | "LUBRIFICACAO" | "TROCA_OLEO" | "REVISAO_GERAL" | "SISEP">("REVISAO_GERAL");
  const [formHoraReforco, setFormHoraReforco] = useState("07:15");
  const [formLetraReforco, setFormLetraReforco] = useState<"A" | "B" | "C" | "D" | "M">("A");
  const [formMotivoReforco, setFormMotivoReforco] = useState<string>("LUBRIFICAÇÃO");
  const [formOutroMotivoReforco, setFormOutroMotivoReforco] = useState("");
  const [formConsorciada, setFormConsorciada] = useState<"VSF" | "VCG" | "JTU" | "VCM">("VCG");
  const [formMotivo, setFormMotivo] = useState("");
  const [formDataBloqueio, setFormDataBloqueio] = useState(() => new Date().toISOString().split("T")[0]);
  const [formResponsavel, setFormResponsavel] = useState("Oficina Mecânica");
  const [formGravidade, setFormGravidade] = useState<"ALTA" | "MEDIA" | "BAIXA">("ALTA");

  // Horário completo composto (ex: 07:15 - A)
  const formHorarioReforco = useMemo(() => {
    return `${formHoraReforco.trim() || "07:15"} - ${formLetraReforco}`;
  }, [formHoraReforco, formLetraReforco]);

  const parseAndSetHorarioReforco = (val: string) => {
    if (!val) return;
    const parts = val.split("-").map(s => s.trim());
    if (parts[0]) setFormHoraReforco(parts[0]);
    if (parts[1]) {
      const l = parts[1].toUpperCase();
      if (["A", "B", "C", "D", "M"].includes(l)) {
        setFormLetraReforco(l as any);
      }
    }
  };

  // Estado para dar baixa / liberar veículo
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseMotivo, setReleaseMotivo] = useState("Reparo concluído e testado na pista");
  const [releaseResponsavel, setReleaseResponsavel] = useState("Encarregado de Oficina");

  // Mapa rápido de carros com registro de CI ativo
  const activeCiMap = useMemo(() => {
    const map = new Map<string, BloqueioCarro>();
    ciList.forEach(item => {
      if (item.status !== "LIBERADO") {
        map.set(item.prefixo, item);
      }
    });
    return map;
  }, [ciList]);

  // Estatísticas Rápidas baseadas na frota da garagem do usuário
  const stats = useMemo(() => {
    const totalFrota = allowedCars.length;
    let bloqueadosCount = 0;
    let preventivasCount = 0;
    let oficinasCount = 0;
    let totalNaCI = 0;

    activeCiMap.forEach((ci, carro) => {
      if (!allowedPrefixes.has(carro)) return; // Ignora carros de outra garagem fora do escopo
      totalNaCI++;
      if (ci.categoriaPlanilha === "PREVENTIVA") preventivasCount++;
      else if (ci.categoriaPlanilha === "OFICINA") oficinasCount++;
      else bloqueadosCount++;
    });

    const aptos = Math.max(0, totalFrota - totalNaCI);

    return { totalFrota, totalNaCI, bloqueadosCount, preventivasCount, oficinasCount, aptos };
  }, [allowedCars, allowedPrefixes, activeCiMap]);

  // Ao clicar em um cartão do carro na grade
  const handleCarClick = (carro: string) => {
    setSelectedCarro(carro);
    const autoConsorciada = getConsorciadaByCarro(carro);
    setFormConsorciada(autoConsorciada);

    const existingCI = activeCiMap.get(carro);
    if (existingCI) {
      // Carregar dados existentes para visualização/edição
      setModalCategory(existingCI.categoriaPlanilha || "OFICINA");
      setFormMotivo(existingCI.motivo || "");
      setFormResponsavel(existingCI.responsavel || "Oficina Mecânica");
      setFormDataBloqueio(existingCI.data || new Date().toISOString().split("T")[0]);
      setFormGravidade(existingCI.gravidade || "ALTA");
      if (existingCI.setorOficina) setFormSetor(existingCI.setorOficina);
      if (existingCI.tipoPreventiva) setFormTipoPreventiva(existingCI.tipoPreventiva);
      if (existingCI.horarioReforco) parseAndSetHorarioReforco(existingCI.horarioReforco);
      if (existingCI.consorciada) setFormConsorciada(existingCI.consorciada);
      if (existingCI.categoriaPlanilha === "REFORCO") {
        const cleanMotivo = (existingCI.motivo || "").replace(/\s*\([^)]*\)\s*$/, "").trim();
        if (["LUBRIFICAÇÃO", "TROCA DE ÓLEO", "REVISÃO"].includes(cleanMotivo.toUpperCase())) {
          setFormMotivoReforco(cleanMotivo.toUpperCase());
          setFormOutroMotivoReforco("");
        } else {
          setFormMotivoReforco("OUTRO");
          setFormOutroMotivoReforco(cleanMotivo);
        }
      } else {
        setFormMotivoReforco("LUBRIFICAÇÃO");
        setFormOutroMotivoReforco("");
      }
    } else {
      // Valores padrão para novo cadastro
      setModalCategory("OFICINA");
      setFormSetor("MECANICA");
      setFormTipoPreventiva("REVISAO_GERAL");
      setFormHoraReforco("07:15");
      setFormLetraReforco("A");
      setFormMotivoReforco("LUBRIFICAÇÃO");
      setFormOutroMotivoReforco("");
      setFormMotivo("");
      setFormResponsavel("Oficina Mecânica");
      setFormGravidade("ALTA");
      setFormDataBloqueio(new Date().toISOString().split("T")[0]);
    }

    setIsReleasing(false);
    setDialogOpen(true);
  };

  // Salvar / Atualizar Registro de CI
  const handleSaveCI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarro) return;

    if (modalCategory === "REFORCO" && formMotivoReforco === "OUTRO" && !formOutroMotivoReforco.trim()) {
      toast.error("Por favor, informe o motivo do reforço.");
      return;
    }

    let finalMotivo = formMotivo.trim();
    if (modalCategory === "REFORCO") {
      const desc = formMotivoReforco === "OUTRO" ? formOutroMotivoReforco.trim() : formMotivoReforco;
      finalMotivo = `${desc} (${formHorarioReforco})`;
    } else if (!finalMotivo) {
      if (modalCategory === "PREVENTIVA") {
        const labels: Record<typeof formTipoPreventiva, string> = {
          PREVENTIVA: "Preventiva Periódica",
          LUBRIFICACAO: "Lubrificação Geral",
          TROCA_OLEO: "Troca de Óleo e Filtros",
          REVISAO_GERAL: "Revisão Geral Preventiva",
          SISEP: "Manutenção SISEP"
        };
        finalMotivo = labels[formTipoPreventiva];
      } else if (modalCategory === "OFICINA") {
        finalMotivo = `Setor ${formSetor}`;
      } else {
        finalMotivo = "Bloqueio Consorciada";
      }
    }

    // Mapeamento do tipo de bloqueio para manter compatibilidade com as regras de soltura
    let mappedTipo: BloqueioCarro["tipo"] = "EM_MANUTENCAO";
    if (modalCategory === "PREVENTIVA") mappedTipo = "REFORCO_REVISAO";
    else if (finalMotivo.toLowerCase().includes("motor")) mappedTipo = "BLOQUEADO_MOTOR";
    else if (finalMotivo.toLowerCase().includes("freio")) mappedTipo = "BLOQUEADO_FREIO";
    else if (finalMotivo.toLowerCase().includes("mola") || finalMotivo.toLowerCase().includes("suspens")) mappedTipo = "BLOQUEADO_MOLA";
    else if (finalMotivo.toLowerCase().includes("câmbio") || finalMotivo.toLowerCase().includes("cambio") || finalMotivo.toLowerCase().includes("transmiss")) mappedTipo = "BLOQUEADO_CAMBIO";
    else if (finalMotivo.toLowerCase().includes("elétrica") || finalMotivo.toLowerCase().includes("eletrica") || finalMotivo.toLowerCase().includes("módulo") || finalMotivo.toLowerCase().includes("modulo")) mappedTipo = "BLOQUEADO_MODULO";
    else if (finalMotivo.toLowerCase().includes("sinistro")) mappedTipo = "BLOQUEADO_SINISTRO";

    const carroGaragemFisica = fleetCars.find(c => c.prefixo === selectedCarro)?.garagem || getGaragemFisicaByCarro(selectedCarro);

    const newCI: BloqueioCarro = {
      id: `ci-${Date.now()}-${selectedCarro}`,
      prefixo: selectedCarro,
      garagem: carroGaragemFisica,
      consorciada: formConsorciada,
      categoriaPlanilha: modalCategory,
      setorOficina: modalCategory === "OFICINA" ? formSetor : undefined,
      tipoPreventiva: modalCategory === "PREVENTIVA" ? formTipoPreventiva : undefined,
      horarioReforco: modalCategory === "REFORCO" ? formHorarioReforco : undefined,
      tipo: mappedTipo,
      motivo: finalMotivo,
      data: formDataBloqueio,
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      gravidade: formGravidade,
      responsavel: formResponsavel.trim() || "Oficina Central",
      os: activeCiMap.get(selectedCarro)?.os,
      status: "BLOQUEADO"
    };

    // Atualiza a lista removendo bloqueio ativo anterior desse carro e inserindo o novo
    const cleanList = ciList.filter(item => item.prefixo !== selectedCarro || item.status === "LIBERADO");
    const updatedList = [newCI, ...cleanList];

    setCiList(updatedList);
    saveCIBloqueiosToStorage(updatedList);
    toast.success(`Carro ${selectedCarro} lançado na CI com sucesso!`);
    setDialogOpen(false);
  };

  // Liberar Carro da CI (Dar Baixa)
  const handleReleaseCar = () => {
    if (!selectedCarro) return;

    const agora = new Date();
    const dataLib = agora.toLocaleDateString("pt-BR");
    const horaLib = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

    const updatedList = ciList.map(item => {
      if (item.prefixo === selectedCarro && item.status !== "LIBERADO") {
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
    toast.success(`Carro ${selectedCarro} liberado da CI com sucesso! Agora está APTO para a soltura.`);
    setDialogOpen(false);
    setIsReleasing(false);
  };

  // Excluir CI do Carro
  const handleDeleteCI = () => {
    if (!selectedCarro) return;
    if (!confirm(`Deseja remover o registro de CI do Carro ${selectedCarro}?`)) return;

    const updatedList = ciList.filter(item => item.prefixo !== selectedCarro);
    setCiList(updatedList);
    saveCIBloqueiosToStorage(updatedList);
    toast.info(`Registro de CI do Carro ${selectedCarro} removido.`);
    setDialogOpen(false);
  };

  // Retorna informações visuais de status para o cartão do carro
  const getCarVisualInfo = (carro: string) => {
    const ci = activeCiMap.get(carro);
    if (!ci) {
      return {
        type: "apto",
        label: "Apto",
        cardClass: "bg-card border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/5",
        iconClass: "text-emerald-600 dark:text-emerald-400",
        badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
      };
    }

    if (ci.categoriaPlanilha === "PREVENTIVA") {
      return {
        type: "preventiva",
        label: ci.tipoPreventiva ? ci.tipoPreventiva.replace("_", " ") : "Preventiva",
        cardClass: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-400/60 dark:border-blue-800 hover:border-blue-500",
        iconClass: "text-blue-600 dark:text-blue-400",
        badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25"
      };
    }

    if (ci.categoriaPlanilha === "OFICINA") {
      const setorNome = ci.setorOficina || "Oficina";
      return {
        type: "oficina",
        label: setorNome,
        cardClass: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-400/60 dark:border-amber-800 hover:border-amber-500",
        iconClass: "text-amber-600 dark:text-amber-400",
        badgeClass: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25"
      };
    }

    if (ci.categoriaPlanilha === "REFORCO") {
      return {
        type: "reforco",
        label: ci.horarioReforco || "Reforço",
        cardClass: "bg-purple-50/50 dark:bg-purple-950/20 border-purple-400/60 dark:border-purple-800 hover:border-purple-500",
        iconClass: "text-purple-600 dark:text-purple-400",
        badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25"
      };
    }

    return {
      type: "bloqueado",
      label: "Bloqueado",
      cardClass: "bg-rose-50/50 dark:bg-rose-950/20 border-rose-400/60 dark:border-rose-800 hover:border-rose-500",
      iconClass: "text-rose-600 dark:text-rose-400",
      badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25"
    };
  };

  // Filtragem da Grade de Carros (baseada nos carros permitidos para a garagem)
  const filteredCars = useMemo(() => {
    return allowedCars
      .map(c => c.prefixo)
      .filter(carro => {
        // Filtro de Busca
        if (searchCarQuery.trim() && !carro.includes(searchCarQuery.trim())) {
          return false;
        }

        const ci = activeCiMap.get(carro);

        // Filtros de Status
        if (statusFilter === "BLOQUEADOS" && (!ci || ci.categoriaPlanilha === "PREVENTIVA")) return false;
        if (statusFilter === "APTOS" && ci) return false;
        if (statusFilter === "PREVENTIVAS" && (!ci || ci.categoriaPlanilha !== "PREVENTIVA")) return false;
        if (statusFilter === "OFICINA" && (!ci || ci.categoriaPlanilha !== "OFICINA")) return false;

        return true;
      });
  }, [allowedCars, searchCarQuery, statusFilter, activeCiMap]);

  // Carro ativo sob análise no popup
  const currentCI = selectedCarro ? activeCiMap.get(selectedCarro) : undefined;

  return (
    <div className="space-y-5">
      
      {/* ========================================================= */}
      {/* CABEÇALHO DA TELA DE CI */}
      {/* ========================================================= */}
      <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                CI - SOLICITAÇÃO DE VEÍCULOS
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                CGU.REG.MT0005
              </span>

              {/* Badge indicando a garagem fixa do usuário logado */}
              {userGaragemFixa && !isAdmin && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                  GARAGEM: {userGaragemFixa === "VCM" ? "GARAGEM 1 (VCM)" : "GARAGEM 2 (VCG)"}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
              Controle de CI & Bloqueios da Frota
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Selecione qualquer veículo na grade para registrar ou liberar solicitações de manutenção e bloqueios.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor de Garagem Exclusivo para Administrador */}
          {isAdmin && (
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border text-xs mr-1">
              <span className="text-[10px] font-bold text-muted-foreground px-1 uppercase font-mono">Filtro:</span>
              {(["TODAS", "VCG", "VCM"] as const).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setAdminGaragemFiltro(g)}
                  className={cn(
                    "px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold transition-all",
                    adminGaragemFiltro === g
                      ? "bg-background text-foreground shadow-xs border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {g === "TODAS" ? "Todas" : g === "VCM" ? "Garagem 1 (VCM)" : "Garagem 2 (VCG)"}
                </button>
              ))}
            </div>
          )}

          <Button
            variant={viewMode === "GRID" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("GRID")}
            className="gap-1.5 h-9 text-xs font-semibold"
          >
            <Layers className="w-3.5 h-3.5" />
            Grade de Carros
          </Button>

          <Button
            variant={viewMode === "PLANILHA" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("PLANILHA")}
            className="gap-1.5 h-9 text-xs font-semibold"
          >
            <FileText className="w-3.5 h-3.5" />
            Planilha Oficial CGU
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 h-9 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CARDS DE RESUMO OPERACIONAL COM AÇÃO 'CONFERIR >' */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 print:hidden">
        
        {/* CARD 1: Frota Total */}
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={cn(
            "group text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md",
            statusFilter === "ALL"
              ? "bg-primary/5 border-primary ring-2 ring-primary/40 shadow-xs"
              : "bg-card border-border/80 hover:border-primary/40"
          )}
        >
          <div>
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 text-primary" />
              Frota Total
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-foreground">{stats.totalFrota}</span>
              <span className="text-xs text-muted-foreground">veículos</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 mt-2 border-t border-border/40">
            <span className="text-[11px] font-medium text-muted-foreground">
              {statusFilter === "ALL" ? "Exibindo todos" : "Ver todos"}
            </span>
            <span className={cn(
              "flex items-center gap-0.5 text-[11px] font-semibold transition-transform group-hover:translate-x-0.5",
              statusFilter === "ALL" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )}>
              Conferir <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </button>

        {/* CARD 2: Na CI / Retidos */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "BLOQUEADOS" ? "ALL" : "BLOQUEADOS")}
          className={cn(
            "group text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md",
            statusFilter === "BLOQUEADOS"
              ? "bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/50 shadow-xs"
              : "bg-rose-500/10 border-rose-500/20 hover:border-rose-500/50"
          )}
        >
          <div>
            <span className="text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              Na CI / Retidos
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.totalNaCI}</span>
              <span className="text-xs text-rose-700/70 dark:text-rose-300/70">veículos</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 mt-2 border-t border-rose-500/20">
            <span className="text-[11px] font-medium text-rose-700/80 dark:text-rose-300/80">
              {statusFilter === "BLOQUEADOS" ? "Filtro ativo" : "Filtrar"}
            </span>
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 group-hover:underline transition-transform group-hover:translate-x-0.5">
              Conferir <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </button>

        {/* CARD 3: Preventivas / Revisão */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "PREVENTIVAS" ? "ALL" : "PREVENTIVAS")}
          className={cn(
            "group text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md",
            statusFilter === "PREVENTIVAS"
              ? "bg-blue-500/15 border-blue-500 ring-2 ring-blue-500/50 shadow-xs"
              : "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50"
          )}
        >
          <div>
            <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Preventivas / Revisão
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.preventivasCount}</span>
              <span className="text-xs text-blue-700/70 dark:text-blue-300/70">carros</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 mt-2 border-t border-blue-500/20">
            <span className="text-[11px] font-medium text-blue-700/80 dark:text-blue-300/80">
              {statusFilter === "PREVENTIVAS" ? "Filtro ativo" : "Filtrar"}
            </span>
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 group-hover:underline transition-transform group-hover:translate-x-0.5">
              Conferir <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </button>

        {/* CARD 4: Setores / Oficinas */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "OFICINA" ? "ALL" : "OFICINA")}
          className={cn(
            "group text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md",
            statusFilter === "OFICINA"
              ? "bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/50 shadow-xs"
              : "bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50"
          )}
        >
          <div>
            <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-500" />
              Setores / Oficinas
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.oficinasCount}</span>
              <span className="text-xs text-amber-700/70 dark:text-amber-300/70">em oficina</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 mt-2 border-t border-amber-500/20">
            <span className="text-[11px] font-medium text-amber-700/80 dark:text-amber-300/80">
              {statusFilter === "OFICINA" ? "Filtro ativo" : "Filtrar"}
            </span>
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 group-hover:underline transition-transform group-hover:translate-x-0.5">
              Conferir <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </button>

        {/* CARD 5: Aptos / Liberados */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "APTOS" ? "ALL" : "APTOS")}
          className={cn(
            "group text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md",
            statusFilter === "APTOS"
              ? "bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/50 shadow-xs"
              : "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50"
          )}
        >
          <div>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Aptos / Liberados
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.aptos}</span>
              <span className="text-xs text-emerald-700/70 dark:text-emerald-300/70">prontos p/ pista</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 mt-2 border-t border-emerald-500/20">
            <span className="text-[11px] font-medium text-emerald-700/80 dark:text-emerald-300/80">
              {statusFilter === "APTOS" ? "Filtro ativo" : "Filtrar"}
            </span>
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline transition-transform group-hover:translate-x-0.5">
              Conferir <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </button>

      </div>

      {/* ========================================================= */}
      {/* MODO 1: GRADE DE CARROS */}
      {/* ========================================================= */}
      <div className={cn("space-y-4 print:hidden", viewMode !== "GRID" && "hidden")}>
          
          {/* BARRA DE BUSCA E STATUS DO FILTRO */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Input de Busca */}
            <div className="relative w-full sm:w-80">
              <Input
                placeholder="Buscar número do carro..."
                value={searchCarQuery}
                onChange={(e) => setSearchCarQuery(e.target.value)}
                className="w-full bg-background pr-8 h-9 text-xs"
              />
              {searchCarQuery && (
                <button
                  type="button"
                  onClick={() => setSearchCarQuery("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground/60 hover:text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Indicador de Filtro Ativo */}
            {statusFilter !== "ALL" && (
              <div className="flex items-center gap-2 text-xs bg-muted/40 px-3 py-1.5 rounded-lg border w-full sm:w-auto justify-between sm:justify-start">
                <span className="text-muted-foreground">
                  Filtrando: <strong className="text-foreground">
                    {statusFilter === "BLOQUEADOS" && "Na CI / Retidos"}
                    {statusFilter === "PREVENTIVAS" && "Preventivas / Revisão"}
                    {statusFilter === "OFICINA" && "Setores / Oficinas"}
                    {statusFilter === "APTOS" && "Aptos / Liberados"}
                  </strong> ({filteredCars.length} veículos)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter("ALL")}
                  className="h-6 px-2 text-xs text-primary hover:underline font-semibold"
                >
                  Ver todos
                </Button>
              </div>
            )}
          </div>

          {/* GRADE DE CARTÕES DE CARROS (PRINT 1) */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {filteredCars.map(carro => {
              const visual = getCarVisualInfo(carro);
              return (
                <button
                  key={carro}
                  type="button"
                  onClick={() => handleCarClick(carro)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl shadow-2xs transition-all duration-150 hover:scale-[1.02] focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-center relative overflow-hidden h-20 border",
                    visual.cardClass
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Bus className={cn("h-3.5 w-3.5 shrink-0", visual.iconClass)} />
                    <span className="font-bold text-sm tracking-tight font-mono text-foreground">
                      {carro}
                    </span>
                  </div>
                  <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block leading-tight truncate max-w-[90%]", visual.badgeClass)}>
                    {visual.label}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredCars.length === 0 && (
            <div className="py-16 text-center text-muted-foreground bg-card rounded-2xl border">
              <Bus className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="font-medium text-sm">Nenhum veículo encontrado com os filtros aplicados.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchCarQuery("");
                  setStatusFilter("ALL");
                }}
                className="mt-3 text-xs"
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>

      {/* ========================================================= */}
      {/* MODO 2: ESPELHO DA PLANILHA OFICIAL IMPRESSA (PRINT 2) */}
      {/* ========================================================= */}
      <div className={cn(
        "bg-white text-slate-900 border rounded-2xl p-6 shadow-sm space-y-4 print:space-y-2.5",
        "print:p-0 print:border-none print:shadow-none print:m-0 print:w-full print:block print:text-black",
        viewMode === "PLANILHA" ? "block" : "hidden print:block"
      )}>
          
          {/* Cabeçalho da Planilha Oficial (CGU.REG.MT0005) */}
          <div className="border border-slate-400 divide-y divide-slate-400">
            <div className="flex items-center justify-between p-3 bg-slate-50">
              <div className="flex items-center gap-3">
                <Bus className="w-8 h-8 text-slate-700" />
                <div>
                  <h3 className="text-base font-extrabold tracking-tight uppercase">CONSÓRCIO GUAICURUS</h3>
                  <p className="text-[10px] text-slate-600 font-mono">OPERADOR DO TRANSPORTE COLETIVO</p>
                </div>
              </div>
              <div className="text-center flex-1">
                <h2 className="text-lg font-black uppercase tracking-wider">
                  CI - Solicitação de veículos
                </h2>
              </div>
              <div className="text-right text-[11px] font-mono">
                <strong>Número:</strong> CGU.REG.MT0005
              </div>
            </div>

            <div className="grid grid-cols-4 text-center text-[11px] divide-x divide-slate-400 py-1.5 font-semibold bg-slate-100">
              <div>DATA DA CRIAÇÃO: 10/10/2024</div>
              <div>REVISÃO Nº: 1</div>
              <div>DATA DA REVISÃO: 09/10/2025</div>
              <div>DATA: {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).toUpperCase()}</div>
            </div>
          </div>

          {/* QUADRO 1: PREVENTIVAS */}
          <div className="border border-slate-400">
            <div className="bg-slate-200 text-center text-xs font-bold py-1 border-b border-slate-400 uppercase tracking-wide">
              Preventivas
            </div>
            <div className="grid grid-cols-5 text-center text-[11px] font-bold bg-slate-100 divide-x divide-slate-400 border-b border-slate-400 py-1">
              <div>Preventiva</div>
              <div>Lubrificação</div>
              <div>Troca de óleo</div>
              <div>REVISÃO GERAL</div>
              <div>SISEP</div>
            </div>
            <div className="grid grid-cols-5 text-center text-xs divide-x divide-slate-400 min-h-[48px] p-1 font-mono">
              <div>{ciList.filter(c => c.status !== "LIBERADO" && c.categoriaPlanilha === "PREVENTIVA" && c.tipoPreventiva === "PREVENTIVA").map(c => c.prefixo).join(", ") || "—"}</div>
              <div>{ciList.filter(c => c.status !== "LIBERADO" && c.categoriaPlanilha === "PREVENTIVA" && c.tipoPreventiva === "LUBRIFICACAO").map(c => c.prefixo).join(", ") || "—"}</div>
              <div>{ciList.filter(c => c.status !== "LIBERADO" && c.categoriaPlanilha === "PREVENTIVA" && c.tipoPreventiva === "TROCA_OLEO").map(c => c.prefixo).join(", ") || "—"}</div>
              <div className="font-bold text-blue-700">{ciList.filter(c => c.status !== "LIBERADO" && c.categoriaPlanilha === "PREVENTIVA" && c.tipoPreventiva === "REVISAO_GERAL").map(c => c.prefixo).join(", ") || "—"}</div>
              <div>{ciList.filter(c => c.status !== "LIBERADO" && c.categoriaPlanilha === "PREVENTIVA" && c.tipoPreventiva === "SISEP").map(c => c.prefixo).join(", ") || "—"}</div>
            </div>
          </div>

          {/* QUADRO 2: SETORES DA OFICINA */}
          <div className="border border-slate-400">
            <div className="grid grid-cols-8 text-center text-[10px] font-bold bg-slate-200 divide-x divide-slate-400 border-b border-slate-400 py-1 uppercase">
              <div>Mecânica</div>
              <div>Elevador</div>
              <div>Elétrica</div>
              <div>Borracharia</div>
              <div>Funilaria / Pintura</div>
              <div>Tacógrafo</div>
              <div>Bilhetagem</div>
              <div>Limpeza</div>
            </div>
            <div className="grid grid-cols-8 text-center text-[10px] divide-x divide-slate-400 min-h-[80px] p-1">
              {SETORES_OFICINA.map(setor => {
                const itens = ciList.filter(c => c.status !== "LIBERADO" && c.categoriaPlanilha === "OFICINA" && c.setorOficina === setor.id);
                return (
                  <div key={setor.id} className="space-y-1">
                    {itens.length === 0 && <span className="text-slate-400">—</span>}
                    {itens.map(item => (
                      <div key={item.id || item.prefixo} className="border-b border-slate-200 pb-1">
                        <strong className="font-mono text-xs block">{item.prefixo}</strong>
                        <span className="text-[9px] text-slate-600 block">{item.motivo}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* QUADRO 3: REFORÇO COM HORÁRIO */}
          <div className="border border-slate-400">
            <div className="bg-slate-200 text-center text-xs font-bold py-1 border-b border-slate-400 uppercase tracking-wide">
              Reforço com horário
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-400 text-xs">
              <div className="p-2 space-y-1">
                {ciList.filter(c => c.status !== "LIBERADO" && c.categoriaPlanilha === "REFORCO").slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center justify-between border-b border-slate-200 py-0.5 text-[11px]">
                    <span className="font-bold font-mono">{item.horarioReforco || "07:15 - A"}</span>
                    <span>{item.motivo}</span>
                    <strong className="font-mono text-xs">{item.prefixo}</strong>
                  </div>
                ))}
              </div>
              <div className="p-2 space-y-1">
                {ciList.filter(c => c.status !== "LIBERADO" && c.categoriaPlanilha === "REFORCO").slice(5).map(item => (
                  <div key={item.id} className="flex items-center justify-between border-b border-slate-200 py-0.5 text-[11px]">
                    <span className="font-bold font-mono">{item.horarioReforco || "07:40 - M"}</span>
                    <span>{item.motivo}</span>
                    <strong className="font-mono text-xs">{item.prefixo}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QUADRO 4: BLOQUEADOS POR CONSORCIADA (VSF, VCG, JTU, VCM) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* VSF */}
            <div className="border border-slate-400">
              <div className="bg-slate-200 text-center text-xs font-bold py-1 border-b border-slate-400 uppercase">
                BLOQUEADOS VSF (Viação São Francisco)
              </div>
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr className="border-b border-slate-400 bg-slate-100 font-bold">
                    <th className="p-1 w-20">PREFIXO</th>
                    <th className="p-1">MOTIVO</th>
                    <th className="p-1 w-24">DATA BLOQUEIO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-xs">
                  {ciList.filter(c => c.status !== "LIBERADO" && (c.categoriaPlanilha === "BLOQUEADO" || !c.categoriaPlanilha) && (c.consorciada === "VSF" || (!c.consorciada && c.prefixo.startsWith("2")))).map(c => (
                    <tr key={c.id || c.prefixo}>
                      <td className="p-1 font-bold">{c.prefixo}</td>
                      <td className="p-1 font-sans text-[11px]">{c.motivo}</td>
                      <td className="p-1 text-[10px]">{c.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* VCG */}
            <div className="border border-slate-400">
              <div className="bg-slate-200 text-center text-xs font-bold py-1 border-b border-slate-400 uppercase">
                BLOQUEADOS VCG (Viação Cidade Morena)
              </div>
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr className="border-b border-slate-400 bg-slate-100 font-bold">
                    <th className="p-1 w-20">PREFIXO</th>
                    <th className="p-1">MOTIVO</th>
                    <th className="p-1 w-24">DATA BLOQUEIO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-xs">
                  {ciList.filter(c => c.status !== "LIBERADO" && (c.categoriaPlanilha === "BLOQUEADO" || !c.categoriaPlanilha) && (c.consorciada === "VCG" || (!c.consorciada && c.prefixo.startsWith("4")))).map(c => (
                    <tr key={c.id || c.prefixo}>
                      <td className="p-1 font-bold">{c.prefixo}</td>
                      <td className="p-1 font-sans text-[11px]">{c.motivo}</td>
                      <td className="p-1 text-[10px]">{c.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* JTU */}
            <div className="border border-slate-400">
              <div className="bg-slate-200 text-center text-xs font-bold py-1 border-b border-slate-400 uppercase">
                BLOQUEADOS JTU (Jaguar Transporte Urbano)
              </div>
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr className="border-b border-slate-400 bg-slate-100 font-bold">
                    <th className="p-1 w-20">PREFIXO</th>
                    <th className="p-1">MOTIVO</th>
                    <th className="p-1 w-24">DATA BLOQUEIO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-xs">
                  {ciList.filter(c => c.status !== "LIBERADO" && (c.categoriaPlanilha === "BLOQUEADO" || !c.categoriaPlanilha) && (c.consorciada === "JTU" || (!c.consorciada && c.prefixo.startsWith("3")))).map(c => (
                    <tr key={c.id || c.prefixo}>
                      <td className="p-1 font-bold">{c.prefixo}</td>
                      <td className="p-1 font-sans text-[11px]">{c.motivo}</td>
                      <td className="p-1 text-[10px]">{c.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* VCM */}
            <div className="border border-slate-400">
              <div className="bg-slate-200 text-center text-xs font-bold py-1 border-b border-slate-400 uppercase">
                BLOQUEADOS VCM (Viação Campo Grande)
              </div>
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr className="border-b border-slate-400 bg-slate-100 font-bold">
                    <th className="p-1 w-20">PREFIXO</th>
                    <th className="p-1">MOTIVO</th>
                    <th className="p-1 w-24">DATA BLOQUEIO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-xs">
                  {ciList.filter(c => c.status !== "LIBERADO" && (c.categoriaPlanilha === "BLOQUEADO" || !c.categoriaPlanilha) && (c.consorciada === "VCM" || (!c.consorciada && c.prefixo.startsWith("1")))).map(c => (
                    <tr key={c.id || c.prefixo}>
                      <td className="p-1 font-bold">{c.prefixo}</td>
                      <td className="p-1 font-sans text-[11px]">{c.motivo}</td>
                      <td className="p-1 text-[10px]">{c.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Assinatura no Rodapé */}
          <div className="pt-6 flex justify-end">
            <div className="text-center w-64 border-t border-slate-600 pt-1 text-xs">
              <strong>Manutenção / Encarregado</strong>
            </div>
          </div>

        </div>

      {/* ========================================================= */}
      {/* POPUP / DIALOG DO CARRO (PRINT 2 - RESOLVER A PLANILHA) */}
      {/* ========================================================= */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[92vh] overflow-y-auto print:hidden">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <Bus className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <span>Carro {selectedCarro}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-bold">
                      {formConsorciada}
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    CI - Solicitação de veículos • Consórcio Guaicurus
                  </DialogDescription>
                </div>
              </div>

              {/* Badge de Status Atual */}
              {currentCI ? (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  Na CI: {currentCI.motivo}
                </span>
              ) : (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Apto para Soltura
                </span>
              )}
            </div>
          </DialogHeader>

          {/* SE O CARRO JÁ ESTÁ NA CI: EXIBIR DETALHES E OPÇÃO DE BAIXA/LIBERAÇÃO */}
          {currentCI && (
            <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <strong className="text-xs font-bold text-rose-800 dark:text-rose-300">
                    Bloqueio Ativo Registrado na CI
                  </strong>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteCI}
                    className="h-7 text-xs gap-1 text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950"
                  >
                    <Trash2 className="w-3 h-3" />
                    Excluir CI
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsReleasing(!isReleasing)}
                    className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isReleasing ? "Cancelar Baixa" : "Liberar Carro (Dar Baixa)"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-rose-200/60 dark:border-rose-900/40">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Categoria:</span>
                  <strong className="font-semibold">{currentCI.categoriaPlanilha || "Bloqueio Consorciada"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Motivo:</span>
                  <strong className="font-semibold">{currentCI.motivo}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Data de Entrada:</span>
                  <strong className="font-semibold">{currentCI.data}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Responsável:</span>
                  <strong className="font-semibold">{currentCI.responsavel || "Oficina Central"}</strong>
                </div>
              </div>

              {/* Sub-painel para confirmar liberação imediata */}
              {isReleasing && (
                <div className="bg-background border rounded-lg p-3 space-y-2.5 animate-in fade-in-50 duration-150">
                  <strong className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Confirmar Liberação do Veículo para a Pista
                  </strong>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">Motivo do Encerramento / Laudo</Label>
                      <Input
                        value={releaseMotivo}
                        onChange={(e) => setReleaseMotivo(e.target.value)}
                        className="h-8 text-xs mt-1"
                        placeholder="Ex: Peça substituída e aprovada em teste"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Encarregado / Responsável</Label>
                      <Input
                        value={releaseResponsavel}
                        onChange={(e) => setReleaseResponsavel(e.target.value)}
                        className="h-8 text-xs mt-1"
                        placeholder="Ex: Chefe de Oficina"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleReleaseCar}
                      className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Concluir Baixa & Liberar Carro
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FORMULÁRIO COMPLETO DAS 4 SEÇÕES DA PLANILHA FÍSICA (PRINT 2) */}
          <form onSubmit={handleSaveCI} className="space-y-4">
            
            {/* Seletor de Categoria da Planilha (4 Quadrantes do Print 2) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">
                Seção da Planilha de Solicitação de Veículos <span className="text-rose-500">*</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: "OFICINA", label: "Setores da Oficina", icon: Wrench },
                    { id: "PREVENTIVA", label: "Preventivas", icon: Calendar },
                    { id: "REFORCO", label: "Reforço com Horário", icon: Clock },
                    { id: "BLOQUEADO", label: "Bloqueio Consorciada", icon: ShieldAlert },
                  ] as const
                ).map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setModalCategory(cat.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1",
                        modalCategory === cat.id
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-card hover:bg-muted/60 text-muted-foreground border-border"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold leading-tight">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SEÇÃO 1: SETORES DA OFICINA COM MOTIVO */}
            {modalCategory === "OFICINA" && (
              <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Setor / Oficina Responsável</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {SETORES_OFICINA.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setFormSetor(s.id);
                          setFormResponsavel(`Oficina ${s.label}`);
                        }}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg border text-xs font-semibold text-center transition-all",
                          formSetor === s.id
                            ? "bg-amber-500 text-white border-amber-600 shadow-2xs font-bold"
                            : "bg-background text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Motivos rápidos sugeridos do setor */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Motivos comuns deste setor (clique para preencher):</Label>
                  <div className="flex flex-wrap gap-1">
                    {SETORES_OFICINA.find(s => s.id === formSetor)?.chips.map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setFormMotivo(chip)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-background border hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 2: PREVENTIVAS */}
            {modalCategory === "PREVENTIVA" && (
              <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Tipo de Preventiva (Colunas da Planilha)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {(
                      [
                        { id: "PREVENTIVA", label: "Preventiva" },
                        { id: "LUBRIFICACAO", label: "Lubrificação" },
                        { id: "TROCA_OLEO", label: "Troca de Óleo" },
                        { id: "REVISAO_GERAL", label: "Revisão Geral" },
                        { id: "SISEP", label: "SISEP" },
                      ] as const
                    ).map(tp => (
                      <button
                        key={tp.id}
                        type="button"
                        onClick={() => {
                          setFormTipoPreventiva(tp.id);
                          setFormMotivo(tp.label);
                        }}
                        className={cn(
                          "px-2 py-1.5 rounded-lg border text-xs font-semibold text-center transition-all",
                          formTipoPreventiva === tp.id
                            ? "bg-blue-600 text-white border-blue-700 shadow-2xs font-bold"
                            : "bg-background text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 3: REFORÇO COM HORÁRIO */}
            {modalCategory === "REFORCO" && (
              <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
                {/* Inputs de Horário e Letra (A, B, C, D, M) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Horário do Reforço</Label>
                    <Input
                      type="time"
                      value={formHoraReforco}
                      onChange={(e) => setFormHoraReforco(e.target.value)}
                      className="h-9 text-xs font-mono font-bold bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Letra / Turno do Reforço</Label>
                    <select
                      value={formLetraReforco}
                      onChange={(e) => setFormLetraReforco(e.target.value as any)}
                      className="w-full h-9 px-3 rounded-lg border bg-background text-xs font-bold font-mono focus:outline-hidden"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="M">M</option>
                    </select>
                  </div>
                </div>

                {/* Motivo do Reforço com cards rápidos e opção OUTRO */}
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-bold">Motivo do Reforço</Label>
                  <div className="flex flex-wrap gap-2">
                    {(["LUBRIFICAÇÃO", "TROCA DE ÓLEO", "REVISÃO", "OUTRO"] as const).map(mot => (
                      <button
                        key={mot}
                        type="button"
                        onClick={() => {
                          setFormMotivoReforco(mot);
                          if (mot !== "OUTRO") {
                            setFormMotivo(mot);
                          } else {
                            setFormMotivo(formOutroMotivoReforco);
                          }
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                          formMotivoReforco === mot
                            ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs font-bold dark:bg-emerald-600"
                            : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {mot}
                      </button>
                    ))}
                  </div>

                  {/* Input condicional exibido apenas quando OUTRO for selecionado */}
                  {formMotivoReforco === "OUTRO" && (
                    <div className="pt-2 space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Descreva o Motivo do Reforço <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        value={formOutroMotivoReforco}
                        onChange={(e) => {
                          setFormOutroMotivoReforco(e.target.value);
                          setFormMotivo(e.target.value);
                        }}
                        placeholder="Digite o motivo do reforço..."
                        className="text-xs h-9 bg-background"
                        autoFocus
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SEÇÃO 4: BLOQUEADOS POR CONSORCIADA */}
            {modalCategory === "BLOQUEADO" && (
              <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Consorciada Guaicurus (Garagem)</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      [
                        { id: "VSF", label: "VSF (São Francisco)" },
                        { id: "VCG", label: "VCG (Cidade Morena)" },
                        { id: "JTU", label: "JTU (Jaguar)" },
                        { id: "VCM", label: "VCM (Campo Grande)" },
                      ] as const
                    ).map(cons => (
                      <button
                        key={cons.id}
                        type="button"
                        onClick={() => setFormConsorciada(cons.id)}
                        className={cn(
                          "px-2 py-1.5 rounded-lg border text-xs font-semibold text-center transition-all",
                          formConsorciada === cons.id
                            ? "bg-rose-600 text-white border-rose-700 shadow-2xs font-bold"
                            : "bg-background text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {cons.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chips de motivos de bloqueio comuns do print 2 */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Motivos de bloqueio da folha:</Label>
                  <div className="flex flex-wrap gap-1">
                    {BLOQUEIOS_MOTIVOS_RAPIDOS.map(mot => (
                      <button
                        key={mot}
                        type="button"
                        onClick={() => setFormMotivo(mot)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-background border hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        + {mot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CAMPO DE MOTIVO DETALHADO (Apenas para Oficinas, Preventivas e Bloqueados; na aba Reforço o motivo já é definido nos cards/outro) */}
            {modalCategory !== "REFORCO" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  Motivo / Defeito / Observações da Solicitação <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formMotivo}
                  onChange={(e) => setFormMotivo(e.target.value)}
                  placeholder="Ex: Suspensão, Módulo, Motor, Sinistro, Revisão Geral..."
                  className="text-xs h-9"
                  required
                />
              </div>
            )}

            {/* CAMPOS COMPLEMENTARES: DATA DO BLOQUEIO E RESPONSÁVEL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Data da Solicitação / Bloqueio</Label>
                <Input
                  type="date"
                  value={formDataBloqueio}
                  onChange={(e) => setFormDataBloqueio(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Responsável / Oficina</Label>
                <Input
                  value={formResponsavel}
                  onChange={(e) => setFormResponsavel(e.target.value)}
                  placeholder="Ex: Mecânica Geral"
                  className="text-xs h-8"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t flex flex-row items-center justify-between sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="text-xs"
              >
                Fechar
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="bg-primary text-primary-foreground text-xs font-semibold gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  Salvar Solicitação do Carro {selectedCarro}
                </Button>
              </div>
            </DialogFooter>

          </form>

        </DialogContent>
      </Dialog>

    </div>
  );
}
