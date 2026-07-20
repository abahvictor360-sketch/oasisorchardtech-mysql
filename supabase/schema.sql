-- ============================================================
-- Oasis Orchard Technologies — Supabase Schema
-- SAFE TO RUN MULTIPLE TIMES — drops and recreates all policies
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── PROFILES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL DEFAULT '',
  email          TEXT NOT NULL DEFAULT '',
  phone          TEXT,
  address        TEXT,
  plan           TEXT NOT NULL DEFAULT 'basic'
                   CHECK (plan IN ('basic','smart','business')),
  wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','suspended')),
  role           TEXT NOT NULL DEFAULT 'user'
                   CHECK (role IN ('user','admin')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, plan, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'plan', 'basic'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── PRODUCTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  sku            TEXT NOT NULL UNIQUE,
  category       TEXT NOT NULL,
  original_price DECIMAL(10,2),
  price          DECIMAL(10,2) NOT NULL,
  on_sale        BOOLEAN NOT NULL DEFAULT FALSE,
  stock          INTEGER NOT NULL DEFAULT 0,
  rating         DECIMAL(3,1) DEFAULT 0,
  review_count   INTEGER DEFAULT 0,
  image_url      TEXT,
  badge          TEXT,
  short_desc     TEXT,
  specs          JSONB,
  features       JSONB,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ORDERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id               TEXT PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total            DECIMAL(10,2) NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','processing','shipped','delivered')),
  shipping_address JSONB,
  payment_method   TEXT,
  tracking_number  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ORDER ITEMS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id   TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  qty          INTEGER NOT NULL,
  price        DECIMAL(10,2) NOT NULL
);

-- ── WALLET TRANSACTIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('credit','debit')),
  balance_after DECIMAL(10,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SUPPORT TICKETS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id         TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject    TEXT NOT NULL,
  category   TEXT CHECK (category IN ('billing','technical','general','shipping')),
  status     TEXT NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','in-progress','resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TICKET MESSAGES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   TEXT NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL DEFAULT 'User',
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PAGE CONTENT (CMS) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.page_content (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  content     JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS set_page_content_updated_at ON public.page_content;
CREATE TRIGGER set_page_content_updated_at
  BEFORE UPDATE ON public.page_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_content        ENABLE ROW LEVEL SECURITY;

-- ── DROP ALL POLICIES (safe re-run) ─────────────────────────
DROP POLICY IF EXISTS "Users read own profile"        ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile"      ON public.profiles;
DROP POLICY IF EXISTS "Admins read all profiles"      ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles"    ON public.profiles;

DROP POLICY IF EXISTS "Public read products"          ON public.products;
DROP POLICY IF EXISTS "Admin insert products"         ON public.products;
DROP POLICY IF EXISTS "Admin update products"         ON public.products;
DROP POLICY IF EXISTS "Admin delete products"         ON public.products;

DROP POLICY IF EXISTS "Users read own orders"         ON public.orders;
DROP POLICY IF EXISTS "Users insert orders"           ON public.orders;
DROP POLICY IF EXISTS "Admins read all orders"        ON public.orders;
DROP POLICY IF EXISTS "Admins update orders"          ON public.orders;

DROP POLICY IF EXISTS "Users read own order items"    ON public.order_items;
DROP POLICY IF EXISTS "Users insert order items"      ON public.order_items;
DROP POLICY IF EXISTS "Admins read all order items"   ON public.order_items;

DROP POLICY IF EXISTS "Users read own transactions"   ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users insert transactions"     ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins read all transactions"  ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins insert transactions"    ON public.wallet_transactions;

DROP POLICY IF EXISTS "Users read own tickets"        ON public.support_tickets;
DROP POLICY IF EXISTS "Users insert tickets"          ON public.support_tickets;
DROP POLICY IF EXISTS "Users update own tickets"      ON public.support_tickets;
DROP POLICY IF EXISTS "Admins read all tickets"       ON public.support_tickets;
DROP POLICY IF EXISTS "Admins update all tickets"     ON public.support_tickets;

DROP POLICY IF EXISTS "Ticket owner reads messages"   ON public.ticket_messages;
DROP POLICY IF EXISTS "Ticket owner inserts messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Admins read all messages"      ON public.ticket_messages;
DROP POLICY IF EXISTS "Admins insert all messages"    ON public.ticket_messages;

DROP POLICY IF EXISTS "Public read page_content"      ON public.page_content;
DROP POLICY IF EXISTS "Admins write page_content"     ON public.page_content;

-- ── ADMIN HELPER FUNCTION ────────────────────────────────────
-- SECURITY DEFINER bypasses RLS, breaking the recursion that occurs
-- when policies on the profiles table query the profiles table itself.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ── CREATE POLICIES ──────────────────────────────────────────

-- profiles
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins update all profiles"
  ON public.profiles FOR UPDATE USING (public.is_admin());

-- products
CREATE POLICY "Public read products"
  ON public.products FOR SELECT USING (TRUE);
CREATE POLICY "Admin insert products"
  ON public.products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin update products"
  ON public.products FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete products"
  ON public.products FOR DELETE USING (public.is_admin());

-- orders
CREATE POLICY "Users read own orders"
  ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert orders"
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all orders"
  ON public.orders FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins update orders"
  ON public.orders FOR UPDATE USING (public.is_admin());

-- order_items
CREATE POLICY "Users read own order items"
  ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Users insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Admins read all order items"
  ON public.order_items FOR SELECT USING (public.is_admin());

-- wallet_transactions
CREATE POLICY "Users read own transactions"
  ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert transactions"
  ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all transactions"
  ON public.wallet_transactions FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins insert transactions"
  ON public.wallet_transactions FOR INSERT WITH CHECK (public.is_admin());

-- support_tickets
CREATE POLICY "Users read own tickets"
  ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert tickets"
  ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own tickets"
  ON public.support_tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins read all tickets"
  ON public.support_tickets FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins update all tickets"
  ON public.support_tickets FOR UPDATE USING (public.is_admin());

-- ticket_messages
CREATE POLICY "Ticket owner reads messages"
  ON public.ticket_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));
