-- =====================================================================
-- Horizon 360 : statistiques - visiteurs uniques
-- =====================================================================
-- A coller tel quel dans Supabase > SQL Editor, puis "Run". Idempotent.
-- visiteur_id : identifiant anonyme et aleatoire de l'appareil (aucune donnee personnelle),
-- pour compter des visiteurs uniques et pas seulement des pages vues.
-- =====================================================================

alter table public.visites add column if not exists visiteur_id text;
alter table public.visites add column if not exists source text;

notify pgrst, 'reload schema';

-- Verification : doit afficher les 2 colonnes.
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'visites' and column_name in ('visiteur_id', 'source');
