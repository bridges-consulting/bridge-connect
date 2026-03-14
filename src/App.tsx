import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppSidebar from "@/components/AppSidebar";
import Login from "./pages/Login";
import ConnectorDashboard from "./pages/ConnectorDashboard";
import NewLead from "./pages/NewLead";
import RegisterConector from "./pages/RegisterConector";
import AdminPipeline from "./pages/AdminPipeline";
import AdminConnectors from "./pages/AdminConnectors";
import AdminCommissions from "./pages/AdminCommissions";
import PerfilConector from "./pages/PerfilConector";
import MinhaEquipe from "./pages/MinhaEquipe";
import MeusLideres from "./pages/MeusLideres";
import NotFound from "./pages/NotFound";
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

// ─── Redireciona para home correta por cargo ──────────────────────────────────
function HomeRedirect() {
  const { role } = useAuth();
  if (role === "admin") return <Navigate to="/admin/pipeline" replace />;
  return <Navigate to="/dashboard" replace />;
}

// ─── Guard de rota por cargo ──────────────────────────────────────────────────
function RoleGuard({
  children, allowed,
}: { children: React.ReactNode; allowed: string[] }) {
  const { role } = useAuth();
  if (!role) return null;
  if (!allowed.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ─── Layout autenticado ───────────────────────────────────────────────────────
const AppLayout = () => {
  const { profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground/50 text-sm">Carregando...</div>
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar onSignOut={signOut} />
      <main className="flex-1 overflow-auto">
        <Routes>
          {/* ── Rotas compartilhadas (todos exceto admin) ── */}
          <Route path="/dashboard" element={
            <RoleGuard allowed={["conector", "lider", "estrategista", "admin"]}>
              <ConnectorDashboard />
            </RoleGuard>
          } />
          <Route path="/novo-lead" element={<NewLead />} />
          <Route path="/perfil" element={<PerfilConector />} />

          {/* ── Líder + Estrategista ── */}
          <Route path="/equipe" element={
            <RoleGuard allowed={["lider", "estrategista", "admin"]}>
              <MinhaEquipe />
            </RoleGuard>
          } />

          {/* ── Estrategista only ── */}
          <Route path="/lideres" element={
            <RoleGuard allowed={["estrategista", "admin"]}>
              <MeusLideres />
            </RoleGuard>
          } />

          {/* ── Admin only ── */}
          <Route path="/admin/pipeline" element={
            <RoleGuard allowed={["admin"]}>
              <AdminPipeline />
            </RoleGuard>
          } />
          <Route path="/admin/conectores" element={
            <RoleGuard allowed={["admin"]}>
              <AdminConnectors />
            </RoleGuard>
          } />
          <Route path="/admin/comissoes" element={
            <RoleGuard allowed={["admin"]}>
              <AdminCommissions />
            </RoleGuard>
          } />

          {/* ── Home e 404 ── */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/cadastro" element={<RegisterConector />} />
          <Route path="/*"        element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
