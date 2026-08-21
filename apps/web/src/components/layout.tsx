import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, roleLabels } from "@/stores/auth";
import { Fuel, Bus, Users, LogOut, ChevronRight, LayoutDashboard, ClipboardCheck, Radio, Sun, Moon, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const allNavItems = [
  { to: "/home", label: "Início", icon: LayoutDashboard, roles: ["ADMIN", "COLABORADOR", "tanque", "abastecimento", "soltura", "operacional"] },
  {
    to: "/catracas",
    label: "Conferência Catracas",
    icon: ClipboardCheck,
    roles: ["ADMIN"],
    children: [
      { to: "/catracas/consistencia", label: "Consistência Diária", roles: ["ADMIN"] },
      { to: "/catracas/alertas", label: "Datas Incorretas", roles: ["ADMIN"] },
      { to: "/catracas/backup", label: "Backup de Coletas", roles: ["ADMIN"] },
      //{ to: "/catracas/historico", label: "Histórico por Carro", roles: ["ADMIN"] },
      { to: "/catracas/diario", label: "Diário de Bordo (PDF)", roles: ["ADMIN"] },
    ]
  },
  { to: "/abastecimento", label: "Leitura de Tanques", icon: Gauge, roles: ["ADMIN", "tanque", "COLABORADOR"] },
  { to: "/abastecimento-carro", label: "Abastecimento por Carro", icon: Fuel, roles: ["ADMIN", "abastecimento", "COLABORADOR"] },
  { to: "/soltura", label: "Soltura", icon: Bus, roles: ["ADMIN", "soltura", "COLABORADOR"] },
  { to: "/controle-operacional", label: "Controle Operacional", icon: Radio, roles: ["ADMIN", "operacional", "COLABORADOR"] },
];


const adminItems = [
  { to: "/admin/usuarios", label: "Usuários", icon: Users, roles: ["ADMIN"] },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return "light"; // Default to light mode
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  // Fechar o menu ao clicar fora dele
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    if (!navigator.onLine) {
      toast.warning("Não é possível sair em modo offline. Você precisa de internet para entrar novamente.");
      return;
    }
    logout();
    navigate("/");
  };

  const handleItemClick = () => {
    setSidebarOpen(false);
  };

  const hasPermission = (to: string, roles: string[]) => {
    if (user?.role === "ADMIN") return true;

    if (user?.groups && user.groups.length > 0) {
      const normalizedTo = to.startsWith("/catracas") ? "/catracas" : to;
      return user.groups.some(g => {
        const perms = Array.isArray(g.permissions) ? g.permissions : [];
        return perms.some(p => {
          const clean = p.split("?")[0];
          return normalizedTo === clean || normalizedTo.startsWith(clean + "/") || clean.startsWith(normalizedTo + "/");
        });
      });
    }

    return roles.includes(user?.role ?? "");
  };

  // Filtra itens principais e seus filhos com base nas permissões
  const filterNavItems = (items: any[]) => {
    return items
      .filter((item) => hasPermission(item.to, item.roles))
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: item.children.filter((child: any) => hasPermission(child.to, child.roles)),
          };
        }
        return item;
      });
  };

  const visibleNav = filterNavItems([...allNavItems, ...adminItems]);

  return (
    <div className="min-h-screen bg-muted/30">
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background transition-all duration-300",
          sidebarOpen ? "w-64 shadow-xl" : "w-12 md:w-16 shadow-none"
        )}
      >
        <div 
          className={cn("flex h-14 items-center border-b cursor-pointer transition-all", sidebarOpen ? "px-4" : "justify-center px-1")}
          onClick={() => { if (!sidebarOpen) setSidebarOpen(true); }}
        >
          {sidebarOpen ? (
            <Bus className="shrink-0 transition-all text-primary h-6 w-6" />
          ) : (
            <ChevronRight className="shrink-0 transition-all text-primary h-5 w-5 md:h-6 md:w-6" />
          )}
          {sidebarOpen ? (
            <>
              <span className="ml-3 font-semibold truncate">Sistema Garagem</span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8"
                onClick={(e) => { e.stopPropagation(); setSidebarOpen(false); }}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
            </>
          ) : null}
        </div>

        <nav className={cn("flex-1 space-y-1 overflow-y-auto", sidebarOpen ? "p-2" : "p-1 md:p-2")}>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isParentActive = item.to !== "/home" && location.pathname.startsWith(item.to);
            const active = location.pathname === item.to || (item.to === "/catracas" && isParentActive);
            const hasChildren = !!item.children && item.children.length > 0;
            const isOpen = openSubMenus[item.to] ?? isParentActive;

            const handleToggle = (e: React.MouseEvent) => {
              if (hasChildren) {
                e.preventDefault();
                if (!sidebarOpen) {
                  setSidebarOpen(true);
                  setOpenSubMenus((prev) => ({
                    ...prev,
                    [item.to]: true,
                  }));
                } else {
                  setOpenSubMenus((prev) => ({
                    ...prev,
                    [item.to]: !isOpen,
                  }));
                }
              }
            };

            const ItemComponent = hasChildren ? "button" : Link;
            const componentProps = hasChildren
              ? { type: "button" as const, onClick: handleToggle }
              : { to: item.to, onClick: handleItemClick };

            return (
              <div key={item.to} className="space-y-1">
                {/* @ts-ignore */}
                <ItemComponent
                  {...componentProps}
                  className={cn(
                    "flex items-center rounded-lg transition-colors w-full",
                    sidebarOpen ? "gap-3 px-3 py-2 text-sm text-left" : "justify-center p-2 text-center",
                    active
                      ? "bg-primary text-primary-foreground font-medium"
                      : isParentActive
                        ? "bg-accent/60 text-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className={cn("shrink-0 transition-all", sidebarOpen ? "h-5 w-5" : "h-4.5 w-4.5 md:h-5 md:w-5")} />
                  {sidebarOpen && <span>{item.label}</span>}
                  {hasChildren && sidebarOpen && (
                    <ChevronRight
                      className={cn(
                        "ml-auto h-4 w-4 transition-transform duration-200",
                        isOpen && "rotate-90"
                      )}
                    />
                  )}
                </ItemComponent>

                {/* Renderizar sub-itens se o menu tiver filhos e a sidebar estiver aberta */}
                {hasChildren && isOpen && sidebarOpen && (
                  <div className="pl-2 border-l ml-5 py-0.5 space-y-1 border-muted animate-in slide-in-from-top-1 duration-150">
                    {item.children.map((subItem: any) => {
                      const subActive = location.pathname === subItem.to;
                      return (
                        <Link
                          key={subItem.to}
                          to={subItem.to}
                          onClick={handleItemClick}
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

        <div className={cn("border-t transition-all", sidebarOpen ? "p-2" : "p-1 md:p-2")}>
          {sidebarOpen && user && (
            <div className="px-3 py-2 text-sm">
              <p className="font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{roleLabels[user.role]}</p>
            </div>
          )}

          <Button
            variant="ghost"
            className={cn(
              "w-full text-muted-foreground mb-1",
              sidebarOpen ? "justify-start gap-3" : "justify-center p-2"
            )}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <>
                <Sun className={cn("shrink-0 text-amber-500 transition-all", sidebarOpen ? "h-5 w-5" : "h-4.5 w-4.5 md:h-5 md:w-5")} />
                {sidebarOpen && <span>Tema Claro</span>}
              </>
            ) : (
              <>
                <Moon className={cn("shrink-0 text-indigo-500 transition-all", sidebarOpen ? "h-5 w-5" : "h-4.5 w-4.5 md:h-5 md:w-5")} />
                {sidebarOpen && <span>Tema Escuro</span>}
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            className={cn(
              "w-full text-muted-foreground",
              sidebarOpen ? "justify-start gap-3" : "justify-center p-2"
            )}
            onClick={handleLogout}
          >
            <LogOut className={cn("shrink-0 transition-all", sidebarOpen ? "h-5 w-5" : "h-4.5 w-4.5 md:h-5 md:w-5")} />
            {sidebarOpen && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      <main className="transition-all duration-300 ml-12 md:ml-16">
        <div className="container py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
