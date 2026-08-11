"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getParametres } from "@/lib/store";
import { ParametresSite } from "@/types";

export default function Footer() {
  const [parametres, setParametres] = useState<ParametresSite | null>(null);

  useEffect(() => {
    async function charger() {
      const p = await getParametres();
      setParametres(p);
    }
    charger();
  }, []);

  if (!parametres) return null;

  return (
    <footer className="mt-16 bg-slate-950 px-6 py-10 text-slate-300">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-3">
        <div>
          <h3 className="mb-3 text-lg font-bold text-white">{parametres.nomSite}</h3>
          <p className="text-sm">{parametres.texteAPropos}</p>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-bold text-white">Contact</h3>
          <p className="text-sm">{parametres.adresse}</p>
          <p className="text-sm">{parametres.email}</p>
          <p className="text-sm">{parametres.telephone}</p>
          <a href={"https://wa.me/" + parametres.whatsapp} target="_blank" className="mt-2 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-700">WhatsApp</a>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-bold text-white">Liens</h3>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/maisons" className="hover:text-blue-400">Maisons</Link>
            <Link href="/hotels" className="hover:text-blue-400">Hotels</Link>
            <Link href="/salles" className="hover:text-blue-400">Salles</Link>
            <Link href="/recherche" className="hover:text-blue-400">Recherche</Link>
            <Link href="/contact" className="hover:text-blue-400">Nous contacter</Link>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">© {new Date().getFullYear()} {parametres.nomSite}. Tous droits reserves.</p>
    </footer>
  );
}