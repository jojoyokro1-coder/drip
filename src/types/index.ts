export interface Profile {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
  created_at: string;
}

export interface Look {
  id: string;
  user_id: string;
  image_url: string;
  description: string;
  likes_count: number;
  created_at: string;
  profile?: Profile;
}

export interface Like {
  id: string;
  user_id: string;
  look_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface UserStats {
  looks_count: number;
  followers_count: number;
  following_count: number;
  total_likes: number;
}

export interface HashtagTrend {
  tag: string;
  count: number;
}
