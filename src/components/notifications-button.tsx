"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Heart, MessageCircle, UserPlus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/user-avatar";

type Notification = {
  id: string;
  type: "like" | "follow" | "comment";
  look_id?: string | null;
  read?: boolean;
  created_at?: string;
  actor?: {
    username: string;
    avatar_url: string | null;
  } | null;
};

function timeAgo(dateStr: string) {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function notificationLabel(notification: Notification) {
  const username = notification.actor?.username ? `@${notification.actor.username}` : "Quelqu'un";
  if (notification.type === "like") return `${username} a liké ton look`;
  if (notification.type === "follow") return `${username} te suit`;
  if (notification.type === "comment") return `${username} a commenté ton look`;
  return "Nouvelle notification";
}

function notificationIcon(type: Notification["type"]) {
  if (type === "like") return <Heart size={16} fill="#FF3B5C" color="#FF3B5C" />;
  if (type === "follow") return <UserPlus size={16} color="#FF3B5C" />;
  return <MessageCircle size={16} color="#FF3B5C" />;
}

export function NotificationsButton() {
  const { user, session } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    const token = session?.access_token;
    if (!token) return;

    setLoading(true);
    setNotifError(null);
    try {
      const response = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) {
        setNotifError("Impossible de charger les notifications.");
        return;
      }
      const data = await response.json().catch(() => ({}));
      setNotifications(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      setNotifError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async () => {
    if (!user || unread === 0) return;

    const token = session?.access_token;
    if (!token) return;

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    setUnread(0);
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          loadNotifications();
          markRead();
        }}
        aria-label="Notifications"
        style={{
          position: "fixed",
          top: "calc(env(safe-area-inset-top) + 14px)",
          right: "16px",
          zIndex: 80,
          width: "42px",
          height: "42px",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(12,12,16,0.7)",
          backdropFilter: "blur(18px)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Bell size={19} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-3px",
              right: "-3px",
              minWidth: "18px",
              height: "18px",
              borderRadius: "999px",
              background: "#FF3B5C",
              color: "white",
              fontSize: "11px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #050508",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            padding: "calc(env(safe-area-inset-top) + 64px) 12px 120px",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(100%, 380px)",
              maxHeight: "70vh",
              overflow: "hidden",
              borderRadius: "22px",
              background: "rgba(12,12,16,0.96)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <strong style={{ color: "white", fontSize: "15px" }}>Notifications</strong>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: "calc(70vh - 58px)", overflowY: "auto", padding: "8px" }} className="hide-scrollbar">
              {loading ? (
                <p style={{ color: "#777", padding: "22px 12px", margin: 0 }}>Chargement...</p>
              ) : notifError ? (
                <div style={{ padding: "22px 12px", textAlign: "center" }}>
                  <p style={{ color: "#FF3B5C", fontSize: "13px", margin: "0 0 12px" }}>{notifError}</p>
                  <button onClick={loadNotifications} style={{ background: "rgba(255,59,92,0.15)", border: "1px solid rgba(255,59,92,0.3)", borderRadius: "10px", padding: "8px 16px", color: "#FF3B5C", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Réessayer</button>
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: "32px 12px", textAlign: "center" }}>
                  <div style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.05)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <Bell size={20} color="rgba(255,255,255,0.3)" />
                  </div>
                  <p style={{ color: "#777", fontSize: "14px", margin: 0 }}>Aucune notification</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const content = (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "14px", background: notification.read ? "transparent" : "rgba(255,59,92,0.08)" }}>
                      <UserAvatar src={notification.actor?.avatar_url} username={notification.actor?.username || "user"} size="sm" />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ color: "white", fontSize: "13px", fontWeight: notification.read ? 500 : 700, margin: 0, lineHeight: 1.35 }}>{notificationLabel(notification)}</p>
                        <span style={{ color: "rgba(255,255,255,0.38)", fontSize: "11px" }}>
                          {notification.created_at ? timeAgo(notification.created_at) : ""}
                        </span>
                      </div>
                      {notificationIcon(notification.type)}
                    </div>
                  );

                  if (notification.type === "follow" && notification.actor?.username) {
                    return (
                      <Link key={notification.id} href={`/profile/${notification.actor.username}`} onClick={() => setOpen(false)} style={{ textDecoration: "none", display: "block" }}>
                        {content}
                      </Link>
                    );
                  }

                  return notification.look_id ? (
                    <Link key={notification.id} href={`/look/${notification.look_id}`} onClick={() => setOpen(false)} style={{ textDecoration: "none", display: "block" }}>
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id}>{content}</div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
