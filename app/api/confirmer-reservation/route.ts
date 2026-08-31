import { NextResponse } from "next/server";
import { changerStatutReservation, getReservationParId } from "@/lib/store";
import { envoyerConfirmationReservation } from "@/lib/confirmation";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ erreur: "id manquant." }, { status: 400 });

    await changerStatutReservation(id, "confirmee");

    const reservation = await getReservationParId(id);
    if (!reservation) return NextResponse.json({ erreur: "Reservation introuvable." }, { status: 404 });

    const origine = new URL(request.url).origin;
    await envoyerConfirmationReservation(reservation, false, origine);

    return NextResponse.json({ succes: true });
  } catch (error) {
    return NextResponse.json({ erreur: String(error) }, { status: 500 });
  }
}
