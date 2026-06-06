import { Hono } from "hono";
import type { ScrapeController } from "../controllers/scrape.controller";
import { buildController } from "../../composition";

export const scrapeRoutes = new Hono<{ Bindings: CloudflareBindings }>();

const withController = (
  c: { env: CloudflareBindings },
  run: (controller: ScrapeController) => Promise<Response>,
): Promise<Response> => run(buildController(c.env));

scrapeRoutes.post("/per-profile", (c) =>
  withController(c, (controller) => controller.scrapeProfile(c)),
);

scrapeRoutes.post("/feeds", (c) => withController(c, (controller) => controller.scrapeFeeds(c)));
