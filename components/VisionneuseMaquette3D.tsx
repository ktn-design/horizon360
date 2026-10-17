"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export interface RepereVisible {
  id: string;
  libelle: string;
  position: string;
  normal: string;
}

interface VisionneuseMaquette3DProps {
  url: string;
  titre: string;
  // Afficher directement la maquette (page immeuble, apercu admin), sans bouton d'ouverture.
  ouverteDirectement?: boolean;
  // Reperes poses sur la maquette (ex. appartements d'un immeuble).
  reperes?: RepereVisible[];
  repereActif?: string;
  onClicRepere?: (id: string) => void;
  // Admin : clic sur la maquette pour poser un repere (position et orientation de la surface).
  onClicMaquette?: (position: string, normal: string) => void;
  hauteur?: string;
}

// Element <model-viewer> (Google) : seules les proprietes et methodes utilisees ici.
type ElementModelViewer = HTMLElement & {
  autoRotate: boolean;
  cameraTarget: string;
  positionAndNormalFromPoint: (x: number, y: number) => { position: { toString(): string }; normal: { toString(): string } } | null;
};

// Balise <model-viewer> (composant web de Google) connue de TypeScript dans le JSX.
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        ref?: React.Ref<ElementModelViewer>;
        src?: string;
        alt?: string;
        [attribut: string]: unknown;
      };
    }
  }
}

const STYLES_REPERES = `
.repere3d {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 12px 5px 6px; border-radius: 999px;
  background: rgba(15, 23, 42, .78); border: 1px solid rgba(255, 255, 255, .55);
  color: #fff; font: 600 13px system-ui, sans-serif; white-space: nowrap; cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, .35); transform: translateY(-50%);
  transition: background .2s, transform .2s, opacity .2s;
}
.repere3d::before {
  content: ""; width: 12px; height: 12px; border-radius: 999px;
  background: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, .35);
}
.repere3d:hover, .repere3d.actif { background: #2563eb; transform: translateY(-50%) scale(1.12); }
.repere3d.actif::before { background: #fff; }
.repere3d:not([data-visible]) { opacity: .35; }
`;

// Maquette 3D (.glb) que le client fait tourner au doigt, zoome, et peut poser chez lui en
// realite augmentee sur telephone. L'afficheur (Google model-viewer, ~1 Mo) n'est telecharge
// qu'a l'ouverture : il ne ralentit jamais le reste du site.
export default function VisionneuseMaquette3D({
  url,
  titre,
  ouverteDirectement,
  reperes = [],
  repereActif,
  onClicRepere,
  onClicMaquette,
  hauteur = "min(70vh, 560px)",
}: VisionneuseMaquette3DProps) {
  const { t } = useLanguage();
  const [etat, setEtat] = useState<"fermee" | "chargement" | "prete" | "erreur">("fermee");
  const [progression, setProgression] = useState(0);
  const conteneur = useRef<HTMLDivElement>(null);
  const viewer = useRef<ElementModelViewer | null>(null);
  const onClicMaquetteRef = useRef(onClicMaquette);
  const debutAppui = useRef({ x: 0, y: 0 });

  useEffect(() => {
    onClicMaquetteRef.current = onClicMaquette;
  });

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

  // Appartement choisi (dans la liste) : la camera se tourne vers son repere.
  useEffect(() => {
    const el = viewer.current;
    const repere = reperes.find((r) => r.id === repereActif);
    if (!el || !repere) return;
    el.autoRotate = false;
    el.cameraTarget = repere.position;
  }, [repereActif, reperes, etat]);

  // Branche les ecouteurs une seule fois sur l element <model-viewer>.
  const brancherViewer = useCallback((el: ElementModelViewer | null) => {
    viewer.current = el;
    if (!el || el.dataset.ecoute) return;
    el.dataset.ecoute = "1";
    el.addEventListener("progress", (e) => setProgression(Math.round(((e as unknown as CustomEvent).detail?.totalProgress || 0) * 100)));
    el.addEventListener("error", () => setEtat("erreur"));
    // Clic (et non glissement pour tourner) sur la maquette : position de la surface touchee.
    el.addEventListener("pointerdown", (e) => (debutAppui.current = { x: e.clientX, y: e.clientY }));
    el.addEventListener("click", (e) => {
      const rappel = onClicMaquetteRef.current;
      if (!rappel) return;
      if (Math.hypot(e.clientX - debutAppui.current.x, e.clientY - debutAppui.current.y) > 6) return;
      const point = el.positionAndNormalFromPoint(e.clientX, e.clientY);
      if (point) rappel(point.position.toString(), point.normal.toString());
    });
  }, []);

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
    <div ref={conteneur} className="relative mt-3 overflow-hidden rounded-xl bg-slate-800" style={{ height: hauteur }}>
      <style>{STYLES_REPERES}</style>
      {etat === "erreur" && (
        <p className="flex h-full items-center justify-center p-6 text-center text-sm text-red-300">{t("maquette_erreur")}</p>
      )}

      {etat === "prete" && (
        <model-viewer
          ref={brancherViewer}
          src={url}
          alt={titre}
          camera-controls=""
          auto-rotate={onClicMaquette || repereActif ? undefined : ""}
          auto-rotate-delay="1500"
          interpolation-decay="120"
          touch-action="pan-y"
          shadow-intensity="1"
          exposure="1"
          ar=""
          ar-modes="webxr scene-viewer quick-look"
          loading="eager"
          style={{ width: "100%", height: "100%", backgroundColor: "#1e293b", cursor: onClicMaquette ? "crosshair" : undefined }}
        >
          {reperes.map((r) => (
            <button
              key={r.id}
              type="button"
              slot={"hotspot-" + r.id}
              data-position={r.position}
              data-normal={r.normal}
              data-visibility-attribute="visible"
              className={"repere3d" + (r.id === repereActif ? " actif" : "")}
              onClick={(e) => {
                e.stopPropagation();
                onClicRepere?.(r.id);
              }}
            >
              {r.libelle}
            </button>
          ))}
          <button slot="ar-button" className="absolute bottom-4 left-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            {t("maquette_ar")}
          </button>
        </model-viewer>
      )}

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
