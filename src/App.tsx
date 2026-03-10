import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppSidebar from "@/components/AppSidebar";
import Login from "./pages/Login";
import ConnectorDashboard from "./pages/ConnectorDashboard";
import NewLead from "./pages/NewLead";
import AdminPipeline from "./pages/AdminPipeline";
import AdminConnectors from "./pages/AdminConnectors";
import AdminCommissions from "./pages/AdminCommissions";
import CandidateArea from "./pages/CandidateArea";
import NotFound from "./pages/NotFound";
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

const AppLayout = () => {
  const { profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground/50 text-sm">Carregando...</div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  const role = profile.role;

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar role={role} onSignOut={signOut} />
      <main className="flex-1 overflow-auto">
        <Routes>
          {/* Rotas do conector */}
          <Route path="/dashboard" element={<ConnectorDashboard />} />
          <Route path="/novo-lead" element={<NewLead />} />
          <Route path="/candidato" element={<CandidateArea />} />

          {/* Rotas do admin */}
          <Route
            path="/admin/pipeline"
            element={role === "admin" ? <AdminPipeline /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/admin/conectores"
            element={role === "admin" ? <AdminConnectors /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/admin/comissoes"
            element={role === "admin" ? <AdminCommissions /> : <Navigate to="/dashboard" replace />}
          />

          {/* Redirect raiz por role */}
          <Route
            path="/"
            element={<Navigate to={role === "admin" ? "/admin/pipeline" : "/dashboard"} replace />}
          />
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
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
