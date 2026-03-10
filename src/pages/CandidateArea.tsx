import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock, FileText, Phone } from "lucide-react";

const timelineSteps = [
  { label: "Consulta Inicial", status: "concluido", date: "01/02/2026" },
  { label: "Documentação Enviada", status: "concluido", date: "15/02/2026" },
  { label: "Análise de Elegibilidade", status: "em_andamento", date: "Em andamento" },
  { label: "Petição USCIS", status: "pendente", date: "—" },
  { label: "Entrevista Consular", status: "pendente", date: "—" },
  { label: "Aprovação Final", status: "pendente", date: "—" },
];

const pendingDocs = [
  "Comprovante de renda atualizado",
  "Carta do empregador nos EUA",
  "Tradução juramentada do diploma",
];

const statusIcon = {
  concluido: <CheckCircle className="h-5 w-5 text-green-400" />,
  em_andamento: <Clock className="h-5 w-5 text-primary" />,
  pendente: <Circle className="h-5 w-5 text-foreground/30" />,
};

const CandidateArea = () => {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Área do Candidato</h1>
        <p className="text-foreground/75 text-sm mt-1">Acompanhe o progresso do seu processo</p>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Timeline do Processo</h2>
        <div className="space-y-0">
          {timelineSteps.map((step, i) => (
            <div key={step.label} className="flex gap-4">
              <div className="flex flex-col items-center">
                {statusIcon[step.status as keyof typeof statusIcon]}
                {i < timelineSteps.length - 1 && (
                  <div className={`w-px flex-1 min-h-[32px] ${step.status === "concluido" ? "bg-green-400/50" : "bg-border"}`} />
                )}
              </div>
              <div className="pb-6">
                <p className={`text-sm font-medium ${step.status === "pendente" ? "text-foreground/40" : "text-foreground"}`}>
                  {step.label}
                </p>
                <p className="text-xs text-foreground/50 mt-0.5">{step.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documentos Pendentes */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Documentos Pendentes
        </h2>
        <ul className="space-y-3">
          {pendingDocs.map((doc) => (
            <li key={doc} className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <span className="text-foreground/90">{doc}</span>
              <Badge variant="outline" className="ml-auto bg-primary/20 text-primary border-primary/30 text-xs">
                Pendente
              </Badge>
            </li>
          ))}
        </ul>
      </div>

      {/* Contato */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          Seu Consultor
        </h2>
        <div>
          <p className="text-sm text-foreground font-medium">Dr. Ricardo Almeida</p>
          <p className="text-sm text-foreground/60">ricardo@thebridge.com</p>
          <p className="text-sm text-foreground/60">+1 (305) 555-0123</p>
        </div>
      </div>
    </div>
  );
};

export default CandidateArea;
