import { NextResponse } from "next/server";
import { enregistrerVisite } from "@/lib/store";
import { COOKIE_SESSION_ADMIN } from "@/lib/permissions";
import { normaliserPays } from "@/lib/pays";

// Pages suivies (voir useEnregistrerVisite) : tout autre nom est refuse.
const PAGES_SUIVIES = new Set(["accueil", "maisons", "maison_detail", "salles", "salle_detail", "hotels", "hotel_detail"]);

// Robots d'indexation, d'apercu de liens, outils de test... : jamais comptes comme visiteurs.
const ROBOTS = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|inspection|facebookexternalhit|whatsapp|telegram|vercel|python|curl|wget|axios|node-fetch|go-http|java\//i;

function extraireIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) return xForwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "";
}

function estIpPrivee(ip: string): boolean {
  return (
    !ip ||
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

function ignoree(raison: string) {
  return NextResponse.json({ succes: true, ignoree: raison });
}

export async function POST(request: Request) {
  try {
    const { page, visiteur } = await request.json();
    if (!page || !PAGES_SUIVIES.has(page)) return NextResponse.json({ erreur: "page inconnue." }, { status: 400 });

    const userAgent = request.headers.get("user-agent") || "";
    if (!userAgent || ROBOTS.test(userAgent)) return ignoree("robot");
    // Administrateur connecte sur cet appareil : ses propres visites ne comptent pas.
    if (request.headers.get("cookie")?.includes(COOKIE_SESSION_ADMIN + "=")) return ignoree("administrateur");

    const ip = extraireIp(request);
    let pays: string | undefined;
    let ville: string | undefined;

    if (!estIpPrivee(ip)) {
      try {
        const reponse = await fetch("http://ip-api.com/json/" + ip + "?fields=status,country,city,hosting", {
          signal: AbortSignal.timeout(3000),
        });
        const data = await reponse.json();
        if (data.status === "success") {
          // Adresse d'un centre de donnees (Google, Microsoft, Amazon...) : robot, pas un visiteur.
          if (data.hosting) return ignoree("centre de donnees");
          pays = normaliserPays(data.country) || undefined;
          ville = data.city || undefined;
        }
      } catch {
        // geolocalisation indisponible : on enregistre quand meme la visite, sans pays/ville
      }
    }

    // L'application mobile ajoute "Horizon360App" a l'identifiant du navigateur.
    const source = userAgent.includes("Horizon360App") ? "application" : "site";
    const idVisiteur = typeof visiteur === "string" && /^[a-z0-9-]{8,64}$/i.test(visiteur) ? visiteur : undefined;
    await enregistrerVisite({ page, pays, ville, ip: ip || undefined, source, visiteur: idVisiteur });

    return NextResponse.json({ succes: true });
  } catch (error) {
    return NextResponse.json({ erreur: String(error) }, { status: 500 });
  }
}
