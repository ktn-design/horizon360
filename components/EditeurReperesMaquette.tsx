"use client";

import { useState } from "react";
import { RepereMaquette } from "@/types";
import VisionneuseMaquette3D from "./VisionneuseMaquette3D";

interface EditeurReperesMaquetteProps {
  url: string;
  reperes: RepereMaquette[];
  // Appartements rattaches a l'immeuble (maisons dont immeubleId = cet immeuble).
  appartements: { id: string; titre: string }[];
  onChange: (reperes: RepereMaquette[]) => void;
}

// Admin : situer chaque appartement sur la maquette 3D de l'immeuble.
export default function EditeurReperesMaquette({ url, reperes, appartements, onChange }: EditeurReperesMaquetteProps) {
  const [modePose, setModePose] = useState(false);
  const [pointEnAttente, setPointEnAttente] = useState<{ position: string; normal: string } | null>(null);
  const [maisonId, setMaisonId] = useState("");
  const [libelle, setLibelle] = useState("");
  const [selection, setSelection] = useState<string | undefined>();

  function choisirAppartement(id: string) {
    setMaisonId(id);
    const appart = appartements.find((a) => a.id === id);
    if (appart) setLibelle(appart.titre);
  }

  function valider() {
    if (!pointEnAttente || !maisonId || !libelle.trim()) return;
    const nouveau: RepereMaquette = { id: Date.now().toString(), maisonId, libelle: libelle.trim(), ...pointEnAttente };
    // Un seul repere par appartement : le nouveau remplace l'ancien.
    onChange([...reperes.filter((r) => r.maisonId !== maisonId), nouveau]);
    setPointEnAttente(null);
    setMaisonId("");
    setLibelle("");
    setModePose(false);
  }

  function annuler() {
    setPointEnAttente(null);
    setModePose(false);
  }

  const sansRepere = appartements.filter((a) => !reperes.some((r) => r.maisonId === a.id));

  return (
    <div className="rounded-xl bg-slate-800 p-5">
      <h3 className="text-lg font-semibold">Reperes des appartements sur la maquette</h3>
      <p className="mb-4 text-sm text-slate-400">
        Le client voit une pastille a l&apos;emplacement de chaque appartement et ouvre sa fiche en la touchant. Cliquez sur
        « Placer un repere », puis sur l&apos;endroit de la maquette ou se trouve l&apos;appartement (sa facade, son balcon...).
        Pour tourner la maquette, faites-la glisser.
      </p>

      {appartements.length === 0 && (
        <p className="mb-4 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-200">
          Aucun appartement n&apos;est rattache a cet immeuble. Creez les appartements dans « + Ajouter une maison » en choisissant
          cet immeuble, puis revenez ici.
        </p>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-3">
        {!modePose && !pointEnAttente && (
          <button
            type="button"
            onClick={() => setModePose(true)}
            disabled={appartements.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            + Placer un repere
          </button>
        )}
        {modePose && !pointEnAttente && (
          <>
            <span className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold">Cliquez sur la maquette a l&apos;emplacement de l&apos;appartement</span>
            <button type="button" onClick={annuler} className="rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600">
              Annuler
            </button>
          </>
        )}
      </div>

      {pointEnAttente && (
        <div className="mb-3 flex flex-wrap items-end gap-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4">
          <label className="text-sm text-slate-200">
            Appartement
            <select value={maisonId} onChange={(e) => choisirAppartement(e.target.value)} className="input mt-1 w-64">
              <option value="">Choisir...</option>
              {[...sansRepere, ...appartements.filter((a) => !sansRepere.includes(a))].map((a) => (
                <option key={a.id} value={a.id}>
                  {a.titre}
                  {sansRepere.includes(a) ? "" : " (deja place : sera deplace)"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-200">
            Texte de la pastille
            <input value={libelle} onChange={(e) => setLibelle(e.target.value)} maxLength={30} placeholder="Ex. Appt A3" className="input mt-1 w-48" />
          </label>
          <button type="button" onClick={valider} disabled={!maisonId || !libelle.trim()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
            Valider
          </button>
          <button type="button" onClick={annuler} className="rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600">
            Annuler
          </button>
        </div>
      )}

      <VisionneuseMaquette3D
        url={url}
        titre="Maquette de l'immeuble"
        ouverteDirectement
        reperes={reperes}
        repereActif={selection}
        onClicRepere={setSelection}
        onClicMaquette={modePose && !pointEnAttente ? (position, normal) => setPointEnAttente({ position, normal }) : undefined}
      />

      {reperes.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-slate-300">
            Reperes places ({reperes.length} / {appartements.length} appartements) :
          </p>
          {reperes.map((r) => {
            const appart = appartements.find((a) => a.id === r.maisonId);
            return (
              <div
                key={r.id}
                className={(selection === r.id ? "ring-2 ring-blue-500 " : "") + "flex items-center justify-between rounded-lg bg-slate-700 px-3 py-2 text-sm"}
              >
                <button type="button" onClick={() => setSelection(r.id)} className="text-left">
                  <strong>{r.libelle}</strong>
                  <span className="ml-2 text-slate-400">{appart ? appart.titre : "appartement supprime"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange(reperes.filter((x) => x.id !== r.id))}
                  className="rounded bg-red-600 px-2 py-1 text-xs hover:bg-red-700"
                >
                  Retirer
                </button>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-slate-400">{"N'oubliez pas d'enregistrer l'immeuble apres avoir place les reperes."}</p>
    </div>
  );
}
