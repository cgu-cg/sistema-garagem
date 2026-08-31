import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, getDefaultRoute } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LogIn, UserCheck, ShieldCheck, Bus, Gauge, Fuel, Radio } from "lucide-react";
import { toast } from "sonner";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Login realizado com sucesso!");

      const user = useAuth.getState().user;
      const targetRoute = getDefaultRoute(user);
      navigate(targetRoute);
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("123456");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] dark:bg-[#0C120F] px-4 py-8 sm:py-12 selection:bg-[#154D34]/20">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#154D34] text-white shadow-sm mb-2 font-bold text-xl tracking-wider">
            (G)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Sistema Garagem
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Plataforma Operacional Integrada de Transporte e Frota
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0E1420] rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 pb-4 pt-6 px-6 sm:px-8">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Acessar Conta</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Entre com suas credenciais de operador ou colaborador
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 px-6 sm:px-8 pb-8">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Corporativo</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 text-sm rounded-xl border-slate-200 dark:border-slate-800 bg-background"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Senha de Acesso</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 text-sm rounded-xl border-slate-200 dark:border-slate-800 bg-background"
                  required
                />
              </div>

              <Button 
                className="w-full h-10 text-sm font-bold bg-[#164E3A] hover:bg-[#113C2D] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-xs rounded-xl transition-all" 
                type="submit" 
                disabled={loading}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {loading ? "Entrando no sistema..." : "Entrar no Sistema"}
              </Button>

              {/* Quick Demo Access Badges */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                    <UserCheck className="w-3.5 h-3.5 text-[#164E3A] dark:text-emerald-400" />
                    Acesso Rápido para Demonstração
                  </span>
                  <span className="text-[10px] text-slate-400">Senha: 123456</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 justify-start px-2.5 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    onClick={() => handleQuickLogin("admin@teste.com")}
                  >
                    <ShieldCheck className="w-3 h-3 mr-1.5 text-[#164E3A] dark:text-emerald-400 shrink-0" />
                    <span className="truncate">Administrador</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 justify-start px-2.5 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    onClick={() => handleQuickLogin("teste@teste.com")}
                  >
                    <Bus className="w-3 h-3 mr-1.5 text-blue-500 shrink-0" />
                    <span className="truncate">Colaborador</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 justify-start px-2.5 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    onClick={() => handleQuickLogin("tanque_vcg@teste.com")}
                  >
                    <Gauge className="w-3 h-3 mr-1.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Tanque VCG</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 justify-start px-2.5 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    onClick={() => handleQuickLogin("abastecimento_vcg@teste.com")}
                  >
                    <Fuel className="w-3 h-3 mr-1.5 text-amber-500 shrink-0" />
                    <span className="truncate">Abastecimento</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 justify-start px-2.5 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    onClick={() => handleQuickLogin("soltura_vcg@teste.com")}
                  >
                    <Bus className="w-3 h-3 mr-1.5 text-indigo-500 shrink-0" />
                    <span className="truncate">Soltura VCG</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 justify-start px-2.5 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    onClick={() => handleQuickLogin("controle_vcg@teste.com")}
                  >
                    <Radio className="w-3 h-3 mr-1.5 text-purple-500 shrink-0" />
                    <span className="truncate">Controle VCG</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
