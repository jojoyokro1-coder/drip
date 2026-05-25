const LOCAL_FOLLOWS_KEY = 'drip_local_follows';

type LocalFollow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

export function getLocalFollows(): LocalFollow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_FOLLOWS_KEY);
    return raw ? (JSON.parse(raw) as LocalFollow[]) : [];
  } catch {
    return [];
  }
}

function saveLocalFollows(follows: LocalFollow[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_FOLLOWS_KEY, JSON.stringify(follows));
}

export function isLocalFollowing(followerId: string, followingId: string): boolean {
  return getLocalFollows().some(
    (f) => f.follower_id === followerId && f.following_id === followingId
  );
}

export function getLocalFollowersCount(userId: string): number {
  return getLocalFollows().filter((f) => f.following_id === userId).length;
}

export function getLocalFollowingCount(userId: string): number {
  return getLocalFollows().filter((f) => f.follower_id === userId).length;
}

export function toggleLocalFollow(followerId: string, followingId: string): { following: boolean; count: number } {
  const follows = getLocalFollows();
  const existing = follows.findIndex(
    (f) => f.follower_id === followerId && f.following_id === followingId
  );

  let following: boolean;
  if (existing >= 0) {
    follows.splice(existing, 1);
    following = false;
  } else {
    follows.push({ follower_id: followerId, following_id: followingId, created_at: new Date().toISOString() });
    following = true;
  }

  saveLocalFollows(follows);
  const count = getLocalFollowersCount(followingId);
  return { following, count };
}

export function getLocalFollowingList(userId: string) {
  const follows = getLocalFollows().filter((f) => f.follower_id === userId);
  return follows.map((f) => f.following_id);
}
