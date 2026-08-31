"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { getReservationsParEmail, getHotelParId, getSalleParId, getChambreParId, Reservation } from "@/lib/store";

interface ReservationAffichee extends Reservation {
  nomBien: string;
  nomChambre?: string;
}

export default function MonComptePage() {
  const { user, chargement } = useAuth();
  const { t } = useLanguage();
  const [reservations, setReservations] = useState<ReservationAffichee[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    async function charger() {
      if (!user?.email) {
        setCharge(true);
        return;
      }
      const brutes = await getReservationsParEmail(user.email);
      const enrichies = await Promise.all(
        brutes.map(async (r) => {
          let nomBien = "";
          let nomChambre: string | undefined;
          if (r.typeBien === "hotel") {
            const hotel = await getHotelParId(r.bienId);
            nomBien = hotel?.titre || "Hotel";
            if (r.chambreId) {
              const chambre = await getChambreParId(r.chambreId);
              nomChambre = chambre?.nom;
            }
          } else {
            const salle = await getSalleParId(r.bienId);
            nomBien = salle?.titre || "Salle";
          }
          return { ...r, nomBien, nomChambre };
        })
      );
      setReservations(enrichies);
      setCharge(true);
    }
    if (!chargement) charger();
  }, [user, chargement]);

  function texteCreneauPeriode(r: Reservation) {
    if (r.creneau) {
      const labels: Record<string, string> = { matin: "Matin", apres_midi: "Apres-midi", journee: "Journee complete" };
      return "le " + r.dateDebut + " (" + (labels[r.creneau] || r.creneau) + ")";
    }
    return "du " + r.dateDebut + " au " + r.dateFin;
  }

  function classeStatut(statut: string) {
    if (statut === "confirmee") return "rounded-full bg-emerald-600 px-3 py-1 text-xs";
    if (statut === "refusee") return "rounded-full bg-red-600 px-3 py-1 text-xs";
    return "rounded-full bg-yellow-600 px-3 py-1 text-xs";
  }

  function libelleStatut(statut: string) {
    if (statut === "confirmee") return t("compte_statut_confirmee");
    if (statut === "refusee") return t("compte_statut_refusee");
    return t("compte_statut_en_attente");
  }

  if (chargement || !charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">{t("chargement")}</main>;

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
        <p className="rounded-lg bg-slate-800 p-6 text-slate-300">{t("compte_connexion_requise")}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <h1 className="mb-8 text-3xl font-bold">{t("compte_titre")}</h1>

      <div className="space-y-4">
        {reservations.map((r) => (
          <div key={r.id} className="rounded-xl bg-slate-800 p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-slate-700 px-3 py-1 text-xs uppercase">{r.typeBien}</span>
              <span className={classeStatut(r.statut)}>{libelleStatut(r.statut)}</span>
            </div>
            <p className="font-semibold">
              {r.nomBien}
              {r.nomChambre ? " — " + r.nomChambre : ""}
            </p>
            <p className="mt-2 text-sm text-slate-300">{texteCreneauPeriode(r)}</p>
            {r.montant != null && (
              <p className="mt-1 text-sm font-semibold text-emerald-400">{r.montant.toLocaleString("fr-CA")} $</p>
            )}
          </div>
        ))}
      </div>

      {reservations.length === 0 && <p className="text-slate-400">{t("compte_aucune_reservation")}</p>}
    </main>
  );
}