CREATE POLICY "Ticket owner inserts messages"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));
CREATE POLICY "Admins read all messages"
  ON public.ticket_messages FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins insert all messages"
  ON public.ticket_messages FOR INSERT WITH CHECK (public.is_admin());

-- page_content
CREATE POLICY "Public read page_content"
  ON public.page_content FOR SELECT USING (TRUE);
CREATE POLICY "Admins write page_content"
  ON public.page_content FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── SEED: PRODUCTS ───────────────────────────────────────────
INSERT INTO public.products
  (id, name, sku, category, original_price, price, on_sale, stock,
   rating, review_count, image_url, badge, short_desc, specs, features, is_active)
VALUES
('grwp810','Grandstream GRWP810','WP810','mobile',150.00,140.00,true,12,4.3,18,
 '/images/GRWP810.png','Sale',
 'Cordless WiFi phone with 1.8" color TFT LCD, 3.5mm headset jack, AC adapter included.',
 '{"display":"1.8 inch color TFT LCD","connectivity":"WiFi","headsetJack":"3.5mm","powerSupply":"AC adapter included","lines":1}',
 '["Cordless WiFi operation","HD voice quality","1.8 inch color TFT LCD display","3.5mm headset jack","AC power adapter included"]',
 true),

('grwp816','Grandstream GRWP816','WP816','mobile',120.00,115.00,true,8,4.5,24,
 '/images/GRWP816.png','Sale',
 'Cordless WiFi 6 phone with 3-way conferencing, HD audio, 6hr talk-time, 1500mAh battery.',
 '{"display":"Color LCD","connectivity":"WiFi 6","battery":"1500mAh","talkTime":"6 hours","standbyTime":"120 hours","conferencing":"3-way voice","codec":"Opus HD"}',
 '["WiFi 6 connectivity","3-way voice conferencing","Opus HD voice codec","6 hours talk-time","120 hours standby","1500mAh battery"]',
 true),

