"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);
  const router = useRouter();

  async function handleConnexion(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setEnCours(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });

    if (error) {
      setErreur("Email ou mot de passe incorrect.");
      setEnCours(false);
      return;
    }

    localStorage.setItem("admin_connecte", "true");
    router.push("/admin/dashboard");
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

        <label className="mb-2 block text-sm text-slate-300">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg bg-slate-700 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="mb-2 block text-sm text-slate-300">Mot de passe</label>
        <input
          type="password"
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