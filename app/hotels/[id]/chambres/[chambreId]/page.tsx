"use client";

import { use, useEffect, useState } from "react";
import { getHotelParId, getChambreParId, ChambreHotel, TypeLit } from "@/lib/store";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Hotel } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";
import ReservationHotel from "@/components/ReservationHotel";
import AssistantDeco from "@/components/AssistantDeco";

export default function ChambreDetailPage({ params }: { params: Promise<{ id: string; chambreId: string }> }) {
  const { id: hotelId, chambreId } = use(params);
  const { t } = useLanguage();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [chambre, setChambre] = useState<ChambreHotel | null>(null);
  const [photoActive, setPhotoActive] = useState(0);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    async function charger() {
      const [h, c] = await Promise.all([getHotelParId(hotelId), getChambreParId(chambreId)]);
      setHotel(h || null);
      setChambre(c || null);
      setCharge(true);
    }
    charger();
  }, [hotelId, chambreId]);

  if (charge && (!hotel || !chambre)) return notFound();
  if (!charge || !hotel || !chambre) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">{t("chargement")}</main>;

  const contexteIA = chambre.nom + " a " + hotel.titre + ", " + chambre.capacite + " personnes, " + chambre.description;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href={"/hotels/" + hotel.id} className="mb-6 inline-block text-slate-400 hover:text-white">
        {t("fiche_retour_hotels")} — {hotel.titre}
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 aspect-video overflow-hidden rounded-xl bg-slate-800">
            {chambre.photos.length > 0 ? (
              <img src={chambre.photos[photoActive]} alt={chambre.nom} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">{t("aucune_photo")}</div>
            )}
          </div>

          {chambre.photos.length > 1 && (
            <div className="flex gap-2">
              {chambre.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoActive(i)}
                  className={i === photoActive ? "h-16 w-24 overflow-hidden rounded-lg border-2 border-blue-500" : "h-16 w-24 overflow-hidden rounded-lg border-2 border-transparent"}
                >
                  <img src={photo} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {chambre.visiteVirtuelle && (
            <Link href={"/hotels/" + hotel.id + "/chambres/" + chambre.id + "/visite"} className="mt-5 block w-full rounded-xl bg-blue-600 py-4 text-center text-lg font-semibold hover:bg-blue-700">
              {t("fiche_visite_virtuelle")}
            </Link>
          )}

          <h1 className="mt-8 text-3xl font-bold">{chambre.nom}</h1>
          <p className="mt-1 text-slate-300">
            {hotel.titre} — {hotel.localisation.ville}, {hotel.localisation.province}
          </p>

          <p className="mt-6 leading-relaxed text-slate-300">{chambre.description}</p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Badge label={chambre.capacite + " personnes"} />
            <Badge label={chambre.sallesDeBain + " salle" + (chambre.sallesDeBain > 1 ? "s" : "") + " de bain"} />
            {chambre.typeLit && <Badge label={libelleTypeLit(chambre.typeLit)} />}
            {chambre.estSuite && <Badge label="Suite" />}
            {chambre.climatisation && <Badge label={t("fiche_climatisation")} />}
          </div>

          <p className="mt-8 text-2xl font-bold text-emerald-400">
            {chambre.prixParNuit.toLocaleString("fr-CA")} $ {t("hotels_par_nuit")}
          </p>

          <div className="mt-8">
            <ReservationHotel hotelId={hotel.id} chambreIdFixe={chambre.id} />
          </div>
        </div>

        <div className="h-fit rounded-xl bg-slate-800 p-6">
          <p className="mb-1 text-sm text-slate-400">{t("fiche_statut")}</p>
          <p className="mb-5 font-semibold capitalize">{chambre.statut}</p>

          <a href={"https://wa.me/" + hotel.contact.whatsapp} target="_blank" className="mb-3 block w-full rounded-lg bg-green-600 py-3 text-center font-semibold hover:bg-green-700">
            {t("fiche_whatsapp")}
          </a>
          <a href={"tel:" + hotel.contact.telephone} className="mb-3 block w-full rounded-lg bg-blue-600 py-3 text-center font-semibold hover:bg-blue-700">
            {t("fiche_appeler")}
          </a>
          <Link href={"/contact?bien=" + hotel.id} className="block w-full rounded-lg bg-slate-700 py-3 text-center font-semibold hover:bg-slate-600">
            {t("fiche_contacter")}
          </Link>
        </div>
      </div>

      <AssistantDeco contexte={contexteIA} />
    </main>
  );
}

function libelleTypeLit(typeLit: TypeLit) {
  if (typeLit === "queen") return "Lit Queen size";
  if (typeLit === "king") return "Lit King size";
  if (typeLit === "jumeaux") return "Lits jumeaux";
  return "";
}

function Badge({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-slate-800 p-3 text-center text-sm">
      {label}
    </div>
  );
}
