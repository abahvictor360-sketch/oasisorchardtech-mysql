import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { content as contentApi } from '../lib/api';

// ── Defaults ──────────────────────────────────────────────────
export const DEFAULT_BRAND = {
  siteName: 'Oasis Orchard',
  tagline: 'Crystal-Clear Calls. Unbeatable Price.',
  logoType: 'icon',   // 'icon' | 'image'
  logoUrl: '',
  logoIcon: 'wifi',   // 'wifi' | 'phone'
};

export const DEFAULT_NAV = [
  { label: 'Home',     to: '/' },
  { label: 'About',    to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Pricing',  to: '/pricing' },
  { label: 'Shop',     to: '/shop' },
  { label: 'Support',  to: '/support' },
];

export const DEFAULT_FOOTER = {
  description: 'Your trusted authorized wireless phone reseller. Connecting businesses with crystal-clear communication solutions.',
  socials: [
    { letter: 'f',  href: '#', label: 'Facebook' },
    { letter: 'X',  href: '#', label: 'Twitter / X' },
    { letter: 'in', href: '#', label: 'LinkedIn' },
    { letter: '▶',  href: '#', label: 'YouTube' },
  ],
  columns: [
    {
      title: 'Quick Links',
      links: [
        { label: 'Home',           to: '/' },
        { label: 'About',          to: '/about' },
        { label: 'Services',       to: '/services' },
        { label: 'Pricing',        to: '/pricing' },
        { label: 'Shop',           to: '/shop' },
        { label: 'Support',        to: '/support' },
        { label: 'Privacy Policy', to: '/privacy' },
        { label: 'Terms of Service', to: '/terms' },
      ],
    },
    {
      title: 'Our Services',
      links: [
        { label: 'Basic Connect',    to: '/services#basic' },
        { label: 'Smart Connect',    to: '/services#smart' },
        { label: 'Business Connect', to: '/services#business' },
      ],
    },
  ],
  contact: {
    phone: '+1 (902) 593-4442',
    email: 'support@oasisorchard.com',
    address: '1505 Barrington Street, Suite 200\nHalifax, NS B3J 3K5, Canada',
  },
  copyright: 'Oasis Orchard Technologies. All rights reserved.',
  payments: ['Visa', 'MC', 'Amex', 'PayPal'],
};

// ── Context ───────────────────────────────────────────────────
const SiteSettingsContext = createContext(null);

async function fetchKey(key, fallback) {
  try {
    const { data } = await contentApi.get(key);
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function saveKey(key, value) {
  const { error } = await contentApi.save(key, value);
  if (error) throw new Error(error.message);
}

export function SiteSettingsProvider({ children }) {
  const [brand, setBrand]   = useState(DEFAULT_BRAND);
  const [nav, setNav]       = useState(DEFAULT_NAV);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const [b, n, f] = await Promise.all([
      fetchKey('site_brand',  DEFAULT_BRAND),
      fetchKey('site_nav',    DEFAULT_NAV),
      fetchKey('site_footer', DEFAULT_FOOTER),
    ]);
    setBrand(b);
    setNav(n);
    setFooter(f);
    setLoaded(true);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return (
    <SiteSettingsContext.Provider value={{ brand, nav, footer, loaded, reload }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettings must be inside SiteSettingsProvider');
  return ctx;
}
