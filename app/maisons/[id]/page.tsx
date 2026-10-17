import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMaisonParId } from "@/lib/store";
import MaisonDetailClient from "./MaisonDetailClient";

// Fiche preparee sur le serveur a la premiere visite, puis gardee en cache (voir app/page.tsx).
export const revalidate = 60;
export async function generateStaticParams() {
  return [];
}

const chargerMaison = cache(getMaisonParId);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const maison = await chargerMaison((await params).id);
  return maison ? { title: maison.titre + " | Horizon 360", description: maison.description.slice(0, 160) } : {};
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const maison = await chargerMaison((await params).id);
  if (!maison) notFound();
  return <MaisonDetailClient maison={maison} />;
}
