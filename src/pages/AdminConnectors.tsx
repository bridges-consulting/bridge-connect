import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX, Users, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ConectorRow {
  id: string;
  nome: string | null;
  email: string | null;
  status: "ativo" | "inativo";
  total_leads: number;
  total_comissao: number;
}

const AdminConnectors = () => {
  const [conectores, setConectores] = useState<ConectorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchConectores = async () => {
    setLoading(true);

    // Busca todos os conectores
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, nome, email, status")
      .eq("role", "conector")
      .order("nome");

    if (error || !profiles) {
      console.error("Erro ao buscar conectores:", error);
      setLoading(false);
      return;
    }

    // Para cada conector, busca leads e comissões
    const rows = await Promise.all(
      (profiles as any[]).map(async (p: any) => {
        const { count: totalLeads } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("conector_id", p.id);

        const { data: comissoes } = await supabase
          .from("comissoes")
          .select("valor_pago, valor_liberado")
          .eq("conector_id", p.id);

        const totalComissao = ((comissoes ?? []) as any[]).reduce(
          (sum: number, c: any) => sum + (c.valor_pago ?? 0) + (c.valor_liberado ?? 0),
          0
        );

        return {
          id: p.id,
          nome: p.nome,
          email: p.email,
          status: p.status as "ativo" | "inativo",
          total_leads: totalLeads ?? 0,
          total_comissao: totalComissao,
        };
      })
    );

    setConectores(rows);
    setLoading(false);
  };

  useEffect(() => { fetchConectores(); }, []);

  const toggleStatus = async (conector: ConectorRow) => {
    setTogglingId(conector.id);
    const novoStatus = conector.status === "ativo" ? "inativo" : "ativo";
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ status: novoStatus })
      .eq("id", conector.id);

    if (!error) {
      setConectores((prev) =>
        prev.map((c) => c.id === conector.id ? { ...c, status: novoStatus } : c)
      );
    }
    setTogglingId(null);
  };

  const total = conectores.length;
  const ativos = conectores.filter((c) => c.status === "ativo").length;

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Conectores</h1>
          <p className="text-foreground/60 text-sm mt-1">Gerencie os parceiros do programa Bridges</p>
        </div>
        <button
          onClick={fetchConectores}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-surface/50 border border-border"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-5 flex items-center gap-4">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-foreground/60">Total de Conectores</p>
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

      {/* Tabela */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-3 text-sm text-foreground/50">Carregando conectores...</span>
          </div>
        ) : conectores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-foreground/40 text-sm">Nenhum conector cadastrado ainda.</p>
            <p className="text-foreground/30 text-xs mt-1">Conectores são criados ao se cadastrar na plataforma.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-foreground/60">Nome</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/60">Email</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/60">Status</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/60">Leads</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/60">Comissão</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {conectores.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="p-4 text-sm font-medium text-foreground">{c.nome || "—"}</td>
                  <td className="p-4 text-sm text-foreground/75">{c.email || "—"}</td>
                  <td className="p-4">
                    <Badge
                      variant="outline"
                      className={c.status === "ativo"
                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                        : "bg-red-500/20 text-red-300 border-red-500/30"}
                    >
                      {c.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-foreground">{c.total_leads}</td>
                  <td className="p-4 text-sm font-semibold text-primary">
                    {formatCurrency(c.total_comissao)}
                  </td>
                  <td className="p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={togglingId === c.id}
                      onClick={() => toggleStatus(c)}
                      className={`text-sm ${c.status === "ativo" ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-green-400 hover:text-green-300 hover:bg-green-500/10"}`}
                    >
                      {togglingId === c.id
                        ? "..."
                        : c.status === "ativo" ? "Desativar" : "Ativar"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminConnectors;
