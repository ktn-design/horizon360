import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { profilDepuisJeton } from "@/lib/permissions";

// Vide le cache des pages publiques apres une modification dans l'administration,
// pour que les visiteurs voient le changement tout de suite (sinon : 60 s au plus).
// Appelee par lib/store.ts apres chaque enregistrement ou suppression reussi.
export async function POST(request: Request) {
  const jeton = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const profil = jeton ? await profilDepuisJeton(jeton) : null;
  if (!profil || !profil.actif) {
    return NextResponse.json({ erreur: "Reserve aux administrateurs." }, { status: 401 });
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ succes: true });
}
