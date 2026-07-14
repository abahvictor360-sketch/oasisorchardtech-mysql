import { useState, useEffect, useCallback } from 'react';
import { content as contentApi } from '../lib/api';

export const DEFAULT_LAYOUT = [
  { key: 'hero',         label: 'Hero Banner',      visible: true, type: 'builtin' },
  { key: 'stats',        label: 'Stats Bar',         visible: true, type: 'builtin' },
  { key: 'plans',        label: 'Plans Preview',     visible: true, type: 'builtin' },
  { key: 'products',     label: 'Featured Products', visible: true, type: 'builtin' },
  { key: 'why',          label: 'Why Choose Us',     visible: true, type: 'builtin' },
  { key: 'how',          label: 'How It Works',      visible: true, type: 'builtin' },
  { key: 'testimonials', label: 'Testimonials',      visible: true, type: 'builtin' },
  { key: 'cta',          label: 'CTA Banner',        visible: true, type: 'builtin' },
];

export async function saveHomeLayout(layout) {
  const { error } = await contentApi.save('home_layout', layout);
  if (error) throw new Error(error.message);
}

export function useHomeLayout() {
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  // On the server (prerendering) effects never run, so `loading` would stay
  // true forever and the page would render only the spinner. Trust the
  // (real, sensible) DEFAULT_LAYOUT immediately in that environment; the
  // browser still shows the brief loading state as before.
  const [loading, setLoading] = useState(typeof window !== 'undefined');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await contentApi.get('home_layout');
      if (data?.length) setLayout(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { layout, loading, reload: load };
}
