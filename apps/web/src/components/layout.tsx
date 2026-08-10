import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, roleLabels } from "@/stores/auth";
import { Building2, Fuel, Bus, Users, LogOut, ChevronRight, LayoutDashboard, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const allNavItems = [
  { to: "/home", label: "Início", icon: LayoutDashboard, roles: ["ADMIN", "COLABORADOR_ABASTECIMENTO", "COLABORADOR_SOLTURA", "COLABORADOR"] },
  { 
    to: "/catracas", 
    label: "Conferência Catracas", 
    icon: Database, 
    roles: ["ADMIN", "COLABORADOR_ABASTECIMENTO", "COLABORADOR_SOLTURA", "COLABORADOR"],
    children: [
      { to: "/catracas/consistencia", label: "Consistência Diária", roles: ["ADMIN", "COLABORADOR_ABASTECIMENTO", "COLABORADOR_SOLTURA", "COLABORADOR"] },
      { to: "/catracas/alertas", label: "Alertas Globais", roles: ["ADMIN", "COLABORADOR_ABASTECIMENTO", "COLABORADOR_SOLTURA", "COLABORADOR"] },
      { to: "/catracas/backup", label: "Backup de Coletas", roles: ["ADMIN", "COLABORADOR_ABASTECIMENTO", "COLABORADOR_SOLTURA", "COLABORADOR"] },
      { to: "/catracas/historico", label: "Histórico por Carro", roles: ["ADMIN", "COLABORADOR_ABASTECIMENTO", "COLABORADOR_SOLTURA", "COLABORADOR"] },
      { to: "/catracas/diario", label: "Diário de Bordo (PDF)", roles: ["ADMIN", "COLABORADOR_ABASTECIMENTO", "COLABORADOR_SOLTURA", "COLABORADOR"] },
    ]
  },
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

  // Filtra itens principais e seus filhos com base nas permissões
  const filterNavItems = (items: any[]) => {
    return items
      .filter((item) => item.roles.includes(user?.role ?? ""))
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: item.children.filter((child: any) => child.roles.includes(user?.role ?? "")),
          };
        }
        return item;
      });
  };

  const visibleNav = filterNavItems([...allNavItems, ...adminItems]);

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

        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isParentActive = location.pathname.startsWith(item.to);
            const active = location.pathname === item.to || (item.to === "/catracas" && isParentActive);
            
            return (
              <div key={item.to} className="space-y-1">
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground font-medium"
                      : isParentActive
                      ? "bg-accent/60 text-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
                
                {/* Renderizar sub-itens se o menu tiver filhos e a sidebar estiver aberta */}
                {item.children && sidebarOpen && (
                  <div className="pl-6 border-l ml-5 py-0.5 space-y-1 border-muted">
                    {item.children.map((subItem: any) => {
                      const subActive = location.pathname === subItem.to;
                      return (
                        <Link
                          key={subItem.to}
                          to={subItem.to}
                          className={cn(
                            "flex items-center rounded-md px-3 py-1.5 text-xs transition-colors",
                            subActive
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          {subItem.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
