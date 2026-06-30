import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, Home, ChevronRight, Smartphone, PhoneCall, Monitor } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { usePageSection } from '../../hooks/usePageSection';
import ProductGrid from '../../components/shop/ProductGrid';
import FilterSidebar from '../../components/shop/FilterSidebar';
import QuickViewModal from '../../components/shop/QuickViewModal';

const ICON_MAP = { PhoneCall, Smartphone, Monitor };

const DEFAULT_TABS = [
  { key: 'all',        label: 'All Phones', icon: 'PhoneCall' },
  { key: 'mobile',     label: 'Mobile',     icon: 'Smartphone' },
  { key: 'home-phone', label: 'Home Phone', icon: 'PhoneCall' },
];

const DEFAULT_FILTERS = { priceMin: 0, priceMax: 300, onSale: false };

function applyFilters(list, filters) {
  return list.filter(p => {
    if (p.price < filters.priceMin) return false;
    if (p.price > filters.priceMax) return false;
    if (filters.onSale && !p.onSale) return false;
    return true;
  });
}

function applySort(list, sort) {
  const s = [...list];
  switch (sort) {
    case 'price-asc':  return s.sort((a, b) => a.price - b.price);
    case 'price-desc': return s.sort((a, b) => b.price - a.price);
    case 'rating':     return s.sort((a, b) => b.rating - a.rating);
    case 'reviews':    return s.sort((a, b) => b.reviews - a.reviews);
    default:           return s;
  }
}

export default function ShopPage() {
  const { products, loading } = useProducts();
  const { data: categoryTabs } = usePageSection('shop_tabs', DEFAULT_TABS);

  const [activeTab, setActiveTab]     = useState('all');
  const [filters, setFilters]         = useState(DEFAULT_FILTERS);
  const [sort, setSort]               = useState('featured');
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const tabCounts = useMemo(() => {
    const counts = { all: products.length };
    categoryTabs.filter(t => t.key !== 'all').forEach(t => {
      counts[t.key] = products.filter(p => p.category === t.key).length;
    });
    return counts;
  }, [products, categoryTabs]);

  const tabFiltered     = useMemo(() =>
    activeTab === 'all' ? products : products.filter(p => p.category === activeTab),
    [products, activeTab]
  );
  const sidebarFiltered = useMemo(() => applyFilters(tabFiltered, filters), [tabFiltered, filters]);
  const displayed       = useMemo(() => applySort(sidebarFiltered, sort), [sidebarFiltered, sort]);

  const handleReset = () => { setFilters(DEFAULT_FILTERS); setSort('featured'); };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Banner */}
      <div className="bg-[#0a1628] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
            <Link to="/" className="hover:text-[#1bb0ce] flex items-center gap-1 transition-colors">
              <Home size={14} /><span>Home</span>
            </Link>
            <ChevronRight size={14} className="text-gray-600" />
            <span className="text-white font-medium">Shop</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Shop Wireless Phones</h1>
          <p className="text-gray-400 text-base max-w-xl">
            Explore our full range of Grandstream wireless phones — crystal-clear HD audio,
            easy setup, and built to scale with your business.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide justify-center">
            {categoryTabs.map(tab => {
              const Icon = ICON_MAP[tab.icon] || PhoneCall;
              const count = tabCounts[tab.key] ?? 0;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    'flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 focus:outline-none flex-shrink-0',
                    isActive
                      ? 'bg-[#1bb0ce] text-white shadow-lg shadow-[#1bb0ce]/30'
                      : 'bg-transparent text-[#1bb0ce] border border-[#1bb0ce] hover:bg-[#1bb0ce]/10',
                  ].join(' ')}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                  <span className={[
                    'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                    isActive ? 'bg-white/20 text-white' : 'bg-[#1bb0ce]/10 text-[#1bb0ce]',
                  ].join(' ')}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Mobile: filter button + count */}
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-[#0a1628]">{displayed.length}</span> of{' '}
            <span className="font-semibold text-[#0a1628]">{tabFiltered.length}</span> products
          </p>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-[#0a1628] text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm hover:border-[#1bb0ce] hover:text-[#1bb0ce] transition-colors"
          >
            <SlidersHorizontal size={16} />Filters
          </button>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar
              filters={filters}
              onFilterChange={setFilters}
              sort={sort}
              onSortChange={setSort}
              onReset={handleReset}
            />
          </aside>

          {/* Product area */}
          <div className="flex-1 min-w-0">
            <div className="hidden lg:flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-[#0a1628]">{displayed.length}</span> of{' '}
                <span className="font-semibold text-[#0a1628]">{tabFiltered.length}</span> products
                {activeTab !== 'all' && (
                  <span className="ml-1 text-[#1bb0ce] font-medium">
                    in {categoryTabs.find(t => t.key === activeTab)?.label}
                  </span>
                )}
              </p>
            </div>

            <ProductGrid
              products={displayed}
              loading={loading}
              onQuickView={setQuickViewProduct}
            />
          </div>
        </div>
      </div>

      {/* Mobile filter drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setDrawerOpen(false)} />
      )}
      <div className={[
        'fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden',
        drawerOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')} role="dialog" aria-modal="true">
        <FilterSidebar
          filters={filters}
          onFilterChange={setFilters}
          sort={sort}
          onSortChange={setSort}
          onReset={handleReset}
          isDrawer
          onClose={() => setDrawerOpen(false)}
        />
      </div>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
