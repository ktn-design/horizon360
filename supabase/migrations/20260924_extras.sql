-- Extras payants (petit-dejeuner, kayak, traiteur, decoration...) geres par l'admin
-- pour chaque hotel et chaque salle, et memorises dans chaque reservation.
--
-- Format d'un extra (hotels.extras / salles.extras) :
--   { "id": "...", "nom": "Petit-dejeuner", "prix": 25, "facturation": "par_personne_par_nuit" }
--   facturation : forfait | par_nuit | par_personne | par_personne_par_nuit
--
-- reservations.extras garde une copie des extras choisis AU MOMENT de la reservation
-- (nom, prix unitaire, total), pour que l'historique reste juste si l'admin change ses prix.

alter table hotels
  add column if not exists extras jsonb not null default '[]'::jsonb;

alter table salles
  add column if not exists extras jsonb not null default '[]'::jsonb;

alter table reservations
  add column if not exists extras jsonb not null default '[]'::jsonb,
  add column if not exists nombre_personnes integer;
