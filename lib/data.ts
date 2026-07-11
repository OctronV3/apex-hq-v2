import { getSupabase } from "./supabase/client";
import { isTauri } from "./env";
import {
  NewsletterItem,
  Sponsor,
  SocialPost,
  EmailMessage,
  EmailFolder,
  RevenuePoint,
  TrafficPoint,
  SocialMetric,
} from "@/types";

const API_BASE = "/api";

function getWorkspaceId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )apex-workspace=([^;]+)/);
  if (match) return match[1];
  return localStorage.getItem("apex-workspace");
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function toCamel<T>(obj: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camel = key.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());
    out[camel] = value;
  }
  return out as T;
}

function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snake = key.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);
    out[snake] = value;
  }
  return out;
}

function toEmail(row: Record<string, unknown>): EmailMessage {
  return {
    id: row.id as string,
    from: row.from_address as string,
    to: row.to_address as string,
    subject: row.subject as string,
    body: row.body as string,
    sentAt: row.sent_at as string,
    folder: row.folder as EmailFolder,
    read: row.read as boolean,
    starred: row.starred as boolean,
    labels: row.labels as string[],
  };
}

function fromEmail(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "from") {
      out["from_address"] = value;
    } else if (key === "to") {
      out["to_address"] = value;
    } else {
      out[key.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`)] = value;
    }
  }
  return out;
}

// ---- Newsletter ----

export async function getNewsletters(): Promise<NewsletterItem[]> {
  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return [];
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return [];
    const { data, error } = await supabase
      .from("newsletters")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((row) => toCamel<NewsletterItem>(row));
  }

  const { newsletters } = await fetchJson<{ newsletters: Record<string, unknown>[] }>(
    "/newsletters"
  );
  return newsletters.map((row) => toCamel<NewsletterItem>(row));
}

export async function addNewsletter(
  item: Omit<NewsletterItem, "id">
): Promise<NewsletterItem> {
  const payload = toSnake(item as Record<string, unknown>);

  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const workspaceId = getWorkspaceId();
    if (!workspaceId) throw new Error("No workspace");
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("newsletters")
      .insert({ ...payload, workspace_id: workspaceId, created_by: user.user?.id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel<NewsletterItem>(data);
  }

  const { newsletter } = await fetchJson<{ newsletter: Record<string, unknown> }>(
    "/newsletters",
    { method: "POST", body: JSON.stringify(payload) }
  );
  return toCamel<NewsletterItem>(newsletter);
}

export async function updateNewsletter(
  id: string,
  patch: Partial<NewsletterItem>
): Promise<NewsletterItem | null> {
  const payload = toSnake(patch as Record<string, unknown>);

  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return null;
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return null;
    const { data, error } = await supabase
      .from("newsletters")
      .update(payload)
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel<NewsletterItem>(data);
  }

  const { newsletter } = await fetchJson<{ newsletter: Record<string, unknown> }>(
    `/newsletters/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
  return toCamel<NewsletterItem>(newsletter);
}

export async function deleteNewsletter(id: string): Promise<void> {
  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return;
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return;
    const { error } = await supabase
      .from("newsletters")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);
    return;
  }

  await fetchJson(`/newsletters/${id}`, { method: "DELETE" });
}

// ---- Sponsors ----

export async function getSponsors(): Promise<Sponsor[]> {
  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return [];
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return [];
    const { data, error } = await supabase
      .from("sponsors")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((row) => toCamel<Sponsor>(row));
  }

  const { sponsors } = await fetchJson<{ sponsors: Record<string, unknown>[] }>(
    "/sponsors"
  );
  return sponsors.map((row) => toCamel<Sponsor>(row));
}

