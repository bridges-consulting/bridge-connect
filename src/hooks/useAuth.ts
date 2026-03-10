import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/integrations/supabase/types";
import type { Session } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    // Pega sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((s) => ({ ...s, session }));
      if (session?.user) fetchProfile(session.user.id);
      else setState((s) => ({ ...s, loading: false }));
    });

    // Escuta mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({ ...s, session }));
      if (session?.user) fetchProfile(session.user.id);
      else setState({ session: null, profile: null, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setState((s) => ({ ...s, profile: data, loading: false }));
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email: string, password: string, nome: string, role: "admin" | "conector" = "conector") {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome, role } },
    });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return {
    session: state.session,
    profile: state.profile,
    loading: state.loading,
    isAdmin: state.profile?.role === "admin",
    isConector: state.profile?.role === "conector",
    signIn,
    signUp,
    signOut,
  };
}
