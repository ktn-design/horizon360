"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSalles, getParametres } from "@/lib/store";
import { TypeEvenement, Salle, ParametresSite } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";
import Diaporama from "@/components/Diaporama";

export default function SallesPage() {
  const { t } = useLanguage();

  const evenementsListe: { valeur: TypeEvenement; label: string }[] = [
    { valeur: "mariage", label: t("evenement_mariage") },
    { valeur: "anniversaire", label: t("evenement_anniversaire") },
    { valeur: "bal", label: t("evenement_bal") },
    { valeur: "deuil", label: t("evenement_deuil") },
    { valeur: "fete", label: t("evenement_fete") },
    { valeur: "conference", label: t("evenement_conference") },
    { valeur: "polyvalente", label: t("evenement_polyvalente") },
  ];

  const [salles, setSalles] = useState<Salle[]>([]);
  const [evenementFiltre, setEvenementFiltre] = useState<string>("tous");
  const [capaciteMin, setCapaciteMin] = useState<number>(0);
  const [prixMax, setPrixMax] = useState<number>(10000);
  const [prixMinIA, setPrixMinIA] = useState<number>(0);
  const [charge, setCharge] = useState(false);
  const [rechercheIA, setRechercheIA] = useState("");
  const [enCoursIA, setEnCoursIA] = useState(false);
  const [filtreVille, setFiltreVille] = useState("");
  const [messageIA, setMessageIA] = useState("");
  const [parametres, setParametres] = useState<ParametresSite | null>(null);

  useEffect(() => {
    async function charger() {
      const [s, p] = await Promise.all([getSalles(), getParametres()]);
      setSalles(s);
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

  const sallesFiltrees = salles.filter((salle) => {
    const matchEvenement =
      evenementFiltre === "tous" ||
      salle.evenementsAcceptes.includes(evenementFiltre as TypeEvenement) ||
      salle.evenementsAcceptes.includes("polyvalente");
    const matchCapacite = salle.capacite >= capaciteMin;
    const matchPrix = salle.prix <= prixMax && salle.prix >= prixMinIA;
    const matchVille = filtreVille === "" || salle.localisation.ville.toLowerCase().includes(filtreVille.toLowerCase());
    return matchEvenement && matchCapacite && matchPrix && matchVille;
  });

  const aRechercheActive = filtreVille || prixMinIA > 0;

  const styleFond = parametres?.imageSallesUrl
    ? {
        backgroundImage: `linear-gradient(rgba(15,23,42,0.85), rgba(15,23,42,0.95)), url(${parametres.imageSallesUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }
    : {};

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">{t("chargement")}</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white" style={styleFond}>
      <h1 className="mb-8 text-3xl font-bold">{t("salles_titre")}</h1>

      <form onSubmit={handleRechercheIA} className="mb-6 rounded-xl bg-purple-900/30 border border-purple-700 p-6">
        <label className="mb-2 block text-sm font-semibold text-purple-300">{t("ia_titre")}</label>
        <div className="flex flex-wrap gap-3">
          <input
            value={rechercheIA}
            onChange={(e) => setRechercheIA(e.target.value)}
            placeholder={t("ia_placeholder_salles")}
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

      <div className="mb-10 flex flex-wrap gap-4 rounded-xl bg-slate-800/90 p-6">
        <div>
          <label className="mb-1 block text-sm text-slate-300">{t("salles_type_evenement")}</label>
          <select
            value={evenementFiltre}
            onChange={(e) => setEvenementFiltre(e.target.value)}
            className="rounded bg-slate-700 px-3 py-2"
          >
            <option value="tous">{t("salles_tous")}</option>
            {evenementsListe.map((ev) => (
              <option key={ev.valeur} value={ev.valeur}>{ev.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">
            {t("salles_capacite_min")} : {capaciteMin} {t("salles_personnes")}
          </label>
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            value={capaciteMin}
            onChange={(e) => setCapaciteMin(Number(e.target.value))}
            className="w-48"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">
            {t("salles_prix_max")} : {prixMax.toLocaleString("fr-CA")} $
          </label>
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={prixMax}
            onChange={(e) => setPrixMax(Number(e.target.value))}
            className="w-48"
          />
        </div>

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
        {sallesFiltrees.map((salle) => (
          <Link
            key={salle.id}
            href={"/salles/" + salle.id}
            className="rounded-xl bg-slate-800/90 p-5 transition hover:bg-slate-700/90"
          >
            {salle.photos.length > 0 && (
              <img src={salle.photos[0]} alt="" loading="lazy" decoding="async" className="mb-3 h-40 w-full rounded-lg object-cover" />
            )}
            <h2 className="mb-2 text-xl font-semibold">{salle.titre}</h2>
            <p className="mb-1 text-slate-300">
              {salle.localisation.ville}, {salle.localisation.province}
            </p>
            <p className="mb-2 text-lg font-bold text-emerald-400">
              {salle.prix.toLocaleString("fr-CA")} $
            </p>
            <p className="mb-2 text-sm text-slate-400">
              {t("fiche_capacite")} : {salle.capacite} {t("salles_personnes")} - {salle.superficie} m2
            </p>
            <div className="flex flex-wrap gap-1">
              {salle.evenementsAcceptes.map((ev) => (
                <span key={ev} className="rounded-full bg-slate-700 px-2 py-1 text-xs">
                  {evenementsListe.find((e) => e.valeur === ev)?.label || ev}
                </span>
              ))}
            </div>
            {salle.visiteVirtuelle && (
              <span className="mt-3 inline-block rounded-full bg-blue-600 px-3 py-1 text-xs">
                {t("fiche_visite_virtuelle")}
              </span>
            )}
          </Link>
        ))}
      </div>

      {sallesFiltrees.length === 0 && (
        <p className="mt-10 text-center text-slate-400">{t("salles_aucun_resultat")}</p>
      )}
    </main>
  );
}