"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import ModalConnexion from "./ModalConnexion";

export default function Navbar() {
  const { langue, changerLangue, t } = useLanguage();
  const { user, deconnexion } = useAuth();
  const [afficherConnexion, setAfficherConnexion] = useState(false);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 px-6 py-4 text-white">
      <Link href="/" className="text-xl font-bold">
        {t("accueil_titre")}
      </Link>
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <Link href="/maisons" className="hover:text-blue-400">{t("accueil_maisons")}</Link>
        <Link href="/hotels" className="hover:text-blue-400">{t("accueil_hotels")}</Link>
        <Link href="/salles" className="hover:text-blue-400">{t("accueil_salles")}</Link>
        <Link href="/societes" className="hover:text-blue-400">{t("nav_partenaires")}</Link>
        <Link href="/recherche" className="hover:text-blue-400">{t("nav_recherche")}</Link>
        <Link href="/contact" className="hover:text-blue-400">{t("nav_contact")}</Link>

        {user ? (
          <button onClick={deconnexion} className="rounded-lg bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700">
            Deconnexion
          </button>
        ) : (
          <button onClick={() => setAfficherConnexion(true)} className="rounded-lg bg-blue-600 px-3 py-1 text-xs hover:bg-blue-700">
            Se connecter
          </button>
        )}

        <div className="flex overflow-hidden rounded-lg border border-slate-700">
          <button
            onClick={() => changerLangue("fr")}
            className={langue === "fr" ? "bg-blue-600 px-3 py-1 text-xs font-semibold" : "bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700"}
          >
            FR
          </button>
          <button
            onClick={() => changerLangue("en")}
            className={langue === "en" ? "bg-blue-600 px-3 py-1 text-xs font-semibold" : "bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700"}
          >
            EN
          </button>
        </div>
      </div>

      {afficherConnexion && <ModalConnexion onFerme={() => setAfficherConnexion(false)} />}
    </nav>
  );
}