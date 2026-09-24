import { Reservation, getHotelParId, getSalleParId, getChambreParId } from "./store";
import { genererPdfConfirmation } from "./pdf";
import { envoyerEmailAvecPieceJointe } from "./resendServeur";

function libelleTypeLit(typeLit: string): string {
  if (typeLit === "queen") return "Queen size";
  if (typeLit === "king") return "King size";
  if (typeLit === "jumeaux") return "Lits jumeaux";
  return "";
}

function libelleCreneau(creneau: string): string {
  if (creneau === "matin") return "Matin";
  if (creneau === "apres_midi") return "Apres-midi";
  if (creneau === "journee") return "Journee complete";
  return creneau;
}

async function recupererLogo(origine: string): Promise<Buffer | undefined> {
  try {
    const reponse = await fetch(origine + "/logo-horizon360-icone.png");
    if (!reponse.ok) return undefined;
    const arrayBuffer = await reponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return undefined;
  }
}

// Construit le PDF de confirmation et l'envoie par email au client, pour une reservation
// hotel ou salle deja "confirmee" - que ce soit via le paiement Stripe ou une confirmation
// manuelle par l'admin (payer sur place).
export async function envoyerConfirmationReservation(reservation: Reservation, payeEnLigne: boolean, origine: string) {
  let nomBien = "";
  let nomChambre: string | undefined;
  let typeLit: string | undefined;
  let capaciteChambre: number | undefined;
  let estSuite: boolean | undefined;
  const commodites: string[] = [];
  let periode = "";

  if (reservation.typeBien === "hotel") {
    const hotel = await getHotelParId(reservation.bienId);
    nomBien = hotel?.titre || "Hotel";

    let climatisation = hotel?.climatisation;
    if (reservation.chambreId) {
      const chambre = await getChambreParId(reservation.chambreId);
      if (chambre) {
        nomChambre = chambre.nom;
        if (chambre.typeLit) typeLit = libelleTypeLit(chambre.typeLit);
        capaciteChambre = chambre.capacite;
        estSuite = chambre.estSuite;
        climatisation = chambre.climatisation;
      }
    }

    if (hotel?.wifi) commodites.push("Wifi");
    if (hotel?.piscine) commodites.push("Acces piscine");
    if (hotel?.petitDejeunerInclus) commodites.push("Petit-dejeuner inclus");
    if (climatisation) commodites.push("Climatisation");

    periode = "Check-in : " + reservation.dateDebut + "  |  Check-out : " + reservation.dateFin;
  } else {
    const salle = await getSalleParId(reservation.bienId);
    nomBien = salle?.titre || "Salle";

    if (salle?.wifi) commodites.push("Wifi");
    if (salle?.climatisation) commodites.push("Climatisation");
    if (salle?.sonorisation) commodites.push("Sonorisation");
    if (salle?.eclairageEvenementiel) commodites.push("Eclairage evenementiel");
    if (salle?.cuisine) commodites.push("Cuisine");
    if (salle?.parking) commodites.push("Parking");

    periode = "Date : " + reservation.dateDebut + (reservation.creneau ? "  |  Creneau : " + libelleCreneau(reservation.creneau) : "");
  }

  const logoBuffer = await recupererLogo(origine);

  const pdfBuffer = await genererPdfConfirmation({
    numeroConfirmation: reservation.id,
    nomClient: reservation.nomClient,
    emailClient: reservation.emailClient,
    telephoneClient: reservation.telephoneClient,
    nomBien,
    nomChambre,
    typeLit,
    capaciteChambre,
    estSuite,
    commodites,
    dateReservation: new Date(),
    periode,
    montant: reservation.montant || 0,
    extras: reservation.extras,
    nombrePersonnes: reservation.nombrePersonnes,
    payeEnLigne,
    logoBuffer,
  });

  await envoyerEmailAvecPieceJointe({
    destinataire: reservation.emailClient,
    sujet: "Confirmation de votre reservation - Horizon 360",
    contenu:
      "<p>Bonjour " + reservation.nomClient + ",</p>" +
      "<p>Ta reservation pour <strong>" + nomBien + (nomChambre ? " - " + nomChambre : "") + "</strong> est confirmee.</p>" +
      "<p>Tu trouveras ton recu et tous les details en piece jointe (PDF).</p>" +
      "<p>Merci de ta confiance.</p><p>Horizon 360</p>",
    piecesJointes: [{ nomFichier: "confirmation-" + reservation.id + ".pdf", contenu: pdfBuffer }],
  });
}
