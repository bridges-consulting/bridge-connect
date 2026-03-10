import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Visto = "EB-1A" | "EB-1B" | "EB-1C" | "EB-2 NIW" | null;
type Nivel = "ALTA" | "MÉDIA" | "BAIXA" | null;

interface FormData {
  nome: string; whatsapp: string; email: string; cidade: string;
  idade: string; consultor: string; area: string; outra_area: string;
  experiencia: string; cargo: string; vinculo: string; operacao_eua: string;
  visto: Visto; evidencias: Record<string, boolean>;
  nivel_elegibilidade: Nivel; justificativa: string;
  motivacao: string; familiar_eua: string; tentativa_anterior: string;
  nivel_decisao: number; canal: string; indicador: string; duvidas: string;
}

const CRITERIOS: Record<string, string[]> = {
  "EB-1A": [
    "Recebeu prêmios ou distinções de excelência",
    "Participa de associações que exijam realizações excepcionais",
    "Tem materiais sobre si em publicações profissionais ou comerciais importantes",
    "Foi convidado a julgar o trabalho de outros (individualmente ou em comitê)",
    "Tem contribuições originais científicas, acadêmicas, artísticas ou comerciais",
    "Autoria de artigos em publicações especializadas",
    "Participou em exposições ou mostras artísticas de destaque",
    "Exerceu papel de liderança em organizações de excelência reconhecida",
    "Recebeu salário elevado em comparação aos demais da área",
    "Teve sucesso comercial nas artes do espetáculo",
  ],
  "EB-1B": [
    "Recebeu prêmios importantes por realizações notáveis",
    "Participação em associações que exigem realizações notáveis",
    "Material em publicações profissionais escritas por terceiros",
    "Participou como avaliador do trabalho de outros na mesma área acadêmica",
    "Contribuições originais de pesquisa científica ou acadêmica",
    "Autoria de livros ou artigos em periódicos de circulação internacional",
  ],
  "EB-1C": [
    "Atuou fora do país por pelo menos 1 ano nos últimos 3 anos",
    "A empresa está em operação nos EUA há mais de 1 ano",
  ],
  "EB-2 NIW": [
    "Possui mestrado ou doutorado",
    "Possui graduação + 5 anos de experiência progressiva na área",
    "Diploma acadêmico relacionado à área de habilidade excepcional",
    "Pelo menos 10 anos de experiência em tempo integral na ocupação",
    "Licença para exercer a profissão",
    "Evidência de salário alto em relação aos demais da área",
    "Membro de associações profissionais",
    "Reconhecimento por realizações e contribuições significativas",
  ],
};

const MIN_CRITERIOS: Record<string, number> = {
  "EB-1A": 3, "EB-1B": 2, "EB-1C": 2, "EB-2 NIW": 1,
};

const AREAS = [
  "Medicina / Saúde", "Tecnologia / TI", "Direito", "Engenharia",
  "Educação / Pesquisa", "Negócios / Gestão", "Artes / Entretenimento",
  "Ciências", "Arquitetura / Design", "Outro",
];

const VINCULOS = [
  "CLT / Empregado formal", "Executivo em multinacional",
  "Autônomo / Freelancer", "Empresário / Sócio", "Acadêmico / Pesquisador",
];

const CANAIS = ["LinkedIn", "Indicação", "Instagram", "Google", "WhatsApp / Grupo", "Outro"];

const SLIDER_LABELS = [
  "", "1 — Ainda pesquisando", "2 — Curiosidade inicial",
  "3 — Em avaliação", "4 — Pronto para decidir", "5 — Decisão tomada",
];

const STEPS = ["Identificação", "Perfil", "Visto", "Diagnóstico", "Contexto", "Origem"];

const FORM_INITIAL: FormData = {
  nome: "", whatsapp: "", email: "", cidade: "", idade: "", consultor: "",
  area: "", outra_area: "", experiencia: "", cargo: "", vinculo: "", operacao_eua: "",
  visto: null, evidencias: {}, nivel_elegibilidade: null, justificativa: "",
  motivacao: "", familiar_eua: "", tentativa_anterior: "", nivel_decisao: 3,
  canal: "", indicador: "", duvidas: "",
};

