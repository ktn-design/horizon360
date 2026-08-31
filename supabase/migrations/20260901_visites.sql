-- Statistiques de visite du site (donnees agregees uniquement affichees en admin)
create table if not exists visites (
  id text primary key,
  page text not null,
  pays text,
  ville text,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists visites_created_at_idx on visites(created_at);

alter table visites enable row level security;

create policy "Inscription publique des visites" on visites
  for insert to anon with check (true);

create policy "Lecture publique des visites" on visites
  for select to anon using (true);
