import Link from "next/link";
import { cookies } from "next/headers";
import { LockKeyhole } from "lucide-react";
import { AdminDashboard, type AdminUser, type AdminLook, type AdminStats } from "@/components/admin-dashboard";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const PER_PAGE = 20;

async function getAdminData(): Promise<{
  users: AdminUser[];
  looks: AdminLook[];
  stats: AdminStats;
  totalUsers: number;
  totalLooks: number;
  error: string | null;
}> {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    return { users: [], looks: [], stats: { total_users: 0, total_looks: 0, total_likes: 0, total_comments: 0 }, totalUsers: 0, totalLooks: 0, error: "Supabase server is not configured" };
  }

  const [profilesRes, authUsersRes, looksRes, looksCountRes, likesCountRes, usersCountRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, username"),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: PER_PAGE }),
    supabaseAdmin.from("looks").select("*, profile:profiles(username)").order("created_at", { ascending: false }).range(0, PER_PAGE - 1),
    supabaseAdmin.from("looks").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("likes").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  if (profilesRes.error) return { users: [], looks: [], stats: { total_users: 0, total_looks: 0, total_likes: 0, total_comments: 0 }, totalUsers: 0, totalLooks: 0, error: profilesRes.error.message };
  if (authUsersRes.error) return { users: [], looks: [], stats: { total_users: 0, total_looks: 0, total_likes: 0, total_comments: 0 }, totalUsers: 0, totalLooks: 0, error: authUsersRes.error.message };
  if (looksRes.error) return { users: [], looks: [], stats: { total_users: 0, total_looks: 0, total_likes: 0, total_comments: 0 }, totalUsers: 0, totalLooks: 0, error: looksRes.error.message };

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const users = authUsersRes.data.users.map((user) => {
    const profile = profileMap.get(user.id);
    return {
      id: user.id,
      username: profile?.username ?? null,
      email: user.email ?? null,
      created_at: user.created_at ?? null,
    };
  });

  const looks = (looksRes.data ?? []).map((l) => ({
    id: l.id,
    image_url: l.image_url,
    description: l.description,
    likes_count: l.likes_count,
    created_at: l.created_at,
    user_id: l.user_id,
    profile: l.profile ? { username: l.profile.username } : null,
  }));

  const totalUsers = usersCountRes.count ?? profilesRes.data.length;
  const totalLooks = looksCountRes.count ?? 0;
  const stats: AdminStats = {
    total_users: totalUsers,
    total_looks: totalLooks,
    total_likes: likesCountRes.count ?? 0,
    total_comments: 0,
  };

  return { users, looks, stats, totalUsers, totalLooks, error: null };
}

function AdminAccessDenied() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#08070c] px-5 py-8 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_5%,rgba(255,59,166,0.3),transparent_35%),linear-gradient(180deg,#211827_0%,#08070c_62%,#050508_100%)]" />
      <section className="relative mx-auto flex min-h-[64dvh] max-w-md items-center justify-center">
        <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.08] p-6 text-center shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#ff3b5c]/20 text-[#ff5f83] shadow-[0_0_35px_rgba(255,59,92,0.35)]">
            <LockKeyhole size={30} />
          </div>
          <h1 className="text-3xl font-black uppercase leading-none">Acces interdit</h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/58">
            Cette zone est reservee aux administrateurs DRIP.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/admin/login"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff3b5c] to-[#b5179e] px-6 text-sm font-black text-white shadow-[0_16px_45px_rgba(255,59,92,0.35)]"
            >
              Se connecter en tant qu'administrateur
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 px-6 text-sm font-semibold text-white/70 transition-colors hover:border-white/40 hover:text-white"
            >
              Retour a l'accueil
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("adminAuth")?.value === "true";

  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  const { users, looks, stats, totalUsers, totalLooks, error } = await getAdminData();

  if (error) {
    return (
      <main className="relative min-h-[100dvh] bg-[#08070c] px-5 py-8 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-red-100">
          Erreur : {error}
        </div>
      </main>
    );
  }

  return <AdminDashboard users={users} looks={looks} stats={stats} totalUsers={totalUsers} totalLooks={totalLooks} perPage={PER_PAGE} />;
}