export async function addSponsor(item: Omit<Sponsor, "id">): Promise<Sponsor> {
  const payload = toSnake(item as Record<string, unknown>);

  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const workspaceId = getWorkspaceId();
    if (!workspaceId) throw new Error("No workspace");
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("sponsors")
      .insert({ ...payload, workspace_id: workspaceId, created_by: user.user?.id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel<Sponsor>(data);
  }

  const { sponsor } = await fetchJson<{ sponsor: Record<string, unknown> }>(
    "/sponsors",
    { method: "POST", body: JSON.stringify(payload) }
  );
  return toCamel<Sponsor>(sponsor);
}

export async function updateSponsor(
  id: string,
  patch: Partial<Sponsor>
): Promise<Sponsor | null> {
  const payload = toSnake(patch as Record<string, unknown>);

  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return null;
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return null;
    const { data, error } = await supabase
      .from("sponsors")
      .update(payload)
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel<Sponsor>(data);
  }

  const { sponsor } = await fetchJson<{ sponsor: Record<string, unknown> }>(
    `/sponsors/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
  return toCamel<Sponsor>(sponsor);
}

export async function deleteSponsor(id: string): Promise<void> {
  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return;
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return;
    const { error } = await supabase
      .from("sponsors")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);
    return;
  }

  await fetchJson(`/sponsors/${id}`, { method: "DELETE" });
}

// ---- Social ----

export async function getSocialPosts(): Promise<SocialPost[]> {
  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return [];
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return [];
    const { data, error } = await supabase
      .from("social_posts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((row) => toCamel<SocialPost>(row));
  }

  const { socialPosts } = await fetchJson<{ socialPosts: Record<string, unknown>[] }>(
    "/social-posts"
  );
  return socialPosts.map((row) => toCamel<SocialPost>(row));
}

export async function addSocialPost(
  item: Omit<SocialPost, "id">
): Promise<SocialPost> {
  const payload = toSnake(item as Record<string, unknown>);

  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const workspaceId = getWorkspaceId();
    if (!workspaceId) throw new Error("No workspace");
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("social_posts")
      .insert({ ...payload, workspace_id: workspaceId, created_by: user.user?.id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel<SocialPost>(data);
  }

  const { socialPost } = await fetchJson<{ socialPost: Record<string, unknown> }>(
    "/social-posts",
    { method: "POST", body: JSON.stringify(payload) }
  );
  return toCamel<SocialPost>(socialPost);
}

export async function updateSocialPost(
  id: string,
  patch: Partial<SocialPost>
): Promise<SocialPost | null> {
  const payload = toSnake(patch as Record<string, unknown>);

  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return null;
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return null;
    const { data, error } = await supabase
      .from("social_posts")
      .update(payload)
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel<SocialPost>(data);
  }

  const { socialPost } = await fetchJson<{ socialPost: Record<string, unknown> }>(
    `/social-posts/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
  return toCamel<SocialPost>(socialPost);
}

export async function deleteSocialPost(id: string): Promise<void> {
  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return;
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return;
    const { error } = await supabase
      .from("social_posts")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);
    return;
  }

  await fetchJson(`/social-posts/${id}`, { method: "DELETE" });
}

// ---- Email ----

export async function getEmails(folder?: EmailFolder): Promise<EmailMessage[]> {
  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return [];
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return [];
    let query = supabase
      .from("emails")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("sent_at", { ascending: false });
    if (folder) query = query.eq("folder", folder);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map((row) => toEmail(row));
  }

  const path = folder ? `/emails?folder=${folder}` : "/emails";
  const { emails } = await fetchJson<{ emails: Record<string, unknown>[] }>(path);
  return emails.map((row) => toEmail(row));
}

