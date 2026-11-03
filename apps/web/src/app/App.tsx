import { TrafegoPage } from '@/pages/trafego';
import { operationPageAccess, explicitGarage } from '@/lib/operationalAccess';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth, type Role, getDefaultRoute } from "@/stores/auth";
import { LoginPage } from "@/pages/auth/login";
import { Layout } from "@/components/layout";
import { HomePage } from "@/pages/home";
import { AbastecimentoPage } from "@/pages/abastecimento";
import { AbastecimentoCarroPage } from "@/pages/abastecimento-carro";
import { SolturaPage } from "@/pages/soltura";
import { UsersPage } from "@/pages/admin/users";
import { CatracasPage } from "@/pages/catracas";
import { ControleOperacionalPage } from "@/pages/controle-operacional";
import { ManutencaoPage } from "@/pages/manutencao";
import { useC4RealtimeSession } from '@/lib/useC4Realtime';

function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading, user } = useAuth();
  if (!token) return <Navigate to="/" replace />;
  if (loading && !user) return <LoadingScreen />;
  return <>{children}</>;
}

function PermissionRoute({ to, fallbackRoles, children }: { to: string; fallbackRoles: Role[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role === "ADMIN") return <>{children}</>;

  const operational = operationPageAccess(user, location.pathname);
  if (operational !== undefined) {
    if (!explicitGarage(user)) return <p role="alert">Usuario sem garagem cadastrada. Solicite revisao ao administrador.</p>;
    return operational ? <>{children}</> : <p role="alert">Seu perfil ou grupo nao permite esta tela.</p>;
  }

  if (user.groups && user.groups.length > 0) {
    const normalizedTo = to.startsWith("/catracas") ? "/catracas"
      : to.startsWith("/soltura-adm") || to.startsWith("/alterar-folha") ? "/soltura-adm"
        : to.startsWith("/escala-carros") || to.startsWith("/alterar-carro-programado") ? "/escala-carros"
          : to.startsWith("/manutencao") || to.startsWith("/ci-manutencao") || to.startsWith("/soltura/ci-manutencao") ? "/manutencao"
            : to.startsWith("/soltura") ? "/soltura"
              : to;

    const hasPerm = user.groups.some(g => {
      const perms = Array.isArray(g.permissions) ? g.permissions : [];
      return perms.some(p => {
        const clean = p.split("?")[0];
        if (normalizedTo === "/manutencao" && (clean === "/manutencao" || clean === "/ci-manutencao" || clean === "/soltura" || clean === "/soltura/ci-manutencao")) {
          return true;
        }
        if (normalizedTo === "/soltura-adm" && (clean === "/soltura-adm" || clean === "/soltura" || clean === "/soltura/alterar-folha" || clean === "/alterar-folha")) {
          return true;
        }
        return normalizedTo === clean || normalizedTo.startsWith(clean + "/") || clean.startsWith(normalizedTo + "/");
      });
    });
    if (!hasPerm) {
      const defaultRoute = getDefaultRoute(user);
      return <Navigate to={defaultRoute} replace />;
    }
    return <>{children}</>;
  }

  if (!fallbackRoles.includes(user.role)) {
    const defaultRoute = getDefaultRoute(user);
    return <Navigate to={defaultRoute} replace />;
  }
  return <>{children}</>;
}

function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading && !user) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "ADMIN") return <Navigate to={getDefaultRoute(user)} replace />;

  return <>{children}</>;
}

