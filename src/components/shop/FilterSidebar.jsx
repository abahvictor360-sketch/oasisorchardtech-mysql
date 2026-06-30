import { X, RotateCcw } from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'All Products' },
  { value: 'home-phone', label: 'Home Phone' },
  { value: 'mobile', label: 'Mobile' },
];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Best Rated' },
  { value: 'reviews', label: 'Most Reviews' },
];

export default function FilterSidebar({
  filters,
  onFilterChange,
  onSortChange,
  sort,
  onReset,
  isDrawer = false,
  onClose,
}) {
  const handleCategory = (value) => {
    onFilterChange({ ...filters, category: value });
  };

  const handlePriceMin = (e) => {
    const val = Number(e.target.value);
    onFilterChange({ ...filters, priceMin: isNaN(val) ? 0 : val });
  };

  const handlePriceMax = (e) => {
    const val = Number(e.target.value);
    onFilterChange({ ...filters, priceMax: isNaN(val) ? 500 : val });
  };

  const handleOnSale = (e) => {
    onFilterChange({ ...filters, onSale: e.target.checked });
  };

  const content = (
    <div className="flex flex-col gap-6">
      {/* Header for drawer mode */}
      {isDrawer && (
        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
          <h2 className="text-lg font-bold text-[#0a1628]">Filters</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150"
            aria-label="Close filters"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Sort */}
      <div>
        <label className="block text-sm font-semibold text-[#0a1628] mb-2">Sort By</label>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#1bb0ce] focus:ring-1 focus:ring-[#1bb0ce] bg-white"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <p className="text-sm font-semibold text-[#0a1628] mb-3">Category</p>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => (
            <label key={cat.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="category"
                value={cat.value}
                checked={filters.category === cat.value}
                onChange={() => handleCategory(cat.value)}
                className="w-4 h-4 accent-[#1bb0ce] cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-[#1bb0ce] transition-colors duration-150">
                {cat.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <p className="text-sm font-semibold text-[#0a1628] mb-3">Price Range</p>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Min ($)</label>
            <input
              type="number"
              min={0}
              max={filters.priceMax ?? 500}
              value={filters.priceMin ?? 0}
              onChange={handlePriceMin}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1bb0ce] focus:ring-1 focus:ring-[#1bb0ce]"
              placeholder="0"
            />
          </div>
          <span className="text-gray-400 mt-4">–</span>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Max ($)</label>
            <input
              type="number"
              min={filters.priceMin ?? 0}
              value={filters.priceMax ?? 500}
              onChange={handlePriceMax}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1bb0ce] focus:ring-1 focus:ring-[#1bb0ce]"
              placeholder="500"
            />
          </div>
        </div>
      </div>

      {/* On Sale toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#0a1628]">On Sale Only</span>
        <button
          role="switch"
          aria-checked={!!filters.onSale}
          onClick={() => onFilterChange({ ...filters, onSale: !filters.onSale })}
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none',
            filters.onSale ? 'bg-[#1bb0ce]' : 'bg-gray-200',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
              filters.onSale ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')}
          />
        </button>
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-600 hover:text-[#1bb0ce] hover:border-[#1bb0ce] text-sm font-medium py-2.5 rounded-lg transition-colors duration-150"
      >
        <RotateCcw size={14} />
        Reset Filters
      </button>
    </div>
  );

  if (isDrawer) {
    return (
      <div className="h-full overflow-y-auto p-5">
        {content}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-base font-bold text-[#0a1628] mb-5">Filters</h2>
      {content}
    </div>
  );
}
