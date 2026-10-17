"use client";

import Link from "next/link";
import { Immeuble, Maison, Societe } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";
import { imageOptimisee } from "@/lib/imageOptimisee";
import LogoSociete from "@/components/LogoSociete";
import VisionneuseMaquette3D from "@/components/VisionneuseMaquette3D";

interface ImmeubleClientProps {
  immeuble: Immeuble;
  societe: Societe | null;
  appartements: Maison[];
}

// Les donnees arrivent deja chargees du serveur (app/immeubles/[id]/page.tsx).
// La maquette 3D est montree sans reperes : chaque visiteur ne voit l'emplacement que de
// l'appartement qu'il visite (bouton « Situer l'appartement » dans la visite 360).
export default function ImmeubleClient({ immeuble, societe, appartements }: ImmeubleClientProps) {
  const { t } = useLanguage();
  const [photoAccueil, ...autresPhotos] = immeuble.photos;
  const adresse = (immeuble.localisation.quartier ? immeuble.localisation.quartier + ", " : "") + immeuble.localisation.ville + ", " + immeuble.localisation.pays;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href={societe ? "/societes/" + societe.id : "/societes"} className="mb-6 inline-block text-slate-400 hover:text-white">
          ← {societe ? t("retour_societe") : t("societes_retour")}
        </Link>

        <header className="relative mb-10 overflow-hidden rounded-3xl bg-slate-800">
          {photoAccueil ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageOptimisee(photoAccueil, 1920)} alt={immeuble.nom} className="h-[42vh] min-h-72 w-full object-cover" />
          ) : (
            <div className="h-56 w-full bg-gradient-to-br from-slate-700 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
            {societe && (
              <Link href={"/societes/" + societe.id} className="mb-3 inline-flex items-center gap-3 rounded-full bg-slate-900/70 py-1 pl-1 pr-4 backdrop-blur hover:bg-slate-900">
                <LogoSociete nom={societe.nom} logoUrl={societe.logoUrl} taille="petit" />
                <span className="text-sm">
                  {t("immeuble_un_projet_de")} <strong>{societe.nom}</strong>
                </span>
              </Link>
            )}
            <h1 className="text-3xl font-bold sm:text-5xl">{immeuble.nom}</h1>
            <p className="mt-2 text-slate-200">{adresse}</p>
          </div>
        </header>

        {immeuble.description && <p className="mb-10 max-w-4xl text-lg leading-relaxed text-slate-300">{immeuble.description}</p>}

        {immeuble.maquette3dUrl && (
          <section className="mb-12">
            <h2 className="mb-2 text-2xl font-semibold">{t("immeuble_maquette")}</h2>
            <VisionneuseMaquette3D url={immeuble.maquette3dUrl} titre={immeuble.nom} ouverteDirectement hauteur="min(65vh, 600px)" />
          </section>
        )}

        {autresPhotos.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">{t("immeuble_photos")}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {autresPhotos.map((photo) => (
                <a key={photo} href={photo} target="_blank" rel="noopener" className="overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageOptimisee(photo, 640)} alt="" loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover transition hover:scale-105" />
                </a>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-5 text-2xl font-semibold">
            {t("immeuble_appartements")} <span className="text-slate-400">({appartements.length})</span>
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {appartements.map((appart) => (
              <Link
                key={appart.id}
                href={"/maisons/" + appart.id}
                className="group overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-800 transition hover:-translate-y-1 hover:border-blue-500/60"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-700">
                  {appart.photos.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageOptimisee(appart.photos[0], 640)} alt={appart.titre} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">{t("aucune_photo")}</div>
                  )}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    {appart.visiteVirtuelle && <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold">{t("badge_visite_360")}</span>}
                    {appart.maquette3dUrl && <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold">{t("maquette_badge")}</span>}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold">{appart.titre}</h3>
                  <p className="mt-1 text-lg font-bold text-emerald-400">
                    {appart.prix.toLocaleString("fr-CA")} $
                    {appart.transaction === "location" && " " + t("fiche_mois")}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {appart.chambres} {t("maisons_ch")} - {appart.sallesDeBain} {t("maisons_sdb")} - {appart.superficie} m2
                  </p>
                </div>
              </Link>
            ))}
          </div>
          {appartements.length === 0 && <p className="text-slate-400">{t("immeuble_aucun_appartement")}</p>}
        </section>
      </div>
    </main>
  );
}
