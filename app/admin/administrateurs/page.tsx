"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ProfilAdmin, SECTIONS_ADMIN, SectionAdmin, dbVersProfilAdmin } from "@/lib/permissions";
import { enTetesAdmin } from "@/lib/sessionAdmin";

// Gestion des administrateurs secondaires (page reservee au principal : proxy.ts + GardeAdmin).
export default function AdministrateursPage() {
  const [comptes, setComptes] = useState<ProfilAdmin[]>([]);
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState("");
  const [info, setInfo] = useState("");
  const [enCours, setEnCours] = useState(false);

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [permissionsNouvel, setPermissionsNouvel] = useState<SectionAdmin[]>([]);

  async function charger() {
    const { data, error } = await supabase.from("admin_comptes").select("*").order("role").order("email");
    if (error) setErreur("Chargement impossible : " + error.message);
    setComptes((data || []).map(dbVersProfilAdmin));
    setCharge(true);
  }

  useEffect(() => {
    charger();
  }, []);

  async function appeler(url: string, methode: string, corps?: unknown): Promise<boolean> {
    setErreur("");
    setInfo("");
    setEnCours(true);
    try {
      const reponse = await fetch(url, {
        method: methode,
        headers: await enTetesAdmin(),
        body: corps === undefined ? undefined : JSON.stringify(corps),
      });
      const data = await reponse.json().catch(() => ({}));
      if (!reponse.ok) {
        setErreur(data.erreur || "Erreur " + reponse.status);
        return false;
      }
      return true;
    } catch {
      setErreur("Connexion au serveur impossible. Verifiez votre connexion internet.");
      return false;
    } finally {
      setEnCours(false);
      await charger();
    }
  }

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    const ok = await appeler("/api/admin/comptes", "POST", { email, motDePasse, permissions: permissionsNouvel });
    if (ok) {
      setInfo("Administrateur " + email + " cree. Communiquez-lui son mot de passe : il pourra le changer depuis « Mon mot de passe ».");
      setEmail("");
      setMotDePasse("");
      setPermissionsNouvel([]);
    }
  }

  async function basculerPermission(compte: ProfilAdmin, section: SectionAdmin) {
    const permissions = compte.permissions.includes(section)
      ? compte.permissions.filter((p) => p !== section)
      : [...compte.permissions, section];
    await appeler("/api/admin/comptes/" + compte.userId, "PATCH", { permissions });
  }

  async function basculerGel(compte: ProfilAdmin) {
    const question = compte.actif
      ? "Geler " + compte.email + " ? Il perd immediatement tous ses droits et ne peut plus se connecter."
      : "Reactiver " + compte.email + " ?";
    if (!confirm(question)) return;
    const ok = await appeler("/api/admin/comptes/" + compte.userId, "PATCH", { actif: !compte.actif });
    if (ok) setInfo(compte.email + (compte.actif ? " est gele." : " est reactive."));
  }

  async function supprimer(compte: ProfilAdmin) {
    if (!confirm("Supprimer definitivement l'administrateur " + compte.email + " ?")) return;
    const ok = await appeler("/api/admin/comptes/" + compte.userId, "DELETE");
    if (ok) setInfo(compte.email + " a ete supprime.");
  }

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Chargement...</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/admin/dashboard" className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour au tableau de bord
      </Link>

      <h1 className="mb-2 text-3xl font-bold">Administrateurs</h1>
      <p className="mb-8 text-slate-400">
        Un administrateur secondaire ne peut gerer que les sections cochees. Un compte gele perd tous ses droits
        immediatement, meme s'il est connecte.
      </p>

      {erreur && <p role="alert" className="mb-6 rounded-lg border border-red-500/60 bg-red-500/10 p-4 text-sm text-red-300">{erreur}</p>}
      {info && <p className="mb-6 rounded-lg border border-emerald-500/60 bg-emerald-500/10 p-4 text-sm text-emerald-300">{info}</p>}

      <div className="mb-10 overflow-hidden rounded-xl bg-slate-800">
        {comptes.map((compte) => (
          <div key={compte.userId} className="border-b border-slate-700 p-4 last:border-none">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{compte.email}</p>
                <p className="text-sm text-slate-400">
                  {compte.role === "principal" ? "Administrateur principal (tous les droits)" : "Administrateur secondaire"}
                  {!compte.actif && <span className="ml-2 rounded bg-red-600 px-2 py-0.5 text-xs text-white">Gele</span>}
                </p>
              </div>
              {compte.role === "secondaire" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => basculerGel(compte)}
                    disabled={enCours}
                    className={(compte.actif ? "bg-yellow-600 hover:bg-yellow-700" : "bg-emerald-600 hover:bg-emerald-700") + " rounded-lg px-3 py-2 text-sm disabled:opacity-50"}
                  >
                    {compte.actif ? "Geler" : "Reactiver"}
                  </button>
                  <button
                    onClick={() => supprimer(compte)}
                    disabled={enCours}
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>

            {compte.role === "secondaire" && (
              <div className="mt-3 flex flex-wrap gap-4">
                {SECTIONS_ADMIN.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={compte.permissions.includes(s.id)}
                      disabled={enCours}
                      onChange={() => basculerPermission(compte, s.id)}
                    />
                    {s.libelle}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-xl font-semibold">Ajouter un administrateur secondaire</h2>
      <form onSubmit={creer} className="max-w-xl space-y-4 rounded-xl bg-slate-800 p-6">
        <input
          type="email"
          required
          autoComplete="off"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          type="text"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Mot de passe provisoire (8 caracteres minimum)"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="input"
        />
        <div className="flex flex-wrap gap-4">
          {SECTIONS_ADMIN.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={permissionsNouvel.includes(s.id)}
                onChange={(e) =>
                  setPermissionsNouvel(e.target.checked ? [...permissionsNouvel, s.id] : permissionsNouvel.filter((p) => p !== s.id))
                }
              />
              {s.libelle}
            </label>
          ))}
        </div>
        <button type="submit" disabled={enCours} className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50">
          {enCours ? "Patientez..." : "Creer l'administrateur"}
        </button>
      </form>
    </main>
  );
}
