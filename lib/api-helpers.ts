import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getCurrentUser(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user;
}

export async function getWorkspaceId(
  supabase: SupabaseClient,
  request: NextRequest
) {
  const cookieWorkspace = request.cookies.get("apex-workspace")?.value;

  if (cookieWorkspace) {
    const { data: member } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", cookieWorkspace)
      .single();
    if (member) return cookieWorkspace;
  }

  const { data: firstMember } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .order("created_at", { ascending: true })
    .single();

  return firstMember?.workspace_id || null;
}

export async function auditLog(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string | null,
  action: string,
  tableName: string,
  recordId?: string,
  metadata?: Record<string, unknown>
) {
  await supabase.rpc("log_audit", {
    p_workspace_id: workspaceId,
    p_user_id: userId,
    p_action: action,
    p_table_name: tableName,
    p_record_id: recordId || null,
    p_metadata: metadata || null,
  });
}
