"use client";

import { createElement, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

interface VisionneuseMaquette3DProps {
  url: string;
  titre: string;
  // Admin : afficher directement la maquette (apercu), sans bouton d'ouverture.
  ouverteDirectement?: boolean;
}

// Maquette 3D (.glb) que le client fait tourner au doigt, zoome, et peut poser chez lui en
// realite augmentee sur telephone. L'afficheur (Google model-viewer, ~1 Mo) n'est telecharge
// qu'au clic : il ne ralentit jamais la page.
export default function VisionneuseMaquette3D({ url, titre, ouverteDirectement }: VisionneuseMaquette3DProps) {
  const { t } = useLanguage();
  const [etat, setEtat] = useState<"fermee" | "chargement" | "prete" | "erreur">("fermee");
  const [progression, setProgression] = useState(0);
  const conteneur = useRef<HTMLDivElement>(null);

  async function ouvrir() {
    setEtat("chargement");
    try {
      await import("@google/model-viewer");
      setEtat("prete");
    } catch {
      setEtat("erreur");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ouverteDirectement) ouvrir();
  }, [ouverteDirectement]);

  function pleinEcran() {
    const el = conteneur.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  }

  if (etat === "fermee") {
    return (
      <button
        type="button"
        onClick={ouvrir}
        className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-blue-500/60 bg-slate-800 py-4 text-lg font-semibold text-white transition hover:bg-slate-700"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2 3 7v10l9 5 9-5V7l-9-5z" />
          <path d="M3 7l9 5 9-5M12 12v10" />
        </svg>
        {t("maquette_voir")}
      </button>
    );
  }

  return (
    <div ref={conteneur} className="relative mt-3 overflow-hidden rounded-xl bg-slate-800" style={{ height: "min(70vh, 560px)" }}>
      {etat === "erreur" && (
        <p className="flex h-full items-center justify-center p-6 text-center text-sm text-red-300">{t("maquette_erreur")}</p>
      )}

      {etat === "prete" &&
        createElement("model-viewer", {
          src: url,
          alt: titre,
          "camera-controls": true,
          "auto-rotate": true,
          "auto-rotate-delay": 1500,
          "touch-action": "pan-y",
          "shadow-intensity": "1",
          exposure: "1",
          ar: true,
          "ar-modes": "webxr scene-viewer quick-look",
          loading: "eager",
          style: { width: "100%", height: "100%", backgroundColor: "#1e293b" },
          ref: (el: HTMLElement | null) => {
            if (!el || el.dataset.ecoute) return;
            el.dataset.ecoute = "1";
            el.addEventListener("progress", (e) => setProgression(Math.round(((e as unknown as CustomEvent).detail?.totalProgress || 0) * 100)));
            el.addEventListener("error", () => setEtat("erreur"));
          },
        },
        createElement(
          "button",
          {
            slot: "ar-button",
            className: "absolute bottom-4 left-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg",
          },
          t("maquette_ar")
        ))}

      {(etat === "chargement" || (etat === "prete" && progression < 100)) && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-slate-700">
          <div className="h-full bg-blue-500 transition-all" style={{ width: Math.max(5, progression) + "%" }} />
        </div>
      )}
      {etat === "chargement" && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-300">{t("maquette_chargement")}</p>
      )}

      {etat === "prete" && (
        <>
          <p className="pointer-events-none absolute left-4 top-3 rounded bg-black/40 px-2 py-1 text-xs text-slate-200">{t("maquette_aide")}</p>
          <button
            type="button"
            onClick={pleinEcran}
            aria-label={t("maquette_plein_ecran")}
            className="absolute bottom-4 right-4 rounded-lg bg-black/50 p-2 text-white hover:bg-black/70"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
