import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Eye,
  X,
  Plus,
  RefreshCw,
  User,
  Clock,
  Gauge,
  Filter,
  WifiOff,
  CloudUpload,
} from "lucide-react";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/utils";
import {
  savePending,
  getPending,
  syncPending,
  type PendingRecord,
} from "@/lib/offline-db";

interface Abastecimento {
  id: number;
  litersT1: string;
  fotoT1: string;
  litersT2: string;
  fotoT2: string;
  litersT3?: string;
  fotoT3?: string;
  createdAt: string;
  user: { name: string; email?: string };
}

export function AbastecimentoPage() {
  const { user, token } = useAuth();
  const [records, setRecords] = useState<Abastecimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  // Form state
  const [litersT1, setLitersT1] = useState("");
  const [litersT2, setLitersT2] = useState("");
  const [litersT3, setLitersT3] = useState("");
  const [fotoT1, setFotoT1] = useState<string | null>(null);
  const [fotoT2, setFotoT2] = useState<string | null>(null);
  const [fotoT3, setFotoT3] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Camera states
  const [activeCameraSlot, setActiveCameraSlot] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Lightbox state
  const [activePhotoView, setActivePhotoView] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Filter state
  const today = new Date().toISOString().split("T")[0];
  const [filterDate, setFilterDate] = useState(today);
  const [filterGaragem, setFilterGaragem] = useState<string>("");

  const load = async () => {
    setListLoading(true);
    try {
      const r = await api.listAbastecimentos({
        date: filterDate,
        ...(filterGaragem ? { garagem: filterGaragem } : {}),
      });
      setRecords(r as Abastecimento[]);
    } catch (err: any) {
      if (navigator.onLine) {
        toast.error("Erro ao carregar registros: " + err.message);
      }
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    load();
    updatePendingCount();

    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isMobileSize = window.innerWidth < 768;
      setIsMobile(isMobileUA || isMobileSize);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const updatePendingCount = async () => {
    const pending = await getPending();
    setPendingCount(pending.length);
  };

  const handleSync = useCallback(async () => {
    if (syncing || !token) return;
    setSyncing(true);
    try {
      const result = await syncPending(async (record) => {
        await api.createAbastecimento(record.data);
      });
      if (result.synced > 0) {
        toast.success(`${result.synced} registro(s) sincronizado(s) com sucesso!`);
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "SYNC_COMPLETE" });
        }
        load();
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

  useEffect(() => {
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

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleSync]);

  // Camera Stream Lifecycle
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

        if (slot === 1) setFotoT1(base64);
        if (slot === 2) setFotoT2(base64);
        if (slot === 3) setFotoT3(base64);
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
        if (slot === 1) setFotoT1(compressedBase64);
        if (slot === 2) setFotoT2(compressedBase64);
        if (slot === 3) setFotoT3(compressedBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setLitersT1("");
    setLitersT2("");
    setLitersT3("");
    setFotoT1(null);
    setFotoT2(null);
    setFotoT3(null);
    setActiveCameraSlot(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!litersT1 || Number(litersT1) <= 0) {
      toast.error("Insira a quantidade de litros do Tanque 1.");
      return;
    }
    if (!fotoT1) {
      toast.error("A foto do Tanque 1 é obrigatória.");
      return;
    }
    if (!litersT2 || Number(litersT2) <= 0) {
      toast.error("Insira a quantidade de litros do Tanque 2.");
      return;
    }
    if (!fotoT2) {
      toast.error("A foto do Tanque 2 é obrigatória.");
      return;
    }

    const isVCM = user?.garagem === "VCM";
    if (isVCM) {
      if (!litersT3 || Number(litersT3) <= 0) {
        toast.error("Insira a quantidade de litros do Tanque 3.");
        return;
      }
      if (!fotoT3) {
        toast.error("A foto do Tanque 3 é obrigatória.");
        return;
      }
    }

    setLoading(true);
    try {
      const data: any = {
        litersT1: Number(litersT1),
        fotoT1,
        litersT2: Number(litersT2),
        fotoT2,
      };
      if (isVCM) {
        data.litersT3 = Number(litersT3);
        data.fotoT3 = fotoT3;
      }

      if (!navigator.onLine) {
        const record: PendingRecord = {
          id: crypto.randomUUID(),
          type: "abastecimento",
          data,
          token: token || "",
          createdAt: new Date().toISOString(),
        };
        await savePending(record);
        toast.success("Salvo offline! Será sincronizado quando a conexão voltar.");
        resetForm();
        setDialogOpen(false);
        updatePendingCount();
      } else {
        await api.createAbastecimento(data);
        toast.success("Abastecimento registrado com sucesso!");
        resetForm();
        setDialogOpen(false);
        load();
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar abastecimento");
    } finally {
      setLoading(false);
    }
  };

  const renderPhotoCaptureSlot = (
    slotNumber: number,
    label: string,
    photoState: string | null,
    setPhotoState: (val: string | null) => void
  ) => {
    const isCameraActive = activeCameraSlot === slotNumber;

    return (
      <div className="flex flex-col space-y-2 border border-border bg-card rounded-xl p-4 shadow-sm relative overflow-hidden transition-all hover:border-muted-foreground/30">
        <div className="flex items-center justify-between">
          <Label className="font-semibold text-sm">
            {label} <span className="text-destructive">*</span>
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
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="rounded-full bg-primary/5 p-3">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Tire uma foto</span>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {!isMobile ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveCameraSlot(slotNumber)}
                    className="gap-1.5"
                  >
                    <Camera className="h-4 w-4" />
                    Abrir Câmera
                  </Button>
                ) : (
                  <label className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-1.5 cursor-pointer shadow-sm">
                    <Camera className="h-4 w-4 text-muted-foreground" />
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight pb-3">Leitura de Tanques</h1>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">Registre a leitura diária dos litros e foto de cada tanque</p>
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
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Data</Label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            {user?.role === "ADMIN" && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Garagem</Label>
                <Select value={filterGaragem || "all"} onValueChange={(v) => setFilterGaragem(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="VCG">VCG</SelectItem>
                    <SelectItem value="VCM">VCM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={load} disabled={listLoading} className="gap-1.5">
              <RefreshCw className={`h-4 w-4 ${listLoading ? "animate-spin" : ""}`} />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records list */}
      <Card className="border-border/80 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 bg-muted/10">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Registros
            <span className="text-sm font-normal text-muted-foreground">
              ({records.length} {records.length === 1 ? "registro" : "registros"})
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={load}
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
              Carregando leituras...
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
                    <th className="p-4 font-semibold">Litros T1</th>
                    <th className="p-4 font-semibold">Foto T1</th>
                    <th className="p-4 font-semibold">Litros T2</th>
                    <th className="p-4 font-semibold">Foto T2</th>
                    {(user?.role === "ADMIN" || user?.garagem === "VCM") && (
                      <>
                        <th className="p-4 font-semibold">Litros T3</th>
                        <th className="p-4 font-semibold">Foto T3</th>
                      </>
                    )}
                    <th className="p-4 font-semibold">Data e Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-mono font-semibold text-foreground">
                        {Number(r.litersT1).toFixed(2)}L
                      </td>
                      <td className="p-4">
                        <div
                          className="relative h-10 w-10 border rounded bg-muted/40 cursor-pointer overflow-hidden group"
                          onClick={() => setActivePhotoView(r.fotoT1)}
                        >
                          <img src={r.fotoT1} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                            <Eye className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-semibold text-foreground">
                        {Number(r.litersT2).toFixed(2)}L
                      </td>
                      <td className="p-4">
                        <div
                          className="relative h-10 w-10 border rounded bg-muted/40 cursor-pointer overflow-hidden group"
                          onClick={() => setActivePhotoView(r.fotoT2)}
                        >
                          <img src={r.fotoT2} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                            <Eye className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      </td>
                      {(user?.role === "ADMIN" || user?.garagem === "VCM") && (
                        <>
                          <td className="p-4 font-mono font-semibold">
                            {r.litersT3 ? `${Number(r.litersT3).toFixed(2)}L` : "-"}
                          </td>
                          <td className="p-4">
                            {r.fotoT3 ? (
                              <div
                                className="relative h-10 w-10 border rounded border-rose-200/50 bg-rose-50/10 cursor-pointer overflow-hidden group"
                                onClick={() => setActivePhotoView(r.fotoT3!)}
                              >
                                <img src={r.fotoT3} className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                  <Eye className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString("pt-BR")} {new Date(r.createdAt).toLocaleTimeString("pt-BR")}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3" />
                            {r.user.name}
                          </span>
                        </div>
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
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* New Reading Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <Gauge className="h-5 w-5 text-primary" />
              Nova Leitura
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={cn(
              "grid gap-6",
              user?.garagem === "VCM" ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
            )}>
              <div className="border border-border/60 rounded-xl p-4 bg-muted/10 space-y-4">
                <h3 className="font-bold text-sm text-foreground uppercase tracking-wider text-center border-b pb-2 border-border/45">
                  Tanque 1
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="litersT1">Litros</Label>
                  <Input
                    id="litersT1"
                    type="number"
                    step="0.01"
                    value={litersT1}
                    onChange={(e) => setLitersT1(e.target.value)}
                    placeholder="0.00"
                    className="bg-background font-medium"
                  />
                </div>
                {renderPhotoCaptureSlot(1, "Tanque 1", fotoT1, setFotoT1)}
              </div>

              <div className="border border-border/60 rounded-xl p-4 bg-muted/10 space-y-4">
                <h3 className="font-bold text-sm text-foreground uppercase tracking-wider text-center border-b pb-2 border-border/45">
                  Tanque 2
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="litersT2">Litros</Label>
                  <Input
                    id="litersT2"
                    type="number"
                    step="0.01"
                    value={litersT2}
                    onChange={(e) => setLitersT2(e.target.value)}
                    placeholder="0.00"
                    className="bg-background font-medium"
                  />
                </div>
                {renderPhotoCaptureSlot(2, "Tanque 2", fotoT2, setFotoT2)}
              </div>

              {user?.garagem === "VCM" && (
                <div className="border border-border/60 rounded-xl p-4 bg-muted/10 space-y-4">
                  <h3 className="font-bold text-sm text-foreground uppercase tracking-wider text-center border-b pb-2 border-border/45">
                    Tanque 3
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="litersT3">Litros</Label>
                    <Input
                      id="litersT3"
                      type="number"
                      step="0.01"
                      value={litersT3}
                      onChange={(e) => setLitersT3(e.target.value)}
                      placeholder="0.00"
                      className="bg-background font-medium"
                    />
                  </div>
                  {renderPhotoCaptureSlot(3, "Tanque 3", fotoT3, setFotoT3)}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full font-semibold shadow-sm" disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              {loading ? "Registrando..." : "Registrar Abastecimento"}
            </Button>
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
