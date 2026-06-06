import { Platform } from "../../../domain/entities/platform";
import type { NormalizedProfile } from "../../../domain/entities/profile";
import type { MediaItem, NormalizedPost } from "../../../domain/entities/post";
import { collectObjects, firstObject } from "./deep";
import { toNumber, toText } from "./html-json";

const isThreadsUser = (o: Record<string, unknown>): boolean =>
  "username" in o && ("follower_count" in o || "profile_pic_url" in o) && !("caption" in o);

const isThreadsPost = (o: Record<string, unknown>): boolean =>
  "caption" in o && "pk" in o && ("like_count" in o || "text_post_app_info" in o);

const candidateUrl = (versions: unknown): string => {
  const candidates = (versions as Record<string, unknown> | undefined)?.candidates as
    | Record<string, unknown>[]
    | undefined;
  return toText(candidates?.[0]?.url);
};

const mapMedia = (post: Record<string, unknown>): MediaItem[] => {
  const video = (post.video_versions as Record<string, unknown>[] | undefined)?.[0];
  if (video) return [{ type: "video", url: toText(video.url) }];
  const image = candidateUrl(post.image_versions2);
  return image ? [{ type: "image", url: image }] : [];
};

export const parseThreadsProfile = (root: unknown, url: string): NormalizedProfile | null => {
  const user = firstObject(root, isThreadsUser);
  if (!user) return null;
  return {
    platform: Platform.Threads,
    id: toText(user.pk ?? user.id),
    username: toText(user.username),
    displayName: toText(user.full_name),
    bio: toText((user.biography as string) ?? ""),
    avatarUrl: toText(user.profile_pic_url),
    url,
    followers: toNumber(user.follower_count),
    following: toNumber(user.following_count),
    postsCount: toNumber(user.media_count),
    verified: Boolean(user.is_verified),
    raw: user,
  };
};

export const parseThreadsPosts = (root: unknown): NormalizedPost[] => {
  const posts = collectObjects(root, isThreadsPost);
  return posts.map((post) => {
    const user = (post.user as Record<string, unknown> | undefined) ?? {};
    const caption = (post.caption as Record<string, unknown> | undefined) ?? {};
    return {
      platform: Platform.Threads,
      id: toText(post.pk),
      url: `https://www.threads.net/@${toText(user.username)}/post/${toText(post.code)}`,
      author: {
        username: toText(user.username),
        displayName: toText(user.full_name),
        avatarUrl: toText(user.profile_pic_url),
      },
      text: toText(caption.text),
      media: mapMedia(post),
      stats: {
        likes: toNumber(post.like_count),
        comments: toNumber((post.text_post_app_info as Record<string, unknown>)?.direct_reply_count),
        shares: 0,
        views: 0,
      },
      createdAt: toText(post.taken_at),
      raw: post,
    };
  });
};
