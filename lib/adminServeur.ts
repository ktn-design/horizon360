import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ProfilAdmin, profilDepuisJeton } from "./permissions";

// Client Supabase avec la cle service_role : contourne le RLS. A n'utiliser QUE dans les
// routes /api/admin, apres avoir verifie que l'appelant est l'administrateur principal.
export function clientServiceRole(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) {
    throw new Error(
      "Cle SUPABASE_SERVICE_ROLE_KEY absente : ajoutez-la dans .env.local (et dans les variables d'environnement de l'hebergeur). " +
      "Elle se trouve dans Supabase > Project Settings > API > service_role."
    );
  }
  return createClient(url, cle, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Verifie le jeton "Authorization: Bearer ..." : renvoie le profil de l'administrateur
// principal, ou une reponse d'erreur a renvoyer telle quelle.
export async function exigerPrincipal(request: Request): Promise<{ profil: ProfilAdmin } | { reponse: NextResponse }> {
  const jeton = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const profil = jeton ? await profilDepuisJeton(jeton) : null;
  if (!profil || !profil.actif) {
    return { reponse: NextResponse.json({ erreur: "Session expiree. Reconnectez-vous." }, { status: 401 }) };
  }
  if (profil.role !== "principal") {
    return { reponse: NextResponse.json({ erreur: "Reserve a l'administrateur principal." }, { status: 403 }) };
  }
  return { profil };
}

// Trace dans le journal une action sur les comptes admin (les modifications du catalogue
// sont journalisees automatiquement par la base).
export async function journaliser(
  admin: SupabaseClient,
  auteur: ProfilAdmin,
  action: string,
  cible: { id: string; nom: string },
  details?: Record<string, unknown>
) {
  await admin.from("journal_admin").insert({
    auteur_id: auteur.userId,
    auteur_email: auteur.email,
    action,
    cible_type: "admin",
    cible_id: cible.id,
    cible_nom: cible.nom,
    details: details || null,
  });
}
