import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, TrendingUp, DollarSign } from "lucide-react";

interface Lead {
  id: string;
  nome: string;
  email: string;
  status: string;
  data: string;
}

const mockLeads: Lead[] = [
  { id: "1", nome: "João Silva", email: "joao@email.com", status: "Novo Lead", data: "2026-03-01" },
  { id: "2", nome: "Maria Santos", email: "maria@email.com", status: "Qualificado", data: "2026-02-28" },
  { id: "3", nome: "Pedro Costa", email: "pedro@email.com", status: "Reunião Agendada", data: "2026-02-25" },
  { id: "4", nome: "Ana Oliveira", email: "ana@email.com", status: "Contrato Assinado", data: "2026-02-20" },
];

const statusColor: Record<string, string> = {
  "Novo Lead": "bg-primary/20 text-primary border-primary/30",
  "Qualificado": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Reunião Agendada": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Contrato Assinado": "bg-green-500/20 text-green-300 border-green-500/30",
};

const ConnectorDashboard = () => {
  const [leads] = useState<Lead[]>(mockLeads);

  const kpis = [
    { label: "Leads Indicados", value: "12", icon: Users, accent: false },
    { label: "Convertidos", value: "4", icon: TrendingUp, accent: false },
    { label: "Comissão Acumulada", value: "R$ 8.400", icon: DollarSign, accent: true },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-foreground/75 text-sm mt-1">Bem-vindo de volta, Conector</p>
        </div>
        <Button variant="gold" className="gap-2">
          <Plus className="h-4 w-4" /> Novo Lead
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-lg border border-border p-5 ${kpi.accent ? "bg-primary/10 border-primary/30" : "bg-card"}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <kpi.icon className={`h-5 w-5 ${kpi.accent ? "text-primary" : "text-foreground/60"}`} />
              <span className="text-sm text-foreground/75">{kpi.label}</span>
            </div>
            <p className={`text-3xl font-bold ${kpi.accent ? "text-primary" : "text-foreground"}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Leads Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Meus Leads</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-foreground/60">Nome</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/60">Email</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/60">Status</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/60">Data</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="p-4 text-sm text-foreground">{lead.nome}</td>
                  <td className="p-4 text-sm text-foreground/75">{lead.email}</td>
                  <td className="p-4">
                    <Badge variant="outline" className={statusColor[lead.status] || ""}>
                      {lead.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-foreground/60">{lead.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConnectorDashboard;
