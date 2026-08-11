"use client";

import { useEffect, useRef, useState } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";

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
  onChangerPanorama: (nouvellePanoramaUrl: string) => void;
}

export default function VisiteVirtuelle({
  panoramaUrl,
  hotspots,
  onChangerPanorama,
}: VisiteVirtuelleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [afficherBoutonGyro, setAfficherBoutonGyro] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new Viewer({
      container: containerRef.current,
      panorama: panoramaUrl,
      plugins: [
        [
          MarkersPlugin,
          {
            markers: hotspots.map((hotspot) => ({
              id: hotspot.id,
              position: { yaw: hotspot.yaw, pitch: hotspot.pitch },
              html:
                "<div style='background:#2563eb;color:white;padding:8px 14px;border-radius:20px;font-size:13px;font-weight:600;white-space:nowrap;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.4)'>" +
                hotspot.label +
                "</div>",
              anchor: "center center",
            })),
          },
        ],
        [GyroscopePlugin, {}],
      ],
      navbar: ["zoom", "fullscreen"],
      defaultZoomLvl: 0,
    });

    viewerRef.current = viewer;

    const markersPlugin = viewer.getPlugin(MarkersPlugin) as MarkersPlugin;

    markersPlugin.addEventListener("select-marker", (e: any) => {
      const hotspot = hotspots.find((h) => h.id === e.marker.id);
      if (hotspot) {
        onChangerPanorama(hotspot.panoramaCible);
      }
    });

    const gyroscopePlugin = viewer.getPlugin(GyroscopePlugin) as GyroscopePlugin;

    // iOS/Safari exige une permission explicite via un clic : on ne peut pas demarrer automatiquement
    const permissionRequise =
      typeof (DeviceOrientationEvent as any) !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function";

    if (permissionRequise) {
      // iPhone : on affiche un bouton, l'utilisateur doit cliquer
      setAfficherBoutonGyro(true);
    } else {
      // Android et autres : demarrage automatique, sans bouton
      viewer.addEventListener("ready", () => {
        gyroscopePlugin.start();
      });
    }

    return () => {
      viewer.destroy();
    };
  }, [panoramaUrl, hotspots, onChangerPanorama]);

  function activerGyroscopeIOS() {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const gyroscopePlugin = viewer.getPlugin(GyroscopePlugin) as GyroscopePlugin;

    (DeviceOrientationEvent as any)
      .requestPermission()
      .then((reponse: string) => {
        if (reponse === "granted") {
          gyroscopePlugin.start();
          setAfficherBoutonGyro(false);
        } else {
          alert("Permission refusee pour le gyroscope.");
        }
      })
      .catch(() => {
        alert("Impossible d'activer le gyroscope sur cet appareil.");
      });
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {afficherBoutonGyro && (
        <button
          onClick={activerGyroscopeIOS}
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            zIndex: 10,
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          Activer le gyroscope
        </button>
      )}
    </div>
  );
}