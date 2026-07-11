import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/api-helpers";
import { generateCalendarEvents } from "@/lib/calendar";
import { toCamel } from "@/lib/utils";
import type { NewsletterItem, SocialPost, Sponsor } from "@/types";

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

  const [{ data: newsletters }, { data: sponsors }, { data: socialPosts }] = await Promise.all([
    supabase.from("newsletters").select("*").eq("workspace_id", workspaceId),
    supabase.from("sponsors").select("*").eq("workspace_id", workspaceId),
    supabase.from("social_posts").select("*").eq("workspace_id", workspaceId),
  ]);

  const events = generateCalendarEvents(
    (newsletters || []).map((row) => toCamel<NewsletterItem>(row)),
    (sponsors || []).map((row) => toCamel<Sponsor>(row)),
    (socialPosts || []).map((row) => toCamel<SocialPost>(row))
  );

  return NextResponse.json({ events });
}
