"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useProfilAdmin } from "@/components/GardeAdmin";

export default function MonCompteAdminPage() {
  const profil = useProfilAdmin();
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setSucces("");

    if (nouveau.length < 8) return setErreur("Le nouveau mot de passe doit contenir au moins 8 caracteres.");
    if (nouveau !== confirmation) return setErreur("La confirmation ne correspond pas au nouveau mot de passe.");
    if (nouveau === actuel) return setErreur("Le nouveau mot de passe doit etre different de l'actuel.");

    setEnCours(true);
    // On redemande le mot de passe actuel : une session laissee ouverte ne suffit pas.
    const { error: erreurVerif } = await supabase.auth.signInWithPassword({ email: profil.email, password: actuel });
    if (erreurVerif) {
      setErreur("Mot de passe actuel incorrect.");
      setEnCours(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: nouveau });
    setEnCours(false);
    if (error) {
      setErreur("Changement impossible : " + error.message);
      return;
    }
    setActuel("");
    setNouveau("");
    setConfirmation("");
    setSucces("Mot de passe modifie.");
  }

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/admin/dashboard" className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour au tableau de bord
      </Link>

      <h1 className="mb-2 text-3xl font-bold">Mon mot de passe</h1>
      <p className="mb-8 text-slate-400">{profil.email}</p>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-xl bg-slate-800 p-6">
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Mot de passe actuel"
          value={actuel}
          onChange={(e) => setActuel(e.target.value)}
          className="input"
        />
        <input
          type="password"
          required
          autoComplete="new-password"
          placeholder="Nouveau mot de passe (8 caracteres minimum)"
          value={nouveau}
          onChange={(e) => setNouveau(e.target.value)}
          className="input"
        />
        <input
          type="password"
          required
          autoComplete="new-password"
          placeholder="Confirmer le nouveau mot de passe"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className="input"
        />

        {erreur && <p role="alert" className="rounded-lg border border-red-500/60 bg-red-500/10 p-3 text-sm text-red-300">{erreur}</p>}
        {succes && <p className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 p-3 text-sm text-emerald-300">{succes}</p>}

        <button type="submit" disabled={enCours} className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50">
          {enCours ? "Enregistrement..." : "Changer le mot de passe"}
        </button>
      </form>
    </main>
  );
}
