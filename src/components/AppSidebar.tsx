import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Plus, Kanban, Users, DollarSign,
  LogOut, Network, UsersRound, GraduationCap, ChevronRight, List,
} from "lucide-react";

// ─── Links por cargo ──────────────────────────────────────────────────────────

const LINKS = {
  admin: [
    { to: "/admin/pipeline",   label: "Pipeline",      icon: Kanban },
    { to: "/dashboard",        label: "Dashboard",     icon: LayoutDashboard },
    { to: "/novo-lead",        label: "Novo Lead",     icon: Plus },
    { to: "/admin/leads",      label: "Leads",         icon: List },
    { to: "/admin/conectores", label: "Conectores",    icon: Users },
    { to: "/admin/comissoes",  label: "Comissões",     icon: DollarSign },
    { to: "/equipe",           label: "Minha Equipe",  icon: UsersRound },
    { to: "/lideres",          label: "Meus Líderes",  icon: Network },
    { to: "/academy",          label: "Academy",       icon: GraduationCap },
  ],
  estrategista: [
    { to: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard },
    { to: "/novo-lead",  label: "Novo Lead",    icon: Plus },
    { to: "/equipe",     label: "Minha Equipe", icon: UsersRound },
    { to: "/lideres",    label: "Meus Líderes", icon: Network },
    { to: "/academy",    label: "Academy",      icon: GraduationCap },
  ],
  lider: [
    { to: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard },
    { to: "/novo-lead",  label: "Novo Lead",    icon: Plus },
    { to: "/equipe",     label: "Minha Equipe", icon: UsersRound },
    { to: "/academy",    label: "Academy",      icon: GraduationCap },
  ],
  conector: [
    { to: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard },
    { to: "/novo-lead",  label: "Novo Lead",    icon: Plus },
    { to: "/academy",    label: "Academy",      icon: GraduationCap },
  ],
};

const ROLE_LABEL: Record<string, string> = {
  admin:        "Administrador",
  estrategista: "Estrategista de Rede",
  lider:        "Líder de Conexão",
  conector:     "Conector",
};

// ─── Componente ───────────────────────────────────────────────────────────────

const AppSidebar = ({ onSignOut }: { onSignOut: () => void }) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { profile, role } = useAuth();

  const links = LINKS[role as keyof typeof LINKS] ?? LINKS.conector;

  return (
    <aside className="w-60 min-h-screen bg-background border-r border-border flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <p className="text-[9px] font-bold tracking-[3px] uppercase text-primary/60 mb-0.5">Programa</p>
        <h1 className="text-lg font-bold text-foreground tracking-wide">BRIDGES</h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-3">
          {links.map((link) => {
            const isActive = location.pathname === link.to ||
              (link.to !== "/" && location.pathname.startsWith(link.to) && link.to.length > 1);
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors border-l-2 ${
                    isActive
                      ? "text-foreground border-primary bg-surface font-medium"
                      : "text-foreground/55 hover:text-foreground hover:bg-surface/50 border-transparent"
                  }`}
                >
                  <link.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                  {link.label}
                  {/* Badge especial para Academy */}
                  {link.to === "/academy" && (
                    <span className="ml-auto text-[9px] font-bold tracking-wider text-primary/50 uppercase">novo</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer — perfil clicável + logout */}
      <div className="p-4 border-t border-border space-y-2">
        {profile && (
          <button
            onClick={() => navigate("/perfil")}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md transition-all group border ${
              location.pathname === "/perfil"
                ? "bg-surface border-primary/30"
                : "bg-surface/50 border-border/50 hover:border-primary/20 hover:bg-surface"
            }`}
          >
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-foreground truncate">
                {profile.nome?.split(" ")[0] || profile.email}
              </p>
              <p className={`text-xs mt-0.5 transition-colors ${
                location.pathname === "/perfil"
                  ? "text-primary"
                  : "text-foreground/40 group-hover:text-primary/60"
              }`}>
                Ver meu perfil
              </p>
            </div>
            <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 transition-colors ${
              location.pathname === "/perfil" ? "text-primary" : "text-foreground/25 group-hover:text-foreground/50"
            }`} />
          </button>
        )}
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 text-sm text-foreground/40 hover:text-foreground transition-colors px-3 py-1.5 w-full rounded hover:bg-surface/50"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
