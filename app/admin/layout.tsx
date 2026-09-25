import GardeAdmin from "@/components/GardeAdmin";

// Pages admin toujours generees a la demande : chaque navigation repasse par proxy.ts
// (verification de la session et des droits), rien n'est servi depuis un cache.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <GardeAdmin>{children}</GardeAdmin>;
}
