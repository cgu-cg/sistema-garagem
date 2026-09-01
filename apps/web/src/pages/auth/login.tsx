import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, getDefaultRoute } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LogIn, Mail, Lock, Eye, EyeOff, ShieldCheck, Bus } from "lucide-react";
import { toast } from "sonner";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] dark:bg-[#070A11] px-4 py-8 sm:py-12 selection:bg-[#164E3A]/20">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#164E3A] dark:bg-emerald-600 text-white shadow-sm mb-1 font-bold text-xl tracking-wider">
            <Bus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Sistema Garagem
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Plataforma Operacional Integrada de Transporte e Gestão de Frota
          </p>
        </div>

        {/* Login Card com padrão de layout e arredondamento Donezo */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0E1420] shadow-sm rounded-[32px] overflow-hidden">
          <CardHeader className="space-y-1 pb-4 pt-6 px-6 sm:px-8 text-center sm:text-left">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Acessar Conta
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Entre com suas credenciais de operador ou colaborador
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 px-6 sm:px-8 pb-8 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Email Corporativo
                </Label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 text-sm rounded-full pl-11 pr-4 border-slate-200/90 dark:border-slate-800 bg-[#F8F9FA] dark:bg-[#0B0F19] text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#164E3A] dark:focus-visible:ring-emerald-500 focus-visible:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Senha de Acesso
                </Label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 text-sm rounded-full pl-11 pr-11 border-slate-200/90 dark:border-slate-800 bg-[#F8F9FA] dark:bg-[#0B0F19] text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#164E3A] dark:focus-visible:ring-emerald-500 focus-visible:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  className="w-full h-11 sm:h-12 text-sm font-bold bg-[#164E3A] hover:bg-[#113C2D] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-sm rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]" 
                  type="submit" 
                  disabled={loading}
                >
                  <LogIn className="h-4 w-4" />
                  {loading ? "Entrando no sistema..." : "Entrar no Sistema"}
                </Button>
              </div>

              {/* Informação de Segurança no Rodapé do Card */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#164E3A] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#164E3A] dark:text-emerald-400" />
                  Ambiente Operacional Seguro
                </span>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
