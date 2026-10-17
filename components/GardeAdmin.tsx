"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ProfilAdmin, peutOuvrirPage } from "@/lib/permissions";
import { chargerMonProfilAdmin, deconnecterAdmin, synchroniserCookieAdmin } from "@/lib/sessionAdmin";
import { marquerAppareilInterne } from "@/lib/useEnregistrerVisite";

const ProfilAdminContext = createContext<ProfilAdmin | null>(null);

// Profil de l'admin connecte, disponible dans toutes les pages /admin (sauf la connexion).
export function useProfilAdmin(): ProfilAdmin {
  const profil = useContext(ProfilAdminContext);
  if (!profil) throw new Error("useProfilAdmin doit etre utilise dans une page /admin protegee.");
  return profil;
}

// Deuxieme barriere, dans le navigateur (la premiere est proxy.ts cote serveur) :
// - rien n'est affiche tant que la session et le compte admin ne sont pas verifies ;
// - a la deconnexion (ici ou dans un autre onglet) : retour immediat a la connexion ;
// - compte gele ou section retiree pendant la navigation : l'acces est coupe ;
// - page restauree par le bouton Retour depuis le cache du navigateur : rechargement,
//   pour repasser par la verification serveur.
export default function GardeAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const estPageConnexion = pathname === "/admin" || pathname === "/admin/";
  const [profil, setProfil] = useState<ProfilAdmin | null>(null);

  useEffect(() => {
    if (estPageConnexion) return;
    let annule = false;

    async function verifier() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        await deconnecterAdmin("session");
        return;
      }
      synchroniserCookieAdmin(data.session);
      const p = await chargerMonProfilAdmin();
      if (annule) return;
      if (!p) {
        await deconnecterAdmin("session");
        return;
      }
      if (!p.actif) {
        await deconnecterAdmin("gele");
        return;
      }
      if (!peutOuvrirPage(p, pathname)) {
        window.location.replace("/admin/dashboard?refus=1");
        return;
      }
      // Appareil d'un administrateur : ses visites du site ne gonflent plus les statistiques.
      marquerAppareilInterne();
      setProfil(p);
    }

    verifier();
    return () => {
      annule = true;
    };
  }, [pathname, estPageConnexion]);

  useEffect(() => {
    if (estPageConnexion) return;

    const { data } = supabase.auth.onAuthStateChange((evenement, session) => {
      if (evenement === "SIGNED_OUT" || !session) {
        synchroniserCookieAdmin(null);
        window.location.replace("/admin");
        return;
      }
      synchroniserCookieAdmin(session);
    });

    function surRetourPage(e: PageTransitionEvent) {
      if (e.persisted) window.location.reload();
    }
    window.addEventListener("pageshow", surRetourPage);

    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener("pageshow", surRetourPage);
    };
  }, [estPageConnexion]);

  if (estPageConnexion) return <>{children}</>;

  if (!profil) {
    return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Verification de la session...</main>;
  }

  return (
    <ProfilAdminContext.Provider value={profil}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/admin/dashboard" className="font-semibold text-white hover:text-blue-400">
            Tableau de bord
          </Link>
          <span className="text-slate-500">
            {profil.email} — {profil.role === "principal" ? "Administrateur principal" : "Administrateur secondaire"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/mon-compte" className="rounded-lg bg-slate-800 px-3 py-2 hover:bg-slate-700">
            Mon mot de passe
          </Link>
          <button onClick={() => deconnecterAdmin()} className="rounded-lg bg-red-600/90 px-3 py-2 font-semibold text-white hover:bg-red-600">
            Se deconnecter
          </button>
        </div>
      </div>
      {children}
    </ProfilAdminContext.Provider>
  );
}
