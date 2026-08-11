"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getHotels, getParametres } from "@/lib/store";
import { ParametresSite, Hotel } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";

export default function HotelsPage() {
  const { t } = useLanguage();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [etoilesMin, setEtoilesMin] = useState<number>(0);
  const [prixMax, setPrixMax] = useState<number>(1000);
  const [wifiSeulement, setWifiSeulement] = useState<boolean>(false);
  const [piscineSeulement, setPiscineSeulement] = useState<boolean>(false);
  const [parametres, setParametres] = useState<ParametresSite | null>(null);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    async function charger() {
      const [h, p] = await Promise.all([getHotels(), getParametres()]);
      setHotels(h);
      setParametres(p);
      setCharge(true);
    }
    charger();
  }, []);

  const hotelsFiltres = hotels.filter((hotel) => {
    const matchEtoiles = hotel.etoiles >= etoilesMin;
    const matchPrix = hotel.prixParNuit <= prixMax;
    const matchWifi = !wifiSeulement || hotel.wifi;
    const matchPiscine = !piscineSeulement || hotel.piscine;
    return matchEtoiles && matchPrix && matchWifi && matchPiscine;
  });

  const styleFond = parametres?.imageHotelsUrl
    ? {
        backgroundImage: `linear-gradient(rgba(15,23,42,0.85), rgba(15,23,42,0.95)), url(${parametres.imageHotelsUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }
    : {};

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">{t("chargement")}</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white" style={styleFond}>
      <h1 className="mb-8 text-3xl font-bold">{t("hotels_titre")}</h1>

      <div className="mb-10 flex flex-wrap items-end gap-6 rounded-xl bg-slate-800/90 p-6">
        <div>
          <label className="mb-1 block text-sm text-slate-300">
            {t("hotels_etoiles_min")} : {etoilesMin}
          </label>
          <input
            type="range"
            min="0"
            max="5"
            value={etoilesMin}
            onChange={(e) => setEtoilesMin(Number(e.target.value))}
            className="w-48"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">
            {t("hotels_prix_nuit")} : {prixMax.toLocaleString("fr-CA")} $
          </label>
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            value={prixMax}
            onChange={(e) => setPrixMax(Number(e.target.value))}
            className="w-48"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={wifiSeulement}
            onChange={(e) => setWifiSeulement(e.target.checked)}
          />
          {t("hotels_wifi")}
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={piscineSeulement}
            onChange={(e) => setPiscineSeulement(e.target.checked)}
          />
          {t("hotels_piscine")}
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {hotelsFiltres.map((hotel) => (
          <Link
            key={hotel.id}
            href={"/hotels/" + hotel.id}
            className="rounded-xl bg-slate-800/90 p-5 transition hover:bg-slate-700/90"
          >
            <h2 className="mb-2 text-xl font-semibold">{hotel.titre}</h2>
            <p className="mb-1 text-slate-300">
              {hotel.localisation.ville}, {hotel.localisation.province}
            </p>
            <p className="mb-1 text-yellow-400">
              {"*".repeat(hotel.etoiles)}
              {"-".repeat(5 - hotel.etoiles)}
            </p>
            <p className="mb-2 text-lg font-bold text-emerald-400">
              {hotel.prixParNuit.toLocaleString("fr-CA")} $ {t("hotels_par_nuit")}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              {hotel.wifi && <span>{t("hotels_wifi")}</span>}
              {hotel.piscine && <span>- {t("hotels_piscine")}</span>}
              {hotel.petitDejeunerInclus && <span>- {t("hotels_petit_dej")}</span>}
            </div>
            {hotel.visiteVirtuelle && (
              <span className="mt-3 inline-block rounded-full bg-blue-600 px-3 py-1 text-xs">
                {t("fiche_visite_virtuelle")}
              </span>
            )}
          </Link>
        ))}
      </div>

      {hotelsFiltres.length === 0 && (
        <p className="mt-10 text-center text-slate-400">{t("hotels_aucun_resultat")}</p>
      )}
    </main>
  );
}