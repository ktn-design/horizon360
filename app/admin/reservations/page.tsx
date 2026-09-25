"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToutesReservations, changerStatutReservation, supprimerReservation, Reservation } from "@/lib/store";
import { envoyerEmail } from "@/lib/email";

export default function ReservationsAdminPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [charge, setCharge] = useState(false);
  const [enCoursConfirmation, setEnCoursConfirmation] = useState<string | null>(null);

  useEffect(() => {
    async function charger() {
      const r = await getToutesReservations();
      setReservations(r);
      setCharge(true);
    }
    charger();
  }, [router]);

  function texteCreneauPeriode(r: Reservation) {
    if (r.creneau) {
      const labels: Record<string, string> = { matin: "Matin", apres_midi: "Apres-midi", journee: "Journee complete" };
      return "le " + r.dateDebut + " (" + (labels[r.creneau] || r.creneau) + ")";
    }
    return "du " + r.dateDebut + " au " + r.dateFin;
  }

  async function handleConfirmer(r: Reservation) {
    setEnCoursConfirmation(r.id);
    try {
      await fetch("/api/confirmer-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id }),
      });
    } catch (err) {
      alert("Erreur lors de la confirmation.");
    }
    setReservations(await getToutesReservations());
    setEnCoursConfirmation(null);
  }

  async function handleRefuser(r: Reservation) {
    await changerStatutReservation(r.id, "refusee");
    await envoyerEmail(
      r.emailClient,
      "Concernant votre reservation - Horizon 360",
      "<p>Bonjour " + r.nomClient + ",</p><p>Nous sommes desoles, votre demande de reservation " + texteCreneauPeriode(r) + " n'a pas pu etre confirmee.</p><p>N'hesitez pas a nous contacter pour choisir une autre disponibilite.</p><p>Horizon 360</p>"
    );
    setReservations(await getToutesReservations());
  }

  async function handleSupprimer(id: string) {
    if (confirm("Supprimer cette reservation ?")) {
      await supprimerReservation(id);
      setReservations(await getToutesReservations());
    }
  }

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Chargement...</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/admin/dashboard" className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour au tableau de bord
      </Link>

      <h1 className="mb-8 text-3xl font-bold">Reservations ({reservations.length})</h1>

      <div className="space-y-4">
        {reservations.map((r) => (
          <div key={r.id} className="rounded-xl bg-slate-800 p-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="mr-2 rounded-full bg-slate-700 px-3 py-1 text-xs uppercase">{r.typeBien}</span>
                <span className={
                  r.statut === "confirmee" ? "rounded-full bg-emerald-600 px-3 py-1 text-xs" :
                  r.statut === "refusee" ? "rounded-full bg-red-600 px-3 py-1 text-xs" :
                  "rounded-full bg-yellow-600 px-3 py-1 text-xs"
                }>
                  {r.statut === "en_attente" ? "En attente" : r.statut === "confirmee" ? "Confirmee" : "Refusee"}
                </span>
              </div>
              <div className="flex gap-2">
                {r.statut === "en_attente" && (
                  <>
                    <button
                      onClick={() => handleConfirmer(r)}
                      disabled={enCoursConfirmation === r.id}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {enCoursConfirmation === r.id ? "Confirmation..." : "Confirmer"}
                    </button>
                    <button onClick={() => handleRefuser(r)} className="rounded-lg bg-red-600 px-3 py-1 text-xs hover:bg-red-700">
                      Refuser
                    </button>
                  </>
                )}
                <button onClick={() => handleSupprimer(r.id)} className="rounded-lg bg-slate-700 px-3 py-1 text-xs hover:bg-slate-600">
                  Supprimer
                </button>
              </div>
            </div>

            <p className="font-semibold">{r.nomClient}</p>
            <p className="text-sm text-slate-400">{r.emailClient} - {r.telephoneClient}</p>
            <p className="mt-2 text-sm text-slate-300">
              Du {r.dateDebut} au {r.dateFin}
              {r.creneau && " - Creneau: " + (r.creneau === "matin" ? "Matin" : r.creneau === "apres_midi" ? "Apres-midi" : "Journee complete")}
            </p>
            {r.nombrePersonnes && <p className="mt-1 text-sm text-slate-300">{r.nombrePersonnes} personne(s)</p>}
            {r.extras && r.extras.length > 0 && (
              <p className="mt-1 text-sm text-slate-300">
                Extras : {r.extras.map((e) => e.nom + (e.quantite > 1 ? " x" + e.quantite : "") + " (" + e.total.toLocaleString("fr-CA") + " $)").join(", ")}
              </p>
            )}
            {r.montant != null && <p className="mt-1 text-sm font-semibold text-emerald-400">Total : {r.montant.toLocaleString("fr-CA")} $</p>}
            {r.message && <p className="mt-2 text-sm text-slate-400">Message : {r.message}</p>}
            <p className="mt-2 text-xs text-slate-500">ID du bien : {r.bienId}</p>
          </div>
        ))}
      </div>

      {reservations.length === 0 && <p className="text-slate-400">Aucune reservation pour l'instant.</p>}
    </main>
  );
}