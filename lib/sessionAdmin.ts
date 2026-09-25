"use client";

import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { COOKIE_SESSION_ADMIN, dbVersProfilAdmin, ProfilAdmin } from "./permissions";

// Copie le jeton de session dans un cookie pour que le serveur (proxy.ts) puisse
// verifier chaque page /admin avant de l'envoyer. Supabase garde la vraie session.
export function synchroniserCookieAdmin(session: Session | null) {
  const securise = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  if (!session) {
    document.cookie = COOKIE_SESSION_ADMIN + "=; Path=/; Max-Age=0; SameSite=Lax" + securise;
    return;
  }
  const dureeRestante = session.expires_at ? Math.max(60, session.expires_at - Math.floor(Date.now() / 1000)) : 3600;
  document.cookie =
    COOKIE_SESSION_ADMIN + "=" + encodeURIComponent(session.access_token) +
    "; Path=/; Max-Age=" + dureeRestante + "; SameSite=Lax" + securise;
}

// Profil admin du compte connecte (null si pas connecte ou pas administrateur).
export async function chargerMonProfilAdmin(): Promise<ProfilAdmin | null> {
  const { data, error } = await supabase.rpc("mon_profil_admin");
  if (error || !Array.isArray(data) || data.length === 0) return null;
  return dbVersProfilAdmin(data[0]);
}

// Jeton a joindre aux appels des routes /api/admin.
export async function enTetesAdmin(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + (data.session?.access_token || ""),
  };
}

// Deconnexion complete : ferme la session Supabase, efface tout l'etat du navigateur
// lie a l'admin, puis recharge entierement la page de connexion (ce qui vide aussi le
// cache des pages deja visitees). replace() : la page admin quittee ne reste pas dans
// l'historique du bouton Retour.
export async function deconnecterAdmin(motif?: string) {
  try {
    await supabase.auth.signOut();
  } catch {
    // meme si le reseau echoue, on efface la session locale ci-dessous
  }
  synchroniserCookieAdmin(null);
  try {
    localStorage.removeItem("admin_connecte");
    for (const cle of Object.keys(localStorage)) {
      if (cle.startsWith("sb-")) localStorage.removeItem(cle);
    }
    sessionStorage.clear();
  } catch {}
  window.location.replace("/admin" + (motif ? "?erreur=" + motif : ""));
}
