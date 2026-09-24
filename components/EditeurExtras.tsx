"use client";

import { Extra, FacturationExtra } from "@/types";
import { LIBELLES_FACTURATION } from "@/lib/prix";

interface EditeurExtrasProps {
  type: "hotel" | "salle";
  extras: Extra[];
  onChange: (extras: Extra[]) => void;
}

// Idees d'extras courants : un clic ajoute la ligne, l'admin n'a plus qu'a saisir le prix.
const SUGGESTIONS: Record<"hotel" | "salle", { nom: string; facturation: FacturationExtra }[]> = {
  hotel: [
    { nom: "Petit-dejeuner", facturation: "par_personne_par_nuit" },
    { nom: "Acces piscine", facturation: "par_personne" },
    { nom: "Spa", facturation: "par_personne" },
    { nom: "Kayak", facturation: "par_personne" },
    { nom: "Tennis", facturation: "forfait" },
    { nom: "Parking", facturation: "par_nuit" },
    { nom: "Navette aeroport", facturation: "forfait" },
    { nom: "Depart tardif", facturation: "forfait" },
  ],
  salle: [
    { nom: "Boissons", facturation: "par_personne" },
    { nom: "Nourriture / traiteur", facturation: "par_personne" },
    { nom: "Decoration", facturation: "forfait" },
    { nom: "Sonorisation / DJ", facturation: "forfait" },
    { nom: "Service et nettoyage", facturation: "forfait" },
    { nom: "Location de vaisselle", facturation: "par_personne" },
  ],
};

function nouvelIdExtra(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 6);
}

export default function EditeurExtras({ type, extras, onChange }: EditeurExtrasProps) {
  // Une salle se reserve a la journee : facturer "par nuit" n'y a pas de sens.
  const facturations: FacturationExtra[] =
    type === "hotel" ? ["forfait", "par_nuit", "par_personne", "par_personne_par_nuit"] : ["forfait", "par_personne"];

  function ajouter(nom = "", facturation: FacturationExtra = "forfait") {
    onChange([...extras, { id: nouvelIdExtra(), nom, prix: 0, facturation }]);
  }

  function modifier(id: string, changements: Partial<Extra>) {
    onChange(extras.map((e) => (e.id === id ? { ...e, ...changements } : e)));
  }

  function supprimer(id: string) {
    onChange(extras.filter((e) => e.id !== id));
  }

  const suggestionsRestantes = SUGGESTIONS[type].filter(
    (s) => !extras.some((e) => e.nom.trim().toLowerCase() === s.nom.toLowerCase())
  );

  return (
    <div className="rounded-xl bg-slate-800 p-5">
      <h3 className="text-lg font-semibold">Extras payants</h3>
      <p className="mb-4 text-sm text-slate-400">
        Options que le client peut ajouter a sa reservation. Leur prix est ajoute automatiquement au total
        (paiement en ligne, paiement sur place et PDF de confirmation).
      </p>

      {extras.length > 0 && (
        <div className="mb-4 space-y-3">
          {extras.map((extra) => (
            <div key={extra.id} className="grid grid-cols-12 items-end gap-2 rounded-lg bg-slate-900/60 p-3">
              <label className="col-span-12 sm:col-span-5">
                <span className="mb-1 block text-xs text-slate-400">Nom</span>
                <input
                  required
                  value={extra.nom}
                  onChange={(e) => modifier(extra.id, { nom: e.target.value })}
                  placeholder="Ex : Petit-dejeuner"
                  className="input"
                />
              </label>
              <label className="col-span-5 sm:col-span-2">
                <span className="mb-1 block text-xs text-slate-400">Prix ($)</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={extra.prix}
                  onChange={(e) => modifier(extra.id, { prix: Number(e.target.value) })}
                  className="input"
                />
              </label>
              <label className="col-span-7 sm:col-span-4">
                <span className="mb-1 block text-xs text-slate-400">Facturation</span>
                <select
                  value={extra.facturation}
                  onChange={(e) => modifier(extra.id, { facturation: e.target.value as FacturationExtra })}
                  className="input"
                >
                  {facturations.map((f) => (
                    <option key={f} value={f}>
                      {LIBELLES_FACTURATION[f]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => supprimer(extra.id)}
                className="col-span-12 rounded-lg bg-red-600/80 px-3 py-2 text-sm hover:bg-red-600 sm:col-span-1"
                aria-label={"Supprimer " + extra.nom}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}

      {suggestionsRestantes.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestionsRestantes.map((s) => (
            <button
              key={s.nom}
              type="button"
              onClick={() => ajouter(s.nom, s.facturation)}
              className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:border-blue-500 hover:text-white"
            >
              + {s.nom}
            </button>
          ))}
        </div>
      )}

      <button type="button" onClick={() => ajouter()} className="rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600">
        + Ajouter un extra personnalise
      </button>
    </div>
  );
}
