#!/usr/bin/env node
// scripts/prerender.mjs — run AFTER `vite build`. Reads dist/index.html as
// the template and writes a fully server-rendered dist/<route>/index.html
// for every public route in src/prerender/routes.jsx, so crawlers (and
// non-JS link-preview bots) see real content and per-route meta tags
// instead of the empty <div id="root"></div> shell.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const TEMPLATE_PATH = path.join(DIST, 'index.html');

async function main() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('✖ dist/index.html not found — run `vite build` first.');
    process.exit(1);
  }
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  // Preserve the original generic shell BEFORE index.html gets overwritten
  // with the real prerendered homepage below. Every route that is NOT in
  // the prerender manifest (cart, checkout, dashboard, admin, login, …)
  // falls back to this file via .htaccess — it must stay the neutral SPA
  // shell, never homepage-specific content/title.
  fs.writeFileSync(path.join(DIST, 'app-shell.html'), template, 'utf8');

  // Middleware-mode server only to transform + SSR-load the prerender
  // modules (so relative imports, JSX, and CSS-side-effect imports all
  // resolve the same way they do in the real app). hmr:false + watch:null
  // stop the file watcher / HMR socket from keeping the Node process alive.
  const vite = await createServer({
    root: ROOT,
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true },
    appType: 'custom',
    logLevel: 'warn',
  });

  try {
    const { prerenderRoutes } = await vite.ssrLoadModule('/src/prerender/routes.jsx');
    const { renderRoute, injectIntoTemplate } = await vite.ssrLoadModule('/src/prerender/render.jsx');

    let written = 0;
    for (const route of prerenderRoutes) {
      try {
        if (route.path.includes(':')) {
          const items = route.getData ? await route.getData() : [];
          for (const item of items) {
            const routePath = route.path.replace(':productId', item.slug);
            const { bodyHtml, headHtml } = await renderRoute({
              path: routePath,
              Component: route.Component,
              routePattern: route.path,
            });
            writeRoute(injectIntoTemplate(template, { headHtml, bodyHtml }), routePath);
            written++;
          }
        } else {
          const { bodyHtml, headHtml } = await renderRoute({
            path: route.path,
            Component: route.Component,
          });
          writeRoute(injectIntoTemplate(template, { headHtml, bodyHtml }), route.path);
          written++;
        }
      } catch (err) {
        // Log and move on — the client-side SPA fallback still serves this
        // route correctly, it just won't have prerendered HTML.
        console.warn(`⚠ prerender skipped ${route.path}: ${err.message}`);
      }
    }
    console.log(`✔ prerendered ${written} route(s)`);
  } finally {
    await vite.close();
  }
}

function writeRoute(html, routePath) {
  const rel = routePath === '/'
    ? 'index.html'
    : path.join(routePath.replace(/^\//, ''), 'index.html');
  const outPath = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
}

main()
  .then(() => process.exit(0)) // force clean exit; leftover esbuild/worker handles can otherwise hang the build
  .catch((err) => { console.error('✖ prerender failed:', err); process.exit(1); });
