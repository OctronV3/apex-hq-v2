import { isTauri } from "./env";

const platformUrls: Record<string, { web: string; app: string }> = {
  twitter: { web: "https://twitter.com", app: "https://twitter.com" },
  x: { web: "https://x.com", app: "https://x.com" },
  linkedin: { web: "https://www.linkedin.com", app: "https://www.linkedin.com" },
  instagram: { web: "https://www.instagram.com", app: "https://www.instagram.com" },
  threads: { web: "https://www.threads.net", app: "https://www.threads.net" },
  facebook: { web: "https://www.facebook.com", app: "https://www.facebook.com" },
  youtube: { web: "https://www.youtube.com", app: "https://www.youtube.com" },
  tiktok: { web: "https://www.tiktok.com", app: "https://www.tiktok.com" },
  bluesky: { web: "https://bsky.app", app: "https://bsky.app" },
};

export function platformUrl(platform: string, handle?: string): string {
  const base = platformUrls[platform] || { web: "", app: "" };
  if (handle && base.web) {
    return `${base.web.replace(/\/$/, "")}/${handle.replace(/^\//, "")}`;
  }
  return base.web;
}

export async function openSocialPlatform(platform: string, handle?: string): Promise<void> {
  const url = platformUrl(platform, handle);
  if (!url) return;

  if (isTauri()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_social_webview", { platform, url });
      return;
    } catch (e) {
      // Fallback to browser if the command is not registered.
      console.warn("Tauri webview not available, falling back to browser.", e);
    }
  }

  window.open(url, "_blank", "noopener,noreferrer,width=1200,height=800");
}
