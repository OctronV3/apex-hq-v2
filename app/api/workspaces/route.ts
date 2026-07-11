import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface WorkspaceShape {
  id: string;
  slug: string;
  name: string;
}

export async function GET() {
  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: memberships, error } = await supabase
    .from("workspace_members")
    .select("role, workspace:workspaces(id, slug, name)")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const workspaces = (memberships || []).map((m) => {
    const workspace = m.workspace as unknown as WorkspaceShape;
    return {
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      role: m.role,
    };
  });

  return NextResponse.json({ workspaces });
}
