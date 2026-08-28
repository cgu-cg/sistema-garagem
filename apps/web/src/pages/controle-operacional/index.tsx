import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";
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
  WifiOff,
  CloudUpload,
  Gauge,
} from "lucide-react";
import {
  savePending,
  getPending,
  removePending,
  syncPending,
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

const INVENTORY_CARS = [
  "1000", "1108", "1109", "1110", "1111", "1112", "1113", "1114", "1115", "1116", "1117", "1118", "1119", "1120", "1121", "1122", "1123", "1124", "1125", "1126", "1127", "1200", "1201", "1202", "1204", "1205", "1206", "1207", "1208", "1209", "1210", "1211", "1212", "1213", "1214", "1215", "1216", "1217", "1218", "1219", "1220", "1221", "1222", "1223", "1224", "1225", "1226", "1227", "1228", "1229", "1230", "1231", "1232", "1233", "1234", "1260", "1261", "1262", "1263", "1264", "1265", "1266", "1267", "1268", "1269", "1270", "1271", "1272", "1273", "1274", "1275", "1276", "1277", "1278", "1279", "1301", "1302", "1303", "1304", "1305", "1306", "1307", "1308", "1309", "1310", "1311", "1312", "1313", "1314", "1315", "1316", "1317", "1318", "1319", "1320", "1321", "1322", "1323", "1324", "1325", "1326", "1327", "1328", "1329", "1330", "1331", "1332", "1333", "1334", "1335", "1336", "1337", "1338", "1339", "1340", "1341", "1342", "1343", "1344", "1345", "1346", "1347", "1348", "1349", "1350", "1351", "1352", "1353", "1354", "1355", "1356", "1357", "1358", "1359", "1360", "1361", "1362", "1363", "1364", "1365", "1366", "1367", "1368", "1369", "1370", "1371", "1372", "1373", "1374", "1375", "1376", "1377", "1378", "1379", "1380", "1381", "1382", "1383", "1384", "1385", "1386", "1387", "1388", "1389", "1390", "1391", "1392", "1393", "2025", "2301", "2319", "2320", "2321", "2323", "2324", "2325", "2326", "2327", "2328", "2329", "2330", "2331", "2350", "2351", "2352", "2353", "2354", "2355", "2409", "2410", "2411", "2412", "2413", "2420", "2421", "2422", "2423", "2424", "2425", "2426", "2514", "2515", "2516", "2600", "2601", "2611", "2613", "2615", "2623", "2625", "2627", "2629", "2631", "2633", "2635", "2637", "2639", "2700", "2701", "2702", "2703", "2704", "2705", "2706", "2707", "2708", "2709", "2710", "2711", "2712", "2713", "2714", "2715", "2716", "2717", "2718", "2719", "2720", "2800", "2801", "2802", "3003", "3004", "3005", "3006", "3008", "3011", "3012", "3013", "3014", "3016", "3021", "3022", "3026", "3027", "3028", "3034", "3035", "3047", "3057", "3062", "3064", "3065", "3070", "3071", "3078", "3083", "3096", "3098", "3099", "3100", "3103", "3105", "3106", "3107", "3108", "3109", "3115", "3132", "3133", "3134", "3135", "3136", "3137", "3138", "3139", "3140", "3141", "3146", "3147", "3148", "3149", "3200", "3201", "3202", "3203", "3204", "3205", "3206", "3207", "3208", "3209", "3210", "3211", "3212", "3213", "3214", "3215", "3216", "3217", "3218", "3219", "3220", "3222", "3224", "3226", "3228", "3230", "3250", "3251", "3252", "3253", "3254", "3255", "3257", "3259", "3261", "3263", "3265", "3267", "3269", "3271", "3273", "3275", "3277", "3279", "3281", "3283", "3850", "3851", "3852", "3853", "3854", "3855", "3900", "3901", "3902", "3903", "3904", "3950", "3951", "3952", "3953", "3954", "3955", "3956", "3957", "3958", "3959", "4015", "4016", "4017", "4018", "4178", "4180", "4181", "4182", "4183", "4184", "4185", "4186", "4187", "4188", "4189", "4190", "4191", "4192", "4193", "4194", "4195", "4196", "4197", "4198", "4199", "4200", "4201", "4202", "4203", "4204", "4205", "4206", "4207", "4208", "4209", "4210", "4211", "4212", "4213", "4214", "4215", "4216", "4217", "4218", "4219", "4220", "4221", "4222", "4223", "4224", "4225", "4226", "4227", "4228", "4229", "4230", "4231", "4232", "4233", "4234", "4235", "4236", "4237", "4238", "4239", "4240", "4241", "4242", "4243", "4244", "4245", "4246", "4247", "4248", "4249", "4250", "4251", "4252", "4253", "4254", "4255", "4256", "4257", "4258", "4259", "4260", "4261", "4262", "4263", "4264", "4265", "4266", "4267", "4268", "4269", "4270", "4271", "4272", "4273", "4274", "4275", "4276", "4277", "4278", "4279"
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
  const [records, setRecords] = useState<OperationalControlRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  // Form states
  const [selectedCarro, setSelectedCarro] = useState("");
  const [carroSearch, setCarroSearch] = useState("");
  const [km, setKm] = useState("");
  const [selectedGaragem, setSelectedGaragem] = useState("");
  const [foto1, setFoto1] = useState<string | null>(null);
  const [foto2, setFoto2] = useState<string | null>(null);
  const [foto3, setFoto3] = useState<string | null>(null);

  // Lightbox state
  const [activePhotoView, setActivePhotoView] = useState<string | null>(null);

  // Grid search & filter states
  const [searchCarQuery, setSearchCarQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "none">("all");
  const [filterGaragem, setFilterGaragem] = useState<string>("");

  // Visualizer / Detail states
  const [viewRecord, setViewRecord] = useState<OperationalControlRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OperationalControlRecord | null>(null);

  const isVCGOrVCM = user?.garagem === "VCG" || user?.garagem === "VCM";

  const loadRecords = async (overrideGaragem?: string) => {
    setListLoading(true);
    const targetGaragem = overrideGaragem !== undefined ? overrideGaragem : filterGaragem;
    try {
      const data = await api.listControleOperacional({
        ...(targetGaragem ? { garagem: targetGaragem } : {}),
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

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleSync]);

  // Auto-sincronização em segundo plano a cada 30 segundos
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      if (navigator.onLine && !syncing) {
        getPending().then((pending) => {
          if (pending.length > 0) {
            handleSync();
          }
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [token, syncing, handleSync]);

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
    setEditingRecord(null);
  };

  const handleEditClick = (record: OperationalControlRecord) => {
    setEditingRecord(record);
    setSelectedCarro(record.carro);
    setCarroSearch(record.carro);
    setKm(record.linha);
    setSelectedGaragem(record.garagem);
    setFoto1(record.foto1);
    setFoto2(record.foto2);
    setFoto3(record.foto3);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalCarro = selectedCarro;
    if (!finalCarro && carroSearch) {
      finalCarro = carroSearch.trim();
    }

    if (!finalCarro) {
      toast.error("Selecione um carro válido da lista.");
      return;
    }

    // Verificar se o carro faz parte da lista do inventário
    const isCarInInventory = INVENTORY_CARS.includes(finalCarro.trim());
    if (!isCarInInventory) {
      toast.error(`O carro ${finalCarro.trim()} não faz parte da lista do inventário.`);
      return;
    }

    // Obter todos os carros já vistoriados para validar duplicidade
    const registeredCars = new Set(records.map((r) => String(r.carro).trim()));
    const isCarRegistered = registeredCars.has(finalCarro.trim());
    const isEditingThisCar = editingRecord && String(editingRecord.carro).trim() === finalCarro.trim();

    if (isCarRegistered && !isEditingThisCar) {
      toast.error(`Carro ${finalCarro.trim()} já possui cadastro!`);
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
      if (editingRecord) {
        if (editingRecord.pendingId) {
          const record: PendingRecord = {
            id: editingRecord.pendingId,
            type: "controle-operacional",
            data,
            token: token || "",
            createdAt: editingRecord.dataInsercao,
          };
          await savePending(record);
          toast.success("Rascunho offline atualizado com sucesso!");
          resetForm();
          setDialogOpen(false);
          updatePendingCount();
          loadRecords();
        } else {
          if (!navigator.onLine) {
            toast.error("Não é possível editar registros já sincronizados enquanto estiver offline.");
            setLoading(false);
            return;
          }
          await api.updateControleOperacional(editingRecord.id, data);
          toast.success("Registro atualizado com sucesso!");
          resetForm();
          setDialogOpen(false);
          loadRecords();
        }
      } else {
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
      }
    } catch (err: any) {
      const isNetworkOrTimeout =
        err.message === "TIMEOUT_ERROR" ||
        err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError") ||
        err.message.toLowerCase().includes("network");

      if (isNetworkOrTimeout && !editingRecord) {
        try {
          const record: PendingRecord = {
            id: crypto.randomUUID(),
            type: "controle-operacional",
            data,
            token: token || "",
            createdAt: new Date().toISOString(),
          };
          await savePending(record);
          toast.warning("Conexão instável! O cadastro foi salvo offline para sua segurança.");
          resetForm();
          setDialogOpen(false);
          updatePendingCount();
          loadRecords();
        } catch (dbErr: any) {
          toast.error("Conexão interrompida e falha ao salvar offline: " + dbErr.message);
        }
      } else {
        toast.error(err.message || "Erro ao salvar controle operacional.");
      }
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
          {photoState ? (
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
                  className="h-8 w-8 rounded-full animate-in fade-in duration-100"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 w-full">
              <div className="rounded-full bg-primary/5 p-3">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex flex-col items-center gap-1.5 w-full">
                <label className="inline-flex items-center justify-center rounded-md text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 cursor-pointer w-full text-center">
                  Tirar Foto
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFileChange(e, slotNumber)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Mapeamento de status para cada carro do inventário
  const recordMap = new Map<string, OperationalControlRecord>();
  for (const record of records) {
    const carKey = String(record.carro).trim();
    if (!recordMap.has(carKey) || (!record.pendingId && recordMap.get(carKey)?.pendingId)) {
      recordMap.set(carKey, record);
    }
  }

  // Contagens para estatísticas
  const totalCars = INVENTORY_CARS.length;

  const completedCount = INVENTORY_CARS.filter(car => {
    const rec = recordMap.get(car);
    return rec && !rec.pendingId;
  }).length;

  const pendingOfflineCount = INVENTORY_CARS.filter(car => {
    const rec = recordMap.get(car);
    return rec && rec.pendingId;
  }).length;

  const noneCount = totalCars - completedCount - pendingOfflineCount;

  const percentageCompleted = Math.round(((completedCount + pendingOfflineCount) / totalCars) * 100) || 0;

  const getCarStatusInfo = (car: string) => {
    const rec = recordMap.get(car);
    if (!rec) return { type: "none", colorClass: "border-border bg-card hover:border-muted-foreground/30", label: "Não Vistoriado" };
    if (rec.pendingId) return { type: "pending", colorClass: "border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400", label: "Pendente Sincronização" };
    return { type: "completed", colorClass: "border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", label: "Vistoriado" };
  };

  const handleCardClick = (car: string) => {
    const rec = recordMap.get(car);
    if (!rec) {
      resetForm();
      setSelectedCarro(car);
      setCarroSearch(car);
      setDialogOpen(true);
    } else if (rec.pendingId) {
      handleEditClick(rec);
    } else {
      setViewRecord(rec);
      setViewDialogOpen(true);
    }
  };

  // Reusable Lightbox Renderer that guarantees pointer events inside Radix Dialog bounds
  const renderLightbox = () => {
    if (!activePhotoView) return null;
    return (
      <div
        onClick={() => setActivePhotoView(null)}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-zoom-out pointer-events-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center justify-center pointer-events-auto"
        >
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
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight pb-3">Controle Operacional</h1>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">
          Acompanhe e registre a vistoria do inventário de veículos da garagem.
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

      {/* Header com Progresso */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-card p-4 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Progresso Geral</Label>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black">{completedCount + pendingOfflineCount}</span>
            <span className="text-muted-foreground text-sm">/ {totalCars} vistoriados</span>
            <span className="ml-auto text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{percentageCompleted}%</span>
          </div>
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden mt-2">
            <div className="bg-primary h-full transition-all duration-500" style={{ width: `${percentageCompleted}%` }}></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center sm:col-span-1 lg:col-span-2 justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block border border-emerald-600/30"></span>
              <span className="text-xs font-semibold text-muted-foreground">{completedCount} Concluídos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-500 inline-block border border-amber-600/30"></span>
              <span className="text-xs font-semibold text-muted-foreground">{pendingOfflineCount} Pendentes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-border inline-block border border-muted/50"></span>
              <span className="text-xs font-semibold text-muted-foreground">{noneCount} Sem Vistoria</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === "ADMIN" && (
              <Select
                value={filterGaragem || "all"}
                onValueChange={(v) => {
                  const nextVal = v === "all" ? "" : v;
                  setFilterGaragem(nextVal);
                  loadRecords(nextVal);
                }}
              >
                <SelectTrigger className="w-36 h-8 text-xs bg-background">
                  <SelectValue placeholder="Todas Garagens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Garagens</SelectItem>
                  {GARAGEM_FILTER_OPTIONS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={() => loadRecords()} disabled={listLoading} size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
              <RefreshCw className={`h-3 w-3 ${listLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Controles de Busca e Filtro de Status */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Input
            placeholder="Buscar número do carro..."
            value={searchCarQuery}
            onChange={(e) => setSearchCarQuery(e.target.value)}
            className="w-full bg-background pr-8"
          />
          {searchCarQuery && (
            <button
              onClick={() => setSearchCarQuery("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground/60 hover:text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 p-1 rounded-lg border w-full sm:w-auto">
          {(["all", "completed", "pending", "none"] as const).map((status) => {
            const labels: Record<typeof status, string> = {
              all: "Todos",
              completed: "Vistoriados",
              pending: "Pendentes",
              none: "Sem Vistoria"
            };
            return (
              <Button
                key={status}
                size="sm"
                variant={statusFilter === status ? "secondary" : "ghost"}
                onClick={() => setStatusFilter(status)}
                className={`h-7 px-2.5 text-xs font-semibold transition-all ${statusFilter === status ? "bg-background shadow-sm border border-border/50 text-foreground" : "text-muted-foreground"}`}
              >
                {labels[status]}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Grid de Cartões de Carros */}
      {listLoading ? (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 bg-card rounded-xl border shadow-sm">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium">Carregando inventário de carros...</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {INVENTORY_CARS
            .filter(car => {
              if (searchCarQuery && !car.includes(searchCarQuery.trim())) return false;
              const rec = recordMap.get(car);
              if (statusFilter === "completed" && (!rec || rec.pendingId)) return false;
              if (statusFilter === "pending" && (!rec || !rec.pendingId)) return false;
              if (statusFilter === "none" && rec) return false;
              return true;
            })
            .map(car => {
              const statusInfo = getCarStatusInfo(car);
              return (
                <button
                  key={car}
                  onClick={() => handleCardClick(car)}
                  className={`flex flex-col items-center justify-center p-3 border rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 text-center relative overflow-hidden h-20 ${statusInfo.colorClass}`}
                >
                  <Bus className="h-4 w-4 mb-1 opacity-70" />
                  <span className="font-bold text-sm tracking-tight">{car}</span>
                  <span className="text-[9px] font-semibold opacity-75 mt-0.5 leading-none block">
                    {statusInfo.type === "completed" && "Concluído"}
                    {statusInfo.type === "pending" && "Pendente"}
                    {statusInfo.type === "none" && "Sem Vistoria"}
                  </span>
                </button>
              );
            })}
        </div>
      )}

      {/* New Record Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (activePhotoView) return;
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {editingRecord ? "Editar Inserção de Controle" : "Nova Inserção de Controle"}
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
                    value={carroSearch}
                    disabled={true}
                    className="bg-muted font-bold text-base border-muted-foreground/20 text-muted-foreground"
                    autoComplete="off"
                  />
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
              {editingRecord && editingRecord.pendingId && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Deseja realmente excluir este rascunho offline?")) {
                      handleDeletePending(editingRecord.pendingId!);
                      setDialogOpen(false);
                    }
                  }}
                  className="mr-auto gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Rascunho
                </Button>
              )}
              <Button type="submit" disabled={loading} className="px-6 font-semibold">
                {editingRecord
                  ? (loading ? "Salvando..." : "Salvar Alterações")
                  : (loading ? "Cadastrando..." : "Cadastrar")}
              </Button>
            </div>
          </form>
          {renderLightbox()}
        </DialogContent>
      </Dialog>

      {/* Visualizador de Registro Concluído */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => {
        if (activePhotoView) return;
        setViewDialogOpen(open);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              Carro {viewRecord?.carro} — Vistoria Concluída
            </DialogTitle>
          </DialogHeader>

          {viewRecord && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3 bg-muted/20 p-4 rounded-xl border border-border/80">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">Linha/KM</Label>
                  <p className="text-lg font-bold flex items-center gap-1.5 mt-0.5">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    {viewRecord.linha}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">Garagem</Label>
                  <p className="text-lg font-bold flex items-center gap-1.5 mt-0.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {viewRecord.garagem.replace(/Garagem:?\s*/gi, "")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">Data e Hora</Label>
                  <p className="text-sm font-medium flex items-center gap-1.5 mt-1 font-mono">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(viewRecord.dataInsercao).toLocaleDateString("pt-BR")} {new Date(viewRecord.dataInsercao).toLocaleTimeString("pt-BR")}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase font-semibold block mb-2">Registrado Por</Label>
                <div className="flex items-center gap-2.5 bg-card p-3 rounded-lg border border-border/50">
                  <div className="rounded-full bg-primary/10 p-2">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-none">{viewRecord.user?.name || "Usuário"}</p>
                    <span className="text-xs text-muted-foreground">{viewRecord.user?.email || "E-mail"}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase font-semibold block mb-3">Fotos Anexadas</Label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-xs text-muted-foreground font-medium">1. Frontal</span>
                    <div
                      className="relative h-40 border rounded-lg bg-muted/40 overflow-hidden cursor-pointer group"
                      onClick={() => setActivePhotoView(viewRecord.foto1)}
                    >
                      <img src={viewRecord.foto1} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {viewRecord.foto2 && (
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-xs text-muted-foreground font-medium">2. Frente e Lat. Direita</span>
                      <div
                        className="relative h-40 border rounded-lg bg-muted/40 overflow-hidden cursor-pointer group"
                        onClick={() => setActivePhotoView(viewRecord.foto2!)}
                      >
                        <img src={viewRecord.foto2} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {viewRecord.foto3 && (
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-xs text-muted-foreground font-medium">3. Traseira e Lat. Direita</span>
                      <div
                        className="relative h-40 border rounded-lg bg-muted/40 overflow-hidden cursor-pointer group"
                        onClick={() => setActivePhotoView(viewRecord.foto3!)}
                      >
                        <img src={viewRecord.foto3} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botão de Excluir para Admin */}
              {user?.role === "ADMIN" && (
                <div className="flex items-center justify-end border-t pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Deseja realmente excluir este registro de vistoria permanentemente?")) {
                        api.deleteControleOperacional(viewRecord.id)
                          .then(() => {
                            toast.success("Registro removido com sucesso!");
                            setViewDialogOpen(false);
                            loadRecords();
                          })
                          .catch((err) => toast.error(err.message || "Erro ao excluir."));
                      }
                    }}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir Vistoria
                  </Button>
                </div>
              )}
            </div>
          )}
          {renderLightbox()}
        </DialogContent>
      </Dialog>

      {renderLightbox()}
    </div>
  );
}
