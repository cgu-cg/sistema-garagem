import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { z } from "zod";
import { programmedSchedules, ProgrammedSchedule } from "@/data/programmedSchedules";
import { drivers } from "@/data/drivers";

const schema = z.object({
  busId: z.number({ message: "Selecione o ônibus realizado" }),
  programmedBusId: z.number().optional().nullable(),
  linha: z.string().min(1, "Linha é obrigatória"),
  tabela: z.string().min(1, "Tabela é obrigatória"),
  driverCode: z.string().min(1, "Código do motorista (MOTO) é obrigatório"),
  driverName: z.string().min(1, "Nome do motorista é obrigatório"),
  saidaGaragem: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário de saída inválido (HH:mm)"),
  inicioLinha: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário de início inválido (HH:mm)"),
  notes: z.string().optional().nullable(),
});

interface BusType {
  id: number;
  plate: string;
  prefix: string;
  model: string;
}

interface Soltura {
  id: number;
  linha: string;
  tabela: string;
  driverCode: string;
  driverName: string;
  saidaGaragem: string;
  inicioLinha: string;
  notes: string | null;
  createdAt: string;
  bus: { id: number; plate: string; prefix: string; model: string };
  programmedBus: { id: number; plate: string; prefix: string; model: string } | null;
  user: { name: string };
}