export function App() {
  useC4RealtimeSession();
  const { loadUser, token } = useAuth();

  useEffect(() => {
    if (token) loadUser();
  }, []);

  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/trafego" element={<Navigate to="/trafego/alterar-escalas-solturas" replace />} />
          <Route path="/trafego/alterar-escalas-solturas" element={<PermissionRoute to="/trafego" fallbackRoles={["ADMIN", "soltura"]}><TrafegoPage /></PermissionRoute>} />
          <Route
            path="/home"
            element={
              <PermissionRoute to="/home" fallbackRoles={["ADMIN", "COLABORADOR"]}>
                <HomePage />
              </PermissionRoute>
            }
          />
          <Route
            path="/catracas"
            element={
              <AdminOnlyRoute>
                <CatracasPage />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="/catracas/consistencia"
            element={
              <AdminOnlyRoute>
                <CatracasPage />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="/catracas/alertas"
            element={
              <AdminOnlyRoute>
                <CatracasPage />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="/catracas/backup"
            element={
              <AdminOnlyRoute>
                <CatracasPage />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="/catracas/historico"
            element={
              <AdminOnlyRoute>
                <CatracasPage />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="/catracas/diario"
            element={
              <AdminOnlyRoute>
                <CatracasPage />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="/abastecimento"
            element={
              <PermissionRoute to="/abastecimento" fallbackRoles={["ADMIN", "tanque", "COLABORADOR"]}>
                <AbastecimentoPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/abastecimento-carro"
            element={
              <PermissionRoute to="/abastecimento-carro" fallbackRoles={["ADMIN", "abastecimento", "COLABORADOR"]}>
                <AbastecimentoCarroPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/soltura"
            element={
              <PermissionRoute to="/soltura" fallbackRoles={["ADMIN", "soltura", "COLABORADOR"]}>
                <SolturaPage defaultTab="FOLHA" />
              </PermissionRoute>
            }
          />
          <Route
            path="/soltura/historico"
            element={
              <PermissionRoute to="/soltura" fallbackRoles={["ADMIN", "soltura", "COLABORADOR"]}>
                <SolturaPage defaultTab="HISTORICO" />
              </PermissionRoute>
            }
          />
          <Route
            path="/soltura/ci-manutencao"
            element={
              <PermissionRoute to="/manutencao" fallbackRoles={["ADMIN", "COLABORADOR", "manutencao"]}>
                <SolturaPage defaultTab="CI_MANUTENCAO" />
              </PermissionRoute>
            }
          />
          <Route
            path="/soltura/alterar-folha"
            element={
              <PermissionRoute to="/soltura-adm" fallbackRoles={["ADMIN", "COLABORADOR"]}>
                <Navigate to="/trafego/alterar-escalas-solturas" replace />
              </PermissionRoute>
            }
          />
          <Route
            path="/soltura/alterar-carro-programado"
            element={
              <PermissionRoute to="/escala-carros" fallbackRoles={["ADMIN", "COLABORADOR"]}>
                <SolturaPage defaultTab="ALTERAR_CARRO_PROGRAMADO" />
              </PermissionRoute>
            }
          />
          <Route
            path="/soltura/carro-realizado"
            element={
              <PermissionRoute to="/escala-carros" fallbackRoles={["ADMIN", "COLABORADOR"]}>
                <SolturaPage defaultTab="ALTERAR_CARRO_PROGRAMADO" />
              </PermissionRoute>
            }
          />
          <Route
            path="/soltura/reservas"
            element={<Navigate to="/soltura" replace />}
          />

          {/* Módulo Manutenção */}
          <Route
            path="/manutencao"
            element={
              <PermissionRoute to="/manutencao" fallbackRoles={["ADMIN", "COLABORADOR", "manutencao"]}>
                <ManutencaoPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/manutencao/ci-manutencao"
            element={
              <PermissionRoute to="/manutencao" fallbackRoles={["ADMIN", "COLABORADOR", "manutencao"]}>
                <SolturaPage defaultTab="CI_MANUTENCAO" />
              </PermissionRoute>
            }
          />
          <Route
            path="/ci-manutencao"
            element={
              <PermissionRoute to="/manutencao" fallbackRoles={["ADMIN", "COLABORADOR", "manutencao"]}>
                <SolturaPage defaultTab="CI_MANUTENCAO" />
              </PermissionRoute>
            }
          />

          {/* Módulo Soltura ADM */}
          <Route
            path="/soltura-adm"
            element={
              <PermissionRoute to="/soltura-adm" fallbackRoles={["ADMIN", "COLABORADOR"]}>
                <Navigate to="/trafego/alterar-escalas-solturas" replace />
              </PermissionRoute>
            }
          />
          <Route
            path="/soltura-adm/alterar-folha"
            element={
              <PermissionRoute to="/soltura-adm" fallbackRoles={["ADMIN", "COLABORADOR"]}>
                <Navigate to="/trafego/alterar-escalas-solturas" replace />
              </PermissionRoute>
            }
          />
          <Route
            path="/alterar-folha"
            element={
              <PermissionRoute to="/soltura-adm" fallbackRoles={["ADMIN", "COLABORADOR"]}>
                <Navigate to="/trafego/alterar-escalas-solturas" replace />
              </PermissionRoute>
            }
          />
          <Route
            path="/alterar-carro-programado"
            element={
              <PermissionRoute to="/escala-carros" fallbackRoles={["ADMIN", "COLABORADOR"]}>
                <SolturaPage defaultTab="ALTERAR_CARRO_PROGRAMADO" />
              </PermissionRoute>
            }
          />

          {/* Módulo Escala Carros */}
          <Route
            path="/escala-carros"
            element={
              <PermissionRoute to="/escala-carros" fallbackRoles={["ADMIN", "COLABORADOR"]}>
                <SolturaPage defaultTab="ALTERAR_CARRO_PROGRAMADO" />
              </PermissionRoute>
            }
          />
          <Route
            path="/escala-carros/alterar-carro-programado"
            element={
              <PermissionRoute to="/escala-carros" fallbackRoles={["ADMIN", "COLABORADOR"]}>
                <SolturaPage defaultTab="ALTERAR_CARRO_PROGRAMADO" />
              </PermissionRoute>
            }
          />
          <Route
            path="/controle-operacional"
            element={
              <PermissionRoute to="/controle-operacional" fallbackRoles={["ADMIN", "operacional", "COLABORADOR"]}>
                <ControleOperacionalPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/admin/usuarios"
            element={
              <PermissionRoute to="/admin/usuarios" fallbackRoles={["ADMIN"]}>
                <UsersPage />
              </PermissionRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
