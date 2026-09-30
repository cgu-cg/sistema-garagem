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
  fetchCIBloqueiosFromApi,
  deleteCIBloqueioApi
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
import html2canvas from "html2canvas";
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
  CheckCircle2, 
  MoreVertical, 
  Ban, 
  FileText, 
  Download,
  ChevronDown,
  X,
  Check,
  ArrowRightLeft
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
  const relatorioManutencaoRef = useRef<HTMLDivElement>(null);
  
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

  // Modal de Confirmação de Transferência de Situação entre Quadros
  const [confirmTransferModal, setConfirmTransferModal] = useState<{
    isOpen: boolean;
    prefixo: string;
    itemExistente: ManutencaoCarroItem;
    fromStatus: "BLOQUEADO" | "EM_EXECUCAO" | "LIBERADO";
    toStatus: "BLOQUEADO" | "EM_EXECUCAO" | "LIBERADO";
    novaObservacao: string;
  } | null>(null);

  // Auxiliares de formatação de situação do carro
  const getStatusLabel = (status: "BLOQUEADO" | "EM_EXECUCAO" | "LIBERADO") => {
    if (status === "EM_EXECUCAO") return "Em Manutenção";
    if (status === "LIBERADO") return "Liberado";
    return "Bloqueado";
  };

  const getStatusBadgeStyle = (status: "BLOQUEADO" | "EM_EXECUCAO" | "LIBERADO") => {
    if (status === "EM_EXECUCAO") {
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800";
    }
    if (status === "LIBERADO") {
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
    }
    return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800";
  };

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
      fetchManutencaoDataFromApi(dataOperacao, activeGaragem),
      fetchCIBloqueiosFromApi({ garagem: activeGaragem === "TODAS" ? undefined : activeGaragem })
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
  }, [dataOperacao, activeGaragem]);

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

  // Transição de status a partir do menu de 3 pontinhos
  const handleSetStatus = (itemId: string, newStatus: "BLOQUEADO" | "EM_EXECUCAO" | "LIBERADO") => {
    const targetItem = items.find(it => it.id === itemId);
    const clean = (targetItem?.prefixo || "").replace(/\D/g, "");

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
          bloqueado: false,
          emExecucao: true,
          liberado: false
        };
      }

      if (newStatus === "LIBERADO") {
        return {
          ...item,
          bloqueado: false,
          emExecucao: false,
          liberado: true
        };
      }

      return item;
    });

    setItems(updated);
    saveManutencaoData(dataOperacao, updated);

    // Se saiu de Bloqueado (foi para Liberado ou Em Manutenção), desmarca da CI se constava lá
    if (newStatus === "LIBERADO" || newStatus === "EM_EXECUCAO") {
      if (clean) {
        deleteCIBloqueioApi(clean);
        try {
          const currentCI = getInitialCIBloqueios();
          const updatedCI = currentCI.filter(c => c.prefixo.replace(/\D/g, "") !== clean);
          saveCIBloqueiosToStorage(updatedCI);
        } catch (_) {}
      }
    }

    if (newStatus === "LIBERADO") {
      toast.success("Veículo liberado da manutenção.");
    } else if (newStatus === "BLOQUEADO") {
      toast.success("Veículo bloqueado na manutenção e registrado na CI.");
    } else {
      toast.success("Veículo em manutenção na oficina (controle interno).");
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
      setNewBloqueado(false);
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

  // Adicionar novo carro à folha ou solicitar transferência se já existir em outra situação
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

    // Verifica se o carro já existe na folha desta data
    const existingItem = items.find(it => it.prefixo === cleanPrefix);
    if (existingItem) {
      // Identifica a situação atual na folha
      let fromStatus: "BLOQUEADO" | "EM_EXECUCAO" | "LIBERADO" = "BLOQUEADO";
      if (existingItem.emExecucao && !existingItem.liberado) {
        fromStatus = "EM_EXECUCAO";
      } else if (existingItem.liberado) {
        fromStatus = "LIBERADO";
      } else if (existingItem.bloqueado) {
        fromStatus = "BLOQUEADO";
      }

      const toStatus = modalStatusOrigem;

      // Se já está na mesma situação do card atual
      if (fromStatus === toStatus) {
        toast.info(`O veículo ${cleanPrefix} já está registrado como "${getStatusLabel(fromStatus)}" nesta data.`);
        return;
      }

      // Se está em outra situação, abre o popup de confirmação para transferir!
      setConfirmTransferModal({
        isOpen: true,
        prefixo: cleanPrefix,
        itemExistente: existingItem,
        fromStatus,
        toStatus,
        novaObservacao: newObservacao.trim().toUpperCase()
      });
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

    toast.success(`Carro ${cleanPrefix} adicionado à folha de manutenção como "${getStatusLabel(modalStatusOrigem)}".`);
    setModalAddOpen(false);
    setNewPrefixo("");
    setNewObservacao("");
    setNewBloqueado(false);
    setNewEmExecucao(false);
    setNewLiberado(true);
  };

  // Confirmar transferência de situação a partir do popup
  const handleConfirmTransfer = () => {
    if (!confirmTransferModal) return;
    const { prefixo, itemExistente, toStatus, novaObservacao } = confirmTransferModal;

    const isBloq = toStatus === "BLOQUEADO";
    const isExec = toStatus === "EM_EXECUCAO";
    const isLib = toStatus === "LIBERADO";

    const updatedObs = novaObservacao.trim()
      ? novaObservacao.trim().toUpperCase()
      : itemExistente.observacao;

    const updated = items.map(it => {
      if (it.prefixo === prefixo) {
        return {
          ...it,
          bloqueado: isBloq,
          emExecucao: isExec,
          liberado: isLib,
          observacao: updatedObs,
          updatedAt: new Date().toISOString()
        };
      }
      return it;
    });

    setItems(updated);
    saveManutencaoData(dataOperacao, updated);

    // Se o veículo foi transferido para Liberado ou Em Manutenção, ou saiu do status de Bloqueado
    if (isLib || isExec || (confirmTransferModal.fromStatus === "BLOQUEADO" && toStatus !== "BLOQUEADO")) {
      const clean = prefixo.replace(/\D/g, "");
      if (clean) {
        deleteCIBloqueioApi(clean);
        try {
          const currentCI = getInitialCIBloqueios();
          const updatedCI = currentCI.filter(c => c.prefixo.replace(/\D/g, "") !== clean);
          saveCIBloqueiosToStorage(updatedCI);
        } catch (_) {}
      }
    }

    toast.success(
      `Veículo ${prefixo} transferido de "${getStatusLabel(confirmTransferModal.fromStatus)}" para "${getStatusLabel(toStatus)}" com sucesso!`
    );

    setConfirmTransferModal(null);
    setModalAddOpen(false);
    setNewPrefixo("");
    setNewObservacao("");
  };

  // Remover carro da folha
  const handleRemoveCarro = (id: string, prefixo: string) => {
    if (!confirm(`Deseja remover o carro ${prefixo} desta folha de manutenção?`)) return;
    const clean = prefixo.replace(/\D/g, "");
    const updated = items.filter(it => it.id !== id);
    setItems(updated);
    saveManutencaoData(dataOperacao, updated);
    deleteManutencaoCarroApi(id);

    // Regra: "quando tirar um carro dos bloqueios tbm tirar da tabela de ci_bloqueios"
    // Remove fisicamente da tabela ci_bloqueios no banco e limpa da lista de CI
    if (clean) {
      deleteCIBloqueioApi(clean);
      try {
        const currentCI = getInitialCIBloqueios();
        const updatedCI = currentCI.filter(c => c.prefixo.replace(/\D/g, "") !== clean);
        saveCIBloqueiosToStorage(updatedCI);
      } catch (e) {
        console.error("Erro ao remover carro da CI ao excluir:", e);
      }
    }

    toast.info(`Carro ${prefixo} removido da folha e desimpedido dos bloqueios.`);
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
      .filter(it => it.liberado && !it.bloqueado && !it.emExecucao)
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

  // Nome do arquivo no padrão oficial solicitado: CI-aa-mm-yyyy (ex: CI-25-09-2026)
  const formatDocumentoFilename = (dateIso: string) => {
    try {
      const [y, m, d] = dateIso.split("-");
      if (y && m && d) {
        return `CI-${d}-${m}-${y}`;
      }
    } catch {}
    return `CI-${dateIso}`;
  };

  // Download do Relatório em PDF com fidelidade 100% idêntica à visualização
  const handleDownloadPdf = async () => {
    if (!relatorioManutencaoRef.current) {
      toast.error("Visualização do relatório não encontrada.");
      return;
    }
    try {
      toast.info("Gerando PDF oficial de alta resolução...");
      const element = relatorioManutencaoRef.current;

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-folha-manutencao="true"]') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.boxShadow = "none";
            clonedElement.style.border = "none";
            clonedElement.style.margin = "0";
            clonedElement.style.width = "210mm";
          }
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Primeira página (ou folha única)
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      // Adiciona páginas adicionais se o relatório for longo
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      pdf.save(`${formatDocumentoFilename(dataOperacao)}.pdf`);
      toast.success("PDF baixado com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar PDF do relatório:", err);
      toast.error("Erro ao gerar PDF.");
    }
  };

  // Impressão direta da folha com layout 100% idêntico à visualização
  const handlePrintRelatorio = async () => {
    if (!relatorioManutencaoRef.current) {
      window.print();
      return;
    }
    try {
      toast.info("Preparando impressão de alta fidelidade...");
      const element = relatorioManutencaoRef.current;

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-folha-manutencao="true"]') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.boxShadow = "none";
            clonedElement.style.border = "none";
            clonedElement.style.margin = "0";
            clonedElement.style.width = "210mm";
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");

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
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <title>${formatDocumentoFilename(dataOperacao)}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 0;
              }
              * {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 210mm !important;
                background: #ffffff !important;
              }
              .print-container {
                width: 210mm !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              img {
                width: 210mm !important;
                display: block !important;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <img id="man-print-img" src="${imgData}" />
            </div>
            <script>
              const img = document.getElementById("man-print-img");
              function doPrint() {
                window.focus();
                window.print();
              }
              if (img && img.complete) {
                setTimeout(doPrint, 300);
              } else if (img) {
                img.onload = () => setTimeout(doPrint, 300);
              }
            </script>
          </body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 10000);
      }
    } catch (err) {
      console.error("Erro na impressão do relatório:", err);
      toast.error("Erro ao preparar impressão.");
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
          CABEÇALHO E QUADROS DA PLANILHA OFICIAL DE MANUTENÇÃO
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
          MODAL: CONFIRMAÇÃO DE TRANSFERÊNCIA DE SITUAÇÃO
          Exibido quando o usuário tenta adicionar um carro que já está em outro quadro
          ========================================================== */}
      <Dialog 
        open={!!confirmTransferModal} 
        onOpenChange={(open) => {
          if (!open) setConfirmTransferModal(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-3xl border-2 border-amber-500/30 dark:border-amber-500/20 bg-white dark:bg-[#0E1420] shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-gray-900 dark:text-white">
              <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <span>Transferir Situação do Veículo</span>
            </DialogTitle>
          </DialogHeader>

          {confirmTransferModal && (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-900/80 border border-gray-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-gray-900 dark:text-white">
                      Carro {confirmTransferModal.prefixo}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                      {getConsorciadaByPrefix(confirmTransferModal.prefixo)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Garagem {getGaragemFisicaByCarro(confirmTransferModal.prefixo)}
                  </span>
                </div>

                {/* Transição Visual de Situação */}
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800/80 text-xs">
                  <div className="flex flex-col gap-1 items-start">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Situação Atual</span>
                    <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs", getStatusBadgeStyle(confirmTransferModal.fromStatus))}>
                      {getStatusLabel(confirmTransferModal.fromStatus)}
                    </span>
                  </div>

                  <ArrowRightLeft className="w-4 h-4 text-gray-400 shrink-0" />

                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Nova Situação</span>
                    <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs", getStatusBadgeStyle(confirmTransferModal.toStatus))}>
                      {getStatusLabel(confirmTransferModal.toStatus)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                  O veículo <strong className="text-gray-900 dark:text-white">{confirmTransferModal.prefixo}</strong> já está registrado como <strong className="text-amber-700 dark:text-amber-400 font-bold">{getStatusLabel(confirmTransferModal.fromStatus)}</strong>.
                  <p className="mt-1 font-medium">
                    Deseja retirar o veículo de <u>{getStatusLabel(confirmTransferModal.fromStatus)}</u> e transferi-lo para <u>{getStatusLabel(confirmTransferModal.toStatus)}</u>?
                  </p>
                </div>

                {confirmTransferModal.novaObservacao && (
                  <div className="text-[11px] p-2 rounded-lg bg-gray-100/80 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 border border-gray-200/50 dark:border-slate-700/50">
                    <span className="font-bold text-gray-700 dark:text-slate-200">Novo Defeito/Obs:</span> {confirmTransferModal.novaObservacao}
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full w-full sm:w-auto"
                  onClick={() => setConfirmTransferModal(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmTransfer}
                  className={cn(
                    "rounded-full w-full sm:w-auto text-white font-bold shadow-md transition-transform active:scale-95 cursor-pointer",
                    confirmTransferModal.toStatus === "EM_EXECUCAO"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : confirmTransferModal.toStatus === "LIBERADO"
                      ? "bg-[#164E3A] hover:bg-[#113C2D]"
                      : "bg-rose-600 hover:bg-rose-700"
                  )}
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Sim, Transferir para {getStatusLabel(confirmTransferModal.toStatus)}
                </Button>
              </DialogFooter>
            </div>
          )}
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
            <div 
              ref={relatorioManutencaoRef} 
              data-folha-manutencao="true" 
              className="w-[210mm] max-w-full mx-auto bg-white text-black p-6 sm:p-8 rounded-2xl shadow-md border border-gray-300 space-y-5"
            >
              
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
                    .filter((it) => it.liberado && !it.bloqueado && !it.emExecucao)
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
                      <div className="grid grid-cols-3 gap-2.5">
                        
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
