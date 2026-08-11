"use client";

import { useEffect, useState } from "react";
import { creerReservation, getReservationsParBien, Reservation } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";
import ModalConnexion from "./ModalConnexion";

interface ReservationSalleProps {
  salleId: string;
}

export default function ReservationSalle({ salleId }: ReservationSalleProps) {
  const { user } = useAuth();
  const [afficherConnexion, setAfficherConnexion] = useState(false);
  const [date, setDate] = useState("");
  const [creneau, setCreneau] = useState("matin");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [message, setMessage] = useState("");
  const [reservationsExistantes, setReservationsExistantes] = useState<Reservation[]>([]);
  const [envoye, setEnvoye] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    async function charger() {
      const res = await getReservationsParBien(salleId);
      setReservationsExistantes(res);
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
      setErreur("Choisis une date.");
      return;
    }

    if (creneau === "matin" && matinPris) {
      setErreur("Le creneau du matin est deja reserve a cette date.");
      return;
    }
    if (creneau === "apres_midi" && apresMidiPris) {
      setErreur("Le creneau de l'apres-midi est deja reserve a cette date.");
      return;
    }
    if (creneau === "journee" && (matinPris || apresMidiPris)) {
      setErreur("Cette date n'est pas entierement libre.");
      return;
    }

    setEnCours(true);
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
      });
      setEnvoye(true);
    } catch (err) {
      setErreur("Une erreur est survenue, reessaie.");
    }
    setEnCours(false);
  }

  if (envoye) {
    return (
      <div className="rounded-xl bg-slate-800 p-6">
        <p className="text-lg font-semibold text-emerald-400">Demande de reservation envoyee.</p>
        <p className="mt-2 text-slate-300">Nous vous contacterons pour confirmer.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-800 p-6">
      <h3 className="mb-4 text-lg font-semibold">Demander une reservation</h3>

      {!user && (
        <p className="mb-4 rounded-lg bg-slate-700 p-3 text-sm text-slate-300">
          Tu dois etre connecte pour reserver. Remplis le formulaire, la connexion te sera demandee a l'envoi.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-slate-300">Date souhaitee</label>
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
            <label className="mb-1 block text-sm text-slate-300">Creneau</label>
            <div className="space-y-2">
              <label className={matinPris ? "flex items-center gap-2 rounded-lg bg-slate-900 p-3 text-sm opacity-40" : "flex items-center gap-2 rounded-lg bg-slate-700 p-3 text-sm"}>
                <input type="radio" name="creneau" value="matin" checked={creneau === "matin"} disabled={matinPris} onChange={(e) => setCreneau(e.target.value)} />
                Matin {matinPris && "(deja reserve)"}
              </label>
              <label className={apresMidiPris ? "flex items-center gap-2 rounded-lg bg-slate-900 p-3 text-sm opacity-40" : "flex items-center gap-2 rounded-lg bg-slate-700 p-3 text-sm"}>
                <input type="radio" name="creneau" value="apres_midi" checked={creneau === "apres_midi"} disabled={apresMidiPris} onChange={(e) => setCreneau(e.target.value)} />
                Apres-midi {apresMidiPris && "(deja reserve)"}
              </label>
              <label className={(matinPris || apresMidiPris) ? "flex items-center gap-2 rounded-lg bg-slate-900 p-3 text-sm opacity-40" : "flex items-center gap-2 rounded-lg bg-slate-700 p-3 text-sm"}>
                <input type="radio" name="creneau" value="journee" checked={creneau === "journee"} disabled={matinPris || apresMidiPris} onChange={(e) => setCreneau(e.target.value)} />
                Journee complete {(matinPris || apresMidiPris) && "(non disponible)"}
              </label>
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm text-slate-300">Nom complet</label>
          <input required value={nom} onChange={(e) => setNom(e.target.value)} className="input" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Telephone</label>
          <input required value={telephone} onChange={(e) => setTelephone(e.target.value)} className="input" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Message (optionnel)</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input min-h-20" />
        </div>

        {erreur && <p className="text-sm text-red-400">{erreur}</p>}

        <button type="submit" disabled={enCours} className="w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50">
          {enCours ? "Envoi..." : user ? "Demander la reservation" : "Se connecter pour reserver"}
        </button>
      </form>

      {afficherConnexion && <ModalConnexion onFerme={() => setAfficherConnexion(false)} />}
    </div>
  );
}