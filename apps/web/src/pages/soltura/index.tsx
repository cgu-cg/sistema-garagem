import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bus, Plus } from "lucide-react";
import { z } from "zod";

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
  bus: { plate: string; prefix: string; model: string };
  programmedBus: { plate: string; prefix: string; model: string } | null;
  user: { name: string };
}

export function SolturaPage() {
  const [buses, setBuses] = useState<BusType[]>([]);
  const [records, setRecords] = useState<Soltura[]>([]);
  const [busId, setBusId] = useState("");
  const [programmedBusId, setProgrammedBusId] = useState("");
  const [linha, setLinha] = useState("");
  const [tabela, setTabela] = useState("");
  const [driverCode, setDriverCode] = useState("");
  const [driverName, setDriverName] = useState("");
  const [saidaGaragem, setSaidaGaragem] = useState("");
  const [inicioLinha, setInicioLinha] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        busId: Number(busId),
        programmedBusId: programmedBusId && programmedBusId !== "none" ? Number(programmedBusId) : null,
        linha,
        tabela,
        driverCode,
        driverName,
        saidaGaragem,
        inicioLinha,
        notes: notes || null,
      };
      schema.parse(data);
      await api.createSoltura(data);
      toast.success("Soltura registrada com sucesso!");
      setBusId("");
      setProgrammedBusId("");
      setLinha("");
      setTabela("");
      setDriverCode("");
      setDriverName("");
      setSaidaGaragem("");
      setInicioLinha("");
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

  const today = new Date().toISOString().split("T")[0];
  const todayRecords = records.filter((r) => r.createdAt.startsWith(today));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Soltura de Ônibus</h1>
        <p className="text-muted-foreground">Registre o horário de saída de veículos (Segunda a Sexta)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5" />
                Nova Soltura de Ônibus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linha">Linha</Label>
                    <Input
                      id="linha"
                      value={linha}
                      onChange={(e) => setLinha(e.target.value)}
                      placeholder="Ex: 413"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tabela">Tabela / Tab.</Label>
                    <Input
                      id="tabela"
                      value={tabela}
                      onChange={(e) => setTabela(e.target.value)}
                      placeholder="Ex: 1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Carro Programado (Escalado)</Label>
                    <Select value={programmedBusId} onValueChange={setProgrammedBusId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum / Não escalado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum / Não escalado</SelectItem>
                        {buses.map((bus) => (
                          <SelectItem key={bus.id} value={String(bus.id)}>
                            {bus.prefix} - {bus.plate} ({bus.model})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Carro Realizado (Saída de Fato)</Label>
                    <Select value={busId} onValueChange={setBusId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o veículo de saída" />
                      </SelectTrigger>
                      <SelectContent>
                        {buses.map((bus) => (
                          <SelectItem key={bus.id} value={String(bus.id)}>
                            {bus.prefix} - {bus.plate} ({bus.model})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="driverCode">MOTO (Cód. Motorista)</Label>
                    <Input
                      id="driverCode"
                      value={driverCode}
                      onChange={(e) => setDriverCode(e.target.value)}
                      placeholder="Ex: 1021"
                      required
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="driverName">Nome do Motorista</Label>
                    <Input
                      id="driverName"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Nome completo do motorista"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="saidaGaragem">Saída da Garagem (GARAGEM)</Label>
                    <Input
                      id="saidaGaragem"
                      type="time"
                      value={saidaGaragem}
                      onChange={(e) => setSaidaGaragem(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inicioLinha">Início da Linha (Inicio)</Label>
                    <Input
                      id="inicioLinha"
                      type="time"
                      value={inicioLinha}
                      onChange={(e) => setInicioLinha(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Carro reserva utilizado devido a problemas mecânicos (opcional)"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  <Plus className="mr-2 h-4 w-4" />
                  {loading ? "Registrando..." : "Registrar Soltura"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Solturas de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              {todayRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma soltura registrada hoje.</p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {todayRecords.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                            Linha {r.linha}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">Tabela {r.tabela}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs my-1">
                        <div>
                          <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Carro Programado</span>
                          <span className="font-medium text-muted-foreground">
                            {r.programmedBus ? `${r.programmedBus.prefix} - ${r.programmedBus.plate}` : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Carro Realizado</span>
                          <span className="font-bold text-green-600">
                            {r.bus.prefix} - {r.bus.plate}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Motorista (MOTO)</span>
                          <span className="font-semibold text-foreground">
                            [{r.driverCode}] {r.driverName}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Horários</span>
                          <span className="font-medium">
                            Saída: <span className="font-bold">{r.saidaGaragem}</span> • Início: <span className="font-bold">{r.inicioLinha}</span>
                          </span>
                        </div>
                      </div>

                      {r.notes && (
                        <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground mt-1">
                          <strong>Obs:</strong> {r.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
