"use client";

import { useMemo, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity, AlertCircle, ArrowUpRight, Crown, Eye, ImageIcon,
  MessageCircle, Search, ShieldCheck, Heart, Trash2, Users, X, ChevronLeft, ChevronRight,
} from "lucide-react";

export type AdminUser = {
  id: string;
  username?: string | null;
  email?: string | null;
  created_at?: string | null;
};

export type AdminLook = {
  id: string;
  image_url: string;
  description: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  profile?: { username: string } | null;
};

export type AdminStats = {
  total_users: number;
  total_looks: number;
  total_likes: number;
  total_comments: number;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(user: AdminUser) {
  const label = user.username || user.email || "DR";
  return label.slice(0, 2).toUpperCase();
}

export function AdminDashboard({ users: initialUsers, looks: initialLooks, stats, totalUsers, totalLooks, perPage }: { users: AdminUser[]; looks: AdminLook[]; stats: AdminStats; totalUsers: number; totalLooks: number; perPage: number }) {
  const router = useRouter();
  const [tab, setTab] = useState<"stats" | "users" | "looks">("stats");
  const [userQuery, setUserQuery] = useState("");
  const [lookQuery, setLookQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lookConfirmDelete, setLookConfirmDelete] = useState<string | null>(null);
  const [userPage, setUserPage] = useState(1);
  const [lookPage, setLookPage] = useState(1);
  const [users, setUsers] = useState(initialUsers);
  const [looks, setLooks] = useState(initialLooks);
  const [loadingPage, setLoadingPage] = useState(false);

  const userTotalPages = Math.ceil(totalUsers / perPage);
  const lookTotalPages = Math.ceil(totalLooks / perPage);

  const goToUserPage = useCallback(async (p: number) => {
    if (p < 1 || p > userTotalPages || p === userPage) return;
    setLoadingPage(true);
    try {
      const res = await fetch(`/api/admin/users?page=${p}&perPage=${perPage}`);
      const data = await res.json();
      if (data.users) setUsers(data.users);
      setUserPage(p);
      setUserQuery("");
      setConfirmDelete(null);
    } finally {
      setLoadingPage(false);
    }
  }, [userPage, userTotalPages, perPage]);

  const goToLookPage = useCallback(async (p: number) => {
    if (p < 1 || p > lookTotalPages || p === lookPage) return;
    setLoadingPage(true);
    try {
      const res = await fetch(`/api/admin/looks?page=${p}&perPage=${perPage}`);
      const data = await res.json();
      if (data.looks) setLooks(data.looks);
      setLookPage(p);
      setLookQuery("");
      setLookConfirmDelete(null);
    } finally {
      setLoadingPage(false);
    }
  }, [lookPage, lookTotalPages, perPage]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.username, u.email, u.id].some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [userQuery, users]);

  const filteredLooks = useMemo(() => {
    const q = lookQuery.trim().toLowerCase();
    if (!q) return looks;
    return looks.filter((l) =>
      [l.description, l.profile?.username, l.id].some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [lookQuery, looks]);

  const newestUser = initialUsers
    .filter((u) => u.created_at)
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];

  const handleDeleteUser = async (userId: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const handleDeleteLook = async (lookId: string) => {
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/looks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lookId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
      setLookConfirmDelete(null);
    }
  };

  const tabs = [
    { key: "stats" as const, label: "Stats", icon: Activity },
    { key: "users" as const, label: "Utilisateurs", icon: Users },
    { key: "looks" as const, label: "Looks", icon: ImageIcon },
  ];

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#07060b] px-4 pb-10 pt-5 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_44%_0%,rgba(190,42,255,0.3),transparent_32%),radial-gradient(circle_at_82%_13%,rgba(255,59,92,0.28),transparent_31%),linear-gradient(180deg,#1b1722_0%,#08070c_52%,#050508_100%)]" />

      <section className="relative mx-auto grid max-w-7xl gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-[34px] border border-white/10 bg-white/[0.07] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
              <ShieldCheck size={22} />
            </div>
            <span className="rounded-full border border-[#ff3b5c]/30 bg-[#ff3b5c]/15 px-3 py-1 text-xs font-black uppercase text-[#ff6f8c]">
              Live
            </span>
          </div>

          <div className="mt-10">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/45">Hello admin</p>
            <h1 className="mt-2 text-4xl font-black uppercase leading-[0.9] tracking-tight sm:text-5xl">
              DRIP
              <br />
              Control
            </h1>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff3b5c] to-[#7b2cff] font-black shadow-[0_0_32px_rgba(255,59,92,0.35)]">
                AD
              </div>
              <div>
                <p className="text-sm font-black">Dashboard</p>
                <p className="text-xs text-white/48">Gestion complete</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/[0.08] p-3">
                <p className="text-xl font-black">{stats.total_users}</p>
                <p className="text-[11px] text-white/45">Users</p>
              </div>
              <div className="rounded-2xl bg-white/[0.08] p-3">
                <p className="text-xl font-black">{stats.total_looks}</p>
                <p className="text-[11px] text-white/45">Looks</p>
              </div>
              <div className="rounded-2xl bg-white/[0.08] p-3">
                <p className="text-xl font-black">{stats.total_likes}</p>
                <p className="text-[11px] text-white/45">Likes</p>
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <nav className="mt-6 flex flex-col gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "16px",
                  border: tab === t.key ? "1px solid rgba(255,59,92,0.4)" : "1px solid transparent",
                  background: tab === t.key ? "rgba(255,59,92,0.1)" : "transparent",
                  color: tab === t.key ? "#fff" : "rgba(255,255,255,0.55)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <t.icon size={18} />
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-5">
          <header className="rounded-[34px] border border-white/10 bg-white/[0.07] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ff6f8c]">
                  {tab === "stats" ? "Vue d'ensemble" : tab === "users" ? "Utilisateurs" : "Looks"}
                </p>
                <h2 className="mt-1 text-3xl font-black uppercase leading-none sm:text-4xl">
                  {tab === "stats" ? "Statistiques" : tab === "users" ? "Tous les profils" : "Tous les looks"}
                </h2>
              </div>
              {(tab === "users" || tab === "looks") && (
                <div className="relative w-full lg:max-w-sm">
                  <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45" />
                  <input
                    value={tab === "users" ? userQuery : lookQuery}
                    onChange={(e) => tab === "users" ? setUserQuery(e.target.value) : setLookQuery(e.target.value)}
                    placeholder={tab === "users" ? "Search users..." : "Search looks..."}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.09] pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/40 focus:border-[#ff5f83]/60"
                  />
                </div>
              )}
            </div>
          </header>

          {/* ────────────── STATS TAB ────────────── */}
          {tab === "stats" && (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#ff3b5c]/28 to-white/[0.06] p-4 backdrop-blur-xl">
                  <Users className="text-[#ff7894]" size={22} />
                  <p className="mt-4 text-3xl font-black">{stats.total_users}</p>
                  <p className="text-sm font-bold text-white/55">Utilisateurs</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
                  <ImageIcon className="text-[#d9a7ff]" size={22} />
                  <p className="mt-4 text-3xl font-black">{stats.total_looks}</p>
                  <p className="text-sm font-bold text-white/55">Looks</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
                  <Heart className="text-[#ff5f83]" size={22} />
                  <p className="mt-4 text-3xl font-black">{stats.total_likes}</p>
                  <p className="text-sm font-bold text-white/55">Likes</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
                  <MessageCircle className="text-[#7df7d4]" size={22} />
                  <p className="mt-4 text-3xl font-black">{stats.total_comments}</p>
                  <p className="text-sm font-bold text-white/55">Commentaires</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
                  <Crown className="text-[#d9a7ff]" size={22} />
                  <p className="mt-4 truncate text-3xl font-black">{newestUser?.username ?? "--"}</p>
                  <p className="text-sm font-bold text-white/55">Dernier inscrit</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
                  <Activity className="text-[#7df7d4]" size={22} />
                  <p className="mt-4 text-3xl font-black">{formatDate(newestUser?.created_at)}</p>
                  <p className="text-sm font-bold text-white/55">Derniere activite</p>
                </div>
              </div>
            </>
          )}

          {/* ────────────── USERS TAB ────────────── */}
          {tab === "users" && (
            <section className="rounded-[34px] border border-white/10 bg-white/[0.07] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-4">
              <div className="mb-3 flex items-center justify-between px-2">
                <h3 className="text-xl font-black uppercase">Collection utilisateurs</h3>
                <span className="text-sm font-bold text-white/45">{totalUsers} profils</span>
              </div>
              <div className="overflow-hidden rounded-[26px] border border-white/10 bg-black/18">
                {loadingPage ? (
                  <div className="p-8 text-center text-sm font-bold text-white/48">Chargement...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-sm font-bold text-white/48">Aucun utilisateur trouve.</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="grid gap-3 border-b border-white/8 p-4 last:border-b-0 sm:grid-cols-[1fr_1fr_130px_44px_44px] sm:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff3b5c] via-[#a23bff] to-[#26233a] text-sm font-black shadow-[0_0_24px_rgba(255,59,92,0.22)]">
                          {getInitials(user)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-base font-black">@{user.username ?? "unknown"}</p>
                          <p className="truncate text-xs font-semibold text-white/42">{user.id}</p>
                        </div>
                      </div>

                      <p className="min-w-0 truncate rounded-2xl bg-white/[0.05] px-3 py-2 text-sm font-semibold text-white/68">
                        {user.email ?? "email indisponible"}
                      </p>

                      <p className="text-sm font-bold text-white/55 sm:text-right">{formatDate(user.created_at)}</p>

                      <Link
                        href={user.username ? `/profile/${user.username}` : "#"}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/75 transition hover:border-[#ff5f83]/50 hover:text-white"
                        aria-label="Voir le profil"
                      >
                        <ArrowUpRight size={18} />
                      </Link>

                      {confirmDelete === user.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleting}
                            className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/20 text-red-400 transition hover:bg-red-500/30"
                            title="Confirmer"
                          >
                            <AlertCircle size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/50 transition hover:bg-white/20"
                            title="Annuler"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(user.id)}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/45 transition hover:border-red-400/40 hover:bg-red-500/15 hover:text-red-400"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {userTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2 px-2">
                  <button
                    onClick={() => goToUserPage(userPage - 1)}
                    disabled={userPage <= 1 || loadingPage}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-white/60 transition hover:border-white/25 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: Math.min(userTotalPages, 7) }, (_, i) => {
                    let p: number;
                    if (userTotalPages <= 7) {
                      p = i + 1;
                    } else if (userPage <= 4) {
                      p = i + 1;
                    } else if (userPage >= userTotalPages - 3) {
                      p = userTotalPages - 6 + i;
                    } else {
                      p = userPage - 3 + i;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => goToUserPage(p)}
                        disabled={loadingPage}
                        className="flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-sm font-bold transition disabled:pointer-events-none disabled:opacity-40"
                        style={{
                          background: p === userPage ? "rgba(255,59,92,0.2)" : "rgba(255,255,255,0.06)",
                          border: p === userPage ? "1px solid rgba(255,59,92,0.4)" : "1px solid rgba(255,255,255,0.08)",
                          color: p === userPage ? "#fff" : "rgba(255,255,255,0.55)",
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => goToUserPage(userPage + 1)}
                    disabled={userPage >= userTotalPages || loadingPage}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-white/60 transition hover:border-white/25 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ────────────── LOOKS TAB ────────────── */}
          {tab === "looks" && (
            <section className="rounded-[34px] border border-white/10 bg-white/[0.07] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-4">
              <div className="mb-3 flex items-center justify-between px-2">
                <h3 className="text-xl font-black uppercase">Tous les looks</h3>
                <span className="text-sm font-bold text-white/45">{totalLooks} looks</span>
              </div>

              {loadingPage ? (
                <div className="p-8 text-center text-sm font-bold text-white/48">Chargement...</div>
              ) : filteredLooks.length === 0 ? (
                <div className="p-8 text-center text-sm font-bold text-white/48">Aucun look trouve.</div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredLooks.map((look) => (
                    <div
                      key={look.id}
                      className="group relative overflow-hidden rounded-[22px] border border-white/10 bg-black/30"
                    >
                      <div
                        className="aspect-[3/4] w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${look.image_url})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 transition group-hover:opacity-100" />

                      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition group-hover:opacity-100">
                        <p className="text-sm font-bold truncate">
                          @{look.profile?.username ?? "unknown"}
                        </p>
                        <p className="mt-1 text-xs text-white/70 line-clamp-2">{look.description}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-white/55">
                          <span className="flex items-center gap-1"><Heart size={12} /> {look.likes_count}</span>
                          <span>{formatDate(look.created_at)}</span>
                        </div>
                      </div>

                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                        {lookConfirmDelete === look.id ? (
                          <>
                            <button
                              onClick={() => handleDeleteLook(look.id)}
                              disabled={deleting}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/30 text-red-300 backdrop-blur-md transition hover:bg-red-500/50"
                            >
                              <AlertCircle size={14} />
                            </button>
                            <button
                              onClick={() => setLookConfirmDelete(null)}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/60 backdrop-blur-md transition hover:bg-black/60"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setLookConfirmDelete(look.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/60 backdrop-blur-md transition hover:bg-red-500/30 hover:text-red-300"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <a
                        href={look.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2 top-14 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/60 backdrop-blur-md opacity-0 transition hover:bg-white/20 hover:text-white group-hover:opacity-100"
                      >
                        <Eye size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {lookTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2 px-2">
                  <button
                    onClick={() => goToLookPage(lookPage - 1)}
                    disabled={lookPage <= 1 || loadingPage}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-white/60 transition hover:border-white/25 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: Math.min(lookTotalPages, 7) }, (_, i) => {
                    let p: number;
                    if (lookTotalPages <= 7) {
                      p = i + 1;
                    } else if (lookPage <= 4) {
                      p = i + 1;
                    } else if (lookPage >= lookTotalPages - 3) {
                      p = lookTotalPages - 6 + i;
                    } else {
                      p = lookPage - 3 + i;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => goToLookPage(p)}
                        disabled={loadingPage}
                        className="flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-sm font-bold transition disabled:pointer-events-none disabled:opacity-40"
                        style={{
                          background: p === lookPage ? "rgba(255,59,92,0.2)" : "rgba(255,255,255,0.06)",
                          border: p === lookPage ? "1px solid rgba(255,59,92,0.4)" : "1px solid rgba(255,255,255,0.08)",
                          color: p === lookPage ? "#fff" : "rgba(255,255,255,0.55)",
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => goToLookPage(lookPage + 1)}
                    disabled={lookPage >= lookTotalPages || loadingPage}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-white/60 transition hover:border-white/25 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
