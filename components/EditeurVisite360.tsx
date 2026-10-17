"use client";

import { useState } from "react";
import { uploaderPhoto } from "@/lib/imageUtils";
import { Panorama360, Hotspot360 } from "@/types";
import { texteErreur } from "@/lib/erreurs";

interface EditeurVisite360Props {
  panoramas: Panorama360[];
  onChange: (panoramas: Panorama360[]) => void;
}

export default function EditeurVisite360({ panoramas, onChange }: EditeurVisite360Props) {
  const [indexActif, setIndexActif] = useState(0);
  const [modeAjoutRepere, setModeAjoutRepere] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const panoramaActif = panoramas[indexActif];

  async function ajouterPanorama(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    const nom = prompt("Nom de cette piece (ex: Salon, Cuisine, Chambre 1)");
    if (!nom) return;

    setEnCours(true);
    try {
      // Image 360 classique : 2 fois plus large que haute. Stereo « haut/bas » (pour casque VR) :
      // carree, les deux yeux l'un au-dessus de l'autre. Detectee ici, modifiable ensuite.
      let stereo = false;
      try {
        const image = await createImageBitmap(fichier);
        stereo = Math.abs(image.width / image.height - 1) < 0.1;
        image.close();
      } catch {
        // dimensions illisibles : image classique par defaut
      }
      const url = await uploaderPhoto(fichier, { panorama: true });
      const nouveauPanorama: Panorama360 = {
        id: Date.now().toString(),
        nom,
        url,
        hotspots: [],
        stereo,
      };
      onChange([...panoramas, nouveauPanorama]);
      setIndexActif(panoramas.length);
    } catch (err) {
      alert(texteErreur(err));
    }
    setEnCours(false);
  }

  function basculerStereo(stereo: boolean) {
    onChange(panoramas.map((p) => (p.id === panoramaActif.id ? { ...p, stereo } : p)));
  }

  function supprimerPanorama(id: string) {
    if (!confirm("Supprimer cette piece de la visite ?")) return;
    onChange(panoramas.filter((p) => p.id !== id));
    setIndexActif(0);
  }

  function handleClicImage(e: React.MouseEvent<HTMLDivElement>) {
    if (!modeAjoutRepere || !panoramaActif) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const yaw = (x - 0.5) * 2 * Math.PI;
    const pitch = (0.5 - y) * Math.PI;

    if (panoramas.length < 2) {
      alert("Ajoute au moins 2 pieces avant de creer un repere.");
      return;
    }

    const label = prompt("Texte du repere (ex: Vers la cuisine)");
    if (!label) return;

    const autres = panoramas.filter((p) => p.id !== panoramaActif.id);
    const nomsAutres = autres.map((p, i) => (i + 1) + ". " + p.nom).join("\n");
    const choix = prompt("Vers quelle piece ce repere doit-il mener ?\n" + nomsAutres + "\n\nTape le numero:");
    if (!choix) return;

    const cible = autres[Number(choix) - 1];
    if (!cible) {
      alert("Choix invalide.");
      return;
    }

    const nouveauHotspot: Hotspot360 = {
      id: Date.now().toString(),
      yaw,
      pitch,
      label,
      panoramaCible: cible.url,
    };

    const nouvellesListe = panoramas.map((p) =>
      p.id === panoramaActif.id ? { ...p, hotspots: [...p.hotspots, nouveauHotspot] } : p
    );
    onChange(nouvellesListe);
    setModeAjoutRepere(false);
  }

  function supprimerHotspot(hotspotId: string) {
    const nouvellesListe = panoramas.map((p) =>
      p.id === panoramaActif.id ? { ...p, hotspots: p.hotspots.filter((h) => h.id !== hotspotId) } : p
    );
    onChange(nouvellesListe);
  }

  return (
    <div className="rounded-xl bg-slate-800 p-6">
      <h3 className="mb-4 text-lg font-semibold">Pieces de la visite 360</h3>

      <div className="mb-4 flex flex-wrap gap-2">
        {panoramas.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIndexActif(i)}
            className={i === indexActif ? "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold" : "rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"}
          >
            {p.nom}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm text-slate-300">Ajouter une nouvelle piece (photo 360)</label>
        <input type="file" accept="image/*" onChange={ajouterPanorama} className="input" />
        {enCours && <p className="mt-2 text-sm text-blue-400">Envoi de la photo en cours...</p>}
      </div>

      {panoramaActif && (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{panoramaActif.nom}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModeAjoutRepere(!modeAjoutRepere)}
                className={modeAjoutRepere ? "rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold" : "rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"}
              >
                {modeAjoutRepere ? "Clique sur l'image" : "+ Ajouter un repere"}
              </button>
              <button
                type="button"
                onClick={() => supprimerPanorama(panoramaActif.id)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm hover:bg-red-700"
              >
                Supprimer cette piece
              </button>
            </div>
          </div>

          <label className="mb-3 flex items-start gap-2 rounded-lg bg-slate-700/60 p-3 text-sm text-slate-200">
            <input type="checkbox" checked={!!panoramaActif.stereo} onChange={(e) => basculerStereo(e.target.checked)} className="mt-0.5" />
            <span>
              <strong>Image stereo « haut/bas » pour casque VR</strong> (relief en 3D). Image carree, l&apos;oeil gauche en haut et l&apos;oeil
              droit en bas : export « 360 stereo » de Lumion, Enscape, Twinmotion ou D5 Render. Coche automatiquement pour une image
              carree. Hors casque, seule la moitie du haut est montree.
            </span>
          </label>

          {/* Cadre au format 2:1 de l'image 360 (stereo : la moitie du haut), pour que les reperes tombent au bon endroit. */}
          <div
            onClick={handleClicImage}
            className="relative aspect-[2/1] w-full overflow-hidden rounded-lg"
            style={{ cursor: modeAjoutRepere ? "crosshair" : "default" }}
          >
            <img src={panoramaActif.url} alt={panoramaActif.nom} className="h-full w-full object-cover object-top" />
            {panoramaActif.hotspots.map((hotspot) => {
              const xPourcent = (hotspot.yaw / (2 * Math.PI) + 0.5) * 100;
              const yPourcent = (0.5 - hotspot.pitch / Math.PI) * 100;
              return (
                <div
                  key={hotspot.id}
                  style={{
                    position: "absolute",
                    left: xPourcent + "%",
                    top: yPourcent + "%",
                    transform: "translate(-50%, -50%)",
                  }}
                  className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold shadow-lg"
                >
                  {hotspot.label}
                </div>
              );
            })}
          </div>

          {panoramaActif.hotspots.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-slate-300">Reperes de cette piece :</p>
              <div className="space-y-2">
                {panoramaActif.hotspots.map((hotspot) => (
                  <div key={hotspot.id} className="flex items-center justify-between rounded-lg bg-slate-700 px-3 py-2 text-sm">
                    <span>{hotspot.label}</span>
                    <button
                      type="button"
                      onClick={() => supprimerHotspot(hotspot.id)}
                      className="rounded bg-red-600 px-2 py-1 text-xs hover:bg-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {panoramas.length === 0 && (
        <p className="text-slate-400">Ajoute une premiere photo 360 pour commencer.</p>
      )}
    </div>
  );
}