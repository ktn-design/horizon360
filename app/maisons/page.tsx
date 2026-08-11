"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMaisons, getParametres } from "@/lib/store";
import { ParametresSite, Maison } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";

export default function MaisonsPage() {
  const { t } = useLanguage();
  const [maisons, setMaisons] = useState<Maison[]>([]);
  const [transactionFiltre, setTransactionFiltre] = useState<string>("toutes");
  const [prixMax, setPrixMax] = useState<number>(1000000);
  const [chambresMin, setChambresMin] = useState<number>(0);
  const [parametres, setParametres] = useState<ParametresSite | null>(null);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    async function charger() {
      const [m, p] = await Promise.all([getMaisons(), getParametres()]);
      setMaisons(m);
      setParametres(p);
      setCharge(true);
    }
    charger();
  }, []);

  const maisonsFiltrees = maisons.filter((maison) => {
    const matchTransaction =
      transactionFiltre === "toutes" || maison.transaction === transactionFiltre;
    const matchPrix = maison.prix <= prixMax;
    const matchChambres = maison.chambres >= chambresMin;
    return matchTransaction && matchPrix && matchChambres;
  });

  const styleFond = parametres?.imageMaisonsUrl
    ? {
        backgroundImage: `linear-gradient(rgba(15,23,42,0.85), rgba(15,23,42,0.95)), url(${parametres.imageMaisonsUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }
    : {};

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">{t("chargement")}</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white" style={styleFond}>
      <h1 className="mb-8 text-3xl font-bold">{t("maisons_titre")}</h1>

      <div className="mb-10 flex flex-wrap gap-4 rounded-xl bg-slate-800/90 p-6">
        <div>
          <label className="mb-1 block text-sm text-slate-300">{t("maisons_type")}</label>
          <select
            value={transactionFiltre}
            onChange={(e) => setTransactionFiltre(e.target.value)}
            className="rounded bg-slate-700 px-3 py-2"
          >
            <option value="toutes">{t("maisons_toutes")}</option>
            <option value="vente">{t("maisons_vente")}</option>
            <option value="location">{t("maisons_location")}</option>
            <option value="location_courte_duree">{t("maisons_courte_duree")}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">
            {t("maisons_prix_max")} : {prixMax.toLocaleString("fr-CA")} $
          </label>
          <input
            type="range"
            min="0"
            max="1000000"
            step="10000"
            value={prixMax}
            onChange={(e) => setPrixMax(Number(e.target.value))}
            className="w-48"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">
            {t("maisons_chambres_min")} : {chambresMin}
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={chambresMin}
            onChange={(e) => setChambresMin(Number(e.target.value))}
            className="w-48"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {maisonsFiltrees.map((maison) => (
          <Link
            key={maison.id}
            href={"/maisons/" + maison.id}
            className="rounded-xl bg-slate-800/90 p-5 transition hover:bg-slate-700/90"
          >
            <h2 className="mb-2 text-xl font-semibold">{maison.titre}</h2>
            <p className="mb-1 text-slate-300">
              {maison.localisation.ville}, {maison.localisation.province}
            </p>
            <p className="mb-2 text-lg font-bold text-emerald-400">
              {maison.prix.toLocaleString("fr-CA")} $
              {maison.transaction === "location" && " " + t("fiche_mois")}
            </p>
            <p className="text-sm text-slate-400">
              {maison.chambres} {t("maisons_ch")} - {maison.sallesDeBain} {t("maisons_sdb")} - {maison.superficie} m2
            </p>
            {maison.visiteVirtuelle && (
              <span className="mt-3 inline-block rounded-full bg-blue-600 px-3 py-1 text-xs">
                {t("fiche_visite_virtuelle")}
              </span>
            )}
          </Link>
        ))}
      </div>

      {maisonsFiltrees.length === 0 && (
        <p className="mt-10 text-center text-slate-400">{t("maisons_aucun_resultat")}</p>
      )}
    </main>
  );
}