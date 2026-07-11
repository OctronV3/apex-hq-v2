import { IntegrationProvider, Integration, IntegrationConfig, SyncResult } from "../types";

export class BeehiivProvider implements IntegrationProvider {
  readonly slug = "beehiiv";
  readonly name = "Beehiiv";
  readonly type = "newsletter" as const;
  readonly description = "Newsletter subscribers, sends, and metrics";
  readonly isWebview = false;

  private getApiKey() {
    return process.env.BEEHIIV_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.getApiKey();
  }

  getConnectFields() {
    return [
      { name: "apiKey", label: "Beehiiv API key", type: "password" as const, required: true },
      { name: "publicationId", label: "Publication ID", type: "text" as const, required: true },
    ];
  }

  async connect(input: Record<string, unknown>): Promise<IntegrationConfig> {
    const apiKey = String(input.apiKey || this.getApiKey() || "");
    const publicationId = String(input.publicationId || "");
    if (!apiKey || !publicationId) {
      throw new Error("Beehiiv API key and publication ID are required.");
    }

    const res = await fetch(`https://api.beehiiv.com/v2/publications/${publicationId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Beehiiv connection failed: ${res.status} ${text}`);
    }

    const json = (await res.json()) as { data?: { name?: string } };
    return {
      displayName: json.data?.name || publicationId,
      credentials: { apiKey, publicationId },
      config: { publicationId },
    };
  }

  async sync(integration: Integration): Promise<SyncResult> {
    const credentials = integration.credentials as { apiKey: string; publicationId: string } | undefined;
    if (!credentials) return { ok: false, message: "Missing Beehiiv credentials" };

    const [subscribers, posts] = await Promise.all([
      fetch(`https://api.beehiiv.com/v2/publications/${credentials.publicationId}/subscriptions`, {
        headers: { Authorization: `Bearer ${credentials.apiKey}` },
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`https://api.beehiiv.com/v2/publications/${credentials.publicationId}/posts`, {
        headers: { Authorization: `Bearer ${credentials.apiKey}` },
      }).then((r) => (r.ok ? r.json() : null)),
    ]);

    return {
      ok: true,
      message: "Synced Beehiiv data",
      updated: {
        subscribers: (subscribers as { total_results?: number })?.total_results,
        posts: (posts as { data?: unknown[] })?.data,
      },
    };
  }
}
