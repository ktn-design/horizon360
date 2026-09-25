-- =====================================================================
-- Horizon 360 : administrateur principal, administrateurs secondaires,
-- permissions par section et journal des actions
-- =====================================================================
-- A coller tel quel dans Supabase > SQL Editor, puis "Run", APRES
-- 20260925_chambres_options.sql. Script idempotent (peut etre relance).
--
-- Roles :
--   principal  : tous les droits, en permanence (ne peut pas etre gele ni supprime
--                depuis le site).
--   secondaire : uniquement les sections recues parmi
--                'hotels', 'chambres', 'salles', 'maisons'.
--   Un compte gele (actif = false) n'a plus AUCUN droit, meme avec une session ouverte.
--
-- Les droits sont verifies ICI, dans la base (RLS) : meme en contournant l'interface,
-- un admin secondaire ne peut pas modifier une section qui ne lui est pas attribuee.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Comptes administrateurs
-- ---------------------------------------------------------------------
create table if not exists public.admin_comptes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'secondaire' check (role in ('principal', 'secondaire')),
  permissions text[] not null default '{}'
    check (permissions <@ array['hotels', 'chambres', 'salles', 'maisons']::text[]),
  actif boolean not null default true,
  cree_par uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_comptes enable row level security;

-- L'administrateur principal = le(s) compte(s) deja listes dans l'ancienne table
-- public.admins (script fix_rls.sql), sinon tnteranya@gmail.com.
do $$
begin
  if to_regclass('public.admins') is not null then
    insert into public.admin_comptes (user_id, email, role, permissions, actif)
    select u.id, lower(u.email), 'principal', array['hotels', 'chambres', 'salles', 'maisons'], true
    from auth.users u
    join public.admins a on lower(a.email) = lower(u.email)
    on conflict (user_id) do update set role = 'principal', actif = true;
  end if;

  insert into public.admin_comptes (user_id, email, role, permissions, actif)
  select u.id, lower(u.email), 'principal', array['hotels', 'chambres', 'salles', 'maisons'], true
  from auth.users u
  where lower(u.email) = 'tnteranya@gmail.com'
  on conflict (user_id) do update set role = 'principal', actif = true;

  if not exists (select 1 from public.admin_comptes where role = 'principal') then
    raise exception 'Aucun compte administrateur principal trouve dans auth.users. Verifiez l''email dans ce script.';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. Fonctions de controle des droits
-- ---------------------------------------------------------------------
-- security definer : elles lisent admin_comptes meme si la table est protegee.

create or replace function public.est_admin_principal()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.admin_comptes
    where user_id = auth.uid() and role = 'principal' and actif
  );
$$;

-- Ancienne fonction (utilisee par les policies des reservations, messages, visites,
-- connexions PMS) : desormais reservee a l'administrateur principal.
create or replace function public.est_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.est_admin_principal();
$$;

-- Vrai si l'admin connecte (actif) a le droit de gerer la section demandee.
create or replace function public.a_permission(section text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.admin_comptes
    where user_id = auth.uid() and actif
      and (role = 'principal' or section = any(permissions))
  );
$$;

-- Profil de l'admin connecte (utilise par le site et par le controle serveur des pages
-- /admin). Ne renvoie rien si l'utilisateur n'est pas administrateur.
create or replace function public.mon_profil_admin()
returns table (user_id uuid, email text, role text, permissions text[], actif boolean)
language sql stable security definer set search_path = public
as $$
  select c.user_id, c.email, c.role, c.permissions, c.actif
  from public.admin_comptes c
  where c.user_id = auth.uid();
$$;

revoke all on function public.mon_profil_admin() from public;
grant execute on function public.mon_profil_admin() to authenticated;

