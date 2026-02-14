import {
  checkAppMembership,
  getCurrentUser,
  getCurrentUserPlayer,
} from "@/lib/queries";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

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

  if (!player) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">⚙️ Profile</h1>
            </div>
          </div>
          {/* <SignOutButton /> */}
        </div>

        {/* Profile Form */}
        <ProfileForm
          initialName={player.name}
          initialAvatarUrl={player.avatar_url ?? null}
        />

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium mb-1">Theme</h3>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark mode
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
