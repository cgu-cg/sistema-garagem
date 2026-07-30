import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, Bus, BusFront } from "lucide-react";

interface Stats {
  abastecimentosHoje: number;
  solturasHoje: number;
  totalOnibus: number;
  totalLitros: number;
}

export function HomePage() {
  const { user } = useAuth();
  const podeVerAbastecimento = user?.role === "ADMIN" || user?.role === "COLABORADOR_ABASTECIMENTO";
  const podeVerSoltura = user?.role === "ADMIN" || user?.role === "COLABORADOR_SOLTURA";

  const [stats, setStats] = useState<Stats>({
    abastecimentosHoje: 0,
    solturasHoje: 0,
    totalOnibus: 0,
    totalLitros: 0,
  });

  useEffect(() => {
    async function load() {
      const hoje = new Date().toISOString().split("T")[0];
      const promises: Promise<any>[] = [];

      if (podeVerAbastecimento) {
        promises.push(api.listAbastecimentos({ startDate: hoje, endDate: hoje }));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (podeVerSoltura) {
        promises.push(api.listSolturas({ startDate: hoje, endDate: hoje }));
      } else {
        promises.push(Promise.resolve([]));
      }

      promises.push(api.listBuses());

      const [abastecimentos, solturas, buses] = await Promise.all(promises);

      const totalLitros = Array.isArray(abastecimentos)
        ? abastecimentos.reduce((acc: number, a: any) => acc + Number(a.liters), 0)
        : 0;

      setStats({
        abastecimentosHoje: Array.isArray(abastecimentos) ? abastecimentos.length : 0,
        solturasHoje: Array.isArray(solturas) ? solturas.length : 0,
        totalOnibus: Array.isArray(buses) ? buses.length : 0,
        totalLitros,
      });
    }
    load();
  }, [podeVerAbastecimento, podeVerSoltura]);

  const cards = [];

  if (podeVerAbastecimento) {
    cards.push(
      { title: "Abastecimentos Hoje", value: stats.abastecimentosHoje, icon: Fuel, color: "text-blue-600" },
      { title: "Litros Abastecidos", value: stats.totalLitros.toFixed(1), icon: Fuel, color: "text-green-600" },
    );
  }

  if (podeVerSoltura) {
    cards.push({ title: "Solturas Hoje", value: stats.solturasHoje, icon: Bus, color: "text-orange-600" });
  }

  cards.push({ title: "Total de Ônibus", value: stats.totalOnibus, icon: BusFront, color: "text-purple-600" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumo do dia</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
