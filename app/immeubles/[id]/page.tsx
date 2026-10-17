import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getImmeubleParId, getMaisonsParImmeuble, getSocieteParId } from "@/lib/store";
import ImmeubleClient from "./ImmeubleClient";

// Page preparee sur le serveur a la premiere visite, puis gardee en cache (voir app/page.tsx).
export const revalidate = 60;
export async function generateStaticParams() {
  return [];
}

const chargerImmeuble = cache(getImmeubleParId);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const immeuble = await chargerImmeuble((await params).id);
  return immeuble ? { title: immeuble.nom + " | Horizon 360", description: immeuble.description.slice(0, 160) } : {};
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [immeuble, appartements] = await Promise.all([chargerImmeuble(id), getMaisonsParImmeuble(id)]);
  if (!immeuble) notFound();
  const societe = await getSocieteParId(immeuble.societeId);
  return <ImmeubleClient immeuble={immeuble} societe={societe || null} appartements={appartements} />;
}
