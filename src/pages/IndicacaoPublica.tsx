import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2 } from "lucide-react";

// Campos básicos de identificação — apenas o necessário para um lead inicial
interface FormData {
  nome: string; email: string; whatsapp: string; cidade: string;
}

const INITIAL: FormData = { nome: "", email: "", whatsapp: "", cidade: "" };

const fmtPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};

const inputCls = "w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-primary/60 focus:bg-primary/[0.05] transition-all";

const IndicacaoPublica = () => {
  const [params] = useSearchParams();
  const ref = params.get("ref");

  const [conector, setConector] = useState<{ nome: string | null; id: string } | null>(null);
  const [loadingConector, setLoadingConector] = useState(true);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) { setLoadingConector(false); return; }
    supabase.from("profiles").select("id, nome")
      .eq("referral_code", ref.toUpperCase()).maybeSingle()
      .then(({ data }) => {
        setConector(data ?? null);
        setLoadingConector(false);
      });
  }, [ref]);

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = form.nome && form.whatsapp;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const { error: e } = await supabase.from("leads").insert({
        conector_id:     conector?.id ?? null,
        nome:            form.nome,
        email:           form.email || null,
        whatsapp:        form.whatsapp,
        cidade:          form.cidade || null,
        status_pipeline: "Lead Indicado",
        arquivado:       false,
        passou_por_disponivel: false,
      } as any);
      if (e) throw e;
      setDone(true);
    } catch {
      setError("Erro ao enviar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingConector) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-5 w-5 animate-spin text-primary"/>
    </div>
  );

  // Link inválido (sem ref ou ref não encontrado)
  if (ref && !conector) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center gap-4">
      <p className="text-foreground/50 text-sm">Link de indicação inválido ou expirado.</p>
      <Link to="/login" className="text-primary text-sm hover:underline">Ir para o login</Link>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md text-center space-y-5">
        <CheckCircle2 className="h-14 w-14 text-primary mx-auto"/>
        <div>
          <p className="text-[10px] font-bold tracking-[4px] uppercase text-primary mb-2">Recebido!</p>
          <h2 className="text-2xl font-bold text-foreground mb-2">Obrigado, <span className="text-primary italic font-light">{form.nome.split(" ")[0]}</span>!</h2>
          <p className="text-sm text-foreground/50 leading-relaxed max-w-sm mx-auto">
            Suas informações foram recebidas. Em breve nossa equipe entrará em contato pelo WhatsApp para dar continuidade.
          </p>
        </div>
        <p className="text-xs text-foreground/30 italic">
          The Bridge Consulting — Building bridges, changing lives.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center bg-background px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-[10px] font-bold tracking-[4px] uppercase text-primary mb-1">The Bridge Consulting</p>
        <h1 className="text-2xl font-bold text-foreground">Programa <span className="text-primary italic font-light">Bridges</span></h1>
        {conector?.nome && (
          <p className="text-xs text-foreground/40 mt-2">
            Indicado por <span className="text-foreground/60 font-medium">{conector.nome}</span>
          </p>
        )}
        <p className="text-xs text-foreground/40 mt-2 max-w-xs mx-auto leading-relaxed">
          Preencha seus dados abaixo e nossa equipe entrará em contato para apresentar as oportunidades de imigração para os EUA.
        </p>
      </div>

      {/* Form */}
      <div className="w-full max-w-md rounded-2xl border border-primary/15 bg-card p-8 shadow-2xl space-y-5">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold tracking-widest uppercase text-primary/80">
            Nome completo <span className="text-primary">*</span>
          </label>
          <input value={form.nome} onChange={e => set("nome", e.target.value)}
            placeholder="Seu nome completo" className={inputCls}/>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold tracking-widest uppercase text-primary/80">
            WhatsApp <span className="text-primary">*</span>
          </label>
          <input value={form.whatsapp} onChange={e => set("whatsapp", fmtPhone(e.target.value))}
            placeholder="(XX) XXXXX-XXXX" className={inputCls}/>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold tracking-widest uppercase text-primary/80">E-mail</label>
          <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
            placeholder="voce@email.com" className={inputCls}/>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold tracking-widest uppercase text-primary/80">Cidade / Estado</label>
          <input value={form.cidade} onChange={e => set("cidade", e.target.value)}
            placeholder="Ex.: São Paulo, SP" className={inputCls}/>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
        )}

        <button onClick={handleSubmit} disabled={!canSubmit || saving}
          className="w-full py-3 rounded-lg bg-primary text-background font-semibold text-sm tracking-wide hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {saving ? "Enviando..." : "Quero saber mais ✦"}
        </button>

        <p className="text-xs text-foreground/30 text-center leading-relaxed">
          Seus dados são usados exclusivamente para entrar em contato sobre oportunidades de imigração.
        </p>
      </div>
    </div>
  );
};

export default IndicacaoPublica;
