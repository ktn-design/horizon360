"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { traductions, Langue, CleTraduction } from "./translations";

interface LanguageContextType {
  langue: Langue;
  changerLangue: (nouvelleLangue: Langue) => void;
  t: (cle: CleTraduction) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [langue, setLangue] = useState<Langue>("fr");

  useEffect(() => {
    const langueSauvegardee = localStorage.getItem("horizon_langue") as Langue | null;
    if (langueSauvegardee === "fr" || langueSauvegardee === "en") {
      setLangue(langueSauvegardee);
    }
  }, []);

  function changerLangue(nouvelleLangue: Langue) {
    setLangue(nouvelleLangue);
    localStorage.setItem("horizon_langue", nouvelleLangue);
  }

  function t(cle: CleTraduction): string {
    return traductions[langue][cle] || cle;
  }

  return (
    <LanguageContext.Provider value={{ langue, changerLangue, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage doit etre utilise a l'interieur de LanguageProvider");
  }
  return context;
}