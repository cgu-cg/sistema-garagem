import { explicitGarage, canDispatch, canReadScale, canOfferRelease, canWriteDailyScale } from '@/lib/operationalAccess';
import { c4Context, c4Folha } from '@/lib/c4';
import { ciSelectionDate } from '@/lib/ciInitialDate';
import { isReadInterrupted } from '@/lib/readCoordination';
import { operationalContext } from '@/lib/mvpTemporal';
import { useEffect, useState, useMemo, useCallback, useRef, Fragment } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/stores/auth";
import { api } from "@/lib/api";
import { confirmedWrite } from "@/lib/confirmedWrite";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { toast } from "sonner";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  RefreshCw,
  Wrench,
  MapPin,
  Calendar,
  Check,
  FileSpreadsheet,
  Plus,
  Bus,
  Tag,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Warehouse
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  SolturaItem,
  vcgSegundaSextaMatutino,
  vcgSegundaSextaVespertino,
  vcgSabado,
  vcgDomingoFeriado,
  vcmSegundaSexta,
  vcmSabado,
  vcmDomingoFeriado,
  terminaisReservaVCG,
  terminaisReservaVCM,
  BloqueioCarro,
  TerminalReserva,
  parseTimeToMinutes,
  reservasGaragemVCG
} from "@/data/solturaData";
import { drivers } from "@/data/drivers";
import { cn } from "@/lib/utils";
import { CiManutencaoView } from "./CiManutencaoView";
import { AlterarFolhaView } from "./AlterarFolhaView";
import { AlterarCarroProgramadoView } from "./AlterarCarroProgramadoView";
import { CarroRealizadoView } from "./CarroRealizadoView";
import { checkCarroBloqueado, subscribeCIUpdates, fetchCIBloqueiosFromApi, getGaragemFisicaByCarro } from "./ciManager";
import { loadSharedEscala, saveSharedEscala, SharedEscala, EscalaContext, DailyEscala, loadDailyEscala, saveDailyEscala, saveDailyScaleCard, CardMutation } from '@/lib/sharedEscala';
import { applyDailySchedule, fixedScheduleRows, fixedScheduleToken } from '@/lib/dailySchedule';

type GaragemType = "VCG" | "VCM";
export type EscalaTipo = "SEG_SEX" | "SABADO" | "DOM_FER";
export type TurnoTipo = "MATUTINO" | "VESPERTINO";
export type ViewMode = "FOLHA" | "HISTORICO" | "CARRO_REALIZADO" | "CI_MANUTENCAO" | "CARDS" | "CI_BLOQUEIOS" | "RESERVAS" | "ALTERAR_FOLHA" | "ALTERAR_CARRO_PROGRAMADO";
type FilterStatus = "TODOS" | "PENDENTES" | "LIBERADOS" | "SUBSTITUIDOS" | "ATRASADOS";

export interface ReservaTerminalItem {
  id: number;
  carro: string;
  tipo: "VERMELHO" | "AZUL" | "CORINGA" | "MICRO" | "ARTICULADO";
  terminal: string;
  dataHora: string;
  garagem?: string;
}

export const TERMINAIS_PADRAO = [
  "Term. Bandeirantes",
  "Term. Júlio de Castilho",
  "Term. General Osório",
  "Term. Nova Bahia"
];

export const TIPOS_RESERVA: Array<{
  value: "VERMELHO" | "AZUL" | "CORINGA" | "MICRO" | "ARTICULADO";
  label: string;
  dotColor: string;
}> = [
    { value: "VERMELHO", label: "Vermelho", dotColor: "bg-rose-500" },
    { value: "AZUL", label: "Azul", dotColor: "bg-sky-500" },
    { value: "CORINGA", label: "Coringa", dotColor: "bg-amber-500" },
    { value: "MICRO", label: "Micro", dotColor: "bg-purple-500" },
    { value: "ARTICULADO", label: "Articulado", dotColor: "bg-orange-500" }
  ];

import { CarroTrocaPopover, TrocaCarroItem } from "./CarroTrocaPopover";

export interface DispatchedRecord {
  scheduleId: string;
  carroRealizado: string;
  motoristaCodigo: string;
  motoristaNome: string;
  horaLiberacao: string;
  observacoes?: string;
  substituido: boolean;
  historicoTrocas?: TrocaCarroItem[];
}

