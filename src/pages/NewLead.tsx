import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

type Visto = "EB-1A" | "EB-1B" | "EB-1C" | "EB-2 NIW" | null;
type Nivel = "ALTA" | "MÉDIA" | "BAIXA" | null;

interface FormData {
  nome: string; whatsapp: string; email: string;
  cidade: string; idade: string; consultor: string;
  area: string; outra_area: string; experiencia: string;
  cargo: string; vinculo: string; operacao_eua: string;
  visto: Visto; evidencias: Record<string, boolean>;
  nivel_elegibilidade: Nivel; justificativa: string;
  motivacao: string; familiar_eua: string;
  tentativa_anterior: string; nivel_decisao: number;
  canal: string; indicador: string; duvidas: string;
}

const INITIAL: FormData = {
  nome: "", whatsapp: "", email: "", cidade: "", idade: "", consultor: "",
  area: "", outra_area: "", experiencia: "", cargo: "", vinculo: "", operacao_eua: "",
  visto: null, evidencias: {}, nivel_elegibilidade: null, justificativa: "",
  motivacao: "", familiar_eua: "", tentativa_anterior: "", nivel_decisao: 3,
  canal: "", indicador: "", duvidas: "",
};

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
    "Autoria de livros ou artigos acadêmicos em periódicos de circulação internacional",
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
const SLIDER_LABELS = ["", "Ainda pesquisando", "Curiosidade inicial", "Em avaliação", "Pronto para decidir", "Decisão tomada"];
const STEPS = ["Identificação", "Perfil", "Visto", "Diagnóstico", "Contexto", "Origem"];

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
  if (nivel === "ALTA") return `Candidato atende ${count} critério(s) para ${visto} — acima do mínimo de ${min}. Perfil elegível para protocolo.`;
  if (nivel === "MÉDIA") return `Candidato atende ${count} de ${min} critério(s) mínimos para ${visto}. Recomendado aprofundar evidências antes da reunião.`;
  return `Candidato atende apenas ${count} critério(s) para ${visto}. Mínimo: ${min}. Avaliar outros vistos ou buscar documentação adicional.`;
}

function gerarOrientacoes(data: FormData): string[] {
  const tips: string[] = [];
  if (data.nivel_decisao >= 4) tips.push(`Alto nível de decisão (${data.nivel_decisao}/5) — abordagem direta e objetiva recomendada.`);
  if (data.familiar_eua === "Sim") tips.push("Possui familiar nos EUA — explorar esse vínculo como âncora emocional.");
  if (data.canal === "Indicação" && data.indicador) tips.push(`Veio por indicação de ${data.indicador} — mencionar o nome fortalece o rapport.`);
  if (data.tentativa_anterior === "Sim, sem sucesso") tips.push("Tentativa anterior sem sucesso — abordar com sensibilidade.");
  if (data.visto?.startsWith("EB-1")) tips.push("EB-1 não requer oferta de emprego — destacar essa vantagem estratégica.");
  if (data.visto === "EB-2 NIW") tips.push("EB-2 NIW não exige patrocinador — o candidato controla o próprio processo.");
  if (tips.length === 0) tips.push("Apresentar o diagnóstico completo e alinhar as próximas etapas.");
  return tips;
}

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground/70">
      {label}{required && <span className="text-primary ml-1">*</span>}
    </label>
    {children}
  </div>
);

const ic = "w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors";

