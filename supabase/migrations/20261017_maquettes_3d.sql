-- =====================================================================
-- Horizon 360 : maquettes 3D (fichiers .glb) pour les maisons et les salles
-- =====================================================================
-- A coller tel quel dans Supabase > SQL Editor, puis "Run".
-- Script idempotent : il peut etre relance sans risque, il ne supprime aucune donnee.
-- =====================================================================

begin;

-- 1. Adresse de la maquette 3D de chaque maison / salle (vide = pas de maquette).
alter table public.maisons add column if not exists maquette_3d_url text;
alter table public.salles  add column if not exists maquette_3d_url text;

-- 2. Espace de stockage public "maquettes" : fichiers .glb jusqu'a 50 Mo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('maquettes', 'maquettes', true, 52428800, array['model/gltf-binary', 'application/octet-stream'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Envoi et suppression : administrateurs actifs ayant la section maisons ou salles.
-- (La lecture est publique : c'est un espace "public".)
drop policy if exists "Admins envoient des maquettes" on storage.objects;
create policy "Admins envoient des maquettes" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'maquettes' and (public.a_permission('maisons') or public.a_permission('salles')));

drop policy if exists "Admins suppriment des maquettes" on storage.objects;
create policy "Admins suppriment des maquettes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'maquettes' and (public.a_permission('maisons') or public.a_permission('salles')));

commit;

notify pgrst, 'reload schema';

-- Verification : doit afficher les 2 colonnes et l'espace "maquettes".
select table_name, column_name from information_schema.columns
where table_schema = 'public' and column_name = 'maquette_3d_url';
select id, public, file_size_limit from storage.buckets where id = 'maquettes';
