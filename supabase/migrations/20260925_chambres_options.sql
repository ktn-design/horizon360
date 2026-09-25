-- =====================================================================
-- Horizon 360 : chambres d'hotel (correctif enregistrement + options par chambre)
-- =====================================================================
-- A coller tel quel dans Supabase > SQL Editor, puis "Run".
-- Script idempotent : il peut etre relance sans risque, il ne supprime aucune donnee.
--
-- 1. CORRECTIF "impossible d'enregistrer une chambre"
--    La migration 20260829_ajout_details_chambres.sql n'avait jamais ete appliquee
--    en production : les colonnes type_lit, est_suite, salles_de_bain et climatisation
--    manquaient dans la table chambres. Le formulaire admin les envoie, donc Supabase
--    refusait TOUT enregistrement de chambre ("Could not find the 'climatisation'
--    column of 'chambres'").
--
-- 2. OPTIONS PAR CHAMBRE (petit-dejeuner, piscine, spa, kayak...)
--    Les options payantes ajoutees le 24/09 sur les hotels (hotels.extras) passent
--    sur les chambres (chambres.extras). Meme format :
--      { "id": "...", "nom": "Petit-dejeuner", "prix": 25, "facturation": "par_personne_par_nuit" }
--    Les colonnes de l'hotel (extras, piscine, salle_de_sport, petit_dejeuner_inclus,
--    prix_par_nuit) sont CONSERVEES en base (aucune perte) mais ne sont plus utilisees
--    par le site.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Colonnes manquantes de la table chambres
-- ---------------------------------------------------------------------
alter table public.chambres
  add column if not exists type_lit text default '',
  add column if not exists est_suite boolean not null default false,
  add column if not exists salles_de_bain integer not null default 1,
  add column if not exists climatisation boolean not null default false,
  add column if not exists extras jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------
-- 2. Recopie des options de chaque hotel vers chacune de ses chambres
-- ---------------------------------------------------------------------
-- a) Options payantes (hotels.extras) : recopiees telles quelles (memes id, nom,
--    prix, facturation) pour que les anciennes reservations restent coherentes.
-- b) Anciennes cases a cocher de l'hotel devenues des options de chambre, a 0 $
--    ("inclus") : piscine -> "Acces piscine", salle_de_sport -> "Salle de sport",
--    petit_dejeuner_inclus -> "Petit-dejeuner". L'admin peut ensuite fixer un prix
--    ou les retirer chambre par chambre.
-- Seules les chambres qui n'ont encore AUCUNE option sont completees : relancer le
-- script ne cree pas de doublons et n'ecrase jamais des options deja reglees.
with options_hotel as (
  select
    h.id as hotel_id,
    coalesce(h.extras, '[]'::jsonb)
    || case when coalesce(h.piscine, false)
            and not exists (select 1 from jsonb_array_elements(coalesce(h.extras, '[]'::jsonb)) e
                            where lower(e ->> 'nom') like '%piscine%')
       then jsonb_build_array(jsonb_build_object('id', 'hotel-piscine', 'nom', 'Acces piscine', 'prix', 0, 'facturation', 'forfait'))
       else '[]'::jsonb end
    || case when coalesce(h.salle_de_sport, false)
            and not exists (select 1 from jsonb_array_elements(coalesce(h.extras, '[]'::jsonb)) e
                            where lower(e ->> 'nom') like '%sport%')
       then jsonb_build_array(jsonb_build_object('id', 'hotel-salle-de-sport', 'nom', 'Salle de sport', 'prix', 0, 'facturation', 'forfait'))
       else '[]'::jsonb end
    || case when coalesce(h.petit_dejeuner_inclus, false)
            and not exists (select 1 from jsonb_array_elements(coalesce(h.extras, '[]'::jsonb)) e
                            where lower(e ->> 'nom') like '%petit%dejeuner%' or lower(e ->> 'nom') like '%petit%déjeuner%')
       then jsonb_build_array(jsonb_build_object('id', 'hotel-petit-dejeuner', 'nom', 'Petit-dejeuner', 'prix', 0, 'facturation', 'forfait'))
       else '[]'::jsonb end
    as options
  from public.hotels h
)
update public.chambres c
set extras = o.options
from options_hotel o
where c.hotel_id = o.hotel_id
  and jsonb_array_length(o.options) > 0
  and (c.extras is null or c.extras = '[]'::jsonb);

-- ---------------------------------------------------------------------
-- 3. Lien chambre -> hotel
-- ---------------------------------------------------------------------
-- Supprimer un hotel supprime aussi ses chambres (avant : elles restaient "orphelines").
-- NOT VALID : la regle s'applique aux nouvelles donnees sans toucher aux anciennes
-- chambres deja orphelines (aucune donnee supprimee par ce script).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.chambres'::regclass and contype = 'f'
  ) then
    begin
      alter table public.chambres
        add constraint chambres_hotel_id_fkey
        foreign key (hotel_id) references public.hotels(id) on delete cascade not valid;
    exception when others then
      raise notice 'Lien chambres -> hotels non ajoute (%). Sans consequence pour le site.', sqlerrm;
    end;
  end if;
end $$;

commit;

-- Force Supabase (PostgREST) a voir tout de suite les nouvelles colonnes.
notify pgrst, 'reload schema';

-- Verification : doit afficher les 5 colonnes.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'chambres'
  and column_name in ('type_lit', 'est_suite', 'salles_de_bain', 'climatisation', 'extras')
order by column_name;
