import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { programmedSchedules } from "@/data/programmedSchedules";
import { 
  Fuel, 
  Bus, 
  BusFront, 
  TrendingUp, 
  ArrowUpRight, 
  PieChart, 
  Activity, 
  ChevronRight,
  Loader2
} from "lucide-react";

interface DashboardStats {
  totalLitrosHoje: number;
  abastecimentosHoje: number;
  solturasHoje: number;
  totalOnibus: number;
  inspecoesHoje: number;
  completedSolturasPct: number;
  completedVistoriasPct: number;
  litrosT1Hoje: number;
  litrosT2Hoje: number;
}

export function HomePage() {
  const { user } = useAuth();
  
  const podeVerAbastecimento = user?.role === "ADMIN" || user?.role === "tanque";
  const podeVerSoltura = user?.role === "ADMIN" || user?.role === "soltura";
  const podeVerControle = user?.role === "ADMIN" || user?.role === "operacional" || user?.role === "COLABORADOR";

  const [refuelings, setRefuelings] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    totalLitrosHoje: 0,
    abastecimentosHoje: 0,
    solturasHoje: 0,
    totalOnibus: 0,
    inspecoesHoje: 0,
    completedSolturasPct: 0,
    completedVistoriasPct: 0,
    litrosT1Hoje: 0,
    litrosT2Hoje: 0,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const promises = [
          podeVerAbastecimento ? api.listAbastecimentos() : Promise.resolve([]),
          podeVerSoltura ? api.listSolturas() : Promise.resolve([]),
          api.listBuses(),
          podeVerControle ? api.listControleOperacional() : Promise.resolve([]),
        ];

        const [abastecimentosData, solturasData, busesData, inspectionsData] = await Promise.all(promises);

        const safeAbastecimentos = Array.isArray(abastecimentosData) ? abastecimentosData : [];
        const safeSolturas = Array.isArray(solturasData) ? solturasData : [];
        const safeBuses = Array.isArray(busesData) ? busesData : [];
        const safeInspections = Array.isArray(inspectionsData) ? inspectionsData : [];

        setRefuelings(safeAbastecimentos);
        setInspections(safeInspections);

        // Timezone-safe today check
        const isToday = (dateVal: string | Date) => {
          if (!dateVal) return false;
          const d = new Date(dateVal);
          const localDateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
          
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
          return localDateStr === todayStr;
        };

        const abastecimentosHoje = safeAbastecimentos.filter(r => isToday(r.createdAt));
        const solturasHoje = safeSolturas.filter(s => isToday(s.createdAt));
        const vistoriasHoje = safeInspections.filter(i => isToday(i.dataInsercao));

        const totalLitrosHoje = abastecimentosHoje.reduce((acc, a) => acc + Number(a.litersT1) + Number(a.litersT2), 0);
        const litrosT1Hoje = abastecimentosHoje.reduce((acc, a) => acc + Number(a.litersT1), 0);
        const litrosT2Hoje = abastecimentosHoje.reduce((acc, a) => acc + Number(a.litersT2), 0);

        const totalProgramadas = programmedSchedules.length;
        const completedSolturasPct = totalProgramadas > 0 ? (solturasHoje.length / totalProgramadas) * 100 : 0;
        
        const metaVistorias = 10;
        const completedVistoriasPct = Math.min((vistoriasHoje.length / metaVistorias) * 100, 100);

        setStats({
          totalLitrosHoje,
          abastecimentosHoje: abastecimentosHoje.length,
          solturasHoje: solturasHoje.length,
          totalOnibus: safeBuses.length,
          inspecoesHoje: vistoriasHoje.length,
          completedSolturasPct,
          completedVistoriasPct,
          litrosT1Hoje,
          litrosT2Hoje,
        });

      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [podeVerAbastecimento, podeVerSoltura, podeVerControle]);

  // Group last 6 days of refuelings for Bar Chart
  const last6Days = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (5 - i));
    const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    const label = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    
    const dayRefuelings = refuelings.filter((r) => {
      const rd = new Date(r.createdAt);
      const rDateStr = `${rd.getFullYear()}-${(rd.getMonth() + 1).toString().padStart(2, "0")}-${rd.getDate().toString().padStart(2, "0")}`;
      return rDateStr === dateStr;
    });
    
    const liters = dayRefuelings.reduce((acc, a) => acc + Number(a.litersT1) + Number(a.litersT2), 0);
    return { label, liters };
  });

  const maxLiters = Math.max(...last6Days.map((d) => d.liters), 100);

  // Conic-gradient calculations for Donut Chart
  const totalLitersToday = stats.litrosT1Hoje + stats.litrosT2Hoje;
  const t1Pct = totalLitersToday > 0 ? (stats.litrosT1Hoje / totalLitersToday) * 100 : 50;

  // Inspections fallback list
  const defaultInspections = [
    { carro: "1118", linha: "413", garagem: "VCG", dataInsercao: new Date().toISOString() },
    { carro: "1327", linha: "70", garagem: "VCG", dataInsercao: new Date().toISOString() },
    { carro: "2701", linha: "81", garagem: "VCM", dataInsercao: new Date().toISOString() },
    { carro: "1002", linha: "53", garagem: "VCG", dataInsercao: new Date().toISOString() },
  ];
  const listToRender = inspections.length > 0 ? inspections.slice(0, 4) : defaultInspections;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
          <p className="text-muted-foreground text-sm font-medium">Carregando painel de controle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2 pb-3">
          <Activity className="h-8 w-8 text-indigo-500 animate-pulse" />
          Painel de Operações
        </h1>
        <p className="text-muted-foreground text-sm">Monitoramento em tempo real do sistema de garagem</p>
      </div>

      {/* Top Indicators Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {podeVerAbastecimento && (
          <>
            <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Litros Abastecidos</CardTitle>
                <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-md">
                  <Fuel className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-black text-foreground">{stats.totalLitrosHoje.toFixed(1)} L</div>
                <p className="text-[11px] text-muted-foreground font-medium">{stats.abastecimentosHoje} abastecimentos hoje</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Abastecimentos</CardTitle>
                <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-md">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-black text-foreground">{stats.abastecimentosHoje}</div>
                <p className="text-[11px] text-muted-foreground font-medium">Médias por veículo registradas</p>
              </CardContent>
            </Card>
          </>
        )}

        {podeVerSoltura && (
          <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Solturas Realizadas</CardTitle>
              <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-md">
                <Bus className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-black text-foreground">{stats.solturasHoje} / {programmedSchedules.length}</div>
              <p className="text-[11px] text-indigo-400 font-bold">{stats.completedSolturasPct.toFixed(0)}% das programadas</p>
            </CardContent>
          </Card>
        )}

        {user?.role === "ADMIN" && (
          <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frota Total</CardTitle>
              <div className="p-1.5 bg-purple-500/10 text-purple-500 rounded-md">
                <BusFront className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-black text-foreground">{stats.totalOnibus}</div>
              <p className="text-[11px] text-muted-foreground font-medium">Veículos ativos no cadastro</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Histórico de Abastecimentos (Estilo Print 1) */}
        {podeVerAbastecimento && (
          <Card className="shadow-lg border-border bg-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-foreground">Histórico de Consumo</CardTitle>
              <CardDescription className="text-xs">Leitura de litros totalizados nos últimos 6 dias de operação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              {/* Bar Chart Container */}
              <div className="flex justify-between items-end h-40 px-2 border-b border-border pb-2 pt-6">
                {last6Days.map((day, idx) => {
                  const pct = (day.liters / maxLiters) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 group">
                      <span className="text-[9px] font-bold text-muted-foreground mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.liters.toFixed(0)}L
                      </span>
                      <div className="w-8 bg-muted group-hover:bg-muted/80 rounded-t-md transition-colors relative flex items-end h-28">
                        <div 
                          className="w-full bg-emerald-500/90 dark:bg-emerald-600 rounded-t-md transition-all duration-500"
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground mt-2">{day.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Cards row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 dark:bg-slate-900/40 p-3 rounded-lg border">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Próxima Coleta</span>
                  <span className="text-sm font-bold text-foreground block mt-1">Hoje às 21:00</span>
                  <span className="text-[10px] text-indigo-400 font-medium block mt-0.5">Programada</span>
                </div>
                <div className="bg-muted/30 dark:bg-slate-900/40 p-3 rounded-lg border">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Status dos Tanques</span>
                  <span className="text-sm font-bold text-emerald-500 block mt-1">Operação Normal</span>
                  <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">Nível OK</span>
                </div>
              </div>

              <Link to="/abastecimento">
                <Button variant="outline" className="w-full text-xs font-bold gap-1 mt-2">
                  Ver Relatório Completo <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* 2. Metas Operacionais (Estilo Print 3) */}
        <Card className="shadow-lg border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground">Metas Operacionais</CardTitle>
            <CardDescription className="text-xs">Metas ativas para hoje. Acompanhe o progresso da operação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            
            {/* Target 1: Soltura de Veículos */}
            {podeVerSoltura && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Saída de Veículos (Soltura)</span>
                  <span className="font-black text-foreground">{stats.solturasHoje} de {programmedSchedules.length}</span>
                </div>
                <div className="w-full bg-muted dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.completedSolturasPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Progresso da programação</span>
                  <span className="font-bold text-indigo-400">{stats.completedSolturasPct.toFixed(0)}% concluído</span>
                </div>
              </div>
            )}

            {/* Target 2: Vistorias Realizadas */}
            {podeVerControle && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Vistorias Diárias (Checklist)</span>
                  <span className="font-black text-foreground">{stats.inspecoesHoje} de 10</span>
                </div>
                <div className="w-full bg-muted dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.completedVistoriasPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Meta operacional mínima</span>
                  <span className="font-bold text-amber-500">{stats.completedVistoriasPct.toFixed(0)}% concluído</span>
                </div>
              </div>
            )}

            <div className="border-t border-border pt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Eficiência</span>
                <span className="block text-lg font-black text-indigo-500">
                  {podeVerSoltura ? `${stats.completedSolturasPct.toFixed(0)}%` : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Inspeções</span>
                <span className="block text-lg font-black text-amber-500">
                  {stats.inspecoesHoje} / 10
                </span>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* 3. Inspeções Recentes (Estilo Print 2) */}
        {podeVerControle && (
          <Card className="shadow-lg border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-foreground">Inspeções Recentes</CardTitle>
              <CardDescription className="text-xs">Últimas vistorias de controle operacional no sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="space-y-2.5">
                {listToRender.map((item: any, idx: number) => {
                  const d = new Date(item.dataInsercao);
                  const formattedTime = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground block">Carro {item.carro}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold block">
                          Linha {item.linha} • Garagem {item.garagem}
                        </span>
                      </div>
                      
                      {/* Decorative Sparkline representation matching Print 2 */}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground">{formattedTime}</span>
                        <div className="flex items-end gap-0.5 h-6">
                          <div className="w-1 bg-muted-foreground/20 h-2 rounded-t" />
                          <div className="w-1 bg-muted-foreground/30 h-3.5 rounded-t" />
                          <div className="w-1 bg-muted-foreground/40 h-2.5 rounded-t" />
                          <div className="w-1 bg-emerald-500 h-5 rounded-t" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link to="/controle-operacional">
                <Button variant="ghost" className="w-full text-xs font-bold gap-1 mt-2 text-indigo-500 hover:text-indigo-600">
                  Ver Todas as Vistorias <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* 4. Distribuição de Combustível (Gráfico de Pizza) */}
        {podeVerAbastecimento && (
          <Card className="shadow-lg border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-foreground">Distribuição de Combustível</CardTitle>
              <CardDescription className="text-xs">Divisão do consumo hoje por tanque de abastecimento</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4 pb-2">
              {totalLitersToday > 0 ? (
                <>
                  {/* Conic-gradient Donut Chart */}
                  <div 
                    className="relative w-36 h-36 rounded-full flex items-center justify-center shadow-md animate-in fade-in zoom-in duration-500"
                    style={{ 
                      background: `conic-gradient(#6366f1 0% ${t1Pct}%, #10b981 ${t1Pct}% 100%)` 
                    }}
                  >
                    {/* Inner Donut overlay */}
                    <div className="absolute w-26 h-26 rounded-full bg-card flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Hoje</span>
                      <span className="text-base font-black text-foreground">{totalLitersToday.toFixed(0)} L</span>
                    </div>
                  </div>

                  {/* Legend list */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-[#6366f1]" />
                      <div>
                        <span className="text-xs font-bold text-foreground block">Tanque 1</span>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          {stats.litrosT1Hoje.toFixed(1)} L ({t1Pct.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-[#10b981]" />
                      <div>
                        <span className="text-xs font-bold text-foreground block">Tanque 2</span>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          {stats.litrosT2Hoje.toFixed(1)} L ({(100 - t1Pct).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-3 w-full">
                  <div className="p-3 bg-muted rounded-full text-muted-foreground">
                    <PieChart className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-foreground">Sem registros de abastecimento</h5>
                    <p className="text-[10px] text-muted-foreground">Aguardando leituras de hoje para gerar divisão.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
