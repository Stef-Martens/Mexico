import {
  checkAppMembership,
  checkIsAdmin,
  getAllCosmeticsWithOwners,
  getCurrentUser,
  getPlayers,
} from "@/lib/queries";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CosmeticsAdminClient } from "@/components/cosmetics-admin-client";

export const dynamic = "force-dynamic";

export default async function AdminCosmeticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isMember = await checkAppMembership();
  if (!isMember) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">Vraag de patron voor toegang</p>
        </div>
      </div>
    );
  }

  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const [cosmetics, players] = await Promise.all([
    getAllCosmeticsWithOwners(),
    getPlayers(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-3 py-2.5 flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold">🎨 Cosmetics</h1>
            <p className="text-[10px] text-muted-foreground truncate">
              Mystery box items · Mexico God, etc.
            </p>
          </div>
        </div>
      </div>

      <div className="px-3 py-4 max-w-lg mx-auto">
        <CosmeticsAdminClient initialCosmetics={cosmetics} players={players} />
      </div>
    </div>
  );
}
