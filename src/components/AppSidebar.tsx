import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Plus, Kanban, Users, DollarSign,
  UserCircle, LogOut, Network, UsersRound,
} from "lucide-react";

// ─── Links por cargo ──────────────────────────────────────────────────────────

const LINKS = {
  admin: [
    { to: "/admin/pipeline",    label: "Pipeline",        icon: Kanban },
    { to: "/novo-lead",         label: "Novo Lead",       icon: Plus },
    { to: "/admin/conectores",  label: "Conectores",      icon: Users },
    { to: "/admin/comissoes",   label: "Comissões",       icon: DollarSign },
    { to: "/equipe",            label: "Minha Equipe",    icon: UsersRound },
    { to: "/lideres",           label: "Meus Líderes",    icon: Network },
    { to: "/candidato",         label: "Área Candidato",  icon: UserCircle },
  ],
  estrategista: [
    { to: "/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
    { to: "/novo-lead",   label: "Novo Lead",    icon: Plus },
    { to: "/equipe",      label: "Minha Equipe", icon: UsersRound },
    { to: "/lideres",     label: "Meus Líderes", icon: Network },
    { to: "/candidato",   label: "Área do Candidato", icon: UserCircle },
  ],
  lider: [
    { to: "/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
    { to: "/novo-lead",   label: "Novo Lead",    icon: Plus },
    { to: "/equipe",      label: "Minha Equipe", icon: UsersRound },
    { to: "/candidato",   label: "Área do Candidato", icon: UserCircle },
  ],
  conector: [
    { to: "/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
    { to: "/novo-lead",   label: "Novo Lead",    icon: Plus },
    { to: "/candidato",   label: "Área do Candidato", icon: UserCircle },
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
  const { profile, role } = useAuth();

  const links = LINKS[role as keyof typeof LINKS] ?? LINKS.conector;

  return (
    <aside className="w-60 min-h-screen bg-background border-r border-border flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <p className="text-[9px] font-bold tracking-[3px] uppercase text-primary mb-0.5">Programa</p>
        <h1 className="text-lg font-bold text-foreground tracking-wide">BRIDGES</h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        <ul className="space-y-0.5 px-3">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
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
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        {profile && (
          <div className="px-3 py-2.5 rounded-md bg-surface/50 border border-border/50">
            <p className="text-sm font-medium text-foreground truncate">
              {profile.nome || profile.email}
            </p>
            <p className="text-xs text-primary mt-0.5">
              {ROLE_LABEL[role ?? "conector"] ?? role}
            </p>
          </div>
        )}
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors px-3 py-1.5 w-full rounded hover:bg-surface/50"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
