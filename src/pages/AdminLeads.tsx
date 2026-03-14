import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, Search, Filter, RefreshCw,
  Trash2, ArchiveRestore, AlertTriangle, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  motivo_exclusao: string | null; arquivado_at: string | null;
  passou_por_disponivel: boolean; cenario_comissao: number | null;
  conector: { nome: string | null; email: string | null } | null;
}

const PAGE_SIZE = 25;

// ─── Modal de exclusão definitiva ─────────────────────────────────────────────

function DeleteModal({ lead, onConfirm, onCancel, loading }: {
  lead: Lead; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/40 bg-card shadow-2xl">
        <div className="p-5 border-b border-border flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-4 w-4 text-red-400"/>
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Exclusão definitiva</h3>
            <p className="text-xs text-foreground/50 mt-0.5">Esta ação não pode ser desfeita.</p>
          </div>
          <button onClick={onCancel} className="ml-auto text-foreground/40 hover:text-foreground">
            <X className="h-5 w-5"/>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-foreground/70 leading-relaxed">
            Você está prestes a excluir permanentemente o lead{" "}
            <strong className="text-foreground">{lead.nome}</strong> e todos os dados associados
            (comissões, evidências, histórico de pipeline).
          </p>
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-300 leading-relaxed">
            Para confirmar, digite <strong>EXCLUIR</strong> abaixo:
          </div>
          <input value={confirmText} onChange={e => setConfirmText(e.target.value)}
            placeholder="EXCLUIR"
            className="w-full bg-surface/50 border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-red-500/60 transition-colors font-mono tracking-wider"/>
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="flex-1">Cancelar</Button>
          <Button
            onClick={onConfirm}
            disabled={confirmText !== "EXCLUIR" || loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0 disabled:opacity-40">
            {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 mr-1.5"/>}
            {loading ? "Excluindo..." : "Excluir definitivamente"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const AdminLeads = () => {
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [deleting, setDeleting]   = useState(false);
  const [unarchiving, setUnarchiving] = useState<string | null>(null);

  // Filtros
  const [busca, setBusca]             = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPipeline, setFiltroPipeline] = useState<string>("");

  const fetchLeads = useCallback(async (p = 0) => {
    setLoading(true);

    let query = supabase
      .from("leads")
      .select(`
        id, nome, email, whatsapp, visto, status_pipeline,
        nivel_elegibilidade, cidade, created_at, arquivado,
        motivo_exclusao, arquivado_at,
        passou_por_disponivel, cenario_comissao,
        conector:conector_id(nome, email)
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1);

    if (filtroStatus === "ativos")    query = query.eq("arquivado", false);
    if (filtroStatus === "arquivados") query = query.eq("arquivado", true);
    if (filtroPipeline) query = query.eq("status_pipeline", filtroPipeline);
    if (busca) query = query.ilike("nome", `%${busca}%`);

    const { data, count } = await query;
    setLeads((data ?? []) as unknown as Lead[]);
    setTotal(count ?? 0);
    setPage(p);
    setLoading(false);
  }, [filtroStatus, filtroPipeline, busca]);

  useEffect(() => { fetchLeads(0); }, [fetchLeads]);

  // ── Exclusão definitiva ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    // Remove dependências primeiro
    await supabase.from("comissoes").delete().eq("lead_id", deleteTarget.id);
    await supabase.from("lead_evidencias").delete().eq("lead_id", deleteTarget.id);
    await supabase.from("pipeline_stages").delete().eq("lead_id", deleteTarget.id);
    // Delete definitivo
    const { error } = await supabase.from("leads").delete().eq("id", deleteTarget.id);
    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== deleteTarget.id));
      setTotal(t => t - 1);
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  // ── Desarquivar ────────────────────────────────────────────────────────────
  const handleUnarchive = async (lead: Lead) => {
    setUnarchiving(lead.id);
    const { error } = await supabase.from("leads").update({
      arquivado: false, motivo_exclusao: null, arquivado_at: null,
    }).eq("id", lead.id);
    if (!error) {
      setLeads(prev => prev.map(l => l.id === lead.id
        ? { ...l, arquivado: false, motivo_exclusao: null, arquivado_at: null }
        : l
      ));
    }
    setUnarchiving(null);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const ativos     = leads.filter(l => !l.arquivado).length;
  const arquivados = leads.filter(l => l.arquivado).length;

  return (
    <>
      {deleteTarget && (
        <DeleteModal lead={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting}/>
      )}

      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Todos os Leads</h1>
            <p className="text-foreground/50 text-sm mt-1">
              {total} lead{total !== 1 ? "s" : ""} · {arquivados} arquivado{arquivados !== 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchLeads(0)} disabled={loading}
            className="gap-2 text-foreground/50 hover:text-foreground">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}/> Atualizar
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30"/>
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full bg-surface/50 border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"/>
          </div>

          <div className="flex gap-1 bg-surface/50 rounded-lg p-1 border border-border">
            {[
              { val: "todos",      label: "Todos" },
              { val: "ativos",     label: "Ativos" },
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
            <div className="flex items-center justify-center py-16">
              <p className="text-foreground/40 text-sm">Nenhum lead encontrado.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Lead","Conector","Visto","Etapa","Elegib.","Data",""].map(h => (
                    <th key={h} className="text-left p-4 text-xs font-semibold text-foreground/40 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map(l => (
                  <tr key={l.id} className={`border-b border-border last:border-0 transition-colors ${
                    l.arquivado ? "bg-red-500/[0.02]" : "hover:bg-surface/50"
                  }`}>
                    <td className="p-4">
                      <p className={`text-sm font-medium ${l.arquivado ? "text-foreground/40 line-through" : "text-foreground"}`}>
                        {l.nome}
                      </p>
                      {l.cidade && <p className="text-xs text-foreground/30">{l.cidade}</p>}
                      {l.arquivado && l.motivo_exclusao && (
                        <p className="text-xs text-red-400/60 mt-0.5 max-w-[180px] truncate" title={l.motivo_exclusao}>
                          {l.motivo_exclusao}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-foreground/60">{l.conector?.nome ?? l.conector?.email ?? "—"}</p>
                      {l.cenario_comissao && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${
                          l.cenario_comissao === 1
                            ? "bg-primary/10 text-primary/70"
                            : "bg-blue-500/10 text-blue-400"
                        }`}>
                          Cen. {l.cenario_comissao === 1 ? "1 — Indicação" : "3 — Venda direta"}
                        </span>
                      )}
                      {l.passou_por_disponivel && !l.cenario_comissao && (
                        <span className="text-[10px] text-yellow-400/60 mt-1 block">↗ Passou p/ líder</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-foreground/60">{l.visto?.toUpperCase() ?? "—"}</td>
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
                    <td className="p-4 text-xs text-foreground/40">{fmtDate(l.created_at)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 justify-end">
                        {l.arquivado && (
                          <Button variant="ghost" size="sm" onClick={() => handleUnarchive(l)}
                            disabled={unarchiving === l.id}
                            className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1">
                            {unarchiving === l.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                              : <ArchiveRestore className="h-3.5 w-3.5"/>
                            }
                            Restaurar
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(l)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="h-3.5 w-3.5"/>
                        </Button>
                      </div>
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
    </>
  );
};

export default AdminLeads;
