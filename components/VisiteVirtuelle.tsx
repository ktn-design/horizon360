"use client";

import { useEffect, useRef, useState } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { Panorama360 } from "@/types";
import { sourceAffichage } from "@/lib/panoramaStereo";

export interface Hotspot {
  id: string;
  yaw: number;
  pitch: number;
  label: string;
  panoramaCible: string;
}

interface VisiteVirtuelleProps {
  panoramaUrl: string;
  hotspots: Hotspot[];
  // Liste des pieces de la visite : sert a afficher le vrai nom (et l'icone) de la piece
  // vers laquelle mene chaque repere, ainsi que la piece actuelle.
  panoramas?: Panorama360[];
  onChangerPanorama: (nouvellePanoramaUrl: string) => void;
}

// Icones au trait (style Lucide, licence ISC), dessinees en blanc sur les reperes.
const ICONES: Record<string, string> = {
  lit: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>',
  canape: '<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M4 18v2"/><path d="M20 18v2"/><path d="M12 4v9"/>',
  marmite: '<path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="m4 8 16-4"/><path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8"/>',
  bain: '<path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" x2="8" y1="5" y2="7"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="7" x2="7" y1="19" y2="21"/><line x1="17" x2="17" y1="19" y2="21"/>',
  couverts: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  bureau: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  vagues: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  arbre: '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>',
  soleil: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  porte: '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/>',
  voiture: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  etincelles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  fleche: '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
  gyroscope: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  casque: '<path d="M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-3.5l-2-2.5a.7.7 0 0 0-1 0l-2 2.5H5a3 3 0 0 1-3-3z"/><circle cx="8" cy="12" r="1.6"/><circle cx="16" cy="12" r="1.6"/>',
};

