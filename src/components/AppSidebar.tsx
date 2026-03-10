import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Plus,
  Kanban,
  Users,
  DollarSign,
  UserCircle,
  LogOut,
  PanelLeftClose,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const connectorLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/novo-lead", label: "Novo Lead", icon: Plus },
  { to: "/candidato", label: "Área Candidato", icon: UserCircle },
];

const adminLinks = [
  { to: "/admin/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/admin/conectores", label: "Conectores", icon: Users },
  { to: "/admin/comissoes", label: "Comissões", icon: DollarSign },
];

interface AppSidebarProps {
  role: "admin" | "conector";
  onRoleToggle: () => void;
}

const AppSidebar = ({ role, onRoleToggle }: AppSidebarProps) => {
  const location = useLocation();
  const links = role === "admin" ? adminLinks : connectorLinks;
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      {/* Header with logo */}
      <SidebarHeader className="border-b border-border p-4">
        {collapsed ? (
          <div className="flex items-center justify-center">
            <span className="text-sm font-bold text-primary">TB</span>
          </div>
        ) : (
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-wide">THE BRIDGE</h1>
            <p className="text-xs text-primary font-medium tracking-widest">Consulting</p>
          </div>
        )}
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <SidebarMenuItem key={link.to}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={link.to}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                              isActive
                                ? "text-foreground border-l-2 border-primary bg-surface"
                                : "text-foreground/60 hover:text-foreground hover:bg-surface/50 border-l-2 border-transparent"
                            }`}
                            activeClassName=""
                          >
                            <link.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                            {!collapsed && <span>{link.label}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right">
                          {link.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border p-2 space-y-1">
        {!collapsed && (
          <button
            onClick={onRoleToggle}
            className="w-full text-left text-xs text-foreground/40 hover:text-foreground/70 transition-colors px-3 py-1.5 rounded hover:bg-surface/50"
          >
            Alternar para {role === "admin" ? "Conector" : "Admin"}
          </button>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors px-3 py-1.5 w-full rounded hover:bg-surface/50">
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!collapsed && "Sair"}
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Sair</TooltipContent>}
        </Tooltip>

        {/* Collapse toggle */}
        <SidebarTrigger className="w-full flex items-center gap-2 text-sm text-foreground/40 hover:text-foreground/70 transition-colors px-3 py-1.5 rounded hover:bg-surface/50 justify-center">
          <PanelLeftClose className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && <span className="text-xs">Recolher menu</span>}
        </SidebarTrigger>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