export async function sendEmail(
  email: Omit<EmailMessage, "id" | "folder" | "sentAt" | "read" | "starred" | "labels">
): Promise<EmailMessage> {
  const payload = {
    ...fromEmail(email as Record<string, unknown>),
    folder: "sent",
    read: true,
    sent_at: new Date().toISOString(),
    labels: [],
  };

  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const workspaceId = getWorkspaceId();
    if (!workspaceId) throw new Error("No workspace");
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("emails")
      .insert({ ...payload, workspace_id: workspaceId, created_by: user.user?.id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toEmail(data);
  }

  const { email: created } = await fetchJson<{ email: Record<string, unknown> }>(
    "/emails",
    { method: "POST", body: JSON.stringify(payload) }
  );
  return toEmail(created);
}

export async function updateEmail(
  id: string,
  patch: Partial<EmailMessage>
): Promise<EmailMessage | null> {
  const payload = fromEmail(patch as Record<string, unknown>);

  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return null;
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return null;
    const { data, error } = await supabase
      .from("emails")
      .update(payload)
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toEmail(data);
  }

  const { email } = await fetchJson<{ email: Record<string, unknown> }>(
    `/emails/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
  return toEmail(email);
}

export async function deleteEmail(id: string): Promise<void> {
  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return;
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return;
    const { error } = await supabase
      .from("emails")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);
    return;
  }

  await fetchJson(`/emails/${id}`, { method: "DELETE" });
}

// ---- Analytics ----

export async function getRevenueData(): Promise<RevenuePoint[]> {
  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return [];
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return [];
    const { data, error } = await supabase
      .from("analytics_revenue")
      .select("date, revenue, subscriptions, ads, sponsors")
      .eq("workspace_id", workspaceId)
      .order("date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map((row) => ({
      date: row.date,
      revenue: row.revenue,
      subscriptions: row.subscriptions,
      ads: row.ads,
      sponsors: row.sponsors,
    }));
  }

  const { data } = await fetchJson<{ data: RevenuePoint[] }>(
    "/analytics?kind=revenue"
  );
  return data;
}

export async function getTrafficData(): Promise<TrafficPoint[]> {
  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return [];
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return [];
    const { data, error } = await supabase
      .from("analytics_traffic")
      .select("date, visitors, page_views")
      .eq("workspace_id", workspaceId)
      .order("date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map((row) => ({
      date: row.date,
      visitors: row.visitors,
      pageViews: row.page_views,
    }));
  }

  const { data } = await fetchJson<{ data: Record<string, unknown>[] }>(
    "/analytics?kind=traffic"
  );
  return data.map((row) => ({
    date: row.date as string,
    visitors: row.visitors as number,
    pageViews: row.page_views as number,
  }));
}

export async function getSocialMetrics(): Promise<SocialMetric[]> {
  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return [];
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return [];
    const { data, error } = await supabase
      .from("analytics_social")
      .select("platform, followers, growth")
      .eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);
    return (data || []).map((row) => ({
      platform: row.platform,
      followers: row.followers,
      growth: Number(row.growth),
    }));
  }

  const { data } = await fetchJson<{ data: Record<string, unknown>[] }>(
    "/analytics?kind=social"
  );
  return data.map((row) => ({
    platform: row.platform as string,
    followers: row.followers as number,
    growth: Number(row.growth),
  }));
}

export async function getKpiStats() {
  if (isTauri()) {
    const supabase = getSupabase();
    if (!supabase) return null;
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return null;
    const { data, error } = await supabase
      .from("kpi_metrics")
      .select(
        "mrr, mrr_growth, subscribers, subscriber_growth, open_rate, open_rate_growth, total_sponsors, sponsor_growth"
      )
      .eq("workspace_id", workspaceId)
      .single();
    if (error) throw new Error(error.message);
    return {
      mrr: data.mrr,
      mrrGrowth: Number(data.mrr_growth),
      subscribers: data.subscribers,
      subscriberGrowth: Number(data.subscriber_growth),
      openRate: data.open_rate,
      openRateGrowth: Number(data.open_rate_growth),
      totalSponsors: data.total_sponsors,
      sponsorGrowth: Number(data.sponsor_growth),
    };
  }

  const { data } = await fetchJson<{ data: Record<string, unknown> }>(
    "/analytics?kind=kpi"
  );
  return {
    mrr: data.mrr as number,
    mrrGrowth: Number(data.mrr_growth),
    subscribers: data.subscribers as number,
    subscriberGrowth: Number(data.subscriber_growth),
    openRate: data.open_rate as number,
    openRateGrowth: Number(data.open_rate_growth),
    totalSponsors: data.total_sponsors as number,
    sponsorGrowth: Number(data.sponsor_growth),
  };
}
