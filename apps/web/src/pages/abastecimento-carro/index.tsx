import { useEffect, useState, useRef, useMemo } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Camera,
  Trash2,
  Eye,
  X,
  Fuel,
  Plus,
  RefreshCw,
  Clock,
  Play,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Bus,
  Gauge,
  User,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface RefuelingItem {
  id: number;
  carro: string;
  liters: string;
  bomba: string;
  foto: string;
  matricula: string;
  garagem: string | null;
  dataHora: string;
}

interface RefuelingSession {
  id: number;
  matricula: string;
  dthIniAbastec: string;
  dthFimAbastec: string | null;
  status: string;
  garagem: string | null;
  b1Ini: string | null;
  b2Ini: string | null;
  b3Ini: string | null;
  b4Ini: string | null;
  b5Ini: string | null;
  b6Ini: string | null;
  b1Fim: string | null;
  b2Fim: string | null;
  b3Fim: string | null;
  b4Fim: string | null;
  b5Fim: string | null;
  b6Fim: string | null;
  user: { name: string; email?: string };
  items?: RefuelingItem[];
  _count?: { items: number };
}

// 464 veículos fixos da frota (o mesmo inventário do Controle Operacional)
const INVENTORY_CARS = [
  "1000", "1108", "1109", "1110", "1111", "1112", "1113", "1114", "1115", "1116", "1117", "1118", "1119", "1120", "1121", "1122", "1123", "1124", "1125", "1126", "1127", "1200", "1201", "1202", "1204", "1205", "1206", "1207", "1208", "1209", "1210", "1211", "1212", "1213", "1214", "1215", "1216", "1217", "1218", "1219", "1220", "1221", "1222", "1223", "1224", "1225", "1226", "1227", "1228", "1229", "1230", "1231", "1232", "1233", "1234", "1260", "1261", "1262", "1263", "1264", "1265", "1266", "1267", "1268", "1269", "1270", "1271", "1272", "1273", "1274", "1275", "1276", "1277", "1278", "1279", "1301", "1302", "1303", "1304", "1305", "1306", "1307", "1308", "1309", "1310", "1311", "1312", "1313", "1314", "1315", "1316", "1317", "1318", "1319", "1320", "1321", "1322", "1323", "1324", "1325", "1326", "1327", "1328", "1329", "1330", "1331", "1332", "1333", "1334", "1335", "1336", "1337", "1338", "1339", "1340", "1341", "1342", "1343", "1344", "1345", "1346", "1347", "1348", "1349", "1350", "1351", "1352", "1353", "1354", "1355", "1356", "1357", "1358", "1359", "1360", "1361", "1362", "1363", "1364", "1365", "1366", "1367", "1368", "1369", "1370", "1371", "1372", "1373", "1374", "1375", "1376", "1377", "1378", "1379", "1380", "1381", "1382", "1383", "1384", "1385", "1386", "1387", "1388", "1389", "1390", "1391", "1392", "1393", "2025", "2301", "2319", "2320", "2321", "2323", "2324", "2325", "2326", "2327", "2328", "2329", "2330", "2331", "2350", "2351", "2352", "2353", "2354", "2355", "2409", "2410", "2411", "2412", "2413", "2420", "2421", "2422", "2423", "2424", "2425", "2426", "2514", "2515", "2516", "2600", "2601", "2611", "2613", "2615", "2623", "2625", "2627", "2629", "2631", "2633", "2635", "2637", "2639", "2700", "2701", "2702", "2703", "2704", "2705", "2706", "2707", "2708", "2709", "2710", "2711", "2712", "2713", "2714", "2715", "2716", "2717", "2718", "2719", "2720", "2800", "2801", "2802", "3003", "3004", "3005", "3006", "3008", "3011", "3012", "3013", "3014", "3016", "3021", "3022", "3026", "3027", "3028", "3034", "3035", "3047", "3057", "3062", "3064", "3065", "3070", "3071", "3078", "3083", "3096", "3098", "3099", "3100", "3103", "3105", "3106", "3107", "3108", "3109", "3115", "3132", "3133", "3134", "3135", "3136", "3137", "3138", "3139", "3140", "3141", "3146", "3147", "3148", "3149", "3200", "3201", "3202", "3203", "3204", "3205", "3206", "3207", "3208", "3209", "3210", "3211", "3212", "3213", "3214", "3215", "3216", "3217", "3218", "3219", "3220", "3222", "3224", "3226", "3228", "3230", "3250", "3251", "3252", "3253", "3254", "3255", "3257", "3259", "3261", "3263", "3265", "3267", "3269", "3271", "3273", "3275", "3277", "3279", "3281", "3283", "3850", "3851", "3852", "3853", "3854", "3855", "3900", "3901", "3902", "3903", "3904", "3950", "3951", "3952", "3953", "3954", "3955", "3956", "3957", "3958", "3959", "4015", "4016", "4017", "4018", "4178", "4180", "4181", "4182", "4183", "4184", "4185", "4186", "4187", "4188", "4189", "4190", "4191", "4192", "4193", "4194", "4195", "4196", "4197", "4198", "4199", "4200", "4201", "4202", "4203", "4204", "4205", "4206", "4207", "4208", "4209", "4210", "4211", "4212", "4213", "4214", "4215", "4216", "4217", "4218", "4219", "4220", "4221", "4222", "4223", "4224", "4225", "4226", "4227", "4228", "4229", "4230", "4231", "4232", "4233", "4234", "4235", "4236", "4237", "4238", "4239", "4240", "4241", "4242", "4243", "4244", "4245", "4246", "4247", "4248", "4249", "4250", "4251", "4252", "4253", "4254", "4255", "4256", "4257", "4258", "4259", "4260", "4261", "4262", "4263", "4264", "4265", "4266", "4267", "4268", "4269", "4270", "4271", "4272", "4273", "4274", "4275", "4276", "4277", "4278", "4279"
];

