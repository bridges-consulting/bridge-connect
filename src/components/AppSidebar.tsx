import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import {
  LayoutDashboard, Plus, Kanban, Users, DollarSign,
  LogOut, Network, UsersRound, GraduationCap, ChevronRight,
  List, Bell, CheckCheck, FileText,
} from "lucide-react";

// ─── Grupos de links por cargo ────────────────────────────────────────────────

type LinkItem = { to: string; label: string; icon: React.ElementType; badge?: string };
type LinkGroup = { group: string; links: LinkItem[] };

const NAV: Record<string, LinkGroup[]> = {
  admin: [
    { group: "Administração", links: [
      { to: "/admin/pipeline",   label: "Pipeline",    icon: Kanban },
      { to: "/admin/leads",      label: "Leads",       icon: List },
      { to: "/admin/conectores", label: "Conectores",  icon: Users },
      { to: "/admin/comissoes",  label: "Comissões",   icon: DollarSign },
    ]},
    { group: "Minhas Atividades", links: [
      { to: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard },
      { to: "/novo-lead",  label: "Novo Lead",    icon: Plus },
      { to: "/equipe",     label: "Minha Equipe", icon: UsersRound },
      { to: "/lideres",    label: "Meus Líderes", icon: Network },
    ]},
    { group: "Recursos", links: [
      { to: "/academy", label: "Academy", icon: GraduationCap, badge: "novo" },
    ]},
  ],
  estrategista: [
    { group: "Minha Produção", links: [
      { to: "/dashboard", label: "Dashboard",   icon: LayoutDashboard },
      { to: "/novo-lead", label: "Novo Lead",   icon: Plus },
    ]},
    { group: "Minha Rede", links: [
      { to: "/equipe",  label: "Minha Equipe", icon: UsersRound },
      { to: "/lideres", label: "Meus Líderes", icon: Network },
    ]},
    { group: "Recursos", links: [
      { to: "/academy", label: "Academy", icon: GraduationCap, badge: "novo" },
    ]},
  ],
  lider: [
    { group: "Minha Produção", links: [
      { to: "/dashboard", label: "Dashboard",   icon: LayoutDashboard },
      { to: "/novo-lead", label: "Novo Lead",   icon: Plus },
    ]},
    { group: "Minha Equipe", links: [
      { to: "/equipe", label: "Minha Equipe", icon: UsersRound },
    ]},
    { group: "Recursos", links: [
      { to: "/academy", label: "Academy", icon: GraduationCap, badge: "novo" },
    ]},
  ],
  conector: [
    { group: "Principal", links: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/novo-lead", label: "Novo Lead",  icon: Plus },
    ]},
    { group: "Recursos", links: [
      { to: "/academy", label: "Academy", icon: GraduationCap, badge: "novo" },
    ]},
  ],
};

const HOME: Record<string, string> = {
  admin: "/admin/pipeline", estrategista: "/dashboard",
  lider: "/dashboard", conector: "/dashboard",
};

const TIPO_ICON: Record<string, string> = {
  pipeline:        "🔄",
  lead_disponivel: "⚡",
  comissao:        "💰",
  equipe:          "👥",
};

function fmtRelativo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ─── Painel de notificações ───────────────────────────────────────────────────

function NotificacoesPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { notificacoes, naoLidas, loading, marcarLida, marcarTodasLidas } = useNotificacoes();

  const handleClick = async (n: ReturnType<typeof useNotificacoes>["notificacoes"][0]) => {
    await marcarLida(n.id);
    if (n.lead_id) navigate(`/leads/${n.lead_id}`);
    onClose();
  };

  return (
    <div className="absolute bottom-14 left-0 w-80 rounded-xl border border-border bg-card shadow-2xl overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary"/>
          <span className="text-sm font-semibold text-foreground">Notificações</span>
          {naoLidas > 0 && (
            <span className="bg-primary text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full">{naoLidas}</span>
          )}
        </div>
        {naoLidas > 0 && (
          <button onClick={marcarTodasLidas} className="flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground transition-colors">
            <CheckCheck className="h-3.5 w-3.5"/> Marcar todas
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8 text-foreground/30 text-sm">Carregando...</div>
        )}
        {!loading && notificacoes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Bell className="h-8 w-8 text-foreground/15 mb-2"/>
            <p className="text-sm text-foreground/40">Nenhuma notificação ainda</p>
          </div>
        )}
        {notificacoes.map(n => (
          <div key={n.id}
            onClick={() => handleClick(n)}
            className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-surface/50 ${!n.lida ? "bg-primary/[0.04]" : ""}`}>
            <span className="text-base flex-shrink-0 mt-0.5">{TIPO_ICON[n.tipo] ?? "🔔"}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-xs leading-snug ${!n.lida ? "font-semibold text-foreground" : "text-foreground/60"}`}>
                {n.titulo}
              </p>
              {n.mensagem && <p className="text-xs text-foreground/40 mt-0.5 truncate">{n.mensagem}</p>}
              <p className="text-[10px] text-foreground/25 mt-1">{fmtRelativo(n.created_at)}</p>
            </div>
            {!n.lida && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"/>}
            {n.lead_id && <FileText className="h-3.5 w-3.5 text-foreground/20 flex-shrink-0 mt-0.5"/>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const AppSidebar = ({ onSignOut }: { onSignOut: () => void }) => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { profile, role } = useAuth();
  const { naoLidas } = useNotificacoes();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const groups    = NAV[role as keyof typeof NAV] ?? NAV.conector;
  const homeRoute = HOME[role ?? "conector"] ?? "/dashboard";

  const isActive = (to: string) =>
    location.pathname === to ||
    (to.length > 1 && location.pathname.startsWith(to));

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <aside className="w-60 min-h-screen bg-background border-r border-border flex flex-col flex-shrink-0">
      {/* Logo */}
      <Link to={homeRoute} className="p-6 border-b border-border block hover:bg-surface/30 transition-colors">
        <p className="text-[9px] font-bold tracking-[3px] uppercase text-primary/60 mb-0.5">Programa</p>
        <h1 className="text-lg font-bold text-foreground tracking-wide">BRIDGES</h1>
      </Link>

      {/* Nav com grupos */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {groups.map((g, gi) => (
          <div key={g.group} className={gi > 0 ? "mt-1" : ""}>
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
                    <Link to={link.to}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors border-l-2 ${
                        active
                          ? "text-foreground border-primary bg-surface font-medium"
                          : "text-foreground/55 hover:text-foreground hover:bg-surface/50 border-transparent"
                      }`}>
                      <link.icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                      <span className="flex-1">{link.label}</span>
                      {link.badge && (
                        <span className="text-[9px] font-bold tracking-wider text-primary/50 uppercase">{link.badge}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        {/* Notificações */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotif(s => !s)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
              showNotif ? "bg-surface text-foreground" : "text-foreground/50 hover:text-foreground hover:bg-surface/50"
            }`}>
            <Bell className="h-4 w-4 flex-shrink-0"/>
            <span className="flex-1 text-left">Notificações</span>
            {naoLidas > 0 && (
              <span className="bg-primary text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {naoLidas}
              </span>
            )}
          </button>
          {showNotif && <NotificacoesPanel onClose={() => setShowNotif(false)}/>}
        </div>

        {/* Perfil */}
        {profile && (
          <button onClick={() => navigate("/perfil")}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md transition-all group border ${
              location.pathname === "/perfil"
                ? "bg-surface border-primary/30"
                : "bg-surface/50 border-border/50 hover:border-primary/20 hover:bg-surface"
            }`}>
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-foreground truncate">
                {profile.nome?.split(" ")[0] || profile.email}
              </p>
              <p className={`text-xs mt-0.5 transition-colors ${
                location.pathname === "/perfil" ? "text-primary" : "text-foreground/40 group-hover:text-primary/60"
              }`}>
                Ver meu perfil
              </p>
            </div>
            <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 ${
              location.pathname === "/perfil" ? "text-primary" : "text-foreground/25"
            }`}/>
          </button>
        )}

        {/* Logout */}
        <button onClick={onSignOut}
          className="flex items-center gap-2 text-sm text-foreground/40 hover:text-foreground transition-colors px-3 py-1.5 w-full rounded hover:bg-surface/50">
          <LogOut className="h-4 w-4"/> Sair
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
