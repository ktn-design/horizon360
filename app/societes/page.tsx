"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSocietes } from "@/lib/store";
import { Societe } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";
import { imageOptimisee } from "@/lib/imageOptimisee";

export default function SocietesPage() {
  const { t } = useLanguage();
  const [societes, setSocietes] = useState<Societe[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    async function charger() {
      const s = await getSocietes();
      setSocietes(s);
      setCharge(true);
    }
    charger();
  }, []);

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">{t("chargement")}</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <h1 className="mb-8 text-3xl font-bold">{t("societes_titre")}</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {societes.map((societe) => (
          <Link
            key={societe.id}
            href={"/societes/" + societe.id}
            className="rounded-xl bg-slate-800 p-6 transition hover:bg-slate-700"
          >
            {societe.logoUrl && <img src={imageOptimisee(societe.logoUrl, 256)} alt="" loading="lazy" decoding="async" className="mb-4 h-16 w-16 rounded-lg object-cover" />}
            <h2 className="mb-2 text-xl font-semibold">{societe.nom}</h2>
            <p className="text-sm text-slate-400">{societe.description}</p>
          </Link>
        ))}
      </div>

      {societes.length === 0 && (
        <p className="text-slate-400">{t("societes_aucun")}</p>
      )}
    </main>
  );
}