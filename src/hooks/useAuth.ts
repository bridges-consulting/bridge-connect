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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((s) => ({ ...s, session }));
      if (session?.user) fetchProfile(session.user.id);
      else setState((s) => ({ ...s, loading: false }));
    });

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

  async function signOut() {
    await supabase.auth.signOut();
  }

  const role = state.profile?.role ?? null;

  return {
    session:        state.session,
    profile:        state.profile,
    loading:        state.loading,
    role,
    isAdmin:        role === "admin",
    isEstratégista: role === "estrategista",
    isLider:        role === "lider",
    isConector:     role === "conector",
    // qualquer cargo não-admin pode indicar leads
    podeIndicar:    role !== null && role !== "admin",
    signIn,
    signOut,
  };
}
