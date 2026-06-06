export const openApiSchemas = {
  MediaItem: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["image", "video"] },
      url: { type: "string", format: "uri" },
    },
  },
  PostAuthor: {
    type: "object",
    properties: {
      username: { type: "string" },
      displayName: { type: "string" },
      avatarUrl: { type: "string", format: "uri" },
    },
  },
  PostStats: {
    type: "object",
    properties: {
      likes: { type: "integer" },
      comments: { type: "integer" },
      shares: { type: "integer" },
      views: { type: "integer" },
    },
  },
  NormalizedProfile: {
    type: "object",
    properties: {
      platform: { $ref: "#/components/schemas/Platform" },
      id: { type: "string" },
      username: { type: "string" },
      displayName: { type: "string" },
      bio: { type: "string" },
      avatarUrl: { type: "string", format: "uri" },
      url: { type: "string", format: "uri" },
      followers: { type: "integer" },
      following: { type: "integer" },
      postsCount: { type: "integer" },
      verified: { type: "boolean" },
      raw: { type: "object", additionalProperties: true },
    },
  },
  NormalizedPost: {
    type: "object",
    properties: {
      platform: { $ref: "#/components/schemas/Platform" },
      id: { type: "string" },
      url: { type: "string", format: "uri" },
      author: { $ref: "#/components/schemas/PostAuthor" },
      text: { type: "string" },
      media: { type: "array", items: { $ref: "#/components/schemas/MediaItem" } },
      stats: { $ref: "#/components/schemas/PostStats" },
      createdAt: { type: "string" },
      raw: { type: "object", additionalProperties: true },
    },
  },
  Platform: {
    type: "string",
    enum: ["facebook", "instagram", "threads", "twitter", "tiktok"],
  },
  ScrapeMeta: {
    type: "object",
    properties: {
      platform: { $ref: "#/components/schemas/Platform" },
      degraded: { type: "boolean" },
      cached: { type: "boolean" },
    },
  },
  ScrapeResponse: {
    type: "object",
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: {
          oneOf: [
            { $ref: "#/components/schemas/NormalizedProfile" },
            { $ref: "#/components/schemas/NormalizedPost" },
          ],
        },
      },
      meta: { $ref: "#/components/schemas/ScrapeMeta" },
    },
  },
  ErrorResponse: {
    type: "object",
    properties: {
      message: { type: "string" },
      data: { type: "array", items: {}, default: [] },
    },
  },
  ProfileRequest: {
    type: "object",
    required: ["url"],
    properties: {
      url: { type: "string", format: "uri", example: "https://x.com/nasa" },
      proxyUrl: { type: "string", default: "", example: "socks5://user:pass@host:1080" },
    },
  },
  FeedsRequest: {
    type: "object",
    required: ["url"],
    properties: {
      url: { type: "string", format: "uri", example: "https://x.com/nasa" },
      niche: { type: "string", default: "", example: "mars" },
      proxyUrl: { type: "string", default: "", example: "socks5://user:pass@host:1080" },
    },
  },
} as const;
