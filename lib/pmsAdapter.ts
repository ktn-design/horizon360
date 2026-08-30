import { HotelPartenaireApi, Reservation } from "./store";

export interface DisponibiliteExterne {
  disponible: boolean;
  prix?: number;
}

export interface ReservationExterneResultat {
  succes: boolean;
  referenceExterne?: string;
  erreur?: string;
}

export async function verifierDisponibiliteExterne(
  config: HotelPartenaireApi,
  dateDebut: string,
  dateFin: string
): Promise<DisponibiliteExterne> {
  throw new Error("Non implemente : en attente de la documentation technique du PMS partenaire (" + config.nomSystemePms + ").");
}

export async function envoyerReservationExterne(
  config: HotelPartenaireApi,
  reservation: Reservation
): Promise<ReservationExterneResultat> {
  throw new Error("Non implemente : en attente de la documentation technique du PMS partenaire (" + config.nomSystemePms + ").");
}
