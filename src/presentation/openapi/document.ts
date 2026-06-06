import { openApiSchemas } from "./schemas";

const jsonBody = (schemaRef: string) => ({
  required: true,
  content: { "application/json": { schema: { $ref: schemaRef } } },
});

const scrapeResponses = {
  "200": {
    description: "Scrape result",
    content: { "application/json": { schema: { $ref: "#/components/schemas/ScrapeResponse" } } },
  },
  "400": {
    description: "Invalid payload or unsupported platform",
    content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
  },
  "502": {
    description: "Scrape failed",
    content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
  },
};

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Social Media Scraper API",
    version: "1.0.0",
    description:
      "No-auth scraper for Facebook, Instagram, Threads, X, and TikTok. Returns a normalized schema.",
  },
  servers: [{ url: "https://scraper.stynx.app", description: "Production" }],
  tags: [{ name: "scrape", description: "Profile and feed scraping" }],
  paths: {
    "/api/v1/scrape/per-profile": {
      post: {
        tags: ["scrape"],
        summary: "Scrape a single profile by URL",
        operationId: "scrapeProfile",
        requestBody: jsonBody("#/components/schemas/ProfileRequest"),
        responses: scrapeResponses,
      },
    },
    "/api/v1/scrape/feeds": {
      post: {
        tags: ["scrape"],
        summary: "Scrape feeds by niche or recent posts",
        operationId: "scrapeFeeds",
        requestBody: jsonBody("#/components/schemas/FeedsRequest"),
        responses: scrapeResponses,
      },
    },
  },
  components: { schemas: openApiSchemas },
} as const;
