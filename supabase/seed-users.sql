-- ============================================================
-- Oasis Orchard Technologies — Seed Demo Users
-- Run this in: Supabase Dashboard > SQL Editor
-- Creates:
--   user@oasis.com  / user123   (regular user)
--   admin@oasis.com / admin123  (admin)
-- ============================================================

DO $$
DECLARE
  v_user_id  UUID := gen_random_uuid();
  v_admin_id UUID := gen_random_uuid();
BEGIN

  -- ── Regular user ────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id,
    email, encrypted_password,
    email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role,
    created_at, updated_at,
    confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'user@oasis.com',
    crypt('user123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Demo User","plan":"basic","role":"user"}',
    'authenticated', 'authenticated',
    NOW(), NOW(),
    '', '', '', ''
  )
  ON CONFLICT (email) DO NOTHING;

  -- ── Admin user ──────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id,
    email, encrypted_password,
    email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role,
    created_at, updated_at,
    confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    v_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@oasis.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Admin User","plan":"business","role":"admin"}',
    'authenticated', 'authenticated',
    NOW(), NOW(),
    '', '', '', ''
  )
  ON CONFLICT (email) DO NOTHING;

  -- ── Identities (required for email login to work) ───────────
  INSERT INTO auth.identities (
    id, user_id, provider_id,
    identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id, 'user@oasis.com',
    jsonb_build_object('sub', v_user_id::text, 'email', 'user@oasis.com'),
    'email',
    NOW(), NOW(), NOW()
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, provider_id,
    identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_admin_id, 'admin@oasis.com',
    jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@oasis.com'),
    'email',
    NOW(), NOW(), NOW()
  )
  ON CONFLICT DO NOTHING;

  -- ── Force admin role on profile ──────────────────────────────
  -- (the trigger auto-creates profiles, but we ensure admin role is set)
  UPDATE public.profiles
  SET role = 'admin', plan = 'business', name = 'Admin User'
  WHERE email = 'admin@oasis.com';

  UPDATE public.profiles
  SET role = 'user', plan = 'basic', name = 'Demo User'
  WHERE email = 'user@oasis.com';

END $$;
