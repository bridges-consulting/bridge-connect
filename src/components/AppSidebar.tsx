import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Plus,
  Kanban,
  Users,
  DollarSign,
  UserCircle,
  LogOut,
} from "lucide-react";

const connectorLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/novo-lead", label: "Novo Lead", icon: Plus },
  { to: "/candidato", label: "Área Candidato", icon: UserCircle },
];

const adminLinks = [
  { to: "/admin/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/novo-lead",      label: "Novo Lead", icon: Plus },
  { to: "/admin/conectores", label: "Conectores", icon: Users },
  { to: "/admin/comissoes",  label: "Comissões", icon: DollarSign },
];

interface AppSidebarProps {
  role: "admin" | "conector";
  onSignOut: () => void;
}

const AppSidebar = ({ role, onSignOut }: AppSidebarProps) => {
  const location = useLocation();
  const { profile } = useAuth();
  const links = role === "admin" ? adminLinks : connectorLinks;

  return (
    <aside className="w-60 min-h-screen bg-background border-r border-border flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-lg font-bold text-foreground tracking-wide">
          <span className="text-foreground/60">Programa</span> BRIDGES
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? "text-foreground border-l-2 border-primary bg-surface"
                      : "text-foreground/60 hover:text-foreground hover:bg-surface/50 border-l-2 border-transparent"
                  }`}
                  activeClassName=""
                >
                  <link.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                  {link.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer com perfil + logout */}
      <div className="p-4 border-t border-border space-y-3">
        {profile && (
          <div className="px-3 py-2 rounded-md bg-surface/50">
            <p className="text-sm font-medium text-foreground truncate">{profile.nome || profile.email}</p>
            <p className="text-xs text-primary capitalize">{profile.role}</p>
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
