import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, CheckCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ComissaoRow {
  id: string;
  lead_nome: string;
  conector_nome: string;
  visto: string | null;
  valor_previsto: number;
  valor_liberado: number;
  valor_pago: number;
  status: "pendente" | "liberado" | "pago";
  updated_at: string;
}

const STATUS_CLASS: Record<string, string> = {
  pago:      "bg-green-500/20 text-green-300 border-green-500/30",
  liberado:  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  pendente:  "bg-primary/20 text-primary border-primary/30",
};

const STATUS_NEXT: Record<string, "liberado" | "pago"> = {
  pendente: "liberado",
  liberado: "pago",
};

const STATUS_LABEL_NEXT: Record<string, string> = {
  pendente: "Liberar",
  liberado: "Marcar como Pago",
};

const AdminCommissions = () => {
  const [comissoes, setComissoes] = useState<ComissaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchComissoes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("comissoes")
      .select(`
        id,
        valor_previsto,
        valor_liberado,
        valor_pago,
        status,
        updated_at,
        leads:lead_id ( nome, visto ),
        profiles:conector_id ( nome, email )
      `)
      .order("updated_at", { ascending: false });

    if (error || !data) {
      console.error("Erro ao buscar comissões:", error);
      setLoading(false);
      return;
    }

    const rows: ComissaoRow[] = (data as any[]).map((c: any) => {
      const lead = c.leads as { nome: string; visto: string | null } | null;
      const conector = c.profiles as { nome: string | null; email: string | null } | null;
      return {
        id: c.id,
        lead_nome: lead?.nome ?? "—",
        conector_nome: conector?.nome ?? conector?.email ?? "—",
        visto: lead?.visto ?? null,
        valor_previsto: c.valor_previsto ?? 0,
        valor_liberado: c.valor_liberado ?? 0,
        valor_pago: c.valor_pago ?? 0,
        status: c.status as "pendente" | "liberado" | "pago",
        updated_at: c.updated_at,
      };
    });

    setComissoes(rows);
    setLoading(false);
  };

  useEffect(() => { fetchComissoes(); }, []);

  const avancarStatus = async (comissao: ComissaoRow) => {
    if (comissao.status === "pago") return;
    setUpdatingId(comissao.id);
    const novoStatus = STATUS_NEXT[comissao.status];

    const updatePayload =
      novoStatus === "liberado"
        ? { status: novoStatus, valor_liberado: comissao.valor_previsto }
        : { status: novoStatus, valor_pago: comissao.valor_previsto };

    const { error } = await supabase
      .from("comissoes")
      .update({ ...updatePayload, updated_at: new Date().toISOString() } as any)
      .eq("id", comissao.id);

    if (!error) {
      setComissoes((prev) =>
        prev.map((c) => c.id === comissao.id ? { ...c, status: novoStatus, ...updatePayload } : c)
      );
    }
    setUpdatingId(null);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const totalPrevisto  = comissoes.reduce((s, c) => s + c.valor_previsto, 0);
  const totalLiberado  = comissoes.reduce((s, c) => s + c.valor_liberado, 0);
  const totalPago      = comissoes.reduce((s, c) => s + c.valor_pago, 0);
  const qtdPendente    = comissoes.filter((c) => c.status === "pendente").length;
  const qtdLiberado    = comissoes.filter((c) => c.status === "liberado").length;
  const qtdPago        = comissoes.filter((c) => c.status === "pago").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de Comissões</h1>
          <p className="text-foreground/60 text-sm mt-1">Gerencie os pagamentos aos conectores</p>
        </div>
        <button
          onClick={fetchComissoes}
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
          <DollarSign className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-foreground/60">Total Previsto</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalPrevisto)}</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 flex items-center gap-4">
          <Clock className="h-8 w-8 text-blue-400" />
          <div>
            <p className="text-sm text-foreground/60">Liberado / A pagar</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalLiberado)}</p>
            <p className="text-xs text-foreground/40 mt-0.5">{qtdLiberado} comissão(ões) aguardando pagamento</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 flex items-center gap-4">
          <CheckCircle className="h-8 w-8 text-green-400" />
          <div>
            <p className="text-sm text-foreground/60">Total Pago</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalPago)}</p>
            <p className="text-xs text-foreground/40 mt-0.5">{qtdPago} pago · {qtdPendente} pendente</p>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-3 text-sm text-foreground/50">Carregando comissões...</span>
          </div>
        ) : comissoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-foreground/40 text-sm">Nenhuma comissão registrada ainda.</p>
            <p className="text-foreground/30 text-xs mt-1">As comissões são geradas quando um lead fecha contrato.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-foreground/60">Lead</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/60">Conector</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/60">Visto</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/60">Valor</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/60">Status</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {comissoes.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="p-4 text-sm font-medium text-foreground">{c.lead_nome}</td>
                  <td className="p-4 text-sm text-foreground/75">{c.conector_nome}</td>
                  <td className="p-4 text-sm text-foreground/60">{c.visto || "—"}</td>
                  <td className="p-4">
                    <p className="text-sm font-semibold text-primary">{formatCurrency(c.valor_previsto)}</p>
                    {c.status === "pago" && (
                      <p className="text-xs text-foreground/40 mt-0.5">Pago: {formatCurrency(c.valor_pago)}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className={STATUS_CLASS[c.status] || ""}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    {c.status !== "pago" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={updatingId === c.id}
                        onClick={() => avancarStatus(c)}
                        className="text-sm text-foreground/60 hover:text-foreground"
                      >
                        {updatingId === c.id ? "..." : STATUS_LABEL_NEXT[c.status]}
                      </Button>
                    )}
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

export default AdminCommissions;
