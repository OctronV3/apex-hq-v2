import { IntegrationProvider, Integration, IntegrationConfig, SyncResult } from "../types";

export class PlausibleProvider implements IntegrationProvider {
  readonly slug = "plausible";
  readonly name = "Plausible Analytics";
  readonly type = "analytics" as const;
  readonly description = "Website traffic and analytics";
  readonly isWebview = false;

  private getConfig() {
    return {
      baseUrl: process.env.PLAUSIBLE_BASE_URL?.replace(/\/$/, ""),
      apiKey: process.env.PLAUSIBLE_API_KEY,
      siteId: process.env.PLAUSIBLE_SITE_ID,
    };
  }

  isConfigured(): boolean {
    const c = this.getConfig();
    return !!(c.baseUrl && c.apiKey && c.siteId);
  }

  getConnectFields() {
    return [
      { name: "baseUrl", label: "Plausible base URL", type: "url" as const, placeholder: "https://plausible.io", required: true },
      { name: "apiKey", label: "API key", type: "password" as const, required: true },
      { name: "siteId", label: "Site ID", type: "text" as const, placeholder: "yourdomain.com", required: true },
    ];
  }

  async connect(input: Record<string, unknown>): Promise<IntegrationConfig> {
    const baseUrl = String(input.baseUrl || this.getConfig().baseUrl || "").replace(/\/$/, "");
    const apiKey = String(input.apiKey || this.getConfig().apiKey || "");
    const siteId = String(input.siteId || this.getConfig().siteId || "");

    if (!baseUrl || !apiKey || !siteId) {
      throw new Error("Plausible base URL, API key, and site ID are required.");
    }

    const url = new URL(`${baseUrl}/api/v1/stats/aggregate`);
    url.searchParams.set("site_id", siteId);
    url.searchParams.set("period", "30d");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Plausible connection failed: ${res.status} ${text}`);
    }

    return {
      displayName: `Plausible — ${siteId}`,
      credentials: { baseUrl, apiKey, siteId },
      config: { siteId },
    };
  }

  async sync(integration: Integration): Promise<SyncResult> {
    const credentials = integration.credentials as { baseUrl: string; apiKey: string; siteId: string } | undefined;
    if (!credentials?.baseUrl || !credentials?.apiKey || !credentials?.siteId) {
      return { ok: false, message: "Missing Plausible credentials" };
    }

    const url = new URL(`${credentials.baseUrl}/api/v1/stats/timeseries`);
    url.searchParams.set("site_id", credentials.siteId);
    url.searchParams.set("period", "6mo");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${credentials.apiKey}` },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, message: `Plausible sync failed: ${res.status} ${text}` };
    }

    const json = (await res.json()) as { results?: { date: string; visitors: number; pageviews: number }[] };
    return { ok: true, message: `Synced ${json.results?.length || 0} traffic points`, updated: json.results };
  }
}
