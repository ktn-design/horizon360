"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export default function ConfirmationReservationPage() {
  const { t } = useLanguage();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-center text-white">
      <div className="max-w-md rounded-xl bg-slate-800 p-8">
        <p className="mb-4 text-4xl">OK</p>
        <h1 className="mb-3 text-2xl font-bold text-emerald-400">{t("resa_paiement_reussi_titre")}</h1>
        <p className="mb-6 text-slate-300">{t("resa_paiement_reussi_texte")}</p>
        <Link href="/" className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700">
          {t("resa_retour_accueil")}
        </Link>
      </div>
    </main>
  );
}
