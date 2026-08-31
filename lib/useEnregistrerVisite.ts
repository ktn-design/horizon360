"use client";

import { useEffect } from "react";

// Enregistre une visite de page pour les statistiques admin (donnees agregees uniquement,
// jamais d'IP affichee). Silencieux en cas d'echec : n'affecte jamais l'affichage de la page.
export function useEnregistrerVisite(page: string) {
  useEffect(() => {
    fetch("/api/enregistrer-visite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page }),
    }).catch(() => {});
  }, [page]);
}
