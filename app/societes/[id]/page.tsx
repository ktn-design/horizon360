import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getImmeublesParSociete, getMaisons, getSocieteParId } from "@/lib/store";
import SocieteClient from "./SocieteClient";

// Page preparee sur le serveur a la premiere visite, puis gardee en cache (voir app/page.tsx).
export const revalidate = 60;
export async function generateStaticParams() {
  return [];
}

const chargerSociete = cache(getSocieteParId);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const societe = await chargerSociete((await params).id);
  return societe ? { title: societe.nom + " | Horizon 360", description: societe.description.slice(0, 160) } : {};
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [societe, immeubles, maisons] = await Promise.all([chargerSociete(id), getImmeublesParSociete(id), getMaisons()]);
  if (!societe) notFound();
  const nbAppartements: Record<string, number> = {};
  for (const m of maisons) if (m.immeubleId) nbAppartements[m.immeubleId] = (nbAppartements[m.immeubleId] || 0) + 1;
  return <SocieteClient societe={societe} immeubles={immeubles} nbAppartements={nbAppartements} />;
}
