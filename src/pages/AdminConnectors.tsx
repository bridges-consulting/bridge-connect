import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX, Users, DollarSign } from "lucide-react";

interface Conector {
  id: string;
  nome: string;
  email: string;
  status: "ativo" | "inativo";
  leads: number;
  comissao: string;
}

const mockConectores: Conector[] = [
  { id: "1", nome: "Carlos Mendes", email: "carlos@email.com", status: "ativo", leads: 8, comissao: "R$ 12.600" },
  { id: "2", nome: "Ana Rodrigues", email: "ana@email.com", status: "ativo", leads: 5, comissao: "R$ 7.800" },
  { id: "3", nome: "Bruno Torres", email: "bruno@email.com", status: "inativo", leads: 3, comissao: "R$ 2.100" },
  { id: "4", nome: "Juliana Costa", email: "juliana@email.com", status: "ativo", leads: 11, comissao: "R$ 18.900" },
];

const AdminConnectors = () => {
  const total = mockConectores.length;
  const ativos = mockConectores.filter((c) => c.status === "ativo").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Gestão de Conectores</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-5 flex items-center gap-4">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-foreground/60">Total</p>
            <p className="text-2xl font-bold text-foreground">{total}</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 flex items-center gap-4">
          <UserCheck className="h-8 w-8 text-green-400" />
          <div>
            <p className="text-sm text-foreground/60">Ativos</p>
            <p className="text-2xl font-bold text-foreground">{ativos}</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 flex items-center gap-4">
          <UserX className="h-8 w-8 text-red-400" />
          <div>
            <p className="text-sm text-foreground/60">Inativos</p>
            <p className="text-2xl font-bold text-foreground">{total - ativos}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-sm font-medium text-foreground/60">Nome</th>
              <th className="text-left p-4 text-sm font-medium text-foreground/60">Email</th>
              <th className="text-left p-4 text-sm font-medium text-foreground/60">Status</th>
              <th className="text-left p-4 text-sm font-medium text-foreground/60">Leads</th>
              <th className="text-left p-4 text-sm font-medium text-foreground/60">Comissão</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {mockConectores.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                <td className="p-4 text-sm font-medium text-foreground">{c.nome}</td>
                <td className="p-4 text-sm text-foreground/75">{c.email}</td>
                <td className="p-4">
                  <Badge variant="outline" className={c.status === "ativo" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}>
                    {c.status}
                  </Badge>
                </td>
                <td className="p-4 text-sm text-foreground">{c.leads}</td>
                <td className="p-4 text-sm font-semibold text-primary">{c.comissao}</td>
                <td className="p-4">
                  <Button variant="ghost" size="sm" className="text-foreground/60 hover:text-foreground">
                    Ver detalhes
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminConnectors;
