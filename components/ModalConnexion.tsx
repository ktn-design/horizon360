"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

interface ModalConnexionProps {
  onFerme: () => void;
}

export default function ModalConnexion({ onFerme }: ModalConnexionProps) {
  const { connexionGoogle, connexionEmail, inscriptionEmail } = useAuth();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setEnCours(true);

    const resultat = mode === "connexion"
      ? await connexionEmail(email, motDePasse)
      : await inscriptionEmail(email, motDePasse);

    if (resultat.error) {
      setErreur(resultat.error);
      setEnCours(false);
      return;
    }

    if (mode === "inscription") {
      setErreur("Compte cree. Verifie ton email si une confirmation est demandee, sinon tu es deja connecte.");
    }

    setEnCours(false);
    onFerme();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-xl bg-slate-800 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {mode === "connexion" ? "Se connecter" : "Creer un compte"}
          </h2>
          <button onClick={onFerme} className="text-slate-400 hover:text-white">X</button>
        </div>

        <button
          onClick={connexionGoogle}
          className="mb-4 w-full rounded-lg bg-white py-3 font-semibold text-slate-900 hover:bg-slate-100"
        >
          Continuer avec Google
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-700"></div>
          <span className="text-xs text-slate-500">ou</span>
          <div className="h-px flex-1 bg-slate-700"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
          <input
            required
            type="password"
            placeholder="Mot de passe"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="input"
          />

          {erreur && <p className="text-sm text-red-400">{erreur}</p>}

          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {enCours ? "..." : mode === "connexion" ? "Se connecter" : "Creer un compte"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "connexion" ? "inscription" : "connexion")}
          className="mt-4 w-full text-center text-sm text-slate-400 hover:text-white"
        >
          {mode === "connexion" ? "Pas encore de compte ? Creer un compte" : "Deja un compte ? Se connecter"}
        </button>
      </div>
    </div>
  );
}