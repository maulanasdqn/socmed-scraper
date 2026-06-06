export class UnsupportedPlatformError extends Error {
  constructor(url: string) {
    super(`Unsupported or unrecognized platform for url: ${url}`);
    this.name = "UnsupportedPlatformError";
  }
}

export class InvalidUrlError extends Error {
  constructor(url: string) {
    super(`Invalid url: ${url}`);
    this.name = "InvalidUrlError";
  }
}

export class BlockedError extends Error {
  constructor(platform: string) {
    super(`Request blocked by ${platform}`);
    this.name = "BlockedError";
  }
}
