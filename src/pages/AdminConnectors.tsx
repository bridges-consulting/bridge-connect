import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX, Users, Loader2, RefreshCw, ClipboardList, ChevronDown, ChevronUp, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ConectorRow {
  id: string; nome: string | null; email: string | null;
  status: "ativo" | "inativo"; total_leads: number; total_comissao: number;
}

type CandStatus = "pendente" | "em_entrevista" | "aprovado" | "rejeitado";

interface Candidatura {
  id: string; nome: string; email: string; whatsapp: string;
  cidade: string | null; ocupacao: string | null; tamanho_rede: string | null;
  canais_indicacao: string[] | null; como_conheceu: string | null;
  indicado_por: string | null; relacionamento: string | null;
  status: CandStatus; notas_admin: string | null; created_at: string;
  convidado_at: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_CONFIG: Record<CandStatus, { label: string; cls: string }> = {
  pendente:      { label: "Pendente",      cls: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  em_entrevista: { label: "Em entrevista", cls: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  aprovado:      { label: "Aprovado",      cls: "bg-green-500/20 text-green-300 border-green-500/30" },
  rejeitado:     { label: "Rejeitado",     cls: "bg-red-500/20 text-red-300 border-red-500/30" },
};

// ─── Modal de rejeição ────────────────────────────────────────────────────────

// ─── Modal de credenciais ─────────────────────────────────────────────────────

function CredenciaisModal({ nome, email, senha, onClose }: {
  nome: string; email: string; senha: string; onClose: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  const texto = `Olá, ${nome}! Seu acesso ao Programa Bridges foi aprovado 🎉\n\nAcesse a plataforma em: https://programabridges.lovable.app/login\n\nE-mail: ${email}\nSenha temporária: ${senha}\n\nRecomendamos alterar sua senha no primeiro acesso.`;

  const copiar = () => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-primary/30 bg-card shadow-2xl">
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-foreground">✦ Conta criada com sucesso</h3>
            <p className="text-xs text-foreground/50 mt-0.5">{nome} agora é um Conector Bridges</p>
          </div>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground transition-colors"><X className="h-5 w-5"/></button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-foreground/50 leading-relaxed">
            Compartilhe as credenciais abaixo com o conector pelo WhatsApp. Ele poderá alterar a senha após o primeiro acesso.
          </p>

          <div className="rounded-lg bg-surface/50 border border-border p-4 space-y-2.5 font-mono text-sm">
            <div className="flex justify-between items-center">
              <span className="text-foreground/40 text-xs uppercase tracking-widest">E-mail</span>
              <span className="text-foreground">{email}</span>
            </div>
            <div className="h-px bg-border"/>
            <div className="flex justify-between items-center">
              <span className="text-foreground/40 text-xs uppercase tracking-widest">Senha</span>
              <span className="text-primary font-bold tracking-wider">{senha}</span>
            </div>
          </div>

          <button onClick={copiar}
            className="w-full py-2.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
            {copiado ? "✓ Copiado!" : "Copiar mensagem para WhatsApp"}
          </button>

          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-xs text-foreground/40 whitespace-pre-wrap leading-relaxed">
            {texto}
          </div>
        </div>

        <div className="px-5 pb-5">
          <Button variant="gold" onClick={onClose} className="w-full">Fechar</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de rejeição ────────────────────────────────────────────────────────

function RejectModal({ nome, onConfirm, onCancel, loading }: {
  nome: string; onConfirm: (motivo: string) => void; onCancel: () => void; loading: boolean;
}) {
  const [motivo, setMotivo] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-card shadow-2xl">
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-foreground">Rejeitar candidatura</h3>
            <p className="text-xs text-foreground/50 mt-0.5">{nome}</p>
          </div>
          <button onClick={onCancel} className="text-foreground/40 hover:text-foreground transition-colors"><X className="h-5 w-5"/></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="text-xs font-semibold tracking-widest uppercase text-primary/80">
            Motivo da rejeição <span className="text-primary">*</span>
          </label>
          <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
            placeholder="Ex.: Perfil não se encaixa no momento, rede muito pequena para o programa..."
            className="w-full bg-surface/50 border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors resize-none"/>
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="flex-1">Cancelar</Button>
          <Button onClick={() => motivo.trim() && onConfirm(motivo.trim())} disabled={!motivo.trim() || loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0">
            {loading ? "Rejeitando..." : "Rejeitar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Card de candidatura ──────────────────────────────────────────────────────

function CandCard({ c, onAction }: {
  c: Candidatura;
  onAction: (id: string, action: "entrevista" | "aprovar" | "rejeitar") => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[c.status];

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{c.nome}</p>
            <Badge variant="outline" className={`text-xs ${cfg.cls}`}>{cfg.label}</Badge>
          </div>
          <p className="text-xs text-foreground/50 mt-0.5">{c.email} · {c.whatsapp}</p>
          {c.cidade && <p className="text-xs text-foreground/40 mt-0.5">{c.cidade}</p>}
          <p className="text-xs text-foreground/30 mt-1">Candidatura: {formatDate(c.created_at)}</p>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-foreground/40 hover:text-foreground transition-colors mt-0.5 flex-shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
        </button>
      </div>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {c.ocupacao && (
            <div><p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest mb-1">Ocupação</p><p className="text-sm text-foreground/70">{c.ocupacao}</p></div>
          )}
          {c.tamanho_rede && (
            <div><p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest mb-1">Rede de contatos</p><p className="text-sm text-foreground/70">{c.tamanho_rede}</p></div>
          )}
          {c.canais_indicacao && c.canais_indicacao.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest mb-1">Canais de indicação</p>
              <div className="flex flex-wrap gap-1.5">
                {c.canais_indicacao.map(canal => (
                  <span key={canal} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary/80">{canal.split("—")[0].trim()}</span>
                ))}
              </div>
            </div>
          )}
          {c.como_conheceu && (
            <div><p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest mb-1">Como conheceu</p><p className="text-sm text-foreground/70">{c.como_conheceu}{c.indicado_por ? ` — indicado por ${c.indicado_por}` : ""}</p></div>
          )}
          {c.relacionamento && (
            <div><p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest mb-1">Relacionamento com público</p><p className="text-sm text-foreground/70">{c.relacionamento}</p></div>
          )}
          {c.convidado_at && (
            <div className="rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-300">
              Convite enviado em {formatDate(c.convidado_at)}
            </div>
          )}
        </div>
      )}

      {/* Ações */}
      {c.status !== "aprovado" && c.status !== "rejeitado" && (
        <div className="flex gap-2 px-4 pb-4">
          {c.status === "pendente" && (
            <Button variant="outline" size="sm" onClick={() => onAction(c.id, "entrevista")}
              className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300 text-xs">
              Chamar para entrevista
            </Button>
          )}
          {c.status === "em_entrevista" && (
            <Button variant="gold" size="sm" onClick={() => onAction(c.id, "aprovar")} className="gap-1.5 text-xs">
              <Send className="h-3.5 w-3.5"/> Aprovar e enviar convite
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onAction(c.id, "rejeitar")}
            className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300 text-xs ml-auto">
            <X className="h-3.5 w-3.5 mr-1"/> Rejeitar
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const AdminConnectors = () => {
  const [tab, setTab]             = useState<"conectores" | "candidaturas">("conectores");
  const [conectores, setConectores] = useState<ConectorRow[]>([]);
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [loading, setLoading]     = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actioning, setActioning]  = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Candidatura | null>(null);
  const [credenciais, setCredenciais] = useState<{ nome: string; email: string; senha: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<CandStatus | "todas">("pendente");

  // ── Fetch conectores ───────────────────────────────────────────────────────
  const fetchConectores = async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from("profiles").select("id, nome, email, status").eq("role", "conector").order("nome");
    if (error || !profiles) { setLoading(false); return; }

    const rows = await Promise.all(profiles.map(async (p) => {
      const { count: totalLeads } = await supabase.from("leads").select("*", { count: "exact", head: true }).eq("conector_id", p.id);
      const { data: comissoes } = await supabase.from("comissoes").select("valor_pago, valor_liberado").eq("conector_id", p.id);
      return {
        id: p.id, nome: p.nome, email: p.email, status: p.status as "ativo" | "inativo",
        total_leads: totalLeads ?? 0,
        total_comissao: (comissoes ?? []).reduce((s, c) => s + (c.valor_pago ?? 0) + (c.valor_liberado ?? 0), 0),
      };
    }));
    setConectores(rows);
    setLoading(false);
  };

  // ── Fetch candidaturas ─────────────────────────────────────────────────────
  const fetchCandidaturas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("candidaturas")
      .select("id,nome,email,whatsapp,cidade,ocupacao,tamanho_rede,canais_indicacao,como_conheceu,indicado_por,relacionamento,status,notas_admin,created_at,convidado_at")
      .order("created_at", { ascending: false });
    if (!error) setCandidaturas((data ?? []) as Candidatura[]);
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "conectores") fetchConectores();
    else fetchCandidaturas();
  }, [tab]);

  // ── Toggle ativo/inativo ───────────────────────────────────────────────────
  const toggleStatus = async (c: ConectorRow) => {
    setTogglingId(c.id);
    const novoStatus = c.status === "ativo" ? "inativo" : "ativo";
    const { error } = await supabase.from("profiles").update({ status: novoStatus }).eq("id", c.id);
    if (!error) setConectores(prev => prev.map(x => x.id === c.id ? { ...x, status: novoStatus } : x));
    setTogglingId(null);
  };

  // ── Ações nas candidaturas ─────────────────────────────────────────────────
  const handleAction = async (id: string, action: "entrevista" | "aprovar" | "rejeitar") => {
    const cand = candidaturas.find(c => c.id === id);
    if (!cand) return;

    if (action === "rejeitar") { setRejectTarget(cand); return; }

    if (action === "entrevista") {
      setActioning(id);
      const { error } = await supabase.from("candidaturas").update({ status: "em_entrevista" }).eq("id", id);
      if (!error) setCandidaturas(prev => prev.map(c => c.id === id ? { ...c, status: "em_entrevista" } : c));
      setActioning(null);
      return;
    }

    if (action === "aprovar") {
      setActioning(id);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const { data: result, error: fnError } = await supabase.functions.invoke("invite-conector", {
          body: { candidatura_id: id },
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (fnError) throw new Error(fnError.message);
        if (!result?.success) throw new Error(result?.error ?? "Erro desconhecido.");
        setCandidaturas(prev => prev.map(c => c.id === id ? { ...c, status: "aprovado", convidado_at: new Date().toISOString() } : c));
        setCredenciais({ nome: cand.nome, email: result.email, senha: result.senha_temp });
      } catch (e) {
        alert(`Erro ao aprovar: ${e instanceof Error ? e.message : "Tente novamente."}`);
      }
      setActioning(null);
    }
  };

  const handleReject = async (motivo: string) => {
    if (!rejectTarget) return;
    setActioning(rejectTarget.id);
    const { error } = await supabase.from("candidaturas").update({
      status: "rejeitado", motivo_rejeicao: motivo, rejeitado_at: new Date().toISOString(),
    }).eq("id", rejectTarget.id);
    if (!error) setCandidaturas(prev => prev.map(c => c.id === rejectTarget.id ? { ...c, status: "rejeitado" } : c));
    setRejectTarget(null);
    setActioning(null);
  };

  const pendentes = candidaturas.filter(c => c.status === "pendente").length;
  const filteredCands = filterStatus === "todas" ? candidaturas : candidaturas.filter(c => c.status === filterStatus);

  return (
    <>
      {credenciais && (
        <CredenciaisModal
          nome={credenciais.nome}
          email={credenciais.email}
          senha={credenciais.senha}
          onClose={() => setCredenciais(null)}
        />
      )}
      {rejectTarget && (
        <RejectModal nome={rejectTarget.nome} onConfirm={handleReject} onCancel={() => setRejectTarget(null)} loading={!!actioning} />
      )}

      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Conectores</h1>
            <p className="text-foreground/60 text-sm mt-1">Gerencie conectores ativos e candidaturas em análise.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => tab === "conectores" ? fetchConectores() : fetchCandidaturas()} disabled={loading}
            className="gap-2 text-foreground/50 hover:text-foreground">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}/> Atualizar
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface/50 rounded-lg p-1 w-fit border border-border">
          <button onClick={() => setTab("conectores")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "conectores" ? "bg-card text-foreground shadow-sm" : "text-foreground/50 hover:text-foreground"}`}>
            <Users className="h-4 w-4"/> Conectores ativos
          </button>
          <button onClick={() => setTab("candidaturas")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "candidaturas" ? "bg-card text-foreground shadow-sm" : "text-foreground/50 hover:text-foreground"}`}>
            <ClipboardList className="h-4 w-4"/>
            Candidaturas
            {pendentes > 0 && (
              <span className="ml-1 bg-primary text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendentes}</span>
            )}
          </button>
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
                    <p className="text-foreground/40 text-sm">Nenhum conector ativo ainda.</p>
                    <p className="text-foreground/30 text-xs mt-1">Conectores aparecem aqui após a aprovação da candidatura.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {["Nome","E-mail","Status","Leads","Comissão",""].map(h => (
                          <th key={h} className="text-left p-4 text-sm font-medium text-foreground/60">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {conectores.map(c => (
                        <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                          <td className="p-4 text-sm font-medium text-foreground">{c.nome || "—"}</td>
                          <td className="p-4 text-sm text-foreground/75">{c.email || "—"}</td>
                          <td className="p-4">
                            <Badge variant="outline" className={c.status === "ativo" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}>
                              {c.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-foreground">{c.total_leads}</td>
                          <td className="p-4 text-sm font-semibold text-primary">{formatCurrency(c.total_comissao)}</td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm" disabled={togglingId === c.id} onClick={() => toggleStatus(c)}
                              className={`text-sm ${c.status === "ativo" ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-green-400 hover:text-green-300 hover:bg-green-500/10"}`}>
                              {togglingId === c.id ? "..." : c.status === "ativo" ? <><UserX className="h-4 w-4 mr-1.5"/>Desativar</> : <><UserCheck className="h-4 w-4 mr-1.5"/>Ativar</>}
                            </Button>
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
                {/* Filtro de status */}
                <div className="flex gap-2 flex-wrap">
                  {(["todas","pendente","em_entrevista","aprovado","rejeitado"] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                        filterStatus === s ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-foreground/50 hover:text-foreground hover:border-primary/20"
                      }`}>
                      {s === "todas" ? "Todas" : STATUS_CONFIG[s].label}
                      {s !== "todas" && <span className="ml-1.5 text-foreground/30">{candidaturas.filter(c => c.status === s).length}</span>}
                    </button>
                  ))}
                </div>

                {filteredCands.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-border bg-card">
                    <p className="text-foreground/40 text-sm">Nenhuma candidatura {filterStatus !== "todas" ? `com status "${STATUS_CONFIG[filterStatus as CandStatus]?.label}"` : "ainda"}.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCands.map(c => (
                      <CandCard key={c.id} c={c} onAction={handleAction}/>
                    ))}
                  </div>
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
