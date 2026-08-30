-- Ajoute le support du paiement Stripe et des reservations liees a une chambre precise
alter table reservations
  add column if not exists chambre_id text,
  add column if not exists montant numeric,
  add column if not exists stripe_session_id text;

-- Empeche qu'un meme paiement Stripe cree deux reservations en double
-- (evenement webhook recu plusieurs fois). Les reservations "payer sur place"
-- (stripe_session_id vide) ne sont pas concernees par cette contrainte.
create unique index if not exists reservations_stripe_session_id_unique
  on reservations(stripe_session_id) where stripe_session_id is not null;