const RadioOption = ({ label, value, selected, onChange }: { label: string; value: string; selected: boolean; onChange: (v: string) => void }) => (
  <div onClick={() => onChange(value)} className={`flex items-center gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors text-sm ${selected ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-surface text-foreground/60 hover:text-foreground"}`}>
    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${selected ? "border-primary bg-primary" : "border-foreground/30"}`} />
    {label}
  </div>
);

const CheckOption = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
  <div onClick={onChange} className={`flex items-center gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors text-sm ${checked ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-surface text-foreground/60 hover:text-foreground"}`}>
    <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${checked ? "border-primary bg-primary" : "border-foreground/30"}`}>
      {checked && <span className="text-background text-[10px] font-bold leading-none">✓</span>}
    </div>
    {label}
  </div>
);

const VistoCard = ({ code, name, desc, selected, onClick }: { code: string; name: string; desc: string; selected: boolean; onClick: () => void }) => (
  <div onClick={onClick} className={`p-4 rounded-lg border cursor-pointer transition-colors ${selected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-border/80"}`}>
    <div className={`text-base font-bold mb-0.5 ${selected ? "text-primary" : "text-foreground"}`}>{code}</div>
    <div className="text-xs text-foreground/50">{name}</div>
    <div className="text-xs text-foreground/30 mt-1">{desc}</div>
  </div>
);

const nivelVariant: Record<string, string> = {
  ALTA: "bg-green-500/20 text-green-300 border-green-500/30",
  MÉDIA: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  BAIXA: "bg-red-500/20 text-red-300 border-red-500/30",
};

const NewLead = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<FormData>(INITIAL);

  const set = (key: keyof FormData, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const toggleEvidencia = (criterio: string) => {
    setForm((f) => {
      const evs = { ...f.evidencias, [criterio]: !f.evidencias[criterio] };
      const count = Object.values(evs).filter(Boolean).length;
      const nivel = calcNivel(f.visto, count);
      return { ...f, evidencias: evs, nivel_elegibilidade: nivel, justificativa: gerarJustificativa(f.visto, nivel, count) };
    });
  };

  const selectVisto = (visto: Visto) => setForm((f) => ({ ...f, visto, evidencias: {}, nivel_elegibilidade: null, justificativa: "" }));
  const countEv = () => Object.values(form.evidencias).filter(Boolean).length;

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
    // TODO: integrar Supabase
    // import { supabase } from "@/integrations/supabase/client";
    // const { data: { user } } = await supabase.auth.getUser();
    // const { data: lead } = await supabase.from("leads").insert({ conector_id: user.id, nome: form.nome, ... }).select().single();
    // await supabase.from("lead_evidencias").insert(Object.entries(form.evidencias).map(([criterio, checked]) => ({ lead_id: lead.id, criterio, checked })));
    // await supabase.from("pipeline_stages").insert({ lead_id: lead.id, stage: "Novo Lead", moved_by: user.id });
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
  };

  if (saved) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-xl">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lead Cadastrado!</h1>
            <p className="text-foreground/60 text-sm">Briefing gerado com sucesso.</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h2 className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Diagnóstico</h2>
          <div className="flex items-center justify-between"><span className="text-sm text-foreground/60">Visto analisado</span><span className="text-sm font-bold text-primary">{form.visto}</span></div>
          <div className="flex items-center justify-between"><span className="text-sm text-foreground/60">Critérios atendidos</span><span className="text-sm font-bold text-foreground">{countEv()} / {form.visto ? CRITERIOS[form.visto]?.length : 0}</span></div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/60">Elegibilidade</span>
            {form.nivel_elegibilidade && <Badge variant="outline" className={nivelVariant[form.nivel_elegibilidade]}>{form.nivel_elegibilidade}</Badge>}
          </div>
          {form.justificativa && <p className="text-xs text-foreground/50 border-l-2 border-primary/40 pl-3 leading-relaxed pt-1">{form.justificativa}</p>}
        </div>
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h2 className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Orientações para a Reunião</h2>
          <ul className="space-y-2">
            {gerarOrientacoes(form).map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/70"><span className="text-primary mt-0.5 flex-shrink-0">✦</span>{tip}</li>
            ))}
          </ul>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => { setForm(INITIAL); setStep(1); setSaved(false); }}>Novo Lead</Button>
          <Button variant="gold" className="flex-1" onClick={() => navigate("/dashboard")}>Ver Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Novo Lead</h1>
        <p className="text-foreground/60 text-sm mt-1">Preencha o briefing de qualificação</p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-xs text-foreground/40">{STEPS[step - 1]}</span>
          <span className="text-xs text-primary font-medium">{step} / {STEPS.length}</span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < step ? "bg-primary" : "bg-border"}`} />)}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        {step === 1 && (
          <>
            <div><h2 className="text-lg font-semibold text-foreground">Identificação do Candidato</h2><p className="text-sm text-foreground/50">Dados básicos de contato.</p></div>
            <Field label="Nome completo" required><input className={ic} value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="João da Silva" /></Field>
            <Field label="WhatsApp" required><input className={ic} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="(11) 99999-9999" /></Field>
            <Field label="E-mail" required><input className={ic} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="joao@email.com" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cidade / Estado"><input className={ic} value={form.cidade} onChange={(e) => set("cidade", e.target.value)} placeholder="São Paulo, SP" /></Field>
              <Field label="Idade"><input className={ic} type="number" value={form.idade} onChange={(e) => set("idade", e.target.value)} placeholder="42" /></Field>
            </div>
            <Field label="Consultor responsável"><input className={ic} value={form.consultor} onChange={(e) => set("consultor", e.target.value)} placeholder="Nome do consultor" /></Field>
          </>
        )}
        {step === 2 && (
          <>
            <div><h2 className="text-lg font-semibold text-foreground">Perfil Profissional</h2><p className="text-sm text-foreground/50">Área de atuação e vínculo atual.</p></div>
            <Field label="Área de atuação" required>
              <select className={ic + " cursor-pointer"} value={form.area} onChange={(e) => set("area", e.target.value)}>
                <option value="">Selecione...</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            {form.area === "Outro" && <Field label="Qual área?"><input className={ic} value={form.outra_area} onChange={(e) => set("outra_area", e.target.value)} placeholder="Descreva a área" /></Field>}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Anos de experiência"><input className={ic} type="number" value={form.experiencia} onChange={(e) => set("experiencia", e.target.value)} placeholder="15" /></Field>
              <Field label="Cargo atual"><input className={ic} value={form.cargo} onChange={(e) => set("cargo", e.target.value)} placeholder="CEO, Diretor..." /></Field>
            </div>
            <Field label="Tipo de vínculo" required>
              <div className="space-y-2">{VINCULOS.map((v) => <RadioOption key={v} label={v} value={v} selected={form.vinculo === v} onChange={(val) => set("vinculo", val)} />)}</div>
            </Field>
            {(form.vinculo === "CLT / Empregado formal" || form.vinculo === "Executivo em multinacional") && (
              <Field label="A empresa possui operação nos EUA?">
                <div className="space-y-2">{["Sim", "Não", "Não sei"].map((v) => <RadioOption key={v} label={v} value={v} selected={form.operacao_eua === v} onChange={(val) => set("operacao_eua", val)} />)}</div>
              </Field>
            )}
          </>
        )}
        {step === 3 && (
          <>
            <div><h2 className="text-lg font-semibold text-foreground">Análise de Visto</h2><p className="text-sm text-foreground/50">Selecione o visto e marque os critérios atendidos.</p></div>
            <div className="grid grid-cols-2 gap-3">
              <VistoCard code="EB-1A" name="Extraordinary Ability" desc="Mín. 3 de 10 critérios" selected={form.visto === "EB-1A"} onClick={() => selectVisto("EB-1A")} />
              <VistoCard code="EB-1B" name="Outstanding Researcher" desc="Mín. 2 de 6 critérios" selected={form.visto === "EB-1B"} onClick={() => selectVisto("EB-1B")} />
              <VistoCard code="EB-1C" name="Multinational Manager" desc="2 critérios obrigatórios" selected={form.visto === "EB-1C"} onClick={() => selectVisto("EB-1C")} />
              <VistoCard code="EB-2 NIW" name="National Interest Waiver" desc="Mín. 1 critério" selected={form.visto === "EB-2 NIW"} onClick={() => selectVisto("EB-2 NIW")} />
            </div>
            {form.visto && (
              <>
                <div className="flex items-center justify-between py-2 border-t border-border">
                  <span className="text-xs text-foreground/50">Critérios marcados</span>
                  <Badge variant="outline" className={countEv() >= MIN_CRITERIOS[form.visto] ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"}>
                    {countEv()} / {MIN_CRITERIOS[form.visto]} mínimo
                  </Badge>
                </div>
                <div className="space-y-2">
                  {CRITERIOS[form.visto]?.map((criterio) => <CheckOption key={criterio} label={criterio} checked={!!form.evidencias[criterio]} onChange={() => toggleEvidencia(criterio)} />)}
                </div>
              </>
            )}
          </>
        )}
        {step === 4 && (
          <>
            <div><h2 className="text-lg font-semibold text-foreground">Diagnóstico de Elegibilidade</h2><p className="text-sm text-foreground/50">Resultado automático com base nos critérios marcados.</p></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-md bg-surface border border-border"><span className="text-sm text-foreground/60">Visto analisado</span><span className="text-sm font-bold text-primary">{form.visto || "—"}</span></div>
              <div className="flex items-center justify-between p-3 rounded-md bg-surface border border-border"><span className="text-sm text-foreground/60">Critérios atendidos</span><span className="text-sm font-bold text-foreground">{countEv()} / {form.visto ? CRITERIOS[form.visto]?.length : 0}</span></div>
              <div className="flex items-center justify-between p-3 rounded-md bg-surface border border-border">
                <span className="text-sm text-foreground/60">Nível de elegibilidade</span>
                {form.nivel_elegibilidade ? <Badge variant="outline" className={nivelVariant[form.nivel_elegibilidade]}>{form.nivel_elegibilidade}</Badge> : <span className="text-sm text-foreground/30">—</span>}
              </div>
            </div>
            {form.justificativa && <div className="p-3 rounded-md border-l-2 border-primary bg-primary/5 text-sm text-foreground/60 leading-relaxed">{form.justificativa}</div>}
            {!form.visto && <p className="text-sm text-foreground/40 text-center py-4">Volte ao passo anterior e selecione um visto para ver o diagnóstico.</p>}
          </>
        )}
        {step === 5 && (
          <>
            <div><h2 className="text-lg font-semibold text-foreground">Motivação e Contexto</h2><p className="text-sm text-foreground/50">Entender o momento e a intenção do candidato.</p></div>
            <Field label="Principal motivação para ir aos EUA">
              <textarea className={ic + " resize-none min-h-[88px]"} value={form.motivacao} onChange={(e) => set("motivacao", e.target.value)} placeholder="Ex.: Trabalho, qualidade de vida, família, negócio..." />
            </Field>
            <Field label="Possui familiar ou amigo próximo nos EUA?" required>
              <div className="space-y-2">{["Sim", "Não"].map((v) => <RadioOption key={v} label={v} value={v} selected={form.familiar_eua === v} onChange={(val) => set("familiar_eua", val)} />)}</div>
            </Field>
            <Field label="Já tentou algum processo de visto?" required>
              <div className="space-y-2">{["Sim, sem sucesso", "Sim, em andamento", "Nunca tentei"].map((v) => <RadioOption key={v} label={v} value={v} selected={form.tentativa_anterior === v} onChange={(val) => set("tentativa_anterior", val)} />)}</div>
            </Field>
            <Field label={`Nível de decisão: ${form.nivel_decisao}/5 — ${SLIDER_LABELS[form.nivel_decisao]}`}>
              <input type="range" min={1} max={5} value={form.nivel_decisao} onChange={(e) => set("nivel_decisao", Number(e.target.value))} className="w-full accent-primary cursor-pointer" />
              <div className="flex justify-between text-xs text-foreground/30 mt-1"><span>Pesquisando</span><span>Decisão tomada</span></div>
            </Field>
          </>
        )}
        {step === 6 && (
          <>
            <div><h2 className="text-lg font-semibold text-foreground">Origem do Lead</h2><p className="text-sm text-foreground/50">Como o candidato chegou até nós?</p></div>
            <Field label="Canal de origem" required>
              <div className="space-y-2">{CANAIS.map((v) => <RadioOption key={v} label={v} value={v} selected={form.canal === v} onChange={(val) => set("canal", val)} />)}</div>
            </Field>
            {form.canal === "Indicação" && <Field label="Indicado por"><input className={ic} value={form.indicador} onChange={(e) => set("indicador", e.target.value)} placeholder="Nome de quem indicou" /></Field>}
            <Field label="Dúvidas ou observações do candidato">
              <textarea className={ic + " resize-none min-h-[88px]"} value={form.duvidas} onChange={(e) => set("duvidas", e.target.value)} placeholder="Anote qualquer observação relevante..." />
            </Field>
          </>
        )}
      </div>

      <div className="flex justify-between gap-3">
        {step > 1 ? (
          <Button variant="outline" className="gap-1.5" onClick={() => setStep((s) => s - 1)}><ChevronLeft className="h-4 w-4" /> Voltar</Button>
        ) : <div />}
        {step < 6 ? (
          <Button variant="gold" className="gap-1.5" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>Continuar <ChevronRight className="h-4 w-4" /></Button>
        ) : (
          <Button variant="gold" className="gap-1.5" disabled={saving || !canNext()} onClick={handleSubmit}>{saving ? "Salvando..." : "Gerar Briefing ✦"}</Button>
        )}
      </div>
    </div>
  );
};

export default NewLead;
