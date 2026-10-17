"use client";

import { useState } from "react";
import Link from "next/link";
import { Salle, TypeEvenement } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";
import ReservationSalle from "@/components/ReservationSalle";
import AssistantDeco from "@/components/AssistantDeco";
import { useEnregistrerVisite } from "@/lib/useEnregistrerVisite";
import { imageOptimisee } from "@/lib/imageOptimisee";

// La salle arrive deja chargee du serveur (app/salles/[id]/page.tsx) : affichage immediat.
export default function SalleDetailClient({ salle }: { salle: Salle }) {
  const { t } = useLanguage();
  useEnregistrerVisite("salle_detail");

  const labelsEvenements: Record<string, string> = {
    mariage: t("evenement_mariage"),
    anniversaire: t("evenement_anniversaire"),
    bal: t("evenement_bal"),
    deuil: t("evenement_deuil"),
    fete: t("evenement_fete"),
    conference: t("evenement_conference"),
    polyvalente: t("evenement_polyvalente"),
  };

  const [photoActive, setPhotoActive] = useState(0);

  const contexteIA = salle.titre + ", capacite " + salle.capacite + " personnes, " + salle.superficie + " m2, " + salle.description;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/salles" className="mb-6 inline-block text-slate-400 hover:text-white">
        {t("fiche_retour_salles")}
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 aspect-video overflow-hidden rounded-xl bg-slate-800">
            {salle.photos.length > 0 ? (
              <img src={imageOptimisee(salle.photos[photoActive], 1200)} alt={salle.titre} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">{t("aucune_photo")}</div>
            )}
          </div>

          {salle.photos.length > 1 && (
            <div className="flex gap-2">
              {salle.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoActive(i)}
                  className={i === photoActive ? "h-16 w-24 overflow-hidden rounded-lg border-2 border-blue-500" : "h-16 w-24 overflow-hidden rounded-lg border-2 border-transparent"}
                >
                  <img src={imageOptimisee(photo, 256)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {salle.visiteVirtuelle && (
            <Link href={"/salles/" + salle.id + "/visite"} className="mt-5 block w-full rounded-xl bg-blue-600 py-4 text-center text-lg font-semibold hover:bg-blue-700">
              {t("fiche_visite_virtuelle")}
            </Link>
          )}

          <h1 className="mt-8 text-3xl font-bold">{salle.titre}</h1>
          <p className="mt-1 text-slate-300">
            {salle.localisation.quartier ? salle.localisation.quartier + ", " : ""}
            {salle.localisation.ville}, {salle.localisation.province}, {salle.localisation.pays}
          </p>

          <p className="mt-4 text-2xl font-bold text-emerald-400">
            {salle.prix.toLocaleString("fr-CA")} $
          </p>

          <p className="mt-6 leading-relaxed text-slate-300">{salle.description}</p>

          <h2 className="mt-8 mb-3 text-lg font-semibold">{t("fiche_evenements_acceptes")}</h2>
          <div className="flex flex-wrap gap-2">
            {salle.evenementsAcceptes.map((ev) => (
              <span key={ev} className="rounded-full bg-blue-600 px-3 py-1 text-sm">
                {labelsEvenements[ev] || ev}
              </span>
            ))}
          </div>

          <h2 className="mt-8 mb-3 text-lg font-semibold">{t("fiche_caracteristiques")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Caracteristique label={t("fiche_capacite")} valeur={salle.capacite + " " + t("salles_personnes")} />
            <Caracteristique label={t("fiche_superficie")} valeur={salle.superficie + " m2"} />
            {salle.parking && <Badge label={t("fiche_parking")} />}
            {salle.climatisation && <Badge label={t("fiche_climatisation")} />}
            {salle.sonorisation && <Badge label="Sonorisation" />}
            {salle.eclairageEvenementiel && <Badge label="Eclairage evenementiel" />}
            {salle.cuisine && <Badge label="Cuisine" />}
            {salle.wifi && <Badge label={t("hotels_wifi")} />}
          </div>

          <div className="mt-8">
            <ReservationSalle salleId={salle.id} />
          </div>
        </div>

        <div className="h-fit rounded-xl bg-slate-800 p-6">
          <p className="mb-1 text-sm text-slate-400">{t("fiche_statut")}</p>
          <p className="mb-5 font-semibold capitalize">{salle.statut}</p>

          <a href={"https://wa.me/" + salle.contact.whatsapp} target="_blank" className="mb-3 block w-full rounded-lg bg-green-600 py-3 text-center font-semibold hover:bg-green-700">
            {t("fiche_whatsapp")}
          </a>
          <a href={"tel:" + salle.contact.telephone} className="mb-3 block w-full rounded-lg bg-blue-600 py-3 text-center font-semibold hover:bg-blue-700">
            {t("fiche_appeler")}
          </a>
          <Link href={"/contact?bien=" + salle.id} className="block w-full rounded-lg bg-slate-700 py-3 text-center font-semibold hover:bg-slate-600">
            {t("fiche_contacter")}
          </Link>
        </div>
      </div>

      <AssistantDeco contexte={contexteIA} />
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