import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, User, Briefcase, CreditCard, Users, CheckCircle, Link2, Copy, Check } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls = "w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-primary/60 focus:bg-primary/[0.05] transition-all duration-200";

const fmtCPF = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
};

const fmtPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};

const ROLE_CONFIG: Record<string, { label: string; cls: string }> = {
  admin:        { label: "Administrador",       cls: "bg-red-500/20 text-red-300 border-red-500/30" },
  estrategista: { label: "Estrategista de Rede", cls: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  lider:        { label: "Líder de Conexão",    cls: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  conector:     { label: "Conector",            cls: "bg-primary/20 text-primary border-primary/30" },
};

const TIPOS_PIX = ["CPF", "E-mail", "Telefone", "Chave aleatória", "Prefiro informar dados bancários"];

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground tracking-wide">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold tracking-widest uppercase text-primary/70">{label}</label>
      {children}
    </div>
  );
}

function ReadOnly({ value }: { value: string | null | undefined }) {
  return (
    <p className={`text-sm px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06] ${value ? "text-foreground" : "text-foreground/30 italic"}`}>
      {value || "Não informado"}
    </p>
  );
}

// ─── Link de indicação ────────────────────────────────────────────────────────

function LinkIndicacao({ profile }: { profile: { referral_code?: string | null; nome?: string | null } }) {
  const [copiado, setCopiado] = useState(false);

  if (!profile.referral_code) return null;

  const link = `${window.location.origin}/indicar?ref=${profile.referral_code}`;

  const copiar = () => {
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-6 space-y-4">
      <div className="flex items-center gap-2.5 pb-1 border-b border-primary/15">
        <Link2 className="h-4 w-4 text-primary"/>
        <h2 className="text-sm font-semibold text-foreground tracking-wide">Meu Link de Indicação</h2>
      </div>
      <p className="text-xs text-foreground/50 leading-relaxed">
        Compartilhe este link com potenciais candidatos. Ao preencher o formulário, o lead será vinculado automaticamente a você.
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white/[0.05] border border-white/10 rounded-lg px-4 py-2.5 text-xs text-foreground/60 truncate font-mono">
          {link}
        </div>
        <button onClick={copiar}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
            copiado
              ? "bg-green-500/20 border border-green-500/30 text-green-400"
              : "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20"
          }`}>
          {copiado ? <><Check className="h-3.5 w-3.5"/> Copiado!</> : <><Copy className="h-3.5 w-3.5"/> Copiar</>}
        </button>
      </div>
      <p className="text-[10px] text-foreground/30">
        Código: <span className="font-mono tracking-widest text-primary/60">{profile.referral_code}</span>
      </p>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const PerfilConector = () => {
  const { profile, isAdmin } = useAuth();
  const [form, setForm]       = useState<Record<string, string>>({});
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [equipe, setEquipe]   = useState<{ nome: string; lider: string | null } | null>(null);
  const [loadingEquipe, setLoadingEquipe] = useState(true);

  // Popula form com dados do profile
  useEffect(() => {
    if (!profile) return;
    setForm({
      nome:       profile.nome        ?? "",
      whatsapp:   profile.whatsapp    ?? "",
      cpf:        profile.cpf         ?? "",
      cidade:     profile.cidade      ?? "",
      linkedin:   profile.linkedin    ?? "",
      instagram:  profile.instagram   ?? "",
      ocupacao:   profile.ocupacao    ?? "",
      tipo_pix:   profile.tipo_pix    ?? "",
      chave_pix:  profile.chave_pix   ?? "",
      banco:      profile.banco       ?? "",
      agencia:    profile.agencia     ?? "",
      conta:      profile.conta       ?? "",
      tipo_conta: profile.tipo_conta  ?? "",
      titular_conta: profile.titular_conta ?? "",
      cpf_titular:   profile.cpf_titular   ?? "",
    });
  }, [profile]);

  // Busca equipe do conector
  useEffect(() => {
    if (!profile?.id) return;
    const fetchEquipe = async () => {
      setLoadingEquipe(true);
      const { data } = await supabase
        .from("equipe_membros")
        .select("equipes(nome, profiles:lider_id(nome))")
        .eq("conector_id", profile.id)
        .maybeSingle();

      if (data?.equipes) {
        const eq = data.equipes as any;
        setEquipe({
          nome: eq.nome,
          lider: eq.profiles?.nome ?? null,
        });
      }
      setLoadingEquipe(false);
    };
    fetchEquipe();
  }, [profile?.id]);

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const isTrad = form.tipo_pix === "Prefiro informar dados bancários";

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    setSaved(false);
    const { error } = await supabase.from("profiles").update({
      nome:          form.nome || null,
      whatsapp:      form.whatsapp || null,
      cpf:           form.cpf || null,
      cidade:        form.cidade || null,
      linkedin:      form.linkedin || null,
      instagram:     form.instagram || null,
      ocupacao:      form.ocupacao || null,
      tipo_pix:      form.tipo_pix || null,
      chave_pix:     isTrad ? null : (form.chave_pix || null),
      banco:         isTrad ? (form.banco || null) : null,
      agencia:       isTrad ? (form.agencia || null) : null,
      conta:         isTrad ? (form.conta || null) : null,
      tipo_conta:    isTrad ? (form.tipo_conta || null) : null,
      titular_conta: isTrad ? (form.titular_conta || null) : null,
      cpf_titular:   isTrad ? (form.cpf_titular || null) : null,
    }).eq("id", profile.id);

    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };

  if (!profile) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );

  const roleCfg = ROLE_CONFIG[profile.role ?? "conector"];

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-foreground/50 text-sm mt-1">Gerencie suas informações pessoais e de pagamento.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-green-400 text-sm">
              <CheckCircle className="h-4 w-4" /> Salvo!
            </div>
          )}
          <Button variant="gold" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Card de identidade */}
      <div className="rounded-xl border border-primary/20 bg-primary/[0.05] p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
          {(profile.nome ?? profile.email ?? "?")[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground truncate">{profile.nome || "Nome não informado"}</p>
          <p className="text-xs text-foreground/40 truncate">{profile.email}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="outline" className={`text-xs ${roleCfg.cls}`}>{roleCfg.label}</Badge>
            <Badge variant="outline" className={`text-xs ${profile.status === "ativo" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}`}>
              {profile.status ?? "ativo"}
            </Badge>
          </div>
        </div>
        {/* Equipe */}
        {!isAdmin && (
          <div className="text-right flex-shrink-0">
            {loadingEquipe
              ? <Loader2 className="h-4 w-4 animate-spin text-foreground/30 ml-auto" />
              : equipe
                ? <>
                    <p className="text-[10px] font-bold tracking-[2px] uppercase text-foreground/30 mb-0.5">Equipe</p>
                    <p className="text-sm font-semibold text-foreground">{equipe.nome}</p>
                    {equipe.lider && <p className="text-xs text-foreground/40">Líder: {equipe.lider}</p>}
                  </>
                : <p className="text-xs text-foreground/30 italic">Sem equipe</p>
            }
          </div>
        )}
      </div>

      {/* Seção 1: Identificação */}
      <Section icon={User} title="Identificação Pessoal">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome completo">
            <input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Seu nome completo" className={inputCls} />
          </Field>
          <Field label="WhatsApp">
            <input value={form.whatsapp} onChange={e => set("whatsapp", fmtPhone(e.target.value))} placeholder="(XX) XXXXX-XXXX" className={inputCls} />
          </Field>
          <Field label="CPF">
            <input value={form.cpf} onChange={e => set("cpf", fmtCPF(e.target.value))} placeholder="000.000.000-00" className={inputCls} />
          </Field>
          <Field label="Cidade / Estado">
            <input value={form.cidade} onChange={e => set("cidade", e.target.value)} placeholder="Ex.: São Paulo, SP" className={inputCls} />
          </Field>
          <Field label="LinkedIn">
            <input value={form.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="linkedin.com/in/seu-perfil" className={inputCls} />
          </Field>
          <Field label="Instagram">
            <input value={form.instagram} onChange={e => set("instagram", e.target.value)} placeholder="@seu.perfil" className={inputCls} />
          </Field>
        </div>
        {/* Campo de e-mail somente leitura */}
        <Field label="E-mail (não editável)">
          <ReadOnly value={profile.email} />
        </Field>
      </Section>

      {/* Seção 2: Perfil profissional (somente leitura) */}
      <Section icon={Briefcase} title="Perfil Profissional">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Ocupação">
            <input value={form.ocupacao} onChange={e => set("ocupacao", e.target.value)} placeholder="Ex.: Empreendedor" className={inputCls} />
          </Field>
          <Field label="Como conheceu o programa">
            <ReadOnly value={profile.como_conheceu} />
          </Field>
          {profile.indicado_por && (
            <Field label="Indicado por">
              <ReadOnly value={profile.indicado_por} />
            </Field>
          )}
          <Field label="Tamanho da rede">
            <ReadOnly value={profile.tamanho_rede} />
          </Field>
        </div>
        {profile.relacionamento && (
          <Field label="Relacionamento com público">
            <ReadOnly value={profile.relacionamento} />
          </Field>
        )}
        {/* Aceites */}
        <div className="flex gap-3 flex-wrap pt-1">
          {profile.aceite_regulamento && (
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <CheckCircle className="h-3.5 w-3.5" /> Regulamento aceito
            </div>
          )}
          {profile.aceite_whatsapp && (
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <CheckCircle className="h-3.5 w-3.5" /> Grupo WhatsApp aceito
            </div>
          )}
        </div>
      </Section>

      {/* Seção 3: Equipe (somente leitura para conector) */}
      {!isAdmin && (
        <Section icon={Users} title="Equipe">
          {loadingEquipe
            ? <div className="flex items-center gap-2 text-foreground/40 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
            : equipe
              ? <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Equipe"><ReadOnly value={equipe.nome} /></Field>
                    <Field label="Líder"><ReadOnly value={equipe.lider} /></Field>
                  </div>
                </div>
              : <div className="rounded-lg border border-dashed border-border p-4 text-center">
                  <p className="text-sm text-foreground/40">Você ainda não foi alocado em uma equipe.</p>
                  <p className="text-xs text-foreground/30 mt-1">Entre em contato com a equipe do Programa Bridges.</p>
                </div>
          }
        </Section>
      )}

      {/* Seção 4: Pagamento */}
      <Section icon={CreditCard} title="Dados para Pagamento de Comissão">
        <Field label="Tipo de chave Pix">
          <select value={form.tipo_pix} onChange={e => set("tipo_pix", e.target.value)}
            className={`${inputCls} cursor-pointer`}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' fill='none'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%23c9a84c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: "40px", appearance: "none" as const }}>
            <option value="" style={{ background: "#1a4a3a" }}>Selecione o tipo</option>
            {TIPOS_PIX.map(t => <option key={t} value={t} style={{ background: "#1a4a3a" }}>{t}</option>)}
          </select>
        </Field>

        {form.tipo_pix && !isTrad && (
          <Field label="Chave Pix">
            <input value={form.chave_pix} onChange={e => set("chave_pix", e.target.value)} placeholder="Informe sua chave Pix" className={inputCls} />
          </Field>
        )}

        {isTrad && (
          <div className="space-y-4">
            <Field label="Banco">
              <input value={form.banco} onChange={e => set("banco", e.target.value)} placeholder="Nome do banco" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Agência">
                <input value={form.agencia} onChange={e => set("agencia", e.target.value)} placeholder="0000" className={inputCls} />
              </Field>
              <Field label="Conta (com dígito)">
                <input value={form.conta} onChange={e => set("conta", e.target.value)} placeholder="00000-0" className={inputCls} />
              </Field>
            </div>
            <Field label="Tipo de conta">
              <div className="flex gap-2">
                {["Corrente", "Poupança"].map(t => (
                  <div key={t} onClick={() => set("tipo_conta", t)}
                    className={`flex-1 text-center px-4 py-3 rounded-lg border text-sm cursor-pointer transition-all ${form.tipo_conta === t ? "border-primary/60 bg-primary/10 text-primary" : "border-white/[0.08] bg-white/[0.04] text-foreground/60 hover:border-primary/30"}`}>
                    {t}
                  </div>
                ))}
              </div>
            </Field>
            <Field label="Titular da conta">
              <input value={form.titular_conta} onChange={e => set("titular_conta", e.target.value)} placeholder="Nome completo do titular" className={inputCls} />
            </Field>
            <Field label="CPF do titular">
              <input value={form.cpf_titular} onChange={e => set("cpf_titular", fmtCPF(e.target.value))} placeholder="000.000.000-00" className={inputCls} />
            </Field>
          </div>
        )}

        {!form.tipo_pix && (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-sm text-foreground/40">Dados de pagamento não informados.</p>
            <p className="text-xs text-foreground/30 mt-1">Preencha para receber suas comissões.</p>
          </div>
        )}
      </Section>

      {/* Seção link de indicação */}
      <LinkIndicacao profile={profile} />

      {/* Botão salvar inferior */}
      <div className="flex justify-end pb-4">
        <Button variant="gold" onClick={handleSave} disabled={saving} className="gap-2 min-w-[140px]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>

    </div>
  );
};

export default PerfilConector;
