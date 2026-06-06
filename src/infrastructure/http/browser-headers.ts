const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export const buildBrowserHeaders = (
  referer: string,
  extra: Record<string, string> = {},
): Record<string, string> => ({
  "user-agent": USER_AGENT,
  accept: "text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "sec-ch-ua": '"Chromium";v="124", "Not:A-Brand";v="24", "Google Chrome";v="124"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "upgrade-insecure-requests": "1",
  referer,
  ...extra,
});
