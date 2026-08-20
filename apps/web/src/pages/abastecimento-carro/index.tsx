import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

export function AbastecimentoCarroPage() {
  // Active session states
  const [activeSession, setActiveSession] = useState<RefuelingSession | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [veiculos, setVeiculos] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("abastecimento");

  // History states
  const [pastSessions, setPastSessions] = useState<RefuelingSession[]>([]);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [sessionDetails, setSessionDetails] = useState<RefuelingSession | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form states - Phase 1: Inicio
  const [matricula, setMatricula] = useState("");
  const [b1Ini, setB1Ini] = useState("");
  const [b2Ini, setB2Ini] = useState("");
  const [b3Ini, setB3Ini] = useState("");
  const [b4Ini, setB4Ini] = useState("");
  const [b5Ini, setB5Ini] = useState("");
  const [b6Ini, setB6Ini] = useState("");

  // Form states - Phase 2: Refueling Car Item
  const [selectedCar, setSelectedCar] = useState("");
  const [selectedPump, setSelectedPump] = useState("");
  const [liters, setLiters] = useState("");
  const [foto, setFoto] = useState<string | null>(null);

  // Form states - Phase 3: Fim
  const [b1Fim, setB1Fim] = useState("");
  const [b2Fim, setB2Fim] = useState("");
  const [b3Fim, setB3Fim] = useState("");
  const [b4Fim, setB4Fim] = useState("");
  const [b5Fim, setB5Fim] = useState("");
  const [b6Fim, setB6Fim] = useState("");

  // Camera & Mobile states
  const [activeCameraSlot, setActiveCameraSlot] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activePhotoView, setActivePhotoView] = useState<string | null>(null);

  const loadData = async () => {
    setListLoading(true);
    try {
      const [session, cars] = await Promise.all([
        api.getActiveAbastecimentoCarroSession(),
        api.listOperacionalVeiculos(),
      ]);
      setActiveSession(session as RefuelingSession);
      setVeiculos((cars as any[]).map((v) => String(v.idCarro)));
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

  // Handle camera stream lifecycle
  useEffect(() => {
    let streamInstance: MediaStream | null = null;

    if (activeCameraSlot) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Acesso à câmera indisponível. Certifique-se de que a conexão é segura (HTTPS) ou use localhost.");
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
          toast.error("Não foi possível acessar a câmera. Verifique as permissões de acesso.");
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

  // Phase 1 Submission: Start Session
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
      toast.success("Sessão de abastecimento iniciada!");
      setActiveSession(session as RefuelingSession);
      // Clean forms
      setSelectedCar("");
      setSelectedPump("");
      setLiters("");
      setFoto(null);
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || "Erro ao iniciar abastecimento");
    } finally {
      setLoading(false);
    }
  };

  // Phase 2 Submission: Register vehicle item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeSession) return;

    if (!selectedCar) {
      toast.error("Selecione o veículo.");
      return;
    }
    if (!selectedPump) {
      toast.error("Selecione a bomba de abastecimento.");
      return;
    }
    if (!liters || Number(liters) <= 0) {
      toast.error("Insira a quantidade de litros.");
      return;
    }
    if (!foto) {
      toast.error("Tire a foto da bomba.");
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

      toast.success("Carro cadastrado com sucesso!");
      // Reset inputs
      setSelectedCar("");
      setSelectedPump("");
      setLiters("");
      setFoto(null);
      
      // Reload session data
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar abastecimento do carro");
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill Phase 3: Prepare Final readings
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

  // Phase 3 Submission: Finish Session
  const handleFinishSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeSession) return;

    const b1 = activeSession.b1Ini !== null ? (b1Fim ? Number(b1Fim) : null) : null;
    const b2 = activeSession.b2Ini !== null ? (b2Fim ? Number(b2Fim) : null) : null;
    const b3 = activeSession.b3Ini !== null ? (b3Fim ? Number(b3Fim) : null) : null;
    const b4 = activeSession.b4Ini !== null ? (b4Fim ? Number(b4Fim) : null) : null;
    const b5 = activeSession.b5Ini !== null ? (b5Fim ? Number(b5Fim) : null) : null;
    const b6 = activeSession.b6Ini !== null ? (b6Fim ? Number(b6Fim) : null) : null;

    // Basic validation: must be >= than initial values
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
      // Reset variables
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
    const list = [];
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight pb-3">Abastecimento por Carro</h1>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">Controle diário de fluxo das bombas de abastecimento e lançamento individual por veículo.</p>
      </div>

      {/* Custom Tabs Navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("abastecimento")}
          className={cn(
            "px-4 py-2 text-sm font-semibold border-b-2 transition-all -mb-px",
            activeTab === "abastecimento"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
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
            "px-4 py-2 text-sm font-semibold border-b-2 transition-all -mb-px",
            activeTab === "historico"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Histórico de Fechamentos
        </button>
      </div>

      {/* Tabs Content */}
      <div className="space-y-6 pt-2">
        {activeTab === "abastecimento" ? (
          <div>
            {listLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-2">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                Carregando estado do abastecimento...
              </div>
            ) : !activeSession ? (
              /* ================= PHASE 1: INICIO ================= */
              <Card className="w-full border-border/80 shadow-md">
                <CardHeader className="bg-muted/10 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <Play className="h-5 w-5 text-emerald-500" />
                    Início de Abastecimento
                  </CardTitle>
                  <CardDescription>
                    Informe sua matrícula e a leitura inicial de cada bomba que será operada hoje.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleStartSession} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="matricula" className="text-sm font-semibold">
                        Matrícula do Funcionário <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="matricula"
                        placeholder="Ex: 12345"
                        value={matricula}
                        onChange={(e) => setMatricula(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <Label className="text-sm font-bold text-primary block border-b pb-1 border-border/60">
                        Leituras Iniciais das Bombas (B.01 a B.06)
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                        <div className="space-y-1.5">
                          <Label htmlFor="b1Ini">Bomba 1 (B.01)</Label>
                          <Input
                            id="b1Ini"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={b1Ini}
                            onChange={(e) => setB1Ini(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="b2Ini">Bomba 2 (B.02)</Label>
                          <Input
                            id="b2Ini"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={b2Ini}
                            onChange={(e) => setB2Ini(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="b3Ini">Bomba 3 (B.03)</Label>
                          <Input
                            id="b3Ini"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={b3Ini}
                            onChange={(e) => setB3Ini(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="b4Ini">Bomba 4 (B.04)</Label>
                          <Input
                            id="b4Ini"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={b4Ini}
                            onChange={(e) => setB4Ini(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="b5Ini">Bomba 5 (B.05)</Label>
                          <Input
                            id="b5Ini"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={b5Ini}
                            onChange={(e) => setB5Ini(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="b6Ini">Bomba 6 (B.06)</Label>
                          <Input
                            id="b6Ini"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={b6Ini}
                            onChange={(e) => setB6Ini(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full font-semibold shadow-sm" disabled={loading}>
                      {loading ? "Iniciando..." : "Salvar e Iniciar"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : isFinalizing ? (
              /* ================= PHASE 3: FIM ================= */
              <Card className="w-full border-border/80 shadow-md">
                <CardHeader className="bg-rose-50/5 border-b border-rose-100/10">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-rose-500">
                    <CheckCircle2 className="h-5 w-5" />
                    Final de Abastecimento
                  </CardTitle>
                  <CardDescription>
                    Informe os valores de encerramento das bombas configuradas no início da sessão.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleFinishSession} className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-sm font-bold text-primary block border-b pb-1 border-border/60">
                        Leituras Finais das Bombas
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {activeSession.b1Ini !== null && (
                          <div className="space-y-1.5 border p-3 rounded-lg bg-muted/10">
                            <Label className="text-xs text-muted-foreground">B.01 (Inicial: {Number(activeSession.b1Ini).toFixed(2)})</Label>
                            <Label htmlFor="b1Fim" className="block text-sm font-semibold">Leitura Final</Label>
                            <Input
                              id="b1Fim"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={b1Fim}
                              onChange={(e) => setB1Fim(e.target.value)}
                              required
                            />
                          </div>
                        )}
                        {activeSession.b2Ini !== null && (
                          <div className="space-y-1.5 border p-3 rounded-lg bg-muted/10">
                            <Label className="text-xs text-muted-foreground">B.02 (Inicial: {Number(activeSession.b2Ini).toFixed(2)})</Label>
                            <Label htmlFor="b2Fim" className="block text-sm font-semibold">Leitura Final</Label>
                            <Input
                              id="b2Fim"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={b2Fim}
                              onChange={(e) => setB2Fim(e.target.value)}
                              required
                            />
                          </div>
                        )}
                        {activeSession.b3Ini !== null && (
                          <div className="space-y-1.5 border p-3 rounded-lg bg-muted/10">
                            <Label className="text-xs text-muted-foreground">B.03 (Inicial: {Number(activeSession.b3Ini).toFixed(2)})</Label>
                            <Label htmlFor="b3Fim" className="block text-sm font-semibold">Leitura Final</Label>
                            <Input
                              id="b3Fim"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={b3Fim}
                              onChange={(e) => setB3Fim(e.target.value)}
                              required
                            />
                          </div>
                        )}
                        {activeSession.b4Ini !== null && (
                          <div className="space-y-1.5 border p-3 rounded-lg bg-muted/10">
                            <Label className="text-xs text-muted-foreground">B.04 (Inicial: {Number(activeSession.b4Ini).toFixed(2)})</Label>
                            <Label htmlFor="b4Fim" className="block text-sm font-semibold">Leitura Final</Label>
                            <Input
                              id="b4Fim"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={b4Fim}
                              onChange={(e) => setB4Fim(e.target.value)}
                              required
                            />
                          </div>
                        )}
                        {activeSession.b5Ini !== null && (
                          <div className="space-y-1.5 border p-3 rounded-lg bg-muted/10">
                            <Label className="text-xs text-muted-foreground">B.05 (Inicial: {Number(activeSession.b5Ini).toFixed(2)})</Label>
                            <Label htmlFor="b5Fim" className="block text-sm font-semibold">Leitura Final</Label>
                            <Input
                              id="b5Fim"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={b5Fim}
                              onChange={(e) => setB5Fim(e.target.value)}
                              required
                            />
                          </div>
                        )}
                        {activeSession.b6Ini !== null && (
                          <div className="space-y-1.5 border p-3 rounded-lg bg-muted/10">
                            <Label className="text-xs text-muted-foreground">B.06 (Inicial: {Number(activeSession.b6Ini).toFixed(2)})</Label>
                            <Label htmlFor="b6Fim" className="block text-sm font-semibold">Leitura Final</Label>
                            <Input
                              id="b6Fim"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={b6Fim}
                              onChange={(e) => setB6Fim(e.target.value)}
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setIsFinalizing(false)} disabled={loading}>
                        Voltar ao Boletim
                      </Button>
                      <Button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold" disabled={loading}>
                        {loading ? "Fechando..." : "Salvar Encerramento"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              /* ================= PHASE 2: CADASTRO DE CADA CARRO ================= */
              <div className="flex flex-col gap-6">
                {/* Form card */}
                <Card className="border-border/80 shadow-md">
                  <CardHeader className="border-b bg-muted/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl font-bold">
                        <Fuel className="h-5 w-5 text-primary" />
                        Boletim de Abastecimento
                      </CardTitle>
                      <CardDescription>
                        Operador: <span className="font-semibold text-foreground">Matrícula: {activeSession.matricula}</span>
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleStartFinalize}
                      className="md:ml-auto shadow-sm"
                    >
                      Finalizar Abastecimento
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={handleCreateItem} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="carro">Veículo / Carro <span className="text-destructive">*</span></Label>
                          <select
                            id="carro"
                            value={selectedCar}
                            onChange={(e) => setSelectedCar(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Selecione o veículo...</option>
                            {veiculos.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bomba">Bomba Utilizada <span className="text-destructive">*</span></Label>
                          <select
                            id="bomba"
                            value={selectedPump}
                            onChange={(e) => setSelectedPump(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Selecione a bomba...</option>
                            {getActivePumpsList().map((pump) => (
                              <option key={pump} value={pump}>
                                Bomba {pump}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="litros">Quantidade de Litros <span className="text-destructive">*</span></Label>
                          <Input
                            id="litros"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={liters}
                            onChange={(e) => setLiters(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Camera Capture block */}
                      <div className="border border-border/80 rounded-xl p-4 bg-muted/10 flex flex-col items-center gap-4">
                        <Label className="font-semibold text-sm w-full text-left">
                          Foto da Leitura da Bomba <span className="text-destructive">*</span>
                        </Label>
                        
                        <div className="relative h-48 w-full max-w-md rounded-lg bg-muted/30 flex items-center justify-center border border-dashed border-muted overflow-hidden">
                          {activeCameraSlot ? (
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
                                  onClick={capturePhoto}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                                >
                                  Capturar
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setActiveCameraSlot(false)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : foto ? (
                            <div className="relative inset-0 w-full h-full group">
                              <img
                                src={foto}
                                alt="Foto da bomba"
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="icon"
                                  onClick={() => setActivePhotoView(foto)}
                                  className="h-8 w-8 rounded-full"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => setFoto(null)}
                                  className="h-8 w-8 rounded-full"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                              <div className="rounded-full bg-primary/5 p-3">
                                <Camera className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <span className="text-xs text-muted-foreground font-medium">Tire a foto da bomba</span>

                              <div className="flex flex-wrap items-center justify-center gap-2">
                                {!isMobile ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setActiveCameraSlot(true)}
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
                                      onChange={handleFileChange}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button type="submit" className="w-full font-semibold shadow-sm" disabled={loading}>
                        <Plus className="mr-2 h-4 w-4" />
                        {loading ? "Cadastrando..." : "Cadastrar Abastecimento"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Session list table card */}
                <Card className="border-border/80 shadow-md">
                  <CardHeader className="border-b pb-4 bg-muted/10">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Carros Abastecidos na Sessão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {!activeSession.items || activeSession.items.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        Nenhum carro cadastrado nesta sessão.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b bg-muted/20 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                              <th className="p-4 font-semibold">Carro</th>
                              <th className="p-4 font-semibold">Bomba</th>
                              <th className="p-4 font-semibold">Litros</th>
                              <th className="p-4 font-semibold">Foto Bomba</th>
                              <th className="p-4 font-semibold">Data e Hora</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {activeSession.items.map((r) => (
                              <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                                <td className="p-4 font-semibold text-foreground">{r.carro}</td>
                                <td className="p-4">Bomba {r.bomba}</td>
                                <td className="p-4 font-mono font-semibold">{Number(r.liters).toFixed(2)}L</td>
                                <td className="p-4">
                                  <div
                                    className="relative h-10 w-10 border rounded bg-muted/40 cursor-pointer overflow-hidden group"
                                    onClick={() => setActivePhotoView(r.foto)}
                                  >
                                    <img src={r.foto} className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                      <Eye className="h-3 w-3 text-white" />
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 font-mono text-xs text-muted-foreground">
                                  {new Date(r.dataHora).toLocaleTimeString("pt-BR")}
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
          /* Tab 2: General Sessions History */
          <Card className="border-border/80 shadow-md">
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Histórico de Fechamentos</CardTitle>
                <CardDescription>Visualização de todas as sessões fechadas de abastecimento.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={loadHistory}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {pastSessions.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nenhuma sessão de abastecimento fechada encontrada.
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
                        {/* Summary Header */}
                        <div
                          className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-3 cursor-pointer hover:bg-muted/10 transition-colors"
                          onClick={() => handleExpandSession(session.id)}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">Operador: {session.matricula}</span>
                              {session.garagem && (
                                <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 rounded px-1.5 py-0.5 text-[9px] font-bold">
                                  Garagem: {session.garagem}
                                </span>
                              )}
                              <span className={cn(
                                "rounded-full px-2 py-0.5 text-[9px] font-bold",
                                session.status === "FINALIZADO"
                                  ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                              )}>
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
                              <span className="block font-semibold text-foreground">{session._count?.items ?? 0} veículos</span>
                              <span className="block text-[10px] text-muted-foreground">Cadastrado por: {session.user?.name}</span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Collapsible Details */}
                        {isExpanded && (
                          <div className="border-t bg-muted/5 p-4 space-y-4 animate-in fade-in duration-200">
                            {/* Pump readings details */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                              {pumpsList.map((pump, idx) => (
                                <div key={idx} className="border p-2.5 rounded-lg bg-card text-center space-y-1 shadow-sm">
                                  <span className="text-[10px] font-bold text-primary block uppercase tracking-wider">Leituras</span>
                                  <span className="text-xs font-mono font-semibold text-foreground block">{pump}</span>
                                </div>
                              ))}
                            </div>

                            {/* Details items list */}
                            {detailsLoading ? (
                              <div className="text-center p-4 text-muted-foreground text-xs flex items-center justify-center gap-2">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Carregando veículos da sessão...
                              </div>
                            ) : !sessionDetails?.items || sessionDetails.items.length === 0 ? (
                              <div className="text-center text-xs text-muted-foreground p-3 border rounded border-dashed">
                                Nenhum abastecimento cadastrado nesta sessão.
                              </div>
                            ) : (
                              <div className="border rounded-lg overflow-hidden bg-card">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
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
                                        <td className="p-3 font-semibold text-foreground">{it.carro}</td>
                                        <td className="p-3">Bomba {it.bomba}</td>
                                        <td className="p-3 font-mono font-semibold">{Number(it.liters).toFixed(2)}L</td>
                                        <td className="p-3">
                                          <div
                                            className="relative h-8 w-8 border rounded bg-muted/40 cursor-pointer overflow-hidden group"
                                            onClick={() => setActivePhotoView(it.foto)}
                                          >
                                            <img src={it.foto} className="h-full w-full object-cover" />
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
      </div>

      {/* Photo Lightbox */}
      {activePhotoView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setActivePhotoView(null)}
        >
          <div
            className="relative max-w-3xl w-full aspect-auto rounded-xl overflow-hidden shadow-2xl bg-card border border-border/40"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setActivePhotoView(null)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 hover:bg-background shadow-md z-10"
            >
              <X className="h-4 w-4" />
            </Button>
            <img src={activePhotoView} className="w-full h-auto max-h-[80vh] object-contain mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
}
