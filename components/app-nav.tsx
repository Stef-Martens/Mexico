import {
  checkAppMembership,
  checkIsAdmin,
  getCurrentUser,
} from "@/lib/queries";
import { BottomNav } from "@/components/bottom-nav";

/** Bottom tab bar, shown only to signed-in members. */
export async function AppNav() {
  const user = await getCurrentUser();

  if (!user || !(await checkAppMembership())) {
    return null;
  }

  const isAdmin = await checkIsAdmin();

  return <BottomNav email={user.email ?? ""} isAdmin={isAdmin} />;
}
