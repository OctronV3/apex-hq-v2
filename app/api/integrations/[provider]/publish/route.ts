import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/api-helpers";
import { getServerProvider } from "@/lib/integrations/server";
import type { Integration } from "@/lib/integrations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId(supabase, request);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { provider: providerSlug } = await params;
  const provider = getServerProvider(providerSlug);
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });

  const { id, payload } = await request.json();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Integration not found" }, { status: 404 });

  if (!provider.publish) return NextResponse.json({ error: "Provider does not support publish" }, { status: 400 });

  const result = await provider.publish(data as unknown as Integration, payload);

  if (providerSlug === "smtp") {
    const config = data.config as Record<string, unknown>;
    const p = payload as Record<string, unknown>;
    await supabase.from("emails").insert({
      workspace_id: workspaceId,
      from_address: String(config?.from || ""),
      to_address: String(p?.to || ""),
      subject: String(p?.subject || ""),
      body: String(p?.body || ""),
      sent_at: new Date().toISOString(),
      folder: "sent",
    });
  }

  return NextResponse.json(result);
}
