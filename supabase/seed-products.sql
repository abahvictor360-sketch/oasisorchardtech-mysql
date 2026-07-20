-- ============================================================
-- Oasis Orchard Technologies — Seed Products
-- Run this in: Supabase Dashboard > SQL Editor
-- Safe to run multiple times (uses ON CONFLICT DO UPDATE)
-- ============================================================

INSERT INTO public.products (
  id, name, sku, category, price, original_price, on_sale,
  stock, rating, review_count, image_url, badge, short_desc,
  specs, features, is_active
) VALUES

-- ── Mobile Phones ─────────────────────────────────────────────
(
  'grwp810', 'Grandstream GRWP810', 'WP810', 'mobile',
  140.00, 150.00, true, 12, 4.3, 18,
  '/images/GRWP810.png', 'Sale',
  'Cordless WiFi phone with 1.8" color TFT LCD, 3.5mm headset jack, AC adapter included.',
  '{"display":"1.8 inch color TFT LCD","connectivity":"WiFi","headsetJack":"3.5mm","powerSupply":"AC adapter included","lines":1}',
  '["Cordless WiFi operation","HD voice quality","1.8 inch color TFT LCD display","3.5mm headset jack","AC power adapter included"]',
  true
),
(
  'grwp816', 'Grandstream GRWP816', 'WP816', 'mobile',
  115.00, 120.00, true, 8, 4.5, 24,
  '/images/WP816.png', 'Sale',
  'Cordless WiFi 6 phone with 3-way conferencing, HD audio, 6hr talk-time, 1500mAh battery.',
  '{"display":"Color LCD","connectivity":"WiFi 6","battery":"1500mAh","talkTime":"6 hours","standbyTime":"120 hours","conferencing":"3-way voice","codec":"Opus HD"}',
  '["WiFi 6 connectivity","3-way voice conferencing","Opus HD voice codec","6 hours talk-time","120 hours standby","1500mAh battery"]',
  true
),
(
  'grwp820', 'Grandstream GRWP820', 'WP820', 'mobile',
  240.00, 270.00, true, 5, 4.6, 31,
  '/images/GRWP820.png', 'Sale',
  'wireless phone WiFi 802.11 a/b/g/n, 2 lines, 2.4" TFT LCD, HD audio, Bluetooth, Android 7.0.',
  '{"display":"2.4 inch colour TFT LCD","connectivity":"WiFi 802.11 a/b/g/n","lines":2,"bluetooth":true,"battery":"Li-ion","os":"Android 7.0","audio":"HD audio"}',
  '["2 SIP lines","WiFi 802.11 a/b/g/n","HD audio quality","Bluetooth connectivity","Android 7.0 OS","2.4 inch colour TFT LCD","Li-ion rechargeable battery"]',
  true
),
(
  'grwp822', 'Grandstream GRWP822', 'WP822', 'mobile',
  165.00, 200.00, true, 9, 4.4, 22,
  '/images/GRWP822.png', 'Sale',
  'wireless phone WiFi 802.11 a/b/g/n, 2 lines, 2.4" TFT LCD, HD audio, Bluetooth, Android 7.0.',
  '{"display":"2.4 inch colour TFT LCD","connectivity":"WiFi 802.11 a/b/g/n","lines":2,"bluetooth":true,"battery":"Li-ion","os":"Android 7.0","audio":"HD audio"}',
  '["2 SIP lines","WiFi 802.11 a/b/g/n","HD audio quality","Bluetooth connectivity","Android 7.0 OS","2.4 inch colour TFT LCD","Li-ion rechargeable battery"]',
  true
),
(
  'grwp825', 'Grandstream GRWP825', 'WP825', 'mobile',
  220.00, 270.00, true, 6, 4.7, 19,
  '/images/GRWP825.png', 'Sale',
  'Business wireless phone, 2 lines, 2.4" TFT LCD, HD audio, USB port, 3.5mm jack, Bluetooth, rechargeable.',
  '{"display":"2.4 inch colour TFT LCD","lines":2,"usb":true,"headsetJack":"3.5mm","bluetooth":true,"battery":"Rechargeable Li-ion","audio":"HD audio"}',
  '["2 SIP lines","HD audio quality","USB port","3.5mm headset jack","Integrated Bluetooth","2.4 inch colour TFT LCD","Rechargeable battery"]',
  true
),
(
  'grwp826', 'Grandstream GRWP826', 'WP826', 'mobile',
  150.00, 170.00, true, 14, 4.8, 27,
  '/images/WP826.png', 'Sale',
  'Cordless WiFi 6 phone, 4-way conferencing, 12hr talk-time, 240hr standby, 3000mAh battery.',
  '{"connectivity":"WiFi 6","conferencing":"4-way voice","codec":"Opus HD","talkTime":"12 hours","standbyTime":"240 hours","battery":"3000mAh"}',
  '["WiFi 6 connectivity","4-way voice conferencing","Opus HD voice codec","12 hours talk-time","240 hours standby","3000mAh high-capacity battery"]',
  true
),

-- ── Home / Desk Phones ─────────────────────────────────────────
(
  'grgrp2602w', 'Grandstream GRGRP2602W', 'GRP2602W', 'home-phone',
  80.00, 110.00, true, 20, 4.5, 35,
  '/images/GRGRP2602W.png', 'Sale',
  'Business IP WiFi 802.11 a/b/g/n/ac desktop phone, 2 lines, 2.21" LCD, HD audio, EHS headset support.',
  '{"display":"2.21 inch LCD","connectivity":"WiFi 802.11 a/b/g/n/ac (2.4GHz & 5GHz)","ethernet":"2x Fast Ethernet","lines":2,"lineKeys":2,"audio":"HD audio","headset":"RJ9 jack, EHS support","power":"AC adapter included (no PoE)","provisioning":"Grandstream GDMS cloud","warranty":"1-year standard"}',
  '["WiFi 802.11 a/b/g/n/ac dual-band","2 SIP lines / 2 line keys","2x Fast Ethernet ports","HD audio quality","RJ9 headset jack with EHS support","GDMS cloud provisioning compatible","Optional wall mount bracket","1-year manufacturer warranty"]',
  true
)

ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  sku           = EXCLUDED.sku,
  category      = EXCLUDED.category,
  price         = EXCLUDED.price,
  original_price= EXCLUDED.original_price,
  on_sale       = EXCLUDED.on_sale,
  stock         = EXCLUDED.stock,
  rating        = EXCLUDED.rating,
  review_count  = EXCLUDED.review_count,
  image_url     = EXCLUDED.image_url,
  badge         = EXCLUDED.badge,
  short_desc    = EXCLUDED.short_desc,
  specs         = EXCLUDED.specs,
  features      = EXCLUDED.features,
  is_active     = EXCLUDED.is_active;
