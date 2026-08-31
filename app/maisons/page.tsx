"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMaisons, getParametres } from "@/lib/store";
import { ParametresSite, Maison } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";
import Diaporama from "@/components/Diaporama";
import { useEnregistrerVisite } from "@/lib/useEnregistrerVisite";

export default function MaisonsPage() {
  const { t } = useLanguage();
  useEnregistrerVisite("maisons");
  const [maisons, setMaisons] = useState<Maison[]>([]);
  const [transactionFiltre, setTransactionFiltre] = useState<string>("toutes");
  const [prixMax, setPrixMax] = useState<number>(1000000);
  const [prixMinIA, setPrixMinIA] = useState<number>(0);
  const [chambresMin, setChambresMin] = useState<number>(0);
  const [parametres, setParametres] = useState<ParametresSite | null>(null);
  const [charge, setCharge] = useState(false);
  const [rechercheIA, setRechercheIA] = useState("");
  const [enCoursIA, setEnCoursIA] = useState(false);
  const [filtreVille, setFiltreVille] = useState("");
  const [filtreQuartier, setFiltreQuartier] = useState("");
  const [messageIA, setMessageIA] = useState("");

  useEffect(() => {
    async function charger() {
      const [m, p] = await Promise.all([getMaisons(), getParametres()]);
      setMaisons(m);
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

      const aUnCritere = c.prixMax || c.prixMin || c.chambresMin || c.typeTransaction || c.ville || c.quartier;

      if (!aUnCritere) {
        setMessageIA(t("ia_incompris"));
        setEnCoursIA(false);
        return;
      }

      if (c.prixMax) setPrixMax(Number(c.prixMax));
      if (c.prixMin) setPrixMinIA(Number(c.prixMin));
      if (c.chambresMin) setChambresMin(Number(c.chambresMin));
      if (c.typeTransaction) setTransactionFiltre(c.typeTransaction);
      setFiltreVille(c.ville || "");
      setFiltreQuartier(c.quartier || "");
    } catch (err) {
      setMessageIA(t("ia_erreur"));
    }

    setEnCoursIA(false);
  }

  const maisonsFiltrees = maisons.filter((maison) => {
    const matchTransaction =
      transactionFiltre === "toutes" || maison.transaction === transactionFiltre;
    const matchPrix = maison.prix <= prixMax && maison.prix >= prixMinIA;
    const matchChambres = maison.chambres >= chambresMin;
    const matchVille = filtreVille === "" || maison.localisation.ville.toLowerCase().includes(filtreVille.toLowerCase());
    const matchQuartier = filtreQuartier === "" || (maison.localisation.quartier || "").toLowerCase().includes(filtreQuartier.toLowerCase());
    return matchTransaction && matchPrix && matchChambres && matchVille && matchQuartier;
  });

  const aRechercheActive = filtreVille || filtreQuartier || prixMinIA > 0;

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

      <form onSubmit={handleRechercheIA} className="mb-6 rounded-xl bg-purple-900/30 border border-purple-700 p-6">
        <label className="mb-2 block text-sm font-semibold text-purple-300">{t("ia_titre")}</label>
        <div className="flex flex-wrap gap-3">
          <input
            value={rechercheIA}
            onChange={(e) => setRechercheIA(e.target.value)}
            placeholder={t("ia_placeholder_maisons")}
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
        {(filtreVille || filtreQuartier || prixMinIA > 0) && !messageIA && (
          <p className="mt-2 text-xs text-purple-300">
            {t("ia_filtres_appliques")} {filtreVille && t("ia_ville") + " " + filtreVille + " "} {filtreQuartier && t("ia_quartier") + " " + filtreQuartier + " "} {prixMinIA > 0 && t("ia_prix_min") + " " + prixMinIA.toLocaleString("fr-CA") + "$"}
          </p>
        )}
      </form>

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

        {aRechercheActive && (
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => { setFiltreVille(""); setFiltreQuartier(""); setPrixMinIA(0); setMessageIA(""); }}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
            >
              {t("ia_effacer")}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {maisonsFiltrees.map((maison) => (
          <Link
            key={maison.id}
            href={"/maisons/" + maison.id}
            className="overflow-hidden rounded-xl bg-slate-800/90 transition hover:bg-slate-700/90"
          >
            <div className="aspect-video w-full overflow-hidden bg-slate-700">
              {maison.photos.length > 0 ? (
                <img src={maison.photos[0]} alt={maison.titre} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500 text-sm">{t("aucune_photo")}</div>
              )}
            </div>
            <div className="p-5">
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
            </div>
          </Link>
        ))}
      </div>

      {maisonsFiltrees.length === 0 && (
        <p className="mt-10 text-center text-slate-400">{t("maisons_aucun_resultat")}</p>
      )}
    </main>
  );
}