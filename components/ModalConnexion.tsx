"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

interface ModalConnexionProps {
  onFerme: () => void;
}

// Messages Supabase (en anglais) traduits pour le client.
function traduireErreur(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Email ou mot de passe incorrect.";
  if (/already registered|already exists/i.test(message)) return "Un compte existe déjà avec cet email. Connectez-vous.";
  if (/email not confirmed/i.test(message)) return "Confirmez d'abord votre adresse email grâce au lien reçu par email.";
  if (/password should be at least/i.test(message)) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (/invalid email|unable to validate email/i.test(message)) return "Adresse email invalide.";
  if (/rate limit|too many/i.test(message)) return "Trop de tentatives. Patientez quelques minutes puis réessayez.";
  if (/fetch|network/i.test(message)) return "Connexion internet interrompue. Vérifiez votre connexion puis réessayez.";
  return message;
}

export default function ModalConnexion({ onFerme }: ModalConnexionProps) {
  const { user, connexionGoogle, connexionEmail, inscriptionEmail } = useAuth();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [voirMotDePasse, setVoirMotDePasse] = useState(false);
  const [erreur, setErreur] = useState("");
  const [info, setInfo] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [enCoursGoogle, setEnCoursGoogle] = useState(false);

  // Connecte (email, ou Google au retour de Chrome dans l'application) : la fenetre se ferme.
  useEffect(() => {
    if (user) onFerme();
  }, [user, onFerme]);

  // Touche Echap pour fermer.
  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") onFerme();
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [onFerme]);

  function changerMode(nouveau: "connexion" | "inscription") {
    setMode(nouveau);
    setErreur("");
    setInfo("");
    setConfirmation("");
  }

  async function handleGoogle() {
    setErreur("");
    setEnCoursGoogle(true);
    await connexionGoogle();
    // Sur le site, la page part vers Google ; dans l'application, Chrome s'ouvre par-dessus.
    setTimeout(() => setEnCoursGoogle(false), 4000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setInfo("");

    if (mode === "inscription") {
      if (motDePasse.length < 8) return setErreur("Le mot de passe doit contenir au moins 8 caractères.");
      if (motDePasse !== confirmation) return setErreur("Les deux mots de passe ne correspondent pas.");
    }

    setEnCours(true);
    const resultat = mode === "connexion" ? await connexionEmail(email, motDePasse) : await inscriptionEmail(email, motDePasse);
    setEnCours(false);

    if (resultat.error) {
      setErreur(traduireErreur(resultat.error));
      return;
    }
    // Inscription avec confirmation par email : pas encore de session, on explique quoi faire.
    // (Si la session est ouverte tout de suite, la fenetre se ferme via l'effet ci-dessus.)
    if (mode === "inscription") {
      setInfo("Compte créé. Si un email de confirmation vous a été envoyé, cliquez sur le lien qu'il contient, puis connectez-vous.");
      setMotDePasse("");
      setConfirmation("");
    }
  }

  const occupe = enCours || enCoursGoogle;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm"
      onClick={onFerme}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-connexion"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8"
      >
        <button
          onClick={onFerme}
          aria-label="Fermer"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Horizon 360</p>
          <h2 id="titre-connexion" className="text-2xl font-bold text-white">
            {mode === "connexion" ? "Bon retour parmi nous" : "Créer votre compte"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {mode === "connexion" ? "Connectez-vous pour réserver et suivre vos réservations." : "Quelques secondes suffisent pour réserver en ligne."}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-800 p-1 text-sm font-semibold">
          {(["connexion", "inscription"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => changerMode(m)}
              className={(mode === m ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white") + " rounded-lg py-2 transition"}
            >
              {m === "connexion" ? "Se connecter" : "Créer un compte"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={occupe}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-3 font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-60"
        >
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          {enCoursGoogle ? "Ouverture de Google..." : "Continuer avec Google"}
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-700"></div>
          <span className="text-xs uppercase tracking-wider text-slate-500">ou avec votre email</span>
          <div className="h-px flex-1 bg-slate-700"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
          <div>
            <label htmlFor="connexion-email" className="mb-1.5 block text-sm font-medium text-slate-300">
              Adresse email
            </label>
            <input
              id="connexion-email"
              required
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="connexion-mdp" className="mb-1.5 block text-sm font-medium text-slate-300">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="connexion-mdp"
                required
                type={voirMotDePasse ? "text" : "password"}
                autoComplete={mode === "connexion" ? "current-password" : "new-password"}
                placeholder={mode === "inscription" ? "8 caractères minimum" : "Votre mot de passe"}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className="input"
                style={{ paddingRight: "3rem" }}
              />
              <button
                type="button"
                onClick={() => setVoirMotDePasse(!voirMotDePasse)}
                aria-label={voirMotDePasse ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {voirMotDePasse ? (
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {mode === "inscription" && (
            <div>
              <label htmlFor="connexion-confirmation" className="mb-1.5 block text-sm font-medium text-slate-300">
                Confirmer le mot de passe
              </label>
              <input
                id="connexion-confirmation"
                required
                type={voirMotDePasse ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Saisissez-le à nouveau"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="input"
              />
            </div>
          )}

          {erreur && (
            <p role="alert" className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
              {erreur}
            </p>
          )}
          {info && (
            <p className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">{info}</p>
          )}

          <button
            type="submit"
            disabled={occupe}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {enCours ? "Patientez..." : mode === "connexion" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {mode === "connexion" ? "Pas encore de compte ? " : "Vous avez déjà un compte ? "}
          <button
            type="button"
            onClick={() => changerMode(mode === "connexion" ? "inscription" : "connexion")}
            className="font-semibold text-blue-400 hover:text-blue-300"
          >
            {mode === "connexion" ? "Créer un compte" : "Se connecter"}
          </button>
        </p>
      </div>
    </div>
  );
}
