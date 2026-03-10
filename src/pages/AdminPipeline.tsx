import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface PipelineLead {
  id: string;
  nome: string;
  conector: string;
  visto: string;
}

const columns = [
  "Novo Lead",
  "Qualificado",
  "Reunião Agendada",
  "Proposta Enviada",
  "Contrato Assinado",
  "Em Processo",
  "Concluído",
];

const initialData: Record<string, PipelineLead[]> = {
  "Novo Lead": [
    { id: "1", nome: "João Silva", conector: "Carlos M.", visto: "EB-2" },
    { id: "2", nome: "Fernanda Lima", conector: "Ana R.", visto: "L-1" },
  ],
  "Qualificado": [
    { id: "3", nome: "Maria Santos", conector: "Carlos M.", visto: "EB-5" },
  ],
  "Reunião Agendada": [
    { id: "4", nome: "Pedro Costa", conector: "Bruno T.", visto: "EB-2" },
  ],
  "Proposta Enviada": [
    { id: "5", nome: "Lucia Ramos", conector: "Ana R.", visto: "O-1" },
  ],
  "Contrato Assinado": [
    { id: "6", nome: "Ana Oliveira", conector: "Carlos M.", visto: "EB-5" },
  ],
  "Em Processo": [],
  "Concluído": [],
};

const colColor: Record<string, string> = {
  "Novo Lead": "border-t-primary",
  "Qualificado": "border-t-blue-400",
  "Reunião Agendada": "border-t-purple-400",
  "Proposta Enviada": "border-t-orange-400",
  "Contrato Assinado": "border-t-green-400",
  "Em Processo": "border-t-cyan-400",
  "Concluído": "border-t-emerald-400",
};

const AdminPipeline = () => {
  const [data, setData] = useState(initialData);

  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

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
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Pipeline de Leads</h1>
      <p className="text-foreground/75 text-sm mb-6">Gerencie o funil de vendas</p>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div
              key={col}
              className={`min-w-[240px] w-[240px] flex-shrink-0 rounded-lg border border-border bg-card border-t-2 ${colColor[col] || "border-t-border"}`}
            >
              <div className="p-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{col}</span>
                <Badge variant="outline" className="text-xs text-foreground/60 border-border">
                  {data[col]?.length || 0}
                </Badge>
              </div>
              <Droppable droppableId={col}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-2 space-y-2 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}
                  >
                    {data[col]?.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`rounded-md border border-border bg-surface p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors ${snapshot.isDragging ? "shadow-lg border-primary/50 opacity-90" : ""}`}
                          >
                            <div className="flex items-start gap-2">
                              <GripVertical className="h-4 w-4 text-foreground/30 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{lead.nome}</p>
                                <p className="text-xs text-foreground/60 mt-1">{lead.conector}</p>
                                <Badge variant="outline" className="text-xs mt-2 bg-primary/10 text-primary border-primary/30">
                                  {lead.visto}
                                </Badge>
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
    </div>
  );
};

export default AdminPipeline;
