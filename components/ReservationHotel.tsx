"use client";

import { useEffect, useState } from "react";
import { creerReservation, getReservationsParBien, Reservation } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";
import ModalConnexion from "./ModalConnexion";

interface ReservationHotelProps {
  hotelId: string;
}

export default function ReservationHotel({ hotelId }: ReservationHotelProps) {
  const { user } = useAuth();
  const [afficherConnexion, setAfficherConnexion] = useState(false);
  const [dateArrivee, setDateArrivee] = useState("");
  const [dateDepart, setDateDepart] = useState("");
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
      const res = await getReservationsParBien(hotelId);
      setReservationsExistantes(res);
    }
    charger();
  }, [hotelId]);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  function periodesSeChevauchent(debut1: string, fin1: string, debut2: string, fin2: string) {
    return debut1 < fin2 && debut2 < fin1;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    if (!user) {
      setAfficherConnexion(true);
      return;
    }

    if (!dateArrivee || !dateDepart) {
      setErreur("Choisis les dates d'arrivee et de depart.");
      return;
    }
    if (dateDepart <= dateArrivee) {
      setErreur("La date de depart doit etre apres la date d'arrivee.");
      return;
    }

    const conflit = reservationsExistantes.some((r) =>
      periodesSeChevauchent(dateArrivee, dateDepart, r.dateDebut, r.dateFin)
    );

    if (conflit) {
      setErreur("Ces dates ne sont pas disponibles, choisis une autre periode.");
      return;
    }

    setEnCours(true);
    try {
      await creerReservation({
        typeBien: "hotel",
        bienId: hotelId,
        nomClient: nom,
        emailClient: email,
        telephoneClient: telephone,
        dateDebut: dateArrivee,
        dateFin: dateDepart,
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
      <h3 className="mb-4 text-lg font-semibold">Reserver</h3>

      {!user && (
        <p className="mb-4 rounded-lg bg-slate-700 p-3 text-sm text-slate-300">
          Tu dois etre connecte pour reserver. Remplis le formulaire, la connexion te sera demandee a l'envoi.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Arrivee</label>
            <input
              required
              type="date"
              value={dateArrivee}
              onChange={(e) => setDateArrivee(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Depart</label>
            <input
              required
              type="date"
              value={dateDepart}
              onChange={(e) => setDateDepart(e.target.value)}
              min={dateArrivee || new Date().toISOString().split("T")[0]}
              className="input"
            />
          </div>
        </div>

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