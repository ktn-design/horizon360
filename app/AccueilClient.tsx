"use client";

import Link from "next/link";
import { ParametresSite } from "@/types";
import Diaporama from "@/components/Diaporama";
import { useLanguage } from "@/lib/LanguageContext";
import { useEnregistrerVisite } from "@/lib/useEnregistrerVisite";
import { HOTELS_VISIBLES } from "@/lib/fonctionnalites";
import { imageOptimisee } from "@/lib/imageOptimisee";

// Les parametres arrivent deja charges du serveur (app/page.tsx) : affichage immediat.
export default function AccueilClient({ parametres }: { parametres: ParametresSite }) {
  const { t } = useLanguage();
  useEnregistrerVisite("accueil");

  const aDiaporama = parametres && parametres.imagesDiaporama.length > 0;

  const styleFondSimple = !aDiaporama && parametres?.imageAccueilUrl
    ? {
        backgroundImage: `linear-gradient(rgba(15,23,42,0.7), rgba(15,23,42,0.9)), url(${imageOptimisee(parametres.imageAccueilUrl, 1200)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};

  const styleCarteMaisons = parametres?.imageMaisonsUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${imageOptimisee(parametres.imageMaisonsUrl, 640)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { backgroundColor: parametres?.couleurBoutonMaisons || "#1e293b" };

  const styleCarteHotels = parametres?.imageHotelsUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${imageOptimisee(parametres.imageHotelsUrl, 640)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { backgroundColor: parametres?.couleurBoutonHotels || "#1e293b" };

  const styleCarteSalles = parametres?.imageSallesUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${imageOptimisee(parametres.imageSallesUrl, 640)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { backgroundColor: parametres?.couleurBoutonSalles || "#1e293b" };

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-16"
      style={styleFondSimple}
    >
      {aDiaporama && <Diaporama images={parametres!.imagesDiaporama} />}

      <div style={{ position: "relative", zIndex: 1 }} className="flex flex-col items-center">
        <h1 className="mb-4 text-center text-5xl font-bold text-white">
          {parametres?.nomSite || "Horizon 360"}
        </h1>
        <p className="mb-12 text-center text-lg text-slate-300">
          {parametres?.description || t("accueil_titre")}
        </p>

        <div className="flex flex-col gap-6 sm:flex-row">
          <Link
            href="/maisons"
            style={styleCarteMaisons}
            className="flex h-48 w-64 flex-col items-center justify-center rounded-2xl p-8 shadow-xl transition hover:scale-105"
          >
            <span className="text-2xl font-bold text-white drop-shadow-lg">{t("accueil_maisons")}</span>
          </Link>

          {HOTELS_VISIBLES && (
            <Link
              href="/hotels"
              style={styleCarteHotels}
              className="flex h-48 w-64 flex-col items-center justify-center rounded-2xl p-8 shadow-xl transition hover:scale-105"
            >
              <span className="text-2xl font-bold text-white drop-shadow-lg">{t("accueil_hotels")}</span>
            </Link>
          )}

          <Link
            href="/salles"
            style={styleCarteSalles}
            className="flex h-48 w-64 flex-col items-center justify-center rounded-2xl p-8 shadow-xl transition hover:scale-105"
          >
            <span className="text-2xl font-bold text-white drop-shadow-lg">{t("accueil_salles")}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}