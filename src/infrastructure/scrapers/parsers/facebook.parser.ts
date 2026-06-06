import { Platform } from "../../../domain/entities/platform";
import type { NormalizedProfile } from "../../../domain/entities/profile";
import type { NormalizedPost } from "../../../domain/entities/post";
import { collectObjects } from "./deep";
import { extractLdJson, toNumber, toText } from "./html-json";

const metaContent = (html: string, property: string): string => {
  const pattern = new RegExp(
    `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  return html.match(pattern)?.[1] ?? "";
};

const findLdEntity = (html: string): Record<string, unknown> | null => {
  const types = ["Person", "Organization", "ProfilePage"];
  for (const entity of extractLdJson(html)) {
    const record = entity as Record<string, unknown>;
    const type = toText(record["@type"]);
    if (types.includes(type)) return record;
  }
  return null;
};

const usernameFromUrl = (url: string): string => {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const handle = parts[0] ?? "";
    return handle === "profile.php" ? "" : handle;
  } catch {
    return "";
  }
};

const followersFromText = (text: string): number => {
  const match = text.match(/([\d.,]+)\s*(?:likes|followers|people follow)/i);
  return match ? toNumber(match[1]) : 0;
};

export const parseFacebookProfile = (html: string, url: string): NormalizedProfile | null => {
  const ld = findLdEntity(html);
  const title = metaContent(html, "og:title");
  const description = toText(ld?.description) || metaContent(html, "og:description");
  if (!ld && !title) return null;
  const image = (ld?.image as Record<string, unknown> | undefined)?.url ?? metaContent(html, "og:image");
  const ldFollowers = toNumber(
    (ld?.interactionStatistic as Record<string, unknown>)?.userInteractionCount,
  );
  return {
    platform: Platform.Facebook,
    id: toText(ld?.identifier),
    username: toText(ld?.alternateName) || usernameFromUrl(url),
    displayName: toText(ld?.name) || title,
    bio: description,
    avatarUrl: toText(image),
    url,
    followers: ldFollowers || followersFromText(description),
    following: 0,
    postsCount: 0,
    verified: false,
    raw: ld ?? { title },
  };
};

const isFbPost = (o: Record<string, unknown>): boolean =>
  "message" in o && "creation_time" in o;

export const parseFacebookPosts = (root: unknown): NormalizedPost[] => {
  const posts = collectObjects(root, isFbPost);
  return posts.map((post) => {
    const message = (post.message as Record<string, unknown> | undefined) ?? {};
    return {
      platform: Platform.Facebook,
      id: toText(post.id ?? post.post_id),
      url: toText(post.url ?? post.permalink),
      author: { username: "", displayName: "", avatarUrl: "" },
      text: toText(message.text ?? post.message),
      media: [],
      stats: { likes: 0, comments: 0, shares: 0, views: 0 },
      createdAt: toText(post.creation_time),
      raw: post,
    };
  });
};
