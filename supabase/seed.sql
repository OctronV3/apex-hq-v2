-- Seed a demo operator and sample workspace data for local development

DO $$
DECLARE
  demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
  demo_workspace_id UUID;
BEGIN
  -- Create demo user (password: demo-operator)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    phone_change,
    phone_change_token,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    is_sso_user,
    is_anonymous,
    created_at,
    updated_at
  ) VALUES (
    demo_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'demo@apex.hq',
    extensions.crypt('demo-operator', extensions.gen_salt('bf', 10)),
    NOW(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email"}'::jsonb,
    '{"full_name":"Demo Operator"}'::jsonb,
    FALSE,
    FALSE,
    FALSE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- The auth.users trigger creates the profile and workspace automatically.
  -- Fetch the workspace id for seeding child records.
  SELECT id INTO demo_workspace_id FROM public.workspaces WHERE owner_id = demo_user_id;

  IF demo_workspace_id IS NULL THEN
    RETURN;
  END IF;

  -- Newsletter pipeline
  INSERT INTO public.newsletters (workspace_id, title, author, stage, scheduled_at, sent_at, open_rate, click_rate, tags, created_by)
  VALUES
    (demo_workspace_id, 'Market Pulse: July 2026', 'B. Wayne', 'writing', NULL, NULL, NULL, NULL, ARRAY['markets','weekly'], demo_user_id),
    (demo_workspace_id, 'The Operator''s Playbook #12', 'A. Fox', 'scheduled', NOW() + INTERVAL '1 day', NULL, NULL, NULL, ARRAY['ops','playbook'], demo_user_id),
    (demo_workspace_id, 'Sponsor Spotlight: Gotham Tools', 'B. Wayne', 'published', NULL, NOW() - INTERVAL '2 days', 62, 14, ARRAY['sponsor'], demo_user_id),
    (demo_workspace_id, 'Deep Dive: Newsletter Growth Loops', 'L. Cain', 'idea', NULL, NULL, NULL, NULL, ARRAY['growth','strategy'], demo_user_id),
    (demo_workspace_id, 'Community Digest #45', 'B. Wayne', 'published', NULL, NOW() - INTERVAL '7 days', 55, 9, ARRAY['community'], demo_user_id);

  -- Sponsors
  INSERT INTO public.sponsors (workspace_id, name, tier, deal_value, status, start_date, end_date, contact, created_by)
  VALUES
    (demo_workspace_id, 'Gotham Tools', 'platinum', 50000, 'active', '2026-01-15', '2026-12-31', 'lucius.fox@gotham.tools', demo_user_id),
    (demo_workspace_id, 'Wayne Enterprises', 'gold', 25000, 'active', '2026-03-01', '2026-08-31', 'bruce@wayne.com', demo_user_id),
    (demo_workspace_id, 'Arkham Analytics', 'silver', 12000, 'negotiating', '2026-07-01', NULL, 'sales@arkham.io', demo_user_id),
    (demo_workspace_id, 'Ace Chemicals', 'bronze', 4000, 'expired', '2025-06-01', '2026-05-31', 'contact@acechem.com', demo_user_id);

  -- Social posts
  INSERT INTO public.social_posts (workspace_id, platform, content, scheduled_at, published_at, status, metrics, created_by)
  VALUES
    (demo_workspace_id, 'twitter', 'The bat-signal is on. New operator playbook drops tomorrow at 0600.', NOW() + INTERVAL '4 hours', NULL, 'scheduled', NULL, demo_user_id),
    (demo_workspace_id, 'linkedin', 'Revenue is a lagging metric. Operating tempo is the leading one. Here''s how we run the batcave.', NULL, NOW() - INTERVAL '12 hours', 'published', '{"likes":432,"shares":89,"comments":34,"impressions":12000}'::jsonb, demo_user_id),
    (demo_workspace_id, 'threads', 'Three decisions that made the July sponsor deck close 48 hours faster.', NULL, NULL, 'draft', NULL, demo_user_id);

  -- Emails
  INSERT INTO public.emails (workspace_id, from_address, to_address, subject, body, sent_at, folder, read, starred, labels, created_by)
  VALUES
    (demo_workspace_id, 'lucius.fox@wayne.com', 'bruce@apex.hq', 'Q3 capex proposal', 'Bruce —\n\nThe Q3 capex proposal is ready for review. Let me know if you want to adjust the tooling budget before we send it to the board.', NOW() - INTERVAL '45 minutes', 'inbox', FALSE, TRUE, ARRAY['finance','board'], demo_user_id),
    (demo_workspace_id, 'sales@arkham.io', 'bruce@apex.hq', 'Re: Sponsorship renewal', 'Thanks for the quick response. We can lock in the silver tier by Friday if the invoice terms work.', NOW() - INTERVAL '3 hours', 'inbox', TRUE, FALSE, ARRAY['sponsors'], demo_user_id),
    (demo_workspace_id, 'bruce@apex.hq', 'team@apex.hq', 'Operator all-hands: Monday 0600', 'Team —\n\nMonday kickoff will focus on newsletter cadence and sponsor deliverables. Come prepared.', NOW() - INTERVAL '1 day', 'sent', TRUE, FALSE, ARRAY['internal'], demo_user_id);

  -- Analytics revenue (12 months)
  INSERT INTO public.analytics_revenue (workspace_id, date, revenue, subscriptions, ads, sponsors)
  SELECT
    demo_workspace_id,
    to_char(d, 'Mon YYYY'),
    42000 + (row_number() OVER (ORDER BY d) * 1500) + (floor(random()*8000)::int - 2000),
    25000 + (row_number() OVER (ORDER BY d) * 800),
    10000 + (row_number() OVER (ORDER BY d) * 400),
    8000 + (row_number() OVER (ORDER BY d) * 300)
  FROM generate_series(NOW() - INTERVAL '11 months', NOW(), INTERVAL '1 month') AS d;

  -- Analytics traffic (30 days)
  INSERT INTO public.analytics_traffic (workspace_id, date, visitors, page_views)
  SELECT
    demo_workspace_id,
    to_char(d, 'Mon DD'),
    12000 + (row_number() OVER (ORDER BY d) * 40) + (floor(random()*2000)::int - 900),
    (12000 + (row_number() OVER (ORDER BY d) * 40) + (floor(random()*2000)::int - 900)) * (2.4 + random())
  FROM generate_series(NOW() - INTERVAL '29 days', NOW(), INTERVAL '1 day') AS d;

  -- Analytics social
  INSERT INTO public.analytics_social (workspace_id, platform, followers, growth)
  VALUES
    (demo_workspace_id, 'Twitter', 48200, 4.2),
    (demo_workspace_id, 'LinkedIn', 21500, 6.7),
    (demo_workspace_id, 'Instagram', 12800, 2.1),
    (demo_workspace_id, 'Threads', 8400, 8.4);

  -- KPI snapshot
  INSERT INTO public.kpi_metrics (workspace_id, mrr, mrr_growth, subscribers, subscriber_growth, open_rate, open_rate_growth, total_sponsors, sponsor_growth)
  VALUES (demo_workspace_id, 42400, 12.5, 14200, 8.3, 58, 2.1, 14, 16);
END $$;
