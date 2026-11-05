"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Beer,
  BookOpen,
  ClipboardList,
  Dices,
  Menu,
  Palette,
  Settings,
  ShoppingBag,
  Trophy,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const TABS: NavItem[] = [
  { href: "/", label: "Play", icon: Dices },
  { href: "/leaderboard", label: "Board", icon: Trophy },
  { href: "/ad-fundums", label: "Adjes", icon: Beer },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
];

const MORE_ITEMS: NavItem[] = [
  { href: "/regels", label: "Rules", icon: BookOpen },
  { href: "/log", label: "Log", icon: ClipboardList },
  { href: "/profile", label: "Profile", icon: User },
];

const ADMIN_ITEMS: NavItem[] = [
  { href: "/admin/cosmetics", label: "Items", icon: Palette },
  { href: "/admin", label: "Admin", icon: Settings },
];

const TAB_CLASS =
  "flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

interface BottomNavProps {
  email: string;
  isAdmin: boolean;
}

export function BottomNav({ email, isAdmin }: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  if (pathname.startsWith("/login")) {
    return null;
  }

  const moreItems = isAdmin ? [...MORE_ITEMS, ...ADMIN_ITEMS] : MORE_ITEMS;
  const moreActive = moreItems.some((item) => isActive(pathname, item.href));

  return (
    <>
      {/* Keeps page content clear of the fixed bar */}
      <div aria-hidden className="h-20" />

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)]">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                TAB_CLASS,
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          className={cn(
            TAB_CLASS,
            moreActive ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <Menu className="h-[22px] w-[22px]" strokeWidth={1.75} />
          More
        </button>
      </nav>

      {moreOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50"
          onClick={() => setMoreOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More"
            className="w-full rounded-t-2xl border-t bg-card p-4 pb-[max(env(safe-area-inset-bottom),1rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-bold">More</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
                className="-mr-2 flex h-11 w-11 items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="divide-y divide-border/15">
              {moreItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 py-3 font-medium"
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                  {label}
                </Link>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t pt-4">
              <span className="min-w-0 truncate text-sm text-muted-foreground">
                {email}
              </span>
              <div className="shrink-0">
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
