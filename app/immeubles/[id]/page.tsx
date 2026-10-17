"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getImmeubleParId, getMaisonsParImmeuble } from "@/lib/store";
import { notFound } from "next/navigation";
import { Immeuble, Maison } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";
import { imageOptimisee } from "@/lib/imageOptimisee";

export default function ImmeubleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLanguage();
  const [immeuble, setImmeuble] = useState<Immeuble | null>(null);
  const [appartements, setAppartements] = useState<Maison[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    async function charger() {
      const [i, a] = await Promise.all([getImmeubleParId(id), getMaisonsParImmeuble(id)]);
      setImmeuble(i || null);
      setAppartements(a);
      setCharge(true);
    }
    charger();
  }, [id]);

  if (charge && !immeuble) return notFound();
  if (!charge || !immeuble) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">{t("chargement")}</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/societes" className="mb-6 inline-block text-slate-400 hover:text-white">
        {t("societes_retour")}
      </Link>

      {immeuble.photos.length > 0 && (
        <img src={imageOptimisee(immeuble.photos[0], 1200)} alt="" className="mb-6 h-64 w-full rounded-xl object-cover" />
      )}

      <h1 className="mb-2 text-3xl font-bold">{immeuble.nom}</h1>
      <p className="mb-1 text-slate-300">
        {immeuble.localisation.quartier ? immeuble.localisation.quartier + ", " : ""}
        {immeuble.localisation.ville}, {immeuble.localisation.province}, {immeuble.localisation.pays}
      </p>
      <p className="mt-4 mb-8 leading-relaxed text-slate-300">{immeuble.description}</p>

      <h2 className="mb-4 text-xl font-semibold">{t("immeuble_appartements")} ({appartements.length})</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {appartements.map((appart) => (
          <Link
            key={appart.id}
            href={"/maisons/" + appart.id}
            className="rounded-xl bg-slate-800 p-5 transition hover:bg-slate-700"
          >
            <h3 className="mb-1 text-lg font-semibold">{appart.titre}</h3>
            <p className="mb-2 font-bold text-emerald-400">
              {appart.prix.toLocaleString("fr-CA")} $
              {appart.transaction === "location" && " " + t("fiche_mois")}
            </p>
            <p className="text-sm text-slate-400">
              {appart.chambres} {t("maisons_ch")} - {appart.sallesDeBain} {t("maisons_sdb")} - {appart.superficie} m2
            </p>
          </Link>
        ))}
      </div>

      {appartements.length === 0 && (
        <p className="text-slate-400">{t("immeuble_aucun_appartement")}</p>
      )}
    </main>
  );
}