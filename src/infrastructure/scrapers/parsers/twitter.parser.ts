import { Platform } from "../../../domain/entities/platform";
import type { NormalizedProfile } from "../../../domain/entities/profile";
import type { MediaItem, NormalizedPost } from "../../../domain/entities/post";
import { collectObjects, firstObject } from "./deep";
import { toNumber, toText } from "./html-json";

const isUser = (o: Record<string, unknown>): boolean =>
  "screen_name" in o && ("followers_count" in o || "profile_image_url_https" in o);

const isTweet = (o: Record<string, unknown>): boolean =>
  "created_at" in o && ("full_text" in o || "text" in o) && "id_str" in o;

const mapMedia = (tweet: Record<string, unknown>): MediaItem[] => {
  const entities = (tweet.extended_entities ?? tweet.entities) as Record<string, unknown> | undefined;
  const media = (entities?.media as Record<string, unknown>[] | undefined) ?? [];
  return media.map((m) => ({
    type: m.type === "video" || m.type === "animated_gif" ? "video" : "image",
    url: toText(m.media_url_https ?? m.media_url),
  }));
};

export const parseTwitterProfile = (root: unknown, url: string): NormalizedProfile | null => {
  const user = firstObject(root, isUser);
  if (!user) return null;
  return {
    platform: Platform.Twitter,
    id: toText(user.id_str),
    username: toText(user.screen_name),
    displayName: toText(user.name),
    bio: toText(user.description),
    avatarUrl: toText(user.profile_image_url_https),
    url,
    followers: toNumber(user.followers_count),
    following: toNumber(user.friends_count),
    postsCount: toNumber(user.statuses_count),
    verified: Boolean(user.verified ?? user.is_blue_verified),
    raw: user,
  };
};

export const parseTwitterPosts = (root: unknown): NormalizedPost[] => {
  const tweets = collectObjects(root, isTweet);
  return tweets.map((tweet) => {
    const user = (tweet.user as Record<string, unknown> | undefined) ?? {};
    const id = toText(tweet.id_str);
    return {
      platform: Platform.Twitter,
      id,
      url: `https://x.com/${toText(user.screen_name)}/status/${id}`,
      author: {
        username: toText(user.screen_name),
        displayName: toText(user.name),
        avatarUrl: toText(user.profile_image_url_https),
      },
      text: toText(tweet.full_text ?? tweet.text),
      media: mapMedia(tweet),
      stats: {
        likes: toNumber(tweet.favorite_count),
        comments: toNumber(tweet.reply_count),
        shares: toNumber(tweet.retweet_count),
        views: toNumber(tweet.view_count),
      },
      createdAt: toText(tweet.created_at),
      raw: tweet,
    };
  });
};
