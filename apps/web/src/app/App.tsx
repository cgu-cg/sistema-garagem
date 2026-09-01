import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
  if (loading && !user) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role === "ADMIN") return <>{children}</>;

  if (user.groups && user.groups.length > 0) {
    const normalizedTo = to.startsWith("/catracas") ? "/catracas" : to.startsWith("/soltura") ? "/soltura" : to;
    const hasPerm = user.groups.some(g => {
      const perms = Array.isArray(g.permissions) ? g.permissions : [];
      return perms.some(p => {
        const clean = p.split("?")[0];
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

export function App() {
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
              <PermissionRoute to="/catracas" fallbackRoles={["ADMIN"]}>
                <CatracasPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/catracas/consistencia"
            element={
              <PermissionRoute to="/catracas" fallbackRoles={["ADMIN"]}>
                <CatracasPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/catracas/alertas"
            element={
              <PermissionRoute to="/catracas" fallbackRoles={["ADMIN"]}>
                <CatracasPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/catracas/backup"
            element={
              <PermissionRoute to="/catracas" fallbackRoles={["ADMIN"]}>
                <CatracasPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/catracas/historico"
            element={
              <PermissionRoute to="/catracas" fallbackRoles={["ADMIN"]}>
                <CatracasPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/catracas/diario"
            element={
              <PermissionRoute to="/catracas" fallbackRoles={["ADMIN"]}>
                <CatracasPage />
              </PermissionRoute>
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
            path="/soltura/ci-manutencao"
            element={
              <PermissionRoute to="/soltura" fallbackRoles={["ADMIN", "soltura", "COLABORADOR"]}>
                <SolturaPage defaultTab="CI_MANUTENCAO" />
              </PermissionRoute>
            }
          />
          <Route
            path="/soltura/alterar-folha"
            element={
              <PermissionRoute to="/soltura" fallbackRoles={["ADMIN", "soltura", "COLABORADOR"]}>
                <SolturaPage defaultTab="ALTERAR_FOLHA" />
              </PermissionRoute>
            }
          />
          <Route
            path="/soltura/alterar-carro-programado"
            element={
              <PermissionRoute to="/soltura" fallbackRoles={["ADMIN", "soltura", "COLABORADOR"]}>
                <SolturaPage defaultTab="ALTERAR_CARRO_PROGRAMADO" />
              </PermissionRoute>
            }
          />
          <Route
            path="/soltura/carro-realizado"
            element={
              <PermissionRoute to="/soltura" fallbackRoles={["ADMIN", "soltura", "COLABORADOR"]}>
                <SolturaPage defaultTab="ALTERAR_CARRO_PROGRAMADO" />
              </PermissionRoute>
            }
          />
          <Route
            path="/soltura/reservas"
            element={
              <PermissionRoute to="/soltura" fallbackRoles={["ADMIN", "soltura", "COLABORADOR"]}>
                <SolturaPage defaultTab="RESERVAS" />
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
