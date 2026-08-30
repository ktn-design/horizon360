-- Ajoute les nouveaux details de chambre d'hotel : type de lit, suite, salles de bain, climatisation
alter table chambres
  add column if not exists type_lit text default '',
  add column if not exists est_suite boolean not null default false,
  add column if not exists salles_de_bain integer not null default 1,
  add column if not exists climatisation boolean not null default false;
