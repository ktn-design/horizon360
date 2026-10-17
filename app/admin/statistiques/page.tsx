"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getVisites, Visite } from "@/lib/store";

const BLEU = "#2563eb";

type Periode = "aujourdhui" | "7" | "30" | "90" | "365" | "perso";

const PERIODES: { id: Periode; libelle: string }[] = [
  { id: "aujourdhui", libelle: "Aujourd'hui" },
  { id: "7", libelle: "7 jours" },
  { id: "30", libelle: "30 jours" },
  { id: "90", libelle: "90 jours" },
  { id: "365", libelle: "12 mois" },
  { id: "perso", libelle: "Dates au choix" },
];

const LIBELLES_PAGES: Record<string, string> = {
  accueil: "Accueil",
  maisons: "Liste des maisons",
  maison_detail: "Fiche d'une maison",
  salles: "Liste des salles",
  salle_detail: "Fiche d'une salle",
  hotels: "Liste des hotels",
  hotel_detail: "Fiche d'un hotel",
};

const LIBELLES_SOURCES: Record<string, string> = {
  site: "Site web",
  application: "Application mobile",
  inconnue: "Non renseignee (avant le suivi)",
};

// Date locale au format AAAA-MM-JJ (et non UTC, pour que "aujourd'hui" soit le bon jour).
function cleJour(d: Date): string {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function debutDuJour(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function finDuJour(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function bornesPeriode(periode: Periode, dateDebut: string, dateFin: string): { depuis: Date; jusqua: Date } {
  const maintenant = new Date();
  if (periode === "perso") {
    const depuis = dateDebut ? debutDuJour(new Date(dateDebut + "T00:00:00")) : debutDuJour(maintenant);
    const jusqua = dateFin ? finDuJour(new Date(dateFin + "T00:00:00")) : finDuJour(maintenant);
    return { depuis, jusqua };
  }
  const jours = periode === "aujourdhui" ? 1 : Number(periode);
  const depuis = debutDuJour(maintenant);
  depuis.setDate(depuis.getDate() - (jours - 1));
  return { depuis, jusqua: finDuJour(maintenant) };
}

export default function StatistiquesPage() {
  const [periode, setPeriode] = useState<Periode>("30");
  const [dateDebut, setDateDebut] = useState(() => cleJour(new Date(Date.now() - 6 * 86400000)));
  const [dateFin, setDateFin] = useState(() => cleJour(new Date()));
  const [visites, setVisites] = useState<Visite[]>([]);
  const [enCours, setEnCours] = useState(true);

  const [filtrePage, setFiltrePage] = useState("");
  const [filtrePays, setFiltrePays] = useState("");
  const [filtreVille, setFiltreVille] = useState("");
  const [filtreSource, setFiltreSource] = useState("");

  const { depuis, jusqua } = useMemo(() => bornesPeriode(periode, dateDebut, dateFin), [periode, dateDebut, dateFin]);

  useEffect(() => {
    let annule = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnCours(true);
    getVisites(depuis, jusqua).then((v) => {
      if (annule) return;
      setVisites(v);
      setEnCours(false);
    });
    return () => {
      annule = true;
    };
  }, [depuis, jusqua]);

  // Choix proposes dans les filtres (d'apres les visites de la periode).
  const pagesDispo = useMemo(() => Array.from(new Set(visites.map((v) => v.page))).sort(), [visites]);
  const paysDispo = useMemo(() => Array.from(new Set(visites.map((v) => v.pays || "Inconnu"))).sort(), [visites]);
  const villesDispo = useMemo(
    () =>
      Array.from(new Set(visites.filter((v) => !filtrePays || (v.pays || "Inconnu") === filtrePays).map((v) => v.ville || "Inconnu"))).sort(),
    [visites, filtrePays]
  );
  const aDesSources = visites.some((v) => v.source);

  const filtrees = visites.filter(
    (v) =>
      (!filtrePage || v.page === filtrePage) &&
      (!filtrePays || (v.pays || "Inconnu") === filtrePays) &&
      (!filtreVille || (v.ville || "Inconnu") === filtreVille) &&
      (!filtreSource || (v.source || "inconnue") === filtreSource)
  );
  const aDesFiltres = filtrePage || filtrePays || filtreVille || filtreSource;

  function effacerFiltres() {
    setFiltrePage("");
    setFiltrePays("");
    setFiltreVille("");
    setFiltreSource("");
  }

  // Graphique : par heure (un seul jour), par jour (jusqu'a 62 jours), sinon par semaine.
  const nbJours = Math.max(1, Math.round((debutDuJour(jusqua).getTime() - debutDuJour(depuis).getTime()) / 86400000) + 1);
  const barres: { cle: string; libelle: string; total: number }[] = [];
  let cleDe: (v: Visite) => string;
  if (nbJours === 1) {
    for (let h = 0; h < 24; h++) barres.push({ cle: String(h), libelle: h + "h", total: 0 });
    cleDe = (v) => String(new Date(v.createdAt).getHours());
  } else if (nbJours <= 62) {
    for (let i = 0; i < nbJours; i++) {
      const d = new Date(depuis);
      d.setDate(d.getDate() + i);
      barres.push({ cle: cleJour(d), libelle: d.toLocaleDateString("fr-CA", { day: "numeric", month: "short" }), total: 0 });
    }
    cleDe = (v) => cleJour(new Date(v.createdAt));
  } else {
    const nbSemaines = Math.ceil(nbJours / 7);
    for (let i = 0; i < nbSemaines; i++) {
      const d = new Date(depuis);
      d.setDate(d.getDate() + i * 7);
      barres.push({ cle: String(i), libelle: d.toLocaleDateString("fr-CA", { day: "numeric", month: "short" }), total: 0 });
    }
    cleDe = (v) => String(Math.floor((debutDuJour(new Date(v.createdAt)).getTime() - debutDuJour(depuis).getTime()) / (7 * 86400000)));
  }
  const barresParCle = new Map(barres.map((b) => [b.cle, b]));
  for (const v of filtrees) {
    const b = barresParCle.get(cleDe(v));
    if (b) b.total++;
  }
  const maxBarre = Math.max(1, ...barres.map((b) => b.total));
  const titreGraphique = nbJours === 1 ? "Visites par heure" : nbJours <= 62 ? "Visites par jour" : "Visites par semaine";

  function classement(valeur: (v: Visite) => string, limite: number) {
    const compteurs = new Map<string, number>();
    for (const v of filtrees) compteurs.set(valeur(v), (compteurs.get(valeur(v)) || 0) + 1);
    return Array.from(compteurs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limite);
  }

  // Visiteurs uniques : un appareil = un visiteur, quel que soit le nombre de pages vues.
  const visiteurs = (liste: Visite[]) => new Set(liste.map((v) => v.visiteur)).size;
  const aujourdHui = cleJour(new Date());
  const visiteursAujourdhui = visiteurs(filtrees.filter((v) => cleJour(new Date(v.createdAt)) === aujourdHui));
  const visiteursApplication = visiteurs(filtrees.filter((v) => v.source === "application"));
  const nbPays = new Set(filtrees.map((v) => v.pays).filter(Boolean)).size;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/admin/dashboard" className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour au tableau de bord
      </Link>

      <h1 className="mb-2 text-3xl font-bold">Statistiques de visite</h1>
      <p className="mb-6 text-sm text-slate-400">
        <strong>Visiteurs uniques</strong> : nombre d&apos;appareils differents. <strong>Pages vues</strong> : chaque page ouverte compte.
        Les robots (Google, Microsoft...), les appareils des administrateurs et les rechargements rapides de la meme page ne sont
        pas comptes. Aucune adresse IP individuelle n&apos;est affichee ici.
      </p>

      {/* Periode */}
      <div className="mb-4 flex flex-wrap gap-2">
        {PERIODES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriode(p.id)}
            className={(periode === p.id ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700") + " rounded-lg px-4 py-2 text-sm font-semibold"}
          >
            {p.libelle}
          </button>
        ))}
      </div>
      {periode === "perso" && (
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="text-sm text-slate-300">
            Du
            <input type="date" value={dateDebut} max={dateFin} onChange={(e) => setDateDebut(e.target.value)} className="input mt-1 w-44" />
          </label>
          <label className="text-sm text-slate-300">
            Au
            <input type="date" value={dateFin} min={dateDebut} max={cleJour(new Date())} onChange={(e) => setDateFin(e.target.value)} className="input mt-1 w-44" />
          </label>
        </div>
      )}

      {/* Filtres */}
      <div className="mb-8 flex flex-wrap items-end gap-3 rounded-xl bg-slate-800 p-4">
        <Filtre libelle="Page" valeur={filtrePage} onChange={setFiltrePage} options={pagesDispo.map((p) => [p, LIBELLES_PAGES[p] || p])} tous="Toutes les pages" />
        <Filtre
          libelle="Pays"
          valeur={filtrePays}
          onChange={(v) => {
            setFiltrePays(v);
            setFiltreVille("");
          }}
          options={paysDispo.map((p) => [p, p])}
          tous="Tous les pays"
        />
        <Filtre libelle="Ville" valeur={filtreVille} onChange={setFiltreVille} options={villesDispo.map((v) => [v, v])} tous="Toutes les villes" />
        {aDesSources && (
          <Filtre
            libelle="Provenance"
            valeur={filtreSource}
            onChange={setFiltreSource}
            options={["site", "application", "inconnue"].map((s) => [s, LIBELLES_SOURCES[s]])}
            tous="Site et application"
          />
        )}
        {aDesFiltres && (
          <button onClick={effacerFiltres} className="rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600">
            Effacer les filtres
          </button>
        )}
      </div>

      {enCours ? (
        <p className="text-slate-400">Chargement des statistiques...</p>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Chiffre libelle="Visiteurs uniques" valeur={visiteurs(filtrees)} />
            <Chiffre libelle="Pages vues" valeur={filtrees.length} />
            <Chiffre libelle="Visiteurs aujourd'hui" valeur={visiteursAujourdhui} />
            {aDesSources ? <Chiffre libelle="Visiteurs via l'application" valeur={visiteursApplication} /> : <Chiffre libelle="Pays differents" valeur={nbPays} />}
          </div>

          <div className="mb-8 rounded-xl bg-slate-800 p-6">
            <h2 className="mb-4 text-lg font-semibold">{titreGraphique}</h2>
            <div className="flex h-40 items-end gap-1">
              {barres.map((b) => (
                <div key={b.cle} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] text-slate-400">{b.total > 0 && barres.length <= 31 ? b.total : ""}</span>
                  <div
                    className="w-full rounded-t"
                    style={{ height: (b.total / maxBarre) * 100 + "%", minHeight: b.total > 0 ? "4px" : "0px", backgroundColor: BLEU }}
                    title={b.libelle + " : " + b.total + " visite" + (b.total > 1 ? "s" : "")}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>{barres[0]?.libelle}</span>
              <span>{barres[Math.floor(barres.length / 2)]?.libelle}</span>
              <span>{barres[barres.length - 1]?.libelle}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Classement
              titre="Par page"
              lignes={classement((v) => v.page, 10).map(([cle, n]) => [cle, LIBELLES_PAGES[cle] || cle, n])}
              onChoisir={setFiltrePage}
            />
            <Classement titre="Par pays" lignes={classement((v) => v.pays || "Inconnu", 10).map(([c, n]) => [c, c, n])} onChoisir={(v) => { setFiltrePays(v); setFiltreVille(""); }} />
            <Classement titre="Par ville" lignes={classement((v) => v.ville || "Inconnu", 10).map(([c, n]) => [c, c, n])} onChoisir={setFiltreVille} />
            {aDesSources && (
              <Classement
                titre="Par provenance"
                lignes={classement((v) => v.source || "inconnue", 3).map(([cle, n]) => [cle, LIBELLES_SOURCES[cle] || cle, n])}
                onChoisir={setFiltreSource}
              />
            )}
          </div>
        </>
      )}
    </main>
  );
}

function Filtre({
  libelle,
  valeur,
  onChange,
  options,
  tous,
}: {
  libelle: string;
  valeur: string;
  onChange: (v: string) => void;
  options: [string, string][];
  tous: string;
}) {
  return (
    <label className="text-sm text-slate-300">
      {libelle}
      <select value={valeur} onChange={(e) => onChange(e.target.value)} className="input mt-1 w-52">
        <option value="">{tous}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function Chiffre({ libelle, valeur }: { libelle: string; valeur: number | string }) {
  return (
    <div className="rounded-xl bg-slate-800 p-5">
      <p className="text-sm text-slate-400">{libelle}</p>
      <p className="mt-1 text-3xl font-bold">{typeof valeur === "number" ? valeur.toLocaleString("fr-CA") : valeur}</p>
    </div>
  );
}

// Lignes : [valeur du filtre, libelle affiche, nombre]. Un clic applique le filtre.
function Classement({ titre, lignes, onChoisir }: { titre: string; lignes: [string, string, number][]; onChoisir: (v: string) => void }) {
  const max = Math.max(1, ...lignes.map(([, , n]) => n));
  return (
    <div className="rounded-xl bg-slate-800 p-6">
      <h2 className="mb-4 text-lg font-semibold">{titre}</h2>
      {lignes.length === 0 && <p className="text-sm text-slate-400">Aucune visite pour ces criteres.</p>}
      <div className="space-y-3">
        {lignes.map(([cle, nom, n]) => (
          <button key={cle} onClick={() => onChoisir(cle)} className="block w-full text-left" title="Filtrer sur cette valeur">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="hover:text-blue-400">{nom}</span>
              <span className="text-slate-400">{n.toLocaleString("fr-CA")}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-700">
              <div className="h-2 rounded-full" style={{ width: (n / max) * 100 + "%", backgroundColor: BLEU }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