function calcNivel(visto: Visto, count: number): Nivel {
  if (!visto) return null;
  const rules: Record<string, Nivel> = {
    "EB-1A": count >= 3 ? "ALTA" : count === 2 ? "MÉDIA" : "BAIXA",
    "EB-1B": count >= 2 ? "ALTA" : count === 1 ? "MÉDIA" : "BAIXA",
    "EB-1C": count === 2 ? "ALTA" : count === 1 ? "MÉDIA" : "BAIXA",
    "EB-2 NIW": count >= 3 ? "ALTA" : count >= 1 ? "MÉDIA" : "BAIXA",
  };
  return rules[visto] ?? null;
}

function gerarJustificativa(visto: Visto, nivel: Nivel, count: number): string {
  if (!visto || !nivel) return "";
  const min = MIN_CRITERIOS[visto] ?? 0;
  const falta = Math.max(0, min - count);
  if (nivel === "ALTA") return `Candidato atende ${count} critério(s) para ${visto} — acima do mínimo de ${min}. Perfil elegível para protocolo.`;
  if (nivel === "MÉDIA") return `Candidato atende ${count} critério(s) para ${visto}. Faltam ${falta} para o mínimo de ${min}. Recomendado aprofundar evidências.`;
  return `Candidato atende apenas ${count} critério(s) para ${visto}. Mínimo necessário: ${min}. Avaliar outros vistos ou buscar documentação adicional.`;
}

function gerarOrientacoes(data: FormData): string[] {
  const tips: string[] = [];
  if (data.nivel_decisao >= 4) tips.push(`Alto nível de decisão (${data.nivel_decisao}/5) — abordagem direta recomendada.`);
  if (data.familiar_eua === "Sim") tips.push("Possui familiar nos EUA — explorar como âncora emocional para o projeto.");
  if (data.canal === "Indicação" && data.indicador) tips.push(`Veio por indicação de ${data.indicador} — mencionar o nome fortalece o rapport.`);
  if (data.tentativa_anterior === "Sim, sem sucesso") tips.push("Tentativa anterior sem sucesso — abordar com sensibilidade.");
  if (data.visto?.startsWith("EB-1")) tips.push("EB-1 não requer oferta de emprego — destacar essa vantagem estratégica.");
  if (data.visto === "EB-2 NIW") tips.push("EB-2 NIW não exige patrocinador — o candidato controla o próprio processo.");
  if (tips.length === 0) tips.push("Apresentar o diagnóstico completo e alinhar as próximas etapas.");
  return tips;
}

// ─── SUBCOMPONENTES ───────────────────────────────────────────────────────────

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground/60">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-surface/50 border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors" />
  );
}

function TextArea({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
      className="w-full bg-surface/50 border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors resize-none" />
  );
}

