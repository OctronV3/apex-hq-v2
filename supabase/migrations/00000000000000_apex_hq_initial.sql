-- Apex HQ v2.0 production schema
-- Supabase Auth, Postgres, RLS, workspaces, audit logging

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles: public data for auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspaces: multi-tenant isolation boundary
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspace members with roles
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

-- Newsletter pipeline
CREATE TABLE IF NOT EXISTS public.newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'idea' CHECK (stage IN ('idea', 'writing', 'scheduled', 'sent')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  open_rate SMALLINT,
  click_rate SMALLINT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Sponsors
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'gold' CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze')),
  deal_value INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'negotiating' CHECK (status IN ('active', 'pending', 'expired', 'negotiating')),
  start_date TEXT,
  end_date TEXT,
  contact TEXT,
  logo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Social posts
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'instagram', 'threads')),
  content TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Email (internal inbox model, not external provider)
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  folder TEXT NOT NULL DEFAULT 'inbox' CHECK (folder IN ('inbox', 'sent', 'draft', 'trash')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  starred BOOLEAN NOT NULL DEFAULT FALSE,
  labels TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Analytics revenue time series
CREATE TABLE IF NOT EXISTS public.analytics_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  revenue INTEGER NOT NULL DEFAULT 0,
  subscriptions INTEGER NOT NULL DEFAULT 0,
  ads INTEGER NOT NULL DEFAULT 0,
  sponsors INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, date)
);

-- Analytics traffic time series
CREATE TABLE IF NOT EXISTS public.analytics_traffic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  visitors INTEGER NOT NULL DEFAULT 0,
  page_views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, date)
);

-- Analytics social platform metrics
CREATE TABLE IF NOT EXISTS public.analytics_social (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  followers INTEGER NOT NULL DEFAULT 0,
  growth NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, platform)
);

-- KPI snapshot
CREATE TABLE IF NOT EXISTS public.kpi_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  mrr INTEGER NOT NULL DEFAULT 0,
  mrr_growth NUMERIC(5,2) NOT NULL DEFAULT 0,
  subscribers INTEGER NOT NULL DEFAULT 0,
  subscriber_growth NUMERIC(5,2) NOT NULL DEFAULT 0,
  open_rate SMALLINT NOT NULL DEFAULT 0,
  open_rate_growth NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_sponsors INTEGER NOT NULL DEFAULT 0,
  sponsor_growth NUMERIC(5,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id)
);

-- Audit logging
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at helper function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at triggers
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_workspaces_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_workspace_members_updated_at BEFORE UPDATE ON public.workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_newsletters_updated_at BEFORE UPDATE ON public.newsletters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_sponsors_updated_at BEFORE UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_social_posts_updated_at BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_emails_updated_at BEFORE UPDATE ON public.emails
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_analytics_revenue_updated_at BEFORE UPDATE ON public.analytics_revenue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_analytics_traffic_updated_at BEFORE UPDATE ON public.analytics_traffic
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_analytics_social_updated_at BEFORE UPDATE ON public.analytics_social
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_kpi_metrics_updated_at BEFORE UPDATE ON public.kpi_metrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper function for audit log
CREATE OR REPLACE FUNCTION public.log_audit(
  p_workspace_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (workspace_id, user_id, action, table_name, record_id, metadata)
  VALUES (p_workspace_id, p_user_id, p_action, p_table_name, p_record_id, p_metadata);
END;
$$;

-- Helper function to create a default workspace on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NULL);

  INSERT INTO public.workspaces (slug, name, owner_id)
  VALUES (LOWER(REPLACE(NEW.email, '@', '-')), 'Apex HQ', NEW.id)
  RETURNING id INTO new_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

-- Trigger on new auth user to bootstrap profile + workspace
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_traffic ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_social ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Grant schema and table privileges to PostgREST roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletters TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsors TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_posts TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emails TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_revenue TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_traffic TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_social TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kpi_metrics TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO authenticated, service_role;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.workspaces TO anon;
GRANT SELECT ON public.workspace_members TO anon;
GRANT SELECT ON public.newsletters TO anon;
GRANT SELECT ON public.sponsors TO anon;
GRANT SELECT ON public.social_posts TO anon;
GRANT SELECT ON public.emails TO anon;
GRANT SELECT ON public.analytics_revenue TO anon;
GRANT SELECT ON public.analytics_traffic TO anon;
GRANT SELECT ON public.analytics_social TO anon;
GRANT SELECT ON public.kpi_metrics TO anon;
GRANT SELECT ON public.audit_logs TO anon;

-- Helper function: is user a member of workspace?
CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id
  );
$$;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Workspaces policies
CREATE POLICY "workspaces_select_member" ON public.workspaces
  FOR SELECT USING (public.is_workspace_member(id, auth.uid()));
CREATE POLICY "workspaces_update_owner" ON public.workspaces
  FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "workspaces_delete_owner" ON public.workspaces
  FOR DELETE USING (owner_id = auth.uid());

-- Workspace members policies
CREATE POLICY "workspace_members_select_member" ON public.workspace_members
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "workspace_members_insert_owner" ON public.workspace_members
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "workspace_members_update_owner" ON public.workspace_members
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "workspace_members_delete_owner" ON public.workspace_members
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid()));

-- Newsletter policies
CREATE POLICY "newsletters_select_member" ON public.newsletters
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "newsletters_insert_member" ON public.newsletters
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "newsletters_update_member" ON public.newsletters
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "newsletters_delete_member" ON public.newsletters
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid()));

-- Sponsors policies
CREATE POLICY "sponsors_select_member" ON public.sponsors
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "sponsors_insert_member" ON public.sponsors
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "sponsors_update_member" ON public.sponsors
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "sponsors_delete_member" ON public.sponsors
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid()));

-- Social posts policies
CREATE POLICY "social_posts_select_member" ON public.social_posts
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "social_posts_insert_member" ON public.social_posts
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "social_posts_update_member" ON public.social_posts
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "social_posts_delete_member" ON public.social_posts
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid()));

-- Emails policies
CREATE POLICY "emails_select_member" ON public.emails
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "emails_insert_member" ON public.emails
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "emails_update_member" ON public.emails
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "emails_delete_member" ON public.emails
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid()));

-- Analytics revenue policies
CREATE POLICY "analytics_revenue_select_member" ON public.analytics_revenue
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "analytics_revenue_insert_member" ON public.analytics_revenue
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "analytics_revenue_update_member" ON public.analytics_revenue
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "analytics_revenue_delete_member" ON public.analytics_revenue
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid()));

-- Analytics traffic policies
CREATE POLICY "analytics_traffic_select_member" ON public.analytics_traffic
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "analytics_traffic_insert_member" ON public.analytics_traffic
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "analytics_traffic_update_member" ON public.analytics_traffic
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "analytics_traffic_delete_member" ON public.analytics_traffic
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid()));

-- Analytics social policies
CREATE POLICY "analytics_social_select_member" ON public.analytics_social
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "analytics_social_insert_member" ON public.analytics_social
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "analytics_social_update_member" ON public.analytics_social
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "analytics_social_delete_member" ON public.analytics_social
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid()));

-- KPI metrics policies
CREATE POLICY "kpi_metrics_select_member" ON public.kpi_metrics
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "kpi_metrics_insert_member" ON public.kpi_metrics
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "kpi_metrics_update_member" ON public.kpi_metrics
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "kpi_metrics_delete_member" ON public.kpi_metrics
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid()));

-- Audit logs policies
CREATE POLICY "audit_logs_select_member" ON public.audit_logs
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
