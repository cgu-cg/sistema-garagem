import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  ManutencaoCarroItem, 
  getManutencaoData, 
  saveManutencaoData, 
  subscribeManutencaoUpdates,
  syncItemsWithCI,
  getConsorciadaByPrefix,
  fetchManutencaoDataFromApi,
  deleteManutencaoCarroApi,
  resetManutencaoSeedApi,
  getTodayString,
  STORAGE_KEY_MANUTENCAO_PREFIX
} from "./manutencaoManager";
import { 
  getInitialCIBloqueios, 
  saveCIBloqueiosToStorage, 
  subscribeCIUpdates,
  getGaragemFisicaByCarro,
  fetchCIBloqueiosFromApi
} from "@/pages/soltura/ciManager";
import { useAuth } from "@/stores/auth";
import { INVENTORY_CARS } from "@/data/inventoryCars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  AlertTriangle, 
  CheckCircle2, 
  MoreVertical, 
  Ban, 
  FileText, 
  Download,
  ChevronDown,
  X,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

const SUGESTOES_OBS = [
  "MOTOR", "MECÂNICA", "SINISTRO", "CÂMBIO", "MODULO", "COXIM MOTOR", 
  "VIDRO DA JANELA", "RADIADOR", "REVISAO", "FALHANDO", "ALTERNADOR", 
  "ALINHAMENTO", "TACOGRAFO", "ELEVADOR", "VIDRO BOLHA", "FREIO", "SUSPENSÃO"
];

