import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/api-helpers";

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
    const { data, error } = await supabase
      .from("analytics_revenue")
      .select("date, revenue, subscriptions, ads, sponsors")
      .eq("workspace_id", workspaceId)
      .order("date", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  if (kind === "traffic") {
    const { data, error } = await supabase
      .from("analytics_traffic")
      .select("date, visitors, page_views")
      .eq("workspace_id", workspaceId)
      .order("date", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
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
    const { data, error } = await supabase
      .from("kpi_metrics")
      .select("mrr, mrr_growth, subscribers, subscriber_growth, open_rate, open_rate_growth, total_sponsors, sponsor_growth")
      .eq("workspace_id", workspaceId)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
}
