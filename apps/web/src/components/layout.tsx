import { operationPageAccess } from '@/lib/operationalAccess';
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, roleLabels } from "@/stores/auth";
import {
  Fuel,
  Bus,
  Users,
  LogOut,
  ChevronRight,
  LayoutGrid,
  ClipboardCheck,
  Radio,
  Sun,
  Moon,
  Menu,
  X,
  Building2,
  ChevronDown,
  Bell,
  Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const navItems: NavItem[] = [
  {
    to: "/home",
    label: "Início",
    icon: LayoutGrid,
    roles: ["ADMIN", "COLABORADOR", "tanque", "abastecimento", "operacional"]
  },
  {
    to: "/abastecimento",
    label: "Abastecimento",
    icon: Fuel,
    roles: ["ADMIN", "abastecimento", "tanque", "COLABORADOR"],
    children: [
      { to: "/abastecimento-carro", label: "Abastecimento Por Carro", roles: ["ADMIN", "abastecimento", "COLABORADOR"] },
      { to: "/abastecimento", label: "Leitura de Tanques", roles: ["ADMIN", "tanque", "COLABORADOR"] }
    ]
  },
  {
    to: "/bilhetagem",
    label: "Bilhetagem",
    icon: ClipboardCheck,
    roles: ["ADMIN"],
    children: [
      { to: "/catracas", label: "Conferência de Catraca", roles: ["ADMIN"] }
    ]
  },
  {
    to: "/portaria",
    label: "Portaria",
    icon: Bus,
    roles: ["ADMIN", "soltura", "COLABORADOR"],
    children: [
      { to: "/trafego/alterar-escalas-solturas", label: "Editar Escalas e Solturas", roles: ["ADMIN", "soltura"] },
      { to: "/soltura", label: "Solturas", roles: ["ADMIN", "soltura", "COLABORADOR"] },
      { to: "/escala-carros/alterar-carro-programado", label: "Escala de Carros", roles: ["ADMIN", "COLABORADOR"] }
    ]
  },
  {
    to: "/manutencao",
    label: "Manutenção",
    icon: Wrench,
    roles: ["ADMIN", "COLABORADOR", "manutencao"],
    children: [
      {
        to: "/manutencao",
        label: "Controle de Manutenção",
        roles: ["ADMIN", "COLABORADOR", "manutencao"]
      },
      {
        to: "/manutencao/ci-manutencao",
        label: "CI Manutenção",
        roles: ["ADMIN", "COLABORADOR", "manutencao"]
      }
    ]
  },
  {
    to: "/operacao",
    label: "Operação",
    icon: Radio,
    roles: ["ADMIN", "operacional", "COLABORADOR"],
    children: [
      { to: "/controle-operacional", label: "Controle Operacional", roles: ["ADMIN", "operacional", "COLABORADOR"] }
    ]
  },
  {
    to: "/admin/usuarios",
    label: "Usuários",
    icon: Users,
    roles: ["ADMIN"]
  },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  useEffect(() => {
    if (sidebarCollapsed) return;
    const closeOutside = (event: PointerEvent) => {
      if (!window.matchMedia('(min-width: 768px)').matches) return;
      if (event.target instanceof Element && !event.target.closest('[data-desktop-sidebar], [data-sidebar-toggle]')) {
        setSidebarCollapsed(true);
      }
    };
    document.addEventListener('pointerdown', closeOutside, true);
    return () => document.removeEventListener('pointerdown', closeOutside, true);
  }, [sidebarCollapsed]);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    "/abastecimento": true,
    "/bilhetagem": true,
    "/operacao": true,
    "/portaria": true,
    "/manutencao": true,
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

  const closeNavigation = () => {
    setSidebarCollapsed(true);
    setMobileMenuOpen(false);
  };

  // Inclui navegacao programatica e voltar/avancar do navegador.
  useEffect(() => {
    setSidebarCollapsed(true);
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
    if (to === "/catracas" || to.startsWith("/catracas/")) {
      return user?.role === "ADMIN";
    }

    if (user?.role === "ADMIN") return true;

    const operational = operationPageAccess(user, to);
    if (operational !== undefined) return operational;

    if (user?.groups && user.groups.length > 0) {
      // Normalização com prefixos mais específicos primeiro para não haver colisão (ex: /soltura-adm antes de /soltura)
      const normalizedTo = to.startsWith("/catracas") ? "/catracas" 
        : to.startsWith("/soltura-adm") ? "/soltura-adm"
        : to.startsWith("/escala-carros") ? "/escala-carros"
        : to.startsWith("/manutencao") || to.startsWith("/ci-manutencao") || to.startsWith("/soltura/ci-manutencao") ? "/manutencao"
        : to.startsWith("/soltura") ? "/soltura" 
        : to;

      return user.groups.some(g => {
        const perms = Array.isArray(g.permissions) ? g.permissions : [];
        return perms.some(p => {
          const clean = p.split("?")[0];
          // Retrocompatibilidade caso o grupo tenha /soltura ou /manutencao ou /ci-manutencao
          if (normalizedTo === "/manutencao" && (clean === "/manutencao" || clean === "/ci-manutencao" || clean === "/soltura" || clean === "/soltura/ci-manutencao")) {
            return true;
          }
          if (normalizedTo === "/soltura-adm" && (clean === "/soltura-adm" || clean === "/soltura" || clean === "/soltura/alterar-folha")) {
            return true;
          }
          if (normalizedTo === "/escala-carros" && (clean === "/escala-carros" || clean === "/alterar-carro-programado" || clean === "/escala-carros/alterar-carro-programado" || clean === "/soltura")) {
            return true;
          }
          return normalizedTo === clean || normalizedTo.startsWith(clean + "/") || clean.startsWith(normalizedTo + "/");
        });
      });
    }

    return roles.includes(user?.role ?? "");
  };

  const filterNavItems = (items: NavItem[]) => {
    return items
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: item.children.filter((child) => hasPermission(child.to, child.roles)),
          };
        }
        return item;
      })
      .filter(item => item.children ? Boolean(item.children.length) : hasPermission(item.to, item.roles));
  };

  const visibleNav = filterNavItems(navItems);

  const getActiveTitle = () => {
    if (location.pathname.startsWith("/trafego")) return "Portaria - Editar Escalas e Solturas";
    if (location.pathname.startsWith("/home")) return "Início";
    if (location.pathname.startsWith("/catracas/consistencia")) return "Catracas - Consistência Diária";
    if (location.pathname.startsWith("/catracas/alertas")) return "Catracas - Datas Incorretas";
    if (location.pathname.startsWith("/catracas/backup")) return "Catracas - Backup de Coletas";
    if (location.pathname.startsWith("/catracas/diario")) return "Catracas - Diário de Bordo";
    if (location.pathname.startsWith("/catracas")) return "Conferência Catracas";
    if (location.pathname.startsWith("/abastecimento-carro")) return "Abastecimento por Carro";
    if (location.pathname.startsWith("/abastecimento")) return "Leitura de Tanques";
    if (location.pathname === "/manutencao") return "Manutenção - Controle de Manutenção";
    if (location.pathname.startsWith("/manutencao") || location.pathname.startsWith("/ci-manutencao") || location.pathname.startsWith("/soltura/ci-manutencao")) return "Manutenção - CI Manutenção";
    if (location.pathname.startsWith("/soltura/alterar-folha") || location.pathname.startsWith("/soltura-adm") || location.pathname.startsWith("/alterar-folha")) return "Portaria - Editar Escalas e Solturas";
    if (location.pathname.startsWith("/escala-carros") || location.pathname.startsWith("/soltura/alterar-carro-programado") || location.pathname.startsWith("/alterar-carro-programado") || location.pathname.startsWith("/soltura/carro-realizado")) return "Portaria - Escala de Carros";
    if (location.pathname.startsWith("/soltura/historico")) return "Soltura - Histórico de Soltura";
    if (location.pathname.startsWith("/soltura")) return "Portaria - Solturas";
    if (location.pathname.startsWith("/controle-operacional")) return "Controle Operacional";
    if (location.pathname.startsWith("/admin/usuarios")) return "Usuários";
    return "Sistema Garagem";
  };

  return (
    <div className="h-screen print:h-auto print:overflow-visible bg-[#F4F5F7] dark:bg-[#070A11] text-foreground flex flex-col md:flex-row font-sans selection:bg-emerald-500/20 overflow-hidden">
      {/* Mobile Top Header */}
      <header className="md:hidden shrink-0 print:hidden sticky top-0 z-40 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur border-b border-slate-200/80 dark:border-slate-800/80 px-4 h-15 flex items-center justify-between shadow-xs">
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
            <div className="w-8 h-8 rounded-xl bg-[#164E3A] dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              G
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Sistema Garagem</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.garagem && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
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
          "md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-[#0B0F19] border-r border-slate-200 dark:border-slate-800/80 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 px-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#164E3A] dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
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
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#164E3A] dark:bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="truncate">{roleLabels[user.role] || user.role}</span>
                {user.garagem && (
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                    {user.garagem}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isParentActive = item.to !== "/home" && (
              location.pathname === item.to || 
              location.pathname.startsWith(item.to + "/") ||
              (!!item.children && item.children.some(c => location.pathname === c.to || location.pathname.startsWith(c.to + "/")))
            );
            const active = location.pathname === item.to || isParentActive;
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
                      "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-[background-color,box-shadow]",
                      active
                        ? "bg-[#164E3A] text-white hover:text-white focus:text-white active:text-white dark:text-white dark:bg-emerald-600 shadow-xs font-semibold"
                        : isParentActive
                          ? "bg-slate-100 text-slate-900 dark:bg-slate-800/80 dark:text-emerald-300 font-semibold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
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
                    onClick={closeNavigation}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-[background-color,box-shadow]",
                      active
                        ? "bg-[#164E3A] text-white hover:text-white focus:text-white active:text-white dark:text-white dark:bg-emerald-600 shadow-xs font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )}

                {hasChildren && isOpen && (
                  <div className="ml-6 pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-1 my-1 animate-in slide-in-from-top-1 duration-150">
                    {item.children?.map((subItem) => {
                      const subActive = location.pathname === subItem.to;
                      return (
                        <Link
                          key={subItem.to}
                          to={subItem.to}
                          onClick={closeNavigation}
                          className={cn(
                            "flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-[background-color,box-shadow]",
                            subActive
                              ? "bg-[#164E3A] text-white hover:text-white focus:text-white active:text-white dark:text-white dark:bg-emerald-600 font-semibold shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
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
        </nav>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800/60 space-y-1">
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

      {/* Desktop Persistent Sidebar */}
      <aside
        data-desktop-sidebar
        id="desktop-navigation"
        className={cn(
          "hidden md:flex print:hidden flex-col overflow-hidden border-r border-slate-200/80 dark:border-slate-800/70 bg-[#FAFAFB] dark:bg-[#0B0F19] h-[calc(100dvh-4rem)] fixed left-0 top-16 transition-[width] duration-300 z-30 shadow-xs",
          sidebarCollapsed ? "w-14" : "w-64"
        )}
      >
        {/* Navigation items */}
        <nav className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1.5",
          sidebarCollapsed ? "w-14 flex flex-col items-start" : "w-64"
        )}>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isParentActive = item.to !== "/home" && (
              location.pathname === item.to || 
              location.pathname.startsWith(item.to + "/") ||
              (!!item.children && item.children.some(c => location.pathname === c.to || location.pathname.startsWith(c.to + "/")))
            );
            const active = location.pathname === item.to || isParentActive;
            const hasChildren = !!item.children && item.children.length > 0;
            const isOpen = openSubMenus[item.to] ?? isParentActive;

            const handleToggle = (e: React.MouseEvent) => {
              if (hasChildren) {
                e.preventDefault();
                setOpenSubMenus((prev) => ({ ...prev, [item.to]: !isOpen }));
              }
            };

            if (sidebarCollapsed) {
              const iconClassName = cn(
                "w-10 h-10 flex items-center justify-center rounded-xl transition-[background-color,box-shadow] group shrink-0",
                active
                  ? "bg-[#164E3A] text-white hover:text-white focus:text-white active:text-white dark:text-white dark:bg-emerald-600 shadow-xs font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
              );
              if (hasChildren) {
                return <button key={item.to} type="button" className={iconClassName}
                  title={item.label} aria-label={item.label} aria-expanded={false}
                  onClick={() => {
                    setOpenSubMenus(prev => ({ ...prev, [item.to]: true }));
                    setSidebarCollapsed(false);
                  }}>
                  <Icon className="h-5 w-5 shrink-0" />
                </button>;
              }
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeNavigation}
                  className={iconClassName}
                  title={item.label}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                </Link>
              );
            }

            return (
              <div key={item.to} className="space-y-1">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={handleToggle}
                    aria-expanded={isOpen}
                    className={cn(
                      "flex items-center justify-between w-full px-2.5 py-2.5 rounded-xl text-sm font-medium transition-[background-color,box-shadow] group",
                      active
                        ? "bg-[#164E3A] text-white hover:text-white focus:text-white active:text-white dark:text-white dark:bg-emerald-600 shadow-xs font-semibold"
                        : isParentActive
                          ? "bg-slate-100 text-slate-900 dark:bg-slate-800/80 dark:text-emerald-300 font-semibold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        active ? "text-white" : isOpen ? "text-slate-600 dark:text-slate-200" : "text-slate-400",
                        isOpen && "rotate-90"
                      )}
                    />
                  </button>
                ) : (
                  <Link
                    to={item.to}
                    onClick={closeNavigation}
                    className={cn(
                      "flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-[background-color,box-shadow] group",
                      active
                        ? "bg-[#164E3A] text-white hover:text-white focus:text-white active:text-white dark:text-white dark:bg-emerald-600 shadow-xs font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )}

                {/* Submenu for desktop */}
                {hasChildren && isOpen && (
                  <div className="ml-6 pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-1 my-1 animate-in slide-in-from-top-1 duration-150">
                    {item.children?.map((subItem) => {
                      const subActive = location.pathname === subItem.to;
                      return (
                        <Link
                          key={subItem.to}
                          to={subItem.to}
                          onClick={closeNavigation}
                          className={cn(
                            "flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-[background-color,box-shadow]",
                            subActive
                              ? "bg-[#164E3A] text-white hover:text-white focus:text-white active:text-white dark:text-white dark:bg-emerald-600 font-semibold shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
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
        </nav>

        {/* User Card & Controls at Bottom */}
        <div className={cn(
          "border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#090D16]",
          sidebarCollapsed ? "p-2 flex flex-col items-center gap-1.5" : "p-2.5 space-y-1"
        )}>
          {user && !sidebarCollapsed && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-slate-800/80 mb-1 flex items-center gap-2.5 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-[#164E3A] dark:bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="truncate">{roleLabels[user.role] || user.role}</span>
                  {user.garagem && (
                    <span className="bg-emerald-100 text-emerald-800 dark:bg-slate-800 dark:text-emerald-300 px-1 py-0.2 rounded font-semibold text-[10px]">
                      {user.garagem}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={cn("flex items-center", sidebarCollapsed ? "flex-col gap-1.5 w-full" : "gap-1")}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg",
                sidebarCollapsed ? "w-10 h-10 p-0 justify-center" : "flex-1 justify-start gap-2 text-xs"
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
                sidebarCollapsed ? "w-10 h-10 p-0 justify-center" : "justify-center px-2.5 text-xs"
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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden print:h-auto print:overflow-visible">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex print:hidden h-16 shrink-0 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md px-4 gap-4 items-center justify-between sticky top-0 z-40 shadow-2xs">
          <div className="flex min-w-0 items-center">
            <div className="flex w-60 shrink-0 items-center gap-3">
            <Button data-sidebar-toggle variant="ghost" size="icon" className="-ml-1.5 mr-1.5 h-9 w-9 shrink-0 rounded-lg text-slate-700 dark:text-slate-200"
              onClick={() => setSidebarCollapsed(value => !value)} aria-controls="desktop-navigation" aria-expanded={!sidebarCollapsed}
              aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'} title={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}>
              <Menu aria-hidden="true" className="h-5 w-5" />
            </Button>
            <div className="flex shrink-0 items-center gap-2.5">
              <Bus aria-hidden="true" className="h-5 w-5 text-slate-900 dark:text-white" />
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Sistema Garagem</span>
            </div>
            </div>
            <div className="min-w-0 border-l border-slate-200 pl-4 dark:border-slate-800">
              <h1 className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">{getActiveTitle()}</h1>
            </div>
          </div>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Online/Offline status badge */}
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
              isOnline
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40"
            )}>
              <span className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              )} />
              <span>{isOnline ? "Online" : "Offline"}</span>
            </div>

            {/* Garage Tag */}
            {user?.garagem && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#164E3A]/10 text-[#164E3A] dark:bg-slate-800 dark:text-emerald-300 border border-[#164E3A]/20 dark:border-slate-700">
                <Building2 className="w-3.5 h-3.5" />
                <span>Garagem {user.garagem}</span>
              </div>
            )}

            {/* Notification Bell */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full relative text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              title="Notificações operacionais"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0B0F19]" />
            </Button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 md:ml-14 print:ml-0 p-3 sm:p-5 lg:p-6 overflow-y-auto print:p-0 print:m-0 print:overflow-visible">
          <div className="max-w-7xl mx-auto w-full print:max-w-none print:w-full print:m-0 print:p-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
