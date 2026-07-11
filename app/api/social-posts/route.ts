import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getWorkspaceId, auditLog } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getWorkspaceId(request);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ socialPosts: data });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getWorkspaceId(request);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const body = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("social_posts")
    .insert({ ...body, workspace_id: workspaceId, created_by: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog(workspaceId, "INSERT", "social_posts", data.id, { platform: data.platform });

  return NextResponse.json({ socialPost: data });
}