function SelectInput({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-surface/50 border border-border rounded-md px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function RadioGroup({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <div key={opt} onClick={() => onChange(opt)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md border text-sm cursor-pointer transition-colors ${
            value === opt ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-surface/30 text-foreground/60 hover:bg-surface/60 hover:text-foreground"
          }`}>
          <span className={`h-4 w-4 rounded-full border-2 flex-shrink-0 transition-colors ${value === opt ? "border-primary bg-primary" : "border-foreground/30"}`} />
          {opt}
        </div>
      ))}
    </div>
  );
}

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange}
      className={`flex items-start gap-3 px-3 py-2.5 rounded-md border text-sm cursor-pointer transition-colors ${
        checked ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-surface/30 text-foreground/60 hover:bg-surface/60 hover:text-foreground"
      }`}>
      <span className={`mt-0.5 h-4 w-4 rounded flex-shrink-0 border-2 flex items-center justify-center text-xs font-bold transition-colors ${checked ? "border-primary bg-primary text-background" : "border-foreground/30"}`}>
        {checked && "✓"}
      </span>
      {label}
    </div>
  );
}

function VistoCard({ code, name, selected, onClick }: { code: string; name: string; selected: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className={`p-4 rounded-lg border text-center cursor-pointer transition-colors ${selected ? "border-primary/60 bg-primary/10" : "border-border bg-card hover:border-primary/30 hover:bg-surface/50"}`}>
      <p className="text-base font-bold text-primary mb-1">{code}</p>
      <p className={`text-xs ${selected ? "text-foreground/75" : "text-foreground/40"}`}>{name}</p>
    </div>
  );
}

function NivelBadge({ nivel }: { nivel: Nivel }) {
  if (!nivel) return null;
  const variants: Record<string, string> = {
    ALTA: "bg-green-500/20 text-green-300 border-green-500/30",
    MÉDIA: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    BAIXA: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return <Badge variant="outline" className={variants[nivel]}>{nivel}</Badge>;
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

const NewLead = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(FORM_INITIAL);

  const set = (key: keyof FormData, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const toggleEvidencia = (criterio: string) => {
    setForm((f) => {
      const evs = { ...f.evidencias, [criterio]: !f.evidencias[criterio] };
      const count = Object.values(evs).filter(Boolean).length;
      const nivel = calcNivel(f.visto, count);
      return { ...f, evidencias: evs, nivel_elegibilidade: nivel, justificativa: gerarJustificativa(f.visto, nivel, count) };
    });
  };

  const selectVisto = (visto: Visto) =>
    setForm((f) => ({ ...f, visto, evidencias: {}, nivel_elegibilidade: null, justificativa: "" }));

  const countEvidencias = () => Object.values(form.evidencias).filter(Boolean).length;

  const canNext = () => {
    if (step === 1) return !!(form.nome && form.whatsapp && form.email);
    if (step === 2) return !!(form.area && form.vinculo);
    if (step === 3) return form.visto !== null;
    if (step === 5) return !!(form.familiar_eua && form.tentativa_anterior);
    if (step === 6) return !!form.canal;
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert({
          conector_id: profile?.id ?? null,
          consultor: form.consultor || null,
          nome: form.nome,
          email: form.email || null,
          whatsapp: form.whatsapp || null,
          cidade: form.cidade || null,
          idade: form.idade || null,
          area: form.area === "Outro" ? form.outra_area : form.area,
          experiencia: form.experiencia || null,
          cargo: form.cargo || null,
          vinculo: form.vinculo || null,
          operacao_eua: form.operacao_eua || null,
          visto: form.visto,
          nivel_elegibilidade: form.nivel_elegibilidade,
          justificativa: form.justificativa || null,
          motivacao: form.motivacao || null,
          familiar_eua: form.familiar_eua || null,
          tentativa_anterior: form.tentativa_anterior || null,
          nivel_decisao: form.nivel_decisao,
          canal: form.canal || null,
          indicador: form.indicador || null,
          duvidas: form.duvidas || null,
          status_pipeline: "Novo Lead",
        })
        .select()
        .single();

      if (leadError) throw leadError;

      // Salva evidências
      const evidenciasParaSalvar = Object.entries(form.evidencias).map(([criterio, checked]) => ({
        lead_id: lead.id,
        criterio,
        checked,
      }));
      if (evidenciasParaSalvar.length > 0) {
        await supabase.from("lead_evidencias").insert(evidenciasParaSalvar);
      }

      // Registra no pipeline
      await supabase.from("pipeline_stages").insert({
        lead_id: lead.id,
        stage: "Novo Lead",
        moved_by: profile?.id ?? null,
      });

      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar lead. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => { setSaved(false); setStep(1); setForm(FORM_INITIAL); };

  if (saved) {
    const orientacoes = gerarOrientacoes(form);
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 text-center space-y-2">
          <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Lead cadastrado com sucesso!</h2>
          <p className="text-sm text-foreground/60">O lead já aparece no pipeline interno.</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Diagnóstico</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/60">Visto analisado</span>
            <span className="text-sm font-semibold text-primary">{form.visto}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/60">Elegibilidade</span>
            <NivelBadge nivel={form.nivel_elegibilidade} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/60">Critérios atendidos</span>
            <span className="text-sm font-semibold text-foreground">
              {countEvidencias()} / {form.visto ? CRITERIOS[form.visto]?.length : 0}
            </span>
          </div>
          {form.justificativa && (
            <p className="text-sm text-foreground/60 pt-2 border-t border-border leading-relaxed">{form.justificativa}</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Orientações para a reunião</h3>
          <ul className="space-y-2">
            {orientacoes.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={resetForm}>Novo Lead</Button>
          <Button variant="gold" className="flex-1" onClick={() => navigate("/admin/pipeline")}>Ver Pipeline</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Novo Lead</h1>
        <p className="text-foreground/60 text-sm mt-1">Qualificação e diagnóstico de elegibilidade</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-foreground/40">
          <span>{STEPS[step - 1]}</span>
          <span>{step} / {STEPS.length}</span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < step ? "bg-primary" : "bg-surface"}`} />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-5">

        {step === 1 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Identificação do Candidato</h2>
              <p className="text-sm text-foreground/50 mt-0.5">Dados básicos de contato.</p>
            </div>
            <div className="space-y-4">
              <FormField label="Nome completo *"><TextInput value={form.nome} onChange={(v) => set("nome", v)} placeholder="João da Silva" /></FormField>
              <FormField label="WhatsApp *"><TextInput value={form.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="(11) 99999-9999" /></FormField>
              <FormField label="E-mail *"><TextInput type="email" value={form.email} onChange={(v) => set("email", v)} placeholder="candidato@email.com" /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Cidade / Estado"><TextInput value={form.cidade} onChange={(v) => set("cidade", v)} placeholder="São Paulo, SP" /></FormField>
                <FormField label="Idade"><TextInput type="number" value={form.idade} onChange={(v) => set("idade", v)} placeholder="42" /></FormField>
              </div>
              <FormField label="Consultor responsável"><TextInput value={form.consultor} onChange={(v) => set("consultor", v)} placeholder="Nome do consultor" /></FormField>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Perfil Profissional</h2>
              <p className="text-sm text-foreground/50 mt-0.5">Área de atuação e tipo de vínculo.</p>
            </div>
            <div className="space-y-4">
              <FormField label="Área de atuação *"><SelectInput value={form.area} onChange={(v) => set("area", v)} options={AREAS} placeholder="Selecione..." /></FormField>
              {form.area === "Outro" && <FormField label="Qual área?"><TextInput value={form.outra_area} onChange={(v) => set("outra_area", v)} placeholder="Descreva a área" /></FormField>}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Anos de experiência"><TextInput type="number" value={form.experiencia} onChange={(v) => set("experiencia", v)} placeholder="15" /></FormField>
                <FormField label="Cargo atual"><TextInput value={form.cargo} onChange={(v) => set("cargo", v)} placeholder="CEO, Diretor..." /></FormField>
              </div>
              <FormField label="Tipo de vínculo *"><RadioGroup options={VINCULOS} value={form.vinculo} onChange={(v) => set("vinculo", v)} /></FormField>
              {(form.vinculo === "CLT / Empregado formal" || form.vinculo === "Executivo em multinacional") && (
                <FormField label="A empresa possui operação nos EUA?"><RadioGroup options={["Sim", "Não", "Não sei"]} value={form.operacao_eua} onChange={(v) => set("operacao_eua", v)} /></FormField>
              )}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Análise de Visto</h2>
              <p className="text-sm text-foreground/50 mt-0.5">Selecione o visto e marque os critérios atendidos.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <VistoCard code="EB-1A" name="Extraordinary Ability" selected={form.visto === "EB-1A"} onClick={() => selectVisto("EB-1A")} />
              <VistoCard code="EB-1B" name="Outstanding Researcher" selected={form.visto === "EB-1B"} onClick={() => selectVisto("EB-1B")} />
              <VistoCard code="EB-1C" name="Multinational Manager" selected={form.visto === "EB-1C"} onClick={() => selectVisto("EB-1C")} />
              <VistoCard code="EB-2 NIW" name="National Interest Waiver" selected={form.visto === "EB-2 NIW"} onClick={() => selectVisto("EB-2 NIW")} />
            </div>
            {form.visto && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/50">Mínimo para {form.visto}: <span className="text-foreground font-medium">{MIN_CRITERIOS[form.visto]}</span> critério(s)</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{countEvidencias()} marcado(s)</Badge>
                </div>
                <div className="space-y-2">
                  {CRITERIOS[form.visto]?.map((criterio) => (
                    <CheckItem key={criterio} label={criterio} checked={!!form.evidencias[criterio]} onChange={() => toggleEvidencia(criterio)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Diagnóstico de Elegibilidade</h2>
              <p className="text-sm text-foreground/50 mt-0.5">Resultado automático com base nos critérios marcados.</p>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-surface/30 divide-y divide-border">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-foreground/60">Visto analisado</span>
                  <span className="text-sm font-semibold text-primary">{form.visto || "—"}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-foreground/60">Critérios atendidos</span>
                  <span className="text-sm font-semibold text-foreground">{countEvidencias()} / {form.visto ? CRITERIOS[form.visto]?.length : 0}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-foreground/60">Nível de elegibilidade</span>
                  <NivelBadge nivel={form.nivel_elegibilidade} />
                </div>
              </div>
              {form.justificativa && (
                <div className="border-l-2 border-primary pl-3 py-1">
                  <p className="text-sm text-foreground/65 leading-relaxed">{form.justificativa}</p>
                </div>
              )}
              {!form.visto && (
                <div className="flex items-center gap-2 text-sm text-foreground/40 py-6 justify-center">
                  <Circle className="h-4 w-4" /> Nenhum visto selecionado na etapa anterior.
                </div>
              )}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Motivação e Contexto</h2>
              <p className="text-sm text-foreground/50 mt-0.5">Entender o momento e a intenção do candidato.</p>
            </div>
            <div className="space-y-4">
              <FormField label="Principal motivação para ir aos EUA"><TextArea value={form.motivacao} onChange={(v) => set("motivacao", v)} placeholder="Ex.: Trabalho, qualidade de vida, família..." /></FormField>
              <FormField label="Possui familiar ou amigo próximo nos EUA? *"><RadioGroup options={["Sim", "Não"]} value={form.familiar_eua} onChange={(v) => set("familiar_eua", v)} /></FormField>
              <FormField label="Já tentou algum processo de visto? *"><RadioGroup options={["Sim, sem sucesso", "Sim, em andamento", "Nunca tentei"]} value={form.tentativa_anterior} onChange={(v) => set("tentativa_anterior", v)} /></FormField>
              <FormField label={`Nível de decisão: ${SLIDER_LABELS[form.nivel_decisao]}`}>
                <input type="range" min={1} max={5} value={form.nivel_decisao} onChange={(e) => set("nivel_decisao", Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-foreground/30 mt-1"><span>Pesquisando</span><span>Decidido</span></div>
              </FormField>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Origem do Lead</h2>
              <p className="text-sm text-foreground/50 mt-0.5">Como o candidato chegou até nós?</p>
            </div>
            <div className="space-y-4">
              <FormField label="Canal de origem *"><RadioGroup options={CANAIS} value={form.canal} onChange={(v) => set("canal", v)} /></FormField>
              {form.canal === "Indicação" && <FormField label="Indicado por"><TextInput value={form.indicador} onChange={(v) => set("indicador", v)} placeholder="Nome de quem indicou" /></FormField>}
              <FormField label="Dúvidas ou observações"><TextArea value={form.duvidas} onChange={(v) => set("duvidas", v)} placeholder="Anote qualquer observação relevante..." /></FormField>
              {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3">
        {step > 1 ? <Button variant="outline" onClick={() => setStep((s) => s - 1)}>← Voltar</Button> : <div />}
        <div className="flex-1" />
        {step < 6
          ? <Button variant="gold" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>Continuar →</Button>
          : <Button variant="gold" disabled={saving || !canNext()} onClick={handleSubmit}>{saving ? "Salvando..." : "Gerar Briefing ✦"}</Button>
        }
      </div>
    </div>
  );
};

export default NewLead;
