"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { ApexAuthContext, ApexAuthContextValue, ApexUser } from "./auth-context";

function buildUser(user: User | null): ApexUser | null {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    name: meta.full_name || user.email || "Operator",
    email: user.email || "",
    imageUrl: meta.avatar_url || null,
  };
}

export function ApexAuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabase();
  const [state, setState] = useState<{
    isLoaded: boolean;
    user: ApexUser | null;
  }>({ isLoaded: !supabase, user: null });
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ isLoaded: true, user: buildUser(session?.user ?? null) });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ isLoaded: true, user: buildUser(session?.user ?? null) });
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = useCallback(() => {
    router.push("/sign-in");
  }, [router]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    router.push("/sign-in");
  }, [supabase, router]);

  const value = useMemo<ApexAuthContextValue>(
    () => ({
      isLoaded: state.isLoaded,
      isSignedIn: !!state.user,
      user: state.user,
      signIn,
      signOut,
    }),
    [state, signIn, signOut]
  );

  return (
    <ApexAuthContext.Provider value={value}>
      {children}
    </ApexAuthContext.Provider>
  );
}

export const isClerkConfigured = false;
