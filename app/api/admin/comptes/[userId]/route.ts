import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { clientServiceRole, exigerPrincipal, journaliser } from "@/lib/adminServeur";
import { lirePermissions } from "@/lib/permissions";
import { texteErreur } from "@/lib/erreurs";

// Duree du blocage de connexion d'un compte gele (~100 ans) ; "none" le leve.
const GEL_PERMANENT = "876000h";

// Compte secondaire cible : l'administrateur principal ne peut pas etre modifie ici.
async function compteSecondaire(admin: SupabaseClient, userId: string) {
  const { data } = await admin.from("admin_comptes").select("user_id, email, role").eq("user_id", userId).maybeSingle();
  if (!data) return { reponse: NextResponse.json({ erreur: "Compte administrateur introuvable." }, { status: 404 }) };
  if (data.role === "principal") {
    return { reponse: NextResponse.json({ erreur: "L'administrateur principal ne peut pas etre modifie depuis le site." }, { status: 403 }) };
  }
  return { email: data.email as string };
}

// Modifier les permissions et/ou geler / degeler un administrateur secondaire.
export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const controle = await exigerPrincipal(request);
  if ("reponse" in controle) return controle.reponse;

  try {
    const { userId } = await params;
    const corps = await request.json();
    const admin = clientServiceRole();
    const cible = await compteSecondaire(admin, userId);
    if ("reponse" in cible) return cible.reponse;

    const modifs: { permissions?: string[]; actif?: boolean; updated_at: string } = { updated_at: new Date().toISOString() };
    if (corps.permissions !== undefined) modifs.permissions = lirePermissions(corps.permissions);
    if (typeof corps.actif === "boolean") modifs.actif = corps.actif;

    if (typeof corps.actif === "boolean") {
      // Gele : Supabase refuse aussi toute nouvelle connexion et tout renouvellement de session.
      const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: corps.actif ? "none" : GEL_PERMANENT });
      if (error) return NextResponse.json({ erreur: "Changement d'etat impossible : " + error.message }, { status: 500 });
    }

    const { error } = await admin.from("admin_comptes").update(modifs).eq("user_id", userId);
    if (error) return NextResponse.json({ erreur: "Enregistrement impossible : " + error.message }, { status: 500 });

    const action = typeof corps.actif === "boolean" ? (corps.actif ? "degel" : "gel") : "permissions";
    await journaliser(admin, controle.profil, action, { id: userId, nom: cible.email }, modifs.permissions ? { permissions: modifs.permissions } : undefined);
    return NextResponse.json({ succes: true });
  } catch (err) {
    return NextResponse.json({ erreur: texteErreur(err) }, { status: 500 });
  }
}

// Supprimer un administrateur secondaire (son compte de connexion est supprime).
export async function DELETE(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const controle = await exigerPrincipal(request);
  if ("reponse" in controle) return controle.reponse;

  try {
    const { userId } = await params;
    const admin = clientServiceRole();
    const cible = await compteSecondaire(admin, userId);
    if ("reponse" in cible) return cible.reponse;

    // D'abord les droits (effet immediat), ensuite le compte de connexion.
    const { error } = await admin.from("admin_comptes").delete().eq("user_id", userId);
    if (error) return NextResponse.json({ erreur: "Suppression impossible : " + error.message }, { status: 500 });
    const { error: erreurCompte } = await admin.auth.admin.deleteUser(userId);
    if (erreurCompte) {
      // Les droits admin sont deja retires ; on bloque au moins la connexion.
      await admin.auth.admin.updateUserById(userId, { ban_duration: GEL_PERMANENT });
    }

    await journaliser(admin, controle.profil, "suppression", { id: userId, nom: cible.email });
    return NextResponse.json({ succes: true });
  } catch (err) {
    return NextResponse.json({ erreur: texteErreur(err) }, { status: 500 });
  }
}