// L'ordre compte : "salle de bain" et "salle a manger" doivent passer avant "salle".
const REGLES_ICONES: [RegExp, string][] = [
  [/salle de bain|salle d'eau|sdb|bain|douche|toilette|\bwc\b|bathroom|shower/, "bain"],
  [/salle a manger|dining|repas/, "couverts"],
  [/chambre|suite|dortoir|bedroom|\bbed/, "lit"],
  [/cuisine|kitchen|kitchenette/, "marmite"],
  [/salon|sejour|living|lounge|detente/, "canape"],
  [/bureau|office|etude|travail/, "bureau"],
  [/piscine|pool|spa|jacuzzi/, "vagues"],
  [/jardin|garden|cour|parc/, "arbre"],
  [/balcon|terrasse|toit|rooftop|exterieur|veranda|patio/, "soleil"],
  [/garage|parking/, "voiture"],
  [/entree|hall|couloir|corridor|vestibule|escalier|porte|accueil|reception/, "porte"],
  [/salle|scene|evenement|fete|ceremonie|ballroom|conference/, "etincelles"],
  [/restaurant|bar|cafe/, "couverts"],
];

function normaliser(texte: string): string {
  return texte.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function iconePourPiece(...textes: string[]): string {
  const texte = normaliser(textes.join(" "));
  const regle = REGLES_ICONES.find(([motif]) => motif.test(texte));
  return regle ? regle[1] : "fleche";
}

function svg(nomIcone: string): string {
  return (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    ICONES[nomIcone] +
    "</svg>"
  );
}

function echapper(texte: string): string {
  return texte.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function construireMarqueurs(hotspots: Hotspot[], panoramas: Panorama360[]) {
  return hotspots.map((hotspot) => {
    const cible = panoramas.find((p) => p.url === hotspot.panoramaCible);
    const nom = cible?.nom || hotspot.label;
    const icone = iconePourPiece(cible?.nom || "", hotspot.label);
    return {
      id: hotspot.id,
      position: { yaw: hotspot.yaw, pitch: hotspot.pitch },
      html:
        "<div class='h360-repere'>" +
        "<div class='h360-repere-icone'>" + svg(icone) + "</div>" +
        "<div class='h360-repere-etiquette'><span class='h360-repere-vers'>Vers</span><span class='h360-repere-nom'>" + echapper(nom) + "</span></div>" +
        "</div>",
      anchor: "center center",
    };
  });
}

const AUCUNE_PIECE: Panorama360[] = [];

// Safari iOS ajoute requestPermission() sur DeviceOrientationEvent (absent des types standards).
type OrientationIOS = { requestPermission?: () => Promise<string> };

export default function VisiteVirtuelle({
  panoramaUrl,
  hotspots,
  panoramas = AUCUNE_PIECE,
  onChangerPanorama,
}: VisiteVirtuelleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const urlAfficheeRef = useRef(panoramaUrl);
  const hotspotsRef = useRef(hotspots);
  const onChangerPanoramaRef = useRef(onChangerPanorama);
  // Vrai tant que le visiteur veut le gyroscope : il est alors relance automatiquement
  // apres chaque glissement du doigt (la librairie le coupe des qu'on touche l'ecran).
  const gyroVouluRef = useRef(false);
  const doigtsPosesRef = useRef(new Set<number>());
  const permissionIOSRef = useRef(false);
  const [gyroDisponible, setGyroDisponible] = useState(false);
  const [gyroActif, setGyroActif] = useState(false);
  const panoramasRef = useRef(panoramas);
  // Casque VR (Meta Quest...) : module VR precharge des que l'appareil est reconnu compatible,
  // pour que le casque s'ouvre sans attente au clic.
  const moduleVRRef = useRef<Promise<typeof import("@/lib/visiteVR")> | null>(null);
  const [vrPossible, setVrPossible] = useState(false);
  const [enVR, setEnVR] = useState(false);

  useEffect(() => {
    hotspotsRef.current = hotspots;
    onChangerPanoramaRef.current = onChangerPanorama;
    panoramasRef.current = panoramas;
  });

  useEffect(() => {
    if (!navigator.xr) return;
    navigator.xr
      .isSessionSupported("immersive-vr")
      .then((oui) => {
        if (!oui) return;
        moduleVRRef.current = import("@/lib/visiteVR");
        setVrPossible(true);
      })
      .catch(() => {});
  }, []);

  async function ouvrirVR() {
    if (!moduleVRRef.current || enVR) return;
    setEnVR(true);
    try {
      const { lancerVisiteVR } = await moduleVRRef.current;
      await lancerVisiteVR({
        panoramas: panoramasRef.current,
        urlDepart: urlAfficheeRef.current,
        onChangementPiece: (url) => onChangerPanoramaRef.current(url),
      });
    } catch (err) {
      alert("Impossible d'ouvrir la visite en realite virtuelle : " + (err instanceof Error ? err.message : String(err)));
    }
    setEnVR(false);
  }

  // Visite en plein ecran : on bloque le defilement de la page derriere (Navbar/Footer),
  // sinon un glissement du doigt fait scroller la page au lieu de tourner la vue.
  useEffect(() => {
    const overflowAvant = document.body.style.overflow;
    const overscrollAvant = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = overflowAvant;
      document.documentElement.style.overscrollBehavior = overscrollAvant;
    };
  }, []);

  // Le viewer est cree une seule fois : changer de piece ne le detruit plus, ce qui
  // garde le gyroscope actif (et evite de redemander la permission sur iPhone).
  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new Viewer({
      container: containerRef.current,
      plugins: [
        [MarkersPlugin, { markers: construireMarqueurs(hotspotsRef.current, panoramas) }],
        [GyroscopePlugin, {}],
      ],
      navbar: ["zoom", "fullscreen"],
      defaultZoomLvl: 0,
    });
    viewerRef.current = viewer;
    // Image stereo : seule la moitie du haut est affichee hors casque (lib/panoramaStereo.ts).
    const urlDepart = urlAfficheeRef.current;
    sourceAffichage(urlDepart, panoramas.find((p) => p.url === urlDepart)?.stereo).then((source) => {
      if (viewerRef.current === viewer && urlAfficheeRef.current === urlDepart) {
        viewer.setPanorama(source, { transition: false }).catch(() => {});
      }
    });

    const markersPlugin = viewer.getPlugin(MarkersPlugin) as MarkersPlugin;
    markersPlugin.addEventListener("select-marker", (e) => {
      const hotspot = hotspotsRef.current.find((h) => h.id === e.marker.id);
      if (hotspot) onChangerPanoramaRef.current(hotspot.panoramaCible);
    });

    const gyroscopePlugin = viewer.getPlugin(GyroscopePlugin) as GyroscopePlugin;

    function relancerGyro() {
      if (gyroVouluRef.current && !gyroscopePlugin.isEnabled() && doigtsPosesRef.current.size === 0) {
        gyroscopePlugin.start().catch(() => {});
      }
    }

    gyroscopePlugin.addEventListener("gyroscope-updated", (e) => {
      setGyroActif(e.gyroscopeEnabled);
      if (!e.gyroscopeEnabled && gyroVouluRef.current) {
        setTimeout(relancerGyro, 400);
      }
    });

    // Suivi des doigts poses : le gyroscope reprend des que le dernier doigt se leve,
    // en gardant l'orientation choisie par le visiteur.
    const conteneur = containerRef.current;
    function doigtPose(e: PointerEvent) {
      doigtsPosesRef.current.add(e.pointerId);
    }
    function doigtLeve(e: PointerEvent) {
      doigtsPosesRef.current.delete(e.pointerId);
      if (doigtsPosesRef.current.size === 0) setTimeout(relancerGyro, 150);
    }
    conteneur.addEventListener("pointerdown", doigtPose, true);
    window.addEventListener("pointerup", doigtLeve);
    window.addEventListener("pointercancel", doigtLeve);

    // iOS/Safari exige une permission explicite via un clic : on ne peut pas demarrer automatiquement
    permissionIOSRef.current =
      typeof (DeviceOrientationEvent as unknown as OrientationIOS) !== "undefined" &&
      typeof (DeviceOrientationEvent as unknown as OrientationIOS).requestPermission === "function";

    gyroscopePlugin.isSupported().then((supporte) => setGyroDisponible(supporte)).catch(() => {});

    if (!permissionIOSRef.current) {
      // Android et autres : demarrage automatique
      viewer.addEventListener("ready", () => {
        gyroVouluRef.current = true;
        gyroscopePlugin.start().catch(() => {});
      });
    }

    return () => {
      conteneur.removeEventListener("pointerdown", doigtPose, true);
      window.removeEventListener("pointerup", doigtLeve);
      window.removeEventListener("pointercancel", doigtLeve);
      viewer.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Changement de piece : fondu vers la nouvelle photo, puis affichage de ses reperes.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const markersPlugin = viewer.getPlugin(MarkersPlugin) as MarkersPlugin;

    if (panoramaUrl === urlAfficheeRef.current) {
      markersPlugin.setMarkers(construireMarqueurs(hotspots, panoramas));
      return;
    }

    urlAfficheeRef.current = panoramaUrl;
    markersPlugin.clearMarkers();
    sourceAffichage(panoramaUrl, panoramas.find((p) => p.url === panoramaUrl)?.stereo)
      .then((source) => {
        if (urlAfficheeRef.current !== panoramaUrl) return;
        return viewer.setPanorama(source, { transition: { speed: 900, rotation: false, effect: "fade" } });
      })
      .then(() => {
        if (urlAfficheeRef.current === panoramaUrl) {
          markersPlugin.setMarkers(construireMarqueurs(hotspotsRef.current, panoramas));
        }
      })
      .catch(() => {});
  }, [panoramaUrl, hotspots, panoramas]);

  function basculerGyroscope() {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const gyroscopePlugin = viewer.getPlugin(GyroscopePlugin) as GyroscopePlugin;

    if (gyroscopePlugin.isEnabled()) {
      gyroVouluRef.current = false;
      gyroscopePlugin.stop();
      return;
    }

    if (permissionIOSRef.current) {
      (DeviceOrientationEvent as unknown as OrientationIOS)
        .requestPermission!()
        .then((reponse: string) => {
          if (reponse === "granted") {
            gyroVouluRef.current = true;
            gyroscopePlugin.start().catch(() => {});
          } else {
            alert("Permission refusee pour le gyroscope.");
          }
        })
        .catch(() => {
          alert("Impossible d'activer le gyroscope sur cet appareil.");
        });
      return;
    }

    gyroVouluRef.current = true;
    gyroscopePlugin.start().catch(() => {});
  }

  const pieceActuelle = panoramas.find((p) => p.url === panoramaUrl);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <style>{STYLES}</style>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {pieceActuelle && (
        <div className="h360-piece-actuelle">
          <span className="h360-piece-actuelle-icone" dangerouslySetInnerHTML={{ __html: svg(iconePourPiece(pieceActuelle.nom)) }} />
          <span>{pieceActuelle.nom}</span>
        </div>
      )}

      {vrPossible && (
        <button type="button" onClick={ouvrirVR} disabled={enVR} className="h360-bouton-vr">
          <span dangerouslySetInnerHTML={{ __html: svg("casque") }} />
          {enVR ? "Visite en cours dans le casque" : "Voir en VR"}
        </button>
      )}

      {gyroDisponible && (
        <button
          type="button"
          onClick={basculerGyroscope}
          className={"h360-bouton-gyro" + (gyroActif ? " h360-bouton-gyro-actif" : "")}
          aria-pressed={gyroActif}
        >
          <span dangerouslySetInnerHTML={{ __html: svg("gyroscope") }} />
          {gyroActif ? "Gyroscope actif" : "Activer le gyroscope"}
        </button>
      )}
    </div>
  );
}

