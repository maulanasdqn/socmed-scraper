import { Platform } from "../../../domain/entities/platform";
import type { NormalizedProfile } from "../../../domain/entities/profile";
import type { NormalizedPost } from "../../../domain/entities/post";
import { collectObjects, firstObject } from "./deep";
import { toNumber, toText } from "./html-json";

const isIgUser = (o: Record<string, unknown>): boolean =>
  "username" in o && "edge_followed_by" in o;

const isIgMedia = (o: Record<string, unknown>): boolean =>
  "shortcode" in o && ("display_url" in o || "is_video" in o);

const countOf = (edge: unknown): number =>
  toNumber((edge as Record<string, unknown> | undefined)?.count);

const captionOf = (node: Record<string, unknown>): string => {
  const edges = ((node.edge_media_to_caption as Record<string, unknown>)?.edges ??
    []) as Record<string, unknown>[];
  return toText((edges[0]?.node as Record<string, unknown>)?.text);
};

export const parseInstagramProfile = (root: unknown, url: string): NormalizedProfile | null => {
  const user = firstObject(root, isIgUser);
  if (!user) return null;
  return {
    platform: Platform.Instagram,
    id: toText(user.id),
    username: toText(user.username),
    displayName: toText(user.full_name),
    bio: toText(user.biography),
    avatarUrl: toText(user.profile_pic_url_hd ?? user.profile_pic_url),
    url,
    followers: countOf(user.edge_followed_by),
    following: countOf(user.edge_follow),
    postsCount: countOf(user.edge_owner_to_timeline_media),
    verified: Boolean(user.is_verified),
    raw: user,
  };
};

export const parseInstagramPosts = (root: unknown): NormalizedPost[] => {
  const nodes = collectObjects(root, isIgMedia);
  return nodes.map((node) => {
    const owner = (node.owner as Record<string, unknown> | undefined) ?? {};
    const shortcode = toText(node.shortcode);
    return {
      platform: Platform.Instagram,
      id: toText(node.id),
      url: `https://www.instagram.com/p/${shortcode}/`,
      author: {
        username: toText(owner.username),
        displayName: toText(owner.full_name),
        avatarUrl: toText(owner.profile_pic_url),
      },
      text: captionOf(node),
      media: [
        {
          type: node.is_video ? "video" : "image",
          url: toText(node.video_url ?? node.display_url),
        },
      ],
      stats: {
        likes: countOf(node.edge_liked_by ?? node.edge_media_preview_like),
        comments: countOf(node.edge_media_to_comment),
        shares: 0,
        views: toNumber(node.video_view_count),
      },
      createdAt: toText(node.taken_at_timestamp),
      raw: node,
    };
  });
};