('grwp820','Grandstream GRWP820','WP820','mobile',270.00,240.00,true,5,4.6,31,
 '/images/GRWP820.png','Sale',
 'wireless phone WiFi 802.11 a/b/g/n, 2 lines, 2.4" TFT LCD, HD audio, Bluetooth, Android 7.0.',
 '{"display":"2.4 inch colour TFT LCD","connectivity":"WiFi 802.11 a/b/g/n","lines":2,"bluetooth":true,"battery":"Li-ion","os":"Android 7.0","audio":"HD audio"}',
 '["2 SIP lines","WiFi 802.11 a/b/g/n","HD audio quality","Bluetooth connectivity","Android 7.0 OS","2.4 inch colour TFT LCD","Li-ion rechargeable battery"]',
 true),

('grwp822','Grandstream GRWP822','WP822','mobile',200.00,165.00,true,9,4.4,22,
 '/images/GRWP822.png','Sale',
 'wireless phone WiFi 802.11 a/b/g/n, 2 lines, 2.4" TFT LCD, HD audio, Bluetooth, Android 7.0.',
 '{"display":"2.4 inch colour TFT LCD","connectivity":"WiFi 802.11 a/b/g/n","lines":2,"bluetooth":true,"battery":"Li-ion","os":"Android 7.0","audio":"HD audio"}',
 '["2 SIP lines","WiFi 802.11 a/b/g/n","HD audio quality","Bluetooth connectivity","Android 7.0 OS","2.4 inch colour TFT LCD","Li-ion rechargeable battery"]',
 true),

('grwp825','Grandstream GRWP825','WP825','mobile',270.00,220.00,true,6,4.7,19,
 '/images/GRWP825.png','Sale',
 'Business wireless phone, 2 lines, 2.4" TFT LCD, HD audio, USB port, 3.5mm jack, Bluetooth, rechargeable.',
 '{"display":"2.4 inch colour TFT LCD","lines":2,"usb":true,"headsetJack":"3.5mm","bluetooth":true,"battery":"Rechargeable Li-ion","audio":"HD audio"}',
 '["2 SIP lines","HD audio quality","USB port","3.5mm headset jack","Integrated Bluetooth","2.4 inch colour TFT LCD","Rechargeable battery"]',
 true),

('grwp826','Grandstream GRWP826','WP826','mobile',170.00,150.00,true,14,4.8,27,
 '/images/GRWP826.png','Sale',
 'Cordless WiFi 6 phone, 4-way conferencing, 12hr talk-time, 240hr standby, 3000mAh battery.',
 '{"connectivity":"WiFi 6","conferencing":"4-way voice","codec":"Opus HD","talkTime":"12 hours","standbyTime":"240 hours","battery":"3000mAh"}',
 '["WiFi 6 connectivity","4-way voice conferencing","Opus HD voice codec","12 hours talk-time","240 hours standby","3000mAh high-capacity battery"]',
 true),

('grgrp2602w','Grandstream GRGRP2602W','GRP2602W','home-phone',110.00,80.00,true,20,4.5,35,
 '/images/GRGRP2602W.png','Sale',
 'Business IP WiFi 802.11 a/b/g/n/ac desktop phone, 2 lines, 2.21" LCD, HD audio, EHS headset support.',
 '{"display":"2.21 inch LCD","connectivity":"WiFi 802.11 a/b/g/n/ac (2.4GHz & 5GHz)","ethernet":"2x Fast Ethernet","lines":2,"lineKeys":2,"audio":"HD audio","headset":"RJ9 jack, EHS support","power":"AC adapter included","warranty":"1-year standard"}',
 '["WiFi 802.11 a/b/g/n/ac dual-band","2 SIP lines / 2 line keys","2x Fast Ethernet ports","HD audio quality","RJ9 headset jack with EHS support","GDMS cloud provisioning compatible","Optional wall mount bracket","1-year manufacturer warranty"]',
 true)

ON CONFLICT (id) DO UPDATE SET
  name           = EXCLUDED.name,
  price          = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  on_sale        = EXCLUDED.on_sale,
  stock          = EXCLUDED.stock,
  is_active      = EXCLUDED.is_active,
  short_desc     = EXCLUDED.short_desc,
  specs          = EXCLUDED.specs,
  features       = EXCLUDED.features;
