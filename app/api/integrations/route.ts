import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceId, auditLog } from "@/lib/api-helpers";
import { getServerProvider } from "@/lib/integrations/server";
import { toCamel, toSnake } from "@/lib/utils";
import type { Integration } from "@/lib/integrations";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId(supabase, request);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const type = request.nextUrl.searchParams.get("type") || undefined;
  let query = supabase
    .from("integrations")
    .select("id, workspace_id, user_id, provider_slug, type, status, display_name, config, created_at, updated_at")
    .eq("workspace_id", workspaceId);
  if (type) query = query.eq("type", type);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ integrations: (data || []).map((row) => toCamel<Integration>(row)) });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId(supabase, request);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const user = sessionData.session.user;
  const body = await request.json();

  const provider = getServerProvider(body.providerSlug);
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });

  const config = await provider.connect(body.input || {});

  const payload = toSnake({
    workspaceId,
    userId: user?.id,
    providerSlug: provider.slug,
    type: provider.type,
    status: "connected",
    displayName: config.displayName || provider.name,
    config: config.config || {},
    credentials: config.credentials || {},
  });

  const { data, error } = await supabase
    .from("integrations")
    .insert(payload)
    .select("id, workspace_id, user_id, provider_slug, type, status, display_name, config, created_at, updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog(supabase, workspaceId, user?.id || null, "INSERT", "integrations", data.id, { provider: provider.slug });

  const row = toCamel<Integration>(data);
  return NextResponse.json({ integration: row }, { status: 201 });
}
