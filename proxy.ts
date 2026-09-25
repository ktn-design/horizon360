import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_SESSION_ADMIN, peutOuvrirPage, profilDepuisJeton } from "@/lib/permissions";

// Protection serveur de toutes les pages /admin (Next.js 16 : "proxy" = ancien "middleware").
// Avant d'envoyer la moindre page admin, on verifie aupres de Supabase que la session est
// valide, que le compte est administrateur, qu'il n'est pas gele et qu'il a acces a la section.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // La page de connexion reste accessible (mais jamais mise en cache).
  if (pathname === "/admin" || pathname === "/admin/") {
    return sansCache(NextResponse.next());
  }

  const jeton = request.cookies.get(COOKIE_SESSION_ADMIN)?.value;
  if (!jeton) return versConnexion(request, "session", pathname + search);

  let profil;
  try {
    profil = await profilDepuisJeton(jeton);
  } catch {
    return versConnexion(request, "reseau", pathname + search);
  }

  if (!profil) return versConnexion(request, "session", pathname + search);
  if (!profil.actif) return versConnexion(request, "gele");

  if (!peutOuvrirPage(profil, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    url.search = "?refus=1";
    return sansCache(NextResponse.redirect(url));
  }

  return sansCache(NextResponse.next());
}

function versConnexion(request: NextRequest, motif: string, suite?: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin";
  url.search = "";
  url.searchParams.set("erreur", motif);
  if (suite && suite !== "/admin/dashboard") url.searchParams.set("suite", suite);
  const reponse = NextResponse.redirect(url);
  reponse.cookies.delete(COOKIE_SESSION_ADMIN);
  return sansCache(reponse);
}

// Interdit au navigateur (et au bouton Retour) de reafficher une page admin depuis son cache.
function sansCache(reponse: NextResponse) {
  reponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private, max-age=0");
  reponse.headers.set("Pragma", "no-cache");
  reponse.headers.set("Expires", "0");
  return reponse;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
