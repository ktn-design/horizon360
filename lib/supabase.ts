import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Ce site est entierement cote navigateur (pas de lecture de session cote serveur),
    // donc le flux "implicit" (plus simple) suffit et evite d'avoir a gerer manuellement
    // l'echange du code de retour apres une connexion Google.
    flowType: "implicit",
  },
});