export function getHojeLocal(): string {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function getOntemLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function formatarDataBr(isoDate: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

export function ajustarDia(isoDate: string, dias: number): string {
  if (!isoDate) return getHojeLocal();
  const parts = isoDate.split("-");
  if (parts.length !== 3) return getHojeLocal();
  const ano = parseInt(parts[0], 10);
  const mes = parseInt(parts[1], 10) - 1;
  const dia = parseInt(parts[2], 10);
  const d = new Date(ano, mes, dia);
  d.setDate(d.getDate() + dias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getTextoDataHistorico(isoDate: string): string {
  if (!isoDate) return "Hoje";
  const hoje = getHojeLocal();
  if (isoDate === hoje) {
    return "Hoje";
  }
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const [ano, mes, dia] = parts;
  const anoAtual = String(new Date().getFullYear());
  if (ano === anoAtual) {
    return `${dia}/${mes}`;
  }
  return `${dia}/${mes}/${ano}`;
}

interface SolturaPageProps {
  defaultTab?: ViewMode;
}

export function SolturaPage({ defaultTab }: SolturaPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const dateInputRef = useRef<HTMLInputElement>(null);
  const scaleDateInputRef = useRef<HTMLInputElement>(null);

  // Determinar empresa permitida:
  // Se for ADMIN, permite alternar livremente.
  // Se for colaborador (ex: soltura_vcg@teste.com ou soltura_vcm@teste.com), fixa na sua respectiva empresa.
  const userGaragem = explicitGarage(user);

  // Garagem e tipo de escala
  const [garagem, setGaragem] = useState<GaragemType>(() => {
    if (user && user.role !== "ADMIN") {
      return explicitGarage(user)!;
    }
    return "VCG";
  });

  // Garantir que perfis não-admin sempre fiquem fixos em sua própria garagem
  useEffect(() => {
    if (!isAdmin && userGaragem) {
      setGaragem(userGaragem);
    }
  }, [isAdmin, userGaragem]);

  const [escalaTipo, setEscalaTipo] = useState<EscalaTipo>("SEG_SEX");
  const [turnoTipo, setTurnoTipo] = useState<TurnoTipo>("MATUTINO");
  const [dataOperacao, setDataOperacao] = useState(() => getHojeLocal());
  // A CI nao altera a data compartilhada pelas telas de soltura e historico.
  const [ciDate, setCIDate] = useState<string | null>(null);
  const ciDateManual = useRef(false);
  const ciDateContext = useRef<{ garagem: string; c4: boolean } | null>(null);
  const chooseCIDate = useCallback((date: string) => {
    ciDateManual.current = true;
    setCIDate(date);
  }, []);

  // Modos de visualização
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (location.pathname.includes("/historico")) return "HISTORICO";
    if (location.pathname.includes("/ci-manutencao") || location.pathname.includes("/manutencao")) return "CI_MANUTENCAO";
    if (location.pathname.includes("/carro-realizado")) return "CARRO_REALIZADO";
    if (location.pathname.includes("/alterar-folha") || location.pathname.includes("/soltura-adm")) return "ALTERAR_FOLHA";
    if (location.pathname.includes("/alterar-carro-programado") || location.pathname.includes("/escala-carros")) return "ALTERAR_CARRO_PROGRAMADO";
    if (location.pathname.includes("/reservas")) return "RESERVAS";
    return defaultTab || "FOLHA";
  });

  const isCIView = viewMode === 'CI_MANUTENCAO' || viewMode === 'CI_BLOQUEIOS';
  const ciMode = c4Context(garagem === 'VCM' ? 'VCM' : 'VCG')?.mode;
  const ciC4Enabled = ciMode ? ciMode === 'C4' : ciDateContext.current?.garagem === garagem && ciDateContext.current.c4;
  useEffect(() => {
    if (!isCIView) {
      setCIDate(null);
      ciDateManual.current = false;
      ciDateContext.current = null;
      return;
    }
    const previous = ciDateContext.current;
    if (previous?.garagem !== garagem || (!ciDateManual.current && previous.c4 !== ciC4Enabled)) {
      setCIDate(ciC4Enabled ? ciSelectionDate(null, true) : getHojeLocal());
      ciDateManual.current = false;
    }
    ciDateContext.current = { garagem, c4: ciC4Enabled };
  }, [isCIView, garagem, ciC4Enabled]);
  const c4ReleaseAllowed = canOfferRelease(user, garagem, Boolean(ciC4Enabled), c4Folha(dataOperacao, garagem)?.status);

  // Atualizar viewMode baseado na URL quando a rota mudar
  useEffect(() => {
    if (location.pathname.endsWith("/historico")) {
      setViewMode("HISTORICO");
    } else if (location.pathname.includes("/ci-manutencao") || location.pathname.includes("/manutencao")) {
      setViewMode("CI_MANUTENCAO");
    } else if (location.pathname.endsWith("/carro-realizado")) {
      setViewMode("CARRO_REALIZADO");
    } else if (location.pathname.includes("/alterar-folha") || location.pathname.includes("/soltura-adm")) {
      setViewMode("ALTERAR_FOLHA");
    } else if (location.pathname.includes("/alterar-carro-programado") || location.pathname.includes("/escala-carros")) {
      setViewMode("ALTERAR_CARRO_PROGRAMADO");
    } else if (location.pathname.endsWith("/reservas")) {
      setViewMode("RESERVAS");
    } else if (location.pathname.endsWith("/soltura") && !defaultTab) {
      setViewMode("FOLHA");
    } else if (defaultTab) {
      setViewMode(defaultTab);
    }
  }, [location.pathname, defaultTab]);


  // Legado mantem sua data inicial; C4 usa a preferencia civil das 03h acima.
  // No Histórico (/soltura/historico), inicia por padrão em ontem para consulta imediata de outros dias.
  useEffect(() => {
    if (viewMode === "FOLHA") {
      setDataOperacao(getHojeLocal());
    } else if (viewMode === "HISTORICO") {
      setDataOperacao(getOntemLocal());
    }
  }, [viewMode]);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>("TODOS");
  const [searchQuery, setSearchQuery] = useState("");
  const [isListaEstendida, setIsListaEstendida] = useState(false);

  // Base de CIs Bloqueados sincronizada e persistida
  const [ciList, setCiList] = useState<BloqueioCarro[]>([]);

  const [ciReadError, setCIReadError] = useState('');
  const ciReadGarage = useRef(garagem);
  ciReadGarage.current = garagem;

  // Carregar CIs Bloqueados diretamente do banco oficial SQL Server
  useEffect(() => {
    let active = true;
    setCIReadError('');
    fetchCIBloqueiosFromApi({ garagem }).then((data) => {
      if (active && ciReadGarage.current === garagem && Array.isArray(data)) {
        setCiList(data); setCIReadError('');
      }
    }).catch(error => { if (active && ciReadGarage.current === garagem && !isReadInterrupted(error)) setCIReadError('Consulta oficial indisponivel; disponibilidade nao confirmada.'); });
    return () => { active = false; };
  }, [garagem]);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeCIUpdates((updated, context) => {
      if (!active || ciReadGarage.current !== garagem) return;
      if (context && (context.garagem !== garagem || context.day !== operationalContext().today)) return;
      if (Array.isArray(updated)) {
        setCiList(updated);
      }
    });

    const handleManutUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail?.fromCISync) return;
      fetchCIBloqueiosFromApi({ garagem }).then(data => {
        if (active && ciReadGarage.current === garagem && Array.isArray(data)) { setCiList(data); setCIReadError(''); }
      }).catch(error => { if (active && ciReadGarage.current === garagem && !isReadInterrupted(error)) setCIReadError('Consulta oficial indisponivel; disponibilidade nao confirmada.'); });
    };
    window.addEventListener("manutencao_updated", handleManutUpdate);

    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener("manutencao_updated", handleManutUpdate);
    };
  }, [garagem]);

  // Chave de armazenamento por Turno e Escala (usada como cache de contingência)
  const getDispatchStorageKey = (g: string, e: string, t: TurnoTipo, d: string) => {
    return `soltura_dispatches_${g}_${e}_${e === "SEG_SEX" ? t : "PADRAO"}_${d}`;
  };

  // Despachos em memória sincronizados estritamente com o backend SQL Server
  const [dispatches, setDispatches] = useState<Record<string, DispatchedRecord>>({});
  const dispatchContextKey = JSON.stringify([garagem, escalaTipo, turnoTipo, dataOperacao]);
  const selectedDispatchKey = useRef(dispatchContextKey);
  selectedDispatchKey.current = dispatchContextKey;

  // Rascunhos de digitação na folha antes da liberação
  const [drafts, setDrafts] = useState<Record<string, { carro?: string; moto?: string }>>({});

  const handleDraftChange = (itemId: string, field: "carro" | "moto", value: string) => {
    setDrafts(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  // Limpar despachos e rascunhos ao alternar filtros antes da carga da API
  useEffect(() => {
    setDispatches({});
    setDrafts({});
  }, [garagem, escalaTipo, turnoTipo, dataOperacao]);

  // Persistir despachos no localStorage (apenas como cache local)
  const saveDispatches = (newDispatches: Record<string, DispatchedRecord>) => {
    if (selectedDispatchKey.current === dispatchContextKey) setDispatches(newDispatches);
    try {
      const key = getDispatchStorageKey(garagem, escalaTipo, turnoTipo, dataOperacao);
      if (Object.keys(newDispatches).length === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newDispatches));
      }
    } catch (e) {
      console.error("Erro ao salvar despachos no localStorage:", e);
    }
  };

  const [customSchedules, setCustomSchedules] = useState<Record<string, SolturaItem[]>>({});
  const [sharedScale, setSharedScale] = useState<SharedEscala | null>(null);
  const [scaleError, setScaleError] = useState('');
  const scaleWritePending = useRef(false);
  const scaleWriteContext = useRef<string | null>(null);
  const scaleReadSequence = useRef(0);
  const dailyDirtyFields = useRef(new Set<string>());
  const scaleContext: EscalaContext = { garagem, escalaTipo, turno: escalaTipo === 'SEG_SEX' ? (viewMode === 'ALTERAR_CARRO_PROGRAMADO' ? 'MATUTINO' : turnoTipo) : 'PADRAO' };
  const scaleContextKey = JSON.stringify(scaleContext);
  const dailyContext = { ...scaleContext, dataOperacao };
  const dailyContextKey = JSON.stringify(dailyContext);
  const [dailyScale, setDailyScale] = useState<DailyEscala | null>(null);
  const [dailyError, setDailyError] = useState('');
  const [dailyEditEpoch, setDailyEditEpoch] = useState(0);
  const dailyReadSequence = useRef(0);
  const dailyWritePending = useRef(false);
  const dailyWriteContext = useRef<string | null>(null);
  const selectedDailyKey = useRef(dailyContextKey);
  selectedDailyKey.current = dailyContextKey;
  const dailyReady = Boolean(dailyScale && JSON.stringify(dailyScale.contexto) === dailyContextKey && !dailyError);
  const canConsultDailyScale = canReadScale(user);
  const dailyDateEditable = dataOperacao === operationalContext().today;
  const canEditDailyScale = canWriteDailyScale(user, garagem) && dailyDateEditable;
  const permanentReady = Boolean(sharedScale && JSON.stringify(sharedScale.contexto) === scaleContextKey && !scaleError);
  const releaseUiAllowed = c4ReleaseAllowed && permanentReady;
  const reloadDailyScale = async () => {
    if (viewMode !== 'ALTERAR_CARRO_PROGRAMADO') return;
    if ((dailyWritePending.current && dailyWriteContext.current === dailyContextKey) || dailyDirtyFields.current.size) return;
    const request = ++dailyReadSequence.current, key = dailyContextKey;
    try {
      const loaded = await loadDailyEscala(dailyContext);
      if (selectedDailyKey.current !== key || request !== dailyReadSequence.current) return;
      setDailyScale(loaded); setDailyError('');
    } catch (error) {
      if (selectedDailyKey.current !== key || request !== dailyReadSequence.current) return;
      setDailyScale(null); setDailyError(error instanceof Error ? error.message : 'Alteracoes do dia indisponiveis.');
    }
  };
  useEffect(() => {
    dailyDirtyFields.current.clear();
    setDailyScale(null); setDailyError('');
    if (viewMode !== 'ALTERAR_CARRO_PROGRAMADO' || !canConsultDailyScale) return;
    void reloadDailyScale();
    const refresh = () => { void reloadDailyScale(); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [dailyContextKey, viewMode, canConsultDailyScale, user?.id]);
  useEffect(() => { if (viewMode !== 'ALTERAR_CARRO_PROGRAMADO') dailyDirtyFields.current.clear(); }, [viewMode]);
  const persistDailySchedule = async (id: string, prefixo: string) => {
    if (dataOperacao !== operationalContext().today) {
      toast.error('Somente a escala de hoje pode ser alterada.'); return false;
    }
    const base = fixedScheduleToken(scaleContext, id);
    if (!canEditDailyScale || !dailyReady || !dailyScale || dailyWritePending.current || !base) {
      toast.error('Consulte as substituicoes oficiais antes de salvar.'); return false;
    }
    const key = dailyContextKey;
    dailyWritePending.current = true; dailyWriteContext.current = key; ++dailyReadSequence.current;
    try {
      const saved = await saveDailyEscala(dailyContext, dailyScale.revisao, id, prefixo, base);
      if (selectedDailyKey.current === key) { setDailyScale(saved); setDailyError(''); }
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Alteracao diaria nao gravada. Recarregue e revise.');
      return false;
    } finally { dailyWritePending.current = false; dailyWriteContext.current = null; }
  };
  const selectedScaleKey = useRef(scaleContextKey);
  const persistDailyCard = async (mutation: CardMutation) => {
    if (dataOperacao !== operationalContext().today) {
      toast.error('Somente a escala de hoje pode ser alterada.'); return false;
    }
    if (!canEditDailyScale || !dailyReady || !dailyScale || dailyWritePending.current) {
      toast.error('Consulte a escala oficial e aguarde a gravacao pendente.'); return false;
    }
    const key = dailyContextKey;
    dailyWritePending.current = true; dailyWriteContext.current = key; ++dailyReadSequence.current;
    try {
      const saved = await saveDailyScaleCard(dailyContext, dailyScale.revisao, mutation);
      if (selectedDailyKey.current === key) { setDailyScale(saved); setDailyError(''); }
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Card nao gravado. Recarregue e revise.'); return false;
    } finally { dailyWritePending.current = false; dailyWriteContext.current = null; }
  };
  selectedScaleKey.current = scaleContextKey;
  const reloadSharedScale = async () => {
    if (viewMode === 'ALTERAR_CARRO_PROGRAMADO') return;
    if (dailyDirtyFields.current.size) return;
    if (scaleWritePending.current && scaleWriteContext.current === scaleContextKey) return;
    const request = ++scaleReadSequence.current;
    const key = scaleContextKey;
    try {
      const loaded = await loadSharedEscala(scaleContext);
      if (selectedScaleKey.current !== key || request !== scaleReadSequence.current) return;
      setSharedScale(loaded); setScaleError('');
      setCustomSchedules({ [scheduleKey]: loaded.itens });
    } catch (error) {
      if (selectedScaleKey.current !== key || request !== scaleReadSequence.current) return;
      setSharedScale(null); setCustomSchedules({});
      setScaleError(error instanceof Error ? error.message : 'Escala oficial indisponivel.');
    }
  };
  useEffect(() => {
    setSharedScale(null); setCustomSchedules({});
    if (!canReadScale(user)) return;
    void reloadSharedScale();
    const refresh = () => { if (!scaleWritePending.current) void reloadSharedScale(); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [scaleContextKey, viewMode]);
  const persistCustomSchedules = async (updater: (prev: Record<string, SolturaItem[]>) => Record<string, SolturaItem[]>) => {
    if (!isAdmin || !permanentReady || !sharedScale || scaleWritePending.current || dailyWritePending.current) {
      toast.error('Carregue a escala oficial e aguarde a gravacao; publicacao requer ADMIN.'); return false;
    }
    const next = updater(customSchedules)[scheduleKey];
    if (!next) { toast.error('Escala sem contexto.'); return false; }
    const key = scaleContextKey;
    scaleWritePending.current = true;
    scaleWriteContext.current = key;
    ++scaleReadSequence.current; // Uma leitura anterior nao pode sobrescrever a publicacao.
    try {
      const saved = await saveSharedEscala(scaleContext, sharedScale.revisao, next);
      if (selectedScaleKey.current === key) { setSharedScale(saved); setCustomSchedules({ [scheduleKey]: saved.itens }); }
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Escala nao gravada.');
      return false;
    } finally { scaleWritePending.current = false; scaleWriteContext.current = null; }
  };

  const defaultSchedules = useMemo<SolturaItem[]>(() => {
    if (garagem === "VCG") {
      if (escalaTipo === "SEG_SEX") {
        return turnoTipo === "MATUTINO" ? vcgSegundaSextaMatutino : vcgSegundaSextaVespertino;
      }
      if (escalaTipo === "SABADO") return vcgSabado;
      return vcgDomingoFeriado;
    } else {
      if (escalaTipo === "SEG_SEX") return vcmSegundaSexta;
      if (escalaTipo === "SABADO") return vcmSabado;
      return vcmDomingoFeriado;
    }
  }, [garagem, escalaTipo, turnoTipo]);

  const scheduleKey = `${garagem}_${escalaTipo}_${escalaTipo === "SEG_SEX" ? turnoTipo : "PADRAO"}`;
  const permanentSchedules = permanentReady && sharedScale?.publicada ? customSchedules[scheduleKey] ?? defaultSchedules : defaultSchedules;
  const rawBaseSchedules = permanentSchedules;
  const fixedRows = useMemo(() => fixedScheduleRows(scaleContext), [scaleContextKey]);
  const dailySchedules = useMemo(() => applyDailySchedule(fixedRows, dailyReady ? dailyScale : null), [fixedRows, dailyScale, dailyReady]);
  const baseSchedules = useMemo(() => {
    return [...rawBaseSchedules].sort((a, b) => {
      // Priorizar a ordem sequencial oficial da folha de soltura
      if (a.ordem !== undefined && b.ordem !== undefined) return a.ordem - b.ordem;
      if (a.ordem !== undefined) return -1;
      if (b.ordem !== undefined) return 1;
      const timeA = parseTimeToMinutes(a.saidaGaragem);
      const timeB = parseTimeToMinutes(b.saidaGaragem);
      return timeA - timeB;
    });
  }, [rawBaseSchedules]);

  const [isSyncingDb, setIsSyncingDb] = useState(false);

  // Sincronizar com o banco de dados oficial (SQL Server)
  useEffect(() => {
    if (!canDispatch(user)) return;
    let isCancelled = false;
    setIsSyncingDb(true);

    api.listSolturas({
      date: dataOperacao,
      garagem,
      turno: escalaTipo === "SEG_SEX" ? turnoTipo : undefined,
      escalaTipo,
    })
      .then((records: any[]) => {
        if (isCancelled) return;
        const key = getDispatchStorageKey(garagem, escalaTipo, turnoTipo, dataOperacao);

        if (Array.isArray(records)) {
          if (records.length > 0) {
            // Se existem registros no banco para essa data, o banco é a autoridade máxima
            const dbDispatches: Record<string, DispatchedRecord> = {};
            records.forEach((rec) => {
              const sid = rec.scheduleId || `${rec.linha}_${rec.tabela}`;
              dbDispatches[sid] = {
                scheduleId: sid,
                carroRealizado: rec.carroRealizado,
                motoristaCodigo: rec.driverCode || "",
                motoristaNome: rec.driverName || "",
                horaLiberacao: rec.horaLiberacao || "",
                observacoes: rec.notes || undefined,
                substituido: !!rec.substituido,
                historicoTrocas: rec.historicoTrocas || [],
              };
            });
            setDispatches(dbDispatches);
            localStorage.setItem(key, JSON.stringify(dbDispatches));
          } else {
            // O BANCO DE DADOS É A AUTORIDADE MÁXIMA: se o banco retornou 0 registros para esta data/turno,
            // a folha DEVE zerar imediatamente, limpando qualquer cache do localStorage!
            setDispatches({});
            localStorage.removeItem(key);
          }
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setDispatches({});
        toast.error(err instanceof Error ? err.message : 'Historico oficial indisponivel. Cache local nao confirma solturas.');
      })
      .finally(() => {
        if (!isCancelled) setIsSyncingDb(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [garagem, escalaTipo, turnoTipo, dataOperacao]);

  // Persistir despacho individual na API
  const dispatchWritePending = useRef(false);
  const persistDispatchToApi = async (item: SolturaItem, record: DispatchedRecord) => {
      if (!releaseUiAllowed) throw new Error('Soltura indisponivel para este perfil ou contexto de CI.');
      await api.createSoltura({
        scheduleId: item.id,
        carroProgramado: item.carroProgramado || null,
        carroRealizado: record.carroRealizado,
        linha: item.linha,
        tabela: item.tabela,
        driverCode: record.motoristaCodigo || null,
        driverName: record.motoristaNome || null,
        saidaGaragem: item.saidaGaragem || null,
        inicioLinha: item.inicioLinha || item.inicioBairro || null,
        horaLiberacao: record.horaLiberacao || null,
        garagem,
        turno: escalaTipo === "SEG_SEX" ? turnoTipo : "PADRAO",
        escalaTipo,
        dataOperacao,
        substituido: record.substituido,
        historicoTrocas: record.historicoTrocas || [],
        status: "LIBERADO",
        notes: record.observacoes || null,
      });
  };

  // Salvar múltiplos despachos (usado pelo CarroRealizadoView)
  const handleSaveDispatchFromView = async (newDispatches: Record<string, DispatchedRecord>): Promise<boolean> => {
    if (!releaseUiAllowed) { toast.error('Soltura indisponivel para este perfil ou contexto de CI.'); return false; }
    if (dispatchWritePending.current) { toast.error("Aguarde a gravacao pendente."); return false; }
    const itemsToPersist = Object.values(newDispatches).map(disp => {
      const sched = baseSchedules.find(s => s.id === disp.scheduleId);
      return {
        scheduleId: disp.scheduleId,
        carroProgramado: sched?.carroProgramado || null,
        carroRealizado: disp.carroRealizado,
        linha: sched?.linha || "",
        tabela: sched?.tabela || "",
        driverCode: disp.motoristaCodigo || null,
        driverName: disp.motoristaNome || null,
        saidaGaragem: sched?.saidaGaragem || null,
        inicioLinha: sched?.inicioLinha || sched?.inicioBairro || null,
        horaLiberacao: disp.horaLiberacao || null,
        substituido: !!disp.substituido,
        historicoTrocas: disp.historicoTrocas || [],
        status: "LIBERADO",
        notes: disp.observacoes || null
      };
    }).filter(i => i.linha && i.tabela);

    if (!itemsToPersist.length || itemsToPersist.length !== Object.keys(newDispatches).length) {
      toast.error("Viagem sem contexto oficial. Nada foi gravado."); return false;
    }
    dispatchWritePending.current = true;
    try {
      await confirmedWrite(() => api.batchSyncSolturas({ dataOperacao, garagem,
        turno: escalaTipo === "SEG_SEX" ? turnoTipo : "PADRAO", escalaTipo, items: itemsToPersist }),
        () => saveDispatches(newDispatches));
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Soltura nao confirmada."); return false;
    } finally { dispatchWritePending.current = false; }

  };

  const handleUpdateScheduleField = async (itemId: string, field: keyof SolturaItem, value: any) => {
    // Regra: Bloquear duplicidade de carro programado na mesma escala
    if (field === "carroProgramado" && value) {
      const cleanVal = String(value).trim();
      if (cleanVal) {
        const current = customSchedules[scheduleKey] ? [...customSchedules[scheduleKey]] : [...defaultSchedules];
        const duplicate = current.find(s => s.id !== itemId && s.carroProgramado?.trim() === cleanVal);
        if (duplicate) {
          toast.error(`O carro ${cleanVal} já está programado na Linha ${duplicate.linha} (Tab ${duplicate.tabela})! Não é permitido o mesmo carro programado.`);
          return false;
        }
      }
    }

    const saved = await persistCustomSchedules(prev => {
      const current = prev[scheduleKey] ? [...prev[scheduleKey]] : [...defaultSchedules];
      const idx = current.findIndex(s => s.id === itemId);
      if (idx >= 0) {
        current[idx] = { ...current[idx], [field]: value };
      }
      return { ...prev, [scheduleKey]: current };
    });
    if (saved) toast.success("Alteração salva com sucesso!");
    return saved;
  };

  const handleUpdateScheduleMultipleFields = async (itemId: string, updates: Partial<SolturaItem>) => {
    if (updates.carroProgramado !== undefined) {
      const cleanVal = String(updates.carroProgramado || "").trim();
      if (cleanVal) {
        const current = customSchedules[scheduleKey] ? [...customSchedules[scheduleKey]] : [...defaultSchedules];
        const duplicate = current.find(s => s.id !== itemId && s.carroProgramado?.trim() === cleanVal);
        if (duplicate) {
          toast.error(`O carro ${cleanVal} já está programado na Linha ${duplicate.linha} (Tab ${duplicate.tabela})! Não é permitido o mesmo carro programado.`);
          return false;
        }
      }
    }

    const saved = await persistCustomSchedules(prev => {
      const current = prev[scheduleKey] ? [...prev[scheduleKey]] : [...defaultSchedules];
      const idx = current.findIndex(s => s.id === itemId);
      if (idx >= 0) {
        current[idx] = { ...current[idx], ...updates };
      }
      return { ...prev, [scheduleKey]: current };
    });
    if (saved) toast.success("Alteração salva com sucesso!");
    return saved;
  };

  const handleAddSchedule = async (newItem: SolturaItem) => {
    // Regra: Bloquear duplicidade de carro programado ao adicionar
    if (newItem.carroProgramado && newItem.carroProgramado.trim()) {
      const cleanVal = newItem.carroProgramado.trim();
      const current = customSchedules[scheduleKey] ? [...customSchedules[scheduleKey]] : [...defaultSchedules];
      const duplicate = current.find(s => s.carroProgramado?.trim() === cleanVal);
      if (duplicate) {
        toast.error(`O carro ${cleanVal} já está programado na Linha ${duplicate.linha} (Tab ${duplicate.tabela})! Não é permitido o mesmo carro programado.`);
        return false;
      }
    }

    const saved = await persistCustomSchedules(prev => {
      const current = prev[scheduleKey] ? [...prev[scheduleKey]] : [...defaultSchedules];
      return { ...prev, [scheduleKey]: [...current, newItem] };
    });
    if (saved) toast.success("Novo horário adicionado e salvo com sucesso!");
    return saved;
  };

  const handleDeleteSchedule = async (itemId: string) => {
    const saved = await persistCustomSchedules(prev => {
      const current = prev[scheduleKey] ? [...prev[scheduleKey]] : [...defaultSchedules];
      const filtered = current.filter(s => s.id !== itemId);
      return { ...prev, [scheduleKey]: filtered };
    });
    if (saved) toast.success("Viagem removida da folha!");
    return saved;
  };

  // Reservas de terminais persistidas no banco de dados
  const [reservasTerminais, setReservasTerminais] = useState<ReservaTerminalItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState<string>("");
  const [inputCarro, setInputCarro] = useState("");
  const [selectedTipo, setSelectedTipo] = useState<"VERMELHO" | "AZUL" | "CORINGA" | "MICRO" | "ARTICULADO">("VERMELHO");
  const [isSubmittingReserva, setIsSubmittingReserva] = useState(false);

  // Reservas da Garagem Central (VCG) - Card separado independente com persistência
  const [reservasGaragem, setReservasGaragem] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("sistema-garagem-reservas-garagem-vcg");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao ler reservasGaragem do localStorage:", e);
    }
    return reservasGaragemVCG;
  });
  const [isGaragemModalOpen, setIsGaragemModalOpen] = useState(false);
  const [inputCarroGaragem, setInputCarroGaragem] = useState("");
  const [isSubmittingGaragem, setIsSubmittingGaragem] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("sistema-garagem-reservas-garagem-vcg", JSON.stringify(reservasGaragem));
    } catch (e) {
      console.error("Erro ao salvar reservasGaragem no localStorage:", e);
    }
  }, [reservasGaragem]);

  const handleOpenAddGaragemModal = () => {
    setInputCarroGaragem("");
    setIsGaragemModalOpen(true);
  };

  const handleAddReservaGaragem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCarro = inputCarroGaragem.trim();
    if (!cleanCarro) {
      toast.error("Por favor, informe o prefixo do carro.");
      return;
    }

    if (reservasGaragem.includes(cleanCarro)) {
      toast.error(`Carro ${cleanCarro} já está na reserva da garagem central.`);
      return;
    }

    const conflitoSoltura = activeSchedules.find(s => {
      const disp = dispatches[s.id];
      const prog = s.carroProgramado?.trim();
      const realiz = (disp?.carroRealizado || s.carroRealizado || drafts[s.id]?.carro || "").trim();
      return prog === cleanCarro || realiz === cleanCarro;
    });

    if (conflitoSoltura) {
      toast.warning(`Atenção: Carro ${cleanCarro} já está escalado na Linha ${conflitoSoltura.linha} / Tab ${conflitoSoltura.tabela}.`);
    }

    try {
      setIsSubmittingGaragem(true);
      try {
        const created = await api.createReservaTerminal({
          carro: cleanCarro,
          tipo: "AZUL",
          terminal: "GARAGEM CENTRAL",
          garagem: garagem,
        });
        setReservasTerminais(prev => [...prev, created]);
      } catch (err) {
        // Fallback local se API der erro ou conexão oscilar
      }

      setReservasGaragem(prev => [...prev, cleanCarro]);
      toast.success(`Carro ${cleanCarro} adicionado à Reserva da Garagem Central!`);
      setIsGaragemModalOpen(false);
      setInputCarroGaragem("");
    } catch (err) {
      console.error("Erro ao adicionar carro na reserva da garagem:", err);
      toast.error("Erro ao adicionar carro na reserva.");
    } finally {
      setIsSubmittingGaragem(false);
    }
  };

  const handleRemoveReservaGaragem = async (carro: string) => {
    setReservasGaragem(prev => prev.filter(c => c !== carro));
    const itemApi = reservasTerminais.find(r => (r.terminal === "GARAGEM CENTRAL" || r.terminal === "GARAGEM") && r.carro === carro);
    if (itemApi) {
      try {
        await api.deleteReservaTerminal(itemApi.id);
        setReservasTerminais(prev => prev.filter(r => r.id !== itemApi.id));
      } catch (err) {
        // ignore
      }
    }
    toast.info(`Carro ${carro} removido da Reserva da Garagem Central.`);
  };

  const loadReservas = useCallback(async () => {
    try {
      const data = await api.listReservasTerminais({
        garagem,
        date: dataOperacao
      });
      setReservasTerminais(data || []);
    } catch (err) {
      console.error("Erro ao carregar reservas de terminais:", err);
    }
  }, [garagem, dataOperacao]);

  useEffect(() => {
    if (canDispatch(user)) loadReservas();
  }, [loadReservas]);

  const handleOpenAddModal = (terminal: string) => {
    setSelectedTerminal(terminal);
    setInputCarro("");
    setSelectedTipo("VERMELHO");
    setIsModalOpen(true);
  };

  const handleAddReserva = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCarro = inputCarro.trim();
    if (!cleanCarro) {
      toast.error("Por favor, informe o prefixo do carro.");
      return;
    }

    // Apenas permitir adicionar se NÃO estiver já na lista de soltura
    const conflitoSoltura = activeSchedules.find(s => {
      const disp = dispatches[s.id];
      const prog = s.carroProgramado?.trim();
      const realiz = (disp?.carroRealizado || s.carroRealizado || drafts[s.id]?.carro || "").trim();
      return prog === cleanCarro || realiz === cleanCarro;
    });

    if (conflitoSoltura) {
      toast.error(`Carro já escalado na linha ${conflitoSoltura.linha} - tabela ${conflitoSoltura.tabela}`);
      return;
    }

    try {
      setIsSubmittingReserva(true);
      const created = await api.createReservaTerminal({
        carro: cleanCarro,
        tipo: selectedTipo,
        terminal: selectedTerminal,
        garagem: garagem,
      });
      setReservasTerminais(prev => [...prev, created]);
      toast.success(`Carro ${cleanCarro} adicionado à reserva do ${selectedTerminal}!`);

      setIsModalOpen(false);
      setInputCarro("");
    } catch (err) {
      console.error("Erro ao adicionar reserva:", err);
      toast.error("Erro ao salvar reserva no banco.");
    } finally {
      setIsSubmittingReserva(false);
    }
  };

  const handleRemoveReserva = async (id: number, carro: string) => {
    try {
      await api.deleteReservaTerminal(id);
      setReservasTerminais(prev => prev.filter(r => r.id !== id));
      toast.success(`Carro ${carro} removido da reserva.`);
    } catch (err) {
      console.error("Erro ao remover reserva:", err);
      toast.error("Erro ao remover reserva.");
    }
  };

  // Reservas ativas (legado/fallback)
  const reservasAtivas = useMemo<TerminalReserva[]>(() => {
    return garagem === "VCG" ? terminaisReservaVCG : terminaisReservaVCM;
  }, [garagem]);

  // Pendurados / Bloqueados na CI ativos oficiais (Filtrados estritamente pela garagem atual: VCG ou VCM)
  const penduradosAtivos = useMemo<BloqueioCarro[]>(() => {
    const targetGaragem = garagem || "VCG";
    const bloqueados = (ciList || []).filter(c => {
      if (c.status === "LIBERADO") return false;
      const isBloqueadoReal = (
        c.categoriaPlanilha === "BLOQUEADO" ||
        (!c.categoriaPlanilha && !c.setorOficina && !c.tipoPreventiva && !c.horarioReforco)
      );
      if (!isBloqueadoReal) return false;
      const carroGaragem = c.garagem || getGaragemFisicaByCarro(c.prefixo);
      return carroGaragem === targetGaragem;
    });

    // Deduplica por prefixo
    const map = new Map<string, BloqueioCarro>();
    bloqueados.forEach(c => {
      const clean = (c.prefixo || "").trim();
      if (clean && !map.has(clean)) {
        map.set(clean, c);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const numA = parseInt(a.prefixo.replace(/\D/g, ""), 10);
      const numB = parseInt(b.prefixo.replace(/\D/g, ""), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.prefixo.localeCompare(b.prefixo);
    });
  }, [ciList, garagem]);

  // Mapear itens mesclando programação base + despachos realizados
  const activeSchedules = useMemo(() => {
    return baseSchedules.map(item => {
      const dispatch = dispatches[item.id];
      if (dispatch) {
        return {
          ...item,
          carroRealizado: dispatch.carroRealizado,
          motoristaCodigo: dispatch.motoristaCodigo,
          motoristaNome: dispatch.motoristaNome,
          horaLiberacao: dispatch.horaLiberacao,
          observacoes: dispatch.observacoes,
          status: (dispatch.substituido ? "SUBSTITUIDO" : "LIBERADO") as "LIBERADO" | "SUBSTITUIDO"
        };
      }
      return item;
    });
  }, [baseSchedules, dispatches]);

  // Estatísticas operacionais
  const stats = useMemo(() => {
    const total = activeSchedules.length;
    const liberados = activeSchedules.filter(s => s.status === "LIBERADO" || s.status === "SUBSTITUIDO").length;
    const substituidos = activeSchedules.filter(s => s.status === "SUBSTITUIDO" || (s.carroRealizado && s.carroRealizado !== s.carroProgramado)).length;
    const pendentes = total - liberados;
    const percentual = total > 0 ? Math.round((liberados / total) * 100) : 0;

    // Contar CIs ativos reais da CI oficial (sem duplicatas)
    const totalBloqueadosCI = penduradosAtivos.length;

    return { total, liberados, substituidos, pendentes, percentual, totalBloqueadosCI };
  }, [activeSchedules, penduradosAtivos]);

  // Estado para animar e pulsar o carro bloqueado na seção de pendurados
  const [pulsingCarro, setPulsingCarro] = useState<string | null>(null);

  // Função para verificar se o carro está em CI Bloqueado
  const checkBloqueioCI = useCallback((prefixo?: string) => {
    if (!prefixo) return null;
    return checkCarroBloqueado(prefixo, ciList, dataOperacao);
  }, [ciList, dataOperacao]);

  // Alerta sonner + scroll suave + efeito pulsante no carro pendurado
  const triggerPenduradoAlert = useCallback((prefixo: string, motivo?: string | null) => {
    const cleanPrefixo = prefixo.trim();
    if (!cleanPrefixo) return;

    toast.error(`O carro ${cleanPrefixo} está Pendurado / Bloqueado!`, {
      description: motivo ? `Motivo: ${motivo}` : "Consulte a seção de Pendurados / Bloqueados abaixo.",
      duration: 5000
    });

    setPulsingCarro(cleanPrefixo);

    setTimeout(() => {
      const elCarro = document.getElementById(`pendurado-${cleanPrefixo}`);
      const secao = document.getElementById("secao-pendurados");
      const target = elCarro || secao;
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);

    setTimeout(() => {
      setPulsingCarro(prev => (prev === cleanPrefixo ? null : prev));
    }, 5000);
  }, []);

  // Filtro de pesquisa e status com ordenação pela ordem oficial da folha de soltura
  const filteredSchedules = useMemo(() => {
    return activeSchedules
      .filter(item => {
        // Filtro de Status
        const isDone = item.status === "LIBERADO" || item.status === "SUBSTITUIDO";
        const isSub = item.status === "SUBSTITUIDO" || (item.carroRealizado && item.carroRealizado !== item.carroProgramado);

        if (filterStatus === "PENDENTES" && isDone) return false;
        if (filterStatus === "LIBERADOS" && !isDone) return false;
        if (filterStatus === "SUBSTITUIDOS" && !isSub) return false;

        // Filtro de Texto (por Linha, Tabela ou Carro)
        if (!searchQuery.trim()) return true;
        const q = searchQuery.trim().toLowerCase();
        return (
          item.linha.toLowerCase().includes(q) ||
          item.tabela.toLowerCase().includes(q) ||
          (item.carroProgramado && item.carroProgramado.toLowerCase().includes(q)) ||
          (item.carroRealizado && item.carroRealizado.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (a.ordem !== undefined && b.ordem !== undefined) return a.ordem - b.ordem;
        if (a.ordem !== undefined) return -1;
        if (b.ordem !== undefined) return 1;
        const timeA = parseTimeToMinutes(a.saidaGaragem);
        const timeB = parseTimeToMinutes(b.saidaGaragem);
        return timeA - timeB;
      });
  }, [activeSchedules, filterStatus, searchQuery]);

  // Dividir em 2 colunas para exibição estilo Prancheta / Folha
  const { colunaEsquerda, colunaDireita } = useMemo(() => {
    if (turnoTipo === "VESPERTINO" && garagem === "VCG" && escalaTipo === "SEG_SEX") {
      // No Vespertino Oficial da VCG (documento JTU.REG.OP.0001):
      // Coluna 1: Soltura Vespertina V.C.G. (48 horários)
      // Coluna 2: Terminais (33 horários: Nova Bahia 13, Gen. Osório 9, Júlio Castilho 7, Bandeirantes 4)
      return {
        colunaEsquerda: filteredSchedules.filter(it => it.observacoes === "V.C.G." || !it.observacoes),
        colunaDireita: filteredSchedules.filter(it => it.observacoes && it.observacoes !== "V.C.G.")
      };
    }
    const meio = Math.ceil(filteredSchedules.length / 2);
    return {
      colunaEsquerda: filteredSchedules.slice(0, meio),
      colunaDireita: filteredSchedules.slice(meio)
    };
  }, [filteredSchedules, turnoTipo, garagem, escalaTipo]);

  // Verifica se o carro já está sendo utilizado no campo Carro Realiz. de OUTRA linha
  // O carro que foi substituído fica liberado para ser utilizado por outra linha!
  const getOutraLinhaComCarroRealiz = useCallback((carro: string, currentItemId: string) => {
    const clean = carro.trim();
    if (!clean) return null;

    return activeSchedules.find(s => {
      if (s.id === currentItemId) return false;
      const disp = dispatches[s.id];
      const draft = drafts[s.id];
      const realizAtual = (disp?.carroRealizado || s.carroRealizado || draft?.carro || "").trim();
      return realizAtual === clean;
    });
  }, [activeSchedules, dispatches, drafts]);

  // Busca se já existe outra linha utilizando o mesmo código MOTO (motorista) ATIVO
  const getOutraLinhaComMoto = useCallback((moto: string, currentItemId: string) => {
    const clean = moto.trim();
    if (!clean) return null;

    return activeSchedules.find(s => {
      if (s.id === currentItemId) return false;
      const disp = dispatches[s.id];
      const draft = drafts[s.id];
      const motoAtual = (disp?.motoristaCodigo || s.motoristaCodigo || draft?.moto || "").trim();
      return motoAtual.toLowerCase() === clean.toLowerCase();
    });
  }, [activeSchedules, dispatches, drafts]);

  // Liberação de Saída (acionada unicamente pelo clique no botão 'Liberar')
  const handleRelease = async (item: SolturaItem, customCarro?: string, customMoto?: string) => {
    const draft = drafts[item.id];
    const rawCarro = customCarro !== undefined ? customCarro : draft?.carro;
    const rawMoto = customMoto !== undefined ? customMoto : draft?.moto;

    const finalCarro = (rawCarro || "").trim();
    const finalMoto = (rawMoto || "").trim();

    // Apenas liberar se o campo de carro Realiz e moto esteja completado
    if (!finalCarro || !finalMoto) {
      if (!finalCarro && !finalMoto) {
        toast.error(`Preencha o Carro Realizado e o MOTO para liberar a Linha ${item.linha} / Tab ${item.tabela}.`);
      } else if (!finalCarro) {
        toast.error(`Preencha o Carro Realizado para liberar a Linha ${item.linha} / Tab ${item.tabela}.`);
      } else {
        toast.error(`Preencha o código MOTO para liberar a Linha ${item.linha} / Tab ${item.tabela}.`);
      }
      return;
    }

    const bloqueio = checkBloqueioCI(finalCarro);
    if (bloqueio) {
      triggerPenduradoAlert(finalCarro, bloqueio.motivo);
      return;
    }

    // Só poder adicionar se não estiver sendo utilizado em nenhum outro campo de carro realiz
    const conflitoOutraLinha = getOutraLinhaComCarroRealiz(finalCarro, item.id);
    if (conflitoOutraLinha) {
      toast.error(`Carro ${finalCarro} já está sendo utilizado na Linha ${conflitoOutraLinha.linha} / Tab ${conflitoOutraLinha.tabela}!`);
      return;
    }

    // Não poder repetir o código MOTO em mais de uma linha ativa
    const conflitoMoto = getOutraLinhaComMoto(finalMoto, item.id);
    if (conflitoMoto) {
      toast.error(`Motorista (MOTO ${finalMoto}) já está escalado na Linha ${conflitoMoto.linha} / Tab ${conflitoMoto.tabela}!`);
      return;
    }

    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

    // Buscar nome do motorista se o código foi informado. NUNCA coloca "01" sozinho!
    let finalNome = "";
    if (finalMoto) {
      const driverObj = drivers.find(d => d.code === finalMoto);
      finalNome = driverObj ? driverObj.name : "";
    }

    const newRecord: DispatchedRecord = {
      scheduleId: item.id,
      carroRealizado: finalCarro,
      motoristaCodigo: finalMoto,
      motoristaNome: finalNome,
      horaLiberacao: horaAtual,
      substituido: finalCarro !== item.carroProgramado
    };

    const updated = { ...dispatches, [item.id]: newRecord };
    if (dispatchWritePending.current) { toast.error("Aguarde a gravacao pendente."); return; }
    dispatchWritePending.current = true;
    try {
      await confirmedWrite(() => persistDispatchToApi(item, newRecord), () => saveDispatches(updated));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Soltura nao confirmada."); return;
    } finally { dispatchWritePending.current = false; }

    if (selectedDispatchKey.current !== dispatchContextKey) return;

    // Limpar rascunho
    setDrafts(prev => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    // Se o carro liberado coincidir com algum carro da Reserva de Terminal, consumir e remover da reserva
    const reservaEncontrada = reservasTerminais.find(r => r.carro.trim() === finalCarro);
    if (reservaEncontrada) {
      api.deleteReservaTerminal(reservaEncontrada.id).then(() => {
        setReservasTerminais(prev => prev.filter(r => r.id !== reservaEncontrada.id));
        toast.info(`Carro ${finalCarro} consumido e liberado da reserva do ${reservaEncontrada.terminal}.`);
      }).catch(err => {
        console.error("Erro ao remover carro da reserva ao liberar:", err);
      });
    }

    toast.success(`Linha ${item.linha} / Tab ${item.tabela} liberada às ${horaAtual}!`);
  };

  // Alteração de carro com motivo e registro de histórico de trocas (Prints 2 e 3)
  const handleTrocarCarro = async (item: SolturaItem, novoCarro: string, motivo: string) => {
    const cleanNovo = novoCarro.trim();
    if (!cleanNovo) {
      toast.error("Informe o prefixo do novo carro.");
      return;
    }

    const bloqueio = checkBloqueioCI(cleanNovo);
    if (bloqueio) {
      triggerPenduradoAlert(cleanNovo, bloqueio.motivo);
      return;
    }

    // Só poder adicionar se não estiver sendo utilizado em nenhum outro campo de carro realiz
    const conflitoOutraLinha = getOutraLinhaComCarroRealiz(cleanNovo, item.id);
    if (conflitoOutraLinha) {
      toast.error(`Carro ${cleanNovo} já está sendo utilizado na Linha ${conflitoOutraLinha.linha} / Tab ${conflitoOutraLinha.tabela}!`);
      return;
    }

    const agora = new Date();
    const dataHoraFormatada = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

    const currentDisp = dispatches[item.id];
    const carroAnterior = currentDisp?.carroRealizado || item.carroRealizado || item.carroProgramado || "---";

    const novaTroca: TrocaCarroItem = {
      carroAnterior,
      novoCarro: cleanNovo,
      motivo,
      dataHora: `${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${dataHoraFormatada}`
    };

    const historicoAtual = currentDisp?.historicoTrocas || [];
    const novoHistorico = [...historicoAtual, novaTroca];

    const newRecord: DispatchedRecord = {
      scheduleId: item.id,
      carroRealizado: cleanNovo,
      motoristaCodigo: currentDisp?.motoristaCodigo || item.motoristaCodigo || "",
      motoristaNome: currentDisp?.motoristaNome || item.motoristaNome || "",
      horaLiberacao: currentDisp?.horaLiberacao || dataHoraFormatada,
      substituido: cleanNovo !== item.carroProgramado,
      historicoTrocas: novoHistorico
    };

    const updated = { ...dispatches, [item.id]: newRecord };
    if (dispatchWritePending.current) { toast.error("Aguarde a gravacao pendente."); return; }
    dispatchWritePending.current = true;
    try {
      await confirmedWrite(() => persistDispatchToApi(item, newRecord), () => saveDispatches(updated));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Soltura nao confirmada."); return;
    } finally { dispatchWritePending.current = false; }

    // Se o novo carro estiver em Reserva Terminal, remover da reserva
    const reservaEncontrada = reservasTerminais.find(r => r.carro.trim() === cleanNovo);
    if (reservaEncontrada) {
      api.deleteReservaTerminal(reservaEncontrada.id).then(() => {
        setReservasTerminais(prev => prev.filter(r => r.id !== reservaEncontrada.id));
        toast.info(`Carro ${cleanNovo} consumido e liberado da reserva do ${reservaEncontrada.terminal}.`);
      }).catch(err => {
        console.error("Erro ao remover da reserva:", err);
      });
    }

    if (selectedDispatchKey.current === dispatchContextKey) toast.success(`Carro da Linha ${item.linha} alterado para ${cleanNovo}!`);
  };

  // Imprimir folha A4
  const handlePrint = () => {
    window.print();
  };

  // Exportar dados completos da soltura estruturados em Excel para Power BI
  const handleExportExcelBI = () => {
    try {
      // 1. Tabela Fato: Viagens e Despachos da Folha
      const rowsFato = activeSchedules.map((item, index) => {
        const isSub = item.carroRealizado && item.carroRealizado !== item.carroProgramado;
        const finalCarro = item.carroRealizado || item.carroProgramado;
        const bloqueio = checkBloqueioCI(finalCarro);

        const dataParts = dataOperacao.split("-");
        const ano = Number(dataParts[0]) || 2026;
        const mes = Number(dataParts[1]) || 1;
        const dia = Number(dataParts[2]) || 1;

        // Determinar dia da semana
        const dateObj = new Date(ano, mes - 1, dia);
        const diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
        const diaSemana = diasSemana[dateObj.getDay()] || "";

        return {
          ID_Registro: `${dataOperacao}_${garagem}_${item.id}`,
          Data_Operacao: dataOperacao,
          Ano: ano,
          Mes: mes,
          Dia: dia,
          Dia_Semana: diaSemana,
          Garagem_Codigo: garagem,
          Garagem_Nome: garagem === "VCG" ? "Viação Campo Grande" : "Viação Cidade Morena",
          Escala_Codigo: escalaTipo,
          Escala_Descricao: escalaTipo === "SEG_SEX" ? "Segunda a Sexta" : escalaTipo === "SABADO" ? "Sábado" : "Domingo/Feriado",
          Ordem_Saida: item.ordem || index + 1,
          Tipo_Servico: item.tipo || "REGULAR",
          Linha: item.linha,
          Tabela: item.tabela,
          Carro_Programado: item.carroProgramado || "",
          Carro_Realizado: finalCarro || "",
          Substituicao_Flag: isSub ? 1 : 0,
          Substituicao_Status: isSub ? "Substituído" : "Programado",
          Motorista_Codigo: item.motoristaCodigo || "",
          Motorista_Nome: item.motoristaNome || "",
          Horario_Saida_Garagem: item.saidaGaragem || "",
          Horario_Inicio_Linha: item.inicioLinha || item.inicioBairro || "",
          Horario_Liberacao_Real: item.horaLiberacao || "",
          Status_Soltura: item.status || "PENDENTE",
          Carro_Bloqueado_CI_Flag: bloqueio ? 1 : 0,
          Motivo_Bloqueio_CI: bloqueio ? bloqueio.motivo : "",
          Observacoes: item.observacoes || ""
        };
      });

      // 2. Dimensão: Carros Bloqueados na CI
      const rowsCI = ciList.map(ci => ({
        Prefixo_Carro: ci.prefixo,
        Garagem: ci.garagem,
        Motivo_Bloqueio: ci.motivo,
        Responsavel_Oficina: ci.responsavel || "Oficina",
        Data_Entrada: ci.data || "",
        Previsao_Saida: ci.previsao || "",
        Status: "BLOQUEADO"
      }));

      // 3. Tabela de Métricas / KPIs Consolidados
      const rowsKPI = [
        { Indicador: "Data da Operação", Valor: dataOperacao },
        { Indicador: "Garagem", Valor: garagem },
        { Indicador: "Escala", Valor: escalaTipo },
        { Indicador: "Total de Viagens Programadas", Valor: stats.total },
        { Indicador: "Carros Liberados", Valor: stats.liberados },
        { Indicador: "Carros Pendentes de Saída", Valor: stats.pendentes },
        { Indicador: "Substituições / Trocas de Carro", Valor: stats.substituidos },
        { Indicador: "Taxa de Soltura (%)", Valor: `${stats.percentual}%` },
        { Indicador: "Carros Bloqueados no CI", Valor: stats.totalBloqueadosCI }
      ];

      const workbook = XLSX.utils.book_new();

      // Montar e estilizar larguras da folha fato
      const wsFato = XLSX.utils.json_to_sheet(rowsFato);
      wsFato["!cols"] = [
        { wch: 22 }, // ID_Registro
        { wch: 14 }, // Data_Operacao
        { wch: 8 },  // Ano
        { wch: 6 },  // Mes
        { wch: 6 },  // Dia
        { wch: 14 }, // Dia_Semana
        { wch: 16 }, // Garagem_Codigo
        { wch: 24 }, // Garagem_Nome
        { wch: 14 }, // Escala_Codigo
        { wch: 18 }, // Escala_Descricao
        { wch: 12 }, // Ordem_Saida
        { wch: 14 }, // Tipo_Servico
        { wch: 10 }, // Linha
        { wch: 10 }, // Tabela
        { wch: 18 }, // Carro_Programado
        { wch: 18 }, // Carro_Realizado
        { wch: 18 }, // Substituicao_Flag
        { wch: 20 }, // Substituicao_Status
        { wch: 18 }, // Motorista_Codigo
        { wch: 24 }, // Motorista_Nome
        { wch: 22 }, // Horario_Saida_Garagem
        { wch: 20 }, // Horario_Inicio_Linha
        { wch: 22 }, // Horario_Liberacao_Real
        { wch: 16 }, // Status_Soltura
        { wch: 22 }, // Carro_Bloqueado_CI_Flag
        { wch: 30 }, // Motivo_Bloqueio_CI
        { wch: 35 }  // Observacoes
      ];
      XLSX.utils.book_append_sheet(workbook, wsFato, "Fato_Soltura");

      // Montar folha de CI
      const wsCI = XLSX.utils.json_to_sheet(rowsCI);
      wsCI["!cols"] = [
        { wch: 16 }, // Prefixo_Carro
        { wch: 12 }, // Garagem
        { wch: 30 }, // Motivo_Bloqueio
        { wch: 22 }, // Responsavel_Oficina
        { wch: 14 }, // Data_Entrada
        { wch: 14 }, // Previsao_Saida
        { wch: 14 }  // Status
      ];
      XLSX.utils.book_append_sheet(workbook, wsCI, "Dim_CI_Bloqueios");

      // Montar folha de KPIs
      const wsKPI = XLSX.utils.json_to_sheet(rowsKPI);
      wsKPI["!cols"] = [
        { wch: 35 },
        { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(workbook, wsKPI, "Resumo_Metricas");

      // 4. Dimensão: Reservas de Terminais Cadastradas
      const rowsReservas = reservasTerminais.map(res => ({
        ID_Reserva: res.id,
        Terminal: res.terminal,
        Prefixo_Carro: res.carro,
        Tipo: res.tipo,
        Garagem: res.garagem || garagem,
        Data_Hora: res.dataHora
      }));
      const wsReservas = XLSX.utils.json_to_sheet(rowsReservas);
      wsReservas["!cols"] = [
        { wch: 12 },
        { wch: 25 },
        { wch: 16 },
        { wch: 16 },
        { wch: 12 },
        { wch: 22 }
      ];
      XLSX.utils.book_append_sheet(workbook, wsReservas, "Dim_Reservas_Terminais");

      // Nome do arquivo padronizado
      const fileName = `Soltura_${garagem}_${escalaTipo}_${dataOperacao}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success("Planilha Excel gerada com sucesso! Arquivo estruturado pronto para o Power BI.");
    } catch (err: any) {
      console.error("Erro ao exportar Excel:", err);
      toast.error(`Falha na exportação: ${err?.message || "Erro desconhecido"}`);
    }
  };

  // Renderização reutilizável do Card de Pendurados (para Painel Lateral Fixo e Impressão A4)
  const renderCardPendurados = (isPrint: boolean = false) => (
    <div
      id="secao-pendurados"
      className={cn(
        "rounded-2xl p-4 sm:p-5 transition-all duration-500 shadow-xs flex flex-col justify-between",
        isPrint ? "print:bg-white print:border-neutral-500 print:p-2" : "border",
        pulsingCarro
          ? "border-2 border-rose-500 bg-rose-500/15 ring-2 ring-rose-500/40 shadow-lg"
          : "border-rose-500/30 bg-rose-500/5 text-card-foreground"
      )}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5 print:text-black">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 print:text-black" />
            PENDURADOS / BLOQUEADOS
          </h3>
          <span className="text-[10px] text-muted-foreground font-mono">
            Garagem {garagem} • {penduradosAtivos.length} {penduradosAtivos.length === 1 ? "carro" : "carros"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-0.5">
          {penduradosAtivos.map(ci => {
            const isPulsing = pulsingCarro === ci.prefixo;
            return (
              <div
                id={`pendurado-${ci.prefixo}`}
                key={ci.id || ci.prefixo}
                className="relative group inline-block"
              >


                <div
                  className={cn(
                    "px-3 py-1 rounded-lg border font-mono font-bold text-xs flex items-center justify-center gap-1 shadow-2xs select-none transition-all duration-300 cursor-pointer print:border-neutral-400 print:text-black",
                    isPulsing
                      ? "border-rose-600 bg-rose-600 text-white ring-4 ring-rose-500/50 scale-110 animate-bounce shadow-xl font-black z-20"
                      : "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500"
                  )}
                  title={`Carro ${ci.prefixo}${ci.motivo ? ` • Defeito: ${ci.motivo}` : ""}`}
                >
                  <span>{ci.prefixo}</span>
                </div>

                {ci.motivo && !isPrint && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 transition-all duration-200">
                    <div className="bg-neutral-900 text-white text-[11px] font-sans font-medium px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap border border-neutral-700/80">
                      {ci.motivo}
                    </div>
                    <div className="w-2 h-2 -mt-1 rotate-45 bg-neutral-900 border-r border-b border-neutral-700/80"></div>
                  </div>
                )}
              </div>
            );
          })}
          {penduradosAtivos.length === 0 && (
            <span className="text-[11px] text-muted-foreground/70 italic print:text-neutral-500">
              Nenhum carro bloqueado na Garagem {garagem} no momento.
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Renderização reutilizável do Card de Reserva da Garagem Central (Separado e Independente)
  const renderCardReservaGaragem = (isPrint: boolean = false) => {
    if (garagem !== "VCG") return null;

    return (
      <div className={cn(
        "rounded-2xl border border-border/80 bg-card text-card-foreground p-4 sm:p-5 shadow-xs space-y-3",
        isPrint ? "print:bg-white print:border-neutral-500 print:p-2" : ""
      )}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 print:text-black">
            <Warehouse className="w-3.5 h-3.5 text-[#164E3A] dark:text-emerald-400 print:text-black" />
            RESERVA GARAGEM CENTRAL
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono">
              {reservasGaragem.length} {reservasGaragem.length === 1 ? "carro" : "carros"}
            </span>
            {!isPrint && (
              <button
                type="button"
                onClick={handleOpenAddGaragemModal}
                className="w-6 h-6 rounded-md border border-emerald-600/40 dark:border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                title="Adicionar carro na reserva da garagem central"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-0.5">
          {reservasGaragem.map(car => (
            <div
              key={car}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 shadow-2xs flex items-center gap-1.5 group select-none transition-all hover:border-emerald-500/60 print:border-neutral-600 print:text-black"
            >
              <span>{car}</span>
              {!isPrint && (
                <button
                  type="button"
                  onClick={() => handleRemoveReservaGaragem(car)}
                  className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer text-[13px] leading-none ml-0.5"
                  title={`Remover carro ${car} da reserva da garagem`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {reservasGaragem.length === 0 && (
            <span className="text-xs text-muted-foreground/70 italic print:text-neutral-400">
              Nenhum carro na reserva da garagem central
            </span>
          )}
        </div>
      </div>
    );
  };

  // Renderização reutilizável do Card de Reserva Terminal (para Painel Lateral Fixo e Impressão A4)
  const renderCardReservaTerminal = (isPrint: boolean = false) => (
    <div className={cn(
      "rounded-2xl border border-border/80 bg-card text-card-foreground p-4 sm:p-5 shadow-xs space-y-3",
      isPrint ? "print:bg-white print:border-neutral-500 print:p-2" : ""
    )}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 print:text-black">
          <MapPin className="w-3.5 h-3.5 text-[#164E3A] dark:text-emerald-400 print:text-black" />
          RESERVA TERMINAL
        </h3>
        <span className="text-[10px] text-muted-foreground font-mono">
          Garagem {garagem}
        </span>
      </div>

      <div className={cn(
        "gap-2.5",
        isPrint ? "grid grid-cols-4" : "grid grid-cols-1 sm:grid-cols-2"
      )}>
        {TERMINAIS_PADRAO.map(termNome => {
          const carrosDoTerminal = reservasTerminais.filter(r => r.terminal === termNome);
          return (
            <div
              key={termNome}
              className="rounded-xl border border-border/70 bg-muted/30 hover:bg-muted/50 dark:bg-card/90 dark:border-border/60 p-2.5 flex flex-col gap-2 transition-all shadow-2xs print:border-neutral-400 print:bg-white"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-foreground tracking-tight print:text-black">
                  {termNome}
                </span>
                {!isPrint && (
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(termNome)}
                    className="w-6 h-6 rounded-md border border-emerald-600/40 dark:border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                    title={`Adicionar carro na reserva do ${termNome}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {carrosDoTerminal.map(car => (
                  <div
                    key={car.id}
                    className={cn(
                      "px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all group select-none shadow-2xs",
                      car.tipo === "VERMELHO" ? "border border-rose-500/50 text-rose-700 dark:text-rose-400 bg-rose-500/10 print:border-rose-600 print:text-rose-700" :
                        car.tipo === "AZUL" ? "border border-sky-500/50 text-sky-700 dark:text-sky-400 bg-sky-500/10 print:border-sky-600 print:text-sky-700" :
                          car.tipo === "CORINGA" ? "border border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-500/10 print:border-amber-600 print:text-amber-700" :
                            car.tipo === "MICRO" ? "border border-purple-500/50 text-purple-700 dark:text-purple-400 bg-purple-500/10 print:border-purple-600 print:text-purple-700" :
                              "border border-orange-500/50 text-orange-700 dark:text-orange-400 bg-orange-500/10 print:border-orange-600 print:text-orange-700"
                    )}
                    title={`Carro ${car.carro} • Tipo: ${car.tipo}`}
                  >
                    <span>{car.carro}</span>
                    {!isPrint && (
                      <button
                        type="button"
                        onClick={() => handleRemoveReserva(car.id, car.carro)}
                        className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer text-[13px] leading-none"
                        title="Remover carro da reserva"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {carrosDoTerminal.length === 0 && (
                  <span className="text-[11px] text-muted-foreground/70 italic print:text-neutral-400">
                    Sem carros
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-16">
      {!isCIView && viewMode !== 'ALTERAR_CARRO_PROGRAMADO' && <div role="alert" className="p-3 border rounded print:hidden">
        {ciReadError && <p>{ciReadError}</p>}
        {canReadScale(user) && (scaleError || (!sharedScale ? 'Carregando escala oficial...' : sharedScale.publicada ? 'Escala oficial carregada.' : 'Escala ainda nao publicada. Nenhum dado local foi importado.'))}
        {!permanentReady && <p>Programacao base exibida para consulta. Alteracoes oficiais nao confirmadas; gravacoes e liberacoes bloqueadas.</p>}
        {canReadScale(user) && <Button type="button" variant="outline" onClick={() => {
          if (dailyDirtyFields.current.size && !window.confirm('Descartar as alteracoes digitadas da escala para consultar os dados oficiais?')) return;
          dailyDirtyFields.current.clear(); setDailyScale(null);
          setDailyEditEpoch(value => value + 1);
          void reloadSharedScale(); void reloadDailyScale();
        }}>Recarregar escala</Button>}
        {isAdmin && sharedScale && !sharedScale.publicada && <details><summary>Revisar programacao padrao antes de publicar</summary><ul>{defaultSchedules.map(i => <li key={i.id}>{i.linha} / {i.tabela} / {i.carroProgramado} / {i.saidaGaragem}</li>)}</ul></details>}
        {isAdmin && sharedScale && !sharedScale.publicada && <Button type="button" onClick={async () => {
          if (!window.confirm('Publicar a programacao padrao exibida na revisao da equipe? Nenhum dado de localStorage sera usado.')) return;
          const saved = await persistCustomSchedules(() => ({ [scheduleKey]: defaultSchedules }));
          if (saved) toast.success('Escala publicada no servidor.');
        }}>Publicar programacao padrao</Button>}
      </div>}

      {/* ========================================================= */}
      {/* CABEÇALHO PRINCIPAL E SELETORES (Folha de Soltura e Histórico) */}
      {/* ========================================================= */}
      {(viewMode === "FOLHA" || viewMode === "HISTORICO") && (
        <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4 print:hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            {/* Título e Identificação Oficial */}
            <div className="flex items-start gap-3.5">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
                  {viewMode === "HISTORICO" ? "Histórico de Soltura da Frota" : "Controle de Soltura da Frota"}
                </h1>
                {viewMode === "HISTORICO" && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Modo de consulta e auditoria de despachos operacionais por data
                  </p>
                )}
              </div>
            </div>

            {/* Seletor de Garagem, Escala, Data e Ações */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">

              {/* Linha Superior: Garagem e Escala */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Seletor de Garagem: Exclusivo para ADMIN; outros perfis visualizam apenas sua respectiva empresa */}
                {isAdmin ? (
                  <div className="flex items-center bg-muted/60 p-1 rounded-full border border-border/80">
                    <button
                      type="button"
                      onClick={() => setGaragem("VCG")}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2",
                        garagem === "VCG"
                          ? "bg-[#164E3A] text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                      VCG
                    </button>

                    <button
                      type="button"
                      onClick={() => setGaragem("VCM")}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2",
                        garagem === "VCM"
                          ? "bg-[#164E3A] text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                      VCM
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/80 bg-muted/40 text-xs font-bold text-foreground select-none">
                    <span className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      garagem === "VCM" ? "bg-[#3B82F6]" : "bg-[#22C55E]"
                    )} />
                    <span>{garagem === "VCM" ? "VCM" : "VCG"}</span>
                  </div>
                )}

                {/* Seletor de Escala */}
                <div className="flex items-center bg-muted/60 p-1 rounded-full border border-border/80">
                  <button
                    type="button"
                    onClick={() => setEscalaTipo("SEG_SEX")}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs transition-all cursor-pointer",
                      escalaTipo === "SEG_SEX"
                        ? "bg-[#164E3A] text-white shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground font-medium"
                    )}
                  >
                    Seg-Sex
                  </button>

                  <button
                    type="button"
                    onClick={() => setEscalaTipo("SABADO")}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs transition-all cursor-pointer",
                      escalaTipo === "SABADO"
                        ? "bg-[#164E3A] text-white shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground font-medium"
                    )}
                  >
                    Sábado
                  </button>

                  <button
                    type="button"
                    onClick={() => setEscalaTipo("DOM_FER")}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs transition-all cursor-pointer",
                      escalaTipo === "DOM_FER"
                        ? "bg-[#164E3A] text-white shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground font-medium"
                    )}
                  >
                    Dom/Fer
                  </button>
                </div>

                {/* Seletor de Turno: Matutino x Vespertino (Segunda a Sexta) */}
                {escalaTipo === "SEG_SEX" && (
                  <div className="flex items-center bg-muted/60 p-1 rounded-full border border-border/80 animate-in fade-in zoom-in-95 duration-200">
                    <button
                      type="button"
                      onClick={() => setTurnoTipo("MATUTINO")}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer",
                        turnoTipo === "MATUTINO"
                          ? "bg-[#164E3A] text-white dark:bg-emerald-600 shadow-2xs font-bold"
                          : "text-muted-foreground hover:text-foreground font-medium"
                      )}
                      title="Matutino (Manhã até 06:00)"
                    >
                      <span>☀️ Matutino</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTurnoTipo("VESPERTINO")}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer",
                        turnoTipo === "VESPERTINO"
                          ? "bg-[#164E3A] text-white dark:bg-emerald-600 shadow-2xs font-bold"
                          : "text-muted-foreground hover:text-foreground font-medium"
                      )}
                      title="Vespertino (Tarde - 10:30 até 17:40)"
                    >
                      <span>🌙 Vespertino</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Linha Inferior/Ao lado: Seletor de Data (apenas no Histórico) e Ações Imprimir / Excel */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Seletor de Data: visível EXCLUSIVAMENTE no Histórico (/soltura/historico) */}
                {viewMode === "HISTORICO" && (
                  <div className="flex items-center gap-1.5 animate-in fade-in">
                    {/* Input date nativo acionado pelo showPicker() posicionado fora da tela para não gerar artefatos visuais */}
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={dataOperacao}
                      onChange={(e) => {
                        if (e.target.value) {
                          setDataOperacao(e.target.value);
                        }
                      }}
                      className="fixed -top-[9999px] -left-[9999px] opacity-0 pointer-events-none w-0 h-0 select-none"
                      tabIndex={-1}
                      aria-label="Escolher data no calendário"
                    />

                    {/* Botão Dia Anterior (<) */}
                    <button
                      type="button"
                      onClick={() => setDataOperacao((prev) => ajustarDia(prev, -1))}
                      className="h-8 w-8 rounded-xl flex items-center justify-center border border-border/80 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs shrink-0"
                      title="Dia anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Botão Central: Calendário + Data */}
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          dateInputRef.current?.showPicker();
                        } catch {
                          dateInputRef.current?.focus();
                        }
                      }}
                      className="h-8 px-3 rounded-full border border-border/80 bg-muted/60 hover:bg-muted text-foreground flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs shrink-0 select-none"
                      title="Clique para escolher uma data no calendário"
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#164E3A] dark:text-emerald-400 shrink-0" />
                      <span className="font-semibold text-xs tracking-tight text-foreground">
                        {getTextoDataHistorico(dataOperacao)}
                      </span>
                    </button>

                    {/* Botão Próximo Dia (>) */}
                    <button
                      type="button"
                      onClick={() => setDataOperacao((prev) => ajustarDia(prev, 1))}
                      className="h-8 w-8 rounded-xl flex items-center justify-center border border-border/80 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs shrink-0"
                      title="Próximo dia"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Botão 'Hoje' (aparece apenas quando a data selecionada NÃO for hoje) */}
                    {dataOperacao !== getHojeLocal() && (
                      <button
                        type="button"
                        onClick={() => setDataOperacao(getHojeLocal())}
                        className="h-8 px-3.5 rounded-full bg-[#164E3A] hover:bg-[#113C2D] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center animate-in fade-in zoom-in-95 shrink-0"
                        title="Ir para Hoje"
                      >
                        Hoje
                      </button>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="h-8 px-3.5 text-xs gap-1.5 rounded-full border border-border/80 font-semibold shadow-2xs hover:bg-muted/80 transition-all"
                  title="Imprimir folha de soltura em formato papel A4"
                >
                  <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Imprimir A4</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcelBI}
                  className="h-8 px-3.5 text-xs gap-1.5 rounded-full border font-semibold shadow-2xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
                  title="Exportar dados estruturados para Excel e Power BI"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Exportar Excel (BI)</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSyncingDb}
                  onClick={() => {
                    setIsSyncingDb(true);
                    api.listSolturas({
                      date: dataOperacao,
                      garagem,
                      turno: escalaTipo === "SEG_SEX" ? turnoTipo : undefined,
                      escalaTipo,
                    }).then((records: any[]) => {
                      const key = getDispatchStorageKey(garagem, escalaTipo, turnoTipo, dataOperacao);
                      if (Array.isArray(records) && records.length > 0) {
                        const dbDispatches: Record<string, DispatchedRecord> = {};
                        records.forEach((rec) => {
                          const sid = rec.scheduleId || `${rec.linha}_${rec.tabela}`;
                          dbDispatches[sid] = {
                            scheduleId: sid,
                            carroRealizado: rec.carroRealizado,
                            motoristaCodigo: rec.driverCode || "",
                            motoristaNome: rec.driverName || "",
                            horaLiberacao: rec.horaLiberacao || "",
                            observacoes: rec.notes || undefined,
                            substituido: !!rec.substituido,
                            historicoTrocas: rec.historicoTrocas || [],
                          };
                        });
                        setDispatches(dbDispatches);
                        localStorage.setItem(key, JSON.stringify(dbDispatches));
                        toast.success(`${records.length} soltura(s) sincronizada(s) do banco!`);
                      } else {
                        setDispatches({});
                        localStorage.removeItem(key);
                        toast.info("Folha zerada. Nenhuma soltura no banco para esta data/turno.");
                      }
                    }).catch(err => {
                      toast.error("Erro ao sincronizar com o banco: " + (err.message || ""));
                    }).finally(() => {
                      setIsSyncingDb(false);
                    });

                    // Sincronizar Bloqueios da CI do banco
                    // O listener contextual recebe a lista oficial publicada pelo manager.
                    void fetchCIBloqueiosFromApi({ garagem }).catch(() => {});
                  }}
                  className="h-8 px-3 text-xs gap-1.5 rounded-xl border font-semibold shadow-2xs hover:bg-muted/80 transition-all cursor-pointer"
                  title="Atualizar dados diretamente do banco SQL Server"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", isSyncingDb && "animate-spin text-emerald-600")} />
                  <span>Sincronizar</span>
                </Button>
              </div>

            </div>
          </div>

          {/* Banner informativo quando estiver consultando na página de Histórico */}
          {viewMode === "HISTORICO" && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-amber-900 dark:text-amber-200 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  Consultando histórico de soltura de <strong>{formatarDataBr(dataOperacao)}</strong> ({dataOperacao === getHojeLocal() ? "Hoje" : dataOperacao === getOntemLocal() ? "Ontem" : "Data Selecionada"}). Registros congelados para consulta e auditoria.
                </span>
              </div>
              {dataOperacao !== getOntemLocal() && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDataOperacao(getOntemLocal())}
                  className="h-7 text-xs px-2.5 font-bold border-amber-500/40 hover:bg-amber-500/20 text-amber-950 dark:text-amber-100 shrink-0 cursor-pointer rounded-lg"
                >
                  Ver Ontem
                </Button>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* BARRA DE ESTATÍSTICAS E PROGRESSO OPERACIONAL (Folha de Soltura e Histórico) */}
          {/* ========================================================= */}
          {(viewMode === "FOLHA" || viewMode === "HISTORICO") && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">

              {/* Card Total */}
              <div className="bg-card p-3 rounded-2xl border shadow-2xs">
                <span className="text-[11px] text-muted-foreground font-medium block">Total Programado</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-foreground">{stats.total}</span>
                  <span className="text-[11px] text-muted-foreground">viagens</span>
                </div>
              </div>

              {/* Card Liberados */}
              <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/30">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Liberados
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.liberados}</span>
                  <span className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">carros na rua</span>
                </div>
              </div>

              {/* Card Pendentes */}
              <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30">
                <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Pendentes
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-amber-700 dark:text-amber-300">{stats.pendentes}</span>
                  <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80">na garagem</span>
                </div>
              </div>

              {/* Card Substituídos (Trocados) */}
              <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/30">
                <span className="text-[11px] text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Substituídos
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{stats.substituidos}</span>
                  <span className="text-[11px] text-blue-800/80 dark:text-blue-300/80">trocas</span>
                </div>
              </div>

              {/* Card CI Bloqueios */}
              <div
                onClick={() => {
                  setViewMode("CI_MANUTENCAO");
                  navigate("/soltura/ci-manutencao");
                }}
                className="bg-rose-500/10 p-3 rounded-2xl border border-rose-500/30 cursor-pointer hover:bg-rose-500/15 transition-all"
                title="Clique para abrir a tela de CI Manutenção"
              >
                <span className="text-[11px] text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> CI Manutenção
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-rose-700 dark:text-rose-300">{stats.totalBloqueadosCI}</span>
                  <span className="text-[11px] text-rose-800/80 dark:text-rose-300/80">bloqueados</span>
                </div>
              </div>

              {/* Card Taxa de Soltura */}
              <div className="bg-card p-3 rounded-2xl border shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-foreground font-bold">Soltura</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{stats.percentual}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="bg-[#164E3A] dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.percentual}%` }}
                  />
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* FILTROS DE STATUS E BARRA DE BUSCA (Folha de Soltura e Histórico) */}
      {/* ========================================================= */}
      {(viewMode === "FOLHA" || viewMode === "HISTORICO") && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between print:hidden">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full border border-border/80">
            {(["TODOS", "PENDENTES", "LIBERADOS", "SUBSTITUIDOS"] as FilterStatus[]).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                  filterStatus === st
                    ? "bg-card text-foreground shadow-xs font-bold border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {st === "TODOS" && `Todos (${stats.total})`}
                {st === "PENDENTES" && `Pendentes (${stats.pendentes})`}
                {st === "LIBERADOS" && `Liberados (${stats.liberados})`}
                {st === "SUBSTITUIDOS" && `Trocados (${stats.substituidos})`}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar linha, tab, carro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-card rounded-full"
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISUALIZAÇÃO 1: FOLHA DE SOLTURA / PRANCHETA DIGITAL / HISTÓRICO */}
      {/* Idêntico às fotos dos formulários de papel e layout-soltura.PNG */}
      {/* ========================================================= */}
      {(viewMode === "FOLHA" || viewMode === "HISTORICO") && (
        <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 print:border-none print:p-0 print:shadow-none print:space-y-1">

          {/* Header Oficial da Folha de Papel A4 — Exibição e Alinhamento Perfeito em Impressão */}
          <div className="hidden print:block border border-neutral-700 p-2 mb-1.5 bg-white text-black font-sans">
            <div className="flex items-center justify-between border-b border-neutral-500 pb-1">
              <div>
                <span className="text-[10pt] font-black uppercase tracking-wider block text-black">
                  CONSÓRCIO GUAICURUS • {garagem === "VCG" ? "VIAÇÃO CAMPO GRANDE (VCG)" : "VIAÇÃO CIDADE MORENA (VCM)"}
                </span>
                <span className="text-[8.5pt] font-bold text-neutral-800 block">
                  HORÁRIO DE SAÍDA DE VEÍCULOS • {escalaTipo === "SEG_SEX" ? `SEGUNDA A SEXTA - ${turnoTipo === "MATUTINO" ? "MATUTINO (ATÉ 06:00)" : "VESPERTINO (10:30 ATÉ 17:40)"}` : escalaTipo === "SABADO" ? "SÁBADO" : "DOMINGO / FERIADO"} • {dataOperacao.split("-").reverse().join("/")}
                </span>
              </div>
              <div className="text-right font-mono text-[7pt] leading-tight text-neutral-900 border border-neutral-400 px-2 py-1 bg-neutral-50 rounded">
                <div><strong>REGISTRO:</strong> {turnoTipo === "VESPERTINO" && garagem === "VCG" ? "JTU.REG.OP.0001" : garagem === "VCG" ? "CGU.REG.OP.0001" : "VCM.REG.TR.0017"}</div>
                <div><strong>REVISÃO:</strong> {turnoTipo === "VESPERTINO" && garagem === "VCG" ? "0 (07/08/2026)" : "01 (01/07/2025)"}</div>
                <div><strong>DATA INF.:</strong> 20/08/2026</div>
                <div><strong>EMISSÃO:</strong> {dataOperacao.split("-").reverse().join("/")}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[7pt] pt-1 text-neutral-800 font-mono">
              <span><strong>PROGRAMADOS:</strong> {stats.total} VEÍCULOS</span>
              <span><strong>LIBERADOS:</strong> {stats.liberados}</span>
              <span><strong>SUBSTITUIÇÕES:</strong> {stats.substituidos}</span>
              <span><strong>PENDENTES:</strong> {stats.pendentes}</span>
              <span><strong>TAXA DE SOLTURA:</strong> {stats.percentual}%</span>
            </div>
          </div>

          {/* Cabeçalho da Folha em Tela (fiel a layout-soltura.PNG) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 print:hidden">
            <div>
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
                CONSÓRCIO GUAICURUS • GARAGEM {garagem === "VCG" ? "VIAÇÃO CAMPO GRANDE" : "VIAÇÃO CIDADE MORENA"}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                Horário de Saída de Veículos • {escalaTipo === "SEG_SEX" ? `Segunda a Sexta (${turnoTipo === "MATUTINO" ? "Matutino" : "Vespertino"})` : escalaTipo === "SABADO" ? "Sábado" : "Dom / Feriado"}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Pendurado / Bloqueados
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                Trocado / Substituto
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                Reforço
              </span>
            </div>
          </div>

          {/* Barra de Pesquisa de Linha (como no novo layout) */}
          <div className="flex items-center gap-2 pb-2 print:hidden">
            <div className="relative w-full max-w-xs sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar uma linha..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background rounded-xl border border-border/80 focus:border-[#164E3A] focus:ring-1 focus:ring-[#164E3A] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-0.5 rounded cursor-pointer"
                  title="Limpar pesquisa"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* NOVO LAYOUT EM TELA: TABELA COM 20 ITENS + SCROLL (ESQ) E PAINEL FIXO (DIR) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start print:hidden">

            {/* 1. LADO ESQUERDO: TABELA ÚNICA DE HORÁRIOS (fixo no topo da tela com scroll) */}
            <div className="xl:col-span-8 2xl:col-span-8 border rounded-2xl overflow-hidden shadow-2xs bg-card border-border/80 sticky top-4 self-start z-10">
              <div className="bg-muted/60 px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b">
                <span className="text-foreground flex items-center gap-2">
                  Horário de Saída de Veículos {escalaTipo === "SEG_SEX" && `• ${turnoTipo === "MATUTINO" ? "Matutino" : "Vespertino"}`}
                  {searchQuery && (
                    <span className="text-[11px] font-normal text-muted-foreground lowercase">
                      (filtrando "{searchQuery}")
                    </span>
                  )}
                </span>
                <span className="font-mono font-semibold text-foreground flex items-center gap-2">
                  {isSyncingDb && (
                    <RefreshCw className="w-3 h-3 animate-spin text-emerald-600 dark:text-emerald-400" />
                  )}
                  {filteredSchedules.length} {filteredSchedules.length === 1 ? "HORÁRIO" : "HORÁRIOS"}
                </span>
              </div>

              {/* Barra de progresso sutil ao carregar linhas da folha */}
              {isSyncingDb && (
                <div className="h-0.5 w-full bg-emerald-500/20 overflow-hidden">
                  <div className="h-full bg-emerald-600 dark:bg-emerald-400 animate-pulse w-full" />
                </div>
              )}

              {/* Tabela com rolagem vertical suave calibrada para 10 itens visíveis ou estendida */}
              <div
                className={cn(
                  "overflow-y-auto transition-all duration-300 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40",
                  isListaEstendida ? "max-h-none" : "max-h-[415px]"
                )}
              >
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-xs shadow-2xs">
                    <tr className="bg-muted/60 text-muted-foreground border-b text-[11px] font-semibold">
                      <th className="py-2.5 px-2.5 w-12 text-center">Nº</th>
                      <th className="py-2.5 px-2.5 font-bold text-foreground">Linha</th>
                      <th className="py-2.5 px-2 text-center">Tab</th>
                      <th className="py-2.5 px-2.5 text-center">Carro Prog.</th>
                      <th className="py-2.5 px-2.5 bg-primary/5 text-primary font-bold text-center">Carro Realiz.</th>
                      <th className="py-2.5 px-2.5 text-center">MOTO</th>
                      <th className="py-2.5 px-2.5 text-center font-bold text-foreground">Saída Gar.</th>
                      <th className="py-2.5 px-2.5 text-center text-muted-foreground">Bairro</th>
                      <th className="py-2.5 px-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className={cn(
                    "divide-y divide-border/60 font-mono transition-opacity duration-200",
                    isSyncingDb && "opacity-50 pointer-events-none"
                  )}>
                    {filteredSchedules.map((item, idx) => {
                      const isFirstVCM = item.tipo === "VCM" && (idx === 0 || filteredSchedules[idx - 1]?.tipo !== "VCM");
                      const isFirstFrete = item.tipo === "FRETAMENTO" && (idx === 0 || filteredSchedules[idx - 1]?.tipo !== "FRETAMENTO");
                      const isNewVespSection = turnoTipo === "VESPERTINO" && item.observacoes && (idx === 0 || filteredSchedules[idx - 1]?.observacoes !== item.observacoes);
                      return (
                        <>
                          {isNewVespSection && (
                            <tr key={`sep-vesp-${item.id}`}>
                              <td colSpan={9} className="py-2 px-3 bg-emerald-500/15 text-[11px] font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-200 border-y border-emerald-500/30">
                                📍 SOLTURA VESPERTINA {item.observacoes}
                              </td>
                            </tr>
                          )}
                          {isFirstVCM && (
                            <tr key={`sep-vcm-${item.id}`}>
                              <td colSpan={9} className="py-1.5 px-3 bg-blue-500/10 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 border-y border-blue-500/30">
                                Motoristas VCM que saem da VCG
                              </td>
                            </tr>
                          )}
                          {isFirstFrete && (
                            <tr key={`sep-frete-${item.id}`}>
                              <td colSpan={9} className="py-1.5 px-3 bg-amber-500/10 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 border-y border-amber-500/30">
                                Especial Fretamento
                              </td>
                            </tr>
                          )}
                          <FolhaTableRow
                            key={item.id}
                            item={item}
                            index={idx + 1}
                            reservasTerminais={reservasTerminais}
                            checkBloqueioCI={checkBloqueioCI}
                            onRelease={handleRelease}
                            onDraftChange={handleDraftChange}
                            onTrocarCarro={handleTrocarCarro}
                            onPenduradoAlert={triggerPenduradoAlert}
                            getOutraLinhaComCarroRealiz={getOutraLinhaComCarroRealiz}
                            getOutraLinhaComMoto={getOutraLinhaComMoto}
                            historicoTrocas={dispatches[item.id]?.historicoTrocas || []}
                            isReadOnly={!releaseUiAllowed || viewMode === "HISTORICO" || dataOperacao !== getHojeLocal()}
                          />
                        </>
                      );
                    })}
                    {filteredSchedules.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-muted-foreground font-sans">
                          {isSyncingDb ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-4 animate-in fade-in">
                              <RefreshCw className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                              <span className="text-xs font-medium">Carregando linhas da folha...</span>
                            </div>
                          ) : (
                            `Nenhum registro encontrado para a busca "${searchQuery}".`
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Rodapé com botão para estender ou recolher toda a lista */}
              <div className="p-2.5 border-t bg-muted/25 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setIsListaEstendida(!isListaEstendida)}
                  className="w-full py-2 px-4 rounded-xl border border-border/80 bg-card hover:bg-muted/50 text-xs font-semibold text-foreground flex items-center justify-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
                >
                  {isListaEstendida ? (
                    <>
                      <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span>Recolher lista (mostrar 10 linhas)</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 text-[#164E3A] dark:text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
                      <span>Estender toda a lista (mostrar todos os {filteredSchedules.length} horários)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. LADO DIREITO: COMPONENTE FIXO COM PENDURADOS, RESERVA GARAGEM E RESERVA TERMINAL */}
            <div className="xl:col-span-4 2xl:col-span-4 xl:sticky xl:top-4 self-start space-y-4">
              {renderCardPendurados(false)}
              {renderCardReservaGaragem(false)}
              {renderCardReservaTerminal(false)}
            </div>

          </div>

          {/* ========================================================= */}
          {/* IMPRESSÃO A4: DUAS COLUNAS CONFORME FORMULÁRIO OFICIAL */}
          {/* ========================================================= */}
          <div className="hidden print:block space-y-4">

            {/* Grade de 2 Colunas Lado a Lado para o papel A4 */}
            <div className="grid grid-cols-2 gap-4 folha-print-grid">
              {/* Coluna 1 */}
              <div className="border rounded-xl overflow-hidden bg-card">
                <div className="bg-muted/60 px-3.5 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b">
                  <span className="text-foreground">
                    {turnoTipo === "VESPERTINO" && garagem === "VCG"
                      ? "SOLTURA VESPERTINA V.C.G. (ORDENS 01 A 48)"
                      : `COLUNA 01 (ORDENS 01 A ${String(colunaEsquerda.length).padStart(2, "0")})`}
                  </span>
                  <span className="font-semibold">{colunaEsquerda.length} HORÁRIOS</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold">
                        <th className="py-2 px-2 w-10 text-center">Nº</th>
                        <th className="py-2 px-2 font-bold text-foreground">Linha</th>
                        <th className="py-2 px-1 text-center">Tab</th>
                        <th className="py-2 px-2 text-center">Carro Prog.</th>
                        <th className="py-2 px-2 text-center">Carro Realiz.</th>
                        <th className="py-2 px-2 text-center">MOTO</th>
                        <th className="py-2 px-2 text-center font-bold text-foreground">Saída Gar.</th>
                        <th className="py-2 px-2 text-center text-muted-foreground">Bairro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-mono">
                      {colunaEsquerda.map((item, idx) => (
                        <FolhaTableRow
                          key={item.id}
                          item={item}
                          index={item.ordemTerminal ?? item.ordem ?? (idx + 1)}
                          reservasTerminais={reservasTerminais}
                          checkBloqueioCI={checkBloqueioCI}
                          onRelease={handleRelease}
                          onDraftChange={handleDraftChange}
                          onTrocarCarro={handleTrocarCarro}
                          onPenduradoAlert={triggerPenduradoAlert}
                          getOutraLinhaComCarroRealiz={getOutraLinhaComCarroRealiz}
                          getOutraLinhaComMoto={getOutraLinhaComMoto}
                          historicoTrocas={dispatches[item.id]?.historicoTrocas || []}
                          isReadOnly={true}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coluna 2 */}
              <div className="border rounded-xl overflow-hidden bg-card flex flex-col justify-between">
                <div>
                  <div className="bg-muted/60 px-3.5 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b">
                    <span className="text-foreground">
                      {turnoTipo === "VESPERTINO" && garagem === "VCG"
                        ? "SOLTURA VESPERTINA TERMINAIS"
                        : `COLUNA 02 (ORDENS ${String(colunaEsquerda.length + 1).padStart(2, "0")} A ${String(filteredSchedules.length).padStart(2, "0")})`}
                    </span>
                    <span className="font-semibold">{colunaDireita.length} HORÁRIOS</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold">
                          <th className="py-2 px-2 w-10 text-center">Nº</th>
                          <th className="py-2 px-2 font-bold text-foreground">Linha</th>
                          <th className="py-2 px-1 text-center">Tab</th>
                          <th className="py-2 px-2 text-center">Carro Prog.</th>
                          <th className="py-2 px-2 text-center">Carro Realiz.</th>
                          <th className="py-2 px-2 text-center">MOTO</th>
                          <th className="py-2 px-2 text-center font-bold text-foreground">Saída Gar.</th>
                          <th className="py-2 px-2 text-center text-muted-foreground">Bairro</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 font-mono">
                        {colunaDireita.map((item, idx) => {
                          const isNewVespSection = turnoTipo === "VESPERTINO" && item.observacoes && (idx === 0 || colunaDireita[idx - 1]?.observacoes !== item.observacoes);
                          return (
                            <Fragment key={item.id}>
                              {isNewVespSection && (
                                <tr key={`sep-print-vesp-${item.id}`}>
                                  <td colSpan={8} className="py-1 px-2 bg-neutral-200 text-black font-black uppercase tracking-wider text-[8pt] border-y border-neutral-400">
                                    SOLTURA VESPERTINA {item.observacoes}
                                  </td>
                                </tr>
                              )}
                              <FolhaTableRow
                                key={item.id}
                                item={item}
                                index={item.ordemTerminal ?? item.ordem ?? (colunaEsquerda.length + idx + 1)}
                                reservasTerminais={reservasTerminais}
                                checkBloqueioCI={checkBloqueioCI}
                                onRelease={handleRelease}
                                onDraftChange={handleDraftChange}
                                onTrocarCarro={handleTrocarCarro}
                                onPenduradoAlert={triggerPenduradoAlert}
                                getOutraLinhaComCarroRealiz={getOutraLinhaComCarroRealiz}
                                getOutraLinhaComMoto={getOutraLinhaComMoto}
                                historicoTrocas={dispatches[item.id]?.historicoTrocas || []}
                                isReadOnly={true}
                              />
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quadro de Observação e Crachá da Folha Vespertina (JTU.REG.OP.0001) */}
                {turnoTipo === "VESPERTINO" && (
                  <div className="p-2 border-t border-neutral-300 bg-white text-black font-sans text-[7.5pt] mt-2">
                    <div className="font-bold uppercase tracking-wider mb-1 text-[8pt]">OBSERVAÇÃO:</div>
                    <div className="space-y-2 font-mono text-neutral-400">
                      <div className="border-b border-dotted border-neutral-400 h-3"></div>
                      <div className="border-b border-dotted border-neutral-400 h-3"></div>
                      <div className="border-b border-dotted border-neutral-400 h-3"></div>
                      <div className="border-b border-dotted border-neutral-400 h-3"></div>
                    </div>
                    <div className="flex justify-end mt-2 pt-1 font-bold text-[8pt]">
                      <span>CRACHÁ: ____________________</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco Oficial de Rodapé da Página 1: RESERVAS e RESERVA TERMINAL (conforme CGU.REG.OP.0001 no matutino) */}
            {turnoTipo !== "VESPERTINO" && (
              <div className="grid grid-cols-2 gap-4 pt-1 font-sans text-black">
                {/* Reservas Garagem */}
                <div className="border border-neutral-700 p-1.5 bg-white text-[8pt]">
                  <div className="font-bold border-b border-neutral-400 pb-0.5 mb-1 text-center bg-neutral-100 uppercase tracking-wider text-[7.5pt]">
                    RESERVAS
                  </div>
                  <div className="grid grid-cols-3 gap-1 font-mono text-center font-bold text-[9pt]">
                    {reservasGaragem.map((res, i) => (
                      <div key={i} className="py-0.5 px-1 border border-neutral-300 rounded bg-neutral-50">
                        {res}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reserva Terminal */}
                <div className="border border-neutral-700 p-1.5 bg-white text-[7pt]">
                  <div className="font-bold border-b border-neutral-400 pb-0.5 mb-1 text-center bg-neutral-100 uppercase tracking-wider text-[7.5pt]">
                    RESERVA TERMINAL
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[6.5pt] font-mono">
                    {TERMINAIS_PADRAO.map(term => {
                      const carros = reservasTerminais.filter(r => r.terminal === term);
                      return (
                        <div key={term} className="border border-neutral-300 p-1 rounded">
                          <div className="font-bold uppercase truncate">{term}</div>
                          <div className="flex gap-1 mt-0.5 font-bold">
                            <span className="text-neutral-600">C1:</span> {carros[0]?.carro || "—"}
                            <span className="text-neutral-600 ml-1">C2:</span> {carros[1]?.carro || "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Rodapé Oficial da Impressão A4 - Assinaturas e Alerta CI */}
            <div className="border-t border-neutral-400 pt-1 mt-1 text-[6.5pt] text-neutral-800 font-sans flex flex-col gap-0.5">
              <div className="flex items-center justify-between font-mono">
                <span>Responsável pela aprovação: <strong>Paulo Vitor</strong></span>
                <span>Responsável pela Elaboração: <strong>André Luiz</strong></span>
                <span className="font-bold">Página 01 / {turnoTipo === "VESPERTINO" ? "01" : "02"}</span>
              </div>
              <div className="text-center font-bold text-neutral-900 tracking-wider">
                **** CARROS DE PLANO ESCALADOS NAS LINHAS COM OBSERVAÇÃO, CONFERIR COM A CI ****
              </div>
            </div>

            {/* SEGUNDA FOLHA A4 NA IMPRESSÃO: RESERVAS E VEÍCULOS NO CI */}
            <div className="print-page-break space-y-4 pt-1">
              <div className="border border-neutral-700 p-2 mb-2 bg-white text-black font-sans">
                <div className="flex items-center justify-between border-b border-neutral-500 pb-1">
                  <div>
                    <span className="text-[10pt] font-black uppercase tracking-wider block text-black">
                      CONSÓRCIO GUAICURUS • {garagem === "VCG" ? "VIAÇÃO CAMPO GRANDE (VCG)" : "VIAÇÃO CIDADE MORENA (VCM)"}
                    </span>
                    <span className="text-[8.5pt] font-bold text-neutral-800 block">
                      ANEXO OPERACIONAL • QUADRO DE CARROS RESERVAS E VEÍCULOS NO CI / PENDURADOS • {dataOperacao.split("-").reverse().join("/")}
                    </span>
                  </div>
                  <div className="text-right font-mono text-[7pt] leading-tight text-neutral-900 border border-neutral-400 px-2 py-1 bg-neutral-50 rounded">
                    <div><strong>DOCUMENTO:</strong> {garagem === "VCG" ? "CGU.REG.OP.0001-ANX" : "VCM.REG.TR.0017-ANX"}</div>
                    <div><strong>EMISSÃO:</strong> {dataOperacao.split("-").reverse().join("/")}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[7pt] pt-1 text-neutral-800 font-mono">
                  <span><strong>TERMINAIS COM RESERVA:</strong> {reservasTerminais.length}</span>
                  <span><strong>CARROS NO CI / PENDURADOS:</strong> {penduradosAtivos.length}</span>
                  <span><strong>FINALIDADE:</strong> APOIO OPERACIONAL E MANUTENÇÃO</span>
                </div>
              </div>

              <div className="grid grid-cols-10 gap-4 items-stretch">
                <div className="col-span-3">
                  {renderCardPendurados(true)}
                </div>
                <div className="col-span-7">
                  {renderCardReservaTerminal(true)}
                </div>
              </div>

              {/* Rodapé Oficial da Impressão A4 - Página 2 */}
              <div className="flex items-center justify-between text-[7pt] text-neutral-600 border-t border-neutral-400 pt-1 mt-2 font-mono">
                <span>Sistema Garagem CGU • Anexo Operacional de Apoio e CI ({garagem}) • Impresso em: {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="font-bold">Página 02 / 02</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* VISUALIZAÇÃO 2: CARDS DE PISTA */}
      {/* ========================================================= */}
      {viewMode === "CARDS" && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSchedules.map(item => {
            const isDone = item.status === "LIBERADO" || item.status === "SUBSTITUIDO";
            const isSub = item.status === "SUBSTITUIDO" || (item.carroRealizado && item.carroRealizado !== item.carroProgramado);
            const finalCarro = item.carroRealizado || item.carroProgramado;
            const bloqueio = checkBloqueioCI(finalCarro);

            return (
              <div
                key={item.id}
                className={cn(
                  "p-3.5 rounded-xl border transition-all shadow-2xs hover:shadow-md flex flex-col justify-between relative overflow-hidden bg-card",
                  isDone
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "hover:border-primary/50"
                )}
              >
                {/* Topo do Card */}
                <div>
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-foreground">
                        Linha {item.linha}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                        Tab {item.tabela}
                      </span>
                    </div>

                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Liberado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Clock className="w-3 h-3" /> Pendente
                      </span>
                    )}
                  </div>

                  {/* Informações de Carro e Motorista */}
                  <div className="py-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Carro Programado:</span>
                      <span className={cn("font-mono font-bold", isSub && "line-through text-rose-500")}>
                        {item.carroProgramado || "—"}
                      </span>
                    </div>

                    {item.carroRealizado && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Carro Realizado:</span>
                        <span className={cn(
                          "font-mono font-bold px-1.5 py-0.5 rounded text-xs",
                          isSub ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black" : "text-foreground"
                        )}>
                          {item.carroRealizado}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Motorista (MOTO):</span>
                      <span className="font-semibold text-foreground">
                        {item.motoristaCodigo ? `${item.motoristaCodigo} - ${item.motoristaNome || "Escalado"}` : "Aguardando"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground border-t">
                      <span>Saída Garagem: <strong className="text-foreground">{item.saidaGaragem}</strong></span>
                      {item.inicioBairro && <span>Início Bairro: <strong>{item.inicioBairro}</strong></span>}
                    </div>

                    {bloqueio && (
                      <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        CI: {bloqueio.motivo}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="pt-2 border-t flex items-center gap-2">
                  {isDone ? (
                    <div className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 py-1.5 rounded-lg border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Liberado
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!releaseUiAllowed}
                      onClick={() => handleRelease(item)}
                      className="flex-1 h-8 text-xs font-bold rounded-lg bg-[#164E3A] hover:bg-[#113C2D] text-white shadow-2xs"
                    >
                      Liberar Saída
                    </Button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* VISUALIZAÇÃO: FORMULÁRIO PARA ALIMENTAR CARRO REALIZ. */}
      {/* ========================================================= */}
      {viewMode === "CARRO_REALIZADO" && (
        <CarroRealizadoView
          garagem={garagem}
          setGaragem={setGaragem}
          escalaTipo={escalaTipo}
          setEscalaTipo={setEscalaTipo}
          turnoTipo={turnoTipo}
          setTurnoTipo={setTurnoTipo}
          dataOperacao={dataOperacao}
          setDataOperacao={setDataOperacao}
          schedules={baseSchedules}
          dispatches={dispatches}
          onSaveDispatch={handleSaveDispatchFromView}
          ciList={ciList}
        />
      )}

      {/* ========================================================= */}
      {/* VISUALIZAÇÃO: FORMULÁRIO PARA ALIMENTAR CI MANUTENÇÃO */}
      {/* ========================================================= */}
      {(viewMode === "CI_MANUTENCAO" || viewMode === "CI_BLOQUEIOS") && (
        <CiManutencaoView
          ciList={ciList}
          setCiList={setCiList}
          garagemFiltro={garagem}
          dataOperacao={ciDateContext.current?.garagem === garagem && ciDate ? ciDate : ciC4Enabled ? ciSelectionDate(null, true) : getHojeLocal()}
          setDataOperacao={chooseCIDate}
        />
      )}

      {/* ========================================================= */}
      {/* VISUALIZAÇÃO 4: CARROS RESERVAS NOS TERMINAIS */}
      {/* ========================================================= */}
      {viewMode === "RESERVAS" && (
        <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b">
            <span className="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
              Escala de Apoio Operacional
            </span>
            <h2 className="text-lg font-bold text-foreground mt-1">
              Quadro de Carros Reservas nos Terminais • {garagem}
            </h2>
            <p className="text-xs text-muted-foreground">
              Alocação estratégica de ônibus reservas (Azul, Vermelho, Micro e Articulados)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {reservasAtivas.map((res, idx) => (
              <div key={idx} className="p-4 rounded-xl border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-sm">{res.terminal}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    res.cor === "VERMELHO" ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" :
                      res.cor === "AZUL" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" :
                        "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  )}>
                    {res.cor}
                  </span>
                </div>

                <div className="text-xs space-y-1 pt-1 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Carro 01:</span>
                    <strong className="font-mono text-primary text-sm">{res.carro1 || "—"}</strong>
                  </div>
                  {res.carro2 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Carro 02:</span>
                      <strong className="font-mono text-primary text-sm">{res.carro2}</strong>
                    </div>
                  )}
                  {res.horario && (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Chegada Terminal:</span>
                      <span className="font-mono">{res.horario}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISUALIZAÇÃO: ALTERAR FOLHA DE SOLTURA */}
      {/* ========================================================= */}
      {viewMode === "ALTERAR_FOLHA" && (
        <AlterarFolhaView
          garagem={garagem}
          escalaTipo={escalaTipo}
          turnoTipo={turnoTipo}
          schedules={permanentSchedules}
          onUpdateField={handleUpdateScheduleField}
          onUpdateMultipleFields={handleUpdateScheduleMultipleFields}
          onAddSchedule={handleAddSchedule}
          onDeleteSchedule={handleDeleteSchedule}
          onSelectGaragem={isAdmin ? setGaragem : undefined}
          onSelectEscalaTipo={setEscalaTipo}
          onSelectTurnoTipo={setTurnoTipo}
        />
      )}

      {/* ========================================================= */}
      {/* VISUALIZAÇÃO: ALTERAR CARRO PROGRAMADO */}
      {/* ========================================================= */}
      {viewMode === "ALTERAR_CARRO_PROGRAMADO" && (
        <>
        {dailyError && <div role="alert" className="p-3 border rounded print:hidden text-sm">
          <p>Nao foi possivel consultar as substituicoes desta data. A programacao fixa continua visivel; gravacao bloqueada.</p>
          {dailyError && <p className="text-xs text-muted-foreground">{dailyError}</p>}
          <Button type="button" variant="outline" onClick={() => {
            if (dailyDirtyFields.current.size && !window.confirm('Descartar as substituicoes digitadas e recarregar?')) return;
            dailyDirtyFields.current.clear(); setDailyEditEpoch(value => value + 1); void reloadDailyScale();
          }}>Recarregar substituicoes</Button>
        </div>}
        <AlterarCarroProgramadoView
          key={`${dailyContextKey}:${dailyEditEpoch}`}
          dateControl={<div className="group inline-flex h-9 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-50 shadow-2xs hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/80 transition-colors print:hidden" style={{ width: 240, minWidth: 240 }}>
            <div className="relative flex min-w-0 flex-1">
              <button type="button" aria-label="Escolher data da escala" title="Clique para escolher uma data no calendário"
                onClick={() => {
                  const input = scaleDateInputRef.current;
                  if (!input) return;
                  try { input.showPicker(); } catch { input.focus(); input.click(); }
                }}
                className="relative z-10 flex w-full items-center gap-2 pl-3.5 pr-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-500 group-hover:text-emerald-600 transition-colors pointer-events-none" />
              <span className="text-xs font-mono font-bold text-gray-900 dark:text-white pointer-events-none select-none">{formatarDataBr(dataOperacao)}</span>
              </button>
              <input ref={scaleDateInputRef} type="date" tabIndex={-1} aria-label="Data da escala" value={dataOperacao}
                onChange={e => { if (e.target.value) setDataOperacao(e.target.value); }}
                className="pointer-events-none absolute inset-0 h-full w-full opacity-0" />
            </div>
            <div className="flex shrink-0 items-center py-2">
              <button type="button" onClick={() => setDataOperacao(getHojeLocal())} title="Voltar para a data de hoje"
                className="h-full whitespace-nowrap border-l border-gray-200 px-3 text-[11px] font-semibold text-emerald-700 hover:underline dark:border-slate-700 dark:text-emerald-400">Hoje</button>
            </div>
          </div>}
          onEditingChange={(key, dirty) => {
            if (dirty) { dailyDirtyFields.current.add(key); ++dailyReadSequence.current; ++scaleReadSequence.current; }
            else dailyDirtyFields.current.delete(key);
          }}
          readOnly={!canEditDailyScale || !dailyReady}
          readOnlyReason={!dailyDateEditable ? 'Somente a escala de hoje pode ser alterada. Esta data permite apenas consulta.' : !canEditDailyScale ? 'Seu perfil possui apenas permissao de consulta da Escala.' : dailyError ? 'Consulta das substituicoes falhou. Confira o aviso acima e recarregue apos resolver a falha.' : 'Aguardando a consulta das substituicoes da data selecionada.'}
          garagem={garagem}
          escalaTipo={escalaTipo}
          schedules={dailySchedules}
          official={dailyReady ? dailyScale : null}
          onSaveSubstitution={persistDailySchedule}
          onSaveCard={persistDailyCard}
          onSelectGaragem={isAdmin ? setGaragem : undefined}
          onSelectEscalaTipo={setEscalaTipo}
        />
        </>
      )}

      {/* ========================================================= */}
      {/* POPUP MODAL: ADICIONAR NA RESERVA DO TERMINAL (Design System) */}
      {/* ========================================================= */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[340px] sm:max-w-[360px] rounded-3xl border border-border bg-card text-card-foreground p-6 shadow-2xl">
          <DialogHeader className="space-y-2 text-center pb-1">
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Adicionar Carro Reserva
              </DialogTitle>
              <p className="text-sm font-bold text-[#164E3A] dark:text-emerald-400 mt-0.5">
                {selectedTerminal}
              </p>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddReserva} className="space-y-4 pt-1">
            {/* Campo 1: Prefixo do Veículo */}
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5 text-[#164E3A] dark:text-emerald-400" />
                Prefixo do Carro
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: 1045, 2012..."
                  value={inputCarro}
                  onChange={(e) => setInputCarro(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-sm font-bold font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-hidden focus:ring-2 focus:ring-[#164E3A]/40 dark:focus:ring-emerald-400/40 transition-all shadow-2xs"
                  autoFocus
                />
                {inputCarro && (
                  <button
                    type="button"
                    onClick={() => setInputCarro("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
                    title="Limpar prefixo"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Campo 2: Tipo de Veículo (Seleção direta por Badges) */}
            <div className="space-y-2 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#164E3A] dark:text-emerald-400" />
                Tipo de Veículo
              </label>

              {/* Grade de Badges de Seleção Direta */}
              <div className="grid grid-cols-3 gap-2">
                {TIPOS_RESERVA.map(t => {
                  const isSelected = selectedTipo === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setSelectedTipo(t.value)}
                      className={cn(
                        "h-10 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border shadow-2xs select-none",
                        isSelected
                          ? t.value === "VERMELHO" ? "border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30 scale-102" :
                            t.value === "AZUL" ? "border-sky-500 bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/30 scale-102" :
                              t.value === "CORINGA" ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30 scale-102" :
                                t.value === "MICRO" ? "border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/30 scale-102" :
                                  "border-orange-500 bg-orange-500/15 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500/30 scale-102"
                          : "border-border/70 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <span className={cn("w-2 h-2 rounded-full shrink-0", t.dotColor)} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botão de Envio */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingReserva}
                className="w-full h-11 rounded-xl bg-[#164E3A] hover:bg-[#113C2D] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {isSubmittingReserva ? "adicionando..." : "adicionar na reserva"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* POPUP MODAL: ADICIONAR NA RESERVA DA GARAGEM CENTRAL (Design System) */}
      {/* ========================================================= */}
      <Dialog open={isGaragemModalOpen} onOpenChange={setIsGaragemModalOpen}>
        <DialogContent className="max-w-[340px] sm:max-w-[360px] rounded-3xl border border-border bg-card text-card-foreground p-6 shadow-2xl">
          <DialogHeader className="space-y-2 text-center pb-1">
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Adicionar Carro Reserva
              </DialogTitle>
              <p className="text-sm font-bold text-[#164E3A] dark:text-emerald-400 mt-0.5">
                Garagem Central (VCG)
              </p>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddReservaGaragem} className="space-y-4 pt-1">
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5 text-[#164E3A] dark:text-emerald-400" />
                Prefixo do Carro
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: 4259, 3132..."
                  value={inputCarroGaragem}
                  onChange={(e) => setInputCarroGaragem(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-sm font-bold font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-hidden focus:ring-2 focus:ring-[#164E3A]/40 dark:focus:ring-emerald-400/40 transition-all shadow-2xs"
                  autoFocus
                />
                {inputCarroGaragem && (
                  <button
                    type="button"
                    onClick={() => setInputCarroGaragem("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
                    title="Limpar prefixo"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingGaragem}
                className="w-full h-11 rounded-xl bg-[#164E3A] hover:bg-[#113C2D] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {isSubmittingGaragem ? "adicionando..." : "adicionar na reserva"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ----------------------------------------------------------------------
// COMPONENTE DE LINHA DA TABELA DA FOLHA DE SOLTURA (ESTILO PRANCHETA)
// ----------------------------------------------------------------------
interface FolhaTableRowProps {
  item: SolturaItem;
  index: number;
  reservasTerminais?: ReservaTerminalItem[];
  checkBloqueioCI: (prefixo?: string) => BloqueioCarro | undefined | null;
  onRelease: (item: SolturaItem, carro?: string, moto?: string) => void;
  onDraftChange: (itemId: string, field: "carro" | "moto", value: string) => void;
  onTrocarCarro?: (item: SolturaItem, novoCarro: string, motivo: string) => void;
  onPenduradoAlert?: (prefixo: string, motivo?: string | null) => void;
  getOutraLinhaComCarroRealiz?: (carro: string, currentItemId: string) => SolturaItem | undefined | null;
  getOutraLinhaComMoto?: (moto: string, currentItemId: string) => SolturaItem | undefined | null;
  historicoTrocas?: TrocaCarroItem[];
  isReadOnly?: boolean;
}

function FolhaTableRow({
  item,
  index,
  reservasTerminais = [],
  checkBloqueioCI,
  onRelease,
  onDraftChange,
  onTrocarCarro,
  onPenduradoAlert,
  getOutraLinhaComCarroRealiz,
  getOutraLinhaComMoto,
  historicoTrocas = [],
  isReadOnly = false
}: FolhaTableRowProps) {
  const isDone = item.status === "LIBERADO" || item.status === "SUBSTITUIDO";
  const isSub = item.status === "SUBSTITUIDO" || (item.carroRealizado && item.carroRealizado !== item.carroProgramado);

  const [carroValue, setCarroValue] = useState(item.carroRealizado || "");
  const [motoValue, setMotoValue] = useState(item.motoristaCodigo || "");

  useEffect(() => {
    setCarroValue(item.carroRealizado || "");
  }, [item.carroRealizado]);

  useEffect(() => {
    setMotoValue(item.motoristaCodigo || "");
  }, [item.motoristaCodigo]);

  // Alerta de motorista repetido em outra linha ativa
  const conflitoMoto = motoValue.trim() && getOutraLinhaComMoto ? getOutraLinhaComMoto(motoValue.trim(), item.id) : null;

  // Apenas permitir liberar se Carro Realizado e MOTO estiverem completados e sem conflito de motorista
  const isLiberarHabilitado = Boolean(carroValue.trim() && motoValue.trim() && !conflitoMoto);

  // Atalho: pressionar Enter com Carro Realizado e MOTO preenchidos já libera a saída
  const handleKeyDownCarro = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (carroValue.trim() && motoValue.trim()) {
        if (conflitoMoto) {
          toast.error(`Motorista (MOTO ${motoValue.trim()}) já está escalado na Linha ${conflitoMoto.linha} / Tab ${conflitoMoto.tabela}!`);
          return;
        }
        onRelease(item, carroValue, motoValue);
      } else if (!motoValue.trim()) {
        const motoInput = document.getElementById(`moto-input-${item.id}`);
        if (motoInput) {
          motoInput.focus();
        }
      }
    }
  };

  const handleKeyDownMoto = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (carroValue.trim() && motoValue.trim()) {
        if (conflitoMoto) {
          toast.error(`Motorista (MOTO ${motoValue.trim()}) já está escalado na Linha ${conflitoMoto.linha} / Tab ${conflitoMoto.tabela}!`);
          return;
        }
        onRelease(item, carroValue, motoValue);
      } else if (!carroValue.trim()) {
        const carroInput = document.getElementById(`carro-input-${item.id}`);
        if (carroInput) {
          carroInput.focus();
        }
      }
    }
  };

  // Alertas de CI verificados separadamente:
  // 1. Carro Programado: alerta se o programado estiver no CI
  const bloqueioProg = checkBloqueioCI(item.carroProgramado);
  // 2. Carro Realizado: alerta APENAS se o carro preenchido estiver no CI
  const bloqueioRealiz = carroValue.trim() ? checkBloqueioCI(carroValue.trim()) : null;

  // Alerta de Reserva de Terminal:
  const reservaProg = reservasTerminais.find(r => r.carro.trim() === item.carroProgramado?.trim());
  const reservaRealiz = carroValue.trim() ? reservasTerminais.find(r => r.carro.trim() === carroValue.trim()) : null;

  const isVCM = item.tipo === "VCM";
  const isFrete = item.tipo === "FRETAMENTO";

  return (
    <tr
      className={cn(
        "transition-colors group border-b",
        isVCM
          ? isDone
            ? "bg-blue-500/15 hover:bg-blue-500/25 dark:bg-blue-950/50 dark:hover:bg-blue-950/70 border-blue-500/30"
            : "bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 border-blue-500/30 text-foreground"
          : isFrete
            ? isDone
              ? "bg-amber-500/15 hover:bg-amber-500/25 dark:bg-amber-950/50 dark:hover:bg-amber-950/70 border-amber-500/30"
              : "bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border-amber-500/30 text-foreground"
            : isDone
              ? "bg-emerald-500/5 hover:bg-emerald-500/10 border-border/50"
              : index % 2 === 0 ? "bg-muted/20 hover:bg-muted/40 border-border/50" : "bg-card hover:bg-muted/30 border-border/50"
      )}
    >
      {/* 1. Ordem */}
      <td className="py-2 px-2 text-center text-muted-foreground text-[11px] font-semibold select-none">
        {String(item.ordemTerminal ?? item.ordem ?? index).padStart(2, "0")}
      </td>

      {/* 2. Linha */}
      <td className="py-2 px-2.5 font-bold text-foreground text-xs whitespace-nowrap">
        <div className="flex items-center gap-1">
          {item.linha}
          {item.tipo === "VCM" && (
            <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 uppercase">VCM</span>
          )}
          {item.tipo === "FRETAMENTO" && (
            <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 uppercase">Frete</span>
          )}
          {item.tipo === "EXTRA" && (
            <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 uppercase">Extra</span>
          )}
        </div>
      </td>

      {/* 3. Tabela */}
      <td className="py-2 px-2 text-center text-xs font-semibold text-muted-foreground">
        {item.tabela}
      </td>

      {/* 4. Carro Programado - Destaca com alerta caso o carro programado esteja na CI ou na Reserva */}
      <td className="py-2 px-2.5 whitespace-nowrap text-center">
        <div className="flex items-center justify-center gap-1">
          <span className={cn(
            "font-bold text-xs",
            (bloqueioProg || reservaProg) && "text-rose-600 dark:text-rose-400 font-extrabold",
            isSub ? "line-through text-rose-500 font-normal decoration-2" : (!bloqueioProg && !reservaProg) && "text-muted-foreground"
          )}>
            {item.carroProgramado || "—"}
          </span>
          {bloqueioProg ? (
            <span title={`Carro Programado no CI: ${bloqueioProg.motivo}`} className="cursor-help text-rose-500 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          ) : reservaProg ? (
            <span title={`Atenção: Carro ${item.carroProgramado} alocado na reserva do ${reservaProg.terminal}!`} className="cursor-help text-rose-500 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          ) : null}
        </div>
      </td>

      {/* 5. Carro Realizado (P) - Com suporte a popover de Alteração e Histórico de Trocas (Prints 2 e 3) */}
      <td className={cn(
        "py-1.5 px-2 text-center relative",
        isVCM ? "bg-blue-500/10 dark:bg-blue-950/30" : isFrete ? "bg-amber-500/10 dark:bg-amber-950/30" : "bg-muted/20"
      )}>
        <span className="hidden print:inline font-mono font-bold text-[8pt] text-black">
          {carroValue || item.carroProgramado}
        </span>
        <div className="print:hidden flex items-center justify-center gap-1">
          {isDone ? (
            <CarroTrocaPopover
              item={item}
              carroAtual={carroValue || item.carroRealizado || item.carroProgramado || "---"}
              historicoTrocas={historicoTrocas}
              onTrocarCarro={onTrocarCarro || (() => { })}
              checkBloqueioCI={checkBloqueioCI}
              onPenduradoAlert={onPenduradoAlert}
              getOutraLinhaComCarroRealiz={getOutraLinhaComCarroRealiz}
              isReadOnly={isReadOnly}
            />
          ) : (
            <>
              <input
                id={`carro-input-${item.id}`}
                type="text"
                placeholder=""
                value={carroValue}
                disabled={isReadOnly}
                onKeyDown={handleKeyDownCarro}
                onChange={(e) => {
                  const val = e.target.value;
                  setCarroValue(val);
                  onDraftChange(item.id, "carro", val);

                  const cleanVal = val.trim();
                  if (cleanVal.length >= 4) {
                    const bloqueio = checkBloqueioCI(cleanVal);
                    if (bloqueio) {
                      onPenduradoAlert?.(cleanVal, bloqueio.motivo);
                      return;
                    }
                    if (getOutraLinhaComCarroRealiz) {
                      const outraLinha = getOutraLinhaComCarroRealiz(cleanVal, item.id);
                      if (outraLinha) {
                        toast.error(`Carro ${cleanVal} já está sendo utilizado na Linha ${outraLinha.linha} / Tab ${outraLinha.tabela}!`);
                      }
                    }
                  }
                }}
                onBlur={() => {
                  const cleanVal = carroValue.trim();
                  if (cleanVal) {
                    const bloqueio = checkBloqueioCI(cleanVal);
                    if (bloqueio) {
                      onPenduradoAlert?.(cleanVal, bloqueio.motivo);
                      return;
                    }
                    if (getOutraLinhaComCarroRealiz) {
                      const outraLinha = getOutraLinhaComCarroRealiz(cleanVal, item.id);
                      if (outraLinha) {
                        toast.error(`Carro ${cleanVal} já está sendo utilizado na Linha ${outraLinha.linha} / Tab ${outraLinha.tabela}!`);
                      }
                    }
                  }
                }}
                className={cn(
                  "w-16 h-7 text-center rounded-md border text-xs font-bold font-mono focus:outline-hidden focus:ring-1 transition-all",
                  isReadOnly
                    ? "bg-transparent border-transparent text-foreground dark:text-white cursor-default font-bold"
                    : isSub
                      ? "text-blue-600 dark:text-blue-400 border-blue-500/50 bg-blue-500/10"
                      : isVCM
                        ? "bg-background/80 border-blue-500/40 text-foreground focus:ring-blue-500"
                        : isFrete
                          ? "bg-background/80 border-amber-500/40 text-foreground focus:ring-amber-500"
                          : "bg-background border-border/80 text-foreground dark:text-white focus:ring-[#164E3A]",
                  (bloqueioRealiz || reservaRealiz) && "border-rose-500 text-rose-600 bg-rose-500/10 font-bold"
                )}
                title={
                  bloqueioRealiz
                    ? `Atenção: Carro Realizado no CI: ${bloqueioRealiz.motivo}`
                    : reservaRealiz
                      ? `Atenção: Carro ${carroValue} alocado na reserva do ${reservaRealiz.terminal} (será consumido da reserva ao liberar)`
                      : undefined
                }
              />
              {(bloqueioRealiz || reservaRealiz) && (
                <span
                  title={
                    bloqueioRealiz
                      ? `Carro Realizado no CI: ${bloqueioRealiz.motivo}`
                      : `Carro na reserva do ${reservaRealiz?.terminal}`
                  }
                  className="cursor-help text-rose-500 shrink-0"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
              )}
            </>
          )}
        </div>
      </td>

      {/* 6. Motorista (MOTO) - Placeholder Vazio */}
      <td className="py-1.5 px-2 text-center">
        <span className="hidden print:inline font-mono font-bold text-[8pt] text-black">
          {motoValue || "—"}
        </span>
        <input
          id={`moto-input-${item.id}`}
          type="text"
          placeholder=""
          value={motoValue}
          disabled={isDone || isReadOnly}
          onKeyDown={handleKeyDownMoto}
          onChange={(e) => {
            const val = e.target.value;
            setMotoValue(val);
            onDraftChange(item.id, "moto", val);

            const cleanVal = val.trim();
            if (cleanVal.length >= 2 && getOutraLinhaComMoto) {
              const outraLinha = getOutraLinhaComMoto(cleanVal, item.id);
              if (outraLinha) {
                toast.error(`Motorista (MOTO ${cleanVal}) já está escalado na Linha ${outraLinha.linha} / Tab ${outraLinha.tabela}!`);
              }
            }
          }}
          onBlur={() => {
            const cleanVal = motoValue.trim();
            if (cleanVal && getOutraLinhaComMoto) {
              const outraLinha = getOutraLinhaComMoto(cleanVal, item.id);
              if (outraLinha) {
                toast.error(`Motorista (MOTO ${cleanVal}) já está escalado na Linha ${outraLinha.linha} / Tab ${outraLinha.tabela}!`);
              }
            }
          }}
          className={cn(
            "print:hidden w-16 h-7 text-center rounded-md border text-xs font-mono font-bold focus:outline-hidden transition-all",
            (isDone || isReadOnly)
              ? "bg-transparent border-transparent text-foreground cursor-default"
              : isVCM
                ? "bg-background/80 border-blue-500/40 text-foreground focus:ring-1 focus:ring-blue-500"
                : isFrete
                  ? "bg-background/80 border-amber-500/40 text-foreground focus:ring-1 focus:ring-amber-500"
                  : "bg-card border-border/80 text-foreground focus:ring-1 focus:ring-[#164E3A]",
            conflitoMoto && "border-rose-500 text-rose-600 bg-rose-500/10 font-bold focus:ring-rose-500"
          )}
          title={
            conflitoMoto
              ? `Atenção: Motorista já escalado na Linha ${conflitoMoto.linha} / Tab ${conflitoMoto.tabela}!`
              : item.motoristaNome ? `Motorista: ${item.motoristaNome}` : "Digite o código MOTO"
          }
        />
      </td>

      {/* 7. Horário Saída Garagem */}
      <td className="py-1 px-2 text-center font-mono font-bold text-xs text-foreground whitespace-nowrap">
        {item.saidaGaragem}
      </td>

      {/* 8. Horário Início Linha / Bairro */}
      <td className="py-1 px-2 text-center font-mono text-xs text-muted-foreground whitespace-nowrap">
        {item.inicioBairro || item.chegadaGaragem || item.inicioLinha || "—"}
      </td>

      {/* 9. Ações: Liberar Saída (Apenas ícone de certo, sem texto) */}
      <td className="py-1 px-2 text-center print:hidden">
        {isReadOnly ? (
          <div className="flex items-center justify-center">
            {isDone ? (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </span>
            ) : (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground/30 border border-border/40 opacity-30">
                <Check className="w-4 h-4" />
              </span>
            )}
          </div>
        ) : isDone ? (
          <div className="flex items-center justify-center">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs"
              title="Saída liberada"
            >
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <button
              type="button"
              disabled={!isLiberarHabilitado}
              onClick={() => onRelease(item, carroValue, motoValue)}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-2xs select-none",
                isLiberarHabilitado
                  ? "bg-[#164E3A] hover:bg-[#113C2D] text-white cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                  : "bg-muted text-muted-foreground/30 border border-border/40 cursor-not-allowed opacity-30 shadow-none"
              )}
              title={
                isLiberarHabilitado
                  ? "Liberar saída do veículo (ou pressione Enter)"
                  : "Preencha o Carro Realizado e o MOTO para liberar"
              }
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
