"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSalles } from "@/lib/store";
import { TypeEvenement, Salle } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";

const evenementsListe: { valeur: TypeEvenement; label: string }[] = [
  { valeur: "mariage", label: "Mariage" },
  { valeur: "anniversaire", label: "Anniversaire" },
  { valeur: "bal", label: "Bal" },
  { valeur: "deuil", label: "Deuil" },
  { valeur: "fete", label: "Fete" },
  { valeur: "conference", label: "Conference" },
  { valeur: "polyvalente", label: "Polyvalente" },
];

export default function SallesPage() {
  const { t } = useLanguage();
  const [salles, setSalles] = useState<Salle[]>([]);
  const [evenementFiltre, setEvenementFiltre] = useState<string>("tous");
  const [capaciteMin, setCapaciteMin] = useState<number>(0);
  const [prixMax, setPrixMax] = useState<number>(10000);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    async function charger() {
      const s = await getSalles();
      setSalles(s);
      setCharge(true);
    }
    charger();
  }, []);

  const sallesFiltrees = salles.filter((salle) => {
    const matchEvenement =
      evenementFiltre === "tous" ||
      salle.evenementsAcceptes.includes(evenementFiltre as TypeEvenement) ||
      salle.evenementsAcceptes.includes("polyvalente");
    const matchCapacite = salle.capacite >= capaciteMin;
    const matchPrix = salle.prix <= prixMax;
    return matchEvenement && matchCapacite && matchPrix;
  });

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">{t("chargement")}</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <h1 className="mb-8 text-3xl font-bold">{t("salles_titre")}</h1>

      <div className="mb-10 flex flex-wrap gap-4 rounded-xl bg-slate-800 p-6">
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
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sallesFiltrees.map((salle) => (
          <Link
            key={salle.id}
            href={"/salles/" + salle.id}
            className="rounded-xl bg-slate-800 p-5 transition hover:bg-slate-700"
          >
            {salle.photos.length > 0 && (
              <img src={salle.photos[0]} alt="" className="mb-3 h-40 w-full rounded-lg object-cover" />
            )}
            <h2 className="mb-2 text-xl font-semibold">{salle.titre}</h2>
            <p className="mb-1 text-slate-300">
              {salle.localisation.ville}, {salle.localisation.province}
            </p>
            <p className="mb-2 text-lg font-bold text-emerald-400">
              {salle.prix.toLocaleString("fr-CA")} $
            </p>
            <p className="mb-2 text-sm text-slate-400">
              {t("salles_capacite_min").replace(" min", "")} : {salle.capacite} {t("salles_personnes")} - {salle.superficie} m2
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