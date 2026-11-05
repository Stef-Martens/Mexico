import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AppNav } from "@/components/app-nav";

const font = Schibsted_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mexico - Dice Game Tracker",
  description: "Track Mexico (2-1) dice game scores",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mexico",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

// Runs before first paint so every page opens in the right theme. Light unless
// dark was chosen with ThemeToggle.
const themeScript = `try {
  document.documentElement.classList.toggle("dark", localStorage.getItem("theme") === "dark");
} catch (e) {}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={font.className} suppressHydrationWarning>
        {children}
        <AppNav />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
