"use client";

import { Extra } from "@/types";
import { ExtraChoisi, extraParPersonne } from "@/lib/prix";
import { useLanguage } from "@/lib/LanguageContext";

interface ChoixExtrasProps {
  extras: Extra[];
  idsChoisis: string[];
  onChangeIds: (ids: string[]) => void;
  nombrePersonnes: number;
  onChangeNombrePersonnes: (n: number) => void;
  // Detail du prix : ligne principale (hebergement ou salle) + extras choisis.
  libellePrincipal: string;
  montantPrincipal: number;
  lignesExtras: ExtraChoisi[];
}

function formaterPrix(montant: number): string {
  return montant.toLocaleString("fr-CA", { maximumFractionDigits: 2 }) + " $";
}

export default function ChoixExtras({
  extras,
  idsChoisis,
  onChangeIds,
  nombrePersonnes,
  onChangeNombrePersonnes,
  libellePrincipal,
  montantPrincipal,
  lignesExtras,
}: ChoixExtrasProps) {
  const { t } = useLanguage();

  if (extras.length === 0) return null;

  function basculer(id: string) {
    onChangeIds(idsChoisis.includes(id) ? idsChoisis.filter((i) => i !== id) : [...idsChoisis, id]);
  }

  const besoinNombrePersonnes = extras.some((e) => idsChoisis.includes(e.id) && extraParPersonne(e));
  const total = montantPrincipal + lignesExtras.reduce((s, l) => s + l.total, 0);

  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">{t("resa_extras_titre")}</label>
      <div className="grid gap-2 sm:grid-cols-2">
        {extras.map((extra) => {
          const choisi = idsChoisis.includes(extra.id);
          return (
            <label
              key={extra.id}
              className={
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors " +
                (choisi ? "border-blue-500 bg-blue-500/10" : "border-slate-600 bg-slate-700/60 hover:border-slate-500")
              }
            >
              <input type="checkbox" checked={choisi} onChange={() => basculer(extra.id)} className="mt-0.5" />
              <span className="flex-1">
                <span className="block font-medium text-white">{extra.nom}</span>
                <span className="text-slate-400">
                  {extra.prix > 0
                    ? "+ " + formaterPrix(extra.prix) + " " + t(("extra_" + extra.facturation) as "extra_forfait")
                    : t("extra_inclus")}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {besoinNombrePersonnes && (
        <div className="mt-3">
          <label className="mb-1 block text-sm text-slate-300">{t("resa_nombre_personnes")}</label>
          <input
            type="number"
            min="1"
            max="10000"
            required
            value={nombrePersonnes}
            onChange={(e) => onChangeNombrePersonnes(Math.max(1, Number(e.target.value) || 1))}
            className="input max-w-32"
          />
        </div>
      )}

      {montantPrincipal > 0 && lignesExtras.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg bg-slate-900/60 p-3 text-sm text-slate-300">
          <div className="flex justify-between gap-4">
            <span>{libellePrincipal}</span>
            <span>{formaterPrix(montantPrincipal)}</span>
          </div>
          {lignesExtras.map((l) => (
            <div key={l.id} className="flex justify-between gap-4">
              <span>
                {l.nom}
                {l.quantite > 1 && <span className="text-slate-500"> × {l.quantite}</span>}
              </span>
              <span>{formaterPrix(l.total)}</span>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-slate-700 pt-1 font-semibold text-white">
            <span>{t("resa_prix_total")}</span>
            <span>{formaterPrix(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
