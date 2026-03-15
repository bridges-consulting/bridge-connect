import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, Users, TrendingUp, DollarSign, Crown,
  AlertCircle, CheckCircle2, FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface MembroStats {
  id: string; nome: string | null; email: string | null;
  total_leads: number; convertidos: number; em_processo: number;
  comissao_prevista: number; comissao_recebida: number;
}

interface EquipeInfo {
  id: string; nome: string;
  supervisor: { nome: string | null } | null;
}

interface LeadDisponivel {
  id: string; nome: string; visto: string | null;
  nivel_elegibilidade: string | null; created_at: string;
  conector: { nome: string | null } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

const NIVEL_CLS: Record<string, string> = {
  ALTA:  "bg-green-500/20 text-green-300 border-green-500/30",
  MÉDIA: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  BAIXA: "bg-red-500/20 text-red-300 border-red-500/30",
};

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-5 ${accent ? "bg-primary/10 border-primary/30" : "bg-card border-border"}`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`h-5 w-5 ${accent ? "text-primary" : "text-foreground/60"}`} />
        <span className="text-sm text-foreground/70">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xs text-foreground/40 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const MinhaEquipe = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [equipe, setEquipe]               = useState<EquipeInfo | null>(null);
  const [membros, setMembros]             = useState<MembroStats[]>([]);
  const [leadsDisp, setLeadsDisp]         = useState<LeadDisponivel[]>([]);
  const [loading, setLoading]             = useState(true);
  const [assumindo, setAssumindo]         = useState<string | null>(null);
  const [tab, setTab]                     = useState<"equipe" | "disponiveis">("equipe");

  useEffect(() => {
    if (!profile?.id) return;
    const fetch = async () => {
      setLoading(true);

      // Busca equipe onde este perfil é líder
      const { data: eq } = await supabase
        .from("equipes")
        .select("id, nome, supervisor:supervisor_id(nome)")
        .eq("lider_id", profile.id)
        .eq("ativa", true)
        .maybeSingle();

      if (!eq) { setLoading(false); return; }
      setEquipe(eq as unknown as EquipeInfo);

      // Busca membros
      const { data: membrosData } = await supabase
        .from("equipe_membros")
        .select("profiles:conector_id(id, nome, email)")
        .eq("equipe_id", eq.id);

      const perfis = (membrosData ?? []).map((m: any) => m.profiles).filter(Boolean);
      const membroIds = perfis.map((p: any) => p.id);

      // Stats dos membros
      const stats: MembroStats[] = await Promise.all(perfis.map(async (p: any) => {
        const { data: leads } = await supabase.from("leads")
          .select("status_pipeline").eq("conector_id", p.id).eq("arquivado", false);
        const { data: coms } = await supabase.from("comissoes")
          .select("valor_previsto, valor_pago").eq("conector_id", p.id);
        const total_leads       = leads?.length ?? 0;
        const convertidos       = (leads ?? []).filter((l: any) => ["Contrato Assinado","Entrada Paga"].includes(l.status_pipeline)).length;
        const em_processo       = (leads ?? []).filter((l: any) => !["Entrada Paga","Lead Indicado"].includes(l.status_pipeline)).length;
        const comissao_prevista = (coms ?? []).reduce((s: number, c: any) => s + (c.valor_previsto ?? 0), 0);
        const comissao_recebida = (coms ?? []).reduce((s: number, c: any) => s + (c.valor_pago ?? 0), 0);
        return { id: p.id, nome: p.nome, email: p.email, total_leads, convertidos, em_processo, comissao_prevista, comissao_recebida };
      }));
      setMembros(stats.sort((a, b) => b.total_leads - a.total_leads));

      // Leads disponíveis dos membros da equipe
      if (membroIds.length > 0) {
        const { data: dispData } = await supabase
          .from("leads")
          .select("id, nome, visto, nivel_elegibilidade, created_at, conector:conector_id(nome)")
          .in("conector_id", membroIds)
          .eq("status_pipeline", "Lead Disponível")
          .eq("arquivado", false)
          .is("assumido_por_id", null)
          .order("created_at", { ascending: false });
        setLeadsDisp((dispData ?? []) as unknown as LeadDisponivel[]);
      }

      setLoading(false);
    };
    fetch();
  }, [profile?.id]);

  // ── Assumir lead ───────────────────────────────────────────────────────────
  const assumirLead = async (lead: LeadDisponivel) => {
    setAssumindo(lead.id);
    const { error } = await supabase.from("leads").update({
      assumido_por_id: profile!.id,
      assumido_at:     new Date().toISOString(),
      status_pipeline: "Reunião Agendada",
    }).eq("id", lead.id);

    if (!error) {
      setLeadsDisp(prev => prev.filter(l => l.id !== lead.id));
    }
    setAssumindo(null);
  };

  const totalLeads    = membros.reduce((s, m) => s + m.total_leads, 0);
  const totalConvert  = membros.reduce((s, m) => s + m.convertidos, 0);
  const totalComissao = membros.reduce((s, m) => s + m.comissao_prevista, 0);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-5 w-5 animate-spin text-primary"/>
    </div>
  );

  if (!equipe) return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Minha Equipe</h1>
      <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border text-center gap-3">
        <Users className="h-10 w-10 text-foreground/20"/>
        <div>
          <p className="text-foreground/50 text-sm font-medium">Nenhuma equipe encontrada</p>
          <p className="text-foreground/30 text-xs mt-1">Peça ao administrador para criar uma equipe com você como líder.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minha Equipe</h1>
        <div className="flex items-center gap-2 mt-1">
          <Crown className="h-4 w-4 text-blue-400"/>
          <p className="text-foreground/50 text-sm">{equipe.nome}</p>
          {(equipe.supervisor as any)?.nome && (
            <span className="text-foreground/30 text-xs">· Supervisor: {(equipe.supervisor as any).nome}</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface/50 rounded-lg p-1 w-fit border border-border">
        <button onClick={() => setTab("equipe")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "equipe" ? "bg-card text-foreground shadow-sm" : "text-foreground/50 hover:text-foreground"}`}>
          Produção da equipe
        </button>
        <button onClick={() => setTab("disponiveis")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "disponiveis" ? "bg-card text-foreground shadow-sm" : "text-foreground/50 hover:text-foreground"}`}>
          Leads disponíveis
          {leadsDisp.length > 0 && (
            <span className="bg-yellow-500 text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {leadsDisp.length}
            </span>
          )}
        </button>
      </div>

      {/* ── ABA EQUIPE ── */}
      {tab === "equipe" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label="Leads da equipe"  value={String(totalLeads)}         icon={Users} />
            <KpiCard label="Conversões"       value={String(totalConvert)}        icon={TrendingUp} />
            <KpiCard label="Volume gerado"    value={fmtCurrency(totalComissao)} icon={DollarSign} accent />
          </div>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Conectores da equipe</h2>
              <span className="text-xs text-foreground/40 bg-surface px-2.5 py-1 rounded-full">
                {membros.length} membro{membros.length !== 1 ? "s" : ""}
              </span>
            </div>
            {membros.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-foreground/40 text-sm">Nenhum conector alocado ainda.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Conector","Leads","Em processo","Convertidos","Vol. previsto","Recebido",""].map(h => (
                      <th key={h} className="text-left p-4 text-xs font-semibold text-foreground/40 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {membros.map((m, i) => (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {i === 0 && membros.length > 1 && <span className="text-[10px] text-yellow-400">★</span>}
                          <div>
                            <p className="text-sm font-medium text-foreground">{m.nome || "—"}</p>
                            <p className="text-xs text-foreground/40">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-foreground">{m.total_leads}</td>
                      <td className="p-4 text-sm text-foreground/70">{m.em_processo}</td>
                      <td className="p-4">
                        <span className={`text-sm font-medium ${m.convertidos > 0 ? "text-green-400" : "text-foreground/30"}`}>
                          {m.convertidos}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-foreground/70">{fmtCurrency(m.comissao_prevista)}</td>
                      <td className="p-4 text-sm font-semibold text-primary">{fmtCurrency(m.comissao_recebida)}</td>
                      <td className="p-4">
                        <button onClick={() => navigate(`/meus-leads?conector=${m.id}`)}
                          className="text-xs text-foreground/40 hover:text-primary transition-colors">
                          Ver leads →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── ABA LEADS DISPONÍVEIS ── */}
      {tab === "disponiveis" && (
        <div className="space-y-4">
          {/* Banner explicativo */}
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5"/>
            <div>
              <p className="text-sm font-medium text-foreground">Leads aguardando fechamento</p>
              <p className="text-xs text-foreground/50 mt-0.5">
                Estes leads foram qualificados pelos conectores e estão disponíveis para você assumir e conduzir o fechamento.
                Ao assumir, o lead avança automaticamente para "Reunião Agendada".
              </p>
            </div>
          </div>

          {leadsDisp.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border text-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-foreground/20"/>
              <div>
                <p className="text-foreground/50 text-sm font-medium">Nenhum lead disponível no momento</p>
                <p className="text-foreground/30 text-xs mt-1">Quando conectores marcarem leads como "Lead Disponível", eles aparecerão aqui.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Lead","Conector","Visto","Elegibilidade","Indicado em",""].map(h => (
                      <th key={h} className="text-left p-4 text-xs font-semibold text-foreground/40 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leadsDisp.map(l => (
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                      <td className="p-4 text-sm font-medium text-foreground">{l.nome}</td>
                      <td className="p-4 text-xs text-foreground/60">{(l.conector as any)?.nome ?? "—"}</td>
                      <td className="p-4 text-xs text-foreground/60">{l.visto?.toUpperCase() ?? "—"}</td>
                      <td className="p-4">
                        {l.nivel_elegibilidade
                          ? <Badge variant="outline" className={`text-xs ${NIVEL_CLS[l.nivel_elegibilidade] ?? ""}`}>{l.nivel_elegibilidade}</Badge>
                          : <span className="text-foreground/25 text-xs">—</span>
                        }
                      </td>
                      <td className="p-4 text-xs text-foreground/40">{fmtDate(l.created_at)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => navigate(`/leads/${l.id}`)}
                            className="text-xs text-foreground/40 hover:text-primary transition-colors">
                            <FileText className="h-3.5 w-3.5"/>
                          </button>
                          <Button variant="gold" size="sm"
                            disabled={assumindo === l.id}
                            onClick={() => assumirLead(l)}
                            className="text-xs h-8">
                            {assumindo === l.id ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : "Assumir lead"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MinhaEquipe;
