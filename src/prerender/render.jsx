import React from 'react';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import { SiteSettingsProvider } from '../context/SiteSettingsContext';
import { VoipProvider } from '../context/VoipContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import WhatsAppChat from '../components/layout/WhatsAppChat';

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppChat />
    </div>
  );
}

export async function renderRoute({ path, Component, routePattern }) {
  const pattern = routePattern ?? path;
  const helmetContext = {};

  // Force this HelmetProvider instance into SSR mode so it writes tags to
  // helmetContext instead of mutating document.head (undefined in Node).
  const prevCanUseDOM = HelmetProvider.canUseDOM;
  HelmetProvider.canUseDOM = false;

  // react-router's <Link> calls useLayoutEffect, which is a harmless no-op
  // on the server but logs a warning on every single render — filter only
  // that one known-safe message so real errors aren't buried in the noise.
  const prevConsoleError = console.error;
  console.error = (...args) => {
    const first = typeof args[0] === 'string' ? args[0] : '';
    if (first.includes('useLayoutEffect does nothing on the server')) return;
    prevConsoleError(...args);
  };

  try {
    const bodyHtml = renderToString(
      <HelmetProvider context={helmetContext}>
        <AppProvider>
          <SiteSettingsProvider>
            <VoipProvider>
              <MemoryRouter initialEntries={[path]}>
                <Routes>
                  <Route
                    path={pattern}
                    element={<PublicLayout><Component /></PublicLayout>}
                  />
                </Routes>
              </MemoryRouter>
            </VoipProvider>
          </SiteSettingsProvider>
        </AppProvider>
      </HelmetProvider>
    );

    const h = helmetContext.helmet;
    const headHtml = h
      ? [h.title.toString(), h.meta.toString(), h.link.toString(), h.script.toString()].join('\n')
      : '';
    return { bodyHtml, headHtml };
  } finally {
    HelmetProvider.canUseDOM = prevCanUseDOM;
    console.error = prevConsoleError;
  }
}

// Strip the shell's default head tags before injecting per-route ones, so
// the final static HTML never has duplicate <title>/description/og/JSON-LD.
const DEFAULT_HEAD_PATTERNS = [
  /<title>[^<]*<\/title>/i,
  /<meta\s+name="description"[^>]*>/i,
  /<link\s+rel="canonical"[^>]*>/i,
  /<meta\s+property="og:[^"]*"[^>]*>/gi,
  /<meta\s+name="twitter:[^"]*"[^>]*>/gi,
];

export function injectIntoTemplate(template, { headHtml, bodyHtml }) {
  let html = template;
  for (const re of DEFAULT_HEAD_PATTERNS) html = html.replace(re, '');
  html = html.replace('</head>', `${headHtml}\n</head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
  return html;
}
