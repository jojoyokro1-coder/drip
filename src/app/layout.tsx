import type { Metadata, Viewport } from "next";
import { Syne, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import GlobalClientEffects from "@/components/GlobalClientEffects";
import { AuthProvider } from "@/hooks/useAuth";

import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  title: "DRIP - Plateforme Mode Streetwear",
  description: "Partage tes looks, inspire la communaute streetwear",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DRIP",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF3B5C",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`dark ${syne.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head />
      <body className="antialiased bg-[#0a0a0a] text-white" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <GlobalClientEffects />
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
