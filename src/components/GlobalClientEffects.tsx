"use client";

import { useEffect } from "react";
import { useZoerIframe } from "@/hooks/useZoerIframe";

export default function GlobalClientEffects() {
  useZoerIframe();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    });
  }, []);

  return null;
}
