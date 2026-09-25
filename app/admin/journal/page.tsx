"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface LigneJournal {
  id: number;
  created_at: string;
  auteur_email: string | null;
  action: string;
  cible_type: string;
  cible_nom: string | null;
}

const COULEURS_ACTION: Record<string, string> = {
  creation: "bg-emerald-600",
  modification: "bg-blue-600",
  suppression: "bg-red-600",
  gel: "bg-yellow-600",
  degel: "bg-emerald-600",
  permissions: "bg-purple-600",
};

// Journal des actions des administrateurs (page reservee au principal).
export default function JournalAdminPage() {
  const [lignes, setLignes] = useState<LigneJournal[]>([]);
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState("");
  const [filtreAuteur, setFiltreAuteur] = useState("");

  useEffect(() => {
    async function charger() {
      const { data, error } = await supabase
        .from("journal_admin")
        .select("id, created_at, auteur_email, action, cible_type, cible_nom")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) setErreur("Chargement impossible : " + error.message);
      setLignes(data || []);
      setCharge(true);
    }
    charger();
  }, []);

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Chargement...</main>;

  const auteurs = Array.from(new Set(lignes.map((l) => l.auteur_email || "systeme"))).sort();
  const visibles = filtreAuteur ? lignes.filter((l) => (l.auteur_email || "systeme") === filtreAuteur) : lignes;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/admin/dashboard" className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour au tableau de bord
      </Link>

      <h1 className="mb-2 text-3xl font-bold">Journal des actions</h1>
      <p className="mb-6 text-slate-400">Les 500 dernieres modifications du catalogue et des comptes administrateurs.</p>

      {erreur && <p role="alert" className="mb-6 rounded-lg border border-red-500/60 bg-red-500/10 p-4 text-sm text-red-300">{erreur}</p>}

      <select value={filtreAuteur} onChange={(e) => setFiltreAuteur(e.target.value)} className="input mb-6 max-w-xs">
        <option value="">Tous les administrateurs</option>
        {auteurs.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>

      <div className="overflow-hidden rounded-xl bg-slate-800">
        {visibles.length === 0 && <p className="p-4 text-slate-400">Aucune action enregistree.</p>}
        {visibles.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center gap-3 border-b border-slate-700 p-4 text-sm last:border-none">
            <span className="w-40 text-slate-400">{new Date(l.created_at).toLocaleString("fr-CA")}</span>
            <span className={(COULEURS_ACTION[l.action] || "bg-slate-600") + " rounded px-2 py-0.5 text-xs"}>{l.action}</span>
            <span className="text-slate-300">{l.cible_type}</span>
            <span className="font-semibold">{l.cible_nom || "-"}</span>
            <span className="ml-auto text-slate-400">{l.auteur_email || "systeme"}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
