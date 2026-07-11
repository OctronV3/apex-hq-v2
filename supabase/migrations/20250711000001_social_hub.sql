-- Expand social posts platform values and add connection support.

-- Social platform connections for OAuth/API or webview sessions.
CREATE TABLE IF NOT EXISTS public.social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  account_name TEXT,
  account_handle TEXT,
  external_id TEXT,
  profile_url TEXT,
  connection_method TEXT NOT NULL DEFAULT 'webview' CHECK (connection_method IN ('api', 'webview')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error', 'disconnected')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  metrics JSONB,
  recent_posts JSONB,
  profile JSONB,
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_connections_workspace
  ON public.social_connections (workspace_id);

CREATE TRIGGER set_social_connections_updated_at BEFORE UPDATE ON public.social_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_connections TO authenticated, service_role;
GRANT SELECT ON public.social_connections TO anon;

CREATE POLICY "social_connections_select_member" ON public.social_connections
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "social_connections_insert_member" ON public.social_connections
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "social_connections_update_member" ON public.social_connections
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "social_connections_delete_member" ON public.social_connections
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid()));

-- Update social_posts platform check to include more platforms.
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    WHERE cls.relname = 'social_posts'
      AND ns.nspname = 'public'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%platform%'
  LOOP
    EXECUTE format('ALTER TABLE public.social_posts DROP CONSTRAINT %I', constraint_record.conname);
  END LOOP;
END $$;

ALTER TABLE public.social_posts
  ADD CONSTRAINT social_posts_platform_check
  CHECK (platform IN ('twitter', 'x', 'linkedin', 'instagram', 'threads', 'facebook', 'youtube', 'tiktok', 'bluesky'));

ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES public.social_connections(id) ON DELETE SET NULL;
