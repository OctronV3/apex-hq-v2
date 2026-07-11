import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user;
}

export async function getWorkspaceId(request: NextRequest) {
  const cookieWorkspace = request.cookies.get("apex-workspace")?.value;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();

  if (cookieWorkspace) {
    const { data: member } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", cookieWorkspace)
      .eq("user_id", user.id)
      .single();
    if (member) return cookieWorkspace;
  }

  const { data: firstMember } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .single();

  return firstMember?.workspace_id || null;
}

export async function auditLog(
  workspaceId: string,
  action: string,
  tableName: string,
  recordId?: string,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id || null;

  await supabase.rpc("log_audit", {
    p_workspace_id: workspaceId,
    p_user_id: userId,
    p_action: action,
    p_table_name: tableName,
    p_record_id: recordId || null,
    p_metadata: metadata || null,
  });
}
