"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Protege TOUTES les pages sous /admin (sauf /admin lui-meme, qui est la page de connexion) :
// - redirige immediatement si le flag admin_connecte est absent, au premier chargement
//   et a chaque changement de page admin ;
// - revalide aussi quand le navigateur restaure une page depuis son cache (bouton Precedent
//   apres deconnexion), cas ou React ne re-executerait pas forcement les effets normalement.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const estPageConnexion = pathname === "/admin";

  useEffect(() => {
    function verifier() {
      if (estPageConnexion) return;
      const connecte = localStorage.getItem("admin_connecte");
      if (connecte !== "true") {
        router.push("/admin");
      }
    }

    verifier();

    function surRetourPage(e: PageTransitionEvent) {
      if (e.persisted) verifier();
    }
    window.addEventListener("pageshow", surRetourPage);
    return () => window.removeEventListener("pageshow", surRetourPage);
  }, [pathname, estPageConnexion, router]);

  return <>{children}</>;
}
