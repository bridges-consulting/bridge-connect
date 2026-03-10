import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";

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
  const [data] = useState(initialData);

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Pipeline de Leads</h1>
      <p className="text-foreground/75 text-sm mb-6">Gerencie o funil de vendas</p>

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
            <div className="p-2 space-y-2 min-h-[200px]">
              {data[col]?.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-md border border-border bg-surface p-3 cursor-pointer hover:border-primary/40 transition-colors"
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
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPipeline;
