import { useState, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GripVertical, RefreshCw, Loader2, Plus } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface PipelineLead {
  id: string;
  nome: string;
  conector: string;
  visto: string | null;
  nivel_elegibilidade: string | null;
  created_at: string;
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

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
  "Novo Lead":        "border-t-primary",
  "Qualificado":      "border-t-blue-400",
  "Reunião Agendada": "border-t-purple-400",
  "Proposta Enviada": "border-t-orange-400",
  "Contrato Assinado":"border-t-green-400",
  "Em Processo":      "border-t-cyan-400",
  "Concluído":        "border-t-emerald-400",
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

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

const AdminPipeline = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, PipelineLead[]>>(emptyBoard());
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);

  // ── Busca leads do banco ──────────────────────────────────────────────────
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
        const conectorProfile = lead.profiles as { nome: string | null; email: string | null } | null;
        board[col].push({
          id: lead.id,
          nome: lead.nome,
          conector: conectorProfile?.nome ?? conectorProfile?.email ?? "—",
          visto: lead.visto,
          nivel_elegibilidade: lead.nivel_elegibilidade,
          created_at: lead.created_at,
        });
      }
    });

    setData(board);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // ── Drag & drop com save no banco ─────────────────────────────────────────
  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Atualiza estado local imediatamente (optimistic update)
    setData((prev) => {
      const next = { ...prev };
      const sourceCol = [...(next[source.droppableId] || [])];
      const [moved] = sourceCol.splice(source.index, 1);

      if (source.droppableId === destination.droppableId) {
        sourceCol.splice(destination.index, 0, moved);
        next[source.droppableId] = sourceCol;
      } else {
        const destCol = [...(next[destination.droppableId] || [])];
        destCol.splice(destination.index, 0, moved);
        next[source.droppableId] = sourceCol;
        next[destination.droppableId] = destCol;
      }
      return next;
    });

    // Persiste no banco
    if (source.droppableId !== destination.droppableId) {
      setMovingId(draggableId);
      const { error } = await supabase
        .from("leads")
        .update({ status_pipeline: destination.droppableId })
        .eq("id", draggableId);

      if (!error) {
        // Registra histórico
        await supabase.from("pipeline_stages").insert({
          lead_id: draggableId,
          stage: destination.droppableId,
          moved_by: profile?.id ?? null,
        });
      } else {
        console.error("Erro ao mover lead:", error);
        fetchLeads(); // reverte se der erro
      }
      setMovingId(null);
    }
  }, [profile, fetchLeads]);

  // ── Totais para o header ───────────────────────────────────────────────────
  const totalLeads = Object.values(data).reduce((sum, col) => sum + col.length, 0);
  const totalConvertidos = (data["Contrato Assinado"]?.length ?? 0) + (data["Em Processo"]?.length ?? 0) + (data["Concluído"]?.length ?? 0);

  return (
    <div className="p-6 lg:p-8 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline de Leads</h1>
          <p className="text-foreground/60 text-sm mt-1">
            {totalLeads} lead{totalLeads !== 1 ? "s" : ""} no funil
            {totalConvertidos > 0 && (
              <span className="ml-2 text-primary font-medium">· {totalConvertidos} convertido{totalConvertidos !== 1 ? "s" : ""}</span>
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

      {/* Loading state */}
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
                      className={`p-2 space-y-2 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}
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
                              className={`rounded-md border border-border bg-surface p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors ${
                                snapshot.isDragging ? "shadow-lg border-primary/50 opacity-90" : ""
                              } ${movingId === lead.id ? "opacity-50" : ""}`}
                            >
                              <div className="flex items-start gap-2">
                                <GripVertical className="h-4 w-4 text-foreground/30 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground truncate">{lead.nome}</p>
                                  <p className="text-xs text-foreground/50 mt-0.5 truncate">{lead.conector}</p>
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
          <p className="text-foreground/30 text-xs mt-1">Os leads adicionados pelos conectores aparecerão aqui.</p>
        </div>
      )}
    </div>
  );
};

export default AdminPipeline;
