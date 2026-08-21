import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Camera,
  Trash2,
  Calendar,
  User,
  MapPin,
  Bus,
  Eye,
  RefreshCw,
  X,
  CheckCircle2,
  Plus,
  Filter,
  WifiOff,
  CloudUpload,
  Gauge,
} from "lucide-react";
import {
  savePending,
  getPending,
  removePending,
  syncPending,
  saveCache,
  getCache,
  type PendingRecord,
} from "@/lib/offline-db";

interface OperationalControlRecord {
  id: number;
  carro: string;
  linha: string;
  garagem: string;
  foto1: string;
  foto2: string | null;
  foto3: string | null;
  dataInsercao: string;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  pendingId?: string;
}

const FALLBACK_VEICULOS = [
  1101, 1102, 1103, 1104, 1105, 1106, 1107, 1108, 1109, 1110,
  1111, 1112, 1113, 1114, 1115, 1116, 1117, 1118, 1119, 1120,
  1271, 1272, 1273, 1274, 1275, 1276, 1277, 1278, 1279, 1280,
  1361, 1362, 1363, 1364, 1365, 1366, 1367, 1368, 1369, 1370,
  4258, 4259, 4260, 4261, 4262, 4263, 4264, 4265, 4276, 4277
];

const GARAGEM_MAP: Record<string, string> = {
  VCG: "Garagem: VCG",
  VCM: "Garagem VCM",
};

const GARAGEM_FILTER_OPTIONS = [
  { value: "Garagem: VCG", label: "VCG" },
  { value: "Garagem VCM", label: "VCM" },
];

