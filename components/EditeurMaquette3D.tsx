"use client";

import { useState } from "react";
import { POIDS_CONSEILLE_MAQUETTE, uploaderMaquette3D } from "@/lib/imageUtils";
import { texteErreur } from "@/lib/erreurs";
import VisionneuseMaquette3D from "./VisionneuseMaquette3D";

interface EditeurMaquette3DProps {
  // undefined : jamais definie ; "" : retiree ; sinon adresse du fichier .glb
  url: string | undefined;
  onChange: (url: string) => void;
}

// Champ admin : envoyer, previsualiser, remplacer ou retirer la maquette 3D (.glb).
export default function EditeurMaquette3D({ url, onChange }: EditeurMaquette3DProps) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [avertissement, setAvertissement] = useState("");

  async function envoyer(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier) return;
    setErreur("");
    setAvertissement("");
    setEnCours(true);
    try {
      onChange(await uploaderMaquette3D(fichier));
      if (fichier.size > POIDS_CONSEILLE_MAQUETTE) {
        setAvertissement(
          "Maquette envoyee, mais lourde (" + Math.round(fichier.size / 1024 / 1024) + " Mo) : elle mettra du temps a s'afficher sur telephone. " +
          "Si possible, demandez une version de moins de 20 Mo."
        );
      }
    } catch (err) {
      setErreur(texteErreur(err));
    }
    setEnCours(false);
  }

  return (
    <div className="rounded-xl bg-slate-800 p-5">
      <h3 className="text-lg font-semibold">Maquette 3D (facultatif)</h3>
      <p className="mb-4 text-sm text-slate-400">
        Fichier <strong>.glb</strong> exporte depuis SketchUp, Blender, Revit... Le client pourra faire tourner la maquette et la
        voir chez lui en realite augmentee. Idealement moins de 20 Mo.{" "}
        {"N'oubliez pas d'enregistrer la fiche apres l'envoi."}
      </p>

      {url && <VisionneuseMaquette3D url={url} titre="Apercu de la maquette" ouverteDirectement />}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className={(enCours ? "opacity-60 " : "cursor-pointer hover:bg-blue-700 ") + "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold"}>
          {enCours ? "Envoi en cours..." : url ? "Remplacer la maquette" : "Envoyer une maquette (.glb)"}
          <input type="file" accept=".glb,model/gltf-binary" onChange={envoyer} disabled={enCours} className="hidden" />
        </label>
        {url && !enCours && (
          <button type="button" onClick={() => onChange("")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700">
            Retirer la maquette
          </button>
        )}
      </div>

      {erreur && <p role="alert" className="mt-3 rounded-lg border border-red-500/60 bg-red-500/10 p-3 text-sm text-red-300">{erreur}</p>}
      {avertissement && <p className="mt-3 rounded-lg border border-yellow-500/60 bg-yellow-500/10 p-3 text-sm text-yellow-200">{avertissement}</p>}
    </div>
  );
}
