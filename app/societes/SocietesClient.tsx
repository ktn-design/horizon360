"use client";

import Link from "next/link";
import { Societe } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";
import LogoSociete from "@/components/LogoSociete";

// Les donnees arrivent deja chargees du serveur (app/societes/page.tsx).
export default function SocietesClient({ societes, nbProjets }: { societes: Societe[]; nbProjets: Record<string, number> }) {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{t("societes_titre")}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">{t("societes_sous_titre")}</p>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {societes.map((societe) => {
            const n = nbProjets[societe.id] || 0;
            return (
              <Link
                key={societe.id}
                href={"/societes/" + societe.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-800 transition hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-900/30"
              >
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                  <LogoSociete nom={societe.nom} logoUrl={societe.logoUrl} taille="moyen" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-xl font-semibold">{societe.nom}</h2>
                  {societe.description && <p className="mt-2 line-clamp-3 text-sm text-slate-400">{societe.description}</p>}
                  <div className="mt-auto flex items-center justify-between pt-5 text-sm">
                    <span className="rounded-full bg-slate-700 px-3 py-1 text-slate-200">
                      {n} {n > 1 ? t("societes_projets") : t("societes_projet")}
                    </span>
                    <span className="font-semibold text-blue-400 transition group-hover:translate-x-1">{t("societes_voir_projets")} →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {societes.length === 0 && <p className="text-center text-slate-400">{t("societes_aucun")}</p>}
      </div>
    </main>
  );
}
