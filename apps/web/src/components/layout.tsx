import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, roleLabels } from "@/stores/auth";
import { 
  Fuel, 
  Bus, 
  Users, 
  LogOut, 
  ChevronRight, 
  LayoutDashboard, 
  ClipboardCheck, 
  Radio, 
  Sun, 
  Moon, 
  Gauge,
  Menu,
  X,
  Building2,
  ChevronDown,
  Search,
  Bell,
  Calendar,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface NavChild {
  to: string;
  label: string;
  roles: string[];
}

interface NavItem {
  to: string;
  label: string;
  icon: any;
  roles: string[];
  badge?: string;
  children?: NavChild[];
}

const mainNavItems: NavItem[] = [
  { 
    to: "/home", 
    label: "Dashboard", 
    icon: LayoutDashboard, 
    roles: ["ADMIN", "COLABORADOR", "tanque", "abastecimento", "soltura", "operacional"] 
  },
  {
    to: "/catracas",
    label: "Catracas & Bilhetagem",
    icon: ClipboardCheck,
    roles: ["ADMIN"],
    children: [
      { to: "/catracas/consistencia", label: "Consistência Diária", roles: ["ADMIN"] },
      { to: "/catracas/alertas", label: "Datas Incorretas", roles: ["ADMIN"] },
      { to: "/catracas/backup", label: "Backup de Coletas", roles: ["ADMIN"] },
      { to: "/catracas/diario", label: "Diário de Bordo (PDF)", roles: ["ADMIN"] },
    ]
  },
  { 
    to: "/abastecimento", 
    label: "Leitura de Tanques", 
    icon: Gauge, 
    roles: ["ADMIN", "tanque", "COLABORADOR"] 
  },
  { 
    to: "/abastecimento-carro", 
    label: "Abastecimento Pista", 
    icon: Fuel, 
    roles: ["ADMIN", "abastecimento", "COLABORADOR"] 
  },
  { 
    to: "/soltura", 
    label: "Soltura de Frota", 
    icon: Bus, 
    roles: ["ADMIN", "soltura", "COLABORADOR"],
    children: [
      { to: "/soltura", label: "Folha de Soltura", roles: ["ADMIN", "soltura", "COLABORADOR"] },
      { to: "/soltura/ci-manutencao", label: "CI Manutenção", roles: ["ADMIN", "soltura", "COLABORADOR"] },
      { to: "/soltura/carro-realizado", label: "Carro Realiz. (P)", roles: ["ADMIN", "soltura", "COLABORADOR"] },
    ]
  },
  { 
    to: "/controle-operacional", 
    label: "Controle Operacional", 
    icon: Radio, 
    roles: ["ADMIN", "operacional", "COLABORADOR"] 
  },
];

const adminItems: NavItem[] = [
  { 
    to: "/admin/usuarios", 
    label: "Gestão de Usuários", 
    icon: Users, 
    roles: ["ADMIN"] 
  },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    "/catracas": true,
    "/soltura": true,
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return "light";
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Conexão restabelecida. Modo Online ativo.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Você está trabalhando em Modo Offline (Cache Seguro)");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    if (!navigator.onLine) {
      toast.warning("Não é possível sair em modo offline. Você precisa de internet para entrar novamente.");
      return;
    }
    logout();
    navigate("/");
  };

  const hasPermission = (to: string, roles: string[]) => {
    if (user?.role === "ADMIN") return true;

    if (user?.groups && user.groups.length > 0) {
      const normalizedTo = to.startsWith("/catracas") ? "/catracas" : to.startsWith("/soltura") ? "/soltura" : to;
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

  const filterNavItems = (items: NavItem[]) => {
    return items
      .filter((item) => hasPermission(item.to, item.roles))
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: item.children.filter((child) => hasPermission(child.to, child.roles)),
          };
        }
        return item;
      });
  };

  const visibleMain = filterNavItems(mainNavItems);
  const visibleAdmin = filterNavItems(adminItems);

  const getActiveTitle = () => {
    if (location.pathname.startsWith("/home")) return "Dashboard Operacional";
    if (location.pathname.startsWith("/catracas/consistencia")) return "Catracas - Consistência Diária";
    if (location.pathname.startsWith("/catracas/alertas")) return "Catracas - Datas Incorretas";
    if (location.pathname.startsWith("/catracas/backup")) return "Catracas - Backup de Coletas";
    if (location.pathname.startsWith("/catracas/diario")) return "Catracas - Diário de Bordo";
    if (location.pathname.startsWith("/catracas")) return "Conferência de Catracas";
    if (location.pathname.startsWith("/abastecimento-carro")) return "Abastecimento de Pista";
    if (location.pathname.startsWith("/abastecimento")) return "Medição de Tanques";
    if (location.pathname.startsWith("/soltura/ci-manutencao")) return "Soltura - Alimentar CI Manutenção";
    if (location.pathname.startsWith("/soltura/carro-realizado")) return "Soltura - Alimentar Carro Realiz. (P)";
    if (location.pathname.startsWith("/soltura")) return "Soltura de Frota";
    if (location.pathname.startsWith("/controle-operacional")) return "Controle Operacional";
    if (location.pathname.startsWith("/admin/usuarios")) return "Gestão de Usuários";
    return "Sistema Garagem";
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0C120F] text-foreground flex flex-col md:flex-row font-sans selection:bg-[#154D34]/20">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 dark:bg-[#121A15]/95 backdrop-blur border-b border-slate-200/80 dark:border-emerald-950/60 px-4 h-15 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 -ml-1 text-slate-700 dark:text-slate-200"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#154D34] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              G
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Sistema Garagem</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.garagem && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
              {user.garagem}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </Button>
        </div>
      </header>

      {/* Mobile Navigation Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-[#121A15] border-r border-slate-200 dark:border-emerald-950/60 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 px-4 border-b border-slate-100 dark:border-emerald-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#154D34] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              G
            </div>
            <span className="font-bold text-base text-slate-900 dark:text-white">Sistema Garagem</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User Card in Mobile Drawer */}
        {user && (
          <div className="p-3.5 border-b border-slate-100 dark:border-emerald-950/50 bg-slate-50/70 dark:bg-emerald-950/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#154D34] text-white font-bold flex items-center justify-center text-sm shrink-0">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="truncate">{roleLabels[user.role] || user.role}</span>
                {user.garagem && (
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                    {user.garagem}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Menu Principal
          </p>
          {visibleMain.map((item) => {
            const Icon = item.icon;
            const isParentActive = item.to !== "/home" && location.pathname.startsWith(item.to);
            const active = location.pathname === item.to || (item.to === "/catracas" && isParentActive);
            const hasChildren = !!item.children && item.children.length > 0;
            const isOpen = openSubMenus[item.to] ?? isParentActive;

            const handleToggle = (e: React.MouseEvent) => {
              if (hasChildren) {
                e.preventDefault();
                setOpenSubMenus((prev) => ({ ...prev, [item.to]: !isOpen }));
              }
            };

            return (
              <div key={item.to} className="space-y-1">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={handleToggle}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-[#154D34] text-white shadow-xs font-semibold"
                        : isParentActive
                          ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 font-semibold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-950/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                ) : (
                  <Link
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-[#154D34] text-white shadow-xs font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-950/30"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )}

                {hasChildren && isOpen && (
                  <div className="pl-6 pr-2 space-y-1 pt-1 animate-in slide-in-from-top-1 duration-150">
                    {item.children?.map((subItem) => {
                      const subActive = location.pathname === subItem.to;
                      return (
                        <Link
                          key={subItem.to}
                          to={subItem.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                            subActive
                              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold"
                              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-emerald-950/30"
                          )}
                        >
                          <span>{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {visibleAdmin.length > 0 && (
            <>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-4 mb-2">
                Administração
              </p>
              {visibleAdmin.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-[#154D34] text-white shadow-xs font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-950/30"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-slate-100 dark:border-emerald-950/50 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive gap-2.5 h-10 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Sair do Sistema</span>
          </Button>
        </div>
      </div>

      {/* Desktop Persistent Sidebar (Donezo UI Inspired) */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-slate-200/80 dark:border-emerald-950/60 bg-[#FAFAFB] dark:bg-[#101713] h-screen sticky top-0 transition-all duration-300 z-30 shadow-xs",
          sidebarCollapsed ? "w-18" : "w-64"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-200/60 dark:border-emerald-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-[#154D34] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 tracking-wider">
              (G)
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                  Sistema Garagem
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Operações & Frota
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0 rounded-lg"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", !sidebarCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {!sidebarCollapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Menu Principal
            </p>
          )}

          {visibleMain.map((item) => {
            const Icon = item.icon;
            const isParentActive = item.to !== "/home" && location.pathname.startsWith(item.to);
            const active = location.pathname === item.to || (item.to === "/catracas" && isParentActive);
            const hasChildren = !!item.children && item.children.length > 0;
            const isOpen = openSubMenus[item.to] ?? isParentActive;

            const handleToggle = (e: React.MouseEvent) => {
              if (hasChildren) {
                e.preventDefault();
                if (sidebarCollapsed) {
                  setSidebarCollapsed(false);
                  setOpenSubMenus((prev) => ({ ...prev, [item.to]: true }));
                } else {
                  setOpenSubMenus((prev) => ({ ...prev, [item.to]: !isOpen }));
                }
              }
            };

            return (
              <div key={item.to} className="space-y-1">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={handleToggle}
                    className={cn(
                      "flex items-center w-full rounded-xl transition-all group relative",
                      sidebarCollapsed ? "justify-center p-2.5" : "justify-between px-3.5 py-2.5 text-sm font-medium",
                      active
                        ? "bg-[#154D34] text-white shadow-xs font-semibold"
                        : isParentActive
                          ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 font-semibold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-emerald-950/30 hover:text-slate-900"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <ChevronDown
                        className={cn("h-3.5 w-3.5 transition-transform duration-200 opacity-70", isOpen && "rotate-180")}
                      />
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center rounded-xl transition-all group relative",
                      sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5 text-sm font-medium",
                      active
                        ? "bg-[#154D34] text-white shadow-xs font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-emerald-950/30 hover:text-slate-900"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                )}

                {/* Submenu for desktop */}
                {hasChildren && isOpen && !sidebarCollapsed && (
                  <div className="pl-6 pr-1 space-y-1 pt-1 animate-in slide-in-from-top-1 duration-150">
                    {item.children?.map((subItem) => {
                      const subActive = location.pathname === subItem.to;
                      return (
                        <Link
                          key={subItem.to}
                          to={subItem.to}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            subActive
                              ? "bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold"
                              : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-emerald-950/20 hover:text-slate-800"
                          )}
                        >
                          <span className="truncate">{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {visibleAdmin.length > 0 && (
            <>
              {!sidebarCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-4 mb-1.5">
                  Administração
                </p>
              )}
              {visibleAdmin.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center rounded-xl transition-all group relative",
                      sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5 text-sm font-medium",
                      active
                        ? "bg-[#154D34] text-white shadow-xs font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-emerald-950/30 hover:text-slate-900"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </>
          )}

          {/* Offline / Mobile App Promotion Card (like Donezo UI bottom card) */}
          {!sidebarCollapsed && (
            <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-emerald-950/40">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/40">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 mb-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-xs font-bold">Modo PWA Offline</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  Operação garantida sem internet na pista e na garagem.
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-white/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                    100% Sincronizado
                  </span>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* User Card & Controls at Bottom */}
        <div className="border-t border-slate-200/80 dark:border-emerald-950/60 p-2.5 space-y-1 bg-white/50 dark:bg-[#0E1411]">
          {user && !sidebarCollapsed && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#141C17] border border-slate-200/80 dark:border-emerald-950/50 mb-1 flex items-center gap-2.5 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-[#154D34] text-white font-bold flex items-center justify-center text-xs shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="truncate">{roleLabels[user.role] || user.role}</span>
                  {user.garagem && (
                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1 py-0.2 rounded font-semibold text-[10px]">
                      {user.garagem}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg",
                sidebarCollapsed ? "w-full justify-center p-2" : "flex-1 justify-start gap-2 text-xs"
              )}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Alternar tema claro/escuro"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400 shrink-0" />
                  {!sidebarCollapsed && <span>Modo Claro</span>}
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-slate-600 shrink-0" />
                  {!sidebarCollapsed && <span>Modo Escuro</span>}
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg",
                sidebarCollapsed ? "w-full justify-center p-2 mt-1" : "justify-center px-2.5 text-xs"
              )}
              onClick={handleLogout}
              title="Sair do sistema"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span className="ml-1">Sair</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Top Header Bar (Donezo UI style with search bar and live badges) */}
        <header className="hidden md:flex h-16 border-b border-slate-200/80 dark:border-emerald-950/60 bg-white/90 dark:bg-[#101713]/90 backdrop-blur-md px-6 items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-4 min-w-0">
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {getActiveTitle()}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Garagem Operacional Integrada
              </p>
            </div>
          </div>

          {/* Center Search Input (Donezo style) */}
          <div className="hidden lg:flex items-center w-72 max-w-sm relative">
            <Search className="w-4 h-4 absolute left-3 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar no sistema..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-12 h-9 text-xs rounded-full bg-slate-100/80 dark:bg-emerald-950/30 border-slate-200 dark:border-emerald-900/40 focus-visible:ring-[#154D34]"
            />
            <kbd className="absolute right-3 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white dark:bg-emerald-950/60 rounded border border-slate-200 dark:border-emerald-900/50">
              ⌘K
            </kbd>
          </div>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live date badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100/80 dark:bg-emerald-950/30 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-emerald-900/30">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </span>
            </div>

            {/* Online/Offline status badge */}
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
              isOnline 
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50" 
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"
            )}>
              <span className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              )} />
              <span>{isOnline ? "Online" : "Offline"}</span>
            </div>

            {/* Garage Tag */}
            {user?.garagem && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#154D34]/10 text-[#154D34] dark:bg-emerald-950/60 dark:text-emerald-300 border border-[#154D34]/20">
                <Building2 className="w-3.5 h-3.5" />
                <span>Garagem {user.garagem}</span>
              </div>
            )}

            {/* Notification Bell */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full relative text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-950/40"
              title="Notificações operacionais"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#101713]" />
            </Button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
