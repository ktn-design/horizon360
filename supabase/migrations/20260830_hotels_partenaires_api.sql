-- Table de connexion aux systemes PMS (Property Management System) des hotels partenaires
-- Structure seulement : la logique de synchronisation reelle viendra plus tard (voir lib/pmsAdapter.ts)
create table if not exists hotels_partenaires_api (
  id text primary key,
  hotel_id text not null references hotels(id) on delete cascade,
  nom_systeme_pms text,
  url_api text,
  cle_api text,
  actif boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists hotels_partenaires_api_hotel_id_idx on hotels_partenaires_api(hotel_id);
