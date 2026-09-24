-- =====================================================================
-- Horizon 360 : activation du Row-Level Security (RLS) sur le schema public
-- =====================================================================
-- A coller tel quel dans Supabase > SQL Editor, puis "Run".
--
-- AVANT DE LANCER : remplacer l'email admin a l'etape 1 (ligne marquee >>>).
-- Si l'email n'est pas remplace, le script s'arrete et n'applique RIEN
-- (tout est dans une seule transaction).
--
-- Contexte important (voir explications fournies avec ce script) :
-- le site n'utilise QUE la cle publique (anon/publishable), y compris dans les
-- routes serveur (/api/webhooks/stripe, /api/confirmer-reservation,
-- /api/creer-paiement, /api/enregistrer-visite). Ces routes parlent donc a la
-- base avec le role "anon". La section "TEMPORAIRE" de la table reservations
-- existe uniquement pour ne pas les casser ; elle pourra etre supprimee le jour
-- ou ces routes utiliseront la cle service_role (cote serveur seulement).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Liste des administrateurs + fonction est_admin()
-- ---------------------------------------------------------------------
-- La connexion admin (/admin) et la connexion client (Google / email) utilisent
-- le MEME systeme Supabase Auth : "etre connecte" ne suffit donc pas a etre admin.
-- L'admin est reconnu par son email, liste dans cette table.

create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);

-- RLS active sans aucune policy : table invisible et non modifiable depuis le site.
alter table public.admins enable row level security;

-- >>> REMPLACER par l'email du compte utilise pour se connecter sur /admin
insert into public.admins (email) values ('tnteranya@gmail.com')
on conflict (email) do nothing;
-- Pour plusieurs admins, ajouter d'autres lignes :
-- insert into public.admins (email) values ('autre.admin@exemple.com') on conflict do nothing;

do $$
begin
  if exists (select 1 from public.admins where email = 'REMPLACER_PAR_EMAIL_ADMIN@exemple.com') then
    raise exception 'Remplace REMPLACER_PAR_EMAIL_ADMIN@exemple.com par ton vrai email admin avant de lancer le script.';
  end if;
end $$;

-- Vrai si l'utilisateur connecte (jeton JWT) a un email present dans public.admins.
-- security definer : peut lire la table admins meme si elle est invisible pour le site.
create or replace function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------------
-- 2. Suppression des anciennes policies sur les tables du site
-- ---------------------------------------------------------------------
-- Les policies s'additionnent (OU logique) : une ancienne policy trop permissive
-- ("tout le monde peut tout faire") annulerait les nouvelles. On repart de zero.

do $$
declare
  p record;
begin
  for p in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'maisons', 'hotels', 'salles', 'chambres', 'societes', 'immeubles',
        'parametres_site', 'messages_contact', 'reservations',
        'hotels_partenaires_api', 'visites'
      )
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3. Catalogue : lecture publique, ecriture admin uniquement
-- ---------------------------------------------------------------------
-- maisons, hotels, salles, chambres, societes, immeubles, parametres_site
-- Lus par : pages publiques, recherche, IA, generation du PDF (route serveur).
-- Modifies par : pages /admin (sauvegarder*/supprimer*), toujours avec session admin.

do $$
declare
  t text;
