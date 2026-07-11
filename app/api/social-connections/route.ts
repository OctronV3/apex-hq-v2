import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getWorkspaceId, auditLog } from "@/lib/api-helpers";
import { toCamel, toSnake } from "@/lib/utils";
import type { SocialConnection } from "@/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId(supabase, request);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { data, error } = await supabase
    .from("social_connections")
    .select("id, workspace_id, user_id, platform, account_name, account_handle, external_id, profile_url, connection_method, status, metrics, recent_posts, profile, connected_at, disconnected_at, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: (data || []).map((row) => toCamel<SocialConnection>(row)) });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId(supabase, request);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const user = await getCurrentUser(supabase);
  const body = await request.json();

  const payload = toSnake({
    ...body,
    workspaceId,
    userId: user?.id,
  });

  const { data, error } = await supabase
    .from("social_connections")
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog(supabase, workspaceId, user?.id || null, "INSERT", "social_connections", data.id);

  return NextResponse.json({ data: toCamel<SocialConnection>(data) }, { status: 201 });
}
