"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVisites, Visite } from "@/lib/store";

const BLEU = "#2563eb";

export default function StatistiquesPage() {
  const [visites, setVisites] = useState<Visite[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    async function charger() {
      const v = await getVisites(90);
      setVisites(v);
      setCharge(true);
    }
    charger();
  }, []);

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Chargement...</main>;

  const aujourdHui = new Date().toISOString().slice(0, 10);
  const visitesAujourdhui = visites.filter((v) => v.createdAt.slice(0, 10) === aujourdHui).length;

  // Visites par jour, 14 derniers jours (y compris les jours a 0)
  const jours: { date: string; label: string; total: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
    jours.push({ date, label, total: 0 });
  }
  const joursParDate = new Map(jours.map((j) => [j.date, j]));
  for (const v of visites) {
    const j = joursParDate.get(v.createdAt.slice(0, 10));
    if (j) j.total++;
  }
  const maxParJour = Math.max(1, ...jours.map((j) => j.total));

  function classement(cle: "pays" | "ville", limite: number) {
    const compteurs = new Map<string, number>();
    for (const v of visites) {
      const valeur = v[cle] || "Inconnu";
      compteurs.set(valeur, (compteurs.get(valeur) || 0) + 1);
    }
    return Array.from(compteurs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limite);
  }

  const parPays = classement("pays", 8);
  const parVille = classement("ville", 8);
  const maxPays = Math.max(1, ...parPays.map(([, n]) => n));
  const maxVille = Math.max(1, ...parVille.map(([, n]) => n));

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/admin/dashboard" className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour au tableau de bord
      </Link>

      <h1 className="mb-2 text-3xl font-bold">Statistiques de visite</h1>
      <p className="mb-8 text-sm text-slate-400">
        Nombre de pages vues sur les 90 derniers jours (chaque chargement de page compte, ce n'est pas un nombre de
        visiteurs uniques). Aucune adresse IP individuelle n'est affichee ici.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="rounded-xl bg-slate-800 p-6">
          <p className="text-sm text-slate-400">Visites (90 jours)</p>
          <p className="mt-1 text-3xl font-bold">{visites.length.toLocaleString("fr-CA")}</p>
        </div>
        <div className="rounded-xl bg-slate-800 p-6">
          <p className="text-sm text-slate-400">Aujourd'hui</p>
          <p className="mt-1 text-3xl font-bold">{visitesAujourdhui.toLocaleString("fr-CA")}</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl bg-slate-800 p-6">
        <h2 className="mb-4 text-lg font-semibold">Visites par jour (14 derniers jours)</h2>
        <div className="flex h-40 items-end gap-2">
          {jours.map((j) => (
            <div key={j.date} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs text-slate-400">{j.total > 0 ? j.total : ""}</span>
              <div
                className="w-full rounded-t"
                style={{
                  height: (j.total / maxParJour) * 100 + "%",
                  minHeight: j.total > 0 ? "4px" : "0px",
                  backgroundColor: BLEU,
                }}
                title={j.label + " : " + j.total + " visite" + (j.total > 1 ? "s" : "")}
              />
              <span className="text-[10px] text-slate-500">{j.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-slate-800 p-6">
          <h2 className="mb-4 text-lg font-semibold">Par pays</h2>
          {parPays.length === 0 && <p className="text-sm text-slate-400">Aucune donnee pour l'instant.</p>}
          <div className="space-y-3">
            {parPays.map(([nom, n]) => (
              <div key={nom}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{nom}</span>
                  <span className="text-slate-400">{n}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-700">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: (n / maxPays) * 100 + "%", backgroundColor: BLEU }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-slate-800 p-6">
          <h2 className="mb-4 text-lg font-semibold">Par ville</h2>
          {parVille.length === 0 && <p className="text-sm text-slate-400">Aucune donnee pour l'instant.</p>}
          <div className="space-y-3">
            {parVille.map(([nom, n]) => (
              <div key={nom}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{nom}</span>
                  <span className="text-slate-400">{n}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-700">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: (n / maxVille) * 100 + "%", backgroundColor: BLEU }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
