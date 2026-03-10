import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle, Clock } from "lucide-react";

interface Comissao {
  id: string;
  lead: string;
  conector: string;
  valor: string;
  status: "pago" | "pendente";
  data: string;
}

const mockComissoes: Comissao[] = [
  { id: "1", lead: "Ana Oliveira", conector: "Carlos Mendes", valor: "R$ 4.200", status: "pago", data: "2026-02-20" },
  { id: "2", lead: "Maria Santos", conector: "Carlos Mendes", valor: "R$ 4.200", status: "pendente", data: "2026-03-05" },
  { id: "3", lead: "Pedro Costa", conector: "Bruno Torres", valor: "R$ 2.100", status: "pendente", data: "2026-03-08" },
  { id: "4", lead: "Lucia Ramos", conector: "Ana Rodrigues", valor: "R$ 3.500", status: "pago", data: "2026-01-15" },
];

const AdminCommissions = () => {
  const totalPago = mockComissoes.filter((c) => c.status === "pago").length;
  const totalPendente = mockComissoes.filter((c) => c.status === "pendente").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Controle de Comissões</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-5 flex items-center gap-4">
          <DollarSign className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-foreground/60">Total</p>
            <p className="text-2xl font-bold text-foreground">{mockComissoes.length}</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 flex items-center gap-4">
          <CheckCircle className="h-8 w-8 text-green-400" />
          <div>
            <p className="text-sm text-foreground/60">Pagas</p>
            <p className="text-2xl font-bold text-foreground">{totalPago}</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 flex items-center gap-4">
          <Clock className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-foreground/60">Pendentes</p>
            <p className="text-2xl font-bold text-foreground">{totalPendente}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-sm font-medium text-foreground/60">Lead</th>
              <th className="text-left p-4 text-sm font-medium text-foreground/60">Conector</th>
              <th className="text-left p-4 text-sm font-medium text-foreground/60">Valor</th>
              <th className="text-left p-4 text-sm font-medium text-foreground/60">Status</th>
              <th className="text-left p-4 text-sm font-medium text-foreground/60">Data</th>
            </tr>
          </thead>
          <tbody>
            {mockComissoes.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                <td className="p-4 text-sm font-medium text-foreground">{c.lead}</td>
                <td className="p-4 text-sm text-foreground/75">{c.conector}</td>
                <td className="p-4 text-sm font-semibold text-primary">{c.valor}</td>
                <td className="p-4">
                  <Badge variant="outline" className={c.status === "pago" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-primary/20 text-primary border-primary/30"}>
                    {c.status}
                  </Badge>
                </td>
                <td className="p-4 text-sm text-foreground/60">{c.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCommissions;