begin
  foreach t in array array[
    'maisons', 'hotels', 'salles', 'chambres', 'societes', 'immeubles', 'parametres_site'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy "Lecture publique" on public.%I for select using (true)', t);
    execute format(
      'create policy "Ajout admin" on public.%I for insert to authenticated with check (public.est_admin())', t);
    execute format(
      'create policy "Modification admin" on public.%I for update to authenticated using (public.est_admin()) with check (public.est_admin())', t);
    execute format(
      'create policy "Suppression admin" on public.%I for delete to authenticated using (public.est_admin())', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4. hotels_partenaires_api : admin uniquement (contient des cles API PMS)
-- ---------------------------------------------------------------------
alter table public.hotels_partenaires_api enable row level security;

create policy "Admin gere les connexions PMS" on public.hotels_partenaires_api
  for all to authenticated
  using (public.est_admin())
  with check (public.est_admin());

-- ---------------------------------------------------------------------
-- 5. messages_contact : tout le monde peut ecrire, seul l'admin lit
-- ---------------------------------------------------------------------
alter table public.messages_contact enable row level security;

create policy "Envoi public d'un message" on public.messages_contact
  for insert to anon, authenticated
  with check (lu = false);

create policy "Lecture admin des messages" on public.messages_contact
  for select to authenticated
  using (public.est_admin());

create policy "Admin marque comme lu" on public.messages_contact
  for update to authenticated
  using (public.est_admin())
  with check (public.est_admin());

create policy "Suppression admin des messages" on public.messages_contact
  for delete to authenticated
  using (public.est_admin());

-- ---------------------------------------------------------------------
-- 6. visites : la route serveur enregistre, seul l'admin consulte
-- ---------------------------------------------------------------------
-- Avant : "Lecture publique des visites" permettait a n'importe qui de lire
-- les adresses IP des visiteurs. Desormais lecture reservee a l'admin.
alter table public.visites enable row level security;

create policy "Enregistrement des visites" on public.visites
  for insert to anon, authenticated
  with check (true);

create policy "Lecture admin des visites" on public.visites
  for select to authenticated
  using (public.est_admin());

-- ---------------------------------------------------------------------
-- 7. reservations
-- ---------------------------------------------------------------------
alter table public.reservations enable row level security;

-- 7a. Admin : acces complet (liste, refuser, supprimer).
create policy "Admin gere les reservations" on public.reservations
  for all to authenticated
  using (public.est_admin())
  with check (public.est_admin());

-- 7b. Client connecte : voit ses propres reservations (page /mon-compte).
create policy "Client voit ses reservations" on public.reservations
  for select to authenticated
  using (lower(email_client) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- 7c. Client connecte : cree une demande "payer sur place" (toujours en attente,
-- jamais confirmee directement, jamais avec un faux paiement Stripe).
create policy "Client cree une demande en attente" on public.reservations
  for insert to authenticated
  with check (statut = 'en_attente' and stripe_session_id is null);

-- 7d. Tout le monde : voit les reservations CONFIRMEES, pour afficher les dates
-- deja prises dans le calendrier (ReservationHotel / ReservationSalle) et verifier
-- la disponibilite dans /api/creer-paiement et le webhook Stripe.
create policy "Disponibilites visibles" on public.reservations
  for select to anon, authenticated
  using (statut = 'confirmee');

-- ===== TEMPORAIRE : a supprimer quand les routes serveur utiliseront service_role =====

-- 7e. Webhook Stripe (role anon) : insere la reservation payee, deja confirmee.
create policy "TEMP webhook Stripe insere reservation payee" on public.reservations
  for insert to anon
  with check (statut = 'confirmee' and stripe_session_id is not null);

-- 7f. /api/confirmer-reservation (role anon) : doit pouvoir lire puis passer
-- une reservation de "en_attente" a "confirmee".
create policy "TEMP route confirmation lit les demandes en attente" on public.reservations
  for select to anon
  using (statut = 'en_attente');

create policy "TEMP route confirmation confirme une demande" on public.reservations
  for update to anon
  using (statut = 'en_attente')
  with check (statut = 'confirmee');

-- Garde-fou : un non-admin (anon) qui modifie une reservation ne peut changer
-- QUE la colonne statut (pas le nom, l'email, les dates, le montant...).
create or replace function public.reservations_limiter_modifications()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') and not public.est_admin() then
    if (to_jsonb(new) - 'statut') is distinct from (to_jsonb(old) - 'statut') then
      raise exception 'Seul le statut de la reservation peut etre modifie.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_limiter_modifications on public.reservations;
create trigger reservations_limiter_modifications
  before update on public.reservations
  for each row execute function public.reservations_limiter_modifications();

-- ===== FIN TEMPORAIRE =====

-- ---------------------------------------------------------------------
-- 8. Filet de securite : RLS sur TOUTE autre table du schema public
-- ---------------------------------------------------------------------
-- Une table que le code n'utilise pas (ancienne table de test, etc.) devient
-- inaccessible depuis le site (aucune policy = tout refuse). Son nom s'affiche
-- dans l'onglet "Messages"/notices du SQL Editor.
do $$
declare
  t record;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public' and rowsecurity = false
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
    raise notice 'RLS active (sans policy) sur la table non utilisee par le code : %', t.tablename;
  end loop;
end $$;

commit;

-- ---------------------------------------------------------------------
-- 9. Verification : toutes les lignes doivent afficher rls_active = true
-- ---------------------------------------------------------------------
select tablename, rowsecurity as rls_active
from pg_tables
where schemaname = 'public'
order by tablename;
