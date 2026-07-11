import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getWorkspaceId, auditLog } from "@/lib/api-helpers";

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

  const folder = request.nextUrl.searchParams.get("folder") || "inbox";

  const { data, error } = await supabase
    .from("emails")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("folder", folder)
    .order("sent_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ emails: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const [user, workspaceId] = await Promise.all([
    getCurrentUser(supabase),
    getWorkspaceId(supabase, request),
  ]);

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("emails")
    .insert({ ...body, workspace_id: workspaceId, created_by: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog(supabase, workspaceId, user.id, "INSERT", "emails", data.id, { subject: data.subject });

  return NextResponse.json({ email: data });
}
