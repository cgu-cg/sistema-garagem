import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, roleLabels } from "@/stores/auth";
import { Building2, Fuel, Bus, Users, LogOut, ChevronRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const allNavItems = [
  { to: "/home", label: "Início", icon: LayoutDashboard, roles: ["ADMIN", "COLABORADOR_ABASTECIMENTO", "COLABORADOR_SOLTURA"] },
  { to: "/abastecimento", label: "Abastecimento", icon: Fuel, roles: ["ADMIN", "COLABORADOR_ABASTECIMENTO"] },
  { to: "/soltura", label: "Soltura", icon: Bus, roles: ["ADMIN", "COLABORADOR_SOLTURA"] },
];

const adminItems = [
  { to: "/admin/usuarios", label: "Usuários", icon: Users, roles: ["ADMIN"] },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const visibleNav = [...allNavItems, ...adminItems].filter((item) => item.roles.includes(user?.role ?? ""));

  return (
    <div className="min-h-screen bg-muted/30">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          <Building2 className="h-6 w-6 shrink-0" />
          {sidebarOpen && (
            <span className="ml-3 font-semibold truncate">Sistema Garagem</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", sidebarOpen && "rotate-180")} />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-2">
          {sidebarOpen && user && (
            <div className="px-3 py-2 text-sm">
              <p className="font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{roleLabels[user.role]}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      <main className={cn("transition-all duration-300", sidebarOpen ? "ml-64" : "ml-16")}>
        <div className="container py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