export function AbastecimentoCarroPage() {
  // Sessão ativa e estados principais
  const [activeSession, setActiveSession] = useState<RefuelingSession | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [veiculos, setVeiculos] = useState<string[]>(INVENTORY_CARS);
  const [vehicleSource, setVehicleSource] = useState<"local" | "mixed" | "mock" | "unavailable" | "unknown">("local");
  const [activeTab, setActiveTab] = useState<"abastecimento" | "historico">("abastecimento");

  // Grid e Filtros
  const [searchCarQuery, setSearchCarQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");

  // Modal de Abastecimento (Boletim de Abastecimento)
  const [abastecerDialogOpen, setAbastecerDialogOpen] = useState(false);

  // Modal de Visualização de Detalhes do Carro Abastecido
  const [viewRecord, setViewRecord] = useState<RefuelingItem | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Histórico
  const [pastSessions, setPastSessions] = useState<RefuelingSession[]>([]);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [sessionDetails, setSessionDetails] = useState<RefuelingSession | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form states - Fase 1: Início
  const [matricula, setMatricula] = useState("");
  const [b1Ini, setB1Ini] = useState("");
  const [b2Ini, setB2Ini] = useState("");
  const [b3Ini, setB3Ini] = useState("");
  const [b4Ini, setB4Ini] = useState("");
  const [b5Ini, setB5Ini] = useState("");
  const [b6Ini, setB6Ini] = useState("");

  // Form states - Fase 2: Boletim de Abastecimento
  const [selectedCar, setSelectedCar] = useState("");
  const [selectedPump, setSelectedPump] = useState("");
  const [liters, setLiters] = useState("");
  const [foto, setFoto] = useState<string | null>(null);

  // Form states - Fase 3: Fim
  const [b1Fim, setB1Fim] = useState("");
  const [b2Fim, setB2Fim] = useState("");
  const [b3Fim, setB3Fim] = useState("");
  const [b4Fim, setB4Fim] = useState("");
  const [b5Fim, setB5Fim] = useState("");
  const [b6Fim, setB6Fim] = useState("");

  // Câmera & Lightbox
  const [activeCameraSlot, setActiveCameraSlot] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activePhotoView, setActivePhotoView] = useState<string | null>(null);

  const loadData = async () => {
    setListLoading(true);
    try {
      const [session, cars] = await Promise.all([
        api.getActiveAbastecimentoCarroSession(),
        api.listOperacionalVeiculos()
          .then((response) => ({ response, unavailable: false }))
          .catch(() => ({ response: null, unavailable: true })),
      ]);
      setActiveSession(session as RefuelingSession);
      
      if (Array.isArray(cars.response?.data) && cars.response.data.length > 0) {
        const serverCars = cars.response.data.map((v) => String(v.idCarro || v.prefixo || v));
        const combined = Array.from(new Set([...INVENTORY_CARS, ...serverCars]));
        setVeiculos(combined);
        setVehicleSource(cars.response.source === "real" ? "mixed" : cars.response.source);
      } else {
        setVeiculos(INVENTORY_CARS);
        setVehicleSource(cars.unavailable ? "unavailable" : "local");
      }
    } catch (err: any) {
      toast.error("Erro ao carregar dados: " + err.message);
    } finally {
      setListLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await api.listAbastecimentoCarroSessions();
      setPastSessions(data as RefuelingSession[]);
    } catch (err: any) {
      toast.error("Erro ao carregar histórico: " + err.message);
    }
  };

  useEffect(() => {
    loadData();
    loadHistory();

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

  // Gerenciamento da câmera ao vivo
  useEffect(() => {
    let streamInstance: MediaStream | null = null;

    if (activeCameraSlot) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Acesso à câmera indisponível. Certifique-se de usar conexão segura (HTTPS).");
        setActiveCameraSlot(false);
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
          toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
          setActiveCameraSlot(false);
        });
    }

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeCameraSlot]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (video) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        setFoto(base64);
      }
    }
    setActiveCameraSlot(false);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        const compressedBase64 = await resizeImage(rawBase64);
        setFoto(compressedBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fase 1: Iniciar Sessão
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matricula.trim()) {
      toast.error("Insira a matrícula do operador.");
      return;
    }

    const b1 = b1Ini ? Number(b1Ini) : null;
    const b2 = b2Ini ? Number(b2Ini) : null;
    const b3 = b3Ini ? Number(b3Ini) : null;
    const b4 = b4Ini ? Number(b4Ini) : null;
    const b5 = b5Ini ? Number(b5Ini) : null;
    const b6 = b6Ini ? Number(b6Ini) : null;

    if (b1 === null && b2 === null && b3 === null && b4 === null && b5 === null && b6 === null) {
      toast.error("Configure o valor inicial de ao menos uma bomba.");
      return;
    }

    setLoading(true);
    try {
      const session = await api.startAbastecimentoCarroSession({
        matricula,
        b1Ini: b1,
        b2Ini: b2,
        b3Ini: b3,
        b4Ini: b4,
        b5Ini: b5,
        b6Ini: b6,
      });
      toast.success("Sessão de abastecimento iniciada com sucesso!");
      setActiveSession(session as RefuelingSession);
      resetItemForm();
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || "Erro ao iniciar abastecimento");
    } finally {
      setLoading(false);
    }
  };

  const resetItemForm = () => {
    setSelectedCar("");
    setSelectedPump("");
    setLiters("");
    setFoto(null);
    setActiveCameraSlot(false);
  };

  // Fase 2: Cadastro de Veículo no Boletim de Abastecimento
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeSession) return;

    if (!selectedCar) {
      toast.error("Selecione o veículo.");
      return;
    }
    if (!selectedPump) {
      toast.error("Selecione a bomba utilizada.");
      return;
    }
    if (!liters || Number(liters) <= 0) {
      toast.error("Insira uma quantidade válida de litros.");
      return;
    }
    if (!foto) {
      toast.error("Tire a foto da leitura da bomba.");
      return;
    }

    setLoading(true);
    try {
      await api.createAbastecimentoCarroItem({
        sessionId: activeSession.id,
        carro: selectedCar,
        bomba: selectedPump,
        liters: Number(liters),
        foto,
      });

      toast.success(`Carro ${selectedCar} cadastrado com sucesso!`);
      resetItemForm();
      setAbastecerDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar abastecimento do carro");
    } finally {
      setLoading(false);
    }
  };

  // Fase 3: Preparar Finalização
  const handleStartFinalize = () => {
    if (!activeSession) return;
    setB1Fim("");
    setB2Fim("");
    setB3Fim("");
    setB4Fim("");
    setB5Fim("");
    setB6Fim("");
    setIsFinalizing(true);
  };

  // Fase 3: Fechar Sessão
  const handleFinishSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeSession) return;

    const b1 = activeSession.b1Ini !== null ? (b1Fim ? Number(b1Fim) : null) : null;
    const b2 = activeSession.b2Ini !== null ? (b2Fim ? Number(b2Fim) : null) : null;
    const b3 = activeSession.b3Ini !== null ? (b3Fim ? Number(b3Fim) : null) : null;
    const b4 = activeSession.b4Ini !== null ? (b4Fim ? Number(b4Fim) : null) : null;
    const b5 = activeSession.b5Ini !== null ? (b5Fim ? Number(b5Fim) : null) : null;
    const b6 = activeSession.b6Ini !== null ? (b6Fim ? Number(b6Fim) : null) : null;

    if (activeSession.b1Ini !== null && b1 !== null && b1 < Number(activeSession.b1Ini)) {
      toast.error(`Bomba 1 final (${b1}) não pode ser menor que a inicial (${activeSession.b1Ini}).`);
      return;
    }
    if (activeSession.b2Ini !== null && b2 !== null && b2 < Number(activeSession.b2Ini)) {
      toast.error(`Bomba 2 final (${b2}) não pode ser menor que a inicial (${activeSession.b2Ini}).`);
      return;
    }
    if (activeSession.b3Ini !== null && b3 !== null && b3 < Number(activeSession.b3Ini)) {
      toast.error(`Bomba 3 final (${b3}) não pode ser menor que a inicial (${activeSession.b3Ini}).`);
      return;
    }
    if (activeSession.b4Ini !== null && b4 !== null && b4 < Number(activeSession.b4Ini)) {
      toast.error(`Bomba 4 final (${b4}) não pode ser menor que a inicial (${activeSession.b4Ini}).`);
      return;
    }
    if (activeSession.b5Ini !== null && b5 !== null && b5 < Number(activeSession.b5Ini)) {
      toast.error(`Bomba 5 final (${b5}) não pode ser menor que a inicial (${activeSession.b5Ini}).`);
      return;
    }
    if (activeSession.b6Ini !== null && b6 !== null && b6 < Number(activeSession.b6Ini)) {
      toast.error(`Bomba 6 final (${b6}) não pode ser menor que a inicial (${activeSession.b6Ini}).`);
      return;
    }

    setLoading(true);
    try {
      await api.finishAbastecimentoCarroSession({
        sessionId: activeSession.id,
        b1Fim: b1,
        b2Fim: b2,
        b3Fim: b3,
        b4Fim: b4,
        b5Fim: b5,
        b6Fim: b6,
      });

      toast.success("Abastecimento finalizado e fechado com sucesso!");
      setActiveSession(null);
      setIsFinalizing(false);
      setMatricula("");
      setB1Ini("");
      setB2Ini("");
      setB3Ini("");
      setB4Ini("");
      setB5Ini("");
      setB6Ini("");
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || "Erro ao encerrar abastecimento");
    } finally {
      setLoading(false);
    }
  };

  const getActivePumpsList = () => {
    if (!activeSession) return [];
    const list: string[] = [];
    if (activeSession.b1Ini !== null) list.push("B.01");
    if (activeSession.b2Ini !== null) list.push("B.02");
    if (activeSession.b3Ini !== null) list.push("B.03");
    if (activeSession.b4Ini !== null) list.push("B.04");
    if (activeSession.b5Ini !== null) list.push("B.05");
    if (activeSession.b6Ini !== null) list.push("B.06");
    return list;
  };

  const loadSessionDetails = async (id: number) => {
    setDetailsLoading(true);
    try {
      const data = await api.getAbastecimentoCarroSessionDetails(id);
      setSessionDetails(data as RefuelingSession);
    } catch (err: any) {
      toast.error("Erro ao carregar detalhes: " + err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleExpandSession = (id: number) => {
    if (expandedSession === id) {
      setExpandedSession(null);
      setSessionDetails(null);
    } else {
      setExpandedSession(id);
      loadSessionDetails(id);
    }
  };

  // Mapeamento dos carros abastecidos na sessão ativa
  const abastecidoMap = useMemo(() => {
    const map = new Map<string, RefuelingItem>();
    if (activeSession?.items) {
      for (const it of activeSession.items) {
        map.set(String(it.carro).trim(), it);
      }
    }
    return map;
  }, [activeSession]);

  // Cálculos para KPIs e Progresso
  const totalCars = veiculos.length;
  const abastecidosCount = abastecidoMap.size;
  const pendentesCount = Math.max(0, totalCars - abastecidosCount);
  const percentageCompleted = totalCars > 0 ? Math.round((abastecidosCount / totalCars) * 100) : 0;
  const totalLitrosSessao = useMemo(() => {
    if (!activeSession?.items) return 0;
    return activeSession.items.reduce((acc, it) => acc + (Number(it.liters) || 0), 0);
  }, [activeSession]);
  const activePumps = getActivePumpsList();

  // Abertura do formulário a partir do clique no carro do grid
  const handleCarClick = (car: string) => {
    const item = abastecidoMap.get(car);
    if (item) {
      // Já abastecido: abrir modal de auditoria/detalhes
      setViewRecord(item);
      setViewDialogOpen(true);
    } else {
      // Pendente: abrir modal de abastecimento com carro pré-selecionado e travado
      resetItemForm();
      setSelectedCar(car);
      if (activePumps.length === 1) {
        setSelectedPump(activePumps[0]);
      }
      setAbastecerDialogOpen(true);
    }
  };

  // Render do Lightbox para Fotos Ampliadas
  const renderLightbox = () => {
    if (!activePhotoView) return null;
    return (
      <div
        onClick={() => setActivePhotoView(null)}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-zoom-out pointer-events-auto"
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
            className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            alt="Leitura da Bomba Ampliada"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {(vehicleSource === "local" || vehicleSource === "mixed" || vehicleSource === "mock" || vehicleSource === "unavailable" || vehicleSource === "unknown") && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {vehicleSource === "mock"
              ? "A lista de veículos inclui dados simulados do SQL Server legado; confirme a frota antes de utilizá-la operacionalmente."
              : vehicleSource === "unavailable"
                ? "A integração com o SQL Server legado está indisponível. A tela está usando a lista local padrão, que pode não refletir a frota atual."
                : vehicleSource === "unknown"
                  ? "A origem da lista de veículos não foi informada pelo servidor. Confirme os dados antes de utilizá-los operacionalmente."
                  : vehicleSource === "mixed"
                    ? "A lista combina o inventário local padrão com veículos retornados pelo SQL Server legado; ela pode incluir dados locais que não refletem a frota atual."
                    : "A tela está usando a lista local padrão de veículos, que pode não refletir a frota atual."}
          </p>
        </div>
      )}

      {/* Page Header padrão Bento Grid Verde Floresta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Abastecimento Frota
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Controle diário de abastecimento individual por veículo e fluxo das bombas da frota.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeSession && !isFinalizing && (
            <Button
              onClick={handleStartFinalize}
              variant="destructive"
              className="rounded-full text-xs gap-1.5 shadow-sm font-semibold px-4 h-9"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Finalizar Abastecimento
            </Button>
          )}

          <Button
            onClick={() => {
              loadData();
              loadHistory();
            }}
            disabled={listLoading}
            size="sm"
            variant="outline"
            className="gap-1.5 h-9 text-xs rounded-full"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", listLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs Navigation (Pílulas estilo Bento Grid) */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2">
        <button
          onClick={() => setActiveTab("abastecimento")}
          className={cn(
            "px-4 py-1.5 text-xs font-semibold rounded-full transition-all",
            activeTab === "abastecimento"
              ? "bg-[#164E3A] text-white dark:bg-emerald-600 shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          Abastecimento Atual
        </button>
        <button
          onClick={() => {
            setActiveTab("historico");
            loadHistory();
          }}
          className={cn(
            "px-4 py-1.5 text-xs font-semibold rounded-full transition-all",
            activeTab === "historico"
              ? "bg-[#164E3A] text-white dark:bg-emerald-600 shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          Histórico de Fechamentos
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === "abastecimento" ? (
        <div>
          {listLoading ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground gap-2 bg-card rounded-2xl border shadow-sm">
              <RefreshCw className="h-8 w-8 animate-spin text-[#164E3A] dark:text-emerald-500" />
              <span className="text-sm font-medium">Carregando dados da frota...</span>
            </div>
          ) : !activeSession ? (
            /* ================= FASE 1: INÍCIO DE SESSÃO ================= */
            <Card className="w-full border-border/80 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-[#0E1420]">
              <CardHeader className="bg-[#164E3A]/5 dark:bg-emerald-950/20 border-b p-6">
                <CardTitle className="flex items-center gap-2.5 text-xl font-extrabold text-[#164E3A] dark:text-emerald-400">
                  <Play className="h-5 w-5" />
                  Início de Turno — Abertura das Bombas
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Informe a matrícula do operador e a leitura inicial dos totalizadores mecânicos das bombas que serão utilizadas.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleStartSession} className="space-y-6">
                  <div className="space-y-2 max-w-md">
                    <Label htmlFor="matricula" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                      Matrícula do Funcionário <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="matricula"
                      placeholder="Ex: 12345"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      className="rounded-xl h-11 bg-background font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-xs uppercase font-bold tracking-wider text-[#164E3A] dark:text-emerald-400 block border-b pb-2 border-border/60">
                      Leituras Iniciais das Bombas (B.01 a B.06)
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                      <div className="space-y-1.5 p-3 rounded-2xl bg-muted/20 border">
                        <Label htmlFor="b1Ini" className="text-xs font-bold text-muted-foreground">Bomba 1 (B.01)</Label>
                        <Input
                          id="b1Ini"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={b1Ini}
                          onChange={(e) => setB1Ini(e.target.value)}
                          className="rounded-lg h-9 bg-background font-mono font-medium"
                        />
                      </div>
                      <div className="space-y-1.5 p-3 rounded-2xl bg-muted/20 border">
                        <Label htmlFor="b2Ini" className="text-xs font-bold text-muted-foreground">Bomba 2 (B.02)</Label>
                        <Input
                          id="b2Ini"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={b2Ini}
                          onChange={(e) => setB2Ini(e.target.value)}
                          className="rounded-lg h-9 bg-background font-mono font-medium"
                        />
                      </div>
                      <div className="space-y-1.5 p-3 rounded-2xl bg-muted/20 border">
                        <Label htmlFor="b3Ini" className="text-xs font-bold text-muted-foreground">Bomba 3 (B.03)</Label>
                        <Input
                          id="b3Ini"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={b3Ini}
                          onChange={(e) => setB3Ini(e.target.value)}
                          className="rounded-lg h-9 bg-background font-mono font-medium"
                        />
                      </div>
                      <div className="space-y-1.5 p-3 rounded-2xl bg-muted/20 border">
                        <Label htmlFor="b4Ini" className="text-xs font-bold text-muted-foreground">Bomba 4 (B.04)</Label>
                        <Input
                          id="b4Ini"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={b4Ini}
                          onChange={(e) => setB4Ini(e.target.value)}
                          className="rounded-lg h-9 bg-background font-mono font-medium"
                        />
                      </div>
                      <div className="space-y-1.5 p-3 rounded-2xl bg-muted/20 border">
                        <Label htmlFor="b5Ini" className="text-xs font-bold text-muted-foreground">Bomba 5 (B.05)</Label>
                        <Input
                          id="b5Ini"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={b5Ini}
                          onChange={(e) => setB5Ini(e.target.value)}
                          className="rounded-lg h-9 bg-background font-mono font-medium"
                        />
                      </div>
                      <div className="space-y-1.5 p-3 rounded-2xl bg-muted/20 border">
                        <Label htmlFor="b6Ini" className="text-xs font-bold text-muted-foreground">Bomba 6 (B.06)</Label>
                        <Input
                          id="b6Ini"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={b6Ini}
                          onChange={(e) => setB6Ini(e.target.value)}
                          className="rounded-lg h-9 bg-background font-mono font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-[#164E3A] hover:bg-[#113C2D] text-white font-bold shadow-sm"
                    disabled={loading}
                  >
                    {loading ? "Iniciando Turno..." : "Salvar e Iniciar Sessão de Abastecimento"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : isFinalizing ? (
            /* ================= FASE 3: ENCERRAMENTO DA SESSÃO ================= */
            <Card className="w-full border-border/80 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-[#0E1420]">
              <CardHeader className="bg-rose-50/20 dark:bg-rose-950/20 border-b p-6">
                <CardTitle className="flex items-center gap-2.5 text-xl font-extrabold text-rose-600 dark:text-rose-400">
                  <CheckCircle2 className="h-5 w-5" />
                  Encerramento de Abastecimento — Leituras Finais
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Informe os valores finais dos totalizadores mecânicos das bombas para conciliação dos litros lançados.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleFinishSession} className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-xs uppercase font-bold tracking-wider text-primary block border-b pb-2 border-border/60">
                      Totalizadores Finais das Bombas
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {activeSession.b1Ini !== null && (
                        <div className="space-y-1.5 border p-3 rounded-2xl bg-muted/20">
                          <Label className="text-xs text-muted-foreground block">B.01 (Inicial: {Number(activeSession.b1Ini).toFixed(2)})</Label>
                          <Label htmlFor="b1Fim" className="block text-xs font-bold uppercase">Leitura Final</Label>
                          <Input
                            id="b1Fim"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={b1Fim}
                            onChange={(e) => setB1Fim(e.target.value)}
                            className="rounded-lg h-9 bg-background font-mono"
                            required
                          />
                        </div>
                      )}
                      {activeSession.b2Ini !== null && (
                        <div className="space-y-1.5 border p-3 rounded-2xl bg-muted/20">
                          <Label className="text-xs text-muted-foreground block">B.02 (Inicial: {Number(activeSession.b2Ini).toFixed(2)})</Label>
                          <Label htmlFor="b2Fim" className="block text-xs font-bold uppercase">Leitura Final</Label>
                          <Input
                            id="b2Fim"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={b2Fim}
                            onChange={(e) => setB2Fim(e.target.value)}
                            className="rounded-lg h-9 bg-background font-mono"
                            required
                          />
                        </div>
                      )}
                      {activeSession.b3Ini !== null && (
                        <div className="space-y-1.5 border p-3 rounded-2xl bg-muted/20">
                          <Label className="text-xs text-muted-foreground block">B.03 (Inicial: {Number(activeSession.b3Ini).toFixed(2)})</Label>
                          <Label htmlFor="b3Fim" className="block text-xs font-bold uppercase">Leitura Final</Label>
                          <Input
                            id="b3Fim"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={b3Fim}
                            onChange={(e) => setB3Fim(e.target.value)}
                            className="rounded-lg h-9 bg-background font-mono"
                            required
                          />
                        </div>
                      )}
                      {activeSession.b4Ini !== null && (
                        <div className="space-y-1.5 border p-3 rounded-2xl bg-muted/20">
                          <Label className="text-xs text-muted-foreground block">B.04 (Inicial: {Number(activeSession.b4Ini).toFixed(2)})</Label>
                          <Label htmlFor="b4Fim" className="block text-xs font-bold uppercase">Leitura Final</Label>
                          <Input
                            id="b4Fim"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={b4Fim}
                            onChange={(e) => setB4Fim(e.target.value)}
                            className="rounded-lg h-9 bg-background font-mono"
                            required
                          />
                        </div>
                      )}
                      {activeSession.b5Ini !== null && (
                        <div className="space-y-1.5 border p-3 rounded-2xl bg-muted/20">
                          <Label className="text-xs text-muted-foreground block">B.05 (Inicial: {Number(activeSession.b5Ini).toFixed(2)})</Label>
                          <Label htmlFor="b5Fim" className="block text-xs font-bold uppercase">Leitura Final</Label>
                          <Input
                            id="b5Fim"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={b5Fim}
                            onChange={(e) => setB5Fim(e.target.value)}
                            className="rounded-lg h-9 bg-background font-mono"
                            required
                          />
                        </div>
                      )}
                      {activeSession.b6Ini !== null && (
                        <div className="space-y-1.5 border p-3 rounded-2xl bg-muted/20">
                          <Label className="text-xs text-muted-foreground block">B.06 (Inicial: {Number(activeSession.b6Ini).toFixed(2)})</Label>
                          <Label htmlFor="b6Fim" className="block text-xs font-bold uppercase">Leitura Final</Label>
                          <Input
                            id="b6Fim"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={b6Fim}
                            onChange={(e) => setB6Fim(e.target.value)}
                            className="rounded-lg h-9 bg-background font-mono"
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl h-11 font-semibold"
                      onClick={() => setIsFinalizing(false)}
                      disabled={loading}
                    >
                      Voltar ao Painel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 rounded-xl h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm"
                      disabled={loading}
                    >
                      {loading ? "Fechando Sessão..." : "Confirmar e Fechar Turno"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            /* ================= FASE 2: PAINEL BENTO GRID COM TODOS OS 464 CARROS ================= */
            <div className="space-y-6">
              {/* TOP 4 METRIC CARDS (Bento Grid Verde Floresta - layout-padrao.webp) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* CARD 1: Hero Featured Forest Green Card */}
                <div className="rounded-3xl bg-[#154D34] text-white p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[148px]">
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between z-10">
                    <span className="text-xs font-medium text-emerald-200 uppercase tracking-wider">
                      Carros Abastecidos
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-xs">
                      <Bus className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="z-10 my-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        {abastecidosCount}
                      </span>
                      <span className="text-xs text-emerald-200/80 font-medium">
                        / {totalCars} veículos
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs z-10 pt-1 border-t border-white/10">
                    <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                      <TrendingUp className="w-3 h-3" />
                      {percentageCompleted}% da frota
                    </span>
                    <span className="text-emerald-200/80 text-[11px]">
                      {pendentesCount} pendentes
                    </span>
                  </div>
                </div>

                {/* CARD 2: Volume Total de Litros */}
                <div className="rounded-3xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-2xs flex flex-col justify-between min-h-[148px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Volume Abastecido
                    </span>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-slate-800 text-[#164E3A] dark:text-emerald-400 flex items-center justify-center">
                      <Fuel className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="my-2">
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {totalLitrosSessao.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{" "}
                      <span className="text-base font-semibold text-slate-500">L</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Média: {abastecidosCount > 0 ? (totalLitrosSessao / abastecidosCount).toFixed(1) : "0.0"} L por veículo
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                      <ArrowUpRight className="w-3 h-3" />
                      {activeSession.items?.length ?? 0} abastecimentos
                    </span>
                    <span className="text-slate-400 text-[11px]">Turno Atual</span>
                  </div>
                </div>

                {/* CARD 3: Bombas Ativas */}
                <div className="rounded-3xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-2xs flex flex-col justify-between min-h-[148px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Bombas Ativas
                    </span>
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Gauge className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="my-2">
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {activePumps.length} <span className="text-base font-semibold text-slate-500">bombas</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {activePumps.join(" • ") || "Nenhuma bomba"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Totalizadores Ativos
                    </span>
                    <span className="text-slate-400 text-[11px]">Pista</span>
                  </div>
                </div>

                {/* CARD 4: Operador & Turno */}
                <div className="rounded-3xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-2xs flex flex-col justify-between min-h-[148px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Frentista / Operador
                    </span>
                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="my-2">
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {activeSession.matricula}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {activeSession.user?.name || "Operador do Turno"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Início: {new Date(activeSession.dthIniAbastec).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase">Aberto</span>
                  </div>
                </div>
              </div>

              {/* BARRA DE PROGRESSO GERAL DA FROTA */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-card p-4 rounded-2xl border shadow-2xs">
                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                    Meta de Abastecimento da Frota
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black">{abastecidosCount}</span>
                    <span className="text-muted-foreground text-sm">/ {totalCars} abastecidos</span>
                    <span className="ml-auto text-xs font-bold text-[#164E3A] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/40">
                      {percentageCompleted}%
                    </span>
                  </div>
                  <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-[#164E3A] dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentageCompleted}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center sm:col-span-1 lg:col-span-2 justify-end">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block border border-emerald-600/30" />
                      <span className="text-xs font-semibold text-muted-foreground">
                        {abastecidosCount} Abastecidos
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-700 inline-block border border-muted/50" />
                      <span className="text-xs font-semibold text-muted-foreground">
                        {pendentesCount} Pendentes
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTROLES DE BUSCA E FILTROS PÍLULA */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Input
                    placeholder="Buscar número do carro..."
                    value={searchCarQuery}
                    onChange={(e) => setSearchCarQuery(e.target.value)}
                    className="w-full bg-background pr-8 rounded-full h-9 text-xs"
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

                <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 p-1 rounded-full border w-full sm:w-auto">
                  {(["all", "completed", "pending"] as const).map((status) => {
                    const labels: Record<typeof status, string> = {
                      all: `Todos (${totalCars})`,
                      completed: `Abastecidos (${abastecidosCount})`,
                      pending: `Pendentes (${pendentesCount})`,
                    };
                    return (
                      <Button
                        key={status}
                        size="sm"
                        variant={statusFilter === status ? "secondary" : "ghost"}
                        onClick={() => setStatusFilter(status)}
                        className={cn(
                          "h-7 px-3 text-xs font-semibold rounded-full transition-all",
                          statusFilter === status
                            ? "bg-background shadow-xs border border-border/50 text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {labels[status]}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* GRID COM TODOS OS 464 CARROS (IGUAL AO CONTROLE OPERACIONAL) */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {veiculos
                  .filter((car) => {
                    if (searchCarQuery && !car.includes(searchCarQuery.trim())) return false;
                    const item = abastecidoMap.get(car);
                    if (statusFilter === "completed" && !item) return false;
                    if (statusFilter === "pending" && item) return false;
                    return true;
                  })
                  .map((car) => {
                    const item = abastecidoMap.get(car);
                    const isAbastecido = !!item;

                    return (
                      <button
                        key={car}
                        onClick={() => handleCarClick(car)}
                        title={
                          isAbastecido
                            ? `Carro ${car}: ${Number(item.liters).toFixed(1)}L na Bomba ${item.bomba} (Clique para ver detalhes)`
                            : `Carro ${car}: Pendente de abastecimento (Clique para abastecer)`
                        }
                        className={cn(
                          "flex flex-col items-center justify-center p-2 border rounded-xl shadow-2xs transition-all duration-150 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-center relative overflow-hidden h-20",
                          isAbastecido
                            ? "border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1420] hover:border-emerald-500/60 dark:hover:border-emerald-500/40 text-slate-900 dark:text-slate-100"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1420] hover:border-slate-400 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400"
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Bus
                            className={cn(
                              "h-3.5 w-3.5",
                              isAbastecido
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-slate-400 dark:text-slate-600"
                            )}
                          />
                          <span className="font-bold text-sm tracking-tight font-mono">{car}</span>
                        </div>

                        {isAbastecido ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full inline-block leading-tight bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40">
                            {Number(item.liters).toFixed(0)}L • {item.bomba}
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block leading-tight bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                            Pendente
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* TABELA DE CARROS ABASTECIDOS NA SESSÃO */}
              <Card className="border-border/80 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-[#0E1420]">
                <CardHeader className="border-b pb-4 bg-muted/10 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                      <Clock className="h-4 w-4 text-[#164E3A] dark:text-emerald-400" />
                      Abastecimentos Realizados na Sessão ({activeSession.items?.length || 0})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Histórico cronológico de cada carro lançado pelo operador no turno.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {!activeSession.items || activeSession.items.length === 0 ? (
                    <div className="p-12 text-center text-xs text-muted-foreground">
                      Nenhum carro cadastrado nesta sessão. Selecione um carro no grid acima para registrar o primeiro abastecimento.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                            <th className="p-3.5">Carro</th>
                            <th className="p-3.5">Bomba</th>
                            <th className="p-3.5">Litros</th>
                            <th className="p-3.5">Foto Bomba</th>
                            <th className="p-3.5">Horário</th>
                            <th className="p-3.5 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {activeSession.items.map((r) => (
                            <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                              <td className="p-3.5 font-bold font-mono text-sm text-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                  <Bus className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                  {r.carro}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold">
                                  Bomba {r.bomba}
                                </span>
                              </td>
                              <td className="p-3.5 font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                                {Number(r.liters).toFixed(2)} L
                              </td>
                              <td className="p-3.5">
                                <div
                                  className="relative h-9 w-9 rounded-lg border border-border/80 bg-muted/40 cursor-pointer overflow-hidden group shadow-2xs"
                                  onClick={() => setActivePhotoView(r.foto)}
                                  title="Clique para ampliar a foto"
                                >
                                  <img src={r.foto} className="h-full w-full object-cover" alt="Bomba" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Eye className="h-3.5 w-3.5 text-white" />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5 font-mono text-muted-foreground">
                                {new Date(r.dataHora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                              </td>
                              <td className="p-3.5 text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setViewRecord(r);
                                    setViewDialogOpen(true);
                                  }}
                                  className="h-7 px-2 text-xs rounded-full"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Ver Detalhes
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        /* ================= ABA 2: HISTÓRICO DE FECHAMENTOS ================= */
        <Card className="border-border/80 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-[#0E1420]">
          <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between p-6">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Histórico de Fechamentos
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Visualização consolidada de todas as sessões fechadas de abastecimento com conciliação das bombas.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={loadHistory} className="rounded-full">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {pastSessions.length === 0 ? (
              <div className="p-12 text-center text-xs sm:text-sm text-muted-foreground">
                Nenhuma sessão de abastecimento fechada encontrada no histórico.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pastSessions.map((session) => {
                  const isExpanded = expandedSession === session.id;
                  const pumpsList = [];
                  if (session.b1Ini) pumpsList.push(`B.01: ${Number(session.b1Ini).toFixed(1)} → ${session.b1Fim ? Number(session.b1Fim).toFixed(1) : "-"}`);
                  if (session.b2Ini) pumpsList.push(`B.02: ${Number(session.b2Ini).toFixed(1)} → ${session.b2Fim ? Number(session.b2Fim).toFixed(1) : "-"}`);
                  if (session.b3Ini) pumpsList.push(`B.03: ${Number(session.b3Ini).toFixed(1)} → ${session.b3Fim ? Number(session.b3Fim).toFixed(1) : "-"}`);
                  if (session.b4Ini) pumpsList.push(`B.04: ${Number(session.b4Ini).toFixed(1)} → ${session.b4Fim ? Number(session.b4Fim).toFixed(1) : "-"}`);
                  if (session.b5Ini) pumpsList.push(`B.05: ${Number(session.b5Ini).toFixed(1)} → ${session.b5Fim ? Number(session.b5Fim).toFixed(1) : "-"}`);
                  if (session.b6Ini) pumpsList.push(`B.06: ${Number(session.b6Ini).toFixed(1)} → ${session.b6Fim ? Number(session.b6Fim).toFixed(1) : "-"}`);

                  return (
                    <div key={session.id} className="flex flex-col">
                      <div
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-3 cursor-pointer hover:bg-muted/10 transition-colors"
                        onClick={() => handleExpandSession(session.id)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">Operador: {session.matricula}</span>
                            {session.garagem && (
                              <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 rounded-full px-2 py-0.5 text-[10px] font-bold">
                                Garagem: {session.garagem}
                              </span>
                            )}
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                                session.status === "FINALIZADO"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                              )}
                            >
                              {session.status === "FINALIZADO" ? "Fechado" : "Em andamento"}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Início: {new Date(session.dthIniAbastec).toLocaleString("pt-BR")}
                            </span>
                            {session.dthFimAbastec && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Fim: {new Date(session.dthFimAbastec).toLocaleString("pt-BR")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 justify-between md:justify-end">
                          <div className="text-xs text-muted-foreground text-left md:text-right">
                            <span className="block font-bold text-foreground">{session._count?.items ?? 0} veículos</span>
                            <span className="block text-[10px] text-muted-foreground">Cadastrado por: {session.user?.name}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t bg-muted/5 p-4 space-y-4 animate-in fade-in duration-200">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                            {pumpsList.map((pump, idx) => (
                              <div key={idx} className="border p-2.5 rounded-xl bg-card text-center space-y-1 shadow-2xs">
                                <span className="text-[10px] font-bold text-[#164E3A] dark:text-emerald-400 block uppercase tracking-wider">Leitura</span>
                                <span className="text-xs font-mono font-bold text-foreground block">{pump}</span>
                              </div>
                            ))}
                          </div>

                          {detailsLoading ? (
                            <div className="text-center p-4 text-muted-foreground text-xs flex items-center justify-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                              Carregando veículos da sessão...
                            </div>
                          ) : !sessionDetails?.items || sessionDetails.items.length === 0 ? (
                            <div className="text-center text-xs text-muted-foreground p-4 border rounded-xl border-dashed">
                              Nenhum abastecimento cadastrado nesta sessão.
                            </div>
                          ) : (
                            <div className="border rounded-2xl overflow-hidden bg-card shadow-2xs">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b bg-muted/30 text-muted-foreground font-semibold">
                                    <th className="p-3">Carro</th>
                                    <th className="p-3">Bomba</th>
                                    <th className="p-3">Litros</th>
                                    <th className="p-3">Foto Bomba</th>
                                    <th className="p-3">Data e Hora</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {sessionDetails.items.map((it) => (
                                    <tr key={it.id} className="hover:bg-muted/5 transition-colors">
                                      <td className="p-3 font-bold text-foreground">{it.carro}</td>
                                      <td className="p-3">Bomba {it.bomba}</td>
                                      <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                        {Number(it.liters).toFixed(2)} L
                                      </td>
                                      <td className="p-3">
                                        <div
                                          className="relative h-8 w-8 border rounded-lg bg-muted/40 cursor-pointer overflow-hidden group"
                                          onClick={() => setActivePhotoView(it.foto)}
                                        >
                                          <img src={it.foto} className="h-full w-full object-cover" alt="Bomba" />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                            <Eye className="h-3 w-3 text-white" />
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3 font-mono text-muted-foreground">
                                        {new Date(it.dataHora).toLocaleString("pt-BR")}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ================= MODAL DO BOLETIM DE ABASTECIMENTO (MELHORIA DO PRINT) ================= */}
      <Dialog
        open={abastecerDialogOpen}
        onOpenChange={(open) => {
          if (activePhotoView) return;
          setAbastecerDialogOpen(open);
          if (!open) resetItemForm();
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#164E3A]/10 text-[#164E3A] dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Fuel className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Boletim de Abastecimento
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Operador: <span className="font-bold text-foreground">Matrícula {activeSession?.matricula}</span>
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateItem} className="space-y-6 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Campo Veículo / Carro */}
              <div className="space-y-1.5">
                <Label htmlFor="carro" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  Veículo / Carro <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center">
                  <Input
                    id="carro"
                    value={selectedCar ? `Carro ${selectedCar}` : ""}
                    disabled
                    className="rounded-xl h-11 bg-muted/60 font-mono font-bold text-base text-foreground border-muted-foreground/30"
                  />
                </div>
              </div>

              {/* Campo Bomba Utilizada */}
              <div className="space-y-1.5">
                <Label htmlFor="bomba" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  Bomba Utilizada <span className="text-destructive">*</span>
                </Label>
                <select
                  id="bomba"
                  value={selectedPump}
                  onChange={(e) => setSelectedPump(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Selecione a bomba...</option>
                  {activePumps.map((pump) => (
                    <option key={pump} value={pump}>
                      Bomba {pump}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo Quantidade de Litros */}
              <div className="space-y-1.5">
                <Label htmlFor="litros" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  Quantidade de Litros <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="litros"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={liters}
                    onChange={(e) => setLiters(e.target.value)}
                    className="rounded-xl h-11 bg-background font-mono font-bold text-base pr-8"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-sm font-bold text-muted-foreground">L</span>
                </div>
              </div>
            </div>

            {/* Caixa de Foto da Leitura da Bomba */}
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground block">
                Foto da Leitura da Bomba <span className="text-destructive">*</span>
              </Label>

              <div className="relative h-56 w-full rounded-2xl bg-muted/20 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 overflow-hidden">
                {activeCameraSlot ? (
                  <div className="absolute inset-0 flex flex-col justify-between bg-black">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 px-4 z-10">
                      <Button
                        type="button"
                        size="sm"
                        onClick={capturePhoto}
                        className="bg-[#164E3A] hover:bg-[#113C2D] text-white font-bold rounded-full px-5 h-9"
                      >
                        Capturar Foto
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setActiveCameraSlot(false)}
                        className="rounded-full px-4 h-9"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : foto ? (
                  <div className="relative inset-0 w-full h-full group">
                    <img src={foto} alt="Leitura da bomba" className="w-full h-full object-cover rounded-2xl" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={() => setActivePhotoView(foto)}
                        className="h-9 w-9 rounded-full shadow-md"
                        title="Ver foto ampliada"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => setFoto(null)}
                        className="h-9 w-9 rounded-full shadow-md"
                        title="Remover foto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="rounded-full bg-[#164E3A]/10 text-[#164E3A] dark:bg-emerald-500/10 dark:text-emerald-400 p-3.5">
                      <Camera className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-foreground block">Tire a foto da bomba</span>
                      <span className="text-xs text-muted-foreground">Registre o display com a litragem abastecida</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {!isMobile ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveCameraSlot(true)}
                          className="gap-1.5 rounded-full text-xs font-semibold px-4 h-9"
                        >
                          <Camera className="h-4 w-4" />
                          Abrir Câmera
                        </Button>
                      ) : (
                        <label className="inline-flex items-center justify-center rounded-full text-xs font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 gap-1.5 cursor-pointer shadow-xs">
                          <Camera className="h-4 w-4 text-muted-foreground" />
                          Tirar Foto da Bomba
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-[#164E3A] hover:bg-[#113C2D] text-white font-bold text-sm shadow-md"
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              {loading ? "Cadastrando..." : "+ Cadastrar Abastecimento"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL DE AUDITORIA / DETALHES DO CARRO ABASTECIDO ================= */}
      <Dialog
        open={viewDialogOpen}
        onOpenChange={(open) => {
          if (activePhotoView) return;
          setViewDialogOpen(open);
          if (!open) setViewRecord(null);
        }}
      >
        <DialogContent className="max-w-lg rounded-3xl p-6" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center gap-2 text-lg font-extrabold">
              <Bus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Detalhes do Abastecimento — Carro {viewRecord?.carro}
            </DialogTitle>
          </DialogHeader>

          {viewRecord && (
            <div className="space-y-4 pt-2">
              <div className="relative h-60 w-full rounded-2xl overflow-hidden bg-muted/40 border group">
                <img src={viewRecord.foto} alt="Foto da Bomba" className="w-full h-full object-cover" />
                <div
                  onClick={() => setActivePhotoView(viewRecord.foto)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-zoom-in transition-opacity"
                >
                  <Button variant="secondary" size="sm" className="rounded-full gap-1.5">
                    <Eye className="h-4 w-4" />
                    Ampliar Foto
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-muted/20 border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Bomba Utilizada</span>
                  <span className="text-base font-bold font-mono text-foreground">Bomba {viewRecord.bomba}</span>
                </div>
                <div className="p-3 rounded-2xl bg-muted/20 border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Volume Abastecido</span>
                  <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {Number(viewRecord.liters).toFixed(2)} L
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-muted/20 border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Matrícula Operador</span>
                  <span className="text-sm font-semibold text-foreground">{viewRecord.matricula}</span>
                </div>
                <div className="p-3 rounded-2xl bg-muted/20 border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Data e Hora</span>
                  <span className="text-xs font-mono text-foreground">
                    {new Date(viewRecord.dataHora).toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                  className="flex-1 rounded-xl h-10 font-semibold"
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    setViewDialogOpen(false);
                    // Iniciar novo abastecimento para o mesmo carro
                    setSelectedCar(viewRecord.carro);
                    setSelectedPump(viewRecord.bomba);
                    setLiters("");
                    setFoto(null);
                    setAbastecerDialogOpen(true);
                  }}
                  className="flex-1 rounded-xl h-10 bg-[#164E3A] hover:bg-[#113C2D] text-white font-bold"
                >
                  Novo Lançamento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox para visualização de fotos em alta resolução */}
      {renderLightbox()}
    </div>
  );
}
