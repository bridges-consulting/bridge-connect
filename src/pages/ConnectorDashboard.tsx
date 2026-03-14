import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Users, TrendingUp, DollarSign, Clock,
  Loader2, Crown, Network, UserCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

const timeAgo = (d: string) => {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days}d`;
};

const STATUS_CLS: Record<string, string> = {
  "Novo Lead":         "bg-primary/20 text-primary border-primary/30",
  "Qualificado":       "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Reunião Agendada":  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Proposta Enviada":  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Contrato Assinado": "bg-green-500/20 text-green-300 border-green-500/30",
  "Em Processo":       "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Concluído":         "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string; nome: string; visto: string | null;
  status_pipeline: string; created_at: string;
}

interface MembroStats {
  id: string; nome: string | null; email: string | null;
  total_leads: number; convertidos: number; comissao_gerada: number;
}

interface LiderStats {
  equipe_id: string; equipe_nome: string;
  lider_id: string; lider_nome: string | null; lider_email: string | null;
  total_membros: number; total_leads: number; comissao_gerada: number;
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

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

function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="text-foreground/70 font-medium mb-1">{title}</p>
      {sub && <p className="text-foreground/40 text-sm max-w-xs">{sub}</p>}
    </div>
  );
}

// ─── Aba: Minha Produção ──────────────────────────────────────────────────────

function TabProducao({ profileId }: { profileId: string }) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [comissaoRecebida, setComissaoRecebida] = useState(0);
  const [comissaoPrevista, setComissaoPrevista] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [leadsRes, comRes] = await Promise.all([
        supabase.from("leads").select("id,nome,visto,status_pipeline,created_at")
          .eq("conector_id", profileId).eq("arquivado", false)
          .order("created_at", { ascending: false }),
        supabase.from("comissoes").select("valor_pago,valor_previsto").eq("conector_id", profileId),
      ]);
      setLeads((leadsRes.data ?? []) as Lead[]);
      const com = comRes.data ?? [];
      setComissaoRecebida(com.reduce((s: number, c: any) => s + (c.valor_pago ?? 0), 0));
      setComissaoPrevista(com.reduce((s: number, c: any) => s + (c.valor_previsto ?? 0), 0));
      setLoading(false);
    };
    fetch();
  }, [profileId]);

  const convertidos = leads.filter(l => ["Contrato Assinado","Em Processo","Concluído"].includes(l.status_pipeline)).length;
  const emProcesso  = leads.filter(l => !["Concluído","Novo Lead"].includes(l.status_pipeline)).length;

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Leads Indicados"   value={String(leads.length)} icon={Users} />
        <KpiCard label="Em Processo"       value={String(emProcesso)}   icon={Clock} />
        <KpiCard label="Convertidos"       value={String(convertidos)}  icon={TrendingUp} />
        <KpiCard label="Comissão Recebida" value={fmtCurrency(comissaoRecebida)}
          sub={comissaoPrevista > 0 ? `${fmtCurrency(comissaoPrevista)} previsto` : undefined}
          icon={DollarSign} accent />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Meus Leads</h2>
          {leads.length > 0 && (
            <span className="text-xs text-foreground/40 bg-surface px-2.5 py-1 rounded-full">{leads.length} total</span>
          )}
        </div>
        {leads.length === 0
          ? <EmptyState icon={Users} title="Nenhum lead ainda" sub="Seu primeiro lead aparecerá aqui após o cadastro." />
          : <table className="w-full">
              <thead><tr className="border-b border-border">{["Nome","Visto","Status","Data"].map(h => <th key={h} className="text-left p-4 text-xs font-semibold text-foreground/40 uppercase tracking-widest">{h}</th>)}</tr></thead>
              <tbody>
                {leads.map(l => (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">{l.nome}</td>
                    <td className="p-4 text-sm text-foreground/60">{l.visto?.toUpperCase() ?? "—"}</td>
                    <td className="p-4"><Badge variant="outline" className={`text-xs ${STATUS_CLS[l.status_pipeline] ?? ""}`}>{l.status_pipeline}</Badge></td>
                    <td className="p-4 text-xs text-foreground/40">{fmtDate(l.created_at)} · {timeAgo(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>

      <div className="flex justify-end">
        <Button variant="gold" onClick={() => navigate("/novo-lead")} className="gap-2">
          <Plus className="h-4 w-4"/> Novo Lead
        </Button>
      </div>
    </div>
  );
}

// ─── Aba: Minha Equipe ────────────────────────────────────────────────────────

function TabEquipe({ profileId }: { profileId: string }) {
  const [membros, setMembros] = useState<MembroStats[]>([]);
  const [equipeNome, setEquipeNome] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);

      // Busca equipe onde este perfil é líder
      const { data: equipe } = await supabase.from("equipes")
        .select("id, nome, equipe_membros(conector_id)")
        .eq("lider_id", profileId).eq("ativa", true).maybeSingle();

      if (!equipe) { setLoading(false); return; }
      setEquipeNome(equipe.nome);

      const membroIds = (equipe.equipe_membros as any[]).map((m: any) => m.conector_id);
      if (membroIds.length === 0) { setMembros([]); setLoading(false); return; }

      const { data: profiles } = await supabase.from("profiles")
        .select("id, nome, email").in("id", membroIds);

      const stats = await Promise.all((profiles ?? []).map(async (p: any) => {
        const { data: leads } = await supabase.from("leads")
          .select("status_pipeline").eq("conector_id", p.id).eq("arquivado", false);
        const { data: comissoes } = await supabase.from("comissoes")
          .select("valor_pago, valor_previsto").eq("conector_id", p.id);
        const total_leads = leads?.length ?? 0;
        const convertidos = (leads ?? []).filter((l: any) =>
          ["Contrato Assinado","Em Processo","Concluído"].includes(l.status_pipeline)).length;
        const comissao_gerada = (comissoes ?? []).reduce((s: number, c: any) => s + (c.valor_pago ?? 0) + (c.valor_previsto ?? 0), 0);
        return { id: p.id, nome: p.nome, email: p.email, total_leads, convertidos, comissao_gerada };
      }));

      setMembros(stats);
      setLoading(false);
    };
    fetch();
  }, [profileId]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>;

  // KPIs da equipe
  const totalLeads = membros.reduce((s, m) => s + m.total_leads, 0);
  const totalConvertidos = membros.reduce((s, m) => s + m.convertidos, 0);
  const totalComissao = membros.reduce((s, m) => s + m.comissao_gerada, 0);

  return (
    <div className="space-y-6">
      {equipeNome && (
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-blue-400"/>
          <span className="text-sm font-semibold text-foreground">{equipeNome}</span>
          <span className="text-xs text-foreground/40">{membros.length} conector{membros.length !== 1 ? "es" : ""}</span>
        </div>
      )}

      {membros.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="Leads da Equipe"    value={String(totalLeads)}            icon={Users} />
          <KpiCard label="Conversões"         value={String(totalConvertidos)}       icon={TrendingUp} />
          <KpiCard label="Volume Gerado"      value={fmtCurrency(totalComissao)}    icon={DollarSign} accent />
        </div>
      )}

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Produção por Conector</h2>
        </div>
        {membros.length === 0
          ? <EmptyState icon={Users} title="Nenhum conector na equipe" sub="Peça ao admin para alocar conectores à sua equipe." />
          : <table className="w-full">
              <thead><tr className="border-b border-border">{["Conector","Leads","Convertidos","Volume Gerado"].map(h => <th key={h} className="text-left p-4 text-xs font-semibold text-foreground/40 uppercase tracking-widest">{h}</th>)}</tr></thead>
              <tbody>
                {membros.sort((a, b) => b.total_leads - a.total_leads).map(m => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                    <td className="p-4">
                      <p className="text-sm font-medium text-foreground">{m.nome || "—"}</p>
                      <p className="text-xs text-foreground/40">{m.email}</p>
                    </td>
                    <td className="p-4 text-sm text-foreground">{m.total_leads}</td>
                    <td className="p-4">
                      <span className={`text-sm font-medium ${m.convertidos > 0 ? "text-green-400" : "text-foreground/40"}`}>{m.convertidos}</span>
                    </td>
                    <td className="p-4 text-sm font-semibold text-primary">{fmtCurrency(m.comissao_gerada)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  );
}

// ─── Aba: Meus Líderes ────────────────────────────────────────────────────────

function TabLideres({ profileId }: { profileId: string }) {
  const [lideres, setLideres] = useState<LiderStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);

      // Equipes onde este perfil é supervisor
      const { data: equipes } = await supabase.from("equipes")
        .select("id, nome, lider_id, equipe_membros(conector_id)")
        .eq("supervisor_id", profileId).eq("ativa", true);

      if (!equipes || equipes.length === 0) { setLoading(false); return; }

      const liderIds = equipes.map((e: any) => e.lider_id);
      const { data: liderProfiles } = await supabase.from("profiles")
        .select("id, nome, email").in("id", liderIds);

      const stats: LiderStats[] = await Promise.all(equipes.map(async (eq: any) => {
        const lider = (liderProfiles ?? []).find((p: any) => p.id === eq.lider_id);
        const membroIds = (eq.equipe_membros as any[]).map((m: any) => m.conector_id);

        let totalLeads = 0;
        let comissaoGerada = 0;

        if (membroIds.length > 0) {
          const { data: leads } = await supabase.from("leads")
            .select("id").in("conector_id", membroIds).eq("arquivado", false);
          const { data: comissoes } = await supabase.from("comissoes")
            .select("valor_pago, valor_previsto").in("conector_id", membroIds);
          totalLeads = leads?.length ?? 0;
          comissaoGerada = (comissoes ?? []).reduce((s: number, c: any) => s + (c.valor_pago ?? 0) + (c.valor_previsto ?? 0), 0);
        }

        return {
          equipe_id:    eq.id,
          equipe_nome:  eq.nome,
          lider_id:     eq.lider_id,
          lider_nome:   lider?.nome ?? null,
          lider_email:  lider?.email ?? null,
          total_membros: membroIds.length,
          total_leads:   totalLeads,
          comissao_gerada: comissaoGerada,
        };
      }));

      setLideres(stats);
      setLoading(false);
    };
    fetch();
  }, [profileId]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>;

  const totalLeads = lideres.reduce((s, l) => s + l.total_leads, 0);
  const totalMembros = lideres.reduce((s, l) => s + l.total_membros, 0);
  const totalComissao = lideres.reduce((s, l) => s + l.comissao_gerada, 0);

  return (
    <div className="space-y-6">
      {lideres.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="Total de Conectores" value={String(totalMembros)} icon={UserCheck} />
          <KpiCard label="Leads nas Equipes"   value={String(totalLeads)}   icon={Users} />
          <KpiCard label="Volume Total"        value={fmtCurrency(totalComissao)} icon={DollarSign} accent />
        </div>
      )}

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Equipes Supervisionadas</h2>
        </div>
        {lideres.length === 0
          ? <EmptyState icon={Network} title="Nenhuma equipe supervisionada" sub="Quando o admin vincular equipes a você como supervisor, elas aparecerão aqui." />
          : <div className="divide-y divide-border">
              {lideres.map(l => (
                <div key={l.equipe_id} className="p-5 hover:bg-surface/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Network className="h-4 w-4 text-purple-400 flex-shrink-0"/>
                        <p className="text-sm font-semibold text-foreground">{l.equipe_nome}</p>
                        <span className="text-xs text-foreground/30">{l.total_membros} conector{l.total_membros !== 1 ? "es" : ""}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-foreground/50">
                        <Crown className="h-3 w-3 text-blue-400"/>
                        <span>Líder: <span className="text-foreground/70">{l.lider_nome || l.lider_email || "—"}</span></span>
                      </div>
                    </div>
                    <div className="flex gap-6 flex-shrink-0 text-right">
                      <div>
                        <p className="text-xs text-foreground/40 mb-0.5">Leads</p>
                        <p className="text-sm font-semibold text-foreground">{l.total_leads}</p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground/40 mb-0.5">Volume</p>
                        <p className="text-sm font-semibold text-primary">{fmtCurrency(l.comissao_gerada)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

type Tab = "producao" | "equipe" | "lideres";

const ConnectorDashboard = () => {
  const { profile, isLider, isEstratégista, isAdmin } = useAuth();
  const showEquipe  = isLider || isEstratégista || isAdmin;
  const showLideres = isEstratégista || isAdmin;

  const [tab, setTab] = useState<Tab>("producao");

  const TABS = [
    { key: "producao" as Tab, label: "Minha Produção",  show: true },
    { key: "equipe"   as Tab, label: "Minha Equipe",    show: showEquipe },
    { key: "lideres"  as Tab, label: "Meus Líderes",    show: showLideres },
  ].filter(t => t.show);

  if (!profile) return null;

  const firstName = profile.nome?.split(" ")[0] ?? "bem-vindo";

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-foreground/50 text-sm mt-1">Olá, {firstName} — bem-vindo de volta</p>
      </div>

      {/* Tabs (só aparecem se tiver mais de uma) */}
      {TABS.length > 1 && (
        <div className="flex gap-1 bg-surface/50 rounded-lg p-1 w-fit border border-border">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? "bg-card text-foreground shadow-sm" : "text-foreground/50 hover:text-foreground"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo */}
      {tab === "producao" && <TabProducao profileId={profile.id} />}
      {tab === "equipe"   && <TabEquipe   profileId={profile.id} />}
      {tab === "lideres"  && <TabLideres  profileId={profile.id} />}
    </div>
  );
};

export default ConnectorDashboard;
