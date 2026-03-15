import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Plus, Kanban, Users, DollarSign,
  LogOut, Network, UsersRound, GraduationCap, ChevronRight,
  List, FileText,
} from "lucide-react";

// ─── Grupos de links por cargo ────────────────────────────────────────────────
// Cada cargo tem seus links organizados em grupos contextuais

type LinkItem = { to: string; label: string; icon: React.ElementType; badge?: string };
type LinkGroup = { group: string; links: LinkItem[] };

const NAV: Record<string, LinkGroup[]> = {
  admin: [
    {
      group: "Administração",
      links: [
        { to: "/admin/pipeline",   label: "Pipeline",    icon: Kanban },
        { to: "/admin/leads",      label: "Leads",       icon: List },
        { to: "/admin/conectores", label: "Conectores",  icon: Users },
        { to: "/admin/comissoes",  label: "Comissões",   icon: DollarSign },
      ],
    },
    {
      group: "Minhas Atividades",
      links: [
        { to: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard },
        { to: "/novo-lead",  label: "Novo Lead",    icon: Plus },
        { to: "/equipe",     label: "Minha Equipe", icon: UsersRound },
        { to: "/lideres",    label: "Meus Líderes", icon: Network },
      ],
    },
    {
      group: "Recursos",
      links: [
        { to: "/academy", label: "Academy", icon: GraduationCap, badge: "novo" },
      ],
    },
  ],
  estrategista: [
    {
      group: "Minha Produção",
      links: [
        { to: "/dashboard", label: "Dashboard",   icon: LayoutDashboard },
        { to: "/novo-lead", label: "Novo Lead",   icon: Plus },
      ],
    },
    {
      group: "Minha Rede",
      links: [
        { to: "/equipe",   label: "Minha Equipe", icon: UsersRound },
        { to: "/lideres",  label: "Meus Líderes", icon: Network },
      ],
    },
    {
      group: "Recursos",
      links: [
        { to: "/academy", label: "Academy", icon: GraduationCap, badge: "novo" },
      ],
    },
  ],
  lider: [
    {
      group: "Minha Produção",
      links: [
        { to: "/dashboard", label: "Dashboard",   icon: LayoutDashboard },
        { to: "/novo-lead", label: "Novo Lead",   icon: Plus },
      ],
    },
    {
      group: "Minha Equipe",
      links: [
        { to: "/equipe", label: "Minha Equipe", icon: UsersRound },
      ],
    },
    {
      group: "Recursos",
      links: [
        { to: "/academy", label: "Academy", icon: GraduationCap, badge: "novo" },
      ],
    },
  ],
  conector: [
    {
      group: "Principal",
      links: [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/novo-lead", label: "Novo Lead",  icon: Plus },
      ],
    },
    {
      group: "Recursos",
      links: [
        { to: "/academy", label: "Academy", icon: GraduationCap, badge: "novo" },
      ],
    },
  ],
};

// Home por cargo
const HOME: Record<string, string> = {
  admin:        "/admin/pipeline",
  estrategista: "/dashboard",
  lider:        "/dashboard",
  conector:     "/dashboard",
};

// ─── Componente ───────────────────────────────────────────────────────────────

const AppSidebar = ({ onSignOut }: { onSignOut: () => void }) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { profile, role } = useAuth();

  const groups = NAV[role as keyof typeof NAV] ?? NAV.conector;
  const homeRoute = HOME[role ?? "conector"] ?? "/dashboard";

  const isActive = (to: string) =>
    location.pathname === to ||
    (to !== "/" && to.length > 1 && location.pathname.startsWith(to));

  return (
    <aside className="w-60 min-h-screen bg-background border-r border-border flex flex-col flex-shrink-0">

      {/* Logo — clicável, leva para home */}
      <Link to={homeRoute} className="p-6 border-b border-border block hover:bg-surface/30 transition-colors">
        <p className="text-[9px] font-bold tracking-[3px] uppercase text-primary/60 mb-0.5">Programa</p>
        <h1 className="text-lg font-bold text-foreground tracking-wide">BRIDGES</h1>
      </Link>

      {/* Nav com grupos */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {groups.map((g, gi) => (
          <div key={g.group} className={gi > 0 ? "mt-1" : ""}>
            {/* Título do grupo — só mostra se tiver mais de um grupo */}
            {groups.length > 1 && (
              <p className="px-5 pt-3 pb-1.5 text-[10px] font-bold tracking-[2px] uppercase text-foreground/25">
                {g.group}
              </p>
            )}
            <ul className="space-y-0.5 px-3">
              {g.links.map((link) => {
                const active = isActive(link.to);
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors border-l-2 ${
                        active
                          ? "text-foreground border-primary bg-surface font-medium"
                          : "text-foreground/55 hover:text-foreground hover:bg-surface/50 border-transparent"
                      }`}
                    >
                      <link.icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                      <span className="flex-1">{link.label}</span>
                      {link.badge && (
                        <span className="text-[9px] font-bold tracking-wider text-primary/50 uppercase">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
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
              location.pathname === "/perfil"
                ? "text-primary"
                : "text-foreground/25 group-hover:text-foreground/50"
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
