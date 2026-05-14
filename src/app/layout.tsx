import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import GlobalClientEffects from "@/components/GlobalClientEffects";
import { AuthProvider } from "@/hooks/useAuth";

import "./globals.css";

export const metadata: Metadata = {
  title: "DRIP - Plateforme Mode Streetwear",
  description: "Partage tes looks, inspire la communauté streetwear",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      </head>
      <body
        className="antialiased bg-[#0a0a0a] text-white"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <GlobalClientEffects />
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
