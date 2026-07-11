import { NextRequest, NextResponse } from "next/server";
import { parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/api-helpers";
import { computeKpiStats, computeRevenueTimeSeries } from "@/lib/analytics";
import { getPlausibleConfig, fetchPlausibleTimeSeries } from "@/lib/plausible";
import type { Sponsor, NewsletterItem, TrafficPoint } from "@/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId(supabase, request);
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }

  const kind = request.nextUrl.searchParams.get("kind");

  if (kind === "revenue") {
    const { data: sponsors, error } = await supabase
      .from("sponsors")
      .select("id, name, tier, deal_value, status, start_date, end_date, contact")
      .eq("workspace_id", workspaceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const mappedSponsors = (sponsors || []).map((row) => ({
      id: row.id,
      name: row.name,
      tier: row.tier,
      dealValue: row.deal_value,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      contact: row.contact,
    })) satisfies Sponsor[];

    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
    const granularity = request.nextUrl.searchParams.get("granularity");

    const data = computeRevenueTimeSeries(mappedSponsors, new Date(), {
      from: from ? parseISO(from) : undefined,
      to: to ? parseISO(to) : undefined,
      granularity: granularity === "yearly" ? "yearly" : "monthly",
    });
    return NextResponse.json({ data });
  }

  if (kind === "traffic") {
    const plausible = getPlausibleConfig();
    if (plausible) {
      try {
        const results = await fetchPlausibleTimeSeries(plausible, "6mo");
        const data: TrafficPoint[] = results.map((row) => ({
          date: row.date,
          visitors: row.visitors,
          pageViews: row.pageviews,
        }));
        return NextResponse.json({ data, source: "plausible" });
      } catch (e) {
        console.error("Plausible fetch failed, falling back to stored traffic.", e);
      }
    }

    const { data, error } = await supabase
      .from("analytics_traffic")
      .select("date, visitors, page_views")
      .eq("workspace_id", workspaceId)
      .order("date", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, source: "database" });
  }

  if (kind === "social") {
    const { data, error } = await supabase
      .from("analytics_social")
      .select("platform, followers, growth")
      .eq("workspace_id", workspaceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  if (kind === "kpi") {
    const [{ data: sponsors, error: sponsorError }, { data: newsletters, error: newsletterError }] =
      await Promise.all([
        supabase
          .from("sponsors")
          .select("id, name, tier, deal_value, status, start_date, end_date, contact")
          .eq("workspace_id", workspaceId),
        supabase
          .from("newsletters")
          .select("id, title, author, stage, scheduled_at, sent_at, open_rate, click_rate, tags")
          .eq("workspace_id", workspaceId),
      ]);

    if (sponsorError) return NextResponse.json({ error: sponsorError.message }, { status: 500 });
    if (newsletterError) return NextResponse.json({ error: newsletterError.message }, { status: 500 });

    const mappedSponsors = (sponsors || []).map((row) => ({
      id: row.id,
      name: row.name,
      tier: row.tier,
      dealValue: row.deal_value,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      contact: row.contact,
    })) satisfies Sponsor[];

    const mappedNewsletters = (newsletters || []).map((row) => ({
      id: row.id,
      title: row.title,
      author: row.author,
      stage: row.stage,
      scheduledAt: row.scheduled_at,
      sentAt: row.sent_at,
      openRate: row.open_rate,
      clickRate: row.click_rate,
      tags: row.tags || [],
    })) satisfies NewsletterItem[];

    const data = computeKpiStats(mappedSponsors, mappedNewsletters);
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
}
