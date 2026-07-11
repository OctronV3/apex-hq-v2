import { NextResponse } from "next/server";
import { getServerRegistry } from "@/lib/integrations/server";

export async function GET() {
  const providers = getServerRegistry().map((p) => ({
    slug: p.slug,
    name: p.name,
    type: p.type,
    description: p.description,
    isConfigured: p.isConfigured(),
    isWebview: p.isWebview,
    connectFields: p.getConnectFields?.() || [],
    canSync: !!p.sync,
    canPublish: !!p.publish,
  }));

  return NextResponse.json({ providers });
}
