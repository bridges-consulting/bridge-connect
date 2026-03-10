import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import Login from "./pages/Login";
import ConnectorDashboard from "./pages/ConnectorDashboard";
import NewLead from "./pages/NewLead";
import AdminPipeline from "./pages/AdminPipeline";
import AdminConnectors from "./pages/AdminConnectors";
import AdminCommissions from "./pages/AdminCommissions";
import CandidateArea from "./pages/CandidateArea";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = () => {
  const [role, setRole] = useState<"admin" | "conector">("conector");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar role={role} onRoleToggle={() => setRole(role === "admin" ? "conector" : "admin")} />
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Mobile header with sidebar trigger */}
          <header className="h-12 flex items-center border-b border-border md:hidden">
            <SidebarTrigger className="ml-3 text-foreground/60 hover:text-foreground" />
            <span className="ml-3 text-sm font-bold text-foreground">THE BRIDGE</span>
          </header>
          <main className="flex-1">
            <Routes>
              <Route path="/dashboard" element={<ConnectorDashboard />} />
              <Route path="/novo-lead" element={<NewLead />} />
              <Route path="/candidato" element={<CandidateArea />} />
              <Route path="/admin/pipeline" element={<AdminPipeline />} />
              <Route path="/admin/conectores" element={<AdminConnectors />} />
              <Route path="/admin/comissoes" element={<AdminCommissions />} />
              <Route path="/" element={<Navigate to={role === "admin" ? "/admin/pipeline" : "/dashboard"} replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
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
