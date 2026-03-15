import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  lead_id: string | null;
  lida: boolean;
  created_at: string;
}

export function useNotificacoes() {
  const { profile } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("notificacoes")
      .select("id, tipo, titulo, mensagem, lead_id, lida, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotificacoes((data ?? []) as Notificacao[]);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => { fetch(); }, [fetch]);

  // Polling simples a cada 30s
  useEffect(() => {
    const interval = setInterval(fetch, 30_000);
    return () => clearInterval(interval);
  }, [fetch]);

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  const marcarTodasLidas = async () => {
    if (!profile?.id || naoLidas === 0) return;
    await supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("user_id", profile.id)
      .eq("lida", false);
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const marcarLida = async (id: string) => {
    await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  return { notificacoes, naoLidas, loading, marcarLida, marcarTodasLidas, refresh: fetch };
}
