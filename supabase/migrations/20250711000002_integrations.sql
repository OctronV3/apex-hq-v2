-- Generic integrations table for providers and credentials.

DROP TABLE IF EXISTS public.social_connections;
ALTER TABLE public.social_posts DROP COLUMN IF EXISTS connection_id;

CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_slug TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error', 'disconnected')),
  display_name TEXT,
  config JSONB,
  credentials JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrations_workspace
  ON public.integrations (workspace_id, type);

CREATE INDEX IF NOT EXISTS idx_integrations_provider
  ON public.integrations (workspace_id, provider_slug);

CREATE TRIGGER set_integrations_updated_at BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated, service_role;
GRANT SELECT ON public.integrations TO anon;

CREATE POLICY "integrations_select_member" ON public.integrations
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "integrations_insert_member" ON public.integrations
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "integrations_update_member" ON public.integrations
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "integrations_delete_member" ON public.integrations
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid()));