const STYLES = `
.h360-repere {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  color: #fff;
  -webkit-tap-highlight-color: transparent;
  transition: transform .25s ease;
}
.h360-repere:hover { transform: translateY(-3px); }
.h360-repere-icone {
  position: relative;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: rgba(15, 23, 42, .42);
  border: 1px solid rgba(255, 255, 255, .55);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .35), inset 0 1px 0 rgba(255, 255, 255, .25);
  transition: background .25s ease, border-color .25s ease;
}
.h360-repere-icone::after {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  border: 1px solid rgba(255, 255, 255, .7);
  animation: h360-pulsation 2.4s ease-out infinite;
  pointer-events: none;
}
.h360-repere:hover .h360-repere-icone {
  background: rgba(255, 255, 255, .92);
  border-color: #fff;
  color: #0f172a;
}
.h360-repere-icone svg { width: 22px; height: 22px; }
.h360-repere-etiquette {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 14px 7px;
  border-radius: 12px;
  background: rgba(15, 23, 42, .5);
  border: 1px solid rgba(255, 255, 255, .18);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  box-shadow: 0 6px 18px rgba(0, 0, 0, .3);
  line-height: 1.15;
  white-space: nowrap;
}
.h360-repere-vers {
  font-size: 9px;
  font-weight: 500;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .65);
}
.h360-repere-nom {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: .01em;
}
@keyframes h360-pulsation {
  0% { transform: scale(1); opacity: .8; }
  80%, 100% { transform: scale(1.6); opacity: 0; }
}
.h360-piece-actuelle {
  position: absolute;
  top: max(16px, env(safe-area-inset-top));
  right: 16px;
  max-width: calc(100% - 200px);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(15, 23, 42, .5);
  border: 1px solid rgba(255, 255, 255, .18);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.h360-piece-actuelle-icone svg { display: block; width: 18px; height: 18px; }
.h360-bouton-gyro {
  position: absolute;
  right: 16px;
  bottom: calc(64px + env(safe-area-inset-bottom));
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(15, 23, 42, .55);
  border: 1px solid rgba(255, 255, 255, .22);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0, 0, 0, .3);
}
.h360-bouton-gyro svg { width: 16px; height: 16px; }
.h360-bouton-gyro-actif {
  background: rgba(255, 255, 255, .92);
  color: #0f172a;
}
.h360-bouton-vr {
  position: absolute;
  left: 16px;
  bottom: calc(64px + env(safe-area-inset-bottom));
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  border-radius: 999px;
  background: #2563eb;
  border: 1px solid rgba(255, 255, 255, .35);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(37, 99, 235, .45);
}
.h360-bouton-vr:disabled { opacity: .7; cursor: default; }
.h360-bouton-vr svg { width: 22px; height: 22px; }
@media (prefers-reduced-motion: reduce) {
  .h360-repere-icone::after { animation: none; }
  .h360-repere { transition: none; }
}
`;
