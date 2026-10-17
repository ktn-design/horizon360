-- =====================================================================
-- Horizon 360 : maquette 3D des immeubles et reperes des appartements
-- =====================================================================
-- A coller tel quel dans Supabase > SQL Editor, puis "Run".
-- Script idempotent : il peut etre relance sans risque, il ne supprime aucune donnee.
-- (Les fichiers .glb vont dans l'espace « maquettes » cree par 20261017_maquettes_3d.sql.)
-- =====================================================================

begin;

alter table public.immeubles add column if not exists maquette_3d_url text;
-- Liste de reperes : { id, maisonId, libelle, position: "x y z", normal: "x y z" }
alter table public.immeubles add column if not exists reperes_maquette jsonb not null default '[]'::jsonb;

commit;

notify pgrst, 'reload schema';

-- Verification : doit afficher les 2 colonnes.
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'immeubles'
  and column_name in ('maquette_3d_url', 'reperes_maquette');
