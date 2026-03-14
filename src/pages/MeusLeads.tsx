import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Search, Filter, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_CLS: Record<string, string> = {
  "Lead Indicado":    "bg-primary/20 text-primary border-primary/30",
  "Em Qualificação":  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Lead Disponível":  "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "Reunião Agendada": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Proposta Enviada": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Contrato Assinado":"bg-green-500/20 text-green-300 border-green-500/30",
  "Entrada Paga":     "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const NIVEL_CLS: Record<string, string> = {
  "ALTA":  "bg-green-500/20 text-green-300 border-green-500/30",
  "MÉDIA": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "BAIXA": "bg-red-500/20 text-red-300 border-red-500/30",
};

const PIPELINE_STAGES = [
  "Lead Indicado", "Em Qualificação", "Lead Disponível", "Reunião Agendada",
  "Proposta Enviada", "Contrato Assinado", "Entrada Paga",
];

interface Lead {
  id: string; nome: string; email: string | null; whatsapp: string | null;
  visto: string | null; status_pipeline: string; nivel_elegibilidade: string | null;
  cidade: string | null; created_at: string; arquivado: boolean;
  motivo_exclusao: string | null; passou_por_disponivel: boolean;
}

const PAGE_SIZE = 20;

// ─── Componente ───────────────────────────────────────────────────────────────

const MeusLeads = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [leads, setLeads]     = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(0);

  // Filtros
  const [busca, setBusca]         = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("ativos");
  const [filtroPipeline, setFiltroPipeline] = useState<string>("");

  const fetchLeads = async (p = 0) => {
    if (!profile?.id) return;
    setLoading(true);

    let query = supabase
      .from("leads")
      .select("id,nome,email,whatsapp,visto,status_pipeline,nivel_elegibilidade,cidade,created_at,arquivado,motivo_exclusao,passou_por_disponivel", { count: "exact" })
      .eq("conector_id", profile.id)
      .order("created_at", { ascending: false })
      .range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1);

    if (filtroStatus === "ativos")    query = query.eq("arquivado", false);
    if (filtroStatus === "arquivados") query = query.eq("arquivado", true);
    if (filtroPipeline) query = query.eq("status_pipeline", filtroPipeline);
    if (busca) query = query.ilike("nome", `%${busca}%`);

    const { data, count } = await query;
    setLeads((data ?? []) as Lead[]);
    setTotal(count ?? 0);
    setPage(p);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(0); }, [profile?.id, filtroStatus, filtroPipeline, busca]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")}
          className="text-foreground/40 hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5"/>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Meus Leads</h1>
          <p className="text-foreground/50 text-sm mt-0.5">{total} lead{total !== 1 ? "s" : ""} no total</p>
        </div>
        <Button variant="gold" onClick={() => navigate("/novo-lead")} className="gap-2">
          <Plus className="h-4 w-4"/> Novo Lead
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Busca */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30"/>
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full bg-surface/50 border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"/>
        </div>

        {/* Status */}
        <div className="flex gap-1 bg-surface/50 rounded-lg p-1 border border-border">
          {[
            { val: "ativos",     label: "Ativos" },
            { val: "todos",      label: "Todos" },
            { val: "arquivados", label: "Arquivados" },
          ].map(s => (
            <button key={s.val} onClick={() => setFiltroStatus(s.val)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filtroStatus === s.val ? "bg-card text-foreground shadow-sm" : "text-foreground/50 hover:text-foreground"
              }`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Pipeline */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-foreground/30"/>
          <select value={filtroPipeline} onChange={e => setFiltroPipeline(e.target.value)}
            className="bg-surface/50 border border-border rounded-lg px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/60 transition-colors cursor-pointer">
            <option value="">Todas as etapas</option>
            {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16 gap-3 text-foreground/40">
            <Loader2 className="h-5 w-5 animate-spin"/><span className="text-sm">Carregando...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-foreground/40 text-sm">Nenhum lead encontrado.</p>
            {filtroStatus !== "ativos" && <p className="text-foreground/30 text-xs mt-1">Tente ajustar os filtros.</p>}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Nome","Visto","Etapa","Elegibilidade","Cidade","Data",""].map(h => (
                  <th key={h} className="text-left p-4 text-xs font-semibold text-foreground/40 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} className={`border-b border-border last:border-0 transition-colors ${l.arquivado ? "opacity-50 bg-surface/20" : "hover:bg-surface/50"}`}>
                  <td className="p-4">
                    <p className="text-sm font-medium text-foreground">{l.nome}</p>
                    {l.email && <p className="text-xs text-foreground/40 truncate max-w-[160px]">{l.email}</p>}
                    {l.passou_por_disponivel && !l.arquivado && (
                      <p className="text-xs text-yellow-400/70 mt-0.5">
                        🔒 Passado para o líder — somente leitura
                      </p>
                    )}
                    {l.arquivado && (
                      <p className="text-xs text-red-400/60 mt-0.5 truncate max-w-[160px]">
                        Arquivado: {l.motivo_exclusao}
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-sm text-foreground/60">{l.visto?.toUpperCase() ?? "—"}</td>
                  <td className="p-4">
                    {l.arquivado
                      ? <Badge variant="outline" className="text-xs bg-red-500/20 text-red-300 border-red-500/30">Arquivado</Badge>
                      : <Badge variant="outline" className={`text-xs ${STATUS_CLS[l.status_pipeline] ?? ""}`}>{l.status_pipeline}</Badge>
                    }
                  </td>
                  <td className="p-4">
                    {l.nivel_elegibilidade
                      ? <Badge variant="outline" className={`text-xs ${NIVEL_CLS[l.nivel_elegibilidade] ?? ""}`}>{l.nivel_elegibilidade}</Badge>
                      : <span className="text-foreground/25 text-xs">—</span>
                    }
                  </td>
                  <td className="p-4 text-xs text-foreground/50">{l.cidade ?? "—"}</td>
                  <td className="p-4 text-xs text-foreground/40">{fmtDate(l.created_at)}</td>
                  <td className="p-4 text-right">
                    <span className="text-xs text-foreground/25">{l.whatsapp ?? ""}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-foreground/40">
            Página {page + 1} de {totalPages} · {total} leads
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchLeads(page - 1)} disabled={page === 0 || loading}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchLeads(page + 1)} disabled={page >= totalPages - 1 || loading}>
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeusLeads;
