"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getSocieteParId, getImmeublesParSociete } from "@/lib/store";
import { notFound } from "next/navigation";
import { Societe, Immeuble } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";

export default function SocieteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLanguage();
  const [societe, setSociete] = useState<Societe | null>(null);
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    async function charger() {
      const [s, im] = await Promise.all([getSocieteParId(id), getImmeublesParSociete(id)]);
      setSociete(s || null);
      setImmeubles(im);
      setCharge(true);
    }
    charger();
  }, [id]);

  if (charge && !societe) return notFound();
  if (!charge || !societe) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">{t("chargement")}</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/societes" className="mb-6 inline-block text-slate-400 hover:text-white">
        {t("societes_retour")}
      </Link>

      <div className="mb-10 flex items-center gap-4">
        {societe.logoUrl && <img src={societe.logoUrl} alt="" loading="lazy" decoding="async" className="h-20 w-20 rounded-lg object-cover" />}
        <div>
          <h1 className="text-3xl font-bold">{societe.nom}</h1>
          <p className="mt-1 text-slate-300">{societe.description}</p>
        </div>
      </div>

      <h2 className="mb-4 text-xl font-semibold">{t("societes_immeubles")} ({immeubles.length})</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {immeubles.map((immeuble) => (
          <Link
            key={immeuble.id}
            href={"/immeubles/" + immeuble.id}
            className="rounded-xl bg-slate-800 p-5 transition hover:bg-slate-700"
          >
            {immeuble.photos.length > 0 && (
              <img src={immeuble.photos[0]} alt="" loading="lazy" decoding="async" className="mb-3 h-40 w-full rounded-lg object-cover" />
            )}
            <h3 className="mb-1 text-lg font-semibold">{immeuble.nom}</h3>
            <p className="text-sm text-slate-400">
              {immeuble.localisation.ville}, {immeuble.localisation.province}
            </p>
          </Link>
        ))}
      </div>

      {immeubles.length === 0 && <p className="text-slate-400">{t("societes_aucun_immeuble")}</p>}
    </main>
  );
}