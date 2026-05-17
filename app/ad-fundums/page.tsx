import {
  checkAppMembership,
  getCurrentUser,
  getCurrentUserPlayer,
  getAdFundums,
} from "@/lib/queries";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdFundumFeed } from "@/components/ad-fundum-feed";

export const dynamic = "force-dynamic";

export default async function AdFundumsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isMember = await checkAppMembership();
  if (!isMember) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">Vraag de patron voor toegang</p>
          <SignOutButton />
        </div>
      </div>
    );
  }

  const player = await getCurrentUserPlayer();
  if (!player) redirect("/");

  const fundums = await getAdFundums();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-bold flex items-center gap-1.5">
                <span>🍺</span>
                <span>Ad Fundums</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 py-4 max-w-lg mx-auto">
        <AdFundumFeed initialFundums={fundums} currentPlayer={player} />
      </div>
    </div>
  );
}
