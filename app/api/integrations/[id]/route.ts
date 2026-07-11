import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceId, auditLog } from "@/lib/api-helpers";
import { toCamel, toSnake } from "@/lib/utils";
import type { Integration } from "@/lib/integrations";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId(supabase, request);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const user = sessionData.session.user;
  const { id } = await params;

  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog(supabase, workspaceId, user?.id || null, "DELETE", "integrations", id);

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId(supabase, request);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const user = sessionData.session.user;
  const { id } = await params;
  const body = await request.json();

  const allowed: Record<string, unknown> = {};
  if (body.status) allowed.status = body.status;
  if (body.config) allowed.config = body.config;
  if (body.displayName) allowed.display_name = body.displayName;

  if (!Object.keys(allowed).length) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("integrations")
    .update(toSnake(allowed))
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select("id, workspace_id, user_id, provider_slug, type, status, display_name, config, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog(supabase, workspaceId, user?.id || null, "UPDATE", "integrations", id);

  return NextResponse.json({ integration: toCamel<Integration>(data) });
}
