import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getWorkspaceId, auditLog } from "@/lib/api-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const [user, workspaceId] = await Promise.all([
    getCurrentUser(supabase),
    getWorkspaceId(supabase, request),
  ]);

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("sponsors")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog(supabase, workspaceId, user.id, "UPDATE", "sponsors", id, body);

  return NextResponse.json({ sponsor: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const [user, workspaceId] = await Promise.all([
    getCurrentUser(supabase),
    getWorkspaceId(supabase, request),
  ]);

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { error } = await supabase
    .from("sponsors")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog(supabase, workspaceId, user.id, "DELETE", "sponsors", id);

  return NextResponse.json({ success: true });
}
