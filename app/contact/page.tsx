"use client";

import { useState } from "react";
import { envoyerMessageContact } from "@/lib/store";
import { useLanguage } from "@/lib/LanguageContext";

export default function ContactPage() {
  const { t } = useLanguage();
  const [envoye, setEnvoye] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(false);
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", message: "" });

  function champ(nom: string, valeur: string) {
    setForm((prev) => ({ ...prev, [nom]: valeur }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur(false);
    try {
      await envoyerMessageContact(form);
      setEnvoye(true);
    } catch (err) {
      setErreur(true);
    }
    setEnCours(false);
  }

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <h1 className="mb-8 text-3xl font-bold">{t("contact_titre")}</h1>

      {envoye ? (
        <div className="max-w-md rounded-xl bg-slate-800 p-6">
          <p className="text-lg font-semibold text-emerald-400">{t("contact_succes")}</p>
          <p className="mt-2 text-slate-300">{t("contact_reponse")}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">{t("contact_nom")}</label>
            <input required value={form.nom} onChange={(e) => champ("nom", e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">{t("contact_email")}</label>
            <input required type="email" value={form.email} onChange={(e) => champ("email", e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">{t("contact_telephone")}</label>
            <input value={form.telephone} onChange={(e) => champ("telephone", e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">{t("contact_message")}</label>
            <textarea required value={form.message} onChange={(e) => champ("message", e.target.value)} className="input min-h-32" />
          </div>

          {erreur && <p className="text-sm text-red-400">{t("contact_erreur")}</p>}

          <button type="submit" disabled={enCours} className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50">
            {enCours ? t("contact_envoi_cours") : t("contact_envoyer")}
          </button>
        </form>
      )}
    </main>
  );
}