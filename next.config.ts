import type { NextConfig } from "next";

// Domaine du projet Supabase (stockage des photos), lu depuis la variable d'environnement.
const domaineSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : "";

const nextConfig: NextConfig = {
  images: {
    // Photos du stockage Supabase optimisees par Vercel (voir lib/imageOptimisee.ts).
    remotePatterns: domaineSupabase
      ? [{ protocol: "https", hostname: domaineSupabase, pathname: "/storage/v1/object/public/**" }]
      : [],
    formats: ["image/webp"],
    qualities: [75],
    // Chaque photo envoyee a un nom unique et ne change jamais : longue duree de cache.
    minimumCacheTTL: 2678400, // 31 jours
  },
};

export default nextConfig;
