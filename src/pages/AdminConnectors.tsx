import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UserCheck, UserX, Users, Loader2, RefreshCw,
  ClipboardList, ChevronDown, ChevronUp, Send, X,
  UsersRound, Plus, Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Role = "conector" | "lider" | "estrategista" | "admin";

interface ConectorRow {
  id: string; nome: string | null; email: string | null;
  status: "ativo" | "inativo"; role: Role;
  total_leads: number; total_comissao: number;
  equipe_nome: string | null;
}

type CandStatus = "pendente" | "em_entrevista" | "aprovado" | "rejeitado";

interface Candidatura {
  id: string; nome: string; email: string; whatsapp: string;
  cidade: string | null; ocupacao: string | null; tamanho_rede: string | null;
  canais_indicacao: string[] | null; como_conheceu: string | null;
  indicado_por: string | null; indicado_por_profile_id: string | null;
  relacionamento: string | null;
  status: CandStatus; notas_admin: string | null; created_at: string;
  convidado_at: string | null;
}

interface Equipe {
  id: string; nome: string;
  lider: { id: string; nome: string | null } | null;
  supervisor: { id: string; nome: string | null } | null;
  membros: { id: string; nome: string | null; email: string | null }[];
  ativa: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_CAND: Record<CandStatus, { label: string; cls: string }> = {
  pendente:      { label: "Pendente",      cls: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  em_entrevista: { label: "Em entrevista", cls: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  aprovado:      { label: "Aprovado",      cls: "bg-green-500/20 text-green-300 border-green-500/30" },
  rejeitado:     { label: "Rejeitado",     cls: "bg-red-500/20 text-red-300 border-red-500/30" },
};

const ROLE_LABEL: Record<Role, string> = {
  conector:     "Conector",
  lider:        "Líder de Conexão",
  estrategista: "Estrategista de Rede",
};

const ROLE_CLS: Record<Role, string> = {
  conector:     "bg-primary/10 text-primary border-primary/30",
  lider:        "bg-blue-500/20 text-blue-300 border-blue-500/30",
  estrategista: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

// ─── Modal de credenciais ─────────────────────────────────────────────────────

function CredenciaisModal({ nome, email, senha, onClose }: {
  nome: string; email: string; senha: string; onClose: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const texto = `Olá, ${nome}! Seu acesso ao Programa Bridges foi aprovado 🎉\n\nAcesse: https://programabridges.lovable.app/login\n\nE-mail: ${email}\nSenha temporária: ${senha}\n\nRecomendamos alterar sua senha no primeiro acesso.`;
  const copiar = () => { navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2500); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-primary/30 bg-card shadow-2xl">
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div><h3 className="text-base font-semibold text-foreground">✦ Conta criada com sucesso</h3><p className="text-xs text-foreground/50 mt-0.5">{nome} agora é um Conector Bridges</p></div>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground"><X className="h-5 w-5"/></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-foreground/50 leading-relaxed">Compartilhe as credenciais abaixo pelo WhatsApp. O conector poderá alterar a senha após o primeiro acesso.</p>
          <div className="rounded-lg bg-surface/50 border border-border p-4 space-y-2.5 font-mono text-sm">
            <div className="flex justify-between items-center"><span className="text-foreground/40 text-xs uppercase tracking-widest">E-mail</span><span className="text-foreground">{email}</span></div>
            <div className="h-px bg-border"/>
            <div className="flex justify-between items-center"><span className="text-foreground/40 text-xs uppercase tracking-widest">Senha</span><span className="text-primary font-bold tracking-wider">{senha}</span></div>
          </div>
          <button onClick={copiar} className="w-full py-2.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">{copiado ? "✓ Copiado!" : "Copiar mensagem para WhatsApp"}</button>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-xs text-foreground/40 whitespace-pre-wrap leading-relaxed">{texto}</div>
        </div>
        <div className="px-5 pb-5"><Button variant="gold" onClick={onClose} className="w-full">Fechar</Button></div>
      </div>
    </div>
  );
}

// ─── Modal de rejeição ────────────────────────────────────────────────────────

function RejectModal({ nome, onConfirm, onCancel, loading }: {
  nome: string; onConfirm: (m: string) => void; onCancel: () => void; loading: boolean;
}) {
  const [motivo, setMotivo] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-card shadow-2xl">
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div><h3 className="text-base font-semibold">Rejeitar candidatura</h3><p className="text-xs text-foreground/50 mt-0.5">{nome}</p></div>
          <button onClick={onCancel}><X className="h-5 w-5 text-foreground/40"/></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="text-xs font-semibold tracking-widest uppercase text-primary/80">Motivo <span className="text-primary">*</span></label>
          <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3} placeholder="Ex.: Perfil não se encaixa no momento..."
            className="w-full bg-surface/50 border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary resize-none"/>
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="flex-1">Cancelar</Button>
          <Button onClick={() => motivo.trim() && onConfirm(motivo.trim())} disabled={!motivo.trim() || loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0">{loading ? "Rejeitando..." : "Rejeitar"}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de promoção de cargo ───────────────────────────────────────────────

function PromoteModal({ conector, onConfirm, onCancel, loading }: {
  conector: ConectorRow; onConfirm: (role: Role) => void; onCancel: () => void; loading: boolean;
}) {
  const opcoes: Role[] = conector.role === "conector"
    ? ["lider", "estrategista"]
    : conector.role === "lider"
    ? ["conector", "estrategista"]
    : ["conector", "lider"];

  const [selected, setSelected] = useState<Role>(opcoes[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl border border-primary/30 bg-card shadow-2xl">
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div><h3 className="text-base font-semibold">Alterar cargo</h3><p className="text-xs text-foreground/50 mt-0.5">{conector.nome}</p></div>
          <button onClick={onCancel}><X className="h-5 w-5 text-foreground/40"/></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-foreground/50">Cargo atual: <span className="text-foreground font-medium">{ROLE_LABEL[conector.role]}</span></p>
          <div className="flex flex-col gap-2">
            {opcoes.map(r => (
              <div key={r} onClick={() => setSelected(r)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm cursor-pointer transition-all ${selected === r ? "border-primary/60 bg-primary/10 text-primary/90" : "border-white/[0.08] bg-white/[0.04] text-foreground/60 hover:border-primary/30"}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected === r ? "border-primary bg-primary" : "border-white/25"}`}>
                  {selected === r && <div className="w-1.5 h-1.5 rounded-full bg-background"/>}
                </div>
                {ROLE_LABEL[r]}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="flex-1">Cancelar</Button>
          <Button variant="gold" onClick={() => onConfirm(selected)} disabled={loading} className="flex-1">{loading ? "Salvando..." : "Confirmar"}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal criar equipe ───────────────────────────────────────────────────────

function CreateEquipeModal({ lideres, onConfirm, onCancel, loading }: {
  lideres: ConectorRow[]; onConfirm: (nome: string, liderId: string) => void;
  onCancel: () => void; loading: boolean;
}) {
  const [nome, setNome] = useState("");
  const [liderId, setLiderId] = useState(lideres[0]?.id ?? "");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl border border-primary/30 bg-card shadow-2xl">
        <div className="flex items-start justify-between p-5 border-b border-border">
          <h3 className="text-base font-semibold">Nova equipe</h3>
          <button onClick={onCancel}><X className="h-5 w-5 text-foreground/40"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-widest uppercase text-primary/80">Nome da equipe <span className="text-primary">*</span></label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Equipe São Paulo"
              className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-primary/60 transition-colors"/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-widest uppercase text-primary/80">Líder <span className="text-primary">*</span></label>
            <select value={liderId} onChange={e => setLiderId(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/60 transition-colors cursor-pointer">
              <option value="" style={{background:"#1a4a3a"}}>Selecione o líder</option>
              {lideres.map(l => (
                <option key={l.id} value={l.id} style={{background:"#1a4a3a"}}>
                  {l.nome ?? l.email}{l.role === "admin" ? " (Admin)" : ""}
                </option>
              ))}
            </select>
            {lideres.length === 0 && <p className="text-xs text-red-400">Nenhum líder disponível.</p>}
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="flex-1">Cancelar</Button>
          <Button variant="gold" onClick={() => nome.trim() && liderId && onConfirm(nome.trim(), liderId)} disabled={!nome.trim() || !liderId || loading} className="flex-1">{loading ? "Criando..." : "Criar equipe"}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Card de candidatura ──────────────────────────────────────────────────────

function CandCard({ c, conectores, onAction, onVincularIndicador }: {
  c: Candidatura;
  conectores: ConectorRow[];
  onAction: (id: string, a: "entrevista" | "aprovar" | "rejeitar") => void;
  onVincularIndicador: (candidaturaId: string, profileId: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CAND[c.status];

  // Só mostra o seletor se veio por indicação e ainda não foi vinculado
  const precisaVincular = c.como_conheceu === "Indicação de outro conector";

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-start justify-between p-4 gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{c.nome}</p>
            <Badge variant="outline" className={`text-xs ${cfg.cls}`}>{cfg.label}</Badge>
          </div>
          <p className="text-xs text-foreground/50 mt-0.5">{c.email} · {c.whatsapp}</p>
          {c.cidade && <p className="text-xs text-foreground/40">{c.cidade}</p>}
          <p className="text-xs text-foreground/30 mt-1">{fmtDate(c.created_at)}</p>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-foreground/40 hover:text-foreground mt-0.5">
          {expanded ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {c.ocupacao && <div><p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest mb-1">Ocupação</p><p className="text-sm text-foreground/70">{c.ocupacao}</p></div>}
          {c.tamanho_rede && <div><p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest mb-1">Rede</p><p className="text-sm text-foreground/70">{c.tamanho_rede}</p></div>}
          {c.canais_indicacao?.length && <div><p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest mb-1">Canais</p><div className="flex flex-wrap gap-1.5">{c.canais_indicacao.map(ch => <span key={ch} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary/80">{ch.split("—")[0].trim()}</span>)}</div></div>}

          {/* Indicação — texto e vínculo com perfil */}
          {c.como_conheceu && (
            <div>
              <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest mb-1">Como conheceu</p>
              <p className="text-sm text-foreground/70 mb-2">{c.como_conheceu}{c.indicado_por ? ` — "${c.indicado_por}"` : ""}</p>
              {precisaVincular && (
                <div className="space-y-1.5">
                  <p className="text-xs text-foreground/40">Vincular ao perfil do conector que indicou:</p>
                  <select
                    value={c.indicado_por_profile_id ?? ""}
                    onChange={e => onVincularIndicador(c.id, e.target.value || null)}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60 transition-colors cursor-pointer">
                    <option value="" style={{background:"#1a4a3a"}}>Não identificado</option>
                    {conectores.filter(p => p.role !== "admin").map(p => (
                      <option key={p.id} value={p.id} style={{background:"#1a4a3a"}}>{p.nome ?? p.email}</option>
                    ))}
                  </select>
                  {c.indicado_por_profile_id && (
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <span>✓</span> Vínculo salvo — equipe será criada automaticamente ao promover
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {c.relacionamento && <div><p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest mb-1">Relacionamento</p><p className="text-sm text-foreground/70">{c.relacionamento}</p></div>}
          {c.convidado_at && <div className="rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-300">Acesso enviado em {fmtDate(c.convidado_at)}</div>}
        </div>
      )}
      {c.status !== "aprovado" && c.status !== "rejeitado" && (
        <div className="flex gap-2 px-4 pb-4">
          {c.status === "pendente" && <Button variant="outline" size="sm" onClick={() => onAction(c.id, "entrevista")} className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10 text-xs">Chamar para entrevista</Button>}
          {c.status === "em_entrevista" && <Button variant="gold" size="sm" onClick={() => onAction(c.id, "aprovar")} className="gap-1.5 text-xs"><Send className="h-3.5 w-3.5"/>Aprovar e criar acesso</Button>}
          <Button variant="outline" size="sm" onClick={() => onAction(c.id, "rejeitar")} className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs ml-auto"><X className="h-3.5 w-3.5 mr-1"/>Rejeitar</Button>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

type Tab = "conectores" | "candidaturas" | "equipes";

const AdminConnectors = () => {
  const [tab, setTab] = useState<Tab>("candidaturas");

  // Conectores
  const [conectores, setConectores] = useState<ConectorRow[]>([]);
  // Candidaturas
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [filterStatus, setFilterStatus] = useState<CandStatus | "todas">("pendente");
  // Equipes
  const [equipes, setEquipes] = useState<Equipe[]>([]);

  const [loading, setLoading]         = useState(true);
  const [togglingId, setTogglingId]   = useState<string | null>(null);
  const [actioning, setActioning]     = useState<string | null>(null);

  // Modais
  const [rejectTarget, setRejectTarget]     = useState<Candidatura | null>(null);
  const [credenciais, setCredenciais]       = useState<{nome:string;email:string;senha:string}|null>(null);
  const [promoteTarget, setPromoteTarget]   = useState<ConectorRow | null>(null);
  const [showCreateEquipe, setShowCreateEquipe] = useState(false);
  // Alocar conector em equipe
  const [alocandoConector, setAlocandoConector] = useState<string | null>(null); // conector id
  const [alocandoEquipe, setAlocandoEquipe]     = useState<string>("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchConectores = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles").select("id,nome,email,status,role").in("role",["conector","lider","estrategista","admin"]).order("nome");

    if (!profiles) { setLoading(false); return; }

    // Busca equipe de cada um
    const { data: membros } = await supabase.from("equipe_membros").select("conector_id, equipes(nome)");
    const equipeMap: Record<string, string> = {};
    (membros ?? []).forEach((m: any) => { equipeMap[m.conector_id] = m.equipes?.nome ?? null; });

    const rows = await Promise.all(profiles.map(async (p) => {
      const { count: tl } = await supabase.from("leads").select("*",{count:"exact",head:true}).eq("conector_id",p.id);
      const { data: comissoes } = await supabase.from("comissoes").select("valor_pago,valor_liberado").eq("conector_id",p.id);
      return {
        id: p.id, nome: p.nome, email: p.email,
        status: p.status as "ativo"|"inativo",
        role: p.role as Role,
        total_leads: tl ?? 0,
        total_comissao: (comissoes??[]).reduce((s:number,c:any)=>s+(c.valor_pago??0)+(c.valor_liberado??0),0),
        equipe_nome: equipeMap[p.id] ?? null,
      };
    }));
    setConectores(rows);
    setLoading(false);
  };

  const fetchCandidaturas = async () => {
    setLoading(true);
    const { data } = await supabase.from("candidaturas")
      .select("id,nome,email,whatsapp,cidade,ocupacao,tamanho_rede,canais_indicacao,como_conheceu,indicado_por,indicado_por_profile_id,relacionamento,status,notas_admin,created_at,convidado_at")
      .order("created_at",{ascending:false});
    setCandidaturas((data??[]) as Candidatura[]);
    setLoading(false);
  };

  const fetchEquipes = async () => {
    setLoading(true);
    const { data } = await supabase.from("equipes")
      .select(`id, nome, ativa, lider:lider_id(id,nome), supervisor:supervisor_id(id,nome), equipe_membros(conector_id, profiles:conector_id(id,nome,email))`)
      .eq("ativa",true).order("nome");

    const mapped = (data??[]).map((e:any) => ({
      id: e.id, nome: e.nome, ativa: e.ativa,
      lider: e.lider,
      supervisor: e.supervisor,
      membros: (e.equipe_membros??[]).map((m:any) => m.profiles),
    }));
    setEquipes(mapped);
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "conectores") fetchConectores();
    else if (tab === "candidaturas") fetchCandidaturas();
    else fetchEquipes();
  }, [tab]);

  // ── Toggle ativo/inativo ───────────────────────────────────────────────────
  const toggleStatus = async (c: ConectorRow) => {
    setTogglingId(c.id);
    const novo = c.status === "ativo" ? "inativo" : "ativo";
    const { error } = await supabase.from("profiles").update({status:novo}).eq("id",c.id);
    if (!error) setConectores(prev => prev.map(x => x.id===c.id ? {...x,status:novo} : x));
    setTogglingId(null);
  };

  // ── Promover cargo ────────────────────────────────────────────────────────
  const handlePromote = async (novoRole: Role) => {
    if (!promoteTarget) return;
    setActioning(promoteTarget.id);
    const { error } = await supabase.from("profiles").update({role:novoRole}).eq("id",promoteTarget.id);
    if (!error) setConectores(prev => prev.map(x => x.id===promoteTarget.id ? {...x,role:novoRole} : x));
    setPromoteTarget(null);
    setActioning(null);
  };

  // ── Candidaturas ──────────────────────────────────────────────────────────
  const handleAction = async (id: string, action: "entrevista"|"aprovar"|"rejeitar") => {
    const cand = candidaturas.find(c => c.id===id);
    if (!cand) return;
    if (action === "rejeitar") { setRejectTarget(cand); return; }
    if (action === "entrevista") {
      setActioning(id);
      const { error } = await supabase.from("candidaturas").update({status:"em_entrevista"}).eq("id",id);
      if (!error) setCandidaturas(prev => prev.map(c => c.id===id ? {...c,status:"em_entrevista"} : c));
      setActioning(null);
      return;
    }
    if (action === "aprovar") {
      setActioning(id);
      try {
        const { data:{session} } = await supabase.auth.getSession();
        const { data:result, error:fnError } = await supabase.functions.invoke("invite-conector",{
          body:{candidatura_id:id},
          headers:{Authorization:`Bearer ${session?.access_token}`},
        });
        if (fnError) throw new Error(fnError.message);
        if (!result?.success) throw new Error(result?.error ?? "Erro desconhecido.");
        setCandidaturas(prev => prev.map(c => c.id===id ? {...c,status:"aprovado",convidado_at:new Date().toISOString()} : c));
        setCredenciais({nome:cand.nome,email:result.email,senha:result.senha_temp});
      } catch(e) { alert(`Erro ao aprovar: ${e instanceof Error ? e.message : "Tente novamente."}`); }
      setActioning(null);
    }
  };

  const handleReject = async (motivo: string) => {
    if (!rejectTarget) return;
    setActioning(rejectTarget.id);
    const { error } = await supabase.from("candidaturas").update({
      status:"rejeitado", motivo_rejeicao:motivo, rejeitado_at:new Date().toISOString(),
    }).eq("id",rejectTarget.id);
    if (!error) setCandidaturas(prev => prev.map(c => c.id===rejectTarget.id ? {...c,status:"rejeitado"} : c));
    setRejectTarget(null);
    setActioning(null);
  };

  const handleVincularIndicador = async (candidaturaId: string, profileId: string | null) => {
    const { error } = await supabase.from("candidaturas")
      .update({ indicado_por_profile_id: profileId })
      .eq("id", candidaturaId);
    if (!error) setCandidaturas(prev => prev.map(c =>
      c.id === candidaturaId ? { ...c, indicado_por_profile_id: profileId } : c
    ));
  };

  // ── Criar equipe ──────────────────────────────────────────────────────────
  const handleCreateEquipe = async (nome: string, liderId: string) => {
    setActioning("create");
    const { error } = await supabase.from("equipes").insert({nome, lider_id:liderId});
    if (!error) { await fetchEquipes(); }
    setShowCreateEquipe(false);
    setActioning(null);
  };

  // ── Alocar conector em equipe ─────────────────────────────────────────────
  const handleAlocar = async (conectorId: string, equipeId: string) => {
    if (!equipeId) return;
    setActioning(conectorId);
    // Remove de equipes anteriores
    await supabase.from("equipe_membros").delete().eq("conector_id",conectorId);
    // Adiciona na nova
    const { error } = await supabase.from("equipe_membros").insert({equipe_id:equipeId, conector_id:conectorId});
    if (!error) {
      const nomeEquipe = equipes.find(e=>e.id===equipeId)?.nome ?? null;
      setConectores(prev => prev.map(x => x.id===conectorId ? {...x,equipe_nome:nomeEquipe} : x));
    }
    setAlocandoConector(null);
    setAlocandoEquipe("");
    setActioning(null);
  };

  const pendentes = candidaturas.filter(c => c.status==="pendente").length;
  const lideres = conectores.filter(c => c.role==="lider" || c.role==="estrategista" || c.role==="admin");
  const filteredCands = filterStatus==="todas" ? candidaturas : candidaturas.filter(c=>c.status===filterStatus);

  const TABS: {id:Tab;label:string;icon:any;badge?:number}[] = [
    {id:"candidaturas", label:"Candidaturas", icon:ClipboardList, badge:pendentes||undefined},
    {id:"conectores",   label:"Conectores",   icon:Users},
    {id:"equipes",      label:"Equipes",       icon:UsersRound},
  ];

  return (
    <>
      {credenciais && <CredenciaisModal {...credenciais} onClose={()=>setCredenciais(null)}/>}
      {rejectTarget && <RejectModal nome={rejectTarget.nome} onConfirm={handleReject} onCancel={()=>setRejectTarget(null)} loading={!!actioning}/>}
      {promoteTarget && <PromoteModal conector={promoteTarget} onConfirm={handlePromote} onCancel={()=>setPromoteTarget(null)} loading={!!actioning}/>}
      {showCreateEquipe && <CreateEquipeModal lideres={lideres} onConfirm={handleCreateEquipe} onCancel={()=>setShowCreateEquipe(false)} loading={actioning==="create"}/>}

      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Conectores</h1>
            <p className="text-foreground/60 text-sm mt-1">Gerencie candidaturas, conectores e equipes.</p>
          </div>
          <div className="flex gap-2">
            {tab === "equipes" && (
              <Button variant="gold" size="sm" onClick={()=>setShowCreateEquipe(true)} className="gap-2">
                <Plus className="h-4 w-4"/>Nova equipe
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={()=>tab==="conectores"?fetchConectores():tab==="candidaturas"?fetchCandidaturas():fetchEquipes()} disabled={loading} className="gap-2 text-foreground/50 hover:text-foreground">
              <RefreshCw className={`h-4 w-4 ${loading?"animate-spin":""}`}/> Atualizar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface/50 rounded-lg p-1 w-fit border border-border">
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab===t.id?"bg-card text-foreground shadow-sm":"text-foreground/50 hover:text-foreground"}`}>
              <t.icon className="h-4 w-4"/>{t.label}
              {t.badge ? <span className="bg-primary text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full">{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary"/>
            <span className="ml-3 text-sm text-foreground/50">Carregando...</span>
          </div>
        ) : (
          <>
            {/* ── ABA CONECTORES ── */}
            {tab === "conectores" && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                {conectores.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-foreground/40 text-sm">Nenhum conector ainda.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {["Nome","Cargo","Equipe","Leads","Comissão","Status",""].map(h=>(
                          <th key={h} className="text-left p-4 text-xs font-semibold text-foreground/50 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {conectores.map(c => (
                        <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                          <td className="p-4">
                            <p className="text-sm font-medium text-foreground">{c.nome||"—"}</p>
                            <p className="text-xs text-foreground/40">{c.email}</p>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className={`text-xs ${ROLE_CLS[c.role]}`}>{ROLE_LABEL[c.role]}</Badge>
                          </td>
                          <td className="p-4">
                            {alocandoConector === c.id ? (
                              <div className="flex gap-2 items-center">
                                <select value={alocandoEquipe} onChange={e=>setAlocandoEquipe(e.target.value)}
                                  className="bg-surface border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary">
                                  <option value="">Selecionar...</option>
                                  {equipes.map(e=><option key={e.id} value={e.id} style={{background:"#1a4a3a"}}>{e.nome}</option>)}
                                </select>
                                <button onClick={()=>handleAlocar(c.id,alocandoEquipe)} disabled={!alocandoEquipe||actioning===c.id}
                                  className="text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-40">OK</button>
                                <button onClick={()=>{setAlocandoConector(null);setAlocandoEquipe("");}} className="text-xs text-foreground/40 hover:text-foreground">✕</button>
                              </div>
                            ) : (
                              <button onClick={()=>{setAlocandoConector(c.id);setAlocandoEquipe("");}}
                                className="text-xs text-foreground/50 hover:text-primary transition-colors">
                                {c.equipe_nome ?? <span className="text-foreground/25 italic">Sem equipe</span>}
                              </button>
                            )}
                          </td>
                          <td className="p-4 text-sm text-foreground">{c.total_leads}</td>
                          <td className="p-4 text-sm font-semibold text-primary">{fmtCurrency(c.total_comissao)}</td>
                          <td className="p-4">
                            <Badge variant="outline" className={c.status==="ativo"?"bg-green-500/20 text-green-300 border-green-500/30":"bg-red-500/20 text-red-300 border-red-500/30"}>
                              {c.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={()=>setPromoteTarget(c)}
                                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 text-xs gap-1">
                                <Shield className="h-3.5 w-3.5"/>Cargo
                              </Button>
                              <Button variant="ghost" size="sm" onClick={()=>toggleStatus(c)} disabled={togglingId===c.id}
                                className={`text-xs ${c.status==="ativo"?"text-red-400 hover:text-red-300 hover:bg-red-500/10":"text-green-400 hover:text-green-300 hover:bg-green-500/10"}`}>
                                {togglingId===c.id?"...":(c.status==="ativo"?<><UserX className="h-3.5 w-3.5 mr-1"/>Off</>:<><UserCheck className="h-3.5 w-3.5 mr-1"/>On</>)}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── ABA CANDIDATURAS ── */}
            {tab === "candidaturas" && (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {(["todas","pendente","em_entrevista","aprovado","rejeitado"] as const).map(s=>(
                    <button key={s} onClick={()=>setFilterStatus(s)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${filterStatus===s?"bg-primary/10 border-primary/40 text-primary":"border-border text-foreground/50 hover:text-foreground hover:border-primary/20"}`}>
                      {s==="todas"?"Todas":STATUS_CAND[s].label}
                      {s!=="todas"&&<span className="ml-1.5 text-foreground/30">{candidaturas.filter(c=>c.status===s).length}</span>}
                    </button>
                  ))}
                </div>
                {filteredCands.length===0 ? (
                  <div className="flex items-center justify-center py-16 rounded-lg border border-border bg-card">
                    <p className="text-foreground/40 text-sm">Nenhuma candidatura encontrada.</p>
                  </div>
                ) : (
                  <div className="space-y-3">{filteredCands.map(c=><CandCard key={c.id} c={c} conectores={conectores} onAction={handleAction} onVincularIndicador={handleVincularIndicador}/>)}</div>
                )}
              </div>
            )}

            {/* ── ABA EQUIPES ── */}
            {tab === "equipes" && (
              <div className="space-y-4">
                {equipes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-border bg-card text-center">
                    <UsersRound className="h-8 w-8 text-foreground/20 mb-3"/>
                    <p className="text-foreground/40 text-sm">Nenhuma equipe criada ainda.</p>
                    <p className="text-foreground/30 text-xs mt-1">Clique em "Nova equipe" para começar.</p>
                  </div>
                ) : (
                  equipes.map(equipe => (
                    <div key={equipe.id} className="rounded-lg border border-border bg-card overflow-hidden">
                      {/* Header da equipe */}
                      <div className="flex items-center justify-between p-4 border-b border-border">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">{equipe.nome}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary/80">{equipe.membros.length} membro{equipe.membros.length!==1?"s":""}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-foreground/50">
                              Líder: <span className="text-foreground/75 font-medium">{equipe.lider?.nome ?? "—"}</span>
                            </p>
                            {equipe.supervisor && (
                              <p className="text-xs text-foreground/50">
                                Supervisor: <span className="text-foreground/75 font-medium">{equipe.supervisor.nome}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Membros */}
                      {equipe.membros.length === 0 ? (
                        <p className="p-4 text-xs text-foreground/30 italic">Nenhum conector alocado. Aloque conectores na aba Conectores.</p>
                      ) : (
                        <div className="divide-y divide-border">
                          {equipe.membros.map(m => (
                            <div key={m.id} className="flex items-center justify-between px-4 py-3">
                              <div>
                                <p className="text-sm text-foreground">{m.nome ?? "—"}</p>
                                <p className="text-xs text-foreground/40">{m.email}</p>
                              </div>
                              <button
                                onClick={async()=>{
                                  await supabase.from("equipe_membros").delete().eq("conector_id",m.id).eq("equipe_id",equipe.id);
                                  fetchEquipes();
                                }}
                                className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AdminConnectors;
