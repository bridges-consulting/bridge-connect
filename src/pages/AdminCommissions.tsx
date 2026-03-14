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
  cenario: number | null;
  valor_previsto: number;
  valor_liberado: number;
  valor_pago: number;
  status: "pendente" | "liberado" | "pago";
  updated_at: string;
}

const STATUS_CLASS: Record<string, string> = {
  pago:     "bg-green-500/20 text-green-300 border-green-500/30",
  liberado: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  pendente: "bg-primary/20 text-primary border-primary/30",
};

const STATUS_NEXT: Record<string, "liberado" | "pago"> = {
  pendente: "liberado",
  liberado: "pago",
};

const STATUS_LABEL_NEXT: Record<string, string> = {
  pendente: "Liberar",
  liberado: "Marcar como Pago",
};

const CENARIO_CONFIG: Record<number, { label: string; cls: string }> = {
  1: { label: "Cen. 1 — Indicação (1,5%)", cls: "bg-primary/10 text-primary/80 border-primary/20" },
  3: { label: "Cen. 3 — Venda direta (5%)", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};

const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AdminCommissions = () => {
  const [comissoes, setComissoes] = useState<ComissaoRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchComissoes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("comissoes")
      .select(`
        id, valor_previsto, valor_liberado, valor_pago, status, updated_at,
        leads:lead_id ( nome, visto, cenario_comissao ),
        profiles:conector_id ( nome, email )
      `)
      .order("updated_at", { ascending: false });

    if (error || !data) { setLoading(false); return; }

    const rows: ComissaoRow[] = (data as any[]).map((c: any) => ({
      id:             c.id,
      lead_nome:      c.leads?.nome ?? "—",
      conector_nome:  c.profiles?.nome ?? c.profiles?.email ?? "—",
      visto:          c.leads?.visto ?? null,
      cenario:        c.leads?.cenario_comissao ?? null,
      valor_previsto: c.valor_previsto ?? 0,
      valor_liberado: c.valor_liberado ?? 0,
      valor_pago:     c.valor_pago ?? 0,
      status:         c.status as "pendente" | "liberado" | "pago",
      updated_at:     c.updated_at,
    }));

    setComissoes(rows);
    setLoading(false);
  };

  useEffect(() => { fetchComissoes(); }, []);

  const avancarStatus = async (comissao: ComissaoRow) => {
    if (comissao.status === "pago") return;
    setUpdatingId(comissao.id);
    const novoStatus = STATUS_NEXT[comissao.status];
    const payload = novoStatus === "liberado"
      ? { status: novoStatus, valor_liberado: comissao.valor_previsto }
      : { status: novoStatus, valor_pago: comissao.valor_previsto };

    const { error } = await supabase.from("comissoes")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", comissao.id);

    if (!error) setComissoes(prev =>
      prev.map(c => c.id === comissao.id ? { ...c, status: novoStatus, ...payload } : c)
    );
    setUpdatingId(null);
  };

  const totalPrevisto = comissoes.reduce((s, c) => s + c.valor_previsto, 0);
  const totalLiberado = comissoes.reduce((s, c) => s + c.valor_liberado, 0);
  const totalPago     = comissoes.reduce((s, c) => s + c.valor_pago, 0);
  const qtdPendente   = comissoes.filter(c => c.status === "pendente").length;
  const qtdLiberado   = comissoes.filter(c => c.status === "liberado").length;
  const qtdPago       = comissoes.filter(c => c.status === "pago").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de Comissões</h1>
          <p className="text-foreground/60 text-sm mt-1">Gerencie os pagamentos aos conectores.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchComissoes} disabled={loading}
          className="gap-2 text-foreground/50 hover:text-foreground">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}/> Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-5 flex items-center gap-4">
          <DollarSign className="h-8 w-8 text-primary"/>
          <div>
            <p className="text-sm text-foreground/60">Total Previsto</p>
            <p className="text-2xl font-bold text-foreground">{fmtCurrency(totalPrevisto)}</p>
            <p className="text-xs text-foreground/30 mt-0.5">{comissoes.length} comissões</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 flex items-center gap-4">
          <Clock className="h-8 w-8 text-blue-400"/>
          <div>
            <p className="text-sm text-foreground/60">Liberado / A pagar</p>
            <p className="text-2xl font-bold text-foreground">{fmtCurrency(totalLiberado)}</p>
            <p className="text-xs text-foreground/30 mt-0.5">{qtdLiberado} aguardando pagamento</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 flex items-center gap-4">
          <CheckCircle className="h-8 w-8 text-green-400"/>
          <div>
            <p className="text-sm text-foreground/60">Total Pago</p>
            <p className="text-2xl font-bold text-foreground">{fmtCurrency(totalPago)}</p>
            <p className="text-xs text-foreground/30 mt-0.5">{qtdPago} pago · {qtdPendente} pendente</p>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary"/>
            <span className="text-sm text-foreground/50">Carregando comissões...</span>
          </div>
        ) : comissoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-foreground/40 text-sm">Nenhuma comissão registrada ainda.</p>
            <p className="text-foreground/30 text-xs mt-1">Comissões são geradas quando um lead atinge "Entrada Paga".</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Lead","Conector","Cenário","Visto","Valor","Status",""].map(h => (
                  <th key={h} className="text-left p-4 text-xs font-semibold text-foreground/40 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comissoes.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="p-4 text-sm font-medium text-foreground">{c.lead_nome}</td>
                  <td className="p-4 text-sm text-foreground/70">{c.conector_nome}</td>
                  <td className="p-4">
                    {c.cenario && CENARIO_CONFIG[c.cenario]
                      ? <Badge variant="outline" className={`text-xs ${CENARIO_CONFIG[c.cenario].cls}`}>{CENARIO_CONFIG[c.cenario].label}</Badge>
                      : <span className="text-foreground/25 text-xs">—</span>
                    }
                  </td>
                  <td className="p-4 text-sm text-foreground/60">{c.visto?.toUpperCase() || "—"}</td>
                  <td className="p-4">
                    <p className="text-sm font-semibold text-primary">{fmtCurrency(c.valor_previsto)}</p>
                    {c.status === "pago" && (
                      <p className="text-xs text-foreground/40 mt-0.5">Pago: {fmtCurrency(c.valor_pago)}</p>
                    )}
                    {c.status === "liberado" && (
                      <p className="text-xs text-blue-400/70 mt-0.5">Liberado: {fmtCurrency(c.valor_liberado)}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className={`text-xs ${STATUS_CLASS[c.status] ?? ""}`}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    {c.status !== "pago" && (
                      <Button variant="ghost" size="sm" disabled={updatingId === c.id}
                        onClick={() => avancarStatus(c)}
                        className="text-sm text-foreground/60 hover:text-foreground">
                        {updatingId === c.id
                          ? <Loader2 className="h-4 w-4 animate-spin"/>
                          : STATUS_LABEL_NEXT[c.status]
                        }
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
