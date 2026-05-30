"use client";

import { useEffect, useRef, useState } from "react";

const DISMISS_KEY = "drip_update_dismissed";
const POLL_INTERVAL = 30000;

export default function UpdateBanner() {
  const [show, setShow] = useState(false);
  const buildIdRef = useRef<string | null>(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    async function checkUpdate() {
      try {
        const res = await fetch("/api/build");
        const data = await res.json();
        if (buildIdRef.current && data.id !== buildIdRef.current) {
          setShow(true);
          return true;
        }
        if (!buildIdRef.current) {
          buildIdRef.current = data.id;
        }
      } catch {
        /* ignore */
      }
      return false;
    }

    checkUpdate();

    const interval = setInterval(() => { checkUpdate(); }, POLL_INTERVAL);

    const onVisibility = () => {
      if (document.visibilityState === "visible") checkUpdate();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "90px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "linear-gradient(135deg, #FF3B5C, #c0135e)",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(255,59,92,0.5)",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "14px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <span>Nouvelles fonctionnalités disponibles</span>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "10px",
          padding: "8px 16px",
          color: "#fff",
          fontWeight: 700,
          fontSize: "13px",
          cursor: "pointer",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        Raffraîchir
      </button>
      <button
        onClick={() => {
          setShow(false);
          try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {}
        }}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.7)",
          cursor: "pointer",
          padding: "4px",
          fontSize: "18px",
          lineHeight: 1,
        }}
        aria-label="Fermer"
      >
        ✕
      </button>
    </div>
  );
}
