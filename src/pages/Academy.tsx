import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, FileText, Download, Trash2,
  Upload, Loader2, Plus, RefreshCw, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Conteudo {
  id: string; titulo: string; descricao: string | null;
  tipo: "video" | "documento" | "ebook" | "link";
  url: string | null; arquivo_path: string | null;
  destaque: boolean; publicado: boolean; ordem: number;
  categoria_id: string | null; created_at: string;
}

interface Categoria {
  id: string; nome: string; descricao: string | null; ordem: number;
}

const TIPO_CLS: Record<string, string> = {
  video:     "bg-purple-500/20 text-purple-300 border-purple-500/30",
  documento: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  ebook:     "bg-green-500/20 text-green-300 border-green-500/30",
  link:      "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

const TIPO_LABEL: Record<string, string> = {
  video: "Vídeo", documento: "Documento", ebook: "E-book", link: "Link",
};

// ─── Modal de upload ──────────────────────────────────────────────────────────

function UploadModal({ categorias, onSave, onCancel }: {
  categorias: Categoria[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const [titulo, setTitulo]       = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo]           = useState<"documento" | "ebook" | "link">("documento");
  const [url, setUrl]             = useState("");
  const [catId, setCatId]         = useState("");
  const [file, setFile]           = useState<File | null>(null);
  const [saving, setSaving]       = useState(false);
  const [erro, setErro]           = useState<string | null>(null);
  const fileRef                   = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!titulo.trim()) { setErro("Título obrigatório."); return; }
    setSaving(true); setErro(null);
    try {
      let arquivo_path: string | null = null;
      let finalUrl = url || null;

      if (file && tipo !== "link") {
        const path = `academy/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("academy-docs").upload(path, file);
        if (uploadError) throw uploadError;
        arquivo_path = path;
        finalUrl = null; // usa arquivo, não URL
      }

      const { error } = await supabase.from("academy_conteudos").insert({
        titulo, descricao: descricao || null,
        tipo, url: finalUrl, arquivo_path,
        categoria_id: catId || null,
        destaque: false, publicado: true, ordem: 0,
      });
      if (error) throw error;
      onSave();
    } catch (e: any) {
      setErro(e.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-surface/50 border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Adicionar conteúdo</h3>
          <button onClick={onCancel} className="text-foreground/40 hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Tipo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-widest uppercase text-primary/80">Tipo</label>
            <div className="flex gap-2">
              {(["documento","ebook","link"] as const).map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  className={`flex-1 py-2 rounded-md text-xs font-medium border transition-colors ${tipo === t ? "border-primary/60 bg-primary/10 text-primary" : "border-border text-foreground/50 hover:text-foreground"}`}>
                  {TIPO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-widest uppercase text-primary/80">Título <span className="text-primary">*</span></label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Nome do conteúdo" className={inputCls}/>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-widest uppercase text-primary/80">Descrição</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2}
              placeholder="Breve descrição do conteúdo..." className={`${inputCls} resize-none`}/>
          </div>

          {/* Categoria */}
          {categorias.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-widest uppercase text-primary/80">Categoria</label>
              <select value={catId} onChange={e => setCatId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                <option value="">Sem categoria</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          )}

          {/* Arquivo ou URL */}
          {tipo === "link" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-widest uppercase text-primary/80">URL do link</label>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className={inputCls}/>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-widest uppercase text-primary/80">Arquivo (PDF)</label>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={e => setFile(e.target.files?.[0] ?? null)} className="hidden"/>
              <button onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-md border border-dashed border-border hover:border-primary/40 text-sm text-foreground/50 hover:text-foreground transition-colors">
                <Upload className="h-4 w-4"/>
                {file ? file.name : "Clique para selecionar o arquivo"}
              </button>
            </div>
          )}

          {erro && <div className="rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">{erro}</div>}
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onCancel} disabled={saving} className="flex-1">Cancelar</Button>
          <Button variant="gold" onClick={handleSave} disabled={saving || !titulo.trim()} className="flex-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : "Adicionar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const Academy = () => {
  const { isAdmin } = useAuth();
  const [conteudos, setConteudos]   = useState<Conteudo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const [{ data: cats }, { data: conts }] = await Promise.all([
      supabase.from("academy_categorias").select("*").order("ordem"),
      supabase.from("academy_conteudos").select("*").eq("publicado", true).order("ordem"),
    ]);
    setCategorias((cats ?? []) as Categoria[]);
    setConteudos((conts ?? []) as Conteudo[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const abrirConteudo = async (c: Conteudo) => {
    if (c.url) { window.open(c.url, "_blank"); return; }
    if (c.arquivo_path) {
      const { data } = await supabase.storage
        .from("academy-docs").createSignedUrl(c.arquivo_path, 3600);
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    }
  };

  const deletar = async (c: Conteudo) => {
    if (!confirm(`Remover "${c.titulo}"?`)) return;
    setDeletingId(c.id);
    if (c.arquivo_path) {
      await supabase.storage.from("academy-docs").remove([c.arquivo_path]);
    }
    await supabase.from("academy_conteudos").delete().eq("id", c.id);
    setConteudos(prev => prev.filter(x => x.id !== c.id));
    setDeletingId(null);
  };

  // Agrupa por categoria
  const semCategoria = conteudos.filter(c => !c.categoria_id);
  const porCategoria = categorias.map(cat => ({
    cat,
    items: conteudos.filter(c => c.categoria_id === cat.id),
  })).filter(g => g.items.length > 0);

  return (
    <>
      {showUpload && (
        <UploadModal categorias={categorias} onSave={() => { setShowUpload(false); fetch(); }} onCancel={() => setShowUpload(false)}/>
      )}

      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Academy</h1>
            <p className="text-foreground/50 text-sm mt-1">Materiais de estudo e recursos do Programa Bridges.</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="gold" size="sm" onClick={() => setShowUpload(true)} className="gap-2">
                <Plus className="h-4 w-4"/> Adicionar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetch} disabled={loading}
              className="gap-2 text-foreground/50 hover:text-foreground">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}/>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>
        ) : conteudos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-dashed border-primary/20 bg-primary/[0.03] text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-primary"/>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[4px] uppercase text-primary mb-2">Em breve</p>
              <h2 className="text-lg font-bold text-foreground mb-1">Bridges <span className="text-primary italic font-light">Academy</span></h2>
              <p className="text-sm text-foreground/40 max-w-sm">
                {isAdmin ? 'Clique em "Adicionar" para publicar o primeiro conteúdo.' : "Os materiais de treinamento serão publicados em breve."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Conteúdos sem categoria */}
            {semCategoria.length > 0 && (
              <ConteudoGrid titulo="Geral" items={semCategoria}
                isAdmin={isAdmin} onAbrir={abrirConteudo} onDeletar={deletar} deletingId={deletingId}/>
            )}
            {/* Por categoria */}
            {porCategoria.map(({ cat, items }) => (
              <ConteudoGrid key={cat.id} titulo={cat.nome} subtitulo={cat.descricao ?? undefined}
                items={items} isAdmin={isAdmin} onAbrir={abrirConteudo} onDeletar={deletar} deletingId={deletingId}/>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

function ConteudoGrid({ titulo, subtitulo, items, isAdmin, onAbrir, onDeletar, deletingId }: {
  titulo: string; subtitulo?: string;
  items: Conteudo[]; isAdmin: boolean;
  onAbrir: (c: Conteudo) => void;
  onDeletar: (c: Conteudo) => void;
  deletingId: string | null;
}) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">{titulo}</h2>
        {subtitulo && <p className="text-xs text-foreground/40 mt-0.5">{subtitulo}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(c => (
          <div key={c.id} className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <Badge variant="outline" className={`text-[10px] mb-2 ${TIPO_CLS[c.tipo]}`}>{TIPO_LABEL[c.tipo]}</Badge>
                <p className="text-sm font-semibold text-foreground leading-snug truncate">{c.titulo}</p>
                {c.descricao && <p className="text-xs text-foreground/40 mt-1 line-clamp-2">{c.descricao}</p>}
              </div>
              {isAdmin && (
                <button onClick={() => onDeletar(c)} disabled={deletingId === c.id}
                  className="opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-red-400 transition-all flex-shrink-0">
                  {deletingId === c.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                </button>
              )}
            </div>
            <button onClick={() => onAbrir(c)}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
              {c.tipo === "link" ? <ExternalLink className="h-3.5 w-3.5"/> : <Download className="h-3.5 w-3.5"/>}
              {c.tipo === "link" ? "Abrir link" : "Abrir documento"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Academy;
