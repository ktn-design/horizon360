"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  chargement: boolean;
  connexionGoogle: () => Promise<void>;
  connexionEmail: (email: string, motDePasse: string) => Promise<{ error: string | null }>;
  inscriptionEmail: (email: string, motDePasse: string) => Promise<{ error: string | null }>;
  deconnexion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setChargement(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function connexionGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
      },
    });
  }

  async function connexionEmail(email: string, motDePasse: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
    return { error: error ? error.message : null };
  }

  async function inscriptionEmail(email: string, motDePasse: string) {
    const { error } = await supabase.auth.signUp({ email, password: motDePasse });
    return { error: error ? error.message : null };
  }

  async function deconnexion() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, chargement, connexionGoogle, connexionEmail, inscriptionEmail, deconnexion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit etre utilise a l'interieur de AuthProvider");
  }
  return context;
}