-- Lecture des comptes : le principal voit tout, chacun voit sa propre ligne.
-- Aucune ecriture depuis le site : creation, gel, permissions et suppression passent
-- par les routes serveur /api/admin/* (cle service_role) qui verifient le role.
drop policy if exists "Lecture des comptes admin" on public.admin_comptes;
create policy "Lecture des comptes admin" on public.admin_comptes
  for select to authenticated
  using (user_id = auth.uid() or public.est_admin_principal());

-- ---------------------------------------------------------------------
-- 3. Catalogue : lecture publique, ecriture selon la section attribuee
-- ---------------------------------------------------------------------
do $$
declare
  regle record;
  p record;
begin
  for regle in
    select * from (values
      ('hotels', 'hotels'),
      ('chambres', 'chambres'),
      ('hotels_partenaires_api', 'hotels'),
      ('salles', 'salles'),
      ('maisons', 'maisons'),
      ('societes', 'maisons'),
      ('immeubles', 'maisons'),
      ('parametres_site', 'principal')
    ) as t(nom_table, section)
  loop
    if to_regclass('public.' || regle.nom_table) is null then
      continue;
    end if;

    for p in select policyname from pg_policies where schemaname = 'public' and tablename = regle.nom_table loop
      execute format('drop policy %I on public.%I', p.policyname, regle.nom_table);
    end loop;

    execute format('alter table public.%I enable row level security', regle.nom_table);

    if regle.nom_table = 'hotels_partenaires_api' then
      -- contient des cles API : pas de lecture publique
      execute format(
        'create policy "Gestion par admin autorise" on public.%I for all to authenticated using (public.a_permission(%L)) with check (public.a_permission(%L))',
        regle.nom_table, regle.section, regle.section);
      continue;
    end if;

    execute format('create policy "Lecture publique" on public.%I for select using (true)', regle.nom_table);

    if regle.section = 'principal' then
      execute format('create policy "Ajout admin" on public.%I for insert to authenticated with check (public.est_admin_principal())', regle.nom_table);
      execute format('create policy "Modification admin" on public.%I for update to authenticated using (public.est_admin_principal()) with check (public.est_admin_principal())', regle.nom_table);
      execute format('create policy "Suppression admin" on public.%I for delete to authenticated using (public.est_admin_principal())', regle.nom_table);
    else
      execute format('create policy "Ajout admin" on public.%I for insert to authenticated with check (public.a_permission(%L))', regle.nom_table, regle.section);
      execute format('create policy "Modification admin" on public.%I for update to authenticated using (public.a_permission(%L)) with check (public.a_permission(%L))', regle.nom_table, regle.section, regle.section);
      execute format('create policy "Suppression admin" on public.%I for delete to authenticated using (public.a_permission(%L))', regle.nom_table, regle.section);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4. Photos (Supabase Storage, espace "photos")
-- ---------------------------------------------------------------------
-- Envoi et suppression de photos : n'importe quel admin actif (principal ou secondaire).
-- Les anciennes regles de l'espace "photos" ne sont pas touchees.
drop policy if exists "Admins envoient des photos" on storage.objects;
create policy "Admins envoient des photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and exists (select 1 from public.mon_profil_admin() m where m.actif));

-- ---------------------------------------------------------------------
-- 5. Journal des actions
-- ---------------------------------------------------------------------
create table if not exists public.journal_admin (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  auteur_id uuid,
  auteur_email text,
  action text not null,          -- creation | modification | suppression | ...
  cible_type text not null,      -- hotel | chambre | salle | maison | admin ...
  cible_id text,
  cible_nom text,
  details jsonb
);

alter table public.journal_admin enable row level security;

drop policy if exists "Lecture du journal par le principal" on public.journal_admin;
create policy "Lecture du journal par le principal" on public.journal_admin
  for select to authenticated
  using (public.est_admin_principal());

create index if not exists journal_admin_created_at_idx on public.journal_admin (created_at desc);

-- Ecrit automatiquement une ligne a chaque ajout / modification / suppression
-- dans le catalogue, quel que soit le chemin utilise.
create or replace function public.journaliser_modification()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  ligne jsonb;
  auteur_email text;
begin
  ligne := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  select email into auteur_email from public.admin_comptes where user_id = auth.uid();

  insert into public.journal_admin (auteur_id, auteur_email, action, cible_type, cible_id, cible_nom)
  values (
    auth.uid(),
    coalesce(auteur_email, auth.jwt() ->> 'email', 'systeme'),
    case tg_op when 'INSERT' then 'creation' when 'UPDATE' then 'modification' else 'suppression' end,
    tg_argv[0],
    ligne ->> 'id',
    coalesce(ligne ->> 'titre', ligne ->> 'nom')
  );
  return null;
end;
$$;

do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('hotels', 'hotel'), ('chambres', 'chambre'), ('salles', 'salle'), ('maisons', 'maison'),
      ('societes', 'societe'), ('immeubles', 'immeuble'), ('parametres_site', 'parametres')
    ) as v(nom_table, libelle)
  loop
    if to_regclass('public.' || t.nom_table) is null then
      continue;
    end if;
    execute format('drop trigger if exists journal_admin on public.%I', t.nom_table);
    execute format(
      'create trigger journal_admin after insert or update or delete on public.%I for each row execute function public.journaliser_modification(%L)',
      t.nom_table, t.libelle);
  end loop;
end $$;

commit;

notify pgrst, 'reload schema';

-- Verification : doit afficher votre compte avec role = principal.
select email, role, permissions, actif from public.admin_comptes order by role, email;
