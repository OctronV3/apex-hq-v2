import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getWorkspaceId, auditLog } from "@/lib/api-helpers";
import { generateNotifications, notificationToInput } from "@/lib/notifications";
import { toCamel, toSnake } from "@/lib/utils";
import type { NewsletterItem, Notification, SocialPost, Sponsor } from "@/types";

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

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("dismissed", false)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const notifications = (data || []).map((row) => toCamel<Notification>(row));
  return NextResponse.json({ notifications });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId(supabase, request);
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }

  const user = await getCurrentUser(supabase);

  const [{ data: newsletters }, { data: sponsors }, { data: socialPosts }] = await Promise.all([
    supabase.from("newsletters").select("*").eq("workspace_id", workspaceId),
    supabase.from("sponsors").select("*").eq("workspace_id", workspaceId),
    supabase.from("social_posts").select("*").eq("workspace_id", workspaceId),
  ]);

  const [{ error: deleteError }] = await Promise.all([
    supabase
      .from("notifications")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("is_generated", true)
      .eq("dismissed", false),
  ]);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  const inputs = generateNotifications(
    (newsletters || []).map((row) => toCamel<NewsletterItem>(row)),
    (sponsors || []).map((row) => toCamel<Sponsor>(row)),
    (socialPosts || []).map((row) => toCamel<SocialPost>(row))
  ).map((n) => notificationToInput(n, workspaceId, user?.id));

  if (inputs.length) {
    const payload = inputs.map((n) => toSnake(n as Record<string, unknown>));
    const { error: insertError } = await supabase.from("notifications").insert(payload);
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await auditLog(supabase, workspaceId, user?.id || null, "SYNC", "notifications", undefined, {
    count: inputs.length,
  });

  return NextResponse.json({ count: inputs.length });
}
