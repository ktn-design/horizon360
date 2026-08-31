"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getHotels, getParametres } from "@/lib/store";
import { ParametresSite, Hotel } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";
import Diaporama from "@/components/Diaporama";

export default function HotelsPage() {
  const { t } = useLanguage();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [etoilesMin, setEtoilesMin] = useState<number>(0);
  const [prixMax, setPrixMax] = useState<number>(1000);
  const [prixMinIA, setPrixMinIA] = useState<number>(0);
  const [wifiSeulement, setWifiSeulement] = useState<boolean>(false);
  const [piscineSeulement, setPiscineSeulement] = useState<boolean>(false);
  const [parametres, setParametres] = useState<ParametresSite | null>(null);
  const [charge, setCharge] = useState(false);
  const [rechercheIA, setRechercheIA] = useState("");
  const [enCoursIA, setEnCoursIA] = useState(false);
  const [filtreVille, setFiltreVille] = useState("");
  const [messageIA, setMessageIA] = useState("");

  useEffect(() => {
    async function charger() {
      const [h, p] = await Promise.all([getHotels(), getParametres()]);
      setHotels(h);
      setParametres(p);
      setCharge(true);
    }
    charger();
  }, []);

  async function handleRechercheIA(e: React.FormEvent) {
    e.preventDefault();
    if (!rechercheIA.trim()) return;
    setEnCoursIA(true);
    setMessageIA("");

    try {
      const res = await fetch("/api/recherche-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: rechercheIA }),
      });
      const data = await res.json();
      const c = data.criteres || {};

      const aUnCritere = c.prixMax || c.prixMin || c.ville;

      if (!aUnCritere) {
        setMessageIA(t("ia_incompris_court"));
        setEnCoursIA(false);
        return;
      }

      if (c.prixMax) setPrixMax(Number(c.prixMax));
      if (c.prixMin) setPrixMinIA(Number(c.prixMin));
      setFiltreVille(c.ville || "");
    } catch (err) {
      setMessageIA(t("ia_erreur"));
    }

    setEnCoursIA(false);
  }

  const hotelsFiltres = hotels.filter((hotel) => {
    const matchEtoiles = hotel.etoiles >= etoilesMin;
    const matchPrix = hotel.prixParNuit <= prixMax && hotel.prixParNuit >= prixMinIA;
    const matchWifi = !wifiSeulement || hotel.wifi;
    const matchPiscine = !piscineSeulement || hotel.piscine;
    const matchVille = filtreVille === "" || hotel.localisation.ville.toLowerCase().includes(filtreVille.toLowerCase());
    return matchEtoiles && matchPrix && matchWifi && matchPiscine && matchVille;
  });

  const aRechercheActive = filtreVille || prixMinIA > 0;

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

      <form onSubmit={handleRechercheIA} className="mb-6 rounded-xl bg-purple-900/30 border border-purple-700 p-6">
        <label className="mb-2 block text-sm font-semibold text-purple-300">{t("ia_titre")}</label>
        <div className="flex flex-wrap gap-3">
          <input
            value={rechercheIA}
            onChange={(e) => setRechercheIA(e.target.value)}
            placeholder={t("ia_placeholder_hotels")}
            className="input flex-1"
            disabled={enCoursIA}
          />
          <button type="submit" disabled={enCoursIA} className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-700 disabled:opacity-70">
            {enCoursIA && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            )}
            {enCoursIA ? t("ia_analyse") : t("ia_bouton")}
          </button>
        </div>
        {messageIA && (
          <p className="mt-2 text-sm text-yellow-400">{messageIA}</p>
        )}
        {(filtreVille || prixMinIA > 0) && !messageIA && (
          <p className="mt-2 text-xs text-purple-300">
            {t("ia_filtres_appliques")} {filtreVille && t("ia_ville") + " " + filtreVille + " "} {prixMinIA > 0 && t("ia_prix_min") + " " + prixMinIA.toLocaleString("fr-CA") + "$"}
          </p>
        )}
      </form>

      <Link
        href="/chambres"
        className="mb-10 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-800/90 p-5 transition hover:bg-slate-700/90"
      >
        <span className="text-slate-300">{t("chambres_lien_hotels")}</span>
        <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold">{t("chambres_lien_hotels_action")}</span>
      </Link>

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

        {aRechercheActive && (
          <button
            type="button"
            onClick={() => { setFiltreVille(""); setPrixMinIA(0); setMessageIA(""); }}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
          >
            {t("ia_effacer")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {hotelsFiltres.map((hotel) => (
          <Link
            key={hotel.id}
            href={"/hotels/" + hotel.id}
            className="overflow-hidden rounded-xl bg-slate-800/90 transition hover:bg-slate-700/90"
          >
            <div className="aspect-video w-full overflow-hidden bg-slate-700">
              {hotel.photos.length > 0 ? (
                <img src={hotel.photos[0]} alt={hotel.titre} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500 text-sm">{t("aucune_photo")}</div>
              )}
            </div>
            <div className="p-5">
              <h2 className="mb-2 text-xl font-semibold">{hotel.titre}</h2>
              <p className="mb-1 text-slate-300">
                {hotel.localisation.ville}, {hotel.localisation.province}
              </p>
              <p className="mb-1 text-yellow-400">
                {"*".repeat(hotel.etoiles)}
                {"-".repeat(5 - hotel.etoiles)}
              </p>
              <div className="mb-2 flex flex-wrap gap-2 text-xs text-slate-400">
                {hotel.wifi && <span>{t("hotels_wifi")}</span>}
                {hotel.piscine && <span>- {t("hotels_piscine")}</span>}
                {hotel.petitDejeunerInclus && <span>- {t("hotels_petit_dej")}</span>}
              </div>
              {hotel.visiteVirtuelle && (
                <span className="mt-3 inline-block rounded-full bg-blue-600 px-3 py-1 text-xs">
                  {t("fiche_visite_virtuelle")}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {hotelsFiltres.length === 0 && (
        <p className="mt-10 text-center text-slate-400">{t("hotels_aucun_resultat")}</p>
      )}
    </main>
  );
}