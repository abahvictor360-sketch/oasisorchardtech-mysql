-- ============================================================
-- VoIP Schema for Oasis Orchard Technologies
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. VoIP system settings (key/value store) ───────────────
CREATE TABLE IF NOT EXISTS voip_settings (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key        text UNIQUE NOT NULL,
  value      jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- Insert defaults
INSERT INTO voip_settings (key, value) VALUES
  ('voip_enabled',    '{"value": true}'),
  ('provider_config', '{"provider": "demo", "ratePerMinute": 0.014}')
ON CONFLICT (key) DO NOTHING;

-- ── 2. Per-user VoIP accounts ────────────────────────────────
CREATE TABLE IF NOT EXISTS voip_accounts (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  phone_number  text,                    -- assigned DID / inbound number
  voip_credits  numeric DEFAULT 0,       -- $ credits for overage calls
  voip_enabled  boolean DEFAULT true,    -- admin can disable per user
  sip_username  text,                    -- optional SIP credentials
  sip_password  text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ── 3. Call log ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voip_calls (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  direction        text CHECK (direction IN ('outbound', 'inbound', 'internal')) NOT NULL,
  from_number      text,
  to_number        text,
  status           text DEFAULT 'initiated'
                     CHECK (status IN ('initiated','ringing','answered','ended','missed','cancelled','failed','credit')),
  duration_seconds integer DEFAULT 0,
  cost             numeric DEFAULT 0,    -- dollars charged (overage)
  call_sid         text,                 -- provider call ID (Twilio SID, Telnyx ID, etc.)
  started_at       timestamptz DEFAULT now(),
  ended_at         timestamptz
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS voip_calls_user_idx  ON voip_calls (user_id);
CREATE INDEX IF NOT EXISTS voip_calls_date_idx  ON voip_calls (started_at DESC);
CREATE INDEX IF NOT EXISTS voip_calls_status_idx ON voip_calls (status);

-- ── 4. Row Level Security ─────────────────────────────────────

-- voip_settings: only admins can write; all authenticated users can read
ALTER TABLE voip_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voip_settings_read"  ON voip_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "voip_settings_write" ON voip_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- voip_accounts: users can read/update their own row; admins can read/update all
ALTER TABLE voip_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voip_accounts_own"   ON voip_accounts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "voip_accounts_admin" ON voip_accounts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- voip_calls: users can read/insert their own calls; admins can read all
ALTER TABLE voip_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voip_calls_own_read"   ON voip_calls
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "voip_calls_own_insert" ON voip_calls
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "voip_calls_own_update" ON voip_calls
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "voip_calls_admin"      ON voip_calls
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ── 5. Auto-update timestamps ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS voip_accounts_updated_at ON voip_accounts;
CREATE TRIGGER voip_accounts_updated_at
  BEFORE UPDATE ON voip_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 6. Helper: join profiles in voip_calls queries ────────────
-- The admin call logs page joins voip_calls with profiles.
-- Make sure your profiles table exists and has name + email columns.
-- If it doesn't have those, add them:
--
--   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name  text;
--   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
--
-- Also ensure profiles.role column exists (used by RLS policies):
--   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- ============================================================
-- SUPABASE EDGE FUNCTION STUBS
-- ============================================================
-- For LIVE calling you need a Supabase Edge Function to generate
-- provider access tokens (can't expose API keys in frontend).
--
-- Create: supabase/functions/voip-token/index.ts
--
-- Example for Twilio:
-- ─────────────────────────────────────────────
-- import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
-- import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
-- import { AccessToken, VoiceGrant } from "npm:twilio"
--
-- serve(async (req) => {
--   const { userId } = await req.json()
--   const token = new AccessToken(
--     Deno.env.get("TWILIO_ACCOUNT_SID"),
--     Deno.env.get("TWILIO_API_KEY"),
--     Deno.env.get("TWILIO_API_SECRET"),
--     { identity: userId }
--   )
--   token.addGrant(new VoiceGrant({ outgoingApplicationSid: Deno.env.get("TWILIO_TWIML_APP_SID") }))
--   return new Response(JSON.stringify({ token: token.toJwt() }), {
--     headers: { "Content-Type": "application/json" }
--   })
-- })
--
-- Set env vars in Supabase Dashboard → Settings → Edge Functions:
--   TWILIO_ACCOUNT_SID
--   TWILIO_AUTH_TOKEN
--   TWILIO_API_KEY
--   TWILIO_API_SECRET
--   TWILIO_TWIML_APP_SID
--
-- Then in VoipContext.jsx, replace the TODO block with:
--   const { data } = await supabase.functions.invoke('voip-token',
--     { body: { userId: user.id } });
--   // boot Twilio.Device with data.token
-- ============================================================
