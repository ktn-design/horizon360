"use client";

import { use, useEffect, useState } from "react";
import { getMaisonParId } from "@/lib/store";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Maison } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";

export default function MaisonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLanguage();
  const [maison, setMaison] = useState<Maison | null>(null);
  const [photoActive, setPhotoActive] = useState(0);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    async function charger() {
      const m = await getMaisonParId(id);
      setMaison(m || null);
      setCharge(true);
    }
    charger();
  }, [id]);

  if (charge && !maison) return notFound();
  if (!charge || !maison) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">{t("chargement")}</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/maisons" className="mb-6 inline-block text-slate-400 hover:text-white">
        {t("fiche_retour_maisons")}
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 aspect-video overflow-hidden rounded-xl bg-slate-800">
            {maison.photos.length > 0 ? (
              <img src={maison.photos[photoActive]} alt={maison.titre} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">{t("aucune_photo")}</div>
            )}
          </div>

          {maison.photos.length > 1 && (
            <div className="flex gap-2">
              {maison.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoActive(i)}
                  className={i === photoActive ? "h-16 w-24 overflow-hidden rounded-lg border-2 border-blue-500" : "h-16 w-24 overflow-hidden rounded-lg border-2 border-transparent"}
                >
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {maison.visiteVirtuelle && (
            <Link href={"/maisons/" + maison.id + "/visite"} className="mt-5 block w-full rounded-xl bg-blue-600 py-4 text-center text-lg font-semibold hover:bg-blue-700">
              {t("fiche_visite_virtuelle")}
            </Link>
          )}

          <h1 className="mt-8 text-3xl font-bold">{maison.titre}</h1>
          <p className="mt-1 text-slate-300">
            {maison.localisation.quartier ? maison.localisation.quartier + ", " : ""}
            {maison.localisation.ville}, {maison.localisation.province}, {maison.localisation.pays}
          </p>

          <p className="mt-4 text-2xl font-bold text-emerald-400">
            {maison.prix.toLocaleString("fr-CA")} $
            {maison.transaction === "location" && " " + t("fiche_mois")}
            {maison.transaction === "location_courte_duree" && " " + t("fiche_nuit")}
          </p>

          <p className="mt-6 leading-relaxed text-slate-300">{maison.description}</p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Caracteristique label={t("fiche_chambres")} valeur={maison.chambres} />
            <Caracteristique label={t("fiche_salles_bain")} valeur={maison.sallesDeBain} />
            <Caracteristique label={t("fiche_superficie")} valeur={maison.superficie + " m2"} />
            {maison.parking && <Badge label={t("fiche_parking")} />}
            {maison.piscine && <Badge label={t("hotels_piscine")} />}
            {maison.jardin && <Badge label={t("fiche_jardin")} />}
            {maison.meublee && <Badge label={t("fiche_meublee")} />}
            {maison.climatisation && <Badge label={t("fiche_climatisation")} />}
            {maison.internet && <Badge label={t("fiche_internet")} />}
          </div>
        </div>

        <div className="h-fit rounded-xl bg-slate-800 p-6">
          <p className="mb-1 text-sm text-slate-400">{t("fiche_statut")}</p>
          <p className="mb-5 font-semibold capitalize">{maison.statut}</p>

          <a href={"https://wa.me/" + maison.contact.whatsapp} target="_blank" className="mb-3 block w-full rounded-lg bg-green-600 py-3 text-center font-semibold hover:bg-green-700">
            {t("fiche_whatsapp")}
          </a>
          <a href={"tel:" + maison.contact.telephone} className="mb-3 block w-full rounded-lg bg-blue-600 py-3 text-center font-semibold hover:bg-blue-700">
            {t("fiche_appeler")}
          </a>
          <Link href={"/contact?bien=" + maison.id} className="block w-full rounded-lg bg-slate-700 py-3 text-center font-semibold hover:bg-slate-600">
            {t("fiche_contacter")}
          </Link>
        </div>
      </div>
    </main>
  );
}

function Caracteristique({ label, valeur }: { label: string; valeur: string | number }) {
  return (
    <div className="rounded-lg bg-slate-800 p-3 text-center">
      <p className="text-lg font-bold">{valeur}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-slate-800 p-3 text-center text-sm">
      OK {label}
    </div>
  );
}