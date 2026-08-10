import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { useAuth, type Role } from "@/stores/auth";
import { LoginPage } from "@/pages/auth/login";
import { Layout } from "@/components/layout";
import { HomePage } from "@/pages/home";
import { AbastecimentoPage } from "@/pages/abastecimento";
import { SolturaPage } from "@/pages/soltura";
import { UsersPage } from "@/pages/admin/users";
import { CatracasPage } from "@/pages/catracas";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RoleRoute({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/home" replace />;
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
          <Route path="/home" element={<HomePage />} />
          <Route path="/catracas" element={<CatracasPage />} />
          <Route path="/catracas/consistencia" element={<CatracasPage />} />
          <Route path="/catracas/alertas" element={<CatracasPage />} />
          <Route path="/catracas/backup" element={<CatracasPage />} />
          <Route path="/catracas/historico" element={<CatracasPage />} />
          <Route path="/catracas/diario" element={<CatracasPage />} />
          <Route
            path="/abastecimento"
            element={
              <RoleRoute roles={["ADMIN", "COLABORADOR_ABASTECIMENTO"]}>
                <AbastecimentoPage />
              </RoleRoute>
            }
          />
          <Route
            path="/soltura"
            element={
              <RoleRoute roles={["ADMIN", "COLABORADOR_SOLTURA"]}>
                <SolturaPage />
              </RoleRoute>
            }
          />

          <Route
            path="/admin/usuarios"
            element={
              <RoleRoute roles={["ADMIN"]}>
                <UsersPage />
              </RoleRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
