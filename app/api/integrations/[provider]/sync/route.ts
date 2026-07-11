import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/api-helpers";
import { getServerProvider } from "@/lib/integrations/server";
import type { Integration } from "@/lib/integrations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId(supabase, request);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { provider: providerSlug } = await params;
  const provider = getServerProvider(providerSlug);
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });

  const { id } = await request.json();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Integration not found" }, { status: 404 });

  if (!provider.sync) return NextResponse.json({ error: "Provider does not support sync" }, { status: 400 });

  const result = await provider.sync(data as unknown as Integration);

  if (providerSlug === "plausible" && result.ok && result.updated) {
    const points = (result.updated as unknown as { date: string; visitors: number; pageviews: number }[]).map((row) => ({
      workspace_id: workspaceId,
      date: row.date,
      visitors: row.visitors,
      page_views: row.pageviews,
    }));
    await supabase.from("analytics_traffic").upsert(points, { onConflict: "workspace_id,date" });
  }

  if (providerSlug === "imap" && result.ok && (result.updated as { emails?: unknown[] } | undefined)?.emails) {
    const emails = (result.updated as { emails: unknown[] }).emails.map((e) => {
      const email = e as { from: string; to: string; subject: string; body: string; sentAt: string };
      return {
        workspace_id: workspaceId,
        from_address: email.from,
        to_address: email.to,
        subject: email.subject,
        body: email.body,
        sent_at: email.sentAt,
        folder: "inbox",
      };
    });
    await supabase.from("emails").insert(emails);
  }

  if (providerSlug === "beehiiv" && result.ok && result.updated) {
    await supabase
      .from("integrations")
      .update({
        config: {
          ...(data.config || {}),
          subscribers: (result.updated as { subscribers?: number }).subscribers,
          posts: (result.updated as { posts?: unknown[] }).posts,
        },
      })
      .eq("id", id);
  }

  return NextResponse.json(result);
}
