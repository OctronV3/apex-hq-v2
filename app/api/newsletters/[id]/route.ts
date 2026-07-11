import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getWorkspaceId, auditLog } from "@/lib/api-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getWorkspaceId(request);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const body = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("newsletters")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog(workspaceId, "UPDATE", "newsletters", id, body);

  return NextResponse.json({ newsletter: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getWorkspaceId(request);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const supabase = await createClient();

  const { error } = await supabase
    .from("newsletters")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog(workspaceId, "DELETE", "newsletters", id);

  return NextResponse.json({ success: true });
}
