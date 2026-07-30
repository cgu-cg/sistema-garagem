import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Fuel, Plus } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  busId: z.number({ message: "Selecione um ônibus" }),
  liters: z.number().positive("Litros deve ser positivo"),
  value: z.number().positive("Valor deve ser positivo"),
  driverName: z.string().min(1, "Motorista obrigatório"),
  odometer: z.number().int().positive("Odômetro inválido"),
});

interface Bus {
  id: number;
  plate: string;
  prefix: string;
  model: string;
}

interface Abastecimento {
  id: number;
  liters: string;
  value: string;
  driverName: string;
  odometer: number;
  createdAt: string;
  bus: { plate: string; prefix: string; model: string };
  user: { name: string };
}

export function AbastecimentoPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [records, setRecords] = useState<Abastecimento[]>([]);
  const [busId, setBusId] = useState("");
  const [liters, setLiters] = useState("");
  const [value, setValue] = useState("");
  const [driverName, setDriverName] = useState("");
  const [odometer, setOdometer] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [b, r] = await Promise.all([
      api.listBuses(),
      api.listAbastecimentos(),
    ]);
    setBuses(b as Bus[]);
    setRecords(r as Abastecimento[]);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        busId: Number(busId),
        liters: Number(liters),
        value: Number(value),
        driverName,
        odometer: Number(odometer),
      };
      schema.parse(data);
      await api.createAbastecimento(data);
      toast.success("Abastecimento registrado!");
      setBusId("");
      setLiters("");
      setValue("");
      setDriverName("");
      setOdometer("");
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
        <h1 className="text-3xl font-bold">Abastecimento</h1>
        <p className="text-muted-foreground">Registre o abastecimento dos ônibus</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Novo Abastecimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Ônibus</Label>
                <Select value={busId} onValueChange={setBusId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ônibus" />
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
              <div className="space-y-2">
                <Label>Motorista</Label>
                <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Nome do motorista" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Litros</Label>
                  <Input type="number" step="0.01" value={liters} onChange={(e) => setLiters(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Odômetro (km)</Label>
                <Input type="number" value={odometer} onChange={(e) => setOdometer(e.target.value)} placeholder="0" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                {loading ? "Registrando..." : "Registrar Abastecimento"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registros de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {todayRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum abastecimento hoje</p>
            ) : (
              <div className="space-y-3">
                {todayRecords.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{r.bus.prefix} - {r.bus.plate}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.driverName} • {Number(r.liters).toFixed(1)}L • R$ {Number(r.value).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
