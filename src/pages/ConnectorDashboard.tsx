import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, TrendingUp, DollarSign, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Lead, Comissao } from "@/integrations/supabase/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CLASS: Record<string, string> = {
  "Novo Lead":          "bg-primary/20 text-primary border-primary/30",
  "Qualificado":        "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Reunião Agendada":   "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Proposta Enviada":   "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Contrato Assinado":  "bg-green-500/20 text-green-300 border-green-500/30",
  "Em Processo":        "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Concluído":          "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const VISTO_LABEL: Record<string, string> = {
  eb1a:   "EB-1A",
  eb1b:   "EB-1B",
  eb1c:   "EB-1C",
  eb2niw: "EB-2 NIW",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days}d`;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ConnectorDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [leads, setLeads]         = useState<Lead[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.id) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      const [leadsRes, comissoesRes] = await Promise.all([
        supabase
          .from("leads")
          .select("*")
          .eq("conector_id", profile!.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("comissoes")
          .select("*")
          .eq("conector_id", profile!.id),
      ]);

      if (leadsRes.error)     setError(leadsRes.error.message);
      if (comissoesRes.error) setError(comissoesRes.error.message);

      setLeads(leadsRes.data ?? []);
      setComissoes(comissoesRes.data ?? []);
      setLoading(false);
    }

    fetchData();
  }, [profile?.id]);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const totalLeads       = leads.length;
  const leadsConvertidos = leads.filter((l) =>
    ["Contrato Assinado", "Em Processo", "Concluído"].includes(l.status_pipeline)
  ).length;
  const leadsEmProcesso  = leads.filter((l) =>
    !["Concluído", "Novo Lead"].includes(l.status_pipeline)
  ).length;
  const comissaoRecebida = comissoes.reduce((sum, c) => sum + (c.valor_pago ?? 0), 0);
  const comissaoPrevista = comissoes.reduce((sum, c) => sum + (c.valor_previsto ?? 0), 0);

  const kpis = [
    {
      label: "Leads Indicados",
      value: loading ? "—" : String(totalLeads),
      icon: Users,
      accent: false,
    },
    {
      label: "Em Processo",
      value: loading ? "—" : String(leadsEmProcesso),
      icon: Clock,
      accent: false,
    },
    {
      label: "Convertidos",
      value: loading ? "—" : String(leadsConvertidos),
      icon: TrendingUp,
      accent: false,
    },
    {
      label: "Comissão Recebida",
      value: loading ? "—" : formatCurrency(comissaoRecebida),
      sub: !loading && comissaoPrevista > 0
        ? `${formatCurrency(comissaoPrevista)} previsto`
        : undefined,
      icon: DollarSign,
      accent: true,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-foreground/60 text-sm mt-1">
            Olá, {profile?.nome?.split(" ")[0] ?? "Conector"} — bem-vindo de volta
          </p>
        </div>
        <Button
          variant="gold"
          className="gap-2"
          onClick={() => navigate("/novo-lead")}
        >
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Erro */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Erro ao carregar dados: {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-lg border border-border p-5 ${
              kpi.accent ? "bg-primary/10 border-primary/30" : "bg-card"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <kpi.icon
                className={`h-5 w-5 ${kpi.accent ? "text-primary" : "text-foreground/60"}`}
              />
              <span className="text-sm text-foreground/75">{kpi.label}</span>
            </div>
            <p
              className={`text-3xl font-bold ${kpi.accent ? "text-primary" : "text-foreground"}`}
            >
              {kpi.value}
            </p>
            {kpi.sub && (
              <p className="text-xs text-foreground/40 mt-1">{kpi.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Leads Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Meus Leads</h2>
          {leads.length > 0 && (
            <span className="text-xs text-foreground/40 bg-surface px-2.5 py-1 rounded-full">
              {leads.length} total
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-foreground/40">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Carregando leads…</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-foreground/75 font-medium mb-1">Nenhum lead ainda</p>
            <p className="text-foreground/40 text-sm mb-6 max-w-xs">
              Seu primeiro lead qualificado vai aparecer aqui depois de preencher o formulário.
            </p>
            <Button variant="gold" className="gap-2" onClick={() => navigate("/novo-lead")}>
              <Plus className="h-4 w-4" />
              Cadastrar primeiro lead
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-medium tracking-wider uppercase text-foreground/40">
                    Candidato
                  </th>
                  <th className="text-left p-4 text-xs font-medium tracking-wider uppercase text-foreground/40">
                    Visto
                  </th>
                  <th className="text-left p-4 text-xs font-medium tracking-wider uppercase text-foreground/40">
                    Status
                  </th>
                  <th className="text-left p-4 text-xs font-medium tracking-wider uppercase text-foreground/40 hidden md:table-cell">
                    Indicado
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors"
                  >
                    <td className="p-4">
                      <p className="text-sm font-medium text-foreground">{lead.nome}</p>
                      {lead.email && (
                        <p className="text-xs text-foreground/40 mt-0.5">{lead.email}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-mono font-semibold text-foreground/60 bg-surface px-2 py-1 rounded">
                        {VISTO_LABEL[lead.visto ?? ""] ?? lead.visto ?? "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={STATUS_CLASS[lead.status_pipeline] ?? ""}
                      >
                        {lead.status_pipeline}
                      </Badge>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-xs text-foreground/40">
                        {formatDate(lead.created_at)} · {timeAgo(lead.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectorDashboard;
