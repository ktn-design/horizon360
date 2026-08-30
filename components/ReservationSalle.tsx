"use client";

import { useEffect, useState } from "react";
import { creerReservation, getReservationsParBien, getSalleParId, Reservation } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { creneauSalleDisponible } from "@/lib/disponibilite";
import ModalConnexion from "./ModalConnexion";

interface ReservationSalleProps {
  salleId: string;
}

export default function ReservationSalle({ salleId }: ReservationSalleProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [afficherConnexion, setAfficherConnexion] = useState(false);
  const [date, setDate] = useState("");
  const [creneau, setCreneau] = useState("matin");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [message, setMessage] = useState("");
  const [reservationsExistantes, setReservationsExistantes] = useState<Reservation[]>([]);
  const [prixSalle, setPrixSalle] = useState(0);
  const [modePaiement, setModePaiement] = useState<"carte" | "sur_place">("carte");
  const [envoye, setEnvoye] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    async function charger() {
      const [res, salle] = await Promise.all([getReservationsParBien(salleId), getSalleParId(salleId)]);
      setReservationsExistantes(res);
      setPrixSalle(salle?.prix || 0);
    }
    charger();
  }, [salleId]);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const creneauxPrisPourDate = reservationsExistantes.filter((r) => r.dateDebut === date).map((r) => r.creneau);
  const journeeIndisponible = creneauxPrisPourDate.includes("journee");
  const matinPris = creneauxPrisPourDate.includes("matin") || journeeIndisponible;
  const apresMidiPris = creneauxPrisPourDate.includes("apres_midi") || journeeIndisponible;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    if (!user) {
      setAfficherConnexion(true);
      return;
    }

    if (!date) {
      setErreur(t("resa_choisir_date"));
      return;
    }

    if (creneau === "matin" && matinPris) {
      setErreur(t("resa_matin_pris"));
      return;
    }
    if (creneau === "apres_midi" && apresMidiPris) {
      setErreur(t("resa_apres_midi_pris"));
      return;
    }
    if (creneau === "journee" && (matinPris || apresMidiPris)) {
      setErreur(t("resa_date_pas_libre"));
      return;
    }

    if (!creneauSalleDisponible(reservationsExistantes, date, creneau)) {
      setErreur(t("resa_date_pas_libre"));
      return;
    }

    setEnCours(true);

    if (modePaiement === "carte") {
      try {
        const reponse = await fetch("/api/creer-paiement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            typeBien: "salle",
            bienId: salleId,
            nomClient: nom,
            emailClient: email,
            telephoneClient: telephone,
            dateDebut: date,
            dateFin: date,
            creneau,
            message,
          }),
        });
        const data = await reponse.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        setErreur(t("resa_erreur_paiement"));
      } catch (err) {
        setErreur(t("resa_erreur_paiement"));
      }
      setEnCours(false);
      return;
    }

    try {
      await creerReservation({
        typeBien: "salle",
        bienId: salleId,
        nomClient: nom,
        emailClient: email,
        telephoneClient: telephone,
        dateDebut: date,
        dateFin: date,
        creneau,
        message,
        montant: prixSalle,
      });
      setEnvoye(true);
    } catch (err) {
      setErreur(t("resa_erreur"));
    }
    setEnCours(false);
  }

  if (envoye) {
    return (
      <div className="rounded-xl bg-slate-800 p-6">
        <p className="text-lg font-semibold text-emerald-400">{t("resa_envoyee_titre")}</p>
        <p className="mt-2 text-slate-300">{t("resa_envoyee_texte")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-800 p-6">
      <h3 className="mb-4 text-lg font-semibold">{t("resa_titre_salle")}</h3>

      {!user && (
        <p className="mb-4 rounded-lg bg-slate-700 p-3 text-sm text-slate-300">
          {t("resa_connexion_requise")}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-slate-300">{t("resa_date_souhaitee")}</label>
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="input"
          />
        </div>

        {date && (
          <div>
            <label className="mb-1 block text-sm text-slate-300">{t("resa_creneau")}</label>
            <div className="space-y-2">
              <label className={matinPris ? "flex items-center gap-2 rounded-lg bg-slate-900 p-3 text-sm opacity-40" : "flex items-center gap-2 rounded-lg bg-slate-700 p-3 text-sm"}>
                <input type="radio" name="creneau" value="matin" checked={creneau === "matin"} disabled={matinPris} onChange={(e) => setCreneau(e.target.value)} />
                {t("resa_matin")} {matinPris && t("resa_deja_reserve")}
              </label>
              <label className={apresMidiPris ? "flex items-center gap-2 rounded-lg bg-slate-900 p-3 text-sm opacity-40" : "flex items-center gap-2 rounded-lg bg-slate-700 p-3 text-sm"}>
                <input type="radio" name="creneau" value="apres_midi" checked={creneau === "apres_midi"} disabled={apresMidiPris} onChange={(e) => setCreneau(e.target.value)} />
                {t("resa_apres_midi")} {apresMidiPris && t("resa_deja_reserve")}
              </label>
              <label className={(matinPris || apresMidiPris) ? "flex items-center gap-2 rounded-lg bg-slate-900 p-3 text-sm opacity-40" : "flex items-center gap-2 rounded-lg bg-slate-700 p-3 text-sm"}>
                <input type="radio" name="creneau" value="journee" checked={creneau === "journee"} disabled={matinPris || apresMidiPris} onChange={(e) => setCreneau(e.target.value)} />
                {t("resa_journee")} {(matinPris || apresMidiPris) && t("resa_non_disponible")}
              </label>
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm text-slate-300">{t("resa_nom_complet")}</label>
          <input required value={nom} onChange={(e) => setNom(e.target.value)} className="input" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">{t("resa_email")}</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">{t("resa_telephone")}</label>
          <input required value={telephone} onChange={(e) => setTelephone(e.target.value)} className="input" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">{t("resa_message_optionnel")}</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input min-h-20" />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">{t("resa_mode_paiement")}</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 rounded-lg bg-slate-700 p-3 text-sm">
              <input type="radio" name="modePaiement" value="carte" checked={modePaiement === "carte"} onChange={() => setModePaiement("carte")} />
              {t("resa_payer_carte")}
            </label>
            <label className="flex items-center gap-2 rounded-lg bg-slate-700 p-3 text-sm">
              <input type="radio" name="modePaiement" value="sur_place" checked={modePaiement === "sur_place"} onChange={() => setModePaiement("sur_place")} />
              {t("resa_payer_place")}
            </label>
          </div>
        </div>

        {prixSalle > 0 && (
          <p className="text-sm text-slate-300">
            {t("resa_prix_total")} : <span className="font-bold text-emerald-400">{prixSalle.toLocaleString("fr-CA")} $</span>
          </p>
        )}

        {erreur && <p className="text-sm text-red-400">{erreur}</p>}

        <button type="submit" disabled={enCours} className="w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50">
          {enCours
            ? modePaiement === "carte"
              ? t("resa_redirection_paiement")
              : t("resa_envoi")
            : user
            ? modePaiement === "carte"
              ? t("resa_payer_carte")
              : t("resa_demander")
            : t("resa_titre_salle")}
        </button>
      </form>

      {afficherConnexion && <ModalConnexion onFerme={() => setAfficherConnexion(false)} />}
    </div>
  );
}
