"use client";

import { useState } from "react";
import Link from "next/link";
import { getMaisons, getHotels } from "@/lib/store";
import SelectPays from "@/components/SelectPays";
import { Maison, Hotel } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";
import { HOTELS_VISIBLES } from "@/lib/fonctionnalites";

export default function RecherchePage() {
  const { t } = useLanguage();
  const [pays, setPays] = useState("");
  const [province, setProvince] = useState("");
  const [ville, setVille] = useState("");
  const [aRecherche, setARecherche] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const [resultatsMaisons, setResultatsMaisons] = useState<Maison[]>([]);
  const [resultatsHotels, setResultatsHotels] = useState<Hotel[]>([]);

  async function handleRecherche(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);

    const [toutesMaisons, tousHotels] = await Promise.all([getMaisons(), HOTELS_VISIBLES ? getHotels() : Promise.resolve([] as Hotel[])]);

    const maisons = toutesMaisons.filter((m) => {
      const matchPays = pays === "" || m.localisation.pays.toLowerCase().includes(pays.toLowerCase());
      const matchProvince = province === "" || m.localisation.province.toLowerCase().includes(province.toLowerCase());
      const matchVille = ville === "" || m.localisation.ville.toLowerCase().includes(ville.toLowerCase());
      return matchPays && matchProvince && matchVille;
    });

    const hotels = tousHotels.filter((h) => {
      const matchPays = pays === "" || h.localisation.pays.toLowerCase().includes(pays.toLowerCase());
      const matchProvince = province === "" || h.localisation.province.toLowerCase().includes(province.toLowerCase());
      const matchVille = ville === "" || h.localisation.ville.toLowerCase().includes(ville.toLowerCase());
      return matchPays && matchProvince && matchVille;
    });

    setResultatsMaisons(maisons);
    setResultatsHotels(hotels);
    setARecherche(true);
    setEnCours(false);
  }

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <h1 className="mb-8 text-3xl font-bold">{t("recherche_titre")}</h1>

      <form onSubmit={handleRecherche} className="mb-10 flex flex-wrap gap-4 rounded-xl bg-slate-800 p-6">
        <div>
          <label className="mb-1 block text-sm text-slate-300">{t("recherche_pays")}</label>
          <SelectPays value={pays} onChange={setPays} className="input w-48" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300">{t("recherche_province")}</label>
          <input value={province} onChange={(e) => setProvince(e.target.value)} className="input w-40" placeholder="Quebec" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300">{t("recherche_ville")}</label>
          <input value={ville} onChange={(e) => setVille(e.target.value)} className="input w-40" placeholder="Montreal" />
        </div>
        <div className="flex items-end">
          <button type="submit" className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700">
            {enCours ? t("recherche_en_cours") : t("recherche_bouton")}
          </button>
        </div>
      </form>

      {aRecherche && (
        <>
          <h2 className="mb-4 text-xl font-semibold">{t("accueil_maisons")} ({resultatsMaisons.length})</h2>
          <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resultatsMaisons.map((maison) => (
              <Link key={maison.id} href={"/maisons/" + maison.id} className="rounded-xl bg-slate-800 p-5 hover:bg-slate-700">
                <h3 className="mb-1 font-semibold">{maison.titre}</h3>
                <p className="text-sm text-slate-300">{maison.localisation.ville}, {maison.localisation.province}, {maison.localisation.pays}</p>
                <p className="mt-2 font-bold text-emerald-400">{maison.prix.toLocaleString("fr-CA")} $</p>
              </Link>
            ))}
          </div>

          {HOTELS_VISIBLES && (
            <>
              <h2 className="mb-4 text-xl font-semibold">{t("accueil_hotels")} ({resultatsHotels.length})</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {resultatsHotels.map((hotel) => (
                  <Link key={hotel.id} href={"/hotels/" + hotel.id} className="rounded-xl bg-slate-800 p-5 hover:bg-slate-700">
                    <h3 className="mb-1 font-semibold">{hotel.titre}</h3>
                    <p className="text-sm text-slate-300">{hotel.localisation.ville}, {hotel.localisation.province}, {hotel.localisation.pays}</p>
                    <p className="mt-2 text-sm font-semibold text-blue-400">{t("hotels_voir_chambres")} →</p>
                  </Link>
                ))}
              </div>
            </>
          )}

          {resultatsMaisons.length === 0 && resultatsHotels.length === 0 && (
            <p className="text-slate-400">{t("recherche_aucun_resultat")}</p>
          )}
        </>
      )}
    </main>
  );
}