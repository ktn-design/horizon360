import { NextResponse } from "next/server";
import { clientServiceRole, exigerPrincipal, journaliser } from "@/lib/adminServeur";
import { lirePermissions } from "@/lib/permissions";
import { texteErreur } from "@/lib/erreurs";

// Creation d'un administrateur secondaire (reserve a l'administrateur principal).
export async function POST(request: Request) {
  const controle = await exigerPrincipal(request);
  if ("reponse" in controle) return controle.reponse;

  try {
    const corps = await request.json();
    const email = String(corps.email || "").trim().toLowerCase();
    const motDePasse = String(corps.motDePasse || "");
    const permissions = lirePermissions(corps.permissions);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ erreur: "Adresse email invalide." }, { status: 400 });
    }
    if (motDePasse.length < 8) {
      return NextResponse.json({ erreur: "Le mot de passe doit contenir au moins 8 caracteres." }, { status: 400 });
    }

    const admin = clientServiceRole();
    const { data, error } = await admin.auth.admin.createUser({ email, password: motDePasse, email_confirm: true });
    if (error || !data.user) {
      const existe = /already|registered|exists/i.test(error?.message || "");
      return NextResponse.json(
        {
          erreur: existe
            ? "Un compte utilise deja cet email (client du site ou autre admin). Utilisez une autre adresse."
            : "Creation du compte impossible : " + (error?.message || "erreur inconnue"),
        },
        { status: existe ? 409 : 500 }
      );
    }

    const { error: erreurLigne } = await admin.from("admin_comptes").insert({
      user_id: data.user.id,
      email,
      role: "secondaire",
      permissions,
      actif: true,
      cree_par: controle.profil.userId,
    });
    if (erreurLigne) {
      // Pas de compte de connexion "orphelin" sans droits admin.
      await admin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ erreur: "Creation du compte impossible : " + erreurLigne.message }, { status: 500 });
    }

    await journaliser(admin, controle.profil, "creation", { id: data.user.id, nom: email }, { permissions });
    return NextResponse.json({ succes: true });
  } catch (err) {
    return NextResponse.json({ erreur: texteErreur(err) }, { status: 500 });
  }
}
