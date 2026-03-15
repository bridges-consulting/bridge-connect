import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Network, Crown, Users, TrendingUp, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface MembroRow {
  id: string; nome: string | null; email: string | null;
  total_leads: number; convertidos: number; comissao_prevista: number;
}

interface LiderRow {
  equipe_id: string; equipe_nome: string;
  lider_id: string; lider_nome: string | null; lider_email: string | null;
  total_membros: number; total_leads: number; comissao_gerada: number;
  membros: MembroRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

function KpiCard({ label, value, icon: Icon, accent }: {
  label: string; value: string; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-5 ${accent ? "bg-primary/10 border-primary/30" : "bg-card border-border"}`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`h-5 w-5 ${accent ? "text-primary" : "text-foreground/60"}`} />
        <span className="text-sm text-foreground/70">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

// ─── Card de líder ────────────────────────────────────────────────────────────

function LiderCard({ lider, navigate }: { lider: LiderRow; navigate: (to: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header do líder */}
      <div className="flex items-start justify-between p-5 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Network className="h-4 w-4 text-purple-400 flex-shrink-0"/>
            <p className="text-base font-semibold text-foreground">{lider.equipe_nome}</p>
            <span className="text-xs text-foreground/30">{lider.total_membros} conector{lider.total_membros !== 1 ? "es" : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-foreground/50">
            <Crown className="h-3 w-3 text-blue-400"/>
            <span>Líder: <span className="text-foreground/70">{lider.lider_nome || lider.lider_email || "—"}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs text-foreground/40">Leads</p>
            <p className="text-lg font-bold text-foreground">{lider.total_leads}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-foreground/40">Volume</p>
            <p className="text-lg font-bold text-primary">{fmtCurrency(lider.comissao_gerada)}</p>
          </div>
          <button onClick={() => setExpanded(e => !e)}
            className="text-foreground/40 hover:text-foreground transition-colors">
            {expanded ? <ChevronUp className="h-5 w-5"/> : <ChevronDown className="h-5 w-5"/>}
          </button>
        </div>
      </div>

      {/* Membros expandidos */}
      {expanded && (
        <div className="border-t border-border">
          {lider.membros.length === 0 ? (
            <p className="px-5 py-4 text-sm text-foreground/40 italic">Nenhum conector nesta equipe.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface/30">
                  {["Conector","Leads","Convertidos","Vol. previsto",""].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-foreground/40 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lider.membros.map(m => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-foreground">{m.nome || "—"}</p>
                      <p className="text-xs text-foreground/40">{m.email}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-foreground">{m.total_leads}</td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-medium ${m.convertidos > 0 ? "text-green-400" : "text-foreground/30"}`}>
                        {m.convertidos}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-primary">{fmtCurrency(m.comissao_prevista)}</td>
                    <td className="px-5 py-3 text-right">
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
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const MeusLideres = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [lideres, setLideres] = useState<LiderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const fetch = async () => {
      setLoading(true);

      const { data: equipes } = await supabase
        .from("equipes")
        .select("id, nome, lider_id, equipe_membros(conector_id)")
        .eq("supervisor_id", profile.id)
        .eq("ativa", true);

      if (!equipes || equipes.length === 0) { setLoading(false); return; }

      const liderIds = [...new Set(equipes.map((e: any) => e.lider_id))];
      const { data: liderProfiles } = await supabase
        .from("profiles").select("id, nome, email").in("id", liderIds);

      const rows: LiderRow[] = await Promise.all(equipes.map(async (eq: any) => {
        const lider = (liderProfiles ?? []).find((p: any) => p.id === eq.lider_id);
        const membroIds = (eq.equipe_membros as any[]).map((m: any) => m.conector_id);

        let membros: MembroRow[] = [];
        let totalLeads = 0;
        let comissaoGerada = 0;

        if (membroIds.length > 0) {
          const { data: mProfiles } = await supabase
            .from("profiles").select("id, nome, email").in("id", membroIds);

          membros = await Promise.all((mProfiles ?? []).map(async (p: any) => {
            const { data: leads } = await supabase.from("leads")
              .select("status_pipeline").eq("conector_id", p.id).eq("arquivado", false);
            const { data: coms } = await supabase.from("comissoes")
              .select("valor_previsto, valor_pago").eq("conector_id", p.id);
            const total_leads = leads?.length ?? 0;
            const convertidos = (leads ?? []).filter((l: any) =>
              ["Contrato Assinado","Entrada Paga"].includes(l.status_pipeline)).length;
            const comissao_prevista = (coms ?? []).reduce((s: number, c: any) => s + (c.valor_previsto ?? 0), 0);
            totalLeads += total_leads;
            comissaoGerada += comissao_prevista;
            return { id: p.id, nome: p.nome, email: p.email, total_leads, convertidos, comissao_prevista };
          }));
        }

        return {
          equipe_id: eq.id, equipe_nome: eq.nome,
          lider_id: eq.lider_id,
          lider_nome: lider?.nome ?? null, lider_email: lider?.email ?? null,
          total_membros: membroIds.length,
          total_leads: totalLeads, comissao_gerada: comissaoGerada,
          membros,
        };
      }));

      setLideres(rows);
      setLoading(false);
    };
    fetch();
  }, [profile?.id]);

  const totalLeads   = lideres.reduce((s, l) => s + l.total_leads, 0);
  const totalMembros = lideres.reduce((s, l) => s + l.total_membros, 0);
  const totalVol     = lideres.reduce((s, l) => s + l.comissao_gerada, 0);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-5 w-5 animate-spin text-primary"/>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meus Líderes</h1>
        <p className="text-foreground/50 text-sm mt-1">
          Equipes sob sua supervisão — {lideres.length} equipe{lideres.length !== 1 ? "s" : ""}
        </p>
      </div>

      {lideres.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border text-center gap-3">
          <Network className="h-10 w-10 text-foreground/20"/>
          <div>
            <p className="text-foreground/50 text-sm font-medium">Nenhuma equipe supervisionada</p>
            <p className="text-foreground/30 text-xs mt-1">
              Peça ao administrador para vincular equipes a você como supervisor.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* KPIs globais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label="Total de conectores" value={String(totalMembros)} icon={Users} />
            <KpiCard label="Leads nas equipes"   value={String(totalLeads)}   icon={TrendingUp} />
            <KpiCard label="Volume total"        value={fmtCurrency(totalVol)} icon={DollarSign} accent />
          </div>

          {/* Cards por equipe */}
          <div className="space-y-3">
            {lideres.map(l => (
              <LiderCard key={l.equipe_id} lider={l} navigate={navigate} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MeusLideres;
