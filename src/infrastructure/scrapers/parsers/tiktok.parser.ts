import { Platform } from "../../../domain/entities/platform";
import type { NormalizedProfile } from "../../../domain/entities/profile";
import type { NormalizedPost } from "../../../domain/entities/post";
import { collectObjects, firstObject } from "./deep";
import { toNumber, toText } from "./html-json";

const isTikTokUser = (o: Record<string, unknown>): boolean =>
  "uniqueId" in o && "nickname" in o;

const isTikTokStats = (o: Record<string, unknown>): boolean =>
  "followerCount" in o && "followingCount" in o;

const isTikTokVideo = (o: Record<string, unknown>): boolean =>
  "desc" in o && "stats" in o && "author" in o;

export const parseTikTokProfile = (root: unknown, url: string): NormalizedProfile | null => {
  const user = firstObject(root, isTikTokUser);
  if (!user) return null;
  const stats = firstObject(root, isTikTokStats) ?? {};
  return {
    platform: Platform.TikTok,
    id: toText(user.id),
    username: toText(user.uniqueId),
    displayName: toText(user.nickname),
    bio: toText(user.signature),
    avatarUrl: toText(user.avatarLarger ?? user.avatarMedium),
    url,
    followers: toNumber(stats.followerCount),
    following: toNumber(stats.followingCount),
    postsCount: toNumber(stats.videoCount),
    verified: Boolean(user.verified),
    raw: { user, stats },
  };
};

export const parseTikTokPosts = (root: unknown): NormalizedPost[] => {
  const items = collectObjects(root, isTikTokVideo);
  return items.map((item) => {
    const author = (item.author as Record<string, unknown> | undefined) ?? {};
    const stats = (item.stats as Record<string, unknown> | undefined) ?? {};
    const username = toText(author.uniqueId);
    const id = toText(item.id);
    return {
      platform: Platform.TikTok,
      id,
      url: `https://www.tiktok.com/@${username}/video/${id}`,
      author: {
        username,
        displayName: toText(author.nickname),
        avatarUrl: toText(author.avatarThumb),
      },
      text: toText(item.desc),
      media: [{ type: "video", url: toText((item.video as Record<string, unknown>)?.cover) }],
      stats: {
        likes: toNumber(stats.diggCount),
        comments: toNumber(stats.commentCount),
        shares: toNumber(stats.shareCount),
        views: toNumber(stats.playCount),
      },
      createdAt: toText(item.createTime),
      raw: item,
    };
  });
};

export const parseTikTokOembed = (json: Record<string, unknown>, url: string): NormalizedPost[] => {
  if (!json.author_name && !json.title) return [];
  return [
    {
      platform: Platform.TikTok,
      id: toText(json.embed_product_id),
      url,
      author: {
        username: toText(json.author_unique_id ?? json.author_name),
        displayName: toText(json.author_name),
        avatarUrl: "",
      },
      text: toText(json.title),
      media: [{ type: "video", url: toText(json.thumbnail_url) }],
      stats: { likes: 0, comments: 0, shares: 0, views: 0 },
      createdAt: "",
      raw: json,
    },
  ];
};
