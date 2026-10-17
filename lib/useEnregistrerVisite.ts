"use client";

import { useEffect } from "react";

// Identifiant anonyme de l'appareil (aleatoire, sans aucune donnee personnelle) : permet de
// compter des visiteurs uniques, et pas seulement des pages vues.
const CLE_VISITEUR = "h360_visiteur";
// Appareil d'un administrateur : ses visites ne sont pas comptees (voir marquerAppareilInterne).
const CLE_INTERNE = "h360_interne";
// Une meme page rechargee dans ce delai ne compte qu'une fois.
const DELAI_DOUBLON_MS = 30000;

export function marquerAppareilInterne() {
  try {
    localStorage.setItem(CLE_INTERNE, "1");
  } catch {
    // stockage indisponible : sans consequence
  }
}

function identifiantVisiteur(): string {
  let id = localStorage.getItem(CLE_VISITEUR);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLE_VISITEUR, id);
  }
  return id;
}

// Enregistre une visite de page pour les statistiques admin (donnees agregees uniquement,
// jamais d'IP affichee). Silencieux en cas d'echec : n'affecte jamais l'affichage de la page.
export function useEnregistrerVisite(page: string) {
  useEffect(() => {
    let visiteur: string | undefined;
    try {
      if (localStorage.getItem(CLE_INTERNE) === "1") return;
      visiteur = identifiantVisiteur();
      const cle = "h360_vu_" + location.pathname;
      if (Date.now() - Number(sessionStorage.getItem(cle) || 0) < DELAI_DOUBLON_MS) return;
      sessionStorage.setItem(cle, String(Date.now()));
    } catch {
      // stockage indisponible (navigation privee...) : visite enregistree sans identifiant
    }
    fetch("/api/enregistrer-visite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, visiteur }),
    }).catch(() => {});
  }, [page]);
}
