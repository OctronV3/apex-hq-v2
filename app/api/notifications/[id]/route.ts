import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/api-helpers";
import { toCamel, toSnake } from "@/lib/utils";
import type { Notification } from "@/types";

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
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }

  const { id } = await params;
  const body = await request.json();
  const allowed: Record<string, unknown> = {};
  if (typeof body.read === "boolean") allowed.read = body.read;
  if (typeof body.dismissed === "boolean") allowed.dismissed = body.dismissed;

  if (!Object.keys(allowed).length) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("notifications")
    .update(toSnake(allowed))
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ notification: toCamel<Notification>(data) });
}
