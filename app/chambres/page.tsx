"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToutesLesChambres, getHotels, ChambreHotel, TypeLit } from "@/lib/store";
import { Hotel } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";
import { imageOptimisee } from "@/lib/imageOptimisee";

interface ResultatChambre {
  chambre: ChambreHotel;
  hotel: Hotel;
}

interface CriteresChambre {
  prixMax: number | null;
  capaciteMin: number | null;
  typeLit: string;
  estSuite: boolean | null;
  ville: string;
}

export default function ChambresPage() {
  const { t } = useLanguage();
  const [resultats, setResultats] = useState<ResultatChambre[]>([]);
  const [charge, setCharge] = useState(false);
  const [rechercheIA, setRechercheIA] = useState("");
  const [enCoursIA, setEnCoursIA] = useState(false);
  const [messageIA, setMessageIA] = useState("");
  const [criteres, setCriteres] = useState<CriteresChambre | null>(null);

  useEffect(() => {
    async function charger() {
      const [chambres, hotels] = await Promise.all([getToutesLesChambres(), getHotels()]);
      const hotelsParId = new Map(hotels.map((h) => [h.id, h]));
      const combinees: ResultatChambre[] = chambres
        .filter((c) => c.statut === "disponible")
        .map((c) => ({ chambre: c, hotel: hotelsParId.get(c.hotelId) as Hotel }))
        .filter((r) => r.hotel);
      setResultats(combinees);
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
      const res = await fetch("/api/recherche-chambres-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: rechercheIA }),
      });
      const data = await res.json();
      const c = data.criteres || {};
      const aUnCritere = c.prixMax || c.capaciteMin || c.typeLit || c.estSuite !== null && c.estSuite !== undefined || c.ville;

      if (!aUnCritere) {
        setMessageIA(t("ia_incompris_court"));
        setEnCoursIA(false);
        return;
      }

      setCriteres({
        prixMax: c.prixMax || null,
        capaciteMin: c.capaciteMin || null,
        typeLit: c.typeLit || "",
        estSuite: c.estSuite ?? null,
        ville: c.ville || "",
      });
    } catch (err) {
      setMessageIA(t("ia_erreur"));
    }
    setEnCoursIA(false);
  }

  function effacerRecherche() {
    setCriteres(null);
    setMessageIA("");
    setRechercheIA("");
  }

  const resultatsFiltres = !criteres
    ? resultats
    : resultats.filter((r) => {
        const matchPrix = !criteres.prixMax || r.chambre.prixParNuit <= criteres.prixMax;
        const matchCapacite = !criteres.capaciteMin || r.chambre.capacite >= criteres.capaciteMin;
        const matchTypeLit = !criteres.typeLit || r.chambre.typeLit === criteres.typeLit;
        const matchSuite = criteres.estSuite === null || r.chambre.estSuite === criteres.estSuite;
        const matchVille = !criteres.ville || r.hotel.localisation.ville.toLowerCase().includes(criteres.ville.toLowerCase());
        return matchPrix && matchCapacite && matchTypeLit && matchSuite && matchVille;
      });

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">{t("chargement")}</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <h1 className="mb-8 text-3xl font-bold">{t("chambres_titre")}</h1>

      <form onSubmit={handleRechercheIA} className="mb-10 rounded-xl border border-purple-700 bg-purple-900/30 p-6">
        <label className="mb-2 block text-sm font-semibold text-purple-300">{t("ia_titre")}</label>
        <div className="flex flex-wrap gap-3">
          <input
            value={rechercheIA}
            onChange={(e) => setRechercheIA(e.target.value)}
            placeholder={t("chambres_ia_placeholder")}
            className="input flex-1"
            disabled={enCoursIA}
          />
          <button type="submit" disabled={enCoursIA} className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-700 disabled:opacity-70">
            {enCoursIA && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>}
            {enCoursIA ? t("ia_analyse") : t("ia_bouton")}
          </button>
          {criteres && (
            <button type="button" onClick={effacerRecherche} className="rounded-lg bg-slate-700 px-4 py-3 text-sm hover:bg-slate-600">
              {t("ia_effacer")}
            </button>
          )}
        </div>
        {messageIA && <p className="mt-2 text-sm text-yellow-400">{messageIA}</p>}
      </form>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {resultatsFiltres.map(({ chambre, hotel }) => (
          <Link
            key={chambre.id}
            href={"/hotels/" + hotel.id + "/chambres/" + chambre.id}
            className="overflow-hidden rounded-xl bg-slate-800/90 transition hover:bg-slate-700/90"
          >
            <div className="aspect-video w-full overflow-hidden bg-slate-700">
              {chambre.photos.length > 0 ? (
                <img src={imageOptimisee(chambre.photos[0], 640)} alt={chambre.nom} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">{t("aucune_photo")}</div>
              )}
            </div>
            <div className="p-5">
              <h2 className="mb-1 text-lg font-semibold">{chambre.nom}</h2>
              <p className="mb-2 text-sm text-slate-400">
                {hotel.titre} — {hotel.localisation.ville}
              </p>
              <p className="text-sm text-slate-400">
                {chambre.capacite} personnes
                {chambre.typeLit && " - " + libelleTypeLit(chambre.typeLit)}
                {chambre.estSuite && " - Suite"}
              </p>
              <p className="mt-2 text-lg font-bold text-emerald-400">
                {chambre.prixParNuit.toLocaleString("fr-CA")} $ {t("hotels_par_nuit")}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {resultatsFiltres.length === 0 && (
        <p className="mt-10 text-center text-slate-400">{t("chambres_aucun_resultat")}</p>
      )}
    </main>
  );
}

function libelleTypeLit(typeLit: TypeLit) {
  if (typeLit === "queen") return "Lit Queen size";
  if (typeLit === "king") return "Lit King size";
  if (typeLit === "jumeaux") return "Lits jumeaux";
  return "";
}
