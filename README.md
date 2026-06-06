# socmed-scraper

No-auth social media scraper running on a single Cloudflare Worker. Takes a profile or feed URL, returns normalized JSON. No API keys, no login, no cookies you supply.

Live: https://scraper.stynx.app · Docs: https://scraper.stynx.app/docs

## Platform support

| Platform | Profile | Feed | Method |
|----------|---------|------|--------|
| X / Twitter | yes | yes | `syndication.twitter.com` timeline (`__NEXT_DATA__`) |
| Instagram | yes | yes | `web_profile_info` + `tags/web_info` with csrftoken bootstrap |
| Threads | yes | partial | server HTML embedded Relay JSON |
| TikTok | yes | no | profile from `__UNIVERSAL_DATA_FOR_REHYDRATION__`; videos blocked |
| Facebook | yes | no | og/ld+json from rendered page |

"no" / "partial" are not bugs. See [Limitations](#limitations).

## API

Base path: `/api/v1/scrape`. Both endpoints are `POST` with a JSON body.

### POST /per-profile

```json
{ "url": "https://x.com/nasa", "proxyUrl": "" }
```

### POST /feeds

```json
{ "url": "https://www.instagram.com/natgeo/", "niche": "nature", "proxyUrl": "" }
```

`niche` is optional. When set, the scraper hits the platform's hashtag/explore endpoint for that term instead of the profile timeline. When empty, it returns the profile's recent posts.

`proxyUrl` is optional. When set, fetch-tier requests are routed through it to escape the shared Worker IP and its rate limits. The target URL is URL-encoded and appended to `proxyUrl`, unless `proxyUrl` contains the literal `{url}` placeholder, in which case the target is substituted there:

```
proxyUrl = "https://proxy.example.com/?url="        -> https://proxy.example.com/?url=<encoded target>
proxyUrl = "https://proxy.example.com/fetch?u={url}" -> ...?u=<encoded target>
```

It applies to the fetch tier (X, Instagram, Threads). Browser-rendered platforms (TikTok video feeds, Facebook) ignore it — Cloudflare Browser Rendering runs the Chromium and cannot route through an arbitrary proxy.

### Response

Every response has the same envelope. `data` holds normalized objects; `meta` describes the scrape.

```json
{
  "message": "Profile scraped",
  "data": [
    {
      "platform": "twitter",
      "id": "11348282",
      "username": "NASA",
      "displayName": "NASA",
      "bio": "Making the seemingly impossible, possible.",
      "avatarUrl": "https://pbs.twimg.com/...",
      "url": "https://x.com/nasa",
      "followers": 92090665,
      "following": 119,
      "postsCount": 74066,
      "verified": false,
      "raw": {}
    }
  ],
  "meta": { "platform": "twitter", "degraded": false, "cached": false }
}
```

Post objects (feeds) use this shape inside `data`:

```json
{
  "platform": "twitter",
  "id": "20593...",
  "url": "https://x.com/NASA/status/20593...",
  "author": { "username": "NASA", "displayName": "NASA", "avatarUrl": "..." },
  "text": "...",
  "media": [{ "type": "image", "url": "..." }],
  "stats": { "likes": 1679, "comments": 66, "shares": 366, "views": 0 },
  "createdAt": "Tue May 26 19:50:27 +0000 2026",
  "raw": {}
}
```

`raw` carries the unmodified platform payload for fields the normalized schema drops.

`meta`:
- `platform` — detected from the URL host.
- `degraded` — `true` when the scrape returned no usable data (blocked, rate-limited, or empty). Never a 500 for a block.
- `cached` — `true` when served from KV.

### Status codes

- `200` — scrape ran. Check `meta.degraded` for empty results.
- `400` — invalid payload or an unsupported/unrecognized host.
- `502` — unexpected scrape failure.

## How it works

Datacenter IPs (what Workers egress from) are treated harshly by these platforms. The scraper avoids the bot-defended HTML pages and targets the public CDN/widget endpoints that key on headers rather than IP reputation, with browser-fingerprint headers and jittered backoff. Where an endpoint needs a session token (Instagram), it bootstraps one. Where the data only exists post-render (TikTok, Facebook), it escalates to Cloudflare Browser Rendering — a real Chromium with a genuine TLS fingerprint and auto-acquired cookies — kept warm in a Durable Object. Results are cached in KV (30 min profiles, 10 min feeds) to cut repeat hits and reduce rate-limit exposure.

## Architecture

Clean architecture. Dependencies point inward: `presentation → application → domain`, `infrastructure → domain`. The domain layer has no framework imports. `src/composition.ts` is the only place concrete adapters are wired.

```
src/
  index.tsx                     composition root, routes, DO export
  composition.ts                dependency wiring
  domain/                       entities, ports, errors (pure)
  application/                  use cases, platform detection, registry
  infrastructure/
    cache/                      KV adapter
    http/                       fetch client + browser-header builder
    browser/                    Browser Rendering Durable Object + adapter
    scrapers/                   one scraper + one parser per platform
  presentation/
    routes/ controllers/ schemas/ mappers/ openapi/
```

Per-platform logic lives in `infrastructure/scrapers/<platform>.scraper.ts` (fetch/escalation flow) and `infrastructure/scrapers/parsers/<platform>.parser.ts` (payload → normalized entity).

## Setup

Requires [Bun](https://bun.sh) and a Cloudflare account with Workers (Browser Rendering needs a paid Workers plan).

```sh
bun install
bun run cf-typegen        # regenerate binding types after editing wrangler.jsonc
```

### Local dev

```sh
bunx wrangler dev --remote
```

`--remote` is required. Browser Rendering and the Durable Object do not run in pure local mode, and outbound fetch needs a real CA bundle.

### Deploy

```sh
bunx wrangler kv namespace create SCRAPE_CACHE   # put the id in wrangler.jsonc
bun run deploy
```

## Configuration

Bindings declared in `wrangler.jsonc`:

- `SCRAPE_CACHE` — KV namespace for result caching.
- `MYBROWSER` — Browser Rendering binding.
- `BROWSER_MANAGER` — Durable Object holding the warm Chromium session.

`nodejs_compat` is enabled for `@cloudflare/puppeteer`.

## Limitations

These are platform constraints, not unfinished work.

- **Single datacenter IP.** A Worker egresses from one shared Cloudflare IP. Instagram rate-limits it: bursting many distinct profiles returns `degraded: true` until the IP cools down (tens of seconds). Cached profiles are unaffected.
- **TikTok feeds.** TikTok serves an empty `itemList` (`statusCode: 0`, `TotalCount: 0`) to logged-out clients from datacenter IPs, even through a real browser. Profiles work; video listings do not.
- **Facebook posts.** Facebook does not expose post data to logged-out visitors. Profile metadata (name, handle, follower count, avatar, bio) works; the post feed does not.
- **Trending.** True no-auth "what's trending now" is not reliably available. `niche` search falls back to the platform's public hashtag/explore page.

The fetch-tier IP limits can be worked around per request with `proxyUrl` (see [API](#post-per-profile)). The browser-tier limits (TikTok feeds, Facebook posts) cannot — they need authenticated sessions, which is out of scope.

## Stack

Hono · TypeScript · Bun · Cloudflare Workers, KV, Durable Objects, Browser Rendering · Zod · `@cloudflare/puppeteer` · `@hono/swagger-ui`
