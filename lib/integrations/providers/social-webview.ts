import { IntegrationProvider, IntegrationConfig, Integration } from "../types";

const socialPlatforms: Record<string, { name: string; url: string; color: string }> = {
  "x-webview": { name: "X / Twitter", url: "https://x.com", color: "text-white" },
  "linkedin-webview": { name: "LinkedIn", url: "https://www.linkedin.com", color: "text-blue-500" },
  "instagram-webview": { name: "Instagram", url: "https://www.instagram.com", color: "text-pink-500" },
  "facebook-webview": { name: "Facebook", url: "https://www.facebook.com", color: "text-blue-400" },
  "youtube-webview": { name: "YouTube", url: "https://www.youtube.com", color: "text-red-500" },
  "tiktok-webview": { name: "TikTok", url: "https://www.tiktok.com", color: "text-white" },
  "threads-webview": { name: "Threads", url: "https://www.threads.net", color: "text-white" },
  "bluesky-webview": { name: "Bluesky", url: "https://bsky.app", color: "text-sky-400" },
};

export class SocialWebviewProvider implements IntegrationProvider {
  readonly slug: string;
  readonly name: string;
  readonly type = "social" as const;
  readonly description = "Open the platform in an embedded webview";
  readonly isWebview = true;

  private readonly platform: { name: string; url: string; color: string };

  constructor(slug: string) {
    if (!socialPlatforms[slug]) {
      throw new Error(`Unknown social webview provider: ${slug}`);
    }
    this.slug = slug;
    this.platform = socialPlatforms[slug];
    this.name = this.platform.name;
  }

  isConfigured(): boolean {
    return true;
  }

  getConnectFields() {
    return [
      { name: "accountName", label: "Account name", type: "text" as const, placeholder: "My Business", required: false },
      { name: "accountHandle", label: "Handle / URL path", type: "text" as const, placeholder: "username", required: false },
    ];
  }

  async connect(input: Record<string, unknown>): Promise<IntegrationConfig> {
    const accountHandle = input.accountHandle ? String(input.accountHandle).replace(/^\//, "") : undefined;
    const profileUrl = accountHandle ? `${this.platform.url.replace(/\/$/, "")}/${accountHandle}` : this.platform.url;

    return {
      displayName: accountHandle ? `${this.platform.name} — @${accountHandle}` : this.platform.name,
      config: {
        accountName: input.accountName ? String(input.accountName) : undefined,
        accountHandle,
        profileUrl,
        color: this.platform.color,
      },
    };
  }

  getWebviewUrl(config?: Record<string, unknown>): string | null {
    const handle = config?.accountHandle ? String(config.accountHandle).replace(/^\//, "") : undefined;
    return handle ? `${this.platform.url.replace(/\/$/, "")}/${handle}` : this.platform.url;
  }

  async sync(integration: Integration): Promise<{ ok: boolean; message?: string }> {
    void integration;
    return { ok: true, message: "Webview connections sync metrics manually or via API provider." };
  }
}

export function socialWebviewProviders(): SocialWebviewProvider[] {
  return Object.keys(socialPlatforms).map((slug) => new SocialWebviewProvider(slug));
}