export function SolturaPage() {
  const [buses, setBuses] = useState<BusType[]>([]);
  const [records, setRecords] = useState<Soltura[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal form states
  const [selectedSchedule, setSelectedSchedule] = useState<ProgrammedSchedule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [busId, setBusId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [driverCode, setDriverCode] = useState("");
  const [driverName, setDriverName] = useState("");
  const [saidaGaragem, setSaidaGaragem] = useState("");
  const [inicioLinha, setInicioLinha] = useState("");
  const [notes, setNotes] = useState("");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "PENDING" | "DONE" | "REGULAR" | "VCM" | "FRETAMENTO">("ALL");

  const load = async () => {
    try {
      const [b, r] = await Promise.all([
        api.listBuses(),
        api.listSolturas(),
      ]);
      setBuses(b as BusType[]);
      setRecords(r as Soltura[]);
    } catch (err: any) {
      toast.error("Erro ao carregar dados: " + err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const todayRecords = records.filter((r) => r.createdAt.startsWith(today));

  const handleCardClick = (sched: ProgrammedSchedule) => {
    const dispatched = todayRecords.find(r => r.linha === sched.linha && r.tabela === sched.tabela);
    setSelectedSchedule(sched);

    if (dispatched) {
      // View mode
      setBusId(String(dispatched.bus.id));
      setDriverId(dispatched.driverCode);
      setDriverCode(dispatched.driverCode);
      setDriverName(dispatched.driverName);
      setSaidaGaragem(dispatched.saidaGaragem);
      setInicioLinha(dispatched.inicioLinha);
      setNotes(dispatched.notes || "");
    } else {
      // Form mode
      if (sched.programmedBusPrefix) {
        const matchedBus = buses.find(b => b.prefix === sched.programmedBusPrefix);
        setBusId(matchedBus ? String(matchedBus.id) : "");
      } else {
        setBusId("");
      }
      setDriverId("");
      setDriverCode("");
      setDriverName("");
      setNotes("");

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      setSaidaGaragem(timeRegex.test(sched.saidaGaragem) ? sched.saidaGaragem : "");
      setInicioLinha(timeRegex.test(sched.inicioLinha) ? sched.inicioLinha : "");
    }
    setIsDialogOpen(true);
  };

  const handleDriverSelect = (val: string) => {
    setDriverId(val);
    if (val !== "custom" && val !== "") {
      const d = drivers.find(drv => drv.code === val);
      if (d) {
        setDriverCode(d.code);
        setDriverName(d.name);
      }
    } else {
      setDriverCode("");
      setDriverName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    setLoading(true);
    try {
      const finalDriverCode = driverId === "custom" ? driverCode : driverId;
      const finalDriverName = driverId === "custom" ? driverName : (drivers.find(d => d.code === driverId)?.name || "");

      const data = {
        busId: Number(busId),
        programmedBusId: selectedSchedule.programmedBusPrefix
          ? (buses.find(b => b.prefix === selectedSchedule.programmedBusPrefix)?.id || null)
          : null,
        linha: selectedSchedule.linha,
        tabela: selectedSchedule.tabela,
        driverCode: finalDriverCode,
        driverName: finalDriverName,
        saidaGaragem,
        inicioLinha,
        notes: notes || null,
      };

      schema.parse(data);
      await api.createSoltura(data);
      toast.success("Soltura registrada com sucesso!");
      setIsDialogOpen(false);
      setSelectedSchedule(null);
      setBusId("");
      setDriverId("");
      setDriverCode("");
      setDriverName("");
      setNotes("");
      load();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error(err.message || "Erro ao registrar");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = programmedSchedules.filter(sched => {
    const isDispatched = todayRecords.some(r => r.linha === sched.linha && r.tabela === sched.tabela);

    // Search query matching
    const matchesSearch =
      sched.linha.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sched.tabela.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Filter type matching
    if (filterType === "PENDING") return !isDispatched;
    if (filterType === "DONE") return isDispatched;
    if (filterType === "VCM") return sched.tipo === "VCM";
    if (filterType === "FRETAMENTO") return sched.tipo === "FRETAMENTO";
    return true; // "ALL"
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Soltura de Ônibus</h1>
          <p className="text-muted-foreground">Registre e gerencie as saídas dos veículos (Segunda a Sexta)</p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col gap-4 justify-between bg-card p-4 rounded-xl border border-border sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterType === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("ALL")}
          >
            Todos ({programmedSchedules.length})
          </Button>
          <Button
            variant={filterType === "PENDING" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("PENDING")}
          >
            Pendentes ({programmedSchedules.length - todayRecords.length})
          </Button>
          <Button
            variant={filterType === "DONE" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("DONE")}
          >
            Realizados ({todayRecords.length})
          </Button>
          <Button
            variant={filterType === "VCM" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("VCM")}
          >
            VCM ({programmedSchedules.filter(s => s.tipo === "VCM").length})
          </Button>
          <Button
            variant={filterType === "FRETAMENTO" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("FRETAMENTO")}
          >
            Fretamento ({programmedSchedules.filter(s => s.tipo === "FRETAMENTO").length})
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por Linha ou Tabela..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Grid de Cards das Escalas */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredSchedules.map(sched => {
          const dispatched = todayRecords.find(r => r.linha === sched.linha && r.tabela === sched.tabela);
          const isDone = !!dispatched;

          return (
            <div
              key={sched.id}
              onClick={() => handleCardClick(sched)}
              className={`grid grid-cols-6 text-center font-mono text-[11px] sm:text-xs p-3 rounded-xl border cursor-pointer select-none shadow-sm ${isDone
                ? "bg-green-100 border-green-500 text-green-500"
                : "bg-slate-900 border-slate-700/50 text-white"
                }`}
            >
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-sans font-semibold">Lin</span>
                <span className="font-bold text-xl">{sched.linha}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-sans font-semibold">Tab</span>
                <span className="font-bold text-xl">{sched.tabela}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-sans font-semibold">Prog.</span>
                <span className={`font-bold text-xl ${isDone ? "text-green-500" : "text-yellow-500"}`}>{sched.programmedBusPrefix || "—"}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-sans font-semibold">Real.</span>
                <span className={`font-bold text-xl ${isDone ? "text-green-500" : "text-slate-500"}`}>
                  {isDone ? dispatched.bus.prefix : "..."}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-sans font-semibold">Moto</span>
                <span className={`font-bold text-xl ${isDone ? "text-green-500" : "text-slate-500"}`}>
                  {isDone ? dispatched.driverCode : "..."}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-sans font-semibold">Garagem</span>
                <span className={`font-bold text-xl ${isDone ? "text-green-500" : "text-slate-500"}`}>{sched.saidaGaragem || "—"}</span>
              </div>
              {/*<div>
                <span className="text-[9px] text-slate-400 block uppercase font-sans font-semibold">Inicio</span>
                <span className={`font-bold ${isDone ? "text-green-500" : "text-slate-500"}`}>{sched.inicioLinha || "—"}</span>
              </div>*/}
            </div>
          );
        })}
      </div>

      {/* Modal / Popup de Despacho */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-700 text-slate-800">
          <DialogHeader>
            <DialogTitle>
              {selectedSchedule && todayRecords.some(r => r.linha === selectedSchedule.linha && r.tabela === selectedSchedule.tabela)
                ? "Visualizar Soltura"
                : "Realizar Soltura"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {selectedSchedule ? `Linha ${selectedSchedule.linha} - Tabela ${selectedSchedule.tabela}` : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedSchedule && (
            <div className="space-y-6">
              {/* Card Banner no topo do Dialog */}
              <div
                className={`grid grid-cols-7 text-center font-mono text-[11px] sm:text-xs p-3 rounded-xl border cursor-pointer select-none shadow-sm ${selectedSchedule && todayRecords.some(r => r.linha === selectedSchedule.linha && r.tabela === selectedSchedule.tabela)
                  ? "bg-green-100 border-green-500 text-green-500"
                  : "bg-slate-900 border-slate-700/50 text-white"
                  }`}
              >
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-sans font-semibold">Lin</span>
                  <span className="font-bold text-base ">{selectedSchedule.linha}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-sans font-semibold">Tab</span>
                  <span className="font-bold text-base">{selectedSchedule.tabela}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-sans font-semibold">Prog.</span>
                  <span className="font-bold text-base">{selectedSchedule.programmedBusPrefix || "—"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-sans font-semibold">Real.</span>
                  <span className="font-bold text-base">
                    {todayRecords.find(r => r.linha === selectedSchedule.linha && r.tabela === selectedSchedule.tabela)?.bus.prefix || "..."}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-sans font-semibold">Moto</span>
                  <span className="font-bold text-base">
                    {todayRecords.find(r => r.linha === selectedSchedule.linha && r.tabela === selectedSchedule.tabela)?.driverCode || "..."}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-sans font-semibold">Garagem</span>
                  <span className="font-bold text-base">{saidaGaragem || "—"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-sans font-semibold">Inicio</span>
                  <span className="font-bold text-base">{inicioLinha || "—"}</span>
                </div>
              </div>

              {/* Form ou Visualização */}
              {todayRecords.some(r => r.linha === selectedSchedule.linha && r.tabela === selectedSchedule.tabela) ? (
                <div className="space-y-4 bg-white text-sm">
                  <div className="grid grid-cols-2 gap-4 border rounded-xl p-4 border-slate-800">
                    <div>
                      <span className="text-slate-400 text-xs block">Carro Realizado</span>
                      <span className="font-semibold text-slate-800">
                        {todayRecords.find(r => r.linha === selectedSchedule.linha && r.tabela === selectedSchedule.tabela)?.bus.prefix} - {todayRecords.find(r => r.linha === selectedSchedule.linha && r.tabela === selectedSchedule.tabela)?.bus.plate}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Motorista</span>
                      <span className="font-semibold text-slate-800">
                        [{todayRecords.find(r => r.linha === selectedSchedule.linha && r.tabela === selectedSchedule.tabela)?.driverCode}] {todayRecords.find(r => r.linha === selectedSchedule.linha && r.tabela === selectedSchedule.tabela)?.driverName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Saída da Garagem</span>
                      <span className="font-semibold text-slate-800">{saidaGaragem}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Início da Linha</span>
                      <span className="font-semibold text-slate-800">{inicioLinha}</span>
                    </div>
                  </div>
                  {notes && (
                    <div className="border-t border-slate-800 pt-3">
                      <span className="text-slate-400 text-xs block">Observações</span>
                      <p className="text-white italic mt-1">"{notes}"</p>
                    </div>
                  )}
                  <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-700 bg-slate-800 hover:bg-slate-900 text-white hover:text-white ">
                      Fechar
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Select Carro Realizado */}
                  <div className="space-y-2">
                    <Label htmlFor="busId">Carro Realizado (Saída de Fato)</Label>
                    <Select value={busId} onValueChange={setBusId}>
                      <SelectTrigger className="border-slate-700 text-slate-800">
                        <SelectValue placeholder="Selecione o veículo realizado..." />
                      </SelectTrigger>
                      <SelectContent className="border-slate-700 text-slate-800">
                        {buses.map((bus) => (
                          <SelectItem key={bus.id} value={String(bus.id)} className="cursor-pointer">
                            {bus.prefix} - {bus.plate} ({bus.model})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select Motorista */}
                  <div className="space-y-2">
                    <Label htmlFor="driverId">Motorista</Label>
                    <Select value={driverId} onValueChange={handleDriverSelect}>
                      <SelectTrigger className="border-slate-700 text-slate-800">
                        <SelectValue placeholder="Selecione um motorista..." />
                      </SelectTrigger>
                      <SelectContent className="border-slate-700 text-slate-800">
                        {drivers.map((drv) => (
                          <SelectItem key={drv.code} value={drv.code} className="cursor-pointer">
                            [{drv.code}] {drv.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom" className="text-yellow-400 hover:bg-slate-800 focus:bg-slate-800">
                          Outro / Digitar manual...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Driver Fields */}
                  {driverId === "custom" && (
                    <div className="grid grid-cols-3 gap-3 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                      <div className="space-y-2 col-span-1">
                        <Label htmlFor="driverCode">Código MOTO</Label>
                        <Input
                          id="driverCode"
                          value={driverCode}
                          onChange={(e) => setDriverCode(e.target.value)}
                          placeholder="1021"
                          required
                          className="bg-slate-950 border-slate-700 text-white"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="driverName">Nome Completo</Label>
                        <Input
                          id="driverName"
                          value={driverName}
                          onChange={(e) => setDriverName(e.target.value)}
                          placeholder="Nome do motorista"
                          required
                          className="bg-slate-950 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Manual Times if empty/VCM */}
                  {(!selectedSchedule.saidaGaragem || !selectedSchedule.inicioLinha || selectedSchedule.inicioLinha === "VCM") && (
                    <div className="grid grid-cols-2 gap-4 bg-slate-950/30 p-3 rounded-lg border border-slate-800/50">
                      <div className="space-y-2">
                        <Label htmlFor="saidaGaragem">Saída Garagem</Label>
                        <Input
                          id="saidaGaragem"
                          type="time"
                          value={saidaGaragem}
                          onChange={(e) => setSaidaGaragem(e.target.value)}
                          required
                          className="bg-slate-950 border-slate-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inicioLinha">Início Linha</Label>
                        <Input
                          id="inicioLinha"
                          type="time"
                          value={inicioLinha}
                          onChange={(e) => setInicioLinha(e.target.value)}
                          required
                          className="bg-slate-950 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Observações */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ex: Utilizou carro reserva (opcional)"
                      className="border-slate-700 text-slate-800"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="border-slate-700 hover:bg-slate-800 hover:text-white"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-white" disabled={loading}>
                      {loading ? "Salvando..." : "Registrar Despacho"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
}
