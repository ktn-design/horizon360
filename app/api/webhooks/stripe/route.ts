import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripeServeur";
import { creerReservationPayee, getReservationsParBien, getReservationParStripeSessionId } from "@/lib/store";
import { periodeHotelDisponible, creneauSalleDisponible } from "@/lib/disponibilite";

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
    });
  } catch (err) {
    // Deux webhooks arrives en meme temps (rare) : la contrainte unique en base a bloque le doublon, ce n'est pas une erreur.
    if (String(err).includes("duplicate key")) {
      return NextResponse.json({ recu: true, dejaTraite: true });
    }
    throw err;
  }

  return NextResponse.json({ recu: true });
}