export function ControleOperacionalPage() {
  const { user, token } = useAuth();
  const [veiculos, setVeiculos] = useState<number[]>([]);
  const [records, setRecords] = useState<OperationalControlRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [veiculosLoading, setVeiculosLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  // Form states
  const [selectedCarro, setSelectedCarro] = useState("");
  const [carroSearch, setCarroSearch] = useState("");
  const [carroDropdownOpen, setCarroDropdownOpen] = useState(false);
  const [km, setKm] = useState("");
  const [selectedGaragem, setSelectedGaragem] = useState("");
  const [foto1, setFoto1] = useState<string | null>(null);
  const [foto2, setFoto2] = useState<string | null>(null);
  const [foto3, setFoto3] = useState<string | null>(null);

  // Camera states
  const [activeCameraSlot, setActiveCameraSlot] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Lightbox state
  const [activePhotoView, setActivePhotoView] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Filter state
  const [filterGaragem, setFilterGaragem] = useState<string>("");

  const isVCGOrVCM = user?.garagem === "VCG" || user?.garagem === "VCM";

  const loadVeiculos = async () => {
    setVeiculosLoading(true);
    try {
      const data = await api.listOperacionalVeiculos();
      const veiculosList = (data as any[]).map((v) => v.idCarro);
      setVeiculos(veiculosList);
      await saveCache("operacional-veiculos", veiculosList);
    } catch (err: any) {
      const cached = await getCache("operacional-veiculos");
      if (cached) {
        setVeiculos(cached);
      } else {
        setVeiculos(FALLBACK_VEICULOS);
        if (navigator.onLine) {
          toast.error("Erro ao carregar veículos, usando lista padrão: " + err.message);
        }
      }
    } finally {
      setVeiculosLoading(false);
    }
  };

  const loadRecords = async () => {
    setListLoading(true);
    try {
      const data = await api.listControleOperacional({
        ...(filterGaragem ? { garagem: filterGaragem } : {}),
      });
      const serverRecords = data as OperationalControlRecord[];

      const pending = await getPending();
      const offlineRecords: OperationalControlRecord[] = pending
        .filter((p) => p.type === "controle-operacional")
        .map((p) => ({
          id: -1,
          carro: p.data.carro,
          linha: p.data.linha,
          garagem: p.data.garagem,
          foto1: p.data.foto1,
          foto2: p.data.foto2 || null,
          foto3: p.data.foto3 || null,
          dataInsercao: p.createdAt,
          userId: 0,
          user: { id: 0, name: user?.name || "Você", email: user?.email || "" },
          pendingId: p.id,
        } as OperationalControlRecord));

      setRecords([...offlineRecords, ...serverRecords]);
    } catch (err: any) {
      const pending = await getPending();
      const offlineRecords: OperationalControlRecord[] = pending
        .filter((p) => p.type === "controle-operacional")
        .map((p) => ({
          id: -1,
          carro: p.data.carro,
          linha: p.data.linha,
          garagem: p.data.garagem,
          foto1: p.data.foto1,
          foto2: p.data.foto2 || null,
          foto3: p.data.foto3 || null,
          dataInsercao: p.createdAt,
          userId: 0,
          user: { id: 0, name: user?.name || "Você", email: user?.email || "" },
          pendingId: p.id,
        } as OperationalControlRecord));
      setRecords(offlineRecords);

      if (navigator.onLine) {
        toast.error("Erro ao carregar registros: " + err.message);
      }
    } finally {
      setListLoading(false);
    }
  };

  const updatePendingCount = async () => {
    const pending = await getPending();
    setPendingCount(pending.length);
  };

  const handleSync = useCallback(async () => {
    if (syncing || !token) return;
    setSyncing(true);
    try {
      const result = await syncPending(async (record) => {
        await api.createControleOperacional(record.data);
      });
      if (result.synced > 0) {
        toast.success(`${result.synced} registro(s) sincronizado(s) com sucesso!`);
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "SYNC_COMPLETE" });
        }
        loadRecords();
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} registro(s) falharam na sincronização.`);
      }
    } catch (err: any) {
      toast.error("Erro na sincronização: " + err.message);
    } finally {
      setSyncing(false);
      updatePendingCount();
    }
  }, [syncing, token]);

  const handleDeletePending = async (pendingId: string) => {
    try {
      await removePending(pendingId);
      toast.success("Registro pendente removido!");
      updatePendingCount();
      loadRecords();
    } catch (err: any) {
      toast.error("Erro ao remover registro: " + err.message);
    }
  };

  useEffect(() => {
    loadVeiculos();
    loadRecords();
    updatePendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      updatePendingCount().then(() => {
        getPending().then((pending) => {
          if (pending.length > 0) {
            toast.info("Conexão restaurada! Sincronizando dados...");
            handleSync();
          }
        });
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Sem conexão! Os dados serão salvos localmente.");
    };

    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isMobileSize = window.innerWidth < 768;
      setIsMobile(isMobileUA || isMobileSize);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleSync]);

  // Handle camera stream lifecycle
  useEffect(() => {
    let streamInstance: MediaStream | null = null;

    if (activeCameraSlot !== null) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Acesso à câmera indisponível. Certifique-se de que a conexão é segura (HTTPS) ou use localhost.");
        setActiveCameraSlot(null);
        return;
      }

      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        .then((stream) => {
          streamInstance = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((e) => console.log("Video play interrupted", e));
          }
        })
        .catch((err) => {
          console.error("Camera error:", err);
          toast.error("Não foi possível acessar a câmera. Verifique as permissões de acesso.");
          setActiveCameraSlot(null);
        });
    }

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeCameraSlot]);

  const capturePhoto = (slot: number) => {
    const video = videoRef.current;
    if (video) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.85);

        if (slot === 1) setFoto1(base64);
        if (slot === 2) setFoto2(base64);
        if (slot === 3) setFoto3(base64);
      }
    }
    setActiveCameraSlot(null);
  };

  const resizeImage = (base64Str: string, maxWidth = 1280, maxHeight = 960): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slot: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        const compressedBase64 = await resizeImage(rawBase64);
        if (slot === 1) setFoto1(compressedBase64);
        if (slot === 2) setFoto2(compressedBase64);
        if (slot === 3) setFoto3(compressedBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setSelectedCarro("");
    setCarroSearch("");
    setKm("");
    setSelectedGaragem(isVCGOrVCM && user?.garagem ? GARAGEM_MAP[user.garagem] || "" : "");
    setFoto1(null);
    setFoto2(null);
    setFoto3(null);
    setActiveCameraSlot(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalCarro = selectedCarro;
    if (!finalCarro && carroSearch) {
      const match = veiculos.find((v) => String(v) === carroSearch.trim());
      if (match) {
        finalCarro = String(match);
      }
    }

    if (!finalCarro) {
      toast.error("Selecione um carro válido da lista.");
      return;
    }
    
    if (!km) {
      toast.error("Insira a quilometragem (km).");
      return;
    }
    
    const kmClean = String(km).replace(/\D/g, "");
    if (kmClean.length !== 7) {
      toast.error("A quilometragem (km) deve conter exatamente 7 dígitos.");
      return;
    }

    const garagemToSend = isVCGOrVCM ? GARAGEM_MAP[user!.garagem!] : selectedGaragem;
    if (!garagemToSend) {
      toast.error("Selecione uma garagem.");
      return;
    }
    
    if (!foto1) {
      toast.error("A foto Frontal (Foto 1) é obrigatória.");
      return;
    }
    if (!foto2) {
      toast.error("A foto Frente e Lateral Direita (Foto 2) é obrigatória.");
      return;
    }
    if (!foto3) {
      toast.error("A foto Traseira e Lateral Direita (Foto 3) é obrigatória.");
      return;
    }

    const data: any = {
      carro: finalCarro,
      linha: String(km),
      garagem: garagemToSend,
      foto1,
      foto2,
      foto3,
    };

    setLoading(true);
    try {
      if (!navigator.onLine) {
        const record: PendingRecord = {
          id: crypto.randomUUID(),
          type: "controle-operacional",
          data,
          token: token || "",
          createdAt: new Date().toISOString(),
        };
        await savePending(record);
        toast.success("Salvo offline! Será sincronizado quando a conexão voltar.");
        resetForm();
        setDialogOpen(false);
        updatePendingCount();
        loadRecords();
      } else {
        await api.createControleOperacional(data);
        toast.success("Controle operacional registrado com sucesso!");
        resetForm();
        setDialogOpen(false);
        loadRecords();
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar controle operacional.");
    } finally {
      setLoading(false);
    }
  };

  const renderPhotoSlot = (
    slotNumber: number,
    label: string,
    isRequired: boolean,
    photoState: string | null,
    setPhotoState: (val: string | null) => void
  ) => {
    const isCameraActive = activeCameraSlot === slotNumber;

    return (
      <div className="flex flex-col space-y-2 border border-border/80 bg-card rounded-xl p-4 shadow-sm relative overflow-hidden transition-all hover:border-muted-foreground/30">
        <div className="flex items-center justify-between">
          <Label className="font-semibold text-sm">
            {label} {isRequired && <span className="text-destructive">*</span>}
          </Label>
          {photoState && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setPhotoState(null)}
              className="h-7 w-7 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="relative h-48 w-full rounded-lg bg-muted/30 flex items-center justify-center border border-dashed border-muted overflow-hidden">
          {isCameraActive ? (
            <div className="absolute inset-0 flex flex-col justify-between bg-black">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-3 px-4 z-10">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => capturePhoto(slotNumber)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-950/20"
                >
                  Capturar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveCameraSlot(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : photoState ? (
            <div className="relative inset-0 w-full h-full group">
              <img
                src={photoState}
                alt={label}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => setActivePhotoView(photoState)}
                  className="h-8 w-8 rounded-full"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="rounded-full bg-primary/5 p-3">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-xs text-muted-foreground">Tire uma foto</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {!isMobile ? (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setActiveCameraSlot(slotNumber);
                    }}
                    className="gap-1.5 font-semibold shadow-sm"
                  >
                    <Camera className="h-4 w-4" />
                    Abrir Câmera
                  </Button>
                ) : (
                  <label className="inline-flex items-center justify-center rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 gap-1.5 cursor-pointer shadow-sm transition-colors">
                    <Camera className="h-4 w-4" />
                    Tirar Foto
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, slotNumber)}
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Obter o conjunto de carros já cadastrados na data selecionada
  const registeredCars = new Set(
    records.map((r) => String(r.carro).trim())
  );

  // Filtrar veículos disponíveis
  const availableVeiculos = veiculos.filter(
    (v) => !registeredCars.has(String(v).trim())
  );

  // Ordenar registros por número do carro numericamente
  const sortedRecords = [...records].sort((a, b) => {
    const numA = parseInt(a.carro.replace(/\D/g, ""), 10);
    const numB = parseInt(b.carro.replace(/\D/g, ""), 10);
    if (isNaN(numA) || isNaN(numB)) {
      return a.carro.localeCompare(b.carro);
    }
    return numA - numB;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight pb-3">Controle Operacional</h1>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">
          Registre vistorias de carros, linhas e garagens com fotos e acompanhe o histórico
        </p>
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>Modo offline — os dados serão salvos localmente e sincronizados quando a conexão voltar.</span>
        </div>
      )}

      {/* Pending Sync Banner */}
      {pendingCount > 0 && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-600 dark:text-blue-400">
          <div className="flex items-center gap-2">
            <CloudUpload className="h-4 w-4 shrink-0" />
            <span>{pendingCount} registro(s) pendente(s) de sincronização</span>
          </div>
          {isOnline && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={syncing}
              className="h-7 text-xs border-blue-500/30 hover:bg-blue-500/10"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? "animate-spin" : ""}`} />
              Sincronizar
            </Button>
          )}
        </div>
      )}

      {/* Filters */}
      <Card className="border-border/80 shadow-md">
        <CardHeader className="flex flex-row items-center gap-2 border-b pb-3 bg-muted/10">
          <Filter className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-semibold">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-row flex-wrap gap-3 items-end">
            {user?.role === "ADMIN" && (
              <div className="flex flex-col gap-1.5 flex-1 sm:flex-initial">
                <Label className="text-xs font-medium">Garagem</Label>
                <Select value={filterGaragem || "all"} onValueChange={(v) => setFilterGaragem(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {GARAGEM_FILTER_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={loadRecords} disabled={listLoading} className="gap-1.5 w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 ${listLoading ? "animate-spin" : ""}`} />
              Atualizar Lista
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card className="border-border/80 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 bg-muted/10">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Histórico de Cadastros
            <span className="text-sm font-normal text-muted-foreground">
              ({records.length} {records.length === 1 ? "registro" : "registros"})
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadRecords}
            disabled={listLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${listLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {listLoading ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              Carregando histórico...
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum registro encontrado para o período selecionado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/20 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Carro</th>
                    <th className="p-4 font-semibold">KM</th>
                    <th className="p-4 font-semibold">Garagem</th>
                    <th className="p-4 font-semibold">Fotos</th>
                    <th className="p-4 font-semibold">Data e Hora</th>
                    <th className="p-4 font-semibold">Inserido Por</th>
                    <th className="p-4 font-semibold w-16 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedRecords.map((record) => (
                    <tr key={record.pendingId || record.id} className={`transition-colors ${record.pendingId ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-muted/10"}`}>
                      <td className="p-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Bus className="h-4 w-4 text-muted-foreground" />
                          {record.carro}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-muted-foreground" />
                          {record.linha}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {record.garagem.replace(/Garagem:?\s*/gi, "")}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="relative h-10 w-10 border rounded bg-muted/40 cursor-pointer overflow-hidden group"
                            onClick={() => setActivePhotoView(record.foto1)}
                          >
                            <img src={record.foto1} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                              <Eye className="h-3 w-3 text-white" />
                            </div>
                          </div>

                          {record.foto2 ? (
                            <div
                              className="relative h-10 w-10 border rounded bg-muted/40 cursor-pointer overflow-hidden group"
                              onClick={() => setActivePhotoView(record.foto2!)}
                            >
                              <img src={record.foto2} className="h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                <Eye className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-10 w-10 border rounded border-dashed bg-muted/20 flex items-center justify-center text-muted-foreground/30">
                              -
                            </div>
                          )}

                          {record.foto3 ? (
                            <div
                              className="relative h-10 w-10 border rounded bg-muted/40 cursor-pointer overflow-hidden group"
                              onClick={() => setActivePhotoView(record.foto3!)}
                            >
                              <img src={record.foto3} className="h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                <Eye className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-10 w-10 border rounded border-dashed bg-muted/20 flex items-center justify-center text-muted-foreground/30">
                              -
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">
                        {new Date(record.dataInsercao).toLocaleDateString("pt-BR")} {new Date(record.dataInsercao).toLocaleTimeString("pt-BR")}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-xs leading-none">{record.user.name}</p>
                            <span className="text-[10px] text-muted-foreground">{record.user.email}</span>
                            {record.pendingId && (
                              <span className="ml-1 inline-flex items-center rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20">
                                Pendente
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {record.pendingId ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePending(record.pendingId!)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            title="Remover rascunho offline"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAB Button */}
      <Button
        onClick={() => {
          resetForm();
          setTimeout(() => setDialogOpen(true), 30);
        }}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* New Record Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Nova Inserção de Controle
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 relative">
                <Label htmlFor="carro" className="font-semibold text-sm">
                  Carro: <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="carro"
                    type="text"
                    placeholder={veiculosLoading ? "Carregando..." : "Digite para buscar..."}
                    value={carroSearch}
                    disabled={veiculosLoading}
                    onChange={(e) => {
                      setCarroSearch(e.target.value);
                      setSelectedCarro("");
                      setCarroDropdownOpen(true);
                    }}
                    onFocus={() => setCarroDropdownOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setCarroDropdownOpen(false), 200);
                    }}
                    className="bg-background font-medium"
                    autoComplete="off"
                  />
                  {carroDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-md border border-input bg-popover text-popover-foreground shadow-md outline-none">
                      {availableVeiculos
                        .filter((v) => String(v).includes(carroSearch))
                        .map((v) => (
                          <button
                            key={v}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => {
                              setSelectedCarro(String(v));
                              setCarroSearch(String(v));
                              setCarroDropdownOpen(false);
                            }}
                          >
                            {v}
                          </button>
                        ))}
                      {availableVeiculos.filter((v) => String(v).includes(carroSearch)).length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum carro encontrado</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="km" className="font-semibold text-sm">
                  KM: <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="km"
                  type="text"
                  value={km}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9.,]*$/.test(val)) {
                      setKm(val);
                    }
                  }}
                  placeholder="000000.0"
                  maxLength={9}
                  className="bg-background font-medium"
                  autoComplete="off"
                />
              </div>

              {!isVCGOrVCM && (
                <div className="space-y-2">
                  <Label htmlFor="garagem" className="font-semibold text-sm">
                    Garagem: <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedGaragem} onValueChange={setSelectedGaragem}>
                    <SelectTrigger id="garagem" className="bg-background">
                      <SelectValue placeholder="Selecionar garagem" />
                    </SelectTrigger>
                    <SelectContent>
                      {GARAGEM_FILTER_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3 pt-2">
              {renderPhotoSlot(1, "Frontal", true, foto1, setFoto1)}
              {renderPhotoSlot(2, "Frente e Lateral Direita", true, foto2, setFoto2)}
              {renderPhotoSlot(3, "Traseira e Lateral Direita", true, foto3, setFoto3)}
            </div>

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
                Limpar Campos
              </Button>
              <Button type="submit" disabled={loading} className="px-6 font-semibold">
                {loading ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal */}
      {activePhotoView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setActivePhotoView(null)}
              className="absolute -top-12 right-0 h-10 w-10 bg-background/20 text-white hover:bg-background/40 hover:text-white border-white/20 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
            <img
              src={activePhotoView}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-white/10"
              alt="Ampliada"
            />
          </div>
        </div>
      )}
    </div>
  );
}
