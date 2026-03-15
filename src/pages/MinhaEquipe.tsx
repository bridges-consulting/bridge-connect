import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, TrendingUp, DollarSign, Crown, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface MembroStats {
  id: string;
  nome: string | null;
  email: string | null;
  total_leads: number;
  convertidos: number;
  em_processo: number;
  comissao_prevista: number;
  comissao_recebida: number;
}

interface EquipeInfo {
  id: string;
  nome: string;
  supervisor: { nome: string | null } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

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
  const [equipe, setEquipe]   = useState<EquipeInfo | null>(null);
  const [membros, setMembros] = useState<MembroStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const fetch = async () => {
      setLoading(true);

      // Busca a equipe onde este perfil é líder
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
      if (perfis.length === 0) { setMembros([]); setLoading(false); return; }

      // Busca stats de cada membro
      const stats: MembroStats[] = await Promise.all(perfis.map(async (p: any) => {
        const { data: leads } = await supabase
          .from("leads")
          .select("status_pipeline")
          .eq("conector_id", p.id)
          .eq("arquivado", false);

        const { data: comissoes } = await supabase
          .from("comissoes")
          .select("valor_previsto, valor_pago")
          .eq("conector_id", p.id);

        const total_leads   = leads?.length ?? 0;
        const convertidos   = (leads ?? []).filter((l: any) =>
          ["Contrato Assinado", "Entrada Paga"].includes(l.status_pipeline)).length;
        const em_processo   = (leads ?? []).filter((l: any) =>
          !["Entrada Paga", "Lead Indicado"].includes(l.status_pipeline)).length;
        const comissao_prevista  = (comissoes ?? []).reduce((s: number, c: any) => s + (c.valor_previsto ?? 0), 0);
        const comissao_recebida  = (comissoes ?? []).reduce((s: number, c: any) => s + (c.valor_pago ?? 0), 0);

        return { id: p.id, nome: p.nome, email: p.email,
          total_leads, convertidos, em_processo, comissao_prevista, comissao_recebida };
      }));

      setMembros(stats.sort((a, b) => b.total_leads - a.total_leads));
      setLoading(false);
    };
    fetch();
  }, [profile?.id]);

  // KPIs agregados
  const totalLeads     = membros.reduce((s, m) => s + m.total_leads, 0);
  const totalConvert   = membros.reduce((s, m) => s + m.convertidos, 0);
  const totalComissao  = membros.reduce((s, m) => s + m.comissao_prevista, 0);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-5 w-5 animate-spin text-primary"/>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minha Equipe</h1>
        {equipe ? (
          <div className="flex items-center gap-2 mt-1">
            <Crown className="h-4 w-4 text-blue-400"/>
            <p className="text-foreground/50 text-sm">{equipe.nome}</p>
            {(equipe.supervisor as any)?.nome && (
              <span className="text-foreground/30 text-xs">· Supervisor: {(equipe.supervisor as any).nome}</span>
            )}
          </div>
        ) : (
          <p className="text-foreground/50 text-sm mt-1">Sua equipe de conectores.</p>
        )}
      </div>

      {/* Sem equipe */}
      {!equipe && (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border text-center gap-3">
          <Users className="h-10 w-10 text-foreground/20"/>
          <div>
            <p className="text-foreground/50 text-sm font-medium">Nenhuma equipe encontrada</p>
            <p className="text-foreground/30 text-xs mt-1">
              Peça ao administrador para criar uma equipe com você como líder.
            </p>
          </div>
        </div>
      )}

      {equipe && <>
        {/* KPIs da equipe */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="Leads da equipe"  value={String(totalLeads)}          icon={Users} />
          <KpiCard label="Conversões"       value={String(totalConvert)}         icon={TrendingUp} />
          <KpiCard label="Volume gerado"    value={fmtCurrency(totalComissao)}  icon={DollarSign} accent />
        </div>

        {/* Tabela de membros */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">
              Conectores da equipe
            </h2>
            <span className="text-xs text-foreground/40 bg-surface px-2.5 py-1 rounded-full">
              {membros.length} membro{membros.length !== 1 ? "s" : ""}
            </span>
          </div>

          {membros.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-foreground/40 text-sm">Nenhum conector alocado ainda.</p>
              <p className="text-foreground/30 text-xs mt-1">O admin pode alocar conectores na aba Equipes.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Conector", "Leads", "Em processo", "Convertidos", "Vol. previsto", "Recebido", ""].map(h => (
                    <th key={h} className="text-left p-4 text-xs font-semibold text-foreground/40 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {membros.map((m, i) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {i === 0 && membros.length > 1 && (
                          <span className="text-[10px] text-yellow-400" title="Destaque do mês">★</span>
                        )}
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
      </>}
    </div>
  );
};

export default MinhaEquipe;
