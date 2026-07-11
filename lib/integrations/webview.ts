import { isTauri } from "@/lib/env";

export async function openIntegrationWebview(providerSlug: string, url: string): Promise<void> {
  if (!url) return;

  if (isTauri()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_integration_webview", { provider: providerSlug, url });
      return;
    } catch (e) {
      console.warn("Tauri integration webview not available, falling back to browser.", e);
    }
  }

  window.open(url, "_blank", "noopener,noreferrer,width=1200,height=800");
}