export function ManutencaoPage() {
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

  // Seletor de Garagem:
  // Usuário de garagem fixa fica travado em sua garagem (ex: VCG).
  // Se for ADMIN geral, permite alternar entre TODAS, VCG ou VCM (padrão VCG)
  const [activeGaragem, setActiveGaragem] = useState<"TODAS" | "VCG" | "VCM">(() => {
    if (user?.garagem === "VCM" || user?.email?.toLowerCase().includes("vcm")) return "VCM";
    return "VCG";
  });

  useEffect(() => {
    if (userGaragemFixa) {
      setActiveGaragem(userGaragemFixa);
    }
  }, [userGaragemFixa]);

  // Data selecionada (inicia sempre na data atual do dia)
  const [dataOperacao, setDataOperacao] = useState<string>(getTodayString);
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  // Lista de carros de manutenção do dia
  const [items, setItems] = useState<ManutencaoCarroItem[]>(() => getManutencaoData(getTodayString()));

  // Filtro de Empresa / Consorciada (Todas, VCG, JTU, VSF, VCM)
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("TODAS");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal de Adicionar Carro
  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalStatusOrigem, setModalStatusOrigem] = useState<"BLOQUEADO" | "EM_EXECUCAO" | "LIBERADO">("BLOQUEADO");
  const [newPrefixo, setNewPrefixo] = useState("");
  const [newObservacao, setNewObservacao] = useState("");
  const [newBloqueado, setNewBloqueado] = useState(false);
  const [newEmExecucao, setNewEmExecucao] = useState(false);
  const [newLiberado, setNewLiberado] = useState(true);

  // Estados do seletor moderno de veículos no modal
  const [carSelectorOpen, setCarSelectorOpen] = useState(false);
  const [carFilterCompany, setCarFilterCompany] = useState<string>("TODAS");
  const carSelectorRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown de veículos ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (carSelectorRef.current && !carSelectorRef.current.contains(event.target as Node)) {
        setCarSelectorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Modal de Visualização de Relatório
  const [modalRelatorioOpen, setModalRelatorioOpen] = useState(false);

  // Modal de Edição de Observação
  const [editItem, setEditItem] = useState<ManutencaoCarroItem | null>(null);
  const [editObs, setEditObs] = useState("");

  // Estilização dinâmica do modal de inserção de acordo com o card de origem
  const modalStyle = useMemo(() => {
    if (modalStatusOrigem === "EM_EXECUCAO") {
      return {
        label: "Em Manutenção",
        title: "Adicionar Carro em Manutenção",
        buttonText: "Inserir em Manutenção",
        iconColor: "text-amber-600 dark:text-amber-400",
        badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800",
        btnClass: "bg-amber-600 hover:bg-amber-700 text-white",
        borderClass: "border-amber-500/30 dark:border-amber-500/20",
        headerBg: "bg-amber-50/60 dark:bg-amber-950/20",
        icon: Wrench
      };
    }
    if (modalStatusOrigem === "LIBERADO") {
      return {
        label: "Liberado",
        title: "Adicionar Carro Liberado",
        buttonText: "Inserir Liberado",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
        btnClass: "bg-[#164E3A] hover:bg-[#113C2D] text-white",
        borderClass: "border-emerald-500/30 dark:border-emerald-500/20",
        headerBg: "bg-emerald-50/60 dark:bg-emerald-950/20",
        icon: CheckCircle2
      };
    }
    return {
      label: "Bloqueado",
      title: "Adicionar Carro Bloqueado",
      buttonText: "Inserir Bloqueado",
      iconColor: "text-rose-600 dark:text-rose-400",
      badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800",
      btnClass: "bg-rose-600 hover:bg-rose-700 text-white",
      borderClass: "border-rose-500/30 dark:border-rose-500/20",
      headerBg: "bg-rose-50/60 dark:bg-rose-950/20",
      icon: Ban
    };
  }, [modalStatusOrigem]);

  interface EditModalStyleType {
    label: string;
    btnClass: string;
    badgeClass: string;
    iconColor: string;
    borderClass: string;
  }

  // Estilização dinâmica do modal de edição de acordo com o status do carro
  const editModalStyle = useMemo<EditModalStyleType | null>(() => {
    if (!editItem) return null;
    if (editItem.emExecucao && !editItem.liberado) {
      return {
        label: "Em Manutenção",
        btnClass: "bg-amber-600 hover:bg-amber-700 text-white",
        badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800",
        iconColor: "text-amber-600 dark:text-amber-400",
        borderClass: "border-amber-500/30 dark:border-amber-500/20"
      };
    }
    if (editItem.bloqueado && !editItem.liberado) {
      return {
        label: "Bloqueado",
        btnClass: "bg-rose-600 hover:bg-rose-700 text-white",
        badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800",
        iconColor: "text-rose-600 dark:text-rose-400",
        borderClass: "border-rose-500/30 dark:border-rose-500/20"
      };
    }
    return {
      label: "Liberado",
      btnClass: "bg-[#164E3A] hover:bg-[#113C2D] text-white",
      badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderClass: "border-emerald-500/30 dark:border-emerald-500/20"
    };
  }, [editItem]);

  // Sincronização em tempo real via storage, banco de dados (API) e custom events (Manutenção e CI)
  useEffect(() => {
    let isMounted = true;

    // 1. Carrega imediatamente os dados locais disponíveis
    const localList = getManutencaoData(dataOperacao);
    setItems(localList);

    // 2. Consulta coordenada à API oficial da Manutenção e CI
    Promise.all([
      fetchManutencaoDataFromApi(dataOperacao),
      fetchCIBloqueiosFromApi()
    ]).then(([apiList, latestCI]) => {
      if (!isMounted) return;

      const ciSource = (Array.isArray(latestCI) && latestCI.length > 0)
        ? latestCI
        : getInitialCIBloqueios();

      const baseList = (Array.isArray(apiList) && apiList.length > 0)
        ? apiList
        : localList;

      const synced = syncItemsWithCI(baseList, ciSource, dataOperacao);
      setItems(synced);

      // Atualiza o cache da data no localStorage silenciosamente
      try {
        localStorage.setItem(`${STORAGE_KEY_MANUTENCAO_PREFIX}${dataOperacao}`, JSON.stringify(synced));
      } catch {}
    }).catch(err => {
      console.warn("[Manutenção] Erro ao carregar dados oficiais da API:", err);
    });

    const unsubscribeManut = subscribeManutencaoUpdates((detail) => {
      if (isMounted && detail.data === dataOperacao) {
        setItems(detail.items);
      }
    });

    const unsubscribeCI = subscribeCIUpdates((updatedCI) => {
      if (isMounted && Array.isArray(updatedCI)) {
        setItems(prevItems => syncItemsWithCI(prevItems, updatedCI, dataOperacao));
      }
    });

    return () => {
      isMounted = false;
      unsubscribeManut();
      unsubscribeCI();
    };
  }, [dataOperacao]);

  // 1. Filtragem estrita por Garagem Física do Usuário (VCG: frotas 2xxx exceto 2002, 3xxx e 4xxx / VCM: frotas 1xxx e 2002)
  const itemsByGaragem = useMemo(() => {
    if (activeGaragem === "TODAS") return items;
    return items.filter(it => getGaragemFisicaByCarro(it.prefixo) === activeGaragem);
  }, [items, activeGaragem]);

  // Empresas disponíveis na garagem ativa
  const empresasDisponiveis = useMemo(() => {
    if (activeGaragem === "VCG") {
      return ["TODAS", "VCG", "JTU", "VSF"] as const;
    }
    if (activeGaragem === "VCM") {
      return ["TODAS", "VCM"] as const;
    }
    return ["TODAS", "VCG", "JTU", "VSF", "VCM"] as const;
  }, [activeGaragem]);

  // Ajusta a empresa selecionada se não for aplicável à garagem ativa
  useEffect(() => {
    if (!empresasDisponiveis.includes(selectedEmpresa as any)) {
      setSelectedEmpresa("TODAS");
    }
  }, [activeGaragem, empresasDisponiveis, selectedEmpresa]);

  // Auxiliar para verificar se o carro pertence à empresa selecionada
  const matchesEmpresa = (item: ManutencaoCarroItem, emp: string) => {
    if (emp === "TODAS") return true;
    const cons = item.consorciada || getConsorciadaByPrefix(item.prefixo);
    if (emp === "VCG") {
      return cons === "VCG" || (!cons && item.prefixo.startsWith("4"));
    }
    if (emp === "JTU") {
      return cons === "JTU" || item.prefixo.startsWith("3");
    }
    if (emp === "VSF") {
      return cons === "VSF" || item.prefixo.startsWith("2");
    }
    if (emp === "VCM") {
      return cons === "VCM" || item.prefixo.startsWith("1");
    }
    return true;
  };

  // Contagem de veículos por empresa no dia dentro da garagem ativa
  const empresaCounts = useMemo(() => {
    const counts: Record<string, number> = { TODAS: itemsByGaragem.length, VCG: 0, JTU: 0, VSF: 0, VCM: 0 };
    itemsByGaragem.forEach(it => {
      const cons = it.consorciada || getConsorciadaByPrefix(it.prefixo);
      if (cons === "VCG" || it.prefixo.startsWith("4")) {
        counts.VCG = (counts.VCG || 0) + 1;
      } else if (cons === "JTU" || it.prefixo.startsWith("3")) {
        counts.JTU = (counts.JTU || 0) + 1;
      } else if (cons === "VSF" || it.prefixo.startsWith("2")) {
        counts.VSF = (counts.VSF || 0) + 1;
      } else if (cons === "VCM" || it.prefixo.startsWith("1")) {
        counts.VCM = (counts.VCM || 0) + 1;
      }
    });
    return counts;
  }, [itemsByGaragem]);

  // Itens da garagem filtrados pela empresa selecionada
  const itemsByEmpresa = useMemo(() => {
    return itemsByGaragem.filter(it => matchesEmpresa(it, selectedEmpresa));
  }, [itemsByGaragem, selectedEmpresa]);

  // Veículos disponíveis para sugestão e cadastro no modal, estritamente da garagem do usuário
  const availableInventoryCars = useMemo(() => {
    return INVENTORY_CARS.filter(car => {
      // Restringe à Garagem Física
      if (activeGaragem !== "TODAS") {
        if (getGaragemFisicaByCarro(car) !== activeGaragem) return false;
      }
      // Se houver empresa selecionada (ex: VCG, JTU ou VSF), restringe também
      if (selectedEmpresa !== "TODAS") {
        const cons = getConsorciadaByPrefix(car);
        if (selectedEmpresa === "VCG" && cons !== "VCG") return false;
        if (selectedEmpresa === "JTU" && cons !== "JTU") return false;
        if (selectedEmpresa === "VSF" && cons !== "VSF") return false;
        if (selectedEmpresa === "VCM" && cons !== "VCM") return false;
      }
      return true;
    });
  }, [activeGaragem, selectedEmpresa]);

  // Veículos pertencentes à Garagem Física do usuário (para cadastro)
  const carsOfGaragem = useMemo(() => {
    return INVENTORY_CARS.filter(car => {
      if (activeGaragem !== "TODAS") {
        if (getGaragemFisicaByCarro(car) !== activeGaragem) return false;
      }
      return true;
    });
  }, [activeGaragem]);

  // Veículos filtrados para o dropdown de seleção do modal
  const filteredAvailableCars = useMemo(() => {
    return carsOfGaragem.filter(car => {
      // Filtro por empresa do modal
      if (carFilterCompany !== "TODAS") {
        const cons = getConsorciadaByPrefix(car);
        if (carFilterCompany !== cons) return false;
      }
      // Filtro por busca digitada
      if (newPrefixo.trim()) {
        const search = newPrefixo.trim().toLowerCase();
        if (!car.toLowerCase().includes(search)) return false;
      }
      return true;
    });
  }, [carsOfGaragem, carFilterCompany, newPrefixo]);

  // Retorna o status do carro na folha do dia (se já estiver lançado)
  const getCarStatusOnCurrentSheet = (prefixo: string) => {
    const found = items.find(it => it.prefixo === prefixo);
    if (!found) return null;
    if (found.emExecucao && !found.liberado) return "EM_EXECUCAO";
    if (found.bloqueado && !found.liberado) return "BLOQUEADO";
    if (found.liberado) return "LIBERADO";
    return null;
  };

  // Cálculos de Resumo dos 4 cards de KPI com base na frota completa da garagem relacionada ao login
  const stats = useMemo(() => {
    let bloqueados = 0;
    let emExecucao = 0;
    let liberados = 0;

    itemsByEmpresa.forEach(item => {
      if (item.emExecucao && !item.liberado) {
        emExecucao++;
      } else if (item.bloqueado && !item.liberado) {
        bloqueados++;
      } else {
        liberados++;
      }
    });

    // Frota completa da garagem ativa do login (e filtrada pela empresa se selecionada)
    const totalFrota = availableInventoryCars.length || 1;

    // Percentuais calculados com base na frota completa cadastrada da garagem
    const pctBloqueados = Math.round((bloqueados / totalFrota) * 100);
    const pctEmExecucao = Math.round((emExecucao / totalFrota) * 100);

    // Veículos aptos para a pista (frota total menos retidos em oficina/bloqueio)
    const prontosParaPista = Math.max(0, totalFrota - bloqueados - emExecucao);
    const pctLiberados = Math.round((prontosParaPista / totalFrota) * 100);

    return {
      bloqueados,
      emExecucao,
      liberados,
      prontosParaPista,
      totalPlanilha: itemsByEmpresa.length,
      totalFrota: availableInventoryCars.length,
      total: availableInventoryCars.length,
      pctBloqueados,
      pctEmExecucao,
      pctLiberados
    };
  }, [itemsByEmpresa, availableInventoryCars]);

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
    const origin = status || "BLOQUEADO";
    setModalStatusOrigem(origin);
    if (origin === "BLOQUEADO") {
      setNewBloqueado(true);
      setNewEmExecucao(false);
      setNewLiberado(false);
    } else if (origin === "EM_EXECUCAO") {
      setNewBloqueado(true);
      setNewEmExecucao(true);
      setNewLiberado(false);
    } else {
      setNewBloqueado(false);
      setNewEmExecucao(false);
      setNewLiberado(true);
    }
    setNewPrefixo("");
    setNewObservacao("");
    setCarSelectorOpen(false);
    setCarFilterCompany(selectedEmpresa !== "TODAS" ? selectedEmpresa : "TODAS");
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

    const carroGaragem = getGaragemFisicaByCarro(cleanPrefix);
    if (activeGaragem !== "TODAS" && carroGaragem !== activeGaragem) {
      toast.error(`O veículo ${cleanPrefix} pertence à Garagem ${carroGaragem}. Seu acesso está restrito à Garagem ${activeGaragem}.`);
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
    deleteManutencaoCarroApi(id);

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

  // Restaurar / Sincronizar dados oficiais diretamente do SQL Server
  const handleResetSeed = async () => {
    try {
      const res = await resetManutencaoSeedApi(dataOperacao);
      if (res && Array.isArray(res)) {
        setItems(res);
        saveManutencaoData(dataOperacao, res);
        toast.success(`Folha sincronizada com a CI (${res.length} bloqueados).`);
        return;
      }
    } catch {}

    const currentCI = getInitialCIBloqueios();
    const bloqOnly: ManutencaoCarroItem[] = currentCI
      .filter(c => c.status !== "LIBERADO" && c.prefixo)
      .map(c => {
        const clean = c.prefixo.replace(/\D/g, "");
        return {
          id: `manut-ci-${clean}`,
          prefixo: clean,
          consorciada: c.consorciada || getConsorciadaByPrefix(clean),
          observacao: c.motivo || "",
          bloqueado: true,
          emExecucao: false,
          liberado: false,
          data: dataOperacao
        };
      });
    setItems(bloqOnly);
    saveManutencaoData(dataOperacao, bloqOnly);
    toast.success("Folha sincronizada apenas com os bloqueados da CI.");
  };

  // Filtragem por empresa e busca textual
  const filteredItems = useMemo(() => {
    return itemsByEmpresa.filter(item => {
      // Busca por prefixo ou observação/defeito
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchPref = item.prefixo.toLowerCase().includes(q);
        const matchObs = item.observacao.toLowerCase().includes(q);
        if (!matchPref && !matchObs) return false;
      }

      return true;
    });
  }, [itemsByEmpresa, searchQuery]);

  // Listas dos 3 quadros ordenadas estritamente por número de carro (ordem numérica crescente)
  const sortedBloqueados = useMemo(() => {
    return filteredItems
      .filter(it => it.bloqueado && !it.emExecucao && !it.liberado)
      .sort((a, b) => a.prefixo.localeCompare(b.prefixo, undefined, { numeric: true }));
  }, [filteredItems]);

  const sortedEmExecucao = useMemo(() => {
    return filteredItems
      .filter(it => it.emExecucao && !it.liberado)
      .sort((a, b) => a.prefixo.localeCompare(b.prefixo, undefined, { numeric: true }));
  }, [filteredItems]);

  const sortedLiberados = useMemo(() => {
    return filteredItems
      .filter(it => it.liberado || (!it.bloqueado && !it.emExecucao))
      .sort((a, b) => a.prefixo.localeCompare(b.prefixo, undefined, { numeric: true }));
  }, [filteredItems]);

  // Formatação visual da data: exibe a data completa com o ano DD/MM/AAAA
  const formattedData = useMemo(() => {
    try {
      const [ano, mes, dia] = dataOperacao.split("-");
      return `${dia}/${mes}/${ano}`;
    } catch {
      return dataOperacao;
    }
  }, [dataOperacao]);

  // Empresas a serem impressas na folha de impressão
  const empresasParaImprimir = useMemo(() => {
    if (selectedEmpresa !== "TODAS") {
      return [selectedEmpresa];
    }
    if (activeGaragem === "VCG") {
      return ["VCG", "JTU", "VSF"];
    }
    if (activeGaragem === "VCM") {
      return ["VCM"];
    }
    return ["VCG", "JTU", "VSF", "VCM"];
  }, [selectedEmpresa, activeGaragem]);

  // Download do Relatório em PDF com visual idêntico ao de impressão (3 cards paralelos por empresa)
  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Topo do Relatório Oficial (idêntico ao de impressão)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("CARROS EM: MANUTENÇÃO, BLOQUEADO, LIBERADO", 105, 12, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);
      doc.text(`DATA: ${formattedData}`, 105, 17.5, { align: "center" });

      // Linha preta divisória superior
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(12, 20.5, 198, 20.5);

      let currentY = 25;

      empresasParaImprimir.forEach((emp) => {
        const carrosEmp = itemsByGaragem.filter((it) => matchesEmpresa(it, emp));
        const bloq = carrosEmp
          .filter((it) => it.bloqueado && !it.emExecucao && !it.liberado)
          .sort((a, b) => a.prefixo.localeCompare(b.prefixo, undefined, { numeric: true }));
        const manut = carrosEmp
          .filter((it) => it.emExecucao && !it.liberado)
          .sort((a, b) => a.prefixo.localeCompare(b.prefixo, undefined, { numeric: true }));
        const lib = carrosEmp
          .filter((it) => it.liberado || (!it.bloqueado && !it.emExecucao))
          .sort((a, b) => a.prefixo.localeCompare(b.prefixo, undefined, { numeric: true }));

        const nomeEmpresa =
          emp === "VCG"
            ? "VCG - VIAÇÃO CIDADE MORENA"
            : emp === "JTU"
            ? "JTU - JAGUAR TRANSPORTE URBANO"
            : emp === "VSF"
            ? "VSF - VIAÇÃO SÃO FRANCISCO"
            : emp === "VCM"
            ? "VCM - VIAÇÃO CAMPO GRANDE"
            : emp;

        // Se faltar espaço para o bloco da empresa na folha atual, abre nova página
        if (currentY > 235) {
          doc.addPage();
          currentY = 15;
        }

        // Barra de Título da Empresa
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.3);
        doc.roundedRect(12, currentY, 186, 7.5, 1.5, 1.5, "FD");

        // Badge com a sigla da empresa
        doc.setFillColor(226, 232, 240);
        doc.setDrawColor(148, 163, 184);
        doc.roundedRect(14, currentY + 1.2, 12, 5, 1, 1, "FD");
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text(emp, 20, currentY + 4.7, { align: "center" });

        // Nome completo da empresa
        doc.setFontSize(8.5);
        doc.text(nomeEmpresa, 28, currentY + 5);

        // Total de veículos
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Total: ${carrosEmp.length} veículos`, 194, currentY + 5, { align: "right" });

        const startTableY = currentY + 9.5;
        const colWidth = 59.3;
        const gap = 4;
        const col1X = 12;
        const col2X = col1X + colWidth + gap;
        const col3X = col2X + colWidth + gap;

        // Preparar linhas de Bloqueados
        const bloqRows = bloq.length > 0
          ? bloq.map((c) => [c.prefixo, (c.observacao || "—").toUpperCase()])
          : [["—", "Nenhum veículo"]];

        // Preparar linhas de Em Manutenção
        const manutRows = manut.length > 0
          ? manut.map((c) => [c.prefixo, (c.observacao || "—").toUpperCase()])
          : [["—", "Nenhum veículo"]];

        // Preparar linhas de Liberados
        const libRows = lib.length > 0
          ? lib.map((c) => [c.prefixo, (c.observacao || "—").toUpperCase()])
          : [["—", "Nenhum veículo"]];

        // 1. Tabela Bloqueados (Coluna 1)
        autoTable(doc, {
          startY: startTableY,
          margin: { left: col1X, right: 210 - (col1X + colWidth) },
          tableWidth: colWidth,
          head: [[`BLOQUEADO (${bloq.length})`, ""]],
          body: [["Carro", "Defeito"], ...bloqRows],
          theme: "grid",
          styles: {
            fontSize: 7.2,
            cellPadding: 1.2,
            textColor: [0, 0, 0],
            lineColor: [203, 213, 225],
            lineWidth: 0.15,
          },
          headStyles: {
            fillColor: [255, 228, 230], // rose suave
            textColor: [159, 18, 57],
            fontSize: 7.8,
            fontStyle: "bold",
            halign: "center",
          },
          didParseCell: (data) => {
            if (data.section === "head") {
              if (data.column.index === 0) {
                data.cell.colSpan = 2;
              }
            } else if (data.section === "body" && data.row.index === 0) {
              data.cell.styles.fillColor = [248, 250, 252];
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [71, 85, 105];
              data.cell.styles.fontSize = 6.8;
            } else if (data.section === "body" && data.column.index === 0) {
              data.cell.styles.halign = "center";
              data.cell.styles.fontStyle = "bold";
            }
          },
          columnStyles: {
            0: { cellWidth: 16 },
            1: { cellWidth: "auto" },
          },
        });
        const finalY1 = (doc as any).lastAutoTable?.finalY || startTableY;

        // 2. Tabela Em Manutenção (Coluna 2)
        autoTable(doc, {
          startY: startTableY,
          margin: { left: col2X, right: 210 - (col2X + colWidth) },
          tableWidth: colWidth,
          head: [[`EM MANUTENÇÃO (${manut.length})`, ""]],
          body: [["Carro", "Defeito"], ...manutRows],
          theme: "grid",
          styles: {
            fontSize: 7.2,
            cellPadding: 1.2,
            textColor: [0, 0, 0],
            lineColor: [203, 213, 225],
            lineWidth: 0.15,
          },
          headStyles: {
            fillColor: [254, 243, 199], // amber suave
            textColor: [146, 64, 14],
            fontSize: 7.8,
            fontStyle: "bold",
            halign: "center",
          },
          didParseCell: (data) => {
            if (data.section === "head") {
              if (data.column.index === 0) {
                data.cell.colSpan = 2;
              }
            } else if (data.section === "body" && data.row.index === 0) {
              data.cell.styles.fillColor = [248, 250, 252];
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [71, 85, 105];
              data.cell.styles.fontSize = 6.8;
            } else if (data.section === "body" && data.column.index === 0) {
              data.cell.styles.halign = "center";
              data.cell.styles.fontStyle = "bold";
            }
          },
          columnStyles: {
            0: { cellWidth: 16 },
            1: { cellWidth: "auto" },
          },
        });
        const finalY2 = (doc as any).lastAutoTable?.finalY || startTableY;

        // 3. Tabela Liberados (Coluna 3)
        autoTable(doc, {
          startY: startTableY,
          margin: { left: col3X, right: 210 - (col3X + colWidth) },
          tableWidth: colWidth,
          head: [[`LIBERADO (${lib.length})`, ""]],
          body: [["Carro", "Defeito"], ...libRows],
          theme: "grid",
          styles: {
            fontSize: 7.2,
            cellPadding: 1.2,
            textColor: [0, 0, 0],
            lineColor: [203, 213, 225],
            lineWidth: 0.15,
          },
          headStyles: {
            fillColor: [209, 250, 229], // emerald suave
            textColor: [6, 95, 70],
            fontSize: 7.8,
            fontStyle: "bold",
            halign: "center",
          },
          didParseCell: (data) => {
            if (data.section === "head") {
              if (data.column.index === 0) {
                data.cell.colSpan = 2;
              }
            } else if (data.section === "body" && data.row.index === 0) {
              data.cell.styles.fillColor = [248, 250, 252];
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [71, 85, 105];
              data.cell.styles.fontSize = 6.8;
            } else if (data.section === "body" && data.column.index === 0) {
              data.cell.styles.halign = "center";
              data.cell.styles.fontStyle = "bold";
            }
          },
          columnStyles: {
            0: { cellWidth: 16 },
            1: { cellWidth: "auto" },
          },
        });
        const finalY3 = (doc as any).lastAutoTable?.finalY || startTableY;

        currentY = Math.max(finalY1, finalY2, finalY3) + 7;
      });

      let fileName = `MAN-${dataOperacao}.pdf`;
      try {
        const [ano, mes, dia] = dataOperacao.split("-");
        if (ano && mes && dia) {
          fileName = `MAN-${dia}-${mes}-${ano}.pdf`;
        }
      } catch {}

      doc.save(fileName);
      toast.success("Relatório em PDF gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF.");
    }
  };

  // Impressão direta do Relatório Oficial (sem interferência de modais ou estilos de tela)
  const handlePrintRelatorio = () => {
    try {
      let empresasHtml = "";

      empresasParaImprimir.forEach((emp) => {
        const carrosEmp = itemsByGaragem.filter((it) => matchesEmpresa(it, emp));
        const bloq = carrosEmp
          .filter((it) => it.bloqueado && !it.emExecucao && !it.liberado)
          .sort((a, b) => a.prefixo.localeCompare(b.prefixo, undefined, { numeric: true }));
        const manut = carrosEmp
          .filter((it) => it.emExecucao && !it.liberado)
          .sort((a, b) => a.prefixo.localeCompare(b.prefixo, undefined, { numeric: true }));
        const lib = carrosEmp
          .filter((it) => it.liberado || (!it.bloqueado && !it.emExecucao))
          .sort((a, b) => a.prefixo.localeCompare(b.prefixo, undefined, { numeric: true }));

        const nomeEmpresa =
          emp === "VCG"
            ? "VCG - VIAÇÃO CIDADE MORENA"
            : emp === "JTU"
            ? "JTU - JAGUAR TRANSPORTE URBANO"
            : emp === "VSF"
            ? "VSF - VIAÇÃO SÃO FRANCISCO"
            : emp === "VCM"
            ? "VCM - VIAÇÃO CAMPO GRANDE"
            : emp;

        const renderRows = (list: typeof bloq) => {
          if (list.length === 0) {
            return `<tr><td colspan="2" style="text-align: center; color: #888; font-style: italic; padding: 6px;">Nenhum veículo</td></tr>`;
          }
          return list
            .map(
              (c) => `
            <tr>
              <td style="width: 55px; text-align: center; font-weight: bold; font-family: monospace; padding: 3px 4px; border-bottom: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">${c.prefixo}</td>
              <td style="padding: 3px 4px; border-bottom: 1px solid #e5e7eb; text-transform: uppercase; font-weight: 500; font-size: 10px; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.observacao || "—"}</td>
            </tr>
          `
            )
            .join("");
        };

        empresasHtml += `
          <div style="border: 1.5px solid #64748b; border-radius: 6px; padding: 8px; margin-bottom: 14px; page-break-inside: avoid; background: #fff;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 8px;">
              <div style="font-weight: 800; font-size: 12.5px; text-transform: uppercase; color: #0f172a;">
                <span style="background: #e2e8f0; color: #0f172a; padding: 2px 6px; border-radius: 4px; margin-right: 6px; font-family: monospace; border: 1px solid #94a3b8; font-weight: bold;">${emp}</span>
                ${nomeEmpresa}
              </div>
              <div style="font-size: 11px; font-weight: bold; color: #475569;">
                Total: ${carrosEmp.length} veículos
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
              <!-- BLOQUEADO -->
              <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; background: #fff;">
                <div style="background: #ffe4e6; color: #9f1239; font-weight: 800; font-size: 11px; padding: 4px 6px; display: flex; justify-content: space-between; border-bottom: 1px solid #cbd5e1;">
                  <span>BLOQUEADO</span>
                  <span style="font-family: monospace;">(${bloq.length})</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
                  <thead>
                    <tr style="background: #f8fafc; border-bottom: 1px solid #cbd5e1; font-size: 9.5px; color: #475569; font-weight: bold;">
                      <th style="padding: 2px 4px; text-align: center; width: 55px; border-right: 1px solid #cbd5e1;">Carro</th>
                      <th style="padding: 2px 4px; text-align: left;">Defeito</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${renderRows(bloq)}
                  </tbody>
                </table>
              </div>

              <!-- EM MANUTENÇÃO -->
              <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; background: #fff;">
                <div style="background: #fef3c7; color: #92400e; font-weight: 800; font-size: 11px; padding: 4px 6px; display: flex; justify-content: space-between; border-bottom: 1px solid #cbd5e1;">
                  <span>EM MANUTENÇÃO</span>
                  <span style="font-family: monospace;">(${manut.length})</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
                  <thead>
                    <tr style="background: #f8fafc; border-bottom: 1px solid #cbd5e1; font-size: 9.5px; color: #475569; font-weight: bold;">
                      <th style="padding: 2px 4px; text-align: center; width: 55px; border-right: 1px solid #cbd5e1;">Carro</th>
                      <th style="padding: 2px 4px; text-align: left;">Defeito</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${renderRows(manut)}
                  </tbody>
                </table>
              </div>

              <!-- LIBERADO -->
              <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; background: #fff;">
                <div style="background: #d1fae5; color: #065f46; font-weight: 800; font-size: 11px; padding: 4px 6px; display: flex; justify-content: space-between; border-bottom: 1px solid #cbd5e1;">
                  <span>LIBERADO</span>
                  <span style="font-family: monospace;">(${lib.length})</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
                  <thead>
                    <tr style="background: #f8fafc; border-bottom: 1px solid #cbd5e1; font-size: 9.5px; color: #475569; font-weight: bold;">
                      <th style="padding: 2px 4px; text-align: center; width: 55px; border-right: 1px solid #cbd5e1;">Carro</th>
                      <th style="padding: 2px 4px; text-align: left;">Defeito</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${renderRows(lib)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      });

      const printHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>CARROS EM: MANUTENÇÃO, BLOQUEADO, LIBERADO</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 7mm 8mm;
            }
            * {
              box-sizing: border-box;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            html, body {
              background-color: #ffffff !important;
              color: #000000 !important;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .header-print {
              text-align: center;
              border-bottom: 2.5px solid #000;
              padding-bottom: 6px;
              margin-bottom: 12px;
            }
            .header-print h1 {
              margin: 0;
              font-size: 16px;
              font-weight: 900;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              color: #000;
            }
            .header-print p {
              margin: 4px 0 0 0;
              font-size: 11.5px;
              font-weight: 800;
              color: #1e293b;
              letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          <div class="header-print">
            <h1>CARROS EM: MANUTENÇÃO, BLOQUEADO, LIBERADO</h1>
            <p>DATA: ${formattedData}</p>
          </div>
          ${empresasHtml}
        </body>
        </html>
      `;

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printHtml);
        doc.close();

        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1500);
        }, 250);
      }
    } catch (err) {
      console.error("Erro na impressão:", err);
      window.print();
    }
  };

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
        </div>

        {/* Botões em formato de Pílula (Pill Buttons) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setModalRelatorioOpen(true)}
            variant="outline"
            size="sm"
            className="rounded-full px-5 py-2 h-9 border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0E1420] text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 shadow-xs font-semibold text-xs flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-gray-500" />
            Visualizar Relatório
          </Button>

          <Button
            onClick={handleResetSeed}
            variant="ghost"
            size="sm"
            className="rounded-full px-3 py-2 h-9 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
            title="Restaurar dados padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ==========================================================
          2. CARDS DE KPI BENTO GRID (4 COLUNAS - ESTILO DONEZO)
          Cards informativos limpos sem filtros
          ========================================================== */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: BLOQUEADOS (Mesmo fundo neutro dos outros cards, texto em vermelho) */}
        <div className="rounded-3xl p-6 shadow-xs relative flex flex-col justify-between h-40 bg-white dark:bg-[#0E1420] border border-gray-100/90 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
              Veículos Bloqueados
            </span>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {stats.bloqueados}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              {stats.pctBloqueados}% da frota retida
            </span>
          </div>
        </div>

        {/* Card 2: EM EXECUÇÃO (Branco / Laranja) */}
        <div className="rounded-3xl p-6 shadow-xs relative flex flex-col justify-between h-40 bg-white dark:bg-[#0E1420] border border-gray-100/90 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
              Em Execução
            </span>
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
        <div className="rounded-3xl p-6 shadow-xs relative flex flex-col justify-between h-40 bg-white dark:bg-[#0E1420] border border-gray-100/90 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
              Veículos Liberados
            </span>
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

        {/* Card 4: FROTA TOTAL DA GARAGEM */}
        <div className="rounded-3xl p-6 shadow-xs relative flex flex-col justify-between h-40 bg-white dark:bg-[#0E1420] border border-gray-100/90 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
              Frota Total da Garagem
            </span>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              {stats.totalFrota}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
              <Bus className="w-3 h-3 text-gray-500" />
              {activeGaragem === "VCG" ? (
                selectedEmpresa === "TODAS" ? "VSF, JTU e VCG" :
                selectedEmpresa === "VCG" ? "VCG" :
                selectedEmpresa === "JTU" ? "JTU" : "VSF"
              ) : activeGaragem === "VCM" ? (
                "VCM"
              ) : (
                selectedEmpresa === "TODAS" ? "Consórcio Guaicurus" : selectedEmpresa
              )}
            </span>
          </div>
        </div>

      </div>

      {/* ==========================================================
          3. CARD PRINCIPAL DA PLANILHA OFICIAL DE MANUTENÇÃO
          ========================================================== */}
      <div className="bg-white dark:bg-[#0E1420] border border-gray-100/90 dark:border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5 print:hidden">
        
        {/* ==========================================================
            CABEÇALHO DA PLANILHA (PRINT 01 - ACIMA DOS FILTROS)
            ========================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              CARROS EM: MANUTENÇÃO, BLOQUEADO, LIBERADO
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && !userGaragemFixa && (
              <div className="inline-flex items-center p-0.5 rounded-full bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 mr-2 shadow-2xs">
                {(["VCG", "VCM", "TODAS"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setActiveGaragem(g)}
                    className={cn(
                      "px-2.5 py-0.5 text-[11px] font-bold rounded-full transition-all cursor-pointer",
                      activeGaragem === g
                        ? "bg-[#164E3A] text-white shadow-xs font-bold"
                        : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    {g === "TODAS" ? "Todas" : g}
                  </button>
                ))}
              </div>
            )}
            <span className="text-xs font-medium text-gray-500 dark:text-slate-300">
              {filteredItems.length} veículos listados
            </span>
          </div>
        </div>

        {/* ==========================================================
            BARRA DE FILTROS E BUSCA (DATA, EMPRESA E BUSCA)
            ========================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2">
          
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Seletor de Data Completa com Ano */}
            <div 
              onClick={() => {
                try {
                  dateInputRef.current?.showPicker();
                } catch {
                  dateInputRef.current?.focus();
                }
              }}
              className="relative inline-flex items-center gap-2 bg-gray-50 dark:bg-slate-900 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 shadow-2xs hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-colors group shrink-0 cursor-pointer"
              title="Clique para escolher uma data no calendário"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-gray-500 shrink-0 group-hover:text-emerald-600 transition-colors pointer-events-none" />
              <span className="text-xs font-mono font-bold text-gray-900 dark:text-white pointer-events-none select-none">
                {formattedData}
              </span>
              <input
                ref={dateInputRef}
                type="date"
                value={dataOperacao}
                onChange={(e) => {
                  if (e.target.value) setDataOperacao(e.target.value);
                }}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch {}
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                title="Clique para escolher uma data no calendário"
                aria-label="Escolher data no calendário"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDataOperacao(getTodayString());
                }}
                className="relative z-20 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline px-1 border-l border-gray-200 dark:border-slate-700 pl-2 cursor-pointer"
                title="Voltar para a data de hoje"
              >
                Hoje
              </button>
            </div>

            {/* Filtro de Empresas em Pílulas baseadas na Garagem Ativa */}
            <div className="inline-flex items-center p-1 rounded-full bg-gray-100/90 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xs">
              {empresasDisponiveis.map((emp) => {
                const isSelected = selectedEmpresa === emp;
                const count = empresaCounts[emp] || 0;
                return (
                  <button
                    key={emp}
                    type="button"
                    onClick={() => setSelectedEmpresa(emp)}
                    className={cn(
                      "px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1.5",
                      isSelected
                        ? "bg-[#164E3A] text-white shadow-xs font-bold"
                        : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <span>{emp === "TODAS" ? "Todas" : emp}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Busca Global em Pílula com atalho Ctrl+K */}
          <div className="relative w-full sm:w-80">
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
            OS 3 QUADROS PARALELOS: BLOQUEADOS | EM MANUTENÇÃO | LIBERADO
            Todos os carros no mesmo card por status, em ordem numérica de carro
            ========================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          
          {/* QUADRO 1: BLOQUEADOS (ROSE / VERMELHO) */}
          <div className="rounded-2xl border border-rose-500/40 dark:border-rose-500/30 bg-rose-500/[0.02] dark:bg-rose-950/10 overflow-hidden flex flex-col shadow-2xs">
            {/* Header do Quadro */}
            <div className="p-3.5 border-b border-rose-200/80 dark:border-rose-900/40 flex items-center justify-between bg-rose-50/70 dark:bg-rose-950/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300">
                  Bloqueados
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/40 font-mono">
                  {sortedBloqueados.length}
                </span>
              </div>
              <button
                onClick={() => handleOpenAddModal("BLOQUEADO")}
                className="w-7 h-7 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/50 text-rose-700 dark:text-rose-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                title="Adicionar carro bloqueado"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Tabela de Bloqueados */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400 border-b border-rose-200/60 dark:border-rose-900/40 bg-rose-100/70 dark:bg-slate-900">
                    <th className="py-2.5 px-3 w-20 text-center font-bold">Carro</th>
                    <th className="py-2.5 px-3 text-left font-bold">Defeito</th>
                    <th className="py-2.5 px-3 w-14 text-center font-bold">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100/60 dark:divide-rose-950/40">
                  {sortedBloqueados.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-xs text-gray-400 dark:text-slate-500">
                        Nenhum veículo bloqueado
                      </td>
                    </tr>
                  ) : (
                    sortedBloqueados.map((item) => (
                      <tr key={item.id} className="hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors">
                        <td className="py-2 px-3 text-center">
                          <span className="inline-block font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-rose-100/80 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900/50">
                            {item.prefixo}
                          </span>
                        </td>
                        <td 
                          onClick={() => { setEditItem(item); setEditObs(item.observacao); }}
                          className="py-2 px-3 font-semibold uppercase text-[11px] text-gray-800 dark:text-slate-200 cursor-pointer group/cell"
                          title="Clique para editar defeito/observação"
                        >
                          <span className="truncate block max-w-[140px] sm:max-w-[170px] group-hover/cell:underline">
                            {item.observacao || "—"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded-md text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition-colors cursor-pointer">
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
                                Em Manutencao
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
          <div className="rounded-2xl border border-amber-500/40 dark:border-amber-500/30 bg-amber-500/[0.02] dark:bg-amber-950/10 overflow-hidden flex flex-col shadow-2xs">
            {/* Header do Quadro */}
            <div className="p-3.5 border-b border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between bg-amber-50/70 dark:bg-amber-950/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300">
                  Em Manutencao
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/40 font-mono">
                  {sortedEmExecucao.length}
                </span>
              </div>
              <button
                onClick={() => handleOpenAddModal("EM_EXECUCAO")}
                className="w-7 h-7 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 text-amber-700 dark:text-amber-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                title="Adicionar carro em manutenção"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Tabela de Em Manutenção */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400 border-b border-amber-200/60 dark:border-amber-900/40 bg-amber-100/70 dark:bg-slate-900">
                    <th className="py-2.5 px-3 w-20 text-center font-bold">Carro</th>
                    <th className="py-2.5 px-3 text-left font-bold">Defeito</th>
                    <th className="py-2.5 px-3 w-14 text-center font-bold">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/60 dark:divide-amber-950/40">
                  {sortedEmExecucao.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-xs text-gray-400 dark:text-slate-500">
                        Nenhum veículo em manutenção
                      </td>
                    </tr>
                  ) : (
                    sortedEmExecucao.map((item) => (
                      <tr key={item.id} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors">
                        <td className="py-2 px-3 text-center">
                          <span className="inline-block font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-900/50">
                            {item.prefixo}
                          </span>
                        </td>
                        <td 
                          onClick={() => { setEditItem(item); setEditObs(item.observacao); }}
                          className="py-2 px-3 font-semibold uppercase text-[11px] text-gray-800 dark:text-slate-200 cursor-pointer group/cell"
                          title="Clique para editar defeito/observação"
                        >
                          <span className="truncate block max-w-[140px] sm:max-w-[170px] group-hover/cell:underline">
                            {item.observacao || "—"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded-md text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-colors cursor-pointer">
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
          <div className="rounded-2xl border border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-500/[0.02] dark:bg-emerald-950/10 overflow-hidden flex flex-col shadow-2xs">
            {/* Header do Quadro */}
            <div className="p-3.5 border-b border-emerald-200/80 dark:border-emerald-900/40 flex items-center justify-between bg-emerald-50/70 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  Liberado
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/40 font-mono">
                  {sortedLiberados.length}
                </span>
              </div>
              <button
                onClick={() => handleOpenAddModal("LIBERADO")}
                className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                title="Adicionar carro liberado"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Tabela de Liberados */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400 border-b border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-100/70 dark:bg-slate-900">
                    <th className="py-2.5 px-3 w-20 text-center font-bold">Carro</th>
                    <th className="py-2.5 px-3 text-left font-bold">Defeito</th>
                    <th className="py-2.5 px-3 w-14 text-center font-bold">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100/60 dark:divide-emerald-950/40">
                  {sortedLiberados.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-xs text-gray-400 dark:text-slate-500">
                        Nenhum veículo liberado
                      </td>
                    </tr>
                  ) : (
                    sortedLiberados.map((item) => (
                      <tr key={item.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors">
                        <td className="py-2 px-3 text-center">
                          <span className="inline-block font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-900/50">
                            {item.prefixo}
                          </span>
                        </td>
                        <td 
                          onClick={() => { setEditItem(item); setEditObs(item.observacao); }}
                          className="py-2 px-3 font-semibold uppercase text-[11px] text-gray-800 dark:text-slate-200 cursor-pointer group/cell"
                          title="Clique para editar defeito/observação"
                        >
                          <span className="truncate block max-w-[140px] sm:max-w-[170px] group-hover/cell:underline">
                            {item.observacao || "—"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded-md text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer">
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
                                Em Manutencao
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

      {/* ==========================================================
          MODAL: ADICIONAR VEÍCULO À FOLHA DE MANUTENÇÃO
          Estilizado dinamicamente com a cor do card de origem
          ========================================================== */}
      <Dialog open={modalAddOpen} onOpenChange={setModalAddOpen}>
        <DialogContent className={cn("sm:max-w-md rounded-3xl border-2 transition-colors", modalStyle.borderClass)}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base font-bold pr-6">
              <span className="flex items-center gap-2">
                <modalStyle.icon className={cn("w-5 h-5", modalStyle.iconColor)} />
                {modalStyle.title}
              </span>
              <span className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs", modalStyle.badgeClass)}>
                {modalStyle.label}
              </span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddCarro} className="space-y-4 pt-2">
            {/* Campo de Seleção / Busca Moderna de Veículos */}
            <div className="relative" ref={carSelectorRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Bus className="w-3.5 h-3.5 text-gray-500" />
                  Prefixo do Carro <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-medium text-gray-500 dark:text-slate-400">
                  {carsOfGaragem.length} veículos da Garagem {activeGaragem === "TODAS" ? "VCG/VCM" : activeGaragem}
                </span>
              </div>

              {/* Input customizado com Botão Dropdown */}
              <div className="relative">
                <Input
                  value={newPrefixo}
                  onChange={(e) => {
                    setNewPrefixo(e.target.value.replace(/\D/g, ""));
                    setCarSelectorOpen(true);
                  }}
                  onClick={() => setCarSelectorOpen(prev => !prev)}
                  placeholder="Digite ou clique para selecionar..."
                  className="font-mono font-bold text-sm rounded-xl pl-9 pr-20 h-11 border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  maxLength={5}
                  required
                />
                <Bus className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {newPrefixo && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewPrefixo("");
                        setCarSelectorOpen(false);
                      }}
                      className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Limpar campo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCarSelectorOpen(prev => !prev);
                    }}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Abrir lista de veículos"
                  >
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", carSelectorOpen && "rotate-180 text-emerald-600")} />
                  </button>
                </div>
              </div>

              {/* Painel Suspenso (Dropdown Moderno) */}
              {carSelectorOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-[#0E1420] border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
                  {/* Cabeçalho do Dropdown com Filtro Rápido de Empresa */}
                  <div className="p-2 border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 pl-1">
                      Filtrar por Empresa:
                    </span>
                    <div className="flex items-center gap-1">
                      {(activeGaragem === "VCG" ? ["TODAS", "VCG", "JTU", "VSF"] : activeGaragem === "VCM" ? ["TODAS", "VCM"] : ["TODAS", "VCG", "JTU", "VSF", "VCM"]).map(emp => (
                        <button
                          key={emp}
                          type="button"
                          onClick={() => setCarFilterCompany(emp)}
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer",
                            carFilterCompany === emp
                              ? "bg-gray-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs"
                              : "text-gray-500 hover:bg-gray-200/60 dark:hover:bg-slate-800"
                          )}
                        >
                          {emp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lista de Carros com Rolagem Suave */}
                  <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/60">
                    {filteredAvailableCars.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-400 dark:text-slate-500">
                        Nenhum veículo encontrado para a busca "{newPrefixo}"
                      </div>
                    ) : (
                      filteredAvailableCars.map(car => {
                        const cons = getConsorciadaByPrefix(car);
                        const statusFolha = getCarStatusOnCurrentSheet(car);
                        const isSelected = newPrefixo === car;

                        return (
                          <button
                            key={car}
                            type="button"
                            onClick={() => {
                              setNewPrefixo(car);
                              setCarSelectorOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors cursor-pointer group",
                              isSelected
                                ? "bg-emerald-50 dark:bg-emerald-950/40"
                                : "hover:bg-gray-50 dark:hover:bg-slate-800/60"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-bold text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                                {car}
                              </span>
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                                cons === "VCG" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" :
                                cons === "JTU" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800" :
                                cons === "VSF" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" :
                                "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                              )}>
                                {cons}
                              </span>
                              <span className="text-[10px] text-gray-400 dark:text-slate-500">
                                Garagem {getGaragemFisicaByCarro(car)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {statusFolha === "BLOQUEADO" && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                  Já Bloqueado
                                </span>
                              )}
                              {statusFolha === "EM_EXECUCAO" && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                                  Em Manutenção
                                </span>
                              )}
                              {statusFolha === "LIBERADO" && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                                  Liberado
                                </span>
                              )}
                              {isSelected && (
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Rodapé do Dropdown com quantidade */}
                  <div className="p-2 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 text-center text-[10px] text-gray-400">
                    Mostrando {filteredAvailableCars.length} de {carsOfGaragem.length} veículos cadastrados
                  </div>
                </div>
              )}

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
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-300 cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
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
              <Button type="submit" className={cn("rounded-full text-white font-bold shadow-xs transition-transform active:scale-95", modalStyle.btnClass)}>
                {modalStyle.buttonText}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==========================================================
          MODAL: EDITAR OBSERVAÇÃO DO VEÍCULO
          Estilizado dinamicamente com o status do veículo
          ========================================================== */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className={cn("sm:max-w-md rounded-3xl border-2 transition-colors", editModalStyle?.borderClass)}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base font-bold pr-6">
              <span className="flex items-center gap-2">
                <Edit2 className={cn("w-4 h-4", editModalStyle?.iconColor)} />
                Editar Defeito • Carro {editItem?.prefixo}
              </span>
              {editModalStyle && (
                <span className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs", editModalStyle.badgeClass)}>
                  {editModalStyle.label}
                </span>
              )}
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
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" className="rounded-full" onClick={() => setEditItem(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveObservacao} className={cn("rounded-full text-white font-bold shadow-xs transition-transform active:scale-95", editModalStyle?.btnClass)}>
                Salvar Observação
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==========================================================
          MODAL: VISUALIZAR RELATÓRIO DE MANUTENÇÃO
          Permite ao usuário visualizar o relatório completo e escolher entre imprimir ou baixar
          ========================================================== */}
      <Dialog open={modalRelatorioOpen} onOpenChange={setModalRelatorioOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] flex flex-col p-0 rounded-3xl overflow-hidden bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 print:hidden shadow-2xl">
          
          {/* Header com Ações */}
          <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0E1420] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Visualização do Relatório de Manutenção
              </DialogTitle>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Data do Relatório: <span className="font-mono font-bold text-gray-900 dark:text-white">{formattedData}</span>
              </p>
            </div>

            {/* Ações: Imprimir, Baixar PDF, Baixar Excel */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handlePrintRelatorio}
                variant="outline"
                size="sm"
                className="rounded-full px-3.5 py-1.5 h-8 text-xs font-bold border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Imprimir folha de relatório formatada"
              >
                <Printer className="w-3.5 h-3.5 text-gray-600 dark:text-slate-300" />
                Imprimir
              </Button>

              <Button
                type="button"
                onClick={handleDownloadPdf}
                size="sm"
                className="rounded-full px-3.5 py-1.5 h-8 text-xs font-bold bg-[#164E3A] hover:bg-[#113C2D] text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Baixar arquivo em PDF"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar PDF
              </Button>
            </div>
          </div>

          {/* Corpo do Relatório com Estilo de Folha Realista */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100 dark:bg-slate-950">
            <div className="max-w-3xl mx-auto bg-white text-black p-6 sm:p-8 rounded-2xl shadow-md border border-gray-300 space-y-5">
              
              {/* Topo do Relatório */}
              <div className="text-center pb-3 border-b-2 border-black">
                <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-black">
                  CARROS EM: MANUTENÇÃO, BLOQUEADO, LIBERADO
                </h1>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-700 mt-1">
                  DATA: {formattedData}
                </p>
              </div>

              {/* Blocos por Empresa */}
              <div className="space-y-4">
                {empresasParaImprimir.map((emp) => {
                  const carrosEmp = itemsByGaragem.filter((it) => matchesEmpresa(it, emp));
                  const bloq = carrosEmp
                    .filter((it) => it.bloqueado && !it.emExecucao && !it.liberado)
                    .sort((a, b) => a.prefixo.localeCompare(b.prefixo, undefined, { numeric: true }));
                  const manut = carrosEmp
                    .filter((it) => it.emExecucao && !it.liberado)
                    .sort((a, b) => a.prefixo.localeCompare(b.prefixo, undefined, { numeric: true }));
                  const lib = carrosEmp
                    .filter((it) => it.liberado || (!it.bloqueado && !it.emExecucao))
                    .sort((a, b) => a.prefixo.localeCompare(b.prefixo, undefined, { numeric: true }));

                  const nomeEmpresa =
                    emp === "VCG"
                      ? "VCG - VIAÇÃO CIDADE MORENA"
                      : emp === "JTU"
                      ? "JTU - JAGUAR TRANSPORTE URBANO"
                      : emp === "VSF"
                      ? "VSF - VIAÇÃO SÃO FRANCISCO"
                      : emp === "VCM"
                      ? "VCM - VIAÇÃO CAMPO GRANDE"
                      : emp;

                  return (
                    <div key={emp} className="border border-gray-300 rounded-xl p-3 bg-white space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-gray-100 text-black border border-gray-300">
                            {emp}
                          </span>
                          <span className="text-xs font-bold uppercase text-black">
                            {nomeEmpresa}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-600">
                          Total: {carrosEmp.length} veículos
                        </span>
                      </div>

                      {/* 3 Colunas: Bloqueado, Em Manutenção, Liberado */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        
                        {/* Bloqueados */}
                        <div className="border border-rose-200 rounded-lg overflow-hidden bg-white">
                          <div className="bg-rose-50 px-2.5 py-1 flex items-center justify-between border-b border-rose-200">
                            <span className="text-xs font-bold uppercase text-rose-900">
                              Bloqueado
                            </span>
                            <span className="text-xs font-mono font-bold text-rose-900">
                              ({bloq.length})
                            </span>
                          </div>
                          <div className="p-1">
                            <table className="w-full text-left text-[11px]">
                              <thead>
                                <tr className="border-b border-gray-200 text-gray-500 font-bold">
                                  <th className="py-1 px-1.5 w-14 text-center">Carro</th>
                                  <th className="py-1 px-1.5">Defeito</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {bloq.length === 0 ? (
                                  <tr>
                                    <td colSpan={2} className="py-2 text-center text-gray-400 italic text-[10px]">
                                      Nenhum veículo
                                    </td>
                                  </tr>
                                ) : (
                                  bloq.map((car) => (
                                    <tr key={car.id}>
                                      <td className="py-1 px-1.5 text-center font-mono font-bold text-black">
                                        {car.prefixo}
                                      </td>
                                      <td className="py-1 px-1.5 font-medium text-gray-800 uppercase truncate max-w-[120px]">
                                        {car.observacao || "—"}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Em Manutenção */}
                        <div className="border border-amber-200 rounded-lg overflow-hidden bg-white">
                          <div className="bg-amber-50 px-2.5 py-1 flex items-center justify-between border-b border-amber-200">
                            <span className="text-xs font-bold uppercase text-amber-900">
                              Em Manutenção
                            </span>
                            <span className="text-xs font-mono font-bold text-amber-900">
                              ({manut.length})
                            </span>
                          </div>
                          <div className="p-1">
                            <table className="w-full text-left text-[11px]">
                              <thead>
                                <tr className="border-b border-gray-200 text-gray-500 font-bold">
                                  <th className="py-1 px-1.5 w-14 text-center">Carro</th>
                                  <th className="py-1 px-1.5">Defeito</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {manut.length === 0 ? (
                                  <tr>
                                    <td colSpan={2} className="py-2 text-center text-gray-400 italic text-[10px]">
                                      Nenhum veículo
                                    </td>
                                  </tr>
                                ) : (
                                  manut.map((car) => (
                                    <tr key={car.id}>
                                      <td className="py-1 px-1.5 text-center font-mono font-bold text-black">
                                        {car.prefixo}
                                      </td>
                                      <td className="py-1 px-1.5 font-medium text-gray-800 uppercase truncate max-w-[120px]">
                                        {car.observacao || "—"}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Liberados */}
                        <div className="border border-emerald-200 rounded-lg overflow-hidden bg-white">
                          <div className="bg-emerald-50 px-2.5 py-1 flex items-center justify-between border-b border-emerald-200">
                            <span className="text-xs font-bold uppercase text-emerald-900">
                              Liberado
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-900">
                              ({lib.length})
                            </span>
                          </div>
                          <div className="p-1">
                            <table className="w-full text-left text-[11px]">
                              <thead>
                                <tr className="border-b border-gray-200 text-gray-500 font-bold">
                                  <th className="py-1 px-1.5 w-14 text-center">Carro</th>
                                  <th className="py-1 px-1.5">Defeito</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {lib.length === 0 ? (
                                  <tr>
                                    <td colSpan={2} className="py-2 text-center text-gray-400 italic text-[10px]">
                                      Nenhum veículo
                                    </td>
                                  </tr>
                                ) : (
                                  lib.map((car) => (
                                    <tr key={car.id}>
                                      <td className="py-1 px-1.5 text-center font-mono font-bold text-black">
                                        {car.prefixo}
                                      </td>
                                      <td className="py-1 px-1.5 font-medium text-gray-800 uppercase truncate max-w-[120px]">
                                        {car.observacao || "—"}
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
                })}
              </div>

            </div>
          </div>

          <DialogFooter className="p-3 bg-white dark:bg-[#0E1420] border-t border-gray-200 dark:border-slate-800 flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setModalRelatorioOpen(false)}
            >
              Fechar Visualização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
