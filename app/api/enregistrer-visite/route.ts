import { NextResponse } from "next/server";
import { enregistrerVisite } from "@/lib/store";

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

export async function POST(request: Request) {
  try {
    const { page } = await request.json();
    if (!page) return NextResponse.json({ erreur: "page manquante." }, { status: 400 });

    const ip = extraireIp(request);
    let pays: string | undefined;
    let ville: string | undefined;

    if (!estIpPrivee(ip)) {
      try {
        const reponse = await fetch("http://ip-api.com/json/" + ip + "?fields=status,country,city", {
          signal: AbortSignal.timeout(3000),
        });
        const data = await reponse.json();
        if (data.status === "success") {
          pays = data.country || undefined;
          ville = data.city || undefined;
        }
      } catch {
        // geolocalisation indisponible : on enregistre quand meme la visite, sans pays/ville
      }
    }

    await enregistrerVisite({ page, pays, ville, ip: ip || undefined });

    return NextResponse.json({ succes: true });
  } catch (error) {
    return NextResponse.json({ erreur: String(error) }, { status: 500 });
  }
}
