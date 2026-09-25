import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripeServeur";
import { creerReservationPayee, getReservationsParBien, getReservationParStripeSessionId, getChambreParId, getSalleParId } from "@/lib/store";
import { calculerExtras, lireNombrePersonnes, nombreNuits, ExtraChoisi } from "@/lib/prix";
import { periodeHotelDisponible, creneauSalleDisponible } from "@/lib/disponibilite";
import { envoyerConfirmationReservation } from "@/lib/confirmation";

export async function POST(request: Request) {
  const corpsBrut = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(corpsBrut, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ erreur: "Signature invalide : " + String(err) }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ recu: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const m = session.metadata;
  if (!m) return NextResponse.json({ recu: true });

  // Evenement deja traite (Stripe peut le renvoyer plusieurs fois) : on ne cree pas de doublon.
  const dejaTraite = await getReservationParStripeSessionId(session.id);
  if (dejaTraite) {
    return NextResponse.json({ recu: true, dejaTraite: true });
  }

  const typeBien = m.typeBien as "hotel" | "salle";
  const bienId = m.bienId;
  const chambreId = m.chambreId || undefined;
  const dateDebut = m.dateDebut;
  const dateFin = m.dateFin;
  const creneau = m.creneau || undefined;
  const montant = Number(m.montant);

  const reservationsExistantes = await getReservationsParBien(bienId);
  const disponible =
    typeBien === "hotel"
      ? periodeHotelDisponible(reservationsExistantes, chambreId, dateDebut, dateFin)
      : creneauSalleDisponible(reservationsExistantes, dateDebut, creneau || "");

  if (!disponible) {
    // Quelqu'un d'autre a confirme la meme periode entre le paiement et ce webhook (cas rare).
    // On rembourse automatiquement et on ne cree pas de reservation en double.
    if (typeof session.payment_intent === "string") {
      await stripe.refunds.create({ payment_intent: session.payment_intent });
    }
    console.error("Conflit de disponibilite detecte apres paiement, remboursement effectue :", bienId, dateDebut, dateFin);
    return NextResponse.json({ recu: true, rembourse: true });
  }

  // Detail des extras payes, recalcule avec les tarifs de l'admin (le montant paye, lui,
  // vient de la session Stripe via m.montant).
  const extrasIds = (m.extrasIds || "").split(",").filter(Boolean);
  const nombrePersonnes = m.nombrePersonnes ? lireNombrePersonnes(m.nombrePersonnes) : undefined;
  let extras: ExtraChoisi[] | undefined;
  if (extrasIds.length > 0) {
    // Hotel : les options sont celles de la chambre reservee.
    const bien = typeBien === "hotel" ? (chambreId ? await getChambreParId(chambreId) : undefined) : await getSalleParId(bienId);
    const nuits = typeBien === "hotel" ? nombreNuits(dateDebut, dateFin) : 1;
    extras = calculerExtras(bien?.extras || [], extrasIds, nuits, nombrePersonnes || 1).lignes;
  }

  try {
    await creerReservationPayee({
      typeBien,
      bienId,
      chambreId,
      nomClient: m.nomClient,
      emailClient: m.emailClient,
      telephoneClient: m.telephoneClient,
      dateDebut,
      dateFin,
      creneau,
      message: m.message || "",
      montant,
      stripeSessionId: session.id,
      extras,
      nombrePersonnes,
    });
  } catch (err) {
    // Deux webhooks arrives en meme temps (rare) : la contrainte unique en base a bloque le doublon, ce n'est pas une erreur.
    if (String(err).includes("duplicate key")) {
      return NextResponse.json({ recu: true, dejaTraite: true });
    }
    throw err;
  }

  const reservationCreee = await getReservationParStripeSessionId(session.id);
  if (reservationCreee) {
    const origine = new URL(request.url).origin;
    try {
      await envoyerConfirmationReservation(reservationCreee, true, origine);
    } catch (err) {
      // La reservation est deja confirmee et payee : une erreur d'envoi d'email ne doit pas
      // faire echouer le webhook (Stripe le reessaierait et pourrait recreer une reservation).
      console.error("Erreur envoi email de confirmation :", err);
    }
  }

  return NextResponse.json({ recu: true });
}
