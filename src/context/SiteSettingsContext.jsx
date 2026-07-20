import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { content as contentApi } from '../lib/api';

// ── Defaults ──────────────────────────────────────────────────
export const DEFAULT_BRAND = {
  siteName: 'Oasis Orchard',
  tagline: 'Crystal-Clear Calls. Unbeatable Price.',
  logoType: 'icon',   // 'icon' | 'image'
  logoUrl: '',
  logoIcon: 'wifi',   // 'wifi' | 'phone'
  faviconUrl: '',     // browser tab icon; falls back to logoUrl, then /favicon.svg
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
    address: '61 Rue Bastarache\nDieppe NB E1A 6Y6, Canada',
  },
  copyright: 'Oasis Orchard Technologies. All rights reserved.',
  payments: ['Visa', 'MC', 'Amex', 'Stripe'],
};

// ── Context ───────────────────────────────────────────────────
const SiteSettingsContext = createContext(null);

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
    // One batched request instead of three round trips
    try {
      const { data } = await contentApi.getMany(['site_brand', 'site_nav', 'site_footer']);
      setBrand(data?.site_brand   ?? DEFAULT_BRAND);
      setNav(data?.site_nav       ?? DEFAULT_NAV);
      setFooter(data?.site_footer ?? DEFAULT_FOOTER);
    } catch {
      setBrand(DEFAULT_BRAND);
      setNav(DEFAULT_NAV);
      setFooter(DEFAULT_FOOTER);
    }
    setLoaded(true);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Keep the browser tab icon in sync with brand settings
  useEffect(() => {
    const href = brand.faviconUrl || brand.logoUrl || '/favicon.svg';
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = href.endsWith('.svg') ? 'image/svg+xml' : '';
    link.href = href;
  }, [brand.faviconUrl, brand.logoUrl]);

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
