import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSalleParId } from "@/lib/store";
import SalleDetailClient from "./SalleDetailClient";

// Fiche preparee sur le serveur a la premiere visite, puis gardee en cache (voir app/page.tsx).
export const revalidate = 60;
export async function generateStaticParams() {
  return [];
}

const chargerSalle = cache(getSalleParId);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const salle = await chargerSalle((await params).id);
  return salle ? { title: salle.titre + " | Horizon 360", description: salle.description.slice(0, 160) } : {};
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const salle = await chargerSalle((await params).id);
  if (!salle) notFound();
  return <SalleDetailClient salle={salle} />;
}
