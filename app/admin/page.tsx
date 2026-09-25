"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { chargerMonProfilAdmin, synchroniserCookieAdmin } from "@/lib/sessionAdmin";

const MESSAGES_ARRIVEE: Record<string, string> = {
  session: "Veuillez vous connecter pour acceder a l'administration.",
  gele: "Ce compte administrateur est suspendu. Contactez l'administrateur principal.",
  reseau: "Verification de la session impossible (connexion interrompue). Reconnectez-vous.",
};

// Evite qu'un lien "suite=" externe redirige ailleurs que dans /admin.
function destinationApresConnexion(): string {
  const suite = new URLSearchParams(window.location.search).get("suite") || "";
  return suite.startsWith("/admin/") && !suite.startsWith("//") ? suite : "/admin/dashboard";
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [info, setInfo] = useState("");
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    const motif = new URLSearchParams(window.location.search).get("erreur");
    if (motif && MESSAGES_ARRIVEE[motif]) setInfo(MESSAGES_ARRIVEE[motif]);

    // Deja connecte avec un compte admin actif : on entre directement.
    async function sessionExistante() {
      if (motif === "gele") return;
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      const profil = await chargerMonProfilAdmin();
      if (profil && profil.actif) {
        synchroniserCookieAdmin(data.session);
        window.location.replace(destinationApresConnexion());
      }
    }
    sessionExistante();
  }, []);

  async function handleConnexion(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setInfo("");
    setEnCours(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });

    if (error || !data.session) {
      // Supabase refuse la connexion d'un compte gele ("banned").
      setErreur(/banned/i.test(error?.message || "") ? MESSAGES_ARRIVEE.gele : "Email ou mot de passe incorrect.");
      setEnCours(false);
      return;
    }

    const profil = await chargerMonProfilAdmin();
    if (!profil) {
      await supabase.auth.signOut();
      setErreur("Ce compte n'a pas acces a l'administration.");
      setEnCours(false);
      return;
    }
    if (!profil.actif) {
      await supabase.auth.signOut();
      setErreur(MESSAGES_ARRIVEE.gele);
      setEnCours(false);
      return;
    }

    synchroniserCookieAdmin(data.session);
    // Rechargement complet : la page suivante passe par la verification serveur.
    window.location.replace(destinationApresConnexion());
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <form
        onSubmit={handleConnexion}
        className="w-full max-w-sm rounded-xl bg-slate-800 p-8"
      >
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          Administration Horizon 360
        </h1>

        {info && <p className="mb-4 rounded-lg bg-slate-700 p-3 text-sm text-slate-200">{info}</p>}

        <label className="mb-2 block text-sm text-slate-300">Email</label>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg bg-slate-700 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="mb-2 block text-sm text-slate-300">Mot de passe</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="mb-4 w-full rounded-lg bg-slate-700 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
        />

        {erreur && <p className="mb-4 text-sm text-red-400">{erreur}</p>}

        <button
          type="submit"
          disabled={enCours}
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {enCours ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
