import { useState, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GripVertical, RefreshCw, Loader2, Plus, X } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PipelineLead {
  id: string;
  nome: string;
  conector: string;
  visto: string | null;
  nivel_elegibilidade: string | null;
  created_at: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const COLUMNS = [
  "Novo Lead",
  "Qualificado",
  "Reunião Agendada",
  "Proposta Enviada",
  "Contrato Assinado",
  "Em Processo",
  "Concluído",
];

const COL_COLOR: Record<string, string> = {
  "Novo Lead":         "border-t-primary",
  "Qualificado":       "border-t-blue-400",
  "Reunião Agendada":  "border-t-purple-400",
  "Proposta Enviada":  "border-t-orange-400",
  "Contrato Assinado": "border-t-green-400",
  "Em Processo":       "border-t-cyan-400",
  "Concluído":         "border-t-emerald-400",
};

const NIVEL_CLASS: Record<string, string> = {
  ALTA:  "bg-green-500/20 text-green-300 border-green-500/30",
  MÉDIA: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  BAIXA: "bg-red-500/20 text-red-300 border-red-500/30",
};

const emptyBoard = () =>
  COLUMNS.reduce<Record<string, PipelineLead[]>>((acc, col) => {
    acc[col] = [];
    return acc;
  }, {});

// ─── Modal de arquivamento ────────────────────────────────────────────────────

interface ArchiveTarget {
  id: string;
  nome: string;
  col: string;
}

function ArchiveModal({ target, onConfirm, onCancel, loading }: {
  target: ArchiveTarget;
  onConfirm: (motivo: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [motivo, setMotivo] = useState("");
  const [error, setError]   = useState(false);

  const handleConfirm = () => {
    if (!motivo.trim()) { setError(true); return; }
    onConfirm(motivo.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-card shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-foreground">Arquivar lead</h3>
            <p className="text-xs text-foreground/50 mt-0.5">
              <span className="text-foreground/75 font-medium">{target.nome}</span>
              {" "}· {target.col}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-foreground/40 hover:text-foreground transition-colors mt-0.5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          <label className="text-sm font-medium text-foreground/60">
            Motivo do arquivamento <span className="text-red-400">*</span>
          </label>
          <textarea
            value={motivo}
            onChange={(e) => { setMotivo(e.target.value); setError(false); }}
            placeholder="Ex: Candidato não tem perfil elegível no momento, pediu para retomar em 6 meses..."
            rows={4}
            className="w-full bg-surface/50 border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors resize-none"
          />
          {error && (
            <p className="text-xs text-red-400">Informe o motivo antes de arquivar.</p>
          )}
          <p className="text-xs text-foreground/40">
            O lead ficará disponível para repescagem futura.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
          >
            {loading ? "Arquivando..." : "Arquivar lead"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const AdminPipeline = () => {
  const { profile } = useAuth();
  const navigate    = useNavigate();

  const [data, setData]       = useState<Record<string, PipelineLead[]>>(emptyBoard());
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);

  // Estado do modal de arquivamento
  const [archiveTarget, setArchiveTarget] = useState<ArchiveTarget | null>(null);
  const [archiving, setArchiving]         = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data: leads, error } = await supabase
      .from("leads")
      .select(`
        id,
        nome,
        visto,
        nivel_elegibilidade,
        status_pipeline,
        created_at,
        profiles:conector_id ( nome, email )
      `)
      .eq("arquivado", false)           // ← só leads ativos
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao buscar leads:", error);
      setLoading(false);
      return;
    }

    const board = emptyBoard();
    (leads ?? []).forEach((lead) => {
      const col = lead.status_pipeline ?? "Novo Lead";
      if (board[col]) {
        const p = lead.profiles as { nome: string | null; email: string | null } | null;
        board[col].push({
          id:                lead.id,
          nome:              lead.nome,
          conector:          p?.nome ?? p?.email ?? "—",
          visto:             lead.visto,
          nivel_elegibilidade: lead.nivel_elegibilidade,
          created_at:        lead.created_at,
        });
      }
    });

    setData(board);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    // Optimistic update
    setData((prev) => {
      const next      = { ...prev };
      const sourceCol = [...(next[source.droppableId] || [])];
      const [moved]   = sourceCol.splice(source.index, 1);

      if (source.droppableId === destination.droppableId) {
        sourceCol.splice(destination.index, 0, moved);
        next[source.droppableId] = sourceCol;
      } else {
        const destCol = [...(next[destination.droppableId] || [])];
        destCol.splice(destination.index, 0, moved);
        next[source.droppableId]      = sourceCol;
        next[destination.droppableId] = destCol;
      }
      return next;
    });

    if (source.droppableId !== destination.droppableId) {
      setMovingId(draggableId);
      const { error } = await supabase
        .from("leads")
        .update({ status_pipeline: destination.droppableId } as any)
        .eq("id", draggableId);

      if (!error) {
        await supabase.from("pipeline_stages").insert({
          lead_id:  draggableId,
          stage:    destination.droppableId,
          moved_by: profile?.id ?? null,
        });
      } else {
        console.error("Erro ao mover lead:", error);
        fetchLeads();
      }
      setMovingId(null);
    }
  }, [profile, fetchLeads]);

  // ── Arquivar ───────────────────────────────────────────────────────────────
  const openArchive = (lead: PipelineLead, col: string, e: React.MouseEvent) => {
    e.stopPropagation(); // não dispara drag
    setArchiveTarget({ id: lead.id, nome: lead.nome, col });
  };

  const confirmArchive = async (motivo: string) => {
    if (!archiveTarget) return;
    setArchiving(true);

    const { error } = await supabase
      .from("leads")
      .update({
        arquivado:       true,
        motivo_exclusao: motivo,
        arquivado_at:    new Date().toISOString(),
      })
      .eq("id", archiveTarget.id);

    if (!error) {
      // Remove do board otimisticamente
      setData((prev) => {
        const next = { ...prev };
        next[archiveTarget.col] = (next[archiveTarget.col] ?? []).filter(
          (l) => l.id !== archiveTarget.id
        );
        return next;
      });
      setArchiveTarget(null);
    } else {
      console.error("Erro ao arquivar lead:", error);
    }

    setArchiving(false);
  };

  // ── Totais ─────────────────────────────────────────────────────────────────
  const totalLeads = Object.values(data).reduce((sum, col) => sum + col.length, 0);
  const totalConvertidos =
    (data["Contrato Assinado"]?.length ?? 0) +
    (data["Em Processo"]?.length ?? 0) +
    (data["Concluído"]?.length ?? 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Modal de arquivamento */}
      {archiveTarget && (
        <ArchiveModal
          target={archiveTarget}
          onConfirm={confirmArchive}
          onCancel={() => setArchiveTarget(null)}
          loading={archiving}
        />
      )}

      <div className="p-6 lg:p-8 flex flex-col h-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pipeline de Leads</h1>
            <p className="text-foreground/60 text-sm mt-1">
              {totalLeads} lead{totalLeads !== 1 ? "s" : ""} no funil
              {totalConvertidos > 0 && (
                <span className="ml-2 text-primary font-medium">
                  · {totalConvertidos} convertido{totalConvertidos !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-surface/50 border border-border"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
            <Button variant="gold" className="gap-2" onClick={() => navigate("/novo-lead")}>
              <Plus className="h-4 w-4" /> Novo Lead
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-3 text-sm text-foreground/50">Carregando leads...</span>
          </div>
        )}

        {/* Board */}
        {!loading && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {COLUMNS.map((col) => (
                <div
                  key={col}
                  className={`min-w-[240px] w-[240px] flex-shrink-0 rounded-lg border border-border bg-card border-t-2 ${COL_COLOR[col] || "border-t-border"}`}
                >
                  {/* Coluna header */}
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{col}</span>
                    <Badge variant="outline" className="text-xs text-foreground/60 border-border">
                      {data[col]?.length || 0}
                    </Badge>
                  </div>

                  {/* Cards */}
                  <Droppable droppableId={col}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 space-y-2 min-h-[200px] transition-colors ${
                          snapshot.isDraggingOver ? "bg-primary/5" : ""
                        }`}
                      >
                        {data[col]?.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex items-center justify-center h-20 text-xs text-foreground/25">
                            Nenhum lead
                          </div>
                        )}

                        {data[col]?.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`group rounded-md border border-border bg-surface p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors ${
                                  snapshot.isDragging ? "shadow-lg border-primary/50 opacity-90" : ""
                                } ${movingId === lead.id ? "opacity-50" : ""}`}
                              >
                                <div className="flex items-start gap-2">
                                  <GripVertical className="h-4 w-4 text-foreground/30 mt-0.5 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-1">
                                      <p className="text-sm font-medium text-foreground truncate leading-snug">
                                        {lead.nome}
                                      </p>
                                      {/* Botão arquivar */}
                                      <button
                                        onClick={(e) => openArchive(lead, col, e)}
                                        title="Arquivar lead"
                                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-500/20 text-foreground/30 hover:text-red-400"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                    <p className="text-xs text-foreground/50 mt-0.5 truncate">
                                      {lead.conector}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                      {lead.visto && (
                                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                                          {lead.visto}
                                        </Badge>
                                      )}
                                      {lead.nivel_elegibilidade && (
                                        <Badge variant="outline" className={`text-xs ${NIVEL_CLASS[lead.nivel_elegibilidade] || ""}`}>
                                          {lead.nivel_elegibilidade}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}

        {/* Empty state */}
        {!loading && totalLeads === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-foreground/40 text-sm">Nenhum lead cadastrado ainda.</p>
            <p className="text-foreground/30 text-xs mt-1">
              Os leads adicionados pelos conectores aparecerão aqui.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminPipeline;
