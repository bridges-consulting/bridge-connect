import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string; nome: string; email: string | null; whatsapp: string | null;
  cidade: string | null; idade: string | null; consultor: string | null;
  area: string | null; experiencia: string | null; cargo: string | null;
  vinculo: string | null; operacao_eua: string | null;
  visto: string | null; nivel_elegibilidade: string | null; justificativa: string | null;
  motivacao: string | null; familiar_eua: string | null;
  tentativa_anterior: string | null; nivel_decisao: number | null;
  canal: string | null; indicador: string | null; duvidas: string | null;
  status_pipeline: string; cenario_comissao: number | null;
  created_at: string;
  conector: { nome: string | null; email: string | null } | null;
  evidencias: { criterio: string; checked: boolean }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SLIDER_LABELS = [
  "", "1 — Ainda pesquisando", "2 — Curiosidade inicial",
  "3 — Em avaliação", "4 — Pronto para decidir", "5 — Decisão tomada",
];

const NIVEL_CLS: Record<string, string> = {
  ALTA:  "bg-green-500/20 text-green-300 border-green-500/30",
  MÉDIA: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  BAIXA: "bg-red-500/20 text-red-300 border-red-500/30",
};

const STATUS_CLS: Record<string, string> = {
  "Lead Indicado":    "bg-primary/20 text-primary border-primary/30",
  "Em Qualificação":  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Lead Disponível":  "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "Reunião Agendada": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Proposta Enviada": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Contrato Assinado":"bg-green-500/20 text-green-300 border-green-500/30",
  "Entrada Paga":     "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

function gerarOrientacoes(lead: Lead): string[] {
  const tips: string[] = [];
  if ((lead.nivel_decisao ?? 0) >= 4)
    tips.push(`Alto nível de decisão (${lead.nivel_decisao}/5) — abordagem direta recomendada.`);
  if (lead.familiar_eua === "Sim")
    tips.push("Possui familiar nos EUA — explorar como âncora emocional para o projeto.");
  if (lead.canal === "Indicação" && lead.indicador)
    tips.push(`Veio por indicação de ${lead.indicador} — mencionar o nome fortalece o rapport.`);
  if (lead.tentativa_anterior === "Sim, sem sucesso")
    tips.push("Tentativa anterior sem sucesso — abordar com sensibilidade e mostrar diferencial.");
  if (lead.visto?.startsWith("EB-1"))
    tips.push("EB-1 não requer oferta de emprego — destacar essa vantagem estratégica.");
  if (lead.visto === "EB-2 NIW")
    tips.push("EB-2 NIW não exige patrocinador — o candidato controla o próprio processo.");
  if (lead.nivel_elegibilidade === "ALTA")
    tips.push("Perfil altamente elegível — priorizar apresentação do cronograma e investimento.");
  if (lead.nivel_elegibilidade === "BAIXA")
    tips.push("Elegibilidade baixa — apresentar opções alternativas ou plano de fortalecimento do perfil.");
  if (tips.length === 0)
    tips.push("Apresentar o diagnóstico completo e alinhar as próximas etapas do processo.");
  return tips;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function Section({ num, title, children }: {
  num: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="briefing-section mb-7 print:mb-5">
      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-[#c9a84c]/30 print:border-[#1a4a3a]/30">
        <span className="w-7 h-7 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center text-xs font-bold text-[#c9a84c] flex-shrink-0 print:bg-[#0e2f27] print:text-white">
          {num}
        </span>
        <h3 className="text-xs font-bold tracking-[2px] uppercase text-foreground/60 print:text-[#1a4a3a]">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-border/40 print:border-[#1a4a3a]/10 last:border-0">
      <span className="text-xs font-semibold text-foreground/40 print:text-[#4a6b63] w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-foreground print:text-[#0e2f27]">{value || "—"}</span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const LeadBriefing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);

      const { data: leadData, error } = await supabase
        .from("leads")
        .select(`
          id, nome, email, whatsapp, cidade, idade, consultor,
          area, experiencia, cargo, vinculo, operacao_eua,
          visto, nivel_elegibilidade, justificativa,
          motivacao, familiar_eua, tentativa_anterior, nivel_decisao,
          canal, indicador, duvidas, status_pipeline, cenario_comissao, created_at,
          conector:conector_id(nome, email)
        `)
        .eq("id", id)
        .single();

      if (error || !leadData) { setNotFound(true); setLoading(false); return; }

      const { data: evData } = await supabase
        .from("lead_evidencias")
        .select("criterio, checked")
        .eq("lead_id", id)
        .eq("checked", true);

      setLead({
        ...(leadData as any),
        conector: leadData.conector as any,
        evidencias: (evData ?? []) as any[],
      });
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary"/>
    </div>
  );

  if (notFound || !lead) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
      <AlertTriangle className="h-10 w-10 text-foreground/30"/>
      <p className="text-foreground/50 text-sm">Lead não encontrado ou sem permissão de acesso.</p>
      <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
    </div>
  );

  const orientacoes = gerarOrientacoes(lead);

  return (
    <>
      {/* ── Estilos de impressão ── */}
      <style>{`
        @media print {
          body { background: white !important; color: #0e2f27 !important; }
          .no-print { display: none !important; }
          .print-card {
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            padding: 0 !important;
          }
          .print-header {
            background: #0e2f27 !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="min-h-screen bg-background p-6 lg:p-8">

        {/* Barra de ações — não imprime */}
        <div className="no-print flex items-center justify-between mb-6 max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4"/> Voltar
          </button>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`text-xs ${STATUS_CLS[lead.status_pipeline] ?? ""}`}>
              {lead.status_pipeline}
            </Badge>
            <Button variant="gold" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4"/> Imprimir Briefing
            </Button>
          </div>
        </div>

        {/* Documento do briefing */}
        <div className="print-card max-w-3xl mx-auto rounded-xl border border-border bg-card shadow-xl overflow-hidden">

          {/* Cabeçalho do documento */}
          <div className="print-header bg-[#0e2f27] px-8 py-6 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[4px] uppercase text-[#c9a84c] mb-1">The Bridge</p>
              <p className="text-[9px] tracking-[3px] uppercase text-white/40">Consulting</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold tracking-wider uppercase text-white">Briefing de Lead Qualificado</p>
              <p className="text-[10px] text-white/40 mt-1">{fmtDate(lead.created_at)}</p>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="px-8 py-7">

            {/* Nome em destaque */}
            <div className="mb-7 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-[3px] uppercase text-primary/60 mb-1">Candidato</p>
                <h1 className="text-2xl font-bold text-foreground print:text-[#0e2f27]">{lead.nome}</h1>
              </div>
              <div className="flex gap-2 flex-wrap">
                {lead.visto && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-sm px-3 py-1">
                    {lead.visto}
                  </Badge>
                )}
                {lead.nivel_elegibilidade && (
                  <Badge variant="outline" className={`text-sm px-3 py-1 ${NIVEL_CLS[lead.nivel_elegibilidade]}`}>
                    Elegibilidade {lead.nivel_elegibilidade}
                  </Badge>
                )}
              </div>
            </div>

            {/* Seção 01 — Identificação */}
            <Section num="01" title="Identificação do Candidato">
              <Row label="Nome completo"          value={lead.nome} />
              <Row label="WhatsApp"               value={lead.whatsapp} />
              <Row label="E-mail"                 value={lead.email} />
              <Row label="Cidade / Estado"        value={lead.cidade} />
              <Row label="Idade"                  value={lead.idade} />
              <Row label="Consultor responsável"  value={lead.consultor || lead.conector?.nome || lead.conector?.email} />
            </Section>

            {/* Seção 02 — Perfil Profissional */}
            <Section num="02" title="Perfil Profissional">
              <Row label="Área de atuação"     value={lead.area} />
              <Row label="Anos de experiência" value={lead.experiencia} />
              <Row label="Cargo atual"         value={lead.cargo} />
              <Row label="Tipo de vínculo"     value={lead.vinculo} />
              <Row label="Operação nos EUA"    value={lead.operacao_eua} />
            </Section>

            {/* Seção 03 — Evidências */}
            <Section num="03" title="Evidências Marcadas">
              {lead.evidencias.length === 0 ? (
                <p className="text-sm text-foreground/40 italic">Nenhuma evidência selecionada.</p>
              ) : (
                <div className="space-y-2">
                  {lead.evidencias.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.5 w-4 h-4 rounded border border-primary/40 bg-primary/10 flex items-center justify-center flex-shrink-0 text-[9px] text-primary font-bold print:bg-[#0e2f27] print:text-white">✓</span>
                      <span className="text-sm text-foreground/80 print:text-[#2a3a36]">{ev.criterio}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Seção 04 — Diagnóstico */}
            <Section num="04" title="Diagnóstico de Elegibilidade">
              <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-4 mb-4 print:bg-transparent print:border-[#c9a84c]/30">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-primary/60 mb-1">Visto Recomendado</p>
                    <p className="text-base font-bold text-primary">{lead.visto || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-primary/60 mb-1">Nível de Elegibilidade</p>
                    <p className={`text-base font-bold ${
                      lead.nivel_elegibilidade === "ALTA" ? "text-green-400" :
                      lead.nivel_elegibilidade === "MÉDIA" ? "text-yellow-400" : "text-red-400"
                    }`}>{lead.nivel_elegibilidade || "—"}</p>
                  </div>
                </div>
                {lead.justificativa && (
                  <>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-foreground/40 mb-1">Justificativa técnica</p>
                    <p className="text-sm text-foreground/70 leading-relaxed print:text-[#2a3a36]">{lead.justificativa}</p>
                  </>
                )}
              </div>
            </Section>

            {/* Seção 05 — Motivação e Contexto */}
            <Section num="05" title="Motivação e Contexto">
              <Row label="Principal motivação"  value={lead.motivacao} />
              <Row label="Familiar nos EUA"     value={lead.familiar_eua} />
              <Row label="Tentativa anterior"   value={lead.tentativa_anterior} />
              <Row label="Nível de decisão"     value={lead.nivel_decisao ? SLIDER_LABELS[lead.nivel_decisao] : "—"} />
            </Section>

            {/* Seção 06 — Origem */}
            <Section num="06" title="Origem do Lead">
              <Row label="Canal de origem"    value={lead.canal} />
              <Row label="Indicado por"       value={lead.indicador} />
              <Row label="Dúvidas declaradas" value={lead.duvidas} />
              <Row label="Cadastrado por"     value={lead.conector?.nome ?? lead.conector?.email} />
            </Section>

            {/* Seção 07 — Orientações */}
            <Section num="07" title="Orientações para a Próxima Reunião">
              <div className="space-y-2.5">
                {orientacoes.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-primary text-xs mt-0.5 flex-shrink-0">✦</span>
                    <span className="text-sm text-foreground/80 leading-relaxed print:text-[#2a3a36]">{tip}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Rodapé */}
            <div className="mt-8 pt-5 border-t border-border/40 flex items-center justify-between text-xs text-foreground/30 print:text-[#4a6b63]">
              <span>Briefing gerado pelo Programa Bridges</span>
              <span>The Bridge Consulting — Building bridges, changing lives.</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadBriefing;
