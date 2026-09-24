import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripeServeur";
import { getHotelParId, getSalleParId, getChambreParId, getReservationsParBien } from "@/lib/store";
import { periodeHotelDisponible, creneauSalleDisponible } from "@/lib/disponibilite";
import { calculerExtras, extraParPersonne, lireExtrasIds, lireNombrePersonnes, nombreNuits, ExtraChoisi } from "@/lib/prix";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { typeBien, bienId, chambreId, nomClient, emailClient, telephoneClient, dateDebut, dateFin, creneau, message } = body;

    if (!typeBien || !bienId || !nomClient || !emailClient || !telephoneClient || !dateDebut || !dateFin) {
      return NextResponse.json({ erreur: "Champs manquants." }, { status: 400 });
    }

    let montant = 0;
    let nomLigne = "";
    let lignesExtras: ExtraChoisi[] = [];
    const extrasIds = lireExtrasIds(body.extrasIds);
    const nombrePersonnes = lireNombrePersonnes(body.nombrePersonnes);

    if (typeBien === "hotel") {
      const hotel = await getHotelParId(bienId);
      if (!hotel) return NextResponse.json({ erreur: "Hotel introuvable." }, { status: 400 });

      if (dateFin <= dateDebut) {
        return NextResponse.json({ erreur: "La date de depart doit etre apres la date d'arrivee." }, { status: 400 });
      }
      const nuits = nombreNuits(dateDebut, dateFin);

      const chambre = chambreId ? await getChambreParId(chambreId) : undefined;
      const prixNuit = chambre ? chambre.prixParNuit : hotel.prixParNuit;
      montant = nuits * prixNuit;
      nomLigne = chambre ? hotel.titre + " - " + chambre.nom : hotel.titre;
      lignesExtras = calculerExtras(hotel.extras || [], extrasIds, nuits, nombrePersonnes).lignes;

      const reservationsExistantes = await getReservationsParBien(bienId);
      if (!periodeHotelDisponible(reservationsExistantes, chambreId || undefined, dateDebut, dateFin)) {
        return NextResponse.json({ erreur: "Ces dates ne sont plus disponibles." }, { status: 409 });
      }
    } else if (typeBien === "salle") {
      const salle = await getSalleParId(bienId);
      if (!salle) return NextResponse.json({ erreur: "Salle introuvable." }, { status: 400 });
      if (!creneau) return NextResponse.json({ erreur: "Creneau manquant." }, { status: 400 });

      montant = salle.prix;
      nomLigne = salle.titre;
      lignesExtras = calculerExtras(salle.extras || [], extrasIds, 1, nombrePersonnes).lignes;

      const reservationsExistantes = await getReservationsParBien(bienId);
      if (!creneauSalleDisponible(reservationsExistantes, dateDebut, creneau)) {
        return NextResponse.json({ erreur: "Ce creneau n'est plus disponible." }, { status: 409 });
      }
    } else {
      return NextResponse.json({ erreur: "Type de bien invalide." }, { status: 400 });
    }

    if (!montant || montant <= 0) {
      return NextResponse.json({ erreur: "Montant invalide." }, { status: 400 });
    }

    const montantBien = montant;
    montant += lignesExtras.reduce((somme, l) => somme + l.total, 0);

    const origine = new URL(request.url).origin;
    const retourAnnulation = typeBien === "hotel" ? "/hotels/" + bienId : "/salles/" + bienId;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: emailClient,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: nomLigne },
            unit_amount: Math.round(montantBien * 100),
          },
          quantity: 1,
        },
        ...lignesExtras.map((l) => ({
          price_data: {
            currency: "usd",
            product_data: { name: l.nom },
            unit_amount: Math.round(l.prix * 100),
          },
          quantity: l.quantite,
        })),
      ],
      metadata: {
        typeBien,
        bienId,
        chambreId: chambreId || "",
        nomClient,
        emailClient,
        telephoneClient,
        dateDebut,
        dateFin,
        creneau: creneau || "",
        message: message || "",
        montant: String(montant),
        extrasIds: lignesExtras.map((l) => l.id).join(","),
        nombrePersonnes: lignesExtras.some(extraParPersonne) ? String(nombrePersonnes) : "",
      },
      success_url: origine + "/reservation/confirmation?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: origine + retourAnnulation,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ erreur: String(error) }, { status: 500 });
  }
}
