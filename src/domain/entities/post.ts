import type { Platform } from "./platform";

export interface MediaItem {
  type: "image" | "video";
  url: string;
}

export interface PostAuthor {
  username: string;
  displayName: string;
  avatarUrl: string;
}

export interface PostStats {
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

export interface NormalizedPost {
  platform: Platform;
  id: string;
  url: string;
  author: PostAuthor;
  text: string;
  media: MediaItem[];
  stats: PostStats;
  createdAt: string;
  raw: unknown;
}
