"use client";

import { useEffect, useState } from "react";
import { creerReservation, getReservationsParBien, getChambresParHotel, getChambreParId, getHotelParId, Reservation, ChambreHotel } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { periodeHotelDisponible } from "@/lib/disponibilite";
import ModalConnexion from "./ModalConnexion";

interface ReservationHotelProps {
  hotelId: string;
  // Si fourni, la reservation cible directement cette chambre (pas de selecteur affiche) -
  // utilise depuis la fiche detaillee d'une chambre.
  chambreIdFixe?: string;
}

export default function ReservationHotel({ hotelId, chambreIdFixe }: ReservationHotelProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [afficherConnexion, setAfficherConnexion] = useState(false);
  const [dateArrivee, setDateArrivee] = useState("");
  const [dateDepart, setDateDepart] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [message, setMessage] = useState("");
  const [reservationsExistantes, setReservationsExistantes] = useState<Reservation[]>([]);
  const [chambres, setChambres] = useState<ChambreHotel[]>([]);
  const [chambreId, setChambreId] = useState(chambreIdFixe || "");
  const [prixParNuitHotel, setPrixParNuitHotel] = useState(0);
  const [modePaiement, setModePaiement] = useState<"carte" | "sur_place">("carte");
  const [envoye, setEnvoye] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    async function charger() {
      if (chambreIdFixe) {
        const [res, chambre] = await Promise.all([getReservationsParBien(hotelId), getChambreParId(chambreIdFixe)]);
        setReservationsExistantes(res);
        setChambres(chambre ? [chambre] : []);
        setChambreId(chambreIdFixe);
        return;
      }
      const [res, chs, hotel] = await Promise.all([
        getReservationsParBien(hotelId),
        getChambresParHotel(hotelId),
        getHotelParId(hotelId),
      ]);
      setReservationsExistantes(res);
      setChambres(chs.filter((c) => c.statut === "disponible"));
      setPrixParNuitHotel(hotel?.prixParNuit || 0);
    }
    charger();
  }, [hotelId, chambreIdFixe]);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const cleSauvegarde = "resa_form_hotel_" + hotelId + (chambreIdFixe ? "_" + chambreIdFixe : "");

  // Restaure le formulaire si l'utilisateur revient sur la page (ex: apres une connexion Google,
  // qui recharge completement le navigateur et effacerait sinon tout ce qui a ete tape).
  useEffect(() => {
    try {
      const sauvegarde = sessionStorage.getItem(cleSauvegarde);
      if (!sauvegarde) return;
      const d = JSON.parse(sauvegarde);
      if (d.dateArrivee) setDateArrivee(d.dateArrivee);
      if (d.dateDepart) setDateDepart(d.dateDepart);
      if (d.nom) setNom(d.nom);
      if (d.telephone) setTelephone(d.telephone);
      if (d.message) setMessage(d.message);
      if (d.chambreId && !chambreIdFixe) setChambreId(d.chambreId);
      if (d.modePaiement) setModePaiement(d.modePaiement);
    } catch {
      // sessionStorage indisponible ou donnees corrompues : pas grave, on repart d'un formulaire vide
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleSauvegarde]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        cleSauvegarde,
        JSON.stringify({ dateArrivee, dateDepart, nom, telephone, message, chambreId, modePaiement })
      );
    } catch {
      // pas grave si sessionStorage n'est pas disponible (navigation privee, etc.)
    }
  }, [cleSauvegarde, dateArrivee, dateDepart, nom, telephone, message, chambreId, modePaiement]);

  const chambreSelectionnee = chambres.find((c) => c.id === chambreId);
  const prixParNuit = chambreSelectionnee ? chambreSelectionnee.prixParNuit : prixParNuitHotel;
  const nuits =
    dateArrivee && dateDepart && dateDepart > dateArrivee
      ? Math.round((new Date(dateDepart).getTime() - new Date(dateArrivee).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
  const montant = nuits * prixParNuit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    if (!user) {
      setAfficherConnexion(true);
      return;
    }

    if (!dateArrivee || !dateDepart) {
      setErreur(t("resa_choisir_dates"));
      return;
    }
    if (dateDepart <= dateArrivee) {
      setErreur(t("resa_depart_apres_arrivee"));
      return;
    }
    if (chambres.length > 0 && !chambreId) {
      setErreur(t("resa_choisir_chambre_requis"));
      return;
    }

    const disponible = periodeHotelDisponible(reservationsExistantes, chambreId || undefined, dateArrivee, dateDepart);
    if (!disponible) {
      setErreur(t("resa_dates_indisponibles"));
      return;
    }

    setEnCours(true);

    if (modePaiement === "carte") {
      try {
        const reponse = await fetch("/api/creer-paiement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            typeBien: "hotel",
            bienId: hotelId,
            chambreId: chambreId || undefined,
            nomClient: nom,
            emailClient: email,
            telephoneClient: telephone,
            dateDebut: dateArrivee,
            dateFin: dateDepart,
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
        typeBien: "hotel",
        bienId: hotelId,
        chambreId: chambreId || undefined,
        nomClient: nom,
        emailClient: email,
        telephoneClient: telephone,
        dateDebut: dateArrivee,
        dateFin: dateDepart,
        message,
        montant,
      });
      setEnvoye(true);
      try {
        sessionStorage.removeItem(cleSauvegarde);
      } catch {}
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
      <h3 className="mb-4 text-lg font-semibold">{t("resa_titre_hotel")}</h3>

      {!user && (
        <p className="mb-4 rounded-lg bg-slate-700 p-3 text-sm text-slate-300">
          {t("resa_connexion_requise")}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-slate-300">{t("resa_arrivee")}</label>
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
            <label className="mb-1 block text-sm text-slate-300">{t("resa_depart")}</label>
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

        {!chambreIdFixe && chambres.length > 0 && (
          <div>
            <label className="mb-1 block text-sm text-slate-300">{t("resa_choisir_chambre")}</label>
            <select required value={chambreId} onChange={(e) => setChambreId(e.target.value)} className="input">
              <option value="">{t("resa_chambre_selectionner")}</option>
              {chambres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} — {c.prixParNuit.toLocaleString("fr-CA")} $/nuit
                </option>
              ))}
            </select>
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

        {montant > 0 && (
          <p className="text-sm text-slate-300">
            {t("resa_prix_total")} : <span className="font-bold text-emerald-400">{montant.toLocaleString("fr-CA")} $</span>
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
            : t("resa_titre_hotel")}
        </button>
      </form>

      {afficherConnexion && <ModalConnexion onFerme={() => setAfficherConnexion(false)} />}
    </div>
  );
}
