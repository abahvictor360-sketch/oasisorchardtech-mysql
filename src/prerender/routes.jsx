// Prerender route manifest — the single source of truth for which public
// routes get build-time static HTML. Kept in sync with public/sitemap.xml
// by hand; both list the same public, indexable URLs.
//
// Imports here are EAGER (not React.lazy like App.jsx uses for code-splitting)
// because renderToString cannot resolve Suspense boundaries synchronously.
import Home from '../pages/public/Home';
import About from '../pages/public/About';
import Services from '../pages/public/Services';
import Pricing from '../pages/public/Pricing';
import Support from '../pages/public/Support';
import Terms from '../pages/public/Terms';
import Privacy from '../pages/public/Privacy';
import ShopPage from '../pages/shop/ShopPage';
import ProductDetail from '../pages/shop/ProductDetail';
import { products } from '../data/products';
import staticRoutes from './staticRoutes.json';

const COMPONENT_BY_PATH = {
  '/':         Home,
  '/about':    About,
  '/services': Services,
  '/pricing':  Pricing,
  '/support':  Support,
  '/terms':    Terms,
  '/privacy':  Privacy,
  '/shop':     ShopPage,
};

const staticPrerenderRoutes = staticRoutes
  .map((r) => ({ path: r.path, Component: COMPONENT_BY_PATH[r.path] }))
  .filter((r) => r.Component);

export const prerenderRoutes = [
  ...staticPrerenderRoutes,
  {
    // Product data is bundled statically (src/data/products.js), not fetched
    // from the API, so every product page can be fully prerendered with
    // zero network dependency at build time.
    path: '/shop/:productId',
    Component: ProductDetail,
    getData: async () => products.map((p) => ({ slug: p.id })),
  },
];
