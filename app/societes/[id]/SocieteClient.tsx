"use client";

import Link from "next/link";
import { Societe, Immeuble } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";
import { imageOptimisee } from "@/lib/imageOptimisee";
import LogoSociete from "@/components/LogoSociete";

interface SocieteClientProps {
  societe: Societe;
  immeubles: Immeuble[];
  nbAppartements: Record<string, number>;
}

// Les donnees arrivent deja chargees du serveur (app/societes/[id]/page.tsx).
export default function SocieteClient({ societe, immeubles, nbAppartements }: SocieteClientProps) {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/societes" className="mb-6 inline-block text-slate-400 hover:text-white">
          ← {t("societes_retour")}
        </Link>

        <header className="mb-12 flex flex-col items-center gap-6 rounded-3xl border border-slate-700/70 bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-center sm:flex-row sm:p-10 sm:text-left">
          <LogoSociete nom={societe.nom} logoUrl={societe.logoUrl} taille="grand" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold sm:text-4xl">{societe.nom}</h1>
            {societe.description && <p className="mt-3 max-w-3xl leading-relaxed text-slate-300">{societe.description}</p>}
            <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
              {societe.whatsapp && (
                <a href={"https://wa.me/" + societe.whatsapp.replace(/\D/g, "")} target="_blank" rel="noopener" className="rounded-lg bg-green-600 px-5 py-2.5 font-semibold hover:bg-green-700">
                  {t("fiche_whatsapp")}
                </a>
              )}
              {societe.telephone && (
                <a href={"tel:" + societe.telephone} className="rounded-lg bg-slate-700 px-5 py-2.5 font-semibold hover:bg-slate-600">
                  {t("fiche_appeler")}
                </a>
              )}
            </div>
          </div>
        </header>

        <h2 className="mb-5 text-2xl font-semibold">
          {t("societes_projets_de")} {societe.nom} <span className="text-slate-400">({immeubles.length})</span>
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {immeubles.map((immeuble) => {
            const n = nbAppartements[immeuble.id] || 0;
            return (
              <Link
                key={immeuble.id}
                href={"/immeubles/" + immeuble.id}
                className="group overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-800 transition hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-900/30"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-700">
                  {immeuble.photos.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageOptimisee(immeuble.photos[0], 640)}
                      alt={immeuble.nom}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">{t("aucune_photo")}</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    {immeuble.maquette3dUrl && <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold">{t("maquette_badge")}</span>}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="text-xl font-semibold">{immeuble.nom}</h3>
                    <p className="text-sm text-slate-300">
                      {immeuble.localisation.quartier ? immeuble.localisation.quartier + ", " : ""}
                      {immeuble.localisation.ville}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 text-sm">
                  <span className="text-slate-300">
                    {n} {n > 1 ? t("immeuble_appartements_nb") : t("immeuble_appartement")}
                  </span>
                  <span className="font-semibold text-blue-400 transition group-hover:translate-x-1">→</span>
                </div>
              </Link>
            );
          })}
        </div>

        {immeubles.length === 0 && <p className="text-slate-400">{t("societes_aucun_immeuble")}</p>}
      </div>
    </main>
  );
}
