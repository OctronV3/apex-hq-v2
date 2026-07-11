export interface PlausibleConfig {
  baseUrl: string;
  apiKey: string;
  siteId: string;
}

export interface PlausibleTimeSeriesResult {
  date: string;
  visitors: number;
  pageviews: number;
}

export function getPlausibleConfig(): PlausibleConfig | null {
  const baseUrl = process.env.PLAUSIBLE_BASE_URL;
  const apiKey = process.env.PLAUSIBLE_API_KEY;
  const siteId = process.env.PLAUSIBLE_SITE_ID;

  if (!baseUrl || !apiKey || !siteId) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey, siteId };
}

export async function fetchPlausibleTimeSeries(
  config: PlausibleConfig,
  period: string = "6mo"
): Promise<PlausibleTimeSeriesResult[]> {
  const url = new URL(`${config.baseUrl}/api/v1/stats/timeseries`);
  url.searchParams.set("site_id", config.siteId);
  url.searchParams.set("period", period);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${config.apiKey}` },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Plausible error: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { results?: PlausibleTimeSeriesResult[] };
  return json.results || [];
}
